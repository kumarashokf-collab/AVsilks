# AV Silks Future Refund & Payment Coordination Architecture v1

Status: FUTURE-ONLY / PAYMENT-SAFE DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define how future fulfillment, returns, exchanges, RTO and logistics outcomes
coordinate safely with AV Silks payment/refund systems.

This document does not create real refunds, call Razorpay or another gateway,
change payment credentials, change current production behavior, or deploy cloud resources.

## 2. Core Authority Boundary

Payment/refund truth remains owned by the AV Silks payment domain.

The following are evidence or eligibility inputs, not payment execution authority:

- return approval;
- reverse pickup;
- inspection result;
- RTO completion;
- shipment loss/damage;
- customer support decision;
- courier webhook.

No logistics event may directly mark a monetary refund as successfully paid.

## 3. Refund Resolution Request

A fulfillment/return workflow may create an internal refund-resolution request.

Conceptual fields:

- `refundRequestId`
- order ID
- payment ID/reference
- return/resolution reference
- affected order-item quantities
- requested refund amount in minor currency units
- reason code
- policy/version reference
- idempotency key
- created timestamp
- authorized source

The payment domain independently validates the request before execution.

## 4. Refund State Machine

Canonical future refund states:

- `REQUESTED`
- `VALIDATING`
- `APPROVED`
- `SUBMISSION_PENDING`
- `SUBMITTED`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `RETRY_PENDING`
- `RECONCILIATION_PENDING`
- `CANCELLED`
- `EXCEPTION`

`SUBMITTED` or `PROCESSING` must never be shown internally as successful settlement.

## 5. Integer Money Rule

All authoritative monetary values use integer minor currency units.

For INR:

`paise`

Conceptual fields:

- `originalPaidPaise`
- `previousRefundedPaise`
- `requestedRefundPaise`
- `approvedRefundPaise`
- `remainingRefundablePaise`

Invariant:

`0 <= approvedRefundPaise <= remainingRefundablePaise`

and:

`previousRefundedPaise + approvedRefundPaise <= originalPaidPaise`

No client-supplied amount becomes authoritative.

## 6. Refund Eligibility Validation

Before execution, future payment logic must validate:

- trusted order identity;
- trusted payment identity;
- payment status;
- payment amount;
- refund/resolution authorization;
- item/quantity scope where applicable;
- previous refunds;
- currency;
- idempotency;
- gateway/provider binding;
- amount remaining refundable.

Conflicting or ambiguous data must fail closed.

## 7. Refund Idempotency

Refund execution must be idempotent.

Equivalent retry must not:

- submit a second provider refund;
- decrement refundable balance twice;
- create duplicate accounting/audit effects;
- send duplicate final-success notifications.

A reused idempotency key with different refund amount or business identity must fail closed.

## 8. Partial Refunds

Future AV Silks may support partial refunds.

Examples include:

- one item returned from a multi-item order;
- partial quantity return;
- approved shipping-charge refund;
- exchange price difference;
- damaged/missing item resolution.

Partial refunds must never cause cumulative refunds to exceed authoritative captured/settled payment value.

## 9. Multiple Refunds

A single payment may have multiple legitimate partial refunds.

Therefore refund history must remain append-oriented and individually identifiable.

Future calculations must derive:

`remainingRefundablePaise = originalRefundablePaise - successfullyRefundedPaise`

Pending/failed refunds must be handled explicitly and not blindly counted as successful.

## 10. Prepaid Order Refunds

For prepaid orders, future refund flow may involve a payment gateway/provider.

Safe conceptual flow:

1. receive authorized resolution request;
2. validate amount and payment identity;
3. acquire idempotency boundary;
4. submit refund to provider;
5. persist provider reference safely;
6. process provider result/webhook;
7. reconcile ambiguous outcomes;
8. mark final internal state only from trusted evidence.

Provider timeout must not automatically be interpreted as failure or success.

## 11. COD Order Resolution

COD refund handling is different from prepaid gateway refund handling.

Possible cases include:

- COD never collected;
- COD collected but not yet remitted;
- COD remitted;
- alternate approved refund channel required.

No gateway refund should be attempted merely because the original payment mode was COD.

COD settlement status must be reconciled before financial resolution where relevant.

## 12. RTO Financial Boundary

RTO completion does not automatically authorize a refund.

Future resolution may depend on:

- original payment mode;
- whether money was collected;
- shipment outcome;
- item receipt/inspection where required;
- cancellation/return policy;
- prior refund activity.

RTO and refund remain separately stateful.

## 13. Return Financial Boundary

Return approval does not equal refund success.

