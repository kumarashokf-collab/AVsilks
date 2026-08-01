'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_CANCELLATION_ERROR,
  resolveStoredProductId,
  buildCustomerCancellationPlan,
} = require(
  '../src/services/orderCancellation.service'
);

function createOrder(overrides = {}) {
  return {
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
        date:
          '2026-07-26T08:00:00.000Z',
        note:
          'Order placed successfully',
      },
    ],
    ...overrides,
  };
}

function createInput(overrides = {}) {
  return {
    userId: 'customer-uid-1',
    orderId: 'ord-cancel-test-1',
    reason:
      'Customer changed the order choice.',
    orderData: createOrder(),
    nowIso:
      '2026-07-26T16:30:00.000Z',
    ...overrides,
  };
}

test('builds an authoritative customer cancellation plan', () => {
  const plan =
    buildCustomerCancellationPlan(
      createInput()
    );

  assert.equal(
    plan.previousStatus,
    'Processing'
  );

  assert.equal(
    plan.nextStatus,
    'Cancelled'
  );

  assert.deepEqual(
    plan.stockRestorations,
    [
      {
        productId: 'saree-1',
        quantityToRestore: 2,
      },
      {
        productId:
          'legacy-saree-2',
        quantityToRestore: 1,
      },
    ]
  );

  assert.equal(
    plan.orderUpdate.status,
    'Cancelled'
  );

  assert.equal(
    plan.orderUpdate.cancelReason,
    'Customer changed the order choice.'
  );

  assert.equal(
    plan.orderUpdate.statusHistory.length,
    2
  );

  assert.deepEqual(
    plan.orderUpdate.statusHistory[1],
    {
      status: 'Cancelled',
      date:
        '2026-07-26T16:30:00.000Z',
      note:
        'Customer changed the order choice.',
    }
  );
});

test('allows cancellation from Confirmed status', () => {
  const plan =
    buildCustomerCancellationPlan(
      createInput({
        orderData: createOrder({
          status: 'Confirmed',
        }),
      })
    );

  assert.equal(
    plan.previousStatus,
    'Confirmed'
  );

  assert.equal(
    plan.nextStatus,
    'Cancelled'
  );
});

test('rejects cancellation by a different customer', () => {
  assert.throws(
    () =>
      buildCustomerCancellationPlan(
        createInput({
          userId: 'another-customer',
        })
      ),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .ORDER_OWNERSHIP_MISMATCH
  );
});

test('rejects non-cancellable order statuses', () => {
  for (const status of [
    'Packed',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Returned',
  ]) {
    assert.throws(
      () =>
        buildCustomerCancellationPlan(
          createInput({
            orderData: createOrder({
              status,
            }),
          })
        ),
      (error) =>
        error.code ===
        ORDER_CANCELLATION_ERROR
          .STATUS_NOT_CANCELLABLE,
      `${status} must be rejected`
    );
  }
});

test('rejects invalid stored order items', () => {
  for (const items of [
    [],
    null,
    [
      {
        productId: '',
        quantity: 1,
      },
    ],
    [
      {
        productId: 'saree-1',
        quantity: 0,
      },
    ],
    [
      {
        productId: 'products/saree-1',
        quantity: 1,
      },
    ],
  ]) {
    assert.throws(
      () =>
        buildCustomerCancellationPlan(
          createInput({
            orderData: createOrder({
              items,
            }),
          })
        ),
      (error) =>
        error.code ===
        ORDER_CANCELLATION_ERROR
          .INVALID_ORDER_ITEMS
    );
  }
});

test('rejects conflicting and duplicate product identities', () => {
  assert.throws(
    () =>
      resolveStoredProductId({
        id: 'legacy-id',
        productId: 'new-id',
      }),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .INVALID_ORDER_ITEMS
  );

  assert.throws(
    () =>
      buildCustomerCancellationPlan(
        createInput({
          orderData: createOrder({
            items: [
              {
                productId: 'saree-1',
                quantity: 1,
              },
              {
                id: 'saree-1',
                quantity: 1,
              },
            ],
          }),
        })
      ),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .DUPLICATE_PRODUCT
  );
});

test('rejects missing order data and invalid input', () => {
  assert.throws(
    () =>
      buildCustomerCancellationPlan(
        createInput({
          orderData: null,
        })
      ),
    (error) =>
      error.code ===
      ORDER_CANCELLATION_ERROR
        .ORDER_NOT_FOUND
  );

  for (const override of [
    { userId: '' },
    { orderId: '' },
    { reason: '' },
    { nowIso: '' },
  ]) {
    assert.throws(
      () =>
        buildCustomerCancellationPlan(
          createInput(override)
        ),
      (error) =>
        error.code ===
        ORDER_CANCELLATION_ERROR
          .INVALID_INPUT
    );
  }
});

test('returns immutable cancellation data', () => {
  const plan =
    buildCustomerCancellationPlan(
      createInput()
    );

  assert.equal(
    Object.isFrozen(plan),
    true
  );

  assert.equal(
    Object.isFrozen(
      plan.stockRestorations
    ),
    true
  );

  assert.equal(
    Object.isFrozen(
      plan.orderUpdate
    ),
    true
  );

  assert.equal(
    Object.isFrozen(
      plan.orderUpdate.statusHistory
    ),
    true
  );
});
