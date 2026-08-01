'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  INITIAL_ORDER_STATUS,
  isValidOrderStatus,
  isTerminalOrderStatus,
} = require('../src/constants/orderStatus');

const {
  ADMIN_FULFILMENT_TARGET_STATUSES,
  getAllowedOrderTransitions,
  canTransitionOrderStatus,
  isCustomerCancellableStatus,
  isAdminFulfilmentTargetStatus,
} = require('../src/constants/orderTransitions');

test('defines the frontend-compatible initial status', () => {
  assert.equal(INITIAL_ORDER_STATUS, 'Processing');
  assert.equal(ORDER_STATUS_VALUES.length, 7);
});

test('accepts only canonical order statuses', () => {
  for (const status of ORDER_STATUS_VALUES) {
    assert.equal(isValidOrderStatus(status), true);
  }

  assert.equal(isValidOrderStatus('Paid'), false);
  assert.equal(isValidOrderStatus('processing'), false);
  assert.equal(isValidOrderStatus(''), false);
});

test('allows the canonical fulfilment flow', () => {
  const allowedTransitions = [
    [ORDER_STATUS.PROCESSING, ORDER_STATUS.CONFIRMED],
    [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED],
    [ORDER_STATUS.PACKED, ORDER_STATUS.SHIPPED],
    [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED],
  ];

  for (const [currentStatus, nextStatus] of allowedTransitions) {
    assert.equal(
      canTransitionOrderStatus(currentStatus, nextStatus),
      true
    );
  }
});

test('rejects skipped, reversed and unchanged transitions', () => {
  const rejectedTransitions = [
    [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED],
    [ORDER_STATUS.PACKED, ORDER_STATUS.CONFIRMED],
    [ORDER_STATUS.SHIPPED, ORDER_STATUS.PROCESSING],
    [ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED],
  ];

  for (const [currentStatus, nextStatus] of rejectedTransitions) {
    assert.equal(
      canTransitionOrderStatus(currentStatus, nextStatus),
      false
    );
  }
});

test('allows cancellation only from early order states', () => {
  assert.equal(
    canTransitionOrderStatus(
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.CANCELLED
    ),
    true
  );

  assert.equal(
    canTransitionOrderStatus(
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.CANCELLED
    ),
    true
  );

  assert.equal(
    canTransitionOrderStatus(
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.CANCELLED
    ),
    false
  );

  assert.equal(
    isCustomerCancellableStatus(ORDER_STATUS.PROCESSING),
    true
  );

  assert.equal(
    isCustomerCancellableStatus(ORDER_STATUS.SHIPPED),
    false
  );
});

test('terminal states cannot transition further', () => {
  for (const terminalStatus of [
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
  ]) {
    assert.equal(isTerminalOrderStatus(terminalStatus), true);
    assert.deepEqual(
      getAllowedOrderTransitions(terminalStatus),
      []
    );

    for (const nextStatus of ORDER_STATUS_VALUES) {
      assert.equal(
        canTransitionOrderStatus(
          terminalStatus,
          nextStatus
        ),
        false
      );
    }
  }
});

test('unknown current status has no transitions', () => {
  assert.deepEqual(
    getAllowedOrderTransitions('Unknown'),
    []
  );

  assert.equal(
    canTransitionOrderStatus(
      'Unknown',
      ORDER_STATUS.CONFIRMED
    ),
    false
  );
});

test('centralizes admin fulfilment target statuses', () => {
  assert.deepEqual(
    ADMIN_FULFILMENT_TARGET_STATUSES,
    [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.DELIVERED,
    ]
  );

  for (
    const status
    of ADMIN_FULFILMENT_TARGET_STATUSES
  ) {
    assert.equal(
      isAdminFulfilmentTargetStatus(status),
      true
    );
  }

  for (const status of [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
    'Unknown',
  ]) {
    assert.equal(
      isAdminFulfilmentTargetStatus(status),
      false
    );
  }
});
