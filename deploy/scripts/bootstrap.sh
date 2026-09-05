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

step()  { printf '\n\033[1m── %s\033[0m\n' "$*"; }
ok()    { printf '   ✅ %s\n' "$*"; }
skip()  { printf '   ↷  %s\n' "$*"; }
warn()  { printf '   ⚠️  %s\n' "$*"; }
die()   { printf '\n\033[31m✗ %s\033[0m\n\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run with sudo."

# ── 0. preconditions ──────────────────────────────────────────────────────────
step "0/7  Checking preconditions"

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
step "1/7  Repository at $STACK_DIR"

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
step "2/7  Installing scripts to /usr/local/bin"

install -m 0755 "$DEPLOY_DIR/scripts/deploy.sh"  /usr/local/bin/deploy.sh
install -m 0755 "$DEPLOY_DIR/scripts/smoke.sh"   /usr/local/bin/smoke.sh
install -m 0755 "$DEPLOY_DIR/scripts/backup.sh"  /usr/local/bin/backup.sh
install -d -m 0755 /var/lib/deenquest
[[ -f /var/lib/deenquest/colour ]] || echo blue > /var/lib/deenquest/colour
ok "deploy.sh, smoke.sh, backup.sh installed"

# ── 3. secrets → tmpfs ────────────────────────────────────────────────────────
step "3/7  Decrypting production config to tmpfs"

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

install -d -m 0700 /run/deenquest
SOPS_AGE_KEY_FILE="$AGE_KEY" sops -d "$DEPLOY_DIR/secrets/prod.enc.env" > "$RUNTIME_ENV" \
	|| die "sops could not decrypt. Is $AGE_KEY the key that matches .sops.yaml?"
chmod 0400 "$RUNTIME_ENV"
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
step "4/7  MongoDB TLS, replica set and users"

if [[ -f "$DEPLOY_DIR/mongo/tls/server.pem" ]]; then
	skip "TLS material already present"
else
	"$DEPLOY_DIR/scripts/gen-mongo-tls.sh"
	ok "private CA and server certificate created"
	warn "Move $DEPLOY_DIR/mongo/tls/ca.key to your password manager, then: shred -u it"
fi

"$DEPLOY_DIR/scripts/init-mongo.sh"

# ── 5. object storage ─────────────────────────────────────────────────────────
step "5/7  rclone remotes for backups"

if rclone listremotes 2>/dev/null | grep -q '^r2:' && rclone listremotes 2>/dev/null | grep -q '^b2:'; then
	skip "r2: and b2: already configured"
else
	warn "rclone remotes 'r2' and 'b2' are not configured."
	cat <<-'HINT'

	   Run this as the ops user, not root:

	     rclone config
	       name: r2   type: s3   provider: Cloudflare
	       access_key_id / secret_access_key from Cloudflare → R2 → API Tokens
	       endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com

	     rclone config
	       name: b2   type: b2
	       account / key from Backblaze → App Keys

	   Then re-run this script.

	HINT
	die "rclone not configured"
fi
ok "r2: and b2: reachable"

# ── 6. whisper model ──────────────────────────────────────────────────────────
step "6/7  Whisper model"

MODEL_DIR=/var/lib/docker/volumes/deploy_whisper_models/_data/quran-base-ct2
docker volume create deploy_whisper_models >/dev/null

if [[ -f "$MODEL_DIR/model.bin" ]]; then
	skip "model already on the volume"
else
	rclone copy r2:deenquest-assets/quran-base-ct2 "$MODEL_DIR" --progress \
		|| die "Model not in R2 yet. From your laptop:
    rclone copy backend/whisper-service/models/quran-base-ct2 r2:deenquest-assets/quran-base-ct2"
	ok "model downloaded ($(du -sh "$MODEL_DIR" | cut -f1))"
fi

# ── 7. backups ────────────────────────────────────────────────────────────────
step "7/7  Hourly backup timer"

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
