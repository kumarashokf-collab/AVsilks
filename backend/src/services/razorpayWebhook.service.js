'use strict';

const crypto = require('node:crypto');

const RAZORPAY_WEBHOOK_ERROR =
  Object.freeze({
    RAW_BODY_REQUIRED:
      'RAZORPAY_WEBHOOK_RAW_BODY_REQUIRED',
    SECRET_MISSING:
      'RAZORPAY_WEBHOOK_SECRET_MISSING',
    SIGNATURE_INVALID:
      'RAZORPAY_WEBHOOK_SIGNATURE_INVALID',
    EVENT_ID_REQUIRED:
      'RAZORPAY_WEBHOOK_EVENT_ID_REQUIRED',
    PAYLOAD_INVALID:
      'RAZORPAY_WEBHOOK_PAYLOAD_INVALID',
    EVENT_UNSUPPORTED:
      'RAZORPAY_WEBHOOK_EVENT_UNSUPPORTED',
  });

function createWebhookError(
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

function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  webhookSecret,
}) {
  if (!Buffer.isBuffer(rawBody)) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .RAW_BODY_REQUIRED,
      'Exact raw webhook Buffer is required.'
    );
  }

  const secret =
    normalizeText(webhookSecret);

  if (!secret) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .SECRET_MISSING,
      'Razorpay webhook secret is unavailable.'
    );
  }

  const receivedHex =
    normalizeText(signature);

  if (
    !/^[a-fA-F0-9]{64}$/.test(
      receivedHex
    )
  ) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .SIGNATURE_INVALID,
      'Razorpay webhook signature is invalid.'
    );
  }

  const expectedSignature =
    crypto
      .createHmac(
        'sha256',
        secret
      )
      .update(rawBody)
      .digest();

  const receivedSignature =
    Buffer.from(
      receivedHex,
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
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .SIGNATURE_INVALID,
      'Razorpay webhook signature is invalid.'
    );
  }

  return Object.freeze({
    verified: true,
  });
}


function parseRazorpayWebhookEvent({
  rawBody,
  eventId,
}) {
  if (!Buffer.isBuffer(rawBody)) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .RAW_BODY_REQUIRED,
      'Exact raw webhook Buffer is required.'
    );
  }

  const normalizedEventId =
    normalizeText(eventId);

  if (
    !normalizedEventId ||
    normalizedEventId.length > 200 ||
    /[\r\n]/.test(normalizedEventId)
  ) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .EVENT_ID_REQUIRED,
      'Razorpay webhook event ID is required.'
    );
  }

  let payload;

  try {
    payload = JSON.parse(
      rawBody.toString('utf8')
    );
  } catch {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .PAYLOAD_INVALID,
      'Razorpay webhook payload is invalid.'
    );
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .PAYLOAD_INVALID,
      'Razorpay webhook payload is invalid.'
    );
  }

  const event =
    normalizeText(payload.event);

  if (event !== 'payment.captured') {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .EVENT_UNSUPPORTED,
      'Razorpay webhook event is unsupported.'
    );
  }

  const payment =
    payload?.payload?.payment?.entity;

  const razorpayPaymentId =
    normalizeText(payment?.id);

  const razorpayOrderId =
    normalizeText(payment?.order_id);

  const amountPaise =
    payment?.amount;

  const currency =
    normalizeText(payment?.currency);

  const status =
    normalizeText(payment?.status);

  const captured =
    payment?.captured;

  if (
    !/^pay_[A-Za-z0-9_-]+$/.test(
      razorpayPaymentId
    ) ||
    !/^order_[A-Za-z0-9_-]+$/.test(
      razorpayOrderId
    ) ||
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    currency !== 'INR' ||
    status !== 'captured' ||
    captured !== true
  ) {
    throw createWebhookError(
      RAZORPAY_WEBHOOK_ERROR
        .PAYLOAD_INVALID,
      'Razorpay captured payment payload is invalid.'
    );
  }

  return Object.freeze({
    eventId:
      normalizedEventId,
    event,
    razorpayPaymentId,
    razorpayOrderId,
    amountPaise,
    currency,
    status,
    captured,
  });
}

module.exports = {
  RAZORPAY_WEBHOOK_ERROR,
  verifyRazorpayWebhookSignature,
  parseRazorpayWebhookEvent,
};
