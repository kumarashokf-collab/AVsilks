'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const {
  createRazorpayWebhookRouter,
} = require('../src/routes/razorpayWebhook.routes');

const RAW_BODY = Buffer.from(
  '{ "event" : "payment.captured", "test" : true }',
  'utf8'
);

const SIGNATURE =
  'a'.repeat(64);

const EVENT_ID =
  'event_test1234567890';

function startServer(router) {
  return new Promise((resolve) => {
    const app = express();

    app.use(
      '/api/payments/razorpay/webhook',
      router
    );

    const server = app.listen(
      0,
      '127.0.0.1',
      () => {
        resolve(server);
      }
    );
  });
}

function postRaw(server) {
  return new Promise(
    (resolve, reject) => {
      const address =
        server.address();

      const request = http.request(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path:
            '/api/payments/razorpay/webhook',
          method: 'POST',
          headers: {
            'content-type':
              'application/json',
            'content-length':
              RAW_BODY.length,
            'x-razorpay-signature':
              SIGNATURE,
            'x-razorpay-event-id':
              EVENT_ID,
          },
        },
        (response) => {
          const chunks = [];

          response.on(
            'data',
            (chunk) => {
              chunks.push(chunk);
            }
          );

          response.on(
            'end',
            () => {
              resolve({
                statusCode:
                  response.statusCode,
                body: Buffer.concat(
                  chunks
                ).toString('utf8'),
              });
            }
          );
        }
      );

      request.on(
        'error',
        reject
      );

      request.end(RAW_BODY);
    }
  );
}

test('passes exact raw webhook Buffer and Razorpay headers to reconciliation', async (t) => {
  let received = null;

  const router =
    createRazorpayWebhookRouter({
      reconcileWebhook:
        async (input) => {
          received = input;

          return {
            processed: true,
            finalized: true,
            orderId:
              'ord_' +
              'c'.repeat(48),
          };
        },
    });

  const server =
    await startServer(router);

  t.after(
    () =>
      new Promise(
        (resolve) =>
          server.close(resolve)
      )
  );

  const response =
    await postRaw(server);

  assert.equal(
    response.statusCode,
    200
  );

  assert.ok(
    Buffer.isBuffer(
      received.rawBody
    )
  );

  assert.deepEqual(
    received.rawBody,
    RAW_BODY
  );

  assert.equal(
    received.signature,
    SIGNATURE
  );

  assert.equal(
    received.eventId,
    EVENT_ID
  );

  const body =
    JSON.parse(response.body);

  assert.equal(
    body.success,
    true
  );

  assert.equal(
    body.data.received,
    true
  );
});

console.log(
  'RAZORPAY_WEBHOOK_ROUTE_RED_TEST_SETUP=PASS'
);
