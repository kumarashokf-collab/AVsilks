'use strict';

const {
  PAYMENT_METHOD,
  PAYMENT_LABEL,
  PAYMENT_STATUS,
} = require('../constants/orderPolicy');

const {
  buildAuthoritativeOrderItem,
} = require('./orderItem.service');

const {
  calculateOrderTotals,
  toPaise,
} = require('./orderPricing.service');

const PAYMENT_RESERVATION_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  PRODUCT_RECORD_MISSING:
    'PRODUCT_RECORD_MISSING',
  DUPLICATE_PRODUCT_RECORD:
    'DUPLICATE_PRODUCT_RECORD',
});

function createReservationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function normalizeCustomer(customer) {
  return Object.freeze({
    name: normalizeText(customer?.name),
    phone: normalizeText(customer?.phone),
    address: Object.freeze({
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
    }),
  });
}

function buildPaymentReservationPlan({
  userId,
  customer,
  requestedItems,
  productRecords,
  paymentSessionId,
  idempotencyIdentity,
  nowIso = new Date().toISOString(),
  expiresAtIso,
}) {
  const normalizedUserId =
    normalizeText(userId);

  const normalizedSessionId =
    normalizeText(paymentSessionId);

  const normalizedNowIso =
    normalizeText(nowIso);

  const normalizedExpiresAtIso =
    normalizeText(expiresAtIso);

  if (
    !normalizedUserId ||
    !normalizedSessionId ||
    !normalizedNowIso ||
    !normalizedExpiresAtIso ||
    !Array.isArray(requestedItems) ||
    requestedItems.length === 0 ||
    !Array.isArray(productRecords) ||
    !normalizeText(
      idempotencyIdentity
        ?.idempotencyKeyHash
    ) ||
    !normalizeText(
      idempotencyIdentity
        ?.requestFingerprint
    )
  ) {
    throw createReservationError(
      PAYMENT_RESERVATION_ERROR.INVALID_INPUT,
      'Valid payment reservation input is required.'
    );
  }

  const productRecordMap = new Map();

  for (const record of productRecords) {
    const productId =
      normalizeText(record?.productId);

    if (!productId) {
      throw createReservationError(
        PAYMENT_RESERVATION_ERROR
          .PRODUCT_RECORD_MISSING,
        'Product record ID is missing.'
      );
    }

    if (productRecordMap.has(productId)) {
      throw createReservationError(
        PAYMENT_RESERVATION_ERROR
          .DUPLICATE_PRODUCT_RECORD,
        'Duplicate product record was provided.'
      );
    }

    productRecordMap.set(
      productId,
      record.productData
    );
  }

  const items = requestedItems.map(
    ({ productId, quantity }) => {
      const normalizedProductId =
        normalizeText(productId);

      if (
        !productRecordMap.has(
          normalizedProductId
        )
      ) {
        throw createReservationError(
          PAYMENT_RESERVATION_ERROR
            .PRODUCT_RECORD_MISSING,
          `Product ${normalizedProductId} was not loaded.`
        );
      }

      return buildAuthoritativeOrderItem({
        productId: normalizedProductId,
        quantity,
        productData:
          productRecordMap.get(
            normalizedProductId
          ),
      });
    }
  );

  const totals =
    calculateOrderTotals(items);

  const amountPaise =
    toPaise(
      totals.total,
      'Payment total'
    );

  const stockUpdates = Object.freeze(
    items.map((item) => {
      const productData =
        productRecordMap.get(
          item.productId
        );

      return Object.freeze({
        productId: item.productId,
        previousStock:
          productData.stock,
        nextStock:
          productData.stock -
          item.quantity,
        quantityReserved:
          item.quantity,
      });
    })
  );

  const frozenItems =
    Object.freeze([...items]);

  const normalizedCustomer =
    normalizeCustomer(customer);

  const sessionDocument =
    Object.freeze({
      paymentSessionId:
        normalizedSessionId,
      userId: normalizedUserId,
      customer: normalizedCustomer,
      items: frozenItems,
      subtotal: totals.subtotal,
      shippingCharge:
        totals.shippingCharge,
      total: totals.total,
      amountPaise,
      currency: totals.currency,
      paymentMethod:
        PAYMENT_METHOD.RAZORPAY,
      payment:
        PAYMENT_LABEL.RAZORPAY,
      paymentStatus:
        PAYMENT_STATUS.PENDING_PAYMENT,
      idempotencyKeyHash:
        normalizeText(
          idempotencyIdentity
            .idempotencyKeyHash
        ),
      requestFingerprint:
        normalizeText(
          idempotencyIdentity
            .requestFingerprint
        ),
      createdAtIso:
        normalizedNowIso,
      expiresAtIso:
        normalizedExpiresAtIso,
    });

  return Object.freeze({
    paymentSessionId:
      normalizedSessionId,
    items: frozenItems,
    stockUpdates,
    subtotal: totals.subtotal,
    shippingCharge:
      totals.shippingCharge,
    total: totals.total,
    amountPaise,
    currency: totals.currency,
    sessionDocument,
  });
}

module.exports = {
  PAYMENT_RESERVATION_ERROR,
  buildPaymentReservationPlan,
};
