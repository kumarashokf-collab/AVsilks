import QRCode from "qrcode";

export const PROVENANCE_QR_ERROR =
  Object.freeze({
    INVALID_PUBLIC_ID:
      "INVALID_PUBLIC_ID",

    INVALID_ORIGIN:
      "INVALID_ORIGIN",

    INVALID_QR_OUTPUT:
      "INVALID_QR_OUTPUT",

    QR_GENERATION_FAILED:
      "QR_GENERATION_FAILED",
  });

function createQrError(
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
    throw createQrError(
      PROVENANCE_QR_ERROR
        .INVALID_PUBLIC_ID,
      "Valid public provenance ID is required."
    );
  }

  return normalized;
}

function normalizeOrigin(
  origin
) {
  const value =
    typeof origin === "string"
      ? origin.trim()
      : "";

  if (!value) {
    throw createQrError(
      PROVENANCE_QR_ERROR
        .INVALID_ORIGIN,
      "Valid application origin is required."
    );
  }

  let parsed;

  try {
    parsed =
      new URL(value);
  } catch {
    throw createQrError(
      PROVENANCE_QR_ERROR
        .INVALID_ORIGIN,
      "Valid application origin is required."
    );
  }

  if (
    !["http:", "https:"].includes(
      parsed.protocol
    ) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw createQrError(
      PROVENANCE_QR_ERROR
        .INVALID_ORIGIN,
      "Valid application origin is required."
    );
  }

  return parsed.origin;
}

export function buildPublicProvenanceUrl(
  publicId,
  origin
) {
  const normalizedPublicId =
    normalizePublicId(
      publicId
    );

  const normalizedOrigin =
    normalizeOrigin(
      origin
    );

  return (
    normalizedOrigin +
    "/provenance/" +
    encodeURIComponent(
      normalizedPublicId
    )
  );
}

function resolveQrDependencies(
  dependencies = {}
) {
  const origin =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      "origin"
    )
      ? dependencies.origin
      : globalThis.location?.origin;

  const toDataURL =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      "toDataURL"
    )
      ? dependencies.toDataURL
      : QRCode?.toDataURL;

  if (
    typeof toDataURL !== "function"
  ) {
    throw new TypeError(
      "QR generator dependency must be a function."
    );
  }

  return {
    origin,
    toDataURL,
  };
}

export async function generatePublicProvenanceQrDataUrl(
  publicId,
  dependencies = {}
) {
  const {
    origin,
    toDataURL,
  } =
    resolveQrDependencies(
      dependencies
    );

  const verificationUrl =
    buildPublicProvenanceUrl(
      publicId,
      origin
    );

  let qrDataUrl;

  try {
    qrDataUrl =
      await toDataURL(
        verificationUrl,
        {
          errorCorrectionLevel:
            "M",

          margin:
            2,

          width:
            512,

          type:
            "image/png",
        }
      );
  } catch {
    throw createQrError(
      PROVENANCE_QR_ERROR
        .QR_GENERATION_FAILED,
      "QR code generation failed."
    );
  }

  if (
    typeof qrDataUrl !== "string" ||
    !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(
      qrDataUrl
    )
  ) {
    throw createQrError(
      PROVENANCE_QR_ERROR
        .INVALID_QR_OUTPUT,
      "QR generator returned invalid PNG data."
    );
  }

  return qrDataUrl;
}
