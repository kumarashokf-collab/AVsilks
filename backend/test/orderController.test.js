'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mapOrderError,
  mapOrderCancellationError,
  mapAdminOrderTransitionError,
  sanitizeOrderResponse,
  createOrderController,
  createCancelOrderController,
  createAdminOrderTransitionController,
} = require('../src/controllers/order.controller');

function createResponse() {
  return {
    statusCode: 0,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createRequest() {
  return {
    user: {
      uid: 'customer-uid-1',
    },
    body: {
      idempotencyKey:
        'checkout-controller-test-0001',
    },
    method: 'POST',
    originalUrl: '/api/orders',
  };
}

test('returns 201 and sanitizes a newly created order', async () => {
  const controller = createOrderController({
    async createSecureOrderFn({ user, payload }) {
      assert.equal(
        user.uid,
        'customer-uid-1'
      );

      assert.equal(
        payload.idempotencyKey,
        'checkout-controller-test-0001'
      );

      return {
        created: true,
        orderId: 'ord_controller_test_1',
        order: {
          id: 'tampered-stored-id',
          userId: 'customer-uid-1',
          total: 999,
          idempotencyKeyHash:
            'a'.repeat(64),
          requestFingerprint:
            'b'.repeat(64),
        },
      };
    },
  });

  const response = createResponse();

  await controller(
    createRequest(),
    response
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.created, true);

  assert.equal(
    response.body.data.id,
    'ord_controller_test_1'
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      response.body.data,
      'idempotencyKeyHash'
    ),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      response.body.data,
      'requestFingerprint'
    ),
    false
  );
});

test('returns 200 for an idempotent order retry', async () => {
  const controller = createOrderController({
    async createSecureOrderFn() {
      return {
        created: false,
        orderId: 'ord_retry_test_1',
        order: {
          total: 999,
        },
      };
    },
  });

  const response = createResponse();

  await controller(
    createRequest(),
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.created, false);

  assert.equal(
    response.body.data.id,
    'ord_retry_test_1'
  );
});

test('returns sanitized validation details with 400', async () => {
  const controller = createOrderController({
    async createSecureOrderFn() {
      const error = new Error(
        'Internal validation message'
      );

      error.code = 'VALIDATION_FAILED';
      error.details = [
        {
          path: 'items.0.quantity',
          type: 'number.max',
          message:
            '"items[0].quantity" must be less than or equal to 10',
        },
      ];

      throw error;
    },
  });

  const response = createResponse();

  await controller(
    createRequest(),
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);

  assert.equal(
    response.body.code,
    'ORDER_VALIDATION_FAILED'
  );

  assert.equal(
    response.body.details[0].path,
    'items.0.quantity'
  );
});

test('maps authentication and product errors safely', () => {
  assert.deepEqual(
    mapOrderError({
      code: 'AUTHENTICATION_REQUIRED',
    }),
    {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.',
    }
  );

  assert.deepEqual(
    mapOrderError({
      code: 'PRODUCT_NOT_FOUND',
    }),
    {
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      message:
        'One or more requested products are unavailable.',
    }
  );
});

test('maps stock and idempotency conflicts to 409', () => {
  const stockError = mapOrderError({
    code: 'INSUFFICIENT_STOCK',
  });

  assert.equal(stockError.status, 409);
  assert.equal(
    stockError.code,
    'INSUFFICIENT_STOCK'
  );

  const conflictError = mapOrderError({
    code: 'IDEMPOTENCY_CONFLICT',
  });

  assert.equal(conflictError.status, 409);
  assert.equal(
    conflictError.code,
    'IDEMPOTENCY_CONFLICT'
  );
});

test('maps invalid catalogue data to 422', () => {
  for (const code of [
    'PRODUCT_INVALID_NAME',
    'PRODUCT_INVALID_PRICE',
    'PRODUCT_INVALID_STOCK',
    'DUPLICATE_PRODUCT_RECORD',
  ]) {
    const mapped = mapOrderError({
      code,
    });

    assert.equal(mapped.status, 422);
    assert.equal(
      mapped.code,
      'INVALID_PRODUCT_DATA'
    );
  }
});

test('does not expose internal metadata in sanitized responses', () => {
  const result = sanitizeOrderResponse(
    'ord_safe_test_1',
    {
      id: 'wrong-id',
      total: 999,
      idempotencyKeyHash:
        'a'.repeat(64),
      requestFingerprint:
        'b'.repeat(64),
    }
  );

  assert.deepEqual(result, {
    id: 'ord_safe_test_1',
    total: 999,
  });
});

