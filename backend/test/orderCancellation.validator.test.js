'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_CANCELLATION_POLICY,
} = require(
  '../src/constants/orderPolicy'
);

const {
  validateCancelOrderParams,
  validateCancelOrderInput,
} = require(
  '../src/validators/orderCancellation.validator'
);

test('accepts and trims a valid cancellation request', () => {
  const params =
    validateCancelOrderParams({
      id: ' ord-cancel-test-1 ',
    });

  const payload =
    validateCancelOrderInput({
      reason:
        ' Customer changed the order choice. ',
    });

  assert.equal(params.error, undefined);
  assert.equal(
    params.value.id,
    'ord-cancel-test-1'
  );

  assert.equal(payload.error, undefined);
  assert.equal(
    payload.value.reason,
    'Customer changed the order choice.'
  );
});

test('rejects missing and invalid order IDs', () => {
  for (const id of [
    undefined,
    '',
    'orders/order-test-1',
    '/order-test-1',
  ]) {
    const result =
      validateCancelOrderParams({ id });

    assert.ok(
      result.error,
      `${String(id)} must be rejected`
    );
  }
});

test('enforces the maximum order ID length', () => {
  const result =
    validateCancelOrderParams({
      id: 'a'.repeat(
        ORDER_CANCELLATION_POLICY
          .MAX_ORDER_ID_LENGTH + 1
      ),
    });

  assert.ok(result.error);
});

test('requires a meaningful cancellation reason', () => {
  for (const reason of [
    undefined,
    '',
    '  ',
    'no',
  ]) {
    const result =
      validateCancelOrderInput({ reason });

    assert.ok(
      result.error,
      `${String(reason)} must be rejected`
    );
  }
});

test('enforces cancellation reason length limit', () => {
  const result =
    validateCancelOrderInput({
      reason: 'a'.repeat(
        ORDER_CANCELLATION_POLICY
          .MAX_REASON_LENGTH + 1
      ),
    });

  assert.ok(result.error);
});

test('rejects client-controlled cancellation fields', () => {
  for (const field of [
    'status',
    'userId',
    'items',
    'total',
    'stock',
  ]) {
    const result =
      validateCancelOrderInput({
        reason: 'Customer requested cancellation.',
        [field]:
          field === 'status'
            ? 'Cancelled'
            : 1,
      });

    assert.ok(
      result.error,
      `${field} must be rejected`
    );
  }
});
