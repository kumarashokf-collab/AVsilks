'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const configPath =
  require.resolve(
    '../src/config/firebase'
  );

const repositoryPath =
  require.resolve(
    '../src/repositories/product.repository'
  );

function loadRepository(db) {
  const previousConfig =
    require.cache[configPath];

  const previousRepository =
    require.cache[repositoryPath];

  require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: {
      db,
    },
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
    restore,
  };
}

test(
  'does not persist creator uid in public product documents',
  async (t) => {
    let writtenData = null;

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
          doc() {
            return productRef;
          },
        };
      },

      batch() {
        return {
          set(ref, data) {
            assert.equal(
              ref,
              productRef
            );

            writtenData = data;
          },

          async commit() {},
        };
      },
    };

    const {
      repository,
      restore,
    } = loadRepository(db);

    t.after(restore);

    const result =
      await repository
        .createProductWithTransaction(
          {
            name:
              'Handloom Silk Saree',
            sku:
              'PUBLIC-SAFE-001',
            price: 3200,
            stock: 1,
            active: true,
          },
          'trusted-admin-uid'
        );

    assert.ok(
      writtenData
    );

    assert.equal(
      Object.hasOwn(
        writtenData,
        'adminUid'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result,
        'adminUid'
      ),
      false
    );
  }
);

test(
  'does not persist deactivator uid in public product documents',
  async (t) => {
    let updatedData = null;

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
              exists: true,

              data() {
                return {
                  active: true,
                };
              },
            };
          },

          update(ref, data) {
            assert.equal(
              ref,
              productRef
            );

            updatedData = data;
          },
        };

        return callback(
          transaction
        );
      },
    };

    const {
      repository,
      restore,
    } = loadRepository(db);

    t.after(restore);

    const result =
      await repository
        .deactivateProductWithTransaction(
          'product-001',
          'trusted-admin-uid'
        );

    assert.ok(
      updatedData
    );

    assert.equal(
      Object.hasOwn(
        updatedData,
        'deactivatedByUid'
      ),
      false
    );

    assert.deepEqual(
      result,
      {
        id: 'product-001',
        active: false,
      }
    );
  }
);
