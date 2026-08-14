'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PROVENANCE_REPOSITORY_ERROR,
  createProvenanceWithTransaction,
} = require(
  '../src/repositories/provenance.repository'
);

function createInput(overrides = {}) {
  return {
    adminUserId: 'admin-uid-1',

    provenanceData: {
      productId: 'product-001',
      artisanId: 'artisan-001',
      material: 'Pure Silk',
      weaveTechnique: 'Handloom Ikat',
      loomType: 'Pit Loom',

      origin: {
        village: 'Pochampally',
        district: 'Yadadri Bhuvanagiri',
        state: 'Telangana',
        country: 'India',
      },
    },

    ...overrides,
  };
}

function createFakeFirestore({
  productData = {
    name: 'Handloom Silk Saree',
    sku: 'AV-001',
    active: true,
  },

  artisanData = {
    artisanCode: 'ART-0001',
    displayName: 'Lakshmi Weaver',
    active: true,
  },

  existingPublicIdRecord = null,
} = {}) {
  const reads = [];
  const operations = [];
  let transactionCount = 0;

  const db = {
    collection(collectionName) {
      return {
        doc(documentId) {
          return {
            id: documentId,
            path:
              collectionName +
              '/' +
              documentId,
          };
        },
      };
    },

    async runTransaction(callback) {
      transactionCount += 1;

      const transaction = {
        async get(ref) {
          reads.push(ref.path);

          if (
            ref.path ===
            'products/product-001'
          ) {
            return {
              exists: productData !== null,
              data: () => productData,
            };
          }

          if (
            ref.path ===
            'artisans/artisan-001'
          ) {
            return {
              exists: artisanData !== null,
              data: () => artisanData,
            };
          }

          if (
            ref.path ===
            'provenancePublicIds/pub_test_0001'
          ) {
            return {
              exists:
                existingPublicIdRecord !==
                null,

              data: () =>
                existingPublicIdRecord,
            };
          }

          throw new Error(
            'Unexpected transaction read: ' +
              ref.path
          );
        },

        set(ref, data) {
          operations.push({
            type: 'set',
            path: ref.path,
            data,
          });
        },

        update(ref, data) {
          operations.push({
            type: 'update',
            path: ref.path,
            data,
          });
        },
      };

      return callback(transaction);
    },
  };

  return {
    db,
    reads,
    operations,

    get transactionCount() {
      return transactionCount;
    },
  };
}

function dependencies(fake) {
  return {
    db: fake.db,

    serverTimestamp: () =>
      '__SERVER_TIMESTAMP__',

    generateProvenanceId: () =>
      'prov_test_0001',

    generatePublicId: () =>
      'pub_test_0001',
  };
}

