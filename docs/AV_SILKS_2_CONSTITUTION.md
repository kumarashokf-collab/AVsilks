# AV Silks 2 Enterprise Constitution

## 1. Status

This Constitution is permanent and governs the AV Silks 2 project.

“AV Silks” is currently an internal working code name only. It does not represent the final approved public business name, application name, logo, tagline, colors, domain, or complete brand identity.

## 2. Mission

Build AV Silks 2 as a secure, scalable, production-ready, enterprise commerce platform.

## 3. Development Agreement

The following rules are mandatory:

1. Work on one verified feature at a time.
2. Give one copy-paste command at a time.
3. Verify command output before proceeding.
4. Before every command explain:
   - Purpose
   - Risk level
   - Files affected
   - Rollback
5. Never develop directly on `main`.
6. Use feature or phase branches.
7. Never guess, use shortcuts, or accept unverified code.
8. Never commit secrets, credentials, private keys, environment files, or payment secrets.
9. Complete testing, security review, documentation, Git review, deployment verification, and rollback readiness.
10. Maintain a clean Git history and stable release tags.
11. Update the root `CHANGELOG.md` for every stable version.
12. Maintain separate development, staging, and production environments and credentials.
13. Side questions and new ideas must be classified into:
    - Current phase
    - Later roadmap phase
    - Future Fix List
14. Side requirements must not interrupt a locked current step.
15. Repository governance documents must be updated only during a dedicated Documentation Gate.

## 4. Mandatory Workflow

Read → Understand → Design → Review → One Command → Verify → Test → Security → Documentation → Commit → Push → Review → Merge → Deploy → Smoke Test → Rollback Check → Tag → Lock

## 5. Security Gate

Before feature merge or production deployment:

- Run backend and frontend tests.
- Validate Firestore and Storage rules.
- Scan changed files and Git history for secrets.
- Verify authentication and token expiry handling.
- Verify RBAC for customer, vendor, admin, owner, and future super-admin roles.
- Enforce least-privilege database and storage access.
- Verify CORS, CSP, HTTPS, HSTS, rate limits, validation, sanitization, logging, and secure errors.
- Verify payment signatures, amounts, webhooks, idempotency, replay protection, refunds, and reconciliation where applicable.
- Verify backup and rollback procedures.
- Confirm no `.env`, service-account JSON, private keys, API secrets, logs, build output, or dependency folders are committed.

## 6. Brand Identity Policy

Until formal brand approval:

- “AV Silks” remains a working code name.
- Development must avoid scattered or irreversible hardcoded branding.
- Brand values must be centralized and replaceable.
- Public production launch must not assume the code name is the final brand.

A dedicated Brand Approval and Migration Gate is required before final public release.

## 7. Brand Identity Management

The platform must support owner-controlled changes to:

- Public business/application name
- Logo and favicon
- Tagline
- Color and theme tokens
- Typography
- Contact details
- Domain and subdomain
- Invoice identity
- Email, SMS, and notification identity
- Social metadata and preview images
- PWA and future mobile-app assets
- Approved payment display identity

Brand changes must include validation, preview, audit history, backup, rollback, and role-restricted access.

Historical orders, invoices, payments, refunds, notifications, and audit records must preserve the brand snapshot applicable when they were created.

## 8. Enterprise White-Label Capability

The platform must support optional white-label deployment for another approved person or business.

White-label changes must be possible through centralized configuration rather than scattered manual code edits.

Each recipient or tenant must have a separate approved environment, including:

- Firebase or cloud project
- Database
- Storage
- Authentication
- Payment gateway account and keys
- Domain
- Secrets
- Logs
- Backups
- Deployment configuration

AV Silks customer data, orders, payments, credentials, private files, business information, or production secrets must never be copied to another recipient.

Backend-verified tenant or domain mapping is mandatory. The frontend must never be trusted to select an arbitrary tenant.

Multi-tenant deployments must strictly isolate users, products, orders, inventory, payments, files, analytics, settings, API keys, domains, and logs.

## 9. Secure Application Handover

Giving or licensing the application to another approved person or business requires:

- Rebranding checklist
- Separate infrastructure and credentials
- Data-isolation verification
- Staging preview
- Security scan
- Backup
- Rollback plan
- Technical documentation
- Deployment documentation
- Acceptance testing
- Formal handover confirmation

