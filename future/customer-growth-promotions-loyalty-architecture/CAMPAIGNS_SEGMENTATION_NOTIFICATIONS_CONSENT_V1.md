# AV Silks Future Campaigns, Segmentation, Notifications & Consent Architecture v1

Status: FUTURE-ONLY / ARCHITECTURE / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define future AV Silks campaign orchestration, customer segmentation,
communication preferences, consent, notification delivery and related privacy
boundaries.

`Campaign Orchestration Is Not Commerce Authority.`

Campaigns may reference approved promotions, loyalty programs, referrals and
public Handloom initiatives, but they cannot replace pricing, payment, order,
identity or provenance authority.

## 2. Campaign Domain Scope

Future campaign architecture may include:

- canonical campaign identity;
- campaign version;
- lifecycle;
- audience/segment reference;
- content/presentation reference;
- promotion reference;
- loyalty/referral reference;
- channel policy;
- schedule;
- frequency policy;
- consent policy;
- budget/funding reference;
- delivery event references;
- audit metadata.

## 3. Canonical Campaign Identity

Every campaign requires a stable canonical `campaignId`.

Localized titles, provider campaign IDs, SMS template IDs or email subject lines
must not replace the canonical campaign identity.

Provider IDs belong in integration adapters.

## 4. Campaign Versioning

Commercially or legally meaningful campaign changes should be versioned.

Historical delivery and customer eligibility must remain explainable after:

- copy changes;
- audience changes;
- offer changes;
- schedule changes;
- consent-policy changes;
- channel changes.

## 5. Campaign Lifecycle

A future lifecycle may include:

`DRAFT -> REVIEWED -> SCHEDULED -> ACTIVE -> PAUSED -> ENDED -> ARCHIVED`

Emergency stop/revocation must be supported where necessary.

Lifecycle transitions require trusted authorization.

## 6. Campaign Activation Authority

Only authorized trusted roles may activate or pause a campaign.

Frontend buttons, hidden UI or provider dashboard state are not sufficient
authorization for AV Silks commercial behavior.

## 7. Campaign vs Promotion Authority

A campaign may reference a Promotion version.

Conceptually:

`Campaign -> Promotion Reference`

not:

`Campaign -> Directly Decides Checkout Price`

Pricing and Promotion domains retain commercial authority.

## 8. Campaign vs Loyalty Authority

Campaigns may request approved loyalty actions or advertise loyalty benefits.

They must not directly mutate:

- loyalty balance;
- tier;
- expiry;
- redemption state.

Loyalty authority remains with the Loyalty ledger domain.

## 9. Campaign vs Referral / Value Authority

Campaigns may reference referral or gift/value programs.

They must not mint:

- referral reward;
- gift-card value;
- store credit;
- monetary balance.

Those require their authoritative domains.

## 10. Segmentation Purpose

Segmentation groups customers or contexts for approved communication and offer
eligibility.

Segmentation is a decision-support/targeting layer, not customer identity
authority.

## 11. Canonical Segment Identity

A future segment requires a stable canonical identity and explicit definition.

Examples may include approved non-sensitive concepts such as:

- new customer;
- returning customer;
- loyalty tier;
- recent purchaser;
- category interest;
- vendor affinity;
- dormant customer;
- approved regional/service segment.

Exact implementation requires privacy review.

## 12. Segment Definition Versioning

Segment definitions should be versioned.

A campaign delivery should be explainable using the segment definition that was
active when eligibility was evaluated.

## 13. Trusted Segment Inputs

Segment evaluation must use approved trusted or purpose-limited data.

The client must not self-declare privileged segment membership.

Examples such as loyalty tier or completed-order status must come from their
authoritative domains.

## 14. Sensitive Segmentation Boundary

Sensitive personal characteristics must not be inferred or targeted casually.

Any future segmentation involving sensitive data requires separate:

- legal review;
- privacy review;
- purpose approval;
- data-minimization review;
- access controls.

Sensitive profiling is outside the default Growth architecture.

## 15. Customer Data Minimization

Segmentation and campaign records should minimize copied customer PII.

Prefer internal references and approved derived attributes instead of duplicating:

- names;
- phone numbers;
- email addresses;
- addresses;
- payment data.

## 16. Customer Isolation

Private campaign eligibility or preferences for one customer must not be exposed
to another customer.

Authorization is server-side.

## 17. Dynamic vs Snapshot Segments

Future architecture may support:

- dynamic segments evaluated near delivery time;
- snapshot audiences frozen for an approved campaign event.

The selected model must be explicit.

A stale audience must not silently bypass current consent/suppression rules.

## 18. Eligibility Revalidation

Even if a customer was previously selected for a campaign, final communication
delivery should re-check applicable:

- account state;
- consent/preference state;
- suppression state;
- campaign lifecycle;
- channel eligibility.

