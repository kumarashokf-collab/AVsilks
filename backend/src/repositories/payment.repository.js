'use strict';

const {
  FieldValue,
} = require('firebase-admin/firestore');

const {
  PAYMENT_METHOD,
  PAYMENT_LABEL,
  PAYMENT_STATUS,
} = require('../constants/orderPolicy');

const {
  INITIAL_ORDER_STATUS,
} = require('../constants/orderStatus');

const {
  sha256,
  createPaymentIdempotencyIdentity,
} = require('../services/orderIdempotency.service');

const {
  buildPaymentReservationPlan,
} = require('../services/paymentReservation.service');

const PAYMENT_REPOSITORY_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_DEPENDENCIES:
    'INVALID_DEPENDENCIES',
  IDEMPOTENCY_CONFLICT:
    'IDEMPOTENCY_CONFLICT',
  SESSION_NOT_FOUND:
    'SESSION_NOT_FOUND',
  SESSION_MISMATCH:
    'SESSION_MISMATCH',
  RAZORPAY_ORDER_CONFLICT:
    'RAZORPAY_ORDER_CONFLICT',
  PAYMENT_REPLAY_CONFLICT:
    'PAYMENT_REPLAY_CONFLICT',
  ORDER_CONFLICT:
    'ORDER_CONFLICT',
  SESSION_NOT_RELEASABLE:
    'SESSION_NOT_RELEASABLE',
  SESSION_NOT_VERIFIABLE:
    'SESSION_NOT_VERIFIABLE',
  SESSION_AMBIGUOUS:
    'SESSION_AMBIGUOUS',
  WEBHOOK_EVENT_CONFLICT:
    'WEBHOOK_EVENT_CONFLICT',
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

function resolveDependencies(
  dependencies = {}
) {
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
    typeof FieldValue?.serverTimestamp !==
      'function'
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
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

function resolveReservationTimes(
  dependencies = {}
) {
  const nowIso =
    typeof dependencies.nowIso === 'function'
      ? dependencies.nowIso()
      : new Date().toISOString();

  if (
    typeof dependencies.expiresAtIso ===
    'function'
  ) {
    return {
      nowIso,
      expiresAtIso:
        dependencies.expiresAtIso(),
    };
  }

  const nowMs = Date.parse(nowIso);

  if (!Number.isFinite(nowMs)) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Payment reservation time is invalid.'
    );
  }

  return {
    nowIso,
    expiresAtIso: new Date(
      nowMs + 15 * 60 * 1000
    ).toISOString(),
  };
}

