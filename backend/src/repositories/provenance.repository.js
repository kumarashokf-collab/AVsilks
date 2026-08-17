'use strict';

const {
  randomUUID,
} = require('node:crypto');

const {
  FieldValue,
} = require('firebase-admin/firestore');

const {
  PROVENANCE_SCHEMA_VERSION,
  PROVENANCE_STATUS,
} = require(
  '../constants/provenancePolicy'
);

const PROVENANCE_REPOSITORY_ERROR =
  Object.freeze({
    INVALID_INPUT:
      'INVALID_INPUT',

    INVALID_DEPENDENCIES:
      'INVALID_DEPENDENCIES',

    PRODUCT_NOT_FOUND:
      'PRODUCT_NOT_FOUND',

    ARTISAN_NOT_FOUND:
      'ARTISAN_NOT_FOUND',

    ARTISAN_INACTIVE:
      'ARTISAN_INACTIVE',

    PRODUCT_ALREADY_LINKED:
      'PRODUCT_ALREADY_LINKED',

    PUBLIC_ID_CONFLICT:
      'PUBLIC_ID_CONFLICT',

    INVALID_PRODUCT_DATA:
      'INVALID_PRODUCT_DATA',

    INVALID_ARTISAN_DATA:
      'INVALID_ARTISAN_DATA',

    PROVENANCE_NOT_FOUND:
      'PROVENANCE_NOT_FOUND',

    INVALID_STATUS_TRANSITION:
      'INVALID_STATUS_TRANSITION',

    PUBLIC_PROVENANCE_NOT_FOUND:
      'PUBLIC_PROVENANCE_NOT_FOUND',

    INVALID_PUBLIC_PROVENANCE_DATA:
      'INVALID_PUBLIC_PROVENANCE_DATA',

    INVALID_PROVENANCE_DATA:
      'INVALID_PROVENANCE_DATA',
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

function isPlainObject(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function defaultGenerateProvenanceId() {
  return (
    'prov_' +
    randomUUID().replace(/-/g, '')
  );
}

function defaultGeneratePublicId() {
  return (
    'pub_' +
    randomUUID().replace(/-/g, '')
  );
}

function resolveDependencies(
  dependencies = {}
) {
  const hasInjectedDependencies =
    Object.keys(dependencies).length > 0;

  if (hasInjectedDependencies) {
    if (
      !dependencies.db ||
      typeof dependencies.db
        .runTransaction !== 'function' ||
      typeof dependencies.serverTimestamp !==
        'function' ||
      (
        dependencies.generateProvenanceId !==
          undefined &&
        typeof dependencies.generateProvenanceId !==
          'function'
      ) ||
      (
        dependencies.generatePublicId !==
          undefined &&
        typeof dependencies.generatePublicId !==
          'function'
      )
    ) {
      throw createRepositoryError(
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_DEPENDENCIES,
        'Firestore provenance repository dependencies are invalid.'
      );
    }

    return {
      db: dependencies.db,

      serverTimestamp:
        dependencies.serverTimestamp,

      generateProvenanceId:
        dependencies.generateProvenanceId ||
        defaultGenerateProvenanceId,

      generatePublicId:
        dependencies.generatePublicId ||
        defaultGeneratePublicId,
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
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore provenance repository dependencies are invalid.'
    );
  }

  return {
    db,

    serverTimestamp: () =>
      FieldValue.serverTimestamp(),

    generateProvenanceId:
      defaultGenerateProvenanceId,

    generatePublicId:
      defaultGeneratePublicId,
  };
}

function validateRepositoryInput(
  adminUserId,
  provenanceData
) {
  const productId =
    normalizeText(
      provenanceData?.productId
    );

  const artisanId =
    normalizeText(
      provenanceData?.artisanId
    );

  const origin =
    provenanceData?.origin;

  const valid =
    normalizeText(adminUserId) &&
    isPlainObject(provenanceData) &&
    productId &&
    !productId.includes('/') &&
    artisanId &&
    !artisanId.includes('/') &&
    normalizeText(
      provenanceData.material
    ) &&
    normalizeText(
      provenanceData.weaveTechnique
    ) &&
    normalizeText(
      provenanceData.loomType
    ) &&
    isPlainObject(origin) &&
    normalizeText(origin.village) &&
    normalizeText(origin.district) &&
    normalizeText(origin.state) &&
    normalizeText(origin.country);

  if (!valid) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_INPUT,
      'Valid provenance repository input is required.'
    );
  }

  return {
    adminUserId:
      normalizeText(adminUserId),

    productId,
    artisanId,
  };
}

async function createProvenanceWithTransaction(
  {
    adminUserId,
    provenanceData,
  } = {},
  dependencies = {}
) {
  const normalized =
    validateRepositoryInput(
      adminUserId,
      provenanceData
    );

  const {
    db,
    serverTimestamp,
    generateProvenanceId,
    generatePublicId,
  } = resolveDependencies(
    dependencies
  );

  const provenanceId =
    normalizeText(
      generateProvenanceId()
    );

  const publicId =
    normalizeText(
      generatePublicId()
    );

  if (
    !provenanceId ||
    provenanceId.includes('/') ||
    !publicId ||
    publicId.includes('/')
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Generated provenance identifiers are invalid.'
    );
  }

  const productRef =
    db.collection('products')
      .doc(normalized.productId);

  const artisanRef =
    db.collection('artisans')
      .doc(normalized.artisanId);

  const provenanceRef =
    db.collection(
      'provenanceRecords'
    ).doc(provenanceId);

  const publicIdRef =
    db.collection(
      'provenancePublicIds'
    ).doc(publicId);

  return db.runTransaction(
    async (transaction) => {
      const productSnapshot =
        await transaction.get(
          productRef
        );

      if (!productSnapshot.exists) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .PRODUCT_NOT_FOUND,
          'Product was not found.'
        );
      }

      const productData =
        productSnapshot.data() || {};

      if (
        normalizeText(
          productData.provenanceId
        ) ||
        normalizeText(
          productData.publicProvenanceId
        )
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .PRODUCT_ALREADY_LINKED,
          'Product already has a provenance record.'
        );
      }

      const productNameSnapshot =
        normalizeText(
          productData.name
        );

      const skuSnapshot =
        normalizeText(
          productData.sku
        );

      if (
        !productNameSnapshot ||
        !skuSnapshot
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_PRODUCT_DATA,
          'Product catalogue data is invalid for provenance.'
        );
      }

      const artisanSnapshot =
        await transaction.get(
          artisanRef
        );

      if (!artisanSnapshot.exists) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .ARTISAN_NOT_FOUND,
          'Artisan was not found.'
        );
      }

      const artisanData =
        artisanSnapshot.data() || {};

      if (
        artisanData.active === false
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .ARTISAN_INACTIVE,
          'Artisan is inactive.'
        );
      }

      const artisanCodeSnapshot =
        normalizeText(
          artisanData.artisanCode
        );

      const artisanNameSnapshot =
        normalizeText(
          artisanData.displayName
        );

      if (
        !artisanCodeSnapshot ||
        !artisanNameSnapshot
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_ARTISAN_DATA,
          'Artisan data is invalid for provenance.'
        );
      }

      const publicIdSnapshot =
        await transaction.get(
          publicIdRef
        );

      if (
        publicIdSnapshot.exists
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .PUBLIC_ID_CONFLICT,
          'Generated public provenance ID already exists.'
        );
      }

      const timestamp =
        serverTimestamp();

      const provenanceRecord = {
        id: provenanceId,
        publicId,

        productId:
          normalized.productId,

        artisanId:
          normalized.artisanId,

        skuSnapshot,
        productNameSnapshot,

        artisanCodeSnapshot,
        artisanNameSnapshot,

        material:
          normalizeText(
            provenanceData.material
          ),

        weaveTechnique:
          normalizeText(
            provenanceData.weaveTechnique
          ),

        loomType:
          normalizeText(
            provenanceData.loomType
          ),

        origin: {
          village:
            normalizeText(
              provenanceData
                .origin.village
            ),

          district:
            normalizeText(
              provenanceData
                .origin.district
            ),

          state:
            normalizeText(
              provenanceData
                .origin.state
            ),

          country:
            normalizeText(
              provenanceData
                .origin.country
            ),
        },

        status:
          PROVENANCE_STATUS.DRAFT,

        schemaVersion:
          PROVENANCE_SCHEMA_VERSION,

        createdBy:
          normalized.adminUserId,

        updatedBy:
          normalized.adminUserId,

        createdAt: timestamp,
        updatedAt: timestamp,

        publishedAt: null,
        archivedAt: null,
      };

      transaction.set(
        provenanceRef,
        provenanceRecord
      );

      transaction.set(
        publicIdRef,
        {
          provenanceId,
          publicId,
          createdAt: timestamp,
        }
      );

      transaction.update(
        productRef,
        {
          provenanceId,
          publicProvenanceId:
            publicId,
          updatedAt: timestamp,
        }
      );

      return Object.freeze({
        created: true,
        provenanceId,
        publicId,

        provenance:
          Object.freeze({
            ...provenanceRecord,
          }),
      });
    }
  );
}


