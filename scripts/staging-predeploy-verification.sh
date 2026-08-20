#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"

fail() {
  echo "$1"
  echo "STAGING_PREDEPLOY_APPROVAL_STATUS=REQUIRES_EXPLICIT_APPROVAL"
  echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
  echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "SECRET_WRITE_STATUS=NOT_ATTEMPTED"
  echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "STAGING_PREDEPLOY_VERIFICATION_GATE=FAIL"
  exit 1
}

echo "STAGING_PREDEPLOY_VERIFICATION_BEGIN"

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "STAGING_PREDEPLOY_BRANCH_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_BRANCH_GATE=PASS"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_PREDEPLOY_CLEAN_WORKTREE_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_CLEAN_WORKTREE_GATE=PASS"

for tool in git firebase python3 node npm; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "STAGING_PREDEPLOY_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "STAGING_PREDEPLOY_TOOL_GATE=PASS"

LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$LOCAL_SHA" ] || [ -z "$REMOTE_SHA" ]; then
  fail "STAGING_PREDEPLOY_REMOTE_RESOLUTION_GATE=FAIL"
fi

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  fail "STAGING_PREDEPLOY_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_REMOTE_HASH_GATE=PASS"

TMP_DIR="$(mktemp -d 2>/dev/null)"

if [ -z "$TMP_DIR" ] || [ ! -d "$TMP_DIR" ]; then
  fail "STAGING_PREDEPLOY_TEMP_GATE=FAIL"
fi

cleanup() {
  rm -rf "$TMP_DIR"
}

run_guard() {
  GUARD_PATH="$1"
  REQUIRED_MARKER="$2"
  OUTPUT_NAME="$3"

  if [ ! -x "$GUARD_PATH" ]; then
    cleanup
    fail "STAGING_PREDEPLOY_REQUIRED_GUARD_GATE=FAIL file=$GUARD_PATH"
  fi

  GUARD_OUT="$TMP_DIR/$OUTPUT_NAME.out"

  bash "$GUARD_PATH" >"$GUARD_OUT" 2>&1
  GUARD_RC=$?

  cat "$GUARD_OUT"

  if [ "$GUARD_RC" -ne 0 ]; then
    cleanup
    fail "STAGING_PREDEPLOY_CHILD_GATE=FAIL guard=$OUTPUT_NAME"
  fi

  grep -Fq "$REQUIRED_MARKER" "$GUARD_OUT"

  if [ "$?" -ne 0 ]; then
    cleanup
    fail "STAGING_PREDEPLOY_CHILD_MARKER_GATE=FAIL guard=$OUTPUT_NAME"
  fi
}

echo "=== STAGING PREDEPLOY ENVIRONMENT CHECK ==="

run_guard \
  "scripts/staging-environment-preflight.sh" \
  "STAGING_ENVIRONMENT_BOUNDARY_GATE=PASS" \
  "environment"

echo "STAGING_PREDEPLOY_ENVIRONMENT_GATE=PASS"

echo "=== STAGING PREDEPLOY SECRET CHECK ==="

run_guard \
  "scripts/staging-secret-readiness.sh" \
  "STAGING_SECRET_READINESS_GATE=PASS" \
  "secret"

echo "STAGING_PREDEPLOY_SECRET_GATE=PASS"

echo "=== STAGING PREDEPLOY DEPLOYMENT IDENTITY CHECK ==="

run_guard \
  "scripts/staging-deploy-preflight.sh" \
  "STAGING_DEPLOY_PREFLIGHT_GATE=PASS" \
  "deployment"

echo "STAGING_PREDEPLOY_DEPLOYMENT_IDENTITY_GATE=PASS"

echo "=== STAGING PREDEPLOY BACKEND REGRESSION ==="

BACKEND_OUT="$TMP_DIR/backend-tests.out"

(
  cd backend || exit 1
  npm test
) >"$BACKEND_OUT" 2>&1

BACKEND_RC=$?

tail -40 "$BACKEND_OUT"

if [ "$BACKEND_RC" -ne 0 ]; then
  cleanup
  fail "STAGING_PREDEPLOY_BACKEND_TEST_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_BACKEND_TEST_GATE=PASS"

echo "=== STAGING PREDEPLOY FRONTEND BUILD ==="

FRONTEND_OUT="$TMP_DIR/frontend-build.out"

(
  cd frontend || exit 1
  npm run build
) >"$FRONTEND_OUT" 2>&1

FRONTEND_RC=$?

tail -30 "$FRONTEND_OUT"

if [ "$FRONTEND_RC" -ne 0 ]; then
  cleanup
  fail "STAGING_PREDEPLOY_FRONTEND_BUILD_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_FRONTEND_BUILD_GATE=PASS"

cleanup

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  fail "STAGING_PREDEPLOY_FINAL_WORKTREE_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_FINAL_WORKTREE_GATE=PASS"

FINAL_LOCAL_SHA="$(git rev-parse HEAD 2>/dev/null)"

FINAL_REMOTE_SHA="$(
  git ls-remote github "refs/heads/$EXPECTED_BRANCH" 2>/dev/null |
  awk '{print $1}'
)"

if [ -z "$FINAL_LOCAL_SHA" ] || [ -z "$FINAL_REMOTE_SHA" ]; then
  fail "STAGING_PREDEPLOY_FINAL_REMOTE_RESOLUTION_GATE=FAIL"
fi

if [ "$FINAL_LOCAL_SHA" != "$FINAL_REMOTE_SHA" ]; then
  fail "STAGING_PREDEPLOY_FINAL_REMOTE_HASH_GATE=FAIL"
fi

echo "STAGING_PREDEPLOY_FINAL_REMOTE_HASH_GATE=PASS"
echo "STAGING_PREDEPLOY_APPROVAL_STATUS=REQUIRES_EXPLICIT_APPROVAL"
echo "STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED"
echo "SECRET_VALUES_STATUS=NOT_ACCESSED"
echo "SECRET_WRITE_STATUS=NOT_ATTEMPTED"
echo "PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED"
echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "STAGING_PREDEPLOY_VERIFICATION_GATE=PASS"
exit 0
