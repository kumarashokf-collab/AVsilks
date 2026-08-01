'use strict';

const {
  ORDER_STATUS,
} = require('../constants/orderStatus');

const {
  isCustomerCancellableStatus,
} = require('../constants/orderTransitions');

const ORDER_CANCELLATION_ERROR =
  Object.freeze({
    INVALID_INPUT: 'INVALID_INPUT',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_OWNERSHIP_MISMATCH:
      'ORDER_OWNERSHIP_MISMATCH',
    STATUS_NOT_CANCELLABLE:
      'STATUS_NOT_CANCELLABLE',
    INVALID_ORDER_ITEMS:
      'INVALID_ORDER_ITEMS',
    DUPLICATE_PRODUCT:
      'DUPLICATE_PRODUCT',
  });

function createCancellationError(
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

function resolveStoredProductId(item) {
  const productId =
    normalizeText(item?.productId);

  const legacyId =
    normalizeText(item?.id);

  if (
    productId &&
    legacyId &&
    productId !== legacyId
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR
        .INVALID_ORDER_ITEMS,
      'Stored order item identities conflict.'
    );
  }

  const resolvedId =
    productId || legacyId;

  if (
    !resolvedId ||
    resolvedId.includes('/')
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR
        .INVALID_ORDER_ITEMS,
      'Stored order item product ID is invalid.'
    );
  }

  return resolvedId;
}

function normalizeStatusHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        !Array.isArray(entry)
    )
    .map((entry) =>
      Object.freeze({
        ...entry,
      })
    );
}

function buildCustomerCancellationPlan({
  userId,
  orderId,
  reason,
  orderData,
  nowIso = new Date().toISOString(),
}) {
  const normalizedUserId =
    normalizeText(userId);

  const normalizedOrderId =
    normalizeText(orderId);

  const normalizedReason =
    normalizeText(reason);

  const normalizedNowIso =
    normalizeText(nowIso);

  if (
    !normalizedUserId ||
    !normalizedOrderId ||
    !normalizedReason ||
    !normalizedNowIso
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR.INVALID_INPUT,
      'Valid cancellation input is required.'
    );
  }

  if (
    !orderData ||
    typeof orderData !== 'object' ||
    Array.isArray(orderData)
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR.ORDER_NOT_FOUND,
      'Order was not found.'
    );
  }

  const ownerUserId =
    normalizeText(orderData.userId);

  if (
    !ownerUserId ||
    ownerUserId !== normalizedUserId
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR
        .ORDER_OWNERSHIP_MISMATCH,
      'Order does not belong to the authenticated customer.'
    );
  }

  if (
    !isCustomerCancellableStatus(
      orderData.status
    )
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR
        .STATUS_NOT_CANCELLABLE,
      'Order cannot be cancelled in its current status.'
    );
  }

  if (
    !Array.isArray(orderData.items) ||
    orderData.items.length === 0
  ) {
    throw createCancellationError(
      ORDER_CANCELLATION_ERROR
        .INVALID_ORDER_ITEMS,
      'Order items are required for stock restoration.'
    );
  }

  const seenProductIds = new Set();

  const stockRestorations =
    orderData.items.map((item) => {
      const productId =
        resolveStoredProductId(item);

      const quantity =
        Number(item?.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw createCancellationError(
          ORDER_CANCELLATION_ERROR
            .INVALID_ORDER_ITEMS,
          'Stored order item quantity is invalid.'
        );
      }

      if (seenProductIds.has(productId)) {
        throw createCancellationError(
          ORDER_CANCELLATION_ERROR
            .DUPLICATE_PRODUCT,
          'Stored order contains a duplicate product.'
        );
      }

      seenProductIds.add(productId);

      return Object.freeze({
        productId,
        quantityToRestore: quantity,
      });
    });

  const previousHistory =
    normalizeStatusHistory(
      orderData.statusHistory
    );

  const cancellationEntry =
    Object.freeze({
      status: ORDER_STATUS.CANCELLED,
      date: normalizedNowIso,
      note: normalizedReason,
    });

  const statusHistory =
    Object.freeze([
      ...previousHistory,
      cancellationEntry,
    ]);

  const orderUpdate = Object.freeze({
    status: ORDER_STATUS.CANCELLED,
    cancelReason: normalizedReason,
    statusHistory,
    cancelledByUserId:
      normalizedUserId,
  });

  return Object.freeze({
    orderId: normalizedOrderId,
    userId: normalizedUserId,
    previousStatus: orderData.status,
    nextStatus: ORDER_STATUS.CANCELLED,
    reason: normalizedReason,
    stockRestorations:
      Object.freeze([
        ...stockRestorations,
      ]),
    orderUpdate,
  });
}

module.exports = {
  ORDER_CANCELLATION_ERROR,
  resolveStoredProductId,
  buildCustomerCancellationPlan,
};
