# AV Silks Future KYC Privacy Boundary

Status: FUTURE ONLY / MANDATORY DESIGN RULE

## Zero real-ID rule for development artifacts

Never put a real person's Aadhaar number, RRN, MyNumber or other
government-issued identifier into:

- application source code
- test fixtures
- mock JSON
- seed data
- demo documents
- sample PDFs
- screenshots
- Git commits
- issue/PR examples
- logs
- analytics
- audit events
- error messages

Use synthetic redacted placeholders only:

`[AADHAAR_REDACTED]`
`[GOV_ID_REDACTED]`
`[KYC_DOCUMENT_REDACTED]`
`[KYC_REFERENCE]`

Do not create realistic-looking government-ID digits merely for demos.

## Data minimization

The normal Vendor profile should not contain generic raw fields such as:

`aadhaarNumber`
`rrn`
`myNumber`
`governmentIdNumber`

Future application architecture should prefer minimum verification
metadata such as:

- kycCaseId
- kycStatus
- providerReference
- verificationMethod
- submittedAt
- verifiedAt
- rejectionReasonCode
- reviewedBy

## Production boundary

If a future legally approved KYC process genuinely requires handling
identity evidence, use a separately reviewed secure KYC/provider flow.

Raw identity values must not be copied into ordinary application logs,
analytics, Git, public documents or audit event payloads.

Prefer provider/token/reference based verification over retaining raw
identifier values in the ordinary Vendor record.

Any document storage requires separate security, access-control,
encryption, retention and deletion review before implementation.

## Display boundary

Government-ID values are never public storefront data.

Admin/reviewer UI must use minimum necessary disclosure.

Screenshots used for support, demos, training or documentation must show
redacted placeholders only.

## Audit boundary

Audit events may record:

- eventId
- vendorId
- kycCaseId
- actorUid
- trustedRole
- action
- fromState
- toState
- reasonCode
- timestamp
- requestId

Audit events must not record raw ID numbers or raw KYC document content.

## Logging boundary

Never print raw KYC identifiers or documents to console/server logs.

Validation errors should refer to field/type/status, not echo the
submitted identity value.

## Security rule

Any future KYC implementation requires a dedicated privacy/security
review before staging and again before production activation.

Blaze approval does not authorize KYC implementation.
