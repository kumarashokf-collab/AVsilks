# AV Silks Future Promotion Domain, Source-of-Truth & Authority Architecture v1

Status: FUTURE-ONLY / ARCHITECTURE / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define the canonical future promotion domain for AV Silks and clearly separate
promotion configuration from pricing, inventory, payment, order, vendor, loyalty
and provenance authority.

`Promotion Domain = Commercial Rule Definition, Not Transaction Authority`

## 2. Core Domain Objects

A future promotion domain may contain concepts such as:

- Promotion;
- Promotion Version;
- Promotion Code;
- Promotion Scope;
- Funding Policy;
- Eligibility Policy reference;
- Stacking Policy reference;
- Activation Window;
- Usage Policy;
- Redemption reference;
- Campaign reference;
- Audit metadata.

Exact persistence technology is intentionally not selected here.

## 3. Canonical Promotion Identity

Every promotion requires a stable canonical `promotionId`.

Localized titles, coupon text, provider IDs or campaign labels must never replace
the canonical promotion identity.

Provider-specific identifiers belong only in adapter/integration mappings.

## 4. Source-of-Truth Principle

The authoritative source for promotion definition and lifecycle is the future
trusted AV Silks Promotion domain.

External CRM, marketing, messaging, analytics or search systems must not become
the source of truth for commercial discount rules.

Derived copies are projections only.

## 5. Promotion Definition Ownership

The Promotion domain may own:

- canonical promotion identity;
- promotion type;
- lifecycle state;
- effective window;
- scope references;
- funding metadata;
- rule-version references;
- stacking-policy reference;
- usage-policy reference;
- public presentation metadata references.

It must not own payment capture or inventory stock.

## 6. Promotion Lifecycle

A controlled lifecycle may include:

`DRAFT -> REVIEWED -> SCHEDULED -> ACTIVE -> PAUSED -> ENDED -> ARCHIVED`

Emergency revocation may transition an eligible active/scheduled promotion to a
non-applicable state.

Exact transitions must be enforced server-side.

## 7. Lifecycle Authority

Only appropriately authorized trusted backend roles may change promotion
lifecycle state.

Frontend visibility or hidden buttons are not authorization controls.

Vendor-owned promotions require vendor ownership validation in addition to RBAC.

## 8. Immutable Version Principle

Commercially meaningful rule changes should create a new promotion rule version
or equivalent immutable snapshot rather than silently rewriting historical
meaning.

Past orders must remain explainable using the rule version that applied when the
order was priced.

## 9. Version Identity

A future promotion evaluation should be able to reference both:

- `promotionId`;
- `promotionVersion`.

This enables deterministic audit, debugging, rollback and reconciliation.

## 10. Effective-Time Model

Promotion activation requires explicit time semantics.

Future design must define:

- start timestamp;
- end timestamp;
- timezone interpretation;
- inclusive/exclusive boundary behavior;
- scheduled activation;
- expiry behavior.

Server time is authoritative for eligibility decisions.

Client device time must not activate a promotion.

## 11. Coupon Code Identity Boundary

A human-readable coupon/promo code is an input/lookup key, not the canonical
commercial identity.

Multiple presentation codes may eventually map to controlled promotion
definitions if explicitly designed.

Coupon lookup must resolve to trusted canonical promotion state.

## 12. Coupon Code Security Boundary

Coupon codes are not authentication credentials.

However, implementations must still resist:

- brute-force discovery;
- enumeration;
- high-rate validation;
- unauthorized private-code disclosure.

Secret provider credentials must never be embedded in coupon records.

## 13. Public vs Private Promotion Projection

Public customer-facing promotion data may include approved:

- localized title;
- localized description;
- high-level eligibility text;
- validity display;
- approved badge/banner metadata.

Private fields may include:

- internal funding details;
- fraud controls;
- targeting internals;
- private campaign configuration;
- audit metadata;
- provider mappings.

Public APIs must expose only an allowlisted projection.

## 14. Scope References

Promotion scope should reference canonical authoritative IDs rather than duplicate
business truth.

Potential references may include:

- product IDs;
- category IDs;
- vendor IDs;
- customer tier IDs;
- approved geographic/service concepts.

If a referenced entity becomes invalid or private, promotion evaluation must fail
safely.

## 15. Funding Model

Future promotions require an explicit funding source model where applicable.

Possible funding authority categories may include:

- platform-funded;
- vendor-funded;
- shared-funded;
- government/program-funded where separately approved.

Funding metadata must not itself change payment settlement truth.

## 16. Vendor Funding Boundary

A vendor may fund only promotions within explicitly authorized vendor scope.

A vendor must not:

