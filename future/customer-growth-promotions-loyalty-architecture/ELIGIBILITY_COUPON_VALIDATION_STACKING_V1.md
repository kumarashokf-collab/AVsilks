# AV Silks Future Eligibility, Coupon Validation & Stacking Architecture v1

Status: FUTURE-ONLY / ARCHITECTURE / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define how future AV Silks promotions determine eligibility, validate coupon codes,
enforce usage policies and combine multiple eligible promotions safely.

`Eligibility Determines Applicability; Trusted Pricing Determines Money.`

## 2. Eligibility Engine Boundary

The future Eligibility engine evaluates whether a canonical promotion version is
applicable to a trusted commerce context.

It does not independently own:

- product truth;
- vendor truth;
- customer authentication;
- inventory;
- final pricing;
- taxes;
- shipping;
- payment;
- order finalization.

## 3. Trusted Evaluation Context

Eligibility should operate on a server-created context derived from authoritative
domains.

Potential trusted inputs include:

- authenticated customer reference;
- anonymous-session reference where explicitly supported;
- canonical product IDs;
- canonical category IDs;
- canonical vendor IDs;
- quantities;
- trusted subtotal/input amounts;
- service-region concept;
- server timestamp;
- promotion version;
- customer tier reference where approved.

The client may request evaluation but must not declare trusted eligibility facts.

## 4. Client Input Boundary

All client-submitted promotion data is untrusted.

Examples include:

- coupon text;
- cart display amounts;
- claimed customer tier;
- claimed first-order status;
- claimed vendor eligibility;
- claimed geographic eligibility.

Trusted backend domains must resolve authoritative values.

## 5. Eligibility Policy Versioning

Eligibility rules should be versioned or bound to an immutable Promotion version.

Historical commercial decisions must remain explainable after future rules change.

An order must not depend on today's eligibility rule to explain yesterday's
discount.

## 6. Server-Time Eligibility

Validity windows use trusted server time.

Client clocks cannot:

- start a campaign early;
- extend an expired promotion;
- bypass scheduled activation;
- alter daily usage windows.

## 7. Product Eligibility

Product constraints must use canonical product identity.

Future rules may permit:

- include product IDs;
- exclude product IDs;
- product attribute policy where approved.

A hidden, deleted or otherwise ineligible product must not become purchasable
because a promotion references it.

## 8. Category Eligibility

Category constraints must reference canonical category identity.

Category eligibility is not permission to change catalog truth.

Archived/private categories must fail safely according to authoritative catalog
state.

## 9. Vendor Eligibility

Vendor-scoped promotions require canonical vendor identity and current vendor
eligibility.

Vendor suspension, removal or ownership change must be considered before a new
authoritative promotion application.

A vendor promotion cannot apply to another vendor without explicit platform-level
authority.

## 10. Customer Eligibility

Customer-specific rules require trusted customer identity.

Potential approved rules may include:

- first completed order;
- approved customer tier;
- explicitly granted offer;
- usage history;
- approved campaign membership.

The frontend must not self-assert these facts.

## 11. Anonymous Customer Boundary

Anonymous eligibility, if supported, requires a separately designed server/session
policy.

Anonymous browser state must not provide the same assurance as an authenticated
customer identity.

Per-customer limits cannot rely only on mutable browser storage.

## 12. First-Order Boundary

"First order" must be defined from authoritative order history.

Future policy must specify which states count, for example whether failed,
cancelled or refunded orders affect eligibility.

The frontend cannot determine first-order truth.

## 13. Customer Tier Boundary

Future loyalty/customer tiers may be referenced by Eligibility only through a
trusted tier result or canonical tier state.

Eligibility must not directly edit tier membership.

## 14. Geographic / Service Eligibility

Location-based eligibility must use an approved service-region representation.

Do not use promotion logic to infer sensitive location beyond what commerce
requires.

A customer-provided postal/address field remains untrusted until normal backend
validation.

## 15. Minimum-Spend Boundary

Minimum-spend checks require a trusted commerce amount.

Frontend subtotal is advisory only.

The exact subtotal basis must be defined explicitly, such as whether it includes:

- item subtotal;
- prior eligible discounts;
- shipping;
- taxes.

Final monetary calculation belongs to the trusted pricing pipeline.

## 16. Quantity Eligibility

Quantity-based promotions require validated cart quantities and applicable product
scope.

Quantity rules must respect existing cart/inventory quantity limits.

Promotion rules cannot authorize unavailable inventory.

## 17. Eligibility Result Model

A future evaluation may return a structured result conceptually containing:

- eligible / ineligible;
- promotion ID;
- promotion version;
- reason code safe for its audience;
- validated scope;
- stacking classification;
- usage-policy reference.

Internal decision detail must not automatically become public API output.

## 18. Eligibility Reason Privacy

Reason codes can leak private targeting or account state.

Public responses should not reveal unnecessary information such as:

- another customer's eligibility;
- hidden campaign membership;
- internal fraud flags;
- vendor-private funding rules.

Internal audit/debug detail requires stronger access control.

## 19. Coupon Input Normalization

Coupon validation requires a documented canonical input policy.

Possible safe steps include:

- Unicode validation;
- bounded length;
- trimming approved outer whitespace;
- explicit case policy;
- character allowlist where appropriate.

Normalization must be deterministic and locale-independent.

## 20. Coupon Canonicalization Boundary

Do not apply uncontrolled locale-specific case folding or transliteration to coupon
identity.

If codes are intentionally case-insensitive, that rule must be canonical and
server-side.

Coupon display formatting must not alter commercial identity.

## 21. Coupon Lookup

A submitted code must resolve through a trusted server-side lookup to:

- canonical promotion ID;
- promotion version/lifecycle;
- code state;
- scope;
- usage policy.

A client-supplied promotion ID does not bypass code validation.

## 22. Coupon Lifecycle

Future coupon records may require lifecycle states such as:

`ACTIVE -> DISABLED -> EXPIRED`

Single-use or allocated codes may also need controlled consumed/reserved states.

Exact persistence and state machine belong to implementation review.

## 23. Public vs Private Codes

Future architecture may distinguish:

- public campaign codes;
- customer/private allocated codes;
- partner/referral codes.

Private code existence must not be disclosed to unauthorized users.

## 24. Enumeration Resistance

Coupon validation endpoints must resist brute-force and enumeration.

Controls may include:

- bounded input;
- rate limiting;
- generic public failure responses;
- anomaly detection;
- account/network risk signals;
- lockout/backoff where appropriate.

Detailed internal reason codes must not make enumeration easier.

## 25. Invalid Coupon Response Boundary

Public failure responses should not unnecessarily reveal whether a guessed code:

- exists but belongs to another customer;
- exists but is private;
- maps to a hidden vendor campaign;
- is blocked by fraud controls.

User experience can remain helpful without exposing private internals.

## 26. Usage Policy

Future promotion usage policies may define:

- total/global usage limit;
- per-customer limit;
- per-order limit;
- per-code limit;
- per-vendor funding limit;
- campaign budget reference.

All such limits require trusted server enforcement.

## 27. Global Usage Limit

A global usage cap cannot be enforced safely with frontend counters.

Concurrent applications require transactional/atomic or equivalently safe
server-side coordination.

## 28. Per-Customer Usage Limit

Per-customer enforcement requires trusted customer identity and authoritative
redemption evidence.

Clearing cookies or changing devices must not reset an authenticated customer's
commercial usage history.

## 29. Single-Use Coupon

Single-use coupons require concurrency-safe consumption.

Two simultaneous requests must not both successfully consume the same one-time
commercial entitlement.

## 30. Reservation / Commit / Release Boundary

Limited-use promotions may require a reservation lifecycle before final order
completion.

A possible conceptual model is:

`AVAILABLE -> RESERVED -> COMMITTED`

with controlled paths to:

`RELEASED` or `EXPIRED`

Exact transaction semantics must integrate with checkout/payment design.

## 31. Reservation Expiry

A promotion reservation must not remain permanently locked after an abandoned
checkout.

Future implementation must define:

- expiry duration;
- server timestamp;
- safe release;
- retry/idempotency behavior.

## 32. Idempotent Reservation

