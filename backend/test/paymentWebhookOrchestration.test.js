'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  reconcileCapturedRazorpayWebhook,
} = require('../src/services/paymentWebhook.service');

const RAW_BODY =
  Buffer.from('{"event":"payment.captured"}');

const SIGNATURE =
  'a'.repeat(64);

const EVENT_ID =
  'event_test1234567890';

test('reconciles signed captured webhook in strict trusted order', async () => {
  const calls = [];

  const result =
    await reconcileCapturedRazorpayWebhook(
      {
        rawBody: RAW_BODY,
        signature: SIGNATURE,
        eventId: EVENT_ID,
      },
      {
        getWebhookSecret:
          () => 'webhook-secret',

        verifyWebhookSignature:
          () => {
            calls.push('signature');
            return { verified: true };
          },

        parseWebhookEvent:
          () => {
            calls.push('parse');

            return {
              eventId: EVENT_ID,
              event: 'payment.captured',
              razorpayPaymentId:
                'pay_test123456789012',
              razorpayOrderId:
                'order_test1234567890',
              amountPaise: 99998,
              currency: 'INR',
              status: 'captured',
              captured: true,
            };
          },

        getPaymentSessionByRazorpayOrderId:
          async () => {
            calls.push('load');

            return {
              paymentSessionId:
                'paysess_0123456789abcdef',
              userId:
                'customer-uid-1',
              razorpayOrderId:
                'order_test1234567890',
              amountPaise: 99998,
              currency: 'INR',
              paymentStatus:
                'Pending Payment',
            };
          },

        verifyCapturedPayment:
          async (input) => {
            calls.push('gateway');

            assert.equal(
              input.razorpayPaymentId,
              'pay_test123456789012'
            );

            assert.equal(
              input.razorpayOrderId,
              'order_test1234567890'
            );

            assert.equal(
              input.amountPaise,
              99998
            );

            assert.equal(
              input.currency,
              'INR'
            );

            return {
              verified: true,
              razorpayPaymentId:
                input.razorpayPaymentId,
              razorpayOrderId:
                input.razorpayOrderId,
              amountPaise:
                input.amountPaise,
              currency:
                input.currency,
              status: 'captured',
            };
          },

        finalizePayment:
          async (input) => {
            calls.push('finalize');

            assert.equal(
              input.webhookEventId,
              EVENT_ID
            );

            return {
              finalized: true,
              orderId:
                'ord_' + 'c'.repeat(48),
            };
          },
      }
    );

  assert.deepEqual(calls, [
    'signature',
    'parse',
    'load',
    'gateway',
    'finalize',
  ]);

  assert.equal(result.processed, true);
  assert.equal(result.finalized, true);
});

test('never finalizes when webhook amount differs from trusted session', async () => {
  let finalizeCalled = false;

  await assert.rejects(
    () =>
      reconcileCapturedRazorpayWebhook(
        {
          rawBody: RAW_BODY,
          signature: SIGNATURE,
          eventId: EVENT_ID,
        },
        {
          getWebhookSecret:
            () => 'webhook-secret',

          verifyWebhookSignature:
            () => ({
              verified: true,
            }),

          parseWebhookEvent:
            () => ({
              eventId: EVENT_ID,
              event: 'payment.captured',
              razorpayPaymentId:
                'pay_test123456789012',
              razorpayOrderId:
                'order_test1234567890',
              amountPaise: 1,
              currency: 'INR',
              status: 'captured',
              captured: true,
            }),

          getPaymentSessionByRazorpayOrderId:
            async () => ({
              paymentSessionId:
                'paysess_0123456789abcdef',
              userId:
                'customer-uid-1',
              razorpayOrderId:
                'order_test1234567890',
              amountPaise: 99998,
              currency: 'INR',
              paymentStatus:
                'Pending Payment',
            }),

          finalizePayment:
            async () => {
              finalizeCalled = true;
            },
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_SESSION_MISMATCH'
  );

  assert.equal(
    finalizeCalled,
    false
  );
});

test('never finalizes when authoritative Razorpay payment verification fails', async () => {
  let finalizeCalled = false;

  await assert.rejects(
    () =>
      reconcileCapturedRazorpayWebhook(
        {
          rawBody: RAW_BODY,
          signature: SIGNATURE,
          eventId: EVENT_ID,
        },
        {
          getWebhookSecret:
            () => 'webhook-secret',

          verifyWebhookSignature:
            () => ({
              verified: true,
            }),

          parseWebhookEvent:
            () => ({
              eventId: EVENT_ID,
              event: 'payment.captured',
              razorpayPaymentId:
                'pay_test123456789012',
              razorpayOrderId:
                'order_test1234567890',
              amountPaise: 99998,
              currency: 'INR',
              status: 'captured',
              captured: true,
            }),

          getPaymentSessionByRazorpayOrderId:
            async () => ({
              paymentSessionId:
                'paysess_0123456789abcdef',
              userId:
                'customer-uid-1',
              razorpayOrderId:
                'order_test1234567890',
              amountPaise: 99998,
              currency: 'INR',
              paymentStatus:
                'Pending Payment',
            }),

          verifyCapturedPayment:
            async () => {
              const error =
                new Error(
                  'gateway mismatch'
                );

              error.code =
                'RAZORPAY_PAYMENT_MISMATCH';

              throw error;
            },

          finalizePayment:
            async () => {
              finalizeCalled = true;
            },
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_PAYMENT_MISMATCH'
  );

  assert.equal(
    finalizeCalled,
    false
  );
});

test('stops immediately when webhook signature verification fails', async () => {
  let parsed = false;

  await assert.rejects(
    () =>
      reconcileCapturedRazorpayWebhook(
        {
          rawBody: RAW_BODY,
          signature: SIGNATURE,
          eventId: EVENT_ID,
        },
        {
          getWebhookSecret:
            () => 'webhook-secret',

          verifyWebhookSignature:
            () => {
              const error =
                new Error('invalid');

              error.code =
                'RAZORPAY_WEBHOOK_SIGNATURE_INVALID';

              throw error;
            },

          parseWebhookEvent:
            () => {
              parsed = true;
            },

          getPaymentSessionByRazorpayOrderId:
            async () => ({}),

          finalizePayment:
            async () => ({}),
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_WEBHOOK_SIGNATURE_INVALID'
  );

  assert.equal(parsed, false);
});

console.log(
  'PAYMENT_WEBHOOK_ORCHESTRATION_RED_TEST_SETUP=PASS'
);
