# AV Silks Staging Project Bootstrap

## Purpose

This document governs the creation and approval of the AV Silks Firebase staging environment before any Blaze staging deployment.

The current Spark/production project remains protected while staging readiness is prepared separately.

## Separate Staging Project Required

The existing Firebase project `avsilks-5e81a` is the current AV Silks production/Spark identity and **must never be used as the staging project**.

A separate Firebase project must be selected or created specifically for staging.

The staging identity must be independently verified before it is written into aliases, configuration, CI/CD, deployment commands, billing workflows, or secret provisioning.

## Explicit Cloud Mutation Approval

Discovery and preflight checks are read-only.

Creating a Firebase/Google Cloud project, adding Firebase resources, changing project aliases, enabling billing, changing a billing account, enabling paid services, writing secrets, or deploying resources requires **Explicit Cloud Mutation Approval** from the project owner.

No discovery or preflight command is authorization to perform those mutations.

## Project Creation Gate

Before project creation:

1. Confirm that no suitable separate staging project already exists.
2. Agree on the exact staging project ID.
3. Confirm that the ID is not `avsilks-5e81a`.
4. Obtain explicit approval for the project-creation cloud mutation.
5. Record the resulting staging project identity.
6. Re-run the read-only staging preflight.

Project creation must never be silently inferred from a missing staging project.

## Billing Verification Gate

Billing status must be verified separately and must not be inferred from project discovery.

Before enabling or relying on Blaze capabilities:

- verify which Firebase project is being inspected;
- verify the billing state explicitly;
- review expected no-cost quotas and possible charges;
- configure appropriate budget notifications before production use.

Budget alerts are notifications, not an automatic spending hard cap.

A billing-verification result for staging does not authorize production billing changes.

## Blaze Activation Gate

Blaze activation is a separate approval boundary.

Blaze approval may permit the required staging backend capabilities, but it does not automatically authorize deployment.

Production deployment is not authorized by staging approval.

The required order remains:

staging identity → billing verification → Blaze Activation Gate → staging secret readiness → staging deployment → staging smoke/E2E → security re-audit → explicit production approval.

## Razorpay test mode

The first end-to-end payment validation in the Blaze staging environment must use Razorpay test mode.

Production payment credentials must not be introduced into the staging validation workflow.

Secret values must never be printed in terminal evidence, chat output, Git history, documentation, or test fixtures.

## Production Boundary

The production Firebase identity, production payment identity, production secrets, and production deployment remain separate from staging.

Passing the staging project bootstrap gate means only that the staging identity workflow is ready to proceed safely.

It does not mean:

- Blaze billing is verified;
- billing is enabled;
- secrets are provisioned;
- Functions are deployed;
- production deployment is approved.

## STOP CONDITIONS

Stop the staging bootstrap workflow if any of the following occurs:

- the proposed staging project ID equals `avsilks-5e81a`;
- the staging identity is ambiguous;
- explicit cloud-mutation approval has not been given;
- billing state is unknown where Blaze use is required;
- a command would create, mutate, deploy, or write secrets outside the specifically approved atomic step;
- Git safety or security gates fail;
- a secret value appears in output or tracked files.

The safe default is to remain blocked until the exact missing approval or verification is completed.