Future sequence may include:

`Return Approved -> Reverse Logistics -> Receipt/Inspection -> Resolution Approved -> Refund Request -> Payment Validation -> Provider Execution -> Reconciliation -> Refund Success`

Business policy may allow different sequences for specific cases, but monetary authority remains with the payment domain.

## 14. Exchange Payment Coordination

Exchange may produce:

- zero price difference;
- additional amount payable;
- partial refund owed.

The original payment history remains immutable.

Any additional payment should create a separately auditable payment transaction/relationship.

Any refund follows the same refund idempotency and amount-authority rules.

## 15. Replacement Boundary

A replacement does not automatically imply monetary refund.

Replacement fulfillment and payment resolution must remain separately recorded.

Policy must prevent accidental combination of full refund plus free replacement unless explicitly approved.

## 16. Shipping Charge Refunds

Shipping charges require explicit refund policy.

Potential components:

- outbound shipping;
- return shipping;
- COD fee;
- handling fee;
- promotional shipping discount.

The refund engine must distinguish these components instead of manipulating one opaque total.

Commercial values/policies remain future configuration.

## 17. Promotion and Discount Allocation

For partial item refunds, discounts may require deterministic allocation.

Future policy must define:

- order-level discount allocation;
- item-level discount;
- shipping promotion interaction;
- rounding;
- tax treatment.

Refund calculation must not allow a returned item to refund more than its authoritative net paid allocation.

## 18. Tax Coordination

Future implementation must preserve invoice/tax/legal requirements.

Refund/payment architecture should support references to:

- original invoice;
- credit note/refund document where required;
- refunded taxable value;
- tax allocation.

Actual India tax/GST behavior requires appropriate legal/accounting review before production activation.

## 19. Gateway Adapter Boundary

Core refund business logic should use an internal payment/refund adapter.

Conceptual operations:

- create refund;
- fetch refund status;
- verify provider webhook;
- normalize refund event;
- reconcile provider transaction.

Provider-specific SDK objects must not leak into fulfillment/return domain logic.

## 20. Provider Refund Reference

Provider refund references remain separate from AV Silks internal refund IDs.

Conceptual:

- `refundRequestId` — AV Silks identity
- `providerRefundRef` — gateway identity

Provider reference must not become the primary internal database identity.

## 21. Provider Webhook Security

Refund/payment provider webhooks must follow existing secure payment principles.

Where supported:

- raw-body integrity;
- signature verification;
- freshness/replay protection;
- strict payload validation;
- payment/order/refund identity verification;
- amount verification;
- idempotency;
- safe error handling.

No financial state transition may occur before authenticity verification.

## 22. Refund Webhook Idempotency

Duplicate refund webhooks must not:

- mark success multiple times;
- create repeated ledger effects;
- send duplicate final notifications;
- trigger inventory effects.

Provider event identity/fingerprint should support exactly-once business effects.

## 23. Out-of-Order Payment Events

Payment/refund events may arrive out of order.

Future processing must distinguish:

- provider event timestamp;
- receipt timestamp;
- current accepted refund state;
- allowed transition.

Older events cannot arbitrarily regress a terminal trusted state.

Contradictory evidence enters reconciliation.

## 24. Provider Timeout / Unknown Outcome

A refund API timeout can produce an unknown outcome.

Safe response:

- do not automatically retry without idempotency assurance;
- mark reconciliation pending;
- query provider status where supported;
- correlate by trusted identifiers;
- finalize only when evidence is sufficient.

This prevents duplicate refunds.

## 25. Refund Reconciliation

Future reconciliation may compare:

- AV Silks refund state;
- provider refund state;
- provider amount;
- currency;
- original payment;
- provider refund reference;
- timing/status.

Mismatch categories may include:

- provider success / internal pending;
- internal submitted / provider missing;
- amount mismatch;
- identity mismatch;
- duplicate provider refunds.

Mismatch must be surfaced for controlled resolution.

## 26. Inventory Independence

Refund success must not directly restock inventory.

Inventory disposition is independently authorized by returns/inspection/inventory logic.

Likewise, inventory restock does not prove refund completion.

## 27. Notification Boundary

Customer notification should distinguish:

- refund requested;
- refund approved;
- refund submitted;
- refund processing;
- refund completed;
- refund failed/requires action.

Do not tell the customer “refund successful” based only on return approval or API submission.

## 28. Audit Requirements

Audit-worthy financial actions include:

- manual refund approval;
- refund amount override;
- retry decision;
- provider reference correction;
- manual reconciliation;
- exchange price adjustment;
- shipping-fee refund;
- refund cancellation where possible;
- exceptional financial resolution.

