'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPaymentReservationPlan,
} = require('../src/services/paymentReservation.service');

function createRequest(overrides = {}) {
  return {
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
    requestedItems: [
      {
        productId: 'saree-1',
        quantity: 2,
      },
    ],
    productRecords: [
      {
        productId: 'saree-1',
        productData: {
          name: 'Handloom Silk Saree',
          sku: 'SILK-001',
          category: 'Silk',
          salePrice: 499.99,
          price: 599,
          stock: 5,
          active: true,
        },
      },
    ],
    paymentSessionId:
      'paysess_0123456789abcdef',
    idempotencyIdentity: {
      idempotencyKeyHash: 'b'.repeat(64),
      requestFingerprint: 'c'.repeat(64),
    },
    nowIso: '2026-08-17T10:00:00.000Z',
    expiresAtIso:
      '2026-08-17T10:15:00.000Z',
    ...overrides,
  };
}

test('builds authoritative Razorpay reservation totals from live catalogue data', () => {
  const plan = buildPaymentReservationPlan(
    createRequest()
  );

  assert.equal(plan.subtotal, 999.98);
  assert.equal(plan.shippingCharge, 0);
  assert.equal(plan.total, 999.98);
  assert.equal(plan.amountPaise, 99998);
  assert.equal(plan.currency, 'INR');

  assert.deepEqual(plan.stockUpdates, [
    {
      productId: 'saree-1',
      previousStock: 5,
      nextStock: 3,
      quantityReserved: 2,
    },
  ]);
});

test('creates a pending server-controlled Razorpay payment session without raw checkout key', () => {
  const plan = buildPaymentReservationPlan(
    createRequest()
  );

  assert.equal(
    plan.sessionDocument.paymentSessionId,
    'paysess_0123456789abcdef'
  );
  assert.equal(
    plan.sessionDocument.userId,
    'customer-uid-1'
  );
  assert.equal(
    plan.sessionDocument.paymentMethod,
    'razorpay'
  );
  assert.equal(
    plan.sessionDocument.paymentStatus,
    'Pending Payment'
  );
  assert.equal(
    plan.sessionDocument.payment,
    'Razorpay'
  );
  assert.equal(
    plan.sessionDocument.amountPaise,
    99998
  );
  assert.equal(
    plan.sessionDocument.expiresAtIso,
    '2026-08-17T10:15:00.000Z'
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      plan.sessionDocument,
      'idempotencyKey'
    ),
    false
  );

  assert.equal(
    plan.sessionDocument.idempotencyKeyHash,
    'b'.repeat(64)
  );
});

test('includes authoritative shipping in the Razorpay paise amount', () => {
  const request = createRequest({
    requestedItems: [
      {
        productId: 'saree-1',
        quantity: 1,
      },
    ],
    productRecords: [
      {
        productId: 'saree-1',
        productData: {
          name: 'Handloom Silk Saree',
          price: 450,
          stock: 5,
          active: true,
        },
      },
    ],
  });

  const plan =
    buildPaymentReservationPlan(request);

  assert.equal(plan.subtotal, 450);
  assert.equal(plan.shippingCharge, 79);
  assert.equal(plan.total, 529);
  assert.equal(plan.amountPaise, 52900);
});

test('rejects inactive or insufficient-stock products before creating a reservation plan', () => {
  const inactive = createRequest();

  inactive.productRecords[0].productData.active =
    false;

  assert.throws(
    () => buildPaymentReservationPlan(inactive),
    (error) =>
      error?.code === 'PRODUCT_INACTIVE'
  );

  const insufficient = createRequest();

  insufficient.productRecords[0].productData.stock =
    1;

  assert.throws(
    () => buildPaymentReservationPlan(insufficient),
    (error) =>
      error?.code === 'INSUFFICIENT_STOCK'
  );
});

test('returns immutable reservation data', () => {
  const plan = buildPaymentReservationPlan(
    createRequest()
  );

  assert.equal(Object.isFrozen(plan), true);
  assert.equal(
    Object.isFrozen(plan.sessionDocument),
    true
  );
  assert.equal(
    Object.isFrozen(plan.stockUpdates),
    true
  );
  assert.equal(
    Object.isFrozen(plan.items),
    true
  );
});

console.log(
  'PAYMENT_RESERVATION_PLAN_RED_TEST_SETUP=PASS'
);
