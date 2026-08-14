'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PERMISSIONS,
} = require(
  '../src/constants/permissions'
);

const {
  createArtisanRouter,
  resolveArtisanRouteDependencies,
} = require(
  '../src/routes/artisan.routes'
);

function verifyAuth(
  req,
  res,
  next
) {
  next();
}

function permissionMiddleware(
  req,
  res,
  next
) {
  next();
}

function createArtisan(
  req,
  res
) {
  res.end();
}

function buildRouter() {
  let capturedPermission = null;

  const router =
    createArtisanRouter({
      verifyAuthMiddleware:
        verifyAuth,

      requirePermissionFn(
        permission
      ) {
        capturedPermission =
          permission;

        return permissionMiddleware;
      },

      createArtisanHandler:
        createArtisan,
    });

  return {
    router,
    capturedPermission,
  };
}

test(
  'protects POST / with artisans.create permission',
  () => {
    const {
      router,
      capturedPermission,
    } = buildRouter();

    assert.equal(
      capturedPermission,
      PERMISSIONS.ARTISANS_CREATE
    );

    const routeLayer =
      router.stack.find(
        (layer) =>
          layer.route?.path === '/' &&
          layer.route?.methods?.post === true
      );

    assert.ok(routeLayer);
  }
);

test(
  'runs authentication permission and controller in order',
  () => {
    const {
      router,
    } = buildRouter();

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
      createArtisan
    );
  }
);

test(
  'rejects invalid artisan route dependencies',
  () => {
    assert.throws(
      () =>
        resolveArtisanRouteDependencies({
          verifyAuthMiddleware:
            'not-a-function',

          requirePermissionFn:
            () =>
              permissionMiddleware,

          createArtisanHandler:
            createArtisan,
        }),
      TypeError
    );

    assert.throws(
      () =>
        resolveArtisanRouteDependencies({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            'not-a-function',

          createArtisanHandler:
            createArtisan,
        }),
      TypeError
    );

    assert.throws(
      () =>
        resolveArtisanRouteDependencies({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            () =>
              permissionMiddleware,

          createArtisanHandler:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'rejects an invalid artisans.create permission middleware',
  () => {
    assert.throws(
      () =>
        createArtisanRouter({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            () =>
              'not-a-function',

          createArtisanHandler:
            createArtisan,
        }),
      TypeError
    );
  }
);
