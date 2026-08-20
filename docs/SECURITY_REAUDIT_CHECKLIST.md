# AV Silks Security Re-Audit Checklist

## Scope

This is the Post-MVP security re-audit checklist required Before government handover.

The local preflight verifies source/config readiness. It does not replace
Live Blaze staging validation, penetration testing, current dependency
advisory checks, or production approval.

Production approval remains separate.

## 1. CORS allowlist / same-origin boundary

- Confirm Cloud Functions HTTPS wrapper does not enable broad CORS.
- Confirm `cors: false` remains intentional.
- Confirm Hosting `/api/**` rewrite remains the approved browser path.
- Confirm no wildcard `Access-Control-Allow-Origin: *` is introduced.
- If cross-origin clients are introduced later, replace this assumption
  with a reviewed explicit CORS allowlist and tests.

## 2. Rate limiting

- Confirm `/api` rate limiting remains enabled.
- Confirm custom trusted proxy/IP keying remains validated.
- Confirm rate-limit responses do not leak internals.
- Re-test burst behavior on Blaze staging.

## 3. Helmet and security headers

- Confirm Helmet middleware remains enabled.
- Confirm Express `X-Powered-By` remains disabled.
- Inspect live Blaze staging response headers before handover.
- Re-check CSP/HSTS/clickjacking/XSS-related behavior where applicable.

## 4. Trusted role consistency

- Run RBAC configuration validation.
- Confirm all roles map only to valid permissions.
- Confirm backend authorization is the trusted authority.
- Confirm frontend role visibility is not treated as authorization.

## 5. Obsolete allowlists

- Search for obsolete phone/admin literal allowlists.
- Remove any legacy authorization bypasses.
- Confirm trusted backend role/permission enforcement is authoritative.

## 6. Error and logging hygiene

- Confirm standardized client-safe errors.
- Confirm stack traces/internal exception details are not exposed publicly.
- Confirm payment secrets, Firebase Admin credentials, ID tokens, and
  private keys are never logged.
- Inspect staging logs during the live re-audit.

## 7. Dependency updates

- Preserve committed lockfiles.
- Run the current production dependency vulnerability audit immediately
  before handover.
- Review direct and transitive high/critical findings.
- Do not perform blind major-version upgrades during the security gate.
- Re-run regression tests after any remediation.

The local readiness `SECURITY_REAUDIT_DEPENDENCY_GATE` checks manifest
and lock integrity; it is not a claim that future advisory databases
contain zero vulnerabilities.

## 8. Public endpoint review

Inventory every unauthenticated endpoint, including:

- `/`;
- `/api/health`;
- public QR provenance verification;
- payment webhook entrypoints where signature verification is mandatory.

Confirm no administrative or private read/write path becomes public.

## 9. QR provenance exposure

- Confirm only `/api/provenance/public/:publicId` is intentionally public.
- Confirm create/publish/archive/private-read operations remain protected.
- Verify sanitized public response fields.
- Re-test unknown, malformed, archived, unpublished, and valid IDs.
- Confirm internal metadata is not exposed.

## 10. Secret management

- Secret names may exist in source configuration.
- Secret values must never exist in Git.
- Firebase/Cloud secret values must remain server-side only.
- Never print Razorpay secret values during verification.
- Validate staging secret bindings only after Blaze staging is approved.

## 11. Live Blaze staging validation

Live Blaze staging validation remains mandatory and deferred until a
Blaze staging deployment exists.

The live re-audit must cover:

- HTTPS/security headers;
- CORS/same-origin behavior;
- rate limiting;
- auth failures;
- RBAC permission denial;
- public QR provenance;
- payment test-mode signature/replay/idempotency boundaries;
- error/logging hygiene;
- current dependency advisory status;
- secret exposure review;
- public endpoint inventory;
- smoke/E2E regression.

A local PASS cannot mark this live section complete.

## 12. Production boundary

Production approval remains separate.

Security preflight PASS, staging deploy approval, staging security PASS,
or rollback readiness never authorizes a production deployment.

Government handover may proceed only after the defined staging security
re-audit, explicit production decision, rollback verification, and final
handover documentation gates are satisfied.
