# AV Silks Variant & Inventory Architecture v1

Status: FUTURE ONLY

## Inventory modes

`single-sku`
- product owns SKU, stock and reservedStock
- useful for unique/fixed products such as many sarees

`variant-sku`
- each sellable variant owns SKU, stock and reservedStock
- useful for size/color apparel such as Men's, Women's Tops and Kids wear

A product must have exactly one inventory authority.

## Identity

`variantId` is stable and immutable.
SKU is globally unique and must not be reused after archive.
Translated labels must never become technical identities.

## Stock invariants

- stock >= 0
- reservedStock >= 0
- reservedStock <= stock
- availableStock = stock - reservedStock
- availableStock is derived, never a second source of truth

## Reservation transitions

Reserve:
- stock unchanged
- reservedStock increases

Release:
- stock unchanged
- reservedStock decreases

Consume:
- stock decreases
- reservedStock decreases

Future implementation must make these transitions transactional,
idempotent, concurrency-safe and server-authoritative.

## Variant lifecycle

`draft -> active -> inactive -> archived`

Archived variant identities and SKUs are not silently reused.

## Overrides

A variant may later override:
- price
- sale price
- primary image

Pricing remains server-authoritative.
Detailed pricing rules belong to A-FUTURE-08.

## Category compatibility

Sarees are not forced to have variants.
Size/color apparel may use variant-sku.
Government Handloom provenance remains independent of inventory mode.

## Safety boundary

This file changes no backend, frontend runtime, Firestore schema,
Firebase configuration or deployment.

Blaze remains P0.
