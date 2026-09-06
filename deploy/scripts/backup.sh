#!/usr/bin/env bash
#
# Hourly encrypted backup to two providers, neither of them Vultr.
#
# Four properties matter more than the script:
#   1. age encrypts with the PUBLIC key. The private key is not on this box, so
#      a fully compromised host cannot decrypt a single historical backup.
#   2. The B2 bucket has Object Lock enabled, so that copy cannot be deleted
#      before its retention expires — by anyone, with any credential. R2's token
#      scopes are coarse (Object Read & Write includes delete), so R2 is the
#      convenient copy and B2 is the one that survives a compromised host.
#   3. The destination is not Vultr, so a Vultr account problem cannot touch it.
#      A second provider (R2) is supported but optional.
#   4. The Healthchecks ping is the dead-man's switch. Silent backup failure is
#      how data loss actually happens.
set -euo pipefail

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
WORK=$(mktemp -d)
ARCHIVE="$WORK/deenquest-${STAMP}.archive.gz.age"
trap 'rm -rf "$WORK"' EXIT

: "${AGE_PUBLIC_KEY:?AGE_PUBLIC_KEY must be set}"
: "${MONGO_BACKUP_PASSWORD:?}"
: "${HC_UUID:?Healthchecks UUID must be set — a backup with no dead-man switch is not a backup}"

COMPOSE="docker compose -f /srv/deenquest/deploy/compose.prod.yml"

fail() {
	echo "[backup] $*" >&2
	curl -fsS -m 10 --retry 3 "https://hc-ping.com/${HC_UUID}/fail" >/dev/null || true
	exit 1
}

curl -fsS -m 10 "https://hc-ping.com/${HC_UUID}/start" >/dev/null || true

# mongodump reads from a live replica set without locking.
$COMPOSE exec -T mongo mongodump \
	--username dq_backup \
	--password "$MONGO_BACKUP_PASSWORD" \
	--authenticationDatabase admin \
	--tls --tlsCAFile /etc/mongo/tls/ca.pem \
	--db deenquest --archive --gzip \
	| age -r "$AGE_PUBLIC_KEY" > "$ARCHIVE" \
	|| fail "mongodump failed"

SIZE=$(stat -c%s "$ARCHIVE" 2>/dev/null || stat -f%z "$ARCHIVE")
[[ "$SIZE" -gt 1024 ]] || fail "archive is only ${SIZE} bytes — refusing to call that a backup"

NAME=$(basename "$ARCHIVE")

# B2 is the required destination: its bucket has Object Lock, so this copy
# cannot be deleted before retention expires by anyone holding any credential —
# including someone who has taken this host. A backup run that cannot write it
# has not produced a backup worth the name, so this failure is fatal.
rclone copyto "$ARCHIVE" "b2:deenquest-backups-dr/hourly/$NAME" || fail "upload to B2 failed"

# R2 is an optional convenience copy. Configure an r2: remote and it gets used;
# leave it out and backups still work, with one provider instead of two.
if rclone listremotes 2>/dev/null | grep -q '^r2:'; then
	rclone copyto "$ARCHIVE" "r2:deenquest-backups/hourly/$NAME" \
		|| echo "[backup] WARNING: optional R2 copy failed; B2 copy succeeded" >&2
fi

curl -fsS -m 10 --retry 3 "https://hc-ping.com/${HC_UUID}" >/dev/null || true
echo "[backup] ok $NAME ($((SIZE / 1024)) KiB)"
