'use strict';

const {
  createHash,
} = require('node:crypto');

const {
  IDEMPOTENCY_POLICY,
  PAYMENT_METHOD,
} = require('../constants/orderPolicy');

function sha256(value) {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function validateIdempotencyKey(value) {
  const key = normalizeText(value);

  if (
    key.length <
      IDEMPOTENCY_POLICY.MIN_KEY_LENGTH ||
    key.length >
      IDEMPOTENCY_POLICY.MAX_KEY_LENGTH ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(key)
  ) {
    const error = new Error(
      'Idempotency key is invalid.'
    );

    error.code = 'INVALID_IDEMPOTENCY_KEY';
    throw error;
  }

  return key;
}

function buildCanonicalRequest({
  userId,
  customer,
  items,
  paymentMethod,
}) {
  const normalizedUserId =
    normalizeText(userId);

  if (!normalizedUserId) {
    const error = new Error(
      'Authenticated user ID is required.'
    );

    error.code = 'INVALID_USER_ID';
    throw error;
  }

  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          productId: normalizeText(
            item?.productId
          ),
          quantity: Number(item?.quantity),
        }))
        .sort((left, right) =>
          left.productId.localeCompare(
            right.productId
          )
        )
    : [];

  return {
    userId: normalizedUserId,
    customer: {
      name: normalizeText(customer?.name),
      phone: normalizeText(customer?.phone),
      address: {
        house: normalizeText(
          customer?.address?.house
        ),
        street: normalizeText(
          customer?.address?.street
        ),
        city: normalizeText(
          customer?.address?.city
        ),
        state: normalizeText(
          customer?.address?.state
        ),
        pin: normalizeText(
          customer?.address?.pin
        ),
      },
    },
    items: normalizedItems,
    paymentMethod: normalizeText(
      paymentMethod ||
        PAYMENT_METHOD.COD
    ).toLowerCase(),
  };
}

function createOrderIdempotencyIdentity({
  userId,
  idempotencyKey,
  customer,
  items,
  paymentMethod,
}) {
  const normalizedUserId =
    normalizeText(userId);

  if (!normalizedUserId) {
    const error = new Error(
      'Authenticated user ID is required.'
    );

    error.code = 'INVALID_USER_ID';
    throw error;
  }

  const normalizedKey =
    validateIdempotencyKey(
      idempotencyKey
    );

  const canonicalRequest =
    buildCanonicalRequest({
      userId: normalizedUserId,
      customer,
      items,
      paymentMethod,
    });

  const keyHash = sha256(normalizedKey);

  return Object.freeze({
    orderId:
      `ord_${sha256(
        `${normalizedUserId}\n${normalizedKey}`
      ).slice(0, 48)}`,
    idempotencyKeyHash: keyHash,
    requestFingerprint: sha256(
      JSON.stringify(canonicalRequest)
    ),
  });
}

module.exports = {
  sha256,
  validateIdempotencyKey,
  buildCanonicalRequest,
  createOrderIdempotencyIdentity,
};
