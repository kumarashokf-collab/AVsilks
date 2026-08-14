'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mapArtisanError,
  sanitizeArtisanResponse,
  createArtisanController,
} = require(
  '../src/controllers/artisan.controller'
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
      artisanCode: 'ART-0001',
      displayName: 'Lakshmi Weaver',
      craftType: 'Handloom Weaving',
      village: 'Pochampally',
      district: 'Yadadri Bhuvanagiri',
      state: 'Telangana',
      country: 'India',
      loomType: 'Pit Loom',
    },

    method: 'POST',
    originalUrl: '/api/artisans',
  };
}

test(
  'returns 201 and sanitizes a newly created artisan',
  async () => {
    const controller =
      createArtisanController({
        async createSecureArtisanFn({
          user,
          payload,
        }) {
          assert.equal(
            user.uid,
            'admin-uid-1'
          );

          assert.equal(
            payload.artisanCode,
            'ART-0001'
          );

          return {
            created: true,
            artisanId:
              'art_controller_test_1',

            artisan: {
              id: 'tampered-stored-id',
              artisanCode: 'ART-0001',
              displayName:
                'Lakshmi Weaver',
              craftType:
                'Handloom Weaving',
              village: 'Pochampally',
              district:
                'Yadadri Bhuvanagiri',
              state: 'Telangana',
              country: 'India',
              loomType: 'Pit Loom',
              active: true,

              createdBy:
                'internal-admin-id',
              updatedBy:
                'internal-admin-id',
              createdAt:
                'internal-timestamp',
              updatedAt:
                'internal-timestamp',

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
      'art_controller_test_1'
    );

    assert.equal(
      response.body.data.artisanCode,
      'ART-0001'
    );

    assert.equal(
      response.body.data.displayName,
      'Lakshmi Weaver'
    );

    for (const key of [
      'createdBy',
      'updatedBy',
      'createdAt',
      'updatedAt',
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
      createArtisanController({
        async createSecureArtisanFn() {
          const error =
            new Error(
              'Internal validation message'
            );

          error.code =
            'VALIDATION_FAILED';

          error.details = [
            {
              path: 'artisanCode',
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
      response.body.success,
      false
    );

    assert.equal(
      response.body.code,
      'ARTISAN_VALIDATION_FAILED'
    );

    assert.equal(
      response.body.details[0].path,
      'artisanCode'
    );
  }
);

test(
  'maps authentication and artisan code conflict safely',
  () => {
    assert.deepEqual(
      mapArtisanError({
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
      mapArtisanError({
        code:
          'ARTISAN_CODE_CONFLICT',
      }),
      {
        status: 409,
        code:
          'ARTISAN_CODE_CONFLICT',
        message:
          'Artisan code already exists.',
      }
    );
  }
);

test(
  'uses a generic response for unknown internal errors',
  async () => {
    const controller =
      createArtisanController({
        async createSecureArtisanFn() {
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
          'Unable to create artisan.',
      }
    );
  }
);

test(
  'rejects an invalid artisan controller dependency',
  () => {
    assert.throws(
      () =>
        createArtisanController({
          createSecureArtisanFn:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'sanitizes artisan fields through an allowlist',
  () => {
    const sanitized =
      sanitizeArtisanResponse(
        {
          artisanCode: 'ART-0001',
          displayName:
            'Lakshmi Weaver',
          craftType:
            'Handloom Weaving',
          village: 'Pochampally',
          district:
            'Yadadri Bhuvanagiri',
          state: 'Telangana',
          country: 'India',
          loomType: 'Pit Loom',
          active: true,
          secret: 'do-not-expose',
        },
        'art_safe_1'
      );

    assert.equal(
      sanitized.id,
      'art_safe_1'
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
      Object.isFrozen(sanitized),
      true
    );
  }
);
