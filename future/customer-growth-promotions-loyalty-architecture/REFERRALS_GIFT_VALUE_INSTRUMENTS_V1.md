# AV Silks Future Referrals, Gift Cards & Value Instruments Architecture v1

Status: FUTURE-ONLY / ARCHITECTURE / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define future AV Silks referral architecture and strict financial boundaries for
gift cards, store credit and other value instruments.

`Referral Eligibility Is Not Reward Authority.`

`Stored Value Requires a Ledger; It Is Not an Ordinary Coupon.`

## 2. Referral Domain Scope

Future referral architecture may include:

- referral program;
- inviter;
- invitee;
- referral relationship;
- referral code/link;
- qualifying event;
- pending reward;
- committed reward;
- reversal;
- fraud/risk state;
- audit references.

## 3. Canonical Referral Relationship

A referral relationship requires a stable trusted identity.

Marketing URLs, referral text or presentation codes must not become the canonical
commercial relationship identity.

## 4. Trusted Inviter Identity

A trusted inviter must resolve to an authenticated/approved customer or other
explicitly authorized actor.

The client must not self-assert another customer's inviter identity.

## 5. Invitee Identity Boundary

Invitee qualification requires a trusted identity policy.

Browser cookies alone are insufficient for financially meaningful per-person
reward enforcement.

## 6. Referral Code Boundary

Referral codes are lookup/presentation identifiers, not authentication
credentials.

The backend must resolve them to an approved canonical referral/program state.

## 7. Referral Code Privacy

Private or allocated referral codes must not reveal unnecessary:

- customer identity;
- email;
- phone;
- account status;
- internal fraud state.

Public responses should expose only approved information.

## 8. Qualifying Event Authority

A signup, click or referral-code entry is not automatically a trusted reward
event.

Future programs must define a qualifying event such as an approved:

- completed order;
- paid order;
- delivered order;
- other reviewed commercial milestone.

The authoritative domain for that event remains authoritative.

## 9. Referral Rule Versioning

Referral reward rules require explicit versioning.

Historical rewards must remain explainable after:

- reward amount changes;
- qualifying-event changes;
- waiting-period changes;
- fraud-policy changes.

## 10. Pending Referral Reward

Future programs may use:

`PENDING -> AVAILABLE/COMMITTED`

to account for:

- cancellation;
- refund;
- fraud review;
- return window;
- delivery milestone.

Pending reward is not spendable value by default.

## 11. Reward Idempotency

The same qualifying event must not issue duplicate referral rewards because of:

- retries;
- duplicate webhooks;
- repeated event delivery;
- concurrent workers.

Stable business/event references are required.

## 12. Self-Referral Prevention

Future architecture must explicitly prevent prohibited self-referral.

Detection may use approved trusted account/business signals.

A customer must not earn both sides of a prohibited referral by merely creating
another browser session.

## 13. Multi-Account Abuse

Referral systems must account for coordinated creation of multiple accounts.

Future controls may include approved:

- account-age signals;
- verified identity/contact signals where lawful;
- order/payment history;
- device/network risk signals;
- velocity;
- manual review.

Risk signals must be privacy-minimized.

## 14. Referral Farming

Future systems must resist automated or coordinated referral farming.

Reward volume should not be driven purely by unauthenticated link clicks.

## 15. Referral Reversal

Cancellation/refund/fraud may invalidate a referral reward according to the
versioned referral policy.

`Referral reversal creates compensating evidence; it does not erase history.`

## 16. Referral Reversal Idempotency

The same refund/cancellation event must not reverse the same reward multiple times.

Stable reversal references are required.

## 17. Referrer / Invitee Reward Separation

If both inviter and invitee receive benefits, their rewards require separate
commercial records and eligibility.

Failure of one side must not silently corrupt the other side's history.

## 18. Promotion Interaction

A referral benefit may reference a promotion or loyalty reward.

Referral logic must not directly mutate:

- pricing;
- payment;
- order;
- loyalty balance;
- gift-card balance.

It requests an approved downstream commercial action.

## 19. Loyalty Interaction

