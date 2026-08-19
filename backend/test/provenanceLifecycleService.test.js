'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_SERVICE_ERROR,
  publishSecureProvenance,
  archiveSecureProvenance,
} = require(
  '../src/services/provenance.service'
);

const {
  PROVENANCE_STATUS,
} = require(
  '../src/constants/provenancePolicy'
);

test(
  'requires authentication before publishing provenance',
  async () => {
    await assert.rejects(
      () =>
        publishSecureProvenance({
          user: null,
          params: {
            id: 'prov-001',
          },
        }),
      (error) =>
        error.code ===
        PROVENANCE_SERVICE_ERROR
          .AUTHENTICATION_REQUIRED
    );
  }
);

test(
  'rejects an invalid provenance lifecycle ID before repository access',
  async () => {
    let repositoryCalled = false;

    await assert.rejects(
      () =>
        publishSecureProvenance(
          {
            user: {
              uid: 'admin-uid-1',
            },

            params: {
              id: 'bad/id',
            },
          },

          {
            transitionProvenanceStatusWithTransaction:
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
  'publishes provenance using server-controlled published status',
  async () => {
    let capturedInput = null;
    let capturedDependencies = null;

    const result =
      await publishSecureProvenance(
        {
          user: {
            uid: '  admin-uid-1  ',
          },

          params: {
            id: '  prov-001  ',
          },
        },

        {
          transitionProvenanceStatusWithTransaction:
            async (
              input,
              dependencies
            ) => {
              capturedInput = input;
              capturedDependencies =
                dependencies;

              return {
                updated: true,
                provenanceId:
                  'prov-001',
                status:
                  PROVENANCE_STATUS.PUBLISHED,
              };
            },

          repositoryDependencies: {
            marker:
              'lifecycle-repository-test',
          },
        }
      );

    assert.deepEqual(
      capturedInput,
      {
        adminUserId:
          'admin-uid-1',

        provenanceId:
          'prov-001',

        nextStatus:
          PROVENANCE_STATUS.PUBLISHED,
      }
    );

    assert.deepEqual(
      capturedDependencies,
      {
        marker:
          'lifecycle-repository-test',
      }
    );

    assert.equal(
      result.status,
      PROVENANCE_STATUS.PUBLISHED
    );
  }
);

test(
  'archives provenance using server-controlled archived status',
  async () => {
    let capturedInput = null;

    const result =
      await archiveSecureProvenance(
        {
          user: {
            uid: 'admin-uid-1',
          },

          params: {
            id: 'prov-001',
          },
        },

        {
          transitionProvenanceStatusWithTransaction:
            async (input) => {
              capturedInput = input;

              return {
                updated: true,
                provenanceId:
                  'prov-001',
                status:
                  PROVENANCE_STATUS.ARCHIVED,
              };
            },
        }
      );

    assert.equal(
      capturedInput.nextStatus,
      PROVENANCE_STATUS.ARCHIVED
    );

    assert.equal(
      result.status,
      PROVENANCE_STATUS.ARCHIVED
    );
  }
);

test(
  'rejects invalid lifecycle repository dependency',
  async () => {
    await assert.rejects(
      () =>
        publishSecureProvenance(
          {
            user: {
              uid: 'admin-uid-1',
            },

            params: {
              id: 'prov-001',
            },
          },

          {
            transitionProvenanceStatusWithTransaction:
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
  'propagates lifecycle repository security errors unchanged',
  async () => {
    const repositoryError =
      new Error(
        'transition rejected'
      );

    repositoryError.code =
      'INVALID_STATUS_TRANSITION';

    await assert.rejects(
      () =>
        archiveSecureProvenance(
          {
            user: {
              uid: 'admin-uid-1',
            },

            params: {
              id: 'prov-001',
            },
          },

          {
            transitionProvenanceStatusWithTransaction:
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
