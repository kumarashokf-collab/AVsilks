# AV Silks Future Discount Pricing, Checkout, Tax & Refund Authority Architecture v1

Status: FUTURE-ONLY / ARCHITECTURE / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define how future AV Silks promotions interact with trusted pricing, checkout,
tax, payment, orders, invoices, vendor funding, cancellations and refunds.

`Promotion Rules Propose Discount Eligibility; Trusted Commerce Finalizes Money.`

This architecture does not implement or activate any discount.

## 2. Core Authority Principle

Final commerce amounts must be calculated by trusted backend commerce logic.

The frontend must never be authoritative for:

- item price;
- subtotal;
- discount amount;
- shipping charge;
- tax;
- stored-value application;
- loyalty redemption value;
- final payable amount;
- payment/refund amount.

## 3. Promotion vs Pricing Domain

The Promotion domain owns commercial rule definition and eligibility references.

The trusted Pricing/Checkout domain owns final monetary evaluation.

Conceptual flow:

`Promotion Rules + Trusted Cart Context -> Trusted Pricing Evaluation -> Quote`

Promotion configuration alone is not a final monetary transaction.

## 4. Canonical Money Representation

Future authoritative monetary calculations should use an approved precise money
representation such as integer minor units.

Every amount must bind to an explicit currency.

Authoritative floating-point money arithmetic is prohibited.

## 5. Currency Authority

Currency must come from trusted commerce configuration/context.

A client must not convert a promotion from one currency to another merely by
submitting a currency code.

Cross-currency promotion support requires separately reviewed conversion policy.

## 6. Rounding Policy

Rounding rules must be deterministic, explicit and centrally defined.

Future implementation must specify:

- unit of calculation;
- rounding mode;
- rounding stage;
- allocation rounding;
- tax interaction;
- final payable rounding.

Browser-specific floating-point behavior must not determine customer charges.

## 7. Non-Negative Amount Invariant

Discount calculations must not produce invalid negative commercial amounts.

A future pricing pipeline must enforce appropriate floors so that a discount
cannot unintentionally create a negative payable item/order value.

Any deliberate credit/reward beyond purchase value requires a separate accounting
model.

## 8. Maximum Discount Boundary

Promotion configuration may define caps, but trusted pricing must enforce them.

Potential boundaries include:

- per-line maximum;
- per-order maximum;
- percentage cap;
- vendor-funded cap;
- campaign-funded cap.

The frontend cannot override or remove a maximum discount.

## 9. Pricing Input Snapshot

A pricing evaluation should use a trusted snapshot/reference of applicable:

- product IDs;
- product prices;
- quantities;
- vendor ownership;
- promotion versions;
- customer eligibility result;
- usage/reservation state;
- currency;
- server timestamp.

Untrusted display values must not replace authoritative inputs.

## 10. Price Re-Resolution

Checkout must re-resolve current authoritative price before creating the final
commercial commitment.

A product-page/cart promotion preview may be stale.

Stale frontend price or discount values must not be trusted.

## 11. Pricing Quote Concept

A future pricing evaluation may return an immutable/versioned quote concept.

A quote may contain approved references such as:

- quote ID;
- quote version/hash;
- currency;
- item price snapshots;
- promotion IDs/versions;
- discount allocations;
- shipping;
- tax;
- payable total;
- server timestamp;
- expiry.

Exact persistence is an implementation decision.

## 12. Quote Expiry

A pricing quote must have explicit freshness/expiry semantics where needed.

Expired/stale quotes must be recalculated rather than silently accepted.

The client cannot extend quote validity.

## 13. Quote Integrity

If a quote is carried across checkout steps, the backend must verify its trusted
identity/integrity.

A client must not modify:

- amount;
- promotion allocation;
- funding source;
- tax;
- vendor scope;
- expiry.

## 14. Pricing Idempotency

Retrying the same trusted pricing/finalization operation should not create
inconsistent commercial results or duplicate consumption.

Idempotency must bind to a stable trusted business operation where appropriate.

## 15. Item-Level Discounts

