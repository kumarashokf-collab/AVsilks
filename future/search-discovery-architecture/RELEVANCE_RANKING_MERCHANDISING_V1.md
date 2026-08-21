# AV Silks Future Relevance Ranking & Merchandising Architecture v1

Status: FUTURE-ONLY / SEARCH RANKING DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a provider-neutral relevance and merchandising architecture for future
AV Silks Search & Discovery.

This design covers organic ranking, multilingual match quality, business signals,
controlled merchandising, sponsored-result boundaries, auditability, anti-gaming
and deterministic ranking.

It does not activate production ranking or advertising.

## 2. Core Ranking Authority Boundary

Search ranking is a discovery function.

Ranking must never change authoritative:

- product price;
- inventory;
- payment eligibility;
- order state;
- vendor approval;
- provenance authenticity.

A highly ranked result receives visibility only.

It does not gain transactional authority.

## 3. Organic Relevance

Organic relevance should primarily reflect how well an approved public product
matches validated user intent.

Potential organic signals may include:

- exact query match;
- normalized query match;
- field-level text relevance;
- category/attribute relevance;
- approved synonym match;
- transliteration match;
- typo-corrected match;
- freshness;
- popularity aggregate;
- rating aggregate;
- availability class.

All signals require explicit source and version.

## 4. Match Quality Tiers

Future multilingual matching should distinguish quality tiers.

A conceptual ordering may favor:

1. exact native-script / exact identifier match;
2. exact normalized match;
3. strong field-level semantic/term match;
4. approved synonym match;
5. controlled transliteration match;
6. typo-corrected match;
7. broader fallback expansion.

Actual weights require measured relevance evaluation.

## 5. Exact Identifier Protection

Trusted exact identifiers may include:

- SKU;
- product code;
- exact brand;
- exact collection name;
- approved artisan/cooperative public identifier where applicable.

Aggressive stemming, typo correction or transliteration must not routinely
override a valid exact identifier match.

## 6. Field Weighting

Future ranking may weight approved searchable fields differently.

Possible higher-value fields may include:

- title;
- category;
- product type;
- key approved attributes.

Possible lower-value fields may include:

- long description;
- broad tags.

Weights must be versioned and relevance-tested.

## 7. Multilingual Ranking

Ranking must support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

No supported language should be treated as inherently lower-quality solely
because its script differs from English.

Locale-specific quality must be measured independently.

## 8. Native-Script Priority

Where user intent is clear, strong native-script matches should remain strong
signals.

For Telugu, Hindi, Tamil and Kannada queries, Latin transliteration expansion
must not automatically outrank a clearly correct native-script match.

## 9. Transliteration Weighting

Transliteration matches are derived candidates.

Future ranking should consider:

- transliteration confidence;
- user/app locale hint;
- native-script availability;
- ambiguity;
- match field;
- query context.

A guessed transliteration must never be treated as guaranteed semantic truth.

## 10. Synonym Ranking

Approved synonyms may increase recall.

Ranking should distinguish:

- canonical/exact term match;
- approved synonym match;
- broader concept expansion.

Synonym rules must be versioned and reviewed.

## 11. Typo-Tolerance Ranking

Typo-corrected results should retain information that correction occurred.

A weak typo candidate should not displace a strong exact match.

Typo tolerance must be bounded to prevent irrelevant result inflation.

## 12. Query Intent Boundary

Future search may infer broad intent classes such as:

- exact product lookup;
- category discovery;
- attribute discovery;
- brand/store lookup;
- provenance/craft discovery.

Intent inference remains a ranking aid.

It must not bypass filters, authorization or publication rules.

## 13. Freshness Signal

Freshness may be an approved ranking signal.

Its business meaning must be explicitly defined, for example:

- publication time;
- approved activation time.

Provider ingestion timestamp must not silently become the freshness authority.

## 14. Popularity Signal

Popularity may influence ranking only through an approved aggregate.

