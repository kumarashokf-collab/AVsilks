'use strict';

const express = require('express');

const {
  PERMISSIONS,
} = require(
  '../constants/permissions'
);

function resolveProvenanceRouteDependencies(
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

  const createProvenanceHandler =
    dependencies.createProvenanceHandler ||
    require(
      '../controllers/provenance.controller'
    ).createProvenance;

  const publishProvenanceHandler =
    dependencies.publishProvenanceHandler ||
    require(
      '../controllers/provenance.controller'
    ).publishProvenance;

  const archiveProvenanceHandler =
    dependencies.archiveProvenanceHandler ||
    require(
      '../controllers/provenance.controller'
    ).archiveProvenance;

  const getProvenanceHandler =
    dependencies.getProvenanceHandler ||
    require(
      '../controllers/provenance.controller'
    ).getProvenance;

  const verifyPublicProvenanceHandler =
    dependencies.verifyPublicProvenanceHandler ||
    require(
      '../controllers/provenance.controller'
    ).verifyPublicProvenance;

  if (
    typeof verifyAuthMiddleware !==
      'function' ||
    typeof requirePermissionFn !==
      'function' ||
    typeof createProvenanceHandler !==
      'function' ||
    typeof publishProvenanceHandler !==
      'function' ||
    typeof archiveProvenanceHandler !==
      'function' ||
    typeof getProvenanceHandler !==
      'function' ||
    typeof verifyPublicProvenanceHandler !==
      'function'
  ) {
    throw new TypeError(
      'Provenance route dependencies must be functions.'
    );
  }

  return {
    verifyAuthMiddleware,
    requirePermissionFn,
    createProvenanceHandler,
    publishProvenanceHandler,
    archiveProvenanceHandler,
    getProvenanceHandler,
    verifyPublicProvenanceHandler,
  };
}

function createProvenanceRouter(
  dependencies = {}
) {
  const {
    verifyAuthMiddleware,
    requirePermissionFn,
    createProvenanceHandler,
    publishProvenanceHandler,
    archiveProvenanceHandler,
    getProvenanceHandler,
    verifyPublicProvenanceHandler,
  } =
    resolveProvenanceRouteDependencies(
      dependencies
    );

  const publishPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.PROVENANCE_PUBLISH
    );

  const archivePermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.PROVENANCE_ARCHIVE
    );

  const createPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.PROVENANCE_CREATE
    );

  const readPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.PROVENANCE_READ
    );

  if (
    typeof createPermissionMiddleware !==
      'function' ||
    typeof publishPermissionMiddleware !==
      'function' ||
    typeof archivePermissionMiddleware !==
      'function' ||
    typeof readPermissionMiddleware !==
      'function'
  ) {
    throw new TypeError(
      'Provenance permission middleware must be a function.'
    );
  }

  const router = express.Router();

  router.post(
    '/',
    verifyAuthMiddleware,
    createPermissionMiddleware,
    createProvenanceHandler
  );

  router.post(
    '/:id/publish',
    verifyAuthMiddleware,
    publishPermissionMiddleware,
    publishProvenanceHandler
  );

  router.post(
    '/:id/archive',
    verifyAuthMiddleware,
    archivePermissionMiddleware,
    archiveProvenanceHandler
  );

  router.get(
    '/public/:publicId',
    verifyPublicProvenanceHandler
  );

  router.get(
    '/:id',
    verifyAuthMiddleware,
    readPermissionMiddleware,
    getProvenanceHandler
  );

  return router;
}

module.exports = {
  resolveProvenanceRouteDependencies,
  createProvenanceRouter,
};