Retrying the same trusted checkout operation must not create multiple independent
promotion reservations.

A stable checkout/business idempotency key or equivalent trusted reference is
required.

## 33. Redemption Commit Boundary

Final redemption/consumption should occur only at the explicitly designed
commercial milestone.

The architecture must distinguish:

- attempted application;
- reserved entitlement;
- committed redemption.

UI success text is not a commit event.

## 34. Failed Payment Release

If a reservation is linked to payment, failed/abandoned payment requires
deterministic release or expiry behavior.

Payment retries must not create duplicate commercial consumption.

## 35. Cancellation / Refund Compatibility

Usage eligibility after cancellation/refund requires an explicit policy.

A promotion may be:

- permanently consumed;
- restored;
- partially restored;
- restored only under specific states.

This policy must be versioned and auditable.

## 36. Stacking Authority

`Promotion stacking is determined by trusted server-side policy.`

The order in which a browser submits coupon codes is not commercial authority.

## 37. Stacking Classification

Future promotion versions may define classifications such as:

- exclusive;
- combinable;
- category-limited;
- vendor-limited;
- loyalty-compatible;
- non-stackable with stored value where required.

Exact classifications are implementation-independent architecture concepts.

## 38. Exclusive Promotion Rule

An exclusive promotion must define deterministic interaction with other eligible
promotions.

The system must not accidentally apply another promotion because of request order.

## 39. Maximum Stack Count

Future policy may impose a maximum number of promotions per order/item.

The limit is server controlled.

Clients must not bypass it by sending multiple evaluation requests.

## 40. Deterministic Stacking Order

Stacking evaluation requires a deterministic order.

Potential architecture inputs may include:

- explicit priority;
- promotion class;
- scope specificity;
- canonical promotion ID as stable tie-breaker.

A stable tie-breaker is required when otherwise equivalent rules collide.

## 41. Best-Discount Boundary

A future "best eligible discount" mode must use deterministic trusted pricing
evaluation.

The browser must not select a cheaper payable amount and submit it as authority.

## 42. Same-Scope Collision

When two promotions target the same product/category/vendor/order scope, the
stacking policy must explicitly resolve whether they:

- combine;
- conflict;
- choose one;
- apply in priority order.

Ambiguous collision must not create nondeterministic pricing.

## 43. Item-Level vs Order-Level Interaction

Future architecture must define interaction between:

- item-level promotions;
- category/vendor promotions;
- order-level promotions.

The calculation basis at each stage must be explicit and testable.

Detailed monetary math is finalized in the next pricing architecture gate.

## 44. Loyalty Interaction

Future loyalty earn/redeem behavior must have an explicit stacking contract with
promotions.

Promotion stacking must not directly mutate loyalty balances.

Loyalty authority remains separate.

## 45. Gift / Stored-Value Interaction

Stored value must not be treated casually as another discount in the stacking
engine.

Future checkout must explicitly decide whether gift/store-credit application occurs
before or after discount/tax stages according to legal/accounting requirements.

## 46. Vendor Promotion Isolation

Vendor-funded promotion rules must remain inside authorized vendor scope.

Cross-vendor carts require deterministic isolation of vendor-specific discount
effects.

One vendor must not consume another vendor's funding allocation.

## 47. Platform Promotion Authority

Only an appropriately authorized platform role may create or activate a
platform-wide promotion.

A vendor role cannot elevate a vendor promotion into global platform scope.

## 48. Mixed Vendor Cart Boundary

For a cart containing multiple vendors, future evaluation must preserve:

- vendor ownership;
- eligible line-item scope;
- funding attribution;
- separate vendor caps;
- deterministic order-level behavior.

Cross-vendor discount leakage is forbidden.

## 49. Government / Handloom Program Eligibility

A future government/handloom promotional program may reference approved:

- artisan/cooperative program membership;
- product/provenance public classification;
- program window;
- funding reference.

Search text, labels or marketing claims cannot create program eligibility.

## 50. Provenance Authority Boundary

Promotion Eligibility may consume an approved public/trusted provenance result
where explicitly required.

It must not create or alter provenance truth.

