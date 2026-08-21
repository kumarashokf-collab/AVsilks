# Blaze P0 Interrupt Rule — Fulfillment & Returns Architecture

Blaze production-readiness always has first priority.

## Before starting any Future Fulfillment gate

If verified Blaze/billing approval exists before the next Fulfillment & Returns architecture gate:

**DO NOT start that future gate.**

Return/remain on:

`release/mvp-production-readiness`

and resume Blaze Stage 1.

## If Blaze approval arrives during an atomic Future gate

Finish only the current atomic gate:

1. complete the current file/gate;
2. validate its expected output;
3. run applicable secret/privacy/security checks;
4. commit only the verified Future architecture scope;
5. push the Future branch;
6. verify exact remote SHA lock;
7. verify clean worktree;
8. return to `release/mvp-production-readiness`;
9. resume Blaze immediately.

Then STOP Future Fulfillment work until the Blaze priority task reaches its next safe waiting boundary.

## Failure handling

If the current Future gate fails, do not leave an ambiguous dirty state.

Restore or resolve the Future branch to the last verified checkpoint first, verify clean state, then return safely to the release branch.

## Isolation rules

- Never mix Fulfillment future architecture changes with Blaze/release commits.
- Never edit `main` for this Future architecture track.
- Future architecture preparation does not increase MVP completion.
- Blaze approval does not authorize Fulfillment implementation or production migration.
- No courier/payment/customer secrets belong in Future architecture documents.
- Production changes require their own explicit approval.

## Priority

`BLAZE_PRIORITY=P0_LOCKED`
