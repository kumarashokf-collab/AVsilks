'use strict';

const {
  ORDER_SERVICE_ERROR,
  createSecureOrder,
  cancelSecureCustomerOrder,
  transitionSecureAdminOrder,
} = require('../services/order.service');

const {
  ORDER_REPOSITORY_ERROR,
} = require('../repositories/order.repository');

const {
  ORDER_ITEM_ERROR,
} = require('../services/orderItem.service');

const {
  ORDER_CREATION_ERROR,
} = require('../services/orderCreation.service');

const {
  ORDER_CANCELLATION_ERROR,
} = require('../services/orderCancellation.service');

const {
  ORDER_FULFILMENT_ERROR,
} = require('../services/orderFulfilment.service');

function mapOrderError(error) {
  const code = error?.code || 'ORDER_CREATION_FAILED';

  if (
    code ===
      ORDER_SERVICE_ERROR.AUTHENTICATION_REQUIRED ||
    code === 'INVALID_USER_ID'
  ) {
    return {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.',
    };
  }

  if (
    code ===
      ORDER_SERVICE_ERROR.VALIDATION_FAILED ||
    code === 'INVALID_IDEMPOTENCY_KEY' ||
    code ===
      ORDER_REPOSITORY_ERROR.INVALID_INPUT ||
    code ===
      ORDER_CREATION_ERROR.INVALID_USER ||
    code ===
      ORDER_CREATION_ERROR.INVALID_ITEMS ||
    code ===
      ORDER_CREATION_ERROR
        .INVALID_IDEMPOTENCY_IDENTITY ||
    code === ORDER_ITEM_ERROR.INVALID_PRODUCT_ID ||
    code === ORDER_ITEM_ERROR.INVALID_QUANTITY
  ) {
    return {
      status: 400,
      code: 'ORDER_VALIDATION_FAILED',
      message: 'Order request is invalid.',
      details:
        code ===
        ORDER_SERVICE_ERROR.VALIDATION_FAILED
          ? error.details
          : undefined,
    };
  }

  if (
    code ===
    ORDER_REPOSITORY_ERROR.IDEMPOTENCY_CONFLICT
  ) {
    return {
      status: 409,
      code: 'IDEMPOTENCY_CONFLICT',
      message:
        'This checkout key was already used for a different order request.',
    };
  }

  if (
    code === ORDER_ITEM_ERROR.PRODUCT_NOT_FOUND ||
    code ===
      ORDER_CREATION_ERROR.PRODUCT_RECORD_MISSING
  ) {
    return {
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message:
        'One or more requested products are unavailable.',
    };
  }

  if (
    code === ORDER_ITEM_ERROR.PRODUCT_INACTIVE ||
    code === ORDER_ITEM_ERROR.INSUFFICIENT_STOCK
  ) {
    return {
      status: 409,
      code,
      message:
        code === ORDER_ITEM_ERROR.INSUFFICIENT_STOCK
          ? 'Requested product stock is unavailable.'
          : 'A requested product is inactive.',
    };
  }

  if (
    code === ORDER_ITEM_ERROR.PRODUCT_INVALID_NAME ||
    code === ORDER_ITEM_ERROR.PRODUCT_INVALID_PRICE ||
    code === ORDER_ITEM_ERROR.PRODUCT_INVALID_STOCK ||
    code ===
      ORDER_CREATION_ERROR.DUPLICATE_PRODUCT_RECORD
  ) {
    return {
      status: 422,
      code: 'INVALID_PRODUCT_DATA',
      message:
        'A requested product has invalid catalogue data.',
    };
  }

  return {
    status: 500,
    code: 'ORDER_CREATION_FAILED',
    message:
      'Order could not be created. Please try again.',
  };
}


