'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  releasePaymentReservationWithTransaction,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

const SESSION_ID =
  'paysess_0123456789abcdef';

function pendingSession(overrides = {}) {
  return {
    paymentSessionId: SESSION_ID,
    userId: 'customer-uid-1',
    paymentStatus: 'Pending Payment',
    items: [
      {
        productId: 'saree-1',
        quantity: 2,
      },
    ],
    ...overrides,
  };
}

function createFakeFirestore({
  session = pendingSession(),
  product = {
    stock: 3,
  },
} = {}) {
  const reads = [];
  const operations = [];

  const db = {
    collection(name) {
      return {
        doc(id) {
          return {
            id,
            path: `${name}/${id}`,
          };
        },
      };
    },

    async runTransaction(callback) {
      const transaction = {
        async get(ref) {
          reads.push(ref.path);

          if (
            ref.path ===
            `paymentSessions/${SESSION_ID}`
          ) {
            return {
              exists: session !== null,
              data: () => session,
            };
          }

          if (
            ref.path === 'products/saree-1'
          ) {
            return {
              exists: product !== null,
              data: () => product,
            };
          }

          throw new Error(
            `Unexpected read: ${ref.path}`
          );
        },

        update(ref, data) {
          operations.push({
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
  };
}

test('releases pending reservation stock exactly once and marks session expired', async () => {
  const fake = createFakeFirestore();

  const result =
    await releasePaymentReservationWithTransaction(
      {
        paymentSessionId: SESSION_ID,
        targetPaymentStatus: 'Expired',
      },
      dependencies(fake)
    );

  assert.equal(result.released, true);

  assert.deepEqual(fake.reads, [
    `paymentSessions/${SESSION_ID}`,
    'products/saree-1',
  ]);

  assert.deepEqual(
    fake.operations[0],
    {
      path: 'products/saree-1',
      data: {
        stock: 5,
        updatedAt: 'SERVER_TIMESTAMP',
      },
    }
  );

  assert.equal(
    fake.operations[1].path,
    `paymentSessions/${SESSION_ID}`
  );

  assert.equal(
    fake.operations[1]
      .data.paymentStatus,
    'Expired'
  );

  assert.equal(
    fake.operations[1]
      .data.reservationReleased,
    true
  );
});

test('released reservation retry performs zero writes', async () => {
  const fake = createFakeFirestore({
    session: pendingSession({
      paymentStatus: 'Expired',
      reservationReleased: true,
    }),
  });

  const result =
    await releasePaymentReservationWithTransaction(
      {
        paymentSessionId: SESSION_ID,
        targetPaymentStatus: 'Expired',
      },
      dependencies(fake)
    );

  assert.equal(result.released, false);
  assert.equal(
    fake.operations.length,
    0
  );
});

test('never releases stock from an already paid session', async () => {
  const fake = createFakeFirestore({
    session: pendingSession({
      paymentStatus: 'Paid',
      reservationReleased: false,
    }),
  });

  await assert.rejects(
    () =>
      releasePaymentReservationWithTransaction(
        {
          paymentSessionId: SESSION_ID,
          targetPaymentStatus: 'Expired',
        },
        dependencies(fake)
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .SESSION_NOT_RELEASABLE
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

console.log(
  'PAYMENT_RESERVATION_RELEASE_RED_TEST_SETUP=PASS'
);