test(
  'atomically creates provenance, reserves public ID, and links the product',
  async () => {
    const fake =
      createFakeFirestore();

    const result =
      await createProvenanceWithTransaction(
        createInput(),
        dependencies(fake)
      );

    assert.equal(
      result.created,
      true
    );

    assert.equal(
      result.provenanceId,
      'prov_test_0001'
    );

    assert.equal(
      result.publicId,
      'pub_test_0001'
    );

    assert.deepEqual(
      fake.reads,
      [
        'products/product-001',
        'artisans/artisan-001',
        'provenancePublicIds/pub_test_0001',
      ]
    );

    assert.equal(
      fake.operations.length,
      3
    );

    const provenanceWrite =
      fake.operations.find(
        (operation) =>
          operation.path ===
          'provenanceRecords/prov_test_0001'
      );

    const publicIdWrite =
      fake.operations.find(
        (operation) =>
          operation.path ===
          'provenancePublicIds/pub_test_0001'
      );

    const productUpdate =
      fake.operations.find(
        (operation) =>
          operation.path ===
          'products/product-001'
      );

    assert.ok(provenanceWrite);
    assert.ok(publicIdWrite);
    assert.ok(productUpdate);

    assert.equal(
      provenanceWrite.data.productId,
      'product-001'
    );

    assert.equal(
      provenanceWrite.data.artisanId,
      'artisan-001'
    );

    assert.equal(
      provenanceWrite.data.publicId,
      'pub_test_0001'
    );

    assert.equal(
      provenanceWrite.data.status,
      'draft'
    );

    assert.equal(
      provenanceWrite.data.schemaVersion,
      1
    );

    assert.equal(
      provenanceWrite.data.skuSnapshot,
      'AV-001'
    );

    assert.equal(
      provenanceWrite.data.productNameSnapshot,
      'Handloom Silk Saree'
    );

    assert.equal(
      provenanceWrite.data.createdBy,
      'admin-uid-1'
    );

    assert.equal(
      provenanceWrite.data.createdAt,
      '__SERVER_TIMESTAMP__'
    );

    assert.deepEqual(
      publicIdWrite.data,
      {
        provenanceId:
          'prov_test_0001',
        publicId:
          'pub_test_0001',
        createdAt:
          '__SERVER_TIMESTAMP__',
      }
    );

    assert.deepEqual(
      productUpdate.data,
      {
        provenanceId:
          'prov_test_0001',
        publicProvenanceId:
          'pub_test_0001',
        updatedAt:
          '__SERVER_TIMESTAMP__',
      }
    );
  }
);

test(
  'rejects provenance when product does not exist',
  async () => {
    const fake =
      createFakeFirestore({
        productData: null,
      });

    await assert.rejects(
      () =>
        createProvenanceWithTransaction(
          createInput(),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PRODUCT_NOT_FOUND
    );

    assert.equal(
      fake.operations.length,
      0
    );
  }
);

test(
  'rejects provenance when artisan is missing or inactive',
  async () => {
    for (const artisanData of [
      null,
      {
        artisanCode: 'ART-0001',
        displayName: 'Inactive Weaver',
        active: false,
      },
    ]) {
      const fake =
        createFakeFirestore({
          artisanData,
        });

      await assert.rejects(
        () =>
          createProvenanceWithTransaction(
            createInput(),
            dependencies(fake)
          ),
        (error) =>
          error.code ===
          (
            artisanData === null
              ? PROVENANCE_REPOSITORY_ERROR
                  .ARTISAN_NOT_FOUND
              : PROVENANCE_REPOSITORY_ERROR
                  .ARTISAN_INACTIVE
          )
      );

      assert.equal(
        fake.operations.length,
        0
      );
    }
  }
);

test(
  'rejects a product that already has provenance',
  async () => {
    const fake =
      createFakeFirestore({
        productData: {
          name: 'Existing Saree',
          sku: 'AV-001',
          active: true,
          provenanceId:
            'prov_existing',
        },
      });

    await assert.rejects(
      () =>
        createProvenanceWithTransaction(
          createInput(),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PRODUCT_ALREADY_LINKED
    );

    assert.equal(
      fake.operations.length,
      0
    );
  }
);

test(
  'rejects a duplicate public ID without writing',
  async () => {
    const fake =
      createFakeFirestore({
        existingPublicIdRecord: {
          provenanceId:
            'prov_existing',
          publicId:
            'pub_test_0001',
        },
      });

    await assert.rejects(
      () =>
        createProvenanceWithTransaction(
          createInput(),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .PUBLIC_ID_CONFLICT
    );

    assert.equal(
      fake.operations.length,
      0
    );
  }
);

test(
  'rejects invalid input before starting a transaction',
  async () => {
    const fake =
      createFakeFirestore();

    await assert.rejects(
      () =>
        createProvenanceWithTransaction(
          createInput({
            adminUserId: '   ',
          }),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_INPUT
    );

    assert.equal(
      fake.transactionCount,
      0
    );

    assert.equal(
      fake.operations.length,
      0
    );
  }
);
