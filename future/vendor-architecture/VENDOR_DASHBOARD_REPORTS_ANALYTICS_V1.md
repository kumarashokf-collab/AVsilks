# AV Silks Vendor Dashboard, Reports & Analytics Architecture v1

Status: FUTURE ONLY

## Vendor Dashboard

The future Vendor Dashboard is a tenant-scoped, server-derived summary.

It may conceptually display:

- own product counts by review state
- pending product-review count
- own order counts by fulfillment state
- low-stock alerts
- own sales summary
- returns/cancellations summary
- Store status
- KYC status summary

Dashboard numbers are informational projections, not client-authored
sources of truth.

A Vendor must never receive another Vendor's dashboard data.

## Authoritative metrics

Metric calculations must be defined and versioned.

Every financial/time-based metric must clearly define:

- currency
- timezone
- included states
- excluded states
- cancellation treatment
- refund treatment
- data freshness/as-of timestamp

Do not silently change metric meaning while keeping the same label.

`gross sales` must not be presented as equivalent to Vendor payout or
settlement.

Payment/payout authority remains a separate future contract.

## Reports

Future Vendor reports are allowlisted, not arbitrary database queries.

Initial report families may include:

- sales
- orders
- products
- inventory
- product approval
- returns/cancellations

Every report is restricted to the trusted Vendor tenant.

The client must not submit arbitrary database field names, collection
names or unrestricted query expressions.

## Query boundaries

Reports require bounded inputs.

Examples:

- approved date range
- bounded page size
- approved sort keys
- approved filters

Large/unbounded requests must fail closed or move to a separately
approved export workflow.

## Analytics

Vendor Analytics should prefer aggregated business information.

Possible future concepts include:

- sales trends
- order trends
- product performance
- inventory health
- approval turnaround summaries
- returns/cancellation trends

Analytics does not require raw customer identity.

Analytics must not require:

- raw delivery addresses
- raw KYC documents
- raw government-ID values
- payment credentials
- another Vendor's records

External behavioral tracking is not required by this architecture.

## Cross-Vendor analytics

Cross-Vendor benchmarking is disabled by default.

If the platform ever introduces benchmarking, it requires a separate
privacy/security design with aggregation and disclosure controls.

Ordinary Vendor users must not infer another Vendor's private sales,
inventory, customer or KYC data.

## Reports capability

Access requires trusted Vendor membership and the appropriate future
report capability.

A suggested capability is:

`reports-analyst`

Backend authorization remains authoritative.

Frontend dashboard/menu visibility is not authorization.

## Export safety

Report exports are a higher-risk operation.

Future exports must be:

- tenant-scoped
- server-generated
- sanitized
- bounded
- capability-controlled
- audited

Exports must not contain:

- another Vendor's information
- payment credentials
- raw KYC documents
- raw government-ID values
- unnecessary customer private data
- secrets/internal security metadata

## Admin cross-tenant reporting

Platform admin/owner access across Vendor tenants requires explicit
trusted permission.

Cross-tenant report access/export is auditable.

Admin visibility must not become unrestricted silent bulk export.

## Freshness

Dashboard/report results should identify data freshness where meaningful.

Examples conceptually include:

- generatedAt
- asOf
- aggregationVersion

Cached analytics must not be represented as live transactional state.

Inventory/order mutation decisions must continue to use authoritative
transactional systems, not dashboard cache values.

## Audit Trail

Sensitive reporting actions may create server-authored events such as:

- report viewed
- export requested
- export generated
- analytics viewed
- privileged cross-tenant report access

Audit payloads must not copy report contents, raw customer private data,
KYC documents or government-ID values.

## Fail-closed rules

Reject access when:

- Vendor tenant cannot be established
- report capability is missing
- cross-tenant data is requested
- report type/filter/sort is not allowlisted
- range/page limits are exceeded
- export privacy requirements cannot be satisfied
- privileged admin access lacks explicit permission
- metric definition/version is ambiguous for a sensitive financial value

## Runtime boundary

This architecture creates no dashboard endpoint, analytics pipeline,
report query, export file, backend/frontend mutation, Firestore change or
Firebase deployment.

Blaze production-readiness remains P0.
