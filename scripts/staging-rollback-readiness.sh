#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"
STAGING_PROJECT_ID="avsilks-staging-20260820-01"
PRODUCTION_PROJECT_ID="avsilks-5e81a"

FIREBASE_RC=".firebaserc"
FIREBASE_CONFIG="firebase.json"

fail() {
  echo "$1"
  echo "STAGING_ROLLBACK_TARGET=STAGING"
  echo "STAGING_ROLLBACK_HOSTING_LANE_STATUS=READINESS_ONLY"
  echo "STAGING_ROLLBACK_FUNCTIONS_LANE_STATUS=READINESS_ONLY"
  echo "STAGING_ROLLBACK_EXPLICIT_APPROVAL_STATUS=REQUIRED"
  echo "STAGING_ROLLBACK_EXECUTION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ROLLBACK_HOSTING_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ROLLBACK_FUNCTION_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ROLLBACK_READINESS_GATE=FAIL"
  exit 1
}

echo "STAGING_ROLLBACK_READINESS_BEGIN"

MODE="${1:---check}"

if [ "$MODE" != "--check" ] &&
   [ "$MODE" != "readiness" ]; then
  fail "STAGING_ROLLBACK_MODE_GATE=FAIL"
fi

CURRENT_BRANCH="$(
  git branch --show-current 2>/dev/null
)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_ROLLBACK_BRANCH_GATE=FAIL"
fi

echo "STAGING_ROLLBACK_BRANCH_GATE=PASS"

for tool in git python3; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_ROLLBACK_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_ROLLBACK_TOOL_GATE=PASS"

if [ ! -f "$FIREBASE_RC" ] ||
   [ ! -f "$FIREBASE_CONFIG" ]; then
  fail "STAGING_ROLLBACK_CONFIG_FILE_GATE=FAIL"
fi

# -------------------------------------------------
# Validate environment identity and current
# Hosting/Functions rollback relationship.
# No cloud calls and no mutations.
# -------------------------------------------------

python3 - \
  "$FIREBASE_RC" \
  "$FIREBASE_CONFIG" \
  "$STAGING_PROJECT_ID" \
  "$PRODUCTION_PROJECT_ID" <<'PYCONFIG'
from pathlib import Path
import json
import sys

firebaserc_path = Path(sys.argv[1])
firebase_path = Path(sys.argv[2])

staging_id = sys.argv[3]
production_id = sys.argv[4]

try:
    firebaserc = json.loads(
        firebaserc_path.read_text(
            encoding="utf-8"
        )
    )

    firebase = json.loads(
        firebase_path.read_text(
            encoding="utf-8"
        )
    )
except Exception:
    raise SystemExit(10)

projects = firebaserc.get(
    "projects"
)

if not isinstance(projects, dict):
    raise SystemExit(11)

if projects.get("default") != production_id:
    raise SystemExit(12)

if projects.get("staging") != staging_id:
    raise SystemExit(13)

if projects.get("default") == projects.get("staging"):
    raise SystemExit(14)

hosting = firebase.get(
    "hosting"
)

if not isinstance(hosting, dict):
    raise SystemExit(15)

rewrites = hosting.get(
    "rewrites"
)

if not isinstance(rewrites, list):
    raise SystemExit(16)

api_rewrite = next(
    (
        item
        for item in rewrites
        if (
            isinstance(item, dict)
            and item.get("source") == "/api/**"
        )
    ),
    None,
)

if not isinstance(api_rewrite, dict):
    raise SystemExit(17)

target = api_rewrite.get(
    "function"
)

if not isinstance(target, dict):
    raise SystemExit(18)

if target.get("functionId") != "api":
    raise SystemExit(19)

if target.get("region") != "asia-south1":
    raise SystemExit(20)

# Current architecture intentionally treats the
# two rollback surfaces separately unless a future
# reviewed configuration introduces pinning.
if target.get("pinTag") is True:
    print(
        "STAGING_ROLLBACK_PINNING_STATUS=PINNED"
    )
else:
    print(
        "STAGING_ROLLBACK_PINNING_STATUS=NOT_PINNED"
    )

print(
    "STAGING_ROLLBACK_ALIAS_ISOLATION_GATE=PASS"
)
print(
    "STAGING_ROLLBACK_API_REWRITE_GATE=PASS"
)
PYCONFIG

CONFIG_RC=$?

[ "$CONFIG_RC" -eq 0 ] ||
  fail "STAGING_ROLLBACK_CONFIG_IDENTITY_GATE=FAIL code=$CONFIG_RC"

echo "STAGING_ROLLBACK_CONFIG_IDENTITY_GATE=PASS"

# -------------------------------------------------
# --check is deliberately WIP-safe and zero-cloud.
# It validates architecture only, not rollback SHAs.
# -------------------------------------------------

