'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PUBLIC_PROVENANCE_ERROR,
  fetchPublicProvenance,
} from '../src/services/publicProvenance.js';

function createPublishedResponse() {
  return {
    success: true,
    verified: true,

    data: {
      publicId:
        'pub-001',

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
  'fetches public provenance without authentication headers',
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await fetchPublicProvenance(
        '  pub-001  ',
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
                return createPublishedResponse();
              },
            };
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/provenance/public/pub-001'
    );

    assert.equal(
      capturedOptions.method,
      'GET'
    );

    assert.deepEqual(
      capturedOptions.headers,
      {
        Accept:
          'application/json',
      }
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        capturedOptions.headers,
        'Authorization'
      ),
      false
    );

    assert.equal(
      result.publicId,
      'pub-001'
    );

    assert.equal(
      result.product.name,
      'Handloom Silk Saree'
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  'rejects invalid public provenance ID before network access',
  async () => {
    let fetchCalled = false;

    for (const publicId of [
      '',
      'bad/id',
      'x'.repeat(129),
    ]) {
      await assert.rejects(
        () =>
          fetchPublicProvenance(
            publicId,
            {
              getApiBaseUrlFn() {
                return '/api';
              },

              async fetchImpl() {
                fetchCalled = true;

                throw new Error(
                  'fetch should not run'
                );
              },
            }
          ),
        (error) =>
          error.code ===
          PUBLIC_PROVENANCE_ERROR
            .INVALID_PUBLIC_ID
      );
    }

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'maps unavailable public provenance to one generic not found error',
  async () => {
    await assert.rejects(
      () =>
        fetchPublicProvenance(
          'pub-001',
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
                    verified: false,
                    code:
                      'PUBLIC_PROVENANCE_NOT_FOUND',
                    message:
                      'internal state must not control frontend message',
                  };
                },
              };
            },
          }
        ),
      (error) =>
        error.code ===
          PUBLIC_PROVENANCE_ERROR
            .NOT_FOUND &&
        error.message ===
          'Provenance verification was not found.'
    );
  }
);

test(
  'rejects malformed or inconsistent successful verification responses',
  async () => {
    for (const body of [
      {
        success: true,
        verified: false,
        data: {
          publicId:
            'pub-001',
        },
      },

      {
        success: true,
        verified: true,
        data: {
          publicId:
            'different-public-id',
        },
      },

      {
        success: true,
        verified: true,
        data: null,
      },
    ]) {
      await assert.rejects(
        () =>
          fetchPublicProvenance(
            'pub-001',
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
          PUBLIC_PROVENANCE_ERROR
            .INVALID_RESPONSE
      );
    }
  }
);

test(
  'rejects invalid frontend public provenance dependencies',
  async () => {
    await assert.rejects(
      () =>
        fetchPublicProvenance(
          'pub-001',
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
        fetchPublicProvenance(
          'pub-001',
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
