#!/usr/bin/env bash
set +e
umask 077

EXPECTED_BRANCH="release/mvp-production-readiness"
STAGING_PROJECT_ID="avsilks-staging-20260820-01"
PRODUCTION_PROJECT_ID="avsilks-5e81a"

APP="backend/app.js"
FUNCTIONS="backend/functions.js"
FIREBASE_CONFIG="firebase.json"
RBAC_VALIDATOR="backend/src/constants/validateRbac.js"
PROVENANCE_ROUTES="backend/src/routes/provenance.routes.js"
PACKAGE_JSON="backend/package.json"
PACKAGE_LOCK="backend/package-lock.json"

fail() {
  echo "$1"
  echo "SECURITY_REAUDIT_SCOPE=POST_MVP_PRE_HANDOVER"
  echo "SECURITY_REAUDIT_LIVE_STAGING_STATUS=DEFERRED_UNTIL_DEPLOYED_BLAZE_STAGING"
  echo "SECURITY_REAUDIT_PRODUCTION_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "SECURITY_REAUDIT_CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
  echo "SECURITY_REAUDIT_GATE=FAIL"
  exit 1
}

echo "SECURITY_REAUDIT_BEGIN"

MODE="${1:---check}"

if [ "$MODE" != "--check" ]; then
  fail "SECURITY_REAUDIT_MODE_GATE=FAIL"
fi

CURRENT_BRANCH="$(
  git branch --show-current 2>/dev/null
)"

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  fail "SECURITY_REAUDIT_BRANCH_GATE=FAIL"
fi

echo "SECURITY_REAUDIT_BRANCH_GATE=PASS"

for tool in git python3 node npm; do
  command -v "$tool" >/dev/null 2>&1

  if [ "$?" -ne 0 ]; then
    fail "SECURITY_REAUDIT_TOOL_GATE=FAIL missing=$tool"
  fi
done

echo "SECURITY_REAUDIT_TOOL_GATE=PASS"

for file in \
  "$APP" \
  "$FUNCTIONS" \
  "$FIREBASE_CONFIG" \
  "$RBAC_VALIDATOR" \
  "$PROVENANCE_ROUTES" \
  "$PACKAGE_JSON" \
  "$PACKAGE_LOCK"
do
  if [ ! -f "$file" ]; then
    fail "SECURITY_REAUDIT_REQUIRED_FILE_GATE=FAIL file=$file"
  fi
done

echo "SECURITY_REAUDIT_REQUIRED_FILE_GATE=PASS"

python3 - \
  "$APP" \
  "$FUNCTIONS" \
  "$FIREBASE_CONFIG" \
  "$RBAC_VALIDATOR" \
  "$PROVENANCE_ROUTES" \
  "$PACKAGE_JSON" \
  "$PACKAGE_LOCK" \
  "$STAGING_PROJECT_ID" \
  "$PRODUCTION_PROJECT_ID" <<'PY'
from pathlib import Path
import json
import re
import sys

(
    app_path,
    functions_path,
    firebase_path,
    rbac_path,
    provenance_path,
    package_path,
    lock_path,
    staging_id,
    production_id,
) = sys.argv[1:]

app = Path(app_path).read_text(encoding="utf-8")
functions = Path(functions_path).read_text(encoding="utf-8")
firebase = json.loads(
    Path(firebase_path).read_text(encoding="utf-8")
)
rbac = Path(rbac_path).read_text(encoding="utf-8")
provenance = Path(provenance_path).read_text(encoding="utf-8")
package = json.loads(
    Path(package_path).read_text(encoding="utf-8")
)
lock = json.loads(
    Path(lock_path).read_text(encoding="utf-8")
)

# -------------------------------------------------
# CORS / same-origin boundary
# -------------------------------------------------

if not re.search(
    r'\bcors\s*:\s*false\b',
    functions,
):
    raise SystemExit(10)

if re.search(
    r'\bapp\.use\s*\(\s*cors\s*\(',
    app,
):
    raise SystemExit(11)

hosting = firebase.get("hosting")

if not isinstance(hosting, dict):
    raise SystemExit(12)

rewrites = hosting.get("rewrites")

if not isinstance(rewrites, list):
    raise SystemExit(13)

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
    raise SystemExit(14)

function_target = api_rewrite.get("function")

if not isinstance(function_target, dict):
    raise SystemExit(15)

if function_target.get("functionId") != "api":
    raise SystemExit(16)

if function_target.get("region") != "asia-south1":
    raise SystemExit(17)

print("SECURITY_REAUDIT_CORS_GATE=PASS")

# -------------------------------------------------
# Rate limiting
# -------------------------------------------------

required_rate_limit = [
    'require("express-rate-limit")',
    "getRateLimitKey",
    "windowMs: 15 * 60 * 1000",
    "limit: 300",
    'standardHeaders: "draft-8"',
    "legacyHeaders: false",
    'app.use("/api", apiRateLimiter)',
    "RATE_LIMIT_EXCEEDED",
]

for marker in required_rate_limit:
    if marker not in app:
        raise SystemExit(20)

print("SECURITY_REAUDIT_RATE_LIMIT_GATE=PASS")

# -------------------------------------------------
# Helmet / security headers
# -------------------------------------------------

required_headers = [
    'require("helmet")',
    'app.disable("x-powered-by")',
    "app.use(helmet())",
]

for marker in required_headers:
    if marker not in app:
        raise SystemExit(30)

print("SECURITY_REAUDIT_HEADERS_GATE=PASS")

# -------------------------------------------------
# Trusted RBAC configuration validation
# -------------------------------------------------

required_rbac = [
    'require("./roles")',
    "VALID_PERMISSIONS",
    "ROLE_PERMISSIONS",
    "missingRoles",
    "unknownRoles",
    "invalidEntries",
    "validateRbacConfiguration",
    "valid: true",
]

