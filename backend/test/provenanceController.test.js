'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mapProvenanceError,
  sanitizeProvenanceResponse,
  createProvenanceController,
} = require(
  '../src/controllers/provenance.controller'
);

function createResponse() {
  return {
    statusCode: 0,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createRequest() {
  return {
    user: {
      uid: 'admin-uid-1',
    },

    body: {
      productId: 'product-001',
      artisanId: 'artisan-001',
      material: 'Pure Silk',
      weaveTechnique: 'Handloom Ikat',
      loomType: 'Pit Loom',

      origin: {
        village: 'Pochampally',
        district: 'Yadadri Bhuvanagiri',
        state: 'Telangana',
        country: 'India',
      },
    },

    method: 'POST',
    originalUrl: '/api/provenance',
  };
}

test(
  'returns 201 and sanitizes a newly created provenance record',
  async () => {
    const controller =
      createProvenanceController({
        async createSecureProvenanceFn({
          user,
          payload,
        }) {
          assert.equal(
            user.uid,
            'admin-uid-1'
          );

          assert.equal(
            payload.productId,
            'product-001'
          );

          return {
            created: true,
            provenanceId:
              'prov_controller_test_1',
            publicId:
              'pub_controller_test_1',

            provenance: {
              id: 'tampered-id',
              publicId:
                'pub_controller_test_1',
              productId: 'product-001',
              artisanId: 'artisan-001',
              skuSnapshot: 'SKU-001',
              productNameSnapshot:
                'Handloom Silk Saree',
              artisanCodeSnapshot:
                'ART-0001',
              artisanNameSnapshot:
                'Lakshmi Weaver',
              material: 'Pure Silk',
              weaveTechnique:
                'Handloom Ikat',
              loomType: 'Pit Loom',

              origin: {
                village: 'Pochampally',
                district:
                  'Yadadri Bhuvanagiri',
                state: 'Telangana',
                country: 'India',
              },

              status: 'draft',
              schemaVersion: 1,

              createdBy:
                'internal-admin-id',
              updatedBy:
                'internal-admin-id',
              createdAt:
                'internal-timestamp',
              updatedAt:
                'internal-timestamp',
              publishedAt: null,
              archivedAt: null,

              internalMetadata:
                'must-not-leak',
            },
          };
        },
      });

    const response =
      createResponse();

    await controller(
      createRequest(),
      response
    );

    assert.equal(
      response.statusCode,
      201
    );

    assert.equal(
      response.body.success,
      true
    );

    assert.equal(
      response.body.created,
      true
    );

    assert.equal(
      response.body.data.id,
      'prov_controller_test_1'
    );

    assert.equal(
      response.body.data.publicId,
      'pub_controller_test_1'
    );

    assert.equal(
      response.body.data.productId,
      'product-001'
    );

    assert.equal(
      response.body.data.artisanCodeSnapshot,
      'ART-0001'
    );

    assert.equal(
      response.body.data.status,
      'draft'
    );

    for (const key of [
      'createdBy',
      'updatedBy',
      'createdAt',
      'updatedAt',
      'publishedAt',
      'archivedAt',
      'internalMetadata',
    ]) {
      assert.equal(
        Object.prototype
          .hasOwnProperty.call(
            response.body.data,
            key
          ),
        false
      );
    }
  }
);

test(
  'returns sanitized validation details with 400',
  async () => {
    const controller =
      createProvenanceController({
        async createSecureProvenanceFn() {
          const error =
            new Error(
              'Internal validation message'
            );

          error.code =
            'VALIDATION_FAILED';

          error.details = [
            {
              path: 'productId',
              type:
                'string.empty',
              message:
                'internal joi message',
            },
          ];

          throw error;
        },
      });

    const response =
      createResponse();

    await controller(
      createRequest(),
      response
    );

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.body.success,
      false
    );

    assert.equal(
      response.body.code,
      'PROVENANCE_VALIDATION_FAILED'
    );

    assert.equal(
      response.body.details[0].path,
      'productId'
    );
  }
);

test(
  'maps authentication and missing resources safely',
  () => {
    assert.deepEqual(
      mapProvenanceError({
        code:
          'AUTHENTICATION_REQUIRED',
      }),
      {
        status: 401,
        code:
          'AUTHENTICATION_REQUIRED',
        message:
          'Authentication is required.',
      }
    );

    assert.deepEqual(
      mapProvenanceError({
        code:
          'PRODUCT_NOT_FOUND',
      }),
      {
        status: 404,
        code:
          'PRODUCT_NOT_FOUND',
        message:
          'Product was not found.',
      }
    );

    assert.deepEqual(
      mapProvenanceError({
        code:
          'ARTISAN_NOT_FOUND',
      }),
      {
        status: 404,
        code:
          'ARTISAN_NOT_FOUND',
        message:
          'Artisan was not found.',
      }
    );
  }
);

test(
  'maps provenance conflicts safely',
  () => {
    assert.deepEqual(
      mapProvenanceError({
        code:
          'PRODUCT_ALREADY_LINKED',
      }),
      {
        status: 409,
        code:
          'PRODUCT_ALREADY_LINKED',
        message:
          'Product already has provenance.',
      }
    );

    assert.deepEqual(
      mapProvenanceError({
        code:
          'PUBLIC_ID_CONFLICT',
      }),
      {
        status: 409,
        code:
          'PUBLIC_ID_CONFLICT',
        message:
          'Unable to allocate provenance public ID.',
      }
    );

    assert.deepEqual(
      mapProvenanceError({
        code:
          'ARTISAN_INACTIVE',
      }),
      {
        status: 409,
        code:
          'ARTISAN_INACTIVE',
        message:
          'Artisan is inactive.',
      }
    );
  }
);

test(
  'uses a generic response for unknown internal errors',
  async () => {
    const controller =
      createProvenanceController({
        async createSecureProvenanceFn() {
          throw new Error(
            'secret internal failure'
          );
        },
      });

    const response =
      createResponse();

    await controller(
      createRequest(),
      response
    );

    assert.equal(
      response.statusCode,
      500
    );

    assert.deepEqual(
      response.body,
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to create provenance.',
      }
    );
  }
);

test(
  'rejects an invalid provenance controller dependency',
  () => {
    assert.throws(
      () =>
        createProvenanceController({
          createSecureProvenanceFn:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'sanitizes provenance fields through an allowlist',
  () => {
    const sanitized =
      sanitizeProvenanceResponse(
        {
          publicId: 'pub_safe_1',
          productId: 'product-001',
          artisanId: 'artisan-001',
          skuSnapshot: 'SKU-001',
          productNameSnapshot:
            'Handloom Saree',
          artisanCodeSnapshot:
            'ART-0001',
          artisanNameSnapshot:
            'Lakshmi Weaver',
          material: 'Pure Silk',
          weaveTechnique:
            'Handloom Ikat',
          loomType: 'Pit Loom',

          origin: {
            village: 'Pochampally',
            district:
              'Yadadri Bhuvanagiri',
            state: 'Telangana',
            country: 'India',
            secret:
              'do-not-expose',
          },

          status: 'draft',
          schemaVersion: 1,
          secret: 'do-not-expose',
        },
        'prov_safe_1'
      );

    assert.equal(
      sanitized.id,
      'prov_safe_1'
    );

    assert.equal(
      sanitized.publicId,
      'pub_safe_1'
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          sanitized,
          'secret'
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          sanitized.origin,
          'secret'
        ),
      false
    );

    assert.equal(
      Object.isFrozen(sanitized),
      true
    );

    assert.equal(
      Object.isFrozen(
        sanitized.origin
      ),
      true
    );
  }
);
