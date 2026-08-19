'use strict';

const test =
  require('node:test');

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const backendRoot =
  path.join(
    __dirname,
    '..'
  );

const packageJson =
  JSON.parse(
    fs.readFileSync(
      path.join(
        backendRoot,
        'package.json'
      ),
      'utf8'
    )
  );

console.log(
  'OPTIONAL_STORAGE_DEPENDENCY_RED_TEST_SETUP=PASS'
);

test(
  'pins the secure Firebase dependency boundary',
  () => {
    const dependencies =
      packageJson.dependencies || {};

    assert.equal(
      dependencies[
        'firebase-admin'
      ],
      '14.2.0'
    );

    assert.equal(
      dependencies[
        'firebase-functions'
      ],
      '7.3.2'
    );

    assert.equal(
      dependencies[
        '@google-cloud/firestore'
      ],
      '8.7.1',
      'Firestore must be an explicit direct dependency when Firebase Admin optional dependencies are omitted'
    );

    assert.equal(
      dependencies[
        '@google-cloud/storage'
      ],
      undefined,
      'Storage must not become a direct backend dependency'
    );
  }
);

test(
  'omits optional dependencies through project npm configuration',
  () => {
    const npmrcPath =
      path.join(
        backendRoot,
        '.npmrc'
      );

    assert.equal(
      fs.existsSync(
        npmrcPath
      ),
      true,
      'backend/.npmrc must exist'
    );

    const npmrc =
      fs.readFileSync(
        npmrcPath,
        'utf8'
      );

    assert.match(
      npmrc,
      /(?:^|\n)\s*omit\s*=\s*optional\s*(?:\n|$)/,
      'backend npm policy must omit optional dependencies'
    );
  }
);

test(
  'backend runtime does not depend on Firebase or Google Cloud Storage APIs',
  () => {
    const runtimeFiles = [
      'app.js',
      'functions.js',
      'server.js',
    ]
      .map(
        (name) =>
          path.join(
            backendRoot,
            name
          )
      )
      .filter(
        (name) =>
          fs.existsSync(name)
      );

    function walk(directory) {
      for (
        const entry
        of fs.readdirSync(
          directory,
          {
            withFileTypes: true,
          }
        )
      ) {
        const full =
          path.join(
            directory,
            entry.name
          );

        if (
          entry.isDirectory()
        ) {
          walk(full);
        } else if (
          entry.isFile()
          && full.endsWith('.js')
        ) {
          runtimeFiles.push(
            full
          );
        }
      }
    }

    walk(
      path.join(
        backendRoot,
        'src'
      )
    );

    const forbidden = [
      /firebase-admin\/storage/,
      /@google-cloud\/storage/,
      /\bgetStorage\s*\(/,
      /\badmin\s*\.\s*storage\s*\(/,
    ];

    const violations = [];

    for (
      const filename
      of runtimeFiles
    ) {
      const source =
        fs.readFileSync(
          filename,
          'utf8'
        );

      if (
        forbidden.some(
          (pattern) =>
            pattern.test(
              source
            )
        )
      ) {
        violations.push(
          path.relative(
            backendRoot,
            filename
          )
        );
      }
    }

    assert.deepEqual(
      violations,
      [],
      'Storage runtime usage would invalidate the omit-optional security boundary'
    );
  }
);
