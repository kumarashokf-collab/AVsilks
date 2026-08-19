'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ARTISAN_API_ERROR,
  fetchActiveArtisans,
  createArtisan,
} from '../src/services/artisan.js';

function createUser() {
  return {
    uid: 'admin-001',

    async getIdToken() {
      return 'trusted-id-token';
    },
  };
}

function artisanData(
  overrides = {}
) {
  return {
    id: 'art-001',
    artisanCode: 'ART-001',
    displayName: 'Lakshmi Weaver',
    craftType: 'Handloom Weaving',
    village: 'Pochampally',
    district: 'Yadadri Bhuvanagiri',
    state: 'Telangana',
    country: 'India',
    loomType: 'Pit Loom',
    active: true,

    ...overrides,
  };
}

function createPayload(
  overrides = {}
) {
  return {
    artisanCode: ' art-001 ',
    displayName: ' Lakshmi Weaver ',
    craftType: ' Handloom Weaving ',
    village: ' Pochampally ',
    district: ' Yadadri Bhuvanagiri ',
    state: ' Telangana ',
    country: ' India ',
    loomType: ' Pit Loom ',

    ...overrides,
  };
}

test(
  'fetches sanitized active artisans through authenticated GET endpoint',
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await fetchActiveArtisans(
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

            return {
              ok: true,
              status: 200,

              async json() {
                return {
                  success: true,

                  data: [
                    {
                      ...artisanData(),

                      createdBy:
                        'private-admin-uid',

                      updatedAt:
                        'private-timestamp',
                    },
                  ],
                };
              },
            };
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/artisans'
    );

    assert.deepEqual(
      capturedOptions,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',

          Authorization:
            'Bearer trusted-id-token',
        },
      }
    );

    assert.equal(
      result.length,
      1
    );

    assert.deepEqual(
      result[0],
      artisanData()
    );

    assert.equal(
      Object.hasOwn(
        result[0],
        'createdBy'
      ),
      false
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.equal(
      Object.isFrozen(result[0]),
      true
    );
  }
);

test(
  'supports an empty active artisan list',
  async () => {
    const result =
      await fetchActiveArtisans(
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
                return {
                  success: true,
                  data: [],
                };
              },
            };
          },
        }
      );

    assert.deepEqual(
      result,
      []
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  'creates artisan through authenticated POST with normalized payload',
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await createArtisan(
        createPayload(),
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

            return {
              ok: true,
              status: 201,

              async json() {
                return {
                  success: true,
                  created: true,
                  data:
                    artisanData(),
                };
              },
            };
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/artisans'
    );

    assert.equal(
      capturedOptions.method,
      'POST'
    );

    assert.equal(
      capturedOptions.headers.Accept,
      'application/json'
    );

    assert.equal(
      capturedOptions.headers[
        'Content-Type'
      ],
      'application/json'
    );

    assert.equal(
      capturedOptions.headers.Authorization,
      'Bearer trusted-id-token'
    );

    assert.deepEqual(
      JSON.parse(
        capturedOptions.body
      ),
      {
        artisanCode:
          'art-001',

        displayName:
          'Lakshmi Weaver',

        craftType:
          'Handloom Weaving',

        village:
          'Pochampally',

        district:
          'Yadadri Bhuvanagiri',

        state:
          'Telangana',

        country:
          'India',

        loomType:
          'Pit Loom',

        active:
          true,
      }
    );

    assert.deepEqual(
      result,
      artisanData()
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  'requires authenticated user before artisan network requests',
  async () => {
    let fetchCalled = false;

    await assert.rejects(
      () =>
        fetchActiveArtisans(
          null,
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
        ARTISAN_API_ERROR
          .AUTHENTICATION_REQUIRED
    );

    await assert.rejects(
      () =>
        createArtisan(
          createPayload(),
          null,
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
        ARTISAN_API_ERROR
          .AUTHENTICATION_REQUIRED
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'rejects invalid artisan create input before token and network access',
  async () => {
    let tokenCalled = false;
    let fetchCalled = false;

    const user = {
      uid: 'admin-001',

      async getIdToken() {
        tokenCalled = true;
        return 'token';
      },
    };

    for (const payload of [
      {},
      createPayload({
        artisanCode:
          'bad/code',
      }),
      createPayload({
        displayName:
          ' ',
      }),
      createPayload({
        active:
          'yes',
      }),
    ]) {
      await assert.rejects(
        () =>
          createArtisan(
            payload,
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
          ARTISAN_API_ERROR
            .INVALID_INPUT
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
  'preserves safe backend artisan conflict code',
  async () => {
    await assert.rejects(
      () =>
        createArtisan(
          createPayload(),
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
                      'ARTISAN_CODE_CONFLICT',

                    message:
                      'Artisan code already exists.',
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
        'ARTISAN_CODE_CONFLICT'
    );
  }
);

test(
  'rejects malformed successful artisan responses',
  async () => {
    await assert.rejects(
      () =>
        fetchActiveArtisans(
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
                  return {
                    success: true,

                    data: [
                      artisanData({
                        id: '',
                      }),
                    ],
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
        ARTISAN_API_ERROR
          .INVALID_RESPONSE
    );

    await assert.rejects(
      () =>
        createArtisan(
          createPayload(),
          createUser(),
          {
            getApiBaseUrlFn() {
              return '/api';
            },

            async fetchImpl() {
              return {
                ok: true,
                status: 201,

                async json() {
                  return {
                    success: true,
                    created: true,

                    data: {
                      ...artisanData(),

                      active: false,
                    },
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
        ARTISAN_API_ERROR
          .INVALID_RESPONSE
    );
  }
);

test(
  'rejects invalid artisan service dependencies',
  async () => {
    await assert.rejects(
      () =>
        fetchActiveArtisans(
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
        createArtisan(
          createPayload(),
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
  }
);
