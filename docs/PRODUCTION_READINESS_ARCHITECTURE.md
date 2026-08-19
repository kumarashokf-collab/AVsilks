# AV Silks Production & Handover Readiness Architecture

## Stable Engineering Baseline

The locked MVP engineering baseline is:

- Branch: `main`
- Commit: `26c6ef059c22dbac0285c05a240bb5e55fd6f480`
- MVP implementation, regression testing, dependency audit, security closure, PR merge, and post-merge verification: verified.
- Production and government handover readiness is a separate phase and must earn its own evidence-based completion status.
- The stable `main` baseline must not be modified directly during production-readiness work.

This architecture is designed so that Blaze approval can arrive at any time without forcing an unsafe interruption, branch rewrite, or production deployment.

## Operating Modes

AV Silks uses four intentionally separated operating modes.

### Local Emulator

Purpose:

- Development and security verification.
- Firebase Authentication, Firestore, Functions, and Hosting integration testing.
- No production data.
- No production payment credentials.
- No billing requirement.

### Spark Demo

Configuration:

`firebase.spark.json`

Purpose:

- No-cost public Hosting path.
- Firestore rules deployment.
- Public QR provenance demonstration.
- Spark-safe admin QR workflow.
- Government demonstration while the backend production billing gate remains unavailable.

Security boundary:

- No Cloud Functions deployment.
- No `/api/**` Hosting rewrite to a Function.
- Backend payment services are not claimed as deployed in this mode.

### Blaze Staging

Configuration:

`firebase.json`

Purpose:

- First real Cloud Functions deployment target after explicit Blaze/billing approval.
- Backend `/api/**` integration testing.
- Authentication and RBAC smoke testing.
- Razorpay test mode only.
- Webhook verification and reconciliation testing.
- Security re-audit against a real deployed backend.

The staging Firebase project and billing target must be explicitly approved before use. A staging project must not silently default to the production project.

### Blaze Production

Configuration:

`firebase.json`

Purpose:

- Final approved Firebase Functions backend.
- Same-origin `/api/**` routing from Firebase Hosting.
- Production Firestore rules and Hosting.
- Approved payment configuration.
- Monitoring, rollback, and government/public handover.

Blaze Production is never activated merely because Blaze billing becomes available.

## Pre-Blaze Work Allowed

The following work may continue while Blaze approval is pending:

1. Production-readiness documentation.
2. Deployment and rollback checklist preparation.
3. Local Firebase Emulator integration testing.
4. Functions packaging validation that does not deploy.
5. Backend automated regression testing.
6. Frontend automated regression testing.
7. Frontend production builds.
8. Firestore rules validation.
9. Spark-safe public QR verification testing.
10. Authentication and RBAC boundary testing.
11. Razorpay adapter, signature, idempotency, replay, webhook, and reconciliation tests using test fixtures or Razorpay test mode.
12. Dependency vulnerability audits.
13. Secret scans.
14. CORS, Helmet, rate-limit, logging, and error-hygiene reviews.
15. Government handover documentation.
16. QR demo and operator-guide preparation.
17. Release and rollback procedure drafting.

Pre-Blaze preparation must not enable billing, deploy Functions, expose payment secrets, or silently convert the Spark deployment into a Blaze deployment.

## Blaze Approval Event Procedure

Blaze approval may arrive while another verified project task is in progress.

The mandatory interruption policy is:

**Finish the current atomic step before switching to the Blaze activation gate.**

When approval arrives:

1. Finish the current atomic Development Agreement step.
2. Verify its tests and security checks.
3. Create a clean Git checkpoint if the step changes tracked files.
4. Verify the worktree is clean.
5. Verify the approved Firebase project and billing state independently.
6. Record that approval without exposing billing credentials or secret values.
7. Confirm cost safeguards.
8. Confirm the staging target.
9. Confirm required secret names and Secret Manager readiness.
10. Re-run dependency and secret audits.
11. Re-run backend tests.
12. Re-run frontend tests and production build.
13. Validate Functions packaging.
14. Validate Firestore rules.
15. Deploy to Blaze Staging only.
16. Perform staging smoke and end-to-end tests.
17. Perform the Security Re-Audit.
18. Obtain explicit Production Approval.
19. Only then proceed to Blaze Production.

**Blaze approval does not authorize production deployment.**

An approval event changes availability of the deployment path; it does not bypass testing, staging, security, rollback, or production-approval gates.

## Billing Safety

Blaze is treated as a controlled production dependency, not as permission for unrestricted cloud usage.

Required safeguards:

- Confirm the exact Firebase/Google Cloud project before enabling or using billing.
- Review applicable no-cost quotas and billable services before deployment.
- Configure budget and threshold alerts before production rollout.
- Keep Firebase Functions instance scaling intentionally bounded.
- Review Cloud Build and Artifact Registry implications.
- Avoid unnecessary services or APIs.
- Review billing after staging and after initial production deployment.
- Document who is authorized to approve billing changes.

**Budget alerts are notifications, not an automatic spending hard cap.**

The architecture must never claim that a budget alert guarantees zero overspend.

## Secret Management

Required Firebase Secret Manager names:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Rules:

