'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('payment router requires authentication and payments.create for Razorpay order and verify routes', () => {
  const {
    createPaymentRouter,
  } = require('../src/routes/payment.routes');

  const calls = [];

  function verifyAuth(req, res, next) {
    calls.push('auth');
    next();
  }

  function requirePermission(permission) {
    assert.equal(permission, 'payments.create');

    return function paymentPermission(req, res, next) {
      calls.push('permission');
      next();
    };
  }

  function createRazorpayOrder(req, res) {
    calls.push('create');
    res.status(201).json({ success: true });
  }

  function verifyRazorpayPayment(req, res) {
    calls.push('verify');
    res.status(200).json({ success: true });
  }

  const router = createPaymentRouter({
    verifyAuthMiddleware: verifyAuth,
    requirePermissionFn: requirePermission,
    createRazorpayOrderHandler: createRazorpayOrder,
    verifyRazorpayPaymentHandler: verifyRazorpayPayment,
  });

  const routes = router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods,
      handlers: layer.route.stack.map(
        (entry) => entry.handle
      ),
    }));

  const createRoute = routes.find(
    (route) =>
      route.path === '/razorpay/order' &&
      route.methods.post
  );

  const verifyRoute = routes.find(
    (route) =>
      route.path === '/razorpay/verify' &&
      route.methods.post
  );

  assert.ok(createRoute, 'missing Razorpay order route');
  assert.ok(verifyRoute, 'missing Razorpay verify route');

  const fakeResponse = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  };

  calls.length = 0;

  for (const handler of createRoute.handlers) {
    let continued = false;

    handler(
      { user: { uid: 'customer-1' } },
      fakeResponse,
      () => {
        continued = true;
      }
    );

    if (!continued) {
      break;
    }
  }

  assert.deepEqual(
    calls,
    ['auth', 'permission', 'create']
  );

  calls.length = 0;

  for (const handler of verifyRoute.handlers) {
    let continued = false;

    handler(
      { user: { uid: 'customer-1' } },
      fakeResponse,
      () => {
        continued = true;
      }
    );

    if (!continued) {
      break;
    }
  }

  assert.deepEqual(
    calls,
    ['auth', 'permission', 'verify']
  );
});

console.log(
  'PAYMENT_ROUTES_RED_TEST_SETUP=PASS'
);
