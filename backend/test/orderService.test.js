'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_SERVICE_ERROR,
  createSecureOrder,
  cancelSecureCustomerOrder,
  transitionSecureAdminOrder,
} = require('../src/services/order.service');

function validPayload(overrides = {}) {
  return {
    idempotencyKey:
      'checkout-service-test-0001',
    customer: {
      name: ' Ashok Kumar ',
      phone: '9876543210',
      address: {
        house: ' 1-2 ',
        street: ' Main Road ',
        city: ' Tirupati ',
        state: ' Andhra Pradesh ',
        pin: '517501',
      },
    },
    items: [
      {
        productId: 'saree-1',
        quantity: '2',
      },
    ],
    ...overrides,
  };
}

test('validates and sends authoritative transaction input to repository', async () => {
  let capturedInput = null;
  let capturedDependencies = null;

  const repositoryDependencies = {
    marker: 'repository-dependencies',
  };

  const result = await createSecureOrder(
    {
      user: {
        uid: ' customer-uid-1 ',
        phoneNumber: ' +919876543210 ',
      },
      payload: validPayload(),
    },
    {
      repositoryDependencies,

      async createOrderWithTransaction(
        input,
        dependencies
      ) {
        capturedInput = input;
        capturedDependencies = dependencies;

        return {
          created: true,
          orderId:
            input.idempotencyIdentity.orderId,
          order: {
            total: 999,
          },
        };
      },
    }
  );

  assert.equal(result.created, true);

  assert.equal(
    capturedInput.userId,
    'customer-uid-1'
  );

  assert.equal(
    capturedInput.authenticatedPhone,
    '+919876543210'
  );

  assert.equal(
    capturedInput.customer.name,
    'Ashok Kumar'
  );

  assert.equal(
    capturedInput.customer.address.city,
    'Tirupati'
  );

  assert.deepEqual(
    capturedInput.requestedItems,
    [
      {
        productId: 'saree-1',
        quantity: 2,
      },
    ]
  );

  assert.equal(
    capturedInput.paymentMethod,
    'cod'
  );

  assert.match(
    capturedInput.idempotencyIdentity.orderId,
    /^ord_[a-f0-9]{48}$/
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      capturedInput,
      'idempotencyKey'
    ),
    false
  );

  assert.equal(
    capturedDependencies,
    repositoryDependencies
  );
});

test('requires authentication before repository access', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      createSecureOrder(
        {
          user: null,
          payload: validPayload(),
        },
        {
          async createOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED
  );

  assert.equal(repositoryCalls, 0);
});

test('rejects client-controlled fields before repository access', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      createSecureOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          payload: validPayload({
            total: 1,
            paymentStatus: 'Paid',
          }),
        },
        {
          async createOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
        ORDER_SERVICE_ERROR
          .VALIDATION_FAILED &&
      Array.isArray(error.details) &&
      error.details.some(
        (detail) =>
          detail.path === 'total' ||
          detail.path === 'paymentStatus'
      )
  );

  assert.equal(repositoryCalls, 0);
});

test('applies COD as the default payment method', async () => {
  let paymentMethod = null;

  const payload = validPayload();
  delete payload.paymentMethod;

  await createSecureOrder(
    {
      user: {
        uid: 'customer-uid-1',
      },
      payload,
    },
    {
      async createOrderWithTransaction(input) {
        paymentMethod = input.paymentMethod;

        return {
          created: true,
          orderId:
            input.idempotencyIdentity.orderId,
          order: {},
        };
      },
    }
  );

  assert.equal(paymentMethod, 'cod');
});

test('rejects an invalid repository dependency', async () => {
  await assert.rejects(
    () =>
      createSecureOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          payload: validPayload(),
        },
        {
          createOrderWithTransaction:
            'not-a-function',
        }
      ),
    (error) =>
      error.code ===
      ORDER_SERVICE_ERROR.INVALID_REPOSITORY
  );
});

