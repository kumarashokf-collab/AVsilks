'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARTISAN_SERVICE_ERROR,
  createSecureArtisan,
} = require(
  '../src/services/artisan.service'
);

function validPayload(overrides = {}) {
  return {
    artisanCode: '  art-0001  ',
    displayName: '  Lakshmi Weaver  ',
    craftType: '  Handloom Weaving  ',
    village: '  Pochampally  ',
    district: '  Yadadri Bhuvanagiri  ',
    state: '  Telangana  ',
    country: '  India  ',
    loomType: '  Pit Loom  ',
    ...overrides,
  };
}

test(
  'rejects unauthenticated artisan creation',
  async () => {
    await assert.rejects(
      () =>
        createSecureArtisan({
          user: null,
          payload: validPayload(),
        }),
      (error) =>
        error.code ===
        ARTISAN_SERVICE_ERROR
          .AUTHENTICATION_REQUIRED
    );
  }
);

test(
  'rejects invalid artisan payload with validation details',
  async () => {
    await assert.rejects(
      () =>
        createSecureArtisan({
          user: {
            uid: 'admin-uid-1',
          },
          payload: {
            artisanCode: '',
            createdBy:
              'client-controlled',
          },
        }),
      (error) =>
        error.code ===
          ARTISAN_SERVICE_ERROR
            .VALIDATION_FAILED &&
        Array.isArray(error.details) &&
        error.details.length > 0
    );
  }
);

test(
  'passes validated normalized artisan data to repository',
  async () => {
    let capturedInput = null;
    let capturedDependencies = null;

    const result =
      await createSecureArtisan(
        {
          user: {
            uid: '  admin-uid-1  ',
          },
          payload: validPayload(),
        },
        {
          createArtisanWithTransaction:
            async (
              input,
              dependencies
            ) => {
              capturedInput = input;
              capturedDependencies =
                dependencies;

              return {
                created: true,
                artisanId:
                  'art_test_0001',
              };
            },

          repositoryDependencies: {
            marker: 'repository-test',
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
      capturedInput.artisanData
        .artisanCode,
      'art-0001'
    );

    assert.equal(
      capturedInput.artisanData
        .displayName,
      'Lakshmi Weaver'
    );

    assert.equal(
      capturedInput.artisanData.active,
      true
    );

    assert.deepEqual(
      capturedDependencies,
      {
        marker: 'repository-test',
      }
    );
  }
);

test(
  'rejects invalid artisan repository dependency',
  async () => {
    await assert.rejects(
      () =>
        createSecureArtisan(
          {
            user: {
              uid: 'admin-uid-1',
            },
            payload: validPayload(),
          },
          {
            createArtisanWithTransaction:
              'not-a-function',
          }
        ),
      (error) =>
        error.code ===
        ARTISAN_SERVICE_ERROR
          .INVALID_REPOSITORY
    );
  }
);
