# AV Silks Future Multilingual Normalization & Transliteration Architecture v1

Status: FUTURE-ONLY / SEARCH LANGUAGE DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a Unicode-safe, multilingual and transliteration-aware future search
architecture for AV Silks.

Initial locale compatibility:

- English — `en`
- Telugu — `te`
- Hindi — `hi`
- Tamil — `ta`
- Kannada — `kn`

This architecture does not translate production data, install a language model,
select a search provider, or change the current MVP.

## 2. Core Language Principle

Original approved product text remains authoritative.

Search normalization, transliteration, stemming, tokenization and query expansion
are derived discovery operations.

They must never overwrite canonical catalog content.

## 3. Original Query Preservation

Every future search request should preserve the original user query before
normalization.

Conceptual fields:

- original query;
- normalized query;
- detected script hints;
- requested locale where known;
- generated query variants;
- transliteration candidates;
- applied synonym rules.

This supports debugging, ranking analysis and safe fallback without losing user intent.

## 4. Unicode Normalization

Search input and indexed searchable fields require explicit Unicode normalization.

Future implementation should evaluate a consistent normalization form such as NFC
for canonical storage/search preprocessing unless provider-specific constraints
require another reviewed approach.

Normalization must account for:

- combining characters;
- visually equivalent Unicode sequences;
- Indic-script composition;
- punctuation variants;
- whitespace variants;
- zero-width/control characters;
- malformed/unexpected Unicode.

Normalization must be deterministic and tested.

## 5. Unsafe Unicode Handling

Future preprocessing should reject or safely normalize dangerous/unexpected text
where required.

Potential concerns include:

- invisible control characters;
- bidirectional control misuse;
- excessive combining marks;
- malformed encoding;
- confusable characters used for abuse.

Security normalization must not silently change legitimate Indic-language meaning.

## 6. Script Detection Boundary

Script detection may help choose analyzers or query expansion.

Possible script families include:

- Latin;
- Telugu;
- Devanagari;
- Tamil;
- Kannada.

Script detection is a hint.

It must not be treated as guaranteed language identity.

For example, Devanagari text may represent Hindi or another language.

## 7. Locale Determination

Future query locale may come from multiple signals:

- explicit user/app locale;
- query script;
- catalog field being searched;
- session preference where privacy-approved;
- fallback configuration.

Locale determination should produce confidence/metadata rather than an
unreviewed absolute assumption.

## 8. Mixed-Language Queries

Users may mix languages/scripts in one query.

Examples conceptually include:

- English product type + Indic color;
- Latin transliteration + English category;
- native-script brand + English attribute.

Future query parsing must preserve meaningful mixed-language tokens rather than
forcing the entire query into one locale.

## 9. Canonical Normalization Pipeline

Conceptual future pipeline:

`Raw Query -> Unicode Validation -> Unicode Normalization -> Whitespace/Punctuation Normalization -> Script Analysis -> Locale Hints -> Tokenization -> Exact-Script Query -> Optional Transliteration Expansion -> Synonym Expansion -> Search Execution`

Every stage should be independently testable.

## 10. Whitespace and Punctuation

Search normalization may safely standardize:

- repeated whitespace;
- leading/trailing whitespace;
- approved punctuation variants.

It must not remove punctuation where punctuation is semantically meaningful to
a product identifier, SKU, brand or model token.

## 11. Case Handling

English/Latin tokens may use locale-safe case normalization where appropriate.

Indic scripts do not share the same case model.

Future implementation must avoid applying Latin-centric normalization blindly to
all languages.

## 12. Numeral Handling

Search may encounter ASCII and Indic numeral forms.

Any numeral normalization requires explicit tested rules.

Product identifiers, SKUs and numeric textile attributes must preserve exact
meaning.

Numeric normalization must not change authoritative product values.

## 13. Tokenization Boundary

Tokenization may vary by locale/script and provider.

The architecture must support locale-aware tokenization rather than assuming a
single whitespace-only tokenizer.

Tokenization strategy must be measurable against real commerce search examples.

## 14. Telugu Search Boundary

Telugu (`te`) support should account for:

- native Telugu script;
- Unicode normalization;
- compound commerce terminology;
- common regional vocabulary;
- future Latin-script transliteration;
- reviewed synonyms.

Telugu search quality must be tested with real commerce terminology before activation.

## 15. Hindi Search Boundary

Hindi (`hi`) support should account for:

- Devanagari script;
- Unicode normalization;
- inflection/variant forms;
- commerce terminology;
- future Latin transliteration;
- reviewed synonyms.

Script detection alone must not assume every Devanagari query is Hindi.

## 16. Tamil Search Boundary

Tamil (`ta`) support should account for:

