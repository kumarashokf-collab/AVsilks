import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL(
    '../src/pages/Admin.jsx',
    import.meta.url
  ),
  'utf8'
);

test(
  'uses compact print-only styling so the 90mm x 140mm provenance tag stays on one page',
  () => {
    assert.match(
      source,
      /@page\s*\{\s*size:\s*auto;\s*margin:\s*0;/
    );

    assert.match(
      source,
      /@media print\s*\{[\s\S]*?\.tag\s*\{[\s\S]*?width:\s*90mm;[\s\S]*?height:\s*140mm;[\s\S]*?margin:\s*0 auto;/
    );

    assert.match(
      source,
      /@media print\s*\{[\s\S]*?\.tag\s*\{[\s\S]*?padding:\s*8px;[\s\S]*?border-width:\s*1px;[\s\S]*?break-inside:\s*avoid;[\s\S]*?page-break-inside:\s*avoid;/
    );

    assert.match(
      source,
      /@media print\s*\{[\s\S]*?\.qr\s*\{[\s\S]*?width:\s*180px;[\s\S]*?margin:\s*2px auto 6px;/
    );

    assert.match(
      source,
      /@media print\s*\{[\s\S]*?\.product\s*\{[\s\S]*?margin:\s*4px 0 6px;[\s\S]*?font-size:\s*14px;/
    );

    assert.match(
      source,
      /@media print\s*\{[\s\S]*?\.details\s*\{[\s\S]*?gap:\s*3px;[\s\S]*?font-size:\s*10px;[\s\S]*?line-height:\s*1\.2;/
    );

    assert.match(
      source,
      /@media print\s*\{[\s\S]*?\.verify\s*\{[\s\S]*?margin-top:\s*6px;[\s\S]*?padding-top:\s*5px;[\s\S]*?font-size:\s*8px;[\s\S]*?line-height:\s*1\.2;[\s\S]*?overflow-wrap:\s*anywhere;/
    );
  }
);

console.log(
  'PRINT_LAYOUT_TEST_MODULE_FORMAT=ESM_PASS'
);

test(
  'keeps QR and public ID on the printable tag without rendering the raw verification URL',
  () => {
    assert.match(
      source,
      /Scan QR to verify · Public ID:/
    );

    assert.doesNotMatch(
      source,
      /link\.textContent\s*=\s*model\.verificationUrl/
    );

    assert.doesNotMatch(
      source,
      /verification\.appendChild\(\s*link\s*\)/
    );
  }
);
