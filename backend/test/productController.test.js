'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath =
  require.resolve(
    '../src/controllers/product.controller'
  );

const servicePath =
  require.resolve(
    '../src/services/product.service'
  );

const firebasePath =
  require.resolve(
    '../src/config/firebase'
  );

function loadController({
  service,
  db,
}) {
  delete require.cache[controllerPath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: service,
  };

  require.cache[firebasePath] = {
    id: firebasePath,
    filename: firebasePath,
    loaded: true,
    exports: { db },
  };

  return require(controllerPath);
}

function createResponse() {
  const result = {
    statusCode: null,
    body: null,
  };

  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },

    json(body) {
      result.body = body;
      return this;
    },
  };

  return {
    res,
    result,
  };
}

function productFixture() {
  return {
    id: 'product-001',
    name: 'Handloom Saree',
    description: 'Traditional saree',
    price: 3200,
    originalPrice: 4000,
    category: 'Silk',
    stock: 2,
    sku: 'SAFE-SKU-001',
    offer: '20%',
    image:
      'https://example.com/saree.jpg',
    images: [
      'https://example.com/saree.jpg',
    ],
    featured: false,
    active: true,

    adminUid: 'must-not-leak',
    provenanceId: 'must-not-leak',
    createdAt: 'must-not-leak',
    updatedAt: 'must-not-leak',
  };
}

test(
  'creates a product using only the trusted authenticated uid',
  async () => {
    let receivedPayload;
    let receivedUid;

    const controller = loadController({
      service: {
        createProduct:
          async (payload, uid) => {
            receivedPayload = payload;
            receivedUid = uid;

            return productFixture();
          },
      },

      db: {},
    });

    const payload = {
      name: 'Handloom Saree',
    };

    const { res, result } =
      createResponse();

    await controller.createProduct(
      {
        body: payload,
        user: {
          uid: 'trusted-admin-001',
          role: 'admin',
        },
      },
      res
    );

    assert.equal(
      receivedPayload,
      payload
    );

    assert.equal(
      receivedUid,
      'trusted-admin-001'
    );

    assert.equal(
      result.statusCode,
      201
    );

    assert.equal(
      result.body.success,
      true
    );

    assert.equal(
      result.body.data.id,
      'product-001'
    );

    assert.equal(
      Object.hasOwn(
        result.body.data,
        'adminUid'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result.body.data,
        'provenanceId'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result.body.data,
        'createdAt'
      ),
      false
    );
  }
);

test(
  'returns sanitized product validation details',
  async () => {
    const validationError =
      new Error('internal validation text');

    validationError.code =
      'VALIDATION_FAILED';

    validationError.details = [
      {
        path: 'price',
        type: 'number.positive',
        message:
          '"price" must be a positive number',
        secret: 'must-not-leak',
      },
    ];

    const controller = loadController({
      service: {
        createProduct: async () => {
          throw validationError;
        },
      },
      db: {},
    });

    const { res, result } =
      createResponse();

    await controller.createProduct(
      {
        body: {},
        user: {
          uid: 'trusted-admin-001',
        },
      },
      res
    );

    assert.equal(
      result.statusCode,
      400
    );

    assert.equal(
      result.body.code,
      'PRODUCT_VALIDATION_FAILED'
    );

    assert.deepEqual(
      result.body.details,
      [
        {
          path: 'price',
          type: 'number.positive',
          message:
            '"price" must be a positive number',
        },
      ]
    );
  }
);

test(
  'maps missing trusted identity to safe 401',
  async () => {
    const authError =
      new Error('internal auth detail');

    authError.code =
      'AUTHENTICATION_REQUIRED';

    const controller = loadController({
      service: {
        createProduct: async () => {
          throw authError;
        },
      },
      db: {},
    });

    const { res, result } =
      createResponse();

    await controller.createProduct(
      {
        body: {},
      },
      res
    );

    assert.equal(
      result.statusCode,
      401
    );

    assert.deepEqual(
      result.body,
      {
        success: false,
        code:
          'AUTHENTICATION_REQUIRED',
        message:
          'Authentication is required.',
      }
    );
  }
);

test(
  'hides unknown internal product creation errors',
  async () => {
    const controller = loadController({
      service: {
        createProduct: async () => {
          throw new Error(
            'database-secret-stack-detail'
          );
        },
      },
      db: {},
    });

    const { res, result } =
      createResponse();

    await controller.createProduct(
      {
        body: {},
        user: {
          uid: 'trusted-admin-001',
        },
      },
      res
    );

    assert.equal(
      result.statusCode,
      500
    );

    assert.equal(
      result.body.code,
      'INTERNAL_ERROR'
    );

    assert.equal(
      JSON.stringify(
        result.body
      ).includes(
        'database-secret-stack-detail'
      ),
      false
    );
  }
);

test(
  'sanitizes public product list responses',
  async () => {
    const controller = loadController({
      service: {
        createProduct: async () => ({}),
      },

      db: {
        collection(name) {
          assert.equal(
            name,
            'products'
          );

          return {
            async get() {
              return {
                docs: [
                  {
                    id: 'product-001',
                    data() {
                      return productFixture();
                    },
                  },
                ],
              };
            },
          };
        },
      },
    });

    const { res, result } =
      createResponse();

    await controller.getProducts(
      {},
      res
    );

    assert.equal(
      result.statusCode,
      200
    );

    assert.equal(
      result.body.success,
      true
    );

    assert.equal(
      result.body.data.length,
      1
    );

    assert.equal(
      Object.hasOwn(
        result.body.data[0],
        'adminUid'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        result.body.data[0],
        'provenanceId'
      ),
      false
    );
  }
);

test(
  'hides internal product list failures',
  async () => {
    const controller = loadController({
      service: {
        createProduct: async () => ({}),
      },

      db: {
        collection() {
          return {
            async get() {
              throw new Error(
                'firestore-secret-detail'
              );
            },
          };
        },
      },
    });

    const { res, result } =
      createResponse();

    await controller.getProducts(
      {},
      res
    );

    assert.equal(
      result.statusCode,
      500
    );

    assert.deepEqual(
      result.body,
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to load products.',
      }
    );
  }
);
