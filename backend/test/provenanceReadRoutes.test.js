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

function getProvenance(
  req,
  res
) {
  res.end();
}

function verifyPublicProvenance(
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

      getProvenanceHandler:
        getProvenance,

      verifyPublicProvenanceHandler:
        verifyPublicProvenance,
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
      layer.route?.methods?.[method] === true
  );
}

test(
  'exposes protected GET /:id for provenance management read',
  () => {
    const { router } =
      buildRouter();

    assert.ok(
      findRoute(
        router,
        '/:id',
        'get'
      )
    );
  }
);

test(
  'runs authentication read permission and controller in order',
  () => {
    const { router } =
      buildRouter();

    const routeLayer =
      findRoute(
        router,
        '/:id',
        'get'
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
      getProvenance
    );
  }
);

test(
  'uses dedicated provenance.read permission for management read',
  () => {
    const {
      capturedPermissions,
    } = buildRouter();

    assert.deepEqual(
      capturedPermissions,
      [
        PERMISSIONS.PROVENANCE_PUBLISH,
        PERMISSIONS.PROVENANCE_ARCHIVE,
        PERMISSIONS.PROVENANCE_CREATE,
        PERMISSIONS.PROVENANCE_READ,
      ]
    );
  }
);

test(
  'preserves anonymous public provenance verification route',
  () => {
    const { router } =
      buildRouter();

    const routeLayer =
      findRoute(
        router,
        '/public/:publicId',
        'get'
      );

    assert.ok(routeLayer);

    assert.equal(
      routeLayer.route.stack.length,
      1
    );

    assert.equal(
      routeLayer.route.stack[0].handle,
      verifyPublicProvenance
    );
  }
);

test(
  'rejects invalid management read route handler dependency',
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
            publishProvenance,

          archiveProvenanceHandler:
            archiveProvenance,

          getProvenanceHandler:
            'not-a-function',

          verifyPublicProvenanceHandler:
            verifyPublicProvenance,
        }),
      TypeError
    );
  }
);

test(
  'rejects invalid provenance.read permission middleware',
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
              PERMISSIONS.PROVENANCE_READ
            ) {
              return null;
            }

            return permissionMiddleware;
          },

          createProvenanceHandler:
            createProvenance,

          publishProvenanceHandler:
            publishProvenance,

          archiveProvenanceHandler:
            archiveProvenance,

          getProvenanceHandler:
            getProvenance,

          verifyPublicProvenanceHandler:
            verifyPublicProvenance,
        }),
      TypeError
    );
  }
);
