'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  verifyRazorpayWebhookSignature,
} = require('../src/services/razorpayWebhook.service');

const WEBHOOK_SECRET =
  'test_webhook_secret_only';

function sign(rawBody) {
  return crypto
    .createHmac(
      'sha256',
      WEBHOOK_SECRET
    )
    .update(rawBody)
    .digest('hex');
}

test('accepts authentic Razorpay webhook signature only over the exact raw Buffer', () => {
  const rawBody = Buffer.from(
    JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id:
              'pay_test123456789012',
          },
        },
      },
    }),
    'utf8'
  );

  const result =
    verifyRazorpayWebhookSignature({
      rawBody,
      signature: sign(rawBody),
      webhookSecret:
        WEBHOOK_SECRET,
    });

  assert.equal(
    result.verified,
    true
  );
});

test('rejects invalid webhook signature', () => {
  const rawBody = Buffer.from(
    '{"event":"payment.captured"}',
    'utf8'
  );

  assert.throws(
    () =>
      verifyRazorpayWebhookSignature({
        rawBody,
        signature:
          '0'.repeat(64),
        webhookSecret:
          WEBHOOK_SECRET,
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_SIGNATURE_INVALID'
  );
});

test('rejects parsed or non-Buffer webhook bodies', () => {
  assert.throws(
    () =>
      verifyRazorpayWebhookSignature({
        rawBody: {
          event:
            'payment.captured',
        },
        signature:
          'a'.repeat(64),
        webhookSecret:
          WEBHOOK_SECRET,
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_RAW_BODY_REQUIRED'
  );

  assert.throws(
    () =>
      verifyRazorpayWebhookSignature({
        rawBody:
          '{"event":"payment.captured"}',
        signature:
          'a'.repeat(64),
        webhookSecret:
          WEBHOOK_SECRET,
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_RAW_BODY_REQUIRED'
  );
});

test('fails closed when webhook secret is unavailable', () => {
  const rawBody =
    Buffer.from('{}');

  assert.throws(
    () =>
      verifyRazorpayWebhookSignature({
        rawBody,
        signature:
          'a'.repeat(64),
        webhookSecret: '',
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_SECRET_MISSING'
  );
});

console.log(
  'RAZORPAY_WEBHOOK_SIGNATURE_RED_TEST_SETUP=PASS'
);
