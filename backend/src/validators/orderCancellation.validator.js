'use strict';

const Joi = require('joi');

const {
  ORDER_CANCELLATION_POLICY,
} = require('../constants/orderPolicy');

const orderIdSchema = Joi.string()
  .trim()
  .min(1)
  .max(
    ORDER_CANCELLATION_POLICY
      .MAX_ORDER_ID_LENGTH
  )
  .pattern(/^[^/]+$/)
  .required();

const cancelOrderParamsSchema = Joi.object({
  id: orderIdSchema,
}).unknown(false);

const cancelOrderInputSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .min(
      ORDER_CANCELLATION_POLICY
        .MIN_REASON_LENGTH
    )
    .max(
      ORDER_CANCELLATION_POLICY
        .MAX_REASON_LENGTH
    )
    .required(),
}).unknown(false);

function validationOptions() {
  return {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  };
}

function validateCancelOrderParams(params) {
  return cancelOrderParamsSchema.validate(
    params,
    validationOptions()
  );
}

function validateCancelOrderInput(payload) {
  return cancelOrderInputSchema.validate(
    payload,
    validationOptions()
  );
}

module.exports = {
  orderIdSchema,
  cancelOrderParamsSchema,
  cancelOrderInputSchema,
  validateCancelOrderParams,
  validateCancelOrderInput,
};
