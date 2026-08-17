'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVENANCE_MANAGEMENT_ERROR,
  fetchManagedProvenance,
} from '../src/services/provenanceManagement.js';

function createUser() {
  return {
    uid:
      'admin-001',

    async getIdToken() {
      return 'trusted-id-token';
    },
  };
}

function createManagedResponse(
  status = 'draft'
) {
  return {
    success: true,

    data: {
      id:
        'prov-001',

      publicId:
        'pub-001',

      status,

      product: {
        sku:
          'SKU-001',

        name:
          'Handloom Silk Saree',
      },

      artisan: {
        code:
          'ART-0001',

        name:
          'Lakshmi Weaver',
      },

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
    },
  };
}

test(
  'fetches managed provenance through authenticated GET endpoint',
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await fetchManagedProvenance(
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
            capturedUrl =
              url;

            capturedOptions =
              options;

            return {
              ok: true,
              status: 200,

              async json() {
                return createManagedResponse();
              },
            };
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/provenance/prov-001'
    );

    assert.deepEqual(
      capturedOptions,
      {
        method:
          'GET',

        headers: {
          Accept:
            'application/json',

          Authorization:
            'Bearer trusted-id-token',
        },
      }
    );

    assert.equal(
      result.id,
      'prov-001'
    );

    assert.equal(
      result.publicId,
      'pub-001'
    );

    assert.equal(
      result.status,
      'draft'
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  'supports draft published and archived management states',
  async () => {
    for (const status of [
      'draft',
      'published',
      'archived',
    ]) {
      const result =
        await fetchManagedProvenance(
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
                  return createManagedResponse(
                    status
                  );
                },
              };
            },
          }
        );

      assert.equal(
        result.status,
        status
      );
    }
  }
);

test(
  'requires authenticated user before token or network access',
  async () => {
    let fetchCalled = false;

    await assert.rejects(
      () =>
        fetchManagedProvenance(
          'prov-001',
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
        PROVENANCE_MANAGEMENT_ERROR
          .AUTHENTICATION_REQUIRED
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'rejects invalid provenance ID before token and network access',
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
          fetchManagedProvenance(
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
          PROVENANCE_MANAGEMENT_ERROR
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
  'preserves backend not found code for admin handling',
  async () => {
    await assert.rejects(
      () =>
        fetchManagedProvenance(
          'prov-001',
          createUser(),
          {
            getApiBaseUrlFn() {
              return '/api';
            },

            async fetchImpl() {
              return {
                ok: false,
                status: 404,

                async json() {
                  return {
                    success: false,

                    code:
                      'PROVENANCE_NOT_FOUND',

                    message:
                      'Provenance record was not found.',
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
          'PROVENANCE_NOT_FOUND'
    );
  }
);

test(
  'rejects malformed successful management response',
  async () => {
    for (const body of [
      {
        success: true,

        data: {
          ...createManagedResponse().data,

          id:
            'different-id',
        },
      },

      {
        success: true,

        data: {
          ...createManagedResponse().data,

          status:
            'unknown',
        },
      },

      {
        success: true,
        data: null,
      },
    ]) {
      await assert.rejects(
        () =>
          fetchManagedProvenance(
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
          PROVENANCE_MANAGEMENT_ERROR
            .INVALID_RESPONSE
      );
    }
  }
);

test(
  'rejects invalid management service dependencies',
  async () => {
    await assert.rejects(
      () =>
        fetchManagedProvenance(
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
  }
);
