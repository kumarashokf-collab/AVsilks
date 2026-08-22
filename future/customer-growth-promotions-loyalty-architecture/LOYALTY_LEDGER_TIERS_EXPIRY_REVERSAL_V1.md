# AV Silks Future Loyalty Ledger, Tiers, Expiry & Reversal Architecture v1

Status: FUTURE-ONLY / ARCHITECTURE / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define the future AV Silks Loyalty domain for earning, reserving, redeeming,
expiring and reversing loyalty value safely.

`Loyalty Balance = Derived Result of an Authoritative Ledger`

A mutable customer-side points counter must never become loyalty authority.

## 2. Loyalty Domain Authority

The future Loyalty domain may own:

- loyalty account identity;
- ledger entries;
- earn rules;
- redemption rules;
- expiry policy;
- reversal policy;
- tier state;
- tier qualification evidence;
- loyalty audit references.

It does not own payment, order, pricing, tax or inventory truth.

## 3. Canonical Loyalty Account

Each eligible customer should have a stable canonical loyalty-account identity.

The loyalty account must reference the trusted customer identity rather than
duplicate authentication truth.

One customer must not gain access to another customer's loyalty account.

## 4. Ledger Principle

Financially meaningful loyalty changes require an append-oriented ledger or
equivalent immutable event history.

Do not treat:

`customer.points = customer.points + 100`

as sufficient authoritative history.

Each balance change must remain explainable.

## 5. Derived Balance

Available loyalty balance should be derived or safely maintained from authoritative
ledger state.

If a cached/materialized balance differs from the ledger, reconciliation must
prefer authoritative ledger evidence.

## 6. Ledger Entry Identity

Each loyalty ledger entry requires a stable unique identity.

A future entry may reference:

- loyalty account;
- entry ID;
- event/business reference;
- points/value amount;
- direction/type;
- state;
- rule/version;
- timestamp;
- expiry reference;
- correlation/idempotency reference.

## 7. Ledger Entry Types

Possible architectural entry concepts include:

- EARN;
- REDEEM;
- EXPIRE;
- REVERSAL;
- ADJUSTMENT;
- RESERVATION;
- RELEASE.

Exact implementation may use separate records/events, but commercial history must
remain explicit.

## 8. Points Representation

Loyalty points should use an integer or another approved exact representation.

Authoritative floating-point point balances are prohibited.

Points and currency are separate concepts unless a reviewed conversion rule
explicitly maps them.

## 9. Loyalty Is Not Payment Currency by Default

Loyalty points are not automatically legal tender, cash or stored-value funds.

Any future monetary redemption equivalent requires:

- explicit conversion rule;
- accounting review;
- tax review where applicable;
- expiry/reversal policy;
- fraud controls.

Architecture alone does not create a financial liability.

## 10. Earn Rule Versioning

Loyalty earning rules must be versioned.

Historical awarded points must remain explainable after earn percentages,
thresholds or promotional bonuses change.

An old order must not be recalculated using today's earn rule.

## 11. Trusted Earn Event

Points should be earned only from an explicitly trusted qualifying event.

Examples may include an approved:

- paid/finalized order;
- qualifying delivered order;
- reviewed campaign reward;
- approved referral reward.

Frontend activity alone must not create authoritative loyalty value.

## 12. Earn Basis Authority

Earn calculations must consume trusted server-side commercial values.

The frontend cannot choose:

- eligible subtotal;
- eligible products;
- earn rate;
- promotion interaction;
- award amount.

## 13. Pending vs Available Points

Future loyalty may distinguish:

`PENDING -> AVAILABLE`

to account for delivery, cancellation, return or fraud-review windows.

Exact transition policy must be versioned and server controlled.

## 14. Pending Points Boundary

Pending points must not be redeemable unless the approved policy explicitly allows
it.

A frontend display must not promote pending value to available balance.

## 15. Earn Idempotency

Retrying the same trusted qualifying business event must not award points twice.

A stable business event/order reference must support idempotent loyalty posting.

Duplicate webhooks or retries must not duplicate value.

## 16. Earn Concurrency

Concurrent consumers must not create multiple rewards for the same authoritative
business event.

Uniqueness/idempotency must be enforced in the trusted backend/ledger layer.

## 17. Redemption Authority

`Loyalty redemption is authorized by the trusted Loyalty domain.`

The client may request redemption but cannot declare:

- current balance;
- redeemable amount;
- conversion value;
- success.

## 18. Redemption Validation

Before redemption, future implementation must validate applicable:

