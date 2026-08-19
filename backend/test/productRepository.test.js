'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test(
  'uses modular FieldValue when the Firebase admin namespace lacks legacy FieldValue',
  async () => {
    const operations = [];

    const db = {
      collection(collectionName) {
        assert.equal(
          collectionName,
          'products'
        );

        return {
          doc() {
            return {
              id: 'product-test-001',
              path:
                'products/product-test-001',
            };
          },
        };
      },

      batch() {
        return {
          set(ref, data) {
            operations.push({
              type: 'set',
              ref,
              data,
            });
          },

          async commit() {
            operations.push({
              type: 'commit',
            });
          },
        };
      },
    };

    const configPath =
      require.resolve(
        '../src/config/firebase'
      );

    const repositoryPath =
      require.resolve(
        '../src/repositories/product.repository'
      );

    const previousConfigModule =
      require.cache[configPath];

    const previousRepositoryModule =
      require.cache[repositoryPath];

    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: {
        db,

        admin: {
          firestore() {
            return db;
          },
        },
      },
    };

    delete require.cache[
      repositoryPath
    ];

    try {
      const {
        createProductWithTransaction,
      } = require(
        '../src/repositories/product.repository'
      );

      const result =
        await createProductWithTransaction(
          {
            sku: 'TEST-SKU-001',
            name: 'Test Handloom Saree',
            price: 1000,
            stock: 1,
          },
          'admin-test-001'
        );

      assert.equal(
        result.id,
        'product-test-001'
      );

      assert.equal(
        Object.hasOwn(
          result,
          'adminUid'
        ),
        false
      );

      assert.equal(
        Object.hasOwn(
          operations[0].data,
          'adminUid'
        ),
        false
      );

      assert.equal(
        operations.length,
        2
      );

      assert.equal(
        operations[0].type,
        'set'
      );

      assert.equal(
        operations[1].type,
        'commit'
      );

      assert.ok(
        result.createdAt
      );

      assert.ok(
        result.updatedAt
      );
    } finally {
      if (previousConfigModule) {
        require.cache[configPath] =
          previousConfigModule;
      } else {
        delete require.cache[
          configPath
        ];
      }

      if (previousRepositoryModule) {
        require.cache[repositoryPath] =
          previousRepositoryModule;
      } else {
        delete require.cache[
          repositoryPath
        ];
      }
    }
  }
);
