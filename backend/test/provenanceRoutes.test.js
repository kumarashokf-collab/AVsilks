'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PERMISSIONS,
} = require(
  '../src/constants/permissions'
);

const {
  createProvenanceRouter,
  resolveProvenanceRouteDependencies,
} = require(
  '../src/routes/provenance.routes'
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

function createProvenance(
  req,
  res
) {
  res.end();
}

function buildRouter() {
  let capturedPermission = null;

  const router =
    createProvenanceRouter({
      verifyAuthMiddleware:
        verifyAuth,

      requirePermissionFn(
        permission
      ) {
        capturedPermission =
          permission;

        return permissionMiddleware;
      },

      createProvenanceHandler:
        createProvenance,
    });

  return {
    router,
    capturedPermission,
  };
}

test(
  'protects POST / with provenance.create permission',
  () => {
    const {
      router,
      capturedPermission,
    } = buildRouter();

    assert.equal(
      capturedPermission,
      PERMISSIONS.PROVENANCE_CREATE
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
      createProvenance
    );
  }
);

test(
  'rejects invalid provenance route dependencies',
  () => {
    assert.throws(
      () =>
        resolveProvenanceRouteDependencies({
          verifyAuthMiddleware:
            'not-a-function',

          requirePermissionFn:
            () =>
              permissionMiddleware,

          createProvenanceHandler:
            createProvenance,
        }),
      TypeError
    );

    assert.throws(
      () =>
        resolveProvenanceRouteDependencies({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            'not-a-function',

          createProvenanceHandler:
            createProvenance,
        }),
      TypeError
    );

    assert.throws(
      () =>
        resolveProvenanceRouteDependencies({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            () =>
              permissionMiddleware,

          createProvenanceHandler:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'rejects an invalid provenance.create permission middleware',
  () => {
    assert.throws(
      () =>
        createProvenanceRouter({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            () =>
              'not-a-function',

          createProvenanceHandler:
            createProvenance,
        }),
      TypeError
    );
  }
);