function mapOrderCancellationError(error) {
  const code =
    error?.code ||
    'ORDER_CANCELLATION_FAILED';

  if (
    code ===
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED ||
    code === 'INVALID_USER_ID'
  ) {
    return {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message:
        'Authentication is required.',
    };
  }

  if (
    code ===
      ORDER_SERVICE_ERROR
        .VALIDATION_FAILED ||
    code ===
      ORDER_REPOSITORY_ERROR
        .INVALID_INPUT ||
    code ===
      ORDER_CANCELLATION_ERROR
        .INVALID_INPUT
  ) {
    return {
      status: 400,
      code:
        'ORDER_CANCELLATION_VALIDATION_FAILED',
      message:
        'Order cancellation request is invalid.',
      details:
        code ===
        ORDER_SERVICE_ERROR
          .VALIDATION_FAILED
          ? error.details
          : undefined,
    };
  }

  if (
    code ===
      ORDER_CANCELLATION_ERROR
        .ORDER_NOT_FOUND ||
    code ===
      ORDER_CANCELLATION_ERROR
        .ORDER_OWNERSHIP_MISMATCH
  ) {
    return {
      status: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'Order was not found.',
    };
  }

  if (
    code ===
      ORDER_CANCELLATION_ERROR
        .STATUS_NOT_CANCELLABLE
  ) {
    return {
      status: 409,
      code: 'ORDER_NOT_CANCELLABLE',
      message:
        'Order cannot be cancelled in its current status.',
    };
  }

  if (
    code ===
      ORDER_CANCELLATION_ERROR
        .INVALID_ORDER_ITEMS ||
    code ===
      ORDER_CANCELLATION_ERROR
        .DUPLICATE_PRODUCT ||
    code ===
      ORDER_REPOSITORY_ERROR
        .PRODUCT_NOT_FOUND ||
    code ===
      ORDER_REPOSITORY_ERROR
        .INVALID_PRODUCT_STOCK
  ) {
    return {
      status: 409,
      code:
        'ORDER_CANCELLATION_UNAVAILABLE',
      message:
        'Order cancellation is temporarily unavailable.',
    };
  }

  return {
    status: 500,
    code: 'ORDER_CANCELLATION_FAILED',
    message:
      'Order could not be cancelled. Please try again.',
  };
}

function mapAdminOrderTransitionError(error) {
  const code =
    error?.code ||
    'ORDER_TRANSITION_FAILED';

  if (
    code ===
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED ||
    code === 'INVALID_USER_ID'
  ) {
    return {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message:
        'Authentication is required.',
    };
  }

  if (
    code ===
      ORDER_SERVICE_ERROR
        .VALIDATION_FAILED ||
    code ===
      ORDER_REPOSITORY_ERROR
        .INVALID_INPUT ||
    code ===
      ORDER_FULFILMENT_ERROR
        .INVALID_INPUT ||
    code ===
      ORDER_FULFILMENT_ERROR
        .TARGET_STATUS_NOT_ALLOWED
  ) {
    return {
      status: 400,
      code:
        'ORDER_TRANSITION_VALIDATION_FAILED',
      message:
        'Order transition request is invalid.',
      details:
        code ===
        ORDER_SERVICE_ERROR
          .VALIDATION_FAILED
          ? error.details
          : undefined,
    };
  }

  if (
    code ===
    ORDER_FULFILMENT_ERROR
      .ORDER_NOT_FOUND
  ) {
    return {
      status: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'Order was not found.',
    };
  }

  if (
    code ===
    ORDER_FULFILMENT_ERROR
      .TRANSITION_NOT_ALLOWED
  ) {
    return {
      status: 409,
      code:
        'ORDER_TRANSITION_NOT_ALLOWED',
      message:
        'Order cannot move to the requested status.',
    };
  }

  if (
    code ===
    ORDER_FULFILMENT_ERROR
      .INVALID_STORED_STATUS
  ) {
    return {
      status: 409,
      code:
        'ORDER_TRANSITION_UNAVAILABLE',
      message:
        'Order status update is temporarily unavailable.',
    };
  }

  return {
    status: 500,
    code: 'ORDER_TRANSITION_FAILED',
    message:
      'Order status could not be updated. Please try again.',
  };
}

function sanitizeOrderResponse(orderId, order = {}) {
  const safeOrder =
    order &&
    typeof order === 'object' &&
    !Array.isArray(order)
      ? order
      : {};

  const {
    idempotencyKeyHash,
    requestFingerprint,
    ...publicOrder
  } = safeOrder;

  return {
    ...publicOrder,
    id: orderId,
  };
}