Potential sources may include:

- privacy-safe product views;
- purchases;
- wishlists;
- search interactions.

The source, time window, anti-abuse controls and decay model must be defined.

## 15. Rating Signal

Public approved rating aggregates may influence ranking.

Potential considerations include:

- average rating;
- review count;
- minimum evidence threshold;
- recency.

Raw/private moderation data must not enter public ranking.

## 16. Availability Signal

A coarse derived availability class may influence ranking.

Exact inventory remains authoritative elsewhere.

Ranking must not promise stock or reserve inventory.

## 17. Price Boundary

Price may be used for explicit user sorting or approved discovery logic.

Ranking must never fabricate or alter authoritative price.

Checkout must re-resolve server-authoritative pricing.

## 18. Provenance Relevance

Approved public Handloom provenance concepts may contribute to relevance where
they match user intent.

Possible concepts include:

- weaving region;
- technique;
- craft;
- approved public artisan/cooperative attribution.

Private provenance evidence must never influence public ranking through exposed
fields.

## 19. Vendor Ranking Boundary

Future marketplace ranking must only consider approved public vendor products.

Vendor visibility must respect:

- approval;
- suspension;
- product publication;
- tenant isolation.

Private KYC, settlement or operational data must never become public ranking
signals.

## 20. Organic vs Merchandising Separation

Organic relevance and platform merchandising are separate concepts.

Conceptually:

`Organic Score + Explicit Authorized Merchandising Layer`

The architecture must preserve enough metadata to explain whether an item moved
because of organic relevance or a merchandising rule.

## 21. Merchandising Authority

Only explicitly authorized platform/admin/owner capabilities may create or
activate merchandising rules.

Client users and ordinary vendors must never directly control trusted global
ranking configuration.

Future vendor-sponsored capabilities require a separate approved policy.

## 22. Merchandising Actions

Future controlled actions may include:

- pin;
- boost;
- bury;
- category campaign;
- collection campaign;
- time-bounded promotion;
- locale-specific merchandising.

Every action requires explicit scope.

## 23. Pinning Boundary

A pinned result may receive a controlled placement only if it remains eligible
for the current public query context.

Pinning must not resurrect:

- unpublished products;
- suspended vendor products;
- deleted products;
- unauthorized/private products.

Security/publication gates always win.

## 24. Boosting Boundary

Boosts may influence ranking within defined limits.

A boost must have:

- rule ID;
- scope;
- activation state;
- start/end where applicable;
- authorized actor;
- version;
- audit record.

Unbounded hidden boosts should be avoided.

## 25. Burying Boundary

Bury rules may lower discovery priority without deleting authoritative product
records.

Legal/security takedown or unpublish should use the appropriate publication
workflow rather than relying only on burying.

## 26. Sponsored Results Boundary

If paid/sponsored discovery is ever introduced, sponsored status must remain
distinct from organic relevance.

Future design should support:

- explicit sponsorship metadata;
- business-policy disclosure requirements;
- scope;
- time window;
- auditability;
- budget/commercial control outside core ranking.

This document does not enable advertising.

## 27. Paid Ranking Safety

Payment for promotion must never:

- bypass publication approval;
- bypass vendor approval;
- expose private products;
- alter checkout price;
- alter provenance truth;
- weaken security rules.

Commercial priority never overrides authorization.

## 28. Rule Scope

A merchandising rule may be scoped by approved dimensions such as:

- query;
- category;
- collection;
- locale;
- campaign;
- date/time window.

Rules should be narrowly scoped rather than globally broad by default.

## 29. Locale-Specific Merchandising

A campaign may differ by locale only through explicitly reviewed configuration.

Supported initial locales remain:

- `en`;
- `te`;
- `hi`;
- `ta`;
- `kn`.

Localized merchandising must not create inconsistent authoritative product facts.

## 30. Rule Conflict Resolution

Multiple rules may conflict.

Future architecture must define deterministic precedence.

