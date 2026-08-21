# AV Silks Future Query, Filters, Facets & Sorting Architecture v1

Status: FUTURE-ONLY / SEARCH REQUEST DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a secure, provider-neutral future AV Silks search-request contract for:

- query parsing;
- filtering;
- facets;
- sorting;
- pagination;
- multilingual values;
- vendor/provenance-aware discovery.

This architecture does not change the current search UI/API or create any search
provider configuration.

## 2. Query Request Contract

A future search request may conceptually contain:

- query text;
- requested locale;
- filters;
- facet requests;
- sort mode;
- pagination cursor;
- page size;
- approved search context.

Client input is untrusted.

The backend/search boundary must validate and canonicalize every field.

## 3. Server-Controlled Search Schema

Clients must not submit arbitrary provider field names or provider-native query DSL.

The server should map approved public request keys to internal search capabilities.

Conceptual rule:

`Public Search Contract -> Validation -> Internal Search Model -> Provider Adapter`

This prevents provider-specific injection and accidental private-field access.

## 4. Query Text Validation

Future query validation should define:

- maximum query length;
- maximum token count;
- Unicode validation;
- normalization;
- allowed control-character policy;
- empty-query behavior;
- expansion budget.

An oversized or pathological query must fail safely.

## 5. Empty Query Boundary

Empty search text may support controlled browsing/discovery.

An empty query must not mean unrestricted access to private index fields.

Publication, vendor and authorization rules still apply.

## 6. Query Canonicalization

Before provider execution, the server should construct a canonical internal query.

Canonicalization may include:

- normalized text;
- locale/script hints;
- validated filter objects;
- validated facet names;
- approved sort mode;
- bounded page size;
- pagination state.

Canonicalization must be deterministic.

## 7. Filter Allowlist

Only explicitly approved filters may be accepted.

Possible future public filter concepts include:

- category;
- subcategory;
- fabric/material;
- color;
- pattern/design;
- occasion/style;
- price range;
- availability class;
- rating range;
- approved vendor/store;
- approved public provenance attributes.

Exact filters depend on the future catalog schema.

## 8. Unknown Filter Policy

Unknown, private or unsupported filter keys should fail validation rather than
being passed directly to a search provider.

Provider-internal fields must never become client-selectable accidentally.

## 9. Filter Type Validation

Every filter requires a defined type.

Examples:

- enum/string IDs;
- arrays of approved IDs;
- integer minor-unit range;
- numeric rating range;
- boolean/public-state values.

Type coercion must be deliberate.

Malformed filter values must not silently broaden a query.

## 10. Stable Filter IDs

Filter logic should prefer stable canonical IDs over translated display labels.

For example, a category or color may have:

- stable internal/public filter ID;
- English label;
- Telugu label;
- Hindi label;
- Tamil label;
- Kannada label.

Changing translation text must not change filter identity.

## 11. Multilingual Filter Labels

Display labels may be localized for:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

The search request should send stable values/IDs rather than relying on localized
label text as authority.

## 12. Multi-Select Semantics

Multi-select filter behavior must be explicit.

A future filter definition should declare whether multiple selected values use:

- OR within one facet;
- AND within one facet;
- another reviewed rule.

The UI and backend must share the same semantics.

## 13. Cross-Filter Semantics

Different filter groups will commonly combine with AND semantics.

Conceptually:

`category AND fabric AND (color A OR color B)`

Exact semantics must be encoded in the internal query model, not guessed by the
provider adapter.

## 14. Category Filtering

Category filters must derive from the approved catalog taxonomy.

Search must reject or safely handle:

- nonexistent category IDs;
- inactive categories;
- private categories;
- conflicting hierarchy constraints.

Category filtering must not create a second independent taxonomy.

## 15. Attribute Filtering

Only catalog attributes classified as public/filterable may become public filters.

Private/internal attributes must never be queryable through public search.

Attribute type and allowed values derive from the authoritative catalog schema.

## 16. Price Filter Boundary

Price filtering may use a derived search price projection.

Money should use integer minor units where applicable.

Search price filtering is discovery-only.

Checkout/order pricing must still re-resolve authoritative server-side price.

## 17. Price Range Validation

A future price range filter must validate:

- integer values;
- non-negative values;
- minimum <= maximum;
- configured upper bounds where needed;
- currency/context compatibility.

Malformed ranges must not generate provider-specific raw expressions.

## 18. Availability Filter Boundary

Search may expose a coarse approved availability filter.

It must not represent exact authoritative inventory.

Search filtering must never reserve or release stock.

Inventory truth remains in the inventory domain.

## 19. Rating Filter Boundary

If rating filters are offered, they should use approved public aggregates.

Private review moderation data must not enter public filters/facets.

Rating values require bounded validation.