- Secret values must never be stored in Git.
- Secret values must never be copied into architecture documents.
- Secret values must never be printed into verification output.
- Local `.env` files remain ignored and untracked.
- Firebase service-account JSON and private keys remain excluded.
- Staging and production credentials should be separated.
- Razorpay live credentials must not be used during staging verification.
- Secret rotation and least privilege remain mandatory before final handover.

## Staging-First Deployment

Every Blaze deployment begins with staging.

Required order:

1. Verify clean approved branch state.
2. Verify project identity.
3. Verify billing approval.
4. Verify budget safeguards.
5. Verify Secret Manager bindings.
6. Verify Node.js 22 runtime contract.
7. Verify backend dependency boundary.
8. Run backend tests.
9. Run frontend tests.
10. Run frontend production build.
11. Run production dependency audits.
12. Run secret scans.
13. Validate Functions packaging.
14. Validate Firestore rules.
15. Deploy Functions to staging.
16. Verify `/api/health`.
17. Verify unauthenticated rejection boundaries.
18. Verify authenticated trusted-role resolution.
19. Verify admin/owner RBAC boundaries.
20. Verify order creation with approved safe test data.
21. Verify provenance lifecycle.
22. Verify public QR provenance.
23. Verify Razorpay test mode payment creation.
24. Verify signature validation.
25. Verify webhook processing.
26. Verify idempotency and replay protection.
27. Verify reconciliation/finalization.
28. Verify logs contain no secrets or unnecessary personal data.
29. Verify Hosting + `/api/**` routing.
30. Run full end-to-end staging validation.

No live payment credential is required for staging.

## Security Re-Audit

After staging is live, perform a dedicated post-deployment security review.

Mandatory review areas:

- Authentication token verification and revoked-token behavior.
- Trusted role resolution.
- Customer/vendor/admin/owner isolation.
- Firestore least-privilege rules.
- Public provenance exposure.
- Enumeration resistance for public identifiers.
- CORS policy.
- Helmet and security headers.
- `X-Powered-By` removal.
- Rate limiting and proxy/IP key handling.
- Request validation and sanitization.
- Error-response hygiene.
- Logging privacy.
- Razorpay signature verification.
- Webhook raw-body ordering.
- Amount verification.
- Idempotency.
- Replay protection.
- Inventory/payment transaction consistency.
- Secret Manager bindings.
- Tracked-secret and Git-history scans.
- Dependency vulnerabilities.
- Functions deployment configuration.
- Hosting rewrites.
- Rollback readiness.

Any high-severity unresolved security issue blocks Production Approval.

## Production Approval Gate

Production deployment requires explicit approval after staging evidence is complete.

Production Approval requires:

- Backend regression PASS.
- Frontend regression PASS.
- Production build PASS.
- Dependency audits acceptable under the locked security policy.
- Secret scans PASS.
- Firestore rules validation PASS.
- Staging end-to-end validation PASS.
- Security Re-Audit PASS.
- Monitoring plan ready.
- Rollback plan ready.
- Approved production Firebase project confirmed.
- Approved production payment mode confirmed.

Production must not be inferred from staging success.

## Rollback

Rollback is a first-class production requirement.

Rollback preparation must identify:

- The last verified Git commit/tag.
- The previous known-good Hosting release.
- The previous known-good Functions revision or deployment.
- Firestore rules rollback source.
- Safe handling for payment/webhook traffic during rollback.
- Data-consistency verification after rollback.
- Smoke tests required after rollback.

A production release is not considered closed until rollback capability has been demonstrated or verified according to the release plan.

## Government Handover

Government/public handover preparation can continue before Blaze approval.

Required handover assets include:

- Real saree demo with printed QR provenance tag.
- Public provenance verification demonstration.
- 60–90 second Telugu explanation.
- 60–90 second English explanation.
- One-page government briefing.
- Simple artisan traceability explanation.
- Non-technical operating guide.
- White-label and branding-change guide.
- Deployment guide.
- Architecture overview.
- API overview.
- Testing report.
- Security audit report.
- Release notes.
- AI-assisted development disclosure.
- Backup and rollback guide.

Technical infrastructure names may remain stable even when public branding changes.

## Stable Release Closure

After approved production deployment:

1. Verify public Hosting.
2. Verify `/api/health`.
3. Verify authentication.
4. Verify RBAC.
5. Verify public provenance.
6. Scan a real printed QR.
7. Verify approved payment mode.
8. Verify webhook behavior.
9. Verify Firestore rules.
10. Verify monitoring.
11. Verify rollback.
12. Finalize `CHANGELOG.md`.
13. Synchronize roadmap status.
14. Create the reviewed release commit if documentation changed.
15. Merge through the normal Git review process.
16. Create a stable version tag.
17. Push the stable tag.
18. Independently verify the remote tag and commit.
19. Preserve the government handover package against that release baseline.

Only this closure may establish the official production/handover stable release.

---

## Architecture Invariant

The permanent transition model is:

`Local Emulator → Spark Demo → Blaze Staging → Security Re-Audit → Explicit Production Approval → Blaze Production → Rollback Verification → Government Handover → Stable Release`

Spark remains the safe fallback path until Blaze Staging is explicitly activated.

Blaze approval can accelerate availability of the staging path, but it never short-circuits the Development Agreement.
