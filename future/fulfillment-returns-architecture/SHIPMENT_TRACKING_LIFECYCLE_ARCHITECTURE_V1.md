# AV Silks Future Shipment & Tracking Lifecycle Architecture v1

Status: FUTURE-ONLY / PROVIDER-NEUTRAL DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a secure, idempotent and courier-provider-neutral lifecycle for future shipment creation, labels, pickup, tracking, delivery and operational reconciliation.

This design must not alter the current AV Silks MVP order, payment, inventory or provenance behavior.

## 2. Authority Boundary

Shipment truth is related to, but separate from:

- commerce order truth;
- payment truth;
- inventory truth;
- return/refund truth;
- public provenance truth.

A courier event is external evidence.

It must never directly overwrite unrelated AV Silks domain truth.

## 3. Shipment Creation Preconditions

Future shipment creation may proceed only after server-authoritative validation confirms applicable prerequisites such as:

- valid order/fulfillment identity;
- authorized actor/service;
- allocated order-item quantities;
- shipping serviceability;
- accepted shipping/service policy;
- valid dispatch origin;
- package data;
- shipment not already created for the same idempotency boundary;
- no conflicting cancellation/terminal state.

The frontend must never directly create a trusted courier shipment.

## 4. Shipment Creation Request Model

Conceptual internal request fields may include:

- `fulfillmentId`
- `originId`
- destination reference
- package allocation snapshot
- shipping service level
- payment-mode delivery requirement
- internal idempotency key
- approved provider-selection context

Customer PII should be resolved server-side only when necessary for the provider operation.

Do not duplicate full customer address data across unnecessary collections.

## 5. Internal vs Provider Identity

AV Silks owns internal identities:

- `shipmentId`
- `packageId`
- `trackingEventId`

Provider identities remain separate:

- `providerShipmentRef`
- `providerTrackingRef`
- `providerLabelRef`
- `providerPickupRef`

Provider identifiers must not become AV Silks primary database keys.

## 6. Shipment Creation Idempotency

Shipment creation must be idempotent.

Equivalent retries must not:

- create duplicate courier shipments;
- allocate order quantity twice;
- generate conflicting tracking identities;
- charge an operation twice where the provider has a billable action.

A stable internal operation/idempotency record should preserve:

- operation type;
- business identity;
- request fingerprint;
- outcome reference;
- status;
- timestamps.

A reused idempotency key with conflicting input must fail closed.

## 7. Provider Adapter Contract

Core fulfillment code should depend on an internal provider adapter contract.

Conceptual capabilities:

- create shipment;
- cancel shipment where supported;
- create/get label;
- schedule pickup;
- cancel pickup where supported;
- normalize tracking data;
- verify webhook authenticity where supported;
- obtain shipment status;
- initiate provider-supported RTO where appropriate.

Provider-specific SDK objects must not leak into core domain logic.

## 8. Provider Selection Boundary

Provider selection is a server-side operational decision.

Possible future inputs:

- serviceability;
- service level;
- package capability;
- delivery estimate;
- reliability policy;
- COD support;
- reverse-pickup support;
- approved commercial policy.

No customer-controlled provider identifier may bypass approved selection policy.

## 9. Label Lifecycle

Canonical label state may include:

- `NOT_REQUESTED`
- `REQUESTED`
- `READY`
- `FAILED`
- `VOIDED`

Rules:

- labels belong to an existing trusted shipment/package;
- duplicate label requests must be safely handled;
- label references must be access-controlled;
- temporary provider label URLs must not become permanent public identifiers;
- labels must not expose unnecessary internal/payment/security metadata.

## 10. Pickup Lifecycle

Canonical pickup state may include:

- `NOT_REQUIRED`
- `PENDING`
- `SCHEDULED`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

Pickup status must not falsely imply package possession unless provider/operational evidence supports it.

## 11. Tracking Event Normalization

External courier statuses must be mapped into canonical AV Silks shipment states.

Each normalized event should conceptually contain:

- internal tracking event ID;
- shipment ID;
- normalized event type;
- normalized shipment state;
- sanitized provider event code;
- provider event reference/hash where safe;
- provider event timestamp;
- AV Silks received timestamp;
- source;
- authenticity/verification outcome;
- idempotency fingerprint.

Raw provider wording must not become authoritative frontend business logic.

## 12. Append-Oriented Tracking History

