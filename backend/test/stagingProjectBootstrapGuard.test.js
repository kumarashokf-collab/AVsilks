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

const docPath =
  path.join(
    repoRoot,
    'docs',
    'STAGING_PROJECT_BOOTSTRAP.md'
  );

const guardPath =
  path.join(
    repoRoot,
    'scripts',
    'staging-project-preflight.sh'
  );

console.log(
  'STAGING_PROJECT_BOOTSTRAP_RED_TEST_SETUP=PASS'
);

test(
  'documents the separate staging project approval boundary',
  () => {
    assert.equal(
      fs.existsSync(docPath),
      true,
      'staging project bootstrap document must exist'
    );

    const source =
      fs.readFileSync(
        docPath,
        'utf8'
      );

    const required = [
      '# AV Silks Staging Project Bootstrap',
      'Separate Staging Project Required',
      'avsilks-5e81a',
      'must never be used as the staging project',
      'Explicit Cloud Mutation Approval',
      'Project Creation Gate',
      'Billing Verification Gate',
      'Blaze Activation Gate',
      'Budget alerts are notifications, not an automatic spending hard cap.',
      'Razorpay test mode',
      'Production deployment is not authorized by staging approval.',
      'STOP CONDITIONS',
    ];

    for (const marker of required) {
      assert.equal(
        source.includes(marker),
        true,
        `missing staging bootstrap marker: ${marker}`
      );
    }
  }
);

test(
  'provides a read-only staging project preflight guard',
  () => {
    assert.equal(
      fs.existsSync(guardPath),
      true,
      'read-only staging project preflight guard must exist'
    );

    const source =
      fs.readFileSync(
        guardPath,
        'utf8'
      );

    const required = [
      '#!/usr/bin/env bash',
      'set +e',
      'release/mvp-production-readiness',
      'avsilks-5e81a',
      'firebase projects:list --json',
      'STAGING_PROJECT_STATUS=NOT_FOUND',
      'STAGING_PROJECT_BOOTSTRAP_STATUS=BLOCKED_REQUIRES_EXPLICIT_APPROVAL',
      'BLAZE_BILLING_STATUS=NOT_CHECKED_NOT_INFERRED',
      'CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED',
      'SECRET_VALUES_STATUS=NOT_ACCESSED',
      'STAGING_PROJECT_PREFLIGHT_GATE=PASS',
    ];

    for (const marker of required) {
      assert.equal(
        source.includes(marker),
        true,
        `missing staging guard marker: ${marker}`
      );
    }

    const forbidden = [
      /firebase\s+projects:create/i,
      /firebase\s+projects:addfirebase/i,
      /firebase\s+use\b/i,
      /firebase\s+deploy/i,
      /functions:secrets:set/i,
      /gcloud\s+/i,
      /billingAccounts/i,
      /--force/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        source,
        pattern,
        `staging preflight must remain read-only: ${pattern}`
      );
    }
  }
);
