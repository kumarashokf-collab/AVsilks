'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_REPOSITORY_ERROR,
  getPublishedProvenanceByPublicId,
} = require(
  '../src/repositories/provenance.repository'
);

const {
  PROVENANCE_STATUS,
} = require(
  '../src/constants/provenancePolicy'
);

function createHarness({
  publicIndexExists = true,
  provenanceExists = true,
  provenanceStatus =
    PROVENANCE_STATUS.PUBLISHED,
} = {}) {
  const reads = [];

  const documents = {
    'provenancePublicIds/pub-001': {
      exists: publicIndexExists,
      data: {
        provenanceId: 'prov-001',
        publicId: 'pub-001',
      },
    },

    'provenanceRecords/prov-001': {
      exists: provenanceExists,
      data: {
        id: 'prov-001',
        publicId: 'pub-001',
        productId: 'product-001',
        artisanId: 'artisan-001',
        skuSnapshot: 'SKU-001',
        productNameSnapshot:
          'Handloom Silk Saree',
        artisanCodeSnapshot:
          'ART-0001',
        artisanNameSnapshot:
          'Lakshmi Weaver',
        material: 'Pure Silk',
        weaveTechnique:
          'Handloom Ikat',
        loomType: 'Pit Loom',

        origin: {
          village: 'Pochampally',
          district:
            'Yadadri Bhuvanagiri',
          state: 'Telangana',
          country: 'India',
        },

        status: provenanceStatus,
        schemaVersion: 1,

        createdBy:
          'internal-admin',
        updatedBy:
          'internal-admin',
        createdAt:
          'internal-time',
        updatedAt:
          'internal-time',
        publishedAt:
          'internal-time',
        archivedAt: null,
      },
    },
  };

  const db = {
    collection(name) {
      return {
        doc(id) {
          const path =
            name + '/' + id;

          return {
            path,

            async get() {
              reads.push(path);

              const document =
                documents[path];

              if (!document) {
                throw new Error(
                  'Unexpected read: ' +
                    path
                );
              }

              return {
                exists:
                  document.exists,

                data() {
                  return document.data;
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    reads,
    dependencies: {
      db,
    },
  };
}

test(
  'returns a published provenance record through its opaque public ID',
  async () => {
    const harness =
      createHarness();

    const result =
      await getPublishedProvenanceByPublicId(
        {
          publicId:
            '  pub-001  ',
        },
        harness.dependencies
      );

    assert.deepEqual(
      harness.reads,
      [
        'provenancePublicIds/pub-001',
        'provenanceRecords/prov-001',
      ]
    );

    assert.equal(
      result.publicId,
      'pub-001'
    );

    assert.equal(
      result.provenance.status,
      PROVENANCE_STATUS.PUBLISHED
    );

    assert.equal(
      result.provenance
        .productNameSnapshot,
      'Handloom Silk Saree'
    );
  }
);

test(
  'hides a missing public provenance ID behind not found',
  async () => {
    const harness =
      createHarness({
        publicIndexExists: false,
      });

    await assert.rejects(
      () =>
        getPublishedProvenanceByPublicId(
          {
            publicId: 'pub-001',
          },
          harness.dependencies
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PUBLIC_PROVENANCE_NOT_FOUND
    );

    assert.deepEqual(
      harness.reads,
      [
        'provenancePublicIds/pub-001',
      ]
    );
  }
);

test(
  'hides a missing provenance record behind the same public not found error',
  async () => {
    const harness =
      createHarness({
        provenanceExists: false,
      });

    await assert.rejects(
      () =>
        getPublishedProvenanceByPublicId(
          {
            publicId: 'pub-001',
          },
          harness.dependencies
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PUBLIC_PROVENANCE_NOT_FOUND
    );
  }
);

test(
  'does not expose draft or archived provenance publicly',
  async () => {
    for (const status of [
      PROVENANCE_STATUS.DRAFT,
      PROVENANCE_STATUS.ARCHIVED,
    ]) {
      const harness =
        createHarness({
          provenanceStatus: status,
        });

      await assert.rejects(
        () =>
          getPublishedProvenanceByPublicId(
            {
              publicId:
                'pub-001',
            },
            harness.dependencies
          ),
        (error) =>
          error.code ===
          PROVENANCE_REPOSITORY_ERROR
            .PUBLIC_PROVENANCE_NOT_FOUND
      );
    }
  }
);

test(
  'rejects inconsistent public index data',
  async () => {
    const harness =
      createHarness();

    harness.dependencies.db
      .collection =
      function collection(name) {
        return {
          doc(id) {
            const path =
              name + '/' + id;

            return {
              path,

              async get() {
                if (
                  path ===
                  'provenancePublicIds/pub-001'
                ) {
                  return {
                    exists: true,

                    data() {
                      return {
                        provenanceId:
                          'bad/id',
                        publicId:
                          'wrong-public-id',
                      };
                    },
                  };
                }

                throw new Error(
                  'Unexpected read.'
                );
              },
            };
          },
        };
      };

    await assert.rejects(
      () =>
        getPublishedProvenanceByPublicId(
          {
            publicId: 'pub-001',
          },
          harness.dependencies
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_PUBLIC_PROVENANCE_DATA
    );
  }
);

test(
  'rejects invalid public ID before database access',
  async () => {
    let databaseAccessed = false;

    const dependencies = {
      db: {
        collection() {
          databaseAccessed = true;

          throw new Error(
            'Database access must not occur.'
          );
        },
      },
    };

    await assert.rejects(
      () =>
        getPublishedProvenanceByPublicId(
          {
            publicId: 'bad/id',
          },
          dependencies
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_INPUT
    );

    assert.equal(
      databaseAccessed,
      false
    );
  }
);