test('propagates repository security errors unchanged', async () => {
  const conflictError =
    Object.assign(
      new Error(
        'Idempotency key conflict.'
      ),
      {
        code: 'IDEMPOTENCY_CONFLICT',
      }
    );

  await assert.rejects(
    () =>
      createSecureOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          payload: validPayload(),
        },
        {
          async createOrderWithTransaction() {
            throw conflictError;
          },
        }
      ),
    (error) => error === conflictError
  );
});

test('secure customer cancellation sends validated input to repository', async () => {
  let capturedInput = null;
  let capturedDependencies = null;

  const repositoryDependencies = {
    marker:
      'cancel-repository-dependencies',
  };

  const result =
    await cancelSecureCustomerOrder(
      {
        user: {
          uid: ' customer-uid-1 ',
        },
        params: {
          id: ' order-cancel-1 ',
        },
        payload: {
          reason:
            ' Customer changed the order choice. ',
        },
      },
      {
        repositoryDependencies,

        async cancelCustomerOrderWithTransaction(
          input,
          dependencies
        ) {
          capturedInput = input;
          capturedDependencies =
            dependencies;

          return {
            cancelled: true,
            orderId: input.orderId,
          };
        },
      }
    );

  assert.equal(
    result.cancelled,
    true
  );

  assert.deepEqual(
    capturedInput,
    {
      userId: 'customer-uid-1',
      orderId: 'order-cancel-1',
      reason:
        'Customer changed the order choice.',
    }
  );

  assert.equal(
    capturedDependencies,
    repositoryDependencies
  );
});

test('secure cancellation requires authentication before repository access', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      cancelSecureCustomerOrder(
        {
          user: null,
          params: {
            id: 'order-cancel-1',
          },
          payload: {
            reason:
              'Customer requested cancellation.',
          },
        },
        {
          async cancelCustomerOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED
  );

  assert.equal(
    repositoryCalls,
    0
  );
});

test('secure cancellation validates route params and body before repository access', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      cancelSecureCustomerOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          params: {
            id: 'orders/order-cancel-1',
          },
          payload: {
            reason: 'no',
          },
        },
        {
          async cancelCustomerOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
        ORDER_SERVICE_ERROR
          .VALIDATION_FAILED &&
      Array.isArray(error.details) &&
      error.details.some(
        (detail) =>
          detail.path === 'params.id'
      ) &&
      error.details.some(
        (detail) =>
          detail.path === 'body.reason'
      )
  );

  assert.equal(
    repositoryCalls,
    0
  );
});

test('secure cancellation rejects client-controlled fields', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      cancelSecureCustomerOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          params: {
            id: 'order-cancel-1',
          },
          payload: {
            reason:
              'Customer requested cancellation.',
            status: 'Cancelled',
            userId: 'another-user',
            stock: 999,
          },
        },
        {
          async cancelCustomerOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
        ORDER_SERVICE_ERROR
          .VALIDATION_FAILED &&
      error.details.some(
        (detail) =>
          detail.path === 'body.status' ||
          detail.path === 'body.userId' ||
          detail.path === 'body.stock'
      )
  );

  assert.equal(
    repositoryCalls,
    0
  );
});

test('secure cancellation rejects an invalid repository dependency', async () => {
  await assert.rejects(
    () =>
      cancelSecureCustomerOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          params: {
            id: 'order-cancel-1',
          },
          payload: {
            reason:
              'Customer requested cancellation.',
          },
        },
        {
          cancelCustomerOrderWithTransaction:
            'not-a-function',
        }
      ),
    (error) =>
      error.code ===
      ORDER_SERVICE_ERROR
        .INVALID_REPOSITORY
  );
});

test('secure cancellation propagates repository security errors unchanged', async () => {
  const ownershipError =
    Object.assign(
      new Error(
        'Order ownership mismatch.'
      ),
      {
        code:
          'ORDER_OWNERSHIP_MISMATCH',
      }
    );

  await assert.rejects(
    () =>
      cancelSecureCustomerOrder(
        {
          user: {
            uid: 'customer-uid-1',
          },
          params: {
            id: 'order-cancel-1',
          },
          payload: {
            reason:
              'Customer requested cancellation.',
          },
        },
        {
          async cancelCustomerOrderWithTransaction() {
            throw ownershipError;
          },
        }
      ),
    (error) =>
      error === ownershipError
  );
});

