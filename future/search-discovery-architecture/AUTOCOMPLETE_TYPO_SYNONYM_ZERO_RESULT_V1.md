# AV Silks Future Autocomplete, Typo, Synonym & Zero-Result Recovery Architecture v1

Status: FUTURE-ONLY / SEARCH RECOVERY DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define provider-neutral future architecture for:

- autocomplete;
- search suggestions;
- spelling and typo tolerance;
- multilingual synonyms;
- transliteration-assisted suggestions;
- zero-result recovery;
- safe query broadening;
- abuse and privacy controls.

This document does not activate autocomplete, collect production queries or
configure a search provider.

## 2. Core Safety Principle

Search recovery exists to improve discovery.

It must never improve result count by weakening:

- authentication;
- authorization;
- publication eligibility;
- vendor isolation;
- private-field restrictions;
- provenance privacy;
- security controls.

`Recovery must not bypass security or visibility rules.`

## 3. Autocomplete Boundary

Autocomplete is a fast discovery aid separate from authoritative commerce logic.

Autocomplete suggestions must not independently authorize:

- product price;
- inventory;
- checkout;
- payment;
- vendor approval;
- provenance claims.

Suggestion selection leads into normal validated search/product resolution.

## 4. Suggestion Types

Future suggestions may include approved public types such as:

- query phrase;
- product;
- category;
- subcategory;
- brand/collection;
- approved public vendor/store;
- approved public provenance/craft concept.

Each suggestion type requires an explicit public projection contract.

## 5. Suggestion Identity

Structured suggestions should carry stable canonical references where applicable.

Examples:

- product ID;
- category ID;
- vendor/public store ID;
- provenance concept ID.

Localized display text must not become the canonical identity.

## 6. Minimum Input Boundary

Autocomplete should not necessarily execute on every empty or one-character input.

Future implementation must define:

- minimum character/token threshold;
- exceptions for approved browse behavior;
- maximum query length;
- debounce/throttle behavior;
- request-rate limits.

These controls protect latency, provider cost and enumeration risk.

## 7. Autocomplete Result Limits

Suggestion count must be bounded.

Unbounded autocomplete responses may increase:

- latency;
- cost;
- private-data inference risk;
- scraping effectiveness.

The server/provider adapter should enforce maximum suggestion counts.

## 8. Server-Controlled Suggestion Schema

Clients must not submit arbitrary provider suggestion fields or provider query DSL.

Conceptual flow:

`Autocomplete Request -> Validation -> Internal Suggestion Model -> Provider Adapter`

Only allowlisted public suggestion fields may be returned.

## 9. Multilingual Autocomplete

Initial language compatibility remains:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Autocomplete must preserve native-script quality for every supported locale.

## 10. Kannada Autocomplete

Kannada `kn` is a first-class initial search locale.

Future Kannada autocomplete tests should include:

- native Kannada prefix;
- full Kannada word;
- Kannada category term;
- Kannada product attribute;
- Kannada synonym;
- Kannada Latin transliteration candidate.

Kannada must not silently fall back to Tamil, Telugu or English semantics.

## 11. Native-Script Suggestions

For native-script input, native-script suggestions should generally receive
strong preference where relevant.

For example, a clearly Kannada-script query should not be needlessly replaced
with an unrelated English suggestion merely because English data is larger.

## 12. Mixed-Script Suggestions

Users may type mixed Latin and Indic scripts.

Autocomplete should preserve meaningful mixed tokens and may generate bounded,
locale-aware candidate suggestions.

Mixed-script handling must not assume the entire query belongs to one language.

## 13. Transliteration Suggestions

Latin-script input may represent Telugu, Hindi, Tamil or Kannada terms.

Future autocomplete may offer controlled transliteration candidates.

Transliteration remains query expansion, not translation.

Original input must be preserved.

## 14. Transliteration Confidence

Transliteration suggestions require confidence/weighting.

Low-confidence transliteration should not overwhelm:

- exact Latin matches;
- exact brands;
- SKUs;
- native-script matches.

