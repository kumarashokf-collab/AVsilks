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

const guardPath =
  path.join(
    repoRoot,
    'scripts',
    'staging-deploy-preflight.sh'
  );

console.log(
  'STAGING_DEPLOY_GUARD_RED_TEST_SETUP=PASS'
);

test(
  'locks a fail-closed staging-only deployment preflight guard',
  () => {
    assert.equal(
      fs.existsSync(guardPath),
      true,
      'staging deployment preflight guard must exist'
    );

    const guard =
      fs.readFileSync(
        guardPath,
        'utf8'
      );

    const required = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      'STAGING_PROJECT_ID="avsilks-staging-20260820-01"',
      'PRODUCTION_PROJECT_ID="avsilks-5e81a"',
      'git status --porcelain',
      'git ls-remote github',
      'firebase projects:list --json',
      '.firebaserc',
      'firebase.json',
      'STAGING_DEPLOY_APPROVAL_STATUS=REQUIRES_EXPLICIT_APPROVAL',
      'STAGING_DEPLOYMENT_STATUS=NOT_ATTEMPTED',
      'PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED',
      'SECRET_WRITE_STATUS=NOT_ATTEMPTED',
      'STAGING_DEPLOY_PREFLIGHT_GATE=PASS',
    ];

    for (const marker of required) {
      assert.equal(
        guard.includes(marker),
        true,
        `missing staging deployment guard marker: ${marker}`
      );
    }

    const forbidden = [
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /functions:secrets:set/i,
      /projects:create/i,
      /projects:addfirebase/i,
      /gcloud\s+/i,
      /billingAccounts/i,
      /git\s+push\s+.*--force/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        guard,
        pattern,
        `staging deployment preflight contains forbidden operation: ${pattern}`
      );
    }
  }
);
