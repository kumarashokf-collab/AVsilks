import {
  getApiBaseUrl,
} from "./api.js";

export const PRODUCT_API_ERROR =
  Object.freeze({
    AUTHENTICATION_REQUIRED:
      "AUTHENTICATION_REQUIRED",
    INVALID_INPUT:
      "INVALID_INPUT",
    INVALID_PRODUCT_ID:
      "INVALID_PRODUCT_ID",
    INVALID_RESPONSE:
      "INVALID_RESPONSE",
    REQUEST_FAILED:
      "REQUEST_FAILED",
  });

const ALLOWED_CREATE_FIELDS =
  Object.freeze(
    new Set([
      "name",
      "description",
      "price",
      "originalPrice",
      "category",
      "stock",
      "sku",
      "offer",
      "image",
      "images",
      "featured",
      "active",
    ])
  );

function createProductApiError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function validateAuthenticatedUser(
  user
) {
  const uid =
    normalizeText(user?.uid);

  if (
    !uid ||
    typeof user?.getIdToken !==
      "function"
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
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
    Object.prototype
      .hasOwnProperty.call(
        dependencies,
        "fetchImpl"
      )
      ? dependencies.fetchImpl
      : globalThis.fetch;

  const getApiBaseUrlFn =
    Object.prototype
      .hasOwnProperty.call(
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
      "Product fetch dependency must be a function."
    );
  }

  if (
    typeof getApiBaseUrlFn !==
      "function"
  ) {
    throw new TypeError(
      "Product API base URL dependency must be a function."
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
  const baseUrl =
    String(
      getApiBaseUrlFn()
    )
      .trim()
      .replace(/\/+$/, "");

  if (!baseUrl) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product API configuration is invalid."
    );
  }

  return baseUrl;
}

function normalizeHttpsUrl(
  value
) {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return "";
  }

  try {
    const parsed =
      new URL(normalized);

    if (
      parsed.protocol !==
        "https:" ||
      !parsed.hostname
    ) {
      return "";
    }

    return normalized;
  } catch {
    return "";
  }
}

function normalizeCreatePayload(
  payload
) {
  if (
    !payload ||
    typeof payload !==
      "object" ||
    Array.isArray(payload)
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  const hasUnknownField =
    Object.keys(payload)
      .some(
        (key) =>
          !ALLOWED_CREATE_FIELDS
            .has(key)
      );

  if (hasUnknownField) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  const name =
    normalizeText(payload.name);

  const description =
    normalizeText(
      payload.description
    );

  const category =
    normalizeText(
      payload.category
    );

  const sku =
    normalizeText(
      payload.sku
    ).toUpperCase();

  const offer =
    normalizeText(
      payload.offer
    );

  const price =
    Number(payload.price);

  const originalPrice =
    payload.originalPrice ===
      undefined
      ? price
      : Number(
          payload.originalPrice
        );

  const stock =
    Number(payload.stock);

  const imageInput =
    normalizeText(
      payload.image
    );

  const image =
    imageInput
      ? normalizeHttpsUrl(
          imageInput
        )
      : "";

  if (
    imageInput &&
    !image
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  if (
    payload.images !==
      undefined &&
    !Array.isArray(
      payload.images
    )
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  const images = [];

  for (
    const value of
      payload.images || []
  ) {
    const original =
      normalizeText(value);

    const normalized =
      normalizeHttpsUrl(
        original
      );

    if (
      !original ||
      !normalized ||
      images.includes(
        normalized
      )
    ) {
      throw createProductApiError(
        PRODUCT_API_ERROR
          .INVALID_INPUT,
        "Product input is invalid."
      );
    }

    images.push(
      normalized
    );
  }

  if (
    !name ||
    name.length > 160 ||
    description.length > 3000 ||
    !category ||
    category.length > 100 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 10000000 ||
    !Number.isFinite(
      originalPrice
    ) ||
    originalPrice < price ||
    originalPrice >
      10000000 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    stock > 1000000 ||
    !sku ||
    sku.length > 64 ||
    !/^[A-Z0-9][A-Z0-9_-]*$/
      .test(sku) ||
    offer.length > 64 ||
    images.length > 5
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  const normalized =
    {
      name,
      description,
      price,
      originalPrice,
      category,
      stock,
      sku,
      offer,
      image,
      images:
        Object.freeze(
          [...images]
        ),
      featured:
        payload.featured === true,
      active:
        payload.active ===
          undefined
          ? true
          : payload.active === true,
    };

  if (
    payload.featured !==
      undefined &&
    typeof payload.featured !==
      "boolean"
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  if (
    payload.active !==
      undefined &&
    typeof payload.active !==
      "boolean"
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_INPUT,
      "Product input is invalid."
    );
  }

  return Object.freeze(
    normalized
  );
}

function normalizeProductId(
  value
) {
  const productId =
    normalizeText(value);

  if (
    !productId ||
    productId.includes("/") ||
    productId.length > 128
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_PRODUCT_ID,
      "Product identifier is invalid."
    );
  }

  return productId;
}

async function getTrustedToken(
  user
) {
  let idToken;

  try {
    idToken =
      await user.getIdToken();
  } catch {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .AUTHENTICATION_REQUIRED,
      "Authentication is required."
    );
  }

  if (
    typeof idToken !==
      "string" ||
    !idToken.trim()
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .AUTHENTICATION_REQUIRED,
      "Authentication is required."
    );
  }

  return idToken.trim();
}

async function readResponseBody(
  response
) {
  if (
    !response ||
    typeof response.json !==
      "function"
  ) {
    return null;
  }

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
  const code =
    typeof body?.code ===
      "string" &&
    body.code.trim()
      ? body.code.trim()
      : PRODUCT_API_ERROR
          .REQUEST_FAILED;

  const message =
    typeof body?.message ===
      "string" &&
    body.message.trim()
      ? body.message.trim()
      : fallbackMessage;

  throw createProductApiError(
    code,
    message
  );
}

function sanitizeCreatedProduct(
  source
) {
  const id =
    normalizeProductId(
      source?.id
    );

  return Object.freeze({
    id,
  });
}

function sanitizeDeactivatedProduct(
  source
) {
  const id =
    normalizeProductId(
      source?.id
    );

  if (
    source?.active !== false
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_RESPONSE,
      "Product response is invalid."
    );
  }

  return Object.freeze({
    id,
    active: false,
  });
}

