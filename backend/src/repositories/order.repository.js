'use strict';

const {
  FieldValue,
} = require('firebase-admin/firestore');

const {
  buildOrderCreationPlan,
} = require('../services/orderCreation.service');

const {
  buildCustomerCancellationPlan,
} = require('../services/orderCancellation.service');

const {
  buildAdminFulfilmentPlan,
} = require('../services/orderFulfilment.service');

const ORDER_REPOSITORY_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_DEPENDENCIES: 'INVALID_DEPENDENCIES',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INVALID_PRODUCT_STOCK: 'INVALID_PRODUCT_STOCK',
});

function createRepositoryError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function resolveDependencies(dependencies = {}) {
  if (
    dependencies.db &&
    typeof dependencies.db.runTransaction ===
      'function' &&
    typeof dependencies.serverTimestamp ===
      'function'
  ) {
    return {
      db: dependencies.db,
      serverTimestamp:
        dependencies.serverTimestamp,
    };
  }

  const {
    db,
  } = require('../config/firebase');

  if (
    !db ||
    typeof db.runTransaction !== 'function' ||
    typeof FieldValue
      ?.serverTimestamp !==
      'function'
  ) {
    throw createRepositoryError(
      ORDER_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore transaction dependencies are invalid.'
    );
  }

  return {
    db,
    serverTimestamp: () =>
      FieldValue.serverTimestamp(),
  };
}

