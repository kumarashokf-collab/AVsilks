#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077

readonly PROJECT_ID="demo-avsilks-local"
readonly EMULATOR_SET="auth,firestore,functions,hosting"

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

cd "$ROOT"

fail() {
  printf 'STOP: %s\n' "$1" >&2
  exit 1
}

MODE="${1:-start}"

if [ "$#" -gt 0 ]; then
  shift
fi

case "$MODE" in
  check|start)
    ;;
  *)
    fail "usage: $0 [check|start]"
    ;;
esac

if [ "$#" -ne 0 ]; then
  fail "unexpected extra arguments"
fi

NODE_PATH="$(command -v node || true)"
FIREBASE_COMMAND="$(command -v firebase || true)"

[ -n "$NODE_PATH" ] ||
  fail "Node executable not found"

[ -n "$FIREBASE_COMMAND" ] ||
  fail "Firebase CLI not found"

FIREBASE_JS="$(
  readlink -f "$FIREBASE_COMMAND"
)"

CONFIG_FILE="$ROOT/firebase.json"

IMPORT_DIR="${AVSILKS_EMULATOR_IMPORT_DIR:-}"
IMPORT_ARGS=()

if [ -n "$IMPORT_DIR" ]; then
  [ -d "$IMPORT_DIR" ] ||
    fail "emulator import directory does not exist"

  IMPORT_DIR="$(
    readlink -f "$IMPORT_DIR"
  )"

  [ -f "$IMPORT_DIR/firebase-export-metadata.json" ] ||
    fail "emulator import metadata is missing"

  IMPORT_ARGS=(
    --import
    "$IMPORT_DIR"
  )
fi

SDK_TARGET="$ROOT/backend/node_modules/firebase-functions/lib/bin/firebase-functions.js"

LOCAL_SERVER_ENV="$ROOT/backend/.env.server.local"
RESERVED_FUNCTIONS_ENV="$ROOT/backend/.env"

[ -x "$NODE_PATH" ] ||
  fail "Node executable is not executable"

[ -f "$FIREBASE_JS" ] ||
  fail "Firebase CLI JavaScript entry is missing"

[ -f "$CONFIG_FILE" ] ||
  fail "firebase.json is missing"

[ -f "$SDK_TARGET" ] ||
  fail "firebase-functions SDK binary is missing"

[ -f "$LOCAL_SERVER_ENV" ] ||
  fail "backend/.env.server.local is missing"

[ ! -e "$RESERVED_FUNCTIONS_ENV" ] ||
  fail "reserved backend/.env must remain absent"

FIRST_LINE="$(
  IFS= read -r line < "$SDK_TARGET"
  printf '%s' "$line"
)"

[ "$FIRST_LINE" = '#!/usr/bin/env node' ] ||
  fail "unexpected firebase-functions SDK shebang"

printf 'TERMUX_EMULATOR_LAUNCHER_CHECK=PASS\n'
printf 'PROJECT_ROOT=%s\n' "$ROOT"
printf 'PROJECT_ID=%s\n' "$PROJECT_ID"
printf 'EMULATORS=%s\n' "$EMULATOR_SET"
printf 'NODE_PATH=%s\n' "$NODE_PATH"
printf 'FIREBASE_JS=%s\n' "$FIREBASE_JS"
printf 'SDK_ORIGINAL_SHEBANG=%s\n' "$FIRST_LINE"
printf 'BILLING_ENABLED=False\n'
printf 'CLOUD_DEPLOYMENT_PERFORMED=False\n'
printf 'PRODUCTION_RULES_DEPLOYED=False\n'

if [ "${#IMPORT_ARGS[@]}" -gt 0 ]; then
  printf 'EMULATOR_IMPORT_ENABLED=True\n'
  printf 'EMULATOR_IMPORT_DIR=%s\n' "$IMPORT_DIR"
else
  printf 'EMULATOR_IMPORT_ENABLED=False\n'
fi

if [ "$MODE" = "check" ]; then
  exit 0
fi

AUDIT_ROOT="$HOME/avsilks-local-audits"
AUDIT="$AUDIT_ROOT/termux-safe-emulators-$(date +%Y%m%d-%H%M%S)-$$"

LOCK_ROOT="$HOME/.cache"
LOCK_DIR="$LOCK_ROOT/avsilks-termux-emulators.lock"

mkdir -p "$AUDIT_ROOT" "$LOCK_ROOT"

