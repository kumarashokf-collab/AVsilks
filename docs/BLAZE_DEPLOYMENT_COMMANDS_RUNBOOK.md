# AV Silks Final Blaze Deployment Commands Runbook v1

Status: REVIEW-ONLY / DO NOT DEPLOY YET

## Runbook Preparation Progress

This percentage measures preparation and verification of this deployment runbook only. It does not measure Blaze approval or live deployment progress.

Current baseline: `100% complete / 0% pending`

Fixed verified-stage mapping:
- Stage 0 = 8%
- Stage 1 = 15%
- Stage 2 = 23%
- Stage 3 = 31%
- Stage 4 = 38%
- Stage 5 = 46%
- Stage 6 = 54%
- Stage 7 = 62%
- Stage 8 = 69%
- Stage 9 = 77%
- Stage 10 = 85%
- Stage 11 = 92%
- Stage 12 = 100%

Progress increases only after the corresponding runbook stage content receives a verified PASS. Blaze execution progress remains separate.

## Permanent Rule
Execute only one verified command at a time.
Blaze approval does not authorize production deployment.

## Stage 0 — Clean Git Checkpoint

### Goal
Re-establish the exact reviewed release state before any Blaze action.

### Command 0A — Switch to approved release branch
`cd ~/avsilks-history-rewrite-verify-v2 && git switch release/mvp-production-readiness`

### Command 0B — Blaze activation preflight
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/blaze-activation-preflight.sh`

Required marker: `BLAZE_ACTIVATION_PREFLIGHT_GATE=PASS`

Verify clean worktree, local/remote SHA match, staging visibility, Node 22, Spark/Blaze boundary, secret names only, and no deployment.

### Stage 0 PASS marker
`BLAZE_STAGE_0_GIT_CHECKPOINT=PASS`

## Stage 1 — Billing / Blaze Approval Verification

### Goal
Verify that Blaze/billing approval applies to the exact intended Firebase staging project.

### Required external evidence
- exact project: `avsilks-staging-20260820-01`
- Blaze/billing approval explicitly confirmed for that project
- authorization source/support evidence reviewed
- pricing and applicable no-cost quotas reviewed
- budget notifications reviewed/configured as appropriate

Budget notifications are alerts only; they are not a guaranteed spending hard cap.

### HARD STOP
There is intentionally no shell command that can replace external billing approval evidence.

Do not provision secrets, deploy Functions, or perform paid cloud mutation while approval is unknown.

### Stage 1 PASS marker
`BLAZE_STAGE_1_BILLING_VERIFIED=PASS`

Record this marker only after the external approval evidence is verified.

## Stage 2 — Staging Project Identity

### Goal
Verify the exact dedicated staging Firebase project and prevent accidental production targeting.

### Command 2A — Read-only staging project preflight
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-project-preflight.sh`

Required marker: `STAGING_PROJECT_PREFLIGHT_GATE=PASS`

