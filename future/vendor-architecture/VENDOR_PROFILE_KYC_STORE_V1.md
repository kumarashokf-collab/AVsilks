# AV Silks Vendor Profile, KYC & Store Management Architecture v1

Status: FUTURE ONLY

## Profile separation

Future Vendor account data is divided conceptually into:

Private Vendor Profile

and:

Public Store Profile

These must not be treated as the same record/security surface.

A Vendor may edit only permitted fields belonging to its trusted tenant.

Another Vendor must not read or mutate protected profile information.

## Private Vendor Profile

Private concepts may include:

- account contact
- support contact
- membership state
- KYC status
- internal review metadata

Trusted platform fields are not Vendor-authoritative.

Frontend form visibility does not grant write permission.

## KYC lifecycle

Conceptual KYC states:

`draft`
`submitted`
`under-review`
`verified`
`rejected`
`resubmit-required`

Vendor may prepare and submit its own permitted KYC case.

Vendor must never:

- self-verify KYC
- fabricate reviewer identity
- fabricate verification timestamps
- change a rejected case directly to verified
- set platform KYC decision fields

Trusted reviewer authority is required.

Rejection or resubmit-required decisions require an approved reasonCode.

## KYC and Product Approval separation

KYC verification and product approval remain independent state machines.

`KYC verified` does not automatically mean:

- every Vendor product is approved
- every Vendor product is published
- Store is automatically public
- inventory is sellable

Likewise, an approved product does not mean KYC is verified.

Any future activation policy requiring multiple gates must be explicit and
server-authoritative.

## Government-ID privacy boundary

The previously locked KYC privacy rule remains mandatory.

Never put a real person's Aadhaar, RRN, MyNumber or other
government-issued identifier into development artifacts such as:

- source code
- tests
- mock data
- seed data
- demos
- sample documents
- screenshots
- Git history
- logs
- analytics
- audit events
- error output

Use redacted placeholders only, for example:

`[AADHAAR_REDACTED]`
`[GOV_ID_REDACTED]`
`[KYC_DOCUMENT_REDACTED]`
`[KYC_REFERENCE]`

Do not invent realistic-looking government-ID digits for demos.

## Production KYC data minimization

The ordinary Vendor profile should not contain a generic raw
government-ID-number field.

Prefer future KYC-provider/reference metadata such as:

- kycCaseId
- providerReference
- verification method
- KYC status
- submitted timestamp
- verified timestamp
- rejection reasonCode
- trusted reviewer reference

Raw identity evidence must not be copied into normal application logs,
analytics, public records or audit payloads.

## KYC document boundary

Provider-managed verification is preferred where an approved future
implementation allows it.

If document storage is ever required, implementation must stop until a
dedicated security/privacy review defines:

- access control
- encryption requirements
- minimum reviewer access
- secure delivery/download behavior
- retention
- deletion
- incident handling
- audit policy

Ordinary public storage of KYC documents is forbidden.

Architecture approval alone does not authorize document storage.

## Store Management

Public Vendor Store concepts may eventually include:

- display name
- description
- approved logo
- approved banner
- public contact
- public policies
- social links

All fields require validation/sanitization appropriate to their type.

## Privileged Store fields

Vendor must not directly control platform-authoritative concepts such as:

- store enforcement/status
- verified badge
- platform trust badge
- commission policy
- payout configuration
- KYC decision
- platform enforcement state

These require appropriate trusted backend authority.

A Vendor cannot award itself a verified/trusted badge.

## Store publication boundary

Store visibility is separate from:

- KYC status
- product approval
- product publication

Future publication rules must explicitly evaluate required gates.

The client must not make itself public by changing a local/public field.

## Audit Trail

Sensitive events are server-authored.

Examples:

- profile updated
- KYC submitted
- KYC review started
- KYC verified
- KYC rejected
- resubmit requested
- Store profile updated
- Store status changed
- privileged Store override

Audit payloads must use identifiers/references and status metadata, never
raw government-ID values or raw KYC documents.

## Fail-closed rules

Reject actions when:

- Vendor ownership is ambiguous
- another Vendor profile/store is targeted
- Vendor attempts to change trusted KYC fields
- reviewer authority is missing
- rejection lacks required reasonCode
- Vendor attempts self-verification
- Vendor attempts self-assigned verified/trust badge
- public/private field classification is ambiguous
- KYC document security policy is not approved
- privacy/audit requirements cannot be satisfied

## Runtime boundary

This architecture performs no KYC collection, document upload, profile
write, Store write, backend/frontend modification, Firestore rule change
or Firebase deployment.

Blaze production-readiness remains P0.
