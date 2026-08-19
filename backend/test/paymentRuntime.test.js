'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPaymentRuntime,
} = require('../src/services/paymentRuntime.service');

test('lazily wires production checkout dependencies without constructing Razorpay at module setup', async () => {
  const calls = [];
  let adapterCreations = 0;

  const adapter = {
    getKeyId: () => 'rzp_test_public123',
    getKeySecret: () => 'server_secret_only',
    createOrder: async () => ({}),
    findOrdersByReceipt: async () => [],
    fetchPayment: async () => ({}),
  };

  const runtime = createPaymentRuntime({
    createRazorpayAdapterFn: () => {
      adapterCreations += 1;
      return adapter;
    },

    createPaymentSessionFn: async () => {
      calls.push('repository.reserve');

      return {
        paymentSessionId:
          'paysess_0123456789abcdef',
        amountPaise: 52900,
        currency: 'INR',
      };
    },

    ensureRazorpayOrderFn:
      async (input, dependencies) => {
        calls.push('gateway.order');

        assert.equal(
          typeof dependencies.createOrder,
          'function'
        );

        assert.equal(
          typeof dependencies.findOrdersByReceipt,
          'function'
        );

        return {
          razorpayOrderId:
            'order_test1234567890',
          receipt:
            'avp_0123456789abcdef0123456789abcdef',
          recovered: false,
        };
      },

    bindRazorpayOrderFn: async () => {
      calls.push('repository.bind');

      return {
        bound: true,
      };
    },
  });

  assert.equal(adapterCreations, 0);

  const result =
    await runtime.createRazorpayCheckout(
      {
        uid: 'customer-uid-1',
      },
      {
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
      }
    );

  assert.equal(adapterCreations, 1);

  assert.deepEqual(calls, [
    'repository.reserve',
    'gateway.order',
    'repository.bind',
  ]);

  assert.equal(
    result.keyId,
    'rzp_test_public123'
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result,
      'keySecret'
    ),
    false
  );
});

test('wires trusted verification through adapter fetch and exactly-once finalization', async () => {
  const calls = [];

  const runtime = createPaymentRuntime({
    createRazorpayAdapterFn: () => ({
      getKeyId: () => 'rzp_test_public123',
      getKeySecret:
        () => 'server_secret_only',
      createOrder: async () => ({}),
      findOrdersByReceipt:
        async () => [],
      fetchPayment:
        async (paymentId) => {
          calls.push(
            `adapter.fetch:${paymentId}`
          );

          return {
            id: paymentId,
          };
        },
    }),

    getPaymentSessionForVerificationFn:
      async () => {
        calls.push('repository.load');

        return {
          paymentSessionId:
            'paysess_0123456789abcdef',
          userId: 'customer-uid-1',
          razorpayOrderId:
            'order_test1234567890',
          amountPaise: 99998,
          currency: 'INR',
          paymentStatus:
            'Pending Payment',
        };
      },

    verifyPaymentAuthenticityFn:
      async (input, dependencies) => {
        calls.push('verify');

        assert.equal(
          input.keySecret,
          'server_secret_only'
        );

        await dependencies.fetchPayment(
          input.razorpayPaymentId
        );

        return {
          verified: true,
          razorpayPaymentId:
            input.razorpayPaymentId,
          razorpayOrderId:
            input.storedRazorpayOrderId,
          amountPaise:
            input.amountPaise,
          currency:
            input.currency,
          status: 'captured',
        };
      },

    finalizePaymentFn:
      async () => {
        calls.push('repository.finalize');

        return {
          finalized: true,
          orderId:
            'ord_' + 'c'.repeat(48),
        };
      },
  });

  const result =
    await runtime
      .verifyAndFinalizeRazorpayPayment(
        {
          uid: 'customer-uid-1',
        },
        {
          paymentSessionId:
            'paysess_0123456789abcdef',
          razorpayOrderId:
            'order_test1234567890',
          razorpayPaymentId:
            'pay_test123456789012',
          razorpaySignature:
            'a'.repeat(64),
        }
      );

  assert.deepEqual(calls, [
    'repository.load',
    'verify',
    'adapter.fetch:pay_test123456789012',
    'repository.finalize',
  ]);

  assert.equal(result.verified, true);
  assert.equal(result.finalized, true);
});

console.log(
  'PAYMENT_RUNTIME_RED_TEST_SETUP=PASS'
);
