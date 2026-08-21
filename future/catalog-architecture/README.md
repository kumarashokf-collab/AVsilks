# AV Silks Future Multi-Category Catalog Architecture

Status: FUTURE ONLY — NOT PART OF CURRENT MVP RUNTIME.

## Purpose

This folder preserves a scalable architecture for expanding AV Silks
beyond the current saree-first commerce model.

Potential future domains include:

- Sarees
- Women's Wear
- Men's Wear
- Kids' Wear
- Tops
- Ethnic Wear
- Fabrics
- Accessories

This architecture is intentionally data-driven so future categories do
not require separate hard-coded applications.

## Strict Isolation Boundary

Until this architecture is explicitly activated in a future phase:

- Do not import anything from this folder into frontend runtime code.
- Do not import anything from this folder into backend runtime code.
- Do not create Firestore collections from these documents.
- Do not modify Firebase rules because of these documents.
- Do not deploy anything from this folder.
- Do not place credentials, secrets, API keys, customer data, or
  production data in this folder.
- Do not merge this future branch into the active release merely because
  the architecture exists.

The active MVP and Blaze production-readiness work remain independent.

## Architecture Principle

Use:

Category
  -> Subcategory
    -> Product Type
      -> Attribute Set
        -> Product
          -> Variants
            -> Inventory

A product should keep a small universal core while category-specific
details live in validated attribute sets.

## Universal Product Core

Future products should share stable fields such as:

- productId
- name
- slug
- categoryId
- subcategoryId
- productType
- brandId
- description
- status
- price
- salePrice
- currency
- images
- attributes
- variants
- tags
- searchTerms
- provenanceEligibility
- createdAt
- updatedAt

This is an architecture document only. It is not the current database
schema.

## Stable Category IDs

Machine IDs should remain stable and language-neutral.

Example:

`mens-wear`

Display names can later be translated independently:

- English: Men's Wear
- Telugu: పురుషుల దుస్తులు
- Hindi
- Tamil
- Kannada

Never use translated labels as database identifiers.

## Variants

Future variant architecture may support combinations such as:

- size
- color
- pattern
- fit
- length

Each sellable variant should eventually have its own:

- variantId
- SKU
- stock
- reservedStock
- price override if required
- image override if required
- active state

## Handloom / Provenance Compatibility

Government Handloom + QR provenance remains a first-class capability.

Future categories must not assume every product has provenance.

Use an eligibility concept such as:

- required
- eligible
- not_applicable

Handloom sarees, fabrics, ethnic products, or artisan-made items may
later attach provenance through the existing protected provenance
architecture.

## Search Compatibility

Future catalog design should support:

- multilingual text
- fuzzy aliases
- category filters
- product-type filters
- price filters
- size filters
- fabric filters
- color filters
- occasion filters
- availability
- provenance availability

Search attributes should derive from catalog data rather than UI
hard-coding.

## White-Label Compatibility

Category labels, ordering, visibility, branding, and translations should
eventually be configurable per client without changing the universal
product model.

## Activation Rule

This architecture may be implemented only in an explicitly approved
future roadmap phase.

Blaze production-readiness remains higher priority than this folder.
