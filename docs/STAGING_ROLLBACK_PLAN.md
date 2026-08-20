# AV Silks Staging Rollback Plan

## Scope

This plan applies first to the dedicated AV Silks Blaze staging
environment. It is a readiness and recovery design, not permission to
perform a rollback.

A rollback may begin only after Explicit approval for the exact staging
incident, exact source release, exact Known-good Git commit, and exact
rollback lane.

Production rollback requires separate approval.

## Preconditions

Before any rollback execution:

1. Confirm the target is the staging project, never the production
   project.
2. Record the currently deployed source Git SHA.
3. Select a Known-good Git commit that is an ancestor of the source
   release.
4. Re-run the canonical pre-deploy verification pipeline.
5. Preserve logs and incident evidence.
6. Confirm the rollback request has Explicit approval.
7. Do not expose or copy payment, Firebase Admin, or other secret values.

## Firebase Hosting rollback lane

Firebase Hosting is treated as its own rollback surface.

The operator must inspect Hosting release history and identify the exact
known-good staging Hosting release/version before any action.

Where a previous Hosting version must be restored, Firebase CLI
`hosting:clone` is an available recovery mechanism, but the exact
source version, destination staging site, and command must be reviewed
again immediately before execution.

No Hosting rollback command belongs in the readiness script.

After restoring Hosting, verify:

- staging domain only;
- `/` and SPA deep links;
- `/admin`;
- public QR provenance page;
- `/api/**` routing behavior;
- no production project mutation.

## Backend Functions rollback lane

Backend Functions are a separate recovery surface from Firebase Hosting.

The current AV Silks Hosting rewrite targets the `api` Function in
`asia-south1`. The current configuration does not rely on `pinTag` for
atomic Hosting/Functions rollback.

Therefore the architecture uses separate rollback lanes unless a future
reviewed and tested configuration deliberately introduces `pinTag`.

For a Backend Functions rollback:

1. Identify the exact Known-good Git commit.
2. Prepare that commit in an isolated temporary Git worktree or other
   non-destructive build location.
3. Install/verify the locked backend dependencies.
4. Run the complete backend regression suite.
5. Run security and secret scans.
6. Confirm the target is the dedicated staging project.
7. Obtain Explicit approval for the exact Functions rollback.
8. Construct and review the staging-only deployment command at execution
   time.
9. Never rewrite the active branch with reset, rebase, or force push as
   part of rollback preparation.

The readiness script itself never deploys Backend Functions.

## Why separate rollback lanes

AV Silks intentionally uses separate rollback lanes for Hosting and
Backend Functions at this stage.

This prevents an operator from assuming that restoring one Hosting
release automatically restores the backend Function version associated
with it.

If `pinTag` is introduced later, that is a separate architecture change
requiring tests, security review, staging validation, documentation, and
a new rollback drill before it becomes trusted.

## Verification after rollback

Every staging rollback requires:

- Security re-validation;
- backend regression tests;
- frontend production build;
- staging-only environment verification;
- Post-rollback smoke test;
- `/api/health` verification;
- public provenance verification using a known staging QR/public ID;
- confirmation that no production project was changed;
- incident notes recording source SHA, target SHA, lane used, approval,
  result, and recovery decision.

A rollback is not considered successful merely because the deployment
command exits successfully.

## Failure handling

If either rollback lane fails verification:

- stop further mutation;
- preserve logs;
- do not switch to production;
- do not retry with broader project permissions;
- do not use force push or destructive Git history rewriting;
- reassess the known-good release and rollback lane;
- obtain fresh approval before another mutation attempt.

## Production boundary

Production rollback requires separate approval.

Staging approval, staging deployment approval, or staging rollback
approval never authorizes a production rollback.