## 20. Vendor Filter Boundary

Future marketplace search may allow filtering by approved public vendor/store.

The filter must respect:

- vendor approval;
- suspension;
- tenant isolation;
- product publication;
- public visibility.

Private vendor IDs or KYC/settlement fields must never become public facets.

## 21. Provenance Filter Boundary

Approved public Handloom provenance concepts may later become filters.

Examples could include approved:

- weaving region;
- craft technique;
- cooperative/public attribution;
- public craft classification.

No private provenance evidence, artisan-private data or government identity data
may enter a public facet.

## 22. Facet Purpose

Facets help users understand available refinement options.

A facet may conceptually return:

- stable value ID;
- localized display label;
- result count;
- selected state where needed.

Facet output is a derived discovery view.

## 23. Facet Allowlist

Clients may request only approved facets.

A server-side facet registry should define:

- facet key;
- underlying search field;
- type;
- public/private classification;
- localization source;
- maximum returned values;
- ordering rule.

Arbitrary provider facets must not be exposed.

## 24. Facet Count Privacy

Facet counts must never reveal private/draft/suspended content.

Counts should be computed only over the caller's authorized/public searchable set.

A count itself can leak information and must respect visibility boundaries.

## 25. Self-Filtering Facet Semantics

Future implementation must explicitly decide how facet counts behave when that
same facet already has selected values.

Common approaches include:

- contextual counts after all active filters;
- self-excluding counts for easier multi-selection.

The selected behavior must be consistent across UI, backend and provider adapter.

## 26. Facet Cardinality Limits

High-cardinality fields require limits.

Unbounded facets may cause:

- latency;
- provider cost;
- oversized responses;
- data exposure.

Facet value count and response size must be bounded.

## 27. Facet Ordering

Facet values may be ordered by approved rules such as:

- configured business order;
- result count;
- alphabetical/locale-aware label order.

Ordering must be deterministic for equivalent requests.

## 28. Locale-Aware Facet Display

Facet identity and display are separate.

Conceptual model:

`stableFacetValueId -> localized label`

Kannada `kn`, Telugu `te`, Hindi `hi`, Tamil `ta` and English `en` labels may
differ while referring to the same canonical filter value.

## 29. Sorting Allowlist

Sort modes must be explicitly allowlisted.

Possible future modes may include:

- relevance;
- newest;
- price low-to-high;
- price high-to-low;
- rating;
- popularity;
- approved merchandising order.

Clients must not submit arbitrary provider sort expressions.

## 30. Relevance as Default

For non-empty search queries, relevance should normally remain the default unless
a reviewed product decision specifies otherwise.

Sorting by another field must not change publication/security boundaries.

## 31. Price Sorting Boundary

Price sorting may use the same derived search price snapshot used for discovery.

It remains non-authoritative for checkout.

Products with missing/invalid derived price data require deterministic handling.

## 32. Rating Sorting Boundary

Rating sorting should use approved aggregate values only.

A minimum review-count policy may later be considered to avoid misleading ranking.

Raw/private review data must not be used directly.

## 33. Popularity Sorting Boundary

Popularity must have a defined, privacy-safe source.

Possible future aggregates could use approved:

- public sales aggregate;
- product views;
- search interactions;
- wishlist signals.

Behavioral signals require privacy, anti-abuse and freshness controls.

## 34. Newest Sorting Boundary

Newest sorting must define which timestamp is authoritative for discovery.

Possible candidates include:

- publication timestamp;
- approved catalog activation timestamp.

Provider ingestion timestamp must not automatically become business meaning.

## 35. Merchandising Sort Boundary

Platform merchandising may influence discovery only through explicit,
authorized configuration.

Paid/pinned/promoted ordering must remain distinguishable from organic relevance
where required by policy/business rules.

This gate defines only the sorting boundary; detailed ranking design belongs to
the next relevance gate.

## 36. Deterministic Tie-Breaking

Every non-random sort should define deterministic tie-breaking.

Conceptually:

`primary sort -> secondary trusted field -> canonical product ID`

Stable tie-breaking helps pagination and reproducible testing.

## 37. Pagination Contract

Future search should expose bounded pagination.

A request may include:

- page size;
- opaque cursor/token.

The client must not construct trusted provider pagination state manually.

## 38. Page Size Limits

Page size requires server-controlled minimum/maximum limits.

Excessive page sizes must be rejected or safely capped according to the future
API contract.

This protects latency, memory, provider cost and abuse boundaries.

## 39. Cursor Pagination

Cursor/search-after style pagination should be preferred where provider capability
and deterministic sorting support it.

Opaque cursors must not expose:

- secrets;
- provider credentials;
- private index names;
- private record data.

## 40. Cursor Integrity

A pagination cursor should bind to relevant search state.