async function createPaymentSessionWithTransaction(
  {
    userId,
    idempotencyKey,
    customer,
    items,
  },
  dependencies = {}
) {
  const normalizedUserId =
    normalizeText(userId);

  if (
    !normalizedUserId ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid payment transaction input is required.'
    );
  }

  const idempotencyIdentity =
    createPaymentIdempotencyIdentity({
      userId: normalizedUserId,
      idempotencyKey,
      customer,
      items,
      paymentMethod:
        PAYMENT_METHOD.RAZORPAY,
    });

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const paymentSessionRef = db
    .collection('paymentSessions')
    .doc(
      idempotencyIdentity.paymentSessionId
    );

  const productEntries = items.map(
    (item) => {
      const productId =
        normalizeText(item?.productId);

      return {
        productId,
        ref: db
          .collection('products')
          .doc(productId),
      };
    }
  );

  return db.runTransaction(
    async (transaction) => {
      const existingSessionSnapshot =
        await transaction.get(
          paymentSessionRef
        );

      if (existingSessionSnapshot.exists) {
        const existingSession =
          existingSessionSnapshot.data() ||
          {};

        const sameRequest =
          existingSession.userId ===
            normalizedUserId &&
          existingSession
            .idempotencyKeyHash ===
            idempotencyIdentity
              .idempotencyKeyHash &&
          existingSession
            .requestFingerprint ===
            idempotencyIdentity
              .requestFingerprint;

        if (!sameRequest) {
          throw createRepositoryError(
            PAYMENT_REPOSITORY_ERROR
              .IDEMPOTENCY_CONFLICT,
            'Idempotency key was already used for another payment request.'
          );
        }

        return Object.freeze({
          created: false,
          paymentSessionId:
            paymentSessionRef.id,
          amountPaise:
            existingSession.amountPaise,
          currency:
            existingSession.currency,
          paymentStatus:
            existingSession.paymentStatus,
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

      const {
        nowIso,
        expiresAtIso,
      } = resolveReservationTimes(
        dependencies
      );

      const plan =
        buildPaymentReservationPlan({
          userId: normalizedUserId,
          customer,
          requestedItems: items,
          productRecords,
          paymentSessionId:
            idempotencyIdentity
              .paymentSessionId,
          idempotencyIdentity,
          nowIso,
          expiresAtIso,
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

      transaction.set(
        paymentSessionRef,
        {
          ...plan.sessionDocument,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      );

      return Object.freeze({
        created: true,
        paymentSessionId:
          plan.paymentSessionId,
        amountPaise:
          plan.amountPaise,
        currency: plan.currency,
        paymentStatus:
          plan.sessionDocument
            .paymentStatus,
      });
    }
  );
}


async function bindRazorpayOrderWithTransaction(
  {
    paymentSessionId,
    userId,
    amountPaise,
    currency,
    razorpayOrderId,
    receipt,
  },
  dependencies = {}
) {
  const normalizedPaymentSessionId =
    normalizeText(paymentSessionId);

  const normalizedUserId =
    normalizeText(userId);

  const normalizedCurrency =
    normalizeText(currency);

  const normalizedRazorpayOrderId =
    normalizeText(razorpayOrderId);

  const normalizedReceipt =
    normalizeText(receipt);

  if (
    !/^paysess_[A-Za-z0-9_-]+$/.test(
      normalizedPaymentSessionId
    ) ||
    !normalizedUserId ||
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    !normalizedCurrency ||
    !/^order_[A-Za-z0-9_-]+$/.test(
      normalizedRazorpayOrderId
    ) ||
    !/^avp_[a-f0-9]{32}$/.test(
      normalizedReceipt
    )
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid Razorpay binding input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const paymentSessionRef = db
    .collection('paymentSessions')
    .doc(normalizedPaymentSessionId);

  return db.runTransaction(
    async (transaction) => {
      const snapshot =
        await transaction.get(
          paymentSessionRef
        );

      if (!snapshot.exists) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_NOT_FOUND,
          'Payment session was not found.'
        );
      }

      const session =
        snapshot.data() || {};

      const trustedSessionMatches =
        session.userId ===
          normalizedUserId &&
        session.amountPaise ===
          amountPaise &&
        session.currency ===
          normalizedCurrency &&
        session.paymentStatus ===
          PAYMENT_STATUS.PENDING_PAYMENT;

      if (!trustedSessionMatches) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_MISMATCH,
          'Payment session does not match trusted payment data.'
        );
      }

      const existingOrderId =
        normalizeText(
          session.razorpayOrderId
        );

      const existingReceipt =
        normalizeText(
          session.razorpayReceipt
        );

      if (
        existingOrderId ||
        existingReceipt
      ) {
        const sameBinding =
          existingOrderId ===
            normalizedRazorpayOrderId &&
          existingReceipt ===
            normalizedReceipt;

        if (!sameBinding) {
          throw createRepositoryError(
            PAYMENT_REPOSITORY_ERROR
              .RAZORPAY_ORDER_CONFLICT,
            'Payment session is already bound to a different Razorpay order.'
          );
        }

        return Object.freeze({
          bound: false,
          paymentSessionId:
            paymentSessionRef.id,
          razorpayOrderId:
            existingOrderId,
        });
      }

      transaction.update(
        paymentSessionRef,
        {
          razorpayOrderId:
            normalizedRazorpayOrderId,
          razorpayReceipt:
            normalizedReceipt,
          updatedAt:
            serverTimestamp(),
        }
      );

      return Object.freeze({
        bound: true,
        paymentSessionId:
          paymentSessionRef.id,
        razorpayOrderId:
          normalizedRazorpayOrderId,
      });
    }
  );
}


async function finalizeRazorpayPaymentWithTransaction(
  {
    paymentSessionId,
    userId,
    razorpayOrderId,
    razorpayPaymentId,
    amountPaise,
    currency,
    webhookEventId = '',
  },
  dependencies = {}
) {
  const normalizedSessionId =
    normalizeText(paymentSessionId);

  const normalizedUserId =
    normalizeText(userId);

  const normalizedOrderId =
    normalizeText(razorpayOrderId);

  const normalizedPaymentId =
    normalizeText(razorpayPaymentId);

  const normalizedCurrency =
    normalizeText(currency);

  const normalizedWebhookEventId =
    normalizeText(webhookEventId);

  if (
    !/^paysess_[A-Za-z0-9_-]+$/.test(
      normalizedSessionId
    ) ||
    !normalizedUserId ||
    !/^order_[A-Za-z0-9_-]+$/.test(
      normalizedOrderId
    ) ||
    !/^pay_[A-Za-z0-9_-]+$/.test(
      normalizedPaymentId
    ) ||
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    !normalizedCurrency ||
    (
      normalizedWebhookEventId &&
      (
        normalizedWebhookEventId.length > 200 ||
        normalizedWebhookEventId.includes('/') ||
        /[\r\n]/.test(
          normalizedWebhookEventId
        )
      )
    )
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid payment finalization input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const sessionRef = db
    .collection('paymentSessions')
    .doc(normalizedSessionId);

  const claimRef = db
    .collection('paymentClaims')
    .doc(normalizedPaymentId);

  const webhookEventRef =
    normalizedWebhookEventId
      ? db
          .collection('webhookEvents')
          .doc(normalizedWebhookEventId)
      : null;

  return db.runTransaction(
    async (transaction) => {
      const sessionSnapshot =
        await transaction.get(sessionRef);

      if (!sessionSnapshot.exists) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_NOT_FOUND,
          'Payment session was not found.'
        );
      }

      const session =
        sessionSnapshot.data() || {};

      const baseSessionMatches =
        session.userId ===
          normalizedUserId &&
        session.amountPaise ===
          amountPaise &&
        session.currency ===
          normalizedCurrency &&
        session.paymentMethod ===
          PAYMENT_METHOD.RAZORPAY &&
        session.razorpayOrderId ===
          normalizedOrderId;

      if (!baseSessionMatches) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_MISMATCH,
          'Verified payment does not match the trusted payment session.'
        );
      }

      const isAlreadyPaid =
        session.paymentStatus ===
          PAYMENT_STATUS.PAID;

      const isPending =
        session.paymentStatus ===
          PAYMENT_STATUS.PENDING_PAYMENT;

      if (!isAlreadyPaid && !isPending) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_MISMATCH,
          'Payment session is not finalizable.'
        );
      }

      let webhookEventSnapshot = null;

      if (webhookEventRef) {
        webhookEventSnapshot =
          await transaction.get(
            webhookEventRef
          );

        if (webhookEventSnapshot.exists) {
          const existingWebhookEvent =
            webhookEventSnapshot.data() || {};

          const sameWebhookEvent =
            existingWebhookEvent.eventId ===
              normalizedWebhookEventId &&
            existingWebhookEvent.paymentSessionId ===
              normalizedSessionId &&
            existingWebhookEvent.razorpayOrderId ===
              normalizedOrderId &&
            existingWebhookEvent.razorpayPaymentId ===
              normalizedPaymentId;

          if (!sameWebhookEvent) {
            throw createRepositoryError(
              PAYMENT_REPOSITORY_ERROR
                .WEBHOOK_EVENT_CONFLICT,
              'Webhook event ID is already associated with another payment.'
            );
          }

          if (!isAlreadyPaid) {
            throw createRepositoryError(
              PAYMENT_REPOSITORY_ERROR
                .SESSION_MISMATCH,
              'Existing webhook event is inconsistent with payment session state.'
            );
          }
        }
      }

      const deterministicOrderId =
        `ord_${sha256(
          `razorpay-paid-order\n${normalizedSessionId}`
        ).slice(0, 48)}`;

      const finalOrderId =
        isAlreadyPaid
          ? normalizeText(
              session.finalizedOrderId
            )
          : deterministicOrderId;

      if (
        !/^ord_[a-f0-9]{48}$/.test(
          finalOrderId
        )
      ) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_MISMATCH,
          'Finalized order identity is invalid.'
        );
      }

      const orderRef = db
        .collection('orders')
        .doc(finalOrderId);

      const claimSnapshot =
        await transaction.get(claimRef);

      if (claimSnapshot.exists) {
        const claim =
          claimSnapshot.data() || {};

        const sameClaim =
          claim.paymentSessionId ===
            normalizedSessionId &&
          claim.orderId ===
            finalOrderId &&
          claim.razorpayPaymentId ===
            normalizedPaymentId;

        if (!sameClaim) {
          throw createRepositoryError(
            PAYMENT_REPOSITORY_ERROR
              .PAYMENT_REPLAY_CONFLICT,
            'Razorpay payment is already claimed by another payment session.'
          );
        }
      }

      const orderSnapshot =
        await transaction.get(orderRef);

      if (isAlreadyPaid) {
        const samePaidSession =
          session.razorpayPaymentId ===
            normalizedPaymentId &&
          session.finalizedOrderId ===
            finalOrderId;

        const existingOrder =
          orderSnapshot.exists
            ? orderSnapshot.data() || {}
            : null;

        const sameOrder =
          existingOrder &&
          existingOrder.userId ===
            normalizedUserId &&
          existingOrder.paymentStatus ===
            PAYMENT_STATUS.PAID &&
          existingOrder.razorpayPaymentId ===
            normalizedPaymentId;

        if (
          !samePaidSession ||
          !claimSnapshot.exists ||
          !sameOrder
        ) {
          throw createRepositoryError(
            PAYMENT_REPOSITORY_ERROR
              .SESSION_MISMATCH,
            'Existing paid payment state is inconsistent.'
          );
        }

        return Object.freeze({
          finalized: false,
          orderId: finalOrderId,
          paymentSessionId:
            normalizedSessionId,
          razorpayPaymentId:
            normalizedPaymentId,
        });
      }

      if (claimSnapshot.exists) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_MISMATCH,
          'Pending session already has a payment claim.'
        );
      }

      if (orderSnapshot.exists) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .ORDER_CONFLICT,
          'Finalized order already exists.'
        );
      }

      const nowIso =
        typeof dependencies.nowIso ===
        'function'
          ? dependencies.nowIso()
          : new Date().toISOString();

      const timestamp =
        serverTimestamp();

      const orderDocument = {
        id: finalOrderId,
        userId: normalizedUserId,
        customer: session.customer,
        customerName:
          normalizeText(
            session.customer?.name
          ),
        customerPhone:
          normalizeText(
            session.customer?.phone
          ),
        product: Array.isArray(session.items)
          ? session.items
              .map((item) =>
                normalizeText(item?.name)
              )
              .filter(Boolean)
              .join(', ')
          : '',
        items: Array.isArray(session.items)
          ? session.items
          : [],
        subtotal: session.subtotal,
        shippingCharge:
          session.shippingCharge,
        total: session.total,
        price: session.total,
        currency:
          normalizedCurrency,
        paymentMethod:
          PAYMENT_METHOD.RAZORPAY,
        payment:
          PAYMENT_LABEL.RAZORPAY,
        paymentStatus:
          PAYMENT_STATUS.PAID,
        status:
          INITIAL_ORDER_STATUS,
        cancelReason: '',
        paymentSessionId:
          normalizedSessionId,
        razorpayOrderId:
          normalizedOrderId,
        razorpayPaymentId:
          normalizedPaymentId,
        idempotencyKeyHash:
          session.idempotencyKeyHash,
        requestFingerprint:
          session.requestFingerprint,
        statusHistory: [
          {
            status:
              INITIAL_ORDER_STATUS,
            date: nowIso,
            note:
              'Razorpay payment verified and order placed successfully',
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
        paidAt: timestamp,
      };

      transaction.set(
        orderRef,
        orderDocument
      );

      if (
        webhookEventRef &&
        !webhookEventSnapshot?.exists
      ) {
        transaction.set(
          webhookEventRef,
          {
            eventId:
              normalizedWebhookEventId,
            paymentSessionId:
              normalizedSessionId,
            razorpayOrderId:
              normalizedOrderId,
            razorpayPaymentId:
              normalizedPaymentId,
            amountPaise,
            currency:
              normalizedCurrency,
            processedAt:
              timestamp,
          }
        );
      }

      transaction.set(
        claimRef,
        {
          razorpayPaymentId:
            normalizedPaymentId,
          razorpayOrderId:
            normalizedOrderId,
          paymentSessionId:
            normalizedSessionId,
          orderId:
            finalOrderId,
          userId:
            normalizedUserId,
          amountPaise,
          currency:
            normalizedCurrency,
          createdAt: timestamp,
        }
      );

      transaction.update(
        sessionRef,
        {
          paymentStatus:
            PAYMENT_STATUS.PAID,
          razorpayPaymentId:
            normalizedPaymentId,
          finalizedOrderId:
            finalOrderId,
          paidAt: timestamp,
          updatedAt: timestamp,
        }
      );

      return Object.freeze({
        finalized: true,
        orderId: finalOrderId,
        paymentSessionId:
          normalizedSessionId,
        razorpayPaymentId:
          normalizedPaymentId,
      });
    }
  );
}


