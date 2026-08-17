'use strict';

const express = require('express');

const {
  reconcileCapturedRazorpayWebhook,
} = require('../services/paymentWebhook.service');

function createRazorpayWebhookRouter(
  dependencies = {}
) {
  const router = express.Router();

  const reconcileWebhook =
    dependencies.reconcileWebhook ||
    reconcileCapturedRazorpayWebhook;

  if (
    typeof reconcileWebhook !==
    'function'
  ) {
    throw new TypeError(
      'Razorpay webhook reconciliation dependency is invalid.'
    );
  }

  router.post(
    '/',
    express.raw({
      type: 'application/json',
      limit: '256kb',
    }),
    async (req, res) => {
      try {
        const result =
          await reconcileWebhook({
            rawBody: req.body,
            signature:
              req.get(
                'x-razorpay-signature'
              ) || '',
            eventId:
              req.get(
                'x-razorpay-event-id'
              ) || '',
          });

        return res.status(200).json({
          success: true,
          data: {
            received: true,
            processed:
              result?.processed === true,
            finalized:
              result?.finalized === true,
            orderId:
              result?.orderId || null,
          },
        });
      } catch (error) {
        const code =
          typeof error?.code ===
          'string'
            ? error.code
            : '';

        const clientError =
          code.startsWith(
            'RAZORPAY_WEBHOOK_'
          );

        return res
          .status(
            clientError
              ? 400
              : 500
          )
          .json({
            success: false,
            error: {
              code:
                code ||
                'RAZORPAY_WEBHOOK_INTERNAL_ERROR',
              message:
                clientError
                  ? 'Razorpay webhook request was rejected.'
                  : 'Razorpay webhook processing failed.',
            },
          });
      }
    }
  );

  return router;
}

module.exports = {
  createRazorpayWebhookRouter,
};
