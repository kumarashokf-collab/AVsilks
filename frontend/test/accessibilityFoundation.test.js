import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

const indexHtml = readFileSync(
  path.join(frontendRoot, 'index.html'),
  'utf8'
);

const globalCss = readFileSync(
  path.join(frontendRoot, 'src', 'index.css'),
  'utf8'
);

test(
  'keeps the mobile viewport pinch-zoom accessible',
  () => {
    const viewport = indexHtml.match(
      /<meta\s+name="viewport"\s+content="([^"]+)"/i
    );

    assert.ok(viewport);
    assert.match(viewport[1], /width=device-width/);
    assert.match(viewport[1], /initial-scale=1/);
    assert.match(viewport[1], /viewport-fit=cover/);
    assert.doesNotMatch(viewport[1], /maximum-scale/i);
    assert.doesNotMatch(
      viewport[1],
      /user-scalable\s*=\s*no/i
    );
  }
);

test(
  'locks keyboard focus visibility and primary touch targets',
  () => {
    assert.match(
      globalCss,
      /AV Silks accessibility foundation/
    );
    assert.match(globalCss, /:focus-visible/);
    assert.match(
      globalCss,
      /outline:\s*3px\s+solid\s+currentColor/
    );
    assert.match(
      globalCss,
      /outline-offset:\s*3px/
    );
    assert.match(globalCss, /min-width:\s*44px/);
    assert.match(globalCss, /min-height:\s*44px/);
  }
);

console.log(
  'ACCESSIBILITY_FOUNDATION_TEST_SETUP=PASS'
);
