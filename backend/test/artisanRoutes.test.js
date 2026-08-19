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

function createPermissionMiddleware(
  req,
  res,
  next
) {
  next();
}

function listPermissionMiddleware(
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

function listArtisans(
  req,
  res
) {
  res.end();
}

function buildRouter() {
  const capturedPermissions = [];

  const router =
    createArtisanRouter({
      verifyAuthMiddleware:
        verifyAuth,

      requirePermissionFn(
        permission
      ) {
        capturedPermissions.push(
          permission
        );

        if (
          permission ===
          PERMISSIONS.ARTISANS_CREATE
        ) {
          return createPermissionMiddleware;
        }

        if (
          permission ===
          PERMISSIONS.ARTISANS_LIST
        ) {
          return listPermissionMiddleware;
        }

        throw new Error(
          'Unexpected artisan permission: ' +
            permission
        );
      },

      createArtisanHandler:
        createArtisan,

      listArtisansHandler:
        listArtisans,
    });

  return {
    router,
    capturedPermissions,
  };
}

test(
  'protects POST / with artisans.create permission',
  () => {
    const {
      router,
      capturedPermissions,
    } = buildRouter();

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.ARTISANS_CREATE
      ),
      true
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
  'runs POST authentication create permission and controller in order',
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
      createPermissionMiddleware
    );

    assert.equal(
      routeLayer.route.stack[2].handle,
      createArtisan
    );
  }
);

test(
  'protects GET / with artisans.list permission',
  () => {
    const {
      router,
      capturedPermissions,
    } = buildRouter();

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.ARTISANS_LIST
      ),
      true
    );

    const routeLayer =
      router.stack.find(
        (layer) =>
          layer.route?.path === '/' &&
          layer.route?.methods?.get === true
      );

    assert.ok(routeLayer);
  }
);

test(
  'runs GET authentication list permission and controller in order',
  () => {
    const {
      router,
    } = buildRouter();

    const routeLayer =
      router.stack.find(
        (layer) =>
          layer.route?.path === '/' &&
          layer.route?.methods?.get === true
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
      listPermissionMiddleware
    );

    assert.equal(
      routeLayer.route.stack[2].handle,
      listArtisans
    );
  }
);

test(
  'registers dedicated create and list artisan permissions',
  () => {
    const {
      capturedPermissions,
    } = buildRouter();

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.ARTISANS_CREATE
      ),
      true
    );

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.ARTISANS_LIST
      ),
      true
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
              createPermissionMiddleware,

          createArtisanHandler:
            createArtisan,

          listArtisansHandler:
            listArtisans,
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

          listArtisansHandler:
            listArtisans,
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
              createPermissionMiddleware,

          createArtisanHandler:
            'not-a-function',

          listArtisansHandler:
            listArtisans,
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
              createPermissionMiddleware,

          createArtisanHandler:
            createArtisan,

          listArtisansHandler:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'rejects invalid artisan permission middleware',
  () => {
    assert.throws(
      () =>
        createArtisanRouter({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn(
            permission
          ) {
            if (
              permission ===
              PERMISSIONS.ARTISANS_CREATE
            ) {
              return 'not-a-function';
            }

            return listPermissionMiddleware;
          },

          createArtisanHandler:
            createArtisan,

          listArtisansHandler:
            listArtisans,
        }),
      TypeError
    );

    assert.throws(
      () =>
        createArtisanRouter({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn(
            permission
          ) {
            if (
              permission ===
              PERMISSIONS.ARTISANS_LIST
            ) {
              return 'not-a-function';
            }

            return createPermissionMiddleware;
          },

          createArtisanHandler:
            createArtisan,

          listArtisansHandler:
            listArtisans,
        }),
      TypeError
    );
  }
);
