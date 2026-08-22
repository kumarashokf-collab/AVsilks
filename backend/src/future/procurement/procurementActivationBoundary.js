'use strict';

const PARKED_ACTIVATION_BOUNDARY = Object.freeze({
  mode: 'future-only',
  state: 'parked',

  activationAllowed: false,

  requiresBlazeApproval: true,
  requiresCiValidation: true,
  requiresAggregateSecurityGate: true,
  requiresExplicitIntegrationApproval: true,

  releaseMergeAllowed: false,
  mainMergeAllowed: false,

  firebaseDeployAllowed: false,
  cloudMutationAllowed: false,
  liveInventoryMutationAllowed: false,

  governmentApprovalAuthority: false,
  vendorApprovalAuthority: false,
  financialAuthority: false,
});

function createProcurementActivationOverrideError() {
  const error = new Error(
    'Procurement activation overrides are prohibited while the feature is parked.'
  );

  error.code =
    'PROCUREMENT_ACTIVATION_OVERRIDE_PROHIBITED';

  return error;
}

function createProcurementActivationBoundary() {
  if (arguments.length !== 0) {
    throw createProcurementActivationOverrideError();
  }

  return PARKED_ACTIVATION_BOUNDARY;
}

module.exports = {
  createProcurementActivationBoundary,
};
