import {
  getApiBaseUrl,
} from "./api.js";

export const PROVENANCE_LIFECYCLE_ERROR =
  Object.freeze({
    AUTHENTICATION_REQUIRED:
      "AUTHENTICATION_REQUIRED",

    INVALID_PROVENANCE_ID:
      "INVALID_PROVENANCE_ID",

    INVALID_RESPONSE:
      "INVALID_RESPONSE",

    REQUEST_FAILED:
      "REQUEST_FAILED",
  });

function createLifecycleError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

function normalizeProvenanceId(
  id
) {
  const normalized =
    typeof id === "string"
      ? id.trim()
      : "";

  if (
    !normalized ||
    normalized.includes("/") ||
    normalized.length > 128
  ) {
    throw createLifecycleError(
      PROVENANCE_LIFECYCLE_ERROR
        .INVALID_PROVENANCE_ID,
      "Valid provenance ID is required."
    );
  }

  return normalized;
}

function validateAuthenticatedUser(
  user
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
    throw createLifecycleError(
      PROVENANCE_LIFECYCLE_ERROR
        .AUTHENTICATION_REQUIRED,
      "Authentication is required."
    );
  }

  return user;
}

function resolveDependencies(
  dependencies = {}
) {
  const fetchImpl =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      "fetchImpl"
    )
      ? dependencies.fetchImpl
      : globalThis.fetch;

  const getApiBaseUrlFn =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      "getApiBaseUrlFn"
    )
      ? dependencies.getApiBaseUrlFn
      : getApiBaseUrl;

  if (
    typeof fetchImpl !==
    "function"
  ) {
    throw new TypeError(
      "Provenance lifecycle fetch dependency must be a function."
    );
  }

  if (
    typeof getApiBaseUrlFn !==
    "function"
  ) {
    throw new TypeError(
      "Provenance lifecycle API base URL dependency must be a function."
    );
  }

  return {
    fetchImpl,
    getApiBaseUrlFn,
  };
}

function validateLifecycleSuccess(
  body,
  expectedId,
  expectedStatus
) {
  if (
    body?.success !== true ||
    !body.data ||
    typeof body.data !== "object" ||
    Array.isArray(body.data) ||
    body.data.id !== expectedId ||
    body.data.status !==
      expectedStatus
  ) {
    throw createLifecycleError(
      PROVENANCE_LIFECYCLE_ERROR
        .INVALID_RESPONSE,
      "Provenance lifecycle response is invalid."
    );
  }

  return Object.freeze({
    id:
      expectedId,

    status:
      expectedStatus,
  });
}

async function transitionProvenance(
  {
    id,
    action,
    expectedStatus,
    user,
  },
  dependencies = {}
) {
  const provenanceId =
    normalizeProvenanceId(
      id
    );

  const authenticatedUser =
    validateAuthenticatedUser(
      user
    );

  const {
    fetchImpl,
    getApiBaseUrlFn,
  } =
    resolveDependencies(
      dependencies
    );

  const idToken =
    await authenticatedUser
      .getIdToken();

  if (
    typeof idToken !== "string" ||
    !idToken.trim()
  ) {
    throw createLifecycleError(
      PROVENANCE_LIFECYCLE_ERROR
        .AUTHENTICATION_REQUIRED,
      "Authentication is required."
    );
  }

  const apiBaseUrl =
    String(
      getApiBaseUrlFn()
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  let response;

  try {
    response =
      await fetchImpl(
        `${apiBaseUrl}/provenance/${encodeURIComponent(
          provenanceId
        )}/${action}`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${idToken.trim()}`,
          },
        }
      );
  } catch {
    throw createLifecycleError(
      PROVENANCE_LIFECYCLE_ERROR
        .REQUEST_FAILED,
      "Provenance lifecycle request failed."
    );
  }

  let body = null;

  try {
    body =
      await response.json();
  } catch {
    body = null;
  }

  if (
    !response.ok
  ) {
    const error =
      createLifecycleError(
        typeof body?.code === "string" &&
        body.code.trim()
          ? body.code.trim()
          : PROVENANCE_LIFECYCLE_ERROR
              .REQUEST_FAILED,

        typeof body?.message === "string" &&
        body.message.trim()
          ? body.message.trim()
          : "Provenance lifecycle request failed."
      );

    if (
      Array.isArray(
        body?.details
      )
    ) {
      error.details =
        body.details;
    }

    throw error;
  }

  return validateLifecycleSuccess(
    body,
    provenanceId,
    expectedStatus
  );
}

export async function publishProvenance(
  id,
  user,
  dependencies = {}
) {
  return transitionProvenance(
    {
      id,
      action:
        "publish",
      expectedStatus:
        "published",
      user,
    },
    dependencies
  );
}

export async function archiveProvenance(
  id,
  user,
  dependencies = {}
) {
  return transitionProvenance(
    {
      id,
      action:
        "archive",
      expectedStatus:
        "archived",
      user,
    },
    dependencies
  );
}
