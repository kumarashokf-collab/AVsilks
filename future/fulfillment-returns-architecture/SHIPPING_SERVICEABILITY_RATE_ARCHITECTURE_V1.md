# AV Silks Future Shipping Serviceability & Rate Architecture v1

Status: FUTURE-ONLY / PROVIDER-NEUTRAL DESIGN / NOT ACTIVE MVP IMPLEMENTATION

## 1. Purpose

Define a deterministic, auditable and provider-neutral architecture for India-wide delivery serviceability and shipping-rate calculation without changing the current AV Silks MVP.

This architecture covers planning only.

It does not call a courier API, create a shipment, change checkout behavior, deploy cloud resources or access any real credentials.

## 2. Core Rule

Shipping serviceability and shipping price are related but separate decisions.

A destination may be:

- serviceable and prepaid eligible;
- serviceable and COD eligible;
- serviceable with restricted package limits;
- temporarily unavailable;
- permanently unsupported;
- unknown pending provider/policy resolution.

A shipping quote must never be created from ambiguous serviceability.

## 3. Pincode Normalization

For India delivery, future implementation should treat destination pincode as a normalized six-digit routing input.

Rules:

- accept text input at the API boundary;
- trim surrounding whitespace;
- reject non-numeric characters after approved normalization;
- reject invalid length;
- never infer a missing pincode from free-form address text;
- never log the full customer address merely to validate serviceability;
- validation of pincode syntax does not prove serviceability.

Conceptual normalized field:

`destinationPincode`

Pincode alone must not be treated as customer identity.

## 4. Serviceability Decision Model

Canonical result:

- `SERVICEABLE`
- `UNSERVICEABLE`
- `TEMPORARILY_UNAVAILABLE`
- `RESTRICTED`
- `UNKNOWN`

Conceptual response fields:

- normalized pincode
- serviceability state
- prepaid allowed
- COD allowed
- reverse-pickup allowed
- applicable shipping zone
- package-weight limit
- package-dimension constraints
- delivery-estimate range
- restriction reason code
- policy version
- evaluated timestamp
- expiry/refresh timestamp where applicable

Internal provider-specific metadata remains private.

## 5. Serviceability Source Priority

Future serviceability may be derived from one or more reviewed sources:

1. AV Silks explicit policy deny/allow rules
2. temporary operational overrides
3. courier/provider capability
4. warehouse/origin compatibility
5. product/package restrictions
6. COD-specific restrictions

The final result must be normalized into the AV Silks canonical serviceability model.

Provider response formats must not leak directly into frontend business logic.

## 6. Shipping Zone Architecture

A zone is an internal pricing/operations classification, not necessarily a courier zone.

Conceptual examples:

- local
- regional
- metro
- national
- remote
- special-handling

Actual names/rules remain configurable.

A zone may be based on:

- origin location
- destination pincode
- state/region
- operational lane
- remote-area classification
- provider capability

Zone mapping must be versioned so historical orders can preserve their original shipping quote.

## 7. Origin Model

Rate/serviceability evaluation requires an explicit origin.

Future origin entity may represent:

- AV Silks warehouse
- approved fulfillment center
- future vendor dispatch location

Conceptual fields:

- `originId`
- normalized dispatch pincode
- enabled/disabled state
- supported fulfillment scope
- policy version

Customer-facing responses should not expose unnecessary private warehouse metadata.

## 8. Rate Calculation Inputs

Canonical rate calculation may use:

- origin ID
- destination pincode
- shipping zone
- physical weight
- volumetric weight
- chargeable weight
- package count
- package dimensions
- order subtotal
- payment mode
- shipping service level
- product handling flags
- policy version

Customer name, email and phone are not required merely to compute a base rate.

## 9. Weight Model

All weight calculations must use a canonical unit internally.

Recommended future internal unit:

`grams`

Rules:

- no floating-point currency/weight ambiguity;
- validate positive limits;
- package/item weights come from trusted product/packing data;
- user-supplied weight must never become authoritative checkout pricing truth.

