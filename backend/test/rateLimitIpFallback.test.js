'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const {
  ipKeyGenerator,
} =
  require('express-rate-limit');

const backendRoot =
  path.join(
    __dirname,
    '..'
  );

const helperPath =
  path.join(
    backendRoot,
    'src',
    'security',
    'rateLimitKey.js'
  );

const appSource =
  fs.readFileSync(
    path.join(
      backendRoot,
      'app.js'
    ),
    'utf8'
  );

console.log(
  'RATE_LIMIT_FIREBASE_PROXY_RED_TEST_SETUP=PASS'
);

test(
  'uses a Firebase-proxy-safe rate-limit key without weakening validation',
  () => {
    assert.ok(
      fs.existsSync(
        helperPath
      ),
      'rate-limit IP fallback helper must exist'
    );

    const {
      getRateLimitKey,
      UNKNOWN_RATE_LIMIT_KEY,
    } =
      require(
        helperPath
      );

    assert.equal(
      typeof getRateLimitKey,
      'function'
    );

    assert.equal(
      UNKNOWN_RATE_LIMIT_KEY,
      'unknown-client'
    );

    assert.equal(
      getRateLimitKey({
        ip: '127.0.0.1',
        socket: {},
      }),
      ipKeyGenerator(
        '127.0.0.1'
      )
    );

    assert.equal(
      getRateLimitKey({
        ip: undefined,
        socket: {
          remoteAddress:
            '127.0.0.2',
        },
      }),
      ipKeyGenerator(
        '127.0.0.2'
      )
    );

    assert.equal(
      getRateLimitKey({
        ip: '',
        socket: {
          remoteAddress: '',
        },
      }),
      'unknown-client'
    );

    assert.match(
      appSource,
      /require\(["']\.\/src\/security\/rateLimitKey["']\)/
    );

    assert.match(
      appSource,
      /keyGenerator\s*:\s*getRateLimitKey/
    );

    assert.doesNotMatch(
      appSource,
      /validate\s*:\s*false/
    );

    assert.doesNotMatch(
      appSource,
      /ip\s*:\s*false/
    );
  }
);
