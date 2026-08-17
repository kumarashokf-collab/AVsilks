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

function publishProvenance(
  req,
  res
) {
  res.end();
}

function archiveProvenance(
  req,
  res
) {
  res.end();
}

function buildRouter() {
  const capturedPermissions = [];

  const router =
    createProvenanceRouter({
      verifyAuthMiddleware:
        verifyAuth,

      requirePermissionFn(
        permission
      ) {
        capturedPermissions.push(
          permission
        );

        return permissionMiddleware;
      },

      createProvenanceHandler:
        createProvenance,

      publishProvenanceHandler:
        publishProvenance,

      archiveProvenanceHandler:
        archiveProvenance,
    });

  return {
    router,
    capturedPermissions,
  };
}

function findRoute(
  router,
  path,
  method
) {
  return router.stack.find(
    (layer) =>
      layer.route?.path === path &&
      layer.route?.methods?.[method] ===
        true
  );
}

test(
  'protects publish and archive endpoints with dedicated permissions',
  () => {
    const {
      router,
      capturedPermissions,
    } = buildRouter();

    assert.ok(
      findRoute(
        router,
        '/:id/publish',
        'post'
      )
    );

    assert.ok(
      findRoute(
        router,
        '/:id/archive',
        'post'
      )
    );

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.PROVENANCE_PUBLISH
      ),
      true
    );

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.PROVENANCE_ARCHIVE
      ),
      true
    );

    assert.equal(
      capturedPermissions.includes(
        PERMISSIONS.PROVENANCE_CREATE
      ),
      true
    );
  }
);

test(
  'runs publish authentication permission and controller in order',
  () => {
    const {
      router,
    } = buildRouter();

    const routeLayer =
      findRoute(
        router,
        '/:id/publish',
        'post'
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
      publishProvenance
    );
  }
);

test(
  'runs archive authentication permission and controller in order',
  () => {
    const {
      router,
    } = buildRouter();

    const routeLayer =
      findRoute(
        router,
        '/:id/archive',
        'post'
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
      archiveProvenance
    );
  }
);

test(
  'preserves the existing create provenance endpoint',
  () => {
    const {
      router,
    } = buildRouter();

    const routeLayer =
      findRoute(
        router,
        '/',
        'post'
      );

    assert.ok(routeLayer);

    assert.equal(
      routeLayer.route.stack[2].handle,
      createProvenance
    );
  }
);

test(
  'rejects invalid lifecycle route handler dependencies',
  () => {
    assert.throws(
      () =>
        resolveProvenanceRouteDependencies({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn:
            () =>
              permissionMiddleware,

          createProvenanceHandler:
            createProvenance,

          publishProvenanceHandler:
            'not-a-function',

          archiveProvenanceHandler:
            archiveProvenance,
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
            createProvenance,

          publishProvenanceHandler:
            publishProvenance,

          archiveProvenanceHandler:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'rejects invalid lifecycle permission middleware',
  () => {
    assert.throws(
      () =>
        createProvenanceRouter({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn(
            permission
          ) {
            if (
              permission ===
              PERMISSIONS.PROVENANCE_PUBLISH
            ) {
              return 'not-a-function';
            }

            return permissionMiddleware;
          },

          createProvenanceHandler:
            createProvenance,

          publishProvenanceHandler:
            publishProvenance,

          archiveProvenanceHandler:
            archiveProvenance,
        }),
      TypeError
    );

    assert.throws(
      () =>
        createProvenanceRouter({
          verifyAuthMiddleware:
            verifyAuth,

          requirePermissionFn(
            permission
          ) {
            if (
              permission ===
              PERMISSIONS.PROVENANCE_ARCHIVE
            ) {
              return 'not-a-function';
            }

            return permissionMiddleware;
          },

          createProvenanceHandler:
            createProvenance,

          publishProvenanceHandler:
            publishProvenance,

          archiveProvenanceHandler:
            archiveProvenance,
        }),
      TypeError
    );
  }
);
