# AV Silks Future Customer Growth, Promotions & Loyalty Architecture Progress

Status: FUTURE-ONLY / ARCHITECTURE TRACK / NOT ACTIVE MVP IMPLEMENTATION

Current architecture progress:

`100% complete / 0% pending`

## 1. Mission

Design a future enterprise-grade Customer Growth architecture for AV Silks covering
promotions, discounts, loyalty, referrals, gift instruments, campaign targeting,
customer lifecycle growth and related anti-abuse/privacy controls.

This architecture is designed for future implementation only.

It does not activate promotions, alter checkout pricing, create customer balances
or deploy any cloud service.

## 2. Blaze Priority

Blaze production-readiness remains P0 and first priority.

The dedicated rule in `BLAZE_P0_INTERRUPT_RULE.md` governs interruption of this
Future track.

Before every new architecture gate, verified Blaze billing approval must take
priority over additional Future work.

`BLAZE_PRIORITY=P0_LOCKED`

## 3. Core Architecture Scope

Future Customer Growth architecture includes:

- promotion definitions;
- coupon/promo-code concepts;
- automatic discounts;
- campaign eligibility;
- discount stacking;
- usage/redemption limits;
- customer-specific eligibility;
- vendor-funded/platform-funded promotion boundaries;
- loyalty points;
- loyalty ledger;
- loyalty tiers;
- earn/redeem/expire/reverse concepts;
- referral programs;
- gift-card/value-instrument boundaries;
- campaign segmentation;
- lifecycle campaigns;
- multilingual promotion presentation;
- notification integration boundaries;
- customer consent/privacy;
- analytics;
- attribution;
- experimentation boundaries;
- anti-fraud/anti-abuse;
- audit;
- rollback;
- migration/testing roadmap.

## 4. Promotion Domain Boundary

Promotion configuration is not payment authority.

A future promotion may influence an eligible discount calculation, but final
transaction pricing must be resolved by trusted backend commerce logic.

The client must never authoritatively decide:

- eligible discount;
- payable amount;
- promotion funding;
- loyalty redemption value;
- tax impact;
- final order total.

## 5. Pricing Authority Boundary

`Checkout pricing remains server-authoritative.`

Search displays, frontend banners, coupon text, loyalty previews and campaign
messages are discovery/presentation layers only.

Future Growth architecture must integrate with the trusted pricing/order domains
rather than replace them.

## 6. Inventory Boundary

Promotions do not reserve or create inventory.

Inventory availability, reservation and stock authority remain with the inventory
and order domains.

A promotion must not force a sale when authoritative stock rules reject it.

## 7. Payment Boundary

Promotions and loyalty must never bypass payment verification.

Payment gateway signature, capture, amount, idempotency, settlement and refund
authority remain in the payment domain.

A discount does not authorize payment completion.

## 8. Order Boundary

Promotion redemption becomes commercially meaningful only through an approved
order/payment lifecycle.

Future implementation must define safe behavior for:

- failed payment;
- cancelled order;
- partial/full refund;
- returned item;
- duplicate checkout;
- retry;
- idempotent replay.

## 9. Coupon / Promo-Code Scope

Future architecture may define:

- human-readable codes;
- automatic promotions;
- eligibility rules;
- validity windows;
- usage caps;
- per-customer limits;
- minimum order rules;
- category/product/vendor constraints;
- exclusive/non-exclusive behavior.

This document does not create any live code or campaign.

## 10. Discount Types

Possible future discount models may include:

- percentage discount;
- fixed-amount discount;
- item-level discount;
- order-level discount;
- shipping promotion where supported;
- bundle promotion;
- vendor-funded promotion;
- platform-funded promotion.

Every type requires an explicit calculation and authority contract before
implementation.

## 11. Promotion Stacking

Future architecture must define deterministic stacking rules.

Examples of policy dimensions include:

- exclusive promotions;
- combinable promotions;
- priority;
- maximum discount;
- vendor/platform funding;
- category restrictions;
- loyalty redemption interaction.

The system must not rely on frontend ordering to determine stacking.

## 12. Eligibility Scope

Eligibility may eventually use approved attributes such as:

- authenticated customer status;
- customer tier;
- campaign membership;
- product/category;
- vendor;
- order subtotal;
- first-order status;
- approved geographic/service area;
- validity period.

