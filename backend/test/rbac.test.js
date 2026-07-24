'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ROLES } = require('../src/constants/roles');
const { PERMISSIONS } = require('../src/constants/permissions');
const { validateRbacConfiguration } = require('../src/constants/validateRbac');
const {
  requirePermission,
  roleHasPermission,
  matchesPermission,
} = require('../src/middleware/requirePermission');
const { verifyRole } = require('../src/middleware/verifyRole');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('RBAC configuration is valid', () => {
  const result = validateRbacConfiguration();

  assert.equal(result.valid, true);
  assert.ok(result.roleCount > 0);
  assert.ok(result.permissionCount > 0);
});

test('owner global wildcard grants every permission', () => {
  assert.equal(
    roleHasPermission(ROLES.OWNER, PERMISSIONS.SECURITY_MANAGE),
    true
  );
});

test('admin can create products', () => {
  assert.equal(
    roleHasPermission(ROLES.ADMIN, PERMISSIONS.PRODUCTS_CREATE),
    true
  );
});

test('vendor can create products but cannot manage users', () => {
  assert.equal(
    roleHasPermission(ROLES.VENDOR, PERMISSIONS.PRODUCTS_CREATE),
    true
  );

  assert.equal(
    roleHasPermission(ROLES.VENDOR, PERMISSIONS.USERS_MANAGE),
    false
  );
});

test('customer cannot create products', () => {
  assert.equal(
    roleHasPermission(ROLES.CUSTOMER, PERMISSIONS.PRODUCTS_CREATE),
    false
  );
});

test('permission matcher supports global and scoped wildcards', () => {
  assert.equal(matchesPermission('*', PERMISSIONS.PRODUCTS_CREATE), true);
  assert.equal(
    matchesPermission('products.*', PERMISSIONS.PRODUCTS_CREATE),
    true
  );
  assert.equal(
    matchesPermission('products.*', PERMISSIONS.USERS_MANAGE),
    false
  );
});

test('permission middleware returns 401 when authentication is missing', () => {
  const request = {};
  const response = createResponse();
  let nextCalled = false;

  requirePermission(PERMISSIONS.PRODUCTS_CREATE)(
    request,
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('permission middleware returns 403 for unauthorized customer', () => {
  const request = {
    user: {
      uid: 'test-customer',
      role: ROLES.CUSTOMER,
    },
  };

  const response = createResponse();
  let nextCalled = false;

  requirePermission(PERMISSIONS.PRODUCTS_CREATE)(
    request,
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('permission middleware allows authorized admin', () => {
  const request = {
    user: {
      uid: 'test-admin',
      role: ROLES.ADMIN,
    },
  };

  const response = createResponse();
  let nextCalled = false;

  requirePermission(PERMISSIONS.PRODUCTS_CREATE)(
    request,
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(
    request.authorization.requiredPermissions,
    [PERMISSIONS.PRODUCTS_CREATE]
  );
});

test('unknown role receives no permissions', () => {
  assert.equal(
    roleHasPermission('unknown-role', PERMISSIONS.PRODUCTS_CREATE),
    false
  );
});


test('verifyRole returns 401 when authentication is missing', () => {
  const response = createResponse();
  let nextCalled = false;

  verifyRole(ROLES.ADMIN)({}, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('verifyRole returns 403 for an invalid role', () => {
  const request = {
    user: {
      uid: 'test-invalid-role',
      role: 'invalid-role',
    },
  };

  const response = createResponse();
  let nextCalled = false;

  verifyRole(ROLES.ADMIN)(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('verifyRole returns 403 when customer is not allowed', () => {
  const request = {
    user: {
      uid: 'test-customer-role',
      role: ROLES.CUSTOMER,
    },
  };

  const response = createResponse();
  let nextCalled = false;

  verifyRole(ROLES.ADMIN)(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('verifyRole allows an authorized admin', () => {
  const request = {
    user: {
      uid: 'test-admin-role',
      role: ROLES.ADMIN,
    },
  };

  const response = createResponse();
  let nextCalled = false;

  verifyRole(ROLES.ADMIN)(request, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
});
