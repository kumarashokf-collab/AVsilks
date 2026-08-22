# AV Silks Future Customer Growth Activation, Migration & Testing Roadmap v1

Status: FUTURE-ONLY / ARCHITECTURE CONTENT CLOSURE ROADMAP / NOT PRODUCTION APPROVAL

## 1. Purpose

Define the controlled path from completed Customer Growth architecture to a future
implementation.

This roadmap covers:

- activation prerequisites;
- implementation separation;
- migration;
- staging;
- automated testing;
- security re-audit;
- privacy/financial review;
- monitoring;
- rollback;
- production approval;
- post-deployment verification.

`Architecture Completion Does Not Authorize Implementation or Production.`

## 2. Blaze P0 Priority

Blaze production-readiness remains P0 and first priority.

Before beginning any future Customer Growth implementation activity, verified
Blaze status must be handled according to `BLAZE_P0_INTERRUPT_RULE.md`.

Customer Growth architecture must never delay an approved Blaze MVP gate.

`BLAZE_PRIORITY=P0_LOCKED`

## 3. Architecture Closure Boundary

Reaching `100%` in this Future architecture means the planned architecture content
gates are complete.

It does NOT mean:

- Growth features are implemented;
- production data exists;
- providers are configured;
- customers are enrolled;
- promotions are live;
- loyalty value exists;
- Government programs are active.

## 4. Future Implementation Branch

Any later implementation must use a separately reviewed implementation branch.

Do not implement Growth source code directly on:

- `main`;
- `release/mvp-production-readiness`;
- this parked architecture branch.

Architecture and implementation histories remain distinguishable.

## 5. Implementation Scope Approval

Before implementation starts, explicitly select which capabilities are in scope.

Examples include:

- promotions/coupons;
- loyalty;
- referrals;
- gift/store value;
- campaigns;
- analytics;
- experiments.

Do not activate every architecture concept automatically.

## 6. Provider Selection Boundary

No CRM, messaging, analytics, experimentation, loyalty or marketing provider is
approved by these architecture documents.

Provider selection requires a separate review covering:

- security;
- privacy;
- credentials;
- data transfer;
- retention/deletion;
- callbacks/webhooks;
- cost;
- vendor lock-in;
- migration/exit.

## 7. Legal / Financial Review Boundary

Before implementation of financially or legally sensitive capabilities, separately
review applicable:

- stored value;
- gift cards;
- loyalty financial treatment;
- expiry;
- tax treatment;
- refund allocation;
- Government funding;
- marketing consent;
- tracking.

Architecture does not invent legal conclusions.

## 8. Canonical Domain Implementation Order

A future implementation should establish authoritative domain boundaries before
customer-facing activation.

A safe conceptual sequence is:

1. canonical identities and schemas;
2. Auth/RBAC/object authorization;
3. server-authoritative promotion rules;
4. pricing/checkout contracts;
5. ledger/value domains;
6. campaign/consent domains;
7. analytics/experimentation projections;
8. provider adapters;
9. customer/vendor UI.

## 9. Database Schema Review

Before persistence changes, review:

- canonical IDs;
- tenant ownership;
- immutable/versioned records;
- ledger semantics;
- indexes;
- public/private fields;
- retention;
- migration fields;
- audit fields.

Do not copy architecture examples directly into production without schema review.

## 10. API Contract Review

Future APIs require explicit contracts for:

- authentication;
- authorization;
- validation;
- idempotency;
- pagination;
- error responses;
- versioning;
- public/private projection;
- rate limits.

Provider-specific APIs remain behind adapters where appropriate.

## 11. Source-of-Truth Review

Before coding each capability, identify its authoritative source.

Examples:

- Promotion domain -> commercial promotion rules;
- Pricing/Checkout -> final money;
- Order -> order state/history;
- Payment -> payment verification;
- Loyalty ledger -> loyalty balance evidence;
- Value ledger -> stored-value evidence;
- Provenance -> provenance truth;
- Vendor domain -> vendor ownership/status.

Derived systems never inherit authority accidentally.

## 12. Environment Sequence

Future Growth implementation must progress through isolated environments:

