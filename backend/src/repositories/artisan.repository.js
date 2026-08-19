'use strict';

const {
  randomUUID,
} = require('node:crypto');

const {
  FieldValue,
} = require('firebase-admin/firestore');

const ARTISAN_REPOSITORY_ERROR =
  Object.freeze({
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_DEPENDENCIES:
      'INVALID_DEPENDENCIES',
    ARTISAN_CODE_CONFLICT:
      'ARTISAN_CODE_CONFLICT',
    INVALID_ARTISAN_DATA:
      'INVALID_ARTISAN_DATA',
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
  } = require('../config/firebase');

  if (
    !db ||
    typeof db.runTransaction !==
      'function' ||
    typeof FieldValue
      ?.serverTimestamp !==
      'function'
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
      FieldValue.serverTimestamp(),

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

function resolveListDependencies(
  dependencies = {}
) {
  const hasExplicitDb =
    Object.prototype.hasOwnProperty.call(
      dependencies,
      'db'
    );

  if (hasExplicitDb) {
    if (
      dependencies.db &&
      typeof dependencies.db.collection ===
        'function'
    ) {
      return {
        db: dependencies.db,
      };
    }

    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan list repository dependencies are invalid.'
    );
  }

  const {
    db,
  } = require('../config/firebase');

  if (
    !db ||
    typeof db.collection !==
      'function'
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan list repository dependencies are invalid.'
    );
  }

  return {
    db,
  };
}

function sanitizeListedArtisan(
  documentId,
  artisan
) {
  const id =
    normalizeText(documentId);

  const source =
    artisan &&
    typeof artisan === 'object' &&
    !Array.isArray(artisan)
      ? artisan
      : null;

  const storedId =
    normalizeText(source?.id);

  const artisanCode =
    canonicalizeArtisanCode(
      source?.artisanCode
    );

  const displayName =
    normalizeText(
      source?.displayName
    );

  const craftType =
    normalizeText(
      source?.craftType
    );

  const village =
    normalizeText(
      source?.village
    );

  const district =
    normalizeText(
      source?.district
    );

  const state =
    normalizeText(
      source?.state
    );

  const country =
    normalizeText(
      source?.country
    );

  const loomType =
    normalizeText(
      source?.loomType
    );

  if (
    !id ||
    id.includes('/') ||
    storedId !== id ||
    !artisanCode ||
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(
      artisanCode
    ) ||
    !displayName ||
    !craftType ||
    !village ||
    !district ||
    !state ||
    !country ||
    !loomType ||
    source?.active !== true
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_ARTISAN_DATA,
      'Stored artisan data is invalid.'
    );
  }

  return Object.freeze({
    id,
    artisanCode,
    displayName,
    craftType,
    village,
    district,
    state,
    country,
    loomType,
    active: true,
  });
}

async function listActiveArtisans(
  dependencies = {}
) {
  const {
    db,
  } =
    resolveListDependencies(
      dependencies
    );

  let query;

  try {
    query =
      db.collection(
        'artisans'
      );
  } catch {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan list repository dependencies are invalid.'
    );
  }

  if (
    !query ||
    typeof query.where !== 'function' ||
    typeof query.limit !== 'function'
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan list repository dependencies are invalid.'
    );
  }

  const activeQuery =
    query.where(
      'active',
      '==',
      true
    );

  if (
    !activeQuery ||
    typeof activeQuery.limit !==
      'function'
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan list repository dependencies are invalid.'
    );
  }

  const limitedQuery =
    activeQuery.limit(
      100
    );

  if (
    !limitedQuery ||
    typeof limitedQuery.get !==
      'function'
  ) {
    throw createRepositoryError(
      ARTISAN_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore artisan list repository dependencies are invalid.'
    );
  }

  const snapshot =
    await limitedQuery.get();

  const docs =
    Array.isArray(
      snapshot?.docs
    )
      ? snapshot.docs
      : [];

  const artisans =
    docs.map(
      (document) => {
        if (
          !document ||
          typeof document.data !==
            'function'
        ) {
          throw createRepositoryError(
            ARTISAN_REPOSITORY_ERROR
              .INVALID_ARTISAN_DATA,
            'Stored artisan data is invalid.'
          );
        }

        return sanitizeListedArtisan(
          document.id,
          document.data()
        );
      }
    );

  artisans.sort(
    (left, right) =>
      left.displayName.localeCompare(
        right.displayName,
        'en',
        {
          sensitivity: 'base',
        }
      )
  );

  return Object.freeze(
    artisans
  );
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
  listActiveArtisans,
};
