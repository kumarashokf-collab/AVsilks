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

const scriptPath =
  path.join(
    repoRoot,
    'scripts',
    'staging-secret-readiness.sh'
  );

const functionsPath =
  path.join(
    repoRoot,
    'backend',
    'functions.js'
  );

console.log(
  'STAGING_SECRET_READINESS_RED_TEST_SETUP=PASS'
);

test(
  'locks a staging secret names-only readiness boundary',
  () => {
    assert.equal(
      fs.existsSync(scriptPath),
      true,
      'staging secret readiness script must exist'
    );

    assert.equal(
      fs.existsSync(functionsPath),
      true,
      'Firebase Functions entrypoint must exist'
    );

    const script =
      fs.readFileSync(
        scriptPath,
        'utf8'
      );

    const functionsSource =
      fs.readFileSync(
        functionsPath,
        'utf8'
      );

    const requiredSecrets = [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ];

    for (const secretName of requiredSecrets) {
      assert.match(
        functionsSource,
        new RegExp(
          `defineSecret\\(["']${secretName}["']\\)`
        ),
        `Functions entrypoint must declare ${secretName}`
      );

      assert.equal(
        script.includes(secretName),
        true,
        `readiness script must verify ${secretName}`
      );
    }

    const requiredMarkers = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      'STAGING_PROJECT_ID="avsilks-staging-20260820-01"',
      'STAGING_SECRET_NAMES=RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET,RAZORPAY_WEBHOOK_SECRET',
      'STAGING_SECRET_VALUES_STATUS=NOT_ACCESSED',
      'STAGING_SECRET_WRITE_STATUS=NOT_ATTEMPTED',
      'STAGING_SECRET_PROVISIONING_STATUS=BLOCKED_UNTIL_BLAZE_AND_EXPLICIT_APPROVAL',
      'STAGING_SECRET_READINESS_GATE=PASS',
    ];

    for (const marker of requiredMarkers) {
      assert.equal(
        script.includes(marker),
        true,
        `missing staging secret readiness marker: ${marker}`
      );
    }

    const forbidden = [
      /functions:secrets:set/i,
      /functions:secrets:access/i,
      /secretmanager/i,
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /gcloud\s+/i,
      /cat\s+.*\.env/i,
      /printenv/i,
      /process\.env/i,
      /RAZORPAY_KEY_SECRET\s*=\s*[^\s"']{8,}/i,
      /RAZORPAY_WEBHOOK_SECRET\s*=\s*[^\s"']{8,}/i,
      /rzp_(?:live|test)_[A-Za-z0-9]{8,}/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        script,
        pattern,
        `readiness script contains forbidden secret/cloud operation: ${pattern}`
      );
    }
  }
);
