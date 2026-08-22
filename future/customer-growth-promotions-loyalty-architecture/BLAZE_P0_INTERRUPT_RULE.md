# AV Silks Future Customer Growth — Blaze P0 Interrupt Rule

Status: FUTURE-ONLY / GOVERNANCE RULE / BLAZE P0 OVERRIDES THIS TRACK

## 1. Priority

Blaze production-readiness is always P0 and first priority.

`BLAZE_PRIORITY=P0_LOCKED`

Customer Growth / Promotions / Loyalty architecture is Future-only work that may
continue only while Blaze billing approval remains externally unconfirmed.

## 2. Before Every Future Gate

Before beginning any new Customer Growth architecture gate, check whether verified
Blaze/billing approval has been received for the exact intended Firebase/Google
Cloud project.

If verified approval exists:

- do not begin the new Future gate;
- preserve current Future work safely;
- return to `release/mvp-production-readiness`;
- verify the trusted release SHA;
- resume Blaze Stage 1;
- stop further Customer Growth gates.

## 3. Approval Evidence Boundary

Blaze approval must be based on explicit external confirmation.

The following are not sufficient by themselves:

- an open support case;
- an acknowledgement email;
- an internal-review notice;
- a generic billing page;
- an assumption that approval should already be complete.

Ambiguous evidence means Blaze Stage 1 remains waiting.

## 4. Interrupt During an Atomic Future Gate

If verified Blaze approval arrives while one atomic Customer Growth gate is already
being executed:

1. finish only that current atomic gate;
2. validate its exact file scope;
3. run secret/privacy/security scans;
4. preserve the work using the approved Git lifecycle where required;
5. obtain exact remote SHA lock if a preservation commit is created;
6. ensure the Future branch is clean;
7. return to the trusted release branch;
8. resume Blaze;
9. do not start another Future gate.

Do not abandon partially written architecture in an ambiguous Git state.

## 5. No Cloud Mutation

This Future architecture track must not perform:

- Firebase billing mutation;
- Firebase deployment;
- Firestore deployment;
- Hosting deployment;
- Functions deployment;
- Secret Manager mutation;
- search-provider mutation;
- payment-provider mutation.

Blaze work uses its separately approved runbook.

## 6. No Production Activation

Customer Growth architecture does not authorize production:

- coupons;
- promo codes;
- discounts;
- loyalty points;
- gift cards;
- referrals;
- campaigns;
- customer tiers;
- sponsored promotions.

Architecture and implementation are separate approval boundaries.

## 7. Release / Main Protection

Future Customer Growth work must not directly modify:

- `main`;
- `release/mvp-production-readiness`.

No automatic merge from this Future branch is permitted.

## 8. Dedicated Branch Isolation

All Customer Growth architecture work remains under:

`feature/future-customer-growth-promotions-loyalty-architecture`

Future files must remain under:

`future/customer-growth-promotions-loyalty-architecture/`

Source-code implementation is outside this architecture track.

## 9. MVP Progress Boundary

Future architecture progress is separate from MVP progress.

Completing Customer Growth architecture gates must not increase the MVP Blaze
progress percentage.

MVP progress changes only after a separately defined verified MVP/Blaze PASS move.

## 10. Customer Data Boundary

Architecture work must not use real customer:

- names;
- phone numbers;
- email addresses;
- delivery addresses;
- payment information;
- search histories;
- loyalty histories.

Use synthetic concepts/placeholders only.

## 11. Promotion Data Boundary

Future documentation may model promotion concepts but must not contain real
production:

- coupon secrets;
- redemption tokens;
- payment credentials;
- provider secrets;
- customer-specific promo identifiers.

No live campaign is created by this track.

## 12. Loyalty Authority Boundary

Future loyalty points, tiers or rewards are not authoritative until separately
implemented and approved.

Documentation must not create:

- customer balances;
- points;
- rewards;
- vouchers;
- financial liabilities.

## 13. Security Boundary

Future growth architecture must preserve:

- authentication;
- RBAC;
- customer isolation;
- vendor isolation;
- server-authoritative pricing;
- payment authority;
- auditability;
- anti-abuse controls.

Promotion convenience never overrides security.

## 14. Git Preservation Rule

When an architecture milestone is ready for closure, use the standard lifecycle:

`Verify -> Security Scan -> Stage -> Commit -> Push -> Exact Remote SHA Lock -> Park`

No force push.

No direct coding on `main`.

## 15. Final Governance Rule

`Blaze approval interrupts Future Customer Growth work at the next safe atomic boundary.`

Blaze remains first priority until the MVP production-readiness sequence is
completed or explicitly reprioritized.
