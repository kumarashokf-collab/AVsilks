"use strict";

function normalizeEnvironmentValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function buildFirebaseOptions({
  env = process.env,
  credential,
} = {}) {
  if (
    !credential ||
    typeof credential.cert !== "function" ||
    typeof credential.applicationDefault !== "function"
  ) {
    throw new TypeError(
      "A valid Firebase credential provider is required"
    );
  }

  const projectId = normalizeEnvironmentValue(
    env.FIREBASE_PROJECT_ID
  );

  const clientEmail = normalizeEnvironmentValue(
    env.FIREBASE_CLIENT_EMAIL
  );

  const encodedPrivateKey = normalizeEnvironmentValue(
    env.FIREBASE_PRIVATE_KEY
  );

  const suppliedCredentialCount = [
    projectId,
    clientEmail,
    encodedPrivateKey,
  ].filter(Boolean).length;

  if (
    suppliedCredentialCount > 0 &&
    suppliedCredentialCount < 3
  ) {
    throw new Error(
      "Firebase explicit credential configuration is incomplete. " +
      "Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and " +
      "FIREBASE_PRIVATE_KEY together, or omit all three to use " +
      "Application Default Credentials."
    );
  }

  if (suppliedCredentialCount === 3) {
    const privateKey = encodedPrivateKey.replace(
      /\\n/g,
      "\n"
    );

    return {
      credential: credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    };
  }

  return {
    credential: credential.applicationDefault(),
  };
}

module.exports = {
  buildFirebaseOptions,
};