test('uses a generic response for unknown internal errors', () => {
  const mapped = mapOrderError({
    code: 'DATABASE_INTERNAL_FAILURE',
    message:
      'Private database connection details',
  });

  assert.deepEqual(mapped, {
    status: 500,
    code: 'ORDER_CREATION_FAILED',
    message:
      'Order could not be created. Please try again.',
  });
});

test('rejects an invalid controller dependency', () => {
  assert.throws(
    () =>
      createOrderController({
        createSecureOrderFn:
          'not-a-function',
      }),
    TypeError
  );
});

function createCancelRequest() {
  return {
    user: {
      uid: 'customer-uid-1',
    },
    params: {
      id: 'ord-cancel-controller-1',
    },
    body: {
      reason:
        'Customer changed the order choice.',
    },
    method: 'POST',
    originalUrl:
      '/api/orders/ord-cancel-controller-1/cancel',
  };
}

test('returns 200 for a secure customer cancellation', async () => {
  const controller =
    createCancelOrderController({
      async cancelSecureCustomerOrderFn({
        user,
        params,
        payload,
      }) {
        assert.equal(
          user.uid,
          'customer-uid-1'
        );

        assert.equal(
          params.id,
          'ord-cancel-controller-1'
        );

        assert.equal(
          payload.reason,
          'Customer changed the order choice.'
        );

        return {
          cancelled: true,
          orderId:
            'ord-cancel-controller-1',
          order: {
            id: 'tampered-stored-id',
            userId:
              'customer-uid-1',
            status: 'Cancelled',
            idempotencyKeyHash:
              'a'.repeat(64),
            requestFingerprint:
              'b'.repeat(64),
          },
        };
      },
    });

  const response = createResponse();

  await controller(
    createCancelRequest(),
    response
  );

  assert.equal(
    response.statusCode,
    200
  );

  assert.equal(
    response.body.success,
    true
  );

  assert.equal(
    response.body.cancelled,
    true
  );

  assert.equal(
    response.body.data.id,
    'ord-cancel-controller-1'
  );

  assert.equal(
    response.body.data.status,
    'Cancelled'
  );

  assert.equal(
    Object.prototype
      .hasOwnProperty.call(
        response.body.data,
        'idempotencyKeyHash'
      ),
    false
  );

  assert.equal(
    Object.prototype
      .hasOwnProperty.call(
        response.body.data,
        'requestFingerprint'
      ),
    false
  );
});

test('returns sanitized cancellation validation details with 400', async () => {
  const controller =
    createCancelOrderController({
      async cancelSecureCustomerOrderFn() {
        const error =
          new Error(
            'Internal validation message'
          );

        error.code =
          'VALIDATION_FAILED';

        error.details = [
          {
            path: 'body.reason',
            type: 'string.min',
            message:
              '"reason" length must be at least 3 characters long',
          },
        ];

        throw error;
      },
    });

  const response = createResponse();

  await controller(
    createCancelRequest(),
    response
  );

  assert.equal(
    response.statusCode,
    400
  );

  assert.equal(
    response.body.code,
    'ORDER_CANCELLATION_VALIDATION_FAILED'
  );

  assert.equal(
    response.body.details[0].path,
    'body.reason'
  );
});

test('hides ownership mismatch behind order not found', () => {
  for (const code of [
    'ORDER_NOT_FOUND',
    'ORDER_OWNERSHIP_MISMATCH',
  ]) {
    const mapped =
      mapOrderCancellationError({
        code,
      });

    assert.deepEqual(
      mapped,
      {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        message:
          'Order was not found.',
      }
    );
  }
});

test('maps non-cancellable status to 409', () => {
  const mapped =
    mapOrderCancellationError({
      code:
        'STATUS_NOT_CANCELLABLE',
    });

  assert.equal(mapped.status, 409);

  assert.equal(
    mapped.code,
    'ORDER_NOT_CANCELLABLE'
  );
});

test('maps unsafe restoration data to a generic conflict', () => {
  for (const code of [
    'INVALID_ORDER_ITEMS',
    'DUPLICATE_PRODUCT',
    'PRODUCT_NOT_FOUND',
    'INVALID_PRODUCT_STOCK',
  ]) {
    const mapped =
      mapOrderCancellationError({
        code,
      });

    assert.equal(
      mapped.status,
      409
    );

    assert.equal(
      mapped.code,
      'ORDER_CANCELLATION_UNAVAILABLE'
    );
  }
});

