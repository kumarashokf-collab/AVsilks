#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"
PRODUCTION_PROJECT_ID="avsilks-5e81a"

TMP_DIR=""

cleanup() {
  cleanup_rc=$?

  trap - EXIT INT TERM

  if [ -n "$TMP_DIR" ] &&
     [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi

  exit "$cleanup_rc"
}

trap cleanup EXIT INT TERM

fail() {
  echo "$1"
  echo "STAGING_PROJECT_STATUS=NOT_FOUND"
  echo "STAGING_PROJECT_BOOTSTRAP_STATUS=BLOCKED_REQUIRES_EXPLICIT_APPROVAL"
  echo "BLAZE_BILLING_STATUS=NOT_CHECKED_NOT_INFERRED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED"
  echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_PROJECT_PREFLIGHT_GATE=FAIL"
  exit 1
}

echo "STAGING_PROJECT_PREFLIGHT_BEGIN"

for tool in git firebase python3
do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_PREFLIGHT_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_PREFLIGHT_TOOL_GATE=PASS"

BRANCH="$(
  git branch --show-current
)"

if [ "$?" -ne 0 ] ||
   [ "$BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_PREFLIGHT_BRANCH_GATE=FAIL"
fi

echo "STAGING_PREFLIGHT_BRANCH_GATE=PASS"

TMP_DIR="$(
  mktemp -d
)"

if [ "$?" -ne 0 ] ||
   [ -z "$TMP_DIR" ] ||
   [ ! -d "$TMP_DIR" ]; then
  fail "STAGING_PREFLIGHT_TEMP_GATE=FAIL"
fi

PROJECT_JSON="$TMP_DIR/projects.json"
PROJECT_ERROR="$TMP_DIR/projects.err"

# Strictly read-only Firebase discovery.
firebase projects:list --json \
  > "$PROJECT_JSON" \
  2> "$PROJECT_ERROR"

PROJECT_LIST_RC=$?

if [ "$PROJECT_LIST_RC" -ne 0 ]; then
  fail "STAGING_PREFLIGHT_PROJECT_LIST_GATE=FAIL"
fi

if [ ! -s "$PROJECT_JSON" ]; then
  fail "STAGING_PREFLIGHT_PROJECT_JSON_GATE=FAIL"
fi

echo "STAGING_PREFLIGHT_PROJECT_LIST_GATE=PASS"

ANALYSIS="$(
  python3 - \
    "$PROJECT_JSON" \
    "$PRODUCTION_PROJECT_ID" <<'PY_PROJECTS'
from pathlib import Path
import json
import sys

json_path = Path(sys.argv[1])
production_id = sys.argv[2]

try:
    payload = json.loads(
        json_path.read_text(
            encoding="utf-8"
        )
    )
except Exception:
    print(
        "STAGING_PREFLIGHT_PROJECT_JSON_PARSE_GATE=FAIL"
    )
    raise SystemExit(2)

items = []

if isinstance(payload, dict):
    result = payload.get(
        "result",
        payload,
    )

    if isinstance(result, list):
        items = result

    elif isinstance(result, dict):
        for key in (
            "projects",
            "results",
            "items",
        ):
            candidate = result.get(key)

            if isinstance(candidate, list):
                items = candidate
                break

elif isinstance(payload, list):
    items = payload

project_ids = []

for item in items:
    if not isinstance(item, dict):
        continue

    project_id = (
        item.get("projectId")
        or item.get("project_id")
        or item.get("id")
    )

    if (
        isinstance(project_id, str)
        and project_id.strip()
    ):
        project_ids.append(
            project_id.strip()
        )

project_ids = sorted(
    set(project_ids)
)

if not project_ids:
    print(
        "STAGING_PREFLIGHT_ACCESSIBLE_PROJECT_GATE=FAIL"
    )
    raise SystemExit(3)

if production_id not in project_ids:
    print(
        "STAGING_PREFLIGHT_PRODUCTION_IDENTITY_GATE=FAIL"
    )
    raise SystemExit(4)

possible_staging = [
    project_id
    for project_id in project_ids
    if (
        project_id != production_id
        and "avsilks" in project_id.lower()
    )
]

print(
    "STAGING_PREFLIGHT_PROJECT_JSON_PARSE_GATE=PASS"
)
print(
    "STAGING_PREFLIGHT_ACCESSIBLE_PROJECT_GATE=PASS"
)
print(
    "STAGING_PREFLIGHT_PRODUCTION_IDENTITY_GATE=PASS"
)
print(
    "ACCESSIBLE_PROJECT_COUNT="
    + str(len(project_ids))
)
print(
    "AVSILKS_STAGING_CANDIDATE_COUNT="
    + str(len(possible_staging))
)

if possible_staging:
    print(
        "STAGING_PROJECT_STATUS="
        "CANDIDATE_FOUND_REQUIRES_EXPLICIT_APPROVAL"
    )
else:
    print(
        "STAGING_PROJECT_STATUS=NOT_FOUND"
    )

print(
    "STAGING_PROJECT_BOOTSTRAP_STATUS="
    "BLOCKED_REQUIRES_EXPLICIT_APPROVAL"
)
print(
    "BLAZE_BILLING_STATUS=NOT_CHECKED_NOT_INFERRED"
)
print(
    "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
)
print(
    "FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED"
)
print(
    "SECRET_VALUES_STATUS=NOT_ACCESSED"
)
PY_PROJECTS
)"

ANALYSIS_RC=$?

printf '%s\n' "$ANALYSIS"

if [ "$ANALYSIS_RC" -ne 0 ]; then
  fail "STAGING_PREFLIGHT_ANALYSIS_GATE=FAIL"
fi

echo "STAGING_PREFLIGHT_ANALYSIS_GATE=PASS"
echo "STAGING_PROJECT_PREFLIGHT_GATE=PASS"
