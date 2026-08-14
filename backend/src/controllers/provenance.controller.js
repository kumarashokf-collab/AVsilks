'use strict';

const {
  createSecureProvenance,
} = require(
  '../services/provenance.service'
);

function sanitizeValidationDetails(details) {
  return Array.isArray(details)
    ? details.map((detail) => ({
        path:
          typeof detail?.path === 'string'
            ? detail.path
            : '',

        type:
          typeof detail?.type === 'string'
            ? detail.type
            : '',

        message:
          typeof detail?.message === 'string'
            ? detail.message
            : '',
      }))
    : [];
}

function sanitizeOrigin(origin) {
  const source =
    origin &&
    typeof origin === 'object' &&
    !Array.isArray(origin)
      ? origin
      : {};

  return Object.freeze({
    village:
      typeof source.village === 'string'
        ? source.village
        : '',

    district:
      typeof source.district === 'string'
        ? source.district
        : '',

    state:
      typeof source.state === 'string'
        ? source.state
        : '',

    country:
      typeof source.country === 'string'
        ? source.country
        : '',
  });
}

function sanitizeProvenanceResponse(
  provenance,
  provenanceId
) {
  const source =
    provenance &&
    typeof provenance === 'object' &&
    !Array.isArray(provenance)
      ? provenance
      : {};

  return Object.freeze({
    id:
      typeof provenanceId === 'string'
        ? provenanceId
        : '',

    publicId:
      typeof source.publicId === 'string'
        ? source.publicId
        : '',

    productId:
      typeof source.productId === 'string'
        ? source.productId
        : '',

    artisanId:
      typeof source.artisanId === 'string'
        ? source.artisanId
        : '',

    skuSnapshot:
      typeof source.skuSnapshot === 'string'
        ? source.skuSnapshot
        : '',

    productNameSnapshot:
      typeof source.productNameSnapshot ===
        'string'
        ? source.productNameSnapshot
        : '',

    artisanCodeSnapshot:
      typeof source.artisanCodeSnapshot ===
        'string'
        ? source.artisanCodeSnapshot
        : '',

    artisanNameSnapshot:
      typeof source.artisanNameSnapshot ===
        'string'
        ? source.artisanNameSnapshot
        : '',

    material:
      typeof source.material === 'string'
        ? source.material
        : '',

    weaveTechnique:
      typeof source.weaveTechnique ===
        'string'
        ? source.weaveTechnique
        : '',

    loomType:
      typeof source.loomType === 'string'
        ? source.loomType
        : '',

    origin:
      sanitizeOrigin(source.origin),

    status:
      typeof source.status === 'string'
        ? source.status
        : '',

    schemaVersion:
      Number.isInteger(
        source.schemaVersion
      )
        ? source.schemaVersion
        : 0,
  });
}

function mapProvenanceError(error) {
  switch (error?.code) {
    case 'AUTHENTICATION_REQUIRED':
      return {
        status: 401,
        code:
          'AUTHENTICATION_REQUIRED',
        message:
          'Authentication is required.',
      };

    case 'VALIDATION_FAILED':
    case 'INVALID_INPUT':
      return {
        status: 400,
        code:
          'PROVENANCE_VALIDATION_FAILED',
        message:
          'Provenance request is invalid.',
        details:
          sanitizeValidationDetails(
            error?.details
          ),
      };

    case 'PRODUCT_NOT_FOUND':
      return {
        status: 404,
        code:
          'PRODUCT_NOT_FOUND',
        message:
          'Product was not found.',
      };

    case 'ARTISAN_NOT_FOUND':
      return {
        status: 404,
        code:
          'ARTISAN_NOT_FOUND',
        message:
          'Artisan was not found.',
      };

    case 'PRODUCT_ALREADY_LINKED':
      return {
        status: 409,
        code:
          'PRODUCT_ALREADY_LINKED',
        message:
          'Product already has provenance.',
      };

    case 'PUBLIC_ID_CONFLICT':
      return {
        status: 409,
        code:
          'PUBLIC_ID_CONFLICT',
        message:
          'Unable to allocate provenance public ID.',
      };

    case 'ARTISAN_INACTIVE':
      return {
        status: 409,
        code:
          'ARTISAN_INACTIVE',
        message:
          'Artisan is inactive.',
      };

    case 'INVALID_PRODUCT_DATA':
      return {
        status: 422,
        code:
          'INVALID_PRODUCT_DATA',
        message:
          'Product data is not ready for provenance.',
      };

    case 'INVALID_ARTISAN_DATA':
      return {
        status: 422,
        code:
          'INVALID_ARTISAN_DATA',
        message:
          'Artisan data is not ready for provenance.',
      };

    default:
      return {
        status: 500,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to create provenance.',
      };
  }
}

function createProvenanceController(
  {
    createSecureProvenanceFn =
      createSecureProvenance,
  } = {}
) {
  if (
    typeof createSecureProvenanceFn !==
    'function'
  ) {
    throw new TypeError(
      'createSecureProvenanceFn must be a function.'
    );
  }

  return async function provenanceController(
    req,
    res
  ) {
    try {
      const result =
        await createSecureProvenanceFn({
          user: req?.user,
          payload: req?.body,
        });

      const provenanceId =
        typeof result?.provenanceId ===
        'string'
          ? result.provenanceId
          : '';

      const source =
        result?.provenance &&
        typeof result.provenance ===
          'object' &&
        !Array.isArray(
          result.provenance
        )
          ? {
              ...result.provenance,

              publicId:
                typeof result?.publicId ===
                  'string'
                  ? result.publicId
                  : result.provenance
                      .publicId,
            }
          : {
              publicId:
                typeof result?.publicId ===
                  'string'
                  ? result.publicId
                  : '',
            };

      const data =
        sanitizeProvenanceResponse(
          source,
          provenanceId
        );

      return res
        .status(201)
        .json({
          success: true,
          created:
            result?.created === true,
          data,
        });
    } catch (error) {
      const mapped =
        mapProvenanceError(error);

      const body = {
        success: false,
        code: mapped.code,
        message: mapped.message,
      };

      if (
        mapped.status === 400 &&
        Array.isArray(
          mapped.details
        ) &&
        mapped.details.length > 0
      ) {
        body.details =
          mapped.details;
      }

      return res
        .status(mapped.status)
        .json(body);
    }
  };
}

const createProvenance =
  createProvenanceController();

module.exports = {
  mapProvenanceError,
  sanitizeProvenanceResponse,
  createProvenanceController,
  createProvenance,
};
