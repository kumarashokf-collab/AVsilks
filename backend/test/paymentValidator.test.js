'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateCreateRazorpayOrderInput,
  validateVerifyRazorpayPaymentInput,
} = require('../src/validators/payment.validator');

function validCreatePayload() {
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

test('accepts only checkout identity customer and product quantities for Razorpay order creation', () => {
  const result =
    validateCreateRazorpayOrderInput(
      validCreatePayload()
    );

  assert.equal(result.error, undefined);
  assert.equal(
    result.value.idempotencyKey,
    'payment-checkout-key-0001'
  );
  assert.equal(
    result.value.items[0].productId,
    'product-test-1'
  );
  assert.equal(
    result.value.items[0].quantity,
    1
  );
});

test('rejects client-controlled Razorpay amount currency status and gateway identity during order creation', () => {
  const forbiddenFields = [
    'amount',
    'currency',
    'subtotal',
    'shippingCharge',
    'total',
    'paymentStatus',
    'status',
    'razorpayOrderId',
    'razorpayPaymentId',
    'razorpaySignature',
  ];

  for (const field of forbiddenFields) {
    const payload = {
      ...validCreatePayload(),
      [field]: 'tampered',
    };

    const result =
      validateCreateRazorpayOrderInput(payload);

    assert.ok(
      result.error,
      `${field} must be rejected`
    );
  }
});

test('accepts only the server payment session and Razorpay verification values', () => {
  const result =
    validateVerifyRazorpayPaymentInput({
      paymentSessionId:
        'paysess_0123456789abcdef',
      razorpayOrderId:
        'order_test1234567890',
      razorpayPaymentId:
        'pay_test123456789012',
      razorpaySignature:
        'a'.repeat(64),
    });

  assert.equal(result.error, undefined);
  assert.equal(
    result.value.razorpaySignature.length,
    64
  );
});

test('rejects malformed or client-controlled verification fields', () => {
  const malformed = [
    {
      paymentSessionId: 'bad/session',
      razorpayOrderId: 'order_test1234567890',
      razorpayPaymentId: 'pay_test123456789012',
      razorpaySignature: 'a'.repeat(64),
    },
    {
      paymentSessionId:
        'paysess_0123456789abcdef',
      razorpayOrderId: 'order/test',
      razorpayPaymentId: 'pay_test123456789012',
      razorpaySignature: 'a'.repeat(64),
    },
    {
      paymentSessionId:
        'paysess_0123456789abcdef',
      razorpayOrderId:
        'order_test1234567890',
      razorpayPaymentId:
        'pay_test123456789012',
      razorpaySignature: 'short',
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
      amount: 99900,
    },
  ];

  for (const payload of malformed) {
    assert.ok(
      validateVerifyRazorpayPaymentInput(
        payload
      ).error
    );
  }
});

console.log(
  'PAYMENT_VALIDATOR_RED_TEST_SETUP=PASS'
);