async function releasePaymentReservationWithTransaction(
  {
    paymentSessionId,
    targetPaymentStatus,
  },
  dependencies = {}
) {
  const normalizedSessionId =
    normalizeText(paymentSessionId);

  const normalizedTargetStatus =
    normalizeText(targetPaymentStatus);

  const allowedTargetStatuses =
    new Set([
      PAYMENT_STATUS.EXPIRED,
      PAYMENT_STATUS.FAILED,
    ]);

  if (
    !/^paysess_[A-Za-z0-9_-]+$/.test(
      normalizedSessionId
    ) ||
    !allowedTargetStatuses.has(
      normalizedTargetStatus
    )
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid payment reservation release input is required.'
    );
  }

  const {
    db,
    serverTimestamp,
  } = resolveDependencies(dependencies);

  const sessionRef = db
    .collection('paymentSessions')
    .doc(normalizedSessionId);

  return db.runTransaction(
    async (transaction) => {
      const sessionSnapshot =
        await transaction.get(sessionRef);

      if (!sessionSnapshot.exists) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_NOT_FOUND,
          'Payment session was not found.'
        );
      }

      const session =
        sessionSnapshot.data() || {};

      if (
        session.reservationReleased === true &&
        session.paymentStatus ===
          normalizedTargetStatus
      ) {
        return Object.freeze({
          released: false,
          paymentSessionId:
            normalizedSessionId,
          paymentStatus:
            normalizedTargetStatus,
        });
      }

      const releasableStatus =
        session.paymentStatus ===
          PAYMENT_STATUS.PENDING_PAYMENT ||
        (
          session.paymentStatus ===
            normalizedTargetStatus &&
          session.reservationReleased !== true
        );

      if (!releasableStatus) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_NOT_RELEASABLE,
          'Payment reservation cannot be released from its current state.'
        );
      }

      if (
        !Array.isArray(session.items) ||
        session.items.length === 0
      ) {
        throw createRepositoryError(
          PAYMENT_REPOSITORY_ERROR
            .SESSION_NOT_RELEASABLE,
          'Payment reservation has no valid reserved items.'
        );
      }

      const seenProductIds =
        new Set();

      const productEntries =
        session.items.map((item) => {
          const productId =
            normalizeText(
              item?.productId
            );

          const quantity =
            item?.quantity;

          if (
            !productId ||
            productId.includes('/') ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            seenProductIds.has(productId)
          ) {
            throw createRepositoryError(
              PAYMENT_REPOSITORY_ERROR
                .SESSION_NOT_RELEASABLE,
              'Payment reservation contains invalid reserved items.'
            );
          }

          seenProductIds.add(productId);

          return {
            productId,
            quantity,
            ref: db
              .collection('products')
              .doc(productId),
          };
        });

      const productSnapshots =
        await Promise.all(
          productEntries.map(
            ({ ref }) =>
              transaction.get(ref)
          )
        );

      const releasePlans =
        productEntries.map(
          (entry, index) => {
            const snapshot =
              productSnapshots[index];

            const product =
              snapshot.exists
                ? snapshot.data() || {}
                : null;

            const currentStock =
              product?.stock;

            if (
              !product ||
              !Number.isInteger(
                currentStock
              ) ||
              currentStock < 0
            ) {
              throw createRepositoryError(
                PAYMENT_REPOSITORY_ERROR
                  .SESSION_NOT_RELEASABLE,
                'Reserved product stock cannot be safely restored.'
              );
            }

            const restoredStock =
              currentStock +
              entry.quantity;

            if (
              !Number.isSafeInteger(
                restoredStock
              )
            ) {
              throw createRepositoryError(
                PAYMENT_REPOSITORY_ERROR
                  .SESSION_NOT_RELEASABLE,
                'Restored product stock exceeds supported limits.'
              );
            }

            return {
              ...entry,
              restoredStock,
            };
          }
        );

      const timestamp =
        serverTimestamp();

      for (
        const plan
        of releasePlans
      ) {
        transaction.update(
          plan.ref,
          {
            stock:
              plan.restoredStock,
            updatedAt:
              timestamp,
          }
        );
      }

      transaction.update(
        sessionRef,
        {
          paymentStatus:
            normalizedTargetStatus,
          reservationReleased: true,
          reservationReleasedAt:
            timestamp,
          updatedAt:
            timestamp,
        }
      );

      return Object.freeze({
        released: true,
        paymentSessionId:
          normalizedSessionId,
        paymentStatus:
          normalizedTargetStatus,
      });
    }
  );
}