`Local/Test -> Staging -> Security Re-Audit -> Explicit Production Approval -> Production`

Development or staging success is not production approval.

## 13. Environment Isolation

Development, staging and production require separate approved:

- datasets;
- credentials;
- provider configuration;
- campaigns;
- test accounts;
- value/loyalty state;
- analytics;
- experiments.

Environment ambiguity is a stop condition.

## 14. Synthetic Test Data

Local/staging tests must use synthetic or clearly redacted identities.

Never use real:

- customer PII unnecessarily;
- payment credentials;
- Government identity numbers;
- KYC documents;
- provider secrets in fixtures.

## 15. Secret Readiness

Before provider/cloud activation, verify secrets are:

- absent from Git;
- absent from frontend bundles;
- stored in approved server-side secret management;
- least privilege;
- environment-specific;
- rotation-ready.

Do not print secrets during verification.

## 16. Auth / RBAC Readiness

Before protected Growth APIs activate, verify:

- authentication;
- token validity/expiry;
- role enforcement;
- object authorization;
- customer isolation;
- vendor tenant isolation;
- platform/vendor privilege separation.

## 17. Firestore / Data Rule Boundary

If Firebase/Firestore is used, security rules must preserve least privilege.

Client access must not bypass trusted backend authority for:

- prices;
- discounts;
- loyalty balances;
- stored value;
- private campaigns;
- private analytics;
- audit data.

## 18. Pricing Integration Readiness

Promotion implementation must integrate with trusted server-side pricing.

Required invariants include:

- precise money;
- explicit currency;
- deterministic rounding;
- non-negative totals;
- deterministic stacking;
- trusted checkout revalidation;
- immutable commercial snapshots.

## 19. Payment Integration Readiness

Growth features must preserve existing payment-security requirements.

Applicable checks continue to include:

- trusted server-created amount;
- currency binding;
- signature/authenticity verification;
- idempotency;
- replay resistance;
- webhook validation;
- finalization authority.

Growth cannot weaken payment verification.

## 20. Inventory / Order Readiness

Promotions cannot force unavailable inventory or bypass order-state authority.

Checkout must revalidate applicable inventory/order constraints before final
commercial commitment.

## 21. Loyalty Ledger Readiness

Before loyalty activation, verify:

- canonical accounts;
- append-oriented/equivalent ledger history;
- derived balance;
- earn idempotency;
- spend concurrency;
- reservations;
- expiry;
- reversals;
- reconciliation.

No client-maintained authoritative point counter.

## 22. Stored-Value Ledger Readiness

Before gift/store-value activation, verify:

- canonical instruments;
- precise money;
- issuance RBAC;
- issuance idempotency;
- double-spend protection;
- reservation/redemption;
- refund behavior;
- reconciliation;
- legal/accounting review.

## 23. Referral Readiness

Before referral rewards activate, verify:

- canonical relationships;
- trusted qualifying events;
- self-referral controls;
- multi-account controls;
- idempotency;
- reversal;
- privacy.

Clicks/signups alone do not automatically create reward authority.

## 24. Campaign / Consent Readiness

Before marketing campaigns activate, verify:

- consent/preferences;
- opt-out/suppression;
- transactional-vs-marketing separation;
- frequency caps;
- provider security;
- template/link safety;
- test-recipient isolation.

## 25. Analytics Readiness

Before production analytics activates, verify:

- approved purpose;
- minimized fields;
- event versioning;
- deduplication;
- trust classification;
- vendor isolation;
- retention;
- export RBAC;
- consent/tracking boundary.

Analytics remains derived.

## 26. Experiment Readiness

Before experiments activate, verify:

- canonical experiment/variant IDs;
- stable assignment;
- eligibility;
- exposure semantics;
- guardrails;
- security invariants;
- mutual exclusion;
- kill switch;
- rollback.

Security controls are never experiment variants.

## 27. Vendor Compatibility Readiness

Before vendor Growth activation, verify:

- canonical vendor identity;
- tenant ownership;
- vendor RBAC;
- funding attribution;
- audience privacy;
- analytics isolation;
- suspended/offboarded vendor behavior.

## 28. Government / Handloom Readiness

Before Government/Handloom Growth programs activate, verify:

