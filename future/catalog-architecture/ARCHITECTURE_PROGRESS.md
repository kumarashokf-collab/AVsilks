# AV Silks Future Catalog Architecture Progress

Status: FUTURE-ONLY ARCHITECTURE TRACK

This percentage is separate from the current AV Silks MVP / Blaze
production-readiness percentage.

## Locked Baseline

Future Multi-Category Architecture:

**25% Complete / 75% Pending**

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

## Completed Architecture Foundation — 25%

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

## Pending Architecture — 75%

### A-FUTURE-06 — Canonical Taxonomy v1

Pending.

Define:

- category hierarchy
- subcategory IDs
- product type IDs
- attribute-set IDs
- category ordering
- activation flags
- translation keys
- taxonomy version

### A-FUTURE-07 — Variant and Inventory Architecture

Pending.

Define:

- products with no variants
- products with variants
- variant identity
- SKU rules
- stock
- reserved stock
- variant lifecycle
- variant-level image/price overrides

### A-FUTURE-08 — Pricing and Promotion Architecture

Pending.

Define:

- base price
- sale price
- variant override
- tax boundary
- shipping boundary
- promotion eligibility
- server-authoritative totals

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

`FUTURE_ARCHITECTURE_PROGRESS=25`

Next percentage increase occurs only after the next verified architecture
gate is remote-locked.

MVP / Blaze progress remains independently tracked.
