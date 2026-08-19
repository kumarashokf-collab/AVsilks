'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(
    path.join(ROOT, relativePath),
    'utf8'
  );
}

function exists(relativePath) {
  return fs.existsSync(
    path.join(ROOT, relativePath)
  );
}

test('defines Razorpay as a server-controlled payment method', () => {
  const source = read('src/constants/orderPolicy.js');

  assert.match(source, /RAZORPAY:\s*['"]razorpay['"]/);
  assert.match(source, /PAYMENT_STATUS/);
});

test('provides dedicated Razorpay payment boundaries', () => {
  assert.equal(
    exists('src/routes/payment.routes.js'),
    true,
    'missing payment route'
  );

  assert.equal(
    exists('src/controllers/payment.controller.js'),
    true,
    'missing payment controller'
  );

  assert.equal(
    exists('src/services/payment.service.js'),
    true,
    'missing payment service'
  );

  assert.equal(
    exists('src/repositories/payment.repository.js'),
    true,
    'missing payment repository'
  );

  assert.equal(
    exists('src/validators/payment.validator.js'),
    true,
    'missing strict payment validator'
  );
});

test('mounts the protected payment API namespace', () => {
  const source = read('app.js');

  assert.match(source, /\/api\/payments/);
});

test('does not depend on the deprecated external crypto package', () => {
  const packageJson = JSON.parse(
    read('package.json')
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      packageJson.dependencies || {},
      'crypto'
    ),
    false
  );
});

console.log(
  'RAZORPAY_PAYMENT_FOUNDATION_RED_TEST_SETUP=PASS'
);
