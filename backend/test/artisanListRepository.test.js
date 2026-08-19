'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARTISAN_REPOSITORY_ERROR,
  listActiveArtisans,
} = require(
  '../src/repositories/artisan.repository'
);

function artisanRecord(
  docId,
  overrides = {}
) {
  return {
    docId,

    data: {
      id: docId,
      artisanCode: 'ART-0001',
      displayName: 'Lakshmi Weaver',
      craftType: 'Handloom Weaving',
      village: 'Pochampally',
      district: 'Yadadri Bhuvanagiri',
      state: 'Telangana',
      country: 'India',
      loomType: 'Pit Loom',
      active: true,

      createdBy: 'admin-private-uid',
      updatedBy: 'admin-private-uid',
      createdAt: '__PRIVATE_TIMESTAMP__',
      updatedAt: '__PRIVATE_TIMESTAMP__',

      ...overrides,
    },
  };
}

function createFakeFirestore(
  records = []
) {
  const calls = [];

  const query = {
    where(field, operator, value) {
      calls.push([
        'where',
        field,
        operator,
        value,
      ]);

      return this;
    },

    limit(value) {
      calls.push([
        'limit',
        value,
      ]);

      return this;
    },

    async get() {
      calls.push([
        'get',
      ]);

      return {
        docs: records.map(
          (record) => ({
            id: record.docId,

            data() {
              return record.data;
            },
          })
        ),
      };
    },
  };

  const db = {
    collection(name) {
      calls.push([
        'collection',
        name,
      ]);

      return query;
    },
  };

  return {
    db,
    calls,
  };
}

test(
  'lists active artisans with fixed safe query and sanitized fields',
  async () => {
    const fake =
      createFakeFirestore([
        artisanRecord(
          'art_lakshmi'
        ),

        artisanRecord(
          'art_anita',
          {
            artisanCode:
              'ART-0002',

            displayName:
              'Anita Weaver',
          }
        ),
      ]);

    const result =
      await listActiveArtisans({
        db: fake.db,
      });

    assert.deepEqual(
      fake.calls,
      [
        [
          'collection',
          'artisans',
        ],

        [
          'where',
          'active',
          '==',
          true,
        ],

        [
          'limit',
          100,
        ],

        [
          'get',
        ],
      ]
    );

    assert.equal(
      result.length,
      2
    );

    assert.equal(
      result[0].displayName,
      'Anita Weaver'
    );

    assert.equal(
      result[1].displayName,
      'Lakshmi Weaver'
    );

    assert.deepEqual(
      Object.keys(result[0]).sort(),
      [
        'active',
        'artisanCode',
        'country',
        'craftType',
        'displayName',
        'district',
        'id',
        'loomType',
        'state',
        'village',
      ].sort()
    );

    assert.equal(
      Object.hasOwn(
        result[0],
        'createdBy'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result[0],
        'updatedBy'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result[0],
        'createdAt'
      ),
      false
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.equal(
      Object.isFrozen(result[0]),
      true
    );
  }
);

test(
  'returns a frozen empty list when no active artisans exist',
  async () => {
    const fake =
      createFakeFirestore([]);

    const result =
      await listActiveArtisans({
        db: fake.db,
      });

    assert.deepEqual(
      result,
      []
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  'rejects malformed stored artisan data',
  async () => {
    const fake =
      createFakeFirestore([
        artisanRecord(
          'art_invalid',
          {
            displayName: '',
          }
        ),
      ]);

    await assert.rejects(
      () =>
        listActiveArtisans({
          db: fake.db,
        }),
      (error) =>
        error.code ===
        ARTISAN_REPOSITORY_ERROR
          .INVALID_ARTISAN_DATA
    );
  }
);

test(
  'rejects inconsistent stored artisan document identity',
  async () => {
    const record =
      artisanRecord(
        'art_document_id'
      );

    record.data.id =
      'different-artisan-id';

    const fake =
      createFakeFirestore([
        record,
      ]);

    await assert.rejects(
      () =>
        listActiveArtisans({
          db: fake.db,
        }),
      (error) =>
        error.code ===
        ARTISAN_REPOSITORY_ERROR
          .INVALID_ARTISAN_DATA
    );
  }
);

test(
  'fails closed if an inactive artisan is unexpectedly returned',
  async () => {
    const fake =
      createFakeFirestore([
        artisanRecord(
          'art_inactive',
          {
            active: false,
          }
        ),
      ]);

    await assert.rejects(
      () =>
        listActiveArtisans({
          db: fake.db,
        }),
      (error) =>
        error.code ===
        ARTISAN_REPOSITORY_ERROR
          .INVALID_ARTISAN_DATA
    );
  }
);

test(
  'rejects invalid list repository dependencies',
  async () => {
    await assert.rejects(
      () =>
        listActiveArtisans({
          db: {},
        }),
      (error) =>
        error.code ===
        ARTISAN_REPOSITORY_ERROR
          .INVALID_DEPENDENCIES
    );
  }
);