Precomputed audience membership is not permanent communication authority.

## 19. Consent Domain Boundary

Consent/preferences require a trusted server-side record.

Frontend checkboxes may submit a request, but the backend must persist the
authoritative preference state and audit-relevant evidence.

## 20. Consent Purpose Separation

Consent should be scoped to explicit purposes/channels where legally or
operationally required.

Examples may include:

- marketing email;
- marketing SMS;
- push marketing;
- account/service communication.

One purpose must not silently imply another.

## 21. Transactional vs Marketing Boundary

Transactional/service communications and marketing communications are different
policy classes.

Examples of transactional/service messages may include approved:

- order confirmation;
- payment status;
- security notice;
- delivery update.

Marketing campaigns must not disguise themselves as transactional messages merely
to bypass preferences.

## 22. Opt-In Boundary

Where opt-in is required, campaign delivery must verify the approved consent state
before sending.

No frontend-only boolean is sufficient proof.

## 23. Opt-Out / Unsubscribe

Future marketing communication must support an approved opt-out/unsubscribe path
where applicable.

An opt-out must become effective through trusted backend preference state.

The system must not continue marketing from stale provider lists.

## 24. Global Suppression

Future architecture should support high-priority suppression states such as:

- legal suppression;
- customer unsubscribe;
- abuse/security suppression;
- account closure where applicable;
- channel invalidity.

Suppression outranks campaign optimization.

## 25. Consent Version / Evidence

Where required, consent evidence may preserve minimally necessary:

- customer reference;
- purpose;
- state;
- policy/version;
- timestamp;
- source/context;
- correlation reference.

Do not copy unnecessary PII into consent history.

## 26. Consent Withdrawal

Withdrawal of consent must not erase historical evidence required for audit, but
it must stop future communication according to applicable policy.

Historical audit and future-send eligibility are separate concerns.

## 27. Consent Is Not Commerce Authority

Marketing consent does not authorize:

- payment;
- pricing;
- loyalty redemption;
- referral reward;
- gift-card spending;
- provenance access.

It authorizes only the approved communication/data-use purpose.

## 28. Communication Channel Registry

Future Growth architecture may define approved channel classes such as:

- email;
- SMS;
- push;
- in-app.

No provider is selected or approved by this architecture.

## 29. Provider Neutrality

The architecture does not approve any email, SMS, CRM, push or campaign provider.

A future provider review must examine:

- credentials;
- data transfer;
- retention;
- deletion;
- webhook security;
- rate limits;
- regional processing;
- delivery guarantees;
- pricing;
- migration/exit.

## 30. Provider Credential Boundary

Provider credentials must remain server-side or in approved secret management.

Never store privileged provider credentials in:

- frontend bundles;
- Git;
- campaign documents;
- analytics;
- public configuration.

## 31. Notification Outbox Boundary

Future delivery should use an idempotent outbox/event mechanism or equivalent
reliable pattern rather than coupling critical commerce writes directly to an
external messaging provider.

Commerce success must not depend on marketing-provider availability.

## 32. Notification Event Identity

Every delivery request should have a stable event/message identity.

This enables:

- deduplication;
- retries;
- audit;
- delivery tracking;
- failure handling.

## 33. Notification Idempotency

Retries must not send duplicate messages uncontrollably.

Stable event IDs and provider idempotency where available should be used.

Duplicate internal events must not become duplicate customer spam.

## 34. Delivery State Model

A future delivery lifecycle may include conceptual states such as:

`QUEUED -> SENT -> DELIVERED`

with failure paths such as:

`FAILED`, `SUPPRESSED`, `EXPIRED`.

Provider-specific states must map through an internal normalized model.

## 35. Provider Callback / Webhook Boundary

If a messaging provider uses callbacks/webhooks, future implementation requires:

- authenticity verification;
- replay protection where applicable;
- timestamp/freshness validation;
- payload validation;
- idempotency;
- safe logging.

Unauthenticated callback data cannot become trusted delivery truth.

## 36. Retry Policy

Retry behavior must be explicit and bounded.

Future architecture must define:

- retryable failure classes;
- maximum attempts;
- backoff;
- permanent failures;
- dead-letter/manual-review path where needed.

Infinite retry loops are prohibited.

## 37. Frequency Caps

Growth campaigns require server-controlled frequency caps where appropriate.

Possible dimensions include:

- per customer;
- per channel;
- per campaign;
- per time window.

Provider throttling alone is not the customer-experience policy.

## 38. Contact Fatigue Boundary

Customer growth optimization must account for communication fatigue.

Campaign priority and frequency policies should prevent multiple campaigns from
overwhelming the same customer.

## 39. Quiet Hours

Future SMS/push or other channels may require quiet-hour policies based on legal,
regional or user-preference requirements.

Exact rules require implementation-time review.

