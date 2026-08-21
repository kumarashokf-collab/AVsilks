# AV Silks Future Returns, Exchanges & Reverse Logistics Architecture v1

Status: FUTURE-ONLY / POLICY-NEUTRAL DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a secure, auditable and provider-neutral architecture for future
customer returns, exchanges, replacements, reverse pickup, inspection and
inventory disposition.

This document does not enable returns in production, create pickups, issue
refunds, modify inventory or deploy cloud resources.

## 2. Core Domain Separation

The following remain separate authoritative domains:

- order truth;
- payment/refund truth;
- outbound shipment truth;
- return eligibility;
- return case truth;
- reverse shipment truth;
- inspection truth;
- inventory disposition;
- exchange/replacement fulfillment;
- public provenance truth.

A return request alone does not authorize refund, restock, exchange or replacement.

## 3. Return Eligibility

Return eligibility must be evaluated server-side.

Potential future inputs include:

- order identity;
- order-item identity;
- delivered quantity;
- delivery timestamp;
- return-window policy;
- product/category policy;
- item condition declaration;
- previous return activity;
- non-returnable flags;
- vendor policy where platform-approved;
- fraud/abuse controls;
- legal/policy obligations.

The frontend must not decide authoritative eligibility.

## 4. Return Policy Versioning

Return decisions must preserve the policy version applicable to the transaction.

Conceptual snapshot fields:

- `returnPolicyVersion`
- eligibility result
- allowed return window
- eligible quantity
- allowed resolution types
- applicable fees where legally/business approved
- evaluated timestamp

Later policy changes must not silently rewrite historical decisions.

## 5. Return Window

The return window must use an explicit trusted start event.

Possible future anchors:

- delivery timestamp;
- verified pickup timestamp for special flows;
- another approved business/legal trigger.

Rules must define:

- exact duration;
- timezone handling;
- inclusive/exclusive boundary;
- exception process;
- products with different windows.

A client-supplied date must not control eligibility.

## 6. Return Case Identity

Every accepted return request receives an opaque internal:

`returnCaseId`

The case references trusted:

- order ID;
- order-item identity;
- requested quantity;
- customer identity;
- fulfillment/shipment relationship where relevant.

Public sequential identifiers should not automatically become customer lookup keys.

## 7. Return Quantity Invariants

For each order item:

`returnedQty + pendingReturnQty <= returnEligibleDeliveredQty`

Also:

`returnEligibleDeliveredQty <= deliveredQty`

A customer must never return more units than were authoritatively delivered and
eligible.

Concurrent requests must preserve quantity conservation.

## 8. Return Case State Machine

Canonical states:

- `REQUESTED`
- `ELIGIBILITY_REVIEW`
- `APPROVED`
- `REJECTED`
- `PICKUP_PENDING`
- `PICKUP_SCHEDULED`
- `PICKED_UP`
- `RETURN_IN_TRANSIT`
- `RECEIVED`
- `INSPECTION_PENDING`
- `INSPECTED`
- `RESOLUTION_PENDING`
- `RESOLVED`
- `CANCELLED`
- `EXCEPTION`

Every transition requires an explicit validator.

## 9. Return Request Idempotency

Return creation must be idempotent.

Equivalent retries must not:

- create duplicate return cases;
- reserve return quantity twice;
- schedule duplicate reverse pickups;
- create duplicate refund/exchange workflows.

Conflicting reuse of an idempotency key must fail closed.

## 10. Return Reason Model

Customer return reasons should use controlled categories.

Examples:

- damaged;
- wrong item;
- missing component;
- quality concern;
- size/fit where applicable;
- not as expected;
- changed mind where policy allows;
- delivery-related issue;
- other reviewed category.

Free text, if supported later, must be validated, length-limited and privacy-safe.

## 11. Evidence Boundary

Future return evidence may include customer-uploaded images or operator inspection evidence.

Any such feature requires separate security controls:

