'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  verifyCapturedRazorpayPayment,
  RAZORPAY_VERIFICATION_ERROR,
} = require('../src/services/razorpayVerification.service');

const ORDER_ID =
  'order_test1234567890';

const PAYMENT_ID =
  'pay_test123456789012';

function trustedInput(overrides = {}) {
  return {
    razorpayOrderId: ORDER_ID,
    razorpayPaymentId: PAYMENT_ID,
    amountPaise: 99998,
    currency: 'INR',
    ...overrides,
  };
}

function capturedPayment(overrides = {}) {
  return {
    id: PAYMENT_ID,
    order_id: ORDER_ID,
    amount: 99998,
    currency: 'INR',
    status: 'captured',
    captured: true,
    ...overrides,
  };
}

test('server-fetches and verifies captured Razorpay payment against trusted facts', async () => {
  let fetchedId = null;

  const result =
    await verifyCapturedRazorpayPayment(
      trustedInput(),
      {
        fetchPayment:
          async (paymentId) => {
            fetchedId = paymentId;

            return capturedPayment();
          },
      }
    );

  assert.equal(
    fetchedId,
    PAYMENT_ID
  );

  assert.deepEqual(result, {
    verified: true,
    razorpayPaymentId:
      PAYMENT_ID,
    razorpayOrderId:
      ORDER_ID,
    amountPaise: 99998,
    currency: 'INR',
    status: 'captured',
  });

  assert.equal(
    Object.isFrozen(result),
    true
  );
});

test('rejects fetched payment identity or trusted amount mismatch', async () => {
  await assert.rejects(
    () =>
      verifyCapturedRazorpayPayment(
        trustedInput(),
        {
          fetchPayment:
            async () =>
              capturedPayment({
                amount: 1,
              }),
        }
      ),
    (error) =>
      error?.code ===
      RAZORPAY_VERIFICATION_ERROR
        .PAYMENT_MISMATCH
  );
});

test('rejects payment that is not captured', async () => {
  await assert.rejects(
    () =>
      verifyCapturedRazorpayPayment(
        trustedInput(),
        {
          fetchPayment:
            async () =>
              capturedPayment({
                status: 'authorized',
                captured: false,
              }),
        }
      ),
    (error) =>
      error?.code ===
      RAZORPAY_VERIFICATION_ERROR
        .PAYMENT_NOT_CAPTURED
  );
});

test('fails closed without server-side payment fetch dependency', async () => {
  await assert.rejects(
    () =>
      verifyCapturedRazorpayPayment(
        trustedInput(),
        {}
      ),
    (error) =>
      error?.code ===
      RAZORPAY_VERIFICATION_ERROR
        .INVALID_DEPENDENCIES
  );
});

console.log(
  'RAZORPAY_CAPTURED_PAYMENT_RED_TEST_SETUP=PASS'
);
