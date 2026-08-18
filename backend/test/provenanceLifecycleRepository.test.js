'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_REPOSITORY_ERROR,
  transitionProvenanceStatusWithTransaction,
} = require(
  '../src/repositories/provenance.repository'
);

const {
  PROVENANCE_STATUS,
} = require(
  '../src/constants/provenancePolicy'
);

function createHarness({
  provenanceExists = true,
  provenanceStatus =
    PROVENANCE_STATUS.DRAFT,
} = {}) {
  const reads = [];
  const operations = [];
  const projectionOperations = [];

  const db = {
    collection(name) {
      return {
        doc(id) {
          return {
            path: `${name}/${id}`,
          };
        },
      };
    },

    async runTransaction(callback) {
      const transaction = {
        async get(ref) {
          reads.push(ref.path);

          if (
            ref.path ===
            'provenanceRecords/prov-001'
          ) {
            return {
              exists:
                provenanceExists,

              data() {
                return {
                  id: 'prov-001',
                  publicId: 'pub-001',
                  productId:
                    'product-001',
                  artisanId:
                    'artisan-001',
                  skuSnapshot:
                    'E2E-HANDLOOM-001',
                  productNameSnapshot:
                    'Local Handloom Demo Saree',
                  artisanCodeSnapshot:
                    'ART-E2E-001',
                  artisanNameSnapshot:
                    'Lakshmi Weaver',
                  material:
                    'Pure Silk',
                  weaveTechnique:
                    'Traditional Handloom Weave',
                  loomType:
                    'Pit Loom',
                  origin: {
                    village:
                      'Somandepalli',
                    district:
                      'Sri Sathya Sai',
                    state:
                      'Andhra Pradesh',
                    country:
                      'India',
                  },
                  status:
                    provenanceStatus,
                };
              },
            };
          }

          throw new Error(
            `Unexpected read: ${ref.path}`
          );
        },

        update(ref, data) {
          operations.push({
            type: 'update',
            path: ref.path,
            data,
          });
        },

        set(ref, data) {
          projectionOperations.push({
            type: 'set',
            path: ref.path,
            data,
          });
        },

        delete(ref) {
          projectionOperations.push({
            type: 'delete',
            path: ref.path,
          });
        },
      };

      return callback(transaction);
    },
  };

  return {
    reads,
    operations,
    projectionOperations,

    dependencies: {
      db,

      serverTimestamp() {
        return '__SERVER_TIMESTAMP__';
      },
    },
  };
}

test(
  'publishes a draft provenance record atomically',
  async () => {
    const harness =
      createHarness({
        provenanceStatus:
          PROVENANCE_STATUS.DRAFT,
      });

    const result =
      await transitionProvenanceStatusWithTransaction(
        {
          adminUserId:
            'admin-uid-1',
          provenanceId:
            'prov-001',
          nextStatus:
            PROVENANCE_STATUS.PUBLISHED,
        },
        harness.dependencies
      );

    assert.deepEqual(
      harness.reads,
      [
        'provenanceRecords/prov-001',
      ]
    );

    assert.equal(
      harness.operations.length,
      1
    );

    assert.deepEqual(
      harness.operations[0],
      {
        type: 'update',
        path:
          'provenanceRecords/prov-001',

        data: {
          status:
            PROVENANCE_STATUS.PUBLISHED,
          updatedBy:
            'admin-uid-1',
          updatedAt:
            '__SERVER_TIMESTAMP__',
          publishedAt:
            '__SERVER_TIMESTAMP__',
        },
      }
    );

    assert.equal(
      result.updated,
      true
    );

    assert.equal(
      result.provenanceId,
      'prov-001'
    );

    assert.equal(
      result.status,
      PROVENANCE_STATUS.PUBLISHED
    );
  }
);

test(
  'rejects publishing an already published or archived record',
  async () => {
    for (const currentStatus of [
      PROVENANCE_STATUS.PUBLISHED,
      PROVENANCE_STATUS.ARCHIVED,
    ]) {
      const harness =
        createHarness({
          provenanceStatus:
            currentStatus,
        });

      await assert.rejects(
        () =>
          transitionProvenanceStatusWithTransaction(
            {
              adminUserId:
                'admin-uid-1',
              provenanceId:
                'prov-001',
              nextStatus:
                PROVENANCE_STATUS.PUBLISHED,
            },
            harness.dependencies
          ),
        (error) =>
          error.code ===
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_STATUS_TRANSITION
      );

      assert.equal(
        harness.operations.length,
        0
      );
    }
  }
);

