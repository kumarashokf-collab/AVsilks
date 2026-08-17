import {
  getApiBaseUrl,
} from "./api.js";

export const PROVENANCE_CREATE_ERROR =
  Object.freeze({
    AUTHENTICATION_REQUIRED:
      "AUTHENTICATION_REQUIRED",

    INVALID_INPUT:
      "INVALID_INPUT",

    INVALID_RESPONSE:
      "INVALID_RESPONSE",

    REQUEST_FAILED:
      "REQUEST_FAILED",
  });

function createProvenanceError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

function normalizeText(
  value
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeDocumentId(
  value
) {
  const normalized =
    normalizeText(value);

  if (
    !normalized ||
    normalized.includes("/") ||
    normalized.length > 128
  ) {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
        .INVALID_INPUT,
      "Provenance input is invalid."
    );
  }

  return normalized;
}

function requireCraftText(
  value
) {
  const normalized =
    normalizeText(value);

  if (
    normalized.length < 2
  ) {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
        .INVALID_INPUT,
      "Provenance input is invalid."
    );
  }

  return normalized;
}

function normalizePayload(
  payload
) {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !payload.origin ||
    typeof payload.origin !== "object" ||
    Array.isArray(payload.origin)
  ) {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
        .INVALID_INPUT,
      "Provenance input is invalid."
    );
  }

  const allowedTopLevel =
    new Set([
      "productId",
      "artisanId",
      "material",
      "weaveTechnique",
      "loomType",
      "origin",
    ]);

  const allowedOrigin =
    new Set([
      "village",
      "district",
      "state",
      "country",
    ]);

  if (
    Object.keys(payload).some(
      (key) =>
        !allowedTopLevel.has(key)
    ) ||
    Object.keys(payload.origin).some(
      (key) =>
        !allowedOrigin.has(key)
    )
  ) {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
        .INVALID_INPUT,
      "Provenance input is invalid."
    );
  }

  return Object.freeze({
    productId:
      normalizeDocumentId(
        payload.productId
      ),

    artisanId:
      normalizeDocumentId(
        payload.artisanId
      ),

    material:
      requireCraftText(
        payload.material
      ),

    weaveTechnique:
      requireCraftText(
        payload.weaveTechnique
      ),

    loomType:
      requireCraftText(
        payload.loomType
      ),

    origin:
      Object.freeze({
        village:
          requireCraftText(
            payload.origin.village
          ),

        district:
          requireCraftText(
            payload.origin.district
          ),

        state:
          requireCraftText(
            payload.origin.state
          ),

        country:
          requireCraftText(
            payload.origin.country
          ),
      }),
  });
}

function validateAuthenticatedUser(
  user
) {
  const uid =
    normalizeText(
      user?.uid
    );

  if (
    !uid ||
    typeof user?.getIdToken !==
      "function"
  ) {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
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
      "Provenance create fetch dependency must be a function."
    );
  }

  if (
    typeof getApiBaseUrlFn !==
    "function"
  ) {
    throw new TypeError(
      "Provenance create API base URL dependency must be a function."
    );
  }

  return {
    fetchImpl,
    getApiBaseUrlFn,
  };
}

async function readResponseBody(
  response
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function validateCreatedResponse(
  body
) {
  const id =
    normalizeText(
      body?.data?.id
    );

  const publicId =
    normalizeText(
      body?.data?.publicId
    );

  if (
    body?.success !== true ||
    body?.created !== true ||
    !id ||
    id.includes("/") ||
    id.length > 128 ||
    !publicId ||
    publicId.includes("/") ||
    publicId.length > 128 ||
    body?.data?.status !==
      "draft"
  ) {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
        .INVALID_RESPONSE,
      "Provenance create response is invalid."
    );
  }

  return Object.freeze({
    id,
    publicId,
    status:
      "draft",
  });
}

export async function createProvenance(
  payload,
  user,
  dependencies = {}
) {
  const normalizedPayload =
    normalizePayload(
      payload
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
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
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
        `${apiBaseUrl}/provenance`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken.trim()}`,
          },

          body:
            JSON.stringify(
              normalizedPayload
            ),
        }
      );
  } catch {
    throw createProvenanceError(
      PROVENANCE_CREATE_ERROR
        .REQUEST_FAILED,
      "Unable to create provenance."
    );
  }

  const body =
    await readResponseBody(
      response
    );

  if (!response.ok) {
    const error =
      createProvenanceError(
        typeof body?.code === "string" &&
        body.code.trim()
          ? body.code.trim()
          : PROVENANCE_CREATE_ERROR
              .REQUEST_FAILED,

        typeof body?.message === "string" &&
        body.message.trim()
          ? body.message.trim()
          : "Unable to create provenance."
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

  return validateCreatedResponse(
    body
  );
}
