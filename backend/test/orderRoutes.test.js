'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PERMISSIONS,
} = require('../src/constants/permissions');

const {
  createOrderRouter,
  resolveOrderRouteDependencies,
} = require('../src/routes/order.routes');

function verifyAuth(req, res, next) {
  next();
}

function permissionMiddleware(
  req,
  res,
  next
) {
  next();
}

function createOrder(req, res) {
  res.end();
}

function cancelOrder(req, res) {
  res.end();
}

function transitionOrder(req, res) {
  res.end();
}

function buildRouter() {
  let capturedPermission = null;
  const capturedPermissions = [];

  const router = createOrderRouter({
    verifyAuthMiddleware: verifyAuth,

    requirePermissionFn(permission) {
      if (capturedPermission === null) {
        capturedPermission = permission;
      }

      capturedPermissions.push(
        permission
      );

      return permissionMiddleware;
    },

    createOrderHandler: createOrder,
    cancelOrderHandler: cancelOrder,
    transitionOrderHandler:
      transitionOrder,
  });

  return {
    router,
    capturedPermission,
    capturedPermissions,
  };
}

test('protects POST / with orders.create permission', () => {
  const {
    router,
    capturedPermission,
  } = buildRouter();

  assert.equal(
    capturedPermission,
    PERMISSIONS.ORDERS_CREATE
  );

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path === '/' &&
        layer.route?.methods?.post === true
    );

  assert.ok(routeLayer);
});

test('runs authentication, permission and controller in order', () => {
  const { router } = buildRouter();

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path === '/' &&
        layer.route?.methods?.post === true
    );

  assert.ok(routeLayer);

  assert.equal(
    routeLayer.route.stack.length,
    3
  );

  assert.equal(
    routeLayer.route.stack[0].handle,
    verifyAuth
  );

  assert.equal(
    routeLayer.route.stack[1].handle,
    permissionMiddleware
  );

  assert.equal(
    routeLayer.route.stack[2].handle,
    createOrder
  );
});

test('protects POST /:id/cancel with orders.cancel permission', () => {
  const {
    router,
    capturedPermissions,
  } = buildRouter();

  assert.deepEqual(
    capturedPermissions,
    [
      PERMISSIONS.ORDERS_CREATE,
      PERMISSIONS.ORDERS_CANCEL,
      PERMISSIONS.ORDERS_UPDATE,
    ]
  );

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path ===
          '/:id/cancel' &&
        layer.route?.methods?.post ===
          true
    );

  assert.ok(routeLayer);
});

test('runs cancellation authentication, permission and controller in order', () => {
  const { router } = buildRouter();

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path ===
          '/:id/cancel' &&
        layer.route?.methods?.post ===
          true
    );

  assert.ok(routeLayer);

  assert.equal(
    routeLayer.route.stack.length,
    3
  );

  assert.equal(
    routeLayer.route.stack[0].handle,
    verifyAuth
  );

  assert.equal(
    routeLayer.route.stack[1].handle,
    permissionMiddleware
  );

  assert.equal(
    routeLayer.route.stack[2].handle,
    cancelOrder
  );
});

test('rejects invalid route dependencies', () => {
  assert.throws(
    () =>
      resolveOrderRouteDependencies({
        verifyAuthMiddleware:
          'not-a-function',
        requirePermissionFn:
          () => permissionMiddleware,
        createOrderHandler:
          createOrder,
        cancelOrderHandler:
          cancelOrder,
      }),
    TypeError
  );

  assert.throws(
    () =>
      resolveOrderRouteDependencies({
        verifyAuthMiddleware:
          verifyAuth,
        requirePermissionFn:
          () => permissionMiddleware,
        createOrderHandler:
          createOrder,
        cancelOrderHandler:
          'not-a-function',
      }),
    TypeError
  );
});

test('rejects invalid permission middleware dependencies', () => {
  assert.throws(
    () =>
      createOrderRouter({
        verifyAuthMiddleware:
          verifyAuth,

        requirePermissionFn:
          () => 'not-a-function',

        createOrderHandler:
          createOrder,

        cancelOrderHandler:
          cancelOrder,
      }),
    TypeError
  );

  assert.throws(
    () =>
      createOrderRouter({
        verifyAuthMiddleware:
          verifyAuth,

        requirePermissionFn(
          permission
        ) {
          return permission ===
            PERMISSIONS.ORDERS_CANCEL
            ? 'not-a-function'
            : permissionMiddleware;
        },

        createOrderHandler:
          createOrder,

        cancelOrderHandler:
          cancelOrder,
      }),
    TypeError
  );
});

test('protects PATCH /:id/status with orders.update permission', () => {
  const {
    router,
    capturedPermissions,
  } = buildRouter();

  assert.deepEqual(
    capturedPermissions,
    [
      PERMISSIONS.ORDERS_CREATE,
      PERMISSIONS.ORDERS_CANCEL,
      PERMISSIONS.ORDERS_UPDATE,
    ]
  );

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path ===
          '/:id/status' &&
        layer.route?.methods?.patch ===
          true
    );

  assert.ok(routeLayer);
});

test('runs admin transition authentication permission and controller in order', () => {
  const { router } = buildRouter();

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path ===
          '/:id/status' &&
        layer.route?.methods?.patch ===
          true
    );

  assert.ok(routeLayer);

  assert.equal(
    routeLayer.route.stack.length,
    3
  );

  assert.equal(
    routeLayer.route.stack[0].handle,
    verifyAuth
  );

  assert.equal(
    routeLayer.route.stack[1].handle,
    permissionMiddleware
  );

  assert.equal(
    routeLayer.route.stack[2].handle,
    transitionOrder
  );
});

test('rejects an invalid admin transition route dependency', () => {
  assert.throws(
    () =>
      resolveOrderRouteDependencies({
        verifyAuthMiddleware:
          verifyAuth,

        requirePermissionFn:
          () => permissionMiddleware,

        createOrderHandler:
          createOrder,

        cancelOrderHandler:
          cancelOrder,

        transitionOrderHandler:
          'not-a-function',
      }),
    TypeError
  );
});

test('rejects an invalid orders.update permission middleware', () => {
  assert.throws(
    () =>
      createOrderRouter({
        verifyAuthMiddleware:
          verifyAuth,

        requirePermissionFn(
          permission
        ) {
          return permission ===
            PERMISSIONS.ORDERS_UPDATE
            ? 'not-a-function'
            : permissionMiddleware;
        },

        createOrderHandler:
          createOrder,

        cancelOrderHandler:
          cancelOrder,

        transitionOrderHandler:
          transitionOrder,
      }),
    TypeError
  );
});