The client must not bypass quiet-hour enforcement.

## 40. Scheduling Authority

Server-side scheduling/time is authoritative.

Customer device clocks cannot activate or extend a campaign.

Timezone handling must be explicit.

## 41. Expired Campaign Delivery

Messages queued for an ended/revoked campaign require an explicit policy.

Stale queues must not automatically deliver obsolete offers.

## 42. Emergency Kill Switch

Future architecture should support an authorized emergency campaign/channel stop.

A kill switch should be:

- auditable;
- scoped;
- reversible under approved policy;
- independent of provider UI where feasible.

## 43. Content Model

Campaign content should be separate from canonical commercial rules.

Localized copy may include:

- title;
- body;
- CTA label;
- banner metadata;
- legal text/reference.

Changing copy must not silently change offer authority.

## 44. Content Approval Boundary

High-risk promotional, financial or Government/Handloom claims may require
explicit review before activation.

Content approval does not replace underlying promotion/provenance authority.

## 45. Link / CTA Security

Campaign links must use approved destinations.

Future implementation should protect against:

- arbitrary redirect injection;
- phishing-like destination changes;
- unsafe deep links;
- untrusted URL parameters.

## 46. Personalization Boundary

Campaign personalization should use minimized approved data.

Avoid embedding unnecessary sensitive customer data in provider templates or URLs.

Personalization must fail safely when data is missing.

## 47. Template Injection / Escaping

Untrusted customer/product/vendor text inserted into messages must be safely
escaped or encoded for the destination format.

Template systems must not allow arbitrary code/script execution.

## 48. Vendor Campaign Ownership

Vendor-created campaigns require vendor ownership validation.

A vendor must not:

- target another vendor's private customers;
- modify another vendor's campaign;
- activate platform-wide campaigns;
- access another vendor's private analytics.

## 49. Vendor Audience Boundary

Vendor campaign audiences must use platform-approved privacy rules.

Vendor ownership of a product does not automatically grant unrestricted access to
customer PII.

## 50. Platform Campaign Authority

Only authorized platform roles may create or activate platform-wide campaigns.

Platform campaigns must remain auditable.

## 51. Mixed-Vendor Campaign Boundary

Cross-vendor campaigns require explicit platform authority and funding/eligibility
rules.

One vendor must not gain another vendor's private audience or commercial data.

## 52. Government / Handloom Campaigns

Future architecture may support approved:

- handloom awareness campaigns;
- artisan/cooperative discovery;
- government-program awareness;
- public provenance education.

Campaign labeling must not create Government endorsement, funding approval or
provenance truth.

## 53. Provenance Boundary

Campaigns may link to approved public provenance information.

They must never create or alter provenance truth.

Private artisan/KYC evidence must not enter marketing audiences or templates.

## 54. Government Identity / KYC Exclusion

Government identity and KYC documents are not marketing segmentation inputs.

Use only approved public/program eligibility references where explicitly needed.

No raw KYC/government-ID data belongs in campaign providers.

## 55. Multilingual Campaign Model

