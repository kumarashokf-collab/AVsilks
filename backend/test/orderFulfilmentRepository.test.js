'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_REPOSITORY_ERROR,
  transitionAdminOrderWithTransaction,
} = require(
  '../src/repositories/order.repository'
);

const {
  ORDER_FULFILMENT_ERROR,
} = require(
  '../src/services/orderFulfilment.service'
);

const {
  ORDER_STATUS,
} = require('../src/constants/orderStatus');

function createOrder(overrides = {}) {
  return {
    id: 'tampered-stored-id',
    userId: 'customer-uid-1',
    status:
      ORDER_STATUS.PROCESSING,
    statusHistory: [
      {
        status:
          ORDER_STATUS.PROCESSING,
        date:
          '2026-07-27T08:00:00.000Z',
        note:
          'Order placed successfully.',
      },
    ],
    ...overrides,
  };
}

function createInput(overrides = {}) {
  return {
    adminUserId: 'admin-uid-1',
    orderId:
      'ord-fulfilment-repository-1',
    nextStatus:
      ORDER_STATUS.CONFIRMED,
    note:
      'Order verified by admin.',
    ...overrides,
  };
}

function createFakeFirestore({
  orderData = createOrder(),
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

          return {
            exists:
              orderData !== null,
            data: () => orderData,
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
      '2026-07-27T12:45:00.000Z',
  };
}

test('atomically applies a valid admin fulfilment transition', async () => {
  const fake =
    createFakeFirestore();

  const result =
    await transitionAdminOrderWithTransaction(
      createInput(),
      dependencies(fake)
    );

  assert.equal(
    result.transitioned,
    true
  );

  assert.equal(
    result.orderId,
    'ord-fulfilment-repository-1'
  );

  assert.equal(
    result.previousStatus,
    ORDER_STATUS.PROCESSING
  );

  assert.equal(
    result.nextStatus,
    ORDER_STATUS.CONFIRMED
  );

  assert.equal(
    result.order.id,
    'ord-fulfilment-repository-1'
  );

  assert.deepEqual(
    fake.reads,
    [
      'orders/ord-fulfilment-repository-1',
    ]
  );

  assert.equal(
    fake.operations.length,
    1
  );

  const operation =
    fake.operations[0];

  assert.equal(
    operation.type,
    'update'
  );

  assert.equal(
    operation.path,
    'orders/ord-fulfilment-repository-1'
  );

  assert.equal(
    operation.data.status,
    ORDER_STATUS.CONFIRMED
  );

  assert.equal(
    operation.data
      .lastStatusUpdatedByUserId,
    'admin-uid-1'
  );

  assert.equal(
    operation.data.statusUpdatedAt,
    '__SERVER_TIMESTAMP__'
  );

  assert.equal(
    operation.data.updatedAt,
    '__SERVER_TIMESTAMP__'
  );

  assert.equal(
    operation.data.statusHistory.length,
    2
  );

  assert.deepEqual(
    operation.data.statusHistory[1],
    {
      status:
        ORDER_STATUS.CONFIRMED,
      date:
        '2026-07-27T12:45:00.000Z',
      note:
        'Order verified by admin.',
      updatedByUserId:
        'admin-uid-1',
    }
  );
});

test('rejects a skipped transition without writes', async () => {
  const fake =
    createFakeFirestore();

  await assert.rejects(
    () =>
      transitionAdminOrderWithTransaction(
        createInput({
          nextStatus:
            ORDER_STATUS.SHIPPED,
        }),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_FULFILMENT_ERROR
        .TRANSITION_NOT_ALLOWED
  );

  assert.deepEqual(
    fake.reads,
    [
      'orders/ord-fulfilment-repository-1',
    ]
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
      transitionAdminOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_FULFILMENT_ERROR
        .ORDER_NOT_FOUND
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects invalid stored status without writes', async () => {
  const fake =
    createFakeFirestore({
      orderData: createOrder({
        status: 'Unknown',
      }),
    });

  await assert.rejects(
    () =>
      transitionAdminOrderWithTransaction(
        createInput(),
        dependencies(fake)
      ),
    (error) =>
      error.code ===
      ORDER_FULFILMENT_ERROR
        .INVALID_STORED_STATUS
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects invalid input before opening a transaction', async () => {
  for (const overrides of [
    {
      adminUserId: '',
    },
    {
      orderId: '',
    },
    {
      orderId:
        'orders/order-1',
    },
    {
      nextStatus: '',
    },
  ]) {
    const fake =
      createFakeFirestore();

    await assert.rejects(
      () =>
        transitionAdminOrderWithTransaction(
          createInput(overrides),
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

test('returns immutable canonical transition data', async () => {
  const fake =
    createFakeFirestore();

  const result =
    await transitionAdminOrderWithTransaction(
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
    result.order.id,
    'ord-fulfilment-repository-1'
  );

  assert.equal(
    result.order.status,
    ORDER_STATUS.CONFIRMED
  );
});
