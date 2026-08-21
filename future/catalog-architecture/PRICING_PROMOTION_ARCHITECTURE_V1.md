# AV Silks Pricing & Promotion Architecture v1

Status: FUTURE ONLY

## Money model

Future authoritative money values use integer paise in INR.
Floating-point client totals must never become checkout authority.

## Pricing hierarchy

Conceptual price sources are product base price, product sale price,
variant price override, variant sale-price override, and an eligible
promotion adjustment.

Effective sell price precedence is:

1. eligible variant sale price
2. eligible variant regular price
3. eligible product sale price
4. product base price

A variant override changes the effective product price only for that
sellable stock unit.

## Server authority

The backend must eventually recalculate price from authoritative catalog
data during cart/checkout/order/payment flows.

The client may display estimates but must not control:

- unit price
- sale price
- discount amount
- tax
- shipping
- order total
- payment gateway amount

## Promotion model

Future promotions require server-side eligibility validation.

Eligibility may later consider approved fields such as product type,
category, time window, customer-independent campaign rules, minimum
basket conditions, or explicit coupon rules.

Default promotion stacking is disabled until a later explicit policy
defines safe combinations.

Promotion application must be deterministic and idempotent.

A promotion must never produce a negative final price.

## Sale-price rules

Sale prices and overrides must be validated against the applicable
regular price.

Expired or ineligible sale/promotion data must fail closed.

## Tax boundary

Tax calculation is a separate future policy.

Pricing architecture must not silently embed tax assumptions into
product price fields.

## Shipping boundary

Shipping is a separate authoritative policy.

Free-shipping thresholds or delivery charges are applied after trusted
pricing calculations and before the final payable total is locked.

## Payment boundary

Razorpay or any future gateway receives only a server-derived final
amount.

Gateway amount must never be accepted directly from the browser.

## Variant compatibility

`single-sku` products use product pricing.

`variant-sku` products may use approved variant overrides while keeping
server authority.

## Inventory separation

Pricing changes do not change inventory authority.

Discounts and promotions must never mutate stock or reservation rules.

## Safety boundary

This architecture changes no backend, frontend runtime, Firestore,
Firebase configuration, payment runtime, or deployment.

Blaze remains P0.
