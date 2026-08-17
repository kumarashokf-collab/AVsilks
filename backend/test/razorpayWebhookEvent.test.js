'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseRazorpayWebhookEvent,
} = require('../src/services/razorpayWebhook.service');

function capturedRawBody() {
  return Buffer.from(
    JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id:
              'pay_test123456789012',
            order_id:
              'order_test1234567890',
            amount: 99998,
            currency: 'INR',
            status: 'captured',
            captured: true,
          },
        },
      },
    }),
    'utf8'
  );
}

test('parses a captured payment webhook into trusted reconciliation fields', () => {
  const result =
    parseRazorpayWebhookEvent({
      rawBody: capturedRawBody(),
      eventId:
        'event_test1234567890',
    });

  assert.deepEqual(result, {
    eventId:
      'event_test1234567890',
    event:
      'payment.captured',
    razorpayPaymentId:
      'pay_test123456789012',
    razorpayOrderId:
      'order_test1234567890',
    amountPaise: 99998,
    currency: 'INR',
    status: 'captured',
    captured: true,
  });

  assert.equal(
    Object.isFrozen(result),
    true
  );
});

test('rejects missing webhook event id', () => {
  assert.throws(
    () =>
      parseRazorpayWebhookEvent({
        rawBody:
          capturedRawBody(),
        eventId: '',
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_EVENT_ID_REQUIRED'
  );
});

test('rejects malformed JSON and unsupported webhook events', () => {
  assert.throws(
    () =>
      parseRazorpayWebhookEvent({
        rawBody:
          Buffer.from('{bad-json'),
        eventId:
          'event_test1234567890',
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_PAYLOAD_INVALID'
  );

  assert.throws(
    () =>
      parseRazorpayWebhookEvent({
        rawBody: Buffer.from(
          JSON.stringify({
            event: 'payment.failed',
            payload: {},
          })
        ),
        eventId:
          'event_test1234567890',
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_EVENT_UNSUPPORTED'
  );
});

test('rejects captured event when payment identity or trusted amount is malformed', () => {
  const invalid = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'bad-payment',
          order_id:
            'order_test1234567890',
          amount: 0,
          currency: 'INR',
          status: 'captured',
          captured: true,
        },
      },
    },
  };

  assert.throws(
    () =>
      parseRazorpayWebhookEvent({
        rawBody: Buffer.from(
          JSON.stringify(invalid)
        ),
        eventId:
          'event_test1234567890',
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_PAYLOAD_INVALID'
  );
});

console.log(
  'RAZORPAY_WEBHOOK_EVENT_RED_TEST_SETUP=PASS'
);