Item-level promotions apply only to eligible line items.

The pricing engine must preserve:

- line identity;
- quantity;
- unit-price snapshot;
- promotion identity/version;
- discount allocation;
- vendor identity.

An item discount must not leak to an ineligible item.

## 16. Order-Level Discounts

Order-level promotions require an explicitly defined eligible basis.

The architecture must define whether the basis includes or excludes:

- already-discounted item amounts;
- shipping;
- tax;
- gift/stored value;
- vendor-restricted lines.

The basis must be deterministic and testable.

## 17. Category / Vendor Discount Allocation

Category/vendor promotions must be allocated only to eligible scoped lines.

A vendor-funded discount must not reduce another vendor's commercial amount unless
an explicitly authorized platform/shared policy says so.

## 18. Mixed-Vendor Cart Authority

A multi-vendor cart requires deterministic per-vendor monetary boundaries.

Future pricing must preserve:

- each vendor's eligible lines;
- each vendor-funded discount;
- platform-funded discount;
- shared-funded allocation;
- tax/shipping allocation where applicable;
- total consistency.

`Cross-vendor funding leakage is forbidden.`

## 19. Funding Attribution

Every financially meaningful promotion application should preserve enough
information to attribute the discount to its approved funding source.

Potential references include:

- platform;
- vendor;
- shared funding;
- approved Government/Handloom program.

Funding attribution does not itself perform settlement.

## 20. Platform-Funded Promotions

Platform-funded promotions may affect customer payable price while remaining
financially attributable to the platform.

Future settlement/accounting logic must explicitly understand the funding
allocation.

A vendor must not be charged accidentally for a platform-funded promotion.

## 21. Vendor-Funded Promotions

Vendor-funded promotions must remain within the authorized vendor's products and
approved funding limits.

Vendor funding rules require:

- vendor ownership;
- promotion scope;
- cap/budget policy;
- reconciliation;
- audit.

## 22. Shared-Funded Promotions

Shared platform/vendor funding requires deterministic contribution allocation.

The system must be able to explain how much discount liability belongs to each
approved funding party.

Hidden or approximate allocation is insufficient for financial reconciliation.

## 23. Government / Handloom Program Funding

Future Government/Handloom support campaigns may reference an approved funding
program.

The promotion architecture must not infer government funding merely from:

- a product label;
- QR provenance;
- artisan membership;
- marketing text.

Program eligibility and funding approval remain separately authoritative.

## 24. Shipping Promotion Boundary

Free/reduced shipping is not merely an item-price discount.

A future shipping promotion requires integration with authoritative shipping
eligibility and charge calculation.

Promotion logic cannot invent service availability.

## 25. Shipping Recalculation

If cart contents, address/service area, shipping method or vendor grouping changes,
shipping-related promotion eligibility may require re-evaluation.

Frontend display is not authoritative.

## 26. Tax Authority Boundary

`Promotion architecture does not define tax law or tax rates.`

Tax rules, tax jurisdiction and statutory treatment require a separately reviewed
trusted tax/accounting implementation.

No hard-coded future tax assumption is authorized by this document.

## 27. Taxable Base Contract

Future pricing/tax integration must explicitly define how each discount type
affects the taxable base.

The answer may vary by:

- jurisdiction;
- product classification;
- funding structure;
- discount type;
- shipping treatment;
- legal/accounting policy.

The promotion engine must not guess.

## 28. Tax Calculation Order

The order of operations between discount and tax must be explicit and tested.

A conceptual pricing pipeline may include:

1. authoritative item-price resolution;
2. eligible promotion evaluation;
3. discount allocation;
4. tax-base derivation under approved policy;
5. tax calculation;
6. shipping/tax treatment;
7. final payable calculation.

Actual legal ordering must be approved at implementation time.

## 29. Tax Rounding

Tax calculations must use approved deterministic rounding.

Independent rounding at item/order levels can produce reconciliation differences,
so allocation and aggregation policy must be explicitly defined.

## 30. Tax Provider Boundary

If an external tax provider is used in future, it is an integration dependency,
not unrestricted transaction authority.

