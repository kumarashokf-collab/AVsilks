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
    'blaze-activation-preflight.sh'
  );

const firebasercPath =
  path.join(
    repoRoot,
    '.firebaserc'
  );

const PRODUCTION_PROJECT_ID =
  'avsilks-5e81a';

const STAGING_PROJECT_ID =
  'avsilks-staging-20260820-01';

console.log(
  'BLAZE_STAGING_ISOLATION_RED_TEST_SETUP=PASS'
);

test(
  'forces Blaze activation preflight onto the dedicated staging project',
  () => {
    assert.equal(
      fs.existsSync(guardPath),
      true,
      'Blaze activation preflight must exist'
    );

    assert.equal(
      fs.existsSync(firebasercPath),
      true,
      '.firebaserc must exist'
    );

    const guard =
      fs.readFileSync(
        guardPath,
        'utf8'
      );

    const firebaseConfig =
      JSON.parse(
        fs.readFileSync(
          firebasercPath,
          'utf8'
        )
      );

    assert.equal(
      firebaseConfig.projects.default,
      PRODUCTION_PROJECT_ID,
      'production default alias must remain unchanged'
    );

    assert.equal(
      firebaseConfig.projects.staging,
      STAGING_PROJECT_ID,
      'dedicated staging alias must remain locked'
    );

    assert.match(
      guard,
      /STAGING_PROJECT_ID=["']avsilks-staging-20260820-01["']/,
      'Blaze preflight must target dedicated staging project'
    );

    assert.doesNotMatch(
      guard,
      /PROJECT_ID=["']avsilks-5e81a["']/,
      'Blaze preflight must not target production project'
    );

    assert.match(
      guard,
      /firebase projects:list --json/,
      'Blaze preflight project discovery must remain read-only'
    );

    assert.match(
      guard,
      /BLAZE_BILLING_STATUS=REQUIRES_SEPARATE_VERIFICATION/,
      'billing must remain a separate verification gate'
    );

    assert.doesNotMatch(
      guard,
      /firebase\s+deploy/i,
      'Blaze staging preflight must not deploy'
    );

    assert.doesNotMatch(
      guard,
      /functions:secrets:set/i,
      'Blaze staging preflight must not write secrets'
    );
  }
);
