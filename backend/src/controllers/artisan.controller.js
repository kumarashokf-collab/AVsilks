'use strict';

const {
  createSecureArtisan,
} = require(
  '../services/artisan.service'
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

function sanitizeArtisanResponse(
  artisan,
  artisanId
) {
  const source =
    artisan &&
    typeof artisan === 'object' &&
    !Array.isArray(artisan)
      ? artisan
      : {};

  return Object.freeze({
    id:
      typeof artisanId === 'string'
        ? artisanId
        : '',

    artisanCode:
      typeof source.artisanCode === 'string'
        ? source.artisanCode
        : '',

    displayName:
      typeof source.displayName === 'string'
        ? source.displayName
        : '',

    craftType:
      typeof source.craftType === 'string'
        ? source.craftType
        : '',

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

    loomType:
      typeof source.loomType === 'string'
        ? source.loomType
        : '',

    active:
      source.active === true,
  });
}

function mapArtisanError(error) {
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
          'ARTISAN_VALIDATION_FAILED',
        message:
          'Artisan request is invalid.',
        details:
          sanitizeValidationDetails(
            error?.details
          ),
      };

    case 'ARTISAN_CODE_CONFLICT':
      return {
        status: 409,
        code:
          'ARTISAN_CODE_CONFLICT',
        message:
          'Artisan code already exists.',
      };

    default:
      return {
        status: 500,
        code: 'INTERNAL_ERROR',
        message:
          'Unable to create artisan.',
      };
  }
}

function createArtisanController(
  {
    createSecureArtisanFn =
      createSecureArtisan,
  } = {}
) {
  if (
    typeof createSecureArtisanFn !==
    'function'
  ) {
    throw new TypeError(
      'createSecureArtisanFn must be a function.'
    );
  }

  return async function artisanController(
    req,
    res
  ) {
    try {
      const result =
        await createSecureArtisanFn({
          user: req?.user,
          payload: req?.body,
        });

      const artisanId =
        typeof result?.artisanId ===
        'string'
          ? result.artisanId
          : '';

      const data =
        sanitizeArtisanResponse(
          result?.artisan,
          artisanId
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
        mapArtisanError(error);

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

const createArtisan =
  createArtisanController();

module.exports = {
  mapArtisanError,
  sanitizeArtisanResponse,
  createArtisanController,
  createArtisan,
};
