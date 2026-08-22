'use strict';

const FUTURE_HANDLOOM_OPERATIONS_STATE =
  Object.freeze({
    track:
      'government-handloom-operations',

    mode:
      'future-park',

    enabled:
      false,

    productionAuthorized:
      false,

    blazePriority:
      'P0',
  });

function createFutureParkError(
  message
) {
  const error =
    new Error(message);

  error.code =
    'FUTURE_HANDLOOM_ACTIVATION_BLOCKED';

  return error;
}

function assertFutureParkBoundary(
  candidate =
    FUTURE_HANDLOOM_OPERATIONS_STATE
) {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    Array.isArray(candidate)
  ) {
    throw createFutureParkError(
      'Future Handloom state must be an object.'
    );
  }

  if (
    candidate.mode !==
      'future-park' ||
    candidate.enabled === true ||
    candidate.productionAuthorized ===
      true ||
    candidate.blazePriority !== 'P0'
  ) {
    throw createFutureParkError(
      'Future Handloom Operations activation is not authorized.'
    );
  }

  return true;
}

function getFutureHandloomOperationsState() {
  return FUTURE_HANDLOOM_OPERATIONS_STATE;
}

module.exports = {
  FUTURE_HANDLOOM_OPERATIONS_STATE,
  assertFutureParkBoundary,
  getFutureHandloomOperationsState,
};
