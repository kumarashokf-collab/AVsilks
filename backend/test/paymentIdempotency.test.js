'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPaymentIdempotencyIdentity,
} = require('../src/services/orderIdempotency.service');

function input(overrides = {}) {
  return {
    userId: 'customer-uid-1',
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
        productId: 'saree-1',
        quantity: 1,
      },
    ],
    paymentMethod: 'razorpay',
    ...overrides,
  };
}

test('creates deterministic payment-session identity', () => {
  const first =
    createPaymentIdempotencyIdentity(input());

  const second =
    createPaymentIdempotencyIdentity(input());

  assert.deepEqual(first, second);
  assert.match(
    first.paymentSessionId,
    /^paysess_[a-f0-9]{48}$/
  );
  assert.equal(
    first.idempotencyKeyHash.length,
    64
  );
  assert.equal(
    first.requestFingerprint.length,
    64
  );
});

test('same key keeps session identity but changed request changes fingerprint', () => {
  const original =
    createPaymentIdempotencyIdentity(input());

  const changed =
    createPaymentIdempotencyIdentity(
      input({
        items: [
          {
            productId: 'saree-1',
            quantity: 2,
          },
        ],
      })
    );

  assert.equal(
    original.paymentSessionId,
    changed.paymentSessionId
  );

  assert.notEqual(
    original.requestFingerprint,
    changed.requestFingerprint
  );
});

test('does not expose the raw idempotency key', () => {
  const identity =
    createPaymentIdempotencyIdentity(input());

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      identity,
      'idempotencyKey'
    ),
    false
  );
});

console.log(
  'PAYMENT_IDEMPOTENCY_RED_TEST_SETUP=PASS'
);
