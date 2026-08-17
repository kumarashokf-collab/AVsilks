'use strict';

const productService =
  require('../services/product.service');

const {
  db,
} = require('../config/firebase');

function sanitizeValidationDetails(details) {
  return Array.isArray(details)
    ? details.map((detail) => ({
        path:
          typeof detail?.path === 'string'
            ? detail.path
            : '',
        type:
          typeof detail?.type === 'string'
            ? detail.type
            : '',
        message:
          typeof detail?.message === 'string'
            ? detail.message
            : '',
      }))
    : [];
}

function sanitizeProductResponse(product) {
  const source =
    product &&
    typeof product === 'object' &&
    !Array.isArray(product)
      ? product
      : {};

  return Object.freeze({
    id:
      typeof source.id === 'string'
        ? source.id
        : '',
    name:
      typeof source.name === 'string'
        ? source.name
        : '',
    description:
      typeof source.description === 'string'
        ? source.description
        : '',
    price:
      Number.isFinite(source.price)
        ? source.price
        : 0,
    originalPrice:
      Number.isFinite(source.originalPrice)
        ? source.originalPrice
        : 0,
    category:
      typeof source.category === 'string'
        ? source.category
        : '',
    stock:
      Number.isInteger(source.stock)
        ? source.stock
        : 0,
    sku:
      typeof source.sku === 'string'
        ? source.sku
        : '',
    offer:
      typeof source.offer === 'string'
        ? source.offer
        : '',
    image:
      typeof source.image === 'string'
        ? source.image
        : '',
    images:
      Array.isArray(source.images)
        ? source.images
            .filter(
              (value) =>
                typeof value === 'string'
            )
            .slice(0, 5)
        : [],
    featured:
      source.featured === true,
    active:
      source.active !== false,
  });
}

function mapProductError(error) {
  switch (error?.code) {
    case 'AUTHENTICATION_REQUIRED':
      return {
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message:
          'Authentication is required.',
      };

    case 'VALIDATION_FAILED':
    case 'INVALID_INPUT':
      return {
        status: 400,
        code: 'PRODUCT_VALIDATION_FAILED',
        message:
          'Product request is invalid.',
        details:
          sanitizeValidationDetails(
            error?.details
          ),
      };

    case 'PRODUCT_SKU_CONFLICT':
      return {
        status: 409,
        code: 'PRODUCT_SKU_CONFLICT',
        message:
          'Product SKU already exists.',
      };

    case 'PRODUCT_NOT_FOUND':
      return {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message:
          'Product was not found.',
      };

    case 'INVALID_PRODUCT_DATA':
      return {
        status: 500,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to process product request.',
      };

    default:
      return {
        status: 500,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to process product request.',
      };
  }
}

async function createProduct(req, res) {
  try {
    const product =
      await productService.createProduct(
        req?.body,
        req?.user?.uid
      );

    return res
      .status(201)
      .json({
        success: true,
        data:
          sanitizeProductResponse(
            product
          ),
      });
  } catch (error) {
    const mapped =
      mapProductError(error);

    const body = {
      success: false,
      code: mapped.code,
      message: mapped.message,
    };

    if (
      mapped.status === 400 &&
      Array.isArray(mapped.details) &&
      mapped.details.length > 0
    ) {
      body.details = mapped.details;
    }

    return res
      .status(mapped.status)
      .json(body);
  }
}

async function deactivateProduct(req, res) {
  try {
    const result =
      await productService.deactivateProduct(
        req?.params?.id,
        req?.user?.uid
      );

    const id =
      typeof result?.id === 'string'
        ? result.id.trim()
        : '';

    if (
      !id ||
      id.includes('/') ||
      result?.active !== false
    ) {
      return res
        .status(500)
        .json({
          success: false,
          code: 'INTERNAL_ERROR',
          message:
            'Unable to process product request.',
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: {
          id,
          active: false,
        },
      });
  } catch (error) {
    const mapped =
      mapProductError(error);

    return res
      .status(mapped.status)
      .json({
        success: false,
        code: mapped.code,
        message: mapped.message,
      });
  }
}

async function getProducts(req, res) {
  try {
    const snapshot =
      await db
        .collection('products')
        .get();

    const products =
      snapshot.docs.map((document) =>
        sanitizeProductResponse({
          id: document.id,
          ...document.data(),
        })
      );

    return res
      .status(200)
      .json({
        success: true,
        data: products,
      });
  } catch {
    return res
      .status(500)
      .json({
        success: false,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to load products.',
      });
  }
}

module.exports = {
  sanitizeValidationDetails,
  sanitizeProductResponse,
  mapProductError,
  createProduct,
  deactivateProduct,
  getProducts,
};
