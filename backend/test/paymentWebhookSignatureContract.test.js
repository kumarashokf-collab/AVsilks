'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  reconcileCapturedRazorpayWebhook,
} = require(
  '../src/services/paymentWebhook.service'
);

const FAKE_WEBHOOK_SECRET =
  'LOCAL_ONLY_FAKE_WEBHOOK_SECRET';

function createSignedCapturedWebhook() {
  const rawBody = Buffer.from(
    JSON.stringify({
      event: 'payment.captured',

      payload: {
        payment: {
          entity: {
            id:
              'pay_local_contract_001',

            order_id:
              'order_local_contract_001',

            amount: 12345,
            currency: 'INR',
            status: 'captured',
            captured: true,
          },
        },
      },
    }),
    'utf8'
  );

  const signature =
    crypto
      .createHmac(
        'sha256',
        FAKE_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest('hex');

  return {
    rawBody,
    signature,
  };
}

test(
  'passes a real signed captured webhook through the real signature verifier',
  async () => {
    const {
      rawBody,
      signature,
    } = createSignedCapturedWebhook();

    const calls = [];

    const result =
      await reconcileCapturedRazorpayWebhook(
        {
          rawBody,
          signature,
          eventId:
            'event_local_contract_001',
        },
        {
          getWebhookSecret:
            () =>
              FAKE_WEBHOOK_SECRET,

          /*
           * Do not inject either:
           * - verifyWebhookSignature
           * - parseWebhookEvent
           *
           * This regression test must exercise
           * the real low-level signature and
           * webhook payload contract.
           */

          getPaymentSessionByRazorpayOrderId:
            async (razorpayOrderId) => {
              calls.push('load');

              assert.equal(
                razorpayOrderId,
                'order_local_contract_001'
              );

              return {
                paymentSessionId:
                  'paysess_local_contract_001',

                userId:
                  'customer-local-001',

                razorpayOrderId:
                  'order_local_contract_001',

                amountPaise: 12345,
                currency: 'INR',

                paymentStatus:
                  'Pending Payment',
              };
            },

          verifyCapturedPayment:
            async (input) => {
              calls.push('gateway');

              assert.deepEqual(
                input,
                {
                  razorpayOrderId:
                    'order_local_contract_001',

                  razorpayPaymentId:
                    'pay_local_contract_001',

                  amountPaise: 12345,
                  currency: 'INR',
                }
              );

              return {
                verified: true,

                razorpayOrderId:
                  input.razorpayOrderId,

                razorpayPaymentId:
                  input.razorpayPaymentId,

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
                'event_local_contract_001'
              );

              assert.equal(
                input.paymentSessionId,
                'paysess_local_contract_001'
              );

              return {
                finalized: true,
                orderId:
                  'ord_local_contract_001',
              };
            },
        }
      );

    assert.deepEqual(
      calls,
      [
        'load',
        'gateway',
        'finalize',
      ]
    );

    assert.equal(
      result.processed,
      true
    );

    assert.equal(
      result.finalized,
      true
    );

    assert.equal(
      result.orderId,
      'ord_local_contract_001'
    );
  }
);

test(
  'rejects an invalid signature before trusted payment processing',
  async () => {
    const {
      rawBody,
    } = createSignedCapturedWebhook();

    let loadReached = false;
    let gatewayReached = false;
    let finalizeReached = false;

    await assert.rejects(
      () =>
        reconcileCapturedRazorpayWebhook(
          {
            rawBody,

            signature:
              '0'.repeat(64),

            eventId:
              'event_local_contract_bad_sig',
          },
          {
            getWebhookSecret:
              () =>
                FAKE_WEBHOOK_SECRET,

            getPaymentSessionByRazorpayOrderId:
              async () => {
                loadReached = true;
                return {};
              },

            verifyCapturedPayment:
              async () => {
                gatewayReached = true;
                return {};
              },

            finalizePayment:
              async () => {
                finalizeReached = true;
                return {};
              },
          }
        ),

      (error) =>
        error?.code ===
        'RAZORPAY_WEBHOOK_SIGNATURE_INVALID'
    );

    assert.equal(
      loadReached,
      false
    );

    assert.equal(
      gatewayReached,
      false
    );

    assert.equal(
      finalizeReached,
      false
    );
  }
);

console.log(
  'PAYMENT_WEBHOOK_REAL_SIGNATURE_CONTRACT_TEST_SETUP=PASS'
);
