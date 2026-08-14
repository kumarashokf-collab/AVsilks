'use strict';

const Joi = require('joi');

const {
  ARTISAN_LIMITS,
} = require('../constants/provenancePolicy');

const artisanCodeSchema = Joi.string()
  .trim()
  .min(1)
  .max(ARTISAN_LIMITS.ARTISAN_CODE_MAX_LENGTH)
  .pattern(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

const displayNameSchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.DISPLAY_NAME_MAX_LENGTH);

const craftTypeSchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.CRAFT_TYPE_MAX_LENGTH);

const villageSchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.VILLAGE_MAX_LENGTH);

const districtSchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.DISTRICT_MAX_LENGTH);

const stateSchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.STATE_MAX_LENGTH);

const countrySchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.COUNTRY_MAX_LENGTH);

const loomTypeSchema = Joi.string()
  .trim()
  .min(2)
  .max(ARTISAN_LIMITS.LOOM_TYPE_MAX_LENGTH);

const createArtisanSchema = Joi.object({
  artisanCode: artisanCodeSchema.required(),
  displayName: displayNameSchema.required(),
  craftType: craftTypeSchema.required(),
  village: villageSchema.required(),
  district: districtSchema.required(),
  state: stateSchema.required(),
  country: countrySchema.required(),
  loomType: loomTypeSchema.required(),
  active: Joi.boolean().default(true),
}).unknown(false);

const updateArtisanSchema = Joi.object({
  displayName: displayNameSchema,
  craftType: craftTypeSchema,
  village: villageSchema,
  district: districtSchema,
  state: stateSchema,
  country: countrySchema,
  loomType: loomTypeSchema,
  active: Joi.boolean(),
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

function validateCreateArtisanInput(payload) {
  return createArtisanSchema.validate(
    payload,
    validationOptions()
  );
}

function validateUpdateArtisanInput(payload) {
  return updateArtisanSchema.validate(
    payload,
    validationOptions()
  );
}

module.exports = {
  artisanCodeSchema,
  createArtisanSchema,
  updateArtisanSchema,
  validateCreateArtisanInput,
  validateUpdateArtisanInput,
};
