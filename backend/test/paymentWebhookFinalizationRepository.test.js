'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  finalizeRazorpayPaymentWithTransaction,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

const SESSION_ID =
  'paysess_0123456789abcdef';

const ORDER_ID =
  'order_test1234567890';

const PAYMENT_ID =
  'pay_test123456789012';

const EVENT_ID =
  'event_test1234567890';

function session(overrides = {}) {
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
        productId: 'saree-1',
        name: 'Handloom Silk Saree',
        price: 999.98,
        quantity: 1,
        lineTotal: 999.98,
      },
    ],
    subtotal: 999.98,
    shippingCharge: 0,
    total: 999.98,
    amountPaise: 99998,
    currency: 'INR',
    paymentMethod: 'razorpay',
    paymentStatus: 'Pending Payment',
    razorpayOrderId: ORDER_ID,
    idempotencyKeyHash: 'a'.repeat(64),
    requestFingerprint: 'b'.repeat(64),
    ...overrides,
  };
}

function createFakeFirestore({
  sessionData = session(),
  existingClaim = null,
  existingOrder = null,
  existingWebhookEvent = null,
} = {}) {
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
          if (
            ref.path ===
            `paymentSessions/${SESSION_ID}`
          ) {
            return {
              exists: true,
              data: () => sessionData,
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
            ref.path ===
            `webhookEvents/${EVENT_ID}`
          ) {
            return {
              exists:
                existingWebhookEvent !== null,
              data: () =>
                existingWebhookEvent,
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

        set(ref, data) {
          operations.push({
            type: 'set',
            path: ref.path,
            data,
          });
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
    operations,
  };
}

function dependencies(fake) {
  return {
    db: fake.db,
    serverTimestamp: () =>
      'SERVER_TIMESTAMP',
    nowIso: () =>
      '2026-08-17T20:30:00.000Z',
  };
}

function input(overrides = {}) {
  return {
    paymentSessionId: SESSION_ID,
    userId: 'customer-uid-1',
    razorpayOrderId: ORDER_ID,
    razorpayPaymentId: PAYMENT_ID,
    amountPaise: 99998,
    currency: 'INR',
    webhookEventId: EVENT_ID,
    ...overrides,
  };
}

test('atomically records webhook event with first paid-order finalization', async () => {
  const fake =
    createFakeFirestore();

  const result =
    await finalizeRazorpayPaymentWithTransaction(
      input(),
      dependencies(fake)
    );

  assert.equal(result.finalized, true);

  const eventWrite =
    fake.operations.find(
      (operation) =>
        operation.path ===
        `webhookEvents/${EVENT_ID}`
    );

  assert.ok(eventWrite);

  assert.equal(
    eventWrite.data.eventId,
    EVENT_ID
  );

  assert.equal(
    eventWrite.data.paymentSessionId,
    SESSION_ID
  );

  assert.equal(
    eventWrite.data.razorpayPaymentId,
    PAYMENT_ID
  );

  assert.equal(
    eventWrite.data.razorpayOrderId,
    ORDER_ID
  );

  assert.equal(
    eventWrite.data.processedAt,
    'SERVER_TIMESTAMP'
  );
});

test('same webhook event retry is idempotent after paid finalization', async () => {
  const finalizedOrderId =
    'ord_' + 'c'.repeat(48);

  const fake =
    createFakeFirestore({
      sessionData: session({
        paymentStatus: 'Paid',
        razorpayPaymentId:
          PAYMENT_ID,
        finalizedOrderId,
      }),

      existingClaim: {
        paymentSessionId:
          SESSION_ID,
        orderId:
          finalizedOrderId,
        razorpayPaymentId:
          PAYMENT_ID,
      },

      existingOrder: {
        id: finalizedOrderId,
        userId:
          'customer-uid-1',
        paymentStatus: 'Paid',
        razorpayPaymentId:
          PAYMENT_ID,
      },

      existingWebhookEvent: {
        eventId: EVENT_ID,
        paymentSessionId:
          SESSION_ID,
        razorpayOrderId:
          ORDER_ID,
        razorpayPaymentId:
          PAYMENT_ID,
      },
    });

  const result =
    await finalizeRazorpayPaymentWithTransaction(
      input(),
      dependencies(fake)
    );

  assert.equal(result.finalized, false);

  assert.equal(
    fake.operations.length,
    0
  );
});

test('rejects reuse of webhook event id for another payment identity', async () => {
  const fake =
    createFakeFirestore({
      existingWebhookEvent: {
        eventId: EVENT_ID,
        paymentSessionId:
          'paysess_another123456',
        razorpayOrderId:
          'order_another123456',
        razorpayPaymentId:
          'pay_another123456',
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
        .WEBHOOK_EVENT_CONFLICT
  );

  assert.equal(
    fake.operations.length,
    0
  );
});

console.log(
  'PAYMENT_WEBHOOK_FINALIZATION_RED_TEST_SETUP=PASS'
);
