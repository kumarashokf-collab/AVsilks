'use strict';

const Joi = require('joi');

const {
  PROVENANCE_LIMITS,
} = require('../constants/provenancePolicy');

const documentIdSchema = Joi.string()
  .trim()
  .min(1)
  .max(PROVENANCE_LIMITS.DOCUMENT_ID_MAX_LENGTH)
  .pattern(/^[^/]+$/);

const materialSchema = Joi.string()
  .trim()
  .min(2)
  .max(PROVENANCE_LIMITS.MATERIAL_MAX_LENGTH);

const weaveTechniqueSchema = Joi.string()
  .trim()
  .min(2)
  .max(PROVENANCE_LIMITS.WEAVE_TECHNIQUE_MAX_LENGTH);

const loomTypeSchema = Joi.string()
  .trim()
  .min(2)
  .max(PROVENANCE_LIMITS.LOOM_TYPE_MAX_LENGTH);

const originSchema = Joi.object({
  village: Joi.string()
    .trim()
    .min(2)
    .max(PROVENANCE_LIMITS.ORIGIN_VILLAGE_MAX_LENGTH)
    .required(),

  district: Joi.string()
    .trim()
    .min(2)
    .max(PROVENANCE_LIMITS.ORIGIN_DISTRICT_MAX_LENGTH)
    .required(),

  state: Joi.string()
    .trim()
    .min(2)
    .max(PROVENANCE_LIMITS.ORIGIN_STATE_MAX_LENGTH)
    .required(),

  country: Joi.string()
    .trim()
    .min(2)
    .max(PROVENANCE_LIMITS.ORIGIN_COUNTRY_MAX_LENGTH)
    .required(),
}).unknown(false);

const createProvenanceSchema = Joi.object({
  productId: documentIdSchema.required(),
  artisanId: documentIdSchema.required(),
  material: materialSchema.required(),
  weaveTechnique: weaveTechniqueSchema.required(),
  loomType: loomTypeSchema.required(),
  origin: originSchema.required(),
}).unknown(false);

const updateProvenanceSchema = Joi.object({
  material: materialSchema,
  weaveTechnique: weaveTechniqueSchema,
  loomType: loomTypeSchema,
  origin: originSchema,
})
  .min(1)
  .unknown(false);

function validationOptions() {
  return {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  };
}

function validateCreateProvenanceInput(payload) {
  return createProvenanceSchema.validate(
    payload,
    validationOptions()
  );
}

function validateUpdateProvenanceInput(payload) {
  return updateProvenanceSchema.validate(
    payload,
    validationOptions()
  );
}

module.exports = {
  documentIdSchema,
  originSchema,
  createProvenanceSchema,
  updateProvenanceSchema,
  validateCreateProvenanceInput,
  validateUpdateProvenanceInput,
};
