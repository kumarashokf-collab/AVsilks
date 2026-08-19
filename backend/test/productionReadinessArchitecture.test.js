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

const architecturePath =
  path.join(
    repoRoot,
    'docs',
    'PRODUCTION_READINESS_ARCHITECTURE.md'
  );

const blazeConfigPath =
  path.join(
    repoRoot,
    'firebase.json'
  );

const sparkConfigPath =
  path.join(
    repoRoot,
    'firebase.spark.json'
  );

const functionsPath =
  path.join(
    repoRoot,
    'backend',
    'functions.js'
  );

const backendPackagePath =
  path.join(
    repoRoot,
    'backend',
    'package.json'
  );

console.log(
  'PRODUCTION_READINESS_ARCHITECTURE_RED_TEST_SETUP=PASS'
);

test(
  'locks the Spark-safe to Blaze production-readiness architecture',
  () => {
    assert.equal(
      fs.existsSync(
        architecturePath
      ),
      true,
      'production readiness architecture document must exist'
    );

    const architecture =
      fs.readFileSync(
        architecturePath,
        'utf8'
      );

    const blaze =
      JSON.parse(
        fs.readFileSync(
          blazeConfigPath,
          'utf8'
        )
      );

    const spark =
      JSON.parse(
        fs.readFileSync(
          sparkConfigPath,
          'utf8'
        )
      );

    const functionsSource =
      fs.readFileSync(
        functionsPath,
        'utf8'
      );

    const backendPackage =
      JSON.parse(
        fs.readFileSync(
          backendPackagePath,
          'utf8'
        )
      );

    const requiredArchitectureMarkers = [
      '# AV Silks Production & Handover Readiness Architecture',
      '## Stable Engineering Baseline',
      '26c6ef059c22dbac0285c05a240bb5e55fd6f480',
      '## Operating Modes',
      'Spark Demo',
      'Blaze Staging',
      'Blaze Production',
      'firebase.spark.json',
      'firebase.json',
      '## Pre-Blaze Work Allowed',
      '## Blaze Approval Event Procedure',
      'Finish the current atomic step before switching to the Blaze activation gate.',
      'Blaze approval does not authorize production deployment.',
      '## Billing Safety',
      'Budget alerts are notifications, not an automatic spending hard cap.',
      '## Secret Management',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      '## Staging-First Deployment',
      'Razorpay test mode',
      '## Security Re-Audit',
      '## Production Approval Gate',
      '## Rollback',
      '## Government Handover',
      '## Stable Release Closure',
    ];

    for (
      const marker
      of requiredArchitectureMarkers
    ) {
      assert.equal(
        architecture.includes(
          marker
        ),
        true,
        `missing architecture marker: ${marker}`
      );
    }

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        spark,
        'functions'
      ),
      false,
      'Spark config must remain free of Functions deployment'
    );

    const sparkRewrites =
      spark.hosting.rewrites || [];

    assert.equal(
      sparkRewrites.some(
        (entry) =>
          entry.source === '/api/**'
      ),
      false,
      'Spark config must not route /api to Functions'
    );

    assert.ok(
      Array.isArray(
        blaze.functions
      ),
      'Blaze config must define Functions'
    );

    assert.equal(
      blaze.functions[0].source,
      'backend'
    );

    assert.equal(
      blaze.functions[0].codebase,
      'api'
    );

    const apiRewrite =
      blaze.hosting.rewrites.find(
        (entry) =>
          entry.source === '/api/**'
      );

    assert.ok(
      apiRewrite,
      'Blaze config must route /api/**'
    );

    assert.equal(
      apiRewrite.function.functionId,
      'api'
    );

    assert.equal(
      apiRewrite.function.region,
      'asia-south1'
    );

    assert.equal(
      backendPackage.engines.node,
      '22'
    );

    const expectedSecretNames = [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ];

    for (
      const name
      of expectedSecretNames
    ) {
      assert.match(
        functionsSource,
        new RegExp(
          `defineSecret\\(["']${name}["']\\)`
        ),
        `${name} must remain bound through Firebase Secret Manager`
      );
    }

    const forbiddenSecretPatterns = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
      /\brzp_live_[A-Za-z0-9]+\b/i,
      /\bAIza[0-9A-Za-z_-]{20,}\b/,
      /RAZORPAY_KEY_SECRET\s*=\s*\S+/i,
      /RAZORPAY_WEBHOOK_SECRET\s*=\s*\S+/i,
      /FIREBASE_PRIVATE_KEY\s*=\s*\S+/i,
    ];

    for (
      const pattern
      of forbiddenSecretPatterns
    ) {
      assert.doesNotMatch(
        architecture,
        pattern,
        'architecture documentation must never contain secret values'
      );
    }
  }
);
