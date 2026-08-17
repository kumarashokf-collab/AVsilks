'use strict';

const {
  validateCreateArtisanInput,
} = require(
  '../validators/artisan.validator'
);

const {
  createArtisanWithTransaction,
  listActiveArtisans,
} = require(
  '../repositories/artisan.repository'
);

const ARTISAN_SERVICE_ERROR =
  Object.freeze({
    AUTHENTICATION_REQUIRED:
      'AUTHENTICATION_REQUIRED',

    VALIDATION_FAILED:
      'VALIDATION_FAILED',

    INVALID_REPOSITORY:
      'INVALID_REPOSITORY',
  });

function createArtisanServiceError(
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

async function listSecureArtisans(
  {
    user,
  } = {},
  dependencies = {}
) {
  const adminUserId =
    typeof user?.uid === 'string'
      ? user.uid.trim()
      : '';

  if (!adminUserId) {
    throw createArtisanServiceError(
      ARTISAN_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated admin is required.'
    );
  }

  const repositoryFunction =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      'listActiveArtisans'
    )
      ? dependencies.listActiveArtisans
      : listActiveArtisans;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createArtisanServiceError(
      ARTISAN_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Artisan list repository is unavailable.'
    );
  }

  const result =
    await repositoryFunction(
      dependencies
        .repositoryDependencies
    );

  if (!Array.isArray(result)) {
    throw createArtisanServiceError(
      ARTISAN_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Artisan list repository returned invalid data.'
    );
  }

  return result;
}

async function createSecureArtisan(
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
    throw createArtisanServiceError(
      ARTISAN_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated admin is required.'
    );
  }

  const validation =
    validateCreateArtisanInput(
      payload || {}
    );

  if (validation.error) {
    throw createArtisanServiceError(
      ARTISAN_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Artisan request validation failed.',
      formatValidationDetails(
        validation.error
      )
    );
  }

  const repositoryFunction =
    dependencies
      .createArtisanWithTransaction ||
    createArtisanWithTransaction;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createArtisanServiceError(
      ARTISAN_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Artisan repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      adminUserId,

      artisanData:
        validation.value,
    },

    dependencies
      .repositoryDependencies
  );
}

module.exports = {
  ARTISAN_SERVICE_ERROR,
  formatValidationDetails,
  createSecureArtisan,
  listSecureArtisans,
};
