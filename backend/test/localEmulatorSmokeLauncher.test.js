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

const firebasePath =
  path.join(
    repoRoot,
    'firebase.json'
  );

const launcherPath =
  path.join(
    repoRoot,
    'scripts',
    'run-local-emulator-smoke.sh'
  );

const smokePath =
  path.join(
    repoRoot,
    'scripts',
    'local-emulator-smoke.py'
  );

console.log(
  'LOCAL_EMULATOR_SECRET_ISOLATION_RED_TEST_SETUP=PASS'
);

test(
  'preserves the local emulator configuration boundary',
  () => {
    const firebase =
      JSON.parse(
        fs.readFileSync(
          firebasePath,
          'utf8'
        )
      );

    assert.equal(
      firebase.emulators.auth.port,
      9099
    );

    assert.equal(
      firebase.emulators.firestore.port,
      8080
    );

    assert.equal(
      firebase.emulators.functions.port,
      5001
    );

    assert.equal(
      firebase.emulators.hosting.port,
      5000
    );

    assert.equal(
      firebase.emulators.ui.enabled,
      false
    );

    assert.equal(
      firebase.emulators.singleProjectMode,
      true
    );

    const functionsConfig =
      firebase.functions[0];

    assert.equal(
      functionsConfig.ignore.includes(
        '*.local'
      ),
      true,
      '*.local must remain excluded from Functions packaging'
    );
  }
);

test(
  'provides a production-secret-isolated local emulator launcher',
  () => {
    assert.equal(
      fs.existsSync(
        launcherPath
      ),
      true,
      'safe local emulator smoke launcher must exist'
    );

    const launcher =
      fs.readFileSync(
        launcherPath,
        'utf8'
      );

    const required = [
      '#!/usr/bin/env bash',
      'set +e',
      'demo-avsilks-local',
      'git archive',
      'mktemp -d',
      '.secret.local',
      '.env.local',
      'trap cleanup EXIT INT TERM',
      'firebase emulators:exec',
      'auth,firestore,functions,hosting',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'LOCAL_EMULATOR_SECRET_ISOLATION_GATE=PASS',
      'PRODUCTION_SECRET_VALUES_STATUS=NOT_ACCESSED',
      'CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'FIREBASE_DEPLOY_STATUS=NOT_ATTEMPTED',
    ];

    for (
      const marker
      of required
    ) {
      assert.equal(
        launcher.includes(
          marker
        ),
        true,
        `missing launcher marker: ${marker}`
      );
    }

    const forbidden = [
      /avsilks-5e81a/i,
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /functions:secrets:(?:access|set)/i,
      /gcloud\s+/i,
      /cat\s+[^\n]*\.env/i,
      /source\s+[^\n]*\.env/i,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
      /\brzp_(?:live|test)_[A-Za-z0-9]+\b/i,
      /\bAIza[0-9A-Za-z_-]{20,}\b/,
      /set\s+-e\b/,
    ];

    for (
      const pattern
      of forbidden
    ) {
      assert.doesNotMatch(
        launcher,
        pattern,
        `unsafe launcher operation/content: ${pattern}`
      );
    }
  }
);

test(
  'provides a localhost-only emulator smoke probe',
  () => {
    assert.equal(
      fs.existsSync(
        smokePath
      ),
      true,
      'local emulator smoke probe must exist'
    );

    const smoke =
      fs.readFileSync(
        smokePath,
        'utf8'
      );

    const required = [
      'demo-avsilks-local',
      '127.0.0.1',
      '9099',
      '8080',
      '5001',
      '5000',
      '/api/health',
      'LOCAL_EMULATOR_AUTH_SMOKE_GATE=PASS',
      'LOCAL_EMULATOR_FIRESTORE_SMOKE_GATE=PASS',
      'LOCAL_EMULATOR_FUNCTIONS_SMOKE_GATE=PASS',
      'LOCAL_EMULATOR_HOSTING_SMOKE_GATE=PASS',
      'LOCAL_EMULATOR_SMOKE_GATE=PASS',
    ];

    for (
      const marker
      of required
    ) {
      assert.equal(
        smoke.includes(
          marker
        ),
        true,
        `missing smoke marker: ${marker}`
      );
    }

    assert.doesNotMatch(
      smoke,
      /avsilks-5e81a/i,
      'smoke probe must never reference the real Firebase project'
    );

    assert.doesNotMatch(
      smoke,
      /https:\/\//i,
      'smoke probe must remain localhost HTTP only'
    );

    const urls =
      smoke.match(
        /http:\/\/[^\s"'`]+/g
      ) || [];

    for (
      const url
      of urls
    ) {
      assert.equal(
        url.startsWith(
          'http://127.0.0.1:'
        ),
        true,
        `non-local URL forbidden in emulator smoke probe: ${url}`
      );
    }
  }
);


console.log(
  'LOCAL_EMULATOR_RUNTIME_FAILURE_REGRESSION_RED_TEST_SETUP=PASS'
);

test(
  'locks atomic archive status and sandbox firebase-functions bin isolation',
  () => {
    const launcher =
      fs.readFileSync(
        launcherPath,
        'utf8'
      );

    assert.equal(
      launcher.includes(
        'pipeline_status=("${PIPESTATUS[@]}")'
      ),
      true,
      'archive pipeline status must be captured atomically'
    );

    assert.match(
      launcher,
      /\[\s*"\$dependency_name"\s*=\s*"\.bin"\s*\]/,
      'sandbox must not symlink the original node_modules/.bin directory'
    );

    assert.equal(
      launcher.includes(
        'backend/node_modules/.bin/firebase-functions'
      ),
      true,
      'sandbox firebase-functions bin path must be explicit'
    );

    assert.equal(
      launcher.includes(
        'LOCAL_EMULATOR_ARCHIVE_PIPELINE_STATUS_GATE=PASS'
      ),
      true,
      'archive pipeline status gate marker must exist'
    );

    assert.equal(
      launcher.includes(
        'LOCAL_EMULATOR_SANDBOX_BIN_ISOLATION_GATE=PASS'
      ),
      true,
      'sandbox bin isolation gate marker must exist'
    );
  }
);