### Command 2B — Deployment identity/config guard
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-deploy-preflight.sh`

Required marker: `STAGING_DEPLOY_PREFLIGHT_GATE=PASS`

Required staging project: `avsilks-staging-20260820-01`

Forbidden staging target: `avsilks-5e81a`

Verify staging and production remain distinct, staging is accessible, `firebase.json` targets backend codebase `api`, and `/api/**` resolves to Function `api` in `asia-south1`.

### Stage 2 PASS marker
`BLAZE_STAGE_2_STAGING_IDENTITY=PASS`

## Stage 3 — Secret Manager Readiness

### Goal
Verify staging secret bindings and prepare the approved Secret Manager provisioning commands without exposing secret values.

### Command 3A — Read-only secret readiness
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-secret-readiness.sh`

Required marker: `STAGING_SECRET_READINESS_GATE=PASS`

Required secret names:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

### HARD STOP — explicit mutation approval required
The following commands are prepared only. DO NOT RUN until Blaze Stage 1 is PASS and explicit staging secret-write approval is given.

`firebase functions:secrets:set RAZORPAY_KEY_ID --project avsilks-staging-20260820-01`

`firebase functions:secrets:set RAZORPAY_KEY_SECRET --project avsilks-staging-20260820-01`

`firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET --project avsilks-staging-20260820-01`

Use Razorpay test-mode credentials in staging. Enter values only through the secure CLI prompt. Never place values in Git, documentation, chat, screenshots, or command text.

### Metadata-only verification
`firebase functions:secrets:get RAZORPAY_KEY_ID --project avsilks-staging-20260820-01`

`firebase functions:secrets:get RAZORPAY_KEY_SECRET --project avsilks-staging-20260820-01`

`firebase functions:secrets:get RAZORPAY_WEBHOOK_SECRET --project avsilks-staging-20260820-01`

Never use `functions:secrets:access` for deployment evidence because it exposes the secret value.

### Stage 3 PASS marker
`BLAZE_STAGE_3_SECRET_READINESS=PASS`

## Stage 4 — Regression and Security Gate

### Goal
Re-run the complete pre-deploy regression, build, dependency, and security gates immediately before Blaze staging.

### Command 4A — Canonical staging predeploy verification
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-predeploy-verification.sh`

Required marker: `STAGING_PREDEPLOY_VERIFICATION_GATE=PASS`

### Command 4B — Full backend regression
`cd ~/avsilks-history-rewrite-verify-v2/backend && npm test`

Required: all backend tests PASS with zero failures.

### Command 4C — Frontend direct test suite
`cd ~/avsilks-history-rewrite-verify-v2 && mapfile -d "" TESTS < <(find frontend -type f -name "*.test.js" ! -path "*/node_modules/*" ! -path "*/dist/*" -print0 | sort -z) && node --test "${TESTS[@]}"`

Required: all discovered frontend tests PASS with zero failures.

### Command 4D — Frontend production build
`cd ~/avsilks-history-rewrite-verify-v2/frontend && npm run build`

Chunk-size warnings alone are advisory unless the build fails.

### Command 4E — Backend dependency audit
`cd ~/avsilks-history-rewrite-verify-v2/backend && npm audit`

Required: zero unresolved vulnerabilities under the approved dependency policy.

### Command 4F — Frontend dependency audit
`cd ~/avsilks-history-rewrite-verify-v2/frontend && npm audit`

Required: zero unresolved vulnerabilities under the approved dependency policy.

### Command 4G — Static security re-audit
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/security-reaudit-preflight.sh --check`

Required marker: `SECURITY_REAUDIT_GATE=PASS`

### HARD STOP
Any regression, dependency, secret, Firestore-rule, authentication/RBAC, Razorpay, rate-limit, Helmet, CORS, or error-hygiene failure blocks staging deployment.

### Stage 4 PASS marker
`BLAZE_STAGE_4_REGRESSION_SECURITY=PASS`

## Stage 5 — Functions Packaging Validation

### Goal
Verify the exact Firebase Functions packaging boundary before any Blaze staging deployment.

### Command 5A — Local Functions package inspection
`cd ~/avsilks-history-rewrite-verify-v2 && python3 scripts/inspect-functions-package.py`

Required marker: `LOCAL_FUNCTIONS_PACKAGE_INSPECTION_GATE=PASS`

Verify:
- Functions source = `backend`
- codebase = `api`
- Node runtime contract = `22`
- function region = `asia-south1`
- `maxInstances = 2`
- required Razorpay Secret Manager names remain bound
- `.env*`, service-account/private-key files, tests, coverage, logs and backups remain excluded from deployment packaging

### Command 5B — Reconfirm staging deployment identity immediately before mutation
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-deploy-preflight.sh`

Required marker: `STAGING_DEPLOY_PREFLIGHT_GATE=PASS`

### HARD STOP
Any unexpected packaged sensitive file, runtime drift, secret-binding drift, function target mismatch, or staging/production identity ambiguity blocks Stage 6.

### Stage 5 PASS marker
`BLAZE_STAGE_5_PACKAGING=PASS`

## Stage 6 — Blaze Staging Deployment

### STATUS — DO NOT RUN YET
These commands are prepared for future execution only.

### Preconditions
- Stage 1 billing/Blaze approval = PASS
- Stages 0–5 execution gates = PASS
- staging Secret Manager provisioning approved and complete
- exact staging project reconfirmed
- explicit staging cloud-mutation approval received
- production remains untouched

Target staging project: `avsilks-staging-20260820-01`

### Command 6A — Deploy minimum API Function first
`cd ~/avsilks-history-rewrite-verify-v2 && firebase deploy --project avsilks-staging-20260820-01 --config firebase.json --only functions:api`

STOP after this command. Verify project, Function `api`, region `asia-south1`, runtime, Secret Manager bindings and absence of unexpected resources before continuing.

### Command 6B — Deploy Firestore rules to staging
`cd ~/avsilks-history-rewrite-verify-v2 && firebase deploy --project avsilks-staging-20260820-01 --config firebase.json --only firestore`

STOP and verify the rules deployment before continuing.

### Command 6C — Deploy Hosting to staging
`cd ~/avsilks-history-rewrite-verify-v2 && firebase deploy --project avsilks-staging-20260820-01 --config firebase.json --only hosting`

Verify the returned Hosting URL belongs only to `avsilks-staging-20260820-01`.

### Rollback evidence
After every successful surface deployment, preserve the exact deployment/release identity needed for its separate rollback lane. Never guess rollback versions.

### HARD STOP
Stop on wrong project, unexpected resource, runtime/config drift, secret problem, deployment failure, or any production mutation.

### Stage 6 execution PASS marker
`BLAZE_STAGE_6_STAGING_DEPLOYMENT=PASS`

This marker is NOT earned by preparing this document. Record it only after the future real staging deployment is explicitly approved, executed one command at a time, and verified.

## Stage 7 — Staging Smoke / E2E

### STATUS — DO NOT RUN LIVE YET
Live E2E becomes eligible only after verified Stage 6 Blaze staging deployment.

### Command 7A — Static staging E2E harness check
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-e2e-harness.sh --check`

Required marker: `STAGING_E2E_CHECK_MODE_GATE=PASS`

This check must not perform network requests, access credentials, mutate data, or target production.

### Command 7B — Live GET-only staging health + public provenance verification
Use only a staging-only published provenance public ID.

`cd ~/avsilks-history-rewrite-verify-v2 && STAGING_E2E_BASE_URL=https://avsilks-staging-20260820-01.web.app STAGING_E2E_PUBLIC_PROVENANCE_ID=<STAGING_PUBLIC_ID> bash scripts/staging-e2e-harness.sh live`

Required final marker: `STAGING_E2E_GATE=PASS`

Required evidence includes:
- staging-only URL accepted
- production target blocked
- `/api/health` contract PASS
- public provenance contract PASS
- private/internal provenance fields absent
- Git worktree remains clean
- local/remote approved release SHA remains locked
- auth credential values not accessed
- payment secret values not accessed
- data mutation not attempted by this GET-only harness

### Additional live staging verification
After the GET-only harness passes, separately verify authenticated RBAC, protected product writes, orders/inventory, provenance lifecycle, printed/test QR, Razorpay test-mode payment verification, webhook signature/replay/idempotency, reconciliation, Hosting `/api/**` rewrite, and log privacy. Each remains one independently reviewed command/gate at execution time.

### HARD STOP
Stop on non-staging URL, production target, health failure, provenance privacy failure, SHA drift, dirty worktree, credential exposure, payment-secret exposure, or unexpected mutation.

### Stage 7 execution PASS marker
`BLAZE_STAGE_7_STAGING_SMOKE=PASS`

Preparing this documentation does not earn the execution PASS marker.

## Stage 8 — Security Re-Audit

### STATUS — DO NOT MARK PASS UNTIL LIVE BLAZE STAGING EXISTS

### Command 8A — Static security contract re-audit
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/security-reaudit-preflight.sh --check`

Required marker: `SECURITY_REAUDIT_GATE=PASS`

### Mandatory live staging review
After Stage 7 PASS, verify on staging only:
- auth token verification, revocation and disabled-account behavior
- trusted RBAC and privilege boundaries
- Firestore least privilege
- public provenance privacy and enumeration resistance
- CORS/same-origin boundary
- Helmet/security headers and X-Powered-By removal
- rate limiting and proxy/IP handling
- request validation/sanitization and safe error responses
- logging privacy
- Razorpay raw webhook body and signature verification
- payment amount/order identity verification
- replay/idempotency protection
- inventory/payment consistency
- Secret Manager bindings
- dependency/security audits
- Hosting `/api/**` rewrite
- rollback readiness

### HARD STOP
Any unresolved high-severity finding, secret exposure, production targeting, failed security control, or rollback uncertainty blocks Stage 9 Production Approval.

### Stage 8 execution PASS marker
`BLAZE_STAGE_8_SECURITY_REAUDIT=PASS`

Preparing this runbook section does not earn the execution PASS marker.

## Stage 9 — Explicit Production Approval

### HARD STOP — HUMAN APPROVAL REQUIRED
Production requires a separate explicit decision. Blaze approval and staging success do not authorize production deployment.

### Required evidence before approval
- Stage 6 staging deployment = PASS
- Stage 7 staging smoke/E2E = PASS
- Stage 8 security re-audit = PASS
- dependency audits = PASS
- secret scans = PASS
- exact production Firebase project reconfirmed as `avsilks-5e81a`
- production billing safeguards reviewed
- approved production payment mode confirmed
- production secrets separately approved
- monitoring plan ready
- rollback plan ready
- Government handover/operator documentation ready enough for release
- reviewed release SHA locked locally and remotely

### Approval rule
There is intentionally no automatic shell command that can grant production approval. The approval must be explicit, recorded, and reviewed before any Stage 10 command is eligible.

### Stage 9 execution PASS marker
`BLAZE_STAGE_9_PRODUCTION_APPROVAL=PASS`

Do not record this marker merely because this runbook section exists.

## Stage 10 — Blaze Production Deployment

### STATUS — DO NOT RUN YET
Production deployment is forbidden until Stage 9 explicit Production Approval is independently verified.

### Exact production target
`avsilks-5e81a`

### Mandatory execution-time preconditions
- `BLAZE_STAGE_9_PRODUCTION_APPROVAL=PASS`
- exact reviewed release SHA locked locally and remotely
- clean worktree
- production billing safeguards reconfirmed
- approved production payment mode reconfirmed
- required production Secret Manager versions confirmed without exposing values
- rollback identities/procedure ready
- staging and production identities remain clearly separated

If required production secrets are not already provisioned, STOP. Create and review a separate explicitly approved secret-provisioning step before deployment. Never improvise secret writes during production deployment.

### Command 10A — Deploy API Function to production
`cd ~/avsilks-history-rewrite-verify-v2 && firebase deploy --project avsilks-5e81a --config firebase.json --only functions:api`

STOP after execution. Verify exact project `avsilks-5e81a`, Function `api`, region `asia-south1`, expected runtime, expected Secret Manager bindings, and no unexpected cloud resource.

### Command 10B — Deploy Firestore rules to production
`cd ~/avsilks-history-rewrite-verify-v2 && firebase deploy --project avsilks-5e81a --config firebase.json --only firestore`

STOP after execution and verify the exact rules deployment before continuing.

### Command 10C — Deploy Hosting to production
`cd ~/avsilks-history-rewrite-verify-v2 && firebase deploy --project avsilks-5e81a --config firebase.json --only hosting`

STOP after execution. Verify the returned Hosting identity belongs only to production and immediately begin approved production smoke verification.

### Mandatory rule
Execute Commands 10A, 10B, and 10C one at a time. Never paste or run them as one deployment batch.

### HARD STOP
Stop on wrong project, SHA drift, dirty worktree, secret ambiguity, unexpected resource, runtime/config drift, deployment failure, missing rollback evidence, or any output inconsistent with the approved production plan.

### Stage 10 execution PASS marker
`BLAZE_STAGE_10_PRODUCTION_DEPLOYMENT=PASS`

Preparing this runbook section does not grant production approval and does not earn the execution PASS marker.

## Stage 11 — Rollback Verification

### STATUS — READINESS ONLY / DO NOT ROLLBACK YET
Rollback requires explicit approval for the exact incident, exact source release, exact known-good target and exact rollback lane. Production rollback requires separate approval.

### Command 11A — Static rollback architecture check
`cd ~/avsilks-history-rewrite-verify-v2 && bash scripts/staging-rollback-readiness.sh --check`

Required marker: `STAGING_ROLLBACK_CHECK_MODE_GATE=PASS`

This check performs no cloud rollback and no secret-value access.

### Separate rollback lanes
- Hosting rollback: identify the exact known-good Hosting release/version first; construct and review the exact restoration command only at execution time.
- Functions rollback: use the exact known-good Git SHA in an isolated non-destructive worktree, verify locked dependencies, run backend regression and security/secret scans, reconfirm exact Firebase target, obtain explicit approval, then construct the exact staging-only Functions deployment command at execution time.
- Firestore rollback: use rules/config from the exact approved known-good Git state and review the exact project-specific deployment command before execution.

Never assume restoring Hosting automatically restores the backend Function. Never use reset, rebase or force-push as routine rollback preparation.

### Mandatory post-rollback verification
Verify security controls, backend regression, frontend build, staging identity, `/api/health`, public provenance/QR, `/api/**` routing, payment/webhook consistency, and confirmation that production was not changed.

### HARD STOP
Stop on ambiguous source/target SHA, unknown Hosting version, failed tests/security, secret exposure, wrong Firebase project, missing explicit rollback approval, failed post-rollback smoke, or production mutation.

### Stage 11 execution PASS marker
`BLAZE_STAGE_11_ROLLBACK=PASS`

Preparing this runbook section does not earn the rollback execution PASS marker.

## Stage 12 — Release Closure

### STATUS — FINAL CLOSURE ONLY AFTER ALL EXECUTION GATES PASS

### Required closure evidence
- Blaze production deployment verified
- public Hosting smoke PASS
- backend `/api/health` PASS
- authentication PASS
- trusted RBAC PASS
- public provenance PASS
- real printed QR verification PASS
- approved payment-mode verification PASS
- Razorpay webhook verification PASS
- monitoring verification PASS
- rollback verification PASS
- dependency/security audits PASS
- final secret scan PASS
- Government handover pack synchronized
- non-technical operating guide synchronized
- branding/handover instructions synchronized
- `CHANGELOG.md` finalized
- roadmap/status documentation synchronized
- known limitations/deferred items recorded
- reviewed release commit created
- required PR/review process completed
- exact release SHA remotely verified

### Stable release tag
Create a stable tag only after the exact final approved release commit is known and remotely verified.

Template only:
`git tag -a <STABLE_TAG> -m "<STABLE_RELEASE_MESSAGE>"`

Then, as a separate verified command:
`git push github <STABLE_TAG>`

After push, independently verify that the remote tag resolves to the exact approved release commit.

### Government handover boundary
Source handover must exclude `.env` secret values, service-account private keys, Razorpay secret values, credential-bearing logs, personal credentials and obsolete private backups.

Government/institutional acceptance, billing ownership, payment merchant ownership, domain ownership, data-controller responsibility and support obligations remain separate explicit decisions.

### HARD STOP
Do not close the release if smoke/E2E, security, rollback, secret scan, exact remote SHA/tag verification, production approval, or handover evidence is incomplete.

### Stage 12 execution PASS marker
`BLAZE_STAGE_12_RELEASE_CLOSURE=PASS`

Preparing this runbook section does not earn the Blaze execution PASS marker.

### Runbook preparation status
All Stage 0–12 command sections are now prepared. The runbook itself must still pass final content audit, secret scan, Git commit, push and remote SHA lock before it is classified CLOSED / VERIFIED / REMOTE-LOCKED.

## Global STOP Conditions
- Billing approval unknown
- Project identity ambiguous
- Test or security failure
- Secret exposure
- Unexpected cloud mutation
- Rollback unknown
- Production approval absent