- authenticated customer;
- loyalty account ownership;
- available balance;
- rule/version;
- minimum/maximum redemption;
- expiry;
- checkout context;
- promotion compatibility;
- currency/value mapping where applicable.

## 19. Redemption Reservation

Checkout may require loyalty value to be reserved before payment/order
finalization.

A conceptual lifecycle may include:

`AVAILABLE -> RESERVED -> REDEEMED`

with failure paths to:

`RELEASED` or equivalent restoration.

## 20. Reservation Idempotency

Retrying the same checkout must not reserve loyalty value multiple times.

Reservation identity must bind to a trusted checkout/business reference.

## 21. Reservation Concurrency

Two concurrent checkouts must not both spend the same available loyalty value.

Future implementation requires atomic or transactionally equivalent balance
protection.

Frontend balance checks cannot solve this race.

## 22. Reservation Expiry

Abandoned loyalty reservations require deterministic expiry/release.

Future policy must define:

- server timestamp;
- reservation TTL;
- safe release;
- retry behavior;
- late payment behavior.

## 23. Redemption Commit Boundary

Reserved value becomes redeemed only at the explicitly approved commercial
milestone.

UI confirmation is not a trusted redemption event.

The milestone must integrate with trusted order/payment finalization.

## 24. Failed Payment Release

If payment fails or checkout expires, loyalty reservations require deterministic
release according to policy.

Payment retry must not duplicate redemption or release.

## 25. COD Compatibility

Cash on Delivery requires a separately defined loyalty lifecycle.

Possible policies may delay earning or redemption commitment until an approved
order milestone.

COD presentation never makes loyalty state authoritative.

## 26. Expiry Policy

Loyalty expiry must be explicit and versioned.

Future policy should define:

- whether points expire;
- expiry duration/date;
- timezone/server-time semantics;
- which entries expire first;
- customer notification boundary;
- grace policy if any.

## 27. Expiry Authority

Server time is authoritative for point expiry.

Client clocks cannot extend or shorten commercial value.

## 28. Expiry Ledger Evidence

Expiry must create explicit ledger/equivalent evidence.

Do not silently reduce a cached balance without historical explanation.

## 29. Redemption Ordering

If multiple earned lots have different expiries, the consumption strategy must be
deterministic.

Possible architecture examples include oldest-expiring-first or another reviewed
policy.

The rule must be testable and versioned.

## 30. Partial Redemption

Partial redemption must preserve exact remaining value and ledger traceability.

Rounding or conversion policies must not lose unexplained points.

## 31. Reversal Principle

`Reversal creates compensating ledger evidence; history is not silently rewritten.`

A previously posted ledger entry should remain auditable.

## 32. Order Cancellation Reversal

If earned points came from a cancelled order, future policy must define whether
they are:

- cancelled while pending;
- reversed if already available;
- partially reversed where appropriate.

The Order domain remains cancellation authority.

## 33. Full Refund Reversal

A full refund may require reversal of loyalty earned from the refunded purchase.

If loyalty was redeemed on that order, refund/restoration policy must separately
define what value returns to the loyalty account.

## 34. Partial Refund Reversal

Partial refunds require deterministic allocation of earned/redeemed loyalty impact
to affected lines or commercial allocation.

Historical order snapshots must provide sufficient evidence.

## 35. Reversal Idempotency

Retrying the same cancellation/refund event must not reverse points multiple times.

A stable trusted reversal reference is mandatory.

## 36. Negative Balance Boundary

Refund/reversal scenarios may discover that a customer already spent points that
should later be reversed.

Future policy must explicitly define whether the account may:

- become temporarily negative;
- create recoverable debt;
- clamp and record an exception;
- use another approved treatment.

The system must not silently discard the discrepancy.

## 37. Manual Adjustment Boundary

Manual loyalty adjustments require strong authorization.

Potential approved reasons may include:

- customer-support correction;
- migration correction;
- incident remediation.

Every manual adjustment must be auditable and reason-coded.

## 38. Manual Adjustment RBAC

Only explicitly authorized trusted roles may create adjustments.

A customer, vendor or ordinary frontend client must not self-adjust loyalty
balances.

High-risk adjustments may require stronger approval in future implementation.

## 39. Tier Architecture

Future Loyalty may define customer tiers such as conceptual:

- base;
- silver;
- gold;
- premium.

Exact names/benefits are not approved by this document.

Tier identity should remain canonical and localized presentation separate.

## 40. Tier Qualification

Tier qualification must use trusted data and a versioned qualification policy.

Potential inputs may include approved:

- qualifying spend;
- qualifying orders;
- earned activity;
- period/window.

Frontend claims cannot change tier.

## 41. Tier Window

Future tier qualification must explicitly define its measurement window.

Examples may include:

- rolling period;
- calendar period;
- lifetime;
- program year.

The exact policy must use trusted server timestamps.

## 42. Tier Upgrade

Tier upgrades must occur from trusted qualifying evidence.

A promotion banner or client request cannot directly elevate tier state.

## 43. Tier Downgrade

Future policy must define:

- downgrade rules;
- grace period;
- renewal date;
- protected benefits during transition;
- communication boundary.

Tier downgrade must be deterministic and auditable.

## 44. Tier Benefits Boundary

Tier benefits may influence future:

- earn multipliers;
- promotion eligibility;
- shipping benefits;
- campaign access.

A tier benefit must still pass relevant trusted pricing/eligibility authority.

Tier status cannot bypass payment, inventory or authorization.

## 45. Tier Versioning

Tier rules/benefits require explicit versioning.

Historical transactions should remain explainable under the tier policy active at
the time.

## 46. Promotion Interaction

Promotion rules may reference trusted loyalty tier or redemption outcomes.

Promotion code must not directly mutate the loyalty ledger.

Conceptually:

`Promotion Eligibility <- Trusted Loyalty/Tier Result`

not:

`Promotion -> Directly Changes Loyalty Balance`

## 47. Earn After Discounts

Future earn basis must explicitly define whether points are earned on:

- list price;
- discounted subtotal;
- vendor-funded discount basis;
- platform-funded discount basis;
- tax;
- shipping.

The Loyalty domain must not guess this basis.

## 48. Redemption + Promotion Stacking

Future checkout must define deterministic interaction between:

- coupon discounts;
- automatic promotions;
- loyalty redemption;
- stored value.

Loyalty redemption must not be treated as an uncontrolled extra discount.

## 49. Stored Value Separation

Gift cards/store credit representing monetary liability remain separate from
ordinary loyalty points unless a specifically approved financial model combines
them.

Separate ledgers may be required.

## 50. Vendor Funding Boundary

Future vendor-funded loyalty rewards require explicit vendor ownership and funding
limits.

A vendor must not issue points at another vendor's expense.

Vendor-funded reward liability requires reconciliation.

## 51. Platform Funding Boundary

Platform-funded loyalty programs require separate attribution from vendor-funded
rewards.

Funding attribution must be preserved in authoritative reward evidence.

## 52. Mixed-Vendor Orders

A mixed-vendor order must preserve which lines/funding sources contributed to any
loyalty earning.

Future refund/reversal logic must not charge one vendor for another vendor's reward
effect.

## 53. Government / Handloom Programs

Future Government/Handloom programs may grant approved loyalty/reward incentives
through explicit program references.

A handloom label, artisan name or QR code alone cannot create a loyalty award.

Program eligibility remains separately authoritative.

## 54. Provenance Boundary

Loyalty may consume an approved provenance/program eligibility result where
explicitly designed.

Loyalty must never create or alter provenance truth.

Private artisan/KYC evidence must not be copied into loyalty records.

## 55. Customer Privacy

Loyalty records should use minimized internal references.

Avoid duplicating customer:

- names;
- phone numbers;
- emails;
- addresses;
- payment details.

Access to loyalty history is customer-private unless explicitly authorized.

## 56. Customer Isolation

One customer must never read, reserve, redeem, reverse or modify another
customer's loyalty value.

Authorization is server-side.

## 57. Vendor Analytics Boundary

Vendors may eventually receive privacy-safe aggregate analytics for vendor-funded
programs.

Vendor analytics must not expose individual customer loyalty ledgers unless a
separately lawful/approved use case exists.

## 58. Multilingual Presentation

Loyalty and tier presentation may support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Canonical ledger entries, tier identities and commercial values remain
language-neutral.

## 59. Kannada Boundary

Kannada localization affects presentation only.

Kannada content must not create a different:

- point balance;
- expiry;
- tier;
- earn rule;
- redemption amount;
- reversal result.

## 60. Notification Boundary

Future loyalty notifications may communicate approved:

- points earned;
- expiry warnings;
- tier changes;
- redemption events.

Notification systems are derived consumers and cannot change ledger authority.

Marketing/consent requirements require separate review.

## 61. Event Architecture

A future Loyalty domain may publish events such as conceptual:

- LoyaltyEarned;
- LoyaltyAvailable;
- LoyaltyReserved;
- LoyaltyRedeemed;
- LoyaltyReleased;
- LoyaltyExpired;
- LoyaltyReversed;
- TierChanged.

Consumers must be idempotent.

## 62. Event Idempotency

Duplicate delivery of loyalty events must not duplicate ledger mutations or
derived analytics.

Stable event IDs/version references are required.

## 63. Out-of-Order Protection

Older events must not overwrite newer loyalty/tier state incorrectly.

Derived consumers need version/order safeguards.

## 64. Reconciliation

Future reconciliation should compare applicable:

- ledger-derived balance;
- materialized balance;
- reservations;
- order reward references;
- refund/reversal references;
- tier state;
- funding attribution.

Mismatch must become an explicit operational exception.

## 65. Ledger Rebuild

Materialized loyalty state should be rebuildable from authoritative approved
ledger/history where feasible.

Rebuild must preserve:

- customer ownership;
- entry ordering;
- expiry;
- reversals;
- reservations;
- tier evidence;
- privacy.

## 66. Audit Model

High-impact loyalty actions should eventually be auditable, including:

- earn-rule changes;
- redemption-rule changes;
- expiry-policy changes;
- tier-policy changes;
- manual adjustments;
- emergency freezes;
- migrations.

Audit must not store secrets.

## 67. Fraud / Abuse Boundary

Future Loyalty security must consider:

- duplicate earning;
- fake-order reward farming;
- refund/reward exploitation;
- multi-account abuse;
- redemption replay;
- reservation races;
- tier manipulation;
- unauthorized adjustments;
- bot-driven campaign abuse.

Growth value never outranks security and ledger correctness.

## 68. Loyalty Account Freeze

Future incident/fraud controls may require a controlled account/program freeze.

A freeze must be:

- authorized;
- auditable;
- reversible under approved policy;
- non-destructive to ledger history.

## 69. Rate Limits

Sensitive loyalty endpoints may require rate limiting, especially:

- balance/history access;
- redemption attempts;
- reservation attempts;
- promo-linked reward claims.

Rate limiting complements, but does not replace, authorization.

## 70. Error Privacy

Customer-facing loyalty errors must not expose:

- another customer's balance;
- fraud signals;
- vendor-private funding;
- internal ledger IDs unnecessarily;
- provider secrets;
- stack traces.

## 71. Environment Isolation

Development, staging and production require separate:

- loyalty accounts;
- ledger data;
- tier configuration;
- campaign rewards;
- provider integrations;
- analytics.

Test points must never become production value.

## 72. Migration Boundary

Any future loyalty migration must preserve:

- customer mapping;
- opening balance evidence;
- source provenance;
- idempotency;
- reconciliation;
- audit;
- rollback plan.

Do not import unexplained aggregate balances without migration evidence.

## 73. Required Future Ledger Tests

Implementation must eventually test:

- canonical loyalty account;
- ledger append semantics;
- derived balance;
- exact integer point representation;
- duplicate earn idempotency;
- concurrent earn protection;
- pending-to-available transition;
- redemption ownership;
- insufficient balance rejection;
- reservation idempotency;
- concurrent spend protection;
- reservation expiry;
- failed-payment release;
- COD policy;
- expiry;
- expiry ordering;
- partial redemption;
- reversal evidence;
- full refund reversal;
- partial refund reversal;
- reversal idempotency;
- negative-balance policy;
- manual-adjustment RBAC.

## 74. Required Future Tier Tests

Implementation must eventually test:

- tier qualification;
- server-time window;
- upgrade;
- downgrade;
- grace behavior;
- tier versioning;
- tier-benefit authorization;
- promotion interaction;
- mixed-vendor reward attribution;
- Government/Handloom program boundary;
- provenance non-authority.

## 75. Required Future Security / Locale Tests

Future implementation must test:

- customer isolation;
- vendor funding isolation;
- unauthorized adjustment rejection;
- replay resistance;
- rate limits;
- privacy-safe errors;
- reconciliation;
- rebuild;
- environment isolation;
- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

All locales must resolve to the same authoritative loyalty state.

## 76. Activation Boundary

This architecture document does NOT:

- create loyalty accounts;
- award points;
- redeem points;
- expire points;
- reverse points;
- create customer tiers;
- modify checkout;
- modify orders;
- modify payments;
- modify refunds;
- create financial liabilities;
- modify vendor settlements;
- send notifications;
- modify Firebase;
- deploy anything.

Implementation requires a separately approved implementation branch, automated
tests, staging validation, security review, explicit production approval and
rollback readiness.
