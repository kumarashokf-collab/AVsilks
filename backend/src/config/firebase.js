"use strict";

const {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
} = require("firebase-admin/firestore");

const {
  buildFirebaseOptions,
} = require("./firebaseOptions");

function initializeFirebase() {
  const defaultApp =
    getApps().find(
      (app) =>
        app.name === "[DEFAULT]"
    );

  if (defaultApp) {
    return defaultApp;
  }

  return initializeApp(
    buildFirebaseOptions({
      env: process.env,
      credential: {
        cert,
        applicationDefault,
      },
    })
  );
}

const firebaseApp =
  initializeFirebase();

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);

module.exports = {
  auth,
  db,
  initializeFirebase,
};