Audit records should capture actor, target, reason, amount, outcome and timestamp without storing payment secrets.

## 29. RBAC / Authorization

Future permissions should distinguish:

- customer request rights;
- vendor recommendation/review rights;
- admin operational rights;
- owner/high-risk financial override rights;
- automated service permissions.

Vendor access must remain tenant-scoped.

A vendor must not execute unrestricted platform-level refunds.

## 30. Multi-Vendor Compatibility

Future marketplace payment/refund coordination may require:

- vendor-scoped order lines;
- commission impacts;
- settlement adjustment;
- platform fee handling;
- vendor payout adjustment.

These are separate accounting/settlement concerns and require dedicated future policy.

No vendor may access another vendor's payment/refund records beyond explicitly authorized platform views.

## 31. Provenance Privacy Boundary

Public Handloom/QR provenance must never expose:

- refund amount;
- payment reference;
- gateway reference;
- customer dispute;
- settlement details;
- COD collection details;
- private financial audit notes.

Returns/refunds may be internally linked for audit without becoming public provenance data.

## 32. Logging Privacy

Never log:

- payment secrets;
- webhook secrets;
- complete sensitive gateway payloads;
- private customer banking/payment data;
- unrestricted refund authorization tokens;
- unnecessary customer PII.

Use sanitized identifiers and structured result metadata.

## 33. Fraud / Abuse Boundary

Future refund-risk controls may inspect suspicious patterns.

Private risk signals remain server-side and least-privilege.

They must not:

- appear in public provenance;
- be sent as unrestricted customer-facing explanations;
- bypass required authorization/audit rules.

## 34. Exactly-Once Downstream Effects

Refund success may trigger downstream events such as:

- customer notification;
- accounting event;
- order financial summary update;
- analytics event.

Each must have an idempotent event/outbox boundary.

Retry must not duplicate business effects.

## 35. Concurrency

Concurrent refund requests must not allow:

- refund amount exceeding refundable balance;
- duplicate provider refund;
- two resolutions consuming the same refundable amount;
- exchange refund racing with return refund.

Future implementation requires transactional reservation/finalization of refundable balance where needed.

## 36. Refund Reservation Concept

Before external provider submission, future design may reserve authorized refundable value.

Conceptual values:

- available refundable amount;
- reserved refund amount;
- finalized refunded amount.

Invariant:

`reservedRefundPaise + finalizedRefundPaise <= originalRefundablePaise`

Failed/cancelled reservations must release exactly once.

## 37. Provider Credentials

Payment-provider credentials remain server-side only.

Future fulfillment/return documentation and frontend code must never contain:

- payment secret;
- webhook secret;
- private provider credential.

Secret rotation remains independent operational procedure.

## 38. Failure Rules

Fail closed on:

- unauthorized refund;
- invalid payment identity;
- invalid currency;
- non-positive/invalid amount;
- refund exceeding remaining balance;
- conflicting idempotency key;
- invalid webhook authenticity;
- provider/internal amount mismatch;
- duplicate finalization;
- tenant isolation failure;
- ambiguous provider outcome without reconciliation.

## 39. Observability

Future privacy-safe metrics may include:

- refund request count;
- refund approval rate;
- refund success/failure;
- provider processing duration;
- reconciliation-pending count;
- amount mismatch count;
- duplicate/replay rejection count;
- refund-by-resolution type.

Metrics must not expose secrets or unnecessary PII.

## 40. Required Future Tests

Implementation must eventually test:

- full prepaid refund;
- partial refund;
- multiple partial refunds;
- refund exceeding remaining balance;
- duplicate refund request;
- conflicting idempotency key;
- provider timeout;
- retry after unknown outcome;
- successful reconciliation;
- amount mismatch;
- invalid webhook signature;
- webhook replay;
- out-of-order refund event;
- duplicate webhook;
- COD not-collected case;
- COD collected/remittance pending;
- exchange additional-payment path;
- exchange partial-refund path;
- shipping-charge refund;
- duplicate downstream notification prevention;
- concurrent refund reservation;
- vendor isolation;
- provenance privacy;
- secret-safe logging.

## 41. Activation Boundary

This document is Future architecture only.

It does NOT:

- execute a refund;
- call a real payment gateway;
- change Razorpay configuration;
- change payment credentials;
- alter current payment routes;
- change Firestore;
- change inventory;
- deploy anything.

Future implementation requires a separately approved feature phase with payment
tests, emulator/test validation, Blaze staging, security re-audit, explicit
production approval and rollback verification.
