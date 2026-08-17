'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getPaymentSessionByRazorpayOrderId,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

const ORDER_ID =
  'order_test1234567890';

function createFakeFirestore(
  sessions = []
) {
  const calls = [];

  const db = {
    collection(name) {
      calls.push(
        `collection:${name}`
      );

      return {
        where(field, op, value) {
          calls.push(
            `where:${field}:${op}:${value}`
          );

          return {
            limit(count) {
              calls.push(
                `limit:${count}`
              );

              return {
                async get() {
                  calls.push('get');

                  return {
                    docs: sessions.map(
                      (session, index) => ({
                        id:
                          session.id ||
                          `paysess_test${index}`,
                        data: () =>
                          session.data,
                      })
                    ),
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    db,
    calls,
  };
}

test('loads the single trusted payment session bound to a Razorpay order', async () => {
  const fake =
    createFakeFirestore([
      {
        id:
          'paysess_0123456789abcdef',
        data: {
          userId:
            'customer-uid-1',
          razorpayOrderId:
            ORDER_ID,
          amountPaise: 99998,
          currency: 'INR',
          paymentStatus:
            'Pending Payment',
        },
      },
    ]);

  const result =
    await getPaymentSessionByRazorpayOrderId(
      ORDER_ID,
      {
        db: fake.db,
      }
    );

  assert.deepEqual(result, {
    paymentSessionId:
      'paysess_0123456789abcdef',
    userId:
      'customer-uid-1',
    razorpayOrderId:
      ORDER_ID,
    amountPaise: 99998,
    currency: 'INR',
    paymentStatus:
      'Pending Payment',
  });

  assert.equal(
    Object.isFrozen(result),
    true
  );

  assert.deepEqual(fake.calls, [
    'collection:paymentSessions',
    `where:razorpayOrderId:==:${ORDER_ID}`,
    'limit:2',
    'get',
  ]);
});

test('rejects missing Razorpay order session', async () => {
  const fake =
    createFakeFirestore([]);

  await assert.rejects(
    () =>
      getPaymentSessionByRazorpayOrderId(
        ORDER_ID,
        {
          db: fake.db,
        }
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .SESSION_NOT_FOUND
  );
});

test('fails closed when multiple sessions are bound to the same Razorpay order', async () => {
  const fake =
    createFakeFirestore([
      {
        id:
          'paysess_first123456',
        data: {
          userId: 'user-1',
          razorpayOrderId:
            ORDER_ID,
          amountPaise: 99998,
          currency: 'INR',
          paymentStatus:
            'Pending Payment',
        },
      },
      {
        id:
          'paysess_second123456',
        data: {
          userId: 'user-2',
          razorpayOrderId:
            ORDER_ID,
          amountPaise: 99998,
          currency: 'INR',
          paymentStatus:
            'Pending Payment',
        },
      },
    ]);

  await assert.rejects(
    () =>
      getPaymentSessionByRazorpayOrderId(
        ORDER_ID,
        {
          db: fake.db,
        }
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .SESSION_AMBIGUOUS
  );
});

test('rejects expired or failed sessions from webhook reconciliation', async () => {
  for (
    const paymentStatus
    of ['Expired', 'Failed']
  ) {
    const fake =
      createFakeFirestore([
        {
          id:
            'paysess_0123456789abcdef',
          data: {
            userId:
              'customer-uid-1',
            razorpayOrderId:
              ORDER_ID,
            amountPaise: 99998,
            currency: 'INR',
            paymentStatus,
          },
        },
      ]);

    await assert.rejects(
      () =>
        getPaymentSessionByRazorpayOrderId(
          ORDER_ID,
          {
            db: fake.db,
          }
        ),
      (error) =>
        error?.code ===
        PAYMENT_REPOSITORY_ERROR
          .SESSION_NOT_VERIFIABLE
    );
  }
});

console.log(
  'PAYMENT_WEBHOOK_SESSION_LOOKUP_RED_TEST_SETUP=PASS'
);
