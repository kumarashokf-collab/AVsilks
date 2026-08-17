'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const productContextPath =
  new URL(
    '../src/context/ProductContext.jsx',
    import.meta.url
  );

const adminPath =
  new URL(
    '../src/pages/Admin.jsx',
    import.meta.url
  );

function readSource(url) {
  return fs.readFileSync(
    url,
    'utf8'
  );
}

test(
  'ProductContext does not perform direct Firestore product writes',
  () => {
    const source =
      readSource(
        productContextPath
      );

    assert.doesNotMatch(
      source,
      /\baddDoc\b/
    );

    assert.doesNotMatch(
      source,
      /\bdeleteDoc\b/
    );

    assert.doesNotMatch(
      source,
      /\bserverTimestamp\b/
    );
  }
);

test(
  'ProductContext routes product writes through the secure product API service',
  () => {
    const source =
      readSource(
        productContextPath
      );

    assert.match(
      source,
      /from\s+["']\.\.\/services\/product\.js["']/
    );

    assert.match(
      source,
      /\bcreateProduct\s*\(/
    );

    assert.match(
      source,
      /\bdeactivateProduct\s*\(/
    );
  }
);

test(
  'Admin passes the authenticated user into product write operations',
  () => {
    const source =
      readSource(
        adminPath
      );

    assert.match(
      source,
      /addProduct\s*\(\s*\{[\s\S]*?\}\s*,\s*user\s*\)/
    );

    assert.match(
      source,
      /removeProduct\s*\(\s*product\.id\s*,\s*user\s*\)/
    );
  }
);