- charge another vendor;
- discount another vendor's products;
- create platform-wide financial liability;
- modify platform-funded rules.

Vendor ownership checks are mandatory.

## 17. Government / Program Funding Boundary

Government or Handloom promotional programs may be represented only through an
approved program/funding reference.

A label such as "government promotion" must not create:

- provenance truth;
- funding approval;
- payment authority;
- KYC authority.

Those remain separate authoritative domains/processes.

## 18. Money Representation

Future promotion monetary values should use explicit:

- currency;
- integer minor units or another approved precise money representation.

Floating-point arithmetic must not become authoritative commerce math.

## 19. Currency Boundary

A promotion must explicitly define supported currency behavior.

Cross-currency conversion must not be invented by the frontend or promotion
presentation layer.

Any conversion policy requires separately trusted commerce logic.

## 20. Pricing Authority

`Final discount and payable amount are resolved by trusted server-side pricing logic.`

The Promotion domain supplies validated commercial rule inputs.

It does not unilaterally finalize:

- subtotal;
- taxes;
- shipping;
- payable amount;
- payment capture amount.

## 21. Preview vs Authoritative Evaluation

Frontend/product-page/cart promotion previews are advisory.

A preview can become stale because of:

- time;
- stock;
- customer eligibility;
- usage limits;
- cart changes;
- vendor state;
- rule version changes.

Checkout must re-evaluate authoritative inputs server-side.

## 22. Inventory Authority

Promotion activation does not reserve inventory.

Inventory authority remains with the inventory/reservation domain.

No discount rule may bypass authoritative stock validation.

## 23. Payment Authority

Promotion application never proves payment success.

Payment verification remains responsible for applicable:

- gateway authenticity;
- signature verification;
- captured amount;
- idempotency;
- replay resistance;
- finalization.

The payment domain must receive the trusted server-calculated payable amount.

## 24. Order Authority

The Order domain owns final order commercial history.

When a promotion contributes to an order, the order should preserve an immutable
commercial snapshot sufficient to explain:

- promotion ID;
- promotion version;
- applied amount;
- relevant funding attribution;
- other approved calculation references.

Historical orders must not depend on a mutable live promotion document.

## 25. Redemption Boundary

Promotion configuration and promotion redemption are distinct concepts.

A future redemption record or equivalent ledger should reference the commercial
transaction and promotion version without becoming the source of truth for order
or payment status.

## 26. Redemption Idempotency

The same trusted commercial event must not consume a promotion multiple times
because of retries or duplicate delivery.

Future redemption processing requires idempotency tied to a stable business event
or transaction reference.

Exact reservation/commit semantics are defined in later architecture gates.

## 27. Usage Counters Boundary

Raw mutable counters alone are insufficient evidence for financially significant
redemption history.

Future usage-limit enforcement should be reconcilable to authoritative redemption
events/records.

Counters may be derived optimization state where appropriate.

## 28. Concurrency Boundary

Concurrent checkout attempts can race for limited-use promotions.

Future implementation must define atomic or transactionally safe behavior for:

- global usage caps;
- per-customer caps;
- vendor-funded limits;
- single-use promotions.

Frontend checks cannot solve concurrency.

## 29. Failed Payment Boundary

A failed or abandoned payment must not silently create permanent redemption unless
the explicitly designed reservation lifecycle requires it.

Reservation, expiry, commit and release semantics must be deterministic.

## 30. Cancellation / Refund Boundary

Order cancellation, return or refund may require promotion reconciliation.

The future architecture must define whether a redemption is:

- retained;
- reversed;
- partially reversed;
- restored;
- non-restorable.

The policy must be versioned and auditable.

## 31. Customer Authority Boundary

The Promotion domain may reference a trusted customer identity or eligibility
result, but it must not duplicate the authoritative customer authentication
identity.

Customer-private promotion eligibility must be enforced server-side.

## 32. Customer Privacy

Promotion records and events should minimize customer PII.

Prefer stable internal references over copying:

- names;
- phones;
- emails;
- addresses.

Customer-specific eligibility data must remain access controlled.

## 33. Loyalty Boundary

Promotion rules may interact with future loyalty, but Promotion must not directly
edit loyalty balances.

Loyalty ledger authority remains with the future Loyalty domain.

Promotion-to-loyalty interaction requires an explicit contract.

## 34. Referral Boundary

Promotion configuration may reference future referral rewards, but qualifying
referral events and reward issuance require separately trusted referral logic.

Promotion text does not prove referral eligibility.

## 35. Gift / Stored-Value Boundary

Gift cards, store credit or stored value must not be modeled as ordinary
percentage/fixed discount records when they represent monetary liability.

