'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    'functions.js'
  ),
  'utf8'
);

test('declares Razorpay credentials as Firebase Secret Manager parameters', () => {
  assert.match(
    source,
    /firebase-functions\/params/
  );

  assert.match(
    source,
    /defineSecret/
  );

  for (
    const name
    of [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ]
  ) {
    assert.match(
      source,
      new RegExp(
        `defineSecret\\(["']${name}["']\\)`
      ),
      `${name} must use defineSecret`
    );
  }
});

test('binds all Razorpay secrets to the deployed API function', () => {
  assert.match(
    source,
    /secrets\s*:/
  );

  for (
    const identifier
    of [
      'razorpayKeyId',
      'razorpayKeySecret',
      'razorpayWebhookSecret',
    ]
  ) {
    assert.match(
      source,
      new RegExp(
        `secrets[\\s\\S]*${identifier}`
      ),
      `${identifier} must be bound to API_OPTIONS`
    );
  }
});

test('does not contain literal Razorpay credential values', () => {
  assert.doesNotMatch(
    source,
    /\brzp_(?:live|test)_[A-Za-z0-9]{12,}\b/
  );

  assert.doesNotMatch(
    source,
    /RAZORPAY_(?:KEY_SECRET|WEBHOOK_SECRET)\s*[:=]\s*["'][^"']+["']/
  );
});

console.log(
  'FIREBASE_RAZORPAY_SECRET_BINDING_RED_TEST_SETUP=PASS'
);
