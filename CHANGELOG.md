# AVsilks Changelog

All notable changes to this project will be documented here.

## Unreleased

<!-- QR_PROVENANCE_FOUNDATION_20260814 -->

### QR Provenance Foundation

#### Added
- Added centralized provenance schema/status/field-limit policy.
- Added strict Joi validation for artisan and provenance creation.
- Added atomic artisan creation with canonical artisan-code reservation through `artisanCodes/{artisanCode}`.
- Added atomic provenance creation through `provenanceRecords/{provenanceId}` with opaque public-ID reservation in `provenancePublicIds/{publicId}`.
- Added atomic product linkage through `products/{productId}.provenanceId` and `publicProvenanceId`.
- Added immutable product and artisan provenance snapshots for SKU, product name, artisan code, and artisan display name.
- Added trusted Artisan and Provenance service, controller, and route layers.
- Added protected `POST /api/artisans` and `POST /api/provenance` API routes.
- Added Artisan and Provenance RBAC permission catalog entries.

#### Security
- Artisan and provenance writes require authenticated trusted backend sessions and explicit RBAC permissions.
- Admin receives explicit Artisan and Provenance management permissions; customer and vendor roles do not receive provenance-management access.
- Client-controlled audit fields, provenance status, public IDs, and product/artisan linkage overrides are rejected.
- Artisan codes are transactionally reserved to prevent duplicate-code races.
- Provenance creation fails atomically for missing/inactive artisans, missing products, already-linked products, and public-ID conflicts.
- Artisan and provenance API responses use explicit allowlists and exclude internal audit metadata.
- Firestore client access to `artisans`, `artisanCodes`, `provenanceRecords`, and `provenancePublicIds` remains denied by the default-deny rules posture.
- Firebase deployment configuration references `frontend/firestore.rules`.
- Worktree secret scan across all 23 modified/untracked QR Provenance candidate files: **PASS**.

#### Architecture
- Artisan identity and product provenance are stored in separate collections.
- QR/public provenance identifiers are opaque and separate from internal provenance document IDs.
- Provenance creation is backend-only and uses Firestore transactions.
- Public QR verification is intentionally not exposed directly through Firestore; a sanitized backend verification flow remains pending.
- Publish/archive lifecycle and public QR verification UI remain pending and are not claimed as completed by this foundation.

#### Verified
- Artisan repository tests: **3/3 PASS**.
- Artisan service tests: **4/4 PASS**.
- Artisan controller tests: **6/6 PASS**.
- Artisan route tests: **4/4 PASS**.
- Provenance repository tests: **6/6 PASS**.
- Provenance service tests: **4/4 PASS**.
- Provenance controller tests: **7/7 PASS**.
- Provenance route tests: **4/4 PASS**.
- App-mount and runtime integration gate: **19/19 PASS**.
- Full backend automated regression suite: **231/231 PASS**.
- RBAC configuration: **13 roles, 72 permissions, PASS**.
- Git whitespace/integrity checks performed during implementation: **PASS**.
- Production deployment performed for this foundation: **No**.

<!-- FRONTEND_TRUSTED_AUTH_SESSION_20260813 -->

### Frontend Trusted Backend Auth Session

#### Added
- Added a centralized frontend API base URL service.
- Added trusted frontend session resolution through authenticated `GET /api/auth/me`.
- Added Firebase ID-token forwarding through the `Authorization: Bearer` header.
- Added trusted `{ uid, role }` session propagation to application routing, navigation, and order administration UI.

#### Security
- Removed the hardcoded frontend admin phone allowlist.
- Removed client-derived `getUserRole` and `isAdminUser` authorization decisions.
- Admin UI access now depends on the backend-verified trusted role.
- Trusted session responses are rejected when the backend UID does not match the authenticated Firebase UID.
- Invalid or missing trusted roles fail closed without granting admin access.
- Removed all active frontend references to the legacy phone-based RBAC module.

#### Architecture
- Centralized API base URL resolution in `frontend/src/services/api.js`.
- Added trusted session handling in `frontend/src/services/authSession.js`.
- Reused the centralized API helper from the order context instead of maintaining duplicate API-base logic.
- Added environment-gated Firebase Authentication and Firestore emulator wiring in `frontend/src/firebase.js`; emulator connections activate only when `VITE_USE_FIREBASE_EMULATORS=true`.

#### Verified
- Frontend project-wide lint: **0 errors**.
- Frontend production build: **PASS** with 86 modules transformed.
- Backend automated regression tests: **189/189 PASS**.
- Legacy frontend phone-based RBAC reference scan: **PASS (zero references)**.
- Git staged whitespace/integrity check: **PASS**.
- Pre-staging and staged secret scans: **PASS**.

