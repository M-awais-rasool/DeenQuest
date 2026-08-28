#!/usr/bin/env bash
#
# One-time MongoDB initialisation: replica set, then least-privilege users.
#
# This exists as a script rather than a list of commands in a guide because the
# sequence is fiddly and easy to get subtly wrong: --auth means the localhost
# exception is gone as soon as the entrypoint creates the root user, and
# requireTLS means every mongosh call needs --tls and the CA. Getting either
# wrong produces an unhelpful error at 2am.
#
#   sudo ./scripts/init-mongo.sh
set -euo pipefail

STACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE=/run/deenquest/prod.env
COMPOSE="docker compose -f $STACK_DIR/compose.prod.yml --env-file $ENV_FILE"

[[ -r "$ENV_FILE" ]] || {
	echo "error: $ENV_FILE not found. Decrypt the secrets first:" >&2
	echo "  sudo install -d -m 0700 /run/deenquest" >&2
	echo "  sudo SOPS_AGE_KEY_FILE=/etc/deenquest/age.key sops -d $STACK_DIR/secrets/prod.enc.env | sudo tee $ENV_FILE >/dev/null" >&2
	exit 1
}

[[ -f "$STACK_DIR/mongo/tls/server.pem" ]] || {
	echo "error: TLS material missing. Run ./scripts/gen-mongo-tls.sh first." >&2
	exit 1
}

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

MSH=(mongosh --quiet
	--tls --tlsCAFile /etc/mongo/tls/ca.pem
	-u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin)

echo "[init-mongo] starting mongo"
$COMPOSE up -d mongo

echo "[init-mongo] waiting for it to accept connections"
for i in $(seq 1 30); do
	if $COMPOSE exec -T mongo "${MSH[@]}" --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; then
		break
	fi
	[[ "$i" == 30 ]] && { echo "error: mongo never became reachable" >&2; $COMPOSE logs --tail=30 mongo; exit 1; }
	sleep 2
done

# ── replica set ───────────────────────────────────────────────────────────────
# One member, but a replica set: that is what provides the oplog (recovery
# window), change streams, and transactions. Adding this later means downtime.
if $COMPOSE exec -T mongo "${MSH[@]}" --eval 'rs.status().ok' >/dev/null 2>&1; then
	echo "[init-mongo] replica set already initialised"
else
	echo "[init-mongo] initialising replica set rs0"
	$COMPOSE exec -T mongo "${MSH[@]}" --eval \
		'rs.initiate({_id:"rs0", members:[{_id:0, host:"mongo:27017"}]})'
	for _ in $(seq 1 30); do
		$COMPOSE exec -T mongo "${MSH[@]}" --eval 'db.hello().isWritablePrimary' 2>/dev/null | grep -q true && break
		sleep 2
	done
fi

# ── users ─────────────────────────────────────────────────────────────────────
if $COMPOSE exec -T mongo "${MSH[@]}" --eval \
	'db.getSiblingDB("admin").getUser("dq_app") !== null' 2>/dev/null | grep -q true; then
	echo "[init-mongo] dq_app already exists — skipping user creation"
else
	echo "[init-mongo] creating dq_app and dq_backup"
	$COMPOSE exec -T mongo "${MSH[@]}" --file /etc/mongo/init-users.js
fi

echo
echo "[init-mongo] done. Verifying least privilege:"
$COMPOSE exec -T mongo mongosh --quiet \
	--tls --tlsCAFile /etc/mongo/tls/ca.pem \
	-u dq_app -p "$MONGO_APP_PASSWORD" --authenticationDatabase admin \
	--eval 'try { db.getSiblingDB("admin").system.users.find().toArray(); print("PROBLEM: dq_app can read admin users") } catch (e) { print("ok: dq_app cannot read the admin database") }'

echo
echo "Next: move the CA private key into your password manager, then remove it:"
echo "  sudo shred -u $STACK_DIR/mongo/tls/ca.key"
