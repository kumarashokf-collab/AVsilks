'use strict';

const {
  randomUUID,
} = require('node:crypto');

const ARTISAN_REPOSITORY_ERROR =
  Object.freeze({
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_DEPENDENCIES:
      'INVALID_DEPENDENCIES',
    ARTISAN_CODE_CONFLICT:
      'ARTISAN_CODE_CONFLICT',
  });

function createRepositoryError(
  code,
  message
) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function canonicalizeArtisanCode(value) {
  return normalizeText(value)
    .toUpperCase();
}

function defaultGenerateArtisanId() {
  return (
    'art_' +
    randomUUID()
      .replace(/-/g, '')
  );
}

function resolveDependencies(
  dependencies = {}
) {
  if (
    dependencies.db &&
    typeof dependencies.db
      .runTransaction === 'function' &&
    typeof dependencies.serverTimestamp ===
      'function' &&
    typeof dependencies.generateArtisanId ===
      'function'
  ) {
    return {
      db: dependencies.db,
      serverTimestamp:
        dependencies.serverTimestamp,
      generateArtisanId:
        dependencies.generateArtisanId,
    };
  }

  const {
    db,
    admin,
  } = require('../config/firebase');

  if (
    !db ||
    typeof db.runTransaction !==
      'function' ||
    !admin?.firestore?.FieldValue
      ?.serverTimestamp
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan repository dependencies are invalid.'
    );
  }

  return {
    db,

    serverTimestamp: () =>
      admin.firestore.FieldValue
        .serverTimestamp(),

    generateArtisanId:
      defaultGenerateArtisanId,
  };
}

function buildArtisanRecord(
  artisanData,
  artisanId,
  adminUserId,
  timestamp
) {
  return {
    id: artisanId,

    artisanCode:
      canonicalizeArtisanCode(
        artisanData.artisanCode
      ),

    displayName:
      normalizeText(
        artisanData.displayName
      ),

    craftType:
      normalizeText(
        artisanData.craftType
      ),

    village:
      normalizeText(
        artisanData.village
      ),

    district:
      normalizeText(
        artisanData.district
      ),

    state:
      normalizeText(
        artisanData.state
      ),

    country:
      normalizeText(
        artisanData.country
      ),

    loomType:
      normalizeText(
        artisanData.loomType
      ),

    active:
      artisanData.active !== false,

    createdBy: adminUserId,
    updatedBy: adminUserId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function createArtisanWithTransaction(
  {
    adminUserId,
    artisanData,
  } = {},
  dependencies = {}
) {
  const normalizedAdminUserId =
    normalizeText(adminUserId);

  const canonicalArtisanCode =
    canonicalizeArtisanCode(
      artisanData?.artisanCode
    );

  if (
    !normalizedAdminUserId ||
    !artisanData ||
    typeof artisanData !== 'object' ||
    Array.isArray(artisanData) ||
    !canonicalArtisanCode ||
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(
      canonicalArtisanCode
    )
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_INPUT,
      'Valid artisan repository input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
    generateArtisanId,
  } = resolveDependencies(
    dependencies
  );

  const artisanId =
    normalizeText(
      generateArtisanId()
    );

  if (
    !artisanId ||
    artisanId.includes('/')
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Generated artisan ID is invalid.'
    );
  }

  const artisanRef =
    db.collection('artisans')
      .doc(artisanId);

  const artisanCodeRef =
    db.collection('artisanCodes')
      .doc(canonicalArtisanCode);

  return db.runTransaction(
    async (transaction) => {
      const existingCodeSnapshot =
        await transaction.get(
          artisanCodeRef
        );

      if (
        existingCodeSnapshot.exists
      ) {
        throw createRepositoryError(
          ARTISAN_REPOSITORY_ERROR
            .ARTISAN_CODE_CONFLICT,
          'Artisan code already exists.'
        );
      }

      const timestamp =
        serverTimestamp();

      const artisanRecord =
        buildArtisanRecord(
          artisanData,
          artisanId,
          normalizedAdminUserId,
          timestamp
        );

      transaction.set(
        artisanRef,
        artisanRecord
      );

      transaction.set(
        artisanCodeRef,
        {
          artisanId,
          artisanCode:
            canonicalArtisanCode,
          createdAt: timestamp,
        }
      );

      return Object.freeze({
        created: true,
        artisanId,
        artisan:
          Object.freeze({
            ...artisanRecord,
          }),
      });
    }
  );
}

module.exports = {
  ARTISAN_REPOSITORY_ERROR,
  canonicalizeArtisanCode,
  createArtisanWithTransaction,
};
