'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const {
  HANDLOOM_DOMAIN,
  HANDLOOM_WORKFLOW_STATE,
  DOMAIN_DEFINITIONS,
  isKnownHandloomDomain,
  isKnownWorkflowState,
  getHandloomDomainDefinition,
  validateFutureHandloomRecordIdentity,
  assertDomainRegistrySafety,
} = require(
  '../src/future/handloomOperations/domainModel'
);

test(
  'Future Handloom canonical domain registry is safe and immutable',
  () => {
    assert.equal(
      assertDomainRegistrySafety(),
      true
    );

    assert.equal(
      Object.isFrozen(
        HANDLOOM_DOMAIN
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        HANDLOOM_WORKFLOW_STATE
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        DOMAIN_DEFINITIONS
      ),
      true
    );

    const domains =
      Object.values(
        HANDLOOM_DOMAIN
      );

    assert.equal(
      new Set(domains).size,
      domains.length
    );

    assert.equal(
      domains.length,
      11
    );

    for (
      const domain of domains
    ) {
      assert.equal(
        isKnownHandloomDomain(
          domain
        ),
        true
      );

      const definition =
        getHandloomDomainDefinition(
          domain
        );

      assert.equal(
        definition
          .authoritativeForGovernmentApproval,
        false
      );

      assert.equal(
        definition
          .publicByDefault,
        false
      );
    }
  }
);

test(
  'workflow states never use Government approval as an internal state',
  () => {
    const states =
      Object.values(
        HANDLOOM_WORKFLOW_STATE
      );

    assert.equal(
      states.includes(
        'approved'
      ),
      false
    );

    assert.equal(
      states.includes(
        'government-approved'
      ),
      false
    );

    assert.equal(
      isKnownWorkflowState(
        HANDLOOM_WORKFLOW_STATE
          .VERIFIED_INTERNAL
      ),
      true
    );
  }
);

test(
  'canonical record identity validation fails safely',
  () => {
    const valid =
      validateFutureHandloomRecordIdentity({
        domain:
          HANDLOOM_DOMAIN
            .PROGRAM_ENROLLMENT,

        id:
          ' enrollment_demo_001 ',

        workflowState:
          HANDLOOM_WORKFLOW_STATE
            .SUBMITTED,
      });

    assert.deepEqual(
      valid,
      {
        valid: true,
        domain:
          HANDLOOM_DOMAIN
            .PROGRAM_ENROLLMENT,
        id:
          'enrollment_demo_001',
        workflowState:
          HANDLOOM_WORKFLOW_STATE
            .SUBMITTED,
      }
    );

    assert.deepEqual(
      validateFutureHandloomRecordIdentity({
        domain:
          'unknown-domain',

        id:
          'demo',

        workflowState:
          HANDLOOM_WORKFLOW_STATE
            .DRAFT,
      }),
      {
        valid: false,
        code:
          'INVALID_HANDLOOM_DOMAIN',
      }
    );

    assert.deepEqual(
      validateFutureHandloomRecordIdentity({
        domain:
          HANDLOOM_DOMAIN
            .ARTISAN_OPERATION,

        id:
          '../unsafe',

        workflowState:
          HANDLOOM_WORKFLOW_STATE
            .DRAFT,
      }),
      {
        valid: false,
        code:
          'INVALID_CANONICAL_ID',
      }
    );

    assert.deepEqual(
      validateFutureHandloomRecordIdentity({
        domain:
          HANDLOOM_DOMAIN
            .ARTISAN_OPERATION,

        id:
          'artisan_demo',

        workflowState:
          'government-approved',
      }),
      {
        valid: false,
        code:
          'INVALID_WORKFLOW_STATE',
      }
    );
  }
);

test(
  'unknown domain lookup fails closed',
  () => {
    assert.throws(
      () =>
        getHandloomDomainDefinition(
          'unknown-domain'
        ),
      (error) =>
        error?.code ===
        'UNKNOWN_FUTURE_HANDLOOM_DOMAIN'
    );
  }
);
