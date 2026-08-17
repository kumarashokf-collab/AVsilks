'use strict';

const {
  verifyRazorpayWebhookSignature,
  parseRazorpayWebhookEvent,
} = require('./razorpayWebhook.service');

const {
  getPaymentSessionByRazorpayOrderId,
  finalizeRazorpayPaymentWithTransaction,
} = require('../repositories/payment.repository');

const {
  verifyCapturedRazorpayPayment,
} = require('./razorpayVerification.service');

const {
  createRazorpayAdapter,
} = require('./razorpayAdapter.service');

const PAYMENT_WEBHOOK_ERROR =
  Object.freeze({
    INVALID_DEPENDENCIES:
      'RAZORPAY_WEBHOOK_INVALID_DEPENDENCIES',
    SESSION_MISMATCH:
      'RAZORPAY_WEBHOOK_SESSION_MISMATCH',
  });

function createPaymentWebhookError(
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

function defaultGetWebhookSecret() {
  return process.env
    .RAZORPAY_WEBHOOK_SECRET;
}

async function reconcileCapturedRazorpayWebhook(
  {
    rawBody,
    signature,
    eventId,
  },
  dependencies = {}
) {
  const getWebhookSecret =
    dependencies.getWebhookSecret ||
    defaultGetWebhookSecret;

  const verifyWebhookSignature =
    dependencies.verifyWebhookSignature ||
    verifyRazorpayWebhookSignature;

  const parseWebhookEvent =
    dependencies.parseWebhookEvent ||
    parseRazorpayWebhookEvent;

  const loadPaymentSession =
    dependencies
      .getPaymentSessionByRazorpayOrderId ||
    getPaymentSessionByRazorpayOrderId;

  const finalizePayment =
    dependencies.finalizePayment ||
    finalizeRazorpayPaymentWithTransaction;

  const verifyCapturedPayment =
    dependencies.verifyCapturedPayment ||
    (async (input) => {
      const adapterFactory =
        dependencies.createRazorpayAdapter ||
        createRazorpayAdapter;

      if (
        typeof adapterFactory !==
        'function'
      ) {
        throw createPaymentWebhookError(
          PAYMENT_WEBHOOK_ERROR
            .INVALID_DEPENDENCIES,
          'Razorpay adapter dependency is invalid.'
        );
      }

      const adapter =
        adapterFactory();

      if (
        !adapter ||
        typeof adapter.fetchPayment !==
          'function'
      ) {
        throw createPaymentWebhookError(
          PAYMENT_WEBHOOK_ERROR
            .INVALID_DEPENDENCIES,
          'Razorpay payment fetch dependency is unavailable.'
        );
      }

      return verifyCapturedRazorpayPayment(
        input,
        {
          fetchPayment:
            adapter.fetchPayment,
        }
      );
    });

  if (
    typeof getWebhookSecret !== 'function' ||
    typeof verifyWebhookSignature !==
      'function' ||
    typeof parseWebhookEvent !==
      'function' ||
    typeof loadPaymentSession !==
      'function' ||
    typeof verifyCapturedPayment !==
      'function' ||
    typeof finalizePayment !== 'function'
  ) {
    throw createPaymentWebhookError(
      PAYMENT_WEBHOOK_ERROR
        .INVALID_DEPENDENCIES,
      'Razorpay webhook dependencies are invalid.'
    );
  }

  const secret =
    getWebhookSecret();

  verifyWebhookSignature({
    rawBody,
    signature,
    secret,
  });

  const event =
    parseWebhookEvent({
      rawBody,
      eventId,
    });

  const session =
    await loadPaymentSession(
      event.razorpayOrderId
    );

  const trustedSessionId =
    normalizeText(
      session?.paymentSessionId
    );

  const trustedUserId =
    normalizeText(
      session?.userId
    );

  const trustedOrderId =
    normalizeText(
      session?.razorpayOrderId
    );

  const trustedCurrency =
    normalizeText(
      session?.currency
    );

  const eventCurrency =
    normalizeText(
      event?.currency
    );

  const sessionMatches =
    trustedSessionId &&
    trustedUserId &&
    event?.event ===
      'payment.captured' &&
    event?.status ===
      'captured' &&
    event?.captured === true &&
    trustedOrderId ===
      event.razorpayOrderId &&
    Number.isSafeInteger(
      session?.amountPaise
    ) &&
    session.amountPaise > 0 &&
    session.amountPaise ===
      event.amountPaise &&
    trustedCurrency &&
    trustedCurrency ===
      eventCurrency;

  if (!sessionMatches) {
    throw createPaymentWebhookError(
      PAYMENT_WEBHOOK_ERROR
        .SESSION_MISMATCH,
      'Razorpay webhook does not match the trusted payment session.'
    );
  }

  const verifiedPayment =
    await verifyCapturedPayment({
      razorpayOrderId:
        trustedOrderId,
      razorpayPaymentId:
        event.razorpayPaymentId,
      amountPaise:
        session.amountPaise,
      currency:
        trustedCurrency,
    });

  const authoritativeMatch =
    verifiedPayment?.verified === true &&
    normalizeText(
      verifiedPayment.razorpayOrderId
    ) === trustedOrderId &&
    normalizeText(
      verifiedPayment.razorpayPaymentId
    ) ===
      normalizeText(
        event.razorpayPaymentId
      ) &&
    verifiedPayment.amountPaise ===
      session.amountPaise &&
    normalizeText(
      verifiedPayment.currency
    ) === trustedCurrency &&
    normalizeText(
      verifiedPayment.status
    ) === 'captured';

  if (!authoritativeMatch) {
    throw createPaymentWebhookError(
      PAYMENT_WEBHOOK_ERROR
        .SESSION_MISMATCH,
      'Authoritative Razorpay payment verification does not match the trusted session.'
    );
  }

  const finalization =
    await finalizePayment({
      paymentSessionId:
        trustedSessionId,
      userId:
        trustedUserId,
      razorpayOrderId:
        verifiedPayment.razorpayOrderId,
      razorpayPaymentId:
        verifiedPayment.razorpayPaymentId,
      amountPaise:
        verifiedPayment.amountPaise,
      currency:
        verifiedPayment.currency,
      webhookEventId:
        event.eventId,
    });

  return Object.freeze({
    processed: true,
    finalized:
      finalization?.finalized === true,
    orderId:
      finalization?.orderId || null,
  });
}

module.exports = {
  PAYMENT_WEBHOOK_ERROR,
  reconcileCapturedRazorpayWebhook,
};
