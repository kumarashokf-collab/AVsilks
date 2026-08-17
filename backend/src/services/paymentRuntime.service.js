'use strict';

const {
  createRazorpayAdapter,
} = require('./razorpayAdapter.service');

const {
  ensureRazorpayOrder,
} = require('./razorpayGateway.service');

const {
  verifyRazorpayPaymentAuthenticity,
} = require('./razorpayVerification.service');

const {
  createRazorpayCheckout,
  verifyAndFinalizeRazorpayPayment,
} = require('./paymentOrchestration.service');

const {
  createPaymentSessionWithTransaction,
  bindRazorpayOrderWithTransaction,
  getPaymentSessionForVerification,
  finalizeRazorpayPaymentWithTransaction,
} = require('../repositories/payment.repository');

const PAYMENT_RUNTIME_ERROR =
  Object.freeze({
    INVALID_DEPENDENCIES:
      'INVALID_PAYMENT_RUNTIME_DEPENDENCIES',
    INVALID_ADAPTER:
      'INVALID_RAZORPAY_ADAPTER',
  });

function createRuntimeError(
  code,
  message
) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requireFunction(
  value,
  name
) {
  if (typeof value !== 'function') {
    throw createRuntimeError(
      PAYMENT_RUNTIME_ERROR
        .INVALID_DEPENDENCIES,
      `${name} dependency is unavailable.`
    );
  }

  return value;
}

function createPaymentRuntime(
  dependencies = {}
) {
  const createRazorpayAdapterFn =
    dependencies.createRazorpayAdapterFn ||
    createRazorpayAdapter;

  const createPaymentSessionFn =
    dependencies.createPaymentSessionFn ||
    createPaymentSessionWithTransaction;

  const ensureRazorpayOrderFn =
    dependencies.ensureRazorpayOrderFn ||
    ensureRazorpayOrder;

  const bindRazorpayOrderFn =
    dependencies.bindRazorpayOrderFn ||
    bindRazorpayOrderWithTransaction;

  const getPaymentSessionForVerificationFn =
    dependencies
      .getPaymentSessionForVerificationFn ||
    getPaymentSessionForVerification;

  const verifyPaymentAuthenticityFn =
    dependencies
      .verifyPaymentAuthenticityFn ||
    verifyRazorpayPaymentAuthenticity;

  const finalizePaymentFn =
    dependencies.finalizePaymentFn ||
    finalizeRazorpayPaymentWithTransaction;

  [
    [createRazorpayAdapterFn, 'createRazorpayAdapter'],
    [createPaymentSessionFn, 'createPaymentSession'],
    [ensureRazorpayOrderFn, 'ensureRazorpayOrder'],
    [bindRazorpayOrderFn, 'bindRazorpayOrder'],
    [
      getPaymentSessionForVerificationFn,
      'getPaymentSessionForVerification',
    ],
    [
      verifyPaymentAuthenticityFn,
      'verifyPaymentAuthenticity',
    ],
    [finalizePaymentFn, 'finalizePayment'],
  ].forEach(([fn, name]) =>
    requireFunction(fn, name)
  );

  let cachedAdapter = null;

  function getAdapter() {
    if (cachedAdapter) {
      return cachedAdapter;
    }

    const adapter =
      createRazorpayAdapterFn();

    if (
      !adapter ||
      typeof adapter.createOrder !==
        'function' ||
      typeof adapter
        .findOrdersByReceipt !==
        'function' ||
      typeof adapter.fetchPayment !==
        'function' ||
      typeof adapter.getKeyId !==
        'function' ||
      typeof adapter.getKeySecret !==
        'function'
    ) {
      throw createRuntimeError(
        PAYMENT_RUNTIME_ERROR
          .INVALID_ADAPTER,
        'Razorpay adapter is invalid.'
      );
    }

    cachedAdapter = adapter;
    return cachedAdapter;
  }

  async function runtimeCreateRazorpayCheckout(
    user,
    payload
  ) {
    const adapter = getAdapter();

    const result =
      await createRazorpayCheckout(
        user,
        payload,
        {
          createPaymentSession:
            createPaymentSessionFn,

          ensureRazorpayOrder:
            (input) =>
              ensureRazorpayOrderFn(
                input,
                {
                  createOrder:
                    adapter.createOrder,
                  findOrdersByReceipt:
                    adapter
                      .findOrdersByReceipt,
                }
              ),

          bindRazorpayOrder:
            bindRazorpayOrderFn,
        }
      );

    const keyId =
      typeof adapter.getKeyId() ===
      'string'
        ? adapter.getKeyId().trim()
        : '';

    if (!keyId) {
      throw createRuntimeError(
        PAYMENT_RUNTIME_ERROR
          .INVALID_ADAPTER,
        'Razorpay public key ID is unavailable.'
      );
    }

    return Object.freeze({
      ...result,
      keyId,
    });
  }

  async function runtimeVerifyAndFinalizeRazorpayPayment(
    user,
    payload
  ) {
    const adapter = getAdapter();

    return verifyAndFinalizeRazorpayPayment(
      user,
      payload,
      {
        getPaymentSessionForVerification:
          getPaymentSessionForVerificationFn,

        getRazorpayKeySecret:
          () => adapter.getKeySecret(),

        verifyPaymentAuthenticity:
          (input) =>
            verifyPaymentAuthenticityFn(
              input,
              {
                fetchPayment:
                  adapter.fetchPayment,
              }
            ),

        finalizePayment:
          finalizePaymentFn,
      }
    );
  }

  return Object.freeze({
    createRazorpayCheckout:
      runtimeCreateRazorpayCheckout,
    verifyAndFinalizeRazorpayPayment:
      runtimeVerifyAndFinalizeRazorpayPayment,
  });
}

module.exports = {
  PAYMENT_RUNTIME_ERROR,
  createPaymentRuntime,
};
