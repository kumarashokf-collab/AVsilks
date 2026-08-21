# AV Silks Future Multi-Vendor & Provenance Compatibility Architecture v1

Status: FUTURE-ONLY / TENANT-SAFE DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define how future multi-vendor commerce, fulfillment, returns and logistics can
coexist safely with AV Silks Handloom / QR provenance.

This document does not activate vendors, KYC, courier integrations, public data
migration, Firebase writes or production deployment.

## 2. Core Separation

The following remain distinct authoritative domains:

- platform order;
- vendor order allocation;
- fulfillment;
- shipment;
- return;
- refund;
- vendor settlement;
- artisan/product provenance;
- public QR provenance.

Vendor logistics state must not overwrite provenance truth.

Provenance truth must not become a shortcut around tenant isolation.

## 3. Tenant Boundary

Every future vendor-scoped fulfillment resource must carry an explicit trusted
tenant/vendor boundary.

Examples:

- fulfillment
- shipment
- package
- return case
- reverse shipment
- work item
- vendor analytics projection

The vendor identity must be resolved from trusted authorization/data, not from
an unrestricted frontend field.

## 4. Vendor Read Isolation

Vendor A must never read Vendor B private fulfillment data.

This includes:

- customer delivery data;
- shipment records;
- courier references;
- return cases;
- refund details;
- operational notes;
- analytics;
- provider credentials;
- audit records not intended for that vendor.

Platform-wide access requires explicit higher privilege.

## 5. Vendor Write Isolation

Vendor writes must be restricted to explicitly permitted operations.

A vendor must not be able to:

- mutate another vendor shipment;
- change platform order totals;
- override payment truth;
- approve unrestricted platform refunds;
- alter provenance ownership/history without an approved provenance workflow;
- grant itself elevated permissions.

Every write remains backend-authorized.

## 6. Platform Order Decomposition

A single customer order may contain items from multiple vendors.

Future architecture may decompose it into vendor-scoped operational units.

Conceptually:

`Platform Order -> Vendor Fulfillment A + Vendor Fulfillment B + ...`

Each fulfillment preserves:

- vendor identity;
- item/quantity allocation;
- origin;
- shipment relationship;
- financial allocation reference;
- provenance relationship where applicable.

## 7. Quantity Conservation

Across all vendor fulfillments:

`sum(vendorAllocatedQty) <= orderedQty`

Across shipment and return activity:

`deliveredQty + cancelledQty + unresolvedQty` must remain consistent with the
authoritative ordered/allocated quantity model.

Cross-vendor quantity duplication must fail closed.

## 8. Vendor Origin Model

Each vendor fulfillment may reference an approved dispatch origin.

Origin configuration must be:

- explicitly vendor/platform scoped;
- validated;
- active/inactive controlled;
- serviceability compatible;
- auditable.

A vendor cannot silently use another vendor's origin.

## 9. Provider Credential Isolation

Courier/provider credentials may be:

- platform-scoped;
- vendor-scoped;
- environment-scoped.

Future implementation must never expose one vendor's credentials to another vendor.

Credentials remain server-side Secret Manager/environment material.

No real credential belongs in this architecture documentation.

## 10. Provider Account Binding

If vendor-specific courier accounts are supported later, each provider action
must verify:

- vendor identity;
- provider account binding;
- environment;
- authorized capability;
- shipment ownership.

Provider account references remain private operational metadata.

## 11. Vendor Shipment Ownership

Each shipment must have an unambiguous operational owner.

Conceptual values may include:

- platform-managed;
- vendor-managed under platform policy.

Ownership determines permitted actions, not data sovereignty outside the
platform's authorization model.

## 12. Cross-Vendor Shipment Consolidation

Cross-vendor physical consolidation must never be assumed.

If introduced later, it requires a separately designed platform process for:

- custody transfer;
- origin consolidation;
- package allocation;
- provider booking;
- liability;
- tracking;
- inventory consistency.

Until explicitly implemented, each vendor fulfillment remains independently
shippable.

## 13. Customer Privacy

Vendors receive only customer logistics data required to fulfill their authorized
portion of an order.

Least-privilege principles apply to:

- name;
- phone;
- delivery address;
- delivery instructions.

Vendors must never receive unnecessary payment credentials, other-vendor data or
private platform security information.

## 14. Vendor Return Isolation

