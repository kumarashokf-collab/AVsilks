'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const rulesPath =
  path.join(
    __dirname,
    '..',
    '..',
    'frontend',
    'firestore.rules'
  );

function readUsersBlock() {
  const source =
    fs.readFileSync(
      rulesPath,
      'utf8'
    );

  const match =
    source.match(
      /match\s+\/users\/\{userId\}\s*\{([\s\S]*?)\n\s*\}/
    );

  assert.ok(
    match,
    'users Firestore rules block must exist'
  );

  return match[1];
}

test(
  'allows a signed-in user to get only their own user document',
  () => {
    const block =
      readUsersBlock();

    assert.match(
      block,
      /allow\s+get\s*:\s*if\s+isSignedIn\(\)\s*&&\s*request\.auth\.uid\s*==\s*userId\s*;/
    );
  }
);

test(
  'denies user collection listing',
  () => {
    const block =
      readUsersBlock();

    assert.match(
      block,
      /allow\s+list\s*:\s*if\s+false\s*;/
    );
  }
);

test(
  'denies all browser writes to user role documents',
  () => {
    const block =
      readUsersBlock();

    assert.match(
      block,
      /allow\s+create\s*,\s*update\s*,\s*delete\s*:\s*if\s+false\s*;/
    );
  }
);
