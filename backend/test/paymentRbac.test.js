'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PERMISSIONS,
} = require('../src/constants/permissions');

const {
  ROLES,
} = require('../src/constants/roles');

const {
  roleHasPermission,
} = require('../src/middleware/requirePermission');

test('defines a least-privilege payment creation permission', () => {
  assert.equal(
    PERMISSIONS.PAYMENTS_CREATE,
    'payments.create'
  );
});

test('customer may initiate a payment but may not manage payments', () => {
  assert.equal(
    roleHasPermission(
      ROLES.CUSTOMER,
      PERMISSIONS.PAYMENTS_CREATE
    ),
    true
  );

  assert.equal(
    roleHasPermission(
      ROLES.CUSTOMER,
      PERMISSIONS.PAYMENTS_MANAGE
    ),
    false
  );
});

test('owner retains payment authority through the global wildcard', () => {
  assert.equal(
    roleHasPermission(
      ROLES.OWNER,
      PERMISSIONS.PAYMENTS_CREATE
    ),
    true
  );
});

console.log(
  'PAYMENT_RBAC_RED_TEST_SETUP=PASS'
);