test('secure admin fulfilment sends validated input to repository', async () => {
  let capturedInput = null;
  let capturedDependencies = null;

  const repositoryDependencies = {
    marker: 'admin-repository-dependencies',
  };

  const result =
    await transitionSecureAdminOrder(
      {
        user: {
          uid: ' admin-uid-1 ',
        },
        params: {
          id: ' order-admin-transition-1 ',
        },
        payload: {
          status: 'Confirmed',
          note:
            ' Order verified by admin. ',
        },
      },
      {
        repositoryDependencies,

        async transitionAdminOrderWithTransaction(
          input,
          dependencies
        ) {
          capturedInput = input;
          capturedDependencies =
            dependencies;

          return {
            transitioned: true,
            orderId: input.orderId,
          };
        },
      }
    );

  assert.equal(
    result.transitioned,
    true
  );

  assert.deepEqual(
    capturedInput,
    {
      adminUserId: 'admin-uid-1',
      orderId:
        'order-admin-transition-1',
      nextStatus: 'Confirmed',
      note:
        'Order verified by admin.',
    }
  );

  assert.equal(
    capturedDependencies,
    repositoryDependencies
  );
});

test('secure admin fulfilment requires authentication before repository access', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      transitionSecureAdminOrder(
        {
          user: null,
          params: {
            id:
              'order-admin-transition-1',
          },
          payload: {
            status: 'Confirmed',
          },
        },
        {
          async transitionAdminOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
      ORDER_SERVICE_ERROR
        .AUTHENTICATION_REQUIRED
  );

  assert.equal(
    repositoryCalls,
    0
  );
});

test('secure admin fulfilment validates params and body before repository access', async () => {
  let repositoryCalls = 0;

  await assert.rejects(
    () =>
      transitionSecureAdminOrder(
        {
          user: {
            uid: 'admin-uid-1',
          },
          params: {
            id:
              'orders/order-admin-transition-1',
          },
          payload: {
            status: 'Cancelled',
            userId:
              'client-controlled',
          },
        },
        {
          async transitionAdminOrderWithTransaction() {
            repositoryCalls += 1;
          },
        }
      ),
    (error) =>
      error.code ===
        ORDER_SERVICE_ERROR
          .VALIDATION_FAILED &&
      Array.isArray(error.details) &&
      error.details.some(
        (detail) =>
          detail.path === 'params.id'
      ) &&
      error.details.some(
        (detail) =>
          detail.path === 'body.status' ||
          detail.path === 'body.userId'
      )
  );

  assert.equal(
    repositoryCalls,
    0
  );
});

test('secure admin fulfilment rejects an invalid repository dependency', async () => {
  await assert.rejects(
    () =>
      transitionSecureAdminOrder(
        {
          user: {
            uid: 'admin-uid-1',
          },
          params: {
            id:
              'order-admin-transition-1',
          },
          payload: {
            status: 'Confirmed',
          },
        },
        {
          transitionAdminOrderWithTransaction:
            'not-a-function',
        }
      ),
    (error) =>
      error.code ===
      ORDER_SERVICE_ERROR
        .INVALID_REPOSITORY
  );
});

test('secure admin fulfilment propagates repository security errors unchanged', async () => {
  const repositoryError =
    new Error(
      'Transition is not allowed.'
    );

  repositoryError.code =
    'TRANSITION_NOT_ALLOWED';

  await assert.rejects(
    () =>
      transitionSecureAdminOrder(
        {
          user: {
            uid: 'admin-uid-1',
          },
          params: {
            id:
              'order-admin-transition-1',
          },
          payload: {
            status: 'Confirmed',
          },
        },
        {
          async transitionAdminOrderWithTransaction() {
            throw repositoryError;
          },
        }
      ),
    (error) =>
      error === repositoryError
  );
});
