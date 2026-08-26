#!/usr/bin/env bash
#
# Hourly encrypted backup to two providers, neither of them Vultr.
#
# Four properties matter more than the script:
#   1. age encrypts with the PUBLIC key. The private key is not on this box, so
#      a fully compromised host cannot decrypt a single historical backup.
#   2. The object-storage tokens are write+list only. Retention is enforced by a
#      lifecycle rule, so a compromised host cannot delete backups either.
#   3. Two providers. A Vultr account suspension does not touch the data.
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
rclone copyto "$ARCHIVE" "r2:deenquest-backups/hourly/$NAME" || fail "upload to R2 failed"
rclone copyto "$ARCHIVE" "b2:deenquest-backups-dr/hourly/$NAME" \
	|| echo "[backup] WARNING: secondary (B2) upload failed; primary succeeded" >&2

curl -fsS -m 10 --retry 3 "https://hc-ping.com/${HC_UUID}" >/dev/null || true
echo "[backup] ok $NAME ($((SIZE / 1024)) KiB)"
