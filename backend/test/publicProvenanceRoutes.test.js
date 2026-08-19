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
      layer.route?.methods?.[method] ===
        true
  );
}

test(
  'exposes GET /public/:publicId for public provenance verification',
  () => {
    const {
      router,
    } = buildRouter();

    const routeLayer =
      findRoute(
        router,
        '/public/:publicId',
        'get'
      );

    assert.ok(routeLayer);
  }
);

test(
  'public verification route runs only the public controller',
  () => {
    const {
      router,
    } = buildRouter();

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

    assert.notEqual(
      routeLayer.route.stack[0].handle,
      verifyAuth
    );

    assert.notEqual(
      routeLayer.route.stack[0].handle,
      permissionMiddleware
    );
  }
);

test(
  'public verification does not add an RBAC permission requirement',
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
  'preserves protected provenance management routes',
  () => {
    const {
      router,
    } = buildRouter();

    for (const [
      path,
      handler,
    ] of [
      [
        '/',
        createProvenance,
      ],
      [
        '/:id/publish',
        publishProvenance,
      ],
      [
        '/:id/archive',
        archiveProvenance,
      ],
    ]) {
      const routeLayer =
        findRoute(
          router,
          path,
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
        handler
      );
    }
  }
);

test(
  'rejects an invalid public provenance route dependency',
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

          verifyPublicProvenanceHandler:
            'not-a-function',
        }),
      TypeError
    );
  }
);
