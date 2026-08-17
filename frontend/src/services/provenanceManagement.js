import {
  getApiBaseUrl,
} from "./api.js";

export const PROVENANCE_MANAGEMENT_ERROR =
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

function createManagementError(
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
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
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
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
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
      "Provenance management fetch dependency must be a function."
    );
  }

  if (
    typeof getApiBaseUrlFn !==
    "function"
  ) {
    throw new TypeError(
      "Provenance management API base URL dependency must be a function."
    );
  }

  return {
    fetchImpl,
    getApiBaseUrlFn,
  };
}

function isPlainObject(
  value
) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isString(
  value
) {
  return typeof value === "string";
}

function sanitizeManagedProvenance(
  data,
  expectedId
) {
  const validStatuses =
    new Set([
      "draft",
      "published",
      "archived",
    ]);

  if (
    !isPlainObject(data) ||
    data.id !== expectedId ||
    !isString(data.publicId) ||
    !data.publicId.trim() ||
    !validStatuses.has(
      data.status
    ) ||
    !isPlainObject(
      data.product
    ) ||
    !isPlainObject(
      data.artisan
    ) ||
    !isPlainObject(
      data.origin
    )
  ) {
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
        .INVALID_RESPONSE,
      "Provenance management response is invalid."
    );
  }

  const requiredStrings = [
    data.product.sku,
    data.product.name,
    data.artisan.code,
    data.artisan.name,
    data.material,
    data.weaveTechnique,
    data.loomType,
    data.origin.village,
    data.origin.district,
    data.origin.state,
    data.origin.country,
  ];

  if (
    requiredStrings.some(
      (value) =>
        !isString(value)
    )
  ) {
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
        .INVALID_RESPONSE,
      "Provenance management response is invalid."
    );
  }

  const product =
    Object.freeze({
      sku:
        data.product.sku,

      name:
        data.product.name,
    });

  const artisan =
    Object.freeze({
      code:
        data.artisan.code,

      name:
        data.artisan.name,
    });

  const origin =
    Object.freeze({
      village:
        data.origin.village,

      district:
        data.origin.district,

      state:
        data.origin.state,

      country:
        data.origin.country,
    });

  return Object.freeze({
    id:
      expectedId,

    publicId:
      data.publicId.trim(),

    status:
      data.status,

    product,
    artisan,

    material:
      data.material,

    weaveTechnique:
      data.weaveTechnique,

    loomType:
      data.loomType,

    origin,
  });
}

export async function fetchManagedProvenance(
  id,
  user,
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
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
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
        )}`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${idToken.trim()}`,
          },
        }
      );
  } catch {
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
        .REQUEST_FAILED,
      "Provenance management request failed."
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
      createManagementError(
        typeof body?.code === "string" &&
        body.code.trim()
          ? body.code.trim()
          : PROVENANCE_MANAGEMENT_ERROR
              .REQUEST_FAILED,

        typeof body?.message === "string" &&
        body.message.trim()
          ? body.message.trim()
          : "Provenance management request failed."
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

  if (
    body?.success !== true
  ) {
    throw createManagementError(
      PROVENANCE_MANAGEMENT_ERROR
        .INVALID_RESPONSE,
      "Provenance management response is invalid."
    );
  }

  return sanitizeManagedProvenance(
    body.data,
    provenanceId
  );
}
