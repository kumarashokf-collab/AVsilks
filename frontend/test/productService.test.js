'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

let productService = null;
let productServiceLoadError = null;

try {
  productService =
    await import(
      '../src/services/product.js'
    );
} catch (error) {
  productServiceLoadError = error;
}

function createUser() {
  return {
    uid: 'admin-001',

    async getIdToken() {
      return 'trusted-id-token';
    },
  };
}

function validPayload(
  overrides = {}
) {
  return {
    name:
      '  Handloom Silk Saree  ',
    description:
      '  Pure handloom saree  ',
    price: 3200,
    originalPrice: 4000,
    category:
      '  Silk  ',
    stock: 1,
    sku:
      '  e2e-handloom-001  ',
    offer:
      '  20%  ',
    image:
      '  https://example.org/main.jpg  ',
    images: [
      '  https://example.org/main.jpg  ',
      'https://example.org/detail.jpg',
    ],
    featured: true,
    active: true,

    ...overrides,
  };
}

test(
  'defines the secure product API service',
  () => {
    assert.ok(
      productService,
      'frontend/src/services/product.js must exist'
    );

    assert.equal(
      typeof productService.createProduct,
      'function'
    );

    assert.equal(
      typeof productService.deactivateProduct,
      'function'
    );

    assert.equal(
      productServiceLoadError,
      null
    );
  }
);

test(
  'creates a product through authenticated POST',
  {
    skip: !productService,
  },
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await productService.createProduct(
        validPayload(),
        createUser(),
        {
          getApiBaseUrlFn() {
            return '/api/';
          },

          async fetchImpl(
            url,
            options
          ) {
            capturedUrl = url;
            capturedOptions = options;

            return {
              ok: true,
              status: 201,

              async json() {
                return {
                  success: true,

                  data: {
                    id:
                      'product-001',

                    name:
                      'Handloom Silk Saree',

                    adminUid:
                      'private-uid-must-not-leak',
                  },
                };
              },
            };
          },
        }
      );

    assert.equal(
      capturedUrl,
      '/api/products'
    );

    assert.equal(
      capturedOptions.method,
      'POST'
    );

    assert.deepEqual(
      capturedOptions.headers,
      {
        Accept:
          'application/json',

        'Content-Type':
          'application/json',

        Authorization:
          'Bearer trusted-id-token',
      }
    );

    assert.deepEqual(
      JSON.parse(
        capturedOptions.body
      ),
      {
        name:
          'Handloom Silk Saree',

        description:
          'Pure handloom saree',

        price: 3200,
        originalPrice: 4000,
        category: 'Silk',
        stock: 1,
        sku:
          'E2E-HANDLOOM-001',

        offer: '20%',

        image:
          'https://example.org/main.jpg',

        images: [
          'https://example.org/main.jpg',
          'https://example.org/detail.jpg',
        ],

        featured: true,
        active: true,
      }
    );

    assert.deepEqual(
      result,
      {
        id: 'product-001',
      }
    );

    assert.equal(
      Object.isFrozen(result),
      true
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
  'soft-deactivates a product through authenticated DELETE',
  {
    skip: !productService,
  },
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result =
      await productService
        .deactivateProduct(
          '  product-001  ',
          createUser(),
          {
            getApiBaseUrlFn() {
              return '/api/';
            },

            async fetchImpl(
              url,
              options
            ) {
              capturedUrl = url;
              capturedOptions =
                options;

              return {
                ok: true,
                status: 200,

                async json() {
                  return {
                    success: true,

                    data: {
                      id:
                        'product-001',

                      active: false,

                      deactivatedByUid:
                        'private-uid-must-not-leak',
                    },
                  };
                },
              };
            },
          }
        );

    assert.equal(
      capturedUrl,
      '/api/products/product-001'
    );

    assert.deepEqual(
      capturedOptions,
      {
        method: 'DELETE',

        headers: {
          Accept:
            'application/json',

          Authorization:
            'Bearer trusted-id-token',
        },
      }
    );

    assert.deepEqual(
      result,
      {
        id: 'product-001',
        active: false,
      }
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.equal(
      Object.hasOwn(
        result,
        'deactivatedByUid'
      ),
      false
    );
  }
);

test(
  'requires authentication before product network access',
  {
    skip: !productService,
  },
  async () => {
    let fetchCalled = false;

    await assert.rejects(
      () =>
        productService.createProduct(
          validPayload(),
          null,
          {
            getApiBaseUrlFn() {
              return '/api';
            },

            async fetchImpl() {
              fetchCalled = true;
            },
          }
        ),
      (error) =>
        error?.code ===
        productService
          .PRODUCT_API_ERROR
          .AUTHENTICATION_REQUIRED
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'rejects an invalid product id before token or network access',
  {
    skip: !productService,
  },
  async () => {
    let tokenCalled = false;
    let fetchCalled = false;

    const user = {
      uid: 'admin-001',

      async getIdToken() {
        tokenCalled = true;
        return 'token';
      },
    };

    for (const id of [
      '',
      '   ',
      'bad/id',
      'x'.repeat(129),
    ]) {
      await assert.rejects(
        () =>
          productService
            .deactivateProduct(
              id,
              user,
              {
                getApiBaseUrlFn() {
                  return '/api';
                },

                async fetchImpl() {
                  fetchCalled = true;
                },
              }
            ),
        (error) =>
          error?.code ===
          productService
            .PRODUCT_API_ERROR
            .INVALID_PRODUCT_ID
      );
    }

    assert.equal(
      tokenCalled,
      false
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);

test(
  'rejects client-controlled product fields before token or network access',
  {
    skip: !productService,
  },
  async () => {
    let tokenCalled = false;
    let fetchCalled = false;

    const user = {
      uid: 'admin-001',

      async getIdToken() {
        tokenCalled = true;
        return 'token';
      },
    };

    await assert.rejects(
      () =>
        productService.createProduct(
          validPayload({
            adminUid:
              'attacker-controlled',
          }),
          user,
          {
            getApiBaseUrlFn() {
              return '/api';
            },

            async fetchImpl() {
              fetchCalled = true;
            },
          }
        ),
      (error) =>
        error?.code ===
        productService
          .PRODUCT_API_ERROR
          .INVALID_INPUT
    );

    assert.equal(
      tokenCalled,
      false
    );

    assert.equal(
      fetchCalled,
      false
    );
  }
);
