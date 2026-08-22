'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const {
  FUTURE_HANDLOOM_OPERATIONS_STATE,
  assertFutureParkBoundary,
  getFutureHandloomOperationsState,
} = require(
  '../src/future/handloomOperations/futureParkGuard'
);

test(
  'future Handloom Operations remains safely parked',
  () => {
    const state =
      getFutureHandloomOperationsState();

    assert.equal(
      state,
      FUTURE_HANDLOOM_OPERATIONS_STATE
    );

    assert.equal(
      state.track,
      'government-handloom-operations'
    );

    assert.equal(
      state.mode,
      'future-park'
    );

    assert.equal(
      state.enabled,
      false
    );

    assert.equal(
      state.productionAuthorized,
      false
    );

    assert.equal(
      state.blazePriority,
      'P0'
    );

    assert.equal(
      assertFutureParkBoundary(),
      true
    );

    assert.equal(
      Object.isFrozen(state),
      true
    );
  }
);

test(
  'future Handloom Operations fails closed on activation attempt',
  () => {
    assert.throws(
      () =>
        assertFutureParkBoundary({
          ...FUTURE_HANDLOOM_OPERATIONS_STATE,
          enabled: true,
        }),
      (error) =>
        error?.code ===
        'FUTURE_HANDLOOM_ACTIVATION_BLOCKED'
    );

    assert.throws(
      () =>
        assertFutureParkBoundary({
          ...FUTURE_HANDLOOM_OPERATIONS_STATE,
          productionAuthorized: true,
        }),
      (error) =>
        error?.code ===
        'FUTURE_HANDLOOM_ACTIVATION_BLOCKED'
    );

    assert.throws(
      () =>
        assertFutureParkBoundary({
          ...FUTURE_HANDLOOM_OPERATIONS_STATE,
          blazePriority: 'P1',
        }),
      (error) =>
        error?.code ===
        'FUTURE_HANDLOOM_ACTIVATION_BLOCKED'
    );
  }
);
