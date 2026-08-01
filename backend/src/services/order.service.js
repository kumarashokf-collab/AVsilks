'use strict';

const {
  validateCreateOrderInput,
} = require('../validators/order.validator');

const {
  validateCancelOrderParams,
  validateCancelOrderInput,
} = require('../validators/orderCancellation.validator');

const {
  validateAdminOrderTransitionParams,
  validateAdminOrderTransitionInput,
} = require('../validators/orderFulfilment.validator');

const {
  createOrderIdempotencyIdentity,
} = require('./orderIdempotency.service');

const {
  createOrderWithTransaction,
  cancelCustomerOrderWithTransaction,
  transitionAdminOrderWithTransaction,
} = require('../repositories/order.repository');

const ORDER_SERVICE_ERROR = Object.freeze({
  AUTHENTICATION_REQUIRED:
    'AUTHENTICATION_REQUIRED',
  VALIDATION_FAILED:
    'VALIDATION_FAILED',
  INVALID_REPOSITORY:
    'INVALID_REPOSITORY',
});

function createOrderServiceError(
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
        type: detail.type || '',
        message: detail.message || '',
      }))
    : [];
}

async function createSecureOrder(
  {
    user,
    payload,
  },
  dependencies = {}
) {
  const userId =
    typeof user?.uid === 'string'
      ? user.uid.trim()
      : '';

  if (!userId) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated user is required.'
    );
  }

  const validation =
    validateCreateOrderInput(payload);

  if (validation.error) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Order request validation failed.',
      formatValidationDetails(
        validation.error
      )
    );
  }

  const {
    idempotencyKey,
    customer,
    items,
    paymentMethod,
  } = validation.value;

  const idempotencyIdentity =
    createOrderIdempotencyIdentity({
      userId,
      idempotencyKey,
      customer,
      items,
      paymentMethod,
    });

  const repositoryFunction =
    dependencies
      .createOrderWithTransaction ||
    createOrderWithTransaction;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Order repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      userId,
      authenticatedPhone:
        typeof user?.phoneNumber ===
        'string'
          ? user.phoneNumber.trim()
          : '',
      customer,
      requestedItems: items,
      paymentMethod,
      idempotencyIdentity,
    },
    dependencies.repositoryDependencies
  );
}


function prefixValidationDetails(
  error,
  prefix
) {
  return formatValidationDetails(error)
    .map((detail) => ({
      ...detail,
      path: detail.path
        ? prefix + '.' + detail.path
        : prefix,
    }));
}

async function cancelSecureCustomerOrder(
  {
    user,
    params,
    payload,
  },
  dependencies = {}
) {
  const userId =
    typeof user?.uid === 'string'
      ? user.uid.trim()
      : '';

  if (!userId) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated user is required.'
    );
  }

  const paramsValidation =
    validateCancelOrderParams(
      params || {}
    );

  const payloadValidation =
    validateCancelOrderInput(
      payload || {}
    );

  const validationDetails = [
    ...prefixValidationDetails(
      paramsValidation.error,
      'params'
    ),
    ...prefixValidationDetails(
      payloadValidation.error,
      'body'
    ),
  ];

  if (validationDetails.length > 0) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Order cancellation validation failed.',
      validationDetails
    );
  }

  const repositoryFunction =
    dependencies
      .cancelCustomerOrderWithTransaction ||
    cancelCustomerOrderWithTransaction;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Order cancellation repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      userId,
      orderId:
        paramsValidation.value.id,
      reason:
        payloadValidation.value.reason,
    },
    dependencies.repositoryDependencies
  );
}



async function transitionSecureAdminOrder(
  {
    user,
    params,
    payload,
  },
  dependencies = {}
) {
  const adminUserId =
    typeof user?.uid === 'string'
      ? user.uid.trim()
      : '';

  if (!adminUserId) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED,
      'Authenticated admin is required.'
    );
  }

  const paramsValidation =
    validateAdminOrderTransitionParams(
      params || {}
    );

  const payloadValidation =
    validateAdminOrderTransitionInput(
      payload || {}
    );

  const validationDetails = [
    ...prefixValidationDetails(
      paramsValidation.error,
      'params'
    ),
    ...prefixValidationDetails(
      payloadValidation.error,
      'body'
    ),
  ];

  if (validationDetails.length > 0) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .VALIDATION_FAILED,
      'Admin order transition validation failed.',
      validationDetails
    );
  }

  const repositoryFunction =
    dependencies
      .transitionAdminOrderWithTransaction ||
    transitionAdminOrderWithTransaction;

  if (
    typeof repositoryFunction !==
    'function'
  ) {
    throw createOrderServiceError(
      ORDER_SERVICE_ERROR
        .INVALID_REPOSITORY,
      'Admin order transition repository is unavailable.'
    );
  }

  return repositoryFunction(
    {
      adminUserId,
      orderId:
        paramsValidation.value.id,
      nextStatus:
        payloadValidation.value.status,
      note:
        payloadValidation.value.note,
    },
    dependencies.repositoryDependencies
  );
}

module.exports = {
  ORDER_SERVICE_ERROR,
  formatValidationDetails,
  createSecureOrder,
  cancelSecureCustomerOrder,
  transitionSecureAdminOrder,
};
