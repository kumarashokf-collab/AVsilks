'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_REPOSITORY_ERROR,
  createOrderWithTransaction,
} = require('../src/repositories/order.repository');

const {
  ORDER_ITEM_ERROR,
} = require('../src/services/orderItem.service');

function createInput(overrides = {}) {
  return {
    userId: 'customer-uid-1',
    authenticatedPhone: '+919876543210',
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
    requestedItems: [
      {
        productId: 'saree-1',
        quantity: 2,
      },
    ],
    paymentMethod: 'cod',
    idempotencyIdentity: {
      orderId: 'ord_repository_test_1',
      idempotencyKeyHash: 'a'.repeat(64),
      requestFingerprint: 'b'.repeat(64),
    },
    ...overrides,
  };
}

function createFakeFirestore({
  existingOrder = null,
  productDataById = {
    'saree-1': {
      name: 'AV Silk Saree',
      price: 499.5,
      stock: 5,
      sku: 'av-001',
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

          if (ref.path.startsWith('orders/')) {
            return {
              exists: existingOrder !== null,
              data: () => existingOrder,
            };
          }

          const productId =
            ref.path.split('/')[1];

          const exists =
            Object.prototype.hasOwnProperty.call(
              productDataById,
              productId
            );

          return {
            exists,
            data: () =>
              exists
                ? productDataById[productId]
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
      '__SERVER_TIMESTAMP__',
    nowIso: () =>
      '2026-07-26T08:30:00.000Z',
  };
}

test('atomically creates an order and deducts live stock', async () => {
  const fake = createFakeFirestore();

  const result =
    await createOrderWithTransaction(
      createInput(),
      dependencies(fake)
    );

  assert.equal(result.created, true);
  assert.equal(
    result.orderId,
    'ord_repository_test_1'
  );

  assert.equal(result.order.subtotal, 999);
  assert.equal(result.order.total, 999);

  assert.deepEqual(fake.reads, [
    'orders/ord_repository_test_1',
    'products/saree-1',
  ]);

  assert.deepEqual(
    fake.operations[0],
    {
      type: 'update',
      path: 'products/saree-1',
      data: {
        stock: 3,
        updatedAt:
          '__SERVER_TIMESTAMP__',
      },
    }
  );

  assert.equal(
    fake.operations[1].type,
    'set'
  );

  assert.equal(
    fake.operations[1].path,
    'orders/ord_repository_test_1'
  );

  assert.equal(
    fake.operations[1].data.userId,
    'customer-uid-1'
  );

  assert.equal(
    fake.operations[1].data.createdAt,
    '__SERVER_TIMESTAMP__'
  );

  assert.equal(
    fake.operations[1].data.updatedAt,
    '__SERVER_TIMESTAMP__'
  );
});

test('returns the existing order without deducting stock on retry', async () => {
  const fake = createFakeFirestore({
    existingOrder: {
      id: 'tampered-stored-id',
      userId: 'customer-uid-1',
      idempotencyKeyHash:
        'a'.repeat(64),
      requestFingerprint:
        'b'.repeat(64),
      total: 999,
    },
  });

  const result =
    await createOrderWithTransaction(
      createInput(),
      dependencies(fake)
    );

  assert.equal(result.created, false);

  assert.equal(
    result.order.id,
    'ord_repository_test_1'
  );

  assert.equal(result.order.total, 999);

  assert.deepEqual(fake.reads, [
    'orders/ord_repository_test_1',
  ]);

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects reuse of an idempotency key for changed request content', async () => {
  const fake = createFakeFirestore({
    existingOrder: {
      userId: 'customer-uid-1',
      idempotencyKeyHash:
        'a'.repeat(64),
      requestFingerprint:
        'different-fingerprint',
    },
  });

  await assert.rejects(
    () =>
      createOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_REPOSITORY_ERROR
        .IDEMPOTENCY_CONFLICT
  );

  assert.deepEqual(fake.reads, [
    'orders/ord_repository_test_1',
  ]);

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects a missing product without writing the order', async () => {
  const fake = createFakeFirestore({
    productDataById: {},
  });

  await assert.rejects(
    () =>
      createOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.PRODUCT_NOT_FOUND
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects insufficient stock without partial writes', async () => {
  const fake = createFakeFirestore({
    productDataById: {
      'saree-1': {
        name: 'Limited Saree',
        price: 500,
        stock: 1,
        active: true,
      },
    },
  });

  await assert.rejects(
    () =>
      createOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.INSUFFICIENT_STOCK
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects invalid transaction input before database access', async () => {
  await assert.rejects(
    () =>
      createOrderWithTransaction({
        userId: '',
        requestedItems: [],
        idempotencyIdentity: {},
      }),
    (error) =>
      error.code ===
      ORDER_REPOSITORY_ERROR.INVALID_INPUT
  );
});