export async function createProduct(
  payload,
  user,
  dependencies = {}
) {
  const trustedUser =
    validateAuthenticatedUser(
      user
    );

  const normalizedPayload =
    normalizeCreatePayload(
      payload
    );

  const {
    fetchImpl,
    getApiBaseUrlFn,
  } = resolveDependencies(
    dependencies
  );

  const idToken =
    await getTrustedToken(
      trustedUser
    );

  const apiBaseUrl =
    getNormalizedApiBaseUrl(
      getApiBaseUrlFn
    );

  let response;

  try {
    response =
      await fetchImpl(
        `${apiBaseUrl}/products`,
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
    throw createProductApiError(
      PRODUCT_API_ERROR
        .REQUEST_FAILED,
      "Product request failed."
    );
  }

  const body =
    await readResponseBody(
      response
    );

  if (
    !response?.ok ||
    body?.success !== true
  ) {
    throwBackendError(
      body,
      "Product creation failed."
    );
  }

  try {
    return sanitizeCreatedProduct(
      body?.data
    );
  } catch (error) {
    if (
      error?.code ===
      PRODUCT_API_ERROR
        .INVALID_PRODUCT_ID
    ) {
      throw createProductApiError(
        PRODUCT_API_ERROR
          .INVALID_RESPONSE,
        "Product response is invalid."
      );
    }

    throw error;
  }
}

export async function deactivateProduct(
  productId,
  user,
  dependencies = {}
) {
  const trustedUser =
    validateAuthenticatedUser(
      user
    );

  const normalizedProductId =
    normalizeProductId(
      productId
    );

  const {
    fetchImpl,
    getApiBaseUrlFn,
  } = resolveDependencies(
    dependencies
  );

  const idToken =
    await getTrustedToken(
      trustedUser
    );

  const apiBaseUrl =
    getNormalizedApiBaseUrl(
      getApiBaseUrlFn
    );

  let response;

  try {
    response =
      await fetchImpl(
        `${apiBaseUrl}/products/${encodeURIComponent(
          normalizedProductId
        )}`,
        {
          method: "DELETE",
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${idToken}`,
          },
        }
      );
  } catch {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .REQUEST_FAILED,
      "Product request failed."
    );
  }

  const body =
    await readResponseBody(
      response
    );

  if (
    !response?.ok ||
    body?.success !== true
  ) {
    throwBackendError(
      body,
      "Product deactivation failed."
    );
  }

  let result;

  try {
    result =
      sanitizeDeactivatedProduct(
        body?.data
      );
  } catch (error) {
    if (
      error?.code ===
        PRODUCT_API_ERROR
          .INVALID_PRODUCT_ID ||
      error?.code ===
        PRODUCT_API_ERROR
          .INVALID_RESPONSE
    ) {
      throw createProductApiError(
        PRODUCT_API_ERROR
          .INVALID_RESPONSE,
        "Product response is invalid."
      );
    }

    throw error;
  }

  if (
    result.id !==
      normalizedProductId
  ) {
    throw createProductApiError(
      PRODUCT_API_ERROR
        .INVALID_RESPONSE,
      "Product response is invalid."
    );
  }

  return result;
}
