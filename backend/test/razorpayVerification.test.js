'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  verifyRazorpayPaymentAuthenticity,
} = require('../src/services/razorpayVerification.service');

const secret = 'test_secret_only';

function signature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function input(overrides = {}) {
  const storedRazorpayOrderId =
    'order_test1234567890';

  const razorpayPaymentId =
    'pay_test123456789012';

  return {
    storedRazorpayOrderId,
    clientRazorpayOrderId:
      storedRazorpayOrderId,
    razorpayPaymentId,
    razorpaySignature:
      signature(
        storedRazorpayOrderId,
        razorpayPaymentId
      ),
    amountPaise: 99998,
    currency: 'INR',
    keySecret: secret,
    ...overrides,
  };
}

test('accepts only authentic captured payment matching trusted order and amount', async () => {
  const result =
    await verifyRazorpayPaymentAuthenticity(
      input(),
      {
        fetchPayment: async () => ({
          id: 'pay_test123456789012',
          order_id:
            'order_test1234567890',
          amount: 99998,
          currency: 'INR',
          status: 'captured',
          captured: true,
        }),
      }
    );

  assert.equal(result.verified, true);
  assert.equal(
    result.razorpayPaymentId,
    'pay_test123456789012'
  );
});

test('rejects invalid signature before fetching payment', async () => {
  let fetched = false;

  await assert.rejects(
    () =>
      verifyRazorpayPaymentAuthenticity(
        input({
          razorpaySignature:
            '0'.repeat(64),
        }),
        {
          fetchPayment: async () => {
            fetched = true;
          },
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_SIGNATURE_INVALID'
  );

  assert.equal(fetched, false);
});

test('rejects checkout order id that differs from server stored order id', async () => {
  await assert.rejects(
    () =>
      verifyRazorpayPaymentAuthenticity(
        input({
          clientRazorpayOrderId:
            'order_tampered123456',
        }),
        {
          fetchPayment: async () => {
            throw new Error(
              'must not fetch'
            );
          },
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_ORDER_MISMATCH'
  );
});

test('rejects payment unless fetched gateway data is captured and matches trusted amount', async () => {
  await assert.rejects(
    () =>
      verifyRazorpayPaymentAuthenticity(
        input(),
        {
          fetchPayment: async () => ({
            id: 'pay_test123456789012',
            order_id:
              'order_test1234567890',
            amount: 1,
            currency: 'INR',
            status: 'captured',
            captured: true,
          }),
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_PAYMENT_MISMATCH'
  );

  await assert.rejects(
    () =>
      verifyRazorpayPaymentAuthenticity(
        input(),
        {
          fetchPayment: async () => ({
            id: 'pay_test123456789012',
            order_id:
              'order_test1234567890',
            amount: 99998,
            currency: 'INR',
            status: 'authorized',
            captured: false,
          }),
        }
      ),
    (error) =>
      error?.code ===
      'RAZORPAY_PAYMENT_NOT_CAPTURED'
  );
});

console.log(
  'RAZORPAY_VERIFICATION_RED_TEST_SETUP=PASS'
);
