'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const routePath =
  require.resolve(
    '../src/routes/product.routes'
  );

const controllerPath =
  require.resolve(
    '../src/controllers/product.controller'
  );

const verifyAuthPath =
  require.resolve(
    '../src/middleware/verifyAuth'
  );

const permissionPath =
  require.resolve(
    '../src/middleware/requirePermission'
  );

const permissionsPath =
  require.resolve(
    '../src/constants/permissions'
  );

function loadRouter({
  events,
} = {}) {
  delete require.cache[routePath];

  require.cache[controllerPath] = {
    id: controllerPath,
    filename: controllerPath,
    loaded: true,
    exports: {
      createProduct:
        (req, res) =>
          res.status(201).json({
            success: true,
          }),

      getProducts:
        (req, res) =>
          res.status(200).json({
            success: true,
            data: [],
          }),

      deactivateProduct:
        (req, res) => {
          events.push(
            'controller'
          );

          return res
            .status(200)
            .json({
              success: true,
              data: {
                id: req.params.id,
                active: false,
              },
            });
        },
    },
  };

  require.cache[verifyAuthPath] = {
    id: verifyAuthPath,
    filename: verifyAuthPath,
    loaded: true,
    exports: (req, res, next) => {
      events.push('auth');

      req.user = {
        uid: 'trusted-admin-001',
        role: 'admin',
      };

      next();
    },
  };

  require.cache[permissionPath] = {
    id: permissionPath,
    filename: permissionPath,
    loaded: true,
    exports: {
      requirePermission:
        (permission) =>
          (req, res, next) => {
            events.push(
              'permission:' +
              permission
            );

            next();
          },
    },
  };

  require.cache[permissionsPath] = {
    id: permissionsPath,
    filename: permissionsPath,
    loaded: true,
    exports: {
      PERMISSIONS: {
        PRODUCTS_CREATE:
          'products.create',
        PRODUCTS_DELETE:
          'products.delete',
      },
    },
  };

  return require(routePath);
}

test(
  'protects DELETE /:id with products.delete permission',
  async (t) => {
    const events = [];

    const router =
      loadRouter({
        events,
      });

    const app = express();

    app.use(
      express.json()
    );

    app.use(
      '/api/products',
      router
    );

    const server =
      app.listen(
        0,
        '127.0.0.1'
      );

    await new Promise((resolve) => {
      server.once(
        'listening',
        resolve
      );
    });

    t.after(
      () =>
        new Promise((resolve) => {
          server.close(resolve);
        })
    );

    const { port } =
      server.address();

    const response =
      await fetch(
        'http://127.0.0.1:' +
        port +
        '/api/products/product-001',
        {
          method: 'DELETE',
        }
      );

    const contentType =
      response.headers.get(
        'content-type'
      ) || '';

    const rawBody =
      await response.text();

    let body = null;

    if (
      contentType.includes(
        'application/json'
      )
    ) {
      try {
        body =
          JSON.parse(rawBody);
      } catch {
        body = null;
      }
    }

    assert.equal(
      response.status,
      200
    );

    assert.equal(
      body?.data?.id,
      'product-001'
    );

    assert.deepEqual(
      events,
      [
        'auth',
        'permission:products.delete',
        'controller',
      ]
    );
  }
);
