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

function loadController(service) {
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
    exports: {
      db: {},
    },
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

test(
  'securely deactivates a product using route id and trusted uid',
  async () => {
    let receivedId = null;
    let receivedUid = null;

    const controller =
      loadController({
        createProduct: async () => ({}),

        deactivateProduct:
          async (productId, uid) => {
            receivedId = productId;
            receivedUid = uid;

            return {
              id: 'product-001',
              active: false,
              deactivatedByUid:
                'must-not-leak',
            };
          },
      });

    assert.equal(
      typeof controller.deactivateProduct,
      'function',
      'deactivateProduct controller must exist'
    );

    const { res, result } =
      createResponse();

    await controller.deactivateProduct(
      {
        params: {
          id: ' product-001 ',
        },
        user: {
          uid: 'trusted-admin-001',
          role: 'admin',
        },
      },
      res
    );

    assert.equal(
      receivedId,
      ' product-001 '
    );

    assert.equal(
      receivedUid,
      'trusted-admin-001'
    );

    assert.equal(
      result.statusCode,
      200
    );

    assert.deepEqual(
      result.body,
      {
        success: true,
        data: {
          id: 'product-001',
          active: false,
        },
      }
    );
  }
);

test(
  'maps invalid product deactivation input safely',
  async () => {
    const error =
      new Error('internal-detail');

    error.code = 'INVALID_INPUT';

    const controller =
      loadController({
        createProduct: async () => ({}),
        deactivateProduct:
          async () => {
            throw error;
          },
      });

    assert.equal(
      typeof controller.deactivateProduct,
      'function'
    );

    const { res, result } =
      createResponse();

    await controller.deactivateProduct(
      {
        params: {
          id: 'bad/id',
        },
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

    assert.deepEqual(
      result.body,
      {
        success: false,
        code:
          'PRODUCT_VALIDATION_FAILED',
        message:
          'Product request is invalid.',
      }
    );
  }
);

test(
  'maps missing product deactivation to safe 404',
  async () => {
    const error =
      new Error('firestore-detail');

    error.code =
      'PRODUCT_NOT_FOUND';

    const controller =
      loadController({
        createProduct: async () => ({}),
        deactivateProduct:
          async () => {
            throw error;
          },
      });

    assert.equal(
      typeof controller.deactivateProduct,
      'function'
    );

    const { res, result } =
      createResponse();

    await controller.deactivateProduct(
      {
        params: {
          id: 'product-404',
        },
        user: {
          uid: 'trusted-admin-001',
        },
      },
      res
    );

    assert.equal(
      result.statusCode,
      404
    );

    assert.deepEqual(
      result.body,
      {
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message:
          'Product was not found.',
      }
    );
  }
);

test(
  'hides unknown product deactivation errors',
  async () => {
    const controller =
      loadController({
        createProduct: async () => ({}),
        deactivateProduct:
          async () => {
            throw new Error(
              'database-secret-detail'
            );
          },
      });

    assert.equal(
      typeof controller.deactivateProduct,
      'function'
    );

    const { res, result } =
      createResponse();

    await controller.deactivateProduct(
      {
        params: {
          id: 'product-001',
        },
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
      JSON.stringify(result.body)
        .includes(
          'database-secret-detail'
        ),
      false
    );
  }
);
