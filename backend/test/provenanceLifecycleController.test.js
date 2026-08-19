'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mapProvenanceError,
  sanitizeProvenanceLifecycleResponse,
  createPublishProvenanceController,
  createArchiveProvenanceController,
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

    params: {
      id: 'prov-001',
    },

    method: 'POST',
    originalUrl:
      '/api/provenance/prov-001/publish',
  };
}

test(
  'returns 200 with sanitized published provenance lifecycle response',
  async () => {
    const controller =
      createPublishProvenanceController({
        async publishSecureProvenanceFn({
          user,
          params,
        }) {
          assert.equal(
            user.uid,
            'admin-uid-1'
          );

          assert.equal(
            params.id,
            'prov-001'
          );

          return {
            updated: true,
            provenanceId:
              'prov-001',
            status:
              'published',

            updatedBy:
              'internal-admin-id',
            updatedAt:
              'internal-timestamp',
            publishedAt:
              'internal-timestamp',
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
      200
    );

    assert.deepEqual(
      response.body,
      {
        success: true,
        updated: true,

        data: {
          id: 'prov-001',
          status: 'published',
        },
      }
    );
  }
);

test(
  'returns 200 with sanitized archived provenance lifecycle response',
  async () => {
    const controller =
      createArchiveProvenanceController({
        async archiveSecureProvenanceFn() {
          return {
            updated: true,
            provenanceId:
              'prov-001',
            status:
              'archived',
            archivedAt:
              'internal-timestamp',
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
      200
    );

    assert.equal(
      response.body.data.id,
      'prov-001'
    );

    assert.equal(
      response.body.data.status,
      'archived'
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          response.body.data,
          'archivedAt'
        ),
      false
    );
  }
);

test(
  'returns sanitized lifecycle validation details with 400',
  async () => {
    const controller =
      createPublishProvenanceController({
        async publishSecureProvenanceFn() {
          const error =
            new Error(
              'internal validation failure'
            );

          error.code =
            'VALIDATION_FAILED';

          error.details = [
            {
              path: 'id',
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
  'maps missing provenance lifecycle record safely',
  () => {
    assert.deepEqual(
      mapProvenanceError({
        code:
          'PROVENANCE_NOT_FOUND',
      }),
      {
        status: 404,
        code:
          'PROVENANCE_NOT_FOUND',
        message:
          'Provenance record was not found.',
      }
    );
  }
);

test(
  'maps invalid provenance lifecycle transition safely',
  () => {
    assert.deepEqual(
      mapProvenanceError({
        code:
          'INVALID_STATUS_TRANSITION',
      }),
      {
        status: 409,
        code:
          'INVALID_STATUS_TRANSITION',
        message:
          'Provenance status transition is not allowed.',
      }
    );
  }
);

test(
  'uses a generic lifecycle response for unknown internal errors',
  async () => {
    const controller =
      createArchiveProvenanceController({
        async archiveSecureProvenanceFn() {
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
          'Unable to update provenance status.',
      }
    );
  }
);

test(
  'rejects invalid provenance lifecycle controller dependencies',
  () => {
    assert.throws(
      () =>
        createPublishProvenanceController({
          publishSecureProvenanceFn:
            'not-a-function',
        }),
      TypeError
    );

    assert.throws(
      () =>
        createArchiveProvenanceController({
          archiveSecureProvenanceFn:
            'not-a-function',
        }),
      TypeError
    );
  }
);

test(
  'sanitizes provenance lifecycle fields through an allowlist',
  () => {
    const sanitized =
      sanitizeProvenanceLifecycleResponse({
        provenanceId:
          'prov-safe-1',
        status:
          'published',
        updatedBy:
          'secret-admin',
        updatedAt:
          'secret-time',
      });

    assert.deepEqual(
      sanitized,
      {
        id:
          'prov-safe-1',
        status:
          'published',
      }
    );

    assert.equal(
      Object.isFrozen(
        sanitized
      ),
      true
    );
  }
);