test('uses a generic cancellation response for unknown internal errors', () => {
  const mapped =
    mapOrderCancellationError({
      code:
        'PRIVATE_DATABASE_FAILURE',
      message:
        'Private database details',
    });

  assert.deepEqual(
    mapped,
    {
      status: 500,
      code:
        'ORDER_CANCELLATION_FAILED',
      message:
        'Order could not be cancelled. Please try again.',
    }
  );
});

test('rejects an invalid cancellation controller dependency', () => {
  assert.throws(
    () =>
      createCancelOrderController({
        cancelSecureCustomerOrderFn:
          'not-a-function',
      }),
    TypeError
  );
});

function createAdminTransitionRequest() {
  return {
    user: {
      uid: 'admin-uid-1',
    },
    params: {
      id:
        'ord-admin-controller-1',
    },
    body: {
      status: 'Confirmed',
      note:
        'Order verified by admin.',
    },
    method: 'PATCH',
    originalUrl:
      '/api/orders/ord-admin-controller-1/status',
  };
}

test('returns 200 for a secure admin order transition', async () => {
  const controller =
    createAdminOrderTransitionController({
      async transitionSecureAdminOrderFn({
        user,
        params,
        payload,
      }) {
        assert.equal(
          user.uid,
          'admin-uid-1'
        );

        assert.equal(
          params.id,
          'ord-admin-controller-1'
        );

        assert.equal(
          payload.status,
          'Confirmed'
        );

        return {
          transitioned: true,
          orderId:
            'ord-admin-controller-1',
          order: {
            id: 'tampered-stored-id',
            status: 'Confirmed',
            idempotencyKeyHash:
              'a'.repeat(64),
            requestFingerprint:
              'b'.repeat(64),
          },
        };
      },
    });

  const response =
    createResponse();

  await controller(
    createAdminTransitionRequest(),
    response
  );

  assert.equal(
    response.statusCode,
    200
  );

  assert.equal(
    response.body.success,
    true
  );

  assert.equal(
    response.body.transitioned,
    true
  );

  assert.equal(
    response.body.data.id,
    'ord-admin-controller-1'
  );

  assert.equal(
    response.body.data.status,
    'Confirmed'
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      response.body.data,
      'idempotencyKeyHash'
    ),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      response.body.data,
      'requestFingerprint'
    ),
    false
  );
});

test('returns sanitized admin transition validation details with 400', async () => {
  const controller =
    createAdminOrderTransitionController({
      async transitionSecureAdminOrderFn() {
        const error =
          new Error(
            'Internal validation message'
          );

        error.code =
          'VALIDATION_FAILED';

        error.details = [
          {
            path: 'body.status',
            type: 'any.only',
            message:
              'Internal Joi validation detail',
          },
        ];

        throw error;
      },
    });

  const response =
    createResponse();

  await controller(
    createAdminTransitionRequest(),
    response
  );

  assert.equal(
    response.statusCode,
    400
  );

  assert.equal(
    response.body.code,
    'ORDER_TRANSITION_VALIDATION_FAILED'
  );

  assert.equal(
    response.body.details[0].path,
    'body.status'
  );
});

test('maps missing orders to 404', () => {
  const mapped =
    mapAdminOrderTransitionError({
      code: 'ORDER_NOT_FOUND',
    });

  assert.deepEqual(
    mapped,
    {
      status: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'Order was not found.',
    }
  );
});

test('maps invalid sequential transitions to 409', () => {
  const mapped =
    mapAdminOrderTransitionError({
      code:
        'TRANSITION_NOT_ALLOWED',
    });

  assert.equal(
    mapped.status,
    409
  );

  assert.equal(
    mapped.code,
    'ORDER_TRANSITION_NOT_ALLOWED'
  );
});

test('hides invalid stored order status behind a generic conflict', () => {
  const mapped =
    mapAdminOrderTransitionError({
      code:
        'INVALID_STORED_STATUS',
    });

  assert.equal(
    mapped.status,
    409
  );

  assert.equal(
    mapped.code,
    'ORDER_TRANSITION_UNAVAILABLE'
  );
});

test('uses a generic response for unknown admin transition errors', () => {
  const mapped =
    mapAdminOrderTransitionError({
      code: 'INTERNAL_FIRESTORE_ERROR',
    });

  assert.deepEqual(
    mapped,
    {
      status: 500,
      code: 'ORDER_TRANSITION_FAILED',
      message:
        'Order status could not be updated. Please try again.',
    }
  );
});

test('rejects an invalid admin transition controller dependency', () => {
  assert.throws(
    () =>
      createAdminOrderTransitionController({
        transitionSecureAdminOrderFn:
          'not-a-function',
      }),
    TypeError
  );
});