async function createOrderWithTransaction(
  {
    userId,
    authenticatedPhone = '',
    customer,
    requestedItems,
    paymentMethod,
    idempotencyIdentity,
  },
  dependencies = {}
) {
  const normalizedUserId =
    normalizeText(userId);

  if (
    !normalizedUserId ||
    !Array.isArray(requestedItems) ||
    requestedItems.length === 0 ||
    !idempotencyIdentity?.orderId ||
    !idempotencyIdentity
      ?.idempotencyKeyHash ||
    !idempotencyIdentity
      ?.requestFingerprint
  ) {
    throw createRepositoryError(
      ORDER_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid order transaction input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const orderRef = db
    .collection('orders')
    .doc(idempotencyIdentity.orderId);

  const productEntries =
    requestedItems.map((item) => ({
      productId: normalizeText(
        item?.productId
      ),
      ref: db
        .collection('products')
        .doc(
          normalizeText(item?.productId)
        ),
    }));

  return db.runTransaction(
    async (transaction) => {
      const existingOrderSnapshot =
        await transaction.get(orderRef);

      if (existingOrderSnapshot.exists) {
        const existingOrder =
          existingOrderSnapshot.data() || {};

        const sameRequest =
          existingOrder.userId ===
            normalizedUserId &&
          existingOrder
            .idempotencyKeyHash ===
            idempotencyIdentity
              .idempotencyKeyHash &&
          existingOrder
            .requestFingerprint ===
            idempotencyIdentity
              .requestFingerprint;

        if (!sameRequest) {
          throw createRepositoryError(
            ORDER_REPOSITORY_ERROR
              .IDEMPOTENCY_CONFLICT,
            'Idempotency key was already used for another order request.'
          );
        }

        return Object.freeze({
          created: false,
          orderId: orderRef.id,
          order: Object.freeze({
            ...existingOrder,
            id: orderRef.id,
          }),
        });
      }

      const productSnapshots =
        await Promise.all(
          productEntries.map(
            ({ ref }) =>
              transaction.get(ref)
          )
        );

      const productRecords =
        productEntries.map(
          ({ productId }, index) => ({
            productId,
            productData:
              productSnapshots[index].exists
                ? productSnapshots[
                    index
                  ].data()
                : null,
          })
        );

      const nowIso =
        typeof dependencies.nowIso ===
        'function'
          ? dependencies.nowIso()
          : new Date().toISOString();

      const plan =
        buildOrderCreationPlan({
          userId: normalizedUserId,
          authenticatedPhone,
          customer,
          requestedItems,
          productRecords,
          paymentMethod,
          idempotencyIdentity,
          nowIso,
        });

      const timestamp =
        serverTimestamp();

      const productRefById =
        new Map(
          productEntries.map(
            ({ productId, ref }) => [
              productId,
              ref,
            ]
          )
        );

      for (
        const stockUpdate
        of plan.stockUpdates
      ) {
        transaction.update(
          productRefById.get(
            stockUpdate.productId
          ),
          {
            stock:
              stockUpdate.nextStock,
            updatedAt: timestamp,
          }
        );
      }

      transaction.set(orderRef, {
        ...plan.orderDocument,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return Object.freeze({
        created: true,
        orderId: plan.orderId,
        order: plan.orderDocument,
      });
    }
  );
}


async function cancelCustomerOrderWithTransaction(
  {
    userId,
    orderId,
    reason,
  },
  dependencies = {}
) {
  const normalizedUserId =
    normalizeText(userId);

  const normalizedOrderId =
    normalizeText(orderId);

  const normalizedReason =
    normalizeText(reason);

  if (
    !normalizedUserId ||
    !normalizedOrderId ||
    !normalizedReason
  ) {
    throw createRepositoryError(
      ORDER_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid cancellation transaction input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const orderRef = db
    .collection('orders')
    .doc(normalizedOrderId);

  return db.runTransaction(
    async (transaction) => {
      const orderSnapshot =
        await transaction.get(orderRef);

      const orderData =
        orderSnapshot.exists
          ? orderSnapshot.data()
          : null;

      const nowIso =
        typeof dependencies.nowIso ===
        'function'
          ? dependencies.nowIso()
          : new Date().toISOString();

      const plan =
        buildCustomerCancellationPlan({
          userId: normalizedUserId,
          orderId: normalizedOrderId,
          reason: normalizedReason,
          orderData,
          nowIso,
        });

      const productEntries =
        plan.stockRestorations.map(
          (restoration) => ({
            ...restoration,
            ref: db
              .collection('products')
              .doc(
                restoration.productId
              ),
          })
        );

      const productSnapshots =
        await Promise.all(
          productEntries.map(
            ({ ref }) =>
              transaction.get(ref)
          )
        );

      const validatedStockUpdates =
        productEntries.map(
          (
            {
              productId,
              quantityToRestore,
              ref,
            },
            index
          ) => {
            const snapshot =
              productSnapshots[index];

            if (!snapshot.exists) {
              throw createRepositoryError(
                ORDER_REPOSITORY_ERROR
                  .PRODUCT_NOT_FOUND,
                'Product ' +
                  productId +
                  ' was not found during cancellation.'
              );
            }

            const productData =
              snapshot.data() || {};

            const currentStock =
              Number(productData.stock);

            const nextStock =
              currentStock +
              quantityToRestore;

            if (
              !Number.isSafeInteger(
                currentStock
              ) ||
              currentStock < 0 ||
              !Number.isSafeInteger(
                nextStock
              )
            ) {
              throw createRepositoryError(
                ORDER_REPOSITORY_ERROR
                  .INVALID_PRODUCT_STOCK,
                'Product ' +
                  productId +
                  ' has invalid stock data.'
              );
            }

            return Object.freeze({
              productId,
              ref,
              currentStock,
              nextStock,
              quantityRestored:
                quantityToRestore,
            });
          }
        );

      const timestamp =
        serverTimestamp();

      for (
        const stockUpdate
        of validatedStockUpdates
      ) {
        transaction.update(
          stockUpdate.ref,
          {
            stock:
              stockUpdate.nextStock,
            updatedAt: timestamp,
          }
        );
      }

      transaction.update(
        orderRef,
        {
          ...plan.orderUpdate,
          cancelledAt: timestamp,
          updatedAt: timestamp,
        }
      );

      return Object.freeze({
        cancelled: true,
        orderId: orderRef.id,
        previousStatus:
          plan.previousStatus,
        nextStatus:
          plan.nextStatus,
        stockRestorations:
          Object.freeze(
            validatedStockUpdates.map(
              ({
                productId,
                currentStock,
                nextStock,
                quantityRestored,
              }) =>
                Object.freeze({
                  productId,
                  currentStock,
                  nextStock,
                  quantityRestored,
                })
            )
          ),
        order: Object.freeze({
          ...orderData,
          ...plan.orderUpdate,
          id: orderRef.id,
        }),
      });
    }
  );
}



async function transitionAdminOrderWithTransaction(
  {
    adminUserId,
    orderId,
    nextStatus,
    note = '',
  },
  dependencies = {}
) {
  const normalizedAdminUserId =
    normalizeText(adminUserId);

  const normalizedOrderId =
    normalizeText(orderId);

  const normalizedNextStatus =
    normalizeText(nextStatus);

  const normalizedNote =
    normalizeText(note);

  if (
    !normalizedAdminUserId ||
    !normalizedOrderId ||
    normalizedOrderId.includes('/') ||
    !normalizedNextStatus
  ) {
    throw createRepositoryError(
      ORDER_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid admin fulfilment transaction input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const orderRef = db
    .collection('orders')
    .doc(normalizedOrderId);

  return db.runTransaction(
    async (transaction) => {
      const orderSnapshot =
        await transaction.get(orderRef);

      const orderData =
        orderSnapshot.exists
          ? orderSnapshot.data()
          : null;

      const nowIso =
        typeof dependencies.nowIso ===
        'function'
          ? dependencies.nowIso()
          : new Date().toISOString();

      const plan =
        buildAdminFulfilmentPlan({
          adminUserId:
            normalizedAdminUserId,
          orderId:
            normalizedOrderId,
          nextStatus:
            normalizedNextStatus,
          note:
            normalizedNote,
          orderData,
          nowIso,
        });

      const timestamp =
        serverTimestamp();

      transaction.update(
        orderRef,
        {
          ...plan.orderUpdate,
          statusUpdatedAt: timestamp,
          updatedAt: timestamp,
        }
      );

      return Object.freeze({
        transitioned: true,
        orderId: orderRef.id,
        previousStatus:
          plan.previousStatus,
        nextStatus:
          plan.nextStatus,
        order: Object.freeze({
          ...orderData,
          ...plan.orderUpdate,
          id: orderRef.id,
        }),
      });
    }
  );
}

module.exports = {
  ORDER_REPOSITORY_ERROR,
  createOrderWithTransaction,
  cancelCustomerOrderWithTransaction,
  transitionAdminOrderWithTransaction,
};
