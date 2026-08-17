import {
  getApiBaseUrl,
} from "./api.js";

export const PUBLIC_PROVENANCE_ERROR =
  Object.freeze({
    INVALID_PUBLIC_ID:
      "INVALID_PUBLIC_ID",

    NOT_FOUND:
      "NOT_FOUND",

    INVALID_RESPONSE:
      "INVALID_RESPONSE",

    REQUEST_FAILED:
      "REQUEST_FAILED",
  });

function createPublicProvenanceError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

function normalizePublicId(
  publicId
) {
  const normalized =
    typeof publicId === "string"
      ? publicId.trim()
      : "";

  if (
    !normalized ||
    normalized.includes("/") ||
    normalized.length > 128
  ) {
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .INVALID_PUBLIC_ID,
      "Valid public provenance ID is required."
    );
  }

  return normalized;
}

function isString(
  value
) {
  return typeof value === "string";
}

function sanitizeVerifiedData(
  data,
  expectedPublicId
) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    data.publicId !==
      expectedPublicId ||
    !data.product ||
    typeof data.product !== "object" ||
    Array.isArray(data.product) ||
    !data.artisan ||
    typeof data.artisan !== "object" ||
    Array.isArray(data.artisan) ||
    !data.origin ||
    typeof data.origin !== "object" ||
    Array.isArray(data.origin)
  ) {
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .INVALID_RESPONSE,
      "Public provenance response is invalid."
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
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .INVALID_RESPONSE,
      "Public provenance response is invalid."
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
    publicId:
      expectedPublicId,

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

export async function fetchPublicProvenance(
  publicId,
  dependencies = {}
) {
  const normalizedPublicId =
    normalizePublicId(
      publicId
    );

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
      "Public provenance fetch dependency must be a function."
    );
  }

  if (
    typeof getApiBaseUrlFn !==
      "function"
  ) {
    throw new TypeError(
      "Public provenance API base URL dependency must be a function."
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
        `${apiBaseUrl}/provenance/public/${encodeURIComponent(
          normalizedPublicId
        )}`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },
        }
      );
  } catch {
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .REQUEST_FAILED,
      "Provenance verification request failed."
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
    response.status === 404
  ) {
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .NOT_FOUND,
      "Provenance verification was not found."
    );
  }

  if (
    !response.ok
  ) {
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .REQUEST_FAILED,
      "Provenance verification request failed."
    );
  }

  if (
    body?.success !== true ||
    body?.verified !== true
  ) {
    throw createPublicProvenanceError(
      PUBLIC_PROVENANCE_ERROR
        .INVALID_RESPONSE,
      "Public provenance response is invalid."
    );
  }

  return sanitizeVerifiedData(
    body.data,
    normalizedPublicId
  );
}