function validateLifecycleInput(
  adminUserId,
  provenanceId,
  nextStatus
) {
  const normalizedAdminUserId =
    normalizeText(adminUserId);

  const normalizedProvenanceId =
    normalizeText(provenanceId);

  const normalizedNextStatus =
    normalizeText(nextStatus);

  const validTargetStatus =
    normalizedNextStatus ===
      PROVENANCE_STATUS.PUBLISHED ||
    normalizedNextStatus ===
      PROVENANCE_STATUS.ARCHIVED;

  if (
    !normalizedAdminUserId ||
    !normalizedProvenanceId ||
    normalizedProvenanceId.includes('/') ||
    !validTargetStatus
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_INPUT,
      'Valid provenance lifecycle input is required.'
    );
  }

  return {
    adminUserId:
      normalizedAdminUserId,

    provenanceId:
      normalizedProvenanceId,

    nextStatus:
      normalizedNextStatus,
  };
}

function isAllowedStatusTransition(
  currentStatus,
  nextStatus
) {
  return (
    (
      currentStatus ===
        PROVENANCE_STATUS.DRAFT &&
      nextStatus ===
        PROVENANCE_STATUS.PUBLISHED
    ) ||
    (
      currentStatus ===
        PROVENANCE_STATUS.PUBLISHED &&
      nextStatus ===
        PROVENANCE_STATUS.ARCHIVED
    )
  );
}

