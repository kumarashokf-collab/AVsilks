# AV Silks Future Fulfillment Domain & State Model v1

Status: FUTURE-ONLY / DESIGN CONTRACT / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a provider-neutral fulfillment domain for future shipping, delivery, returns, exchanges and reverse logistics without changing the current AV Silks order, inventory, payment or provenance truth models.

## 2. Core Separation Rule

The following are separate state machines:

1. Commerce Order
2. Fulfillment
3. Shipment
4. Package
5. Tracking Event
6. Return Case
7. Return Shipment / Reverse Pickup
8. Resolution

No courier status may directly overwrite order, payment, inventory or provenance truth.

Future implementation must map to the then-current canonical AV Silks order state machine. This architecture does not silently replace existing order statuses.

## 3. Core Aggregate Relationships

Conceptual relationship:

`Order -> Fulfillment -> Shipment -> Package(s) -> Tracking Events`

Optional reverse flow:

`Order Item(s) -> Return Case -> Return Shipment -> Inspection -> Resolution`

Rules:

- one order may produce one or more fulfillments;
- one fulfillment may produce one or more shipments;
- one shipment may contain one or more packages;
- one package may contain one or more order-item quantities;
- an order item must never be over-allocated across packages;
- a return case references immutable order-item identity and approved quantity;
- exchanges/replacements create a new controlled outbound fulfillment relationship rather than mutating historical shipment truth.

## 4. Canonical Identity Model

Future entities should use opaque internal identifiers:

- `fulfillmentId`
- `shipmentId`
- `packageId`
- `trackingEventId`
- `returnCaseId`
- `returnShipmentId`
- `resolutionId`

External provider identifiers are stored separately:

- `providerShipmentRef`
- `providerTrackingRef`
- `providerLabelRef`

Provider IDs must never become the primary internal database identity.

## 5. Fulfillment State Machine

Canonical fulfillment states:

- `PENDING`
- `READY`
- `IN_PROGRESS`
- `PARTIALLY_SHIPPED`
- `SHIPPED`
- `PARTIALLY_DELIVERED`
- `DELIVERED`
- `CANCELLED`
- `EXCEPTION`

Meaning:

### PENDING
Fulfillment exists but is not ready for physical processing.

### READY
Items, inventory and operational prerequisites are ready for packing.

### IN_PROGRESS
Packing/shipping work has started.

### PARTIALLY_SHIPPED
Some allocated quantity has shipped while remaining quantity is still pending.

### SHIPPED
All fulfillment quantity has entered outbound shipment flow.

### PARTIALLY_DELIVERED
At least one shipment/package is delivered while another remains unresolved.

### DELIVERED
All fulfillment quantities are delivered or otherwise terminally resolved according to approved business rules.

### CANCELLED
Fulfillment was cancelled before prohibited physical-progress boundaries.

### EXCEPTION
Manual review is required because fulfillment cannot safely advance automatically.

## 6. Shipment State Machine

Canonical shipment states:

- `DRAFT`
- `READY_TO_SHIP`
- `LABEL_READY`
- `PICKUP_SCHEDULED`
- `PICKED_UP`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `DELIVERY_EXCEPTION`
- `NDR_OPEN`
- `RTO_INITIATED`
- `RTO_IN_TRANSIT`
- `RTO_DELIVERED`
- `LOST`
- `DAMAGED`
- `CANCELLED`

### Terminal shipment states

Potential terminal states:

- `DELIVERED`
- `RTO_DELIVERED`
- `LOST`
- `DAMAGED`
- `CANCELLED`

Terminal does not mean financially resolved. Refund/payment consequences remain a separate decision.

## 7. Allowed Shipment Transition Principles

Examples of valid direction:

`DRAFT -> READY_TO_SHIP`

`READY_TO_SHIP -> LABEL_READY`

`LABEL_READY -> PICKUP_SCHEDULED`

`PICKUP_SCHEDULED -> PICKED_UP`

`PICKED_UP -> IN_TRANSIT`

`IN_TRANSIT -> OUT_FOR_DELIVERY`

`OUT_FOR_DELIVERY -> DELIVERED`

Exception paths may include:

`OUT_FOR_DELIVERY -> DELIVERY_EXCEPTION`

`DELIVERY_EXCEPTION -> NDR_OPEN`

`NDR_OPEN -> OUT_FOR_DELIVERY`

or

`NDR_OPEN -> RTO_INITIATED`

`RTO_INITIATED -> RTO_IN_TRANSIT`

`RTO_IN_TRANSIT -> RTO_DELIVERED`

A provider webhook cannot arbitrarily jump to a contradictory state. Future implementation must apply an explicit transition validator.

## 8. Package Model

A package is a physical unit inside a shipment.

Conceptual fields:

- package internal ID
- shipment internal ID
- order-item allocation snapshot
- quantity allocation
- weight
- dimensional metadata
- declared-value snapshot where required
- packaging type
- label reference
- status summary