- MIME validation;
- file-size limit;
- extension/content validation;
- malware/content handling policy;
- access control;
- retention policy;
- privacy review;
- secure storage path;
- safe filenames.

This architecture does not authorize uploads.

## 12. Approval and Rejection

Return approval/rejection must be explicit and auditable.

Decision metadata should include:

- authorized actor/system;
- reason code;
- policy version;
- requested quantity;
- approved quantity;
- allowed resolution;
- timestamp.

Customer-visible rejection reasons must avoid exposing internal fraud/risk details.

## 13. Reverse Pickup Eligibility

Reverse-pickup serviceability is separate from outbound delivery serviceability.

Possible outcomes:

- `AVAILABLE`
- `UNAVAILABLE`
- `TEMPORARILY_UNAVAILABLE`
- `MANUAL_PROCESS_REQUIRED`

A destination may support delivery but not automated reverse pickup.

## 14. Reverse Shipment Identity

A return shipment gets its own:

- `returnShipmentId`
- provider reverse-shipment reference;
- reverse tracking identity;
- pickup identity;
- reverse tracking events.

Outbound shipment history must never be overwritten or reused as reverse history.

## 15. Reverse Pickup State

Canonical reverse pickup states may include:

- `NOT_REQUIRED`
- `PENDING`
- `SCHEDULED`
- `PICKED_UP`
- `FAILED`
- `CANCELLED`
- `MANUAL_HANDOFF`
- `EXCEPTION`

Repeated provider events must remain idempotent.

## 16. Reverse Tracking

Reverse tracking uses the same core security principles as outbound tracking:

- provider verification where supported;
- event normalization;
- replay protection;
- duplicate handling;
- transition validation;
- privacy-safe logging;
- reconciliation for missed events.

Provider data remains evidence, not unrestricted business truth.

## 17. Receipt at Origin

Provider `delivered` evidence for a reverse shipment means the parcel reportedly
reached the designated return location.

It does NOT automatically mean:

- item identity is correct;
- expected quantity is present;
- item is sellable;
- refund is approved;
- exchange is approved.

A controlled receipt/inspection process follows.

## 18. Inspection Model

Inspection may classify:

- expected item received;
- wrong item received;
- quantity mismatch;
- unused/sellable condition;
- damaged condition;
- opened/used condition;
- authenticity/provenance mismatch;
- missing component;
- unable to determine.

Inspection outcomes require controlled reason codes.

## 19. Inspection Authority

Only authorized personnel/services may record final inspection.

Future RBAC should distinguish, where needed:

- customer request;
- vendor review;
- warehouse inspection;
- admin override;
- owner/platform override.

Vendor A must never inspect or finalize Vendor B returns without explicit platform authority.

## 20. Inventory Disposition

Inspection does not directly modify stock.

It produces an approved disposition request.

Possible future dispositions:

- `SELLABLE`
- `DAMAGED`
- `QUARANTINE`
- `REPAIR`
- `RETURN_TO_VENDOR`
- `DISPOSAL_REVIEW`
- `MISSING_INVESTIGATION`

The inventory ledger remains authoritative.

## 21. Exactly-Once Inventory Boundary

A return must never increase stock twice.

Future implementation requires:

- transaction/idempotency control;
- return-case identity;
- item/quantity identity;
- disposition record;
- inventory transaction reference.

Duplicate receipt/inspection events must not duplicate stock movement.

## 22. Resolution Types

Possible future resolution types:

- `REFUND`
- `REPLACEMENT`
- `EXCHANGE`
- `STORE_CREDIT`
- `REPAIR`
- `NO_ACTION`

Actual enabled types require separately approved business policy.

## 23. Refund Boundary

A return case does not directly issue payment refund.

Refund finalization belongs to the payment/refund domain.

Return architecture supplies verified evidence such as:

- eligibility;
- approved quantity;
- received quantity;
- inspection outcome;
- approved resolution.

Payment service remains authoritative for monetary execution and idempotency.

