#!/usr/bin/env bash
#
# The only command the CI key can run.
#
# authorized_keys entry:
#   command="/usr/local/bin/deploy.sh",no-pty,no-agent-forwarding,\
#   no-port-forwarding,no-X11-forwarding,no-user-rc ssh-ed25519 AAAA... ci
#
# SSH puts the client's requested command in SSH_ORIGINAL_COMMAND and runs this
# instead, so CI can pass arguments but can never get a shell.
#
#   deploy.sh <tag> <sha256:digest>
#   deploy.sh --rollback
set -euo pipefail

STACK_DIR=/srv/deenquest/deploy
STATE_DIR=/var/lib/deenquest
SECRETS_ENC="$STACK_DIR/secrets/prod.enc.env"
SECRETS_RUNTIME=/run/deenquest/prod.env
AGE_KEY=/etc/deenquest/age.key
COMPOSE="docker compose -f $STACK_DIR/compose.prod.yml --env-file $SECRETS_RUNTIME"

GHCR_OWNER="${GHCR_OWNER:-m-awais-rasool}"
IMAGE="ghcr.io/${GHCR_OWNER}/deenquest-api"
IDENTITY_RE="^https://github.com/M-awais-rasool/DeenQuest/.github/workflows/build.yml@refs/"
OIDC_ISSUER="https://token.actions.githubusercontent.com"

log()  { logger -t deenquest-deploy "$*"; echo "[deploy] $*"; }
fail() { log "FAILED: $*"; exit 1; }

# Arguments come from SSH_ORIGINAL_COMMAND under the forced command, or from the
# command line when an operator runs this by hand.
if [[ -n "${SSH_ORIGINAL_COMMAND:-}" ]]; then
	# shellcheck disable=SC2086
	set -- $SSH_ORIGINAL_COMMAND
fi

current_colour() { cat "$STATE_DIR/colour" 2>/dev/null || echo blue; }
other_colour()   { [[ "$1" == blue ]] && echo green || echo blue; }

switch_traffic() {
	local colour="$1"
	cat > "$STACK_DIR/caddy/active.conf" <<-CADDY
	reverse_proxy api-${colour}:8080 {
		health_uri /health/ready
		health_interval 10s
		health_timeout 3s
		lb_try_duration 5s
	}
	CADDY
	$COMPOSE exec -T caddy caddy reload --config /etc/caddy/Caddyfile
}

decrypt_secrets() {
	install -d -m 0700 /run/deenquest
	SOPS_AGE_KEY_FILE="$AGE_KEY" sops -d "$SECRETS_ENC" > "$SECRETS_RUNTIME"
	chmod 0400 "$SECRETS_RUNTIME"
}

# ── rollback ──────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--rollback" ]]; then
	CURRENT=$(current_colour)
	PREVIOUS=$(other_colour "$CURRENT")
	if ! $COMPOSE ps --status running --format '{{.Service}}' | grep -qx "api-$PREVIOUS"; then
		fail "no previous colour running — redeploy the previous digest instead"
	fi
	switch_traffic "$PREVIOUS"
	echo "$PREVIOUS" > "$STATE_DIR/colour"
	log "rolled back to $PREVIOUS"
	exit 0
fi

TAG="${1:?usage: deploy.sh <tag> <sha256:digest>}"
DIGEST="${2:?usage: deploy.sh <tag> <sha256:digest>}"
[[ "$DIGEST" == sha256:* ]] || fail "digest must be a sha256: reference, not a tag"

# ── 1. the image must be one this repository built ────────────────────────────
# A tag can be repointed by anyone who can push. A digest cannot, and cosign
# binds this digest to the workflow identity that produced it.
log "verifying signature for ${IMAGE}@${DIGEST}"
cosign verify \
	--certificate-identity-regexp "$IDENTITY_RE" \
	--certificate-oidc-issuer "$OIDC_ISSUER" \
	"${IMAGE}@${DIGEST}" > /dev/null 2>&1 \
	|| fail "signature verification failed — refusing to run this image"

# ── 2. bring up the idle colour ───────────────────────────────────────────────
CURRENT=$(current_colour)
IDLE=$(other_colour "$CURRENT")
log "deploying $TAG to $IDLE (currently serving: $CURRENT)"

decrypt_secrets
export API_DIGEST="$DIGEST" GHCR_OWNER

$COMPOSE --profile "$IDLE" pull "api-$IDLE"
$COMPOSE --profile "$IDLE" up -d "api-$IDLE"

# ── 3. readiness gate ─────────────────────────────────────────────────────────
# Config validation, MongoDB connectivity and startup seeding all happen before
# readiness passes, so a bad config or a broken seed becomes a failed deploy
# rather than a live outage.
log "waiting for $IDLE to become ready"
ready=0
for _ in $(seq 1 30); do
	if $COMPOSE exec -T "api-$IDLE" /app/healthcheck --ready 2>/dev/null; then
		ready=1
		break
	fi
	sleep 2
done

if [[ "$ready" -ne 1 ]]; then
	log "$IDLE never became ready; leaving $CURRENT in place"
	$COMPOSE --profile "$IDLE" logs --tail=50 "api-$IDLE" || true
	$COMPOSE --profile "$IDLE" stop "api-$IDLE" || true
	fail "readiness gate"
fi

# ── 4. switch, then prove it from the outside ─────────────────────────────────
switch_traffic "$IDLE"
log "traffic switched to $IDLE; running smoke tests"

if ! /usr/local/bin/smoke.sh; then
	log "smoke tests failed — rolling back to $CURRENT"
	switch_traffic "$CURRENT"
	fail "smoke tests"
fi

echo "$IDLE" > "$STATE_DIR/colour"
log "deployed tag=$TAG digest=$DIGEST colour=$IDLE previous=$CURRENT result=ok"

# ── 5. keep the old colour warm for a fast rollback ───────────────────────────
# Most bad deploys announce themselves within a minute or two. For that window,
# recovery is one file write.
( sleep 300; $COMPOSE --profile "$CURRENT" stop "api-$CURRENT" >/dev/null 2>&1 || true ) &
disown