async function transitionProvenanceStatusWithTransaction(
  {
    adminUserId,
    provenanceId,
    nextStatus,
  } = {},
  dependencies = {}
) {
  const normalized =
    validateLifecycleInput(
      adminUserId,
      provenanceId,
      nextStatus
    );

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(
    dependencies
  );

  const provenanceRef =
    db.collection(
      'provenanceRecords'
    ).doc(
      normalized.provenanceId
    );

  return db.runTransaction(
    async (transaction) => {
      const provenanceSnapshot =
        await transaction.get(
          provenanceRef
        );

      if (
        !provenanceSnapshot.exists
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .PROVENANCE_NOT_FOUND,
          'Provenance record was not found.'
        );
      }

      const provenanceData =
        provenanceSnapshot.data() || {};

      const currentStatus =
        normalizeText(
          provenanceData.status
        );

      if (
        !isAllowedStatusTransition(
          currentStatus,
          normalized.nextStatus
        )
      ) {
        throw createRepositoryError(
          PROVENANCE_REPOSITORY_ERROR
            .INVALID_STATUS_TRANSITION,
          'Provenance status transition is not allowed.'
        );
      }

      const timestamp =
        serverTimestamp();

      const updateData = {
        status:
          normalized.nextStatus,

        updatedBy:
          normalized.adminUserId,

        updatedAt:
          timestamp,
      };

      if (
        normalized.nextStatus ===
        PROVENANCE_STATUS.PUBLISHED
      ) {
        updateData.publishedAt =
          timestamp;
      }

      if (
        normalized.nextStatus ===
        PROVENANCE_STATUS.ARCHIVED
      ) {
        updateData.archivedAt =
          timestamp;
      }

      transaction.update(
        provenanceRef,
        updateData
      );

      return Object.freeze({
        updated: true,

        provenanceId:
          normalized.provenanceId,

        status:
          normalized.nextStatus,
      });
    }
  );
}


function resolvePublicReadDependencies(
  dependencies = {}
) {
  const hasInjectedDependencies =
    Object.keys(dependencies).length > 0;

  if (hasInjectedDependencies) {
    if (
      !dependencies.db ||
      typeof dependencies.db.collection !==
        'function'
    ) {
      throw createRepositoryError(
        PROVENANCE_REPOSITORY_ERROR
          .INVALID_DEPENDENCIES,
        'Firestore public provenance repository dependencies are invalid.'
      );
    }

    return {
      db: dependencies.db,
    };
  }

  const {
    db,
  } = require('../config/firebase');

  if (
    !db ||
    typeof db.collection !== 'function'
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore public provenance repository dependencies are invalid.'
    );
  }

  return {
    db,
  };
}

function validatePublicProvenanceInput(
  publicId
) {
  const normalizedPublicId =
    normalizeText(publicId);

  if (
    !normalizedPublicId ||
    normalizedPublicId.includes('/')
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_INPUT,
      'Valid public provenance ID is required.'
    );
  }

  return normalizedPublicId;
}

function createPublicNotFoundError() {
  return createRepositoryError(
    PROVENANCE_REPOSITORY_ERROR
      .PUBLIC_PROVENANCE_NOT_FOUND,
    'Public provenance was not found.'
  );
}

