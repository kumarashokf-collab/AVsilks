'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPaymentController,
} = require('../src/controllers/payment.controller');

function createResponse() {
  return {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('creates Razorpay checkout through orchestration and returns safe 201 response', async () => {
  let received = null;

  const controller = createPaymentController({
    createRazorpayCheckout:
      async (user, body) => {
        received = {
          user,
          body,
        };

        return {
          paymentSessionId:
            'paysess_0123456789abcdef',
          razorpayOrderId:
            'order_test1234567890',
          amountPaise: 52900,
          currency: 'INR',
          receipt:
            'avp_0123456789abcdef0123456789abcdef',
          recovered: false,
        };
      },

    verifyAndFinalizeRazorpayPayment:
      async () => {
        throw new Error(
          'verify must not be called'
        );
      },
  });

  const req = {
    user: {
      uid: 'customer-uid-1',
    },
    body: {
      idempotencyKey:
        'payment-checkout-key-0001',
      customer: {
        name: 'Ashok Kumar',
      },
      items: [
        {
          productId: 'saree-1',
          quantity: 1,
        },
      ],
    },
  };

  const res = createResponse();

  await controller.createRazorpayOrder(
    req,
    res
  );

  assert.deepEqual(
    received,
    {
      user: req.user,
      body: req.body,
    }
  );

  assert.equal(res.statusCode, 201);
  assert.equal(
    res.body.success,
    true
  );
  assert.equal(
    res.body.data.paymentSessionId,
    'paysess_0123456789abcdef'
  );
});

test('verifies and finalizes Razorpay payment through orchestration', async () => {
  const controller =
    createPaymentController({
      createRazorpayCheckout:
        async () => {
          throw new Error(
            'create must not be called'
          );
        },

      verifyAndFinalizeRazorpayPayment:
        async (user, body) => {
          assert.equal(
            user.uid,
            'customer-uid-1'
          );

          assert.equal(
            body.paymentSessionId,
            'paysess_0123456789abcdef'
          );

          return {
            verified: true,
            finalized: true,
            orderId:
              'ord_' +
              'c'.repeat(48),
            paymentSessionId:
              body.paymentSessionId,
            razorpayPaymentId:
              body.razorpayPaymentId,
          };
        },
    });

  const res = createResponse();

  await controller.verifyRazorpayPayment(
    {
      user: {
        uid: 'customer-uid-1',
      },
      body: {
        paymentSessionId:
          'paysess_0123456789abcdef',
        razorpayOrderId:
          'order_test1234567890',
        razorpayPaymentId:
          'pay_test123456789012',
        razorpaySignature:
          'a'.repeat(64),
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(
    res.body.success,
    true
  );
  assert.equal(
    res.body.data.verified,
    true
  );
});

test('maps validation failures to safe 400 response without leaking internals', async () => {
  const controller =
    createPaymentController({
      createRazorpayCheckout:
        async () => {
          const error =
            new Error(
              'Sensitive internal detail'
            );

          error.code =
            'VALIDATION_FAILED';

          error.details = [
            {
              path: 'items',
              type: 'array.min',
            },
          ];

          throw error;
        },

      verifyAndFinalizeRazorpayPayment:
        async () => ({}),
    });

  const res = createResponse();

  await controller.createRazorpayOrder(
    {
      user: {
        uid: 'customer-uid-1',
      },
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 400);

  assert.deepEqual(res.body, {
    success: false,
    code: 'VALIDATION_FAILED',
    message:
      'Payment request validation failed.',
    details: [
      {
        path: 'items',
        type: 'array.min',
      },
    ],
  });

  assert.equal(
    JSON.stringify(res.body).includes(
      'Sensitive internal detail'
    ),
    false
  );
});

test('maps authentication failures to 401', async () => {
  const controller =
    createPaymentController({
      createRazorpayCheckout:
        async () => {
          const error =
            new Error('internal');

          error.code =
            'AUTHENTICATION_REQUIRED';

          throw error;
        },

      verifyAndFinalizeRazorpayPayment:
        async () => ({}),
    });

  const res = createResponse();

  await controller.createRazorpayOrder(
    {
      body: {},
    },
    res
  );

  assert.equal(res.statusCode, 401);
  assert.equal(
    res.body.code,
    'AUTHENTICATION_REQUIRED'
  );
});

console.log(
  'PAYMENT_CONTROLLER_RED_TEST_SETUP=PASS'
);