A missing/private/invalid provenance result must fail according to the promotion
policy, not be fabricated.

## 51. Multilingual Presentation

Eligibility reason presentation may support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Canonical eligibility reason codes remain language-neutral.

## 52. Kannada Boundary

Kannada localization changes customer-facing explanation only.

Kannada text must not produce different commercial eligibility or stacking rules
from equivalent canonical policy.

## 53. Policy Evaluation Determinism

Given the same trusted:

- promotion versions;
- evaluation context;
- server-time point;
- usage/reservation state;

the engine should produce the same eligibility/stacking decision.

Hidden nondeterminism is unacceptable for commerce.

## 54. Rule Precedence

Future rule precedence must be explicit.

Examples may include:

1. security/authorization;
2. lifecycle/time;
3. vendor/product/customer scope;
4. usage limits;
5. eligibility;
6. stacking policy.

Implementation may refine this order, but precedence must remain deterministic and
testable.

## 55. Fail-Closed Conditions

Future eligibility should fail closed when trusted required data is:

- missing;
- malformed;
- stale beyond an approved boundary;
- unauthorized;
- cross-tenant;
- internally inconsistent.

Growth conversion does not justify guessing commercial eligibility.

## 56. Cache Boundary

Eligibility results that depend on private customer state, usage limits or
server-time must not be served from unsafe shared caches.

Cache keys and TTLs must preserve:

- customer isolation;
- vendor isolation;
- promotion version;
- relevant eligibility context.

## 57. Stale Cache Protection

Cached public promotion metadata must not override live authoritative eligibility.

A paused/revoked promotion must not remain applicable because a presentation cache
is stale.

## 58. Audit Boundary

High-impact eligibility/stacking configuration changes should be auditable.

Potential audit events include:

- usage-limit change;
- eligibility-policy change;
- stacking-policy change;
- exclusivity change;
- vendor-scope change;
- emergency disable.

Audit must not store secrets or unnecessary customer PII.

## 59. Abuse / Fraud Boundary

Future implementation must address:

- coupon brute force;
- code sharing where prohibited;
- multi-account abuse;
- concurrent single-use redemption;
- usage-cap races;
- stacking manipulation;
- request replay;
- vendor funding abuse;
- automated validation attacks.

Security controls outrank promotional convenience.

## 60. Analytics Boundary

Eligibility attempts and coupon failures may produce privacy-safe aggregate
analytics.

Analytics must not become eligibility authority.

Sensitive/private coupon validation data must not be exported casually.

## 61. Environment Isolation

Development, staging and production require isolated:

- promotion configurations;
- coupon datasets;
- usage/reservation state;
- provider integrations;
- analytics.

Test codes must not become valid production entitlements accidentally.

## 62. Required Future Tests

Implementation must eventually test:

- trusted context construction;
- client-claimed eligibility rejection;
- server-time validity;
- product/category/vendor scope;
- customer eligibility;
- anonymous limits;
- first-order authority;
- tier authority;
- minimum-spend trusted input;
- coupon normalization;
- code lifecycle;
- private-code non-disclosure;
- brute-force/rate-limit behavior;
- global usage cap;
- per-customer cap;
- single-use concurrency;
- reservation idempotency;
- reservation expiry;
- failed-payment release;
- refund/cancellation policy;
- exclusive stacking;
- maximum stack count;
- deterministic priority;
- same-scope collision;
- item/order interaction;
- vendor isolation;
- mixed-vendor cart;
- Government Handloom compatibility;
- provenance authority boundary;
- cache isolation;
- stale-cache revocation;
- audit;
- English presentation;
- Telugu presentation;
- Hindi presentation;
- Tamil presentation;
- Kannada presentation.

## 63. Activation Boundary

This architecture document does NOT:

- create coupon codes;
- validate live customer coupons;
- reserve promotion usage;
- redeem promotions;
- change checkout;
- change prices;
- create loyalty balances;
- modify vendor funding;
- modify provenance;
- send marketing messages;
- configure external providers;
- modify Firebase;
- deploy anything.

Implementation requires a separately approved implementation branch, automated
tests, staging, security review, explicit production approval and rollback
readiness.
