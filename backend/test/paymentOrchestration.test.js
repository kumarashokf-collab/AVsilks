'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRazorpayCheckout,
  verifyAndFinalizeRazorpayPayment,
} = require('../src/services/paymentOrchestration.service');

const SESSION_ID =
  'paysess_0123456789abcdef';

const ORDER_ID =
  'order_test1234567890';

const PAYMENT_ID =
  'pay_test123456789012';

const RECEIPT =
  'avp_0123456789abcdef0123456789abcdef';

function checkoutPayload() {
  return {
    idempotencyKey:
      'payment-checkout-key-0001',
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
        productId: 'saree-1',
        quantity: 1,
      },
    ],
  };
}

function verifyPayload() {
  return {
    paymentSessionId: SESSION_ID,
    razorpayOrderId: ORDER_ID,
    razorpayPaymentId: PAYMENT_ID,
    razorpaySignature: 'a'.repeat(64),
  };
}

test('orchestrates reservation, Razorpay order creation and binding in strict order', async () => {
  const calls = [];

  const result =
    await createRazorpayCheckout(
      {
        uid: 'customer-uid-1',
      },
      checkoutPayload(),
      {
        createPaymentSession:
          async (input) => {
            calls.push('reserve');

            assert.equal(
              input.userId,
              'customer-uid-1'
            );

            assert.equal(
              input.paymentMethod,
              'razorpay'
            );

            return {
              created: true,
              paymentSessionId:
                SESSION_ID,
              amountPaise: 52900,
              currency: 'INR',
              paymentStatus:
                'Pending Payment',
            };
          },

        ensureRazorpayOrder:
          async (input) => {
            calls.push('gateway');

            assert.deepEqual(input, {
              paymentSessionId:
                SESSION_ID,
              amountPaise: 52900,
              currency: 'INR',
            });

            return {
              recovered: false,
              razorpayOrderId:
                ORDER_ID,
              amountPaise: 52900,
              currency: 'INR',
              receipt: RECEIPT,
              status: 'created',
            };
          },

        bindRazorpayOrder:
          async (input) => {
            calls.push('bind');

            assert.equal(
              input.userId,
              'customer-uid-1'
            );

            assert.equal(
              input.paymentSessionId,
              SESSION_ID
            );

            assert.equal(
              input.razorpayOrderId,
              ORDER_ID
            );

            return {
              bound: true,
              paymentSessionId:
                SESSION_ID,
              razorpayOrderId:
                ORDER_ID,
            };
          },
      }
    );

  assert.deepEqual(
    calls,
    ['reserve', 'gateway', 'bind']
  );

  assert.deepEqual(result, {
    paymentSessionId: SESSION_ID,
    razorpayOrderId: ORDER_ID,
    amountPaise: 52900,
    currency: 'INR',
    receipt: RECEIPT,
    recovered: false,
  });
});

test('verification uses stored trusted session data before finalization', async () => {
  const calls = [];

  const result =
    await verifyAndFinalizeRazorpayPayment(
      {
        uid: 'customer-uid-1',
      },
      verifyPayload(),
      {
        getPaymentSessionForVerification:
          async (input) => {
            calls.push('load');

            assert.deepEqual(input, {
              paymentSessionId:
                SESSION_ID,
              userId:
                'customer-uid-1',
            });

            return {
              paymentSessionId:
                SESSION_ID,
              userId:
                'customer-uid-1',
              razorpayOrderId:
                ORDER_ID,
              amountPaise: 99998,
              currency: 'INR',
              paymentStatus:
                'Pending Payment',
            };
          },

        getRazorpayKeySecret:
          () => 'test-secret-only',

        verifyPaymentAuthenticity:
          async (input) => {
            calls.push('verify');

            assert.equal(
              input.storedRazorpayOrderId,
              ORDER_ID
            );

            assert.equal(
              input.clientRazorpayOrderId,
              ORDER_ID
            );

            assert.equal(
              input.amountPaise,
              99998
            );

            assert.equal(
              input.keySecret,
              'test-secret-only'
            );

            return {
              verified: true,
              razorpayPaymentId:
                PAYMENT_ID,
              razorpayOrderId:
                ORDER_ID,
              amountPaise: 99998,
              currency: 'INR',
              status: 'captured',
            };
          },

        finalizePayment:
          async (input) => {
            calls.push('finalize');

            assert.equal(
              input.paymentSessionId,
              SESSION_ID
            );

            assert.equal(
              input.userId,
              'customer-uid-1'
            );

            assert.equal(
              input.razorpayPaymentId,
              PAYMENT_ID
            );

            return {
              finalized: true,
              orderId:
                'ord_' +
                'c'.repeat(48),
            };
          },
      }
    );

  assert.deepEqual(
    calls,
    [
      'load',
      'verify',
      'finalize',
    ]
  );

  assert.equal(
    result.verified,
    true
  );

  assert.equal(
    result.finalized,
    true
  );

  assert.match(
    result.orderId,
    /^ord_[a-f0-9]{48}$/
  );
});

test('fails closed and never finalizes when verification does not explicitly succeed', async () => {
  let finalizeCalled = false;

  await assert.rejects(
    () =>
      verifyAndFinalizeRazorpayPayment(
        {
          uid: 'customer-uid-1',
        },
        verifyPayload(),
        {
          getPaymentSessionForVerification:
            async () => ({
              paymentSessionId:
                SESSION_ID,
              userId:
                'customer-uid-1',
              razorpayOrderId:
                ORDER_ID,
              amountPaise: 99998,
              currency: 'INR',
              paymentStatus:
                'Pending Payment',
            }),

          getRazorpayKeySecret:
            () => 'test-secret-only',

          verifyPaymentAuthenticity:
            async () => ({
              verified: false,
            }),

          finalizePayment:
            async () => {
              finalizeCalled = true;
            },
        }
      ),
    (error) =>
      error?.code ===
      'PAYMENT_VERIFICATION_FAILED'
  );

  assert.equal(
    finalizeCalled,
    false
  );
});

console.log(
  'PAYMENT_ORCHESTRATION_RED_TEST_SETUP=PASS'
);
