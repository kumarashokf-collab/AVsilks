#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"
STAGING_PROJECT_ID="avsilks-staging-20260820-01"
PRODUCTION_PROJECT_ID="avsilks-5e81a"
LOCAL_EMULATOR_PROJECT_ID="demo-avsilks-local"
NESTED_FRONTEND_PROJECT_ID="DISABLED_USE_ROOT_CONFIG"

ROOT_FIREBASE_RC=".firebaserc"
ROOT_FIREBASE_CONFIG="firebase.json"
NESTED_FIREBASE_RC="frontend/.firebaserc"
NESTED_FIREBASE_CONFIG="frontend/firebase.json"
FRONTEND_FIREBASE_SOURCE="frontend/src/firebase.js"
BACKEND_FIREBASE_OPTIONS="backend/src/config/firebaseOptions.js"

fail() {
  echo "$1"
  echo "FRONTEND_LEGACY_FIREBASE_CONFIG_STATUS=QUARANTINED"
  echo "STAGING_FRONTEND_CONFIG_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_BACKEND_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
  echo "PRODUCTION_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_ENVIRONMENT_PROVISIONING_STATUS=REQUIRES_SECURE_LOCAL_OR_PLATFORM_CONFIGURATION"
  echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
  echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_ENVIRONMENT_BOUNDARY_GATE=FAIL"
  exit 1
}

echo "STAGING_ENVIRONMENT_PREFLIGHT_BEGIN"

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_ENVIRONMENT_BRANCH_GATE=FAIL"
fi

echo "STAGING_ENVIRONMENT_BRANCH_GATE=PASS"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_ENVIRONMENT_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "STAGING_ENVIRONMENT_CLEAN_WORKTREE_GATE=PASS"

for tool in git python3 node npm; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_ENVIRONMENT_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_ENVIRONMENT_TOOL_GATE=PASS"

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] || [ -z "$REMOTE_SHA" ]; then
  fail "STAGING_ENVIRONMENT_REMOTE_RESOLUTION_GATE=FAIL"
fi

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "STAGING_ENVIRONMENT_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_ENVIRONMENT_REMOTE_HASH_GATE=PASS"

for required_file in \
  "$ROOT_FIREBASE_RC" \
  "$ROOT_FIREBASE_CONFIG" \
  "$NESTED_FIREBASE_RC" \
  "$NESTED_FIREBASE_CONFIG" \
  "$FRONTEND_FIREBASE_SOURCE" \
  "$BACKEND_FIREBASE_OPTIONS"
do
  if [ ! -f "$required_file" ]; then
    fail "STAGING_ENVIRONMENT_REQUIRED_FILE_GATE=FAIL file=$required_file"
  fi
done

echo "STAGING_ENVIRONMENT_REQUIRED_FILE_GATE=PASS"

python3 - \
  "$ROOT_FIREBASE_RC" \
  "$ROOT_FIREBASE_CONFIG" \
  "$NESTED_FIREBASE_RC" \
  "$NESTED_FIREBASE_CONFIG" \
  "$FRONTEND_FIREBASE_SOURCE" \
  "$BACKEND_FIREBASE_OPTIONS" \
  "$STAGING_PROJECT_ID" \
  "$PRODUCTION_PROJECT_ID" \
  "$LOCAL_EMULATOR_PROJECT_ID" \
  "$NESTED_FRONTEND_PROJECT_ID" <<'PYVERIFY'
from pathlib import Path
import json
import sys

root_rc_path = Path(sys.argv[1])
root_config_path = Path(sys.argv[2])
nested_rc_path = Path(sys.argv[3])
nested_config_path = Path(sys.argv[4])
frontend_source_path = Path(sys.argv[5])
backend_options_path = Path(sys.argv[6])

staging_id = sys.argv[7]
production_id = sys.argv[8]
local_id = sys.argv[9]
nested_disabled_id = sys.argv[10]

root_rc = json.loads(
    root_rc_path.read_text(
        encoding="utf-8"
    )
)

