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
  echo "STAGING_DEPLOY_APPROVAL_STATUS=REQUIRES_EXPLICIT_APPROVAL"
  echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
  echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "SECRET_WRITE_STATUS=NOT_ATTEMPTED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_DEPLOY_PREFLIGHT_GATE=FAIL"
  exit 1
}

echo "STAGING_DEPLOY_PREFLIGHT_BEGIN"

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_DEPLOY_BRANCH_GATE=FAIL"
fi

echo "STAGING_DEPLOY_BRANCH_GATE=PASS"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_DEPLOY_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "STAGING_DEPLOY_CLEAN_WORKTREE_GATE=PASS"

for tool in git firebase python3 node npm; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_DEPLOY_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_DEPLOY_TOOL_GATE=PASS"

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] || [ -z "$REMOTE_SHA" ]; then
  fail "STAGING_DEPLOY_REMOTE_RESOLUTION_GATE=FAIL"
fi

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "STAGING_DEPLOY_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_DEPLOY_REMOTE_HASH_GATE=PASS"

if [ ! -f "$FIREBASE_RC" ]; then
  fail "STAGING_DEPLOY_FIREBASERC_FILE_GATE=FAIL"
fi

if [ ! -f "$FIREBASE_CONFIG" ]; then
  fail "STAGING_DEPLOY_FIREBASE_CONFIG_FILE_GATE=FAIL"
fi

echo "STAGING_DEPLOY_REQUIRED_FILE_GATE=PASS"

PROJECTS_TMP="$(mktemp)"

if [ -z "$PROJECTS_TMP" ]; then
  fail "STAGING_DEPLOY_TEMPFILE_GATE=FAIL"
fi

firebase projects:list --json >"$PROJECTS_TMP" 2>/dev/null
PROJECTS_RC=$?

if [ "$PROJECTS_RC" -ne 0 ]; then
  rm -f "$PROJECTS_TMP"
  fail "STAGING_DEPLOY_PROJECT_LIST_GATE=FAIL"
fi

python3 - \
  "$PROJECTS_TMP" \
  "$FIREBASE_RC" \
  "$FIREBASE_CONFIG" \
  "$STAGING_PROJECT_ID" \
  "$PRODUCTION_PROJECT_ID" <<'PYVERIFY'
from pathlib import Path
import json
import sys

projects_path = Path(sys.argv[1])
firebaserc_path = Path(sys.argv[2])
firebase_config_path = Path(sys.argv[3])
staging_id = sys.argv[4]
production_id = sys.argv[5]

with projects_path.open(
    "r",
    encoding="utf-8",
) as handle:
    project_payload = json.load(handle)

def collect_project_ids(value):
    found = set()

    if isinstance(value, dict):
        project_id = value.get("projectId")

        if isinstance(project_id, str):
            found.add(project_id)

        for nested in value.values():
            found.update(
                collect_project_ids(nested)
            )

    elif isinstance(value, list):
        for nested in value:
            found.update(
                collect_project_ids(nested)
            )

    return found

project_ids = collect_project_ids(
    project_payload
)

if staging_id not in project_ids:
    raise SystemExit(10)

if production_id not in project_ids:
    raise SystemExit(11)

firebaserc = json.loads(
    firebaserc_path.read_text(
        encoding="utf-8"
    )
)

aliases = firebaserc.get(
    "projects"
)

if not isinstance(
    aliases,
    dict,
):
    raise SystemExit(12)

if aliases.get(
    "default"
) != production_id:
    raise SystemExit(13)

if aliases.get(
    "staging"
) != staging_id:
    raise SystemExit(14)

if (
    aliases.get("default")
    == aliases.get("staging")
):
    raise SystemExit(15)

firebase_config = json.loads(
    firebase_config_path.read_text(
        encoding="utf-8"
    )
)

functions = firebase_config.get(
    "functions"
)

if not isinstance(
    functions,
    list,
):
    raise SystemExit(16)

matching_functions = [
    item
    for item in functions
    if (
        isinstance(item, dict)
        and item.get("source") == "backend"
        and item.get("codebase") == "api"
    )
]

if len(
    matching_functions
) != 1:
    raise SystemExit(17)

rewrites = (
    firebase_config
    .get("hosting", {})
    .get("rewrites", [])
)

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

if not isinstance(
    api_rewrite,
    dict,
):
    raise SystemExit(18)

function_target = api_rewrite.get(
    "function"
)

if not isinstance(
    function_target,
    dict,
):
    raise SystemExit(19)

if (
    function_target.get("functionId") != "api"
    or function_target.get("region") != "asia-south1"
):
    raise SystemExit(20)

print(
    "STAGING_DEPLOY_PROJECT_VISIBILITY_GATE=PASS"
)
print(
    "STAGING_DEPLOY_ALIAS_ISOLATION_GATE=PASS"
)
print(
    "STAGING_DEPLOY_FUNCTION_TARGET_GATE=PASS"
)
PYVERIFY

VERIFY_RC=$?
rm -f "$PROJECTS_TMP"

if [ "$VERIFY_RC" -ne 0 ]; then
  fail "STAGING_DEPLOY_IDENTITY_CONFIG_GATE=FAIL code=$VERIFY_RC"
fi

echo "STAGING_DEPLOY_IDENTITY_CONFIG_GATE=PASS"
echo "STAGING_DEPLOY_TARGET=STAGING"
echo "STAGING_PROJECT_ID=$STAGING_PROJECT_ID"
echo "PRODUCTION_PROJECT_ID=$PRODUCTION_PROJECT_ID"
echo "STAGING_DEPLOY_APPROVAL_STATUS=REQUIRES_EXPLICIT_APPROVAL"
echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
echo "SECRET_WRITE_STATUS=NOT_ATTEMPTED"
echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_DEPLOY_PREFLIGHT_GATE=PASS"
exit 0
