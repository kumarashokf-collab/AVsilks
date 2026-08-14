'use strict';

const express = require('express');

const {
  PERMISSIONS,
} = require(
  '../constants/permissions'
);

function resolveArtisanRouteDependencies(
  dependencies = {}
) {
  const verifyAuthMiddleware =
    dependencies.verifyAuthMiddleware ||
    require(
      '../middleware/verifyAuth'
    );

  const requirePermissionFn =
    dependencies.requirePermissionFn ||
    require(
      '../middleware/requirePermission'
    ).requirePermission;

  const createArtisanHandler =
    dependencies.createArtisanHandler ||
    require(
      '../controllers/artisan.controller'
    ).createArtisan;

  if (
    typeof verifyAuthMiddleware !==
      'function' ||
    typeof requirePermissionFn !==
      'function' ||
    typeof createArtisanHandler !==
      'function'
  ) {
    throw new TypeError(
      'Artisan route dependencies must be functions.'
    );
  }

  return {
    verifyAuthMiddleware,
    requirePermissionFn,
    createArtisanHandler,
  };
}

function createArtisanRouter(
  dependencies = {}
) {
  const {
    verifyAuthMiddleware,
    requirePermissionFn,
    createArtisanHandler,
  } =
    resolveArtisanRouteDependencies(
      dependencies
    );

  const createPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.ARTISANS_CREATE
    );

  if (
    typeof createPermissionMiddleware !==
    'function'
  ) {
    throw new TypeError(
      'Artisan permission middleware must be a function.'
    );
  }

  const router = express.Router();

  router.post(
    '/',
    verifyAuthMiddleware,
    createPermissionMiddleware,
    createArtisanHandler
  );

  return router;
}

module.exports = {
  resolveArtisanRouteDependencies,
  createArtisanRouter,
};
