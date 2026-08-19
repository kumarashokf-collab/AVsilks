'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRazorpayPaymentSession,
  verifyRazorpayPayment,
} = require('../src/services/payment.service');

function createPayload() {
  return {
    idempotencyKey: 'payment-checkout-key-0001',
    customer: {
      name: 'Ashok Kumar',
      phone: '9876543210',
      address: {
        house: '1-2',
        street: 'Main Road',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pin: '517501',
      },
    },
    items: [
      {
        productId: 'product-test-1',
        quantity: 1,
      },
    ],
  };
}

test('creates a Razorpay payment session using trusted user identity and server-controlled payment method', async () => {
  let repositoryInput = null;

  const result = await createRazorpayPaymentSession(
    { uid: 'customer-uid-1' },
    createPayload(),
    {
      createPaymentSession: async (input) => {
        repositoryInput = input;

        return {
          paymentSessionId:
            'paysess_0123456789abcdef',
        };
      },
    }
  );

  assert.equal(
    repositoryInput.userId,
    'customer-uid-1'
  );

  assert.equal(
    repositoryInput.paymentMethod,
    'razorpay'
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      repositoryInput,
      'amount'
    ),
    false
  );

  assert.equal(
    result.paymentSessionId,
    'paysess_0123456789abcdef'
  );
});

test('rejects unauthenticated payment creation before repository access', async () => {
  let repositoryCalled = false;

  await assert.rejects(
    () =>
      createRazorpayPaymentSession(
        {},
        createPayload(),
        {
          createPaymentSession: async () => {
            repositoryCalled = true;
          },
        }
      ),
    (error) =>
      error?.code ===
      'AUTHENTICATION_REQUIRED'
  );

  assert.equal(repositoryCalled, false);
});

test('rejects client-controlled payment amount before repository access', async () => {
  let repositoryCalled = false;

  await assert.rejects(
    () =>
      createRazorpayPaymentSession(
        { uid: 'customer-uid-1' },
        {
          ...createPayload(),
          amount: 1,
        },
        {
          createPaymentSession: async () => {
            repositoryCalled = true;
          },
        }
      ),
    (error) =>
      error?.code === 'VALIDATION_FAILED'
  );

  assert.equal(repositoryCalled, false);
});

test('verifies payment using trusted user identity and validated gateway values only', async () => {
  let repositoryInput = null;

  const result = await verifyRazorpayPayment(
    { uid: 'customer-uid-1' },
    {
      paymentSessionId:
        'paysess_0123456789abcdef',
      razorpayOrderId:
        'order_test1234567890',
      razorpayPaymentId:
        'pay_test123456789012',
      razorpaySignature:
        'a'.repeat(64),
    },
    {
      verifyPaymentSession: async (input) => {
        repositoryInput = input;

        return {
          paymentSessionId:
            input.paymentSessionId,
          verified: true,
        };
      },
    }
  );

  assert.equal(
    repositoryInput.userId,
    'customer-uid-1'
  );

  assert.equal(
    repositoryInput.paymentSessionId,
    'paysess_0123456789abcdef'
  );

  assert.equal(result.verified, true);
});

console.log(
  'PAYMENT_SERVICE_SECURITY_RED_TEST_SETUP=PASS'
);