async function getPaymentSessionForVerification(
  {
    paymentSessionId,
    userId,
  },
  dependencies = {}
) {
  const normalizedSessionId =
    normalizeText(paymentSessionId);

  const normalizedUserId =
    normalizeText(userId);

  if (
    !/^paysess_[A-Za-z0-9_-]+$/.test(
      normalizedSessionId
    ) ||
    !normalizedUserId
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid payment verification session input is required.'
    );
  }

  let db = dependencies.db;

  if (
    !db ||
    typeof db.collection !== 'function'
  ) {
    const firebase =
      require('../config/firebase');

    db = firebase.db;
  }

  if (
    !db ||
    typeof db.collection !== 'function'
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore read dependency is invalid.'
    );
  }

  const sessionRef = db
    .collection('paymentSessions')
    .doc(normalizedSessionId);

  if (
    !sessionRef ||
    typeof sessionRef.get !== 'function'
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Payment session read dependency is invalid.'
    );
  }

  const snapshot =
    await sessionRef.get();

  if (!snapshot.exists) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_NOT_FOUND,
      'Payment session was not found.'
    );
  }

  const session =
    snapshot.data() || {};

  if (
    normalizeText(session.userId) !==
    normalizedUserId
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_MISMATCH,
      'Payment session does not belong to the authenticated user.'
    );
  }

  const paymentStatus =
    normalizeText(
      session.paymentStatus
    );

  const allowedStatuses =
    new Set([
      PAYMENT_STATUS.PENDING_PAYMENT,
      PAYMENT_STATUS.PAID,
    ]);

  if (
    !allowedStatuses.has(
      paymentStatus
    )
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_NOT_VERIFIABLE,
      'Payment session is not in a verifiable state.'
    );
  }

  const razorpayOrderId =
    normalizeText(
      session.razorpayOrderId
    );

  const amountPaise =
    session.amountPaise;

  const currency =
    normalizeText(
      session.currency
    );

  if (
    !/^order_[A-Za-z0-9_-]+$/.test(
      razorpayOrderId
    ) ||
    !Number.isSafeInteger(
      amountPaise
    ) ||
    amountPaise <= 0 ||
    !currency
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_MISMATCH,
      'Trusted payment session data is invalid.'
    );
  }

  return Object.freeze({
    paymentSessionId:
      normalizedSessionId,
    userId:
      normalizedUserId,
    razorpayOrderId,
    amountPaise,
    currency,
    paymentStatus,
  });
}