Tracking history should be append-oriented and auditable.

Normal processing must not silently rewrite prior accepted events.

Corrections require an explicit correction/audit mechanism.

Customer-facing tracking should be projected from trusted normalized events.

## 13. Duplicate Event Handling

Duplicate webhooks, polling results or provider retries must not create duplicate business effects.

Future deduplication may use:

- provider event ID;
- provider shipment reference;
- normalized event fingerprint;
- timestamp/context;
- signed payload digest where appropriate.

Deduplication records must not store secret material.

## 14. Event Ordering and Late Events

Provider events may arrive late or out of order.

Therefore future processing must distinguish:

- provider event time;
- receipt time;
- current accepted state;
- transition validity.

An older event must not automatically regress a shipment from a later trusted state.

Contradictory events should enter exception/reconciliation handling.

## 15. Transition Validation

Every state change must pass an explicit transition validator.

Examples:

`READY_TO_SHIP -> LABEL_READY`

`LABEL_READY -> PICKUP_SCHEDULED`

`PICKUP_SCHEDULED -> PICKED_UP`

`PICKED_UP -> IN_TRANSIT`

`IN_TRANSIT -> OUT_FOR_DELIVERY`

`OUT_FOR_DELIVERY -> DELIVERED`

Exception paths must use separately approved transitions.

Provider input alone cannot bypass the validator.

## 16. Webhook Security Boundary

Future courier webhooks must use the strongest verification supported by the provider.

Where supported, verification may include:

- signature verification;
- timestamp/freshness validation;
- provider event identity;
- replay detection;
- correct raw-body handling;
- secret isolation;
- strict payload validation.

Webhook secrets must remain server-side Secret Manager/environment material and never appear in Git, frontend bundles, logs or documentation.

Failed authenticity verification must fail closed.

## 17. Webhook Processing Order

Safe conceptual order:

1. receive request;
2. preserve required verification representation;
3. authenticate/verify provider event;
4. validate payload shape;
5. resolve internal shipment;
6. check replay/idempotency;
7. normalize event;
8. validate transition;
9. atomically persist accepted state/event;
10. trigger downstream outbox/event work;
11. return controlled response.

Business side effects must not occur before authenticity and idempotency checks.

## 18. Polling / Reconciliation

Webhook delivery cannot be assumed perfect.

Future architecture may support controlled reconciliation through provider status lookup.

Reconciliation must:

- use server-held credentials;
- respect rate limits;
- normalize responses through the same state model;
- not duplicate webhook effects;
- record source as reconciliation/poll;
- never fabricate delivery.

Polling is a recovery mechanism, not a reason to weaken webhook verification.

## 19. Customer Tracking Projection

Customer-facing tracking must expose only information needed to understand delivery progress.

Potential safe fields:

- normalized public shipment status;
- human-readable timeline;
- estimated delivery range;
- sanitized location description where appropriate;
- last updated timestamp.

Do not expose:

- courier API credentials;
- private provider contract fields;
- internal fraud/risk notes;
- customer PII beyond what the customer already owns;
- provider webhook payloads;
- internal audit identifiers;
- payment secrets.

## 20. Public Tracking Identifier

If a public tracking URL is introduced later, it must use a non-guessable or otherwise reviewed privacy-safe access design.

Internal sequential database IDs must not automatically become public lookup keys.

Authentication/authorization requirements depend on the final product design and privacy review.

## 21. Partial Shipment Handling

One order may have multiple shipments.

Rules:

- each shipment owns an explicit quantity allocation;
- shipment quantities cannot exceed fulfillment/order quantities;
- one delivered shipment does not mark every other shipment delivered;
- customer order tracking aggregates all applicable shipment states;
- inventory effects remain transactionally authoritative elsewhere.

Quantity conservation remains mandatory.

## 22. Split Package Handling

One shipment may contain multiple packages where provider/process supports it.

Package tracking may be independent.

Overall shipment status must be derived through explicit aggregation rules.

A single delivered package must not falsely mark undelivered packages complete.

## 23. Delivery Confirmation

`DELIVERED` should require accepted courier/operational evidence.

Delivery state alone does not automatically mean:

- payment reconciliation complete;
- COD settlement complete;
- return window closed;
- customer dispute impossible;
- provenance changed.

Those domains remain separate.

## 24. Delivery Exceptions

