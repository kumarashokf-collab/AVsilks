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

const checklistPath =
  path.join(
    repoRoot,
    'docs',
    'BLAZE_ACTIVATION_CHECKLIST.md'
  );

const guardPath =
  path.join(
    repoRoot,
    'scripts',
    'blaze-activation-preflight.sh'
  );

console.log(
  'BLAZE_ACTIVATION_CHECKLIST_RED_TEST_SETUP=PASS'
);

test(
  'locks the Blaze approval activation checklist',
  () => {
    assert.equal(
      fs.existsSync(checklistPath),
      true,
      'Blaze activation checklist must exist'
    );

    const checklist =
      fs.readFileSync(
        checklistPath,
        'utf8'
      );

    const required = [
      '# AV Silks Blaze Activation Checklist',
      '## Trigger Condition',
      'Blaze approval does not authorize production deployment.',
      '## Current-Step Interruption Rule',
      'Finish the current atomic step',
      '## Stage 0 — Clean Git Checkpoint',
      '## Stage 1 — Billing Verification',
      'Budget alerts are notifications, not an automatic spending hard cap.',
      '## Stage 2 — Staging Project Identity',
      '## Stage 3 — Secret Manager Readiness',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      '## Stage 4 — Regression and Security Gates',
      '## Stage 5 — Functions Packaging Validation',
      '## Stage 6 — Blaze Staging Deployment',
      'Razorpay test mode',
      '## Stage 7 — Staging Smoke Tests',
      '## Stage 8 — Security Re-Audit',
      '## Stage 9 — Explicit Production Approval',
      '## Stage 10 — Blaze Production Deployment',
      '## Stage 11 — Rollback Verification',
      '## Stage 12 — Release Closure',
      'STOP CONDITIONS',
      'Never print secret values.',
      'Never force-push.',
      'Never deploy production automatically.',
    ];

    for (const marker of required) {
      assert.equal(
        checklist.includes(marker),
        true,
        `missing checklist marker: ${marker}`
      );
    }
  }
);

test(
  'provides a read-only Blaze activation preflight guard',
  () => {
    assert.equal(
      fs.existsSync(guardPath),
      true,
      'Blaze activation preflight guard must exist'
    );

    const guard =
      fs.readFileSync(
        guardPath,
        'utf8'
      );

    const required = [
      '#!/usr/bin/env bash',
      'set +e',
      'release/mvp-production-readiness',
      'firebase projects:list',
      'firebase.json',
      'firebase.spark.json',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'BLAZE_ACTIVATION_PREFLIGHT_GATE=PASS',
      'BLAZE_DEPLOYMENT_STATUS=NOT_ATTEMPTED',
      'SECRET_VALUES_STATUS=NOT_ACCESSED',
    ];

    for (const marker of required) {
      assert.equal(
        guard.includes(marker),
        true,
        `missing guard marker: ${marker}`
      );
    }

    const forbidden = [
      /firebase\s+deploy/i,
      /functions:secrets:set/i,
      /gcloud\s+services\s+enable/i,
      /billingAccounts/i,
      /git\s+push\s+.*--force/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbidden) {
      assert.doesNotMatch(
        guard,
        pattern,
        `read-only guard contains forbidden operation: ${pattern}`
      );
    }
  }
);