AV Silks must still validate:

- request context;
- response currency;
- response identity;
- amount mapping;
- timeout/failure behavior.

Provider credentials remain server-side.

## 31. Discount Calculation Order

Promotion application order must follow the trusted stacking policy from the
Eligibility/Stacking architecture.

The browser's submission order must never decide final discount amounts.

## 32. Deterministic Calculation

Given the same trusted:

- catalog price snapshot;
- cart quantities;
- promotion versions;
- eligibility;
- usage state;
- stacking policy;
- currency;
- timestamp/policy state;

the pricing engine should produce the same commercial result.

Nondeterministic pricing is unacceptable.

## 33. Allocation Invariant

Allocated discount components must reconcile to the trusted total discount.

Future implementation must prevent rounding/allocation drift where:

`Sum(Line Discount Allocations) != Trusted Discount Total`

Any remainder policy must be deterministic.

## 34. Stable Allocation Tie-Breaker

Where a proportional allocation leaves remainder minor units, a stable
deterministic tie-break rule is required.

Possible stable inputs may include canonical line/order identifiers.

Iteration order from an unordered collection must not determine money.

## 35. Maximum Payable Safety

Final payable amount must equal the trusted calculation result after all approved
stages.

The client cannot submit a lower amount and ask the payment gateway to accept it.

## 36. Zero-Payable Order Boundary

A legitimate future combination of promotions/credits may theoretically reduce
gateway payable amount to zero.

Such an order requires an explicitly designed zero-payment finalization path.

Do not fabricate a successful payment event merely because the payable amount is
zero.

## 37. Stored Value Is Not Ordinary Discount

Gift cards/store credit representing stored financial value must be treated as a
separate value/ledger mechanism.

They must not be collapsed into ordinary coupon math merely to simplify checkout.

## 38. Loyalty Redemption Boundary

Loyalty redemption may influence final customer value, but authoritative loyalty
balance mutation belongs to the future Loyalty ledger domain.

Pricing may consume an approved redemption reservation/result; it must not directly
edit balances.

## 39. Loyalty Earn Boundary

Potential loyalty earning should use trusted post-pricing/order policy.

The frontend must not award points based on its displayed subtotal or discount.

Exact earn basis is defined in the Loyalty architecture gate.

## 40. Checkout Revalidation

Before order/payment creation, checkout must revalidate applicable:

- product availability;
- current price;
- promotion lifecycle;
- promotion version;
- eligibility;
- usage/reservation;
- customer identity;
- vendor state;
- shipping/service state;
- tax policy inputs.

A stale cart preview does not create commercial entitlement.

## 41. Checkout Failure Behavior

If authoritative checkout revalidation changes the price/discount, future UX should
return a safe structured result requiring the customer to review the updated
commercial terms where appropriate.

The backend must not silently trust the stale lower frontend total.

## 42. Inventory Boundary

Pricing cannot reserve or override inventory.

Inventory/reservation authority remains with the inventory/order domains.

A valid coupon cannot force unavailable stock to become orderable.

## 43. Payment Amount Binding

Payment creation must bind to the exact trusted server-calculated payable amount
and currency.

The payment gateway amount must not originate from client-submitted totals.

## 44. Razorpay / Payment Provider Boundary

Future Growth architecture does not modify Razorpay or other payment verification.

Existing/future payment security continues to require applicable:

- server-side order/payment creation;
- signature verification;
- amount/currency verification;
- replay protection;
- idempotency;
- webhook authenticity.

Promotion logic cannot bypass these checks.

## 45. Payment Finalization

A successfully evaluated promotion is not evidence of successful payment.

Payment/order finalization must use the trusted payment lifecycle.

Promotion redemption must integrate with that lifecycle using explicit
reservation/commit/release semantics.

## 46. COD Boundary

If Cash on Delivery is supported, promotion application still requires trusted
pricing and order snapshots.

COD does not make frontend pricing authoritative.

COD cancellation/return behavior must participate in promotion/reward
reconciliation.

## 47. Order Commercial Snapshot