Examples include:

- address issue;
- recipient unavailable;
- operational delay;
- weather/network disruption;
- damaged parcel;
- lost parcel;
- refused delivery;
- provider anomaly.

Provider-specific reasons must normalize to controlled internal reason categories.

Customer messages should avoid exposing sensitive internal notes.

## 25. Lost / Damaged Shipment

`LOST` or `DAMAGED` shipment evidence should initiate a controlled resolution workflow.

It must not automatically:

- refund twice;
- restock inventory incorrectly;
- create replacement twice;
- erase shipment history.

Financial and inventory actions require authoritative downstream rules.

## 26. Shipment Cancellation

Cancellation must verify:

- authorized actor;
- current internal state;
- provider cancellation eligibility;
- idempotency;
- provider outcome;
- order/fulfillment consequences.

A local cancellation request is not equivalent to provider-confirmed cancellation.

After physical pickup, normal cancellation may require RTO/return handling.

## 27. NDR / RTO Handoff

NDR and RTO detailed business architecture belongs to the dedicated later gate.

This shipment lifecycle provides only controlled handoff states such as:

- `DELIVERY_EXCEPTION`
- `NDR_OPEN`
- `RTO_INITIATED`
- `RTO_IN_TRANSIT`
- `RTO_DELIVERED`

No automatic refund decision is implied.

## 28. Multi-Provider Support

Normalized shipment state and tracking event contracts must remain provider-neutral.

Changing courier provider later should primarily require:

- a new adapter;
- mappings;
- credentials/configuration;
- provider-specific tests.

Core order/payment/inventory logic should not need provider-specific rewrites.

## 29. Multi-Vendor Compatibility

Future vendor fulfillment may use vendor-scoped shipments.

Mandatory isolation:

- vendor A cannot read/write vendor B shipment records;
- provider credentials remain correctly scoped;
- platform-level overrides require explicit privileged authorization;
- cross-vendor shipment consolidation is never assumed.

## 30. Provenance Compatibility

Public Handloom/QR provenance remains independent from customer logistics.

Public provenance must never expose:

- customer name;
- phone;
- delivery address;
- private tracking token;
- provider credential;
- internal courier contract information;
- refund/dispute notes.

Internal links between provenance/product/order/shipment may exist only under appropriate authorization.

## 31. Audit Events

Security/operations audit examples:

- manual shipment creation override;
- provider change;
- manual tracking correction;
- shipment cancellation override;
- label regeneration;
- address correction after order placement;
- manual delivered-state correction;
- exception resolution.

Audit records should capture actor, reason, target, result and timestamp without copying unnecessary PII.

## 32. Observability

Future operational metrics may include:

- shipment creation success/failure;
- provider latency;
- webhook verification failures;
- duplicate event rate;
- invalid transition rate;
- delivery exception rate;
- delivery duration;
- reconciliation mismatch count.

Metrics and logs must not contain secrets or unnecessary customer PII.

## 33. Failure Rules

Fail closed on:

- missing trusted fulfillment;
- invalid quantity allocation;
- unauthorized shipment creation;
- conflicting idempotency reuse;
- invalid webhook authenticity;
- malformed provider event;
- impossible state transition;
- unknown critical provider mapping;
- provider/internal identity mismatch.

Ambiguous provider evidence must enter controlled exception handling.

## 34. Required Future Tests

Implementation must eventually test:

- duplicate shipment-create retry;
- conflicting idempotency reuse;
- provider-create timeout/retry;
- label retry;
- pickup lifecycle;
- valid webhook signature;
- invalid webhook signature;
- replayed webhook;
- duplicate event;
- out-of-order event;
- invalid state jump;
- late event after delivery;
- partial shipment aggregation;
- multi-package aggregation;
- cancellation boundary;
- reconciliation mismatch;
- multi-provider normalization;
- vendor isolation;
- privacy-safe customer tracking;
- secret-safe logging.

## 35. Activation Boundary

This document is Future architecture only.

It does NOT:

- add a courier SDK;
- call a courier API;
- create a shipment;
- create a label;
- schedule a pickup;
- add a webhook route;
- change Firestore;
- change current order/payment/inventory behavior;
- deploy anything.

Implementation requires a separately approved feature branch, migrations where needed, tests, emulator/test validation, Blaze staging, security re-audit, explicit production approval and rollback verification.
