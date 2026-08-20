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
  'FIREBASE_STAGING_ALIAS_RED_TEST_SETUP=PASS'
);

test(
  'locks distinct production and staging Firebase project aliases',
  () => {
    assert.equal(
      fs.existsSync(firebasercPath),
      true,
      '.firebaserc must exist'
    );

    const config =
      JSON.parse(
        fs.readFileSync(
          firebasercPath,
          'utf8'
        )
      );

    assert.equal(
      typeof config.projects,
      'object',
      '.firebaserc projects object must exist'
    );

    assert.equal(
      config.projects.default,
      PRODUCTION_PROJECT_ID,
      'default alias must remain mapped to production project'
    );

    assert.equal(
      config.projects.staging,
      STAGING_PROJECT_ID,
      'staging alias must map to dedicated staging project'
    );

    assert.notEqual(
      config.projects.default,
      config.projects.staging,
      'production and staging Firebase aliases must remain isolated'
    );
  }
);
