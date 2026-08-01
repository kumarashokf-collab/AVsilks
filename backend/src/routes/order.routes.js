'use strict';

const express = require('express');

const {
  PERMISSIONS,
} = require('../constants/permissions');

function resolveOrderRouteDependencies(
  dependencies = {}
) {
  const verifyAuthMiddleware =
    dependencies.verifyAuthMiddleware ||
    require('../middleware/verifyAuth');

  const requirePermissionFn =
    dependencies.requirePermissionFn ||
    require('../middleware/requirePermission')
      .requirePermission;

  const createOrderHandler =
    dependencies.createOrderHandler ||
    require('../controllers/order.controller')
      .createOrder;

  const cancelOrderHandler =
    dependencies.cancelOrderHandler ||
    require('../controllers/order.controller')
      .cancelCustomerOrder;

  const transitionOrderHandler =
    dependencies.transitionOrderHandler ||
    require('../controllers/order.controller')
      .transitionAdminOrder;

  if (
    typeof verifyAuthMiddleware !== 'function' ||
    typeof requirePermissionFn !== 'function' ||
    typeof createOrderHandler !== 'function' ||
    typeof cancelOrderHandler !== 'function' ||
    typeof transitionOrderHandler !== 'function'
  ) {
    throw new TypeError(
      'Order route dependencies must be functions.'
    );
  }

  return {
    verifyAuthMiddleware,
    requirePermissionFn,
    createOrderHandler,
    cancelOrderHandler,
    transitionOrderHandler,
  };
}

function createOrderRouter(dependencies = {}) {
  const {
    verifyAuthMiddleware,
    requirePermissionFn,
    createOrderHandler,
    cancelOrderHandler,
    transitionOrderHandler,
  } = resolveOrderRouteDependencies(
    dependencies
  );

  const createPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.ORDERS_CREATE
    );

  const cancelPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.ORDERS_CANCEL
    );

  const transitionPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.ORDERS_UPDATE
    );

  if (
    typeof createPermissionMiddleware !==
      'function' ||
    typeof cancelPermissionMiddleware !==
      'function' ||
    typeof transitionPermissionMiddleware !==
      'function'
  ) {
    throw new TypeError(
      'Order permission middleware must be a function.'
    );
  }

  const router = express.Router();

  router.post(
    '/',
    verifyAuthMiddleware,
    createPermissionMiddleware,
    createOrderHandler
  );

  router.post(
    '/:id/cancel',
    verifyAuthMiddleware,
    cancelPermissionMiddleware,
    cancelOrderHandler
  );

  router.patch(
    '/:id/status',
    verifyAuthMiddleware,
    transitionPermissionMiddleware,
    transitionOrderHandler
  );

  return router;
}

module.exports = {
  resolveOrderRouteDependencies,
  createOrderRouter,
};
