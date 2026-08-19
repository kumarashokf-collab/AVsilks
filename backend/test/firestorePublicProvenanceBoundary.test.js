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

const rulesPath =
  path.join(
    repoRoot,
    'frontend',
    'firestore.rules'
  );

function readPublicProvenanceRulesBlock() {
  const source =
    fs.readFileSync(
      rulesPath,
      'utf8'
    );

  const match =
    source.match(
      /match\s+\/publicProvenance\/\{publicId\}\s*\{([\s\S]*?)\n\s*\}/
    );

  assert.ok(
    match,
    'publicProvenance Firestore rules block must exist'
  );

  return match[1];
}

test(
  'allows anonymous single-document public provenance verification',
  () => {
    const block =
      readPublicProvenanceRulesBlock();

    assert.match(
      block,
      /allow\s+get\s*:\s*if\s+true\s*;/
    );
  }
);

test(
  'denies public provenance collection listing and queries',
  () => {
    const block =
      readPublicProvenanceRulesBlock();

    assert.match(
      block,
      /allow\s+list\s*:\s*if\s+false\s*;/
    );
  }
);

test(
  'denies all browser and Firebase client writes to public provenance',
  () => {
    const block =
      readPublicProvenanceRulesBlock();

    assert.match(
      block,
      /allow\s+create\s*,\s*update\s*,\s*delete\s*:\s*if\s+false\s*;/
    );
  }
);