- Tamil script;
- Unicode normalization;
- regional commerce terminology;
- morphological/tokenization behavior;
- future Latin transliteration;
- reviewed synonyms.

## 17. Kannada Search Boundary

Kannada (`kn`) is an initial supported Search & Discovery locale.

Architecture must support:

- native Kannada script;
- Unicode normalization;
- Kannada commerce terminology;
- Kannada product/category vocabulary;
- Kannada synonyms;
- future Latin-script transliteration;
- Kannada-specific quality tests.

Kannada must not be treated merely as a fallback to another South Indian language.

## 18. English Search Boundary

English (`en`) support may provide:

- case-folded matching;
- typo tolerance;
- stemming/lemmatization only where quality-tested;
- commerce synonyms;
- brand/SKU exact-match handling.

Aggressive stemming must not damage proper nouns or product identifiers.

## 19. Transliteration Purpose

Transliteration allows a user to express words from one script using another script.

Examples include native Telugu, Hindi, Tamil or Kannada concepts typed using Latin
characters.

Transliteration is not translation.

It changes script representation, not semantic language.

## 20. Transliteration as Query Expansion

Future transliteration should normally operate as query expansion.

Conceptual approach:

1. preserve original query;
2. search original query;
3. detect possible transliteration opportunity;
4. generate controlled candidate forms;
5. search candidates with lower or separately tuned confidence;
6. merge/rank results.

Do not destructively replace the original query with one guessed transliteration.

## 21. Exact-Script Priority

When a user types native-script text, exact/normalized native-script matches
should generally remain a strong relevance signal.

Transliteration expansion must not routinely outrank a clearly correct native-script
exact match.

Final weighting requires quality evaluation.

## 22. Transliteration Ambiguity

A Latin token may map to multiple possible words or languages.

Future architecture must support:

- multiple candidates;
- confidence/weighting;
- locale hinting;
- result quality measurement;
- rejection of low-confidence expansion.

One transliteration guess must never be assumed universally correct.

## 23. Cross-Language Ambiguity

Similar Latin spellings may represent different terms in Telugu, Hindi, Tamil
or Kannada.

Locale/session hints may help, but the system should remain capable of returning
useful cross-language discovery where business-approved.

Do not silently misclassify language with high confidence without evidence.

## 24. Transliteration Provider Neutrality

Core AV Silks search logic should depend on an internal transliteration interface.

A future implementation may use:

- deterministic libraries;
- curated maps;
- search-provider analyzers;
- approved language services;
- hybrid approaches.

No transliteration provider is selected by this architecture.

## 25. Transliteration Index Strategy

Possible future strategies include:

- query-time transliteration only;
- indexed transliteration fields;
- hybrid query/index expansion.

The final choice must evaluate:

- index size;
- latency;
- recall;
- precision;
- update complexity;
- provider capabilities;
- privacy;
- cost.

## 26. Transliteration Fields

If indexed transliteration is later approved, conceptual derived fields may include:

- `title.te_latn`
- `title.hi_latn`
- `title.ta_latn`
- `title.kn_latn`

These are derived matching artifacts.

They must not replace original:

- `title.te`
- `title.hi`
- `title.ta`
- `title.kn`

## 27. Synonym Architecture

Synonyms should use reviewed commerce concepts.

Examples of synonym sources may include:

- category terminology;
- fabric/material terms;
- regional product names;
- spelling variants;
- commonly accepted commerce vocabulary.

Synonyms must be versioned and auditable.

## 28. Locale-Specific Synonyms

Synonym relationships may differ by locale.

A future model may associate:

- concept ID;
- locale;
- approved terms;
- directionality;
- version;
- activation state.

A synonym in one language must not automatically be copied into another language.

## 29. Cross-Language Concepts

A canonical concept layer may link reviewed equivalent product concepts across
languages.

Conceptual example:

`conceptId -> en term(s), te term(s), hi term(s), ta term(s), kn term(s)`

This is controlled search metadata, not automatic machine translation.

## 30. Translation Boundary

Search translation is distinct from transliteration.

Future automatic translation, if considered, requires a separate quality,
privacy and business-review gate.

Legal, payment, policy or provenance claims must never be machine-translated and
published automatically without reviewed controls.

## 31. Fallback Language

Future locale fallback must be explicit.

A possible application-level fallback may use English where localized public
content is unavailable, subject to product-content policy.

Fallback must not fabricate localized text.

The UI should distinguish missing localization from genuine localized content.

## 32. Missing Locale Fields

A product may not initially contain every locale.

Search projection should handle missing locale fields without:

- indexing fake translations;
- deleting otherwise valid products;
- leaking internal/private source text.

Fallback and display behavior must be deterministic.

## 33. Language-Aware Typo Tolerance

Typo tolerance must be language-aware.

Future implementation should evaluate:

- edit distance;
- phonetic similarity where appropriate;
- script-specific confusion;
- transliteration spelling variation.

Aggressive typo correction can create false positives and must be quality-tested.

## 34. Correction vs Expansion

Spelling correction should generally create a candidate query rather than silently
destroy the original query.

Conceptual behavior:

`original query + correction candidate + confidence`

The system may present “did you mean” behavior where appropriate.

## 35. Brand and Proper-Noun Safety

Brand names, artisan names, collection names, SKUs and exact product identifiers
require special handling.

Aggressive stemming, transliteration or spelling correction must not rewrite
trusted identifiers into unrelated terms.

Exact-match fields may need higher priority.

## 36. Handloom Vocabulary

Future multilingual search should maintain reviewed handloom vocabulary.

Possible concept classes include:

- weave technique;
- fabric;
- region;
- motif;
- border/pallu terminology;
- artisan/cooperative public terminology;
- craft style.

Public provenance vocabulary must remain separate from private provenance evidence.

## 37. Search Relevance Boundary

Multilingual expansion increases recall but may reduce precision.

Final relevance should distinguish signals such as:

- exact native-script match;
- exact normalized match;
- approved synonym match;
- transliteration match;
- typo-corrected match;
- broader fallback match.

Weights require measurable relevance evaluation.

## 38. Query Variant Budget

Query expansion must be bounded.

Unlimited:

- transliteration candidates;
- synonym expansion;
- typo candidates;
- cross-language variants

can cause latency, cost and irrelevant results.

Future implementation requires explicit expansion limits.

## 39. Abuse Resistance

Attackers may submit extremely long or pathological Unicode queries.

Future controls should include:

- query length limits;
- token limits;
- normalization complexity limits;
- expansion limits;
- rate limiting;
- safe regex/tokenizer behavior.

Normalization must not enable denial-of-service amplification.

## 40. Privacy Boundary

Multilingual search architecture must not require storing real user identity with
every query.

Search telemetry, if later enabled, requires minimization.

Avoid collecting:

- customer name;
- phone;
- address;
- payment information;
- KYC/government identity;
- unnecessary persistent user identifiers.

## 41. Analytics Locale Metadata

Privacy-safe analytics may record coarse metadata such as:

- selected locale;
- detected script category;
- whether transliteration was attempted;
- whether zero results occurred.

Raw query retention requires separate privacy/retention review.

## 42. Indexing Consistency

Localized and transliterated fields remain derived from canonical approved catalog
content.

Full rebuild and incremental indexing must produce consistent locale projections.

Locale-specific projection errors should be detectable through reconciliation.

## 43. Provider Migration

Multilingual behavior should be defined at the AV Silks architecture level rather
than being inseparable from one provider.

Provider migration must document equivalent support for:

- Unicode;
- locale analyzers;
- synonyms;
- transliteration;
- typo tolerance;
- facets/ranking interactions.

## 44. Quality Evaluation Dataset

Before activation, future implementation needs a synthetic/reviewed search-quality
dataset.

It should cover:

- English native queries;
- Telugu native queries;
- Hindi native queries;
- Tamil native queries;
- Kannada native queries;
- Latin transliteration of Indic queries;
- mixed-language queries;
- misspellings;
- synonyms;
- ambiguous transliterations;
- zero-result cases.

Do not use private customer query history without separate approval.

## 45. Relevance Metrics

Future evaluation may measure:

- precision;
- recall;
- click-quality proxies where privacy-approved;
- zero-result rate;
- reformulation rate;
- top-result relevance;
- locale-specific success.

No single global metric should hide poor Kannada, Telugu, Hindi or Tamil quality.

## 46. Human Review

Commerce vocabulary, synonyms and cross-language concepts require human review.

Legal, payment, policy and sensitive provenance terminology requires stronger
review before production publication.

## 47. Required Future Tests

Implementation must eventually test:

- Unicode normalization;
- combining characters;
- whitespace normalization;
- control-character handling;
- mixed-script query;
- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`;
- Kannada native-script matching;
- Kannada Latin transliteration;
- Telugu Latin transliteration;
- Hindi Latin transliteration;
- Tamil Latin transliteration;
- exact-script priority;
- ambiguous transliteration;
- language-specific synonyms;
- cross-language concept mapping;
- missing locale fallback;
- brand/SKU exact-match protection;
- query expansion limits;
- pathological Unicode query;
- privacy-safe analytics;
- provider migration compatibility.

## 48. Activation Boundary

This document is Future architecture only.

It does NOT:

- translate catalog content;
- modify product data;
- enable transliteration in production;
- collect real customer search histories;
- install a search provider;
- create Firebase indexes;
- call a language API;
- deploy anything.

Implementation requires separately approved code, test datasets, relevance
evaluation, privacy/security review, staging and explicit production approval.
