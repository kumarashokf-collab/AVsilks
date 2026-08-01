# Order Security Dependency Risk Acceptance

## Record status

- Project: AV Silks 2
- Phase: Order Security Foundation
- Decision date: 2026-07-30
- Decision status: Temporarily accepted for deployment preparation
- Production status: Not approved by this record alone
- Required review: Before every production deployment and whenever Firebase SDK dependencies change

## Locked dependency state

- Node.js runtime: 22
- firebase-admin: 12.7.0
- firebase-functions: 7.2.5
- fast-xml-parser: 5.10.1
- Dependency install scripts executed during controlled installation: No

## Verified security result

The production dependency audit reported:

- Critical vulnerabilities: 0
- High vulnerabilities: 0
- Moderate vulnerabilities: 8
- Low vulnerabilities: 0

The remaining findings are inherited through the Firebase Admin and Google Cloud dependency tree:

- firebase-admin
- @google-cloud/firestore
- @google-cloud/storage
- google-gax
- gaxios
- retry-request
- teeny-request
- uuid

The npm advisory chain is rooted in the uuid advisory affecting versions below 11.1.1 when vulnerable UUID APIs are supplied a caller-provided buffer.

## Reachability evidence

Static source and exact binding audits established:

- The AV Silks backend directly imports uuid zero times.
- The AV Silks backend directly imports Google transport packages zero times.
- Dependency runtime source contains one confirmed UUID invocation.
- The confirmed invocation is uuid.v4().
- Confirmed runtime calls to uuid.v3(), uuid.v5(), or uuid.v6(): zero.
- Confirmed vulnerable UUID calls with buffer context: zero.
- Firestore Admin API is used by the backend.
- Firebase Storage Admin API is not currently used by backend application source.
- Backend tests passed: 175 of 175.

## Version-selection evidence

Supported Firebase SDK combinations were isolated and compared.

The selected pair:

- firebase-admin 12.7.0
- firebase-functions 7.2.5

produced:

- 0 critical vulnerabilities
- 0 high vulnerabilities
- 8 moderate inherited findings

The tested firebase-admin 14.2.0 combination produced five high-severity findings in its resolved dependency tree and was rejected.

No force upgrade, unsafe override, unsupported peer combination, or blind npm audit fix was accepted.

## Risk decision

The remaining moderate dependency findings are temporarily accepted for staging and deployment-preparation work because:

1. Critical and high findings are zero.
2. The application does not directly invoke the vulnerable UUID APIs.
3. Exact dependency call-site inspection found only uuid.v4().
4. No caller-provided buffer use was found.
5. All backend tests pass.
6. The safer supported Firebase pair was selected from an isolated compatibility and security matrix.

This is a controlled risk acceptance, not a claim that third-party dependencies are vulnerability-free.

## Compensating controls

- Keep Firebase SDK versions and lockfile deterministic.
- Do not introduce direct uuid v3, v5, or v6 usage.
- Do not use force-based npm remediation.
- Run production-only npm audit before every deployment.
- Re-run backend tests after every dependency change.
- Re-run peer-dependency and Functions v2 import checks after every Firebase SDK change.
- Reject any dependency state containing a critical or high finding.
- Review new Firebase, Google Cloud, uuid, and npm advisory releases.
- Maintain deployment rollback readiness.
- Do not deploy until the remaining Order Security gates pass.

## Rejection triggers

This acceptance becomes invalid immediately when:

- A critical or high vulnerability appears.
- Application code introduces direct vulnerable UUID API use.
- A dependency begins invoking uuid v3, v5, or v6 with a buffer.
- Backend tests fail.
- Firebase peer compatibility fails.
- A supported patched dependency combination becomes available with equal or lower overall risk.
- The production deployment audit differs materially from this record.

## Final production gate

Before production deployment, the Security Gate must repeat:

1. Production-only dependency audit.
2. Firebase peer-dependency validation.
3. Functions v2 import smoke test.
4. Full backend test suite.
5. Secret scan.
6. Git history scan.
7. Deployment rollback verification.

Only fresh evidence from those checks may approve production deployment.
