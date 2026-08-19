import {
  getApiBaseUrl,
} from "./api.js";

export const ARTISAN_API_ERROR =
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

function createArtisanApiError(
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
    throw createArtisanApiError(
      ARTISAN_API_ERROR
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
      "Artisan fetch dependency must be a function."
    );
  }

  if (
    typeof getApiBaseUrlFn !==
    "function"
  ) {
    throw new TypeError(
      "Artisan API base URL dependency must be a function."
    );
  }

  return {
    fetchImpl,
    getApiBaseUrlFn,
  };
}

function getNormalizedApiBaseUrl(
  getApiBaseUrlFn
) {
  return String(
    getApiBaseUrlFn()
  )
    .trim()
    .replace(
      /\/+$/,
      ""
    );
}

function sanitizeArtisan(
  source
) {
  if (
    !source ||
    typeof source !== "object" ||
    Array.isArray(source)
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_RESPONSE,
      "Artisan response is invalid."
    );
  }

  const artisan = {
    id:
      normalizeText(
        source.id
      ),

    artisanCode:
      normalizeText(
        source.artisanCode
      ),

    displayName:
      normalizeText(
        source.displayName
      ),

    craftType:
      normalizeText(
        source.craftType
      ),

    village:
      normalizeText(
        source.village
      ),

    district:
      normalizeText(
        source.district
      ),

    state:
      normalizeText(
        source.state
      ),

    country:
      normalizeText(
        source.country
      ),

    loomType:
      normalizeText(
        source.loomType
      ),

    active:
      source.active === true,
  };

  if (
    !artisan.id ||
    artisan.id.includes("/") ||
    !artisan.artisanCode ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
      artisan.artisanCode
    ) ||
    !artisan.displayName ||
    !artisan.craftType ||
    !artisan.village ||
    !artisan.district ||
    !artisan.state ||
    !artisan.country ||
    !artisan.loomType ||
    artisan.active !== true
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_RESPONSE,
      "Artisan response is invalid."
    );
  }

  return Object.freeze(
    artisan
  );
}

function normalizeCreatePayload(
  payload
) {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_INPUT,
      "Artisan input is invalid."
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "active"
    ) &&
    payload.active !== true
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_INPUT,
      "Artisan input is invalid."
    );
  }

  const normalized = {
    artisanCode:
      normalizeText(
        payload.artisanCode
      ),

    displayName:
      normalizeText(
        payload.displayName
      ),

    craftType:
      normalizeText(
        payload.craftType
      ),

    village:
      normalizeText(
        payload.village
      ),

    district:
      normalizeText(
        payload.district
      ),

    state:
      normalizeText(
        payload.state
      ),

    country:
      normalizeText(
        payload.country
      ),

    loomType:
      normalizeText(
        payload.loomType
      ),

    active:
      true,
  };

  if (
    !normalized.artisanCode ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
      normalized.artisanCode
    ) ||
    normalized.displayName.length < 2 ||
    normalized.craftType.length < 2 ||
    normalized.village.length < 2 ||
    normalized.district.length < 2 ||
    normalized.state.length < 2 ||
    normalized.country.length < 2 ||
    normalized.loomType.length < 2
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_INPUT,
      "Artisan input is invalid."
    );
  }

  return Object.freeze(
    normalized
  );
}

async function getTrustedToken(
  user
) {
  const idToken =
    await user.getIdToken();

  if (
    typeof idToken !== "string" ||
    !idToken.trim()
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .AUTHENTICATION_REQUIRED,
      "Authentication is required."
    );
  }

  return idToken.trim();
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

function throwBackendError(
  body,
  fallbackMessage
) {
  const error =
    createArtisanApiError(
      typeof body?.code === "string" &&
      body.code.trim()
        ? body.code.trim()
        : ARTISAN_API_ERROR
            .REQUEST_FAILED,

      typeof body?.message === "string" &&
      body.message.trim()
        ? body.message.trim()
        : fallbackMessage
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

export async function fetchActiveArtisans(
  user,
  dependencies = {}
) {
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
    await getTrustedToken(
      authenticatedUser
    );

  const apiBaseUrl =
    getNormalizedApiBaseUrl(
      getApiBaseUrlFn
    );

  let response;

  try {
    response =
      await fetchImpl(
        `${apiBaseUrl}/artisans`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${idToken}`,
          },
        }
      );
  } catch {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .REQUEST_FAILED,
      "Unable to load artisans."
    );
  }

  const body =
    await readResponseBody(
      response
    );

  if (!response.ok) {
    throwBackendError(
      body,
      "Unable to load artisans."
    );
  }

  if (
    body?.success !== true ||
    !Array.isArray(
      body.data
    )
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_RESPONSE,
      "Artisan list response is invalid."
    );
  }

  const artisans =
    body.data.map(
      sanitizeArtisan
    );

  return Object.freeze(
    artisans
  );
}

export async function createArtisan(
  payload,
  user,
  dependencies = {}
) {
  const normalizedPayload =
    normalizeCreatePayload(
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
    await getTrustedToken(
      authenticatedUser
    );

  const apiBaseUrl =
    getNormalizedApiBaseUrl(
      getApiBaseUrlFn
    );

  let response;

  try {
    response =
      await fetchImpl(
        `${apiBaseUrl}/artisans`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${idToken}`,
          },

          body:
            JSON.stringify(
              normalizedPayload
            ),
        }
      );
  } catch {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .REQUEST_FAILED,
      "Unable to create artisan."
    );
  }

  const body =
    await readResponseBody(
      response
    );

  if (!response.ok) {
    throwBackendError(
      body,
      "Unable to create artisan."
    );
  }

  if (
    body?.success !== true ||
    body?.created !== true
  ) {
    throw createArtisanApiError(
      ARTISAN_API_ERROR
        .INVALID_RESPONSE,
      "Artisan create response is invalid."
    );
  }

  return sanitizeArtisan(
    body.data
  );
}
