#!/usr/bin/env python3

from pathlib import Path
import fnmatch
import json
import os
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

FIREBASE_CONFIG = ROOT / "firebase.json"
BACKEND_PACKAGE = ROOT / "backend/package.json"
FUNCTIONS_ENTRY = ROOT / "backend/functions.js"
BACKEND_ROOT = ROOT / "backend"

REQUIRED_SECRET_NAMES = {
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
}

REQUIRED_IGNORES = {
    "node_modules",
    ".git",
    ".runtimeconfig.json",
    "firebase-debug.log",
    "firebase-debug.*.log",
    "*.local",
    ".env",
    ".env.*",
    "test",
    "coverage",
    "*.log",
    "*serviceAccount*.json",
    "*firebase-admin-key*.json",
    "*.pem",
    "*.key",
    ".backups",
    "backups",
}

DIRECTORY_EXCLUSIONS = {
    "node_modules",
    ".git",
    "test",
    "coverage",
    ".backups",
    "backups",
}

def stop(marker):
    print(marker)
    print("CLOUD_MUTATION_STATUS=NOT_ATTEMPTED")
    print("FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED")
    print("SECRET_VALUES_STATUS=NOT_ACCESSED")
    print("LOCAL_FUNCTIONS_PACKAGE_INSPECTION_GATE=FAIL")
    raise SystemExit(1)

def read_json(path):
    try:
        return json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception:
        stop("LOCAL_PACKAGE_JSON_PARSE_GATE=FAIL")

def matches_ignore(relative_path, patterns):
    posix = relative_path.as_posix()
    basename = relative_path.name

    for pattern in patterns:
        if pattern in DIRECTORY_EXCLUSIONS:
            if pattern in relative_path.parts:
                return True

        if fnmatch.fnmatch(
            posix,
            pattern
        ):
            return True

        if fnmatch.fnmatch(
            basename,
            pattern
        ):
            return True

    return False

def forbidden_candidate(relative_path):
    lowered_parts = {
        part.lower()
        for part in relative_path.parts
    }

    name = relative_path.name
    lowered = name.lower()

    if lowered_parts.intersection({
        "node_modules",
        ".git",
        "test",
        "coverage",
        ".backups",
        "backups",
    }):
        return True

    if lowered == ".runtimeconfig.json":
        return True

    if lowered == ".env":
        return True

    if lowered.startswith(".env."):
        return True

    if lowered.endswith(".pem"):
        return True

    if lowered.endswith(".key"):
        return True

    if lowered.endswith(".log"):
        return True

    if "serviceaccount" in lowered and lowered.endswith(".json"):
        return True

    if (
        "firebase-admin-key"
        in lowered
        and lowered.endswith(".json")
    ):
        return True

    return False

print("LOCAL_FUNCTIONS_PACKAGE_INSPECTION_BEGIN")

for required_path in [
    FIREBASE_CONFIG,
    BACKEND_PACKAGE,
    FUNCTIONS_ENTRY,
    BACKEND_ROOT,
]:
    if not required_path.exists():
        stop(
            "LOCAL_PACKAGE_REQUIRED_PATH_GATE=FAIL"
        )

print("LOCAL_PACKAGE_REQUIRED_PATH_GATE=PASS")

firebase = read_json(
    FIREBASE_CONFIG
)

package = read_json(
    BACKEND_PACKAGE
)

functions = firebase.get(
    "functions"
)

if not (
    isinstance(functions, list)
    and len(functions) == 1
):
    stop(
        "LOCAL_PACKAGE_FUNCTION_CONFIG_GATE=FAIL"
    )

config = functions[0]

source = config.get(
    "source"
)

codebase = config.get(
    "codebase"
)

if source != "backend":
    stop(
        "LOCAL_PACKAGE_SOURCE_GATE=FAIL"
    )

if codebase != "api":
    stop(
        "LOCAL_PACKAGE_CODEBASE_GATE=FAIL"
    )

if config.get(
    "disallowLegacyRuntimeConfig"
) is not True:
    stop(
        "LOCAL_PACKAGE_LEGACY_CONFIG_GATE=FAIL"
    )

ignore_patterns = config.get(
    "ignore"
)

if not isinstance(
    ignore_patterns,
    list
):
    stop(
        "LOCAL_PACKAGE_IGNORE_LIST_GATE=FAIL"
    )

ignore_set = set(
    ignore_patterns
)

missing_ignores = (
    REQUIRED_IGNORES
    - ignore_set
)

if missing_ignores:
    stop(
        "LOCAL_PACKAGE_IGNORE_CONTRACT_GATE=FAIL"
    )

print(
    "LOCAL_PACKAGE_SOURCE="
    + source
)
print(
    "LOCAL_PACKAGE_CODEBASE="
    + codebase
)
print(
    "LOCAL_PACKAGE_IGNORE_CONTRACT_GATE=PASS"
)

runtime = (
    package
    .get("engines", {})
    .get("node")
)

entrypoint = package.get(
    "main"
)

if runtime != "22":
    stop(
        "LOCAL_PACKAGE_NODE22_GATE=FAIL"
    )

if entrypoint != "functions.js":
    stop(
        "LOCAL_PACKAGE_ENTRYPOINT_GATE=FAIL"
    )

if not FUNCTIONS_ENTRY.is_file():
    stop(
        "LOCAL_PACKAGE_ENTRYPOINT_GATE=FAIL"
    )