Never store payment secrets or unnecessary customer identity inside package records.

## 9. Tracking Event Model

Tracking history is append-oriented.

Conceptual event fields:

- internal event ID
- shipment ID
- normalized event type
- normalized shipment state
- provider event type
- provider event reference/hash where safe
- event timestamp
- received timestamp
- sanitized location text where justified
- source: provider webhook / provider poll / operator / system
- idempotency key
- verification status

Rules:

- duplicate provider events must be idempotently ignored;
- old events must not roll a shipment backward unless an explicitly reviewed correction rule exists;
- webhook receipt time and provider event time remain distinguishable;
- raw provider payload retention is minimized and privacy-reviewed;
- logs must not expose phone numbers, addresses, tokens or courier credentials.

## 10. Return Case State Machine

Canonical return-case states:

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

A return request does not automatically mean refund approval.

## 11. Resolution Types

Future resolution types may include:

- `REFUND`
- `REPLACEMENT`
- `EXCHANGE`
- `STORE_CREDIT`
- `REPAIR`
- `NO_ACTION`

Actual allowed resolution types require business/policy approval at implementation time.

Resolution truth must be recorded independently from courier movement.

## 12. Reverse Shipment Model

Reverse shipment is not a reuse of outbound shipment history.

It has its own:

- `returnShipmentId`
- provider reference
- pickup state
- reverse tracking events
- received/inspection handoff
- failure/exception state

Outbound history remains immutable.

## 13. State Ownership

Authoritative owners:

- Order status: AV Silks commerce/order service
- Payment status: AV Silks payment service
- Inventory truth: AV Silks inventory transaction logic
- Fulfillment status: future fulfillment service
- Shipment status: future shipment normalization service
- Return eligibility: future return-policy service + authorized decision path
- Refund finalization: payment/refund service
- Provenance public truth: provenance service

Courier systems provide evidence/events. They are not the final authority for unrelated AV Silks domains.

## 14. Idempotency & Concurrency

Future write operations require stable idempotency boundaries.

Examples:

- shipment creation
- label creation
- pickup scheduling
- provider webhook consumption
- NDR action
- RTO initiation
- return creation
- reverse pickup creation
- resolution initiation

Concurrent events must not:

- double-create shipments;
- over-allocate order quantities;
- double-restock inventory;
- double-refund;
- create duplicate replacements;
- regress terminal states without explicit correction flow.

## 15. Partial Shipment Invariants

For each order item:

`fulfilledQty + cancelledQty <= orderedQty`

For each fulfillment:

`allocatedQty >= shippedQty >= deliveredQty`

Any implementation that violates quantity conservation must fail closed.

A partial shipment must not imply that the entire order is delivered.

## 16. Cancellation Boundary

Cancellation eligibility depends on actual operational state.

Examples:

- `DRAFT` / `READY_TO_SHIP`: cancellation may be possible;
- after `PICKED_UP`: normal cancellation may be prohibited and require return/RTO workflow;
- provider cancellation success is not assumed until confirmed.

Inventory release must occur exactly once under authoritative transaction rules.

## 17. Provenance Compatibility

Public QR provenance remains separate from shipment/customer data.

Public provenance must never expose:

- customer name
- delivery address
- phone number
- courier credential
- private tracking token
- internal fraud/risk notes
- payment secret
- return-sensitive notes

Return/exchange may link internally to product/provenance history, but public provenance truth must remain privacy-safe and historically auditable.

## 18. Vendor Compatibility

Future multi-vendor orders may create vendor-scoped fulfillments.

Rules:

- vendor A cannot read/write vendor B shipment data;
- platform admin/owner permissions remain explicit;
- courier credentials may be platform-scoped or vendor-scoped only under reviewed secret isolation;
- cross-vendor quantities cannot share an ambiguous fulfillment allocation;
- one order may therefore produce multiple vendor fulfillments and shipments.

## 19. Audit Events

Security-sensitive operational actions require audit records, for example:

- manual shipment state correction
- cancellation override
- NDR decision
- RTO decision
- return approval/rejection
- inspection outcome
- resolution selection
- refund/replacement trigger
- address correction after order creation where policy permits

Audit records should contain actor/reference/reason/result metadata without duplicating unnecessary customer PII.

## 20. Failure Principle

If provider state conflicts with AV Silks invariants:

1. do not silently overwrite trusted state;
2. record a sanitized exception;
3. preserve idempotency;
4. block unsafe automated transition;
5. route to authorized review;
6. never expose secrets while diagnosing.

## 21. Future Implementation Boundary

This document defines architecture only.

It does NOT:

- add Firestore collections;
- add backend routes;
- call courier APIs;
- change current order states;
- change payment logic;
- change inventory logic;
- create shipments;
- create returns;
- deploy anything.

Implementation requires a separately approved future feature phase with migrations, tests, security review, staging and rollback verification.
