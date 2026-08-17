'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRazorpayReceipt,
  ensureRazorpayOrder,
} = require('../src/services/razorpayGateway.service');

const input = {
  paymentSessionId: 'paysess_0123456789abcdef',
  amountPaise: 99998,
  currency: 'INR',
};

test('creates Razorpay order with deterministic receipt and trusted amount', async () => {
  let createdWith = null;

  const result = await ensureRazorpayOrder(
    input,
    {
      findOrdersByReceipt: async () => [],
      createOrder: async (payload) => {
        createdWith = payload;
        return {
          id: 'order_test1234567890',
          amount: payload.amount,
          currency: payload.currency,
          receipt: payload.receipt,
          status: 'created',
        };
      },
    }
  );

  assert.match(
    createdWith.receipt,
    /^avp_[a-f0-9]{32}$/
  );
  assert.ok(createdWith.receipt.length <= 40);
  assert.equal(createdWith.amount, 99998);
  assert.equal(createdWith.currency, 'INR');
  assert.equal(
    createdWith.partial_payment,
    false
  );
  assert.equal(
    result.razorpayOrderId,
    'order_test1234567890'
  );
});

test('recovers matching Razorpay order by receipt without creating another', async () => {
  const receipt =
    buildRazorpayReceipt(
      input.paymentSessionId
    );

  let createCalled = false;

  const result = await ensureRazorpayOrder(
    input,
    {
      findOrdersByReceipt: async () => [{
        id: 'order_existing123456',
        amount: 99998,
        currency: 'INR',
        receipt,
        status: 'created',
      }],
      createOrder: async () => {
        createCalled = true;
      },
    }
  );

  assert.equal(createCalled, false);
  assert.equal(result.recovered, true);
  assert.equal(
    result.razorpayOrderId,
    'order_existing123456'
  );
});

test('rejects recovered Razorpay order with mismatched trusted amount', async () => {
  const receipt =
    buildRazorpayReceipt(
      input.paymentSessionId
    );

  await assert.rejects(
    () => ensureRazorpayOrder(
      input,
      {
        findOrdersByReceipt: async () => [{
          id: 'order_wrong123456',
          amount: 1,
          currency: 'INR',
          receipt,
          status: 'created',
        }],
        createOrder: async () => {
          throw new Error(
            'must not create'
          );
        },
      }
    ),
    (error) =>
      error?.code ===
      'RAZORPAY_ORDER_MISMATCH'
  );
});

console.log(
  'RAZORPAY_GATEWAY_RED_TEST_SETUP=PASS'
);
