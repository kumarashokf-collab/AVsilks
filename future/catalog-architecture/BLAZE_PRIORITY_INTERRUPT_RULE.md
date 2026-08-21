# Blaze Priority Interrupt Rule

Blaze production-readiness is P0.

The Future Catalog Architecture is lower priority and may be paused at
any time.

## Trigger

Use this rule when explicit evidence confirms that Blaze/billing approval
is available for the intended AV Silks Firebase staging path.

## If Approval Arrives During Future Work

Do not start another future architecture step.

Finish only the current atomic documentation step to a safe checkpoint:

1. Validate changed files.
2. Validate JSON syntax where applicable.
3. Run the secret scan.
4. Commit the future-only work to its dedicated branch.
5. Push the branch.
6. Verify local SHA equals GitHub remote SHA.
7. Verify clean worktree.
8. Switch back to `release/mvp-production-readiness`.
9. Verify release local SHA equals trusted GitHub release SHA.
10. Resume Blaze Stage 1 from the existing controlled checklist.

## Forbidden During Interrupt

Do not:

- merge future architecture into the release branch
- merge future architecture into main
- modify backend runtime
- modify Firebase configs
- deploy this future architecture
- expose secrets
- skip the Blaze checklist
- treat Blaze approval as production approval

## If Approval Arrives While a One-Command Atomic Gate Is Running

Allow that short atomic gate to reach its safe Git checkpoint.

Then immediately return to the Blaze release branch.

Do not begin the next future step.

## Production Boundary

Blaze staging remains separate from production.

Staging PASS does not authorize production deployment.

Explicit production approval remains mandatory.
