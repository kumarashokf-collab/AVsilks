#!/usr/bin/env bash
set +e
umask 077

PROJECT_ID="demo-avsilks-local"
EMULATOR_SET="auth,firestore,functions,hosting"

SCRIPT_DIR="$(
  cd "$(
    dirname "${BASH_SOURCE[0]}"
  )" &&
  pwd
)"

ROOT="$(
  cd "$SCRIPT_DIR/.." &&
  pwd
)"

WORKDIR=""

cleanup() {
  cleanup_rc=$?

  trap - EXIT INT TERM

  if [ -n "$WORKDIR" ] &&
     [ -d "$WORKDIR" ]; then
    rm -rf "$WORKDIR"

    if [ -e "$WORKDIR" ]; then
      echo "LOCAL_EMULATOR_SANDBOX_CLEANUP_GATE=FAIL"
      exit 91
    fi
  fi

  echo "LOCAL_EMULATOR_SANDBOX_CLEANUP_GATE=PASS"

  exit "$cleanup_rc"
}

trap cleanup EXIT INT TERM

fail() {
  echo "$1"
  echo "EMULATOR_START_STATUS=FAILED_OR_NOT_COMPLETED"
  echo "PRODUCTION_PROJECT_ACCESS_STATUS=NOT_ATTEMPTED"
  echo "PRODUCTION_SECRET_VALUES_STATUS=NOT_ACCESSED"
  echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED"
  echo "LOCAL_EMULATOR_SECRET_ISOLATION_GATE=FAIL"
  exit 1
}

echo "LOCAL_EMULATOR_ISOLATED_LAUNCHER_BEGIN"

for tool in \
  git \
  tar \
  node \
  npm \
  firebase \
  python3 \
  java
do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "LOCAL_EMULATOR_LAUNCHER_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "LOCAL_EMULATOR_LAUNCHER_TOOL_GATE=PASS"

if [ ! -d "$ROOT/backend/node_modules" ]; then
  fail "LOCAL_EMULATOR_BACKEND_DEPENDENCY_GATE=FAIL"
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  fail "LOCAL_EMULATOR_FRONTEND_DEPENDENCY_GATE=FAIL"
fi

if [ ! -d "$ROOT/backend/node_modules/firebase-functions" ]; then
  fail "LOCAL_EMULATOR_FUNCTIONS_SDK_GATE=FAIL"
fi

if [ ! -f "$ROOT/scripts/local-emulator-smoke.py" ]; then
  fail "LOCAL_EMULATOR_SMOKE_SOURCE_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_DEPENDENCY_GATE=PASS"

WORKDIR="$(
  mktemp -d
)"

if [ -z "$WORKDIR" ] ||
   [ ! -d "$WORKDIR" ]; then
  fail "LOCAL_EMULATOR_SANDBOX_CREATE_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_SANDBOX_CREATE_GATE=PASS"

(
  cd "$ROOT" &&
  git archive HEAD
) |
  tar -x -C "$WORKDIR"

pipeline_status=("${PIPESTATUS[@]}")

if [ "${#pipeline_status[@]}" -ne 2 ] ||
   [ "${pipeline_status[0]}" -ne 0 ] ||
   [ "${pipeline_status[1]}" -ne 0 ]; then
  fail "LOCAL_EMULATOR_GIT_ARCHIVE_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_ARCHIVE_PIPELINE_STATUS_GATE=PASS"
echo "LOCAL_EMULATOR_GIT_ARCHIVE_GATE=PASS"

mkdir -p \
  "$WORKDIR/scripts" \
  "$WORKDIR/backend/node_modules"

cp \
  "$ROOT/scripts/local-emulator-smoke.py" \
  "$WORKDIR/scripts/local-emulator-smoke.py"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_SMOKE_COPY_GATE=FAIL"
fi

chmod 700 \
  "$WORKDIR/scripts/local-emulator-smoke.py"

# Build a sandbox dependency view.
# Only the firebase-functions package is copied because
# its Termux-incompatible SDK launcher shebang may need
# adjustment. All other installed packages are read-only
# symlinks back to node_modules.

