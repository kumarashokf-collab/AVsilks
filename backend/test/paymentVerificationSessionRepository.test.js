'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getPaymentSessionForVerification,
  PAYMENT_REPOSITORY_ERROR,
} = require('../src/repositories/payment.repository');

const SESSION_ID =
  'paysess_0123456789abcdef';

function createFakeFirestore(session) {
  let reads = 0;

  const db = {
    collection(name) {
      assert.equal(name, 'paymentSessions');

      return {
        doc(id) {
          assert.equal(id, SESSION_ID);

          return {
            id,
            async get() {
              reads += 1;

              return {
                exists: session !== null,
                data: () => session,
              };
            },
          };
        },
      };
    },
  };

  return {
    db,
    get reads() {
      return reads;
    },
  };
}

function pendingSession(overrides = {}) {
  return {
    userId: 'customer-uid-1',
    paymentStatus: 'Pending Payment',
    razorpayOrderId:
      'order_test1234567890',
    amountPaise: 99998,
    currency: 'INR',
    ...overrides,
  };
}

test('loads only trusted verification data for the owning user', async () => {
  const fake =
    createFakeFirestore(
      pendingSession()
    );

  const result =
    await getPaymentSessionForVerification(
      {
        paymentSessionId: SESSION_ID,
        userId: 'customer-uid-1',
      },
      {
        db: fake.db,
      }
    );

  assert.deepEqual(result, {
    paymentSessionId: SESSION_ID,
    userId: 'customer-uid-1',
    razorpayOrderId:
      'order_test1234567890',
    amountPaise: 99998,
    currency: 'INR',
    paymentStatus: 'Pending Payment',
  });

  assert.equal(
    Object.isFrozen(result),
    true
  );

  assert.equal(fake.reads, 1);
});

test('allows Paid session reads for idempotent successful callback retry', async () => {
  const fake =
    createFakeFirestore(
      pendingSession({
        paymentStatus: 'Paid',
      })
    );

  const result =
    await getPaymentSessionForVerification(
      {
        paymentSessionId: SESSION_ID,
        userId: 'customer-uid-1',
      },
      {
        db: fake.db,
      }
    );

  assert.equal(
    result.paymentStatus,
    'Paid'
  );
});

test('rejects another user reading the payment session', async () => {
  const fake =
    createFakeFirestore(
      pendingSession()
    );

  await assert.rejects(
    () =>
      getPaymentSessionForVerification(
        {
          paymentSessionId: SESSION_ID,
          userId: 'another-user',
        },
        {
          db: fake.db,
        }
      ),
    (error) =>
      error?.code ===
      PAYMENT_REPOSITORY_ERROR
        .SESSION_MISMATCH
  );
});

test('rejects expired or failed payment sessions', async () => {
  for (
    const paymentStatus
    of ['Expired', 'Failed']
  ) {
    const fake =
      createFakeFirestore(
        pendingSession({
          paymentStatus,
        })
      );

    await assert.rejects(
      () =>
        getPaymentSessionForVerification(
          {
            paymentSessionId:
              SESSION_ID,
            userId:
              'customer-uid-1',
          },
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
  'PAYMENT_VERIFICATION_SESSION_RED_TEST_SETUP=PASS'
);
