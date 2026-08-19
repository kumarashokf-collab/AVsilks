'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath =
  require.resolve(
    '../src/services/product.service'
  );

const repositoryPath =
  require.resolve(
    '../src/repositories/product.repository'
  );

function loadProductService(repository) {
  delete require.cache[servicePath];

  require.cache[repositoryPath] = {
    id: repositoryPath,
    filename: repositoryPath,
    loaded: true,
    exports: repository,
  };

  return require(servicePath);
}

test(
  'securely deactivates a product instead of physically deleting it',
  async () => {
    let receivedId = null;
    let receivedUid = null;

    const service = loadProductService({
      findBySku: async () => null,
      createProductWithTransaction:
        async () => ({}),

      deactivateProductWithTransaction:
        async (productId, uid) => {
          receivedId = productId;
          receivedUid = uid;

          return {
            id: productId,
            active: false,
          };
        },
    });

    const result =
      await service.deactivateProduct(
        '  product-001  ',
        ' trusted-admin-001 '
      );

    assert.equal(
      receivedId,
      'product-001'
    );

    assert.equal(
      receivedUid,
      'trusted-admin-001'
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

test(
  'rejects invalid product identity before repository access',
  async () => {
    let repositoryCalled = false;

    const service = loadProductService({
      findBySku: async () => null,
      createProductWithTransaction:
        async () => ({}),

      deactivateProductWithTransaction:
        async () => {
          repositoryCalled = true;
          return {};
        },
    });

    for (const invalidId of [
      '',
      '   ',
      'products/product-001',
      'x'.repeat(129),
    ]) {
      await assert.rejects(
        () =>
          service.deactivateProduct(
            invalidId,
            'trusted-admin-001'
          ),
        (error) =>
          error?.code ===
          'INVALID_INPUT'
      );
    }

    assert.equal(
      repositoryCalled,
      false
    );
  }
);

test(
  'fails closed when trusted deactivation identity is missing',
  async () => {
    let repositoryCalled = false;

    const service = loadProductService({
      findBySku: async () => null,
      createProductWithTransaction:
        async () => ({}),

      deactivateProductWithTransaction:
        async () => {
          repositoryCalled = true;
          return {};
        },
    });

    await assert.rejects(
      () =>
        service.deactivateProduct(
          'product-001',
          ''
        ),
      (error) =>
        error?.code ===
        'AUTHENTICATION_REQUIRED'
    );

    assert.equal(
      repositoryCalled,
      false
    );
  }
);

test(
  'rejects an invalid deactivation repository result',
  async () => {
    const service = loadProductService({
      findBySku: async () => null,
      createProductWithTransaction:
        async () => ({}),

      deactivateProductWithTransaction:
        async () => ({
          id: 'product-001',
          active: true,
        }),
    });

    await assert.rejects(
      () =>
        service.deactivateProduct(
          'product-001',
          'trusted-admin-001'
        ),
      (error) =>
        error?.code ===
        'INVALID_PRODUCT_DATA'
    );
  }
);
