# Future Catalog Implementation Roadmap

This roadmap is parked for post-MVP work.

## F0 — Architecture Approval

Review business scope and confirm which categories are actually needed.

No implementation before approval.

## F1 — Canonical Taxonomy

Lock:

- category IDs
- product type IDs
- attribute set IDs
- translation strategy

## F2 — Product Model Versioning

Define a versioned universal product model and migration rules.

## F3 — Variant and Inventory Model

Add variant-level SKU and inventory only where required.

## F4 — Backend Validation

Implement server-side validators and repositories on a dedicated future
feature branch.

## F5 — RBAC / Vendor Rules

Define who may create, edit, approve, deactivate, and publish products.

## F6 — Admin UI

Build data-driven category and product-type forms.

Do not make one hard-coded Admin form for every category.

## F7 — Customer Catalog UI

Add category navigation, facets, size/color/fabric filters, and
multilingual labels.

## F8 — Search Integration

Connect future attributes to the existing fuzzy/multilingual search
architecture.

## F9 — Provenance Eligibility

Enable QR provenance only for product types approved for artisan or
handloom traceability.

## F10 — Migration

Migrate existing products only after validation, backups, rollback, and
staging tests.

## F11 — Staging / Security

Run complete staging regression and security review before production.

## Priority Rule

This future roadmap must never block or delay an active Blaze
production-readiness gate.