Future implementation may protect integrity through:

- opaque provider-safe token;
- signed/validated application token;
- server-managed state.

A cursor from one incompatible query/sort context must not silently authorize
another context.

## 41. Deep Pagination Boundary

Unbounded deep pagination should be avoided.

Future architecture should define:

- maximum reachable depth;
- cursor strategy;
- fallback/reformulation behavior;
- analytics needs.

Search is not intended as a bulk data-export API.

## 42. Stable Result Ordering

Equivalent validated requests against the same index/version should provide
predictable ordering subject to documented freshness changes.

Random instability makes cursor pagination and relevance testing unreliable.

## 43. Index Version and Cursor Boundary

A cursor created against one index/schema version may become invalid after an
approved index switch.

Future API behavior must define safe expiration/retry rather than returning
corrupted mixed-version results.

## 44. Filter and Sort Injection Protection

Never concatenate raw client filter/sort text into provider query syntax.

The adapter should receive structured, validated internal objects.

Provider-specific escaping remains inside the provider adapter.

## 45. Query Complexity Budget

Future search requests require a bounded complexity budget.

Inputs contributing to complexity include:

- token count;
- number of filters;
- values per filter;
- number of requested facets;
- facet cardinality;
- query expansion variants;
- page size.

Excessive complexity must fail safely.

## 46. Result Projection Boundary

Search results should return only approved public discovery fields.

Filters/facets/sorts must not cause additional private fields to appear in the
response.

Authorization and field projection remain explicit.

## 47. Error Contract

Future search errors should use safe application-level error responses.

Errors may distinguish:

- invalid query;
- unsupported filter;
- invalid filter value;
- unsupported facet;
- unsupported sort;
- invalid/expired cursor;
- request too complex;
- provider unavailable.

Provider internals, credentials and private index names must not leak.

## 48. Provider Neutrality

The internal query model must remain independent of:

- Algolia syntax;
- Elasticsearch/OpenSearch Query DSL;
- another provider's proprietary filter language.

A provider adapter translates the validated internal model.

## 49. Search Cache Boundary

If caching is later added, cache identity must account for relevant:

- query;
- locale;
- filters;
- facets;
- sort;
- page/cursor;
- public/authorization context;
- index/schema version.

Caching must not cross tenant/private visibility boundaries.

## 50. Multi-Vendor Isolation

Future vendor-aware search must ensure:

- public search sees only public approved products;
- vendor-private search is separately authorized;
- Vendor A cannot use filters/facets to infer Vendor B private data;
- admin/owner capabilities remain explicit.

## 51. Multilingual Compatibility

Query/filter/facet architecture must remain compatible with:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`;
- mixed-language queries;
- approved transliteration expansion.

Stable filter IDs prevent translation differences from changing filter meaning.

## 52. Zero-Result Boundary

A valid filtered request may produce zero results.

Zero-result recovery may later suggest:

- removing selected filters;
- alternate spellings;
- synonyms;
- transliteration candidates;
- broader categories.

The system must not bypass a user's active security/publication constraints merely
to produce results.

Detailed recovery design belongs to a later gate.

## 53. Observability

Future privacy-safe observability may measure:

- invalid-filter rate;
- unsupported-sort rate;
- facet latency;
- query complexity rejection;
- pagination failure;
- zero-result rate;
- provider timeout.

Logs must not expose secrets, KYC or unnecessary raw customer data.

## 54. Required Future Tests

Implementation must eventually test:

- empty query;
- oversized query;
- unsupported filter;
- malformed filter type;
- multi-select OR semantics;
- cross-filter AND semantics;
- category filter;
- price integer range;
- invalid price range;
- availability non-authority;
- rating validation;
- public vendor filter;
- suspended vendor exclusion;
- approved provenance filter;
- private provenance exclusion;
- facet allowlist;
- facet count privacy;
- high-cardinality facet limit;
- localized English facet;
- localized Telugu facet;
- localized Hindi facet;
- localized Tamil facet;
- localized Kannada facet;
- unsupported sort;
- relevance sort;
- deterministic price sort;
- deterministic tie-break;
- page-size limit;
- valid cursor;
- invalid cursor;
- cursor/index-version mismatch;
- deep-pagination limit;
- filter injection attempt;
- sort injection attempt;
- query complexity limit;
- private-field projection denial;
- multi-vendor isolation;
- provider-adapter equivalence.

## 55. Activation Boundary

This document is Future architecture only.

It does NOT:

- change frontend filters;
- change current APIs;
- create Firestore indexes;
- configure a search provider;
- collect production search data;
- activate vendor-private search;
- mutate cloud resources;
- deploy anything.

Implementation requires separately approved code, tests, provider evaluation,
staging, security/privacy review, explicit production approval and rollback
verification.
