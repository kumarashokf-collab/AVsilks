# AV Silks Vendor Identity, RBAC & Tenant Isolation v1

Status: FUTURE ONLY

## Identity separation

Authentication identity:

`uid`

Vendor tenant identity:

`vendorId`

These are separate concepts.

A government ID, KYC document number, phone number or email must never
become the vendor tenant identifier.

KYC verification status does not replace authentication.

## Trusted vendor context

Before protected Vendor access, the future backend must derive and
validate trusted context such as:

- authenticated uid
- trusted platform role
- vendorId from approved membership
- membership state
- vendor capabilities

Client-submitted vendorId alone is never authorization.

## Membership lifecycle

Conceptual membership states:

`active`
`suspended`
`revoked`

Suspended or revoked membership fails closed for protected Vendor access.

## Capability architecture

Future vendor membership may grant least-privilege capability groups such
as:

- vendor-owner
- catalog-manager
- order-fulfillment
- inventory-manager
- reports-analyst

These are future architecture capability groups, not authorization from
frontend labels.

The backend remains authoritative.

## Tenant isolation

Protected Vendor resources must be scoped to their owning vendor.

This applies to:

- products
- orders
- inventory
- reports
- analytics
- profile
- KYC
- store management
- audit records

A normal Vendor request must not read or mutate another Vendor tenant.

Cross-tenant reads and writes are denied by default.

## Request boundary

A request path/body/query parameter containing another `vendorId` must
not grant access.

The backend compares requested resource ownership against trusted Vendor
membership.

Never trust hidden UI elements, localStorage, browser role values or a
client-selected vendorId as an authorization decision.

## Platform admin / owner boundary

Platform admin or owner cross-tenant access requires explicit trusted
permission.

Sensitive elevated actions must be audited.

A reason should be required for sensitive manual overrides.

Admin capability must not silently become unrestricted data export.

## Product approval separation

Vendor tenant access does not imply product approval authority.

A Vendor may manage permitted own drafts but cannot self-approve.

Approval workflow remains a separate V-FUTURE-03 contract.

## KYC separation

Vendor membership/authentication and KYC verification are separate.

KYC data follows the mandatory privacy boundary.

Do not place raw government-ID numbers or raw documents in role claims,
tenant identity, logs or audit metadata.

Use redacted placeholders only in development artifacts.

## Fail-closed conditions

Deny protected access when:

- authentication is missing/invalid
- vendor membership is missing
- membership is suspended or revoked
- tenant ownership cannot be established
- trusted role/capability is insufficient
- resource ownership is ambiguous
- elevated access lacks explicit permission

## Runtime boundary

This document changes no current authentication, RBAC, Firestore rules,
backend, frontend or Firebase configuration.

Implementation requires a separately approved future phase.

Blaze production-readiness remains P0.
