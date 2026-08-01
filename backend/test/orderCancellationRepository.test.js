'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_REPOSITORY_ERROR,
  cancelCustomerOrderWithTransaction,
} = require(
  '../src/repositories/order.repository'
);

const {
  ORDER_CANCELLATION_ERROR,
} = require(
  '../src/services/orderCancellation.service'
);

function createOrder(overrides = {}) {
  return {
    id: 'stored-tampered-id',
    userId: 'customer-uid-1',
    status: 'Processing',
    items: [
      {
        productId: 'saree-1',
        quantity: 2,
      },
      {
        id: 'legacy-saree-2',
        quantity: 1,
      },
    ],
    statusHistory: [
      {
        status: 'Processing',
        date: '2026-07-27T07:00:00.000Z',
        note: 'Order placed successfully',
      },
    ],
    ...overrides,
  };
}

function createInput(overrides = {}) {
  return {
    userId: 'customer-uid-1',
    orderId: 'ord-cancel-repository-1',
    reason: 'Customer changed the order choice.',
    ...overrides,
  };
}

function createFakeFirestore({
  orderData = createOrder(),
  productDataById = {
    'saree-1': {
      stock: 3,
    },
    'legacy-saree-2': {
      stock: 7,
    },
  },
} = {}) {
  const reads = [];
  const operations = [];
  let transactionCount = 0;

  const db = {
    collection(collectionName) {
      return {
        doc(documentId) {
          return {
            id: documentId,
            path:
              collectionName +
              '/' +
              documentId,
          };
        },
      };
    },

    async runTransaction(callback) {
      transactionCount += 1;

      const transaction = {
        async get(ref) {
          reads.push(ref.path);

          if (
            ref.path.startsWith('orders/')
          ) {
            return {
              exists: orderData !== null,
              data: () => orderData,
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
      };

      return callback(transaction);
    },
  };

  return {
    db,
    reads,
    operations,
    get transactionCount() {
      return transactionCount;
    },
  };
}

function dependencies(fake) {
  return {
    db: fake.db,
    serverTimestamp: () =>
      '__SERVER_TIMESTAMP__',
    nowIso: () =>
      '2026-07-27T08:00:00.000Z',
  };
}

test('atomically cancels an owned order and restores stock', async () => {
  const fake =
    createFakeFirestore();

  const result =
    await cancelCustomerOrderWithTransaction(
      createInput(),
      dependencies(fake)
    );

  assert.equal(result.cancelled, true);

  assert.equal(
    result.orderId,
    'ord-cancel-repository-1'
  );

  assert.equal(
    result.order.id,
    'ord-cancel-repository-1'
  );

  assert.equal(
    result.previousStatus,
    'Processing'
  );

  assert.equal(
    result.nextStatus,
    'Cancelled'
  );

  assert.deepEqual(
    fake.reads,
    [
      'orders/ord-cancel-repository-1',
      'products/saree-1',
      'products/legacy-saree-2',
    ]
  );

  assert.deepEqual(
    fake.operations[0],
    {
      type: 'update',
      path: 'products/saree-1',
      data: {
        stock: 5,
        updatedAt:
          '__SERVER_TIMESTAMP__',
      },
    }
  );

  assert.deepEqual(
    fake.operations[1],
    {
      type: 'update',
      path:
        'products/legacy-saree-2',
      data: {
        stock: 8,
        updatedAt:
          '__SERVER_TIMESTAMP__',
      },
    }
  );

  const orderOperation =
    fake.operations[2];

  assert.equal(
    orderOperation.path,
    'orders/ord-cancel-repository-1'
  );

  assert.equal(
    orderOperation.data.status,
    'Cancelled'
  );

  assert.equal(
    orderOperation.data.cancelReason,
    'Customer changed the order choice.'
  );

  assert.equal(
    orderOperation.data.cancelledByUserId,
    'customer-uid-1'
  );

  assert.equal(
    orderOperation.data.cancelledAt,
    '__SERVER_TIMESTAMP__'
  );

  assert.equal(
    orderOperation.data.statusHistory.length,
    2
  );

  assert.deepEqual(
    result.stockRestorations,
    [
      {
        productId: 'saree-1',
        currentStock: 3,
        nextStock: 5,
        quantityRestored: 2,
      },
      {
        productId:
          'legacy-saree-2',
        currentStock: 7,
        nextStock: 8,
        quantityRestored: 1,
      },
    ]
  );
});

test('rejects cancellation by another customer before product reads', async () => {
  const fake =
    createFakeFirestore();

  await assert.rejects(
    () =>
      cancelCustomerOrderWithTransaction(
        createInput({
          userId: 'different-customer',
        }),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .ORDER_OWNERSHIP_MISMATCH
  );

  assert.deepEqual(
    fake.reads,
    [
      'orders/ord-cancel-repository-1',
    ]
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects a non-cancellable status without writes', async () => {
  const fake =
    createFakeFirestore({
      orderData: createOrder({
        status: 'Shipped',
      }),
    });

  await assert.rejects(
    () =>
      cancelCustomerOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .STATUS_NOT_CANCELLABLE
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects a missing order without writes', async () => {
  const fake =
    createFakeFirestore({
      orderData: null,
    });

  await assert.rejects(
    () =>
      cancelCustomerOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .ORDER_NOT_FOUND
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects a missing product without partial writes', async () => {
  const fake =
    createFakeFirestore({
      productDataById: {
        'saree-1': {
          stock: 3,
        },
      },
    });

  await assert.rejects(
    () =>
      cancelCustomerOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_REPOSITORY_ERROR
        .PRODUCT_NOT_FOUND
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects invalid live stock without partial writes', async () => {
  for (const invalidStock of [
    -1,
    1.5,
    'invalid',
    Number.MAX_SAFE_INTEGER,
  ]) {
    const fake =
      createFakeFirestore({
        productDataById: {
          'saree-1': {
            stock: invalidStock,
          },
          'legacy-saree-2': {
            stock: 7,
          },
        },
      });

    await assert.rejects(
      () =>
        cancelCustomerOrderWithTransaction(
          createInput(),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        ORDER_REPOSITORY_ERROR
          .INVALID_PRODUCT_STOCK
    );

    assert.equal(
      fake.operations.length,
      0
    );
  }
});

test('rejects invalid input before opening a transaction', async () => {
  for (const override of [
    { userId: '' },
    { orderId: '' },
    { reason: '' },
  ]) {
    const fake =
      createFakeFirestore();

    await assert.rejects(
      () =>
        cancelCustomerOrderWithTransaction(
          createInput(override),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        ORDER_REPOSITORY_ERROR
          .INVALID_INPUT
    );

    assert.equal(
      fake.transactionCount,
      0
    );

    assert.equal(
      fake.operations.length,
      0
    );
  }
});

test('returns immutable cancellation results', async () => {
  const fake =
    createFakeFirestore();

  const result =
    await cancelCustomerOrderWithTransaction(
      createInput(),
      dependencies(fake)
    );

  assert.equal(
    Object.isFrozen(result),
    true
  );

  assert.equal(
    Object.isFrozen(result.order),
    true
  );

  assert.equal(
    Object.isFrozen(
      result.stockRestorations
    ),
    true
  );
});