if [ "$MODE" = "--check" ]; then
  echo "STAGING_ROLLBACK_CHECK_MODE=STATIC_ONLY"
  echo "STAGING_ROLLBACK_TARGET=STAGING"
  echo "STAGING_ROLLBACK_SOURCE_SHA_GATE=DEFERRED"
  echo "STAGING_ROLLBACK_TARGET_SHA_GATE=DEFERRED"
  echo "STAGING_ROLLBACK_ANCESTRY_GATE=DEFERRED"
  echo "STAGING_ROLLBACK_HOSTING_LANE_STATUS=READINESS_ONLY"
  echo "STAGING_ROLLBACK_FUNCTIONS_LANE_STATUS=READINESS_ONLY"
  echo "STAGING_ROLLBACK_EXPLICIT_APPROVAL_STATUS=REQUIRED"
  echo "STAGING_ROLLBACK_EXECUTION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ROLLBACK_HOSTING_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ROLLBACK_FUNCTION_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ROLLBACK_CHECK_MODE_GATE=PASS"
  exit 0
fi

# -------------------------------------------------
# Readiness mode:
# only local Git validation. It performs no rollback.
# -------------------------------------------------

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_ROLLBACK_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "STAGING_ROLLBACK_CLEAN_WORKTREE_GATE=PASS"

LOCAL_SHA="$(
  git rev-parse HEAD 2>/dev/null
)"

REMOTE_SHA="$(
  git ls-remote \
    github \
    "refs/heads/$EXPECTED_BRANCH" \
    2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] ||
   [ -z "$REMOTE_SHA" ] ||
   [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "STAGING_ROLLBACK_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_ROLLBACK_REMOTE_HASH_GATE=PASS"

STAGING_ROLLBACK_SOURCE_SHA="${STAGING_ROLLBACK_SOURCE_SHA:-$LOCAL_SHA}"

STAGING_ROLLBACK_TARGET_SHA="${STAGING_ROLLBACK_TARGET_SHA:-}"

if [ -z "$STAGING_ROLLBACK_SOURCE_SHA" ]; then
  fail "STAGING_ROLLBACK_SOURCE_SHA_GATE=FAIL reason=MISSING"
fi

if [ -z "$STAGING_ROLLBACK_TARGET_SHA" ]; then
  fail "STAGING_ROLLBACK_TARGET_SHA_GATE=FAIL reason=MISSING"
fi

SOURCE_SHA="$(
  git rev-parse \
    --verify \
    "${STAGING_ROLLBACK_SOURCE_SHA}^{commit}" \
    2>/dev/null
)"

SOURCE_RC=$?

if [ "$SOURCE_RC" -ne 0 ] ||
   [ -z "$SOURCE_SHA" ]; then
  fail "STAGING_ROLLBACK_SOURCE_SHA_GATE=FAIL reason=INVALID"
fi

if [ "$SOURCE_SHA" != "$LOCAL_SHA" ]; then
  fail "STAGING_ROLLBACK_SOURCE_SHA_GATE=FAIL reason=NOT_CURRENT_LOCKED_HEAD"
fi

echo "STAGING_ROLLBACK_SOURCE_SHA_GATE=PASS"

TARGET_SHA="$(
  git rev-parse \
    --verify \
    "${STAGING_ROLLBACK_TARGET_SHA}^{commit}" \
    2>/dev/null
)"

TARGET_RC=$?

if [ "$TARGET_RC" -ne 0 ] ||
   [ -z "$TARGET_SHA" ]; then
  fail "STAGING_ROLLBACK_TARGET_SHA_GATE=FAIL reason=INVALID"
fi

if [ "$TARGET_SHA" = "$SOURCE_SHA" ]; then
  fail "STAGING_ROLLBACK_TARGET_SHA_GATE=FAIL reason=SAME_AS_SOURCE"
fi

echo "STAGING_ROLLBACK_TARGET_SHA_GATE=PASS"

git merge-base \
  --is-ancestor \
  "$TARGET_SHA" \
  "$SOURCE_SHA" \
  >/dev/null 2>&1

ANCESTRY_RC=$?

if [ "$ANCESTRY_RC" -ne 0 ]; then
  fail "STAGING_ROLLBACK_ANCESTRY_GATE=FAIL"
fi

echo "STAGING_ROLLBACK_ANCESTRY_GATE=PASS"

# No rollback is executed here. This guard only proves
# that the requested target is a valid older commit.
echo "STAGING_ROLLBACK_TARGET=STAGING"
echo "STAGING_ROLLBACK_SOURCE_SHA=$SOURCE_SHA"
echo "STAGING_ROLLBACK_TARGET_SHA=$TARGET_SHA"
echo "STAGING_ROLLBACK_HOSTING_LANE_STATUS=READINESS_ONLY"
echo "STAGING_ROLLBACK_FUNCTIONS_LANE_STATUS=READINESS_ONLY"
echo "STAGING_ROLLBACK_EXPLICIT_APPROVAL_STATUS=REQUIRED"
echo "STAGING_ROLLBACK_EXECUTION_STATUS=NOT_ATTEMPTED"
echo "STAGING_ROLLBACK_HOSTING_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_ROLLBACK_FUNCTION_MUTATION_STATUS=NOT_ATTEMPTED"
echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_ROLLBACK_READINESS_GATE=PASS"
exit 0
