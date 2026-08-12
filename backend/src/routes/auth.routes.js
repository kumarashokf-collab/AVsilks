'use strict';

const express = require('express');

function resolveAuthRouteDependencies(
  dependencies = {}
) {
  const verifyAuthMiddleware =
    dependencies.verifyAuthMiddleware ||
    require('../middleware/verifyAuth');

  const getAuthSessionHandler =
    dependencies.getAuthSessionHandler ||
    require('../controllers/auth.controller')
      .getAuthSession;

  if (
    typeof verifyAuthMiddleware !== 'function' ||
    typeof getAuthSessionHandler !== 'function'
  ) {
    throw new TypeError(
      'Auth route dependencies must be functions.'
    );
  }

  return {
    verifyAuthMiddleware,
    getAuthSessionHandler,
  };
}

function createAuthRouter(dependencies = {}) {
  const {
    verifyAuthMiddleware,
    getAuthSessionHandler,
  } = resolveAuthRouteDependencies(
    dependencies
  );

  const router = express.Router();

  router.get(
    '/me',
    verifyAuthMiddleware,
    getAuthSessionHandler
  );

  return router;
}

module.exports = {
  resolveAuthRouteDependencies,
  createAuthRouter,
};
