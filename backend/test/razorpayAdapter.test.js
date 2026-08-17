'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRazorpayAdapter,
} = require('../src/services/razorpayAdapter.service');

function createFakeRazorpay() {
  const calls = [];

  class FakeRazorpay {
    constructor(options) {
      calls.push({
        type: 'constructor',
        options,
      });

      this.orders = {
        create: async (payload) => {
          calls.push({
            type: 'orders.create',
            payload,
          });

          return {
            id: 'order_test1234567890',
            ...payload,
          };
        },

        all: async (query) => {
          calls.push({
            type: 'orders.all',
            query,
          });

          return {
            items: [],
          };
        },
      };

      this.payments = {
        fetch: async (paymentId) => {
          calls.push({
            type: 'payments.fetch',
            paymentId,
          });

          return {
            id: paymentId,
          };
        },
      };
    }
  }

  return {
    FakeRazorpay,
    calls,
  };
}

test('constructs Razorpay SDK only from supplied server credentials', () => {
  const fake = createFakeRazorpay();

  const adapter = createRazorpayAdapter({
    RazorpayCtor: fake.FakeRazorpay,
    env: {
      RAZORPAY_KEY_ID:
        'rzp_test_dummy123456',
      RAZORPAY_KEY_SECRET:
        'server_secret_only',
    },
  });

  assert.equal(
    fake.calls.length,
    1
  );

  assert.deepEqual(
    fake.calls[0],
    {
      type: 'constructor',
      options: {
        key_id:
          'rzp_test_dummy123456',
        key_secret:
          'server_secret_only',
      },
    }
  );

  assert.equal(
    adapter.getKeyId(),
    'rzp_test_dummy123456'
  );

  assert.equal(
    adapter.getKeySecret(),
    'server_secret_only'
  );
});

test('delegates create, receipt lookup and payment fetch to Razorpay SDK', async () => {
  const fake = createFakeRazorpay();

  const adapter = createRazorpayAdapter({
    RazorpayCtor: fake.FakeRazorpay,
    env: {
      RAZORPAY_KEY_ID:
        'rzp_test_dummy123456',
      RAZORPAY_KEY_SECRET:
        'server_secret_only',
    },
  });

  await adapter.createOrder({
    amount: 52900,
    currency: 'INR',
    receipt:
      'avp_0123456789abcdef0123456789abcdef',
    partial_payment: false,
  });

  await adapter.findOrdersByReceipt(
    'avp_0123456789abcdef0123456789abcdef'
  );

  await adapter.fetchPayment(
    'pay_test123456789012'
  );

  assert.equal(
    fake.calls[1].type,
    'orders.create'
  );

  assert.deepEqual(
    fake.calls[2],
    {
      type: 'orders.all',
      query: {
        receipt:
          'avp_0123456789abcdef0123456789abcdef',
      },
    }
  );

  assert.deepEqual(
    fake.calls[3],
    {
      type: 'payments.fetch',
      paymentId:
        'pay_test123456789012',
    }
  );
});

test('fails closed before constructing SDK when credentials are missing', () => {
  const fake = createFakeRazorpay();

  assert.throws(
    () =>
      createRazorpayAdapter({
        RazorpayCtor:
          fake.FakeRazorpay,
        env: {
          RAZORPAY_KEY_ID: '',
          RAZORPAY_KEY_SECRET: '',
        },
      }),
    (error) =>
      error?.code ===
      'RAZORPAY_CREDENTIALS_MISSING'
  );

  assert.equal(
    fake.calls.length,
    0
  );
});

console.log(
  'RAZORPAY_ADAPTER_RED_TEST_SETUP=PASS'
);