if [ -d "$LOCK_DIR" ]; then
  EXISTING_PID=""

  if [ -f "$LOCK_DIR/pid" ]; then
    EXISTING_PID="$(
      cat "$LOCK_DIR/pid" 2>/dev/null || true
    )"
  fi

  if (
    [ -n "$EXISTING_PID" ] &&
    kill -0 "$EXISTING_PID" 2>/dev/null
  ); then
    fail "another AVsilks emulator launcher is already running"
  fi

  rm -rf "$LOCK_DIR"
fi

mkdir "$LOCK_DIR"
printf '%s\n' "$$" > "$LOCK_DIR/pid"

mkdir -p "$AUDIT"

BACKUP="$AUDIT/firebase-functions.js.original"
LOG_FILE="$AUDIT/emulators.log"

cp -p "$SDK_TARGET" "$BACKUP"

ORIGINAL_HASH="$(
  sha256sum "$BACKUP" |
  awk '{print $1}'
)"

ORIGINAL_MODE="$(
  stat -c '%a' "$SDK_TARGET"
)"

CHILD_PID=""

restore_and_exit() {
  local exit_code=$?

  trap - EXIT INT TERM HUP

  if (
    [ -n "$CHILD_PID" ] &&
    kill -0 "$CHILD_PID" 2>/dev/null
  ); then
    kill -INT "$CHILD_PID" 2>/dev/null || true
    wait "$CHILD_PID" 2>/dev/null || true
  fi

  if [ -f "$BACKUP" ]; then
    cp -p "$BACKUP" "$SDK_TARGET" ||
      exit_code=90

    chmod "$ORIGINAL_MODE" "$SDK_TARGET" ||
      exit_code=91

    RESTORED_HASH="$(
      sha256sum "$SDK_TARGET" |
      awk '{print $1}'
    )"

    printf 'SDK_ORIGINAL_SHA256=%s\n' "$ORIGINAL_HASH"
    printf 'SDK_RESTORED_SHA256=%s\n' "$RESTORED_HASH"

    if [ "$RESTORED_HASH" != "$ORIGINAL_HASH" ]; then
      printf 'STOP: SDK restoration hash mismatch\n' >&2
      exit_code=92
    else
      printf 'SDK_TARGET_RESTORED_EXACTLY=True\n'
    fi
  fi

  rm -rf "$LOCK_DIR"

  exit "$exit_code"
}

forward_signal() {
  if (
    [ -n "$CHILD_PID" ] &&
    kill -0 "$CHILD_PID" 2>/dev/null
  ); then
    kill -INT "$CHILD_PID" 2>/dev/null || true
  fi

  exit 130
}

trap restore_and_exit EXIT
trap forward_signal INT TERM HUP

python - "$SDK_TARGET" "$NODE_PATH" <<'PY_PATCH'
from pathlib import Path
import hashlib
import sys

target = Path(sys.argv[1])
node_path = sys.argv[2]

original = target.read_bytes()
expected = b"#!/usr/bin/env node\n"

if not original.startswith(expected):
    raise SystemExit(
        "STOP: SDK shebang changed before temporary patch"
    )

patched = (
    f"#!{node_path}\n".encode("utf-8")
    + original[len(expected):]
)

target.write_bytes(patched)

print(
    "SDK_TEMPORARY_SHEBANG="
    + f"#!{node_path}"
)

print(
    "SDK_TEMPORARY_SHA256="
    + hashlib.sha256(patched).hexdigest()
)

print("SDK_TEMPORARY_PATCH_APPLIED=True")
PY_PATCH

chmod "$ORIGINAL_MODE" "$SDK_TARGET"

printf 'AUDIT_EVIDENCE=%s\n' "$AUDIT"
printf 'STARTING_LOCAL_DEMO_EMULATORS=True\n'

"$NODE_PATH" \
  "$FIREBASE_JS" \
  emulators:start \
  --only "$EMULATOR_SET" \
  --project "$PROJECT_ID" \
  --config "$CONFIG_FILE" \
  --non-interactive \
  "${IMPORT_ARGS[@]}" \
  > >(tee "$LOG_FILE") \
  2>&1 &

CHILD_PID=$!

set +e
wait "$CHILD_PID"
EMULATOR_EXIT_CODE=$?
set -e

CHILD_PID=""

printf 'EMULATOR_EXIT_CODE=%s\n' "$EMULATOR_EXIT_CODE"

exit "$EMULATOR_EXIT_CODE"