Sensitive or discriminatory targeting requires separate legal/privacy review and
must not be inferred casually.

## 13. Loyalty Scope

Future loyalty architecture may include:

- earn rules;
- redeem rules;
- point ledger;
- pending/available/expired states;
- reversals;
- expiry;
- tier qualification;
- tier benefits;
- audit history.

Loyalty balances must eventually use an authoritative ledger model rather than a
client-maintained counter.

## 14. Loyalty Financial Boundary

Loyalty points and rewards may represent commercial liability.

Future implementation must explicitly define:

- accounting treatment;
- valuation;
- expiry;
- reversal;
- refund handling;
- fraud controls;
- reconciliation.

Architecture completion does not create a financial liability.

## 15. Referral Scope

Future referral architecture may cover:

- referral relationship;
- inviter/invitee eligibility;
- qualifying event;
- reward issuance;
- abuse prevention;
- self-referral prevention;
- duplicate-account controls;
- reversal.

A signup alone must not automatically imply a trusted reward event.

## 16. Gift Instrument Boundary

Future gift cards, store credit or value instruments require stronger financial
controls than ordinary coupon text.

Before implementation, separately review:

- issuance;
- balance ledger;
- redemption;
- transferability;
- expiry;
- refund;
- fraud;
- reconciliation;
- legal/tax requirements.

This Future architecture must not casually treat stored value as a simple coupon.

## 17. Campaign Scope

Future campaigns may orchestrate approved:

- promotions;
- loyalty incentives;
- referral incentives;
- customer lifecycle messages;
- seasonal discovery;
- vendor campaigns;
- handloom/government awareness campaigns.

Campaign orchestration must not gain authority over pricing, payment or private
customer data.

## 18. Segmentation Boundary

Customer segmentation should use minimized, purpose-approved data.

Potential future segments may use non-sensitive commerce behavior where lawful and
approved.

Sensitive personal profiling is outside default scope and requires separate review.

## 19. Customer Privacy Boundary

Do not place unnecessary customer PII in promotion, loyalty, analytics or campaign
records.

Future architecture must support:

- data minimization;
- access control;
- purpose limitation;
- retention;
- deletion where applicable;
- consent/preferences where applicable;
- secure exports.

## 20. Customer Isolation

One customer must not access:

- another customer's coupons where private;
- another customer's loyalty ledger;
- another customer's referral rewards;
- another customer's campaign eligibility details;
- another customer's history.

Authorization must be enforced server-side.

## 21. Vendor Boundary

Future multi-vendor promotions require explicit ownership and funding rules.

A vendor must not:

- alter another vendor's promotions;
- discount another vendor's products;
- access another vendor's private campaign analytics;
- issue platform-wide incentives without authority.

Platform-level promotions require separately authorized platform roles.

## 22. Government / Handloom Boundary

Future Growth architecture may support public-interest campaigns such as:

- handloom awareness;
- artisan discovery;
- cooperative campaigns;
- government-approved promotional programs.

Government/handloom labeling must not create provenance truth or KYC authority.

Provenance remains owned by its authoritative domain.

## 23. Multilingual Presentation

Future customer-facing Growth experiences should support the initial architecture
locales:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Promotion identity and rules should remain canonical even when labels/messages are
localized.

## 24. Localization Boundary

Localized promotion text must not create different commercial rules accidentally.

Conceptual separation:

`Canonical Promotion Rule -> Locale-Specific Presentation`

Translations do not change discount authority.

## 25. Notification Boundary

Future Growth may integrate with email, SMS, push or in-app notifications.

Notification systems must receive only approved campaign data.

No provider integration is approved by this architecture.

Marketing preference/consent requirements require implementation-time review.

## 26. Analytics Scope

Future Growth analytics may measure approved metrics such as:

- impressions;
- eligible sessions;
- applications;
- redemptions;
- conversion;
- reward issuance;
- reward reversal;
- campaign performance.

Metrics must be privacy-safe and resistant to manipulation.

## 27. Attribution Boundary

Marketing attribution is analytical evidence, not transaction authority.

Attribution must not mutate:

- order truth;
- payment truth;
- loyalty balances;
- promotion eligibility.

