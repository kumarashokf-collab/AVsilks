'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARTISAN_REPOSITORY_ERROR,
  createArtisanWithTransaction,
} = require(
  '../src/repositories/artisan.repository'
);

function createInput(overrides = {}) {
  return {
    adminUserId: 'admin-uid-1',
    artisanData: {
      artisanCode: 'ART-0001',
      displayName: 'Lakshmi Weaver',
      craftType: 'Handloom Weaving',
      village: 'Pochampally',
      district: 'Yadadri Bhuvanagiri',
      state: 'Telangana',
      country: 'India',
      loomType: 'Pit Loom',
      active: true,
    },
    ...overrides,
  };
}

function createFakeFirestore({
  existingCodeRecord = null,
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
            ref.path.startsWith(
              'artisanCodes/'
            )
          ) {
            return {
              exists:
                existingCodeRecord !== null,
              data: () =>
                existingCodeRecord,
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

    generateArtisanId: () =>
      'art_test_0001',
  };
}

test(
  'atomically creates an artisan and reserves the canonical artisan code',
  async () => {
    const fake = createFakeFirestore();

    const result =
      await createArtisanWithTransaction(
        createInput({
          artisanData: {
            ...createInput().artisanData,
            artisanCode: '  art-0001  ',
          },
        }),
        dependencies(fake)
      );

    assert.equal(result.created, true);
    assert.equal(
      result.artisanId,
      'art_test_0001'
    );

    assert.deepEqual(fake.reads, [
      'artisanCodes/ART-0001',
    ]);

    assert.equal(
      fake.operations.length,
      2
    );

    const artisanWrite =
      fake.operations.find(
        (operation) =>
          operation.path ===
          'artisans/art_test_0001'
      );

    const codeIndexWrite =
      fake.operations.find(
        (operation) =>
          operation.path ===
          'artisanCodes/ART-0001'
      );

    assert.ok(artisanWrite);
    assert.ok(codeIndexWrite);

    assert.equal(
      artisanWrite.data.id,
      'art_test_0001'
    );

    assert.equal(
      artisanWrite.data.artisanCode,
      'ART-0001'
    );

    assert.equal(
      artisanWrite.data.createdBy,
      'admin-uid-1'
    );

    assert.equal(
      artisanWrite.data.updatedBy,
      'admin-uid-1'
    );

    assert.equal(
      artisanWrite.data.createdAt,
      '__SERVER_TIMESTAMP__'
    );

    assert.equal(
      artisanWrite.data.updatedAt,
      '__SERVER_TIMESTAMP__'
    );

    assert.deepEqual(
      codeIndexWrite.data,
      {
        artisanId: 'art_test_0001',
        artisanCode: 'ART-0001',
        createdAt:
          '__SERVER_TIMESTAMP__',
      }
    );
  }
);

test(
  'rejects a duplicate artisan code without writing',
  async () => {
    const fake = createFakeFirestore({
      existingCodeRecord: {
        artisanId: 'art_existing',
        artisanCode: 'ART-0001',
      },
    });

    await assert.rejects(
      () =>
        createArtisanWithTransaction(
          createInput(),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        ARTISAN_REPOSITORY_ERROR
          .ARTISAN_CODE_CONFLICT
    );

    assert.deepEqual(fake.reads, [
      'artisanCodes/ART-0001',
    ]);

    assert.equal(
      fake.operations.length,
      0
    );
  }
);

test(
  'rejects invalid repository input before starting a transaction',
  async () => {
    const fake = createFakeFirestore();

    await assert.rejects(
      () =>
        createArtisanWithTransaction(
          createInput({
            adminUserId: '   ',
          }),
          dependencies(fake)
        ),
      (error) =>
        error.code ===
        ARTISAN_REPOSITORY_ERROR
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
