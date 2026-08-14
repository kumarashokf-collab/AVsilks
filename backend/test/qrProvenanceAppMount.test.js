'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appFile = path.resolve(
  __dirname,
  '../app.js'
);

function readAppSource() {
  return fs.readFileSync(
    appFile,
    'utf8'
  );
}

test(
  'imports the artisan router factory',
  () => {
    const source =
      readAppSource();

    assert.match(
      source,
      /createArtisanRouter/
    );

    assert.match(
      source,
      /\.\/src\/routes\/artisan\.routes/
    );
  }
);

test(
  'imports the provenance router factory',
  () => {
    const source =
      readAppSource();

    assert.match(
      source,
      /createProvenanceRouter/
    );

    assert.match(
      source,
      /\.\/src\/routes\/provenance\.routes/
    );
  }
);

test(
  'mounts artisan and provenance API routers',
  () => {
    const source =
      readAppSource();

    assert.match(
      source,
      /app\.use\(\s*["']\/api\/artisans["']\s*,\s*createArtisanRouter\(\)\s*\)/
    );

    assert.match(
      source,
      /app\.use\(\s*["']\/api\/provenance["']\s*,\s*createProvenanceRouter\(\)\s*\)/
    );
  }
);

test(
  'preserves Express app and standalone server separation',
  () => {
    const source =
      readAppSource();

    assert.match(
      source,
      /module\.exports\s*=\s*app/
    );

    assert.doesNotMatch(
      source,
      /\.listen\s*\(/
    );

    assert.doesNotMatch(
      source,
      /dotenv\.config\s*\(/
    );
  }
);