async function getPublishedProvenanceByPublicId(
  {
    publicId,
  } = {},
  dependencies = {}
) {
  const normalizedPublicId =
    validatePublicProvenanceInput(
      publicId
    );

  const {
    db,
  } = resolvePublicReadDependencies(
    dependencies
  );

  const publicIndexRef =
    db.collection(
      'provenancePublicIds'
    ).doc(
      normalizedPublicId
    );

  const publicIndexSnapshot =
    await publicIndexRef.get();

  if (
    !publicIndexSnapshot.exists
  ) {
    throw createPublicNotFoundError();
  }

  const publicIndexData =
    publicIndexSnapshot.data() || {};

  const provenanceId =
    normalizeText(
      publicIndexData.provenanceId
    );

  const indexedPublicId =
    normalizeText(
      publicIndexData.publicId
    );

  if (
    !provenanceId ||
    provenanceId.includes('/') ||
    indexedPublicId !==
      normalizedPublicId
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_PUBLIC_PROVENANCE_DATA,
      'Public provenance index data is invalid.'
    );
  }

  const provenanceRef =
    db.collection(
      'provenanceRecords'
    ).doc(
      provenanceId
    );

  const provenanceSnapshot =
    await provenanceRef.get();

  if (
    !provenanceSnapshot.exists
  ) {
    throw createPublicNotFoundError();
  }

  const provenanceData =
    provenanceSnapshot.data() || {};

  if (
    normalizeText(
      provenanceData.publicId
    ) !== normalizedPublicId
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_PUBLIC_PROVENANCE_DATA,
      'Public provenance record data is invalid.'
    );
  }

  if (
    normalizeText(
      provenanceData.status
    ) !==
    PROVENANCE_STATUS.PUBLISHED
  ) {
    throw createPublicNotFoundError();
  }

  return Object.freeze({
    publicId:
      normalizedPublicId,

    provenance:
      Object.freeze({
        ...provenanceData,
      }),
  });
}


function validateManagementProvenanceInput(
  provenanceId
) {
  const normalizedProvenanceId =
    normalizeText(
      provenanceId
    );

  if (
    !normalizedProvenanceId ||
    normalizedProvenanceId.includes('/') ||
    normalizedProvenanceId.length > 128
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_INPUT,
      'Valid provenance ID is required.'
    );
  }

  return normalizedProvenanceId;
}

function validateStoredManagementProvenance(
  provenanceData,
  expectedProvenanceId
) {
  if (
    !isPlainObject(
      provenanceData
    )
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_PROVENANCE_DATA,
      'Stored provenance data is invalid.'
    );
  }

  const storedId =
    normalizeText(
      provenanceData.id
    );

  const publicId =
    normalizeText(
      provenanceData.publicId
    );

  const status =
    normalizeText(
      provenanceData.status
    );

  const validStatuses =
    new Set([
      PROVENANCE_STATUS.DRAFT,
      PROVENANCE_STATUS.PUBLISHED,
      PROVENANCE_STATUS.ARCHIVED,
    ]);

  if (
    storedId !== expectedProvenanceId ||
    !publicId ||
    publicId.includes('/') ||
    !validStatuses.has(
      status
    )
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .INVALID_PROVENANCE_DATA,
      'Stored provenance data is invalid.'
    );
  }

  return provenanceData;
}

async function getProvenanceById(
  {
    provenanceId,
  } = {},
  dependencies = {}
) {
  const normalizedProvenanceId =
    validateManagementProvenanceInput(
      provenanceId
    );

  const {
    db,
  } = resolvePublicReadDependencies(
    dependencies
  );

  const provenanceRef =
    db.collection(
      'provenanceRecords'
    ).doc(
      normalizedProvenanceId
    );

  const provenanceSnapshot =
    await provenanceRef.get();

  if (
    !provenanceSnapshot.exists
  ) {
    throw createRepositoryError(
      PROVENANCE_REPOSITORY_ERROR
        .PROVENANCE_NOT_FOUND,
      'Provenance record was not found.'
    );
  }

  const provenanceData =
    validateStoredManagementProvenance(
      provenanceSnapshot.data() || {},
      normalizedProvenanceId
    );

  return Object.freeze({
    provenanceId:
      normalizedProvenanceId,

    provenance:
      Object.freeze({
        ...provenanceData,
      }),
  });
}

module.exports = {
  PROVENANCE_REPOSITORY_ERROR,
  createProvenanceWithTransaction,
  transitionProvenanceStatusWithTransaction,
  getPublishedProvenanceByPublicId,
  getProvenanceById,
};