Customer-facing campaigns may support:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`.

Canonical campaign identity, eligibility and consent remain language-neutral.

## 56. Locale Selection

Future delivery should use an approved locale preference/fallback policy.

Locale choice must not expose another customer's preference.

## 57. Translation Boundary

Translation changes presentation only.

Localized content must not create a different:

- promotion rule;
- reward amount;
- eligibility condition;
- consent state;
- commercial expiry.

## 58. Kannada Campaign Boundary

Kannada content must receive the same:

- consent;
- suppression;
- frequency-cap;
- security;
- commercial-authority

protections as every other supported locale.

## 59. Notification Fallback

If a preferred locale/template is unavailable, fallback must follow an explicit
approved policy.

Fallback must not send malformed or misleading commercial information.

## 60. Analytics Event Boundary

Campaign delivery may emit privacy-safe events such as conceptual:

- queued;
- sent;
- delivered;
- opened where lawful/approved;
- clicked where lawful/approved;
- suppressed;
- failed;
- converted.

Analytics events are not commerce authority.

## 61. Tracking Consent Boundary

Tracking pixels, click tracking or similar behavioral measurement require a
separate privacy/legal review where applicable.

Delivery does not automatically authorize behavioral tracking.

## 62. Attribution Boundary

A campaign may receive analytical conversion attribution.

Attribution must not mutate:

- order truth;
- payment truth;
- promotion eligibility;
- loyalty balance;
- referral reward.

Detailed attribution architecture is handled in the next Growth gate.

## 63. Delivery Analytics Privacy

Campaign analytics should minimize customer-identifiable raw data.

Prefer aggregate or pseudonymous internal references where feasible.

Provider exports require RBAC and retention controls.

## 64. Abuse / Spam Boundary

Future architecture must address:

- spam-like over-messaging;
- provider abuse;
- bot-generated subscription attempts;
- fake engagement;
- malicious unsubscribe requests;
- vendor campaign abuse;
- template injection;
- link manipulation.

Growth targets never justify unsafe messaging.

## 65. Unsubscribe Abuse Protection

Public unsubscribe mechanisms must be secure while remaining usable.

Future implementation should avoid exposing unnecessary account details through
unsubscribe URLs.

Tokens, if used, require appropriate integrity/expiry/scoping.

## 66. Preference Mutation Authorization

Authenticated preference changes require customer ownership.

Unauthenticated one-click mechanisms, where legally required/approved, need
separate signed/scoped token design.

One user must not modify another user's communication preferences.

## 67. Rate Limiting

Sensitive campaign/preferences endpoints may require rate limiting, including:

- subscribe;
- unsubscribe;
- preference update;
- campaign preview;
- test send;
- provider callback endpoints.

Rate limits complement authorization and idempotency.

## 68. Audit Model

High-impact actions should eventually be auditable, including:

- campaign create/version activation;
- audience/segment change;
- consent-policy change;
- frequency-cap change;
- template approval;
- channel enable/disable;
- vendor campaign approval;
- emergency kill switch.

Audit must exclude provider secrets and unnecessary customer PII.

## 69. Retention / Deletion

Future campaign/consent/delivery data requires explicit retention policy.

Retention periods may differ for:

- active preferences;
- consent evidence;
- delivery logs;
- aggregate analytics;
- provider exports.

Deletion requirements must be reviewed separately from financial/order retention.

## 70. Provider Data Deletion

When external providers receive approved customer communication data, future
operations must understand provider-side:

- retention;
- deletion;
- suppression;
- export;
- account closure behavior.

Provider convenience does not override privacy obligations.

## 71. Environment Isolation

Development, staging and production require separate:

- campaigns;
- audiences;
- provider credentials;
- templates;
- callback secrets;
- analytics;
- test recipients.

Staging/test campaigns must not contact real production customers accidentally.

## 72. Test Recipient Safety

Development/staging should use approved synthetic/test recipients.

A staging campaign must fail safe if recipient/environment identity is ambiguous.

## 73. Migration Boundary

Any future migration from another CRM/campaign provider requires:

- consent/preference mapping;
- suppression mapping;
- campaign identity mapping;
- template migration;
- delivery-state mapping where needed;
- audit;
- reconciliation;
- rollback/exit plan.

Do not assume an imported provider list has valid AV Silks consent.

## 74. Reconciliation

Future reconciliation should detect applicable:

- campaign/provider state mismatch;
- missing suppression;
- stale audience;
- duplicate delivery;
- invalid locale/template;
- missing callback state;
- environment mismatch.

Security/privacy discrepancies require priority handling.

## 75. Required Future Campaign Tests

Implementation must eventually test:

- canonical campaign ID;
- campaign versioning;
- lifecycle transitions;
- activation RBAC;
- promotion non-authority;
- loyalty non-authority;
- referral/value non-authority;
- trusted segment inputs;
- dynamic/snapshot segment behavior;
- audience revalidation;
- vendor campaign ownership;
- cross-vendor isolation;
- Government/Handloom boundary;
- provenance non-authority.

## 76. Required Future Consent Tests

Implementation must eventually test:

- authoritative preference state;
- purpose/channel separation;
- opt-in;
- opt-out;
- global suppression;
- consent withdrawal;
- customer isolation;
- preference mutation authorization;
- unsubscribe privacy;
- stale provider-list suppression.

## 77. Required Future Notification Tests

Implementation must eventually test:

- outbox/reliable delivery;
- event identity;
- duplicate-event idempotency;
- provider callback authenticity;
- replay protection;
- retry/backoff;
- frequency cap;
- quiet hours where applicable;
- campaign expiry;
- emergency kill switch;
- link safety;
- template escaping;
- provider-secret isolation;
- test-recipient safety.

## 78. Required Future Locale Tests

Future implementation must test:

- English `en`;
- Telugu `te`;
- Hindi `hi`;
- Tamil `ta`;
- Kannada `kn`;
- locale fallback;
- equivalent commercial meaning;
- equivalent consent/suppression behavior.

All locales must resolve to the same underlying canonical campaign and consent
state.

## 79. Activation Boundary

This architecture document does NOT:

- create campaigns;
- create customer segments;
- enroll real customers;
- send email;
- send SMS;
- send push notifications;
- activate tracking pixels;
- change consent/preferences;
- integrate a messaging provider;
- create provider credentials;
- modify promotions;
- mutate loyalty/referral/value balances;
- modify provenance;
- modify Firebase;
- deploy anything.

Implementation requires a separately approved implementation branch, privacy/legal
review where applicable, automated tests, staging validation, security review,
explicit production approval and rollback readiness.
