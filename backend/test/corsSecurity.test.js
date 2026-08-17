'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

const appSource = fs.readFileSync(
  path.join(root, 'backend', 'app.js'),
  'utf8'
);

const firebaseConfig = JSON.parse(
  fs.readFileSync(
    path.join(root, 'firebase.json'),
    'utf8'
  )
);

const apiSource = fs.readFileSync(
  path.join(
    root,
    'frontend',
    'src',
    'services',
    'api.js'
  ),
  'utf8'
);

test(
  'does not enable permissive credentialed cross-origin access',
  () => {
    assert.doesNotMatch(
      appSource,
      /app\.use\(\s*cors\(\s*\{[\s\S]*?origin\s*:\s*true[\s\S]*?credentials\s*:\s*true/
    );

    assert.doesNotMatch(
      appSource,
      /origin\s*:\s*true/
    );
  }
);

test(
  'production browser API traffic is designed to stay same-origin through Firebase Hosting',
  () => {
    const rewrites =
      firebaseConfig?.hosting?.rewrites || [];

    assert.ok(
      rewrites.some(
        (rewrite) =>
          rewrite?.source === '/api/**' &&
          rewrite?.function?.functionId === 'api'
      )
    );

    assert.match(
      apiSource,
      /import\.meta\.env\.PROD\s*\?\s*["']\/api["']/
    );
  }
);

console.log(
  'CORS_SECURITY_TEST_SETUP=PASS'
);

test(
  'explicitly disables CORS at the Firebase Functions HTTP wrapper',
  () => {
    const functionsSource = fs.readFileSync(
      path.join(root, 'backend', 'functions.js'),
      'utf8'
    );

    assert.match(
      functionsSource,
      /const\s+API_OPTIONS\s*=\s*Object\.freeze\(\{[\s\S]*?cors\s*:\s*false[\s\S]*?\}\);/
    );
  }
);