function createOrderController({
  createSecureOrderFn = createSecureOrder,
} = {}) {
  if (typeof createSecureOrderFn !== 'function') {
    throw new TypeError(
      'createSecureOrderFn must be a function.'
    );
  }

  return async function createOrder(req, res) {
    try {
      const result = await createSecureOrderFn({
        user: req.user,
        payload: req.body,
      });

      const statusCode =
        result.created === false ? 200 : 201;

      return res.status(statusCode).json({
        success: true,
        created: result.created !== false,
        data: sanitizeOrderResponse(
          result.orderId,
          result.order
        ),
      });
    } catch (error) {
      const mapped = mapOrderError(error);

      if (mapped.status >= 500) {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'order_creation_failed',
            code:
              error?.code ||
              'UNKNOWN_ORDER_ERROR',
            method: req?.method || 'unknown',
            path:
              req?.originalUrl ||
              req?.path ||
              'unknown',
          })
        );
      }

      const response = {
        success: false,
        code: mapped.code,
        message: mapped.message,
      };

      if (
        Array.isArray(mapped.details) &&
        mapped.details.length > 0
      ) {
        response.details = mapped.details;
      }

      return res
        .status(mapped.status)
        .json(response);
    }
  };
}


function createCancelOrderController({
  cancelSecureCustomerOrderFn =
    cancelSecureCustomerOrder,
} = {}) {
  if (
    typeof cancelSecureCustomerOrderFn !==
    'function'
  ) {
    throw new TypeError(
      'cancelSecureCustomerOrderFn must be a function.'
    );
  }

  return async function cancelCustomerOrder(
    req,
    res
  ) {
    try {
      const result =
        await cancelSecureCustomerOrderFn({
          user: req.user,
          params: req.params,
          payload: req.body,
        });

      return res.status(200).json({
        success: true,
        cancelled:
          result.cancelled === true,
        data: sanitizeOrderResponse(
          result.orderId,
          result.order
        ),
      });
    } catch (error) {
      const mapped =
        mapOrderCancellationError(error);

      if (mapped.status >= 500) {
        console.error(
          JSON.stringify({
            timestamp:
              new Date().toISOString(),
            event:
              'order_cancellation_failed',
            code:
              error?.code ||
              'UNKNOWN_ORDER_ERROR',
            method:
              req?.method || 'unknown',
            path:
              req?.originalUrl ||
              req?.path ||
              'unknown',
          })
        );
      }

      const response = {
        success: false,
        code: mapped.code,
        message: mapped.message,
      };

      if (
        Array.isArray(mapped.details) &&
        mapped.details.length > 0
      ) {
        response.details =
          mapped.details;
      }

      return res
        .status(mapped.status)
        .json(response);
    }
  };
}

function createAdminOrderTransitionController({
  transitionSecureAdminOrderFn =
    transitionSecureAdminOrder,
} = {}) {
  if (
    typeof transitionSecureAdminOrderFn !==
    'function'
  ) {
    throw new TypeError(
      'transitionSecureAdminOrderFn must be a function.'
    );
  }

  return async function transitionAdminOrder(
    req,
    res
  ) {
    try {
      const result =
        await transitionSecureAdminOrderFn({
          user: req.user,
          params: req.params,
          payload: req.body,
        });

      return res.status(200).json({
        success: true,
        transitioned:
          result.transitioned === true,
        data: sanitizeOrderResponse(
          result.orderId,
          result.order
        ),
      });
    } catch (error) {
      const mapped =
        mapAdminOrderTransitionError(
          error
        );

      if (mapped.status >= 500) {
        console.error(
          JSON.stringify({
            timestamp:
              new Date().toISOString(),
            event:
              'admin_order_transition_failed',
            code:
              error?.code ||
              'UNKNOWN_ORDER_TRANSITION_ERROR',
            method:
              req?.method || 'unknown',
            path:
              req?.originalUrl ||
              req?.path ||
              'unknown',
          })
        );
      }

      const response = {
        success: false,
        code: mapped.code,
        message: mapped.message,
      };

      if (
        Array.isArray(mapped.details) &&
        mapped.details.length > 0
      ) {
        response.details =
          mapped.details;
      }

      return res
        .status(mapped.status)
        .json(response);
    }
  };
}

const createOrder = createOrderController();

const cancelCustomerOrder =
  createCancelOrderController();

const transitionAdminOrder =
  createAdminOrderTransitionController();

module.exports = {
  mapOrderError,
  mapOrderCancellationError,
  mapAdminOrderTransitionError,
  sanitizeOrderResponse,
  createOrderController,
  createCancelOrderController,
  createAdminOrderTransitionController,
  createOrder,
  cancelCustomerOrder,
  transitionAdminOrder,
};
