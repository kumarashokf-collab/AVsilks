import {
  isValidRole,
  normalizeRole,
} from "../constants/roles.js";

import {
  getApiBaseUrl,
} from "./api.js";

function createSessionError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

async function defaultReadOwnRole(
  uid
) {
  const [
    firestoreModule,
    firebaseModule,
  ] =
    await Promise.all([
      import("firebase/firestore"),
      import("../firebase.js"),
    ]);

  const snapshot =
    await firestoreModule.getDoc(
      firestoreModule.doc(
        firebaseModule.db,
        "users",
        uid
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data()?.role ?? null;
}

function buildTrustedSession(
  uid,
  role
) {
  if (
    !uid ||
    !isValidRole(role)
  ) {
    throw createSessionError(
      "INVALID_TRUSTED_SESSION",
      "Trusted authentication session is invalid."
    );
  }

  return Object.freeze({
    uid,
    role:
      normalizeRole(role),
  });
}

export async function fetchTrustedAuthSession(
  user,
  dependencies = {}
) {
  const uid =
    typeof user?.uid === "string"
      ? user.uid.trim()
      : "";

  if (
    !uid ||
    typeof user?.getIdToken !==
      "function"
  ) {
    throw createSessionError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required."
    );
  }

  const fetchImpl =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      "fetchImpl"
    )
      ? dependencies.fetchImpl
      : globalThis.fetch;

  const readOwnRole =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      "readOwnRole"
    )
      ? dependencies.readOwnRole
      : defaultReadOwnRole;

  if (
    typeof fetchImpl !==
      "function"
  ) {
    throw new TypeError(
      "Trusted auth fetch dependency must be a function."
    );
  }

  if (
    typeof readOwnRole !==
      "function"
  ) {
    throw new TypeError(
      "Trusted role reader dependency must be a function."
    );
  }

  const idToken =
    await user.getIdToken();

  if (
    typeof idToken !== "string" ||
    !idToken.trim()
  ) {
    throw createSessionError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required."
    );
  }

  const response =
    await fetchImpl(
      `${getApiBaseUrl()}/auth/me`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${idToken.trim()}`,
        },
      }
    );

  const contentType =
    typeof response?.headers?.get ===
      "function"
      ? String(
          response.headers.get(
            "content-type"
          ) || ""
        ).toLowerCase()
      : "";

  let result = null;
  let parsedJson = false;

  try {
    result =
      await response.json();

    parsedJson = true;
  } catch {
    result = null;
  }

  if (
    response.ok &&
    result?.success === true
  ) {
    const sessionUid =
      typeof result?.data?.uid ===
        "string"
        ? result.data.uid.trim()
        : "";

    if (sessionUid !== uid) {
      throw createSessionError(
        "INVALID_TRUSTED_SESSION",
        "Trusted authentication session is invalid."
      );
    }

    return buildTrustedSession(
      uid,
      result?.data?.role
    );
  }

  const sparkSpaFallback =
    response.ok &&
    response.status === 200 &&
    !parsedJson &&
    contentType.includes(
      "text/html"
    );

  if (sparkSpaFallback) {
    const ownRole =
      await readOwnRole(uid);

    return buildTrustedSession(
      uid,
      ownRole
    );
  }

  throw createSessionError(
    typeof result?.code === "string" &&
      result.code.trim()
      ? result.code.trim()
      : "TRUSTED_SESSION_REQUEST_FAILED",
    "Trusted authentication session could not be verified."
  );
}
