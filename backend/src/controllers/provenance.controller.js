'use strict';

const {
  createSecureProvenance,
  publishSecureProvenance,
  archiveSecureProvenance,
  getPublicProvenance,
  getSecureProvenance,
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

    case 'PROVENANCE_NOT_FOUND':
      return {
        status: 404,
        code:
          'PROVENANCE_NOT_FOUND',
        message:
          'Provenance record was not found.',
      };

    case 'INVALID_STATUS_TRANSITION':
      return {
        status: 409,
        code:
          'INVALID_STATUS_TRANSITION',
        message:
          'Provenance status transition is not allowed.',
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

function sanitizeProvenanceLifecycleResponse(
  result
) {
  const source =
    result &&
    typeof result === 'object' &&
    !Array.isArray(result)
      ? result
      : {};

  return Object.freeze({
    id:
      typeof source.provenanceId ===
        'string'
        ? source.provenanceId
        : '',

    status:
      typeof source.status === 'string'
        ? source.status
        : '',
  });
}

function createLifecycleController(
  serviceFunction,
  dependencyName
) {
  if (
    typeof serviceFunction !==
    'function'
  ) {
    throw new TypeError(
      dependencyName +
        ' must be a function.'
    );
  }

  return async function provenanceLifecycleController(
    req,
    res
  ) {
    try {
      const result =
        await serviceFunction({
          user: req?.user,
          params: req?.params,
        });

      const data =
        sanitizeProvenanceLifecycleResponse(
          result
        );

      return res
        .status(200)
        .json({
          success: true,
          updated:
            result?.updated === true,
          data,
        });
    } catch (error) {
      const mapped =
        mapProvenanceError(error);

      const body = {
        success: false,
        code: mapped.code,
        message:
          mapped.code ===
          'INTERNAL_ERROR'
            ? 'Unable to update provenance status.'
            : mapped.message,
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

function createPublishProvenanceController(
  {
    publishSecureProvenanceFn =
      publishSecureProvenance,
  } = {}
) {
  return createLifecycleController(
    publishSecureProvenanceFn,
    'publishSecureProvenanceFn'
  );
}

function createArchiveProvenanceController(
  {
    archiveSecureProvenanceFn =
      archiveSecureProvenance,
  } = {}
) {
  return createLifecycleController(
    archiveSecureProvenanceFn,
    'archiveSecureProvenanceFn'
  );
}

function sanitizeManagedProvenanceResponse(
  result
) {
  const source =
    result &&
    typeof result === 'object' &&
    !Array.isArray(result)
      ? result
      : {};

  const provenance =
    source.provenance &&
    typeof source.provenance === 'object' &&
    !Array.isArray(source.provenance)
      ? source.provenance
      : {};

  const origin =
    provenance.origin &&
    typeof provenance.origin === 'object' &&
    !Array.isArray(provenance.origin)
      ? provenance.origin
      : {};

  const product =
    Object.freeze({
      sku:
        typeof provenance.skuSnapshot ===
          'string'
          ? provenance.skuSnapshot
          : '',

      name:
        typeof provenance.productNameSnapshot ===
          'string'
          ? provenance.productNameSnapshot
          : '',
    });

  const artisan =
    Object.freeze({
      code:
        typeof provenance.artisanCodeSnapshot ===
          'string'
          ? provenance.artisanCodeSnapshot
          : '',

      name:
        typeof provenance.artisanNameSnapshot ===
          'string'
          ? provenance.artisanNameSnapshot
          : '',
    });

  const managedOrigin =
    Object.freeze({
      village:
        typeof origin.village === 'string'
          ? origin.village
          : '',

      district:
        typeof origin.district === 'string'
          ? origin.district
          : '',

      state:
        typeof origin.state === 'string'
          ? origin.state
          : '',

      country:
        typeof origin.country === 'string'
          ? origin.country
          : '',
    });

  return Object.freeze({
    id:
      typeof source.provenanceId ===
        'string'
        ? source.provenanceId
        : '',

    publicId:
      typeof provenance.publicId ===
        'string'
        ? provenance.publicId
        : '',

    status:
      typeof provenance.status ===
        'string'
        ? provenance.status
        : '',

    product,
    artisan,

    material:
      typeof provenance.material ===
        'string'
        ? provenance.material
        : '',

    weaveTechnique:
      typeof provenance.weaveTechnique ===
        'string'
        ? provenance.weaveTechnique
        : '',

    loomType:
      typeof provenance.loomType ===
        'string'
        ? provenance.loomType
        : '',

    origin:
      managedOrigin,
  });
}

function createGetProvenanceController(
  {
    getSecureProvenanceFn =
      getSecureProvenance,
  } = {}
) {
  if (
    typeof getSecureProvenanceFn !==
    'function'
  ) {
    throw new TypeError(
      'getSecureProvenanceFn must be a function.'
    );
  }

  return async function getProvenanceController(
    req,
    res
  ) {
    try {
      const result =
        await getSecureProvenanceFn({
          user: req?.user,
          params: req?.params,
        });

      const data =
        sanitizeManagedProvenanceResponse(
          result
        );

      return res
        .status(200)
        .json({
          success: true,
          data,
        });
    } catch (error) {
      const mapped =
        mapProvenanceError(
          error
        );

      const body = {
        success: false,
        code: mapped.code,
        message:
          mapped.code ===
            'INTERNAL_ERROR'
            ? 'Unable to read provenance.'
            : mapped.message,
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
        .status(
          mapped.status
        )
        .json(body);
    }
  };
}

function sanitizePublicProvenanceResponse(
  result
) {
  const source =
    result &&
    typeof result === 'object' &&
    !Array.isArray(result)
      ? result
      : {};

  const provenance =
    source.provenance &&
    typeof source.provenance === 'object' &&
    !Array.isArray(source.provenance)
      ? source.provenance
      : {};

  const origin =
    provenance.origin &&
    typeof provenance.origin === 'object' &&
    !Array.isArray(provenance.origin)
      ? provenance.origin
      : {};

  const product =
    Object.freeze({
      sku:
        typeof provenance.skuSnapshot ===
          'string'
          ? provenance.skuSnapshot
          : '',

      name:
        typeof provenance.productNameSnapshot ===
          'string'
          ? provenance.productNameSnapshot
          : '',
    });

  const artisan =
    Object.freeze({
      code:
        typeof provenance.artisanCodeSnapshot ===
          'string'
          ? provenance.artisanCodeSnapshot
          : '',

      name:
        typeof provenance.artisanNameSnapshot ===
          'string'
          ? provenance.artisanNameSnapshot
          : '',
    });

  const publicOrigin =
    Object.freeze({
      village:
        typeof origin.village === 'string'
          ? origin.village
          : '',

      district:
        typeof origin.district === 'string'
          ? origin.district
          : '',

      state:
        typeof origin.state === 'string'
          ? origin.state
          : '',

      country:
        typeof origin.country === 'string'
          ? origin.country
          : '',
    });

  return Object.freeze({
    publicId:
      typeof source.publicId === 'string'
        ? source.publicId
        : '',

    product,
    artisan,

    material:
      typeof provenance.material === 'string'
        ? provenance.material
        : '',

    weaveTechnique:
      typeof provenance.weaveTechnique ===
        'string'
        ? provenance.weaveTechnique
        : '',

    loomType:
      typeof provenance.loomType === 'string'
        ? provenance.loomType
        : '',

    origin:
      publicOrigin,
  });
}

function createPublicProvenanceController(
  {
    getPublicProvenanceFn =
      getPublicProvenance,
  } = {}
) {
  if (
    typeof getPublicProvenanceFn !==
    'function'
  ) {
    throw new TypeError(
      'getPublicProvenanceFn must be a function.'
    );
  }

  return async function publicProvenanceController(
    req,
    res
  ) {
    try {
      const result =
        await getPublicProvenanceFn({
          params: req?.params,
        });

      const data =
        sanitizePublicProvenanceResponse(
          result
        );

      return res
        .status(200)
        .json({
          success: true,
          verified: true,
          data,
        });
    } catch (error) {
      if (
        error?.code ===
          'PUBLIC_PROVENANCE_NOT_FOUND' ||
        error?.code ===
          'INVALID_PUBLIC_PROVENANCE_DATA'
      ) {
        return res
          .status(404)
          .json({
            success: false,
            verified: false,
            code:
              'PUBLIC_PROVENANCE_NOT_FOUND',
            message:
              'Provenance verification was not found.',
          });
      }

      if (
        error?.code ===
          'VALIDATION_FAILED' ||
        error?.code ===
          'INVALID_INPUT'
      ) {
        const mapped =
          mapProvenanceError(error);

        const body = {
          success: false,
          verified: false,
          code: mapped.code,
          message: mapped.message,
        };

        if (
          Array.isArray(
            mapped.details
          ) &&
          mapped.details.length > 0
        ) {
          body.details =
            mapped.details;
        }

        return res
          .status(400)
          .json(body);
      }

      return res
        .status(500)
        .json({
          success: false,
          verified: false,
          code: 'INTERNAL_ERROR',
          message:
            'Unable to verify provenance.',
        });
    }
  };
}

const createProvenance =
  createProvenanceController();

const publishProvenance =
  createPublishProvenanceController();

const archiveProvenance =
  createArchiveProvenanceController();

const getProvenance =
  createGetProvenanceController();

const verifyPublicProvenance =
  createPublicProvenanceController();

module.exports = {
  mapProvenanceError,
  sanitizeProvenanceResponse,
  sanitizeProvenanceLifecycleResponse,
  sanitizeManagedProvenanceResponse,
  sanitizePublicProvenanceResponse,
  createProvenanceController,
  createPublishProvenanceController,
  createArchiveProvenanceController,
  createGetProvenanceController,
  createPublicProvenanceController,
  createProvenance,
  publishProvenance,
  archiveProvenance,
  getProvenance,
  verifyPublicProvenance,
};