Referral rewards that create loyalty points must enter through the authoritative
Loyalty ledger.

Referral code processing must never edit a customer points counter directly.

## 20. Vendor Referral Boundary

Future vendor-specific referral programs require:

- vendor ownership;
- explicit vendor scope;
- funding attribution;
- platform policy;
- cross-vendor isolation.

One vendor must not create referral liability for another vendor.

## 21. Government / Handloom Referral Boundary

Government/Handloom awareness programs may use referral-like campaign concepts.

Such participation must not create:

- provenance truth;
- KYC truth;
- funding approval;
- customer reward liability

without the corresponding trusted program authority.

## 22. Gift / Value Instrument Scope

Future value instruments may include:

- gift cards;
- store credit;
- approved refund credit;
- promotional value instrument where legally/accountingly appropriate.

They require stronger controls than ordinary coupon metadata.

## 23. Value Instrument Authority

A value instrument requires a trusted authoritative domain/ledger.

The frontend must never authoritatively declare:

- issued balance;
- current balance;
- redeemed amount;
- remaining value;
- activation;
- expiry;
- refund amount.

## 24. Canonical Instrument Identity

Each value instrument requires a stable canonical identifier.

A public redemption code must not replace internal instrument identity.

Public identifiers should minimize enumeration and disclosure risk.

## 25. Value Ledger Principle

`Value Balance = Derived Result of an Authoritative Value Ledger`

Every financially meaningful movement must remain explainable.

A single mutable balance field is insufficient historical evidence.

## 26. Value Ledger Entry Types

Future ledger concepts may include:

- ISSUE;
- ACTIVATE;
- RESERVE;
- REDEEM;
- RELEASE;
- REFUND;
- EXPIRE;
- REVERSAL;
- ADJUSTMENT.

Exact persistence is an implementation decision.

## 27. Precise Money Representation

Stored-value amounts require an approved precise money representation such as
integer minor units.

Authoritative floating-point money arithmetic is prohibited.

## 28. Currency Binding

Each monetary value instrument must bind to an explicit supported currency.

Cross-currency redemption must not be invented by the client.

Any conversion requires separately approved financial policy.

## 29. Issuance Authority

Gift/store-credit issuance requires trusted server-side authorization.

Potential issuance sources may include approved:

- purchase;
- refund;
- customer-support adjustment;
- campaign;
- Government/Handloom program.

Each source requires auditable evidence.

## 30. Issuance Idempotency

Retrying one issuance event must not create duplicate monetary value.

Stable issuance/business references are mandatory.

## 31. Activation Boundary

Where an instrument requires activation, activation must be a trusted server-side
state transition.

Possessing a public code alone must not necessarily prove activation authority.

## 32. Redemption Authority

`Value redemption is authorized by the trusted Value Instrument domain.`

A client may request redemption but cannot declare the available balance or
successful debit.

## 33. Redemption Reservation

Checkout may require temporary reservation before final payment/order completion.

Conceptually:

`AVAILABLE -> RESERVED -> REDEEMED`

with safe paths to release/expiry.

## 34. Concurrent Redemption

Two simultaneous checkouts must not spend the same stored value twice.

Future implementation requires atomic or transactionally equivalent protection.

Frontend balance checking cannot prevent double spend.

## 35. Redemption Idempotency

Retrying the same checkout/payment operation must not debit an instrument more than
once.

Stable trusted operation references are required.

## 36. Partial Redemption

An instrument may support partial redemption only if its financial policy permits
it.

Remaining balance must reconcile exactly to ledger movements.

## 37. Split Tender Boundary

Future checkout may permit combinations such as:

- gift/store value + Razorpay;
- gift/store value + COD where policy permits;
- multiple approved instruments.

Split-tender ordering and finalization must be explicit and deterministic.

## 38. Payment Boundary

Value redemption is not payment-gateway verification.

Where an external payment remains due, trusted payment logic must still verify:

- amount;
- currency;
- signature/authenticity;
- idempotency;
- finalization.

## 39. Zero Remaining Gateway Amount

If approved stored value reduces external gateway payable to zero, checkout
requires an explicit zero-external-payment finalization path.