- explicit program authority;
- funding authority;
- program eligibility;
- public claim review;
- artisan/cooperative attribution source;
- KYC exclusion;
- reporting privacy.

A label or QR does not create Government approval.

## 29. Provenance Compatibility Readiness

Growth may consume approved provenance results only.

Before activation verify:

- provenance remains authoritative;
- public/private projection;
- QR privacy;
- artisan privacy;
- correction/revocation handling;
- stale-cache invalidation.

## 30. Migration Inventory

Before migration, inventory every source dataset/system being moved.

Classify:

- authoritative data;
- derived data;
- financial/value data;
- customer preferences;
- campaigns;
- analytics;
- provider mappings.

Unknown ownership or provenance is a stop condition.

## 31. Migration Mapping

Define explicit mappings for:

- canonical IDs;
- customer references;
- vendor references;
- promotion IDs/versions;
- loyalty accounts;
- value instruments;
- campaigns;
- consent states;
- provider identifiers.

Do not infer canonical ownership from display names.

## 32. Migration Financial Evidence

Any loyalty or stored-value migration requires explainable opening-balance
evidence.

Unexplained aggregate balances must not be imported blindly.

## 33. Migration Idempotency

Migration scripts/jobs must be safely rerunnable where practical.

Retries must not duplicate:

- points;
- gift value;
- rewards;
- promotions;
- campaign membership.

## 34. Migration Dry Run

Perform a staging/dry-run migration before production migration.

Capture:

- counts;
- rejected records;
- reconciliation differences;
- duration;
- rollback evidence.

## 35. Migration Reconciliation

After migration, compare source and destination for approved invariants.

Financial/value mismatches are blockers.

Cross-tenant mismatches are security blockers.

## 36. Migration Rollback

Every production migration requires a reviewed rollback or recovery strategy.

Rollback must not rely on deleting unexplained financial/audit history.

## 37. Unit Test Gate

Future implementation requires unit tests for applicable:

- rule evaluation;
- money math;
- stacking;
- expiry;
- idempotency;
- ledger transitions;
- consent;
- authorization helpers;
- provider adapters.

## 38. Integration Test Gate

Integration tests must cover cross-domain contracts such as:

- promotion + pricing;
- checkout + payment;
- order + redemption;
- refund + loyalty reversal;
- value + checkout;
- campaign + consent;
- vendor + tenant isolation;
- provenance + Growth eligibility.

## 39. Concurrency Test Gate

Financial/reward concurrency must be tested for applicable:

- single-use coupons;
- global usage limits;
- loyalty reservations;
- stored-value redemption;
- reward issuance;
- refund/reversal retries.

## 40. Idempotency / Replay Test Gate

Duplicate delivery/retry must not duplicate value or side effects.

Test applicable:

- payment/webhook retry;
- reward events;
- redemption;
- value issuance;
- refunds;
- provider callbacks;
- messaging events;
- analytics events.

## 41. Security Test Gate

Security tests must cover applicable:

- unauthenticated requests;
- invalid auth;
- role escalation;
- object authorization;
- cross-customer access;
- cross-vendor access;
- secret leakage;
- malformed input;
- enumeration;
- replay;
- abuse/rate limits.

## 42. Privacy Test Gate

Privacy tests must cover:

- public/private projections;
- PII minimization;
- consent;
- suppression;
- vendor analytics isolation;
- exports;
- retention/deletion behavior;
- KYC/Government-ID exclusion;
- public QR privacy.

## 43. Financial Test Gate

Financial tests must cover applicable:

- precise money;
- currency;
- rounding;
- discount allocation;
- zero-payable path;
- partial refund;
- proration;
- loyalty reversal;
- stored-value reconciliation;
- vendor funding attribution.

## 44. Multi-Vendor Test Gate

Future tests must prove Vendor A cannot:

- read Vendor B private Growth data;
- mutate Vendor B programs;
- spend Vendor B funding;
- receive Vendor B private analytics;
- target Vendor B private audiences.

## 45. Government / Provenance Test Gate

Future tests must verify:

- Government label non-authority;
- explicit program eligibility;
- explicit funding authority;
- provenance source-of-truth;
- public QR privacy;
- KYC exclusion;
- artisan/cooperative attribution source.

