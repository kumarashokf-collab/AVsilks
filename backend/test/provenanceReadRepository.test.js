'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_REPOSITORY_ERROR,
  getProvenanceById,
} = require(
  '../src/repositories/provenance.repository'
);

const {
  PROVENANCE_STATUS,
} = require(
  '../src/constants/provenancePolicy'
);

function createFakeDatabase({
  exists = true,
  data = {},
} = {}) {
  const reads = [];

  const db = {
    collection(
      collectionName
    ) {
      return {
        doc(
          documentId
        ) {
          return {
            async get() {
              reads.push({
                collectionName,
                documentId,
              });

              return {
                exists,

                data() {
                  return data;
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    db,
    reads,
  };
}

function createRecord(
  status =
    PROVENANCE_STATUS.DRAFT
) {
  return {
    id:
      'prov-001',

    publicId:
      'pub-001',

    productId:
      'product-001',

    artisanId:
      'artisan-001',

    skuSnapshot:
      'SKU-001',

    productNameSnapshot:
      'Handloom Silk Saree',

    artisanCodeSnapshot:
      'ART-0001',

    artisanNameSnapshot:
      'Lakshmi Weaver',

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

    status,
    schemaVersion: 1,

    createdBy:
      'admin-001',

    updatedBy:
      'admin-001',
  };
}

test(
  'reads provenance by normalized internal provenance ID',
  async () => {
    const {
      db,
      reads,
    } = createFakeDatabase({
      data:
        createRecord(),
    });

    const result =
      await getProvenanceById(
        {
          provenanceId:
            '  prov-001  ',
        },
        {
          db,
        }
      );

    assert.deepEqual(
      reads,
      [
        {
          collectionName:
            'provenanceRecords',

          documentId:
            'prov-001',
        },
      ]
    );

    assert.equal(
      result.provenanceId,
      'prov-001'
    );

    assert.equal(
      result.provenance.status,
      PROVENANCE_STATUS.DRAFT
    );

    assert.equal(
      result.provenance.publicId,
      'pub-001'
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.equal(
      Object.isFrozen(
        result.provenance
      ),
      true
    );
  }
);

test(
  'returns draft published and archived records for authenticated management use',
  async () => {
    for (const status of [
      PROVENANCE_STATUS.DRAFT,
      PROVENANCE_STATUS.PUBLISHED,
      PROVENANCE_STATUS.ARCHIVED,
    ]) {
      const {
        db,
      } = createFakeDatabase({
        data:
          createRecord(status),
      });

      const result =
        await getProvenanceById(
          {
            provenanceId:
              'prov-001',
          },
          {
            db,
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
  'returns provenance not found when the internal record does not exist',
  async () => {
    const {
      db,
    } = createFakeDatabase({
      exists: false,
    });

    await assert.rejects(
      () =>
        getProvenanceById(
          {
            provenanceId:
              'prov-001',
          },
          {
            db,
          }
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PROVENANCE_NOT_FOUND
    );
  }
);

test(
  'rejects invalid provenance ID before database access',
  async () => {
    let databaseAccessed = false;

    const db = {
      collection() {
        databaseAccessed = true;

        throw new Error(
          'database should not be accessed'
        );
      },
    };

    for (const provenanceId of [
      '',
      'bad/id',
    ]) {
      await assert.rejects(
        () =>
          getProvenanceById(
            {
              provenanceId,
            },
            {
              db,
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_INPUT
      );
    }

    assert.equal(
      databaseAccessed,
      false
    );
  }
);

test(
  'rejects malformed stored provenance management data',
  async () => {
    for (const data of [
      {
        ...createRecord(),
        id:
          'different-id',
      },

      {
        ...createRecord(),
        publicId:
          '',
      },

      {
        ...createRecord(),
        status:
          'unknown-status',
      },
    ]) {
      const {
        db,
      } = createFakeDatabase({
        data,
      });

      await assert.rejects(
        () =>
          getProvenanceById(
            {
              provenanceId:
                'prov-001',
            },
            {
              db,
            }
          ),
        (error) =>
          error.code ===
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_PROVENANCE_DATA
      );
    }
  }
);

test(
  'rejects invalid provenance read repository dependencies',
  async () => {
    await assert.rejects(
      () =>
        getProvenanceById(
          {
            provenanceId:
              'prov-001',
          },
          {
            db: {},
          }
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_DEPENDENCIES
    );
  }
);