The system must not fabricate a Razorpay/payment success event.

## 40. Promotion Interaction

Stored value is not automatically a promotion discount.

Future pricing must explicitly define the ordering between:

- item/order promotions;
- loyalty redemption;
- gift/store value;
- tax;
- shipping.

## 41. Loyalty Separation

Loyalty points and monetary stored value remain distinct authoritative ledgers
unless a separately approved financial model explicitly combines them.

No implicit conversion is authorized.

## 42. Refund Credit Boundary

Store credit created from a refund requires an approved refund/payment decision.

The Value domain may record the approved credit but cannot independently invent a
refund entitlement.

## 43. Full Refund

Future refund handling must preserve original tender allocation.

If an order used multiple tenders, refund policy must explicitly determine how
value is returned.

## 44. Partial Refund

Partial refunds require deterministic allocation against original:

- line values;
- promotions;
- stored value;
- external payment;
- tax/shipping where applicable.

Client-provided refund allocation is untrusted.

## 45. Refund Idempotency

Retrying the same refund event must not credit value multiple times.

Stable trusted refund references are mandatory.

## 46. Expiry Boundary

Gift cards/store credit may have legal restrictions around expiry.

`Architecture does not invent legal expiry rules.`

Any expiry policy requires jurisdiction/legal/accounting review before
implementation.

## 47. Expiry Evidence

Where expiry is legally permitted and approved, it must produce explicit ledger
evidence rather than silently reducing a cached balance.

## 48. Transferability Boundary

Whether an instrument can be transferred, gifted or reassigned must be explicit.

Transferability must not be assumed from the word "gift".

Ownership/account-linking policy requires security review.

## 49. Lost / Compromised Instrument

Future operations may require:

- freeze;
- replacement;
- revocation;
- ownership verification;
- balance transfer.

These actions require strong authorization and audit.

## 50. Enumeration Resistance

Public gift/referral validation endpoints must resist:

- brute-force code guessing;
- balance enumeration;
- instrument existence probing;
- high-rate validation.

Responses must minimize disclosure.

## 51. Secret / Code Storage Boundary

Public redemption/referral codes must not be confused with provider secrets.

External provider/payment credentials remain server-side and never belong in
instrument/referral documents.

## 52. Manual Value Adjustment

Manual monetary-value adjustments are high risk.

They require:

- privileged RBAC;
- reason code;
- audit;
- idempotency where applicable;
- reconciliation.

Ordinary customers/vendors must not self-adjust balances.

## 53. Vendor-Funded Value

Future vendor-funded gift/value instruments require explicit:

- vendor ownership;
- funding liability;
- scope;
- cap;
- settlement treatment;
- refund treatment.

A vendor must not issue another vendor's liability.

## 54. Platform-Funded Value

Platform-funded value must remain distinguishable from vendor-funded value for
financial reconciliation.

## 55. Mixed-Vendor Checkout

Stored value applied to a mixed-vendor order requires deterministic allocation
where settlement/accounting needs it.

Allocation must not accidentally charge one vendor for another vendor's liability.

## 56. Government / Handloom Value Programs

Future Government/Handloom support may use approved credits/incentives only through
an explicit program authority.

A QR code, artisan label or provenance record alone cannot mint financial value.

## 57. Provenance Boundary

Referral/value domains may reference approved provenance/program results where
needed.

They must never create or alter provenance truth.

Private artisan/KYC evidence must not be copied into referral/value ledgers.

## 58. Customer Privacy

Referral and value records should minimize copied customer PII.

Prefer stable internal references over repeated:

- names;
- phones;
- emails;
- addresses.

Private reward/value history requires customer isolation.

## 59. Customer Isolation

One customer must not read or spend another customer's private reward/value unless
an explicitly approved transfer/gift policy authorizes it.

Authorization is server-side.

## 60. Multilingual Presentation

Customer-facing referral/gift/value presentation may support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Commercial identity and ledger value remain language-neutral.

## 61. Kannada Boundary

Kannada localization must not create a different:

- reward eligibility;
- gift balance;
- expiry;
- redemption amount;
- refund amount.

Localization affects presentation only.

## 62. Event Architecture

Future domains may publish conceptual events such as:

- ReferralQualified;
- ReferralRewardPending;
- ReferralRewardCommitted;
- ReferralRewardReversed;
- ValueIssued;
- ValueReserved;
- ValueRedeemed;
- ValueReleased;
- ValueRefunded;
- ValueExpired.

Consumers must be idempotent.

## 63. Event Ordering

Duplicate or out-of-order events must not duplicate value or overwrite newer
commercial state incorrectly.

## 64. Reconciliation

Future operations should reconcile applicable:

- referral qualifying event;
- reward ledger/result;
- value ledger;
- materialized balances;
- reservations;
- orders;
- payments;
- refunds;
- funding attribution.

Mismatch must become an explicit operational exception.

## 65. Audit

High-impact actions should be auditable, including:

- referral-program activation;
- reward-rule changes;
- manual reward adjustment;
- value issuance;
- manual value adjustment;
- freeze/unfreeze;
- replacement;
- expiry-policy changes;
- migration.

Audit records must not contain secrets.

## 66. Fraud / Abuse Boundary

Future controls must consider:

- self-referral;
- multi-account referral abuse;
- referral farming;
- reward replay;
- code brute force;
- double spend;
- refund-credit abuse;
- stolen gift codes;
- vendor-funded abuse;
- unauthorized adjustments.

`Financial correctness and security outrank growth incentives.`

## 67. Rate Limiting

Sensitive endpoints may require rate limits for:

- referral-code validation;
- gift/value-code validation;
- balance access;
- redemption;
- reward claiming.

Rate limiting complements authentication and authorization.

## 68. Environment Isolation

Development, staging and production require separate:

- referral programs;
- codes;
- reward state;
- gift/value ledgers;
- provider credentials;
- analytics.

Test value must never become production monetary value.

## 69. Migration Boundary

Any future migration of referral rewards or stored value requires:

- source evidence;
- canonical customer mapping;
- opening balances;
- idempotency;
- reconciliation;
- audit;
- rollback plan.

Unexplained aggregate monetary balances must not be imported blindly.

## 70. Required Future Referral Tests

Implementation must eventually test:

- canonical relationship identity;
- trusted inviter/invitee identity;
- referral-code privacy;
- qualifying-event authority;
- versioned reward policy;
- pending reward;
- duplicate-event idempotency;
- self-referral rejection;
- multi-account abuse controls;
- referral farming controls;
- cancellation/refund reversal;
- reversal idempotency;
- loyalty interaction;
- vendor isolation;
- Government/Handloom boundary.

## 71. Required Future Value Tests

Implementation must eventually test:

- canonical instrument identity;
- authoritative ledger;
- derived balance;
- exact money representation;
- currency binding;
- issuance RBAC;
- issuance idempotency;
- activation;
- reservation;
- concurrent redemption;
- redemption idempotency;
- partial redemption;
- split tender;
- zero external-payment path;
- refund credit;
- full refund;
- partial refund;
- refund idempotency;
- expiry policy;
- transferability;
- freeze/replacement;
- enumeration resistance;
- manual-adjustment RBAC;
- mixed-vendor allocation;
- reconciliation.

## 72. Required Future Security / Locale Tests

Future implementation must test:

- customer isolation;
- vendor funding isolation;
- brute-force resistance;
- replay resistance;
- double-spend prevention;
- privacy-safe errors;
- audit;
- environment isolation;
- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

All locales must resolve to the same authoritative commercial state.

## 73. Activation Boundary

This architecture document does NOT:

- create referral programs;
- issue referral rewards;
- create gift cards;
- create store credit;
- mint monetary value;
- redeem value;
- alter loyalty balances;
- alter checkout;
- alter Razorpay/payment behavior;
- create refunds;
- modify vendor settlement;
- modify provenance;
- modify Firebase;
- deploy anything.

Implementation requires a separately approved implementation branch, automated
tests, staging validation, financial/security review, explicit production approval
and rollback readiness.
