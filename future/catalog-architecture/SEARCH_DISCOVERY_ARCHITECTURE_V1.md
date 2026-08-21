# AV Silks Search & Discovery Architecture v1

Status: FUTURE ONLY

## Goal

Future discovery must support Sarees, Women's Wear, Men's Wear,
Kids' Wear, Fabrics and Accessories without hard-coded category search.

## Languages

Architecture supports:

- English
- Telugu
- Hindi
- Tamil
- Kannada

Machine taxonomy IDs remain language-neutral.
Translated labels are display/search inputs, not database authority.

## Search pipeline

Conceptual deterministic pipeline:

1. locale normalization
2. multilingual alias expansion
3. natural-language filter parsing
4. fuzzy text matching
5. structured filters
6. authoritative availability/provenance filtering
7. deterministic ranking
8. stable bounded pagination

## Searchable data

Future searchable fields may include:

- product name
- multilingual aliases
- category
- subcategory
- product type
- fabric
- color
- occasion
- tags

Category-specific attribute discovery must use approved attribute sets.

## Facets

Approved future facet families:

- category
- subcategory
- product type
- size
- fabric
- color
- occasion
- price
- availability
- provenance

Unknown filter keys fail closed.

The client must never obtain arbitrary database-field query power.

## Natural-language filters

The current deterministic natural-language-filter concept may later be
extended to the future taxonomy.

Examples conceptually include:

- silk sarees under a price
- blue men's shirts in stock
- kids ethnic wear
- handloom items with provenance

Parsing remains constrained by approved filter keys.

## Fuzzy and multilingual behavior

Future discovery may reuse normalized aliases and bounded fuzzy matching.

Fuzzy matching must not silently change authoritative category,
inventory, price, or provenance state.

## Availability

Availability is derived from authoritative inventory architecture.

For variant products, parent availability may derive from eligible
sellable variants.

Client-provided availability flags are not authoritative.

## Provenance discovery

A provenance filter may expose only approved public eligibility/status.

Commerce product identity remains separate from public provenance
identity.

## Ranking

Default ranking is deterministic and does not require personal tracking
or an external LLM.

Future personalization, if ever introduced, requires a separate privacy
and architecture review.

## Pagination

Default future page size: 24.

Maximum architecture limit: 50.

Ordering must be stable so page boundaries do not change unpredictably
within the same query snapshot.

## Safety boundary

This architecture changes no backend, frontend runtime, Firestore,
Firebase configuration, search deployment or production behavior.

Blaze production-readiness remains P0.
