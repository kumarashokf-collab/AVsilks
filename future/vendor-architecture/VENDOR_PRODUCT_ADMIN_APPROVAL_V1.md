# AV Silks Vendor Products & Admin Approval Architecture v1

Status: FUTURE ONLY

## Product ownership

A Vendor may create and manage only products belonging to its trusted
vendor tenant.

Client-provided vendorId is never sufficient ownership proof.

Product forms eventually derive from the parked Catalog Architecture
taxonomy and attribute-set definitions.

## Review state machine

Canonical review states:

`draft`
`pending`
`approved`
`rejected`

Primary transitions:

`draft -> submit -> pending`

`pending -> approve -> approved`

`pending -> reject -> rejected`

`rejected -> resubmit -> pending`

`resubmit` is an audited action, not a permanent review status.

## Vendor permissions

Vendor may:

- create own draft
- edit own draft
- submit own draft
- edit own rejected revision
- resubmit rejected product
- create a new revision from an approved product when permitted

Vendor must not:

- approve its own product
- set reviewedBy/reviewedAt
- fabricate approval metadata
- directly publish a product
- edit another vendor's product
- silently overwrite the content currently under review

## Pending state

Once submitted, the reviewed revision is locked against silent Vendor
mutation.

If editable cancellation/withdrawal is ever needed, it requires a
separately defined transition rather than silently changing pending data.

## Admin review

An authorized platform reviewer may process a pending product.

Allowed review decisions:

- approve
- reject

Approval and rejection are server-authoritative.

Rejection requires a reason/reasonCode suitable for Vendor correction.

A stale review decision against an obsolete revision must fail closed.

## Approved is not Published

`approved` means the submitted revision passed the defined product review.

It does NOT automatically mean:

- product is published
- store is active
- Vendor KYC is verified
- inventory is sellable
- provenance is published

Publication remains a separate privileged lifecycle action.

## Revision safety

Each submitted review unit has a revision number.

Resubmission increments the revision.

The exact approved revision is recorded.

If review-controlled product content changes after approval, create a new
revision and require review again.

Do not silently mutate an approved snapshot.

## Rejected and Resubmit

Rejected content remains Vendor-owned but non-approved.

Vendor can correct permitted fields.

`resubmit`:

- increments revision
- creates an audit event
- clears obsolete review decision metadata as defined by implementation
- returns review state to `pending`

Old review history remains preserved.

## Audit Trail

Product lifecycle actions are server-authored, append-only audit events.

Conceptual audit metadata:

- eventId
- vendorId
- productId
- revision
- actorUid
- trustedRole
- action
- fromState
- toState
- reasonCode where applicable
- authoritative timestamp
- requestId

Audit payloads contain no secrets, raw KYC documents or raw
government-ID numbers.

## KYC separation

Product review status and KYC status are independent state machines.

Product approval must not silently mark KYC verified.

KYC verification must not silently mark products approved.

A future activation/publishing policy may require both, but that requires
an explicit implementation contract.

## Fail-closed rules

Reject the operation when:

- Vendor ownership is ambiguous
- cross-tenant access is attempted
- Vendor attempts self-approval
- pending revision does not match reviewed revision
- rejection has no required reason
- stale approval/rejection targets an older revision
- trusted reviewer authority is missing
- audit creation cannot satisfy required security guarantees

## Runtime boundary

This architecture changes no current product API, backend, frontend,
Firestore rules, Firebase configuration or deployment.

Blaze production-readiness remains P0.
