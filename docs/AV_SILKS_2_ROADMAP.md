# AV Silks 2 Enterprise Roadmap

## Project Identity

- Current internal code name: AV Silks
- Final public brand: Not yet approved
- Final logo, tagline, colors, domain, and identity: Pending Brand Approval Gate

## Current Locked Phase

### Order Security Foundation

Scope:

- Secure backend order creation
- Server-authoritative pricing and inventory
- Idempotency
- Customer cancellation
- Admin fulfilment transitions
- Authentication and RBAC enforcement
- Frontend order-write migration
- Firestore order-write lockdown
- Integration tests
- Security gates
- Documentation
- Git and release workflow

New future requirements must not interrupt this locked phase.

## Future Roadmap Classification

### Brand Approval & Migration Gate

- Approve final public name
- Approve logo, favicon, tagline, colors, typography, and domain
- Replace working code-name branding through centralized configuration
- Verify website, invoices, notifications, metadata, PWA, and payment identity
- Complete staging preview, backup, rollback, and acceptance testing

### Brand Settings Phase

- Owner/admin-controlled brand settings
- Logo and favicon upload validation
- Theme tokens
- Contact identity
- Domain configuration
- Preview and audit history
- Brand version snapshots
- Rollback support

### Vendor Commerce Phase

- Vendor registration and approval
- Vendor dashboard
- Vendor products and inventory
- Vendor orders
- Sales reports
- Store profile and KYC
- Vendor performance
- Admin/owner approval and rejection
- Rejection reasons and resubmission
- Audit history
- Only approved vendors and products are public

### Payments Phase

- Razorpay integration
- Optional PhonePe integration after approval
- Server-side payment order creation
- Signature and webhook verification
- Amount verification
- Idempotency and replay protection
- Refunds
- Invoices
- Settlements and payouts
- Commission and split payments
- Reconciliation
- Payment audit logs

### UI/UX Polishing Phase

- Mobile-first refinements
- Saree photography presentation
- Responsive images
- Attractive but accessible animations
- Button and form improvements
- Loading, empty, success, and error states
- Accessibility
- Performance and bundle optimization
- Cross-device testing

### Localization & Internationalization Phase

Initial languages:

- Telugu
- English
- Hindi
- Tamil

Requirements:

- Centralized translation files
- Locale-aware currency, dates, and numbers
- Fallback language
- Unicode-safe search
- Phased India-wide language rollout

### Enterprise White-Label / Multi-Brand Phase

- Centralized brand configuration
- Separate brand deployments
- Custom domains
- Theme and typography configuration
- Invoice, notification, social, PWA, and payment identity
- Owner/super-admin controls
- Tenant isolation
- Environment and secret isolation
- Audit history
- Historical brand snapshots
- Secure application handover workflow

### Release & Live Deployment Phase

Frontend options:

- Firebase Hosting
- Approved Vercel deployment

Backend options:

- Cloud Run
- Approved Render deployment
- Approved cloud server

Mandatory gates:

- Development/staging/production separation
- Build and tests
- Security scan
- Rules validation
- Secret scan
- Monitoring
- Smoke testing
- Backup
- Rollback
- CHANGELOG
- Git review and merge
- Stable release tag

## Future Fix List

- Firebase bundle optimization
- Existing broad CORS hardening
- Product write security migration
- Legacy fallback removal
- Additional monitoring and observability
- Further accessibility and performance improvements

Items in the Future Fix List must be scheduled into the correct phase and must not interrupt a locked current step.

<!-- ROADMAP_PLATFORM_SCOPE_DEPLOYMENT_ADDENDUM_20260730 -->

## Locked Roadmap Addendum — Enterprise Scope and Deployment Gates

### Current active gate: Order Security Foundation

The verified local implementation currently includes secured order creation, customer cancellation, admin fulfilment transitions, authenticated backend routes, atomic Firestore operations, production-safe frontend `/api` routing and Firebase Functions 2nd generation deployment preparation.

Verified backend test state: **176/176 tests PASS**.

Production deployment is not complete.

The current external blocker is Firebase Functions 2nd generation requiring explicit owner approval for the Firebase **Blaze pay-as-you-go plan**. Billing approval must occur before another Functions dry run or deployment attempt.

Hosting and Firestore configuration have passed a non-deploying Firebase CLI dry run. Production Firestore rules and Hosting assets remain undeployed as part of this feature lifecycle.

### Multi-Category Fashion Commerce phase

The platform roadmap must include a dedicated Multi-Category Fashion Commerce phase covering:

- Data-driven categories and subcategories
- Sarees, women's wear, men's wear, kids' wear, ethnic wear, western wear, ready-made garments, fabrics and accessories
- Category-specific configurable attributes
- Independent product variant SKUs
- Cross-category search, filters and navigation
- Cross-category inventory, cart, checkout, orders, payments, invoices and analytics
- Admin category management and controlled product schema extension
- Migration safety from the current working catalog

Implementation for unstarted portions of this phase must remain reported as zero percent until supported by verified code and tests.

### India-wide multilingual rollout

Multilingual delivery must be phased without rewriting core commerce logic.

Planned rollout order:

1. Establish centralized locale infrastructure and fallback rules.
2. Stabilize Telugu and English operational coverage.
3. Add Hindi and Tamil with reviewed commerce terminology.
4. Expand to other major Indian languages based on business priority.
5. Add RTL handling where required, including Urdu.
6. Add localized SEO, notifications, invoices, vendor interfaces and regional search improvements.
7. Introduce transliteration search only after measurable quality testing.

All legal, privacy, payment and policy translations require human review before production publication.

### Deployment architecture gate

The selected backend deployment architecture is Firebase Functions 2nd generation with the authoritative deployment source in `backend/`.

Mandatory deployment sequence remains:

1. Explicit billing and environment approval
2. Dependency and secret re-audit
3. Fresh backend tests
4. Fresh frontend production build
5. Functions packaging validation
6. Firestore rules compilation
7. Staging or preview deployment
8. Authenticated order security smoke tests
9. Production deployment approval
10. Coordinated Functions, Hosting and Firestore deployment
11. Live smoke tests and monitoring
12. Rollback verification
13. CHANGELOG synchronization
14. Git merge, release commit and stable tag

No billing upgrade, dry run, API enablement or deployment command substitutes for explicit production approval.

### Verified Phase-Progress Reporting gate

Every roadmap gate must use evidence-based reporting.

- Not started means 0 percent.
- Planning complete does not mean implementation complete.
- Local tests do not mean production deployment complete.
- Dry-run success does not mean live deployment complete.
- 100 percent requires all implementation, test, security, documentation, Git, deployment, smoke-test, rollback and stable-release evidence required by that phase.
- Future phases must remain separate from the active locked step.
