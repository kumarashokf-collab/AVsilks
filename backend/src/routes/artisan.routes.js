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

  const listArtisansHandler =
    dependencies.listArtisansHandler ||
    require(
      '../controllers/artisan.controller'
    ).listArtisans;

  if (
    typeof verifyAuthMiddleware !==
      'function' ||
    typeof requirePermissionFn !==
      'function' ||
    typeof createArtisanHandler !==
      'function' ||
    typeof listArtisansHandler !==
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
    listArtisansHandler,
  };
}

function createArtisanRouter(
  dependencies = {}
) {
  const {
    verifyAuthMiddleware,
    requirePermissionFn,
    createArtisanHandler,
    listArtisansHandler,
  } =
    resolveArtisanRouteDependencies(
      dependencies
    );

  const createPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.ARTISANS_CREATE
    );

  const listPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.ARTISANS_LIST
    );

  if (
    typeof createPermissionMiddleware !==
      'function' ||
    typeof listPermissionMiddleware !==
      'function'
  ) {
    throw new TypeError(
      'Artisan permission middleware must be a function.'
    );
  }

  const router =
    express.Router();

  router.post(
    '/',
    verifyAuthMiddleware,
    createPermissionMiddleware,
    createArtisanHandler
  );

  router.get(
    '/',
    verifyAuthMiddleware,
    listPermissionMiddleware,
    listArtisansHandler
  );

  return router;
}

module.exports = {
  resolveArtisanRouteDependencies,
  createArtisanRouter,
};
