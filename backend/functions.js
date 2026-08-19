"use strict";

const {
  onRequest,
} = require("firebase-functions/v2/https");

const {
  defineSecret,
} = require("firebase-functions/params");

const razorpayKeyId =
  defineSecret("RAZORPAY_KEY_ID");

const razorpayKeySecret =
  defineSecret("RAZORPAY_KEY_SECRET");

const razorpayWebhookSecret =
  defineSecret("RAZORPAY_WEBHOOK_SECRET");

const app = require("./app");

const API_OPTIONS = Object.freeze({
  region: "asia-south1",
  maxInstances: 2,
  cors: false,
  secrets: [
    razorpayKeyId,
    razorpayKeySecret,
    razorpayWebhookSecret,
  ],
});

exports.api = onRequest(
  API_OPTIONS,
  app
);
