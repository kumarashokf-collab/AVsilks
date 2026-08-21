# AV Silks Canonical Catalog Taxonomy v1

Status: FUTURE ONLY

Taxonomy version:

`1.0.0`

This document defines the stable classification contract for future
multi-category catalog work.

It does not activate categories in the current application.

## Canonical Hierarchy

The future hierarchy is:

Category
-> Subcategory
-> Product Type
-> Attribute Set
-> Product
-> Variant

## Identifier Rules

Machine identifiers must:

- use lower-case kebab-case
- remain language-neutral
- remain stable after publication
- never be derived from translated display labels
- avoid ambiguous globally reused product-type IDs

Display text must use translation keys.

Example:

Machine ID:

`mens-wear`

Translation key:

`catalog.category.mensWear`

## Ordering

Category order is explicit and deterministic:

10 — Sarees
20 — Women's Wear
30 — Men's Wear
40 — Kids' Wear
50 — Fabrics
60 — Accessories

Subcategory ordering is also explicit.

UI ordering should eventually consume these numeric order values instead
of hard-coded component position.

## Activation

Every future category, subcategory, and product type is currently:

`enabledByDefault: false`

This prevents architecture planning from being mistaken for runtime
activation.

Future activation requires a separate approved implementation phase.

## Attribute-Set Binding

Canonical attribute-set IDs currently allowed by the architecture are:

- `saree`
- `womens-top`
- `mens-apparel`
- `kids-apparel`
- `fabric`
- `accessory`

Product types reference these stable attribute-set IDs.

Detailed attribute validation remains a separate future gate.

## Sarees

Future saree taxonomy supports:

- silk
- handloom
- natural-fabric groupings

Product types include:

- silk saree
- Kanchipuram saree
- Dharmavaram saree
- handloom saree
- Pochampally saree
- cotton saree
- linen saree
- organza saree

This does not replace the current MVP product model.

## Women's Wear

Future groups include:

- tops
- ethnic
- western

Examples include:

- tops
- tunics
- kurtas / kurtis
- salwar suits
- lehengas
- blouses
- dupattas
- dresses
- bottoms

## Men's Wear

Future groups include:

- tops
- ethnic
- bottoms

Examples include:

- shirts
- T-shirts
- kurtas
- dhoti / veshti
- ethnic sets
- jackets
- trousers

## Kids' Wear

Future groups include:

- girls
- boys
- ethnic
- infant

Examples include:

- girls dresses
- girls tops
- boys shirts
- boys T-shirts
- kids ethnic sets
- infant wear

## Fabrics

Future fabric types include:

- silk
- cotton
- linen
- handloom
- blouse piece

## Accessories

Future textile accessories include:

- stoles
- scarves
- shawls
- traditional accessories

## Translation Architecture

Taxonomy JSON stores only stable translation keys.

Actual English, Telugu, Hindi, Tamil, Kannada labels must be supplied by
the future multilingual implementation layer.

Translated strings are not database IDs.

## Versioning Rule

`taxonomyVersion` identifies the taxonomy contract.

Future incompatible taxonomy changes require an explicit version change
and migration review.

Do not silently repurpose an existing stable ID for a different meaning.

## Security Boundary

This taxonomy contains:

- no credentials
- no API keys
- no customer data
- no payment data
- no runtime permissions
- no Firebase deployment behavior

## Blaze Priority

Blaze production-readiness remains P0.

If explicit Blaze/billing approval arrives, complete only the current
atomic documentation checkpoint, push it, verify SHA lock, return to the
release branch, and resume Blaze Stage 1.

Do not begin another future architecture gate.