test(
  'archives a published provenance record atomically',
  async () => {
    const harness =
      createHarness({
        provenanceStatus:
          PROVENANCE_STATUS.PUBLISHED,
      });

    const result =
      await transitionProvenanceStatusWithTransaction(
        {
          adminUserId:
            'admin-uid-1',
          provenanceId:
            'prov-001',
          nextStatus:
            PROVENANCE_STATUS.ARCHIVED,
        },
        harness.dependencies
      );

    assert.equal(
      harness.operations.length,
      1
    );

    assert.deepEqual(
      harness.operations[0],
      {
        type: 'update',
        path:
          'provenanceRecords/prov-001',

        data: {
          status:
            PROVENANCE_STATUS.ARCHIVED,
          updatedBy:
            'admin-uid-1',
          updatedAt:
            '__SERVER_TIMESTAMP__',
          archivedAt:
            '__SERVER_TIMESTAMP__',
        },
      }
    );

    assert.equal(
      result.status,
      PROVENANCE_STATUS.ARCHIVED
    );
  }
);

test(
  'rejects archiving draft or already archived provenance',
  async () => {
    for (const currentStatus of [
      PROVENANCE_STATUS.DRAFT,
      PROVENANCE_STATUS.ARCHIVED,
    ]) {
      const harness =
        createHarness({
          provenanceStatus:
            currentStatus,
        });

      await assert.rejects(
        () =>
          transitionProvenanceStatusWithTransaction(
            {
              adminUserId:
                'admin-uid-1',
              provenanceId:
                'prov-001',
              nextStatus:
                PROVENANCE_STATUS.ARCHIVED,
            },
            harness.dependencies
          ),
        (error) =>
          error.code ===
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_STATUS_TRANSITION
      );

      assert.equal(
        harness.operations.length,
        0
      );
    }
  }
);

test(
  'rejects lifecycle transition when provenance does not exist',
  async () => {
    const harness =
      createHarness({
        provenanceExists: false,
      });

    await assert.rejects(
      () =>
        transitionProvenanceStatusWithTransaction(
          {
            adminUserId:
              'admin-uid-1',
            provenanceId:
              'prov-001',
            nextStatus:
              PROVENANCE_STATUS.PUBLISHED,
          },
          harness.dependencies
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PROVENANCE_NOT_FOUND
    );

    assert.equal(
      harness.operations.length,
      0
    );
  }
);

test(
  'rejects invalid lifecycle input before starting a transaction',
  async () => {
    let transactionStarted = false;

    const dependencies = {
      db: {
        async runTransaction() {
          transactionStarted = true;
        },

        collection() {
          throw new Error(
            'Database access must not occur.'
          );
        },
      },

      serverTimestamp() {
        return '__SERVER_TIMESTAMP__';
      },
    };

    await assert.rejects(
      () =>
        transitionProvenanceStatusWithTransaction(
          {
            adminUserId: ' ',
            provenanceId:
              'bad/id',
            nextStatus:
              PROVENANCE_STATUS.DRAFT,
          },
          dependencies
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_INPUT
    );

    assert.equal(
      transactionStarted,
      false
    );
  }
);


test(
  'creates a sanitized public projection when provenance is published',
  async () => {
    const harness =
      createHarness({
        provenanceStatus:
          PROVENANCE_STATUS.DRAFT,
      });

    await transitionProvenanceStatusWithTransaction(
      {
        adminUserId:
          'admin-uid-1',
        provenanceId:
          'prov-001',
        nextStatus:
          PROVENANCE_STATUS.PUBLISHED,
      },
      harness.dependencies
    );

    assert.deepEqual(
      harness.projectionOperations,
      [
        {
          type: 'set',
          path:
            'publicProvenance/pub-001',
          data: {
            publicId:
              'pub-001',
            product: {
              sku:
                'E2E-HANDLOOM-001',
              name:
                'Local Handloom Demo Saree',
            },
            artisan: {
              code:
                'ART-E2E-001',
              name:
                'Lakshmi Weaver',
            },
            material:
              'Pure Silk',
            weaveTechnique:
              'Traditional Handloom Weave',
            loomType:
              'Pit Loom',
            origin: {
              village:
                'Somandepalli',
              district:
                'Sri Sathya Sai',
              state:
                'Andhra Pradesh',
              country:
                'India',
            },
          },
        },
      ]
    );
  }
);

test(
  'removes the public projection when provenance is archived',
  async () => {
    const harness =
      createHarness({
        provenanceStatus:
          PROVENANCE_STATUS.PUBLISHED,
      });

    await transitionProvenanceStatusWithTransaction(
      {
        adminUserId:
          'admin-uid-1',
        provenanceId:
          'prov-001',
        nextStatus:
          PROVENANCE_STATUS.ARCHIVED,
      },
      harness.dependencies
    );

    assert.deepEqual(
      harness.projectionOperations,
      [
        {
          type: 'delete',
          path:
            'publicProvenance/pub-001',
        },
      ]
    );
  }
);
