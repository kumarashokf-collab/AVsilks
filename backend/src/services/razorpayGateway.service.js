'use strict';

const {
  ORDER_CURRENCY,
} = require('../constants/orderPolicy');

const {
  sha256,
} = require('./orderIdempotency.service');

const RAZORPAY_GATEWAY_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_RAZORPAY_ORDER_INPUT',
  INVALID_DEPENDENCIES:
    'INVALID_RAZORPAY_DEPENDENCIES',
  ORDER_MISMATCH: 'RAZORPAY_ORDER_MISMATCH',
  ORDER_AMBIGUOUS: 'RAZORPAY_ORDER_AMBIGUOUS',
});

function createGatewayError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function buildRazorpayReceipt(paymentSessionId) {
  const normalizedSessionId =
    normalizeText(paymentSessionId);

  if (
    !/^paysess_[A-Za-z0-9_-]+$/.test(
      normalizedSessionId
    )
  ) {
    throw createGatewayError(
      RAZORPAY_GATEWAY_ERROR.INVALID_INPUT,
      'Payment session ID is invalid.'
    );
  }

  return `avp_${sha256(
    `razorpay-receipt\n${normalizedSessionId}`
  ).slice(0, 32)}`;
}

function normalizeOrderList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
}

function validateTrustedOrder(
  order,
  {
    amountPaise,
    currency,
    receipt,
  }
) {
  const orderId = normalizeText(order?.id);

  if (
    !/^order_[A-Za-z0-9_-]+$/.test(orderId) ||
    order?.amount !== amountPaise ||
    normalizeText(order?.currency) !==
      currency ||
    normalizeText(order?.receipt) !==
      receipt
  ) {
    throw createGatewayError(
      RAZORPAY_GATEWAY_ERROR.ORDER_MISMATCH,
      'Razorpay order does not match the trusted payment session.'
    );
  }

  return orderId;
}

async function ensureRazorpayOrder(
  {
    paymentSessionId,
    amountPaise,
    currency,
  },
  dependencies = {}
) {
  const normalizedCurrency =
    normalizeText(currency);

  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    normalizedCurrency !== ORDER_CURRENCY
  ) {
    throw createGatewayError(
      RAZORPAY_GATEWAY_ERROR.INVALID_INPUT,
      'Trusted Razorpay amount or currency is invalid.'
    );
  }

  const findOrdersByReceipt =
    dependencies.findOrdersByReceipt;

  const createOrder =
    dependencies.createOrder;

  if (
    typeof findOrdersByReceipt !== 'function' ||
    typeof createOrder !== 'function'
  ) {
    throw createGatewayError(
      RAZORPAY_GATEWAY_ERROR
        .INVALID_DEPENDENCIES,
      'Razorpay gateway dependencies are invalid.'
    );
  }

  const receipt =
    buildRazorpayReceipt(paymentSessionId);

  async function recoverExisting() {
    const found =
      normalizeOrderList(
        await findOrdersByReceipt(receipt)
      ).filter(
        (order) =>
          normalizeText(order?.receipt) ===
          receipt
      );

    if (found.length > 1) {
      throw createGatewayError(
        RAZORPAY_GATEWAY_ERROR.ORDER_AMBIGUOUS,
        'Multiple Razorpay orders matched the receipt.'
      );
    }

    if (found.length === 0) {
      return null;
    }

    const order = found[0];

    const razorpayOrderId =
      validateTrustedOrder(order, {
        amountPaise,
        currency: normalizedCurrency,
        receipt,
      });

    return Object.freeze({
      recovered: true,
      razorpayOrderId,
      amountPaise,
      currency: normalizedCurrency,
      receipt,
      status: normalizeText(order.status),
    });
  }

  const existing = await recoverExisting();

  if (existing) {
    return existing;
  }

  let createdOrder;

  try {
    createdOrder = await createOrder({
      amount: amountPaise,
      currency: normalizedCurrency,
      receipt,
      partial_payment: false,
    });
  } catch (error) {
    const recovered = await recoverExisting();

    if (recovered) {
      return recovered;
    }

    throw error;
  }

  const razorpayOrderId =
    validateTrustedOrder(createdOrder, {
      amountPaise,
      currency: normalizedCurrency,
      receipt,
    });

  return Object.freeze({
    recovered: false,
    razorpayOrderId,
    amountPaise,
    currency: normalizedCurrency,
    receipt,
    status: normalizeText(
      createdOrder.status
    ),
  });
}

module.exports = {
  RAZORPAY_GATEWAY_ERROR,
  buildRazorpayReceipt,
  ensureRazorpayOrder,
};
