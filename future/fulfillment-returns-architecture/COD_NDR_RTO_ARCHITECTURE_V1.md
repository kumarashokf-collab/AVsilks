# AV Silks Future COD, NDR & RTO Architecture v1

Status: FUTURE-ONLY / PROVIDER-NEUTRAL DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a secure and auditable future architecture for Cash on Delivery (COD),
Non-Delivery Reports (NDR) and Return-to-Origin (RTO).

This architecture does not activate COD logistics, call courier APIs, mutate
payments, change inventory, change current orders, or deploy cloud resources.

## 2. Core Domain Separation

The following truths remain separate:

- commerce order state;
- payment state;
- shipment state;
- COD collection state;
- NDR case state;
- RTO state;
- inventory state;
- refund/resolution state.

Courier delivery evidence must never directly become payment or inventory truth.

## 3. COD Eligibility

COD must be authorized server-side.

Possible future eligibility inputs include:

- destination serviceability;
- courier COD capability;
- order amount limits;
- product restrictions;
- seller/vendor restrictions;
- operational risk policy;
- customer/account policy;
- temporary platform override.

A frontend boolean must never authorize COD.

## 4. COD Amount Authority

The amount collectible at delivery must originate from AV Silks trusted
server-authoritative order/payment calculations.

Conceptual field:

`codCollectiblePaise`

Invariant:

`codCollectiblePaise >= 0`

The courier/provider must not determine the authoritative AV Silks order total.

## 5. COD Order Snapshot

When COD is accepted, future order/payment records should preserve an immutable
snapshot of:

- approved payment mode;
- authorized COD amount;
- shipping charge snapshot;
- discounts/taxes snapshot;
- policy version;
- eligibility outcome;
- created timestamp.

Client-side amount changes must not alter the accepted COD snapshot.

## 6. COD Collection State

Canonical COD collection states may include:

- `NOT_APPLICABLE`
- `EXPECTED`
- `COLLECTED_REPORTED`
- `REMITTANCE_PENDING`
- `REMITTED`
- `MISMATCH`
- `WAIVED`
- `CANCELLED`

`COLLECTED_REPORTED` is provider evidence only.

It does not automatically mean AV Silks has received settlement funds.

## 7. Delivery vs COD Settlement

Shipment delivery and COD settlement are independent milestones.

Example:

`Shipment = DELIVERED`

does not imply:

`COD = REMITTED`

Future reconciliation must separately verify collection/remittance evidence.

## 8. COD Reconciliation

Future COD reconciliation may compare:

- AV Silks expected COD amount;
- courier reported collected amount;
- remittance reference;
- remitted amount;
- settlement date;
- shipment identity;
- provider settlement identity.

Any mismatch must enter controlled reconciliation.

Never silently write off a mismatch.

## 9. COD Idempotency

Repeated provider events or reconciliation runs must not:

- mark COD collected twice;
- create duplicate remittance records;
- double-credit a settlement;
- create duplicate financial audit events.

A stable idempotency/fingerprint boundary is required.

## 10. NDR Purpose

NDR represents a failed or blocked delivery attempt requiring controlled action.

NDR must not be treated as automatic cancellation, refund or RTO.

## 11. NDR Case State Machine

Canonical future NDR states:

- `OPEN`
- `REVIEW_PENDING`
- `CUSTOMER_ACTION_PENDING`
- `REATTEMPT_REQUESTED`
- `REATTEMPT_SCHEDULED`
- `RESOLVED_DELIVERED`
- `RTO_RECOMMENDED`
- `RTO_APPROVED`
- `CLOSED`
- `EXCEPTION`

Each NDR case must reference a trusted shipment.

## 12. NDR Reason Normalization

Courier-specific failure reasons should normalize into controlled categories,
for example:

- recipient unavailable;
- address clarification required;
- recipient refused;
- delivery access issue;
- payment/COD collection issue;
- operational delay;
- provider exception;
- damaged shipment;
- unknown/needs review.

Raw courier text must not become unrestricted business logic.

## 13. NDR Action Authorization

Possible actions may include:

- request reattempt;
- confirm permitted delivery information;
- approve RTO;
- escalate for manual review.

Action permissions must be explicit.

Customers, vendors, admins and automated services must not share unrestricted
NDR privileges.

## 14. Delivery Information Correction

Any post-order address/contact correction requires strict policy and audit.

Rules:

- only permitted fields may change;
- authorization is mandatory;
- previous trusted order snapshot remains historically auditable;
- courier update success must be verified;
- logs must not copy unnecessary address/phone data;
- material destination changes may require fresh serviceability/rate review.

## 15. NDR Reattempt Limits

Repeated delivery attempts require an explicit policy.

Potential controls:

- maximum attempt count;
- time window;
- courier capability;
- customer confirmation;
- operational approval.

Repeated provider events must not accidentally increment attempt count multiple
times.

## 16. Customer Communication

Customer-facing NDR communication may explain:

- delivery attempt failed;
- safe action required;
- retry status;
- RTO status where applicable.

Messages must not expose internal risk flags, courier credentials or private
operator notes.

## 17. RTO Decision Boundary

RTO initiation is a controlled operational decision.

Potential triggers:

- exhausted delivery attempts;
- customer refusal;
- invalid/unresolvable delivery condition;
- approved cancellation after dispatch where provider supports RTO;
- operational exception.

A single courier status must not automatically authorize financial consequences.

## 18. RTO State Machine

Canonical future RTO states:

- `NOT_APPLICABLE`
- `RECOMMENDED`
- `APPROVED`
- `INITIATION_PENDING`
- `INITIATED`
- `IN_TRANSIT`
- `RECEIVED_AT_ORIGIN`
- `INSPECTION_PENDING`
- `CLOSED`
- `LOST`
- `DAMAGED`
- `EXCEPTION`