<!-- TRUSTED_AUTH_RUNTIME_VERIFICATION_20260813 -->
- Local Hosting → Functions `/api/health` runtime check: **HTTP 200 PASS**.
- Auth + Firestore + Functions trusted-admin runtime session check: **PASS**.
- Missing trusted role safely defaulted to `customer`: **PASS**.
- Browser Phone OTP → Firebase authentication → trusted `/api/auth/me` → `/admin` redirect: **PASS**.
- Emulator shutdown restored the temporary Firebase Functions SDK change exactly by SHA-256: **PASS**.
- Final emulator process/port cleanup: **PASS**.
- Production Firebase configuration is stored only in ignored local environment configuration with mode `600`: **PASS**.
- Fresh production build: **PASS** with 86 modules transformed.
- Production bundle contains the production Firebase project/auth configuration and contains no demo project, Auth emulator, or Firestore emulator endpoints: **PASS**.
- Final tracked-secret, pending-diff-secret, and production-env tracking checks: **PASS**.


<!-- WHITE_LABEL_FOUNDATION_20260814 -->

### White-Label Brand Foundation

#### Added
- Established `frontend/src/config/branding.js` as the authoritative public brand identity source.
- Centralized brand name, short name, tagline, bundled logo, favicon, legal identity and copyright metadata.
- Centralized Navbar, Login, Hero, Products, Privacy, Cart, Security Lock, order UI and fallback labels on `BRAND`.
- Derived Store address/content and Theme display identity from the centralized brand configuration.

#### Architecture
- Separated public brand identity from stable technical namespaces such as local-storage keys, emulator project IDs, upload filenames and storage folders.
- Preserved `CONTACT` as a separately replaceable deployment contact configuration.
- Preserved commerce/navigation/category content in `STORE` while removing duplicate top-level brand identity fields.

#### Verified
- Customer-visible hardcoded public brand scan outside `branding.js`: **PASS**.
- Changed-file lint: **0 errors**; three pre-existing non-blocking warnings remain in CartContext, OrderContext and Admin.
- Frontend production build: **PASS** with 86 modules transformed.
- Git whitespace/integrity check: **PASS**.

<!-- FUNCTIONS_EMULATOR_READINESS_20260807 -->

### Firebase Functions Emulator Readiness

#### Added
- Separated reusable Express app startup from the standalone local server.
- Added `backend/server.js` with local-only `.env.server.local` loading.
- Added Firebase Authentication, Firestore, Functions, and Hosting emulator configuration.
- Added `scripts/termux-firebase-emulators.sh` for Termux-safe local emulator startup.
- Added seven runtime-readiness automated tests.

#### Security
- Emulator launcher uses only `demo-avsilks-local`.
- No production deploy command is included.
- Firebase Functions SDK shebang is patched only temporarily during local emulator execution.
- Original SDK bytes are restored and SHA-256 verified on shutdown.
- `backend/.env.server.local` remains ignored and untracked.
- Reserved `backend/.env` must remain absent.

#### Verified
- Backend automated tests: **183/183 PASS**.
- Frontend production build: PASS.
- Authentication Emulator: PASS.
- Firestore Emulator: PASS.
- Functions Emulator: PASS.
- Hosting Emulator: PASS.
- Hosting `/api/health`: HTTP 200.
- Direct Functions `/api/health`: HTTP 200.
- Unauthenticated order creation: HTTP 401.
- Accidental order documents created: zero.
- Gitleaks history scan: PASS.
- Gitleaks candidate-source scan: PASS.
- Production deployment performed: No.
- Production Firestore rules deployed: No.

### Security
- Completed Phase 0 Security Recovery Gate.
- Rotated Razorpay Test API Keys.
- Rotated Firebase Service Account credentials.
- Removed old Firebase service account keys.
- Removed old Razorpay API key exports.
- Verified repository with Gitleaks (no leaks found).
- Hardened verifyAuth middleware with revoked-token validation, role extraction, and minimal req.user.

### Order Security Foundation

#### Added

- Added strict Joi validation for secure COD order creation.
- Rejected client-controlled totals, statuses, payment state, and product snapshots.
- Added centralized order limits, shipping, payment, and idempotency policies.
- Added canonical order statuses and fulfilment transition rules.
- Added authoritative product snapshot and paise-based pricing services.
- Added deterministic per-user checkout idempotency identities using SHA-256 hashes.
- Added atomic Firestore order creation and stock-deduction transaction repository.
- Added secure order application service, controller, repository, validators, and protected routes.
- Protected `POST /api/orders` with authentication and `orders.create` permission.
- Added secure customer cancellation through `POST /api/orders/:id/cancel`.
- Added ownership validation and atomic inventory restoration for eligible cancellations.
- Added secure admin fulfilment through `PATCH /api/orders/:id/status`.
- Limited admin fulfilment to canonical forward transitions:
  - Processing to Confirmed
  - Confirmed to Packed
  - Packed to Shipped
  - Shipped to Delivered
