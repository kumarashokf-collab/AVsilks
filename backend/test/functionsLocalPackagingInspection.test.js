'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const {
  spawnSync,
} =
  require('node:child_process');

const repoRoot =
  path.resolve(
    __dirname,
    '..',
    '..'
  );

const inspectorPath =
  path.join(
    repoRoot,
    'scripts',
    'inspect-functions-package.py'
  );

console.log(
  'LOCAL_FUNCTIONS_PACKAGE_INSPECTION_RED_TEST_SETUP=PASS'
);

test(
  'provides a strictly local Functions package inspector',
  () => {
    assert.equal(
      fs.existsSync(
        inspectorPath
      ),
      true,
      'local Functions package inspector must exist'
    );

    const source =
      fs.readFileSync(
        inspectorPath,
        'utf8'
      );

    const requiredMarkers = [
      'firebase.json',
      'backend/package.json',
      'backend/functions.js',
      '.runtimeconfig.json',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'LOCAL_FUNCTIONS_PACKAGE_INSPECTION_GATE=PASS',
      'CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED',
      'SECRET_VALUES_STATUS=NOT_ACCESSED',
    ];

    for (
      const marker
      of requiredMarkers
    ) {
      assert.equal(
        source.includes(
          marker
        ),
        true,
        `missing inspector marker: ${marker}`
      );
    }

    const forbiddenOperations = [
      /firebase\s+deploy/i,
      /--dry-run/i,
      /functions:secrets:set/i,
      /gcloud\s+/i,
      /curl\s+/i,
      /wget\s+/i,
      /requests\./i,
      /urllib/i,
      /https?:\/\//i,
    ];

    for (
      const pattern
      of forbiddenOperations
    ) {
      assert.doesNotMatch(
        source,
        pattern,
        `local inspector must not contain cloud/network operation: ${pattern}`
      );
    }
  }
);

test(
  'local Functions package inspector runs read-only and reports the locked boundary',
  () => {
    assert.equal(
      fs.existsSync(
        inspectorPath
      ),
      true,
      'local Functions package inspector must exist before execution'
    );

    const result =
      spawnSync(
        'python3',
        [
          inspectorPath,
        ],
        {
          cwd: repoRoot,
          encoding: 'utf8',
        }
      );

    assert.equal(
      result.status,
      0,
      result.stdout +
      result.stderr
    );

    const output =
      result.stdout;

    const requiredOutput = [
      'LOCAL_PACKAGE_SOURCE=backend',
      'LOCAL_PACKAGE_CODEBASE=api',
      'LOCAL_PACKAGE_NODE_RUNTIME=22',
      'LOCAL_PACKAGE_ENTRYPOINT=functions.js',
      'LOCAL_PACKAGE_SENSITIVE_EXCLUSION_GATE=PASS',
      'LOCAL_PACKAGE_RUNTIME_CONFIG_EXCLUSION_GATE=PASS',
      'LOCAL_PACKAGE_TEST_EXCLUSION_GATE=PASS',
      'LOCAL_PACKAGE_SECRET_NAME_BINDING_GATE=PASS',
      'LOCAL_PACKAGE_ENTRYPOINT_GATE=PASS',
      'LOCAL_PACKAGE_NODE22_GATE=PASS',
      'CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED',
      'SECRET_VALUES_STATUS=NOT_ACCESSED',
      'LOCAL_FUNCTIONS_PACKAGE_INSPECTION_GATE=PASS',
    ];

    for (
      const marker
      of requiredOutput
    ) {
      assert.equal(
        output.includes(
          marker
        ),
        true,
        `missing inspector output marker: ${marker}`
      );
    }
  }
);