async function getPaymentSessionByRazorpayOrderId(
  razorpayOrderId,
  dependencies = {}
) {
  const normalizedOrderId =
    normalizeText(razorpayOrderId);

  if (
    !/^order_[A-Za-z0-9_-]+$/.test(
      normalizedOrderId
    )
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR.INVALID_INPUT,
      'Valid Razorpay order ID is required.'
    );
  }

  let db = dependencies.db;

  if (
    !db ||
    typeof db.collection !== 'function'
  ) {
    const firebase =
      require('../config/firebase');

    db = firebase.db;
  }

  if (
    !db ||
    typeof db.collection !== 'function'
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .INVALID_DEPENDENCIES,
      'Firestore read dependency is invalid.'
    );
  }

  const snapshot = await db
    .collection('paymentSessions')
    .where(
      'razorpayOrderId',
      '==',
      normalizedOrderId
    )
    .limit(2)
    .get();

  const docs =
    Array.isArray(snapshot?.docs)
      ? snapshot.docs
      : [];

  if (docs.length === 0) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_NOT_FOUND,
      'Payment session was not found.'
    );
  }

  if (docs.length > 1) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_AMBIGUOUS,
      'Multiple payment sessions matched the Razorpay order.'
    );
  }

  const document = docs[0];
  const session =
    document.data() || {};

  const paymentSessionId =
    normalizeText(document.id);

  const userId =
    normalizeText(session.userId);

  const storedOrderId =
    normalizeText(
      session.razorpayOrderId
    );

  const amountPaise =
    session.amountPaise;

  const currency =
    normalizeText(
      session.currency
    );

  const paymentStatus =
    normalizeText(
      session.paymentStatus
    );

  const allowedStatuses =
    new Set([
      PAYMENT_STATUS.PENDING_PAYMENT,
      PAYMENT_STATUS.PAID,
    ]);

  if (
    !/^paysess_[A-Za-z0-9_-]+$/.test(
      paymentSessionId
    ) ||
    !userId ||
    storedOrderId !==
      normalizedOrderId ||
    !Number.isSafeInteger(
      amountPaise
    ) ||
    amountPaise <= 0 ||
    !currency
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_MISMATCH,
      'Trusted webhook payment session data is invalid.'
    );
  }

  if (
    !allowedStatuses.has(
      paymentStatus
    )
  ) {
    throw createRepositoryError(
      PAYMENT_REPOSITORY_ERROR
        .SESSION_NOT_VERIFIABLE,
      'Payment session is not available for webhook reconciliation.'
    );
  }

  return Object.freeze({
    paymentSessionId,
    userId,
    razorpayOrderId:
      storedOrderId,
    amountPaise,
    currency,
    paymentStatus,
  });
}

module.exports = {
  PAYMENT_REPOSITORY_ERROR,
  createPaymentSessionWithTransaction,
  bindRazorpayOrderWithTransaction,
  finalizeRazorpayPaymentWithTransaction,
  releasePaymentReservationWithTransaction,
  getPaymentSessionForVerification,
  getPaymentSessionByRazorpayOrderId,
};