print(
    "LOCAL_PACKAGE_NODE_RUNTIME="
    + runtime
)
print(
    "LOCAL_PACKAGE_ENTRYPOINT="
    + entrypoint
)

functions_source = FUNCTIONS_ENTRY.read_text(
    encoding="utf-8"
)

bound_secret_names = set(
    re.findall(
        r'defineSecret\(\s*["\']([^"\']+)["\']\s*\)',
        functions_source,
    )
)

if bound_secret_names != REQUIRED_SECRET_NAMES:
    stop(
        "LOCAL_PACKAGE_SECRET_NAME_BINDING_GATE=FAIL"
    )

if not re.search(
    r'exports\.api\s*=\s*onRequest\s*\(',
    functions_source,
):
    stop(
        "LOCAL_PACKAGE_ENTRYPOINT_GATE=FAIL"
    )

if not re.search(
    r'region\s*:\s*["\']asia-south1["\']',
    functions_source,
):
    stop(
        "LOCAL_PACKAGE_REGION_GATE=FAIL"
    )

if not re.search(
    r'maxInstances\s*:\s*2\b',
    functions_source,
):
    stop(
        "LOCAL_PACKAGE_SCALE_GATE=FAIL"
    )

print(
    "LOCAL_PACKAGE_SECRET_NAMES="
    + ",".join(
        sorted(
            REQUIRED_SECRET_NAMES
        )
    )
)
print(
    "LOCAL_PACKAGE_SECRET_NAME_BINDING_GATE=PASS"
)
print(
    "LOCAL_PACKAGE_ENTRYPOINT_GATE=PASS"
)
print(
    "LOCAL_PACKAGE_NODE22_GATE=PASS"
)
print(
    "LOCAL_PACKAGE_REGION_GATE=PASS"
)
print(
    "LOCAL_PACKAGE_SCALE_GATE=PASS"
)

candidate_files = []

for current_root, dirnames, filenames in os.walk(
    BACKEND_ROOT
):
    current = Path(
        current_root
    )

    retained_dirs = []

    for dirname in dirnames:
        directory_path = (
            current / dirname
        )

        relative_directory = (
            directory_path.relative_to(
                BACKEND_ROOT
            )
        )

        if not matches_ignore(
            relative_directory,
            ignore_patterns,
        ):
            retained_dirs.append(
                dirname
            )

    dirnames[:] = retained_dirs

    for filename in filenames:
        path = current / filename

        relative = path.relative_to(
            BACKEND_ROOT
        )

        if matches_ignore(
            relative,
            ignore_patterns,
        ):
            continue

        candidate_files.append(
            relative
        )

if not candidate_files:
    stop(
        "LOCAL_PACKAGE_CANDIDATE_SET_GATE=FAIL"
    )

candidate_set = {
    item.as_posix()
    for item in candidate_files
}

if "functions.js" not in candidate_set:
    stop(
        "LOCAL_PACKAGE_ENTRYPOINT_CANDIDATE_GATE=FAIL"
    )

if "package.json" not in candidate_set:
    stop(
        "LOCAL_PACKAGE_PACKAGE_JSON_CANDIDATE_GATE=FAIL"
    )

unsafe_candidates = [
    item
    for item in candidate_files
    if forbidden_candidate(
        item
    )
]

if unsafe_candidates:
    stop(
        "LOCAL_PACKAGE_SENSITIVE_EXCLUSION_GATE=FAIL"
    )

if any(
    item.name
    == ".runtimeconfig.json"
    for item in candidate_files
):
    stop(
        "LOCAL_PACKAGE_RUNTIME_CONFIG_EXCLUSION_GATE=FAIL"
    )

if any(
    "test"
    in {
        part.lower()
        for part in item.parts
    }
    for item in candidate_files
):
    stop(
        "LOCAL_PACKAGE_TEST_EXCLUSION_GATE=FAIL"
    )

print(
    "LOCAL_PACKAGE_CANDIDATE_FILE_COUNT="
    + str(
        len(candidate_files)
    )
)
print(
    "LOCAL_PACKAGE_SENSITIVE_EXCLUSION_GATE=PASS"
)
print(
    "LOCAL_PACKAGE_RUNTIME_CONFIG_EXCLUSION_GATE=PASS"
)
print(
    "LOCAL_PACKAGE_TEST_EXCLUSION_GATE=PASS"
)

safe_sources = (
    FIREBASE_CONFIG.read_text(
        encoding="utf-8"
    )
    + "\n"
    + BACKEND_PACKAGE.read_text(
        encoding="utf-8"
    )
    + "\n"
    + functions_source
)

for pattern in [
    re.compile(
        r"-----BEGIN "
        r"(?:RSA |EC |OPENSSH )?"
        r"PRIVATE KEY-----",
        re.I,
    ),
    re.compile(
        r"\brzp_(?:live|test)_"
        r"[A-Za-z0-9]{8,}\b",
        re.I,
    ),
]:
    if pattern.search(
        safe_sources
    ):
        stop(
            "LOCAL_PACKAGE_SAFE_SOURCE_SECRET_GATE=FAIL"
        )

print(
    "LOCAL_PACKAGE_SAFE_SOURCE_SECRET_GATE=PASS"
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
print(
    "LOCAL_FUNCTIONS_PACKAGE_INSPECTION_GATE=PASS"
)
