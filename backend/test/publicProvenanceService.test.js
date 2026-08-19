'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_SERVICE_ERROR,
  getPublicProvenance,
} = require(
  '../src/services/provenance.service'
);

test(
  'validates and normalizes public provenance ID before repository access',
  async () => {
    let capturedInput = null;
    let capturedDependencies = null;

    const result =
      await getPublicProvenance(
        {
          params: {
            publicId:
              '  pub-001  ',
          },
        },

        {
          getPublishedProvenanceByPublicId:
            async (
              input,
              dependencies
            ) => {
              capturedInput = input;
              capturedDependencies =
                dependencies;

              return {
                publicId:
                  'pub-001',

                provenance: {
                  publicId:
                    'pub-001',
                  status:
                    'published',
                },
              };
            },

          repositoryDependencies: {
            marker:
              'public-read-test',
          },
        }
      );

    assert.deepEqual(
      capturedInput,
      {
        publicId:
          'pub-001',
      }
    );

    assert.deepEqual(
      capturedDependencies,
      {
        marker:
          'public-read-test',
      }
    );

    assert.equal(
      result.publicId,
      'pub-001'
    );
  }
);

test(
  'does not require authentication for public provenance verification',
  async () => {
    let repositoryCalled = false;

    await getPublicProvenance(
      {
        user: null,

        params: {
          publicId:
            'pub-001',
        },
      },

      {
        getPublishedProvenanceByPublicId:
          async () => {
            repositoryCalled = true;

            return {
              publicId:
                'pub-001',

              provenance: {
                status:
                  'published',
              },
            };
          },
      }
    );

    assert.equal(
      repositoryCalled,
      true
    );
  }
);

test(
  'rejects invalid public provenance ID before repository access',
  async () => {
    let repositoryCalled = false;

    await assert.rejects(
      () =>
        getPublicProvenance(
          {
            params: {
              publicId:
                'bad/id',
            },
          },

          {
            getPublishedProvenanceByPublicId:
              async () => {
                repositoryCalled = true;
              },
          }
        ),
      (error) =>
        error.code ===
          PROVENANCE_SERVICE_ERROR
            .VALIDATION_FAILED &&
        Array.isArray(error.details) &&
        error.details.length > 0
    );

    assert.equal(
      repositoryCalled,
      false
    );
  }
);

test(
  'rejects invalid public provenance repository dependency',
  async () => {
    await assert.rejects(
      () =>
        getPublicProvenance(
          {
            params: {
              publicId:
                'pub-001',
            },
          },

          {
            getPublishedProvenanceByPublicId:
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

test(
  'propagates public provenance repository security errors unchanged',
  async () => {
    const repositoryError =
      new Error(
        'public provenance unavailable'
      );

    repositoryError.code =
      'PUBLIC_PROVENANCE_NOT_FOUND';

    await assert.rejects(
      () =>
        getPublicProvenance(
          {
            params: {
              publicId:
                'pub-001',
            },
          },

          {
            getPublishedProvenanceByPublicId:
              async () => {
                throw repositoryError;
              },
          }
        ),
      (error) =>
        error === repositoryError
    );
  }
);
