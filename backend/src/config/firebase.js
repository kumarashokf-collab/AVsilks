const admin = require("firebase-admin");
const {
  buildFirebaseOptions,
} = require("./firebaseOptions");

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp(
    buildFirebaseOptions({
      env: process.env,
      credential: admin.credential,
    })
  );
}

initializeFirebase();

const db = admin.firestore();

module.exports = {
  admin,
  db,
  initializeFirebase,
};