## 46. Multilingual Test Gate

Future implementation must test customer-facing behavior in:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

All locales must preserve identical canonical commercial/security authority.

## 47. Kannada Test Boundary

Kannada must receive equivalent:

- pricing;
- eligibility;
- consent;
- privacy;
- tenant isolation;
- security;
- audit;
- provenance boundaries.

Localization cannot alter business truth.

## 48. Performance Test Gate

Before production, test realistic Growth workloads for applicable:

- promotion evaluation;
- checkout calculation;
- segmentation;
- campaign queues;
- ledger access;
- analytics ingestion.

Performance optimization must not weaken correctness.

## 49. Abuse / Cost Test Gate

Test abuse scenarios that may amplify:

- database usage;
- provider messages;
- coupon checks;
- analytics events;
- segmentation work;
- financial mutation attempts.

Cost controls complement security controls.

## 50. Staging Deployment Gate

Only after tests/security preconditions pass may an approved staging deployment be
considered.

Staging deployment must target the explicitly verified staging environment.

Production must remain untouched.

## 51. Staging Smoke Tests

Staging smoke tests should verify applicable:

- health;
- authentication;
- authorized Growth flows;
- unauthorized rejection;
- pricing;
- payment boundary;
- vendor isolation;
- provenance/public QR boundary;
- provider sandbox behavior.

## 52. Staging E2E Tests

Staging E2E should exercise safe synthetic flows from customer/vendor/admin
perspectives.

No real financial value or real customer messaging should be created accidentally.

## 53. Provider Sandbox

External integrations should use provider sandbox/test modes where available.

Sandbox identifiers/credentials must remain isolated from production.

## 54. Security Re-Audit Gate

Before production, perform the dedicated security re-audit required by
`SECURITY_PRIVACY_AUDIT_ARCHITECTURE_V1.md`.

Architecture PASS does not substitute for implementation security testing.

## 55. Security Re-Audit Blockers

Production stops on unresolved critical/high-risk issues involving applicable:

- Auth/RBAC;
- object authorization;
- tenant isolation;
- payment;
- money;
- ledgers;
- secrets;
- provider webhooks;
- KYC/privacy;
- public endpoints;
- provenance;
- audit integrity.

## 56. Dependency / Secret Scan Gate

Before production review, run applicable:

- dependency audit;
- staged secret scan;
- repository secret scan;
- build/test gates.

Do not waive a real secret finding for schedule convenience.

## 57. Production Approval

`Staging PASS != Production Approval`

Production requires explicit approval after evidence review.

No automatic Future Growth production deploy is authorized by architecture
completion.

## 58. Production Change Plan

Before an approved production deployment, document:

- exact branch/commit;
- exact environment;
- exact services;
- expected changes;
- migration steps;
- smoke tests;
- rollback path;
- responsible approval.

## 59. Production Rollback Readiness

Rollback must be reviewed before deployment.

Applicable rollback may require separate handling for:

- application code;
- configuration;
- provider activation;
- campaign state;
- migrations;
- financial ledgers.

Financial history must not be destructively erased to simulate rollback.

## 60. Post-Deploy Smoke Test

After an approved deployment, verify applicable:

- health;
- auth;
- authorized/unauthorized access;
- pricing;
- payments;
- Growth feature behavior;
- vendor isolation;
- privacy;
- provenance/public QR;
- messaging/provider health.

## 61. Post-Deploy Reconciliation

After activation, reconcile applicable:

- promotion redemptions;
- loyalty ledger;
- stored value;
- referral rewards;
- orders/payments;
- vendor funding;
- provider delivery;
- analytics counts.

Mismatch requires investigation.

## 62. Monitoring Readiness

Production activation requires monitoring for applicable:

- auth failures;
- cross-tenant attempts;
- reward anomalies;
- double-spend attempts;
- coupon brute force;
- provider failures;
- queue lag;
- reconciliation mismatches;
- campaign spikes.

## 63. Alert Privacy

Operational alerts must not expose secrets or unnecessary PII.

Use safe correlation references.

## 64. Kill Switch Readiness