## 28. Experimentation Boundary

Future A/B or experimentation capabilities require:

- explicit experiment definition;
- stable assignment;
- privacy review;
- metrics;
- guardrails;
- rollback.

Experiments must never weaken authentication, authorization or payment security.

## 29. Abuse / Fraud Scope

Future architecture must account for:

- coupon brute force;
- redemption replay;
- multi-account abuse;
- referral farming;
- bot activity;
- loyalty manipulation;
- refund/reward exploitation;
- promotion stacking exploits;
- vendor abuse;
- campaign analytics poisoning.

Security and commerce correctness outrank conversion growth.

## 30. Audit Scope

High-impact changes should eventually be auditable, including:

- promotion creation/activation;
- eligibility changes;
- stacking changes;
- funding changes;
- loyalty earn/redeem rule changes;
- tier changes;
- referral reward changes;
- value-instrument changes;
- campaign activation/deactivation;
- emergency kill-switch actions.

Audit records must not contain secrets.

## 31. Provider Neutrality

This architecture does not approve a CRM, marketing, messaging, loyalty or
experimentation provider.

Provider integrations require future review for:

- credentials;
- PII/data transfer;
- retention;
- deletion;
- webhooks;
- security;
- pricing;
- migration/exit.

## 32. Environment Isolation

Future implementation must separate:

- development;
- staging;
- production.

Campaigns, credentials, test customer records and provider configurations must not
silently cross environments.

## 33. Non-Scope

This Future architecture does NOT:

- change current frontend source;
- change current backend source;
- change Firebase;
- deploy Functions;
- deploy Hosting;
- alter Firestore rules;
- create live coupons;
- create customer loyalty balances;
- create gift-card balances;
- send marketing notifications;
- enable customer tracking;
- integrate a CRM/provider;
- alter Razorpay;
- modify production orders;
- modify production prices;
- merge to release/main.

## 34. Source-Code Boundary

All work in this track is documentation/architecture until separately approved.

Architecture files belong only under:

`future/customer-growth-promotions-loyalty-architecture/`

Future implementation must use a separately reviewed implementation branch.

## 35. Fixed Progress Model

Customer Growth architecture uses this fixed evidence-based progress model:

- Gate 0 — Dedicated Future branch = `2%`
- Gate 1 — Blaze P0 interrupt rule = `5%`
- Gate 2 — Scope + fixed progress roadmap = `10%`
- Gate 3 — Promotion domain + source-of-truth/authority model = `20%`
- Gate 4 — Eligibility + coupon validation + stacking architecture = `30%`
- Gate 5 — Discount pricing + checkout/tax/refund authority architecture = `40%`
- Gate 6 — Loyalty ledger + tiers + expiry/reversal architecture = `50%`
- Gate 7 — Referrals + gift/value-instrument boundary architecture = `60%`
- Gate 8 — Campaigns + segmentation + notifications + consent architecture = `70%`
- Gate 9 — Analytics + attribution + experimentation + anti-abuse architecture = `78%`
- Gate 10 — Multi-vendor + Government Handloom/provenance compatibility = `86%`
- Gate 11 — Security + privacy + audit architecture = `94%`
- Gate 12 — Activation + migration + testing roadmap + final audit = `100%`

Percentages advance only after the corresponding gate is verified PASS.

## 36. Closure Boundary

Reaching architecture `100%` means content gates are complete.

The Future track becomes officially CLOSED only after:

1. final architecture audit PASS;
2. staged security scan PASS;
3. exact architecture commit;
4. GitHub push;
5. exact remote SHA lock;
6. clean branch;
7. branch parked;
8. trusted release restored unchanged.

`100% architecture content != production activation.`

## 37. MVP Progress Separation

Customer Growth architecture progress does not increase MVP completion.

Current Future architecture percentage and MVP Blaze percentage are separate
measurements.

Only verified MVP/Blaze gates may change MVP progress.

## 38. Final Scope Rule

Growth features may improve conversion or retention, but they may never override:

- authentication;
- RBAC;
- customer/vendor isolation;
- trusted pricing;
- payment verification;
- inventory authority;
- order integrity;
- provenance truth;
- privacy;
- auditability.

`Security and transaction correctness outrank growth optimization.`
