#!/usr/bin/env bash
#
# Post-deploy checks, run against the public URL so they exercise the whole
# path: Cloudflare, the tunnel, Caddy, and the new container.
set -euo pipefail

BASE="${SMOKE_BASE_URL:-https://api.deenquest.app}"
fail() { echo "[smoke] FAIL: $*" >&2; exit 1; }

code() { curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$@" 2>/dev/null || echo 000; }

# 1. Liveness and readiness both answer.
[[ "$(code "$BASE/health")" == 200 ]]       || fail "/health did not return 200"
[[ "$(code "$BASE/health/ready")" == 200 ]] || fail "/health/ready did not return 200"

# 2. A protected route rejects an anonymous caller. If this ever returns 200,
#    authentication is not being enforced and the deploy must not stand.
got=$(code "$BASE/api/v1/users/me")
[[ "$got" == 401 || "$got" == 403 ]] || fail "/api/v1/users/me returned $got, expected 401/403"

# 3. An admin route rejects an anonymous caller too.
got=$(code "$BASE/api/v1/admin/analytics/overview")
[[ "$got" == 401 || "$got" == 403 ]] || fail "admin route returned $got, expected 401/403"

# 4. A public read path still serves.
[[ "$(code "$BASE/api/v1/quran/surahs")" =~ ^(200|404)$ ]] || fail "quran route is erroring"

# 5. Security headers survived the proxy chain.
curl -fsSI --max-time 10 "$BASE/health" | grep -qi 'strict-transport-security' \
	|| fail "HSTS header missing"

echo "[smoke] all checks passed against $BASE"
