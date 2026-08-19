'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  finalizeRazorpayPaymentWithTransaction,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

const SESSION_ID =
  'paysess_0123456789abcdef';

const PAYMENT_ID =
  'pay_test123456789012';

const RAZORPAY_ORDER_ID =
  'order_test1234567890';

function pendingSession(overrides = {}) {
  return {
    paymentSessionId: SESSION_ID,
    userId: 'customer-uid-1',
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
        id: 'saree-1',
        productId: 'saree-1',
        name: 'Handloom Silk Saree',
        price: 499.99,
        quantity: 2,
        lineTotal: 999.98,
      },
    ],
    subtotal: 999.98,
    shippingCharge: 0,
    total: 999.98,
    amountPaise: 99998,
    currency: 'INR',
    paymentMethod: 'razorpay',
    payment: 'Razorpay',
    paymentStatus: 'Pending Payment',
    razorpayOrderId: RAZORPAY_ORDER_ID,
    idempotencyKeyHash: 'a'.repeat(64),
    requestFingerprint: 'b'.repeat(64),
    ...overrides,
  };
}

function createFakeFirestore({
  session = pendingSession(),
  existingClaim = null,
  existingOrder = null,
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
            ref.path ===
            `paymentSessions/${SESSION_ID}`
          ) {
            return {
              exists: session !== null,
              data: () => session,
            };
          }

          if (
            ref.path ===
            `paymentClaims/${PAYMENT_ID}`
          ) {
            return {
              exists:
                existingClaim !== null,
              data: () => existingClaim,
            };
          }

          if (
            ref.path.startsWith('orders/')
          ) {
            return {
              exists:
                existingOrder !== null,
              data: () => existingOrder,
            };
          }

          throw new Error(
            `Unexpected read: ${ref.path}`
          );
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
      '2026-08-17T17:30:00.000Z',
  };
}

function input(overrides = {}) {
  return {
    paymentSessionId: SESSION_ID,
    userId: 'customer-uid-1',
    razorpayOrderId:
      RAZORPAY_ORDER_ID,
    razorpayPaymentId:
      PAYMENT_ID,
    amountPaise: 99998,
    currency: 'INR',
    ...overrides,
  };
}

test('finalizes a verified payment into a paid Processing order without touching product stock', async () => {
  const fake = createFakeFirestore();

  const result =
    await finalizeRazorpayPaymentWithTransaction(
      input(),
      dependencies(fake)
    );

  assert.equal(result.finalized, true);
  assert.match(
    result.orderId,
    /^ord_[a-f0-9]{48}$/
  );

  assert.equal(
    fake.operations.some(
      (operation) =>
        operation.path.startsWith(
          'products/'
        )
    ),
    false
  );

  const orderWrite =
    fake.operations.find(
      (operation) =>
        operation.type === 'set' &&
        operation.path ===
          `orders/${result.orderId}`
    );

  assert.ok(orderWrite);
  assert.equal(
    orderWrite.data.paymentStatus,
    'Paid'
  );
  assert.equal(
    orderWrite.data.status,
    'Processing'
  );
  assert.equal(
    orderWrite.data.payment,
    'Razorpay'
  );
  assert.equal(
    orderWrite.data.razorpayPaymentId,
    PAYMENT_ID
  );
  assert.equal(
    orderWrite.data.paymentSessionId,
    SESSION_ID
  );

  const claimWrite =
    fake.operations.find(
      (operation) =>
        operation.path ===
        `paymentClaims/${PAYMENT_ID}`
    );

  assert.ok(claimWrite);

  const sessionUpdate =
    fake.operations.find(
      (operation) =>
        operation.path ===
        `paymentSessions/${SESSION_ID}`
    );

  assert.equal(
    sessionUpdate.data.paymentStatus,
    'Paid'
  );
  assert.equal(
    sessionUpdate.data.finalizedOrderId,
    result.orderId
  );
});

test('same successful payment retry is idempotent with zero writes', async () => {
  const orderId =
    'ord_' + 'c'.repeat(48);

  const fake = createFakeFirestore({
    session: pendingSession({
      paymentStatus: 'Paid',
      razorpayPaymentId: PAYMENT_ID,
      finalizedOrderId: orderId,
    }),
    existingClaim: {
      paymentSessionId: SESSION_ID,
      orderId,
      razorpayPaymentId: PAYMENT_ID,
    },
    existingOrder: {
      id: orderId,
      userId: 'customer-uid-1',
      paymentStatus: 'Paid',
      razorpayPaymentId: PAYMENT_ID,
    },
  });

  const result =
    await finalizeRazorpayPaymentWithTransaction(
      input(),
      dependencies(fake)
    );

  assert.equal(result.finalized, false);
  assert.equal(result.orderId, orderId);
  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects replay of a Razorpay payment already claimed by another session', async () => {
  const fake = createFakeFirestore({
    existingClaim: {
      paymentSessionId:
        'paysess_another123456',
      orderId:
        'ord_' + 'd'.repeat(48),
      razorpayPaymentId: PAYMENT_ID,
    },
  });

  await assert.rejects(
    () =>
      finalizeRazorpayPaymentWithTransaction(
        input(),
        dependencies(fake)
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .PAYMENT_REPLAY_CONFLICT
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects trusted payment data mismatch without writes', async () => {
  const fake = createFakeFirestore();

  await assert.rejects(
    () =>
      finalizeRazorpayPaymentWithTransaction(
        input({
          amountPaise: 1,
        }),
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
  'PAYMENT_FINALIZATION_RED_TEST_SETUP=PASS'
);
