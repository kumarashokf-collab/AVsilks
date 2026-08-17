'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVENANCE_LIFECYCLE_ERROR,
  publishProvenance,
  archiveProvenance,
} from '../src/services/provenanceLifecycle.js';

function createUser() {
  return {
    uid: 'admin-001',

    async getIdToken() {
      return 'trusted-id-token';
    },
  };
}

function createSuccessResponse(
  id,
  status
) {
  return {
    ok: true,
    status: 200,

    async json() {
      return {
        success: true,

        data: {
          id,
          status,
        },
      };
    },
  };
}

test(
  'publishes provenance through the protected lifecycle endpoint',
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await publishProvenance(
        '  prov-001  ',
        createUser(),
        {
          getApiBaseUrlFn() {
            return '/api/';
          },

          async fetchImpl(
            url,
            options
          ) {
            capturedUrl = url;
            capturedOptions = options;

            return createSuccessResponse(
              'prov-001',
              'published'
            );
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/provenance/prov-001/publish'
    );

    assert.equal(
      capturedOptions.method,
      'POST'
    );

    assert.deepEqual(
      capturedOptions.headers,
      {
        Accept:
          'application/json',

        Authorization:
          'Bearer trusted-id-token',
      }
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        capturedOptions,
        'body'
      ),
      false
    );

    assert.deepEqual(
      result,
      {
        id:
          'prov-001',

        status:
          'published',
      }
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  'archives provenance through the protected lifecycle endpoint',
  async () => {
    let capturedUrl = null;

    const result =
      await archiveProvenance(
        'prov-001',
        createUser(),
        {
          getApiBaseUrlFn() {
            return '/api';
          },

          async fetchImpl(
            url
          ) {
            capturedUrl = url;

            return createSuccessResponse(
              'prov-001',
              'archived'
            );
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/provenance/prov-001/archive'
    );

    assert.deepEqual(
      result,
      {
        id:
          'prov-001',

        status:
          'archived',
      }
    );
  }
);

test(
  'requires a trusted authenticated user before lifecycle requests',
  async () => {
    let fetchCalled = false;

    for (const user of [
      null,
      {},
      {
        uid:
          'admin-001',
      },
    ]) {
      await assert.rejects(
        () =>
          publishProvenance(
            'prov-001',
            user,
            {
              getApiBaseUrlFn() {
                return '/api';
              },

              async fetchImpl() {
                fetchCalled = true;
              },
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_LIFECYCLE_ERROR
            .AUTHENTICATION_REQUIRED
      );
    }

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'rejects invalid provenance ID before token or network access',
  async () => {
    let tokenCalled = false;
    let fetchCalled = false;

    const user = {
      uid:
        'admin-001',

      async getIdToken() {
        tokenCalled = true;
        return 'token';
      },
    };

    for (const id of [
      '',
      'bad/id',
      'x'.repeat(129),
    ]) {
      await assert.rejects(
        () =>
          publishProvenance(
            id,
            user,
            {
              getApiBaseUrlFn() {
                return '/api';
              },

              async fetchImpl() {
                fetchCalled = true;
              },
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_LIFECYCLE_ERROR
            .INVALID_PROVENANCE_ID
      );
    }

    assert.equal(
      tokenCalled,
      false
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'preserves backend lifecycle conflict code for admin handling',
  async () => {
    await assert.rejects(
      () =>
        archiveProvenance(
          'prov-001',
          createUser(),
          {
            getApiBaseUrlFn() {
              return '/api';
            },

            async fetchImpl() {
              return {
                ok: false,
                status: 409,

                async json() {
                  return {
                    success: false,

                    code:
                      'INVALID_STATUS_TRANSITION',

                    message:
                      'Invalid provenance status transition.',
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
          'INVALID_STATUS_TRANSITION' &&
        error.message ===
          'Invalid provenance status transition.'
    );
  }
);

test(
  'rejects malformed lifecycle success responses',
  async () => {
    for (const body of [
      {
        success: true,

        data: {
          id:
            'different-id',

          status:
            'published',
        },
      },

      {
        success: true,

        data: {
          id:
            'prov-001',

          status:
            'draft',
        },
      },

      {
        success: true,
        data: null,
      },
    ]) {
      await assert.rejects(
        () =>
          publishProvenance(
            'prov-001',
            createUser(),
            {
              getApiBaseUrlFn() {
                return '/api';
              },

              async fetchImpl() {
                return {
                  ok: true,
                  status: 200,

                  async json() {
                    return body;
                  },
                };
              },
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_LIFECYCLE_ERROR
            .INVALID_RESPONSE
      );
    }
  }
);

test(
  'rejects invalid lifecycle service dependencies',
  async () => {
    await assert.rejects(
      () =>
        publishProvenance(
          'prov-001',
          createUser(),
          {
            fetchImpl:
              'not-a-function',

            getApiBaseUrlFn() {
              return '/api';
            },
          }
        ),
      TypeError
    );

    await assert.rejects(
      () =>
        publishProvenance(
          'prov-001',
          createUser(),
          {
            async fetchImpl() {
              throw new Error(
                'should not run'
              );
            },

            getApiBaseUrlFn:
              'not-a-function',
          }
        ),
      TypeError
    );
  }
);
