'use strict';

const {
  PAYMENT_METHOD,
} = require('../constants/orderPolicy');

const {
  validateCreateRazorpayOrderInput,
  validateVerifyRazorpayPaymentInput,
} = require('../validators/payment.validator');

const PAYMENT_SERVICE_ERROR = Object.freeze({
  AUTHENTICATION_REQUIRED:
    'AUTHENTICATION_REQUIRED',
  VALIDATION_FAILED:
    'VALIDATION_FAILED',
  INVALID_REPOSITORY:
    'INVALID_REPOSITORY',
  INVALID_REPOSITORY_RESULT:
    'INVALID_REPOSITORY_RESULT',
});

function createPaymentServiceError(
  code,
  message,
  details = []
) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function formatValidationDetails(error) {
  return Array.isArray(error?.details)
    ? error.details.map((detail) => ({
        path: Array.isArray(detail.path)
          ? detail.path.join('.')
          : '',
        type:
          typeof detail.type === 'string'
            ? detail.type
            : 'validation',
      }))
    : [];
}

function requireTrustedUserId(user) {
  const userId = normalizeText(user?.uid);

  if (!userId) {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated user is required.'
    );
  }

  return userId;
}

async function createRazorpayPaymentSession(
  user,
  payload,
  dependencies = {}
) {
  const userId = requireTrustedUserId(user);

  const validation =
    validateCreateRazorpayOrderInput(payload);

  if (validation.error) {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR.VALIDATION_FAILED,
      'Payment request validation failed.',
      formatValidationDetails(validation.error)
    );
  }

  const repositoryFunction =
    dependencies.createPaymentSession;

  if (typeof repositoryFunction !== 'function') {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR.INVALID_REPOSITORY,
      'Payment repository is unavailable.'
    );
  }

  const {
    idempotencyKey,
    customer,
    items,
  } = validation.value;

  const result = await repositoryFunction({
    userId,
    idempotencyKey,
    customer,
    items,
    paymentMethod:
      PAYMENT_METHOD.RAZORPAY,
  });

  const paymentSessionId =
    normalizeText(result?.paymentSessionId);

  if (!paymentSessionId) {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR
        .INVALID_REPOSITORY_RESULT,
      'Payment repository returned an invalid result.'
    );
  }

  return Object.freeze({
    ...result,
    paymentSessionId,
  });
}

async function verifyRazorpayPayment(
  user,
  payload,
  dependencies = {}
) {
  const userId = requireTrustedUserId(user);

  const validation =
    validateVerifyRazorpayPaymentInput(payload);

  if (validation.error) {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR.VALIDATION_FAILED,
      'Payment verification validation failed.',
      formatValidationDetails(validation.error)
    );
  }

  const repositoryFunction =
    dependencies.verifyPaymentSession;

  if (typeof repositoryFunction !== 'function') {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR.INVALID_REPOSITORY,
      'Payment verification repository is unavailable.'
    );
  }

  const result = await repositoryFunction({
    userId,
    ...validation.value,
  });

  if (
    !result ||
    typeof result !== 'object' ||
    typeof result.verified !== 'boolean'
  ) {
    throw createPaymentServiceError(
      PAYMENT_SERVICE_ERROR
        .INVALID_REPOSITORY_RESULT,
      'Payment verification repository returned an invalid result.'
    );
  }

  return Object.freeze({
    ...result,
  });
}

module.exports = {
  PAYMENT_SERVICE_ERROR,
  formatValidationDetails,
  createRazorpayPaymentSession,
  verifyRazorpayPayment,
};