Return cases must remain item/vendor scoped.

Vendor A must not:

- inspect Vendor B return;
- approve Vendor B return;
- view Vendor B private evidence;
- trigger Vendor B replacement;
- view Vendor B refund accounting.

Platform dispute/override roles remain separate.

## 15. Vendor Inspection Boundary

Where vendors perform inspection later, permissions must define:

- which return cases they can inspect;
- which fields they can write;
- allowed reason codes;
- whether platform confirmation is required;
- whether financial resolution authority remains platform-only.

Inspection authority does not imply refund authority.

## 16. Vendor Refund Boundary

Vendor recommendation and platform financial execution remain separate.

A vendor may potentially:

- recommend approval;
- record permitted evidence;
- accept item condition under policy.

But unrestricted gateway refund execution remains controlled by the payment domain.

## 17. Vendor Settlement Boundary

Vendor settlement/payout is separate from customer refund.

Returns/RTO/refunds may create settlement adjustments.

Future marketplace accounting may require:

- commission reversal;
- payout adjustment;
- platform fee adjustment;
- tax/accounting reference.

These require a dedicated settlement/accounting policy and must not be inferred
solely from courier events.

## 18. Provenance Identity Boundary

Provenance should use stable internal product/artisan/provenance identifiers.

Vendor ID may be an internal relationship, but vendor shipment identifiers must
not become public provenance identity.

Public provenance must remain independent of logistics implementation details.

## 19. Provenance Continuity

Return, replacement or exchange must not erase historical provenance.

Future audit relationship may preserve:

`Original Product/Provenance -> Original Order -> Return/Inspection -> Replacement/Exchange`

Historical truth remains append-oriented.

## 20. Replacement Provenance

If a replacement is a physically different handloom product, the replacement
must reference its own valid provenance identity where applicable.

Do not simply copy original provenance data onto a different physical article
without a verified provenance relationship.

## 21. Exchange Provenance

Exchange flow may create:

- original provenance relationship;
- returned-item inspection/history;
- new product/provenance relationship.

The original record remains historically auditable.

## 22. Public QR Privacy Boundary

Public provenance may expose approved product/artisan traceability information.

It must never expose:

- customer name;
- customer phone;
- delivery address;
- vendor private contact data;
- courier account;
- private tracking token;
- payment/refund details;
- NDR/RTO private notes;
- vendor settlement;
- KYC information;
- internal risk/fraud data.

## 23. Public Provenance Lookup

A future public provenance lookup must resolve only through an approved public
identifier.

Internal database IDs, vendor IDs, shipment IDs and payment IDs must not
automatically become public identifiers.

Enumeration resistance and privacy review are mandatory.

## 24. Provenance Publication State

Future provenance records may require publication states such as:

- draft/private;
- reviewed;
- published;
- suspended/revoked where policy permits.

Vendor product approval does not automatically equal public provenance approval.

## 25. Vendor Provenance Permissions

Possible future permissions may distinguish:

- create draft provenance input;
- edit draft evidence;
- submit for review;
- view own private records;
- publish/approve only for authorized admin/owner roles;
- correct through auditable workflow.

A vendor must never self-escalate to unrestricted provenance publication authority.

## 26. Artisan Boundary

Artisan/contributor information requires its own privacy and consent policy.

Vendor association does not imply that all artisan personal data becomes public.

Public provenance should expose only approved traceability fields.

Sensitive identity/government-document data must remain excluded.

## 27. KYC Privacy Boundary

Vendor KYC and provenance are separate.

Public QR/provenance must never expose:

- Aadhaar;
- government ID;
- KYC document;
- KYC reference intended to remain private;
- bank details;
- tax credentials;
- private verification evidence.

Future documentation/tests must use placeholders only, such as:

`[AADHAAR_REDACTED]`

`[GOV_ID_REDACTED]`

`[KYC_DOCUMENT_REDACTED]`

## 28. Provenance + Shipment Linking

Internal systems may link provenance to fulfillment for authorized operational
needs.

Example:

`provenanceId -> orderItem -> fulfillmentId -> shipmentId`

This linkage is private unless a specific field is explicitly approved for public display.

## 29. Custody Chain Concept

Future premium/government workflows may optionally record a controlled custody
chain.

Potential transitions:

