import {
  buildPublicProvenanceUrl,
} from "./provenanceQr.js";

export const PROVENANCE_PRINT_ERROR =
  Object.freeze({
    NOT_PUBLISHED:
      "NOT_PUBLISHED",

    INVALID_QR:
      "INVALID_QR",

    INVALID_DATA:
      "INVALID_DATA",
  });

function createPrintError(
  code,
  message
) {
  const error =
    new Error(message);

  error.code = code;

  return error;
}

function requireText(
  value
) {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!normalized) {
    throw createPrintError(
      PROVENANCE_PRINT_ERROR
        .INVALID_DATA,
      "Printable provenance data is invalid."
    );
  }

  return normalized;
}

function validateQrDataUrl(
  qrDataUrl
) {
  if (
    typeof qrDataUrl !== "string" ||
    !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(
      qrDataUrl
    )
  ) {
    throw createPrintError(
      PROVENANCE_PRINT_ERROR
        .INVALID_QR,
      "Printable provenance QR is invalid."
    );
  }

  return qrDataUrl;
}

export function buildPrintableProvenanceTagModel({
  brandName,
  provenance,
  qrDataUrl,
  origin,
}) {
  if (
    !provenance ||
    typeof provenance !== "object"
  ) {
    throw createPrintError(
      PROVENANCE_PRINT_ERROR
        .INVALID_DATA,
      "Printable provenance data is invalid."
    );
  }

  if (
    provenance.status !==
    "published"
  ) {
    throw createPrintError(
      PROVENANCE_PRINT_ERROR
        .NOT_PUBLISHED,
      "Only published provenance can be printed."
    );
  }

  const safeBrandName =
    requireText(
      brandName
    );

  const safeQrDataUrl =
    validateQrDataUrl(
      qrDataUrl
    );

  const publicId =
    requireText(
      provenance.publicId
    );

  let verificationUrl;

  try {
    verificationUrl =
      buildPublicProvenanceUrl(
        publicId,
        origin
      );
  } catch {
    throw createPrintError(
      PROVENANCE_PRINT_ERROR
        .INVALID_DATA,
      "Printable provenance data is invalid."
    );
  }

  const product =
    Object.freeze({
      sku:
        requireText(
          provenance.product?.sku
        ),

      name:
        requireText(
          provenance.product?.name
        ),
    });

  const artisan =
    Object.freeze({
      code:
        requireText(
          provenance.artisan?.code
        ),

      name:
        requireText(
          provenance.artisan?.name
        ),
    });

  const safeOrigin =
    Object.freeze({
      village:
        requireText(
          provenance.origin?.village
        ),

      district:
        requireText(
          provenance.origin?.district
        ),

      state:
        requireText(
          provenance.origin?.state
        ),

      country:
        requireText(
          provenance.origin?.country
        ),
    });

  return Object.freeze({
    brandName:
      safeBrandName,

    publicId,

    verificationUrl,

    qrDataUrl:
      safeQrDataUrl,

    product,

    artisan,

    material:
      requireText(
        provenance.material
      ),

    weaveTechnique:
      requireText(
        provenance.weaveTechnique
      ),

    loomType:
      requireText(
        provenance.loomType
      ),

    origin:
      safeOrigin,
  });
}
