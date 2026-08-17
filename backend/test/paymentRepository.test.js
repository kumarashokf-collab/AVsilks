'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPaymentIdempotencyIdentity,
} = require('../src/services/orderIdempotency.service');

const {
  createPaymentSessionWithTransaction,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

function createInput(overrides = {}) {
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
        quantity: 2,
      },
    ],
    paymentMethod: 'razorpay',
    ...overrides,
  };
}

function identityFor(input) {
  return createPaymentIdempotencyIdentity({
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
    customer: input.customer,
    items: input.items,
    paymentMethod: input.paymentMethod,
  });
}

function createFakeFirestore({
  existingSession = null,
  productDataById = {
    'saree-1': {
      name: 'Handloom Silk Saree',
      price: 499.99,
      stock: 5,
      active: true,
    },
  },
} = {}) {
  const reads = [];
  const operations = [];

  const db = {
    collection(collectionName) {
      return {
        doc(documentId) {
          return {
            id: documentId,
            path:
              `${collectionName}/${documentId}`,
          };
        },
      };
    },

    async runTransaction(callback) {
      const transaction = {
        async get(ref) {
          reads.push(ref.path);

          if (
            ref.path.startsWith(
              'paymentSessions/'
            )
          ) {
            return {
              exists:
                existingSession !== null,
              data: () => existingSession,
            };
          }

          const productId =
            ref.path.split('/')[1];

          const exists =
            Object.prototype
              .hasOwnProperty.call(
                productDataById,
                productId
              );

          return {
            exists,
            data: () =>
              exists
                ? productDataById[
                    productId
                  ]
                : null,
          };
        },

        update(ref, data) {
          operations.push({
            type: 'update',
            path: ref.path,
            data,
          });
        },

        set(ref, data) {
          operations.push({
            type: 'set',
            path: ref.path,
            data,
          });
        },
      };

      return callback(transaction);
    },
  };

  return {
    db,
    reads,
    operations,
  };
}

function dependencies(fake) {
  return {
    db: fake.db,
    serverTimestamp: () =>
      'SERVER_TIMESTAMP',
    nowIso: () =>
      '2026-08-17T10:00:00.000Z',
    expiresAtIso: () =>
      '2026-08-17T10:15:00.000Z',
  };
}

test('atomically reserves stock and creates authoritative payment session', async () => {
  const input = createInput();
  const identity = identityFor(input);
  const fake = createFakeFirestore();

  const result =
    await createPaymentSessionWithTransaction(
      input,
      dependencies(fake)
    );

  assert.equal(result.created, true);
  assert.equal(
    result.paymentSessionId,
    identity.paymentSessionId
  );
  assert.equal(result.amountPaise, 99998);
  assert.equal(result.currency, 'INR');

  assert.deepEqual(fake.reads, [
    `paymentSessions/${identity.paymentSessionId}`,
    'products/saree-1',
  ]);

  assert.equal(
    fake.operations.length,
    2
  );

  assert.deepEqual(
    fake.operations[0],
    {
      type: 'update',
      path: 'products/saree-1',
      data: {
        stock: 3,
        updatedAt: 'SERVER_TIMESTAMP',
      },
    }
  );

  assert.equal(
    fake.operations[1].type,
    'set'
  );
  assert.equal(
    fake.operations[1].path,
    `paymentSessions/${identity.paymentSessionId}`
  );
  assert.equal(
    fake.operations[1]
      .data.paymentStatus,
    'Pending Payment'
  );
  assert.equal(
    fake.operations[1]
      .data.amountPaise,
    99998
  );
});

test('same payment retry returns existing session without reserving stock again', async () => {
  const input = createInput();
  const identity = identityFor(input);

  const fake = createFakeFirestore({
    existingSession: {
      userId: input.userId,
      idempotencyKeyHash:
        identity.idempotencyKeyHash,
      requestFingerprint:
        identity.requestFingerprint,
      amountPaise: 99998,
      currency: 'INR',
      paymentStatus: 'Pending Payment',
    },
  });

  const result =
    await createPaymentSessionWithTransaction(
      input,
      dependencies(fake)
    );

  assert.equal(result.created, false);
  assert.equal(
    result.paymentSessionId,
    identity.paymentSessionId
  );

  assert.deepEqual(fake.reads, [
    `paymentSessions/${identity.paymentSessionId}`,
  ]);

  assert.equal(
    fake.operations.length,
    0
  );
});

test('changed request with same idempotency key is rejected without writes', async () => {
  const original = createInput();
  const identity =
    identityFor(original);

  const fake = createFakeFirestore({
    existingSession: {
      userId: original.userId,
      idempotencyKeyHash:
        identity.idempotencyKeyHash,
      requestFingerprint:
        identity.requestFingerprint,
    },
  });

  const changed = createInput({
    items: [
      {
        productId: 'saree-1',
        quantity: 1,
      },
    ],
  });

  await assert.rejects(
    () =>
      createPaymentSessionWithTransaction(
        changed,
        dependencies(fake)
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .IDEMPOTENCY_CONFLICT
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('insufficient stock creates no partial writes', async () => {
  const input = createInput();

  const fake = createFakeFirestore({
    productDataById: {
      'saree-1': {
        name: 'Handloom Silk Saree',
        price: 499.99,
        stock: 1,
        active: true,
      },
    },
  });

  await assert.rejects(
    () =>
      createPaymentSessionWithTransaction(
        input,
        dependencies(fake)
      ),
    (error) =>
      error?.code ===
      'INSUFFICIENT_STOCK'
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

console.log(
  'PAYMENT_REPOSITORY_RED_TEST_SETUP=PASS'
);
