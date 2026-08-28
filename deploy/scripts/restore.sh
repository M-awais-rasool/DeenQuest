#!/usr/bin/env bash
#
# Restore a backup into a throwaway MongoDB and assert it is real.
#
# Run this quarterly. An untested backup is a hypothesis, and the number this
# prints is your actual RTO — replace the estimate in the architecture doc with
# whatever this says.
#
#   ./restore.sh r2:deenquest-backups/hourly/deenquest-20260826T090000Z.archive.gz.age
set -euo pipefail

SOURCE="${1:?usage: restore.sh <rclone-path> [--into-production]}"
INTO_PROD="${2:-}"
: "${AGE_KEY_FILE:?path to the age PRIVATE key — it lives in the break-glass envelope, not on the server}"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
START=$(date +%s)

echo "[restore] fetching $SOURCE"
rclone copyto "$SOURCE" "$WORK/backup.age"

if [[ "$INTO_PROD" == "--into-production" ]]; then
	read -r -p "Restore into PRODUCTION, dropping current data? Type 'yes, restore production': " ok
	[[ "$ok" == "yes, restore production" ]] || { echo "aborted"; exit 1; }
	TARGET_CMD=(docker compose -f /srv/deenquest/deploy/compose.prod.yml exec -T mongo
		mongorestore --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD"
		--authenticationDatabase admin --tls --tlsCAFile /etc/mongo/tls/ca.pem)
else
	echo "[restore] starting a throwaway mongo on :27018"
	docker rm -f dq-restore-test >/dev/null 2>&1 || true
	docker run -d --name dq-restore-test -p 127.0.0.1:27018:27017 mongo:7.0 >/dev/null
	sleep 5
	TARGET_CMD=(docker exec -i dq-restore-test mongorestore)
fi

age -d -i "$AGE_KEY_FILE" "$WORK/backup.age" | "${TARGET_CMD[@]}" --archive --gzip --drop

if [[ "$INTO_PROD" != "--into-production" ]]; then
	echo "[restore] verifying"
	docker exec -i dq-restore-test mongosh --quiet deenquest --eval '
		const names = db.getCollectionNames();
		if (names.length === 0) { print("EMPTY RESTORE"); quit(1); }
		names.sort().forEach(n => print(n.padEnd(28) + db.getCollection(n).countDocuments()));
		const idx = db.refresh_tokens.getIndexes().map(i => i.name);
		if (!idx.some(n => n.startsWith("expires_at"))) { print("TTL INDEX MISSING"); quit(1); }
		print("--- refresh_tokens TTL index present ---");
	'
	echo "[restore] tearing down"
	docker rm -f dq-restore-test >/dev/null
fi

echo "[restore] completed in $(( $(date +%s) - START ))s  <- this is your measured RTO"
