'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function loadProcurementActivationBoundary() {
  try {
    return require(
      '../src/future/procurement/procurementActivationBoundary'
    );
  } catch (error) {
    const message = String(error?.message || '');

    if (
      error?.code === 'MODULE_NOT_FOUND' &&
      message.includes(
        '../src/future/procurement/procurementActivationBoundary'
      )
    ) {
      const intendedRed = new Error(
        'PROCUREMENT_ACTIVATION_BOUNDARY_IMPLEMENTATION_MISSING'
      );

      intendedRed.code =
        'PROCUREMENT_ACTIVATION_BOUNDARY_IMPLEMENTATION_MISSING';

      throw intendedRed;
    }

    throw error;
  }
}

test(
  'procurement activation stays parked fail-closed and requires Blaze CI security and explicit integration approval',
  () => {
    const {
      createProcurementActivationBoundary,
    } = loadProcurementActivationBoundary();

    const boundary =
      createProcurementActivationBoundary();

    assert.equal(boundary.mode, 'future-only');
    assert.equal(boundary.state, 'parked');

    assert.equal(
      boundary.activationAllowed,
      false
    );

    assert.equal(
      boundary.requiresBlazeApproval,
      true
    );

    assert.equal(
      boundary.requiresCiValidation,
      true
    );

    assert.equal(
      boundary.requiresAggregateSecurityGate,
      true
    );

    assert.equal(
      boundary.requiresExplicitIntegrationApproval,
      true
    );

    assert.equal(
      boundary.releaseMergeAllowed,
      false
    );

    assert.equal(
      boundary.mainMergeAllowed,
      false
    );

    assert.equal(
      boundary.firebaseDeployAllowed,
      false
    );

    assert.equal(
      boundary.cloudMutationAllowed,
      false
    );

    assert.equal(
      boundary.liveInventoryMutationAllowed,
      false
    );

    assert.equal(
      boundary.governmentApprovalAuthority,
      false
    );

    assert.equal(
      boundary.vendorApprovalAuthority,
      false
    );

    assert.equal(
      boundary.financialAuthority,
      false
    );

    assert.equal(
      Object.isFrozen(boundary),
      true
    );

    assert.throws(
      () =>
        createProcurementActivationBoundary({
          activationAllowed: true,
        }),
      (error) =>
        error?.code ===
        'PROCUREMENT_ACTIVATION_OVERRIDE_PROHIBITED'
    );
  }
);
