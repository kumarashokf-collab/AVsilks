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

const firebaseConfigSource =
  fs.readFileSync(
    path.join(
      backendRoot,
      'src',
      'config',
      'firebase.js'
    ),
    'utf8'
  );

const verifyAuthSource =
  fs.readFileSync(
    path.join(
      backendRoot,
      'src',
      'middleware',
      'verifyAuth.js'
    ),
    'utf8'
  );

console.log(
  'FIREBASE_ADMIN_MODULAR_RED_TEST_SETUP=PASS'
);

test(
  'uses Firebase Admin modular APIs without legacy namespace auth',
  () => {
    assert.doesNotMatch(
      firebaseConfigSource,
      /require\(["']firebase-admin["']\)/,
      'firebase config must not import the legacy firebase-admin namespace'
    );

    assert.match(
      firebaseConfigSource,
      /require\(["']firebase-admin\/app["']\)/,
      'firebase config must use firebase-admin/app'
    );

    assert.match(
      firebaseConfigSource,
      /require\(["']firebase-admin\/firestore["']\)/,
      'firebase config must use firebase-admin/firestore'
    );

    assert.match(
      firebaseConfigSource,
      /require\(["']firebase-admin\/auth["']\)/,
      'firebase config must use firebase-admin/auth'
    );

    assert.match(
      firebaseConfigSource,
      /\bgetApps\b/,
      'firebase config must use getApps'
    );

    assert.match(
      firebaseConfigSource,
      /\binitializeApp\b/,
      'firebase config must use initializeApp'
    );

    assert.match(
      firebaseConfigSource,
      /\bgetFirestore\b/,
      'firebase config must use getFirestore'
    );

    assert.match(
      firebaseConfigSource,
      /\bgetAuth\b/,
      'firebase config must use getAuth'
    );

    assert.match(
      firebaseConfigSource,
      /module\.exports\s*=\s*\{[\s\S]*\bauth\b[\s\S]*\bdb\b[\s\S]*\binitializeFirebase\b[\s\S]*\}/,
      'firebase config must export auth, db and initializeFirebase'
    );

    assert.doesNotMatch(
      firebaseConfigSource,
      /module\.exports\s*=\s*\{[\s\S]*\badmin\b[\s\S]*\}/,
      'firebase config must not export the legacy admin namespace'
    );

    assert.match(
      verifyAuthSource,
      /const\s*\{\s*auth\s*,\s*db\s*\}\s*=\s*require\(["'][^"']*config\/firebase(?:\.js)?["']\)/,
      'verifyAuth must consume auth and db from firebase config'
    );

    assert.doesNotMatch(
      verifyAuthSource,
      /\badmin\.auth\s*\(/,
      'verifyAuth must not use admin.auth()'
    );

    assert.match(
      verifyAuthSource,
      /\bauth\s*\.\s*verifyIdToken\s*\(/,
      'verifyAuth must call modular auth.verifyIdToken()'
    );

    assert.match(
      verifyAuthSource,
      /\bauth\s*\.\s*getUser\s*\(/,
      'verifyAuth must call modular auth.getUser()'
    );
  }
);
