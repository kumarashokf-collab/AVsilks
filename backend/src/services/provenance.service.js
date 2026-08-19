'use strict';

const {
  documentIdSchema,
  validateCreateProvenanceInput,
} = require(
  '../validators/provenance.validator'
);

const {
  PROVENANCE_STATUS,
} = require(
  '../constants/provenancePolicy'
);

const {
  createProvenanceWithTransaction,
  transitionProvenanceStatusWithTransaction,
  getPublishedProvenanceByPublicId,
  getProvenanceById,
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


function validateLifecycleId(params) {
  const validation =
    documentIdSchema
      .required()
      .validate(
        params?.id,
        {
          abortEarly: false,
          convert: true,
          stripUnknown: false,
        }
      );

  if (validation.error) {
    const details =
      formatValidationDetails(
        validation.error
      ).map((detail) => ({
        ...detail,
        path:
          detail.path
            ? 'id.' + detail.path
            : 'id',
      }));

    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Provenance lifecycle request validation failed.',
      details
    );
  }

  return validation.value;
}

async function transitionSecureProvenance(
  {
    user,
    params,
  } = {},
  nextStatus,
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

  const provenanceId =
    validateLifecycleId(
      params || {}
    );

  const repositoryFunction =
    dependencies
      .transitionProvenanceStatusWithTransaction ||
    transitionProvenanceStatusWithTransaction;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Provenance lifecycle repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      adminUserId,
      provenanceId,
      nextStatus,
    },
    dependencies
      .repositoryDependencies
  );
}

async function publishSecureProvenance(
  input = {},
  dependencies = {}
) {
  return transitionSecureProvenance(
    input,
    PROVENANCE_STATUS.PUBLISHED,
    dependencies
  );
}

async function archiveSecureProvenance(
  input = {},
  dependencies = {}
) {
  return transitionSecureProvenance(
    input,
    PROVENANCE_STATUS.ARCHIVED,
    dependencies
  );
}


function validatePublicProvenanceId(
  params
) {
  const validation =
    documentIdSchema
      .required()
      .validate(
        params?.publicId,
        {
          abortEarly: false,
          convert: true,
          stripUnknown: false,
        }
      );

  if (validation.error) {
    const details =
      formatValidationDetails(
        validation.error
      ).map((detail) => ({
        ...detail,
        path:
          detail.path
            ? 'publicId.' + detail.path
            : 'publicId',
      }));

    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Public provenance verification validation failed.',
      details
    );
  }

  return validation.value;
}

async function getPublicProvenance(
  {
    params,
  } = {},
  dependencies = {}
) {
  const publicId =
    validatePublicProvenanceId(
      params || {}
    );

  const repositoryFunction =
    dependencies
      .getPublishedProvenanceByPublicId ||
    getPublishedProvenanceByPublicId;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Public provenance repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      publicId,
    },
    dependencies
      .repositoryDependencies
  );
}


function validateManagementReadId(
  params
) {
  const validation =
    documentIdSchema
      .required()
      .validate(
        params?.id,
        {
          abortEarly: false,
          convert: true,
          stripUnknown: false,
        }
      );

  if (validation.error) {
    const details =
      formatValidationDetails(
        validation.error
      ).map((detail) => ({
        ...detail,
        path:
          detail.path
            ? 'id.' + detail.path
            : 'id',
      }));

    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Provenance read request validation failed.',
      details
    );
  }

  return validation.value;
}

async function getSecureProvenance(
  {
    user,
    params,
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

  const provenanceId =
    validateManagementReadId(
      params || {}
    );

  const repositoryFunction =
    dependencies
      .getProvenanceById ||
    getProvenanceById;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createProvenanceServiceError(
      PROVENANCE_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Provenance read repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      provenanceId,
    },
    dependencies
      .repositoryDependencies
  );
}

module.exports = {
  PROVENANCE_SERVICE_ERROR,
  formatValidationDetails,
  createSecureProvenance,
  publishSecureProvenance,
  archiveSecureProvenance,
  getPublicProvenance,
  getSecureProvenance,
};
