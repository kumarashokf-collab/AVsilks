'use strict';

const productRepo =
  require('../repositories/product.repository');

const {
  validateCreateProductInput,
} = require('../validators/product.validator');

function createProductError(
  code,
  message,
  details = []
) {
  const error = new Error(message);
  error.code = code;

  if (Array.isArray(details) && details.length > 0) {
    error.details = details.map((detail) => ({
      path: Array.isArray(detail?.path)
        ? detail.path.join('.')
        : '',
      type:
        typeof detail?.type === 'string'
          ? detail.type
          : '',
      message:
        typeof detail?.message === 'string'
          ? detail.message
          : '',
    }));
  }

  return error;
}

function normalizeTrustedCreatorUid(value) {
  const uid =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (!uid) {
    throw createProductError(
      'AUTHENTICATION_REQUIRED',
      'Authentication is required.'
    );
  }

  return uid;
}

function buildProductCreateData(value) {
  return Object.freeze({
    name: value.name,
    description: value.description,
    price: value.price,
    originalPrice: value.originalPrice,
    category: value.category,
    stock: value.stock,
    sku: value.sku,
    offer: value.offer,
    image: value.image,
    images: Object.freeze([...value.images]),
    featured: value.featured,
    active: value.active,
  });
}

async function createProduct(
  payload,
  creatorUid
) {
  const trustedUid =
    normalizeTrustedCreatorUid(creatorUid);

  const {
    value,
    error,
  } = validateCreateProductInput(payload);

  if (error) {
    throw createProductError(
      'VALIDATION_FAILED',
      'Product request is invalid.',
      error.details
    );
  }

  const productData =
    buildProductCreateData(value);

  const existingProduct =
    await productRepo.findBySku(
      productData.sku
    );

  if (existingProduct) {
    throw createProductError(
      'PRODUCT_SKU_CONFLICT',
      'Product SKU already exists.'
    );
  }

  return productRepo
    .createProductWithTransaction(
      productData,
      trustedUid
    );
}

function normalizeProductId(value) {
  const productId =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (
    !productId ||
    productId.includes('/') ||
    productId.length > 128
  ) {
    throw createProductError(
      'INVALID_INPUT',
      'Product identifier is invalid.'
    );
  }

  return productId;
}

async function deactivateProduct(
  productId,
  creatorUid
) {
  const trustedUid =
    normalizeTrustedCreatorUid(creatorUid);

  const normalizedProductId =
    normalizeProductId(productId);

  if (
    typeof productRepo
      .deactivateProductWithTransaction !==
    'function'
  ) {
    throw createProductError(
      'INVALID_PRODUCT_DATA',
      'Product repository is invalid.'
    );
  }

  const result =
    await productRepo
      .deactivateProductWithTransaction(
        normalizedProductId,
        trustedUid
      );

  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    result.id !== normalizedProductId ||
    result.active !== false
  ) {
    throw createProductError(
      'INVALID_PRODUCT_DATA',
      'Product data is invalid.'
    );
  }

  return Object.freeze({
    id: normalizedProductId,
    active: false,
  });
}

module.exports = {
  createProduct,
  deactivateProduct,
};
