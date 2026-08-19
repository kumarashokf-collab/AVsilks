'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const configPath =
  require.resolve(
    '../src/config/firebase'
  );

const repositoryPath =
  require.resolve(
    '../src/repositories/product.repository'
  );

function loadRepository({
  exists = true,
  productData = {
    active: true,
  },
} = {}) {
  const operations = [];

  const productRef = {
    id: 'product-001',
    path: 'products/product-001',
  };

  const db = {
    collection(name) {
      assert.equal(
        name,
        'products'
      );

      return {
        doc(id) {
          assert.equal(
            id,
            'product-001'
          );

          return productRef;
        },
      };
    },

    async runTransaction(callback) {
      const transaction = {
        async get(ref) {
          assert.equal(
            ref,
            productRef
          );

          return {
            exists,
            id: productRef.id,
            data() {
              return productData;
            },
          };
        },

        update(ref, data) {
          operations.push({
            type: 'update',
            ref,
            data,
          });
        },

        delete() {
          operations.push({
            type: 'delete',
          });
        },
      };

      return callback(transaction);
    },
  };

  const previousConfig =
    require.cache[configPath];

  const previousRepository =
    require.cache[repositoryPath];

  require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: { db },
  };

  delete require.cache[
    repositoryPath
  ];

  const repository =
    require(repositoryPath);

  function restore() {
    if (previousConfig) {
      require.cache[configPath] =
        previousConfig;
    } else {
      delete require.cache[
        configPath
      ];
    }

    if (previousRepository) {
      require.cache[repositoryPath] =
        previousRepository;
    } else {
      delete require.cache[
        repositoryPath
      ];
    }
  }

  return {
    repository,
    operations,
    restore,
  };
}

test(
  'transactionally soft-deactivates an active product',
  async (t) => {
    const {
      repository,
      operations,
      restore,
    } = loadRepository();

    t.after(restore);

    const result =
      await repository
        .deactivateProductWithTransaction(
          'product-001',
          'trusted-admin-001'
        );

    assert.equal(
      result.id,
      'product-001'
    );

    assert.equal(
      result.active,
      false
    );

    assert.equal(
      operations.length,
      1
    );

    assert.equal(
      operations[0].type,
      'update'
    );

    assert.equal(
      operations[0].data.active,
      false
    );

    assert.equal(
      Object.hasOwn(
        operations[0].data,
        'deactivatedByUid'
      ),
      false
    );

    assert.ok(
      operations[0].data
        .deactivatedAt
    );

    assert.ok(
      operations[0].data
        .updatedAt
    );
  }
);

test(
  'rejects a missing product without writing',
  async (t) => {
    const {
      repository,
      operations,
      restore,
    } = loadRepository({
      exists: false,
    });

    t.after(restore);

    await assert.rejects(
      () =>
        repository
          .deactivateProductWithTransaction(
            'product-001',
            'trusted-admin-001'
          ),
      (error) =>
        error?.code ===
        'PRODUCT_NOT_FOUND'
    );

    assert.equal(
      operations.length,
      0
    );
  }
);

test(
  'treats an already inactive product idempotently',
  async (t) => {
    const {
      repository,
      operations,
      restore,
    } = loadRepository({
      productData: {
        active: false,
      },
    });

    t.after(restore);

    const result =
      await repository
        .deactivateProductWithTransaction(
          'product-001',
          'trusted-admin-001'
        );

    assert.deepEqual(
      result,
      {
        id: 'product-001',
        active: false,
      }
    );

    assert.equal(
      operations.length,
      0
    );
  }
);

test(
  'product repository never performs a physical product delete',
  () => {
    const source =
      fs.readFileSync(
        repositoryPath,
        'utf8'
      );

    assert.doesNotMatch(
      source,
      /\.delete\s*\(/
    );
  }
);
