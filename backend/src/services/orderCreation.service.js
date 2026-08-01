'use strict';

const {
  PAYMENT_METHOD,
  PAYMENT_LABEL,
  PAYMENT_STATUS,
} = require('../constants/orderPolicy');

const {
  INITIAL_ORDER_STATUS,
} = require('../constants/orderStatus');

const {
  calculateOrderTotals,
} = require('./orderPricing.service');

const {
  buildAuthoritativeOrderItem,
} = require('./orderItem.service');

const ORDER_CREATION_ERROR = Object.freeze({
  INVALID_USER: 'INVALID_USER',
  INVALID_ITEMS: 'INVALID_ITEMS',
  PRODUCT_RECORD_MISSING: 'PRODUCT_RECORD_MISSING',
  DUPLICATE_PRODUCT_RECORD: 'DUPLICATE_PRODUCT_RECORD',
  INVALID_IDEMPOTENCY_IDENTITY:
    'INVALID_IDEMPOTENCY_IDENTITY',
});

function createOrderCreationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function buildOrderCreationPlan({
  userId,
  authenticatedPhone = '',
  customer,
  requestedItems,
  productRecords,
  paymentMethod = PAYMENT_METHOD.COD,
  idempotencyIdentity,
  nowIso = new Date().toISOString(),
}) {
  const normalizedUserId = normalizeText(userId);

  if (!normalizedUserId) {
    throw createOrderCreationError(
      ORDER_CREATION_ERROR.INVALID_USER,
      'Authenticated user ID is required.'
    );
  }

  if (
    !Array.isArray(requestedItems) ||
    requestedItems.length === 0 ||
    !Array.isArray(productRecords)
  ) {
    throw createOrderCreationError(
      ORDER_CREATION_ERROR.INVALID_ITEMS,
      'Requested items and product records are required.'
    );
  }

  if (
    !idempotencyIdentity?.orderId ||
    !idempotencyIdentity?.idempotencyKeyHash ||
    !idempotencyIdentity?.requestFingerprint
  ) {
    throw createOrderCreationError(
      ORDER_CREATION_ERROR
        .INVALID_IDEMPOTENCY_IDENTITY,
      'Valid idempotency identity is required.'
    );
  }

  const productRecordMap = new Map();

  for (const record of productRecords) {
    const productId = normalizeText(
      record?.productId
    );

    if (!productId) {
      throw createOrderCreationError(
        ORDER_CREATION_ERROR.PRODUCT_RECORD_MISSING,
        'Product record ID is missing.'
      );
    }

    if (productRecordMap.has(productId)) {
      throw createOrderCreationError(
        ORDER_CREATION_ERROR.DUPLICATE_PRODUCT_RECORD,
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

      if (!productRecordMap.has(normalizedProductId)) {
        throw createOrderCreationError(
          ORDER_CREATION_ERROR.PRODUCT_RECORD_MISSING,
          `Product ${normalizedProductId} was not loaded.`
        );
      }

      return buildAuthoritativeOrderItem({
        productId: normalizedProductId,
        quantity,
        productData: productRecordMap.get(
          normalizedProductId
        ),
      });
    }
  );

  const totals = calculateOrderTotals(items);

  const stockUpdates = items.map((item) => {
    const productData = productRecordMap.get(
      item.productId
    );

    return Object.freeze({
      productId: item.productId,
      previousStock: productData.stock,
      nextStock:
        productData.stock - item.quantity,
      quantityDeducted: item.quantity,
    });
  });

  const normalizedCustomer = Object.freeze({
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

  const frozenItems = Object.freeze([...items]);
  const frozenStockUpdates =
    Object.freeze([...stockUpdates]);

  const orderDocument = Object.freeze({
    id: idempotencyIdentity.orderId,
    userId: normalizedUserId,
    userPhone: normalizeText(
      authenticatedPhone
    ),
    customer: normalizedCustomer,
    customerName: normalizedCustomer.name,
    customerPhone: normalizedCustomer.phone,
    product: items
      .map((item) => item.name)
      .join(', '),
    items: frozenItems,
    subtotal: totals.subtotal,
    shippingCharge: totals.shippingCharge,
    total: totals.total,
    price: totals.total,
    currency: totals.currency,
    paymentMethod,
    payment: PAYMENT_LABEL.COD,
    paymentStatus:
      PAYMENT_STATUS.PENDING_ON_DELIVERY,
    status: INITIAL_ORDER_STATUS,
    cancelReason: '',
    statusHistory: Object.freeze([
      Object.freeze({
        status: INITIAL_ORDER_STATUS,
        date: nowIso,
        note: 'Order placed successfully',
      }),
    ]),
    idempotencyKeyHash:
      idempotencyIdentity.idempotencyKeyHash,
    requestFingerprint:
      idempotencyIdentity.requestFingerprint,
  });

  return Object.freeze({
    orderId: idempotencyIdentity.orderId,
    orderDocument,
    stockUpdates: frozenStockUpdates,
  });
}

module.exports = {
  ORDER_CREATION_ERROR,
  buildOrderCreationPlan,
};
