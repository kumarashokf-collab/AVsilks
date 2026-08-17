'use strict';

const ORDER_LIMITS = Object.freeze({
  MAX_ORDER_LINES: 20,
  MAX_ITEM_QUANTITY: 10,
});

const SHIPPING_POLICY = Object.freeze({
  FREE_SHIPPING_THRESHOLD: 999,
  STANDARD_SHIPPING_CHARGE: 79,
});

const PAYMENT_METHOD = Object.freeze({
  COD: 'cod',
  RAZORPAY: 'razorpay',
});

const PAYMENT_LABEL = Object.freeze({
  COD: 'Cash on Delivery',
  RAZORPAY: 'Razorpay',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING_ON_DELIVERY: 'Pending on Delivery',
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
});

const ORDER_CURRENCY = 'INR';

const IDEMPOTENCY_POLICY = Object.freeze({
  MIN_KEY_LENGTH: 16,
  MAX_KEY_LENGTH: 128,
});

const ORDER_CANCELLATION_POLICY = Object.freeze({
  MIN_REASON_LENGTH: 3,
  MAX_REASON_LENGTH: 300,
  MAX_ORDER_ID_LENGTH: 128,
});

const ORDER_FULFILMENT_POLICY = Object.freeze({
  MAX_ORDER_ID_LENGTH: 128,
  MAX_NOTE_LENGTH: 300,
});

module.exports = {
  ORDER_LIMITS,
  SHIPPING_POLICY,
  PAYMENT_METHOD,
  PAYMENT_LABEL,
  PAYMENT_STATUS,
  ORDER_CURRENCY,
  IDEMPOTENCY_POLICY,
  ORDER_CANCELLATION_POLICY,
  ORDER_FULFILMENT_POLICY,
};
