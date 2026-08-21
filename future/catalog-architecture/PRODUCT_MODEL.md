# Future Product Model

Status: Architecture only.

## 1. Core

Every future product should have a universal identity and commerce core.

Conceptual structure:

- identity
- classification
- content
- pricing
- media
- attributes
- variants
- inventory
- provenance eligibility
- lifecycle
- search metadata

## 2. Classification

Use stable references:

- categoryId
- subcategoryId
- productType
- attributeSetId

Do not create separate unrelated product databases for sarees, men's
wear, kids' wear, and tops.

They should share one catalog architecture with different attribute
sets.

## 3. Attributes

Category-specific details belong under a controlled attributes object.

Examples:

Saree:
- weave
- border
- pallu
- blouseIncluded

Top:
- size
- neckline
- sleeve
- fit

Men's shirt:
- size
- fit
- collar
- sleeve

Kids:
- ageGroup
- size
- genderTarget

## 4. Variants

Future sellable variants may represent combinations such as:

Product:
Men's Cotton Shirt

Variants:
- Blue / M
- Blue / L
- White / M
- White / L

Inventory should eventually operate at sellable variant level when a
product has variants.

Products without variants may retain simple product-level inventory.

## 5. Price

Use server-authoritative pricing when implementation occurs.

Conceptually:

- base price
- sale price
- variant override
- tax policy
- shipping policy

Frontend must never become authoritative for final checkout totals.

## 6. Images

Future model should support:

- primary image
- gallery
- variant-specific image
- accessible alt text

## 7. Lifecycle

Possible future catalog lifecycle:

draft
-> pending_review
-> active
-> inactive
-> archived

Physical deletion should not be the normal business lifecycle.

## 8. Search

Future searchable document can be derived from:

- name
- category
- product type
- fabric
- color
- weave
- occasion
- tags
- multilingual aliases

## 9. Provenance

Keep commerce product identity separate from public provenance identity.

Only eligible artisan/handloom products should participate in the QR
provenance lifecycle.

## 10. Security

When implementation eventually begins:

- backend validation remains authoritative
- RBAC remains authoritative
- client-controlled server fields are rejected
- inventory mutations are transactional
- audit logging is retained
- secrets remain server-side

No part of this document activates those changes today.
