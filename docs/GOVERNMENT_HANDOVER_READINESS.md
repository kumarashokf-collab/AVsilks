# AV Silks Government Handover Readiness

## Purpose

This document prepares the AV Silks
Government Handloom White-Label + QR Provenance MVP
for a future government demonstration, review, technical handover,
and non-technical operational handover.

This document records readiness only. It does not claim that a government
department has approved, adopted, deployed, or accepted the platform.

Production approval remains separate.

## 1. What the MVP is

The platform is designed as a reusable digital foundation for handloom
products and artisan provenance.

Core MVP goals include:

- a public product and provenance experience;
- QR-based public provenance verification;
- artisan/contributor traceability;
- protected administration and trusted backend authorization;
- payment integration architecture;
- white-label readiness for government or institutional branding;
- staging, security, rollback, and production-readiness controls.

## 2. Non-technical operating guide

### For an operator

A non-technical operator should be able to perform normal approved tasks
through the application UI without editing source code.

Typical operating workflow:

1. Sign in with the authorized account.
2. Open the relevant administration area.
3. Create or review artisan information.
4. Create or review product information.
5. Create provenance information for the product.
6. Publish only verified provenance records.
7. Generate or associate the public QR/public provenance identifier.
8. Attach the printed QR to the corresponding physical saree/product.
9. Scan the QR from another device.
10. Confirm that the public provenance page shows only approved public
    information.
11. Record operational issues for technical review rather than changing
    backend security settings manually.

Never place passwords, API secrets, payment secrets, private keys, or
Firebase Admin credentials into public documents, QR codes, screenshots,
or support messages.

## 3. Brand change and handover guide

The long-term white-label direction is to centralize changeable branding
instead of requiring a government operator to edit many source files.

Branding scope can include:

- organization/platform name;
- logo and favicon;
- tagline;
- contact information;
- theme tokens;
- public-facing identity;
- invoice/notification identity where applicable.

Owner-only branding is the intended administrative boundary for protected
branding changes.

A future non-coder branding workflow should use a reviewed owner-only UI
or centralized configuration path. Branding changes must not expose or
modify payment credentials, Firebase Admin credentials, authentication
rules, RBAC permissions, or security secrets.

## 4. Government handover checklist

Before any formal handover, verify all applicable items:

- defined MVP scope is documented;
- source code handover package is prepared;
- Git history and stable release reference are recorded;
- installation/deployment instructions are current;
- environment separation is documented;
- staging validation is complete;
- public QR provenance flow is demonstrated;
- administration/RBAC behavior is demonstrated;
- payment configuration is explained without exposing secrets;
- rollback readiness is documented and tested at the required stage;
- security re-audit is completed at the required live staging boundary;
- current dependency/security review is recorded;
- production approval is explicit and separate;
- final production smoke/E2E evidence is preserved;
- non-technical operating instructions are supplied;
- brand change instructions are supplied;
- known limitations and deferred items are listed;
- government/demo contact and responsibility boundaries are recorded.

## 5. Source code handover

Source code handover should include, as applicable:

- the approved Git repository/release;
- exact stable commit or release tag;
- frontend source;
- backend source;
- Firebase configuration templates without secret values;
- Firestore/Storage rules;
- tests;
- architecture documentation;
- security documentation;
- deployment guide;
- rollback guide;
- government operating guide;
- release notes and known limitations.

Do not include:

- `.env` secret values;
- service-account private keys;
- Razorpay secret values;
- temporary logs containing credentials;
- personal credentials;
- obsolete private backup archives.

## 6. Deployment guide boundary

Deployment must follow the documented environment order:

Local verification → Spark demo where applicable → Blaze staging →
live security validation → explicit production decision → production
deployment → production verification.

A staging approval never authorizes production.

Budget alerts and billing safeguards must be documented separately from
technical deployment success.

## 7. Rollback readiness

Rollback readiness is required before final handover.

Hosting and Backend Functions are currently treated as separate recovery
lanes unless a future reviewed architecture deliberately introduces and
tests a different coupling mechanism.

A rollback is not successful merely because a deployment command exits
successfully. Post-rollback health, routing, security, public provenance,
and application verification are required.

## 8. Security re-audit

The pre-handover security process must include the locked security
re-audit checklist.

The local source/config preflight does not replace live Blaze staging
validation.

Before government handover, verify at minimum:

- security headers;
- same-origin/CORS boundary;
- rate limiting;
- authentication failures;
- trusted RBAC permission denial;
- public endpoint inventory;
- QR provenance exposure;
- payment test-mode signature/replay/idempotency boundaries;
- error/logging hygiene;
- secret management;
- current dependency advisory status;
- live smoke/E2E regression.

## 9. AI-assisted development disclosure

AI-assisted development disclosure is part of the handover record.

Recommended disclosure:

“AV Silks was developed using ChatGPT as an engineering assistant.
I was responsible for the requirements, engineering decisions,
integration, testing, debugging, security verification, Git workflow,
and deployment.”

ChatGPT as an engineering assistant does not replace human ownership,
review, testing, security validation, operational approval, or government
acceptance.

The handover package should distinguish AI assistance from verified
engineering evidence such as tests, Git commits, deployment records,
security reviews, and live validation.

## 10. Roles and responsibility boundary

Government/institutional ownership after a formal transfer must be
defined separately in the legal, administrative, hosting, billing,
domain, data-controller, and operational arrangements.

Technical source-code possession alone does not automatically transfer:

- cloud billing responsibility;
- payment merchant ownership;
- domain ownership;
- legal data-controller responsibility;
- support obligations;
- production credentials.

These items require explicit handover decisions.

## 11. Current readiness boundary

This document is documentation and demo readiness.

It does not itself mark the following as complete:

- Blaze staging deployment;
- live staging E2E;
- live security re-audit;
- production approval;
- production deployment;
- live rollback drill;
- final government acceptance.

Those remain separate verified gates.
