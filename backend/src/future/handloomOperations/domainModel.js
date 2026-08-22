'use strict';

const {
  assertFutureParkBoundary,
} = require(
  './futureParkGuard'
);

const HANDLOOM_DOMAIN =
  Object.freeze({
    ARTISAN_OPERATION:
      'artisan-operation',

    COOPERATIVE_OPERATION:
      'cooperative-operation',

    PROGRAM:
      'program',

    PROGRAM_ENROLLMENT:
      'program-enrollment',

    INSPECTION:
      'inspection',

    VERIFICATION_EVIDENCE:
      'verification-evidence',

    GRIEVANCE:
      'grievance',

    BENEFIT:
      'benefit',

    PROVENANCE_LINK:
      'provenance-link',

    GOVERNMENT_REPORT:
      'government-report',

    FIELD_OPERATION:
      'field-operation',
  });

const HANDLOOM_WORKFLOW_STATE =
  Object.freeze({
    DRAFT:
      'draft',

    SUBMITTED:
      'submitted',

    UNDER_REVIEW:
      'under-review',

    VERIFIED_INTERNAL:
      'verified-internal',

    REJECTED:
      'rejected',

    SUSPENDED:
      'suspended',

    CLOSED:
      'closed',
  });

const DOMAIN_DEFINITIONS =
  Object.freeze({
    [HANDLOOM_DOMAIN.ARTISAN_OPERATION]:
      Object.freeze({
        canonicalId:
          'artisanId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.COOPERATIVE_OPERATION]:
      Object.freeze({
        canonicalId:
          'cooperativeId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.PROGRAM]:
      Object.freeze({
        canonicalId:
          'programId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.PROGRAM_ENROLLMENT]:
      Object.freeze({
        canonicalId:
          'enrollmentId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.INSPECTION]:
      Object.freeze({
        canonicalId:
          'inspectionId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.VERIFICATION_EVIDENCE]:
      Object.freeze({
        canonicalId:
          'evidenceReferenceId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.GRIEVANCE]:
      Object.freeze({
        canonicalId:
          'grievanceId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.BENEFIT]:
      Object.freeze({
        canonicalId:
          'benefitId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.PROVENANCE_LINK]:
      Object.freeze({
        canonicalId:
          'provenanceLinkId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.GOVERNMENT_REPORT]:
      Object.freeze({
        canonicalId:
          'reportId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),

    [HANDLOOM_DOMAIN.FIELD_OPERATION]:
      Object.freeze({
        canonicalId:
          'fieldOperationId',

        authoritativeForGovernmentApproval:
          false,

        publicByDefault:
          false,
      }),
  });

function normalizeIdentifier(
  value
) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isKnownHandloomDomain(
  value
) {
  return Object.values(
    HANDLOOM_DOMAIN
  ).includes(value);
}

function isKnownWorkflowState(
  value
) {
  return Object.values(
    HANDLOOM_WORKFLOW_STATE
  ).includes(value);
}

function getHandloomDomainDefinition(
  domain
) {
  assertFutureParkBoundary();

  if (
    !isKnownHandloomDomain(domain)
  ) {
    const error =
      new Error(
        'Unknown Future Handloom domain.'
      );

    error.code =
      'UNKNOWN_FUTURE_HANDLOOM_DOMAIN';

    throw error;
  }

  return DOMAIN_DEFINITIONS[
    domain
  ];
}

function validateFutureHandloomRecordIdentity({
  domain,
  id,
  workflowState,
} = {}) {
  assertFutureParkBoundary();

  const normalizedId =
    normalizeIdentifier(id);

  if (
    !isKnownHandloomDomain(domain)
  ) {
    return Object.freeze({
      valid: false,
      code:
        'INVALID_HANDLOOM_DOMAIN',
    });
  }

  if (
    !normalizedId ||
    normalizedId.includes('/') ||
    normalizedId.length > 128
  ) {
    return Object.freeze({
      valid: false,
      code:
        'INVALID_CANONICAL_ID',
    });
  }

  if (
    !isKnownWorkflowState(
      workflowState
    )
  ) {
    return Object.freeze({
      valid: false,
      code:
        'INVALID_WORKFLOW_STATE',
    });
  }

  return Object.freeze({
    valid: true,
    domain,
    id: normalizedId,
    workflowState,
  });
}

function assertDomainRegistrySafety() {
  assertFutureParkBoundary();

  const domains =
    Object.values(
      HANDLOOM_DOMAIN
    );

  const uniqueDomains =
    new Set(domains);

  if (
    domains.length !==
    uniqueDomains.size
  ) {
    throw new Error(
      'Future Handloom domain IDs must be unique.'
    );
  }

  for (
    const domain of domains
  ) {
    const definition =
      DOMAIN_DEFINITIONS[
        domain
      ];

    if (
      !definition ||
      typeof definition
        .canonicalId !==
        'string' ||
      !definition
        .canonicalId ||
      definition
        .authoritativeForGovernmentApproval !==
        false ||
      definition
        .publicByDefault !==
        false
    ) {
      throw new Error(
        'Unsafe Future Handloom domain definition.'
      );
    }
  }

  return true;
}

module.exports = {
  HANDLOOM_DOMAIN,
  HANDLOOM_WORKFLOW_STATE,
  DOMAIN_DEFINITIONS,
  normalizeIdentifier,
  isKnownHandloomDomain,
  isKnownWorkflowState,
  getHandloomDomainDefinition,
  validateFutureHandloomRecordIdentity,
  assertDomainRegistrySafety,
};
