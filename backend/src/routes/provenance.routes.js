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

  if (
    typeof verifyAuthMiddleware !==
      'function' ||
    typeof requirePermissionFn !==
      'function' ||
    typeof createProvenanceHandler !==
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
  };
}

function createProvenanceRouter(
  dependencies = {}
) {
  const {
    verifyAuthMiddleware,
    requirePermissionFn,
    createProvenanceHandler,
  } =
    resolveProvenanceRouteDependencies(
      dependencies
    );

  const createPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.PROVENANCE_CREATE
    );

  if (
    typeof createPermissionMiddleware !==
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

  return router;
}

module.exports = {
  resolveProvenanceRouteDependencies,
  createProvenanceRouter,
};
