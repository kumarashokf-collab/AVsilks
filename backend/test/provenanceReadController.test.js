'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeManagedProvenanceResponse,
  createGetProvenanceController,
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
      uid:
        'admin-001',
    },

    params: {
      id:
        'prov-001',
    },
  };
}

function createManagedResult(
  status = 'draft'
) {
  return {
    provenanceId:
      'prov-001',

    provenance: {
      id:
        'prov-001',

      publicId:
        'pub-001',

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

      status,
      schemaVersion: 1,

      createdBy:
        'admin-secret',

      updatedBy:
        'admin-secret',

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
  'returns 200 with sanitized managed provenance data',
  async () => {
    const controller =
      createGetProvenanceController({
        async getSecureProvenanceFn(
          input
        ) {
          assert.equal(
            input.user.uid,
            'admin-001'
          );

          assert.equal(
            input.params.id,
            'prov-001'
          );

          return createManagedResult(
            'draft'
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
      200
    );

    assert.deepEqual(
      response.body,
      {
        success: true,

        data: {
          id:
            'prov-001',

          publicId:
            'pub-001',

          status:
            'draft',

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
        },
      }
    );
  }
);

test(
  'supports draft published and archived lifecycle states',
  () => {
    for (const status of [
      'draft',
      'published',
      'archived',
    ]) {
      const data =
        sanitizeManagedProvenanceResponse(
          createManagedResult(
            status
          )
        );

      assert.equal(
        data.status,
        status
      );
    }
  }
);

test(
  'does not expose unrelated internal identifiers audit fields or metadata',
  () => {
    const data =
      sanitizeManagedProvenanceResponse(
        createManagedResult()
      );

    const serialized =
      JSON.stringify(data);

    for (const secret of [
      'product-secret-001',
      'artisan-secret-001',
      'admin-secret',
      'internal-time',
      'schemaVersion',
      'internalMetadata',
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
      Object.isFrozen(data),
      true
    );

    assert.equal(
      Object.isFrozen(
        data.product
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        data.artisan
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        data.origin
      ),
      true
    );
  }
);

test(
  'returns sanitized validation details with 400',
  async () => {
    const controller =
      createGetProvenanceController({
        async getSecureProvenanceFn() {
          const error =
            new Error(
              'internal validation text'
            );

          error.code =
            'VALIDATION_FAILED';

          error.details = [
            {
              path:
                'id',

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
      'id'
    );
  }
);

test(
  'maps missing provenance to 404 and internal corruption to generic 500',
  async () => {
    for (const [
      errorCode,
      expectedStatus,
      expectedCode,
    ] of [
      [
        'PROVENANCE_NOT_FOUND',
        404,
        'PROVENANCE_NOT_FOUND',
      ],

      [
        'INVALID_PROVENANCE_DATA',
        500,
        'INTERNAL_ERROR',
      ],
    ]) {
      const controller =
        createGetProvenanceController({
          async getSecureProvenanceFn() {
            const error =
              new Error(
                'internal provenance detail'
              );

            error.code =
              errorCode;

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
        expectedStatus
      );

      assert.equal(
        response.body.code,
        expectedCode
      );

      assert.equal(
        response.body.success,
        false
      );

      assert.equal(
        JSON.stringify(
          response.body
        ).includes(
          'internal provenance detail'
        ),
        false
      );
    }
  }
);

test(
  'rejects invalid managed provenance controller dependency',
  () => {
    assert.throws(
      () =>
        createGetProvenanceController({
          getSecureProvenanceFn:
            'not-a-function',
        }),
      TypeError
    );
  }
);