A finalized order should preserve sufficient immutable commercial evidence to
explain the charged amount.

Potential snapshot data includes:

- item prices;
- quantities;
- promotion IDs/versions;
- line/order discount allocations;
- funding attribution;
- shipping;
- tax;
- payable total;
- currency.

Historical order meaning must not depend on mutable live promotion configuration.

## 48. Invoice Boundary

Invoices/credit notes must derive from trusted finalized commercial records and
approved accounting/tax policy.

A current promotion document must not rewrite a historical invoice.

Invoice numbering/immutability remains owned by the invoice/accounting domain.

## 49. Cancellation Authority

Order cancellation status is owned by the Order domain.

Promotion logic may respond to an approved cancellation event, but it must not
declare the order cancelled solely to restore a coupon/reward.

## 50. Refund Authority

`Refund authority belongs to the trusted Order/Payment refund workflow.`

Promotion architecture may define financial reconciliation effects, but it cannot
create a payment refund independently.

## 51. Full Refund Reconciliation

A full refund may require explicit reconciliation of:

- promotion redemption;
- vendor/platform funding attribution;
- loyalty earn;
- loyalty redemption;
- referral reward;
- gift/store-credit movements.

Each domain must update through its own authoritative contract.

## 52. Partial Refund Reconciliation

Partial returns/refunds require deterministic line-level commercial allocation.

The system must be able to determine what portion of:

- item discount;
- order-level discount;
- vendor funding;
- platform funding;
- tax;
- shipping;
- loyalty effect;

belongs to the returned/refunded lines.

## 53. Order-Level Discount Proration

Order-level discounts may need to be allocated across eligible lines at purchase
time so later partial refunds remain explainable.

The allocation method must be deterministic and stored/snapshotted.

Recalculating historical allocation from a changed promotion rule is prohibited.

## 54. Refund Cannot Exceed Authority

A promotion adjustment must not make the refund exceed the amount legally and
commercially refundable under the trusted order/payment record.

Client-provided refund math is untrusted.

## 55. Promotion Restoration Policy

Whether a coupon/promotion becomes reusable after cancellation/refund must be an
explicit versioned policy.

Possible outcomes include:

- no restoration;
- full restoration;
- conditional restoration;
- partial restoration where meaningful.

The policy must not be improvised during refund handling.

## 56. Usage Restoration Idempotency

A refund/cancellation retry must not restore promotion usage multiple times.

Restoration/reversal events require stable idempotency.

## 57. Loyalty Reversal Boundary

If future loyalty points were earned from a refunded order, reversal belongs to
the authoritative Loyalty ledger.

Pricing/order events may trigger the process but must not mutate a client counter.

## 58. Referral Reward Reversal Boundary

If a referral reward depends on a qualifying purchase, later cancellation/refund
may invalidate that reward according to the versioned referral policy.

Referral authority remains separate from pricing.

## 59. Gift / Store-Credit Refund Boundary

Refunding an order originally paid partly through stored value requires explicit
tender/refund policy.

The promotion engine must not decide whether funds return to:

- original payment method;
- store credit;
- gift balance;
- mixed destinations.

That belongs to approved payment/accounting policy.

## 60. Vendor Settlement Boundary

Promotion funding affects settlement economics but does not itself execute vendor
payouts.

Vendor settlement must consume trusted order/funding allocation records.

Future settlement architecture remains a separate authority.

## 61. Commission Boundary

Vendor commission calculation must explicitly define interaction with:

- item price;
- discounts;
- vendor-funded discounts;
- platform-funded discounts;
- refunds;
- taxes;
- shipping.

Promotion architecture must not silently invent commission rules.

## 62. Financial Reconciliation

Future commerce operations should reconcile applicable:

- quote;
- order snapshot;
- payment amount;
- refund amount;
- promotion redemption;
- funding attribution;
- loyalty ledger effects;
- settlement records.

Mismatch must become an explicit operational exception.

## 63. Immutable Historical Evidence

Financial/history records must preserve the commercial facts that existed at
transaction time.

