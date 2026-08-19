'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_SERVICE_ERROR,
  getSecureProvenance,
} = require(
  '../src/services/provenance.service'
);

const {
  PROVENANCE_STATUS,
} = require(
  '../src/constants/provenancePolicy'
);

function createRepositoryResult(
  status =
    PROVENANCE_STATUS.DRAFT
) {
  return {
    provenanceId:
      'prov-001',

    provenance: {
      id:
        'prov-001',

      publicId:
        'pub-001',

      status,

      productNameSnapshot:
        'Handloom Silk Saree',

      artisanNameSnapshot:
        'Lakshmi Weaver',
    },
  };
}

test(
  'requires authentication before reading managed provenance',
  async () => {
    let repositoryCalled = false;

    await assert.rejects(
      () =>
        getSecureProvenance(
          {
            user: null,

            params: {
              id:
                'prov-001',
            },
          },

          {
            getProvenanceById:
              async () => {
                repositoryCalled = true;
              },
          }
        ),
      (error) =>
        error.code ===
        PROVENANCE_SERVICE_ERROR
          .AUTHENTICATION_REQUIRED
    );

    assert.equal(
      repositoryCalled,
      false
    );
  }
);

test(
  'validates normalizes and reads provenance through repository',
  async () => {
    let capturedInput = null;
    let capturedDependencies = null;

    const result =
      await getSecureProvenance(
        {
          user: {
            uid:
              'admin-001',
          },

          params: {
            id:
              '  prov-001  ',
          },
        },

        {
          getProvenanceById:
            async (
              input,
              dependencies
            ) => {
              capturedInput =
                input;

              capturedDependencies =
                dependencies;

              return createRepositoryResult();
            },

          repositoryDependencies: {
            marker:
              'managed-read-test',
          },
        }
      );

    assert.deepEqual(
      capturedInput,
      {
        provenanceId:
          'prov-001',
      }
    );

    assert.deepEqual(
      capturedDependencies,
      {
        marker:
          'managed-read-test',
      }
    );

    assert.equal(
      result.provenanceId,
      'prov-001'
    );

    assert.equal(
      result.provenance.status,
      PROVENANCE_STATUS.DRAFT
    );
  }
);

test(
  'rejects invalid provenance ID before repository access',
  async () => {
    let repositoryCalled = false;

    await assert.rejects(
      () =>
        getSecureProvenance(
          {
            user: {
              uid:
                'admin-001',
            },

            params: {
              id:
                'bad/id',
            },
          },

          {
            getProvenanceById:
              async () => {
                repositoryCalled = true;
              },
          }
        ),
      (error) =>
        error.code ===
          PROVENANCE_SERVICE_ERROR
            .VALIDATION_FAILED &&
        Array.isArray(
          error.details
        ) &&
        error.details.length > 0
    );

    assert.equal(
      repositoryCalled,
      false
    );
  }
);

test(
  'returns draft published and archived states for management use',
  async () => {
    for (const status of [
      PROVENANCE_STATUS.DRAFT,
      PROVENANCE_STATUS.PUBLISHED,
      PROVENANCE_STATUS.ARCHIVED,
    ]) {
      const result =
        await getSecureProvenance(
          {
            user: {
              uid:
                'admin-001',
            },

            params: {
              id:
                'prov-001',
            },
          },

          {
            getProvenanceById:
              async () =>
                createRepositoryResult(
                  status
                ),
          }
        );

      assert.equal(
        result.provenance.status,
        status
      );
    }
  }
);

test(
  'rejects invalid management read repository dependency',
  async () => {
    await assert.rejects(
      () =>
        getSecureProvenance(
          {
            user: {
              uid:
                'admin-001',
            },

            params: {
              id:
                'prov-001',
            },
          },

          {
            getProvenanceById:
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
  'propagates management repository security errors unchanged',
  async () => {
    const repositoryError =
      new Error(
        'provenance missing'
      );

    repositoryError.code =
      'PROVENANCE_NOT_FOUND';

    await assert.rejects(
      () =>
        getSecureProvenance(
          {
            user: {
              uid:
                'admin-001',
            },

            params: {
              id:
                'prov-001',
            },
          },

          {
            getProvenanceById:
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
