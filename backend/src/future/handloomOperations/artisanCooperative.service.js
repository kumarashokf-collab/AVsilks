'use strict';

const {
  assertFutureParkBoundary,
} = require(
  './futureParkGuard'
);

const {
  HANDLOOM_DOMAIN,
} = require(
  './domainModel'
);

const {
  validateCooperativeOperation,
  validateArtisanOperation,
  validateMembershipOperation,
} = require(
  './artisanCooperative.validator'
);

const MEMBERSHIP_TRANSITIONS =
  Object.freeze({
    draft:
      Object.freeze([
        'submitted',
      ]),

    submitted:
      Object.freeze([
        'under-review',
      ]),

    'under-review':
      Object.freeze([
        'verified-internal',
        'rejected',
      ]),

    'verified-internal':
      Object.freeze([
        'suspended',
        'closed',
      ]),

    rejected:
      Object.freeze([
        'closed',
      ]),

    suspended:
      Object.freeze([
        'verified-internal',
        'closed',
      ]),

    closed:
      Object.freeze([]),
  });

function createOperationError(
  code,
  message,
  details = []
) {
  const error =
    new Error(message);

  error.code =
    code;

  error.details =
    Array.isArray(details)
      ? details
      : [];

  return error;
}

function formatValidationError(
  validation
) {
  if (
    !validation?.error
  ) {
    return [];
  }

  if (
    validation.error.code ===
      'SENSITIVE_HANDLOOM_FIELD_PROHIBITED'
  ) {
    return [
      Object.freeze({
        path:
          validation.error.field ||
          '',
        type:
          'sensitive-field',
        message:
          'Sensitive Handloom field is prohibited.',
      }),
    ];
  }

  return Array.isArray(
    validation.error.details
  )
    ? validation.error.details.map(
        (detail) =>
          Object.freeze({
            path:
              Array.isArray(
                detail?.path
              )
                ? detail.path.join('.')
                : '',
            type:
              typeof detail?.type ===
                'string'
                ? detail.type
                : '',
            message:
              typeof detail?.message ===
                'string'
                ? detail.message
                : '',
          })
      )
    : [];
}

function requireValid(
  validation,
  entityName
) {
  if (
    validation?.error
  ) {
    throw createOperationError(
      validation.error.code ===
        'SENSITIVE_HANDLOOM_FIELD_PROHIBITED'
        ? validation.error.code
        : 'HANDLOOM_OPERATION_VALIDATION_FAILED',
      `${entityName} is invalid.`,
      formatValidationError(
        validation
      )
    );
  }

  return validation.value;
}

function createCooperativeOperationRecord(
  payload
) {
  assertFutureParkBoundary();

  const value =
    requireValid(
      validateCooperativeOperation(
        payload
      ),
      'Cooperative operation'
    );

  return Object.freeze({
    domain:
      HANDLOOM_DOMAIN
        .COOPERATIVE_OPERATION,

    cooperativeId:
      value.cooperativeId,

    displayName:
      value.displayName,

    cooperativeType:
      value.cooperativeType,

    district:
      value.district,

    state:
      value.state,

    country:
      value.country,

    active:
      value.active === true,

    governmentCertified:
      false,

    governmentAuthoritySource:
      null,
  });
}

function createArtisanOperationRecord(
  payload
) {
  assertFutureParkBoundary();

  const value =
    requireValid(
      validateArtisanOperation(
        payload
      ),
      'Artisan operation'
    );

  return Object.freeze({
    domain:
      HANDLOOM_DOMAIN
        .ARTISAN_OPERATION,

    operationId:
      value.operationId,

    artisanId:
      value.artisanId,

    cooperativeId:
      value.cooperativeId || null,

    craftRole:
      value.craftRole,

    serviceArea:
      value.serviceArea || null,

    active:
      value.active === true,

    baseArtisanProfileAuthority:
      'existing-artisan-domain',

    governmentVerified:
      false,
  });
}

function createMembershipRecord(
  payload
) {
  assertFutureParkBoundary();

  const value =
    requireValid(
      validateMembershipOperation(
        payload
      ),
      'Artisan cooperative membership'
    );

  return Object.freeze({
    domain:
      'artisan-cooperative-membership',

    membershipId:
      value.membershipId,

    artisanId:
      value.artisanId,

    cooperativeId:
      value.cooperativeId,

    membershipRole:
      value.membershipRole,

    workflowState:
      value.workflowState,

    governmentApproved:
      false,

    officialCertification:
      null,

    version:
      1,
  });
}

function isAllowedMembershipTransition(
  fromState,
  toState
) {
  assertFutureParkBoundary();

  const allowed =
    MEMBERSHIP_TRANSITIONS[
      fromState
    ];

  return Array.isArray(
    allowed
  ) &&
    allowed.includes(
      toState
    );
}

function transitionMembershipRecord(
  record,
  toState
) {
  assertFutureParkBoundary();

  if (
    !record ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    typeof record.membershipId !==
      'string' ||
    typeof record.artisanId !==
      'string' ||
    typeof record.cooperativeId !==
      'string' ||
    typeof record.workflowState !==
      'string' ||
    !Number.isSafeInteger(
      record.version
    ) ||
    record.version < 1
  ) {
    throw createOperationError(
      'INVALID_MEMBERSHIP_RECORD',
      'Membership record is invalid.'
    );
  }

  if (
    !isAllowedMembershipTransition(
      record.workflowState,
      toState
    )
  ) {
    throw createOperationError(
      'INVALID_MEMBERSHIP_TRANSITION',
      'Membership workflow transition is not allowed.'
    );
  }

  return Object.freeze({
    ...record,

    workflowState:
      toState,

    governmentApproved:
      false,

    officialCertification:
      null,

    version:
      record.version + 1,
  });
}

module.exports = {
  MEMBERSHIP_TRANSITIONS,
  createOperationError,
  formatValidationError,
  createCooperativeOperationRecord,
  createArtisanOperationRecord,
  createMembershipRecord,
  isAllowedMembershipTransition,
  transitionMembershipRecord,
};
