'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createAuthRouter,
  resolveAuthRouteDependencies,
} = require('../src/routes/auth.routes');

function verifyAuth(req, res, next) {
  next();
}

function getAuthSession(req, res) {
  res.end();
}

test('protects GET /me with authentication', () => {
  const router = createAuthRouter({
    verifyAuthMiddleware: verifyAuth,
    getAuthSessionHandler: getAuthSession,
  });

  const routeLayer =
    router.stack.find(
      (layer) =>
        layer.route?.path === '/me' &&
        layer.route?.methods?.get === true
    );

  assert.ok(routeLayer);

  assert.equal(
    routeLayer.route.stack.length,
    2
  );

  assert.equal(
    routeLayer.route.stack[0].handle,
    verifyAuth
  );

  assert.equal(
    routeLayer.route.stack[1].handle,
    getAuthSession
  );
});

test('rejects invalid auth route dependencies', () => {
  assert.throws(
    () =>
      resolveAuthRouteDependencies({
        verifyAuthMiddleware:
          'not-a-function',
        getAuthSessionHandler:
          getAuthSession,
      }),
    TypeError
  );

  assert.throws(
    () =>
      resolveAuthRouteDependencies({
        verifyAuthMiddleware:
          verifyAuth,
        getAuthSessionHandler:
          'not-a-function',
      }),
    TypeError
  );
});
