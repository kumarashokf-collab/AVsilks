# Blaze P0 Interrupt Rule

Blaze production-readiness always has first priority.

If verified Blaze/billing approval exists before the next Vendor gate:

DO NOT start that Vendor gate.

Return/remain on:

`release/mvp-production-readiness`

and resume Blaze Stage 1.

If approval arrives during an atomic Vendor gate:

finish only that gate
-> validate
-> secret/privacy scan
-> commit
-> push
-> exact SHA lock
-> clean worktree
-> return to release

Then STOP Vendor architecture work.

If a Vendor gate fails, do not leave an ambiguous dirty state.
Restore the last verified Vendor checkpoint first, then return cleanly to
release.

Never mix Vendor architecture changes with Blaze commits.

Blaze approval does not authorize Vendor/KYC implementation or migration.
