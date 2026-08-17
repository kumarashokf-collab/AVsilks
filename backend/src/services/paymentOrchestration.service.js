'use strict';

const {
  createRazorpayPaymentSession,
} = require('./payment.service');

const {
  validateVerifyRazorpayPaymentInput,
} = require('../validators/payment.validator');

const PAYMENT_ORCHESTRATION_ERROR =
  Object.freeze({
    AUTHENTICATION_REQUIRED:
      'AUTHENTICATION_REQUIRED',
    VALIDATION_FAILED:
      'VALIDATION_FAILED',
    INVALID_DEPENDENCIES:
      'INVALID_PAYMENT_ORCHESTRATION_DEPENDENCIES',
    INVALID_SESSION:
      'INVALID_PAYMENT_SESSION',
    VERIFICATION_FAILED:
      'PAYMENT_VERIFICATION_FAILED',
  });

function createOrchestrationError(
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

function requireUserId(user) {
  const userId =
    normalizeText(user?.uid);

  if (!userId) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated user is required.'
    );
  }

  return userId;
}

function requireFunction(
  value,
  name
) {
  if (typeof value !== 'function') {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .INVALID_DEPENDENCIES,
      `${name} dependency is unavailable.`
    );
  }

  return value;
}

async function createRazorpayCheckout(
  user,
  payload,
  dependencies = {}
) {
  const userId = requireUserId(user);

  const createPaymentSession =
    requireFunction(
      dependencies.createPaymentSession,
      'createPaymentSession'
    );

  const ensureRazorpayOrder =
    requireFunction(
      dependencies.ensureRazorpayOrder,
      'ensureRazorpayOrder'
    );

  const bindRazorpayOrder =
    requireFunction(
      dependencies.bindRazorpayOrder,
      'bindRazorpayOrder'
    );

  const reservation =
    await createRazorpayPaymentSession(
      { uid: userId },
      payload,
      {
        createPaymentSession,
      }
    );

  const paymentSessionId =
    normalizeText(
      reservation?.paymentSessionId
    );

  const amountPaise =
    reservation?.amountPaise;

  const currency =
    normalizeText(
      reservation?.currency
    );

  if (
    !paymentSessionId ||
    !Number.isSafeInteger(
      amountPaise
    ) ||
    amountPaise <= 0 ||
    !currency
  ) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .INVALID_SESSION,
      'Reserved payment session is invalid.'
    );
  }

  const gatewayOrder =
    await ensureRazorpayOrder({
      paymentSessionId,
      amountPaise,
      currency,
    });

  const razorpayOrderId =
    normalizeText(
      gatewayOrder?.razorpayOrderId
    );

  const receipt =
    normalizeText(
      gatewayOrder?.receipt
    );

  if (
    !razorpayOrderId ||
    !receipt
  ) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .INVALID_SESSION,
      'Razorpay order result is invalid.'
    );
  }

  await bindRazorpayOrder({
    paymentSessionId,
    userId,
    amountPaise,
    currency,
    razorpayOrderId,
    receipt,
  });

  return Object.freeze({
    paymentSessionId,
    razorpayOrderId,
    amountPaise,
    currency,
    receipt,
    recovered:
      gatewayOrder.recovered === true,
  });
}

async function verifyAndFinalizeRazorpayPayment(
  user,
  payload,
  dependencies = {}
) {
  const userId = requireUserId(user);

  const validation =
    validateVerifyRazorpayPaymentInput(
      payload
    );

  if (validation.error) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .VALIDATION_FAILED,
      'Payment verification request is invalid.'
    );
  }

  const {
    paymentSessionId,
    razorpayOrderId:
      clientRazorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = validation.value;

  const getPaymentSessionForVerification =
    requireFunction(
      dependencies
        .getPaymentSessionForVerification,
      'getPaymentSessionForVerification'
    );

  const getRazorpayKeySecret =
    requireFunction(
      dependencies.getRazorpayKeySecret,
      'getRazorpayKeySecret'
    );

  const verifyPaymentAuthenticity =
    requireFunction(
      dependencies
        .verifyPaymentAuthenticity,
      'verifyPaymentAuthenticity'
    );

  const finalizePayment =
    requireFunction(
      dependencies.finalizePayment,
      'finalizePayment'
    );

  const session =
    await getPaymentSessionForVerification({
      paymentSessionId,
      userId,
    });

  const storedRazorpayOrderId =
    normalizeText(
      session?.razorpayOrderId
    );

  const amountPaise =
    session?.amountPaise;

  const currency =
    normalizeText(
      session?.currency
    );

  if (
    normalizeText(session?.userId) !==
      userId ||
    normalizeText(
      session?.paymentSessionId
    ) !== paymentSessionId ||
    !storedRazorpayOrderId ||
    !Number.isSafeInteger(
      amountPaise
    ) ||
    amountPaise <= 0 ||
    !currency
  ) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .INVALID_SESSION,
      'Trusted payment session is invalid.'
    );
  }

  const keySecret =
    normalizeText(
      getRazorpayKeySecret()
    );

  if (!keySecret) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .INVALID_DEPENDENCIES,
      'Razorpay key secret is unavailable.'
    );
  }

  const verification =
    await verifyPaymentAuthenticity({
      storedRazorpayOrderId,
      clientRazorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise,
      currency,
      keySecret,
    });

  if (
    verification?.verified !== true
  ) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .VERIFICATION_FAILED,
      'Razorpay payment verification failed.'
    );
  }

  const finalization =
    await finalizePayment({
      paymentSessionId,
      userId,
      razorpayOrderId:
        storedRazorpayOrderId,
      razorpayPaymentId:
        normalizeText(
          verification
            .razorpayPaymentId
        ) || razorpayPaymentId,
      amountPaise,
      currency,
    });

  if (
    !finalization ||
    typeof finalization !== 'object' ||
    typeof finalization.finalized !==
      'boolean' ||
    !normalizeText(
      finalization.orderId
    )
  ) {
    throw createOrchestrationError(
      PAYMENT_ORCHESTRATION_ERROR
        .VERIFICATION_FAILED,
      'Payment finalization returned an invalid result.'
    );
  }

  return Object.freeze({
    verified: true,
    finalized:
      finalization.finalized,
    orderId:
      normalizeText(
        finalization.orderId
      ),
    paymentSessionId,
    razorpayPaymentId:
      normalizeText(
        verification
          .razorpayPaymentId
      ) || razorpayPaymentId,
  });
}

module.exports = {
  PAYMENT_ORCHESTRATION_ERROR,
  createRazorpayCheckout,
  verifyAndFinalizeRazorpayPayment,
};
