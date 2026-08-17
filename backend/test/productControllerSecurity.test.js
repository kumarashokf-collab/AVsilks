'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const controllerPath = path.join(
  __dirname,
  '..',
  'src',
  'controllers',
  'product.controller.js'
);

const source = fs.readFileSync(
  controllerPath,
  'utf8'
);

console.log(
  'PRODUCT_CONTROLLER_SECURITY_RED_TEST_SETUP=PASS'
);

test(
  'does not use a test or fallback product creator identity',
  () => {
    assert.doesNotMatch(
      source,
      /admin_test/
    );

    assert.doesNotMatch(
      source,
      /req\.user\s*\?\s*req\.user\.uid\s*:/
    );
  }
);

test(
  'does not expose raw internal product error messages',
  () => {
    assert.doesNotMatch(
      source,
      /message\s*:\s*error\.message/
    );
  }
);