## 19. RTO Idempotency

RTO initiation must be idempotent.

Equivalent retry must not:

- create duplicate reverse movement;
- create multiple provider RTO requests;
- duplicate inventory restoration;
- duplicate refund/resolution activity.

## 20. RTO Receipt

`RTO_DELIVERED` provider evidence does not automatically mean goods are accepted
back into sellable inventory.

Future controlled process:

1. receive return evidence;
2. identify shipment/package;
3. physically/operationally receive;
4. inspect where required;
5. classify condition;
6. execute approved inventory disposition;
7. separately execute any financial resolution.

## 21. Inventory Boundary

Inventory restoration must remain server-authoritative and exactly-once.

RTO must never blindly increase sellable stock.

Possible dispositions include:

- return to sellable stock;
- damaged stock;
- quarantine;
- missing/lost investigation;
- manual reconciliation.

The actual inventory ledger remains authoritative.

## 22. Payment / Refund Boundary

COD, NDR and RTO events do not independently authorize refunds.

Refund/resolution eligibility must consider:

- payment mode;
- actual collected amount;
- order/resolution policy;
- item condition;
- authoritative settlement state;
- previous refund activity.

Double refund must fail closed.

## 23. Prepaid RTO

Prepaid orders can also enter RTO.

Their financial handling differs from COD.

Shipment movement must therefore not contain hard-coded COD-only refund rules.

## 24. Partial Shipment Compatibility

An order may contain multiple shipments.

One shipment may be delivered while another enters NDR/RTO.

Rules:

- NDR/RTO is shipment-scoped;
- order aggregation must remain explicit;
- delivered quantities remain delivered;
- RTO quantities must remain independently tracked;
- financial resolution may be item/quantity scoped.

## 25. Multi-Package Compatibility

Where packages track independently:

- one package may fail delivery;
- another may deliver successfully;
- RTO decisions may be package-specific where provider/business rules allow.

No aggregate state may hide unresolved package quantity.

## 26. Multi-Vendor Compatibility

Future vendor orders require vendor isolation.

Rules:

- vendor A cannot access vendor B NDR/RTO data;
- vendor decisions are limited to granted permissions;
- platform admin/owner overrides require explicit privileged authorization;
- provider credentials remain scoped;
- financial settlement data follows least privilege.

## 27. Provenance Compatibility

Handloom/QR public provenance must remain isolated from delivery failure,
customer identity and COD settlement information.

Never expose publicly:

- customer name;
- phone;
- delivery address;
- COD amount due;
- NDR private notes;
- courier private reference/token;
- settlement/remittance details;
- dispute/risk notes.

## 28. Provider Webhook Boundary

Provider NDR/RTO/COD events must pass the same future security controls as
shipment tracking events.

Where supported:

- signature verification;
- freshness/timestamp validation;
- replay protection;
- strict payload validation;
- provider/internal identity verification;
- state transition validation;
- idempotency.

No business side effect may happen before authenticity checks.

## 29. Reconciliation Jobs

Future reconciliation may periodically verify unresolved:

- COD collection/remittance;
- NDR cases;
- RTO movements;
- provider/internal status mismatches.

Reconciliation must use server-held credentials and produce privacy-safe logs.

## 30. Audit Requirements

Audit-worthy actions include:

- manual COD eligibility override;
- COD amount correction under approved procedure;
- NDR manual resolution;
- delivery information correction;
- manual reattempt request;
- RTO approval;
- RTO cancellation where supported;
- manual state correction;
- inventory disposition;
- financial resolution trigger.

Audit records should capture actor, reason, target, before/after state and result
without unnecessary PII.

## 31. Fraud / Abuse Boundary

Future abuse controls may consider repeated:

- COD refusal;
- unreachable delivery;
- suspicious reattempt patterns;
- settlement mismatches.

These controls must remain server-side and access-controlled.

Private risk decisions must not be exposed to customers or public provenance.

## 32. Failure Rules

Fail closed on:

- unauthorized COD selection;
- invalid collectible amount;
- conflicting COD snapshot;
- mismatched shipment/provider identity;
- invalid webhook authenticity;
- duplicate conflicting event;
- impossible NDR/RTO transition;
- unknown RTO target shipment;
- duplicate inventory restoration;
- duplicate financial resolution.

Ambiguous cases enter manual exception handling.

## 33. Observability

Future operational metrics may include:

- COD eligibility rate;
- COD delivery rate;
- COD remittance delay;
- settlement mismatch count;
- NDR rate;
- delivery reattempt success;
- RTO rate;
- RTO duration;
- lost/damaged RTO count;
- reconciliation mismatch count.

Metrics must contain no secrets or unnecessary customer PII.

## 34. Required Future Tests

Implementation must eventually test:

- COD eligibility allow/deny;
- server-authoritative COD amount;
- tampered COD amount;
- duplicate COD event;
- COD settlement mismatch;
- NDR normalization;
- duplicate NDR event;
- reattempt limit;
- unauthorized NDR action;
- address-correction authorization;
- RTO initiation idempotency;
- duplicate RTO event;
- RTO receipt without automatic restock;
- prepaid RTO separation;
- COD RTO separation;
- partial shipment NDR/RTO;
- multi-package behavior;
- vendor isolation;
- invalid webhook signature;
- webhook replay;
- privacy-safe logs;
- provenance non-disclosure.

## 35. Activation Boundary

This document is architecture only.

It does NOT:

- enable COD;
- create courier integrations;
- create NDR cases in production;
- initiate RTO;
- change payments;
- restock inventory;
- change Firestore;
- add provider secrets;
- deploy anything.

Future implementation requires a separately approved feature branch, tests,
emulator/test validation, Blaze staging, security re-audit, explicit production
approval and rollback verification.
