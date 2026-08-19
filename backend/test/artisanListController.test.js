'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createListArtisansController,
} = require(
  '../src/controllers/artisan.controller'
);

function createResponseRecorder() {
  return {
    statusCode: null,
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

function artisanSource() {
  return {
    id: 'art_001',
    artisanCode: 'ART-001',
    displayName: 'Lakshmi Weaver',
    craftType: 'Handloom Weaving',
    village: 'Pochampally',
    district: 'Yadadri Bhuvanagiri',
    state: 'Telangana',
    country: 'India',
    loomType: 'Pit Loom',
    active: true,

    createdBy: 'private-admin-uid',
    updatedBy: 'private-admin-uid',
    createdAt: '__PRIVATE_TIMESTAMP__',
    updatedAt: '__PRIVATE_TIMESTAMP__',
  };
}

test(
  'returns sanitized active artisan list',
  async () => {
    const controller =
      createListArtisansController({
        listSecureArtisansFn:
          async () => [
            artisanSource(),
          ],
      });

    const req = {
      user: {
        uid: 'admin-uid-1',
      },
    };

    const res =
      createResponseRecorder();

    await controller(
      req,
      res
    );

    assert.equal(
      res.statusCode,
      200
    );

    assert.equal(
      res.body.success,
      true
    );

    assert.deepEqual(
      res.body.data,
      [
        {
          id: 'art_001',
          artisanCode: 'ART-001',
          displayName: 'Lakshmi Weaver',
          craftType: 'Handloom Weaving',
          village: 'Pochampally',
          district: 'Yadri Bhuvanagiri',
          state: 'Telangana',
          country: 'India',
          loomType: 'Pit Loom',
          active: true,
        },
      ].map((item) => ({
        ...item,
        district:
          'Yadadri Bhuvanagiri',
      }))
    );

    assert.equal(
      Object.hasOwn(
        res.body.data[0],
        'createdBy'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        res.body.data[0],
        'updatedBy'
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        res.body.data[0],
        'createdAt'
      ),
      false
    );
  }
);

test(
  'returns successful empty artisan list',
  async () => {
    const controller =
      createListArtisansController({
        listSecureArtisansFn:
          async () => [],
      });

    const res =
      createResponseRecorder();

    await controller(
      {
        user: {
          uid: 'admin-uid-1',
        },
      },
      res
    );

    assert.equal(
      res.statusCode,
      200
    );

    assert.deepEqual(
      res.body,
      {
        success: true,
        data: [],
      }
    );
  }
);

test(
  'passes authenticated request user to artisan list service',
  async () => {
    let capturedInput = null;

    const controller =
      createListArtisansController({
        listSecureArtisansFn:
          async (input) => {
            capturedInput =
              input;

            return [];
          },
      });

    const user = {
      uid: 'admin-uid-1',
      role: 'admin',
    };

    const res =
      createResponseRecorder();

    await controller(
      {
        user,
      },
      res
    );

    assert.equal(
      capturedInput.user,
      user
    );
  }
);

test(
  'maps authentication failure to safe 401 response',
  async () => {
    const controller =
      createListArtisansController({
        listSecureArtisansFn:
          async () => {
            const error =
              new Error(
                'private authentication detail'
              );

            error.code =
              'AUTHENTICATION_REQUIRED';

            throw error;
          },
      });

    const res =
      createResponseRecorder();

    await controller(
      {},
      res
    );

    assert.equal(
      res.statusCode,
      401
    );

    assert.deepEqual(
      res.body,
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
  'maps repository/internal failure to generic 500 without leaking details',
  async () => {
    const controller =
      createListArtisansController({
        listSecureArtisansFn:
          async () => {
            const error =
              new Error(
                'sensitive firestore detail'
              );

            error.code =
              'INVALID_REPOSITORY';

            throw error;
          },
      });

    const res =
      createResponseRecorder();

    await controller(
      {
        user: {
          uid: 'admin-uid-1',
        },
      },
      res
    );

    assert.equal(
      res.statusCode,
      500
    );

    assert.deepEqual(
      res.body,
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to list artisans.',
      }
    );

    assert.equal(
      JSON.stringify(
        res.body
      ).includes(
        'sensitive firestore detail'
      ),
      false
    );
  }
);

test(
  'rejects invalid artisan list controller dependency',
  () => {
    assert.throws(
      () =>
        createListArtisansController({
          listSecureArtisansFn:
            'not-a-function',
        }),
      TypeError
    );
  }
);
