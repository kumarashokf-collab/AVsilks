#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"
STAGING_PROJECT_ID="avsilks-staging-20260820-01"
PRODUCTION_PROJECT_ID="avsilks-5e81a"

HEALTH_PATH="/api/health"
PUBLIC_PROVENANCE_PATH_PREFIX="/api/provenance/public/"

fail() {
  echo "$1"
  echo "STAGING_E2E_TARGET=STAGING"
  echo "STAGING_E2E_BASE_URL_TARGET_STATUS=STAGING_ONLY"
  echo "STAGING_E2E_PRODUCTION_TARGET_STATUS=BLOCKED"
  echo "STAGING_E2E_AUTH_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_E2E_PAYMENT_SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_E2E_DATA_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_E2E_GATE=FAIL"
  exit 1
}

echo "STAGING_E2E_BEGIN"

MODE="${1:-live}"

if [ "$MODE" != "live" ] &&
   [ "$MODE" != "--check" ]; then
  fail "STAGING_E2E_MODE_GATE=FAIL"
fi

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_E2E_BRANCH_GATE=FAIL"
fi

echo "STAGING_E2E_BRANCH_GATE=PASS"

for tool in git curl python3; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_E2E_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_E2E_TOOL_GATE=PASS"

# -------------------------------------------------
# Static/check mode:
# no network, no staging URL value, no public ID value.
# -------------------------------------------------

if [ "$MODE" = "--check" ]; then
  echo "STAGING_E2E_CHECK_MODE=STATIC_ONLY"
  echo "STAGING_E2E_TARGET=STAGING"
  echo "STAGING_E2E_BASE_URL_TARGET_STATUS=STAGING_ONLY"
  echo "STAGING_E2E_PRODUCTION_TARGET_STATUS=BLOCKED"
  echo "STAGING_E2E_HEALTH_GATE=DEFERRED_UNTIL_DEPLOYED_BLAZE_STAGING"
  echo "STAGING_E2E_PUBLIC_PROVENANCE_GATE=DEFERRED_UNTIL_DEPLOYED_BLAZE_STAGING"
  echo "STAGING_E2E_AUTH_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_E2E_PAYMENT_SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_E2E_DATA_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_E2E_LIVE_RUNTIME_STATUS=DEFERRED_UNTIL_DEPLOYED_BLAZE_STAGING"
  echo "STAGING_E2E_CHECK_MODE_GATE=PASS"
  exit 0
fi

# -------------------------------------------------
# Live mode only: immutable Git/remote boundary
# -------------------------------------------------

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_E2E_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "STAGING_E2E_CLEAN_WORKTREE_GATE=PASS"

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] ||
   [ -z "$REMOTE_SHA" ] ||
   [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "STAGING_E2E_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_E2E_REMOTE_HASH_GATE=PASS"

# These two are the only non-secret runtime inputs.
STAGING_E2E_BASE_URL="${STAGING_E2E_BASE_URL:-}"
STAGING_E2E_PUBLIC_PROVENANCE_ID="${STAGING_E2E_PUBLIC_PROVENANCE_ID:-}"

if [ -z "$STAGING_E2E_BASE_URL" ]; then
  fail "STAGING_E2E_BASE_URL_GATE=FAIL reason=MISSING"
fi

if [ -z "$STAGING_E2E_PUBLIC_PROVENANCE_ID" ]; then
  fail "STAGING_E2E_PUBLIC_PROVENANCE_ID_GATE=FAIL reason=MISSING"
fi

# -------------------------------------------------
# Strict staging URL validation.
# Only the exact staging Firebase Hosting domains.
# -------------------------------------------------

NORMALIZED_BASE_URL="$(
  python3 - \
    "$STAGING_E2E_BASE_URL" \
    "$STAGING_PROJECT_ID" \
    "$PRODUCTION_PROJECT_ID" <<'PYURL'
from urllib.parse import urlparse
import sys

raw = sys.argv[1].strip()
staging_id = sys.argv[2]
production_id = sys.argv[3]

try:
    parsed = urlparse(raw)
except Exception:
    raise SystemExit(10)

if parsed.scheme != "https":
    raise SystemExit(11)

if parsed.username is not None or parsed.password is not None:
    raise SystemExit(12)

if parsed.port is not None:
    raise SystemExit(13)

if parsed.query or parsed.fragment or parsed.params:
    raise SystemExit(14)

if parsed.path not in ("", "/"):
    raise SystemExit(15)

host = (parsed.hostname or "").lower()

allowed = {
    f"{staging_id}.web.app",
    f"{staging_id}.firebaseapp.com",
}

if production_id in host:
    raise SystemExit(16)

if host not in allowed:
    raise SystemExit(17)

print(f"https://{host}")
PYURL
)"

