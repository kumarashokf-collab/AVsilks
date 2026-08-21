# AV Silks Future Vendor Platform Architecture v1

Status: FUTURE ONLY

## Trust boundary

Backend authentication, trusted RBAC and vendor ownership are
authoritative.

Client-supplied vendorId or frontend visibility is never authorization.

## Vendor modules

Future architecture covers:

- Dashboard
- Products
- Orders
- Inventory
- Reports
- Analytics
- Profile
- KYC
- Store Management
- Audit Trail

All protected data remains vendor-scoped.

## Vendor product approval

Canonical review lifecycle:

`draft -> pending -> approved`

or:

`pending -> rejected`

After vendor correction:

`rejected -> resubmit -> pending`

Vendor cannot self-approve or self-publish.

Authorized review decisions are server-authoritative and audited.

## Orders and Inventory

Vendor sees only permitted vendor-owned fulfillment data.

Inventory remains server-authoritative and transactional.

## Reports and Analytics

Reports and analytics are vendor-scoped and sanitized.

Do not expose other vendors' information, payment secrets or unnecessary
customer private information.

## Profile and Store Management

Private vendor account identity remains separate from public store data.

## KYC

KYC is a separate protected workflow.

Example lifecycle:

`draft -> submitted -> under_review -> verified`

or:

`under_review -> rejected -> resubmit_required`

KYC approval does not automatically approve products.

Product approval does not automatically approve KYC.

Government-ID privacy requirements are defined in
`KYC_PRIVACY_BOUNDARY.md`.

## Audit Trail

Sensitive actions create server-authored audit metadata.

Audit records must never contain raw government-ID values, raw KYC
document numbers, credentials or secrets.

## Runtime boundary

No backend, frontend runtime, Firestore, Firebase or deployment mutation
is authorized.

Blaze remains P0.
