'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appPath = path.join(
  __dirname,
  '..',
  'app.js'
);

const source =
  fs.readFileSync(
    appPath,
    'utf8'
  );

test('mounts dedicated Razorpay raw webhook route before express.json', () => {
  assert.match(
    source,
    /createRazorpayWebhookRouter/
  );

  const helmetIndex =
    source.indexOf(
      'app.use(helmet())'
    );

  const webhookPathIndex =
    source.indexOf(
      '"/api/payments/razorpay/webhook"'
    );

  const webhookRouterIndex =
    source.indexOf(
      'createRazorpayWebhookRouter()'
    );

  const jsonIndex =
    source.indexOf(
      'app.use(express.json())'
    );

  assert.ok(
    helmetIndex >= 0,
    'helmet middleware is required'
  );

  assert.ok(
    webhookPathIndex >= 0,
    'webhook route path must be mounted'
  );

  assert.ok(
    webhookRouterIndex >= 0,
    'dedicated webhook router must be mounted'
  );

  assert.ok(
    jsonIndex >= 0,
    'global JSON parser is required'
  );

  assert.ok(
    webhookPathIndex >
      helmetIndex,
    'webhook must remain behind helmet'
  );

  assert.ok(
    webhookPathIndex <
      jsonIndex,
    'webhook must be mounted before express.json'
  );

  assert.ok(
    webhookRouterIndex <
      jsonIndex,
    'raw webhook router must execute before JSON parsing'
  );
});

console.log(
  'RAZORPAY_WEBHOOK_APP_MOUNT_RED_TEST_SETUP=PASS'
);
