"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildFirebaseOptions,
} = require("../src/config/firebaseOptions");

test(
  "uses explicit certificate credentials when all values are present",
  () => {
    const certificateMarker = Object.freeze({
      type: "certificate",
    });

    let receivedCertificate = null;
    let applicationDefaultCalled = false;

    const result = buildFirebaseOptions({
      env: {
        FIREBASE_PROJECT_ID: " project-id ",
        FIREBASE_CLIENT_EMAIL: " admin@example.test ",
        FIREBASE_PRIVATE_KEY: "line-one\\nline-two",
      },
      credential: {
        cert(value) {
          receivedCertificate = value;
          return certificateMarker;
        },

        applicationDefault() {
          applicationDefaultCalled = true;
          return {
            type: "application-default",
          };
        },
      },
    });

    assert.deepEqual(
      result,
      {
        credential: certificateMarker,
      }
    );

    assert.deepEqual(
      receivedCertificate,
      {
        projectId: "project-id",
        clientEmail: "admin@example.test",
        privateKey: "line-one\nline-two",
      }
    );

    assert.equal(
      applicationDefaultCalled,
      false
    );
  }
);

test(
  "uses Application Default Credentials when explicit values are absent",
  () => {
    const applicationDefaultMarker = Object.freeze({
      type: "application-default",
    });

    let certificateCalled = false;

    const result = buildFirebaseOptions({
      env: {},
      credential: {
        cert() {
          certificateCalled = true;
          return {
            type: "certificate",
          };
        },

        applicationDefault() {
          return applicationDefaultMarker;
        },
      },
    });

    assert.deepEqual(
      result,
      {
        credential: applicationDefaultMarker,
      }
    );

    assert.equal(
      certificateCalled,
      false
    );
  }
);

test(
  "rejects partial explicit credential configuration",
  () => {
    let credentialMethodCalled = false;

    assert.throws(
      () => buildFirebaseOptions({
        env: {
          FIREBASE_PROJECT_ID: "project-id",
        },
        credential: {
          cert() {
            credentialMethodCalled = true;
          },

          applicationDefault() {
            credentialMethodCalled = true;
          },
        },
      }),
      /explicit credential configuration is incomplete/
    );

    assert.equal(
      credentialMethodCalled,
      false
    );
  }
);

test(
  "treats whitespace-only explicit values as absent",
  () => {
    let applicationDefaultCalls = 0;

    const result = buildFirebaseOptions({
      env: {
        FIREBASE_PROJECT_ID: " ",
        FIREBASE_CLIENT_EMAIL: "\t",
        FIREBASE_PRIVATE_KEY: "\n",
      },
      credential: {
        cert() {
          throw new Error(
            "Certificate credentials must not be used"
          );
        },

        applicationDefault() {
          applicationDefaultCalls += 1;

          return {
            type: "application-default",
          };
        },
      },
    });

    assert.deepEqual(
      result,
      {
        credential: {
          type: "application-default",
        },
      }
    );

    assert.equal(
      applicationDefaultCalls,
      1
    );
  }
);

test(
  "rejects an invalid credential provider",
  () => {
    assert.throws(
      () => buildFirebaseOptions({
        env: {},
        credential: {},
      }),
      /valid Firebase credential provider/
    );
  }
);