- Added immutable order status-history entries with trusted actor identity.
- Added standardized authentication errors for missing, invalid, expired, revoked, and disabled accounts.
- Migrated checkout, customer cancellation, and admin fulfilment frontend writes to protected backend APIs.
- Added duplicate-submit protection and per-order admin UI errors.
- Added Firestore rules that deny all direct client order create, update, and delete operations.
- Added permanent automated coverage for validation, pricing, products, idempotency, transactions, cancellation, fulfilment, repositories, services, controllers, routes, transitions, and authentication.

#### Security

- Backend prices, stock, totals, shipping, payment method, and initial status remain authoritative.
- Raw checkout idempotency keys are not stored or returned.
- Internal request fingerprints and idempotency hashes are excluded from API responses.
- Duplicate checkout retries do not deduct stock more than once.
- Reusing an idempotency key with changed request content is rejected.
- Missing products, inactive products, invalid quantities, and insufficient stock produce no partial writes.
- Customers may cancel only their own eligible early-stage orders.
- Cancellation inventory restoration and status update occur atomically.
- Admin fulfilment rejects skipped, reversed, cancellation, return, and terminal-status transitions.
- Direct frontend Firestore order writes were removed from active order UI flows.
- Firestore client order writes are configured to fail closed.
- Authentication and authorization errors return sanitized responses.
- Accidental terminal pager artifacts were audited, hash-verified, and removed.
- No payment secrets, private keys, Firebase Admin credentials, or environment values were added.

#### Documentation

- Added `docs/AV_SILKS_2_CONSTITUTION.md`.
- Added `docs/AV_SILKS_2_ROADMAP.md`.
- Recorded the permanent Development Agreement and mandatory workflow.
- Classified AV Silks as an internal working code name until formal brand approval.
- Added future Brand Settings and Brand Approval gates.
- Added Enterprise White-Label, Multi-Brand, and Secure Application Handover requirements.
- Added future Payments, UI/UX Polishing, Localization, Vendor Commerce, and Live Deployment phases.

#### Verified

- Backend automated tests: 170/170 PASS.
- Frontend production build PASS.
- Protected unauthenticated order-creation smoke test returned HTTP 401 with no write.
- Protected unauthenticated cancellation smoke test returned HTTP 401 with no write.
- Protected unauthenticated admin fulfilment smoke test returned HTTP 401 with no write.
- Authenticated admin fulfilment integration reached the secured repository and returned `ORDER_NOT_FOUND` for a deliberately fake order ID without creating data.
- Trusted admin/owner Firestore role and Firebase Authentication account prerequisites verified.
- Firestore rules production dry-run compiled successfully.
- Active frontend order-write audit found no direct order create, update, delete, batch, or transaction writes.
- Firestore order lockdown assertions PASS.
- Changed and untracked source secret scan PASS.
- Git whitespace and conflict-marker integrity checks PASS.
- Accidental root-file cleanup and post-cleanup worktree integrity PASS.
- Feature branch: `feature/order-security-foundation`.

#### Pending

- Configure separate production/staging API endpoints; the current frontend environment still points to localhost.
- Verify authenticated customer order creation using explicitly approved safe test data.
- Complete coordinated backend, frontend, and Firestore-rules deployment sequencing.
- Do not deploy restrictive Firestore rules before the protected production backend is available.
- Run final staged-file and complete Git-history secret scans.
- Review the complete feature diff.
- Git commit and push the feature branch.
- Merge review and merge to `main`.
- Production smoke tests and monitoring verification.
- Rollback verification, CHANGELOG release finalization, and stable version tag.

### Backend RBAC Foundation
#### Added
- Added centralized backend role and permission catalogues.
- Added role-to-permission mappings for 13 application roles.
- Added reusable `verifyRole` and `requirePermission` middleware.
- Added startup-time RBAC configuration validation.
- Protected `POST /api/products` with authentication and `products.create` permission.
- Added automated RBAC tests using the built-in Node.js test runner.
- Added permanent `npm test` command for backend tests.
- Added structured authorization-denial audit logging without tokens or personal data.
- Hardened authenticated role resolution with role validation, Firestore precedence, and fail-closed customer fallback.

