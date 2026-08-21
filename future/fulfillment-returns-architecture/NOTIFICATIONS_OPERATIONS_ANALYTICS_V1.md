# AV Silks Future Notifications, Operations & Analytics Architecture v1

Status: FUTURE-ONLY / OPERATIONS DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a secure, idempotent and privacy-safe future architecture for fulfillment
notifications, operational queues, exception handling, dashboards, service-level
monitoring and analytics.

This document does not send real SMS/email/push messages, create cloud resources,
change current customer communication or deploy anything.

## 2. Event-Driven Boundary

Fulfillment domains should publish normalized internal business events.

Examples:

- shipment created;
- pickup scheduled;
- shipment picked up;
- shipment in transit;
- out for delivery;
- delivered;
- delivery exception;
- NDR opened;
- RTO initiated;
- return approved;
- reverse pickup scheduled;
- return received;
- refund submitted;
- refund completed;
- replacement created.

Operational consumers must not directly depend on raw courier webhook payloads.

## 3. Outbox Pattern

Future durable notifications and downstream events should use an outbox-style
boundary where transactional consistency is required.

Conceptual outbox fields:

- `eventId`
- event type
- aggregate type
- aggregate ID
- payload version
- sanitized payload
- created timestamp
- delivery state
- attempt count
- next-attempt timestamp

Business transaction and event creation should be coordinated atomically where required.

## 4. Event Idempotency

Every durable business event requires a stable unique identity.

Consumers must process by:

`eventId`

Repeated delivery of the same event must not create duplicate business effects.

Examples of effects requiring idempotency:

- customer notification;
- admin alert;
- vendor notification;
- analytics event;
- reconciliation task;
- escalation task.

## 5. Notification Intent Model

A business event should create a notification intent rather than directly calling
a channel provider from core domain logic.

Conceptual fields:

- `notificationIntentId`
- `eventId`
- recipient scope
- template key
- locale
- channel eligibility
- sanitized template variables
- priority
- status
- created timestamp

Provider-specific message IDs remain separate.

## 6. Notification State Machine

Canonical notification states may include:

- `PENDING`
- `READY`
- `SENDING`
- `SENT`
- `DELIVERED`
- `FAILED`
- `RETRY_PENDING`
- `SUPPRESSED`
- `CANCELLED`
- `DEAD_LETTER`
- `EXCEPTION`

`SENT` does not necessarily mean the recipient successfully received the message.

## 7. Channel Abstraction

Core business logic should depend on a notification-channel interface.

Future channels may include:

- email;
- SMS;
- push notification;
- in-app notification;
- WhatsApp only if separately approved and compliant.

Channel provider SDKs must not leak into order/fulfillment business logic.

## 8. Template Architecture

Templates should be centrally controlled and versioned.

Conceptual template data:

- template key;
- version;
- locale;
- channel;
- required variables;
- active state.

Never allow untrusted arbitrary HTML/text execution.

Template variables must be validated and escaped appropriately for the channel.

## 9. Localization

Future notifications should support centralized locale selection.

Initial compatibility may include:

- Telugu;
- English;
- Hindi;
- Tamil.

Fallback behavior must be explicit.

Legal/payment/policy messaging requires reviewed translations before production use.

## 10. Recipient Privacy

Notification processing must minimize recipient PII.

Do not duplicate full address or unnecessary personal details into notification
records.

Sensitive contact information must be access-controlled and never placed in
public analytics.

## 11. Notification Preferences

Future preferences may distinguish:

- transactional mandatory/service messages;
- optional marketing messages;
- channel preference;
- language preference.

Marketing consent must never be inferred from transactional notification eligibility.

Applicable legal/compliance review is required before production activation.

## 12. Retry Policy

Transient delivery failures may use bounded retries.

Retry policy must define:

- maximum attempts;
- retryable error classes;
- backoff;
- jitter where appropriate;
- terminal failure behavior.

Permanent validation failures must not be retried forever.

## 13. Dead-Letter / Failed Intent Handling

Exhausted or non-recoverable delivery failures should enter a controlled failed
or dead-letter state.

Operations should be able to:

- inspect sanitized reason;
- retry under authorization where safe;
- suppress invalid destinations;
- close resolved incidents.

No provider credential or unrestricted message body should be exposed in operator logs.

## 14. Duplicate Notification Prevention

The same business event must not generate repeated customer messages due to:

- webhook retry;
- worker restart;
- queue retry;
- reconciliation;
- duplicate provider event.

Conceptual uniqueness may include:

