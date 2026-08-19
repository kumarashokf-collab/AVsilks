'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve(
  '../src/services/product.service'
);

const repositoryPath = require.resolve(
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

function validPayload(overrides = {}) {
  return {
    name: '  Local Handloom Saree  ',
    description: '  Traditional handwoven saree  ',
    price: '3200',
    originalPrice: '4000',
    category: '  Silk  ',
    stock: '2',
    sku: '  safe-sku-001  ',
    offer: '20%',
    image: 'https://example.com/saree.jpg',
    images: [
      'https://example.com/saree.jpg',
    ],
    featured: false,
    active: true,
    ...overrides,
  };
}

test(
  'validates and normalizes product input before repository access',
  async () => {
    let lookupSku = null;
    let writtenData = null;
    let writtenUid = null;

    const service = loadProductService({
      findBySku: async (sku) => {
        lookupSku = sku;
        return null;
      },

      createProductWithTransaction:
        async (data, uid) => {
          writtenData = data;
          writtenUid = uid;

          return {
            id: 'product-001',
            ...data,
          };
        },
    });

    await service.createProduct(
      validPayload(),
      'trusted-admin-001'
    );

    assert.equal(
      lookupSku,
      'SAFE-SKU-001'
    );

    assert.equal(
      writtenData.name,
      'Local Handloom Saree'
    );

    assert.equal(
      writtenData.price,
      3200
    );

    assert.equal(
      writtenData.stock,
      2
    );

    assert.equal(
      writtenData.sku,
      'SAFE-SKU-001'
    );

    assert.equal(
      Object.hasOwn(
        writtenData,
        'createdAt'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        writtenData,
        'adminUid'
      ),
      false
    );

    assert.equal(
      writtenUid,
      'trusted-admin-001'
    );
  }
);

test(
  'rejects client-controlled product fields before repository access',
  async () => {
    let repositoryCalled = false;

    const service = loadProductService({
      findBySku: async () => {
        repositoryCalled = true;
        return null;
      },

      createProductWithTransaction:
        async () => {
          repositoryCalled = true;
          return {};
        },
    });

    await assert.rejects(
      () =>
        service.createProduct(
          validPayload({
            adminUid: 'client-controlled',
          }),
          'trusted-admin-001'
        ),
      (error) =>
        error?.code ===
        'VALIDATION_FAILED'
    );

    assert.equal(
      repositoryCalled,
      false
    );
  }
);

test(
  'fails closed when trusted product creator identity is missing',
  async () => {
    let repositoryCalled = false;

    const service = loadProductService({
      findBySku: async () => {
        repositoryCalled = true;
        return null;
      },

      createProductWithTransaction:
        async () => {
          repositoryCalled = true;
          return {};
        },
    });

    await assert.rejects(
      () =>
        service.createProduct(
          validPayload(),
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
