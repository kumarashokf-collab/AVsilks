# AV Silks Future Search Domain, Index & Source-of-Truth Architecture v1

Status: FUTURE-ONLY / SEARCH CORE DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define the canonical future AV Silks Search & Discovery domain, search-document
projection model, source-of-truth ownership and provider-neutral index boundary.

This architecture supports future multilingual discovery including Telugu,
English, Hindi, Tamil and Kannada.

It does not create a search index, select a provider, modify Firebase or change
the current MVP.

## 2. Core Authority Rule

`Search Index = Derived Projection`

Search is a discovery/read layer only.

It must never become authoritative for:

- final product truth;
- final price;
- live inventory;
- promotion eligibility;
- vendor approval;
- payment;
- order state;
- provenance authenticity.

Transactional operations must re-resolve authoritative AV Silks data.

## 3. Canonical Search Domain Objects

Conceptual future objects include:

- `SearchDocument`
- `SearchQuery`
- `SearchResult`
- `SearchFilter`
- `SearchFacet`
- `SearchSort`
- `SearchSuggestion`
- `SearchSynonym`
- `SearchMerchandisingRule`
- `SearchIndexVersion`
- `SearchProjectionEvent`

These objects belong to discovery, not transactional truth.

## 4. Search Document Identity

Each search document must map to a canonical AV Silks product identity.

Conceptual identity fields:

- `documentId`
- `productId`
- public slug/reference
- search schema version
- source projection version
- indexed timestamp

Search-provider object identifiers remain adapter-specific details.

A provider-specific ID must never replace the canonical AV Silks product ID.

## 5. Source-of-Truth Ownership

Authoritative ownership remains in the relevant domains:

- product/catalog truth: catalog/product domain;
- category/taxonomy: catalog domain;
- price: pricing/commerce domain;
- inventory: inventory domain;
- promotion validity: promotion/pricing domain;
- vendor ownership/approval: vendor domain;
- provenance authenticity/publication: provenance domain;
- order/payment: their respective domains.

Search receives only approved derived projections.

## 6. Searchable Product Projection

A future public search projection may contain approved fields such as:

- product ID;
- slug;
- localized title;
- localized public description;
- category/subcategory;
- approved product attributes;
- fabric/material;
- color;
- pattern/design;
- occasion/style;
- approved public vendor/store identity;
- approved public provenance attributes;
- derived price/filter snapshot;
- derived availability/searchability snapshot;
- approved public image reference;
- source/schema version.

Only deliberately public/searchable data belongs in a public index.

## 7. Price Non-Authority

Search may contain a derived price snapshot for:

- display;
- sorting;
- filtering;
- price facets.

A search price is never checkout authority.

At cart/checkout/order creation, authoritative server-side pricing must be
re-evaluated.

A stale search price must never authorize a transaction.

## 8. Inventory Non-Authority

Search may expose a coarse derived availability state.

Exact stock and reservation truth remains in the inventory domain.

Search must never:

- reserve stock;
- release stock;
- guarantee checkout availability;
- overwrite authoritative inventory.

## 9. Public Visibility Gate

Only products meeting approved public visibility conditions may enter public
search.

Future conditions may include:

- product approved;
- product active;
- category active;
- vendor approved where applicable;
- product not soft-deleted;
- publication allowed;
- required provenance publication condition satisfied where applicable.

Draft, rejected, private or suspended content must never leak through public search.

## 10. Unpublish / Removal

When public visibility is revoked, the search projection must be removed or
made non-public.

Examples:

- soft delete;
- product unpublish;
- vendor suspension;
- category disablement;
- legal/operational takedown.

Search removal does not erase historical transactional or provenance records.

## 11. Projection Pipeline

Conceptual architecture:

`Authoritative Domain -> Projection Event/Job -> Search Projection -> Search Index`

The search-provider layer must remain downstream from AV Silks authoritative data.

Projection logic must be replayable and testable.

## 12. Projection Event Model

A projection event may contain:

