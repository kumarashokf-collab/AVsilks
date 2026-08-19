'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizePublicProvenanceResponse,
  createPublicProvenanceController,
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
    user: null,

    params: {
      publicId:
        'pub-001',
    },

    method: 'GET',

    originalUrl:
      '/api/provenance/public/pub-001',
  };
}

function publishedRepositoryResult() {
  return {
    publicId:
      'pub-001',

    provenance: {
      id: 'prov-secret-001',
      publicId: 'pub-001',
      productId:
        'product-secret-001',
      artisanId:
        'artisan-secret-001',

      skuSnapshot:
        'SKU-001',

      productNameSnapshot:
        'Handloom Silk Saree',

      artisanCodeSnapshot:
        'ART-0001',

      artisanNameSnapshot:
        'Lakshmi Weaver',

      material:
        'Pure Silk',

      weaveTechnique:
        'Handloom Ikat',

      loomType:
        'Pit Loom',

      origin: {
        village:
          'Pochampally',
        district:
          'Yadadri Bhuvanagiri',
        state:
          'Telangana',
        country:
          'India',

        internalLocationCode:
          'secret',
      },

      status:
        'published',

      schemaVersion: 1,

      createdBy:
        'internal-admin',
      updatedBy:
        'internal-admin',

      createdAt:
        'internal-time',
      updatedAt:
        'internal-time',
      publishedAt:
        'internal-time',

      internalMetadata:
        'must-not-leak',
    },
  };
}

test(
  'returns 200 with a sanitized public provenance verification response',
  async () => {
    const controller =
      createPublicProvenanceController({
        async getPublicProvenanceFn({
          params,
        }) {
          assert.equal(
            params.publicId,
            'pub-001'
          );

          return publishedRepositoryResult();
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
      200
    );

    assert.equal(
      response.body.success,
      true
    );

    assert.equal(
      response.body.verified,
      true
    );

    assert.deepEqual(
      response.body.data,
      {
        publicId:
          'pub-001',

        product: {
          sku:
            'SKU-001',

          name:
            'Handloom Silk Saree',
        },

        artisan: {
          code:
            'ART-0001',

          name:
            'Lakshmi Weaver',
        },

        material:
          'Pure Silk',

        weaveTechnique:
          'Handloom Ikat',

        loomType:
          'Pit Loom',

        origin: {
          village:
            'Pochampally',

          district:
            'Yadadri Bhuvanagiri',

          state:
            'Telangana',

          country:
            'India',
        },
      }
    );
  }
);

test(
  'does not expose internal provenance identifiers audit fields or lifecycle metadata',
  () => {
    const sanitized =
      sanitizePublicProvenanceResponse(
        publishedRepositoryResult()
      );

    const serialized =
      JSON.stringify(sanitized);

    for (const secret of [
      'prov-secret-001',
      'product-secret-001',
      'artisan-secret-001',
      'internal-admin',
      'internal-time',
      'internalMetadata',
      'schemaVersion',
      '"status"',
      'internalLocationCode',
    ]) {
      assert.equal(
        serialized.includes(
          secret
        ),
        false
      );
    }

    assert.equal(
      Object.isFrozen(
        sanitized
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        sanitized.product
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        sanitized.artisan
      ),
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

test(
  'returns sanitized validation details with 400',
  async () => {
    const controller =
      createPublicProvenanceController({
        async getPublicProvenanceFn() {
          const error =
            new Error(
              'internal validation failure'
            );

          error.code =
            'VALIDATION_FAILED';

          error.details = [
            {
              path:
                'publicId',
              type:
                'string.pattern.base',
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
      response.body.code,
      'PROVENANCE_VALIDATION_FAILED'
    );

    assert.equal(
      response.body.details[0].path,
      'publicId'
    );
  }
);

test(
  'hides missing and unavailable public provenance behind the same 404 response',
  async () => {
    for (const code of [
      'PUBLIC_PROVENANCE_NOT_FOUND',
      'INVALID_PUBLIC_PROVENANCE_DATA',
    ]) {
      const controller =
        createPublicProvenanceController({
          async getPublicProvenanceFn() {
            const error =
              new Error(
                'internal provenance state'
              );

            error.code =
              code;

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
        404
      );

      assert.deepEqual(
        response.body,
        {
          success: false,
          verified: false,
          code:
            'PUBLIC_PROVENANCE_NOT_FOUND',
          message:
            'Provenance verification was not found.',
        }
      );
    }
  }
);

test(
  'uses a generic public verification response for unknown internal errors',
  async () => {
    const controller =
      createPublicProvenanceController({
        async getPublicProvenanceFn() {
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
        verified: false,
        code:
          'INTERNAL_ERROR',
        message:
          'Unable to verify provenance.',
      }
    );
  }
);

test(
  'rejects an invalid public provenance controller dependency',
  () => {
    assert.throws(
      () =>
        createPublicProvenanceController({
          getPublicProvenanceFn:
            'not-a-function',
        }),
      TypeError
    );
  }
);
