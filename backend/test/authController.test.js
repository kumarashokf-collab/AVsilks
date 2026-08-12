'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ROLES,
} = require('../src/constants/roles');

const {
  sanitizeAuthenticatedUser,
  getAuthSession,
} = require('../src/controllers/auth.controller');

function createResponse() {
  return {
    statusCode: 0,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('sanitizes trusted authenticated identity to uid and role only', () => {
  const session =
    sanitizeAuthenticatedUser({
      uid: 'owner-uid-1',
      role: ' OWNER ',
      email: 'private-test-value',
      phoneNumber: 'redacted-test-value',
      authTime: 123,
    });

  assert.deepEqual(session, {
    uid: 'owner-uid-1',
    role: ROLES.OWNER,
  });

  assert.equal(
    Object.isFrozen(session),
    true
  );
});

test('rejects missing uid or invalid role', () => {
  assert.equal(
    sanitizeAuthenticatedUser({
      role: ROLES.ADMIN,
    }),
    null
  );

  assert.equal(
    sanitizeAuthenticatedUser({
      uid: 'user-1',
      role: 'unknown-role',
    }),
    null
  );
});

test('returns minimal trusted session response', () => {
  const response = createResponse();

  getAuthSession(
    {
      user: {
        uid: 'admin-uid-1',
        role: ROLES.ADMIN,
        email: 'private-test-value',
        phoneNumber: 'redacted-test-value',
        authTime: 123,
      },
    },
    response
  );

  assert.equal(response.statusCode, 200);

  assert.deepEqual(response.body, {
    success: true,
    data: {
      uid: 'admin-uid-1',
      role: ROLES.ADMIN,
    },
  });

  assert.deepEqual(
    Object.keys(response.body.data).sort(),
    ['role', 'uid']
  );
});

test('fails closed without a trusted authenticated user', () => {
  const response = createResponse();

  getAuthSession({}, response);

  assert.equal(response.statusCode, 401);

  assert.deepEqual(response.body, {
    success: false,
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication is required.',
  });
});