Ambiguous candidates may be ranked lower or omitted.

## 15. Transliteration Candidate Limits

Candidate generation must be bounded.

Unlimited transliteration variants can create:

- latency;
- provider cost;
- irrelevant results;
- denial-of-service amplification.

Future implementation requires explicit candidate limits.

## 16. Typo Tolerance Purpose

Typo tolerance should help users recover from likely accidental spelling errors.

It must not silently replace every unusual term.

The original query remains available for exact matching.

## 17. Correction Candidate Model

Conceptual typo handling:

`Original Query + Correction Candidate + Confidence`

A correction is a candidate, not authoritative user intent.

The system may support an explicit "Did you mean" style interaction where useful.

## 18. Exact Identifier Protection

Typo correction must protect exact identifiers such as:

- SKU;
- product code;
- brand;
- collection;
- exact public reference.

A valid exact identifier must not be aggressively rewritten into another term.

## 19. Typo Distance Boundary

Future typo rules should define bounded edit-distance or provider-equivalent rules.

Thresholds may depend on:

- token length;
- locale;
- script;
- field type;
- confidence.

Short tokens require stronger caution because one edit can radically change meaning.

## 20. Indic-Script Typo Handling

Typo behavior for Telugu, Hindi, Tamil and Kannada requires language/script-aware
evaluation.

Latin-centric typo rules must not be blindly applied to Indic scripts.

Quality tests should include Unicode and combining-character cases.

## 21. Transliteration vs Typo Distinction

A Latin-script Indic term may be a valid transliteration rather than a typo.

Future query analysis should distinguish, where possible:

- typo candidate;
- transliteration candidate;
- exact Latin word;
- brand/proper noun.

These candidate types may use different ranking weights.

## 22. Synonym Purpose

Synonyms increase discovery recall for reviewed equivalent or related commerce terms.

Synonyms are controlled search metadata.

They are not automatic truth or automatic translation.

## 23. Synonym Registry

A future synonym record may conceptually include:

- synonym rule ID;
- concept ID;
- locale;
- source term;
- target term(s);
- directionality;
- scope;
- version;
- activation state;
- review metadata.

Synonym rules must be versionable and auditable.

## 24. Locale-Specific Synonyms

A synonym rule must explicitly declare locale applicability.

Supported initial locales:

- `en`;
- `te`;
- `hi`;
- `ta`;
- `kn`.

A Kannada synonym must not automatically be copied into Telugu/Tamil/Hindi.

## 25. Directional Synonyms

Some relationships may be directional.

Future architecture should distinguish:

- equivalent/bidirectional synonym;
- one-way expansion;
- broader-term expansion;
- narrower-term expansion.

Directionality prevents uncontrolled query broadening.

## 26. Multi-Word Synonyms

Commerce terms may contain multiple words.

Future synonym processing must define:

- phrase matching;
- token boundaries;
- overlap resolution;
- precedence;
- expansion limits.

Phrase synonyms require deterministic behavior.

## 27. Handloom Synonym Boundary

Reviewed handloom vocabulary may support synonyms for public concepts such as:

- fabric;
- weave technique;
- motif;
- region;
- border/pallu terminology;
- craft classification.

Synonym rules must never expose private provenance evidence or identity records.

## 28. Brand / Proper-Noun Synonym Safety

Brands, artisan names, vendor/store names and proper nouns need stronger control.

A similarity assumption must not automatically create a synonym.

Business-reviewed aliases may be supported explicitly.

## 29. Synonym Versioning

Active synonym configuration should have a version.

A version change should support:

- offline validation;
- relevance tests;
- staging;
- audit;
- rollback.

Provider-specific synonym configuration remains adapter-level implementation.

## 30. Synonym Conflict Resolution

Conflicting synonym rules require deterministic precedence.

Potential dimensions include:

- exact locale;
- exact scoped rule;
- explicit priority;
- version;
- stable rule ID.

Conflicts must not be silently resolved differently across providers.

## 31. Zero-Result Definition

A zero-result query is a valid search request that returns no eligible results
after required publication/security/filter rules.