- stable event ID;
- product/aggregate ID;
- event type;
- source version;
- search schema version;
- timestamp;
- minimal sanitized projection data or trusted reference.

Projection events must not contain secrets or unnecessary PII.

## 13. Idempotent Indexing

Index writes must be idempotent.

Repeated processing of the same event must not produce:

- duplicate documents;
- duplicate variants;
- conflicting product identities;
- repeated destructive removals.

Stable event/source versions should make retries safe.

## 14. Out-of-Order Event Protection

Projection events may arrive late or out of order.

A stale event must not overwrite a newer accepted projection.

Future indexing logic must compare trusted source/version information before
applying changes.

Ambiguous ordering enters reconciliation instead of silent regression.

## 15. Search Schema Versioning

Search documents require an explicit schema version.

Conceptual field:

`searchSchemaVersion`

Schema evolution must define:

- compatibility;
- rebuild requirements;
- migration path;
- rollback/fallback;
- old/new index coexistence where necessary.

## 16. Versioned Index Strategy

Future providers may support versioned physical indexes.

Conceptual flow:

1. create a new index version;
2. build from trusted projections;
3. validate counts and quality;
4. run security/privacy checks;
5. switch approved read target;
6. preserve rollback capability;
7. retire old index safely.

Exact implementation depends on the future provider.

## 17. Full Rebuild

The search index must be completely rebuildable from authoritative AV Silks data.

Search-provider contents must never be the only copy of business truth.

A rebuild should verify:

- expected product count;
- public visibility;
- source versions;
- vendor eligibility;
- locale projections;
- schema version;
- privacy boundaries.

## 18. Incremental Updates

Between full rebuilds, incremental updates may handle:

- product create/update;
- approval/publication;
- unpublish/delete;
- category update;
- price projection change;
- availability projection change;
- vendor approval/suspension;
- approved provenance update.

Incremental results must remain consistent with a clean full rebuild.

## 19. Reconciliation

Future reconciliation should detect search/source drift.

Examples:

- expected public product missing;
- private product present;
- stale schema version;
- stale source version;
- suspended vendor still searchable;
- incorrect locale projection.

Reconciliation must never mutate authoritative transactional truth.

## 20. Failure Boundary

Search/index failure must degrade discovery safely.

It must never corrupt:

- catalog;
- inventory;
- pricing;
- payment;
- order;
- provenance.

A fallback catalog experience may be considered later, but it must preserve
authorization and publication rules.

## 21. Search Result Identity

Every search result must map back to a canonical product identity.

Transactional actions must use canonical trusted product data rather than
trusting arbitrary search-result fields.

## 22. Variant Boundary

Future catalog variants/SKUs may use:

- product-level indexing;
- variant-level indexing;
- hybrid indexing.

The final strategy must preserve:

- canonical product relationship;
- SKU uniqueness;
- correct filtering;
- quantity/inventory separation;
- no duplicate transactional identity.

## 23. Taxonomy Boundary

Search categories and hierarchy derive from the approved catalog taxonomy.

Search must not invent an independent conflicting category structure.

Taxonomy changes may require reindexing.

## 24. Attribute Classification

Future attributes should explicitly classify whether they are:

- searchable;
- filterable/facetable;
- sortable;
- display-only;
- private/internal.

Private/internal attributes must never leak into public search.

## 25. Multilingual Locale Projection

Initial Search & Discovery locale compatibility is:

- English — `en`
- Telugu — `te`
- Hindi — `hi`
- Tamil — `ta`
- Kannada — `kn`

Conceptual localized fields may include:

- `title.en`
- `title.te`
- `title.hi`
- `title.ta`
- `title.kn`
- `description.en`
- `description.te`
- `description.hi`
- `description.ta`
- `description.kn`

Original-language text remains preserved.

Normalized/search-derived fields must never overwrite approved source content.

## 26. Unicode Boundary

All future search text handling must be Unicode-safe.

Architecture must account for:

- Unicode normalization;
- case handling where applicable;
- punctuation;
- whitespace;
- Indic scripts;
- combining characters;
- locale-aware tokenization.