- artisan/workshop;
- vendor;
- fulfillment center;
- courier handoff;
- delivery;
- return;
- inspection.

Any custody record must distinguish verified evidence from user-entered claims.

Public exposure requires separate approval and privacy review.

## 30. Event Model

Vendor/provenance-compatible fulfillment may emit normalized internal events such as:

- vendor fulfillment ready;
- vendor shipment created;
- vendor shipment delivered;
- return received by vendor;
- inspection completed;
- provenance-linked replacement created.

Event payloads must remain minimal and tenant-scoped.

## 31. Audit Requirements

Audit-worthy actions include:

- vendor assignment;
- vendor fulfillment reassignment;
- origin change;
- manual shipment override;
- return decision;
- inspection override;
- provenance draft edit;
- provenance approval/rejection;
- provenance correction;
- replacement provenance linkage.

Audit records require actor, target, reason, result and timestamp with minimal PII.

## 32. RBAC

Future authorization should distinguish roles/permissions such as:

- customer;
- vendor operator;
- vendor manager;
- platform support;
- admin;
- owner/super-admin;
- automated service identity.

Exact role names must align with the then-current trusted RBAC model.

Authorization belongs on the backend.

## 33. Vendor Offboarding

Future vendor suspension/offboarding must not delete historical commerce or provenance truth.

Offboarding may:

- block new products;
- block new fulfillment;
- block new privileged access;
- preserve historical order/shipment/return/audit records;
- preserve public provenance history according to policy.

Historical records must not become orphaned.

## 34. Vendor Reassignment

Reassigning operational responsibility after order creation is high risk.

If allowed later, it requires:

- privileged authorization;
- reason;
- inventory/fulfillment validation;
- data-access transition;
- audit;
- no duplicate quantity allocation.

Provenance ownership/history must not be silently rewritten.

## 35. Dispute Boundary

Vendor/customer/platform disputes may involve:

- delivery;
- condition;
- return;
- refund;
- provenance claim.

Dispute handling is a separate controlled workflow.

Private dispute evidence must not become public provenance content.

## 36. Analytics Isolation

Vendor analytics must remain tenant scoped.

Vendor A must not see Vendor B:

- delivery performance;
- return rates;
- refund metrics;
- private provenance review data;
- customer PII;
- financial settlement.

Platform-wide aggregation requires explicit privilege and privacy-safe aggregation.

## 37. Environment Isolation

Development, staging and production vendor/provider resources must remain isolated.

No production vendor/customer data should be used casually in development/test.

Staging should use test identities and sanitized fixtures.

## 38. Data Migration Boundary

Activating multi-vendor fulfillment later may require migrations.

Migration must define:

- source schema;
- target schema;
- vendor ownership;
- provenance linkage;
- quantity invariants;
- rollback;
- dry-run verification;
- reconciliation report.

No migration runs as part of this architecture preparation.

## 39. Failure Rules

Fail closed on:

- missing tenant/vendor ownership;
- cross-vendor access;
- ambiguous origin;
- provider account mismatch;
- duplicate quantity allocation;
- unauthorized return/inspection;
- unauthorized refund action;
- provenance ownership ambiguity;
- public privacy breach;
- KYC/public-provenance mixing;
- environment mismatch.

Ambiguous records require authorized exception review.

## 40. Required Future Tests

Implementation must eventually test:

- vendor A cannot read Vendor B shipment;
- vendor A cannot mutate Vendor B fulfillment;
- cross-vendor quantity conservation;
- vendor origin isolation;
- provider credential/account isolation;
- vendor return isolation;
- inspection permission boundary;
- refund authorization separation;
- vendor analytics isolation;
- vendor offboarding history preservation;
- replacement provenance continuity;
- exchange provenance continuity;
- public QR non-disclosure;
- enumeration resistance;
- KYC/provenance separation;
- backend RBAC enforcement;
- audit creation;
- migration dry-run;
- rollback/reconciliation;
- environment isolation.

## 41. Activation Boundary

This document is Future architecture only.

It does NOT:

- create vendors;
- implement KYC;
- expose artisan private data;
- create courier accounts;
- modify Firestore;
- change public QR behavior;
- migrate provenance;
- deploy anything.

Future implementation requires a separately approved feature phase with migrations,
tests, tenant-isolation review, privacy/security re-audit, Blaze staging,
explicit production approval and rollback verification.
