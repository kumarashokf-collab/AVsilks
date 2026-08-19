'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot =
  path.resolve(
    __dirname,
    '..',
    '..'
  );

function readJson(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        name
      ),
      'utf8'
    )
  );
}

test(
  'Spark config uses the same Firestore rules and Hosting build output',
  () => {
    const blaze =
      readJson('firebase.json');

    const spark =
      readJson(
        'firebase.spark.json'
      );

    assert.equal(
      spark.firestore.rules,
      blaze.firestore.rules
    );

    assert.equal(
      spark.hosting.public,
      blaze.hosting.public
    );

    assert.equal(
      spark.firestore.rules,
      'frontend/firestore.rules'
    );

    assert.equal(
      spark.hosting.public,
      'frontend/dist'
    );
  }
);

test(
  'Spark config contains no Cloud Functions deployment or function rewrite',
  () => {
    const spark =
      readJson(
        'firebase.spark.json'
      );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        spark,
        'functions'
      ),
      false
    );

    const rewrites =
      spark.hosting.rewrites || [];

    assert.equal(
      rewrites.some(
        (rewrite) =>
          Object.prototype.hasOwnProperty.call(
            rewrite,
            'function'
          )
      ),
      false
    );
  }
);

test(
  'Spark config preserves SPA deep-link routing',
  () => {
    const spark =
      readJson(
        'firebase.spark.json'
      );

    assert.deepEqual(
      spark.hosting.rewrites,
      [
        {
          source: '**',
          destination:
            '/index.html',
        },
      ]
    );
  }
);

test(
  'default config preserves future Blaze backend Functions source',
  () => {
    const blaze =
      readJson('firebase.json');

    assert.ok(
      Array.isArray(
        blaze.functions
      )
    );

    assert.equal(
      blaze.functions[0].source,
      'backend'
    );

    assert.equal(
      blaze.functions[0].codebase,
      'api'
    );
  }
);

test(
  'default config preserves future Blaze API Hosting rewrite',
  () => {
    const blaze =
      readJson('firebase.json');

    const rewrite =
      blaze.hosting.rewrites.find(
        (entry) =>
          entry.source ===
          '/api/**'
      );

    assert.ok(
      rewrite,
      'future Blaze API rewrite must remain configured'
    );

    assert.equal(
      rewrite.function.functionId,
      'api'
    );

    assert.equal(
      rewrite.function.region,
      'asia-south1'
    );
  }
);
