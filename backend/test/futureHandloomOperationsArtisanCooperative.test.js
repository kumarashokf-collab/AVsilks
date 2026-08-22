'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const {
  validateCooperativeOperation,
  validateArtisanOperation,
  validateMembershipOperation,
  rejectSensitiveFields,
} = require(
  '../src/future/handloomOperations/artisanCooperative.validator'
);

const {
  MEMBERSHIP_TRANSITIONS,
  createCooperativeOperationRecord,
  createArtisanOperationRecord,
  createMembershipRecord,
  isAllowedMembershipTransition,
  transitionMembershipRecord,
} = require(
  '../src/future/handloomOperations/artisanCooperative.service'
);

test(
  'cooperative operation remains internal and non-government-authoritative',
  () => {
    const validation =
      validateCooperativeOperation({
        cooperativeId:
          'coop_demo_001',
        displayName:
          'Demo Weaver Group',
        cooperativeType:
          'producer-group',
        district:
          'Demo District',
        state:
          'Demo State',
        country:
          'India',
        active:
          true,
      });

    assert.equal(
      validation.error,
      undefined
    );

    const record =
      createCooperativeOperationRecord(
        validation.value
      );

    assert.equal(
      record.cooperativeId,
      'coop_demo_001'
    );

    assert.equal(
      record.governmentCertified,
      false
    );

    assert.equal(
      record.governmentAuthoritySource,
      null
    );

    assert.equal(
      Object.isFrozen(record),
      true
    );
  }
);

test(
  'artisan operation references existing artisan authority instead of duplicating identity',
  () => {
    const validation =
      validateArtisanOperation({
        operationId:
          'artop_demo_001',
        artisanId:
          'art_demo_001',
        cooperativeId:
          'coop_demo_001',
        craftRole:
          'weaver',
        serviceArea:
          'Demo Cluster',
        active:
          true,
      });

    assert.equal(
      validation.error,
      undefined
    );

    const record =
      createArtisanOperationRecord(
        validation.value
      );

    assert.equal(
      record.artisanId,
      'art_demo_001'
    );

    assert.equal(
      record.baseArtisanProfileAuthority,
      'existing-artisan-domain'
    );

    assert.equal(
      record.governmentVerified,
      false
    );

    assert.equal(
      Object.isFrozen(record),
      true
    );
  }
);

test(
  'membership is canonical and never becomes Government approval',
  () => {
    const record =
      createMembershipRecord({
        membershipId:
          'mem_demo_001',
        artisanId:
          'art_demo_001',
        cooperativeId:
          'coop_demo_001',
        membershipRole:
          'member',
        workflowState:
          'draft',
      });

    assert.equal(
      record.governmentApproved,
      false
    );

    assert.equal(
      record.officialCertification,
      null
    );

    assert.equal(
      record.version,
      1
    );

    assert.equal(
      Object.isFrozen(record),
      true
    );
  }
);

test(
  'membership transitions are deterministic and fail closed',
  () => {
    assert.equal(
      isAllowedMembershipTransition(
        'draft',
        'submitted'
      ),
      true
    );

    assert.equal(
      isAllowedMembershipTransition(
        'draft',
        'verified-internal'
      ),
      false
    );

    assert.equal(
      isAllowedMembershipTransition(
        'under-review',
        'verified-internal'
      ),
      true
    );

    assert.equal(
      isAllowedMembershipTransition(
        'verified-internal',
        'government-approved'
      ),
      false
    );

    const initial =
      createMembershipRecord({
        membershipId:
          'mem_demo_002',
        artisanId:
          'art_demo_002',
        cooperativeId:
          'coop_demo_001',
        membershipRole:
          'member',
        workflowState:
          'draft',
      });

    const submitted =
      transitionMembershipRecord(
        initial,
        'submitted'
      );

    assert.equal(
      submitted.workflowState,
      'submitted'
    );

    assert.equal(
      submitted.version,
      2
    );

    assert.equal(
      submitted.governmentApproved,
      false
    );

    assert.equal(
      initial.workflowState,
      'draft'
    );

    assert.throws(
      () =>
        transitionMembershipRecord(
          initial,
          'verified-internal'
        ),
      (error) =>
        error?.code ===
        'INVALID_MEMBERSHIP_TRANSITION'
    );
  }
);

test(
  'sensitive identity and banking fields are rejected',
  () => {
    const direct =
      rejectSensitiveFields({
        aadhaar:
          '[REDACTED]',
      });

    assert.equal(
      direct?.code,
      'SENSITIVE_HANDLOOM_FIELD_PROHIBITED'
    );

    const nested =
      rejectSensitiveFields({
        metadata: {
          bankAccountNumber:
            '[REDACTED]',
        },
      });

    assert.equal(
      nested?.code,
      'SENSITIVE_HANDLOOM_FIELD_PROHIBITED'
    );

    const validation =
      validateMembershipOperation({
        membershipId:
          'mem_demo_003',
        artisanId:
          'art_demo_003',
        cooperativeId:
          'coop_demo_001',
        membershipRole:
          'member',
        workflowState:
          'draft',
        kycDocument:
          '[KYC_DOCUMENT_REDACTED]',
      });

    assert.equal(
      validation.error?.code,
      'SENSITIVE_HANDLOOM_FIELD_PROHIBITED'
    );
  }
);

test(
  'invalid canonical IDs and unknown fields fail validation',
  () => {
    const invalidId =
      validateMembershipOperation({
        membershipId:
          '../unsafe',
        artisanId:
          'art_demo_004',
        cooperativeId:
          'coop_demo_001',
        membershipRole:
          'member',
        workflowState:
          'draft',
      });

    assert.ok(
      invalidId.error
    );

    const unknown =
      validateCooperativeOperation({
        cooperativeId:
          'coop_demo_002',
        displayName:
          'Demo Group Two',
        cooperativeType:
          'cluster',
        district:
          'Demo District',
        state:
          'Demo State',
        country:
          'India',
        active:
          true,
        governmentApproved:
          true,
      });

    assert.ok(
      unknown.error
    );
  }
);

test(
  'membership transition registry contains no government-approved state',
  () => {
    const serialized =
      JSON.stringify(
        MEMBERSHIP_TRANSITIONS
      );

    assert.equal(
      serialized.includes(
        'government-approved'
      ),
      false
    );

    assert.equal(
      Object.isFrozen(
        MEMBERSHIP_TRANSITIONS
      ),
      true
    );
  }
);
