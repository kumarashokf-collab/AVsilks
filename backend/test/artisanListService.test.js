'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARTISAN_SERVICE_ERROR,
  listSecureArtisans,
} = require(
  '../src/services/artisan.service'
);

function activeArtisan() {
  return Object.freeze({
    id: 'art_001',
    artisanCode: 'ART-001',
    displayName: 'Lakshmi Weaver',
    craftType: 'Handloom Weaving',
    village: 'Pochampally',
    district: 'Yadadri Bhuvanagiri',
    state: 'Telangana',
    country: 'India',
    loomType: 'Pit Loom',
    active: true,
  });
}

test(
  'rejects unauthenticated artisan list access',
  async () => {
    await assert.rejects(
      () =>
        listSecureArtisans({
          user: null,
        }),
      (error) =>
        error.code ===
        ARTISAN_SERVICE_ERROR
          .AUTHENTICATION_REQUIRED
    );
  }
);

test(
  'delegates authenticated artisan list to repository',
  async () => {
    let capturedDependencies = null;

    const repositoryResult =
      Object.freeze([
        activeArtisan(),
      ]);

    const result =
      await listSecureArtisans(
        {
          user: {
            uid: '  admin-uid-1  ',
          },
        },
        {
          listActiveArtisans:
            async (dependencies) => {
              capturedDependencies =
                dependencies;

              return repositoryResult;
            },

          repositoryDependencies: {
            marker:
              'artisan-list-repository-test',
          },
        }
      );

    assert.equal(
      result,
      repositoryResult
    );

    assert.deepEqual(
      capturedDependencies,
      {
        marker:
          'artisan-list-repository-test',
      }
    );
  }
);

test(
  'supports an empty active artisan list',
  async () => {
    const empty =
      Object.freeze([]);

    const result =
      await listSecureArtisans(
        {
          user: {
            uid: 'admin-uid-1',
          },
        },
        {
          listActiveArtisans:
            async () => empty,
        }
      );

    assert.equal(
      result,
      empty
    );

    assert.deepEqual(
      result,
      []
    );
  }
);

test(
  'rejects invalid artisan list repository dependency',
  async () => {
    await assert.rejects(
      () =>
        listSecureArtisans(
          {
            user: {
              uid: 'admin-uid-1',
            },
          },
          {
            listActiveArtisans:
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

test(
  'rejects malformed artisan list repository result',
  async () => {
    await assert.rejects(
      () =>
        listSecureArtisans(
          {
            user: {
              uid: 'admin-uid-1',
            },
          },
          {
            listActiveArtisans:
              async () => ({
                unexpected:
                  true,
              }),
          }
        ),
      (error) =>
        error.code ===
        ARTISAN_SERVICE_ERROR
          .INVALID_REPOSITORY
    );
  }
);