A later promotion edit, translation change or vendor change must not rewrite prior
commercial history.

## 64. Audit Boundary

High-impact pricing/promotion configuration changes should eventually record
auditable metadata.

Potential audit actions include:

- discount cap change;
- funding-policy change;
- stacking change;
- tax-integration configuration change;
- refund-restoration policy change;
- emergency promotion disable.

Audit records must not contain provider secrets.

## 65. Error Response Boundary

Customer-facing pricing errors should explain actionable outcomes without exposing:

- provider secrets;
- internal fraud scoring;
- private vendor funding;
- stack traces;
- other customer data.

Internal diagnostics require restricted logging/access.

## 66. Multilingual Money Presentation

Customer-facing commercial explanations may support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Localized labels do not alter canonical currency or amount.

## 67. Kannada Pricing Boundary

Kannada presentation must show the same authoritative commercial result as all
other locales.

A translation difference must never change:

- discount eligibility;
- discount amount;
- tax;
- shipping;
- payable amount;
- refund amount.

## 68. Localization and Rounding

Number/currency formatting is presentation only.

Locale formatting must not be parsed back and treated as authoritative commerce
math.

## 69. Cache Boundary

Pricing quotes/private discount results must not leak through unsafe shared caches.

Cache identity must account for relevant:

- quote/version;
- customer context;
- vendor scope;
- promotion versions;
- currency;
- expiry.

## 70. Stale Cache Protection

Cached promotion banners or price previews cannot override current authoritative
checkout evaluation.

Paused/revoked/expired rules must fail according to current trusted state.

## 71. Security Boundary

Future implementation must defend against:

- client amount tampering;
- currency tampering;
- replayed quotes;
- stale promotion versions;
- duplicate redemption;
- refund replay;
- cross-vendor funding leakage;
- negative-total exploits;
- rounding exploits;
- unauthorized promotion mutation.

`Transaction correctness outranks promotional conversion.`

## 72. Environment Isolation

Development, staging and production require separate approved:

- promotion configuration;
- pricing fixtures/config;
- tax integrations;
- payment credentials;
- loyalty/store-credit test state;
- analytics.

Test pricing/promotion configuration must never silently become production state.

## 73. Required Future Pricing Tests

Implementation must eventually test:

- integer/precise money representation;
- currency mismatch rejection;
- deterministic rounding;
- non-negative floor;
- maximum discount cap;
- item-level discount;
- order-level discount;
- category/vendor allocation;
- mixed-vendor isolation;
- platform funding;
- vendor funding;
- shared funding;
- Government/Handloom program boundary;
- shipping promotion;
- stale quote rejection;
- quote integrity;
- pricing idempotency;
- deterministic stacking order;
- allocation reconciliation;
- allocation remainder handling;
- zero-payable path;
- stored-value separation;
- loyalty redemption boundary;
- checkout revalidation;
- inventory rejection;
- payment amount binding;
- COD compatibility;
- immutable order snapshot.

## 74. Required Future Refund / Tax Tests

Implementation must eventually test:

- tax-policy boundary;
- tax-base contract;
- tax rounding;
- external tax-provider failure;
- full refund;
- partial refund;
- order-level discount proration;
- refund replay/idempotency;
- promotion restoration policy;
- loyalty reversal boundary;
- referral reversal boundary;
- gift/store-credit refund boundary;
- vendor settlement boundary;
- financial reconciliation;
- historical immutability;
- audit;
- environment isolation.

## 75. Required Future Locale Tests

Commercial presentation must eventually be tested in:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

All locales must resolve to the same trusted underlying money values.

## 76. Activation Boundary

This architecture document does NOT:

- change current product prices;
- activate a discount;
- modify checkout;
- modify tax configuration;
- create payment orders;
- alter Razorpay;
- create refunds;
- change COD;
- create invoices;
- mutate loyalty balances;
- create store credit;
- alter vendor settlement;
- deploy Firebase;
- deploy any cloud service.

Implementation requires a separately approved implementation branch, automated
tests, staging validation, security review, explicit production approval and
rollback readiness.