Possible precedence dimensions include:

- security/publication eligibility first;
- exact rule scope;
- explicit priority;
- version;
- activation timestamp;
- stable rule ID tie-break.

Conflict resolution must be testable.

## 31. Deterministic Ranking

Equivalent validated requests against the same:

- index version;
- ranking configuration;
- merchandising configuration;
- source data

should produce deterministic ordering subject to documented freshness changes.

## 32. Tie-Breaking

Non-random ranking needs deterministic tie-breaking.

Conceptually:

`relevance score -> approved secondary signals -> canonical product ID`

Tie-breaking must remain stable enough for cursor pagination.

## 33. Ranking Version

Every active ranking configuration should have an explicit version.

Conceptual metadata may include:

- ranking version;
- signal weights version;
- synonym version;
- merchandising rule-set version;
- search schema/index version.

This enables reproducible testing and rollback.

## 34. Configuration Activation

A new ranking version should not silently replace production behavior.

Future lifecycle:

1. create candidate configuration;
2. validate syntax;
3. test offline;
4. run relevance-quality evaluation;
5. run security/privacy checks;
6. stage;
7. approve;
8. activate;
9. monitor;
10. retain rollback path.

## 35. Ranking Rollback

Rollback should restore a known-good ranking configuration/version.

Rollback must not require changing authoritative product/order/payment data.

Provider-specific rollback mechanics remain adapter details.

## 36. Audit Trail

High-impact ranking/merchandising changes require audit.

Audit metadata may include:

- actor;
- action;
- rule/config ID;
- previous version;
- new version;
- scope;
- timestamp;
- approval context.

Audit logs must not contain secrets.

## 37. Explainability Boundary

Internal operations should be able to determine major reasons a result was
ranked or promoted.

Possible explanation metadata may include:

- exact-match contribution;
- synonym/transliteration contribution;
- business-signal contribution;
- active merchandising rule ID.

Customer-facing explanations are a separate product decision.

## 38. Anti-Gaming

Ranking signals may be manipulated.

Future controls should consider abuse such as:

- fake clicks;
- repeated automated searches;
- fake wishlist events;
- manipulated reviews;
- artificial vendor traffic.

Untrusted behavioral events must not directly become unlimited ranking power.

## 39. Signal Validation

Every ranking signal requires:

- defined source;
- type;
- allowed range;
- freshness policy;
- privacy classification;
- anti-abuse boundary;
- version.

Malformed or unknown signals should fail safely.

## 40. Behavioral Data Privacy

Behavioral signals require privacy minimization.

Ranking should avoid unnecessary use of:

- direct identity;
- customer phone;
- email;
- delivery address;
- payment details;
- KYC/government identity.

Aggregate signals are preferred where they satisfy the product need.

## 41. Cold-Start Products

New approved products may have little behavioral data.

Future ranking should avoid permanently hiding them solely because they lack
historical popularity.

Possible approaches require testing, such as:

- freshness contribution;
- category relevance;
- controlled exploration.

This architecture does not prescribe a production weight.

## 42. Diversity Boundary

Future discovery may consider diversity to avoid repeated near-identical results.

Possible dimensions may include:

- product;
- variant;
- vendor;
- collection;
- style.

Diversity must not override an exact strong query match without measured benefit.

## 43. Multi-Vendor Fairness Boundary

Marketplace ranking must not leak or misuse private vendor data.

Platform-controlled merchandising may exist, but vendor-specific ranking
privileges require explicit business policy and audit.

No vendor may alter another vendor's ranking configuration.

## 44. Personalization Boundary

User-specific personalization is outside core organic ranking authority.

If introduced later, personalization must be a controlled layer with:

- privacy approval;
- data minimization;
- user-context rules;
- fallback;
- audit/monitoring;
- ability to disable.

Detailed personalization belongs to the recommendations/discovery gate.

## 45. Experimentation Boundary

A/B ranking experiments may be considered later.

Experiments require:

