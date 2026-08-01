'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_STATUS,
} = require('../src/constants/orderStatus');

const {
  ORDER_FULFILMENT_POLICY,
} = require('../src/constants/orderPolicy');

const {
  ADMIN_FULFILMENT_TARGET_STATUSES,
  validateAdminOrderTransitionParams,
  validateAdminOrderTransitionInput,
} = require(
  '../src/validators/orderFulfilment.validator'
);

test('accepts canonical admin fulfilment targets', () => {
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
    const result =
      validateAdminOrderTransitionInput({
        status,
        note:
          ' Order status verified by admin. ',
      });

    assert.equal(
      result.error,
      undefined
    );

    assert.equal(
      result.value.status,
      status
    );

    assert.equal(
      result.value.note,
      'Order status verified by admin.'
    );
  }
});

test('accepts and trims a valid order ID', () => {
  const result =
    validateAdminOrderTransitionParams({
      id: ' order-fulfilment-1 ',
    });

  assert.equal(
    result.error,
    undefined
  );

  assert.equal(
    result.value.id,
    'order-fulfilment-1'
  );
});

test('defaults an omitted note to an empty string', () => {
  const result =
    validateAdminOrderTransitionInput({
      status:
        ORDER_STATUS.CONFIRMED,
    });

  assert.equal(
    result.error,
    undefined
  );

  assert.equal(
    result.value.note,
    ''
  );
});

test('rejects invalid order IDs', () => {
  for (const id of [
    undefined,
    '',
    'orders/order-1',
    '/order-1',
    'a'.repeat(
      ORDER_FULFILMENT_POLICY
        .MAX_ORDER_ID_LENGTH + 1
    ),
  ]) {
    const result =
      validateAdminOrderTransitionParams({
        id,
      });

    assert.ok(
      result.error,
      `${String(id)} must be rejected`
    );
  }
});

test('rejects non-fulfilment and noncanonical statuses', () => {
  for (const status of [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
    'shipped',
    'Unknown',
    '',
    undefined,
  ]) {
    const result =
      validateAdminOrderTransitionInput({
        status,
      });

    assert.ok(
      result.error,
      `${String(status)} must be rejected`
    );
  }
});

test('rejects oversized notes and client-controlled fields', () => {
  const oversizedNote =
    validateAdminOrderTransitionInput({
      status:
        ORDER_STATUS.CONFIRMED,
      note: 'a'.repeat(
        ORDER_FULFILMENT_POLICY
          .MAX_NOTE_LENGTH + 1
      ),
    });

  assert.ok(oversizedNote.error);

  for (const field of [
    'userId',
    'items',
    'stock',
    'total',
    'statusHistory',
    'cancelReason',
  ]) {
    const result =
      validateAdminOrderTransitionInput({
        status:
          ORDER_STATUS.CONFIRMED,
        [field]: 'client-controlled',
      });

    assert.ok(
      result.error,
      `${field} must be rejected`
    );
  }
});