## 10. Payment Gateway Requirement

A dedicated Payments phase must support secure online payment gateways such as Razorpay and, after approval, PhonePe.

Mandatory protections include:

- Server-side payment order creation
- Signature verification
- Webhook verification
- Server-side amount verification
- Idempotency
- Replay protection
- Refund handling
- Reconciliation
- Settlement and audit records
- No payment secrets in frontend code or Git

## 11. UI/UX Polishing Requirement

After core commerce and security flows are stable, a dedicated UI/UX phase must improve:

- Mobile-first experience
- Saree image presentation
- Buttons and controls
- Responsive layouts
- Animations and transitions
- Loading, empty, success, and error states
- Accessibility
- Performance
- Image optimization
- Bundle optimization

UI polish must not weaken security, validation, accessibility, or performance.

## 12. Live Deployment Requirement

Production deployment must include:

- Frontend on Firebase Hosting or another approved host such as Vercel
- Backend on Cloud Run, Render, or another approved production server
- Separate development, staging, and production environments
- Secure secrets management
- Production builds
- Automated and manual tests
- Security scans
- Smoke tests
- Monitoring and logging
- Backup verification
- Rollback verification
- CHANGELOG update
- Git commit, review, merge, and stable tag

No deployment is considered stable until all release gates pass.

## 13. AI Ethics Statement

“AV Silks 2 was developed using ChatGPT as an engineering assistant. I was responsible for the requirements, engineering decisions, integration, testing, debugging, security verification, Git workflow, and deployment.”

<!-- PLATFORM_SCOPE_GOVERNANCE_ADDENDUM_20260730 -->

## Locked Addendum — Platform Scope and Verification Governance

### Multi-Category Fashion Commerce

AV Silks is an internal working code name for the platform and must not create an irreversible saree-only architecture.

The commerce platform must support data-driven categories and subcategories for:

- Sarees and handloom products
- Women's wear
- Men's wear
- Kids' wear
- Ethnic wear
- Western wear
- Ready-made garments
- Fabrics and dress materials
- Fashion accessories
- Future fashion and lifestyle categories approved by the owner

Category definitions, slugs, icons, display order, translations and activation state must be manageable through controlled admin or owner workflows.

The product model must support configurable category-specific attributes, independent variant SKUs, price, stock, images, dimensions, colour, fabric, size and future attributes without requiring core architecture rewrites.

Catalog, search, filters, cart, wishlist, checkout, orders, inventory, payments, invoices, reviews, vendor workflows and analytics must operate consistently across all supported categories.

### India-wide multilingual architecture

The platform must be designed for India-wide multilingual expansion and support all major Indian languages through phased delivery.

The initial rollout may prioritize Telugu, English, Hindi and Tamil, but new languages must be addable without rewriting core business logic.

Mandatory multilingual foundations include:

- Centralized translation resources
- Localized category and product content
- Unicode-safe storage, display and search
- Reliable Indian-script font fallback
- Locale-aware dates, numbers, currency, addresses and plural rules
- Per-language SEO titles, descriptions and social metadata
- Customer language preference and controlled fallback language
- Localized customer, admin and vendor interfaces
- Localized notifications, invoices, order timelines and transactional content
- Right-to-left layout support where required, including Urdu
- Transliteration-assisted search where technically and linguistically appropriate
- Human review for legal, payment, privacy and policy translations

Machine translation must not be treated as final approval for legally or commercially sensitive text.

### Verified Phase-Progress Reporting

Progress reporting is a permanent governance gate.

Every requested progress report or major gate report must identify:

- Current phase
- Evidence-based verified completion percentage
- Verified pending percentage
- Completed gates
- Pending gates
- Current blocker
- Exact next locked step
- Current deployment and release state

A phase that has not started must be reported as zero percent.

A phase may be reported as 100 percent only after its required implementation, automated tests, security checks, documentation, Git commit and push, review or merge, deployment where required, live smoke tests, rollback verification, CHANGELOG update and stable release or tag are complete.

Planning, discussion, architecture approval or documentation alone must never be reported as implemented functionality.

Future-phase requirements must be clearly separated from the active phase and must not divert the current locked step.
