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
    'staging-rollback-readiness.sh'
  );

const planPath =
  path.join(
    repoRoot,
    'docs',
    'STAGING_ROLLBACK_PLAN.md'
  );

console.log(
  'STAGING_ROLLBACK_RED_TEST_SETUP=PASS'
);

test(
  'locks a fail-closed staging rollback readiness architecture',
  () => {
    assert.equal(
      fs.existsSync(scriptPath),
      true,
      'staging rollback readiness script must exist'
    );

    assert.equal(
      fs.existsSync(planPath),
      true,
      'staging rollback plan must exist'
    );

    const script =
      fs.readFileSync(
        scriptPath,
        'utf8'
      );

    const plan =
      fs.readFileSync(
        planPath,
        'utf8'
      );

    const requiredScriptMarkers = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      'STAGING_PROJECT_ID="avsilks-staging-20260820-01"',
      'PRODUCTION_PROJECT_ID="avsilks-5e81a"',
      'STAGING_ROLLBACK_SOURCE_SHA',
      'STAGING_ROLLBACK_TARGET_SHA',
      '--check',
      'git rev-parse',
      'git merge-base',
      'STAGING_ROLLBACK_TARGET=STAGING',
      'STAGING_ROLLBACK_SOURCE_SHA_GATE=PASS',
      'STAGING_ROLLBACK_TARGET_SHA_GATE=PASS',
      'STAGING_ROLLBACK_ANCESTRY_GATE=PASS',
      'STAGING_ROLLBACK_HOSTING_LANE_STATUS=READINESS_ONLY',
      'STAGING_ROLLBACK_FUNCTIONS_LANE_STATUS=READINESS_ONLY',
      'STAGING_ROLLBACK_EXPLICIT_APPROVAL_STATUS=REQUIRED',
      'STAGING_ROLLBACK_EXECUTION_STATUS=NOT_ATTEMPTED',
      'STAGING_ROLLBACK_HOSTING_MUTATION_STATUS=NOT_ATTEMPTED',
      'STAGING_ROLLBACK_FUNCTION_MUTATION_STATUS=NOT_ATTEMPTED',
      'SECRET_VALUES_STATUS=NOT_ACCESSED',
      'PRODUCTION_PROJECT_MUTATION_STATUS=NOT_ATTEMPTED',
      'CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'STAGING_ROLLBACK_READINESS_GATE=PASS',
    ];

    for (const marker of requiredScriptMarkers) {
      assert.equal(
        script.includes(marker),
        true,
        `missing rollback readiness marker: ${marker}`
      );
    }

    const requiredPlanMarkers = [
      '# AV Silks Staging Rollback Plan',
      'Firebase Hosting',
      'Backend Functions',
      'Known-good Git commit',
      'Explicit approval',
      'Hosting release history',
      'hosting:clone',
      'pinTag',
      'separate rollback lanes',
      'Security re-validation',
      'Post-rollback smoke test',
      'Production rollback requires separate approval',
    ];

    for (const marker of requiredPlanMarkers) {
      assert.equal(
        plan.includes(marker),
        true,
        `missing rollback plan marker: ${marker}`
      );
    }

    const forbiddenScriptPatterns = [
      /firebase\s+deploy/i,
      /hosting:clone/i,
      /hosting:channel:deploy/i,
      /functions:secrets:/i,
      /secretmanager/i,
      /gcloud\s+/i,
      /git\s+push/i,
      /git\s+reset/i,
      /git\s+rebase/i,
      /git\s+checkout/i,
      /git\s+switch/i,
      /git\s+revert/i,
      /printenv/i,
      /cat\s+.*\.env/i,
      /process\.env/i,
      /rzp_(?:live|test)_[A-Za-z0-9]{8,}/i,
      /-----BEGIN .*PRIVATE KEY-----/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbiddenScriptPatterns) {
      assert.doesNotMatch(
        script,
        pattern,
        `rollback readiness script contains forbidden mutation or secret operation: ${pattern}`
      );
    }

    const hostingIndex =
      plan.indexOf(
        'Firebase Hosting'
      );

    const functionsIndex =
      plan.indexOf(
        'Backend Functions'
      );

    assert.ok(
      hostingIndex >= 0 &&
      functionsIndex > hostingIndex,
      'rollback plan must document Hosting before Backend Functions'
    );
  }
);