- approved hypothesis;
- versioned variants;
- traffic allocation rules;
- privacy-safe metrics;
- stop criteria;
- rollback;
- no weakening of security/publication rules.

## 46. Search Quality Metrics

Future quality evaluation may measure:

- top-result relevance;
- precision;
- recall;
- zero-result rate;
- reformulation rate;
- locale-specific success;
- transliteration quality.

Metrics should be broken down by language where practical.

## 47. Kannada Quality Boundary

Kannada `kn` relevance must be evaluated independently.

A global average must not hide poor Kannada quality.

Future Kannada test coverage should include:

- native Kannada exact match;
- normalized Kannada match;
- Kannada synonym;
- Kannada Latin transliteration;
- typo handling;
- category/attribute queries.

## 48. Other Initial Locale Quality

Equivalent language-specific quality evaluation is required for:

- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- English `en`.

Cross-language expansion should not be considered successful if one major locale
performs materially worse without investigation.

## 49. Provider Neutrality

Core ranking policy must remain independent of proprietary provider syntax.

The provider adapter may translate internal:

- field weights;
- scoring signals;
- sort/ranking settings;
- merchandising instructions

into provider-supported capabilities.

If a provider lacks a required control, the limitation must be explicit.

## 50. Provider Capability Degradation

Not all providers support identical ranking features.

A future adapter must document capability differences.

Missing provider capability must not be hidden behind silent behavior changes.

## 51. Ranking Cache Boundary

If ranking results/configurations are cached later, cache identity must include
relevant version/context such as:

- query;
- locale;
- filters;
- sort;
- ranking version;
- merchandising version;
- index version;
- authorization/public context.

Cache reuse must never cross private tenant boundaries.

## 52. Security Priority

Ranking and merchandising must always operate after required:

- authentication where applicable;
- authorization;
- publication eligibility;
- tenant isolation;
- public/private field projection.

No ranking rule can override security.

## 53. Failure Behavior

Fail closed or fall back to a known-safe ranking configuration on:

- unknown ranking version;
- malformed merchandising rule;
- unauthorized configuration change;
- cross-tenant rule scope;
- private product promotion;
- secret/PII leakage;
- incompatible provider configuration.

Availability does not outrank security.

## 54. Observability

Future privacy-safe monitoring may track:

- ranking configuration errors;
- merchandising activation failures;
- unexpected score distribution;
- zero-result rate;
- locale-specific quality;
- rule conflicts;
- provider ranking errors;
- rollback events.

Logs must not expose provider credentials or unnecessary PII.

## 55. Required Future Tests

Implementation must eventually test:

- exact match priority;
- normalized match;
- synonym match;
- transliteration weighting;
- typo weighting;
- SKU/exact identifier protection;
- English `en` ranking;
- Telugu `te` ranking;
- Hindi `hi` ranking;
- Tamil `ta` ranking;
- Kannada `kn` ranking;
- Kannada transliteration ranking;
- freshness signal;
- popularity signal bounds;
- rating aggregate bounds;
- inventory non-authority;
- price non-authority;
- provenance relevance privacy;
- suspended vendor exclusion;
- organic/merchandising separation;
- authorized pin;
- unauthorized pin denial;
- pin cannot resurrect private product;
- boost scope;
- bury scope;
- sponsored/organic distinction;
- rule conflict resolution;
- deterministic tie-break;
- ranking version activation;
- rollback;
- audit creation;
- behavioral abuse resistance;
- cold-start handling;
- tenant isolation;
- provider capability fallback.

## 56. Activation Boundary

This document is Future architecture only.

It does NOT:

- change production ranking;
- configure a search provider;
- create advertising;
- activate sponsored results;
- alter product prices;
- alter inventory;
- collect production behavioral data;
- modify Firebase;
- deploy anything.

Implementation requires separate approved coding, tests, relevance evaluation,
security/privacy review, staging, explicit production approval and rollback
verification.