Before production, verify scoped kill switches for applicable high-risk Growth
capabilities.

Kill switches require:

- authorization;
- audit;
- defined recovery;
- testing.

## 65. Incident Runbook

Production implementation requires a Growth incident runbook covering:

- detection;
- containment;
- kill switch;
- secret rotation;
- provider isolation;
- evidence preservation;
- reconciliation;
- customer/vendor communication where needed;
- recovery;
- postmortem.

## 66. Backup / Recovery

Authoritative Growth data requires an approved backup/recovery strategy where
applicable.

Recovery testing must preserve:

- ledger integrity;
- tenant ownership;
- audit history;
- idempotency;
- privacy.

## 67. Observability Boundary

Logs/metrics/traces must avoid:

- secrets;
- raw KYC/Government IDs;
- unnecessary customer PII;
- private value codes.

Observability must support safe incident correlation.

## 68. Documentation Gate

Future implementation should update applicable:

- architecture decisions;
- API docs;
- operational runbooks;
- deployment guide;
- rollback guide;
- security notes;
- release notes.

## 69. Git Lifecycle

Future implementation follows:

`Branch -> Verify -> Tests -> Security -> Documentation -> Commit -> Push -> Remote SHA Lock -> Review -> Approved Deployment`

No force push as routine workflow.

No direct coding on `main`.

## 70. Architecture Branch Closure

This architecture branch itself closes only after:

1. final content audit PASS;
2. staged security/integrity audit PASS;
3. exact architecture commit;
4. GitHub push;
5. exact remote SHA lock;
6. clean working tree;
7. return to trusted release branch;
8. verify trusted release remains unchanged;
9. park this Future branch.

## 71. No Automatic Merge

Closing this Future architecture branch does not authorize merging it into the
trusted MVP release branch.

A future merge requires separate review and purpose.

## 72. Architecture Digest

Before commit, compute an aggregate digest of the exact 12 architecture files.

The same content must be preserved through:

- staging;
- commit;
- remote verification.

Any unexplained digest mismatch stops closure.

## 73. Source Isolation

All Customer Growth architecture files must remain under:

`future/customer-growth-promotions-loyalty-architecture/`

No source-code implementation belongs in the architecture closure commit.

## 74. Secret / Sensitive Scan

Before closure verify the architecture content contains no:

- private keys;
- payment secrets;
- provider secrets;
- Firebase Admin credentials;
- raw Government identity numbers;
- realistic payment-card data.

## 75. File Count Lock

The architecture content closure set is exactly 12 Markdown files for this v1
track.

Unexpected additional files stop the closure gate until reviewed.

## 76. MVP Progress Separation

Future Customer Growth architecture completion does not increase MVP progress.

MVP percentage changes only after a separately defined verified MVP/Blaze PASS
move.

## 77. Blaze Interrupt After Closure

After this Future architecture is safely remote-locked and parked, Blaze remains
P0.

If verified billing approval exists, resume Blaze immediately from the approved
runbook rather than starting another Future architecture track.

## 78. Production Safety Statement

Architecture documents describe future controls and boundaries.

They are not runtime enforcement.

Only implemented, tested and audited controls can protect production.

## 79. Final Architecture Content Definition

Customer Growth v1 architecture covers:

- Blaze P0 interrupt governance;
- scope/progress;
- promotion source-of-truth;
- eligibility/coupon/stacking;
- pricing/checkout/tax/refund;
- loyalty;
- referrals/value instruments;
- campaigns/segmentation/consent;
- analytics/attribution/experiments;
- multi-vendor/Handloom/provenance compatibility;
- security/privacy/audit;
- activation/migration/testing.

## 80. Final Activation Boundary

This roadmap does NOT:

- implement Growth features;
- activate promotions;
- create coupons;
- create loyalty balances;
- issue referral rewards;
- issue stored value;
- send campaigns;
- upload customer lists;
- activate tracking;
- create experiments;
- modify vendor/customer data;
- create Government programs;
- modify provenance/KYC;
- configure secrets/providers;
- modify Firebase;
- deploy staging;
- deploy production;
- merge to release/main.

`Future Customer Growth Architecture 100% = Architecture Content Complete Only.`
