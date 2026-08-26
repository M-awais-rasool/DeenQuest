#!/usr/bin/env bash
#
# Private CA and server certificate for MongoDB.
#
# On one host, MongoDB traffic never touches a wire, so TLS buys little today.
# It is enabled anyway so that when MongoDB moves to its own node, the
# encrypted-in-transit property is already true rather than a migration task.
#
# Keep ca.key offline — in the break-glass envelope, not on the server.
set -euo pipefail

OUT="${1:-/srv/deenquest/deploy/mongo/tls}"
DAYS_CA=3650
DAYS_SERVER=825

install -d -m 0700 "$OUT"
cd "$OUT"

if [[ -f ca.pem ]]; then
	echo "CA already exists at $OUT/ca.pem — refusing to overwrite it."
	exit 1
fi

openssl genrsa -out ca.key 4096
openssl req -new -x509 -days "$DAYS_CA" -key ca.key -out ca.pem \
	-subj "/CN=DeenQuest Internal CA/O=DeenQuest"

openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
	-subj "/CN=mongo/O=DeenQuest"

cat > server.ext <<-EXT
	subjectAltName = DNS:mongo, DNS:localhost, IP:127.0.0.1
	extendedKeyUsage = serverAuth, clientAuth
EXT

openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
	-out server.crt -days "$DAYS_SERVER" -sha256 -extfile server.ext

cat server.crt server.key > server.pem

# Replica set members authenticate to each other with this shared keyfile.
openssl rand -base64 756 > keyfile

chmod 0400 server.pem keyfile ca.pem
chown 999:999 server.pem keyfile ca.pem   # the mongo user inside the container
rm -f server.csr server.ext server.crt server.key

echo "TLS material written to $OUT"
echo "Move ca.key into the break-glass envelope and delete it from this host:"
echo "  shred -u $OUT/ca.key"
