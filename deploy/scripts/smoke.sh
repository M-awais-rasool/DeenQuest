#!/usr/bin/env bash
#
# Post-deploy checks, run against the public URL so they exercise the whole
# path: Cloudflare, the tunnel, Caddy, and the new container.
set -euo pipefail

BASE="${SMOKE_BASE_URL:-https://api.deenquest.online}"
fail() { echo "[smoke] FAIL: $*" >&2; exit 1; }

# No -f here. With --fail curl exits non-zero on 401, so the `|| echo 000`
# fallback fired *after* the code had already been printed and every check saw
# "401000". Without it curl exits 0 for any HTTP response and prints just the
# code; a genuine connection failure still prints 000.
code() { curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$@" 2>/dev/null || true; }

# 1. Liveness and readiness both answer.
[[ "$(code "$BASE/health")" == 200 ]]       || fail "/health did not return 200"
[[ "$(code "$BASE/health/ready")" == 200 ]] || fail "/health/ready did not return 200"

# 2. A protected route rejects an anonymous caller. If this ever returns 200,
#    authentication is not being enforced and the deploy must not stand.
got=$(code "$BASE/api/v1/users/me")
[[ "$got" == 401 || "$got" == 403 ]] || fail "/api/v1/users/me returned $got, expected 401/403"

# 3. An admin route rejects an anonymous caller too.
# The path matters: an admin route that does not exist returns 404 from the
# router before the auth middleware ever runs, so a wrong path here would pass
# for the wrong reason — or, as it did, fail a good deploy.
got=$(code "$BASE/api/v1/admin/analytics")
[[ "$got" == 401 || "$got" == 403 ]] || fail "admin route returned $got, expected 401/403"

# 4. A public read path still serves.
[[ "$(code "$BASE/api/v1/quran/surahs")" =~ ^(200|404)$ ]] || fail "quran route is erroring"

# 5. Security headers survived the proxy chain.
# -D - on a GET, not -I: curl -I sends HEAD, and the router registers only GET
# for these paths, so HEAD returns 404 and the header check fails on a perfectly
# healthy service.
curl -sS -D - -o /dev/null --max-time 10 "$BASE/health" 2>/dev/null | grep -qi 'strict-transport-security' \
	|| fail "HSTS header missing"

# Not fatal — the app is designed to serve without Redis — but a silent loss of
# rate limiting is exactly the kind of degradation that goes unnoticed for weeks.
if curl -fsS --max-time 10 "$BASE/health/ready" 2>/dev/null | grep -q '"redis":"unavailable'; then
	echo "[smoke] WARNING: Redis is unreachable — caching and RATE LIMITING are off" >&2
fi

echo "[smoke] all checks passed against $BASE"
