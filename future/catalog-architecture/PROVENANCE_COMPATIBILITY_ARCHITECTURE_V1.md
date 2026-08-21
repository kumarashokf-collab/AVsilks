# AV Silks Provenance Compatibility Architecture v1

Status: FUTURE ONLY

## Goal

Future multi-category catalog expansion must preserve Government
Handloom + QR provenance without forcing provenance onto every product.

## Eligibility

Every future product type may use one of three architecture states:

`required`
- provenance is mandatory for the approved product/business workflow

`eligible`
- provenance may be attached when the item qualifies

`not_applicable`
- provenance is not required for that product type

Eligibility alone never means a provenance record is already published.

## Identity separation

Commerce product identity and public provenance identity remain separate.

Internal product IDs, user IDs and vendor IDs must not become public QR
identifiers.

Public verification uses a stable opaque public ID.

## Publication boundary

Public verification may be accessible without login.

Creation, editing, verification, publication, revocation/correction and
other provenance mutations require trusted authorization.

The current MVP runtime remains authoritative until a future migration is
explicitly approved.

## Published snapshot

A published provenance snapshot is immutable.

A correction must create an audited revision/version rather than silently
rewriting historical public evidence.

## Public projection

Public provenance output must be allowlist-based.

Possible approved concepts include:

- opaque public ID
- product display name
- category display name
- craft type
- weave
- material
- origin region
- verification status
- issued date
- provenance version
- artisan display name only when publication consent exists

## Privacy boundary

Never publish through provenance:

- internal UIDs
- internal vendor identifiers
- email
- phone
- full private address
- payment information
- admin notes
- secret values

Artisan contact details remain private.

Artisan display identity requires explicit publication consent and must
follow minimum-necessary disclosure.

## Category compatibility

Handloom sarees and handloom fabrics may be provenance-required or
eligible according to future approved policy.

Other apparel categories can remain eligible or not_applicable.

Taxonomy classification must not automatically make private provenance
data public.

## Search compatibility

Search may expose an approved provenance availability/status filter.

Search results must not expose private provenance fields.

## Auditability

Future provenance publication and correction actions must preserve an
authoritative audit history.

## Safety boundary

This architecture changes no current provenance endpoint, backend,
frontend runtime, Firestore rules, Firebase configuration or deployment.

Blaze production-readiness remains P0.
