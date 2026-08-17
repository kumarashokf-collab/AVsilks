'use strict';

const Joi = require('joi');

const {
  MAX_ORDER_LINES,
  orderItemSchema,
  customerSchema,
  idempotencyKeySchema,
} = require('./order.validator');

const paymentSessionIdSchema = Joi.string()
  .trim()
  .min(16)
  .max(128)
  .pattern(/^paysess_[A-Za-z0-9_-]+$/)
  .required();

const razorpayOrderIdSchema = Joi.string()
  .trim()
  .min(8)
  .max(128)
  .pattern(/^order_[A-Za-z0-9_-]+$/)
  .required();

const razorpayPaymentIdSchema = Joi.string()
  .trim()
  .min(8)
  .max(128)
  .pattern(/^pay_[A-Za-z0-9_-]+$/)
  .required();

const razorpaySignatureSchema = Joi.string()
  .trim()
  .length(64)
  .pattern(/^[a-fA-F0-9]{64}$/)
  .required();

const createRazorpayOrderSchema = Joi.object({
  idempotencyKey: idempotencyKeySchema,
  customer: customerSchema.required(),
  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .max(MAX_ORDER_LINES)
    .unique('productId')
    .required(),
}).unknown(false);

const verifyRazorpayPaymentSchema = Joi.object({
  paymentSessionId: paymentSessionIdSchema,
  razorpayOrderId: razorpayOrderIdSchema,
  razorpayPaymentId: razorpayPaymentIdSchema,
  razorpaySignature: razorpaySignatureSchema,
}).unknown(false);

function validateCreateRazorpayOrderInput(payload) {
  return createRazorpayOrderSchema.validate(payload, {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  });
}

function validateVerifyRazorpayPaymentInput(payload) {
  return verifyRazorpayPaymentSchema.validate(payload, {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  });
}

module.exports = {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  validateCreateRazorpayOrderInput,
  validateVerifyRazorpayPaymentInput,
};
