"use strict";

const {
  onRequest,
} = require("firebase-functions/v2/https");

const app = require("./app");

const API_OPTIONS = Object.freeze({
  region: "asia-south1",
  maxInstances: 2,
});

exports.api = onRequest(
  API_OPTIONS,
  app
);
