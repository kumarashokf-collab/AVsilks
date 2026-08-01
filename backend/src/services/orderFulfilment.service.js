'use strict';

const {
  isValidOrderStatus,
} = require('../constants/orderStatus');

const {
  canTransitionOrderStatus,
  isAdminFulfilmentTargetStatus,
} = require('../constants/orderTransitions');

const ORDER_FULFILMENT_ERROR =
  Object.freeze({
    INVALID_INPUT:
      'INVALID_INPUT',
    ORDER_NOT_FOUND:
      'ORDER_NOT_FOUND',
    INVALID_STORED_STATUS:
      'INVALID_STORED_STATUS',
    TARGET_STATUS_NOT_ALLOWED:
      'TARGET_STATUS_NOT_ALLOWED',
    TRANSITION_NOT_ALLOWED:
      'TRANSITION_NOT_ALLOWED',
  });

function createFulfilmentError(
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

function buildAdminFulfilmentPlan({
  adminUserId,
  orderId,
  nextStatus,
  note = '',
  orderData,
  nowIso = new Date().toISOString(),
}) {
  const normalizedAdminUserId =
    normalizeText(adminUserId);

  const normalizedOrderId =
    normalizeText(orderId);

  const normalizedNextStatus =
    normalizeText(nextStatus);

  const normalizedNote =
    normalizeText(note);

  const normalizedNowIso =
    normalizeText(nowIso);

  if (
    !normalizedAdminUserId ||
    !normalizedOrderId ||
    normalizedOrderId.includes('/') ||
    !normalizedNextStatus ||
    !normalizedNowIso
  ) {
    throw createFulfilmentError(
      ORDER_FULFILMENT_ERROR.INVALID_INPUT,
      'Valid admin fulfilment input is required.'
    );
  }

  if (
    !orderData ||
    typeof orderData !== 'object' ||
    Array.isArray(orderData)
  ) {
    throw createFulfilmentError(
      ORDER_FULFILMENT_ERROR.ORDER_NOT_FOUND,
      'Order was not found.'
    );
  }

  const currentStatus =
    normalizeText(orderData.status);

  if (!isValidOrderStatus(currentStatus)) {
    throw createFulfilmentError(
      ORDER_FULFILMENT_ERROR
        .INVALID_STORED_STATUS,
      'Stored order status is invalid.'
    );
  }

  if (
    !isAdminFulfilmentTargetStatus(
      normalizedNextStatus
    )
  ) {
    throw createFulfilmentError(
      ORDER_FULFILMENT_ERROR
        .TARGET_STATUS_NOT_ALLOWED,
      'Requested status is not an admin fulfilment target.'
    );
  }

  if (
    !canTransitionOrderStatus(
      currentStatus,
      normalizedNextStatus
    )
  ) {
    throw createFulfilmentError(
      ORDER_FULFILMENT_ERROR
        .TRANSITION_NOT_ALLOWED,
      'Requested order status transition is not allowed.'
    );
  }

  const previousHistory =
    normalizeStatusHistory(
      orderData.statusHistory
    );

  const historyEntry =
    Object.freeze({
      status: normalizedNextStatus,
      date: normalizedNowIso,
      note: normalizedNote,
      updatedByUserId:
        normalizedAdminUserId,
    });

  const statusHistory =
    Object.freeze([
      ...previousHistory,
      historyEntry,
    ]);

  const orderUpdate =
    Object.freeze({
      status: normalizedNextStatus,
      statusHistory,
      lastStatusUpdatedByUserId:
        normalizedAdminUserId,
    });

  return Object.freeze({
    orderId: normalizedOrderId,
    adminUserId:
      normalizedAdminUserId,
    previousStatus:
      currentStatus,
    nextStatus:
      normalizedNextStatus,
    note: normalizedNote,
    orderUpdate,
  });
}

module.exports = {
  ORDER_FULFILMENT_ERROR,
  normalizeStatusHistory,
  buildAdminFulfilmentPlan,
};
