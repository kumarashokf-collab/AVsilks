'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ROLES,
} = require('../src/constants/roles');

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

function createDatabase({
  exists = false,
  role = null,
} = {}) {
  return {
    collection() {
      return {
        doc() {
          return {
            async get() {
              return {
                exists,

                data() {
                  return {
                    role,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function loadVerifyAuth({
  verifyIdToken,
  getUser,
  database = createDatabase(),
} = {}) {
  const firebasePath =
    require.resolve(
      '../src/config/firebase'
    );

  const verifyAuthPath =
    require.resolve(
      '../src/middleware/verifyAuth'
    );

  delete require.cache[verifyAuthPath];

  require.cache[firebasePath] = {
    id: firebasePath,
    filename: firebasePath,
    loaded: true,

    exports: {
      admin: {
        auth() {
          return {
            verifyIdToken:
              verifyIdToken ||
              (async () => ({
                uid: 'customer-uid-1',
              })),

            getUser:
              getUser ||
              (async () => ({
                disabled: false,
              })),
          };
        },
      },

      db: database,
    },
  };

  return {
    verifyAuth:
      require(verifyAuthPath),

    cleanup() {
      delete require.cache[
        verifyAuthPath
      ];

      delete require.cache[
        firebasePath
      ];
    },
  };
}

test('missing token returns standardized authentication error', async () => {
  const loaded = loadVerifyAuth();

  try {
    const response =
      createResponse();

    let nextCalled = false;

    await loaded.verifyAuth(
      {
        headers: {},
      },
      response,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(
      response.statusCode,
      401
    );

    assert.deepEqual(
      response.body,
      {
        success: false,
        code:
          'AUTHENTICATION_REQUIRED',
        message:
          'Authentication token is required.',
      }
    );

    assert.equal(
      nextCalled,
      false
    );
  } finally {
    loaded.cleanup();
  }
});

test('invalid token returns standardized authentication error', async () => {
  const loaded =
    loadVerifyAuth({
      async verifyIdToken() {
        throw Object.assign(
          new Error(
            'Simulated revoked token'
          ),
          {
            code:
              'auth/id-token-revoked',
          }
        );
      },
    });

  const originalWarn =
    console.warn;

  console.warn = () => {};

  try {
    const response =
      createResponse();

    let nextCalled = false;

    await loaded.verifyAuth(
      {
        headers: {
          authorization:
            'Bearer invalid-token',
        },
      },
      response,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(
      response.statusCode,
      401
    );

    assert.deepEqual(
      response.body,
      {
        success: false,
        code:
          'AUTHENTICATION_INVALID',
        message:
          'Invalid, expired or revoked authentication token.',
      }
    );

    assert.equal(
      nextCalled,
      false
    );
  } finally {
    console.warn =
      originalWarn;

    loaded.cleanup();
  }
});

test('disabled account returns standardized account error', async () => {
  const loaded =
    loadVerifyAuth({
      async verifyIdToken(
        token,
        checkRevoked
      ) {
        assert.equal(
          token,
          'disabled-token'
        );

        assert.equal(
          checkRevoked,
          true
        );

        return {
          uid:
            'disabled-user-uid',
        };
      },

      async getUser(uid) {
        assert.equal(
          uid,
          'disabled-user-uid'
        );

        return {
          disabled: true,
        };
      },
    });

  try {
    const response =
      createResponse();

    let nextCalled = false;

    await loaded.verifyAuth(
      {
        headers: {
          authorization:
            'Bearer disabled-token',
        },
      },
      response,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(
      response.statusCode,
      403
    );

    assert.deepEqual(
      response.body,
      {
        success: false,
        code:
          'ACCOUNT_DISABLED',
        message:
          'User account is disabled.',
      }
    );

    assert.equal(
      nextCalled,
      false
    );
  } finally {
    loaded.cleanup();
  }
});

test('valid token attaches trusted user and calls next', async () => {
  const loaded =
    loadVerifyAuth({
      async verifyIdToken(
        token,
        checkRevoked
      ) {
        assert.equal(
          token,
          'valid-token'
        );

        assert.equal(
          checkRevoked,
          true
        );

        return {
          uid:
            'customer-uid-1',
          email:
            'customer@example.com',
          phone_number:
            '+919876543210',
          auth_time: 123456,
          role: ROLES.CUSTOMER,
        };
      },

      async getUser(uid) {
        assert.equal(
          uid,
          'customer-uid-1'
        );

        return {
          disabled: false,
        };
      },
    });

  try {
    const request = {
      headers: {
        authorization:
          'Bearer valid-token',
      },
    };

    const response =
      createResponse();

    let nextCalled = false;

    await loaded.verifyAuth(
      request,
      response,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(
      nextCalled,
      true
    );

    assert.deepEqual(
      request.user,
      {
        uid: 'customer-uid-1',
        email:
          'customer@example.com',
        phoneNumber:
          '+919876543210',
        role: ROLES.CUSTOMER,
        authTime: 123456,
      }
    );

    assert.equal(
      response.statusCode,
      200
    );

    assert.equal(
      response.body,
      null
    );
  } finally {
    loaded.cleanup();
  }
});
