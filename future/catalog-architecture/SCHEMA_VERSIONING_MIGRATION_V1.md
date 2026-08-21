# AV Silks Schema Versioning & Migration Architecture v1

Status: FUTURE ONLY

No migration is authorized by this document.

## Versioning

Future catalog records use an explicit `schemaVersion`.

Taxonomy has its own version and must not silently reuse an existing ID
for a different meaning.

Unknown or unsupported schema versions fail closed until an approved
migration path exists.

## Migration sequence

Future migration order:

1. source discovery
2. backup
3. backup verification
4. mapping plan
5. read-only dry-run
6. validation
7. staging migration
8. source/target reconciliation
9. rollback drill
10. explicit production approval
11. production migration
12. post-migration verification

Skipping directly to production is forbidden.

## Legacy sarees

Existing saree products must preserve stable commerce identity wherever
possible.

A legacy saree remains `single-sku` unless source data explicitly proves
that real sellable variants exist.

Migration must not invent size/color variants merely to fit the new
architecture.

Existing provenance relationships must be preserved and verified.

## Variant migration

Variant creation requires explicit source evidence and deterministic
mapping.

Before migration validate:

- SKU uniqueness
- variant identity
- inventory mode
- stock
- reservedStock
- attribute compatibility

SKU collisions fail closed.

## Backward compatibility

During a future controlled migration, compatibility behavior must be
explicitly documented.

Do not silently repurpose fields or IDs.

Unsupported versions require a known migration path or rejection.

## Dry-run

A read-only dry-run produces a migration plan and validation report
without writing target production data.

The dry-run should identify:

- invalid records
- missing taxonomy mapping
- duplicate SKU
- inventory inconsistencies
- unsupported attributes
- provenance-link risk

## Idempotency and checkpoints

Future migration execution must be idempotent and resumable.

A repeated migration step must not duplicate products, variants,
inventory, or provenance records.

Safe checkpoints must support interruption and restart.

## Reconciliation

After staging migration compare:

- source product count
- target product count
- SKU count
- inventory totals
- variant mappings
- provenance links
- rejected/quarantined records

Differences require investigation before production approval.

## Rollback

Rollback must be defined and tested before production migration.

A verified pre-migration backup is mandatory.

Production migration must stop if rollback readiness is uncertain.

## Approval boundary

Architecture approval is not migration approval.

Blaze approval is not migration approval.

Production migration requires a separate explicit future authorization.

## Safety boundary

This architecture performs no database writes and changes no backend,
frontend runtime, Firebase rules, Firebase configuration or deployment.

Blaze production-readiness remains P0.
