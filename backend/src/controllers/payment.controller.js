'use strict';

const {
  createPaymentRuntime,
} = require('../services/paymentRuntime.service');

function sanitizeDetails(details) {
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .map((detail) => ({
      path:
        typeof detail?.path === 'string'
          ? detail.path
          : '',
      type:
        typeof detail?.type === 'string'
          ? detail.type
          : 'validation',
    }))
    .filter(
      (detail) =>
        detail.path || detail.type
    );
}

function mapPaymentError(error) {
  const code =
    typeof error?.code === 'string'
      ? error.code
      : 'INTERNAL_ERROR';

  switch (code) {
    case 'AUTHENTICATION_REQUIRED':
      return {
        status: 401,
        code,
        message:
          'Authentication is required.',
      };

    case 'VALIDATION_FAILED':
      return {
        status: 400,
        code,
        message:
          'Payment request validation failed.',
        details:
          sanitizeDetails(error?.details),
      };

    case 'INVALID_RAZORPAY_VERIFICATION_INPUT':
    case 'RAZORPAY_SIGNATURE_INVALID':
    case 'RAZORPAY_ORDER_MISMATCH':
    case 'RAZORPAY_PAYMENT_MISMATCH':
      return {
        status: 400,
        code,
        message:
          'Payment verification failed.',
      };

    case 'IDEMPOTENCY_CONFLICT':
    case 'RAZORPAY_ORDER_CONFLICT':
    case 'PAYMENT_REPLAY_CONFLICT':
    case 'ORDER_CONFLICT':
    case 'SESSION_MISMATCH':
    case 'SESSION_NOT_VERIFIABLE':
    case 'SESSION_NOT_RELEASABLE':
    case 'RAZORPAY_PAYMENT_NOT_CAPTURED':
      return {
        status: 409,
        code,
        message:
          'Payment request conflicts with the current payment state.',
      };

    case 'SESSION_NOT_FOUND':
      return {
        status: 404,
        code,
        message:
          'Payment session was not found.',
      };

    default:
      return {
        status: 500,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to process payment request.',
      };
  }
}

function createPaymentController(
  dependencies = {}
) {
  const createCheckout =
    dependencies.createRazorpayCheckout;

  const verifyPayment =
    dependencies
      .verifyAndFinalizeRazorpayPayment;

  if (
    typeof createCheckout !== 'function' ||
    typeof verifyPayment !== 'function'
  ) {
    throw new TypeError(
      'Payment controller dependencies must be functions.'
    );
  }

  async function createRazorpayOrder(
    req,
    res
  ) {
    try {
      const result =
        await createCheckout(
          req?.user,
          req?.body
        );

      return res
        .status(201)
        .json({
          success: true,
          data: result,
        });
    } catch (error) {
      const mapped =
        mapPaymentError(error);

      const body = {
        success: false,
        code: mapped.code,
        message: mapped.message,
      };

      if (
        mapped.status === 400 &&
        Array.isArray(
          mapped.details
        ) &&
        mapped.details.length > 0
      ) {
        body.details =
          mapped.details;
      }

      return res
        .status(mapped.status)
        .json(body);
    }
  }

  async function verifyRazorpayPayment(
    req,
    res
  ) {
    try {
      const result =
        await verifyPayment(
          req?.user,
          req?.body
        );

      return res
        .status(200)
        .json({
          success: true,
          data: result,
        });
    } catch (error) {
      const mapped =
        mapPaymentError(error);

      return res
        .status(mapped.status)
        .json({
          success: false,
          code: mapped.code,
          message: mapped.message,
        });
    }
  }

  return Object.freeze({
    createRazorpayOrder,
    verifyRazorpayPayment,
  });
}

const defaultPaymentRuntime =
  createPaymentRuntime();

const defaultController =
  createPaymentController({
    createRazorpayCheckout:
      defaultPaymentRuntime
        .createRazorpayCheckout,
    verifyAndFinalizeRazorpayPayment:
      defaultPaymentRuntime
        .verifyAndFinalizeRazorpayPayment,
  });

module.exports = {
  sanitizeDetails,
  mapPaymentError,
  createPaymentController,
  createRazorpayOrder:
    defaultController
      .createRazorpayOrder,
  verifyRazorpayPayment:
    defaultController
      .verifyRazorpayPayment,
};
