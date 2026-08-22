'use strict';

const Joi =
  require('joi');

const {
  assertFutureParkBoundary,
} = require(
  './futureParkGuard'
);

const ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

const FORBIDDEN_SENSITIVE_KEYS =
  Object.freeze(
    new Set([
      'aadhaar',
      'aadhaarnumber',
      'governmentid',
      'govid',
      'governmentidentity',
      'kyc',
      'kycdocument',
      'kycdocumentnumber',
      'bankaccount',
      'bankaccountnumber',
      'accountnumber',
      'ifsc',
      'ifsccode',
    ])
  );

const COOPERATIVE_TYPES =
  Object.freeze([
    'cooperative-society',
    'producer-group',
    'self-help-group',
    'cluster',
    'other',
  ]);

const ARTISAN_OPERATION_ROLES =
  Object.freeze([
    'weaver',
    'master-weaver',
    'dyer',
    'designer',
    'finisher',
    'quality-assistant',
    'other',
  ]);

const MEMBERSHIP_ROLES =
  Object.freeze([
    'member',
    'lead-member',
    'coordinator',
    'operator',
  ]);

const WORKFLOW_STATES =
  Object.freeze([
    'draft',
    'submitted',
    'under-review',
    'verified-internal',
    'rejected',
    'suspended',
    'closed',
  ]);

const idSchema =
  Joi.string()
    .trim()
    .min(1)
    .max(128)
    .pattern(ID_PATTERN);

const safeText =
  Joi.string()
    .trim()
    .min(2)
    .max(120);

const cooperativeSchema =
  Joi.object({
    cooperativeId:
      idSchema.required(),

    displayName:
      safeText.required(),

    cooperativeType:
      Joi.string()
        .valid(
          ...COOPERATIVE_TYPES
        )
        .required(),

    district:
      safeText.required(),

    state:
      safeText.required(),

    country:
      safeText.required(),

    active:
      Joi.boolean()
        .default(true),
  })
    .unknown(false);

const artisanOperationSchema =
  Joi.object({
    operationId:
      idSchema.required(),

    artisanId:
      idSchema.required(),

    cooperativeId:
      idSchema.allow(null),

    craftRole:
      Joi.string()
        .valid(
          ...ARTISAN_OPERATION_ROLES
        )
        .required(),

    serviceArea:
      safeText.allow(null),

    active:
      Joi.boolean()
        .default(true),
  })
    .unknown(false);

const membershipSchema =
  Joi.object({
    membershipId:
      idSchema.required(),

    artisanId:
      idSchema.required(),

    cooperativeId:
      idSchema.required(),

    membershipRole:
      Joi.string()
        .valid(
          ...MEMBERSHIP_ROLES
        )
        .required(),

    workflowState:
      Joi.string()
        .valid(
          ...WORKFLOW_STATES
        )
        .required(),
  })
    .unknown(false);

function validationOptions() {
  return {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  };
}

function normalizeKey(
  key
) {
  return typeof key === 'string'
    ? key
        .replace(
          /[^A-Za-z0-9]/g,
          ''
        )
        .toLowerCase()
    : '';
}

function findForbiddenSensitiveKey(
  value
) {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null;
  }

  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      const match =
        findForbiddenSensitiveKey(
          item
        );

      if (match) {
        return match;
      }
    }

    return null;
  }

  for (
    const [
      key,
      nestedValue,
    ] of Object.entries(
      value
    )
  ) {
    const normalized =
      normalizeKey(key);

    if (
      FORBIDDEN_SENSITIVE_KEYS
        .has(normalized)
    ) {
      return key;
    }

    const nestedMatch =
      findForbiddenSensitiveKey(
        nestedValue
      );

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function rejectSensitiveFields(
  payload
) {
  assertFutureParkBoundary();

  const forbiddenKey =
    findForbiddenSensitiveKey(
      payload
    );

  if (forbiddenKey) {
    return Object.freeze({
      valid: false,
      code:
        'SENSITIVE_HANDLOOM_FIELD_PROHIBITED',
      field:
        forbiddenKey,
    });
  }

  return null;
}

function validateWithSchema(
  schema,
  payload
) {
  assertFutureParkBoundary();

  const sensitive =
    rejectSensitiveFields(
      payload
    );

  if (sensitive) {
    return {
      error: Object.assign(
        new Error(
          'Sensitive Handloom field is prohibited.'
        ),
        {
          code:
            sensitive.code,
          field:
            sensitive.field,
        }
      ),
      value: undefined,
    };
  }

  return schema.validate(
    payload,
    validationOptions()
  );
}

function validateCooperativeOperation(
  payload
) {
  return validateWithSchema(
    cooperativeSchema,
    payload
  );
}

function validateArtisanOperation(
  payload
) {
  return validateWithSchema(
    artisanOperationSchema,
    payload
  );
}

function validateMembershipOperation(
  payload
) {
  return validateWithSchema(
    membershipSchema,
    payload
  );
}

module.exports = {
  ID_PATTERN,
  FORBIDDEN_SENSITIVE_KEYS,
  COOPERATIVE_TYPES,
  ARTISAN_OPERATION_ROLES,
  MEMBERSHIP_ROLES,
  WORKFLOW_STATES,
  cooperativeSchema,
  artisanOperationSchema,
  membershipSchema,
  normalizeKey,
  findForbiddenSensitiveKey,
  rejectSensitiveFields,
  validateCooperativeOperation,
  validateArtisanOperation,
  validateMembershipOperation,
};
