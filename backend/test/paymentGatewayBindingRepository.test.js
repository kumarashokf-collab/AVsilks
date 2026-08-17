'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  bindRazorpayOrderWithTransaction,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

function createFakeFirestore(sessionData) {
  const operations = [];

  const db = {
    collection(collectionName) {
      return {
        doc(documentId) {
          return {
            id: documentId,
            path: `${collectionName}/${documentId}`,
          };
        },
      };
    },

    async runTransaction(callback) {
      const transaction = {
        async get(ref) {
          assert.equal(
            ref.path,
            'paymentSessions/paysess_0123456789abcdef'
          );

          return {
            exists: sessionData !== null,
            data: () => sessionData,
          };
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

function input(overrides = {}) {
  return {
    paymentSessionId:
      'paysess_0123456789abcdef',
    userId: 'customer-uid-1',
    amountPaise: 99998,
    currency: 'INR',
    razorpayOrderId:
      'order_test1234567890',
    receipt:
      'avp_0123456789abcdef0123456789abcdef',
    ...overrides,
  };
}

function pendingSession(overrides = {}) {
  return {
    paymentSessionId:
      'paysess_0123456789abcdef',
    userId: 'customer-uid-1',
    amountPaise: 99998,
    currency: 'INR',
    paymentStatus: 'Pending Payment',
    ...overrides,
  };
}

test('atomically binds Razorpay order to matching pending payment session', async () => {
  const fake = createFakeFirestore(
    pendingSession()
  );

  const result =
    await bindRazorpayOrderWithTransaction(
      input(),
      dependencies(fake)
    );

  assert.equal(result.bound, true);
  assert.equal(
    result.razorpayOrderId,
    'order_test1234567890'
  );

  assert.equal(
    fake.operations.length,
    1
  );

  assert.deepEqual(
    fake.operations[0],
    {
      path:
        'paymentSessions/paysess_0123456789abcdef',
      data: {
        razorpayOrderId:
          'order_test1234567890',
        razorpayReceipt:
          'avp_0123456789abcdef0123456789abcdef',
        updatedAt:
          'SERVER_TIMESTAMP',
      },
    }
  );
});

test('same Razorpay order binding retry is idempotent', async () => {
  const fake = createFakeFirestore(
    pendingSession({
      razorpayOrderId:
        'order_test1234567890',
      razorpayReceipt:
        'avp_0123456789abcdef0123456789abcdef',
    })
  );

  const result =
    await bindRazorpayOrderWithTransaction(
      input(),
      dependencies(fake)
    );

  assert.equal(result.bound, false);
  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects a different Razorpay order for an already bound session', async () => {
  const fake = createFakeFirestore(
    pendingSession({
      razorpayOrderId:
        'order_existing123456',
      razorpayReceipt:
        'avp_0123456789abcdef0123456789abcdef',
    })
  );

  await assert.rejects(
    () =>
      bindRazorpayOrderWithTransaction(
        input(),
        dependencies(fake)
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .RAZORPAY_ORDER_CONFLICT
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects binding when trusted session ownership or amount does not match', async () => {
  const fake = createFakeFirestore(
    pendingSession({
      userId: 'another-user',
    })
  );

  await assert.rejects(
    () =>
      bindRazorpayOrderWithTransaction(
        input(),
        dependencies(fake)
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .SESSION_MISMATCH
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

console.log(
  'PAYMENT_GATEWAY_BINDING_RED_TEST_SETUP=PASS'
);
