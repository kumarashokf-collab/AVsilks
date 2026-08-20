'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const repoRoot =
  path.resolve(
    __dirname,
    '..',
    '..'
  );

const pipelinePath =
  path.join(
    repoRoot,
    'scripts',
    'staging-predeploy-verification.sh'
  );

const environmentGuard =
  'scripts/staging-environment-preflight.sh';

const secretGuard =
  'scripts/staging-secret-readiness.sh';

const deploymentGuard =
  'scripts/staging-deploy-preflight.sh';

console.log(
  'STAGING_PREDEPLOY_PIPELINE_RED_TEST_SETUP=PASS'
);

test(
  'locks the canonical fail-closed staging pre-deploy verification pipeline',
  () => {
    assert.equal(
      fs.existsSync(pipelinePath),
      true,
      'staging pre-deploy verification pipeline must exist'
    );

    const pipeline =
      fs.readFileSync(
        pipelinePath,
        'utf8'
      );

    const requiredMarkers = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      environmentGuard,
      secretGuard,
      deploymentGuard,
      'npm test',
      'npm run build',
      'STAGING_PREDEPLOY_ENVIRONMENT_GATE=PASS',
      'STAGING_PREDEPLOY_SECRET_GATE=PASS',
      'STAGING_PREDEPLOY_DEPLOYMENT_IDENTITY_GATE=PASS',
      'STAGING_PREDEPLOY_BACKEND_TEST_GATE=PASS',
      'STAGING_PREDEPLOY_FRONTEND_BUILD_GATE=PASS',
      'STAGING_PREDEPLOY_APPROVAL_STATUS=REQUIRES_EXPLICIT_APPROVAL',
      'STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED',
      'SECRET_VALUES_STATUS=NOT_ACCESSED',
      'SECRET_WRITE_STATUS=NOT_ATTEMPTED',
      'PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED',
      'CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'STAGING_PREDEPLOY_VERIFICATION_GATE=PASS',
    ];

    for (const marker of requiredMarkers) {
      assert.equal(
        pipeline.includes(marker),
        true,
        `missing pre-deploy pipeline marker: ${marker}`
      );
    }

    const environmentIndex =
      pipeline.indexOf(environmentGuard);

    const secretIndex =
      pipeline.indexOf(secretGuard);

    const deploymentIndex =
      pipeline.indexOf(deploymentGuard);

    const backendIndex =
      pipeline.indexOf('npm test');

    const frontendIndex =
      pipeline.indexOf('npm run build');

    assert.ok(
      environmentIndex >= 0 &&
      secretIndex > environmentIndex &&
      deploymentIndex > secretIndex &&
      backendIndex > deploymentIndex &&
      frontendIndex > backendIndex,
      'pre-deploy gates must execute in the locked verification order'
    );

    const forbidden = [
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /functions:secrets:set/i,
      /functions:secrets:access/i,
      /secretmanager/i,
      /projects:create/i,
      /projects:addfirebase/i,
      /gcloud\s+/i,
      /billingAccounts/i,
      /git\s+push/i,
      /git\s+reset/i,
      /git\s+rebase/i,
      /git\s+checkout/i,
      /git\s+switch/i,
      /printenv/i,
      /cat\s+.*\.env/i,
      /process\.env/i,
      /rzp_(?:live|test)_[A-Za-z0-9]{8,}/i,
      /-----BEGIN .*PRIVATE KEY-----/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        pipeline,
        pattern,
        `pre-deploy pipeline contains forbidden mutation or secret operation: ${pattern}`
      );
    }
  }
);