URL_RC=$?

if [ "$URL_RC" -ne 0 ] ||
   [ -z "$NORMALIZED_BASE_URL" ]; then
  fail "STAGING_E2E_BASE_URL_GATE=FAIL reason=NON_STAGING_TARGET"
fi

echo "STAGING_E2E_BASE_URL_GATE=PASS"
echo "STAGING_E2E_BASE_URL_TARGET_STATUS=STAGING_ONLY"
echo "STAGING_E2E_PRODUCTION_TARGET_STATUS=BLOCKED"

# -------------------------------------------------
# Match backend publicId contract:
# non-empty, <=128 chars, no slash.
# -------------------------------------------------

ENCODED_PUBLIC_ID="$(
  python3 - \
    "$STAGING_E2E_PUBLIC_PROVENANCE_ID" <<'PYID'
from urllib.parse import quote
import sys

value = sys.argv[1]

if value != value.strip():
    raise SystemExit(20)

if len(value) < 1 or len(value) > 128:
    raise SystemExit(21)

if "/" in value:
    raise SystemExit(22)

print(
    quote(
        value,
        safe="",
    )
)
PYID
)"

ID_RC=$?

if [ "$ID_RC" -ne 0 ] ||
   [ -z "$ENCODED_PUBLIC_ID" ]; then
  fail "STAGING_E2E_PUBLIC_PROVENANCE_ID_GATE=FAIL reason=INVALID"
fi

echo "STAGING_E2E_PUBLIC_PROVENANCE_ID_GATE=PASS"

TMP_DIR="$(mktemp -d 2>/dev/null)"

if [ -z "$TMP_DIR" ] ||
   [ ! -d "$TMP_DIR" ]; then
  fail "STAGING_E2E_TEMP_GATE=FAIL"
fi

cleanup() {
  rm -rf "$TMP_DIR"
}

HEALTH_OUT="$TMP_DIR/health.json"
PROVENANCE_OUT="$TMP_DIR/provenance.json"

HEALTH_URL="${NORMALIZED_BASE_URL}${HEALTH_PATH}"
PROVENANCE_URL="${NORMALIZED_BASE_URL}${PUBLIC_PROVENANCE_PATH_PREFIX}${ENCODED_PUBLIC_ID}"

# -------------------------------------------------
# 1. GET-only health verification
# -------------------------------------------------

curl \
  --silent \
  --show-error \
  --fail \
  --proto '=https' \
  --tlsv1.2 \
  --connect-timeout 10 \
  --max-time 30 \
  --output "$HEALTH_OUT" \
  "$HEALTH_URL"

HEALTH_RC=$?

if [ "$HEALTH_RC" -ne 0 ]; then
  cleanup
  fail "STAGING_E2E_HEALTH_GATE=FAIL reason=HTTP"
fi

python3 - "$HEALTH_OUT" <<'PYHEALTH'
from pathlib import Path
import json
import sys

try:
    payload = json.loads(
        Path(sys.argv[1]).read_text(
            encoding="utf-8"
        )
    )
except Exception:
    raise SystemExit(30)

if not isinstance(payload, dict):
    raise SystemExit(31)