## 24. Replacement Architecture

A replacement should create a controlled new outbound fulfillment relationship.

Do not rewrite the original order/shipment history.

Conceptual relationship:

`returnCaseId -> replacementFulfillmentId`

Replacement creation must be idempotent.

## 25. Exchange Architecture

An exchange may involve:

- returned original item;
- replacement product/variant;
- price difference;
- additional payment;
- partial refund;
- inventory availability;
- new shipment.

These must be coordinated transactionally.

A courier event alone cannot finalize an exchange.

## 26. Exchange Price Difference

Future exchange pricing must remain server-authoritative.

Possible outcomes:

- no price difference;
- customer owes additional amount;
- customer receives approved partial refund.

All monetary values use integer minor units.

For INR:

`paise`

No client-calculated amount becomes authoritative.

## 27. Replacement / Exchange Inventory

A replacement/exchange must not reserve inventory twice.

Future implementation should use the same authoritative reservation/ledger principles
as normal commerce inventory.

If replacement stock is unavailable, the resolution must move to an explicit alternative path.

## 28. Partial Returns

Customers may return only part of an order where policy allows.

Return eligibility and resolution must remain:

- item scoped;
- quantity scoped;
- shipment aware;
- payment aware.

Returning one item must not automatically change unrelated delivered items.

## 29. Partial Resolution

A single return case may theoretically contain multiple lines with different approved outcomes.

Future design should avoid ambiguous all-or-nothing assumptions.

Each resolution must preserve:

- item identity;
- quantity;
- monetary consequence;
- inventory consequence;
- status.

## 30. Bundles / Sets

Products sold as bundles/sets require explicit return rules.

Future policy must decide whether:

- entire bundle is required;
- partial bundle is eligible;
- component value is independently resolvable.

No automatic assumption is safe.

## 31. Handloom / Provenance Compatibility

Handloom products may require historical provenance continuity.

A return/exchange must not erase original provenance history.

Internal audit may link:

- original product/provenance;
- original order;
- return case;
- inspection;
- replacement/exchange product where applicable.

Public provenance must remain privacy-safe.

## 32. Public Provenance Non-Disclosure

Public QR provenance must never expose:

- customer identity;
- phone number;
- delivery/return address;
- return reason free text;
- refund amount;
- payment data;
- private inspection notes;
- dispute/fraud indicators;
- courier secret/reference intended to remain private.

## 33. Multi-Vendor Compatibility

Future marketplace returns require tenant/vendor isolation.

Rules:

- vendor A cannot access Vendor B return cases;
- vendor-scoped decisions require explicit permissions;
- platform policy overrides vendor policy where designed;
- refund authority remains separately controlled;
- platform/operator review may be required for disputes;
- provider credentials remain isolated.

## 34. Customer Cancellation of Return

A return may be cancellable only before an approved operational boundary.

Future rules must define when cancellation is no longer safe, for example after:

- pickup completion;
- reverse movement;
- receipt;
- resolution execution.

Cancellation must be idempotent and auditable.

## 35. Return Exceptions

Exception handling may cover:

- reverse pickup repeatedly failing;
- lost reverse parcel;
- damaged reverse parcel;
- wrong item received;
- quantity mismatch;
- disputed inspection;
- provider/internal state mismatch;
- duplicate/conflicting return requests.

Exceptions must not silently trigger refund/restock.

## 36. Lost Reverse Shipment

A lost reverse shipment requires a separate resolution path.

It must not automatically:

- mark customer at fault;
- restock inventory;
- deny refund;
- approve refund.

Final policy requires evidence and authorized decision logic.

## 37. Damaged Reverse Shipment

Damage during reverse transit must distinguish where possible:

- customer-declared pre-existing damage;
- transit damage;
- inspection damage evidence;
- uncertain cause.

Private operational findings must remain access-controlled.

## 38. Notifications

Future notifications may include:

