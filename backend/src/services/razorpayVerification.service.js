'use strict';

const crypto = require('node:crypto');

const RAZORPAY_VERIFICATION_ERROR =
  Object.freeze({
    INVALID_INPUT:
      'INVALID_RAZORPAY_VERIFICATION_INPUT',
    INVALID_DEPENDENCIES:
      'INVALID_RAZORPAY_VERIFICATION_DEPENDENCIES',
    SIGNATURE_INVALID:
      'RAZORPAY_SIGNATURE_INVALID',
    ORDER_MISMATCH:
      'RAZORPAY_ORDER_MISMATCH',
    PAYMENT_MISMATCH:
      'RAZORPAY_PAYMENT_MISMATCH',
    PAYMENT_NOT_CAPTURED:
      'RAZORPAY_PAYMENT_NOT_CAPTURED',
  });

function createVerificationError(
  code,
  message
) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isRazorpayOrderId(value) {
  return /^order_[A-Za-z0-9_-]+$/.test(
    value
  );
}

function isRazorpayPaymentId(value) {
  return /^pay_[A-Za-z0-9_-]+$/.test(
    value
  );
}

function isSignature(value) {
  return /^[a-fA-F0-9]{64}$/.test(
    value
  );
}

function verifySignature({
  storedRazorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  keySecret,
}) {
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(
      `${storedRazorpayOrderId}|${razorpayPaymentId}`,
      'utf8'
    )
    .digest();

  const receivedSignature =
    Buffer.from(
      razorpaySignature,
      'hex'
    );

  if (
    receivedSignature.length !==
      expectedSignature.length ||
    !crypto.timingSafeEqual(
      receivedSignature,
      expectedSignature
    )
  ) {
    throw createVerificationError(
      RAZORPAY_VERIFICATION_ERROR
        .SIGNATURE_INVALID,
      'Razorpay payment signature is invalid.'
    );
  }
}

async function verifyRazorpayPaymentAuthenticity(
  {
    storedRazorpayOrderId,
    clientRazorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    amountPaise,
    currency,
    keySecret,
  },
  dependencies = {}
) {
  const storedOrderId =
    normalizeText(
      storedRazorpayOrderId
    );

  const clientOrderId =
    normalizeText(
      clientRazorpayOrderId
    );

  const paymentId =
    normalizeText(
      razorpayPaymentId
    );

  const signature =
    normalizeText(
      razorpaySignature
    );

  const normalizedCurrency =
    normalizeText(currency);

  const normalizedSecret =
    normalizeText(keySecret);

  if (
    !isRazorpayOrderId(
      storedOrderId
    ) ||
    !isRazorpayOrderId(
      clientOrderId
    ) ||
    !isRazorpayPaymentId(
      paymentId
    ) ||
    !isSignature(signature) ||
    !Number.isSafeInteger(
      amountPaise
    ) ||
    amountPaise <= 0 ||
    !normalizedCurrency ||
    !normalizedSecret
  ) {
    throw createVerificationError(
      RAZORPAY_VERIFICATION_ERROR
        .INVALID_INPUT,
      'Trusted Razorpay verification input is invalid.'
    );
  }

  if (
    clientOrderId !==
    storedOrderId
  ) {
    throw createVerificationError(
      RAZORPAY_VERIFICATION_ERROR
        .ORDER_MISMATCH,
      'Checkout Razorpay order does not match the trusted stored order.'
    );
  }

  verifySignature({
    storedRazorpayOrderId:
      storedOrderId,
    razorpayPaymentId:
      paymentId,
    razorpaySignature:
      signature,
    keySecret:
      normalizedSecret,
  });

  const fetchPayment =
    dependencies.fetchPayment;

  if (
    typeof fetchPayment !==
    'function'
  ) {
    throw createVerificationError(
      RAZORPAY_VERIFICATION_ERROR
        .INVALID_DEPENDENCIES,
      'Razorpay payment fetch dependency is unavailable.'
    );
  }

  const payment =
    await fetchPayment(paymentId);

  const fetchedPaymentId =
    normalizeText(payment?.id);

  const fetchedOrderId =
    normalizeText(payment?.order_id);

  const fetchedCurrency =
    normalizeText(payment?.currency);

  if (
    fetchedPaymentId !== paymentId ||
    fetchedOrderId !==
      storedOrderId ||
    payment?.amount !==
      amountPaise ||
    fetchedCurrency !==
      normalizedCurrency
  ) {
    throw createVerificationError(
      RAZORPAY_VERIFICATION_ERROR
        .PAYMENT_MISMATCH,
      'Razorpay payment does not match the trusted payment session.'
    );
  }

  if (
    payment?.captured !== true ||
    normalizeText(
      payment?.status
    ) !== 'captured'
  ) {
    throw createVerificationError(
      RAZORPAY_VERIFICATION_ERROR
        .PAYMENT_NOT_CAPTURED,
      'Razorpay payment is not captured.'
    );
  }

  return Object.freeze({
    verified: true,
    razorpayPaymentId:
      paymentId,
    razorpayOrderId:
      storedOrderId,
    amountPaise,
    currency:
      normalizedCurrency,
    status: 'captured',
  });
}

module.exports = {
  RAZORPAY_VERIFICATION_ERROR,
  verifyRazorpayPaymentAuthenticity,
};