if payload.get("success") is not True:
    raise SystemExit(32)

if payload.get("status") != "Active":
    raise SystemExit(33)
PYHEALTH

HEALTH_JSON_RC=$?

if [ "$HEALTH_JSON_RC" -ne 0 ]; then
  cleanup
  fail "STAGING_E2E_HEALTH_GATE=FAIL reason=CONTRACT"
fi

echo "STAGING_E2E_HEALTH_GATE=PASS"

# -------------------------------------------------
# 2. GET-only public provenance verification
# -------------------------------------------------

curl \
  --silent \
  --show-error \
  --fail \
  --proto '=https' \
  --tlsv1.2 \
  --connect-timeout 10 \
  --max-time 30 \
  --output "$PROVENANCE_OUT" \
  "$PROVENANCE_URL"

PROVENANCE_RC=$?

if [ "$PROVENANCE_RC" -ne 0 ]; then
  cleanup
  fail "STAGING_E2E_PUBLIC_PROVENANCE_GATE=FAIL reason=HTTP"
fi

python3 - \
  "$PROVENANCE_OUT" \
  "$STAGING_E2E_PUBLIC_PROVENANCE_ID" <<'PYPROVENANCE'
from pathlib import Path
import json
import sys

try:
    payload = json.loads(
        Path(sys.argv[1]).read_text(
            encoding="utf-8"
        )
    )
except Exception:
    raise SystemExit(40)

expected_public_id = sys.argv[2]

if not isinstance(payload, dict):
    raise SystemExit(41)

if payload.get("success") is not True:
    raise SystemExit(42)

if payload.get("verified") is not True:
    raise SystemExit(43)

data = payload.get("data")

if not isinstance(data, dict):
    raise SystemExit(44)

if data.get("publicId") != expected_public_id:
    raise SystemExit(45)

for key in (
    "product",
    "artisan",
    "origin",
):
    if not isinstance(
        data.get(key),
        dict,
    ):
        raise SystemExit(46)

serialized = json.dumps(
    data,
    separators=(",", ":"),
)

for forbidden in (
    '"productId"',
    '"artisanId"',
    '"createdBy"',
    '"updatedBy"',
    '"createdAt"',
    '"updatedAt"',
    '"publishedAt"',
    '"internalMetadata"',
    '"schemaVersion"',
    '"status"',
):
    if forbidden in serialized:
        raise SystemExit(47)
PYPROVENANCE

PROVENANCE_JSON_RC=$?

if [ "$PROVENANCE_JSON_RC" -ne 0 ]; then
  cleanup
  fail "STAGING_E2E_PUBLIC_PROVENANCE_GATE=FAIL reason=CONTRACT"
fi

echo "STAGING_E2E_PUBLIC_PROVENANCE_GATE=PASS"

cleanup

# -------------------------------------------------
# Final immutable boundary
# -------------------------------------------------

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_E2E_FINAL_WORKTREE_GATE=FAIL"
fi

FINAL_LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

FINAL_REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$FINAL_LOCAL_SHA" ] ||
   [ -z "$FINAL_REMOTE_SHA" ] ||
   [ "$FINAL_LOCAL_SHA" != "$FINAL_REMOTE_SHA" ]; then
  fail "STAGING_E2E_FINAL_REMOTE_GATE=FAIL"
fi

echo "STAGING_E2E_FINAL_WORKTREE_GATE=PASS"
echo "STAGING_E2E_FINAL_REMOTE_GATE=PASS"
echo "STAGING_E2E_TARGET=STAGING"
echo "STAGING_E2E_BASE_URL_TARGET_STATUS=STAGING_ONLY"
echo "STAGING_E2E_PRODUCTION_TARGET_STATUS=BLOCKED"
echo "STAGING_E2E_AUTH_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
echo "STAGING_E2E_PAYMENT_SECRET_VALUES_STATUS=NOT_ACCESSED"
echo "STAGING_E2E_DATA_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_E2E_GATE=PASS"
exit 0
