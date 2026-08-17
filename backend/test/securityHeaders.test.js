'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot =
  path.join(__dirname, '..');

const appSource =
  fs.readFileSync(
    path.join(backendRoot, 'app.js'),
    'utf8'
  );

const packageJson =
  JSON.parse(
    fs.readFileSync(
      path.join(backendRoot, 'package.json'),
      'utf8'
    )
  );

test(
  'uses Helmet as a backend security-header middleware',
  () => {
    const helmetVersion =
      packageJson.dependencies?.helmet ||
      packageJson.devDependencies?.helmet;

    assert.ok(
      helmetVersion,
      'helmet dependency must be installed'
    );

    assert.match(
      appSource,
      /require\(["']helmet["']\)/
    );

    assert.match(
      appSource,
      /app\.use\(\s*helmet\(\s*\)\s*\)/
    );
  }
);

test(
  'explicitly disables the Express X-Powered-By header',
  () => {
    assert.match(
      appSource,
      /app\.disable\(\s*["']x-powered-by["']\s*\)/
    );
  }
);

console.log(
  'SECURITY_HEADERS_RED_TEST_SETUP=PASS'
);


test(
  'strips X-Powered-By inherited from an outer Express wrapper',
  async (t) => {
    const http = require('node:http');
    const express = require('express');
    const innerApp = require('../app');

    const outerApp = express();

    outerApp.use((req, res, next) => {
      res.setHeader(
        'X-Powered-By',
        'Express'
      );
      next();
    });

    outerApp.use(innerApp);

    const server = outerApp.listen(
      0,
      '127.0.0.1'
    );

    await new Promise((resolve) => {
      server.once('listening', resolve);
    });

    t.after(
      () =>
        new Promise((resolve) => {
          server.close(resolve);
        })
    );

    const headers = await new Promise(
      (resolve, reject) => {
        const { port } = server.address();

        http.get(
          {
            hostname: '127.0.0.1',
            port,
            path: '/api/health',
          },
          (res) => {
            const result = res.headers;
            res.resume();
            res.once(
              'end',
              () => resolve(result)
            );
          }
        ).once('error', reject);
      }
    );

    assert.equal(
      headers['x-powered-by'],
      undefined
    );
  }
);
