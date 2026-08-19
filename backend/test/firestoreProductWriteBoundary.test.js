'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot =
  path.resolve(
    __dirname,
    '..',
    '..'
  );

const firebaseConfigPath =
  path.join(
    repoRoot,
    'firebase.json'
  );

const rulesPath =
  path.join(
    repoRoot,
    'frontend',
    'firestore.rules'
  );

function readProductRulesBlock() {
  const source =
    fs.readFileSync(
      rulesPath,
      'utf8'
    );

  const match =
    source.match(
      /match\s+\/products\/\{productId\}\s*\{([\s\S]*?)\n\s*\}/
    );

  assert.ok(
    match,
    'products Firestore rules block must exist'
  );

  return match[1];
}

test(
  'firebase.json uses the authoritative frontend Firestore rules file',
  () => {
    const config =
      JSON.parse(
        fs.readFileSync(
          firebaseConfigPath,
          'utf8'
        )
      );

    assert.equal(
      config?.firestore?.rules,
      'frontend/firestore.rules'
    );
  }
);

test(
  'preserves public product catalogue reads',
  () => {
    const block =
      readProductRulesBlock();

    assert.match(
      block,
      /allow\s+read\s*:\s*if\s+true\s*;/
    );
  }
);

test(
  'denies all browser and Firebase client product writes',
  () => {
    const block =
      readProductRulesBlock();

    assert.match(
      block,
      /allow\s+create\s*,\s*update\s*,\s*delete\s*:\s*if\s+false\s*;/
    );

    assert.doesNotMatch(
      block,
      /isAdmin\s*\(/
    );
  }
);