Zero results do not justify bypassing those rules.

## 32. Zero-Result Recovery Order

Future recovery should use a controlled sequence.

Conceptual order:

1. preserve original validated query;
2. confirm normalization;
3. evaluate typo candidate;
4. evaluate approved synonym candidate;
5. evaluate transliteration candidate;
6. evaluate spelling/phrase alternatives;
7. suggest broader category or related concept;
8. optionally suggest user-controlled filter relaxation.

Each stage must preserve security/public visibility.

## 33. Preserve Active Filters

Zero-result recovery must not silently remove active user filters.

If relaxing a filter may help, the system should surface it as an explicit
suggestion/action.

The user should be able to understand that the search scope is being broadened.

## 34. Security Filters Are Never Relaxed

Security and publication filters are not user-facing convenience filters.

Recovery must never relax:

- public/private visibility;
- vendor authorization;
- tenant isolation;
- suspension status;
- product approval;
- provenance privacy.

These remain mandatory.

## 35. Filter Relaxation Suggestions

Future UX may suggest examples such as:

- remove one color;
- broaden price range;
- remove one style attribute;
- search parent category.

Such relaxation should be explicit and deterministic.

No automatic silent broadening should alter user intent unpredictably.

## 36. Query Broadening Boundary

Broader-term recovery may help where exact intent is too narrow.

Broadening must be:

- bounded;
- versioned/configured;
- measurable;
- clearly separated from exact matching.

Broad matches should generally rank below stronger direct matches.

## 37. Category Recovery

A zero-result product query may surface an approved related category.

Category suggestions must derive from the canonical taxonomy.

Search must not invent an independent category hierarchy.

## 38. Similar-Concept Recovery

Future recovery may surface related approved commerce concepts.

Concept relationships require reviewed metadata.

A similarity relationship must not imply identical product facts.

## 39. No Hidden Product Resurrection

Recovery may not surface:

- unpublished products;
- draft products;
- soft-deleted products;
- suspended vendor products;
- unauthorized/private records.

A result hidden by publication/security remains hidden in every recovery stage.

## 40. Suggestion Privacy

Autocomplete and zero-result suggestions must only use approved public discovery data.

They must never expose:

- customer information;
- payment/refund data;
- KYC/government identity data;
- vendor-private operational data;
- private artisan evidence;
- internal risk/security notes.

## 41. Enumeration Resistance

Autocomplete can become an enumeration endpoint.

Future controls should consider:

- minimum input;
- rate limiting;
- response limits;
- stable public projection only;
- no private counts;
- no existence hints for protected records.

A protected product/vendor must not be discoverable through timing or suggestion text.

## 42. Scraping Resistance

Future architecture may apply proportionate controls such as:

- request rate limits;
- bot/abuse detection;
- bounded page/suggestion size;
- query complexity limits;
- caching.

Scraping controls must not rely on secrets embedded in the frontend.

## 43. Suggestion Caching

Autocomplete caching may improve latency.

Cache identity should consider relevant:

- normalized prefix/query;
- locale;
- public search context;
- search/index version;
- synonym version;
- visibility context.

Private/tenant-specific suggestions must never cross cache boundaries.

## 44. Cache Freshness

Cached suggestions can become stale.

Future policy should define:

- TTL;
- invalidation;
- index/schema version binding;
- public-visibility changes;
- vendor suspension handling.

Security/publication takedowns require prompt removal behavior.

## 45. Deterministic Suggestions

Equivalent requests against the same relevant versions should produce predictable
suggestions, subject to documented freshness changes.

Deterministic behavior improves testing and debugging.

## 46. Popular Query Suggestions Boundary

If popular-query suggestions are introduced, they require privacy and abuse controls.

Raw customer queries must not automatically become public suggestions.

Future system should consider:

- aggregation thresholds;
- sensitive-query filtering;
- abuse/spam filtering;
- retention rules;
- human/business review where appropriate.

## 47. Trending Suggestions Boundary

Trending discovery may use approved aggregate signals.

A trend must not be driven directly by a small number of identifiable users.

