'use strict';

const RAZORPAY_ADAPTER_ERROR =
  Object.freeze({
    CREDENTIALS_MISSING:
      'RAZORPAY_CREDENTIALS_MISSING',
    SDK_INVALID:
      'RAZORPAY_SDK_INVALID',
    INVALID_INPUT:
      'RAZORPAY_ADAPTER_INVALID_INPUT',
  });

function createAdapterError(
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

function createRazorpayAdapter(
  dependencies = {}
) {
  const env =
    dependencies.env || process.env;

  const keyId =
    normalizeText(
      env?.RAZORPAY_KEY_ID
    );

  const keySecret =
    normalizeText(
      env?.RAZORPAY_KEY_SECRET
    );

  if (!keyId || !keySecret) {
    throw createAdapterError(
      RAZORPAY_ADAPTER_ERROR
        .CREDENTIALS_MISSING,
      'Razorpay server credentials are unavailable.'
    );
  }

  const RazorpayCtor =
    dependencies.RazorpayCtor ||
    require('razorpay');

  if (
    typeof RazorpayCtor !==
    'function'
  ) {
    throw createAdapterError(
      RAZORPAY_ADAPTER_ERROR
        .SDK_INVALID,
      'Razorpay SDK constructor is invalid.'
    );
  }

  const client =
    new RazorpayCtor({
      key_id: keyId,
      key_secret: keySecret,
    });

  if (
    typeof client?.orders?.create !==
      'function' ||
    typeof client?.orders?.all !==
      'function' ||
    typeof client?.payments?.fetch !==
      'function'
  ) {
    throw createAdapterError(
      RAZORPAY_ADAPTER_ERROR
        .SDK_INVALID,
      'Razorpay SDK API surface is invalid.'
    );
  }

  async function createOrder(payload) {
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw createAdapterError(
        RAZORPAY_ADAPTER_ERROR
          .INVALID_INPUT,
        'Razorpay order payload is invalid.'
      );
    }

    return client.orders.create(
      payload
    );
  }

  async function findOrdersByReceipt(
    receipt
  ) {
    const normalizedReceipt =
      normalizeText(receipt);

    if (!normalizedReceipt) {
      throw createAdapterError(
        RAZORPAY_ADAPTER_ERROR
          .INVALID_INPUT,
        'Razorpay receipt is invalid.'
      );
    }

    return client.orders.all({
      receipt: normalizedReceipt,
    });
  }

  async function fetchPayment(
    paymentId
  ) {
    const normalizedPaymentId =
      normalizeText(paymentId);

    if (!normalizedPaymentId) {
      throw createAdapterError(
        RAZORPAY_ADAPTER_ERROR
          .INVALID_INPUT,
        'Razorpay payment ID is invalid.'
      );
    }

    return client.payments.fetch(
      normalizedPaymentId
    );
  }

  function getKeyId() {
    return keyId;
  }

  function getKeySecret() {
    return keySecret;
  }

  return Object.freeze({
    createOrder,
    findOrdersByReceipt,
    fetchPayment,
    getKeyId,
    getKeySecret,
  });
}

module.exports = {
  RAZORPAY_ADAPTER_ERROR,
  createRazorpayAdapter,
};
