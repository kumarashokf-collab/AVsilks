# AV Silks Future Catalog Architecture Progress

Status: FUTURE-ONLY ARCHITECTURE TRACK

This percentage is separate from the current AV Silks MVP / Blaze
production-readiness percentage.

## Locked Baseline

Future Multi-Category Architecture:

**55% Complete / 45% Pending**

Baseline date: 2026-08-21

The percentage may increase only after a defined architecture gate:

1. is completed,
2. is validated,
3. passes file-boundary and secret checks,
4. is committed,
5. is pushed to the dedicated future branch,
6. has matching local and GitHub SHA,
7. leaves the worktree clean.

Documentation drafts alone do not increase progress.

## Completed Architecture Foundation — 55%

### A-FUTURE-01 — Isolation and Governance

Complete.

- Future work is isolated from the MVP runtime.
- No backend runtime imports.
- No frontend runtime imports.
- No Firebase runtime dependency.
- No deployment effect.
- No release/main merge.
- Blaze remains P0.

### A-FUTURE-02 — Category Taxonomy Foundation

Complete.

Initial future domains include:

- Sarees
- Women's Wear
- Men's Wear
- Kids' Wear
- Fabrics
- Accessories

Stable language-neutral machine IDs are required.

### A-FUTURE-03 — Attribute Architecture Foundation

Complete.

Category-specific attribute sets are separated from the universal
product core.

Examples include:

- saree weave / border / pallu
- women's top size / fit / sleeve / neckline
- men's apparel size / fit / collar
- kids age group / size
- fabric material / weave / dimensions

### A-FUTURE-04 — Universal Product Model Foundation

Complete.

Architecture supports:

- universal product identity
- category classification
- category attributes
- variants
- inventory
- pricing
- media
- lifecycle
- search metadata
- provenance eligibility

### A-FUTURE-05 — Blaze Priority Interrupt Rule

Complete.

If explicit Blaze/billing approval arrives:

- finish only the current atomic architecture checkpoint
- validate
- commit
- push
- verify SHA lock
- return immediately to release/mvp-production-readiness
- resume Blaze Stage 1
- do not begin another future architecture step

### A-FUTURE-06 — Canonical Taxonomy v1

Complete.

Locked architecture defines:

- category hierarchy
- stable subcategory IDs
- globally unique product-type IDs
- stable attribute-set references
- deterministic category ordering
- disabled-by-default activation flags
- language-neutral machine IDs
- translation keys
- taxonomy version `1.0.0`

### A-FUTURE-07 — Variant and Inventory Architecture

Complete.

Locked architecture defines:

- single-sku and variant-sku modes
- exactly one inventory authority
- stable variant identity
- globally unique non-reused SKU
- stock/reservedStock invariants
- derived available stock
- transactional/idempotent reservation model
- variant lifecycle
- server-authoritative future price overrides

### A-FUTURE-08 — Pricing and Promotion Architecture

Complete.

Locked architecture defines:

- INR integer-paise money model
- product and variant price precedence
- server-authoritative pricing
- sale-price validation
- promotion eligibility validation
- deterministic/idempotent promotion application
- disabled-by-default promotion stacking
- separate tax and shipping boundaries
- server-derived payment gateway amount
- client-supplied totals rejected

## Pending Architecture — 45%

### A-FUTURE-09 — Vendor and Admin Catalog Architecture

Pending.

Define:

- vendor draft
- approval
- rejection
- publishing
- deactivation
- owner/admin authority
- audit history
- category-specific forms

### A-FUTURE-10 — Search and Discovery Architecture

Pending.

Define future integration for:

- multilingual search
- fuzzy aliases
- natural-language filters
- category facets
- product attributes
- size
- fabric
- color
- occasion
- availability
- provenance

### A-FUTURE-11 — Provenance Compatibility Architecture

Pending detailed design.

Define:

- required
- eligible
- not_applicable

while keeping commerce identity separate from public provenance identity.

### A-FUTURE-12 — Schema Versioning and Migration

Pending.

Define:

- schemaVersion
- migration rules
- backward compatibility
- rollback
- legacy saree migration
- variant migration
- validation before migration

### A-FUTURE-13 — Security and Activation Architecture

Pending.

Define future activation gates for:

- backend validation
- RBAC
- Firestore rules
- staging
- migration backup
- rollback
- security audit
- production approval

## GitHub Cleanliness Rules

The future architecture branch must remain single-purpose.

Allowed path:

`future/catalog-architecture/**`

Until explicit future implementation approval, do not modify:

- backend/**
- frontend/**
- firebase.json
- firebase.spark.json
- .firebaserc
- production secrets
- deployment configuration

Do not merge the future architecture branch into:

- release/mvp-production-readiness
- main

during the current MVP / Blaze production-readiness phase.

Do not create unnecessary pull requests merely to store future design.

The future branch is a parked architecture branch.

## Percentage Rule

Current baseline:

`FUTURE_ARCHITECTURE_PROGRESS=55`

Next percentage increase occurs only after the next verified architecture
gate is remote-locked.

MVP / Blaze progress remains independently tracked.
