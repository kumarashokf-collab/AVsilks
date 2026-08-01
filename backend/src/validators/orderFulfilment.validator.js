'use strict';

const Joi = require('joi');

const {
  ADMIN_FULFILMENT_TARGET_STATUSES,
} = require('../constants/orderTransitions');

const {
  ORDER_FULFILMENT_POLICY,
} = require('../constants/orderPolicy');

const orderIdSchema = Joi.string()
  .trim()
  .min(1)
  .max(
    ORDER_FULFILMENT_POLICY
      .MAX_ORDER_ID_LENGTH
  )
  .pattern(/^[^/]+$/)
  .required();

const adminOrderTransitionParamsSchema =
  Joi.object({
    id: orderIdSchema,
  }).unknown(false);

const adminOrderTransitionInputSchema =
  Joi.object({
    status: Joi.string()
      .valid(
        ...ADMIN_FULFILMENT_TARGET_STATUSES
      )
      .required(),

    note: Joi.string()
      .trim()
      .max(
        ORDER_FULFILMENT_POLICY
          .MAX_NOTE_LENGTH
      )
      .allow('')
      .default(''),
  }).unknown(false);

function validationOptions() {
  return {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  };
}

function validateAdminOrderTransitionParams(
  params
) {
  return adminOrderTransitionParamsSchema
    .validate(
      params,
      validationOptions()
    );
}

function validateAdminOrderTransitionInput(
  payload
) {
  return adminOrderTransitionInputSchema
    .validate(
      payload,
      validationOptions()
    );
}

module.exports = {
  ADMIN_FULFILMENT_TARGET_STATUSES,
  adminOrderTransitionParamsSchema,
  adminOrderTransitionInputSchema,
  validateAdminOrderTransitionParams,
  validateAdminOrderTransitionInput,
};
