#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"
STAGING_PROJECT_ID="avsilks-staging-20260820-01"
PRODUCTION_PROJECT_ID="avsilks-5e81a"
FIREBASE_RC=".firebaserc"
FUNCTIONS_ENTRYPOINT="backend/functions.js"

fail() {
  echo "$1"
  echo "STAGING_SECRET_NAMES=RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET,RAZORPAY_WEBHOOK_SECRET"
  echo "STAGING_SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "STAGING_SECRET_WRITE_STATUS=NOT_ATTEMPTED"
  echo "STAGING_SECRET_PROVISIONING_STATUS=BLOCKED_UNTIL_BLAZE_AND_EXPLICIT_APPROVAL"
  echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
  echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_SECRET_READINESS_GATE=FAIL"
  exit 1
}

echo "STAGING_SECRET_READINESS_BEGIN"

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_SECRET_BRANCH_GATE=FAIL"
fi

echo "STAGING_SECRET_BRANCH_GATE=PASS"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_SECRET_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "STAGING_SECRET_CLEAN_WORKTREE_GATE=PASS"

for tool in git python3 node; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_SECRET_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_SECRET_TOOL_GATE=PASS"

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] || [ -z "$REMOTE_SHA" ]; then
  fail "STAGING_SECRET_REMOTE_RESOLUTION_GATE=FAIL"
fi

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "STAGING_SECRET_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_SECRET_REMOTE_HASH_GATE=PASS"

if [ ! -f "$FIREBASE_RC" ]; then
  fail "STAGING_SECRET_FIREBASERC_GATE=FAIL"
fi

if [ ! -f "$FUNCTIONS_ENTRYPOINT" ]; then
  fail "STAGING_SECRET_FUNCTIONS_FILE_GATE=FAIL"
fi

echo "STAGING_SECRET_REQUIRED_FILE_GATE=PASS"

python3 - \
  "$FIREBASE_RC" \
  "$FUNCTIONS_ENTRYPOINT" \
  "$STAGING_PROJECT_ID" \
  "$PRODUCTION_PROJECT_ID" <<'PYVERIFY'
from pathlib import Path
import json
import re
import sys

firebaserc_path = Path(sys.argv[1])
functions_path = Path(sys.argv[2])
staging_id = sys.argv[3]
production_id = sys.argv[4]

expected = {
    "razorpayKeyId": "RAZORPAY_KEY_ID",
    "razorpayKeySecret": "RAZORPAY_KEY_SECRET",
    "razorpayWebhookSecret": "RAZORPAY_WEBHOOK_SECRET",
}

config = json.loads(
    firebaserc_path.read_text(
        encoding="utf-8"
    )
)

projects = config.get("projects")

if not isinstance(projects, dict):
    raise SystemExit(10)

if projects.get("staging") != staging_id:
    raise SystemExit(11)

if projects.get("default") != production_id:
    raise SystemExit(12)

if projects.get("staging") == projects.get("default"):
    raise SystemExit(13)

source = functions_path.read_text(
    encoding="utf-8"
)

pattern = re.compile(
    r"const\s+([A-Za-z_$][A-Za-z0-9_$]*)"
    r"\s*=\s*defineSecret\("
    r"\s*[\"']([^\"']+)[\"']\s*\)\s*;"
)

declarations = dict(
    pattern.findall(source)
)

if declarations != expected:
    raise SystemExit(20)

array_match = re.search(
    r"secrets\s*:\s*\[(.*?)\]",
    source,
    re.S,
)

if array_match is None:
    raise SystemExit(21)

bound = set(
    re.findall(
        r"\b[A-Za-z_$][A-Za-z0-9_$]*\b",
        array_match.group(1),
    )
)

if bound != set(expected.keys()):
    raise SystemExit(22)

for secret_name in expected.values():
    matches = re.findall(
        r"defineSecret\(\s*[\"']"
        + re.escape(secret_name)
        + r"[\"']\s*\)",
        source,
    )

    if len(matches) != 1:
        raise SystemExit(23)

print("STAGING_SECRET_ALIAS_ISOLATION_GATE=PASS")
print("STAGING_SECRET_DECLARATION_GATE=PASS")
print("STAGING_SECRET_FUNCTION_BINDING_GATE=PASS")
PYVERIFY

VERIFY_RC=$?

if [ "$VERIFY_RC" -ne 0 ]; then
  fail "STAGING_SECRET_CONTRACT_GATE=FAIL code=$VERIFY_RC"
fi

echo "STAGING_SECRET_CONTRACT_GATE=PASS"
echo "STAGING_SECRET_TARGET=STAGING"
echo "STAGING_PROJECT_ID=$STAGING_PROJECT_ID"
echo "PRODUCTION_PROJECT_ID=$PRODUCTION_PROJECT_ID"
echo "STAGING_SECRET_NAMES=RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET,RAZORPAY_WEBHOOK_SECRET"
echo "STAGING_SECRET_VALUES_STATUS=NOT_ACCESSED"
echo "STAGING_SECRET_WRITE_STATUS=NOT_ATTEMPTED"
echo "STAGING_SECRET_PROVISIONING_STATUS=BLOCKED_UNTIL_BLAZE_AND_EXPLICIT_APPROVAL"
echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_SECRET_READINESS_GATE=PASS"
exit 0