Stored-value authority requires a separately controlled ledger.

## 36. Campaign Boundary

Campaigns may group or present promotions.

A campaign must not silently rewrite canonical commercial rules.

Conceptual relationship:

`Campaign -> References Promotion Version`

rather than:

`Campaign -> Becomes Pricing Authority`

## 37. Multilingual Boundary

Promotion identity and commercial rules remain language-neutral/canonical.

Localized presentation may support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Translation changes must not create a new commercial discount rule accidentally.

## 38. Event Architecture

A future Promotion domain may publish versioned domain events such as:

- PromotionCreated;
- PromotionVersionPublished;
- PromotionActivated;
- PromotionPaused;
- PromotionEnded;
- PromotionRevoked.

Event names are architectural examples, not active implementation.

## 39. Event Idempotency

Consumers must tolerate duplicate event delivery.

Stable event IDs and idempotent projection processing should prevent duplicate
side effects.

## 40. Out-of-Order / Stale Event Protection

Derived consumers must reject or safely handle stale promotion versions/events.

An older event must not overwrite a newer lifecycle/version state.

## 41. Derived Projection Model

Search, analytics, CRM, notifications and customer-facing caches are derived
consumers.

`Derived Projection != Promotion Source of Truth`

A derived system outage must not transfer commercial authority to that system.

## 42. Rebuildability

Derived promotion projections should be rebuildable from approved authoritative
promotion state and version/event history.

Rebuilds must preserve:

- lifecycle;
- visibility;
- vendor scope;
- version ordering;
- privacy.

## 43. Reconciliation

Future reconciliation should detect differences such as:

- missing projection;
- stale version;
- incorrect lifecycle state;
- unexpected vendor ownership;
- invalid public/private projection.

Reconciliation must not rewrite order/payment truth.

## 44. Deactivation / Revocation

A paused, ended or revoked promotion must stop new authoritative applications
according to its lifecycle policy.

Existing historical orders remain historical evidence and are not rewritten.

## 45. Vendor Suspension Compatibility

If a vendor becomes suspended or ineligible, vendor-scoped promotions must fail
closed for new applications unless an explicitly reviewed policy says otherwise.

Public derived caches must not resurrect suspended promotion availability.

## 46. Deletion / Archive Boundary

Commercial promotion history should not be hard-deleted merely to hide past
behavior where audit/financial retention requires preservation.

Archive/retention policy must be explicit.

## 47. Audit Model

High-impact Promotion changes should record minimally necessary:

- actor reference;
- action;
- promotion ID;
- version;
- prior/new lifecycle state where applicable;
- timestamp;
- correlation/request reference.

Audit must exclude secrets.

## 48. Authorization Model

Future Promotion administration requires server-side authorization for:

- create;
- edit draft;
- publish version;
- activate;
- pause;
- revoke;
- archive;
- funding changes.

Vendor actions require tenant ownership checks.

## 49. Provider Neutrality

No external promotion/CRM/marketing provider is authoritative by default.

Provider adapters may map external identifiers, but canonical AV Silks promotion
identity and commercial authority remain internal.

## 50. Environment Isolation

Development, staging and production require separate promotion datasets,
configuration and provider credentials.

A staging campaign must never become a production promotion because of ambiguous
environment targeting.

## 51. Security / Privacy Boundary

Future implementation must protect against:

- unauthorized rule mutation;
- cross-vendor access;
- coupon enumeration;
- stale rule replay;
- duplicate redemption;
- secret leakage;
- private targeting disclosure;
- audit tampering.

Growth optimization never overrides security.

## 52. Required Future Tests

Implementation must eventually test applicable:

- canonical ID stability;
- version immutability;
- lifecycle transitions;
- server-time activation;
- public/private projection;
- vendor ownership;
- funding ownership;
- precise money representation;
- server-authoritative pricing;
- stale preview re-evaluation;
- inventory rejection;
- payment amount binding;
- immutable order snapshot;
- redemption idempotency;
- concurrency;
- failed-payment behavior;
- cancellation/refund reconciliation;
- duplicate events;
- stale events;
- rebuild;
- vendor suspension;
- audit;
- environment isolation;
- English presentation;
- Telugu presentation;
- Hindi presentation;
- Tamil presentation;
- Kannada presentation.

## 53. Activation Boundary

This architecture document does NOT:

- create promotions;
- create coupon codes;
- activate discounts;
- change checkout;
- change prices;
- create redemption records;
- modify loyalty balances;
- send campaign messages;
- integrate an external provider;
- modify Firebase;
- deploy anything.

Implementation requires a separately approved implementation branch, tests,
staging, security review, explicit production approval and rollback readiness.
