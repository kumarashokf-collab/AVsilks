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

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        relativePath
      ),
      'utf8'
    )
  );
}

console.log(
  'FUNCTIONS_PACKAGING_BOUNDARY_RED_TEST_SETUP=PASS'
);

test(
  'preserves Firebase default and AV Silks sensitive-file packaging ignores',
  () => {
    const firebase =
      readJson('firebase.json');

    assert.ok(
      Array.isArray(firebase.functions),
      'Functions config must be an array'
    );

    assert.equal(
      firebase.functions.length,
      1
    );

    const config =
      firebase.functions[0];

    assert.equal(
      config.source,
      'backend'
    );

    assert.equal(
      config.codebase,
      'api'
    );

    assert.equal(
      config.disallowLegacyRuntimeConfig,
      true
    );

    const ignore =
      new Set(config.ignore || []);

    const firebaseDefaultIgnores = [
      '.git',
      '.runtimeconfig.json',
      'firebase-debug.log',
      'firebase-debug.*.log',
      'node_modules',
    ];

    for (
      const entry
      of firebaseDefaultIgnores
    ) {
      assert.equal(
        ignore.has(entry),
        true,
        `missing Firebase default Functions ignore: ${entry}`
      );
    }

    const securityIgnores = [
      '.env',
      '.env.*',
      'test',
      'coverage',
      '*.log',
      '*serviceAccount*.json',
      '*firebase-admin-key*.json',
      '*.pem',
      '*.key',
      '.backups',
      'backups',
    ];

    for (
      const entry
      of securityIgnores
    ) {
      assert.equal(
        ignore.has(entry),
        true,
        `missing AV Silks sensitive packaging ignore: ${entry}`
      );
    }
  }
);

test(
  'locks the Firebase Functions Node 22 entrypoint contract',
  () => {
    const packageJson =
      readJson('backend/package.json');

    assert.equal(
      packageJson.main,
      'functions.js'
    );

    assert.equal(
      packageJson.engines.node,
      '22'
    );

    assert.equal(
      fs.existsSync(
        path.join(
          repoRoot,
          'backend',
          'functions.js'
        )
      ),
      true
    );

    const functionsSource =
      fs.readFileSync(
        path.join(
          repoRoot,
          'backend',
          'functions.js'
        ),
        'utf8'
      );

    assert.match(
      functionsSource,
      /exports\.api\s*=\s*onRequest\s*\(/
    );

    assert.match(
      functionsSource,
      /region\s*:\s*["']asia-south1["']/
    );

    assert.match(
      functionsSource,
      /maxInstances\s*:\s*2\b/
    );
  }
);
