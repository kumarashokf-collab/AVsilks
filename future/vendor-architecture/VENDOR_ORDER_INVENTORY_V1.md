# AV Silks Vendor Orders & Inventory Architecture v1

Status: FUTURE ONLY

## Vendor Order boundary

A customer order may eventually contain products from more than one Vendor.

A Vendor must see only its own fulfillment segment and own line items.

Conceptually:

Customer Order
-> Vendor Fulfillment Segment
-> Vendor-owned Order Lines

A Vendor must never gain access to another Vendor's line items simply
because they share the same customer order.

## Vendor Order projection

Permitted future Vendor concepts may include:

- vendorOrderId
- safe order reference
- own line-item snapshots
- fulfillment status
- shipment reference
- Vendor-scoped financial summary
- minimum customer fulfillment data required for delivery

The projection must not expose:

- payment gateway credentials
- other Vendors' products or settlement data
- unnecessary customer private data
- KYC documents
- government-ID values

## Immutable order-line snapshot

Once an order is created, the trusted order-line snapshot preserves the
approved commerce facts required for fulfillment and audit.

Vendor must not rewrite:

- ordered product identity
- ordered variant/SKU
- ordered quantity
- authoritative unit price
- discount
- payment total

Catalog changes after purchase must not silently rewrite historical order
lines.

## Fulfillment lifecycle

Conceptual lifecycle:

`pending -> accepted -> packed -> shipped -> delivered`

Cancellation may transition to:

`cancelled`

Allowed Vendor actions are capability-controlled and server-validated.

Vendor may conceptually:

- accept an assigned own order
- mark it packed
- submit an approved shipment transition

Vendor must not directly control platform payment confirmation, refund
state or another Vendor's fulfillment state.

Delivery/cancellation authority may depend on future shipping/platform
policy and requires explicit server-side validation.

## Concurrent transition safety

Fulfillment transitions must validate the current authoritative state.

A stale or repeated incompatible transition fails closed.

Where retries are possible, operations should use idempotency/request
identity.

## Inventory authority

Inventory remains server-authoritative.

The parked Catalog Architecture supports:

`single-sku`

and:

`variant-sku`

Inventory authority must follow the correct product/variant model.

Core values:

`stock`
`reservedStock`

Derived value:

`availableStock = stock - reservedStock`

`availableStock` is not a separate source of truth.

## Inventory invariants

Always preserve:

- stock >= zero
- reservedStock >= zero
- reservedStock <= stock
- Vendor may affect only owned SKUs/variants
- cross-Vendor inventory mutation is denied
- SKU/variant ownership is validated
- overselling is prevented transactionally

## Reservation lifecycle

System-authoritative inventory actions include:

Reserve:
- stock unchanged
- reservedStock increases

Release:
- stock unchanged
- reservedStock decreases

Consume:
- stock decreases
- reservedStock decreases

Each reservation operation must be transactional and idempotent.

Repeated processing must not double-reserve, double-release or
double-consume inventory.

## Order and Inventory coupling

An order reservation should carry a stable reference to the order,
Vendor fulfillment segment and applicable SKU/variant.

Depending on the approved future commerce policy:

- order creation may reserve inventory
- cancellation may release reservation
- successful finalization consumes reservation
- failed/expired flows release reservation

Exact runtime timing must be separately validated before implementation.

## Manual inventory adjustment

An authorized Vendor inventory capability may eventually perform a
manual stock adjustment on owned inventory.

Manual adjustment requires:

- trusted Vendor identity
- inventory capability
- owned SKU/variant
- validated quantity
- reason/reasonCode
- server timestamp
- audit event

Manual adjustment must not bypass active reservation invariants.

## Reconciliation

Future reconciliation should detect discrepancies among:

- catalog SKU/variant ownership
- stock
- reservedStock
- active reservations
- order fulfillment references
- consumption events

Any mismatch must be investigated before production activation.

## Audit Trail

Sensitive order/inventory events are server-authored.

Examples:

- Vendor order accepted
- packed
- shipped
- inventory adjusted
- inventory reserved
- inventory released
- inventory consumed
- inventory reconciled

Audit events must not contain secrets, payment credentials, raw KYC
documents or raw government-ID numbers.

## Customer privacy

Vendor receives only customer information necessary for its approved
fulfillment responsibilities.

Access should be time- and purpose-appropriate where future
implementation permits.

Reports/analytics should use reduced or aggregated customer information
instead of copying full fulfillment details unnecessarily.

## Fail-closed conditions

Reject operations when:

- Vendor ownership is ambiguous
- another Vendor's order/inventory is targeted
- SKU/variant ownership cannot be proven
- fulfillment transition is stale or invalid
- quantity is invalid
- stock invariant would be violated
- reservation state is inconsistent
- idempotency conflict indicates possible duplicate processing
- audit/security requirements cannot be satisfied

## Runtime boundary

This architecture performs no order write, inventory write, migration,
backend/frontend modification, Firestore rule change or Firebase deploy.

Blaze production-readiness remains P0.
