# AV Silks Vendor & Admin Catalog Architecture v1

Status: FUTURE ONLY

## Workflow

Future catalog lifecycle:

`draft -> pending-review -> approved -> published -> inactive -> archived`

Rejection or request-changes returns the item to a controlled
non-published workflow state.

## Vendor boundary

A vendor may eventually:

- create own drafts
- edit own drafts
- submit own drafts
- view own review status

A vendor must never:

- self-approve
- self-publish
- edit another vendor's product
- grant itself permissions
- bypass backend validation

## Admin boundary

Approved admin authority may eventually include:

- review submissions
- approve
- reject
- request changes
- publish
- deactivate

Approval and publication remain distinct business actions.

## Owner boundary

Owner retains catalog-governance authority including:

- administrative override through approved RBAC
- category governance
- catalog governance
- audit access

Actual runtime permissions remain defined by the future backend RBAC
implementation, not by frontend UI visibility.

## Review safety

Publishing requires prior approval.

Rejection requires a meaningful reason.

Request-changes should preserve review history.

Deactivation is a lifecycle action, not physical deletion.

## Audit trail

Future review and lifecycle actions should record:

- eventId
- actorUid
- trusted role
- action
- productId
- previous state
- new state
- reason where applicable
- authoritative timestamp

Audit events must not expose secrets.

## Data-driven Admin forms

Do not build a separate hard-coded product form for every category.

Future forms should derive fields from:

Category
-> Product Type
-> Attribute Set

Examples:

Saree:
- weave
- border
- pallu

Men's Shirt:
- size
- fit
- collar

Women's Top:
- size
- sleeve
- neckline

Kids:
- age group
- size

The same form engine can therefore support future category expansion.

## Security

Backend validation and trusted RBAC remain authoritative.

Frontend role claims or hidden buttons must never become authorization.

Vendor ownership must be validated server-side.

## Safety boundary

This architecture changes no backend, frontend runtime, Firestore rules,
Firebase configuration or deployment.

Blaze production-readiness remains P0.
