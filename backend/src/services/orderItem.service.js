'use strict';

const {
  ORDER_LIMITS,
} = require('../constants/orderPolicy');

const {
  toPaise,
  fromPaise,
} = require('./orderPricing.service');

const ORDER_ITEM_ERROR = Object.freeze({
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',
  PRODUCT_INVALID_NAME: 'PRODUCT_INVALID_NAME',
  PRODUCT_INVALID_PRICE: 'PRODUCT_INVALID_PRICE',
  PRODUCT_INVALID_STOCK: 'PRODUCT_INVALID_STOCK',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_PRODUCT_ID: 'INVALID_PRODUCT_ID',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
});

function createOrderItemError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeOptionalText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function buildAuthoritativeOrderItem({
  productId,
  quantity,
  productData,
}) {
  const normalizedProductId =
    normalizeOptionalText(productId);

  if (
    !normalizedProductId ||
    normalizedProductId.includes('/')
  ) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.INVALID_PRODUCT_ID,
      'Product ID is invalid.'
    );
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > ORDER_LIMITS.MAX_ITEM_QUANTITY
  ) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.INVALID_QUANTITY,
      'Requested product quantity is invalid.'
    );
  }

  if (
    !productData ||
    typeof productData !== 'object' ||
    Array.isArray(productData)
  ) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.PRODUCT_NOT_FOUND,
      'Product is not available.'
    );
  }

  if (productData.active === false) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.PRODUCT_INACTIVE,
      'Product is currently inactive.'
    );
  }

  const name = normalizeOptionalText(
    productData.name
  );

  if (!name || name.length > 200) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.PRODUCT_INVALID_NAME,
      'Product name is invalid.'
    );
  }

  const rawPrice =
    productData.salePrice !== undefined &&
    productData.salePrice !== null
      ? productData.salePrice
      : productData.price;

  if (
    typeof rawPrice !== 'number' ||
    !Number.isFinite(rawPrice) ||
    rawPrice <= 0
  ) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.PRODUCT_INVALID_PRICE,
      'Product price is invalid.'
    );
  }

  const stock = productData.stock;

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.PRODUCT_INVALID_STOCK,
      'Product stock is invalid.'
    );
  }

  if (quantity > stock) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.INSUFFICIENT_STOCK,
      'Requested quantity exceeds available stock.'
    );
  }

  const pricePaise = toPaise(
    rawPrice,
    'Product price'
  );

  const lineTotalPaise =
    pricePaise * quantity;

  if (!Number.isSafeInteger(lineTotalPaise)) {
    throw createOrderItemError(
      ORDER_ITEM_ERROR.PRODUCT_INVALID_PRICE,
      'Product line total is too large.'
    );
  }

  const image =
    normalizeOptionalText(productData.image) ||
    normalizeOptionalText(productData.imageUrl);

  const images = Object.freeze(
    Array.isArray(productData.images)
      ? productData.images
          .map(normalizeOptionalText)
          .filter(Boolean)
          .slice(0, 5)
      : []
  );

  return Object.freeze({
    id: normalizedProductId,
    productId: normalizedProductId,
    name,
    sku: normalizeOptionalText(
      productData.sku
    ).toUpperCase(),
    category: normalizeOptionalText(
      productData.category
    ),
    image,
    images,
    price: fromPaise(pricePaise),
    quantity,
    lineTotal: fromPaise(lineTotalPaise),
  });
}

module.exports = {
  ORDER_ITEM_ERROR,
  buildAuthoritativeOrderItem,
};