`eventId + recipient + templateKey + purpose`

where business semantics require one notification.

## 15. Notification Ordering

Some events may arrive out of order.

Customer communication should not regress confusingly.

Example:

a late `IN_TRANSIT` event must not send a new “in transit” message after a trusted
`DELIVERED` notification unless an explicit correction workflow exists.

## 16. Sensitive Notification Boundary

Do not include secrets or excessive sensitive data in customer messages.

Avoid exposing:

- payment secrets;
- webhook secrets;
- private courier tokens;
- internal fraud/risk notes;
- unrestricted audit identifiers;
- private vendor data.

## 17. Operational Work Queue

Future admin/operations workflows may use normalized work items.

Conceptual work-item types:

- shipment creation failure;
- pickup failure;
- tracking mismatch;
- delivery exception;
- NDR action required;
- RTO exception;
- return pickup failure;
- inspection overdue;
- refund reconciliation;
- lost/damaged shipment;
- privacy/security exception.

## 18. Work Item State Machine

Canonical operations work-item states may include:

- `OPEN`
- `ASSIGNED`
- `IN_PROGRESS`
- `WAITING_EXTERNAL`
- `WAITING_CUSTOMER`
- `RESOLVED`
- `CLOSED`
- `ESCALATED`

Every transition should be authorized and auditable.

## 19. Work Item Priority

Potential priority model:

- `LOW`
- `NORMAL`
- `HIGH`
- `CRITICAL`

Priority must be based on approved operational policy rather than arbitrary frontend input.

Security incidents must follow the dedicated security incident process.

## 20. Assignment and Ownership

Future work items may be assigned to:

- platform operations;
- fulfillment operator;
- approved vendor operator;
- admin;
- owner/escalation role.

Assignment must respect RBAC and tenant/vendor isolation.

## 21. SLA / Aging Model

Future operational monitoring may calculate:

- opened age;
- time since last action;
- target resolution time;
- escalation threshold.

SLA values are configuration/policy, not hard-coded domain truth.

An overdue item should create a controlled alert/escalation, not silently alter
commerce/payment state.

## 22. Exception Dashboard

Future admin dashboard may summarize:

- open shipment exceptions;
- NDR cases;
- RTO cases;
- return exceptions;
- refund reconciliation;
- failed notifications;
- provider outages;
- aging/SLA breaches.

Dashboard reads must use authorized backend/query boundaries.

## 23. Customer Support View

A support-safe view should expose only data needed to assist the customer.

It should avoid unnecessary access to:

- secrets;
- payment credentials;
- other customers;
- other vendors;
- internal security data.

High-risk overrides require stronger permissions than ordinary support viewing.

## 24. Manual Action Safety

Manual operational actions require:

- authentication;
- explicit authorization;
- current-state verification;
- validation;
- reason code;
- idempotency where applicable;
- audit entry.

UI buttons must never bypass backend authorization.

## 25. Audit Trail

Audit-worthy operational actions include:

- reassignment;
- priority change;
- manual shipment correction;
- NDR action;
- RTO approval;
- return decision;
- inspection override;
- refund reconciliation;
- notification resend;
- manual case closure.

Audit entries should capture actor, target, reason, result and timestamp with minimal PII.

## 26. Analytics Boundary

Operational analytics should consume sanitized normalized events rather than raw
provider/customer payloads.

Analytics is not an authority for:

- payment;
- inventory;
- order;
- shipment;
- return;
- refund state.

It is a reporting/decision-support layer only.

## 27. Analytics Event Model

Conceptual event fields:

- event ID;
- event type;
- aggregate type;
- pseudonymous/internal aggregate reference;
- event timestamp;
- operational dimensions;
- sanitized categorical metadata;
- schema version.

Avoid unnecessary names, phone numbers, addresses and free-text customer data.

## 28. Fulfillment Metrics

Future privacy-safe metrics may include:

- shipment creation success rate;
- pickup success rate;
- average dispatch time;
- transit duration;
- on-time delivery rate;
- delivery exception rate;
- NDR rate;
- reattempt success rate;
- RTO rate;
- lost/damaged shipment rate.

## 29. Returns Metrics

Possible metrics:

- return request rate;
- return approval rate;
- reverse-pickup success;
- return transit duration;
- inspection turnaround;
- replacement rate;
- exchange rate;
- exception rate.

Metrics must not expose private return evidence or customer free text.

## 30. Refund Metrics

Possible metrics:

- refund request count;
- approval rate;
- provider success/failure rate;
- refund processing duration;
- reconciliation-pending count;
- mismatch count.

Financial analytics must use least privilege.

## 31. Notification Metrics

Possible metrics:

- intents created;
- sent rate;
- delivery rate where available;
- failure rate;
- retry rate;
- dead-letter count;
- provider latency.

Do not include message body or recipient contact details in metric labels.

## 32. Provider Performance

Future courier/provider analytics may compare:

- serviceability;
- pickup reliability;
- transit time;
- delivery success;
- NDR/RTO rate;
- tracking freshness;
- operational exception rate.

Provider selection changes still require approved operational policy and audit.

## 33. Multi-Vendor Analytics

Future vendor views must be tenant scoped.

Vendor A must not see Vendor B:

- shipments;
- returns;
- financial resolution;
- customer details;
- operational analytics.

Platform-wide views require explicit platform permissions.

## 34. Provenance Boundary

Handloom/QR public provenance remains separate from operations and analytics.

Never expose in public provenance:

- notification history;
- delivery address;
- customer phone/email;
- NDR/RTO notes;
- refund data;
- operator assignments;
- private analytics;
- vendor performance/private risk metrics.

## 35. Data Retention

Future notification, operations and analytics records need explicit retention policy.

Retention should consider:

- business need;
- audit/legal requirement;
- privacy minimization;
- incident/security requirements.

Do not retain raw provider/customer payloads indefinitely merely for convenience.

## 36. Logging

Logs should use structured sanitized metadata.

Never log:

- secrets;
- full customer addresses;
- unnecessary phone/email;
- message-provider credentials;
- raw sensitive payment payloads;
- unrestricted uploaded return evidence;
- private risk notes.

## 37. Observability vs Analytics

Operational observability and business analytics are related but distinct.

Observability supports system health:

- errors;
- latency;
- queue depth;
- worker failure;
- provider outage.

Analytics supports business/operations insight.

Neither may replace authoritative transactional state.

## 38. Alerting

Future alert types may include:

- notification worker failure;
- queue backlog;
- webhook verification spike;
- provider outage;
- shipment exception spike;
- refund reconciliation backlog;
- SLA breach;
- dead-letter growth.

Alerts must avoid secrets and unnecessary PII.

## 39. Security Alerts

Security-relevant signals must route to an appropriately restricted process.

Examples:

- repeated invalid webhook signatures;
- privilege violations;
- cross-tenant access attempts;
- secret/config anomaly;
- unusual replay attempts.

Security alerts must not be exposed in vendor/customer dashboards.

## 40. Worker Safety

Future asynchronous workers require:

- bounded concurrency;
- idempotent processing;
- retry policy;
- poison-message handling;
- graceful failure;
- sanitized logging;
- explicit environment/project identity.

A worker restart must not duplicate successful business effects.

## 41. Environment Isolation

Development, staging and production workers/providers must use isolated:

- credentials;
- queues/resources;
- endpoints;
- data;
- configuration.

Staging notification testing must not contact real customers unless separately
explicitly approved under a safe testing procedure.

## 42. Failure Rules

Fail closed on:

- unauthorized operations action;
- tenant/vendor isolation failure;
- invalid event schema;
- conflicting idempotency identity;
- unsafe notification recipient;
- missing required template variables;
- unbounded retry condition;
- secret/PII exposure;
- analytics mutation of transactional truth.

Ambiguous operational state must enter controlled exception handling.

## 43. Required Future Tests

Implementation must eventually test:

- outbox atomicity;
- duplicate event processing;
- duplicate notification prevention;
- retryable notification failure;
- permanent notification failure;
- dead-letter flow;
- worker restart idempotency;
- notification ordering;
- invalid template variables;
- locale fallback;
- preferences/transactional separation;
- work-item authorization;
- work-item transition validation;
- SLA escalation;
- vendor isolation;
- support-view least privilege;
- audit creation;
- analytics event sanitization;
- PII-free metrics;
- provider outage alert;
- cross-environment isolation;
- provenance non-disclosure;
- secret-safe logs.

## 44. Activation Boundary

This document is Future architecture only.

It does NOT:

- send email;
- send SMS;
- send push notifications;
- call WhatsApp;
- create queues;
- create scheduled workers;
- add cloud resources;
- create operational dashboards;
- collect production analytics;
- change Firestore;
- add provider credentials;
- deploy anything.

Future implementation requires a separately approved feature phase with tests,
privacy/security review, emulator/test validation, Blaze staging, explicit
production approval and rollback verification.