Exact linguistic rules belong to the multilingual-normalization gate.

## 27. Provenance Search Boundary

Approved public Handloom provenance fields may later assist discovery.

Possible public concepts may include:

- weaving region;
- craft/technique;
- public artisan/cooperative attribution where approved.

Search must never expose:

- customer information;
- payment/refund data;
- KYC/government identity data;
- private artisan evidence;
- private provenance evidence.

## 28. Vendor Search Boundary

Future public marketplace search must include only eligible public vendor products.

Search must respect:

- vendor approval;
- vendor suspension;
- product approval;
- tenant isolation;
- publication rules.

Vendor-private inventory, KYC, settlements or operational data must never enter
public indexes.

## 29. Ranking Data Boundary

Search documents may later contain approved ranking signals such as:

- freshness;
- popularity aggregate;
- rating aggregate;
- availability class;
- merchandising priority.

Every signal requires a known source and version.

Private behavioral data must not be copied casually into public search documents.

## 30. Analytics Separation

Search analytics is separate from index truth.

Queries/clicks may inform quality improvements, but analytics must not become
authoritative product data.

Personalized telemetry requires separately approved privacy controls.

## 31. Provider-Neutral Adapter

Core AV Silks search architecture should depend on an internal adapter contract.

Future capabilities may include:

- add/update/remove document;
- search;
- facets;
- suggestions;
- index health;
- version switch/rebuild operations where supported.

Provider SDK objects must not spread through core commerce code.

## 32. Provider Migration Boundary

Changing search providers later should be possible by rebuilding derived indexes
from authoritative AV Silks data.

Provider migration must not require rewriting product/payment/inventory truth.

This architecture selects no provider.

## 33. Environment Isolation

Development, staging and production search environments must use separate:

- credentials;
- index identifiers;
- configuration;
- endpoints;
- datasets;
- analytics scopes where applicable.

Staging must not accidentally target production indexes.

## 34. Security and Privacy

Public search indexes must never contain:

- customer name;
- phone;
- email;
- delivery address;
- payment credentials;
- refund details;
- KYC/government ID;
- private vendor credentials;
- courier credentials;
- private artisan identity evidence;
- internal fraud/security notes.

## 35. Audit Boundary

High-impact future search configuration changes may require audit.

Examples:

- schema/index activation;
- merchandising override;
- synonym activation;
- ranking-rule activation;
- public visibility override;
- provider configuration change.

Audit records must never contain secrets.

## 36. Observability

Future observability may monitor:

- indexing success/failure;
- projection lag;
- stale documents;
- missing documents;
- search latency;
- rebuild duration;
- reconciliation mismatch;
- provider errors.

Monitoring must remain privacy-safe.

## 37. Failure Rules

Fail closed or safely degrade on:

- private product exposure risk;
- vendor ownership ambiguity;
- malformed projection;
- unknown required schema version;
- stale event regression;
- cross-environment ambiguity;
- secret/PII leakage;
- provider identity mismatch.

Privacy and authorization take priority over search availability.

## 38. Required Future Tests

Implementation must eventually test:

- projection creation;
- projection update;
- product unpublish/removal;
- soft-delete removal;
- duplicate-event idempotency;
- out-of-order events;
- schema-version mismatch;
- full rebuild;
- incremental/rebuild consistency;
- reconciliation;
- price non-authority;
- inventory non-authority;
- draft/private exclusion;
- suspended-vendor exclusion;
- Kannada `kn` projection;
- Telugu `te` projection;
- Hindi `hi` projection;
- Tamil `ta` projection;
- English `en` projection;
- provenance privacy;
- environment isolation;
- secret/PII-safe indexing.

## 39. Activation Boundary

This document is Future architecture only.

It does NOT:

- create an index;
- select Algolia, Elasticsearch, OpenSearch or another provider;
- modify Firestore;
- modify product APIs;
- change frontend search;
- collect production telemetry;
- deploy anything.

Implementation requires a separately approved feature lifecycle with testing,
provider evaluation, staging, privacy/security review, explicit production
approval and rollback verification.
