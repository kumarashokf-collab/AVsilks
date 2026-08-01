'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sha256,
  validateIdempotencyKey,
  buildCanonicalRequest,
  createOrderIdempotencyIdentity,
} = require('../src/services/orderIdempotency.service');

function createValidRequest(overrides = {}) {
  return {
    userId: 'customer-uid-1',
    idempotencyKey: 'checkout-test-key-0001',
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
        productId: 'product-2',
        quantity: 1,
      },
      {
        productId: 'product-1',
        quantity: 2,
      },
    ],
    paymentMethod: 'cod',
    ...overrides,
  };
}

test('creates a deterministic order identity', () => {
  const request = createValidRequest();

  const first =
    createOrderIdempotencyIdentity(request);

  const second =
    createOrderIdempotencyIdentity(request);

  assert.deepEqual(first, second);

  assert.match(
    first.orderId,
    /^ord_[a-f0-9]{48}$/
  );

  assert.match(
    first.idempotencyKeyHash,
    /^[a-f0-9]{64}$/
  );

  assert.match(
    first.requestFingerprint,
    /^[a-f0-9]{64}$/
  );
});

test('does not expose the raw idempotency key', () => {
  const request = createValidRequest();

  const identity =
    createOrderIdempotencyIdentity(request);

  assert.equal(
    JSON.stringify(identity).includes(
      request.idempotencyKey
    ),
    false
  );

  assert.equal(
    identity.idempotencyKeyHash,
    sha256(request.idempotencyKey)
  );
});

test('keeps identity stable when item order changes', () => {
  const request = createValidRequest();

  const first =
    createOrderIdempotencyIdentity(request);

  const reordered =
    createOrderIdempotencyIdentity({
      ...request,
      items: [...request.items].reverse(),
    });

  assert.deepEqual(first, reordered);
});

test('detects changed request content for the same key', () => {
  const request = createValidRequest();

  const first =
    createOrderIdempotencyIdentity(request);

  const changed =
    createOrderIdempotencyIdentity({
      ...request,
      items: [
        {
          productId: 'product-1',
          quantity: 3,
        },
        {
          productId: 'product-2',
          quantity: 1,
        },
      ],
    });

  assert.equal(
    changed.orderId,
    first.orderId
  );

  assert.equal(
    changed.idempotencyKeyHash,
    first.idempotencyKeyHash
  );

  assert.notEqual(
    changed.requestFingerprint,
    first.requestFingerprint
  );
});

test('isolates idempotency identities by user', () => {
  const first =
    createOrderIdempotencyIdentity(
      createValidRequest()
    );

  const anotherUser =
    createOrderIdempotencyIdentity(
      createValidRequest({
        userId: 'customer-uid-2',
      })
    );

  assert.notEqual(
    anotherUser.orderId,
    first.orderId
  );
});

test('canonicalizes whitespace and payment method', () => {
  const canonical = buildCanonicalRequest({
    userId: ' customer-uid-1 ',
    customer: {
      name: ' Ashok Kumar ',
      phone: ' 9876543210 ',
      address: {
        house: ' 1-2 ',
        street: ' Main Road ',
        city: ' Tirupati ',
        state: ' Andhra Pradesh ',
        pin: ' 517501 ',
      },
    },
    items: [
      {
        productId: ' product-1 ',
        quantity: 2,
      },
    ],
    paymentMethod: ' COD ',
  });

  assert.equal(
    canonical.userId,
    'customer-uid-1'
  );

  assert.equal(
    canonical.customer.name,
    'Ashok Kumar'
  );

  assert.equal(
    canonical.items[0].productId,
    'product-1'
  );

  assert.equal(
    canonical.paymentMethod,
    'cod'
  );
});

test('rejects invalid idempotency keys', () => {
  for (const key of [
    '',
    'short',
    'invalid key with spaces',
    '/invalid-key-0000001',
    'invalid/key-0000001',
  ]) {
    assert.throws(
      () => validateIdempotencyKey(key),
      (error) =>
        error.code ===
        'INVALID_IDEMPOTENCY_KEY'
    );
  }
});

test('requires an authenticated user ID', () => {
  assert.throws(
    () =>
      createOrderIdempotencyIdentity(
        createValidRequest({
          userId: '',
        })
      ),
    (error) =>
      error.code === 'INVALID_USER_ID'
  );
});

test('returns an immutable identity object', () => {
  const identity =
    createOrderIdempotencyIdentity(
      createValidRequest()
    );

  assert.equal(
    Object.isFrozen(identity),
    true
  );
});
