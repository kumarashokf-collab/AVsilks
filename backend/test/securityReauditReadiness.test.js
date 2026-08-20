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

const scriptPath =
  path.join(
    repoRoot,
    'scripts',
    'security-reaudit-preflight.sh'
  );

const checklistPath =
  path.join(
    repoRoot,
    'docs',
    'SECURITY_REAUDIT_CHECKLIST.md'
  );

console.log(
  'SECURITY_REAUDIT_RED_TEST_SETUP=PASS'
);

test(
  'locks the post-MVP pre-handover security re-audit readiness gate',
  () => {
    assert.equal(
      fs.existsSync(scriptPath),
      true,
      'security re-audit preflight script must exist'
    );

    assert.equal(
      fs.existsSync(checklistPath),
      true,
      'security re-audit checklist must exist'
    );

    const script =
      fs.readFileSync(
        scriptPath,
        'utf8'
      );

    const checklist =
      fs.readFileSync(
        checklistPath,
        'utf8'
      );

    const requiredScriptMarkers = [
      '#!/usr/bin/env bash',
      'set +e',
      'EXPECTED_BRANCH="release/mvp-production-readiness"',
      'SECURITY_REAUDIT_SCOPE=POST_MVP_PRE_HANDOVER',
      '--check',
      'SECURITY_REAUDIT_CORS_GATE=PASS',
      'SECURITY_REAUDIT_RATE_LIMIT_GATE=PASS',
      'SECURITY_REAUDIT_HEADERS_GATE=PASS',
      'SECURITY_REAUDIT_TRUSTED_ROLE_GATE=PASS',
      'SECURITY_REAUDIT_OBSOLETE_ALLOWLIST_GATE=PASS',
      'SECURITY_REAUDIT_ERROR_LOGGING_GATE=PASS',
      'SECURITY_REAUDIT_DEPENDENCY_GATE=PASS',
      'SECURITY_REAUDIT_PUBLIC_ENDPOINT_GATE=PASS',
      'SECURITY_REAUDIT_PROVENANCE_EXPOSURE_GATE=PASS',
      'SECURITY_REAUDIT_SECRET_MANAGEMENT_GATE=PASS',
      'SECURITY_REAUDIT_LIVE_STAGING_STATUS=DEFERRED_UNTIL_DEPLOYED_BLAZE_STAGING',
      'SECURITY_REAUDIT_PRODUCTION_MUTATION_STATUS=NOT_ATTEMPTED',
      'SECURITY_REAUDIT_CLOUD_MUTATION_STATUS=NOT_ATTEMPTED',
      'SECURITY_REAUDIT_GATE=PASS',
    ];

    for (const marker of requiredScriptMarkers) {
      assert.equal(
        script.includes(marker),
        true,
        `missing security re-audit marker: ${marker}`
      );
    }

    const requiredChecklistMarkers = [
      '# AV Silks Security Re-Audit Checklist',
      'Post-MVP',
      'Before government handover',
      'CORS allowlist',
      'Rate limiting',
      'Helmet and security headers',
      'Trusted role consistency',
      'Obsolete allowlists',
      'Error and logging hygiene',
      'Dependency updates',
      'Public endpoint review',
      'QR provenance exposure',
      'Secret management',
      'Live Blaze staging validation',
      'Production approval remains separate',
    ];

    for (const marker of requiredChecklistMarkers) {
      assert.equal(
        checklist.includes(marker),
        true,
        `missing security checklist marker: ${marker}`
      );
    }

    const forbiddenScriptPatterns = [
      /firebase\s+deploy/i,
      /firebase\s+use\b/i,
      /functions:secrets:set/i,
      /functions:secrets:access/i,
      /secretmanager/i,
      /gcloud\s+/i,
      /git\s+push/i,
      /git\s+reset/i,
      /git\s+rebase/i,
      /git\s+checkout/i,
      /git\s+switch/i,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=]{16,}/i,
      /rzp_(?:live|test)_[A-Za-z0-9]{8,}/i,
      /set\s+-e\b/,
    ];

    for (const pattern of forbiddenScriptPatterns) {
      assert.doesNotMatch(
        script,
        pattern,
        `security re-audit preflight contains forbidden mutation or secret operation: ${pattern}`
      );
    }
  }
);