for marker in required_rbac:
    if marker not in rbac:
        raise SystemExit(40)

print("SECURITY_REAUDIT_TRUSTED_ROLE_GATE=PASS")

# -------------------------------------------------
# Obsolete allowlist review
# No legacy phone/admin literal allowlist should live
# in backend authorization source.
# -------------------------------------------------

obsolete_patterns = [
    r"ADMIN_PHONES",
    r"adminPhones",
    r"phoneAllowlist",
    r"phone_allowlist",
]

for pattern in obsolete_patterns:
    if re.search(pattern, app + "\n" + rbac, re.I):
        raise SystemExit(50)

print("SECURITY_REAUDIT_OBSOLETE_ALLOWLIST_GATE=PASS")

# -------------------------------------------------
# Error/logging hygiene
# -------------------------------------------------

if "RATE_LIMIT_EXCEEDED" not in app:
    raise SystemExit(60)

if re.search(
    r"console\.(?:log|error)\s*\([^)]*"
    r"(?:RAZORPAY_KEY_SECRET|PRIVATE_KEY|WEBHOOK_SECRET)",
    app + "\n" + functions,
    re.I | re.S,
):
    raise SystemExit(61)

print("SECURITY_REAUDIT_ERROR_LOGGING_GATE=PASS")

# -------------------------------------------------
# Dependency manifest/lock integrity
# This is readiness integrity, not a substitute for
# the final current-advisory audit before handover.
# -------------------------------------------------

deps = package.get("dependencies", {})

for dependency in [
    "express",
    "helmet",
    "express-rate-limit",
    "firebase-admin",
    "firebase-functions",
]:
    if dependency not in deps:
        raise SystemExit(70)

if not isinstance(lock, dict):
    raise SystemExit(71)

if lock.get("lockfileVersion") is None:
    raise SystemExit(72)

if "packages" not in lock:
    raise SystemExit(73)

print("SECURITY_REAUDIT_DEPENDENCY_GATE=PASS")

# -------------------------------------------------
# Public endpoint + provenance exposure review
# -------------------------------------------------

public_route = "router.get("
public_path = "'/public/:publicId'"
auth_middleware = "verifyAuthMiddleware"
permission_middleware = "requirePermissionFn"

for marker in [
    public_route,
    public_path,
    auth_middleware,
    permission_middleware,
    "verifyPublicProvenanceHandler",
]:
    if marker not in provenance:
        raise SystemExit(80)

public_index = provenance.find(public_path)
private_index = provenance.find("'/:id'")

if public_index < 0 or private_index < 0:
    raise SystemExit(81)

if public_index > private_index:
    raise SystemExit(82)

for protected_path in [
    "router.post(",
    "verifyAuthMiddleware",
]:
    if protected_path not in provenance:
        raise SystemExit(83)

print("SECURITY_REAUDIT_PUBLIC_ENDPOINT_GATE=PASS")
print("SECURITY_REAUDIT_PROVENANCE_EXPOSURE_GATE=PASS")

# -------------------------------------------------
# Secret-management configuration
# Names allowed; secret values forbidden.
# -------------------------------------------------

required_secret_names = [
    'defineSecret("RAZORPAY_KEY_ID")',
    'defineSecret("RAZORPAY_KEY_SECRET")',
    'defineSecret("RAZORPAY_WEBHOOK_SECRET")',
    "secrets:",
]

for marker in required_secret_names:
    if marker not in functions:
        raise SystemExit(90)

secret_value_patterns = [
    r"\brzp_(?:live|test)_[A-Za-z0-9]{8,}\b",
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    r"\bAIza[0-9A-Za-z_-]{20,}\b",
]

combined = (
    app
    + "\n"
    + functions
    + "\n"
    + rbac
    + "\n"
    + provenance
)

for pattern in secret_value_patterns:
    if re.search(pattern, combined, re.I):
        raise SystemExit(91)

print("SECURITY_REAUDIT_SECRET_MANAGEMENT_GATE=PASS")

# Environment identifiers must remain distinct.
if staging_id == production_id:
    raise SystemExit(92)
PY

VERIFY_RC=$?

if [ "$VERIFY_RC" -ne 0 ]; then
  fail "SECURITY_REAUDIT_SOURCE_CONFIG_GATE=FAIL code=$VERIFY_RC"
fi

echo "SECURITY_REAUDIT_SOURCE_CONFIG_GATE=PASS"

# Validate RBAC implementation directly.
node - <<'NODE'
const {
  validateRbacConfiguration,
} = require(
  "./backend/src/constants/validateRbac"
);

const result =
  validateRbacConfiguration();

if (
  !result ||
  result.valid !== true ||
  !Number.isInteger(result.roleCount) ||
  !Number.isInteger(result.permissionCount) ||
  result.roleCount < 1 ||
  result.permissionCount < 1
) {
  process.exit(1);
}

console.log(
  "SECURITY_REAUDIT_RBAC_RUNTIME_GATE=PASS"
);
NODE

if [ "$?" -ne 0 ]; then
  fail "SECURITY_REAUDIT_RBAC_RUNTIME_GATE=FAIL"
fi

echo "SECURITY_REAUDIT_SCOPE=POST_MVP_PRE_HANDOVER"
echo "SECURITY_REAUDIT_LIVE_STAGING_STATUS=DEFERRED_UNTIL_DEPLOYED_BLAZE_STAGING"
echo "SECURITY_REAUDIT_PRODUCTION_MUTATION_STATUS=NOT_ATTEMPTED"
echo "SECURITY_REAUDIT_CLOUD_MUTATION_STATUS=NOT_ATTEMPTED"
echo "SECURITY_REAUDIT_GATE=PASS"
exit 0