## 10. Volumetric Weight

Where a provider/service requires volumetric pricing, future implementation should calculate:

`volumetricWeight = (length x width x height) / divisor`

The divisor is provider/service/policy specific and must therefore be configuration, not hard-coded business truth.

Chargeable weight concept:

`chargeableWeight = max(actualWeight, volumetricWeight)`

Unit conversion and rounding rules must be explicit and tested.

## 11. Weight Slabs

Rate rules may use slabs such as:

- base slab
- additional incremental slab
- oversize/overweight rule

Exact commercial values are future configuration.

Rate logic must define:

- inclusive/exclusive boundaries;
- rounding direction;
- maximum weight;
- unsupported ranges.

A boundary value must produce one deterministic result.

## 12. Currency Safety

All monetary shipping values should use integer minor currency units.

For INR:

`paise`

Examples of conceptual fields:

- `baseShippingPaise`
- `weightChargePaise`
- `remoteAreaSurchargePaise`
- `handlingChargePaise`
- `discountPaise`
- `taxPaise`
- `finalShippingPaise`

Never use binary floating-point as authoritative money truth.

Final shipping amount invariant:

`finalShippingPaise >= 0`

## 13. Shipping Quote Model

A calculated quote should become an immutable checkout snapshot.

Conceptual fields:

- `shippingQuoteId`
- origin ID
- destination pincode
- zone
- service level
- chargeable weight
- component breakdown
- final shipping amount
- COD eligibility
- estimated delivery range
- rate-policy version
- serviceability-policy version
- created timestamp
- expiry timestamp
- optional provider quote reference where safe

The client must not submit an arbitrary final shipping amount as authoritative.

## 14. Quote Expiry

Serviceability and prices may change.

Therefore a quote may have a defined validity period.

At order creation:

1. verify quote identity;
2. verify quote is not expired;
3. verify destination/order inputs still match;
4. recompute or reject when required;
5. preserve the accepted quote snapshot on the order.

Expired quote handling must fail safely rather than silently accepting stale shipping price.

## 15. Free Shipping Architecture

Free shipping is a pricing policy, not the absence of shipping calculation.

Potential future conditions:

- order threshold
- campaign
- customer segment
- category/product rule
- location/zone
- owner-approved promotion

The system should still calculate the underlying shipping cost where needed for analytics/accounting while separately recording customer shipping charge.

Conceptual separation:

- operational shipping cost
- customer shipping charge
- shipping discount

## 16. Shipping Promotions

Shipping promotions must be server-authoritative.

Promotion evaluation should define:

- validity dates
- minimum order value
- applicable products/categories
- applicable zones
- payment-mode restrictions
- maximum discount
- usage limits where needed
- stacking policy

A promotion cannot make an unserviceable destination serviceable.

## 17. COD Eligibility

COD eligibility is separate from general serviceability.

Canonical COD result:

- allowed
- not allowed
- temporarily disabled
- restricted

Possible future factors:

- pincode
- courier/service capability
- order value limit
- customer risk policy
- product restriction
- vendor restriction
- operational override

No client-side flag can authorize COD.

## 18. Reverse Pickup Eligibility

Return serviceability may differ from outbound serviceability.

Store separately:

- outbound serviceability
- reverse-pickup serviceability

A pincode may support delivery but not automated reverse pickup.

Return policy must define an alternative authorized process when necessary.

## 19. Delivery Estimate

Delivery estimate should be represented as a range rather than a false guarantee.

Conceptual:

- minimum estimated days
- maximum estimated days
- calculated date range
- source/policy version

Estimate calculation may consider:

- origin-destination lane
- service level
- order cutoff
- weekends/holidays
- handling time
- product availability

Future implementation must distinguish:

`estimated` from `promised/guaranteed`.

## 20. Temporary Overrides

Authorized operators may require temporary controls such as:

- disable a pincode/zone;
- disable COD;
- disable reverse pickup;
- apply temporary operational restriction.