for dependency in \
  "$ROOT/backend/node_modules"/* \
  "$ROOT/backend/node_modules"/.[!.]*
do
  if [ ! -e "$dependency" ]; then
    continue
  fi

  dependency_name="$(
    basename "$dependency"
  )"

  if [ "$dependency_name" = "firebase-functions" ] ||
     [ "$dependency_name" = ".bin" ]; then
    continue
  fi

  ln -s \
    "$dependency" \
    "$WORKDIR/backend/node_modules/$dependency_name"

  if [ "$?" -ne 0 ]; then
    fail "LOCAL_EMULATOR_BACKEND_DEPENDENCY_LINK_GATE=FAIL"
  fi
done

cp -a \
  "$ROOT/backend/node_modules/firebase-functions" \
  "$WORKDIR/backend/node_modules/firebase-functions"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_FUNCTIONS_SDK_COPY_GATE=FAIL"
fi

ln -s \
  "$ROOT/frontend/node_modules" \
  "$WORKDIR/frontend/node_modules"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_FRONTEND_DEPENDENCY_LINK_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_ISOLATED_DEPENDENCY_GATE=PASS"

NODE_PATH="$(
  command -v node
)"

SDK_TARGET="$WORKDIR/backend/node_modules/firebase-functions/lib/bin/firebase-functions.js"

if [ ! -f "$SDK_TARGET" ]; then
  fail "LOCAL_EMULATOR_SANDBOX_SDK_GATE=FAIL"
fi

python3 - "$SDK_TARGET" "$NODE_PATH" <<'PY_SDK'
from pathlib import Path
import sys

target = Path(
    sys.argv[1]
)

node_path = sys.argv[2]

content = target.read_bytes()

expected = b"#!/usr/bin/env node\n"

if not content.startswith(expected):
    raise SystemExit(1)

patched = (
    f"#!{node_path}\n".encode(
        "utf-8"
    )
    + content[len(expected):]
)

target.write_bytes(
    patched
)
PY_SDK

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_SANDBOX_SDK_PATCH_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_SANDBOX_SDK_PATCH_GATE=PASS"
echo "ORIGINAL_FUNCTIONS_SDK_MODIFIED=False"

SANDBOX_FUNCTIONS_BIN_RELATIVE="backend/node_modules/.bin/firebase-functions"
SANDBOX_BIN_DIR="$WORKDIR/backend/node_modules/.bin"
SANDBOX_FUNCTIONS_BIN="$WORKDIR/$SANDBOX_FUNCTIONS_BIN_RELATIVE"

mkdir -p "$SANDBOX_BIN_DIR"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_SANDBOX_BIN_CREATE_GATE=FAIL"
fi

ln -s   "../firebase-functions/lib/bin/firebase-functions.js"   "$SANDBOX_FUNCTIONS_BIN"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_SANDBOX_BIN_LINK_GATE=FAIL"
fi

SANDBOX_BIN_TARGET="$(
  readlink -f "$SANDBOX_FUNCTIONS_BIN"
)"

if [ "$SANDBOX_BIN_TARGET" != "$SDK_TARGET" ]; then
  fail "LOCAL_EMULATOR_SANDBOX_BIN_TARGET_GATE=FAIL"
fi

SANDBOX_BIN_FIRST_LINE="$(
  IFS= read -r line < "$SANDBOX_BIN_TARGET"
  printf '%s' "$line"
)"

if [ "$SANDBOX_BIN_FIRST_LINE" != "#!$NODE_PATH" ]; then
  fail "LOCAL_EMULATOR_SANDBOX_BIN_SHEBANG_GATE=FAIL"
fi

echo "SANDBOX_FIREBASE_FUNCTIONS_BIN=$SANDBOX_FUNCTIONS_BIN"
echo "LOCAL_EMULATOR_SANDBOX_BIN_ISOLATION_GATE=PASS"

# Replace repository Firebase alias inside the sandbox.
# The launcher also passes the demo project explicitly.

printf \
  '{"projects":{"default":"%s"}}\n' \
  "$PROJECT_ID" \
  > "$WORKDIR/.firebaserc"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_DEMO_PROJECT_CONFIG_GATE=FAIL"
fi

# The sandbox is produced from tracked Git content only.
# No working-tree env files are copied.

if [ -e "$WORKDIR/backend/.env" ] ||
   [ -e "$WORKDIR/backend/.env.server.local" ]; then
  fail "LOCAL_EMULATOR_PRODUCTION_ENV_ISOLATION_GATE=FAIL"
fi

SECRET_NAMES=(
  RAZORPAY_KEY_ID
  RAZORPAY_KEY_SECRET
  RAZORPAY_WEBHOOK_SECRET
)

{
  printf '%s=%s\n' \
    "${SECRET_NAMES[0]}" \
    "local_synthetic_key_id"

  printf '%s=%s\n' \
    "${SECRET_NAMES[1]}" \
    "local_synthetic_key_secret"

  printf '%s=%s\n' \
    "${SECRET_NAMES[2]}" \
    "local_synthetic_webhook_secret"
} > "$WORKDIR/backend/.secret.local"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_SYNTHETIC_SECRET_FILE_GATE=FAIL"
fi

printf \
  '%s\n' \
  'AVSILKS_LOCAL_EMULATOR=1' \
  > "$WORKDIR/backend/.env.local"

if [ "$?" -ne 0 ]; then
  fail "LOCAL_EMULATOR_LOCAL_ENV_FILE_GATE=FAIL"
fi

chmod 600 \
  "$WORKDIR/backend/.secret.local" \
  "$WORKDIR/backend/.env.local"

echo "LOCAL_EMULATOR_SYNTHETIC_SECRET_GATE=PASS"
echo "LOCAL_EMULATOR_LOCAL_ENV_GATE=PASS"

# Remove inherited credentials / production configuration from
# the parent shell before the emulator process is created.

unset FIREBASE_PROJECT_ID
unset FIREBASE_CLIENT_EMAIL
unset FIREBASE_PRIVATE_KEY
unset FIREBASE_CONFIG
unset GOOGLE_APPLICATION_CREDENTIALS
unset GOOGLE_CLOUD_QUOTA_PROJECT
unset CLOUDSDK_CORE_PROJECT

unset RAZORPAY_KEY_ID
unset RAZORPAY_KEY_SECRET
unset RAZORPAY_WEBHOOK_SECRET

export GCLOUD_PROJECT="$PROJECT_ID"
export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"

echo "LOCAL_EMULATOR_INHERITED_CREDENTIAL_ISOLATION_GATE=PASS"

# Build Hosting assets inside the disposable sandbox.

(
  cd "$WORKDIR/frontend" &&
  npm run build
)

BUILD_RC=$?

if [ "$BUILD_RC" -ne 0 ]; then
  fail "LOCAL_EMULATOR_FRONTEND_BUILD_GATE=FAIL"
fi

if [ ! -f "$WORKDIR/frontend/dist/index.html" ]; then
  fail "LOCAL_EMULATOR_FRONTEND_DIST_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_FRONTEND_BUILD_GATE=PASS"

# All runtime activity below is against demo-avsilks-local
# and localhost emulators only.

(
  cd "$WORKDIR" &&
  firebase emulators:exec \
    --only "$EMULATOR_SET" \
    --project "$PROJECT_ID" \
    --config firebase.json \
    --non-interactive \
    "python3 scripts/local-emulator-smoke.py"
)

EMULATOR_RC=$?

if [ "$EMULATOR_RC" -ne 0 ]; then
  fail "LOCAL_EMULATOR_EXECUTION_GATE=FAIL"
fi

echo "LOCAL_EMULATOR_EXECUTION_GATE=PASS"
echo "LOCAL_EMULATOR_SECRET_ISOLATION_GATE=PASS"
echo "EMULATOR_START_STATUS=STARTED_TESTED_AND_STOPPED"
echo "PRODUCTION_PROJECT_ACCESS_STATUS=NOT_ATTEMPTED"
echo "PRODUCTION_SECRET_VALUES_STATUS=NOT_ACCESSED"
echo "CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED"
