'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.join(__dirname, '..');

const appSource = fs.readFileSync(
  path.join(backendRoot, 'app.js'),
  'utf8'
);

const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(backendRoot, 'package.json'),
    'utf8'
  )
);

console.log(
  'RATE_LIMIT_SECURITY_RED_TEST_SETUP=PASS'
);

test(
  'installs an approved Express rate-limiting dependency',
  () => {
    const version =
      packageJson.dependencies?.['express-rate-limit'] ||
      packageJson.devDependencies?.['express-rate-limit'];

    assert.ok(
      version,
      'express-rate-limit dependency must be installed'
    );
  }
);

test(
  'protects the centralized API namespace with a rate limiter',
  () => {
    assert.match(
      appSource,
      /require\(["']express-rate-limit["']\)/
    );

    assert.match(
      appSource,
      /app\.use\(\s*["']\/api["']\s*,\s*[A-Za-z_$][\w$]*\s*\)/
    );
  }
);


test(
  'enforces the API rate-limit runtime contract',
  async (t) => {
    const http = require('node:http');
    const app = require('../app');

    const server = app.listen(0, '127.0.0.1');

    await new Promise((resolve) => {
      server.once('listening', resolve);
    });

    t.after(() =>
      new Promise((resolve) => {
        server.close(resolve);
      })
    );

    const request = () =>
      new Promise((resolve, reject) => {
        const { port } = server.address();

        http.get(
          {
            hostname: '127.0.0.1',
            port,
            path: '/api/health',
          },
          (res) => {
            let body = '';

            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              body += chunk;
            });

            res.on('end', () => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body,
              });
            });
          }
        ).once('error', reject);
      });

    let response300;
    let response301;

    for (let i = 1; i <= 301; i += 1) {
      const response = await request();

      if (i === 300) response300 = response;
      if (i === 301) response301 = response;
    }

    assert.equal(response300.status, 200);
    assert.equal(response301.status, 429);

    const payload = JSON.parse(response301.body);

    assert.equal(payload.success, false);
    assert.equal(
      payload.error?.code,
      'RATE_LIMIT_EXCEEDED'
    );

    assert.ok(response301.headers.ratelimit);

    assert.equal(
      response301.headers['x-ratelimit-limit'],
      undefined
    );
  }
);
