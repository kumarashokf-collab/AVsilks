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
    'staging-environment-preflight.sh'
  );

const rootRcPath =
  path.join(
    repoRoot,
    '.firebaserc'
  );

const nestedRcPath =
  path.join(
    repoRoot,
    'frontend',
    '.firebaserc'
  );

const nestedFirebasePath =
  path.join(
    repoRoot,
    'frontend',
    'firebase.json'
  );

const frontendFirebasePath =
  path.join(
    repoRoot,
    'frontend',
    'src',
    'firebase.js'
  );

const backendFirebaseOptionsPath =
  path.join(
    repoRoot,
    'backend',
    'src',
    'config',
    'firebaseOptions.js'
  );

console.log(
  'STAGING_ENVIRONMENT_RED_TEST_SETUP=PASS'
);

test(
  'locks frontend and backend staging environment isolation',
  () => {
    const rootRc =
      JSON.parse(
        fs.readFileSync(
          rootRcPath,
          'utf8'
        )
      );

    const nestedRc =
      JSON.parse(
        fs.readFileSync(
          nestedRcPath,
          'utf8'
        )
      );

    const nestedFirebase =
      JSON.parse(
        fs.readFileSync(
          nestedFirebasePath,
          'utf8'
        )
      );

    assert.equal(
      rootRc.projects.default,
      'avsilks-5e81a',
      'root production alias must remain locked'
    );

    assert.equal(
      rootRc.projects.staging,
      'avsilks-staging-20260820-01',
      'root staging alias must remain locked'
    );

    assert.equal(
      nestedRc.projects.default,
      'DISABLED_USE_ROOT_CONFIG',
      'nested frontend Firebase default must be quarantined'
    );

    assert.notEqual(
      nestedRc.projects.default,
      rootRc.projects.default
    );

    assert.notEqual(
      nestedRc.projects.default,
      rootRc.projects.staging
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        nestedFirebase,
        'functions'
      ),
      false,
      'nested legacy Functions deployment config must be removed'
    );

    assert.equal(
      fs.existsSync(scriptPath),
      true,
      'staging environment preflight script must exist'
    );

    const script =
      fs.readFileSync(
        scriptPath,
        'utf8'
      );

    const frontend =
      fs.readFileSync(
        frontendFirebasePath,
        'utf8'
      );

    const backend =
      fs.readFileSync(
        backendFirebaseOptionsPath,
        'utf8'
      );

    assert.match(
      frontend,
      /VITE_USE_FIREBASE_EMULATORS/
    );

    assert.match(
      frontend,
      /VITE_FIREBASE_PROJECT_ID/
    );

    assert.match(
      frontend,
      /demo-avsilks-local/
    );

    assert.doesNotMatch(
      frontend,
      /avsilks-staging-20260820-01/
    );

    assert.doesNotMatch(
      frontend,
      /avsilks-5e81a/
    );

    assert.match(
      backend,
      /FIREBASE_PROJECT_ID/
    );

    assert.match(
      backend,
      /FIREBASE_CLIENT_EMAIL/
    );

    assert.match(
      backend,
      /FIREBASE_PRIVATE_KEY/
    );

    assert.match(
      backend,
      /applicationDefault/
    );

    const requiredMarkers = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      'STAGING_PROJECT_ID="avsilks-staging-20260820-01"',
      'PRODUCTION_PROJECT_ID="avsilks-5e81a"',
      'LOCAL_EMULATOR_PROJECT_ID="demo-avsilks-local"',
      'NESTED_FRONTEND_PROJECT_ID="DISABLED_USE_ROOT_CONFIG"',
      'FRONTEND_LEGACY_FIREBASE_CONFIG_STATUS=QUARANTINED',
      'STAGING_FRONTEND_CONFIG_VALUES_STATUS=NOT_ACCESSED',
      'STAGING_BACKEND_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED',
      'PRODUCTION_CREDENTIAL_VALUES_STATUS=NOT_ACCESSED',
      'STAGING_ENVIRONMENT_PROVISIONING_STATUS=REQUIRES_SECURE_LOCAL_OR_PLATFORM_CONFIGURATION',
      'STAGING_ENVIRONMENT_BOUNDARY_GATE=PASS',
    ];

    for (const marker of requiredMarkers) {
      assert.equal(
        script.includes(marker),
        true,
        `missing staging environment marker: ${marker}`
      );
    }

    const forbidden = [
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /functions:secrets:set/i,
      /secretmanager/i,
      /gcloud\s+/i,
      /cat\s+.*\.env/i,
      /printenv/i,
      /process\.env/i,
      /rzp_(?:live|test)_[A-Za-z0-9]{8,}/i,
      /-----BEGIN .*PRIVATE KEY-----/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        script,
        pattern,
        `staging environment preflight contains forbidden operation: ${pattern}`
      );
    }
  }
);
