'use strict';

const express = require('express');

const {
  PERMISSIONS,
} = require('../constants/permissions');

function resolvePaymentRouteDependencies(
  dependencies = {}
) {
  const verifyAuthMiddleware =
    dependencies.verifyAuthMiddleware ||
    require('../middleware/verifyAuth');

  const requirePermissionFn =
    dependencies.requirePermissionFn ||
    require('../middleware/requirePermission')
      .requirePermission;

  const createRazorpayOrderHandler =
    dependencies.createRazorpayOrderHandler ||
    require('../controllers/payment.controller')
      .createRazorpayOrder;

  const verifyRazorpayPaymentHandler =
    dependencies.verifyRazorpayPaymentHandler ||
    require('../controllers/payment.controller')
      .verifyRazorpayPayment;

  if (
    typeof verifyAuthMiddleware !== 'function' ||
    typeof requirePermissionFn !== 'function' ||
    typeof createRazorpayOrderHandler !== 'function' ||
    typeof verifyRazorpayPaymentHandler !== 'function'
  ) {
    throw new TypeError(
      'Payment route dependencies must be functions.'
    );
  }

  return {
    verifyAuthMiddleware,
    requirePermissionFn,
    createRazorpayOrderHandler,
    verifyRazorpayPaymentHandler,
  };
}

function createPaymentRouter(dependencies = {}) {
  const {
    verifyAuthMiddleware,
    requirePermissionFn,
    createRazorpayOrderHandler,
    verifyRazorpayPaymentHandler,
  } = resolvePaymentRouteDependencies(dependencies);

  const createPaymentPermissionMiddleware =
    requirePermissionFn(
      PERMISSIONS.PAYMENTS_CREATE
    );

  if (
    typeof createPaymentPermissionMiddleware !==
    'function'
  ) {
    throw new TypeError(
      'Payment permission middleware must be a function.'
    );
  }

  const router = express.Router();

  router.post(
    '/razorpay/order',
    verifyAuthMiddleware,
    createPaymentPermissionMiddleware,
    createRazorpayOrderHandler
  );

  router.post(
    '/razorpay/verify',
    verifyAuthMiddleware,
    createPaymentPermissionMiddleware,
    verifyRazorpayPaymentHandler
  );

  return router;
}

module.exports = {
  resolvePaymentRouteDependencies,
  createPaymentRouter,
};