Every override should contain:

- reason code
- actor
- effective start
- expiry where applicable
- audit reference

Temporary override must not silently become permanent configuration.

## 21. Provider Abstraction

Core checkout must depend on an internal interface, not a specific courier SDK.

Conceptual capabilities:

- check serviceability
- obtain optional provider rate
- estimate delivery
- expose service capability metadata

Provider adapter output must normalize into AV Silks internal models.

A provider outage must be handled through explicit fallback/fail-closed policy.

## 22. Rate Source Strategy

Future policy may support:

### Internal contract rate
AV Silks computes rates from approved configured commercial slabs.

### Provider dynamic quote
An adapter requests a provider quote.

### Hybrid
Internal policy selects/normalizes provider results and applies AV Silks pricing rules.

Whichever strategy is selected must remain deterministic, audited and tested.

## 23. Multi-Provider Selection

If multiple couriers exist later, selection may consider:

- serviceability
- expected delivery
- operational reliability
- cost
- COD support
- reverse-pickup support
- weight/dimension capability
- business priority

Selection logic must not expose provider credentials or confidential commercial rates to unauthorized clients.

## 24. Multi-Vendor Compatibility

Future vendor fulfillment may calculate shipping per vendor-origin fulfillment.

Rules:

- origin must be explicit;
- vendor A rate credentials/config cannot be visible to vendor B;
- cross-vendor package consolidation requires an explicit platform process;
- a single order may have multiple shipment quotes internally;
- customer-facing charge policy must remain deterministic.

## 25. Handloom / Product Restrictions

Future products may carry shipping-relevant attributes such as:

- fragile
- high-value
- oversize
- special packaging
- restricted delivery mode

These attributes must be controlled product data.

Public QR provenance remains separate and must not reveal customer shipping data.

## 26. Caching

Serviceability lookups may be cached only when safe.

Cache key may include:

- origin
- destination pincode
- service level
- policy/provider version

Cache entries require expiry.

Temporary provider failure must not cause stale positive serviceability to persist indefinitely.

## 27. Idempotency

Quote creation should support an idempotency boundary where repeated identical requests could otherwise create duplicate durable quote records.

Idempotency must not allow reuse of a quote for different:

- destination
- origin
- cart/order composition
- payment mode when relevant

## 28. Security and Privacy

Never place in logs, docs or public APIs:

- courier API secret
- webhook secret
- customer full address
- unnecessary phone/email
- private provider contract data
- internal fraud/risk decisions

Public checkout responses contain only data needed for the customer decision.

## 29. Audit Requirements

Audit-sensitive changes include:

- pincode override
- zone mapping change
- rate-policy change
- free-shipping policy change
- COD eligibility override
- provider selection rule change

Historical orders retain the accepted rate/serviceability snapshot and policy version.

## 30. Failure Rules

Fail closed on:

- malformed pincode
- unknown required origin
- invalid package weight/dimensions
- ambiguous rate
- negative monetary result
- expired quote
- policy-version mismatch where revalidation is required
- conflicting serviceability state
- unauthorized override

Provider timeout must result in an explicit operational response, not fabricated serviceability.

## 31. Required Future Tests

Future implementation must include tests for:

- valid/invalid pincode normalization
- serviceable/unserviceable/restricted states
- zone boundaries
- weight-slab boundaries
- volumetric calculation
- rounding
- free-shipping threshold boundaries
- COD restrictions
- reverse-pickup difference
- expired quote
- quote tampering
- provider timeout/fallback
- multi-provider normalization
- multi-vendor origin isolation
- privacy-safe logging
- integer-money invariants
- deterministic repeated calculation

## 32. Activation Boundary

This document is architecture only.

It does NOT:

- modify checkout;
- add courier credentials;
- create a cloud resource;
- call any shipping provider;
- create a shipment;
- change Firestore;
- deploy anything.

Any future implementation requires its own feature branch, tests, emulator/staging validation, security review, secrets handling, explicit production approval and rollback verification.
