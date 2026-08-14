'use strict';

const {
  validateCreateProvenanceInput,
} = require(
  '../validators/provenance.validator'
);

const {
  createProvenanceWithTransaction,
} = require(
  '../repositories/provenance.repository'
);

const PROVENANCE_SERVICE_ERROR =
  Object.freeze({
    AUTHENTICATION_REQUIRED:
      'AUTHENTICATION_REQUIRED',

    VALIDATION_FAILED:
      'VALIDATION_FAILED',

    INVALID_REPOSITORY:
      'INVALID_REPOSITORY',
  });

function createProvenanceServiceError(
  code,
  message,
  details = []
) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function formatValidationDetails(error) {
  return Array.isArray(error?.details)
    ? error.details.map((detail) => ({
        path: Array.isArray(detail.path)
          ? detail.path.join('.')
          : '',

        type:
          detail.type || '',

        message:
          detail.message || '',
      }))
    : [];
}

async function createSecureProvenance(
  {
    user,
    payload,
  } = {},
  dependencies = {}
) {
  const adminUserId =
    typeof user?.uid === 'string'
      ? user.uid.trim()
      : '';

  if (!adminUserId) {
    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated admin is required.'
    );
  }

  const validation =
    validateCreateProvenanceInput(
      payload || {}
    );

  if (validation.error) {
    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Provenance request validation failed.',
      formatValidationDetails(
        validation.error
      )
    );
  }

  const repositoryFunction =
    dependencies
      .createProvenanceWithTransaction ||
    createProvenanceWithTransaction;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Provenance repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      adminUserId,

      provenanceData:
        validation.value,
    },

    dependencies
      .repositoryDependencies
  );
}

module.exports = {
  PROVENANCE_SERVICE_ERROR,
  formatValidationDetails,
  createSecureProvenance,
};