- return request received;
- approved/rejected;
- pickup scheduled;
- pickup completed;
- return received;
- inspection completed;
- resolution initiated;
- resolution completed;
- exception requiring safe customer action.

Notifications must not leak internal risk/security notes.

## 39. Audit Requirements

Audit-worthy actions include:

- manual eligibility override;
- approval/rejection;
- pickup override;
- manual receipt;
- inspection result;
- inspection override;
- inventory disposition;
- resolution selection;
- exchange price adjustment;
- replacement creation;
- return cancellation;
- exception resolution.

Audit entries require actor, target, reason, result and timestamp with minimal PII.

## 40. Abuse / Fraud Boundary

Future abuse controls may evaluate repeated patterns.

Private signals must:

- remain server-side;
- follow least privilege;
- avoid public/customer exposure;
- not be copied into public provenance;
- support authorized human review where required.

This architecture does not define automated punitive decisions.

## 41. Privacy

Return systems may process sensitive operational customer data.

Minimize collection and retention.

Do not place in logs:

- full addresses;
- unnecessary phone/email;
- uploaded evidence URLs with unrestricted access;
- provider credentials;
- payment secrets;
- private risk notes.

## 42. Idempotent Downstream Effects

Every downstream effect requires a stable idempotency boundary:

- reverse pickup creation;
- inventory disposition;
- refund request;
- replacement fulfillment;
- exchange transaction;
- notification event.

Retry must be safe.

## 43. Concurrency

Concurrent actions must not allow:

- duplicate returns for the same eligible quantity;
- duplicate pickup;
- duplicate refund;
- duplicate replacement;
- duplicate restock;
- conflicting terminal resolutions.

Transactions/atomic operations are required where domain invariants span multiple records.

## 44. Reconciliation

Future reconciliation should identify unresolved mismatches such as:

- approved return without pickup;
- pickup without tracking progression;
- provider delivered but not received internally;
- received but inspection pending too long;
- inspected but resolution pending;
- replacement created without expected linkage;
- refund status mismatch.

Reconciliation must not fabricate resolution.

## 45. Observability

Possible future metrics:

- return request rate;
- approval rate;
- rejection rate;
- reverse-pickup success;
- average return transit time;
- inspection turnaround;
- refund-resolution turnaround;
- replacement rate;
- exchange rate;
- damaged-return rate;
- reconciliation mismatch count.

Metrics must not contain secrets or unnecessary PII.

## 46. Failure Rules

Fail closed on:

- invalid return quantity;
- expired/non-eligible return;
- unauthorized decision;
- conflicting idempotency key;
- duplicate reverse pickup;
- invalid reverse transition;
- duplicate inventory disposition;
- duplicate refund/replacement;
- provider/internal identity mismatch;
- unsafe exchange amount;
- tenant/vendor isolation failure.

Ambiguous cases enter controlled exception review.

## 47. Required Future Tests

Implementation must eventually test:

- eligible/ineligible return;
- exact return-window boundary;
- partial quantity return;
- duplicate return request;
- conflicting return idempotency;
- reverse pickup unavailable;
- duplicate reverse event;
- out-of-order reverse event;
- receipt without auto-restock;
- inspection result handling;
- duplicate inventory disposition;
- refund separation;
- duplicate replacement prevention;
- exchange price difference;
- exchange inventory unavailable;
- partial resolution;
- vendor isolation;
- provenance privacy;
- return cancellation boundary;
- lost reverse shipment;
- damaged reverse shipment;
- reconciliation mismatch;
- privacy-safe logs.

## 48. Activation Boundary

This document is Future architecture only.

It does NOT:

- enable customer returns;
- create a reverse pickup;
- add a courier integration;
- upload return evidence;
- issue a refund;
- restock inventory;
- create replacement shipments;
- change Firestore;
- add credentials;
- deploy anything.

Future implementation requires a separately approved feature phase with migrations,
tests, emulator/test validation, Blaze staging, security re-audit, explicit
production approval and rollback verification.
