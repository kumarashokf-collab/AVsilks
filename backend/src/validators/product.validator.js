'use strict';

const Joi = require('joi');

const PRODUCT_LIMITS = Object.freeze({
  NAME_MAX_LENGTH: 160,
  DESCRIPTION_MAX_LENGTH: 3000,
  CATEGORY_MAX_LENGTH: 100,
  SKU_MAX_LENGTH: 64,
  OFFER_MAX_LENGTH: 64,
  IMAGE_URL_MAX_LENGTH: 2048,
  MAX_IMAGES: 5,
  MAX_PRICE: 10000000,
  MAX_STOCK: 1000000,
});

const textSchema = (maxLength) =>
  Joi.string()
    .trim()
    .max(maxLength);

const imageUrlSchema = Joi.string()
  .trim()
  .max(PRODUCT_LIMITS.IMAGE_URL_MAX_LENGTH)
  .uri({
    scheme: ['https'],
  });

const skuSchema = Joi.string()
  .trim()
  .uppercase()
  .min(1)
  .max(PRODUCT_LIMITS.SKU_MAX_LENGTH)
  .pattern(/^[A-Z0-9][A-Z0-9_-]*$/);

const moneySchema = Joi.number()
  .positive()
  .max(PRODUCT_LIMITS.MAX_PRICE)
  .precision(2);

const stockSchema = Joi.number()
  .integer()
  .min(0)
  .max(PRODUCT_LIMITS.MAX_STOCK);

const createProductSchema = Joi.object({
  name: textSchema(
    PRODUCT_LIMITS.NAME_MAX_LENGTH
  )
    .min(2)
    .required(),

  description: textSchema(
    PRODUCT_LIMITS.DESCRIPTION_MAX_LENGTH
  )
    .allow('')
    .default(''),

  price: moneySchema.required(),

  originalPrice: moneySchema.required(),

  category: textSchema(
    PRODUCT_LIMITS.CATEGORY_MAX_LENGTH
  )
    .min(1)
    .required(),

  stock: stockSchema.required(),

  sku: skuSchema.required(),

  offer: textSchema(
    PRODUCT_LIMITS.OFFER_MAX_LENGTH
  )
    .allow('')
    .default(''),

  image: imageUrlSchema.required(),

  images: Joi.array()
    .items(imageUrlSchema)
    .min(1)
    .max(PRODUCT_LIMITS.MAX_IMAGES)
    .unique()
    .required(),

  featured: Joi.boolean().default(false),

  active: Joi.boolean().default(true),
})
  .custom((value, helpers) => {
    if (value.originalPrice < value.price) {
      return helpers.error(
        'product.originalPriceBelowPrice'
      );
    }

    return value;
  })
  .messages({
    'product.originalPriceBelowPrice':
      '"originalPrice" must be greater than or equal to "price"',
  })
  .unknown(false);

function validationOptions() {
  return {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  };
}

function validateCreateProductInput(payload) {
  return createProductSchema.validate(
    payload,
    validationOptions()
  );
}

module.exports = {
  PRODUCT_LIMITS,
  imageUrlSchema,
  skuSchema,
  createProductSchema,
  validateCreateProductInput,
};
