# AV Silks Blaze Activation Checklist

## Trigger Condition

Use this checklist only after Blaze availability or billing approval has been explicitly confirmed for the intended Firebase project.

**Blaze approval does not authorize production deployment.**

Approval only opens the controlled staging path. It does not bypass testing, security, cost controls, rollback readiness, or explicit production approval.

## Current-Step Interruption Rule

If Blaze approval arrives while another Development Agreement task is active:

**Finish the current atomic step before switching to the Blaze activation gate.**

Required sequence:

1. Complete the current atomic task.
2. Verify its expected output.
3. Run its required tests and security checks.
4. Create and push a normal Git checkpoint when tracked files changed.
5. Verify exact remote commit identity.
6. Verify clean worktree.
7. Then begin this checklist.

Do not abandon half-completed WIP merely because Blaze became available.

## Stage 0 — Clean Git Checkpoint

Required evidence:

- Current branch is the approved production-readiness branch.
- Current commit is pushed to the trusted GitHub remote.
- Local and remote branch hashes match exactly.
- Worktree is clean.
- No staged or untracked secret-bearing files exist.
- No force operations are required.

Gate result:

`BLAZE_STAGE_0_GIT_CHECKPOINT=PASS`

## Stage 1 — Billing Verification

Before any Blaze staging action:

- Confirm the exact Firebase project.
- Confirm that billing/Blaze approval applies to that exact project.
- Confirm who authorized the billing change.
- Review current Firebase/Google Cloud pricing implications.
- Review applicable no-cost quotas.
- Review Functions, Cloud Build, Artifact Registry, logging, and network implications.
- Configure budget and threshold notifications before production rollout.
- Record the approved cost-safety procedure without recording billing credentials.

**Budget alerts are notifications, not an automatic spending hard cap.**

A budget alert must never be represented as a guaranteed cost ceiling.

Gate result:

`BLAZE_STAGE_1_BILLING_VERIFIED=PASS`

## Stage 2 — Staging Project Identity

Staging must be deliberate.

Required evidence:

- Explicit staging Firebase project ID is known.
- Staging must not silently default to production.
- Project state is active.
- Firebase CLI account can access the staging project.
- Local emulator, Spark Demo, Blaze Staging, and Blaze Production identities remain distinguishable.
- `firebase.spark.json` remains the Spark-safe configuration.
- `firebase.json` remains the Blaze Functions configuration.

If a separate staging project is not yet available, stop at this gate and prepare one before deployment.

Gate result:

`BLAZE_STAGE_2_STAGING_IDENTITY=PASS`

## Stage 3 — Secret Manager Readiness

Required Firebase secret names:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Rules:

- Never print secret values.
- Never place secret values in Git.
- Never place secret values in documentation.
- Never expose secret values in test output.
- Staging should use Razorpay test credentials.
- Production credentials remain separate.
- Firebase service-account private keys remain excluded from source control.
- Secret rotation and least privilege remain mandatory.

This stage verifies secret-name readiness and approved configuration procedure. It does not require displaying any secret value.

Gate result:

`BLAZE_STAGE_3_SECRET_READINESS=PASS`

## Stage 4 — Regression and Security Gates

Before staging:

- Backend full automated regression must PASS.
- Frontend automated regression must PASS.
- Frontend production build must PASS.
- Backend production dependency audit must PASS under the locked dependency policy.
- Frontend production dependency audit must PASS.
- Tracked-sensitive-filename scan must PASS.
- Secret scan must PASS.
- Firestore security-rule assertions must PASS.
- Spark/Blaze configuration boundary tests must PASS.
- Authentication/RBAC tests must PASS.
- Razorpay signature/idempotency/replay/webhook tests must PASS.
- Rate limiting, Helmet, CORS, and error-hygiene tests must PASS.

Any unexpected regression blocks staging.

Gate result:

`BLAZE_STAGE_4_REGRESSION_SECURITY=PASS`

## Stage 5 — Functions Packaging Validation

Before any staging deployment:

- Firebase Functions source remains `backend`.
- Codebase remains `api`.
- Node.js runtime contract remains Node 22.
- Required dependency versions are verified.
- Optional Storage dependency remains omitted unless architecture changes are explicitly reviewed.
- `.env`, service-account, key, log, test, coverage, backup, and private-key files remain excluded from Functions packaging.
- Firebase Functions entry point loads successfully.
- Function region remains `asia-south1`.
- `maxInstances` remains intentionally bounded unless explicitly reviewed.
- Secret Manager names remain bound through `defineSecret`.
- `/api/**` Hosting rewrite targets the expected Function and region.

This validation must not alter billing or production state.

Gate result:

`BLAZE_STAGE_5_PACKAGING=PASS`

## Stage 6 — Blaze Staging Deployment

Only after Stages 0–5 PASS.

Rules:

- Target the explicitly approved staging project.
- Use Razorpay test mode.
- Do not use production payment credentials.
- Start with the minimum backend deployment required for staging verification.
- Verify deployment target before execution.
- Preserve rollback information immediately after successful deployment.
- Do not treat staging success as production approval.

Gate result:

`BLAZE_STAGE_6_STAGING_DEPLOYMENT=PASS`

