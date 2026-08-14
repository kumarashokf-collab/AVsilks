'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_SERVICE_ERROR,
  createSecureProvenance,
} = require(
  '../src/services/provenance.service'
);

function validPayload(overrides = {}) {
  return {
    productId: '  product-001  ',
    artisanId: '  artisan-001  ',
    material: '  Pure Silk  ',
    weaveTechnique: '  Handloom Ikat  ',
    loomType: '  Pit Loom  ',

    origin: {
      village: '  Pochampally  ',
      district: '  Yadadri Bhuvanagiri  ',
      state: '  Telangana  ',
      country: '  India  ',
    },

    ...overrides,
  };
}

test(
  'rejects unauthenticated provenance creation',
  async () => {
    await assert.rejects(
      () =>
        createSecureProvenance({
          user: null,
          payload: validPayload(),
        }),
      (error) =>
        error.code ===
        PROVENANCE_SERVICE_ERROR
          .AUTHENTICATION_REQUIRED
    );
  }
);

test(
  'rejects invalid provenance payload with validation details',
  async () => {
    await assert.rejects(
      () =>
        createSecureProvenance({
          user: {
            uid: 'admin-uid-1',
          },

          payload: {
            ...validPayload(),
            publicId:
              'client-controlled',
            status: 'published',
          },
        }),
      (error) =>
        error.code ===
          PROVENANCE_SERVICE_ERROR
            .VALIDATION_FAILED &&
        Array.isArray(error.details) &&
        error.details.length > 0
    );
  }
);

test(
  'passes validated normalized provenance data to repository',
  async () => {
    let capturedInput = null;
    let capturedDependencies = null;

    const result =
      await createSecureProvenance(
        {
          user: {
            uid: '  admin-uid-1  ',
          },

          payload: validPayload(),
        },

        {
          createProvenanceWithTransaction:
            async (
              input,
              dependencies
            ) => {
              capturedInput = input;
              capturedDependencies =
                dependencies;

              return {
                created: true,
                provenanceId:
                  'prov_test_0001',
                publicId:
                  'pub_test_0001',
              };
            },

          repositoryDependencies: {
            marker:
              'provenance-repository-test',
          },
        }
      );

    assert.equal(
      result.created,
      true
    );

    assert.equal(
      capturedInput.adminUserId,
      'admin-uid-1'
    );

    assert.equal(
      capturedInput.provenanceData
        .productId,
      'product-001'
    );

    assert.equal(
      capturedInput.provenanceData
        .artisanId,
      'artisan-001'
    );

    assert.equal(
      capturedInput.provenanceData
        .material,
      'Pure Silk'
    );

    assert.equal(
      capturedInput.provenanceData
        .weaveTechnique,
      'Handloom Ikat'
    );

    assert.equal(
      capturedInput.provenanceData
        .origin.village,
      'Pochampally'
    );

    assert.deepEqual(
      capturedDependencies,
      {
        marker:
          'provenance-repository-test',
      }
    );
  }
);

test(
  'rejects invalid provenance repository dependency',
  async () => {
    await assert.rejects(
      () =>
        createSecureProvenance(
          {
            user: {
              uid: 'admin-uid-1',
            },

            payload: validPayload(),
          },

          {
            createProvenanceWithTransaction:
              'not-a-function',
          }
        ),
      (error) =>
        error.code ===
        PROVENANCE_SERVICE_ERROR
          .INVALID_REPOSITORY
    );
  }
);
