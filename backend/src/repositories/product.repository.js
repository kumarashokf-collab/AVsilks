'use strict';

const {
  db,
} = require('../config/firebase');

const {
  FieldValue,
} = require('firebase-admin/firestore');

function createRepositoryError(
  code,
  message
) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function findBySku(sku) {
  const snapshot =
    await db
      .collection('products')
      .where('sku', '==', sku)
      .get();

  return snapshot.empty
    ? null
    : snapshot.docs[0].data();
}

async function createProductWithTransaction(
  productData,
  adminUid
) {
  const batch = db.batch();

  const productRef =
    db.collection('products').doc();

  const data = {
    id: productRef.id,
    ...productData,
    createdAt:
      FieldValue.serverTimestamp(),
    updatedAt:
      FieldValue.serverTimestamp(),
  };

  batch.set(
    productRef,
    data
  );

  await batch.commit();

  return data;
}

async function deactivateProductWithTransaction(
  productId,
  actorUid
) {
  const productRef =
    db
      .collection('products')
      .doc(productId);

  return db.runTransaction(
    async (transaction) => {
      const snapshot =
        await transaction.get(
          productRef
        );

      if (!snapshot.exists) {
        throw createRepositoryError(
          'PRODUCT_NOT_FOUND',
          'Product was not found.'
        );
      }

      const productData =
        snapshot.data() || {};

      if (productData.active === false) {
        return Object.freeze({
          id: productId,
          active: false,
        });
      }

      const timestamp =
        FieldValue.serverTimestamp();

      transaction.update(
        productRef,
        {
          active: false,
          deactivatedAt:
            timestamp,
          updatedAt:
            timestamp,
        }
      );

      return Object.freeze({
        id: productId,
        active: false,
      });
    }
  );
}

module.exports = {
  findBySku,
  createProductWithTransaction,
  deactivateProductWithTransaction,
};