Anti-manipulation and minimum-volume rules should be considered.

## 48. Personal Search History Boundary

Using an individual user's prior searches is personalization.

It is not required by core autocomplete.

If activated later it requires:

- explicit privacy approval;
- retention policy;
- user-context authorization;
- deletion/controls where required;
- separate personalization architecture.

## 49. Analytics Boundary

Privacy-safe metrics may include:

- autocomplete latency;
- suggestion acceptance rate;
- typo-recovery rate;
- zero-result rate;
- recovery success;
- locale;
- broad candidate type.

Raw-query retention requires separate privacy review.

## 50. Sensitive Query Handling

Queries may accidentally contain personal or sensitive information.

Logs/analytics should minimize or redact raw query storage where possible.

Search telemetry must never intentionally collect:

- passwords;
- payment credentials;
- KYC/government identity data;
- authentication tokens.

## 51. Provider Neutrality

Core suggestion/recovery logic must remain provider-neutral.

An internal adapter may expose capabilities such as:

- prefix suggestions;
- typo candidates;
- synonym expansion;
- facet/category suggestions;
- recovery search.

Provider-specific syntax remains inside the adapter.

## 52. Provider Capability Differences

Providers may implement autocomplete, typo handling or synonyms differently.

Future adapters must document differences.

Missing capability must not silently alter security or visibility semantics.

## 53. Failure Behavior

Fail safely on:

- malformed query;
- unsupported locale;
- invalid suggestion type;
- excessive expansion;
- provider timeout;
- private-data exposure risk;
- unknown synonym version;
- incompatible index version.

Failure should fall back to normal safe search where possible, not weaker security.

## 54. Observability

Future privacy-safe observability may track:

- autocomplete latency;
- provider failures;
- candidate expansion count;
- typo corrections;
- transliteration attempts;
- synonym version errors;
- zero-result rate;
- recovery success;
- abuse/rate-limit events.

Logs must not expose secrets or unnecessary PII.

## 55. Language Quality Evaluation

Autocomplete and recovery quality must be evaluated separately for:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

A strong global average must not hide poor performance in one locale.

## 56. Kannada Quality Evaluation

Kannada `kn` tests should explicitly measure:

- native prefix suggestions;
- full native query;
- Kannada synonym;
- Kannada typo candidate;
- Latin-to-Kannada transliteration candidate;
- ambiguous Latin input;
- zero-result Kannada recovery;
- Kannada category recovery.

## 57. Required Future Tests

Implementation must eventually test:

- empty autocomplete input;
- minimum-character boundary;
- oversized prefix;
- rate limiting;
- result-count limit;
- exact product suggestion;
- category suggestion;
- public vendor suggestion;
- private vendor exclusion;
- native English autocomplete;
- native Telugu autocomplete;
- native Hindi autocomplete;
- native Tamil autocomplete;
- native Kannada autocomplete;
- Kannada transliteration suggestion;
- mixed-script suggestion;
- exact SKU protection;
- typo candidate generation;
- short-token typo safety;
- Indic-script typo handling;
- typo vs transliteration distinction;
- locale-specific synonym;
- directional synonym;
- multi-word synonym;
- synonym conflict resolution;
- synonym version rollback;
- zero-result recovery sequence;
- active-filter preservation;
- security-filter non-relaxation;
- explicit filter relaxation suggestion;
- unpublished-product exclusion;
- suspended-vendor exclusion;
- public provenance privacy;
- enumeration resistance;
- cache isolation;
- cache invalidation after unpublish;
- popular-query privacy threshold;
- sensitive-query logging safety;
- provider capability fallback.

## 58. Activation Boundary

This document is Future architecture only.

It does NOT:

- activate autocomplete;
- enable typo correction in production;
- create synonym rules in a provider;
- collect production customer query history;
- create recommendation infrastructure;
- modify Firebase;
- configure a search service;
- deploy anything.

Implementation requires separately approved code, synthetic/reviewed quality data,
tests, privacy/security review, staging, explicit production approval and rollback
verification.
