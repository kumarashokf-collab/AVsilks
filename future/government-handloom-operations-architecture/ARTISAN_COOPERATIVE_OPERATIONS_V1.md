# AV Silks Future Government Handloom — Artisan + Cooperative Operations v1

Status: FUTURE-PARK / ARCHITECTURE + DORMANT IMPLEMENTATION / NOT PRODUCTION

## 1. Purpose

Define the operational relationship between existing AV Silks artisans and future
cooperatives, producer groups, clusters or similar Handloom operational entities.

This architecture extends the existing artisan foundation instead of duplicating
artisan identity.

## 2. Existing Artisan Source of Truth

The existing AV Silks artisan domain remains the source of truth for the base
artisan profile.

Future Handloom Operations references an existing canonical `artisanId`.

It must not silently create a second conflicting artisan identity.

`Artisan Operations Extend Artisan Identity; They Do Not Replace It.`

## 3. Cooperative Operational Record

A Future cooperative/producer-group operational record may contain:

- canonical `cooperativeId`;
- display name;
- cooperative type;
- district;
- state;
- country;
- internal active state.

Such a record is an AV Silks operational record only.

`Internal Cooperative Record != Government Cooperative Certification`

## 4. Artisan Operational Record

An artisan operational record may reference:

- canonical operation ID;
- canonical artisan ID;
- craft role;
- service area;
- optional cooperative association;
- internal active state.

It must not duplicate raw KYC or Government identity evidence.

## 5. Membership Record

Artisan-to-cooperative association is represented by a separate canonical
membership record.

This prevents cooperative membership from silently rewriting the base artisan
record.

The membership record references:

- `membershipId`;
- `artisanId`;
- `cooperativeId`;
- operational membership role;
- internal workflow state.

## 6. Internal Workflow States

The reusable Future workflow states are:

- `draft`;
- `submitted`;
- `under-review`;
- `verified-internal`;
- `rejected`;
- `suspended`;
- `closed`.

`verified-internal` means only that an authorized future AV Silks workflow has
completed its internal verification step.

It does not mean Government approval.

`Internal Verification != Government Approval`

## 7. Allowed Membership Transitions

The initial deterministic membership transition model is:

- draft -> submitted;
- submitted -> under-review;
- under-review -> verified-internal;
- under-review -> rejected;
- verified-internal -> suspended;
- verified-internal -> closed;
- suspended -> verified-internal;
- suspended -> closed;
- rejected -> closed.

Unsupported transitions fail closed.

## 8. Object Authorization Boundary

Future implementation must authorize both:

- the authenticated actor's permission;
- the actor's authority over the specific artisan/cooperative/membership object.

`Role Permission != Arbitrary Object Access`

## 9. Cooperative Isolation

One cooperative must not read or mutate another cooperative's private operational
records merely because the actor has a cooperative role.

Tenant/object scope remains mandatory.

## 10. Government Authority Boundary

No Future operation may automatically set:

- Government approved;
- beneficiary approved;
- subsidy approved;
- officially certified;
- KYC approved.

Government authority must come from a separately reviewed authoritative
integration or process.

## 11. Privacy Boundary

Operational payloads must reject sensitive identity/banking fields such as raw:

- Aadhaar;
- Government identity;
- KYC document;
- bank account number;
- bank routing/IFSC information.

Only privacy-safe references may be introduced later after dedicated review.

## 12. Public Projection

Cooperative and artisan operational records are private by default.

Any future public projection must use an explicit allowlist and must never expose:

- raw KYC;
- Government identity;
- bank details;
- private contacts;
- home address;
- internal audit evidence.

## 13. Provenance Boundary

Artisan/cooperative operational membership may be referenced by provenance only
through separately approved canonical references.

Operational membership cannot rewrite provenance truth.

## 14. Vendor Boundary

Vendor identity, cooperative identity and artisan identity remain separate
canonical concepts.

A vendor is not automatically a cooperative.

A cooperative is not automatically a Government authority.

## 15. Audit Boundary

Future state-changing implementation must capture privacy-safe evidence including:

- canonical object ID;
- actor ID;
- action;
- previous state;
- new state;
- event/reference ID;
- server-authoritative timestamp.

Raw KYC should never be copied into audit logs.

## 16. Determinism

Canonical IDs and workflow transitions must be deterministic and validated.

Unsupported, malformed or ambiguous input fails closed.

## 17. Multilingual Boundary

Customer/operator-facing labels may later support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Localization must not change canonical IDs or workflow authority.

## 18. Dormant Code Boundary

Gate 3 implementation remains under:

`backend/src/future/handloomOperations/`

It must not be mounted in production `backend/app.js`.

It must not be exported by `backend/functions.js`.

## 19. Testing

Gate 3 tests must verify:

- cooperative validation;
- artisan-operation validation;
- membership validation;
- sensitive-field rejection;
- canonical IDs;
- internal-only verification;
- deterministic allowed transitions;
- invalid transition rejection;
- immutable output;
- Future-Park activation guard.

## 20. Activation

This architecture/code does not:

- create real cooperatives;
- alter existing artisans;
- create real memberships;
- verify Government status;
- mutate Firestore;
- activate an API;
- deploy anything.

`Future-Park Operations = Implemented and Tested, Not Activated`
