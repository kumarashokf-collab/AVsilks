'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVENANCE_CREATE_ERROR,
  createProvenance,
} from '../src/services/provenanceCreate.js';

function createUser() {
  return {
    uid: 'admin-001',

    async getIdToken() {
      return 'trusted-id-token';
    },
  };
}

function validPayload(
  overrides = {}
) {
  return {
    productId:
      ' product-001 ',

    artisanId:
      ' artisan-001 ',

    material:
      ' Pure Silk ',

    weaveTechnique:
      ' Handloom Ikat ',

    loomType:
      ' Pit Loom ',

    origin: {
      village:
        ' Pochampally ',

      district:
        ' Yadadri Bhuvanagiri ',

      state:
        ' Telangana ',

      country:
        ' India ',
    },

    ...overrides,
  };
}

test(
  'creates draft provenance through authenticated POST endpoint',
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await createProvenance(
        validPayload(),
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

                  data: {
                    id:
                      'prov-001',

                    publicId:
                      'pub-001',

                    status:
                      'draft',

                    productId:
                      'product-001',

                    artisanId:
                      'artisan-001',

                    createdBy:
                      'private-admin-uid',
                  },
                };
              },
            };
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/provenance'
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

        'Content-Type':
          'application/json',

        Authorization:
          'Bearer trusted-id-token',
      }
    );

    assert.deepEqual(
      JSON.parse(
        capturedOptions.body
      ),
      {
        productId:
          'product-001',

        artisanId:
          'artisan-001',

        material:
          'Pure Silk',

        weaveTechnique:
          'Handloom Ikat',

        loomType:
          'Pit Loom',

        origin: {
          village:
            'Pochampally',

          district:
            'Yadadri Bhuvanagiri',

          state:
            'Telangana',

          country:
            'India',
        },
      }
    );

    assert.deepEqual(
      result,
      {
        id:
          'prov-001',

        publicId:
          'pub-001',

        status:
          'draft',
      }
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.equal(
      Object.hasOwn(
        result,
        'productId'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result,
        'createdBy'
      ),
      false
    );
  }
);

test(
  'requires authenticated user before network request',
  async () => {
    let fetchCalled = false;

    await assert.rejects(
      () =>
        createProvenance(
          validPayload(),
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
        PROVENANCE_CREATE_ERROR
          .AUTHENTICATION_REQUIRED
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'rejects invalid product and artisan IDs before token or network access',
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
      validPayload({
        productId: '',
      }),

      validPayload({
        productId:
          'bad/product',
      }),

      validPayload({
        artisanId: '',
      }),

      validPayload({
        artisanId:
          'bad/artisan',
      }),

      validPayload({
        productId:
          'x'.repeat(129),
      }),
    ]) {
      await assert.rejects(
        () =>
          createProvenance(
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
          PROVENANCE_CREATE_ERROR
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
  'rejects incomplete craft and origin fields before network access',
  async () => {
    const invalidPayloads = [
      validPayload({
        material: ' ',
      }),

      validPayload({
        weaveTechnique:
          ' ',
      }),

      validPayload({
        loomType: ' ',
      }),

      validPayload({
        origin: {
          ...validPayload().origin,
          village: ' ',
        },
      }),

      validPayload({
        origin: {
          ...validPayload().origin,
          country: ' ',
        },
      }),
    ];

    for (const payload of invalidPayloads) {
      await assert.rejects(
        () =>
          createProvenance(
            payload,
            createUser(),
            {
              getApiBaseUrlFn() {
                return '/api';
              },

              async fetchImpl() {
                throw new Error(
                  'Network must not be called.'
                );
              },
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_CREATE_ERROR
            .INVALID_INPUT
      );
    }
  }
);

test(
  'preserves product already linked conflict code',
  async () => {
    await assert.rejects(
      () =>
        createProvenance(
          validPayload(),
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
                      'PRODUCT_ALREADY_LINKED',

                    message:
                      'Product already has provenance.',
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
        'PRODUCT_ALREADY_LINKED'
    );
  }
);

test(
  'preserves artisan and product readiness backend errors',
  async () => {
    for (const code of [
      'PRODUCT_NOT_FOUND',
      'ARTISAN_NOT_FOUND',
      'ARTISAN_INACTIVE',
      'INVALID_PRODUCT_DATA',
      'INVALID_ARTISAN_DATA',
    ]) {
      await assert.rejects(
        () =>
          createProvenance(
            validPayload(),
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
                      code,
                      message:
                        'Safe backend message.',
                    };
                  },
                };
              },
            }
          ),
        (error) =>
          error.code === code
      );
    }
  }
);

test(
  'rejects malformed successful provenance create responses',
  async () => {
    for (const data of [
      {
        id: '',
        publicId: 'pub-001',
        status: 'draft',
      },

      {
        id: 'prov-001',
        publicId: '',
        status: 'draft',
      },

      {
        id: 'prov-001',
        publicId: 'pub-001',
        status: 'published',
      },
    ]) {
      await assert.rejects(
        () =>
          createProvenance(
            validPayload(),
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
                      data,
                    };
                  },
                };
              },
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_CREATE_ERROR
            .INVALID_RESPONSE
      );
    }
  }
);

test(
  'rejects invalid provenance create service dependencies',
  async () => {
    await assert.rejects(
      () =>
        createProvenance(
          validPayload(),
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
