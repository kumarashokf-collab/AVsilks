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

const harnessPath =
  path.join(
    repoRoot,
    'scripts',
    'staging-e2e-harness.sh'
  );

console.log(
  'STAGING_E2E_RED_TEST_SETUP=PASS'
);

test(
  'locks a staging-only public E2E verification harness',
  () => {
    assert.equal(
      fs.existsSync(harnessPath),
      true,
      'staging E2E harness must exist'
    );

    const source =
      fs.readFileSync(
        harnessPath,
        'utf8'
      );

    const requiredMarkers = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      'STAGING_PROJECT_ID="avsilks-staging-20260820-01"',
      'PRODUCTION_PROJECT_ID="avsilks-5e81a"',
      'STAGING_E2E_BASE_URL',
      'STAGING_E2E_PUBLIC_PROVENANCE_ID',
      '/api/health',
      '/api/provenance/public/',
      'curl',
      'python3',
      'STAGING_E2E_TARGET=STAGING',
      'STAGING_E2E_BASE_URL_TARGET_STATUS=STAGING_ONLY',
      'STAGING_E2E_HEALTH_GATE=PASS',
      'STAGING_E2E_PUBLIC_PROVENANCE_GATE=PASS',
      'STAGING_E2E_PRODUCTION_TARGET_STATUS=BLOCKED',
      'STAGING_E2E_AUTH_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED',
      'STAGING_E2E_PAYMENT_SECRET_VALUES_STATUS=NOT_ACCESSED',
      'STAGING_E2E_DATA_MUTATION_STATUS=NOT_ATTEMPTED',
      'STAGING_E2E_GATE=PASS',
    ];

    for (const marker of requiredMarkers) {
      assert.equal(
        source.includes(marker),
        true,
        `missing staging E2E marker: ${marker}`
      );
    }

    const healthIndex =
      source.indexOf('/api/health');

    const provenanceIndex =
      source.indexOf(
        '/api/provenance/public/'
      );

    assert.ok(
      healthIndex >= 0 &&
      provenanceIndex > healthIndex,
      'health verification must run before public provenance verification'
    );

    const forbidden = [
      /https:\/\/avsilks-5e81a(?:\.|\/)/i,
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /functions:secrets:/i,
      /secretmanager/i,
      /gcloud\s+/i,
      /Authorization\s*:/i,
      /Bearer\s+/i,
      /(?:-X|--request)\s*(?:POST|PUT|PATCH|DELETE)/i,
      /curl[^\n]*(?:POST|PUT|PATCH|DELETE)/i,
      /cat\s+.*\.env/i,
      /printenv/i,
      /process\.env/i,
      /rzp_(?:live|test)_[A-Za-z0-9]{8,}/i,
      /-----BEGIN .*PRIVATE KEY-----/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        source,
        pattern,
        `staging E2E harness contains forbidden production, mutation, or secret operation: ${pattern}`
      );
    }
  }
);
