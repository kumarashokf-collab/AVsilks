'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const repoRoot =
  path.resolve(
    __dirname,
    '..',
    '..'
  );

const readinessPath =
  path.join(
    repoRoot,
    'docs',
    'GOVERNMENT_HANDOVER_READINESS.md'
  );

const demoPath =
  path.join(
    repoRoot,
    'docs',
    'GOVERNMENT_DEMO_SCRIPT.md'
  );

const briefingPath =
  path.join(
    repoRoot,
    'docs',
    'GOVERNMENT_BRIEFING_ONE_PAGER.md'
  );

console.log(
  'GOVERNMENT_HANDOVER_RED_TEST_SETUP=PASS'
);

test(
  'locks the government handover and QR demo readiness pack',
  () => {
    assert.equal(
      fs.existsSync(readinessPath),
      true,
      'government handover readiness document must exist'
    );

    assert.equal(
      fs.existsSync(demoPath),
      true,
      'government demo script must exist'
    );

    assert.equal(
      fs.existsSync(briefingPath),
      true,
      'government one-page briefing must exist'
    );

    const readiness =
      fs.readFileSync(
        readinessPath,
        'utf8'
      );

    const demo =
      fs.readFileSync(
        demoPath,
        'utf8'
      );

    const briefing =
      fs.readFileSync(
        briefingPath,
        'utf8'
      );

    const readinessMarkers = [
      '# AV Silks Government Handover Readiness',
      'Government Handloom White-Label + QR Provenance MVP',
      'Non-technical operating guide',
      'Brand change and handover guide',
      'Owner-only branding',
      'Government handover checklist',
      'Source code handover',
      'Deployment guide',
      'Rollback readiness',
      'Security re-audit',
      'AI-assisted development disclosure',
      'ChatGPT as an engineering assistant',
      'Production approval remains separate',
    ];

    for (const marker of readinessMarkers) {
      assert.equal(
        readiness.includes(marker),
        true,
        `missing handover readiness marker: ${marker}`
      );
    }

    const demoMarkers = [
      '# AV Silks Government QR Demo Script',
      '60–90 seconds',
      'Telugu',
      'English',
      'Problem',
      'Solution',
      'QR provenance',
      'Artisan traceability',
      'Benefits',
      'real saree',
      'printed QR',
      'public provenance verification',
    ];

    for (const marker of demoMarkers) {
      assert.equal(
        demo.includes(marker),
        true,
        `missing government demo marker: ${marker}`
      );
    }

    const briefingMarkers = [
      '# AV Silks Government One-Page Briefing',
      'Problem',
      'Proposed solution',
      'Handloom worker',
      'QR provenance',
      'Artisan',
      'White-label',
      'Government ownership / handover',
      'Security',
      'Expected benefits',
      'Demo',
    ];

    for (const marker of briefingMarkers) {
      assert.equal(
        briefing.includes(marker),
        true,
        `missing government briefing marker: ${marker}`
      );
    }
  }
);
