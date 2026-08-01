'use strict';

const ORDER_STATUS = Object.freeze({
  PROCESSING: 'Processing',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
});

const ORDER_STATUS_VALUES = Object.freeze(
  Object.values(ORDER_STATUS)
);

const INITIAL_ORDER_STATUS =
  ORDER_STATUS.PROCESSING;

const TERMINAL_ORDER_STATUSES = Object.freeze([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURNED,
]);

function isValidOrderStatus(value) {
  return (
    typeof value === 'string' &&
    ORDER_STATUS_VALUES.includes(value)
  );
}

function isTerminalOrderStatus(value) {
  return TERMINAL_ORDER_STATUSES.includes(value);
}

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  INITIAL_ORDER_STATUS,
  TERMINAL_ORDER_STATUSES,
  isValidOrderStatus,
  isTerminalOrderStatus,
};
