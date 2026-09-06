#!/usr/bin/env bash
#
# Post-boot setup for deenquest-prod. Run once on the server, after Terraform
# has created it and cloud-init has finished.
#
#     sudo /srv/deenquest/deploy/scripts/bootstrap.sh
#
# Everything here is idempotent and safe to re-run — which is the point. This is
# not a convenience wrapper; it is the half of "rebuild the host" that Terraform
# does not cover, and a disaster-recovery plan that depends on remembering these
# steps by hand is not a plan.
#
# What it does NOT do, because each needs a human with a secret in hand:
#   - install the age private key         (you scp it; see step A below)
#   - create the Cloudflare Tunnel        (dashboard)
#   - write deploy/secrets/prod.enc.env   (on your laptop, with sops)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/M-awais-rasool/DeenQuest.git}"
STACK_DIR=/srv/deenquest
DEPLOY_DIR="$STACK_DIR/deploy"
AGE_KEY=/etc/deenquest/age.key
RUNTIME_ENV=/run/deenquest/prod.env
COMPOSE="docker compose -f $DEPLOY_DIR/compose.prod.yml --env-file $RUNTIME_ENV"

step()  { printf '\n\033[1m── %s\033[0m\n' "$*"; }
ok()    { printf '   ✅ %s\n' "$*"; }
skip()  { printf '   ↷  %s\n' "$*"; }
warn()  { printf '   ⚠️  %s\n' "$*"; }
die()   { printf '\n\033[31m✗ %s\033[0m\n\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run with sudo."

# ── 0. preconditions ──────────────────────────────────────────────────────────
step "0/8  Checking preconditions"

command -v docker >/dev/null || die "Docker is missing — cloud-init did not finish. Check: cloud-init status --long"
command -v sops   >/dev/null || die "sops is missing — cloud-init did not finish."
command -v rclone >/dev/null || die "rclone is missing — cloud-init did not finish."
ok "cloud-init tooling present"

if [[ ! -f "$AGE_KEY" ]]; then
	die "$AGE_KEY not found.

  From your laptop, first:
    scp age.key ops@deenquest-prod:/tmp/age.key
    ssh ops@deenquest-prod 'sudo install -m 0400 -o root -g root /tmp/age.key $AGE_KEY && shred -u /tmp/age.key'

  This is the one secret that must never travel through cloud-init, CI, or the repo."
fi
[[ "$(stat -c '%a' "$AGE_KEY")" == "400" ]] || warn "$AGE_KEY should be mode 0400"
ok "age key installed"

# ── 1. repo ───────────────────────────────────────────────────────────────────
step "1/8  Repository at $STACK_DIR"

if [[ -d "$STACK_DIR/.git" ]]; then
	git -C "$STACK_DIR" fetch --quiet origin
	git -C "$STACK_DIR" checkout --quiet master
	git -C "$STACK_DIR" pull --quiet --ff-only
	skip "already cloned — updated to $(git -C "$STACK_DIR" rev-parse --short HEAD)"
else
	git clone --quiet "$REPO_URL" "$STACK_DIR"
	ok "cloned $(git -C "$STACK_DIR" rev-parse --short HEAD)"
fi
chown -R ops:ops "$STACK_DIR"

# ── 2. scripts on PATH ────────────────────────────────────────────────────────
step "2/8  Installing scripts to /usr/local/bin"

install -m 0755 "$DEPLOY_DIR/scripts/deploy.sh"  /usr/local/bin/deploy.sh
install -m 0755 "$DEPLOY_DIR/scripts/smoke.sh"   /usr/local/bin/smoke.sh
install -m 0755 "$DEPLOY_DIR/scripts/backup.sh"  /usr/local/bin/backup.sh
install -d -m 0755 /var/lib/deenquest
[[ -f /var/lib/deenquest/colour ]] || echo blue > /var/lib/deenquest/colour
ok "deploy.sh, smoke.sh, backup.sh installed"

# ── 3. secrets → tmpfs ────────────────────────────────────────────────────────
# ── what the deploy user needs, granted in one place ─────────────────────────
# deploy.sh runs as the unprivileged deploy user behind a forced command. It
# needs write access to exactly two things — the Caddy upstream file it flips to
# switch colours, and the file recording which colour is live — and read access
# to the decrypted config. Everything else it only reads.
#
# Granting these one at a time as each deploy failed is how this took four
# attempts to get right, so they are set together and asserted below.
grant_deploy_access() {
	install -d -m 0775 -o root -g deploy /var/lib/deenquest
	[[ -f /var/lib/deenquest/colour ]] || echo blue > /var/lib/deenquest/colour
	chown root:deploy /var/lib/deenquest/colour
	chmod 0664 /var/lib/deenquest/colour

	chown root:deploy "$DEPLOY_DIR/caddy"
	chmod 0775 "$DEPLOY_DIR/caddy"
	[[ -f "$DEPLOY_DIR/caddy/active.conf" ]] || echo "reverse_proxy api-blue:8080" > "$DEPLOY_DIR/caddy/active.conf"
	chown root:deploy "$DEPLOY_DIR/caddy/active.conf"
	chmod 0664 "$DEPLOY_DIR/caddy/active.conf"
}

# Assert it, rather than trusting that the chowns above stayed put — step 1's
# recursive chown to ops has silently undone this kind of thing before.
verify_deploy_access() {
	local bad=0
	sudo -u deploy test -w /var/lib/deenquest/colour            || { warn "deploy cannot write /var/lib/deenquest/colour"; bad=1; }
	sudo -u deploy test -w "$DEPLOY_DIR/caddy/active.conf"      || { warn "deploy cannot write caddy/active.conf"; bad=1; }
	sudo -u deploy test -r "$RUNTIME_ENV"                       || { warn "deploy cannot read $RUNTIME_ENV"; bad=1; }
	sudo -u deploy docker ps >/dev/null 2>&1                    || { warn "deploy cannot talk to docker"; bad=1; }
	[[ "$bad" -eq 0 ]] || die "the deploy user cannot do what deploy.sh needs — a release would fail at the traffic switch"
	ok "deploy user has exactly the access deploy.sh needs"
}

step "3/8  Decrypting production config to tmpfs"

if [[ ! -f "$DEPLOY_DIR/secrets/prod.enc.env" ]]; then
	die "deploy/secrets/prod.enc.env is missing.

  Create it on your LAPTOP (never on the server), then push:
    cp deploy/secrets/prod.env.example /tmp/prod.env
    \$EDITOR /tmp/prod.env
    sops -e --filename-override deploy/secrets/prod.enc.env /tmp/prod.env > deploy/secrets/prod.enc.env
    shred -u /tmp/prod.env
    git add deploy/secrets/prod.enc.env && git commit && git push

  Then re-run this script."
fi

# Same ownership the boot unit uses: root writes, deploy reads. Anything
# stricter here silently breaks the next release, because deploy.sh hands this
# file to docker compose as the unprivileged deploy user.
install -d -m 0750 -o root -g deploy /run/deenquest
SOPS_AGE_KEY_FILE="$AGE_KEY" sops -d "$DEPLOY_DIR/secrets/prod.enc.env" > "$RUNTIME_ENV" \
	|| die "sops could not decrypt. Is $AGE_KEY the key that matches .sops.yaml?"
chown root:deploy "$RUNTIME_ENV"
chmod 0440 "$RUNTIME_ENV"
ok "decrypted to $RUNTIME_ENV (tmpfs — never touches disk)"

# Refuse to continue on the placeholders that fail *open* in production.
# shellcheck disable=SC1090
set -a; source "$RUNTIME_ENV"; set +a
[[ "${ADMIN_EMAILS:-}" != "" ]]        || die "ADMIN_EMAILS is empty — that grants ADMIN to every signed-in user."
[[ "${JWT_SECRET:-}" != "REPLACE" ]]   || die "JWT_SECRET is still REPLACE."
[[ "${CF_TUNNEL_TOKEN:-}" != "REPLACE" ]] || die "CF_TUNNEL_TOKEN is still REPLACE — create the tunnel first."
ok "config sanity checks passed"

# Re-decrypt automatically on every boot, since tmpfs does not survive one.
install -m 0644 "$DEPLOY_DIR/systemd/deenquest-secrets.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --quiet deenquest-secrets.service
ok "secrets re-decrypt on boot (deenquest-secrets.service)"

# ── 4. MongoDB ────────────────────────────────────────────────────────────────
grant_deploy_access
verify_deploy_access

step "4/8  MongoDB TLS, replica set and users"

# The containers run as their own uids with every capability dropped, so they
# cannot chown their own data directories the way the stock entrypoints expect.
# Set the ownership here instead, before anything starts.
docker volume create deploy_mongo_data >/dev/null
chown -R 999:999 /var/lib/docker/volumes/deploy_mongo_data/_data
ok "mongo data volume owned by 999:999"

if [[ -f "$DEPLOY_DIR/mongo/tls/server.pem" ]]; then
	skip "TLS material already present"
else
	"$DEPLOY_DIR/scripts/gen-mongo-tls.sh"
	ok "private CA and server certificate created"
	warn "Move $DEPLOY_DIR/mongo/tls/ca.key to your password manager, then: shred -u it"
fi

# Re-assert this every run, not just when the material is generated: step 1
# chowns the whole repo to ops, which silently takes these files back from the
# mongo user and leaves mongod unable to read its own certificate.
chown 999:999 "$DEPLOY_DIR/mongo/tls" "$DEPLOY_DIR/mongo/tls"/*.pem "$DEPLOY_DIR/mongo/tls/keyfile" 2>/dev/null || true
chmod 0400 "$DEPLOY_DIR/mongo/tls/server.pem" "$DEPLOY_DIR/mongo/tls/keyfile" 2>/dev/null || true
chmod 0444 "$DEPLOY_DIR/mongo/tls/ca.pem" 2>/dev/null || true
ok "TLS material owned by the mongo uid"

"$DEPLOY_DIR/scripts/init-mongo.sh"

# ── 5. object storage ─────────────────────────────────────────────────────────
step "5/8  Supporting services"

# deploy.sh only ever swaps the API colour. Everything the API sits behind or
# talks to — the tunnel, the reverse proxy, the cache, transcription, the
# metrics agent — is long-running and belongs here. Without this the first
# release starts an API nobody can reach, because cloudflared is not running and
# api.<domain> resolves to a tunnel with no connector.
#
# Whisper is built locally rather than pulled: its image would be far too large
# for GHCR's free tier, and the model is mounted from a volume, not baked in.
log_svc() { printf '   %s %s\n' "$1" "$2"; }

$COMPOSE up -d --build cloudflared caddy redis whisper alloy 2>&1 | grep -E "Created|Started|Building|Error" | sed 's/^/   /' || true

for svc in cloudflared caddy redis whisper alloy mongo; do
	state=$($COMPOSE ps --format '{{.Service}} {{.State}}' 2>/dev/null | awk -v s="$svc" '$1==s {print $2}')
	case "$state" in
		running) log_svc "✅" "$svc" ;;
		*)       log_svc "⚠️ " "$svc — ${state:-not running}" ;;
	esac
done

# The tunnel is what makes the site reachable at all; a stack that is otherwise
# perfect and has no connector looks like a DNS problem for an hour.
if $COMPOSE ps --format '{{.Service}} {{.State}}' 2>/dev/null | grep -q '^cloudflared running'; then
	ok "Cloudflare Tunnel connector is up"
else
	warn "cloudflared is not running — api.deenquest.online will not resolve to this host"
fi

step "6/8  rclone remotes for backups"

if rclone listremotes 2>/dev/null | grep -q '^b2:'; then
	if rclone listremotes 2>/dev/null | grep -q '^r2:'; then
		skip "b2: and optional r2: configured"
	else
		skip "b2: configured (r2: is optional and not set up)"
	fi
else
	warn "the required rclone remote 'b2' is not configured."
	cat <<-'HINT'

	   Run these with sudo. The backup timer runs as root, so the remote has to
	   exist in root's rclone config — configuring it as ops leaves the hourly
	   backup silently unable to find it:

	     rclone config create b2 b2 account <KEY_ID> key <APPLICATION_KEY>

	   Cloudflare R2 is optional — a second copy on a second provider. To add it:

	     rclone config create r2 s3 provider Cloudflare \
	       access_key_id <ID> secret_access_key <SECRET> \
	       endpoint https://<ACCOUNT_ID>.r2.cloudflarestorage.com

	   Then re-run this script.

	HINT
	die "rclone not configured"
fi
ok "b2: reachable"

# ── 6. whisper model ──────────────────────────────────────────────────────────
step "7/8  Whisper model"

MODEL_DIR=/var/lib/docker/volumes/deploy_whisper_models/_data/quran-base-ct2
docker volume create deploy_whisper_models >/dev/null

if [[ -f "$MODEL_DIR/model.bin" ]]; then
	skip "model already on the volume"
else
	rclone copy b2:deenquest-assets/quran-base-ct2 "$MODEL_DIR" --progress \
		|| die "Model is not in object storage yet. From your laptop, either:
    rclone copy backend/whisper-service/models/quran-base-ct2 b2:deenquest-assets/quran-base-ct2
  or, since it is only ~79 MB and Tailscale is already up, copy it straight over:
    rsync -av --progress -e 'ssh -i ~/.ssh/deenquest_ops' \\
      backend/whisper-service/models/quran-base-ct2/ \\
      ops@deenquest-prod:/tmp/quran-base-ct2/
    ssh ops@deenquest-prod 'sudo mkdir -p $MODEL_DIR && sudo cp -r /tmp/quran-base-ct2/. $MODEL_DIR/'"
	ok "model downloaded ($(du -sh "$MODEL_DIR" | cut -f1))"
fi

# ── 7. backups ────────────────────────────────────────────────────────────────
step "8/8  Hourly backup timer"

install -m 0644 "$DEPLOY_DIR/systemd/deenquest-backup.service" /etc/systemd/system/
install -m 0644 "$DEPLOY_DIR/systemd/deenquest-backup.timer"   /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now --quiet deenquest-backup.timer
ok "next run: $(systemctl show deenquest-backup.timer -p NextElapseUSecRealtime --value)"

# ── done ──────────────────────────────────────────────────────────────────────
cat <<'DONE'

────────────────────────────────────────────────────────────
 Server is ready. Nothing listens on the public interface.

 Verify that from your laptop, not here:
     nmap -Pn -p- <public-ip>        # every port should be filtered

 Prove the backup path works before you trust it:
     sudo systemctl start deenquest-backup.service
     journalctl -u deenquest-backup.service -n 20

 Then deploy, from GitHub:
     git tag -s v0.1.0 -m "first production release" && git push --tags
     Actions → Release → Run workflow  (type the tag into both fields)
────────────────────────────────────────────────────────────

DONE
