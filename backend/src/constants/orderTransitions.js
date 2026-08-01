'use strict';

const {
  ORDER_STATUS,
  isValidOrderStatus,
} = require('./orderStatus');

const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PROCESSING]: Object.freeze([
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED,
  ]),

  [ORDER_STATUS.CONFIRMED]: Object.freeze([
    ORDER_STATUS.PACKED,
    ORDER_STATUS.CANCELLED,
  ]),

  [ORDER_STATUS.PACKED]: Object.freeze([
    ORDER_STATUS.SHIPPED,
  ]),

  [ORDER_STATUS.SHIPPED]: Object.freeze([
    ORDER_STATUS.DELIVERED,
  ]),

  [ORDER_STATUS.DELIVERED]: Object.freeze([
    ORDER_STATUS.RETURNED,
  ]),

  [ORDER_STATUS.CANCELLED]: Object.freeze([]),

  [ORDER_STATUS.RETURNED]: Object.freeze([]),
});

const CUSTOMER_CANCELLABLE_STATUSES = Object.freeze([
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.CONFIRMED,
]);

const ADMIN_FULFILMENT_TARGET_STATUSES =
  Object.freeze([
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
  ]);

function getAllowedOrderTransitions(currentStatus) {
  if (!isValidOrderStatus(currentStatus)) {
    return [];
  }

  return [...ORDER_TRANSITIONS[currentStatus]];
}

function canTransitionOrderStatus(
  currentStatus,
  nextStatus
) {
  if (
    !isValidOrderStatus(currentStatus) ||
    !isValidOrderStatus(nextStatus) ||
    currentStatus === nextStatus
  ) {
    return false;
  }

  return ORDER_TRANSITIONS[currentStatus].includes(
    nextStatus
  );
}

function isCustomerCancellableStatus(status) {
  return CUSTOMER_CANCELLABLE_STATUSES.includes(
    status
  );
}

function isAdminFulfilmentTargetStatus(status) {
  return ADMIN_FULFILMENT_TARGET_STATUSES.includes(
    status
  );
}

module.exports = {
  ORDER_TRANSITIONS,
  CUSTOMER_CANCELLABLE_STATUSES,
  ADMIN_FULFILMENT_TARGET_STATUSES,
  getAllowedOrderTransitions,
  canTransitionOrderStatus,
  isCustomerCancellableStatus,
  isAdminFulfilmentTargetStatus,
};