#### Verified
- RBAC configuration validation ✅
- JavaScript syntax sweep ✅
- Git diff and conflict-marker integrity check ✅
- Missing-token HTTP response: 401 ✅
- Invalid-token HTTP response: 401 ✅
- Public product GET regression response: 200 ✅
- Role-permission authorization matrix ✅
- Automated RBAC tests: 17/17 PASS ✅
- Focused RBAC source secret scan ✅
- Authorization audit logging privacy check ✅
- verifyAuth bearer-token and trusted-role helper tests ✅
- Firestore role precedence and fail-closed fallback tests ✅

## v0.7.5 - RBAC Foundation
Date: 2026-07-21

### Changed
- Centralized frontend admin detection using `isAdminUser()`.
- Removed duplicate admin phone lists.
- Kept admin phone numbers only in `src/constants/admin.js`.
- Updated Navbar and Login to use the centralized helper.

### Verified
- Build ✅
- Preview Deploy ✅
- Admin Login Redirect Live Test ✅
- Admin Panel Visibility Live Test ✅
- Secret Scan ✅
- Git Feature Branch Commit ✅
- Git Feature Branch Push ✅

---

## v0.7.4 - Checkout Validation
Date: 2026-07-20

### Added
- Validated checkout items against the latest live product data.
- Blocked missing, inactive, out-of-stock, and over-quantity products.
- Recalculated subtotal, shipping, and total using the latest product price.

### Verified
- Audit ✅
- Build ✅
- Deploy ✅
- Valid-order live test ✅
- Secret Scan ✅
- Git Feature Branch ✅

---

## v0.7.3 - Cart Stock Safety
Date: 2026-07-19

### Added
- Prevented out-of-stock products from being added to the cart.
- Limited first-time cart quantity to available stock.
- Preserved existing quantity merge behavior.

### Verified
- Audit ✅
- Build ✅
- Deploy ✅
- Live Test ✅
- Secret Scan ✅
- Git Feature Branch ✅

---

## v0.7.2 - Search Debounce
Date: 2026-07-19

### Added
- Added 300ms debounce for Home search.
- Added 300ms debounce for Products search.

### Verified
- Audit ✅
- Build ✅
- Deploy ✅
- Live Test ✅
- Secret Scan ✅
- Git Feature Branch ✅

---

## v0.7.1 - Order Date Formatting

### Fixed
- Fixed My Orders date & time formatting.
- Fixed Order Details date & time formatting.

---

## v0.6.2 - Firebase Bundle Optimization

### Changed
- Removed unused Firebase Storage.
- Removed unused Firebase Messaging.
- Reduced frontend Firebase initialization complexity.

<!-- ORDER_SECURITY_DEPLOYMENT_PREP_SYNC_20260730 -->

## Unreleased — Order Security Foundation Deployment Preparation Synchronization

### Verified implementation evidence

- Backend order security test suite: **176/176 tests PASS** with zero failures.
- Firebase Functions 2nd generation HTTP entry is defined in `backend/functions.js` using the `asia-south1` region and a controlled maximum instance setting.
- The authoritative Functions source is `backend/`; `backend/package.json` loads `functions.js` as its deployment entry.
- Root Firebase deployment configuration now coordinates:
  - Functions source: `backend`
  - Hosting build: `frontend/dist`
  - Firestore rules: `frontend/firestore.rules`
  - Hosting `/api/**` rewrite to the `api` Function
  - SPA fallback to `frontend/dist/index.html`
- Frontend production API protection forces the same-origin `/api` base during production builds while preserving local development API configuration.
- Verified production build contains the order create, customer cancel and admin status routes and contains no `localhost:8080`, `127.0.0.1:8080` or local API URL.
- The obsolete `frontend/functions` scaffold was retired from the repository. Its four tracked files and generated dependencies were moved to an exact external rollback backup.
- Firebase Functions upload simulation included only the required backend application payload and excluded `.env`, tests, dependency folders, logs, private keys and service-account files.
- Hosting and Firestore configuration completed a Firebase CLI dry run successfully; Firestore rules compiled successfully.
- Combined Functions deployment dry run was stopped before deployment because Firebase Functions 2nd generation requires the Firebase **Blaze pay-as-you-go plan** and Artifact Registry availability.
- No Functions, Hosting or Firestore production deployment was performed during these preparation steps.

### Dependency security status

- The approved Firebase SDK pairing remains exactly:
  - `firebase-admin` 12.7.0
  - `firebase-functions` 7.2.5
- Production dependency audit remains at zero critical, zero high and eight moderate advisories.
- The dedicated dependency risk acceptance remains temporary and applies only to deployment preparation.
- Dependency risk must be re-audited and explicitly reviewed before production approval, merge or stable release.

### External release blocker

- Firebase Functions deployment cannot continue until the project owner explicitly approves Blaze billing.
- Blaze approval does not itself authorize deployment; all remaining security, documentation, Git, staging, smoke-test and rollback gates remain mandatory.
