'use strict';

const Joi = require('joi');

const {
  ORDER_LIMITS,
  IDEMPOTENCY_POLICY,
} = require('../constants/orderPolicy');

const {
  MAX_ORDER_LINES,
  MAX_ITEM_QUANTITY,
} = ORDER_LIMITS;

const productIdSchema = Joi.string()
  .trim()
  .min(1)
  .max(128)
  .pattern(/^[^/]+$/)
  .required();

const orderItemSchema = Joi.object({
  productId: productIdSchema,
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(MAX_ITEM_QUANTITY)
    .required(),
}).unknown(false);

const addressSchema = Joi.object({
  house: Joi.string().trim().min(1).max(120).required(),
  street: Joi.string().trim().min(1).max(160).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().min(2).max(80).required(),
  pin: Joi.string()
    .trim()
    .pattern(/^[0-9]{6}$/)
    .required(),
}).unknown(false);

const customerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9][0-9]{9}$/)
    .required(),
  address: addressSchema.required(),
}).unknown(false);

const idempotencyKeySchema = Joi.string()
  .trim()
  .min(IDEMPOTENCY_POLICY.MIN_KEY_LENGTH)
  .max(IDEMPOTENCY_POLICY.MAX_KEY_LENGTH)
  .pattern(
    /^[A-Za-z0-9][A-Za-z0-9_-]*$/
  )
  .required();

const createOrderSchema = Joi.object({
  idempotencyKey: idempotencyKeySchema,
  customer: customerSchema.required(),

  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .max(MAX_ORDER_LINES)
    .unique('productId')
    .required(),

  paymentMethod: Joi.string()
    .valid('cod')
    .default('cod'),
}).unknown(false);

function validateCreateOrderInput(payload) {
  return createOrderSchema.validate(payload, {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  });
}

module.exports = {
  MAX_ORDER_LINES,
  MAX_ITEM_QUANTITY,
  createOrderSchema,
  validateCreateOrderInput,
};