## Stage 7 — Staging Smoke Tests

Required staging checks:

- `/api/health` returns expected success.
- Missing authentication is rejected correctly.
- Invalid/revoked authentication is rejected.
- Trusted authenticated session resolves correctly.
- Admin/owner RBAC works.
- Customer/vendor boundaries remain enforced.
- Product backend writes operate only through protected routes.
- Order creation uses server-authoritative price and inventory.
- Provenance creation/lifecycle works.
- Public provenance verification works.
- Printed/test QR resolves correctly.
- Razorpay test order creation works.
- Payment verification works.
- Webhook signature verification works.
- Replay/idempotency behavior works.
- Reconciliation/finalization works.
- Hosting `/api/**` rewrite works.
- Logs do not expose tokens, keys, secrets, or unnecessary personal data.

Gate result:

`BLAZE_STAGE_7_STAGING_SMOKE=PASS`

## Stage 8 — Security Re-Audit

Run a dedicated post-deployment security review.

Mandatory areas:

- Auth token verification.
- Revocation and disabled-account behavior.
- Trusted role consistency.
- RBAC privilege boundaries.
- Firestore least privilege.
- Public provenance exposure and enumeration resistance.
- CORS.
- Helmet/security headers.
- X-Powered-By removal.
- Rate limiting.
- Proxy/IP handling.
- Validation and sanitization.
- Secure error responses.
- Logging privacy.
- Razorpay signature verification.
- Webhook raw-body handling.
- Amount verification.
- Idempotency.
- Replay protection.
- Inventory/payment transaction consistency.
- Secret Manager usage.
- Dependency vulnerabilities.
- Git secret history.
- Functions configuration.
- Hosting rewrites.
- Rollback readiness.

Any unresolved high-severity finding blocks Production Approval.

Gate result:

`BLAZE_STAGE_8_SECURITY_REAUDIT=PASS`

## Stage 9 — Explicit Production Approval

Production requires a separate explicit decision.

Required evidence:

- Staging deployment PASS.
- Staging end-to-end PASS.
- Security Re-Audit PASS.
- Dependency audits PASS.
- Secret scans PASS.
- Monitoring plan ready.
- Rollback plan ready.
- Production Firebase project identity confirmed.
- Production billing safeguards confirmed.
- Approved payment mode confirmed.
- Required operator/handover documentation ready enough for release.

**Never deploy production automatically.**

Gate result:

`BLAZE_STAGE_9_PRODUCTION_APPROVAL=PASS`

## Stage 10 — Blaze Production Deployment

Only after Stage 9 explicit approval.

Required controls:

- Re-confirm exact production project before each production action.
- Re-confirm clean reviewed release state.
- Re-confirm approved secrets and payment mode.
- Use the reviewed deployment sequence.
- Coordinate backend, Hosting, and Firestore-rule rollout.
- Observe deployment output for unexpected resources.
- Begin immediate post-deployment smoke verification.

Gate result:

`BLAZE_STAGE_10_PRODUCTION_DEPLOYMENT=PASS`

## Stage 11 — Rollback Verification

A production release is incomplete until rollback readiness is verified.

Verify:

- Last known-good Git commit/tag.
- Previous known-good Hosting release.
- Functions rollback/revision procedure.
- Firestore rules rollback source.
- Payment/webhook handling during rollback.
- Data consistency after rollback.
- Post-rollback smoke checklist.
- Responsible operator and escalation path.

Gate result:

`BLAZE_STAGE_11_ROLLBACK=PASS`

## Stage 12 — Release Closure

Final closure includes:

- Public Hosting smoke PASS.
- Backend health PASS.
- Authentication PASS.
- RBAC PASS.
- Public provenance PASS.
- Real printed QR verification PASS.
- Approved payment-mode verification PASS.
- Webhook verification PASS.
- Monitoring verification PASS.
- Rollback verification PASS.
- Government handover pack synchronized.
- `CHANGELOG.md` finalized.
- Roadmap synchronized.
- Reviewed release commit.
- Pull request/review process completed.
- Stable version tag created and pushed.
- Remote tag/commit independently verified.

Gate result:

`BLAZE_STAGE_12_RELEASE_CLOSURE=PASS`

## STOP CONDITIONS

Stop immediately and do not advance to the next stage if any of the following occurs:

- Project identity is ambiguous.
- Billing approval cannot be independently verified.
- Staging and production cannot be distinguished safely.
- A required test fails.
- A dependency/security audit fails outside the accepted policy.
- A secret or private key is found in tracked/staged content.
- Secret values appear in command output.
- Required Razorpay credentials cannot be separated by environment.
- Firestore rules fail validation.
- Functions packaging includes sensitive files.
- An unexpected cloud resource would be created.
- A high-severity security finding remains unresolved.
- Rollback capability is unknown.
- Git history would require unsafe rewriting for routine progress.
- Production approval has not been explicitly granted.

Permanent operational rules:

**Never print secret values.**

**Never force-push.**

**Never deploy production automatically.**

---

This checklist is subordinate to the AV Silks Development Agreement and the authoritative `PRODUCTION_READINESS_ARCHITECTURE.md`.
