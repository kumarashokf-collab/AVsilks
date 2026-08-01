'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_STATUS,
} = require('../src/constants/orderStatus');

const {
  ORDER_FULFILMENT_ERROR,
  buildAdminFulfilmentPlan,
} = require(
  '../src/services/orderFulfilment.service'
);

function createInput(overrides = {}) {
  return {
    adminUserId: ' admin-uid-1 ',
    orderId: ' order-fulfilment-1 ',
    nextStatus:
      ORDER_STATUS.CONFIRMED,
    note:
      ' Order verified by admin. ',
    orderData: {
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
    },
    nowIso:
      '2026-07-27T12:30:00.000Z',
    ...overrides,
  };
}

test('builds an authoritative admin fulfilment plan', () => {
  const plan =
    buildAdminFulfilmentPlan(
      createInput()
    );

  assert.equal(
    plan.orderId,
    'order-fulfilment-1'
  );

  assert.equal(
    plan.adminUserId,
    'admin-uid-1'
  );

  assert.equal(
    plan.previousStatus,
    ORDER_STATUS.PROCESSING
  );

  assert.equal(
    plan.nextStatus,
    ORDER_STATUS.CONFIRMED
  );

  assert.equal(
    plan.note,
    'Order verified by admin.'
  );

  assert.equal(
    plan.orderUpdate.status,
    ORDER_STATUS.CONFIRMED
  );

  assert.equal(
    plan.orderUpdate
      .lastStatusUpdatedByUserId,
    'admin-uid-1'
  );

  assert.equal(
    plan.orderUpdate
      .statusHistory.length,
    2
  );

  assert.deepEqual(
    plan.orderUpdate
      .statusHistory[1],
    {
      status:
        ORDER_STATUS.CONFIRMED,
      date:
        '2026-07-27T12:30:00.000Z',
      note:
        'Order verified by admin.',
      updatedByUserId:
        'admin-uid-1',
    }
  );
});

test('allows every sequential fulfilment transition', () => {
  const transitions = [
    [
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.CONFIRMED,
    ],
    [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKED,
    ],
    [
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
    ],
    [
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.DELIVERED,
    ],
  ];

  for (
    const [
      currentStatus,
      nextStatus,
    ]
    of transitions
  ) {
    const plan =
      buildAdminFulfilmentPlan(
        createInput({
          nextStatus,
          orderData: {
            status: currentStatus,
          },
        })
      );

    assert.equal(
      plan.previousStatus,
      currentStatus
    );

    assert.equal(
      plan.nextStatus,
      nextStatus
    );
  }
});

test('rejects skipped reversed and unchanged transitions', () => {
  const invalidTransitions = [
    [
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
    ],
    [
      ORDER_STATUS.PACKED,
      ORDER_STATUS.CONFIRMED,
    ],
    [
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.SHIPPED,
    ],
    [
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CONFIRMED,
    ],
  ];

  for (
    const [
      currentStatus,
      nextStatus,
    ]
    of invalidTransitions
  ) {
    assert.throws(
      () =>
        buildAdminFulfilmentPlan(
          createInput({
            nextStatus,
            orderData: {
              status: currentStatus,
            },
          })
        ),
      (error) =>
        error.code ===
        ORDER_FULFILMENT_ERROR
          .TRANSITION_NOT_ALLOWED
    );
  }
});

test('rejects cancellation return and processing targets', () => {
  for (const nextStatus of [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
  ]) {
    assert.throws(
      () =>
        buildAdminFulfilmentPlan(
          createInput({
            nextStatus,
          })
        ),
      (error) =>
        error.code ===
        ORDER_FULFILMENT_ERROR
          .TARGET_STATUS_NOT_ALLOWED
    );
  }
});

test('rejects missing orders and invalid stored status', () => {
  assert.throws(
    () =>
      buildAdminFulfilmentPlan(
        createInput({
          orderData: null,
        })
      ),
    (error) =>
      error.code ===
      ORDER_FULFILMENT_ERROR
        .ORDER_NOT_FOUND
  );

  assert.throws(
    () =>
      buildAdminFulfilmentPlan(
        createInput({
          orderData: {
            status: 'Unknown',
          },
        })
      ),
    (error) =>
      error.code ===
      ORDER_FULFILMENT_ERROR
        .INVALID_STORED_STATUS
  );
});

test('rejects invalid fulfilment input', () => {
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
    {
      nowIso: '',
    },
  ]) {
    assert.throws(
      () =>
        buildAdminFulfilmentPlan(
          createInput(overrides)
        ),
      (error) =>
        error.code ===
        ORDER_FULFILMENT_ERROR
          .INVALID_INPUT
    );
  }
});

test('normalizes history and returns immutable data', () => {
  const plan =
    buildAdminFulfilmentPlan(
      createInput({
        note: '',
        orderData: {
          status:
            ORDER_STATUS.PROCESSING,
          statusHistory: [
            null,
            'invalid',
            {
              status:
                ORDER_STATUS.PROCESSING,
              note: 'Created',
            },
          ],
        },
      })
    );

  assert.equal(
    plan.orderUpdate
      .statusHistory.length,
    2
  );

  assert.equal(
    Object.isFrozen(plan),
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
      plan.orderUpdate
        .statusHistory
    ),
    true
  );

  for (
    const entry
    of plan.orderUpdate.statusHistory
  ) {
    assert.equal(
      Object.isFrozen(entry),
      true
    );
  }
});
