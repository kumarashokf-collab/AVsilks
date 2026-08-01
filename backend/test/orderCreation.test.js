'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_CREATION_ERROR,
  buildOrderCreationPlan,
} = require('../src/services/orderCreation.service');

const {
  ORDER_ITEM_ERROR,
} = require('../src/services/orderItem.service');

const {
  createOrderIdempotencyIdentity,
} = require('../src/services/orderIdempotency.service');

function validIdentity() {
  return {
    orderId: 'ord_test_order_creation_1',
    idempotencyKeyHash: 'a'.repeat(64),
    requestFingerprint: 'b'.repeat(64),
  };
}

function createRequest(overrides = {}) {
  const base = {
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
    productRecords: [
      {
        productId: 'saree-1',
        productData: {
          name: 'AV Silk Saree',
          price: 499.5,
          stock: 5,
          sku: 'av-001',
          category: 'Silk',
          active: true,
        },
      },
    ],
    paymentMethod: 'cod',
    nowIso: '2026-07-26T08:00:00.000Z',
  };

  const request = {
    ...base,
    ...overrides,
  };

  const hasIdentityOverride =
    Object.prototype.hasOwnProperty.call(
      overrides,
      'idempotencyIdentity'
    );

  request.idempotencyIdentity =
    hasIdentityOverride
      ? overrides.idempotencyIdentity
      : createOrderIdempotencyIdentity({
          userId: request.userId,
          idempotencyKey:
            'checkout-order-test-0001',
          customer: request.customer,
          items: request.requestedItems,
          paymentMethod: request.paymentMethod,
        });

  return request;
}

test('builds an authoritative order and stock plan', () => {
  const plan = buildOrderCreationPlan(
    createRequest()
  );

  assert.equal(
    plan.orderDocument.userId,
    'customer-uid-1'
  );

  assert.equal(
    plan.orderDocument.userPhone,
    '+919876543210'
  );

  assert.equal(plan.orderDocument.subtotal, 999);
  assert.equal(
    plan.orderDocument.shippingCharge,
    0
  );
  assert.equal(plan.orderDocument.total, 999);
  assert.equal(plan.orderDocument.currency, 'INR');
  assert.equal(
    plan.orderDocument.status,
    'Processing'
  );

  assert.equal(
    plan.orderDocument.paymentStatus,
    'Pending on Delivery'
  );

  assert.deepEqual(plan.stockUpdates, [
    {
      productId: 'saree-1',
      previousStock: 5,
      nextStock: 3,
      quantityDeducted: 2,
    },
  ]);
});

test('creates immutable order snapshots', () => {
  const plan = buildOrderCreationPlan(
    createRequest()
  );

  assert.equal(Object.isFrozen(plan), true);
  assert.equal(
    Object.isFrozen(plan.orderDocument),
    true
  );
  assert.equal(
    Object.isFrozen(plan.orderDocument.items),
    true
  );
  assert.equal(
    Object.isFrozen(
      plan.orderDocument.statusHistory
    ),
    true
  );
  assert.equal(
    Object.isFrozen(plan.stockUpdates),
    true
  );
});

test('uses authoritative sale price and shipping policy', () => {
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
          name: 'Sale Saree',
          price: 1000,
          salePrice: 900,
          stock: 4,
          active: true,
        },
      },
    ],
  });

  request.idempotencyIdentity =
    createOrderIdempotencyIdentity({
      userId: request.userId,
      idempotencyKey:
        'checkout-sale-test-0001',
      customer: request.customer,
      items: request.requestedItems,
      paymentMethod: request.paymentMethod,
    });

  const plan = buildOrderCreationPlan(request);

  assert.equal(
    plan.orderDocument.items[0].price,
    900
  );
  assert.equal(plan.orderDocument.subtotal, 900);
  assert.equal(
    plan.orderDocument.shippingCharge,
    79
  );
  assert.equal(plan.orderDocument.total, 979);
});

test('rejects missing and duplicate product records', () => {
  assert.throws(
    () =>
      buildOrderCreationPlan(
        createRequest({
          productRecords: [],
        })
      ),
    (error) =>
      error.code ===
      ORDER_CREATION_ERROR.PRODUCT_RECORD_MISSING
  );

  assert.throws(
    () =>
      buildOrderCreationPlan(
        createRequest({
          productRecords: [
            {
              productId: 'saree-1',
              productData: {
                name: 'Saree',
                price: 500,
                stock: 5,
              },
            },
            {
              productId: 'saree-1',
              productData: {
                name: 'Duplicate Saree',
                price: 600,
                stock: 5,
              },
            },
          ],
        })
      ),
    (error) =>
      error.code ===
      ORDER_CREATION_ERROR
        .DUPLICATE_PRODUCT_RECORD
  );
});

test('rejects invalid user and idempotency identity', () => {
  assert.throws(
    () =>
      buildOrderCreationPlan(
        createRequest({
          userId: '',
          idempotencyIdentity:
            validIdentity(),
        })
      ),
    (error) =>
      error.code ===
      ORDER_CREATION_ERROR.INVALID_USER
  );

  assert.throws(
    () =>
      buildOrderCreationPlan(
        createRequest({
          idempotencyIdentity: {},
        })
      ),
    (error) =>
      error.code ===
      ORDER_CREATION_ERROR
        .INVALID_IDEMPOTENCY_IDENTITY
  );
});

test('rejects inactive products', () => {
  assert.throws(
    () =>
      buildOrderCreationPlan(
        createRequest({
          productRecords: [
            {
              productId: 'saree-1',
              productData: {
                name: 'Inactive Saree',
                price: 500,
                stock: 5,
                active: false,
              },
            },
          ],
        })
      ),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.PRODUCT_INACTIVE
  );
});

test('rejects insufficient live stock', () => {
  assert.throws(
    () =>
      buildOrderCreationPlan(
        createRequest({
          requestedItems: [
            {
              productId: 'saree-1',
              quantity: 3,
            },
          ],
          productRecords: [
            {
              productId: 'saree-1',
              productData: {
                name: 'Limited Saree',
                price: 500,
                stock: 2,
                active: true,
              },
            },
          ],
        })
      ),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.INSUFFICIENT_STOCK
  );
});

test('does not expose the raw idempotency key', () => {
  const rawKey =
    'checkout-secret-test-0001';

  const request = createRequest();

  request.idempotencyIdentity =
    createOrderIdempotencyIdentity({
      userId: request.userId,
      idempotencyKey: rawKey,
      customer: request.customer,
      items: request.requestedItems,
      paymentMethod: request.paymentMethod,
    });

  const plan = buildOrderCreationPlan(request);

  assert.equal(
    JSON.stringify(plan).includes(rawKey),
    false
  );
});