root_projects = root_rc.get(
    "projects"
)

if not isinstance(
    root_projects,
    dict,
):
    raise SystemExit(10)

if root_projects.get(
    "default"
) != production_id:
    raise SystemExit(11)

if root_projects.get(
    "staging"
) != staging_id:
    raise SystemExit(12)

if staging_id == production_id:
    raise SystemExit(13)

nested_rc = json.loads(
    nested_rc_path.read_text(
        encoding="utf-8"
    )
)

nested_projects = nested_rc.get(
    "projects"
)

if not isinstance(
    nested_projects,
    dict,
):
    raise SystemExit(20)

if nested_projects.get(
    "default"
) != nested_disabled_id:
    raise SystemExit(21)

if nested_disabled_id in {
    production_id,
    staging_id,
    local_id,
}:
    raise SystemExit(22)

nested_config = json.loads(
    nested_config_path.read_text(
        encoding="utf-8"
    )
)

if "functions" in nested_config:
    raise SystemExit(23)

root_config = json.loads(
    root_config_path.read_text(
        encoding="utf-8"
    )
)

root_functions = root_config.get(
    "functions"
)

if not isinstance(
    root_functions,
    list,
):
    raise SystemExit(30)

root_api = [
    item
    for item in root_functions
    if (
        isinstance(item, dict)
        and item.get("source") == "backend"
        and item.get("codebase") == "api"
    )
]

if len(root_api) != 1:
    raise SystemExit(31)

frontend = frontend_source_path.read_text(
    encoding="utf-8"
)

required_frontend_tokens = [
    "VITE_USE_FIREBASE_EMULATORS",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    local_id,
]

for token in required_frontend_tokens:
    if token not in frontend:
        raise SystemExit(40)

if staging_id in frontend:
    raise SystemExit(41)

if production_id in frontend:
    raise SystemExit(42)

backend = backend_options_path.read_text(
    encoding="utf-8"
)

required_backend_tokens = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "applicationDefault",
]

for token in required_backend_tokens:
    if token not in backend:
        raise SystemExit(50)

print(
    "STAGING_ENVIRONMENT_ROOT_ALIAS_GATE=PASS"
)
print(
    "STAGING_ENVIRONMENT_NESTED_QUARANTINE_GATE=PASS"
)
print(
    "STAGING_ENVIRONMENT_LEGACY_FUNCTIONS_REMOVAL_GATE=PASS"
)
print(
    "STAGING_ENVIRONMENT_FRONTEND_RUNTIME_GATE=PASS"
)
print(
    "STAGING_ENVIRONMENT_BACKEND_CREDENTIAL_CONTRACT_GATE=PASS"
)
PYVERIFY

VERIFY_RC=$?

if [ "$VERIFY_RC" -ne 0 ]; then
  fail "STAGING_ENVIRONMENT_CONTRACT_GATE=FAIL code=$VERIFY_RC"
fi

echo "STAGING_ENVIRONMENT_CONTRACT_GATE=PASS"
echo "STAGING_ENVIRONMENT_TARGET=STAGING"
echo "STAGING_PROJECT_ID=$STAGING_PROJECT_ID"
echo "PRODUCTION_PROJECT_ID=$PRODUCTION_PROJECT_ID"
echo "LOCAL_EMULATOR_PROJECT_ID=$LOCAL_EMULATOR_PROJECT_ID"
echo "NESTED_FRONTEND_PROJECT_ID=$NESTED_FRONTEND_PROJECT_ID"
echo "FRONTEND_LEGACY_FIREBASE_CONFIG_STATUS=QUARANTINED"
echo "STAGING_FRONTEND_CONFIG_VALUES_STATUS=NOT_ACCESSED"
echo "STAGING_BACKEND_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
echo "PRODUCTION_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED"
echo "STAGING_ENVIRONMENT_PROVISIONING_STATUS=REQUIRES_SECURE_LOCAL_OR_PLATFORM_CONFIGURATION"
echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_ENVIRONMENT_BOUNDARY_GATE=PASS"
exit 0
