#!/usr/bin/env bash
set +e

EXPECTED_BRANCH="release/mvp-production-readiness"
STAGING_PROJECT_ID="avsilks-staging-20260820-01"

fail() {
  echo "$1"
  echo "BLAZE_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
  echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "BLAZE_ACTIVATION_PREFLIGHT_GATE=FAIL"
  exit 1
}

echo "BLAZE_ACTIVATION_PREFLIGHT_BEGIN"

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "BLAZE_PREFLIGHT_BRANCH_GATE=FAIL"
fi

echo "BLAZE_PREFLIGHT_BRANCH_GATE=PASS"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "BLAZE_PREFLIGHT_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "BLAZE_PREFLIGHT_CLEAN_WORKTREE_GATE=PASS"

for tool in git firebase node npm python3; do
  command -v "$tool" >/dev/null 2>&1
  if [ "$?" -ne 0 ]; then
    fail "BLAZE_PREFLIGHT_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "BLAZE_PREFLIGHT_TOOL_GATE=PASS"

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"
REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] || [ -z "$REMOTE_SHA" ]; then
  fail "BLAZE_PREFLIGHT_REMOTE_RESOLUTION_GATE=FAIL"
fi

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "BLAZE_PREFLIGHT_REMOTE_HASH_GATE=FAIL"
fi

echo "BLAZE_PREFLIGHT_REMOTE_HASH_GATE=PASS"

PROJECTS_TMP="$(mktemp)"

if [ -z "$PROJECTS_TMP" ]; then
  fail "BLAZE_PREFLIGHT_TEMPFILE_GATE=FAIL"
fi

firebase projects:list --json >"$PROJECTS_TMP" 2>/dev/null
PROJECTS_RC=$?

if [ "$PROJECTS_RC" -ne 0 ]; then
  rm -f "$PROJECTS_TMP"
  fail "BLAZE_PREFLIGHT_FIREBASE_ACCESS_GATE=FAIL"
fi

python3 - "$PROJECTS_TMP" "$STAGING_PROJECT_ID" <<'PYPROJECT'
import json
import sys

path = sys.argv[1]
project_id = sys.argv[2]

with open(path, "r", encoding="utf-8") as handle:
    payload = json.load(handle)

def find_project(value):
    if isinstance(value, dict):
        if value.get("projectId") == project_id:
            return value

        for nested in value.values():
            found = find_project(nested)
            if found is not None:
                return found

    if isinstance(value, list):
        for nested in value:
            found = find_project(nested)
            if found is not None:
                return found

    return None

project = find_project(payload)

if project is None:
    raise SystemExit(1)

state = project.get("state")

if state not in (None, "ACTIVE"):
    raise SystemExit(1)

print("BLAZE_PREFLIGHT_FIREBASE_PROJECT_GATE=PASS")
PYPROJECT

PROJECT_PARSE_RC=$?
rm -f "$PROJECTS_TMP"

if [ "$PROJECT_PARSE_RC" -ne 0 ]; then
  fail "BLAZE_PREFLIGHT_FIREBASE_PROJECT_GATE=FAIL"
fi

for required_file in \
  firebase.json \
  firebase.spark.json \
  backend/package.json \
  backend/functions.js
do
  if [ ! -f "$required_file" ]; then
    fail "BLAZE_PREFLIGHT_REQUIRED_FILE_GATE=FAIL file=$required_file"
  fi
done

echo "BLAZE_PREFLIGHT_REQUIRED_FILE_GATE=PASS"

python3 - <<'PYCONFIG'
from pathlib import Path
import json
import re
import sys

blaze = json.loads(
    Path("firebase.json").read_text(
        encoding="utf-8"
    )
)

spark = json.loads(
    Path("firebase.spark.json").read_text(
        encoding="utf-8"
    )
)

package = json.loads(
    Path("backend/package.json").read_text(
        encoding="utf-8"
    )
)

functions_source = Path(
    "backend/functions.js"
).read_text(
    encoding="utf-8"
)

if "functions" in spark:
    raise SystemExit(1)

spark_rewrites = (
    spark.get("hosting", {})
    .get("rewrites", [])
)

if any(
    isinstance(entry, dict)
    and entry.get("source") == "/api/**"
    for entry in spark_rewrites
):
    raise SystemExit(1)

functions = blaze.get("functions", [])

if not isinstance(functions, list):
    raise SystemExit(1)

matching = [
    item
    for item in functions
    if (
        isinstance(item, dict)
        and item.get("source") == "backend"
        and item.get("codebase") == "api"
    )
]

if len(matching) != 1:
    raise SystemExit(1)

rewrites = (
    blaze.get("hosting", {})
    .get("rewrites", [])
)

api_rewrite = next(
    (
        entry
        for entry in rewrites
        if (
            isinstance(entry, dict)
            and entry.get("source") == "/api/**"
        )
    ),
    None,
)

if not api_rewrite:
    raise SystemExit(1)

function_target = api_rewrite.get(
    "function",
    {}
)

if not (
    function_target.get("functionId") == "api"
    and function_target.get("region") == "asia-south1"
):
    raise SystemExit(1)

if (
    package.get("engines", {}).get("node")
    != "22"
):
    raise SystemExit(1)

required_secret_names = {
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
}

bound_secret_names = set(
    re.findall(
        r'defineSecret\(\s*["\']([^"\']+)["\']\s*\)',
        functions_source,
    )
)

if bound_secret_names != required_secret_names:
    raise SystemExit(1)

print(
    "BLAZE_SECRET_NAMES="
    + ",".join(sorted(required_secret_names))
)
print("BLAZE_PREFLIGHT_SPARK_BLAZE_BOUNDARY_GATE=PASS")
print("BLAZE_PREFLIGHT_NODE22_GATE=PASS")
print("BLAZE_PREFLIGHT_SECRET_NAME_GATE=PASS")
PYCONFIG

CONFIG_RC=$?

if [ "$CONFIG_RC" -ne 0 ]; then
  fail "BLAZE_PREFLIGHT_CONFIG_GATE=FAIL"
fi

echo "BLAZE_BILLING_STATUS=REQUIRES_SEPARATE_VERIFICATION"
echo "BLAZE_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
echo "BLAZE_ACTIVATION_PREFLIGHT_GATE=PASS"
exit 0
