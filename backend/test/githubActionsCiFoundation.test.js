'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.resolve(
  __dirname,
  '../../.github/workflows/ci.yml'
);

test(
  'locks a test-only GitHub Actions CI foundation with no deployment authority',
  () => {
    if (!fs.existsSync(WORKFLOW_PATH)) {
      const error = new Error(
        'GITHUB_ACTIONS_CI_WORKFLOW_MISSING'
      );

      error.code =
        'GITHUB_ACTIONS_CI_WORKFLOW_MISSING';

      throw error;
    }

    const workflow =
      fs.readFileSync(WORKFLOW_PATH, 'utf8');

    assert.match(
      workflow,
      /name:\s*AV Silks CI/
    );

    assert.match(workflow, /pull_request:/);
    assert.match(workflow, /push:/);

    assert.match(
      workflow,
      /actions\/checkout@v4/
    );

    assert.match(
      workflow,
      /actions\/setup-node@v4/
    );

    assert.match(
      workflow,
      /node-version:\s*['"]?22['"]?/
    );

    assert.match(
      workflow,
      /npm test/
    );

    assert.match(
      workflow,
      /npm run build/
    );

    const requiredRuntimeAudit =
      'npm audit --omit=dev --omit=optional --audit-level=moderate';

    if (!workflow.includes(requiredRuntimeAudit)) {
      const error = new Error(
        'GITHUB_ACTIONS_CI_RUNTIME_AUDIT_SCOPE_MISSING'
      );

      error.code =
        'GITHUB_ACTIONS_CI_RUNTIME_AUDIT_SCOPE_MISSING';

      throw error;
    }

    assert.doesNotMatch(
      workflow,
      /firebase\s+deploy|gcloud\s+deploy|kubectl|docker\s+push/i
    );

    assert.doesNotMatch(
      workflow,
      /RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|secrets\./i
    );
  }
);
