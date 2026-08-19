"use strict";

const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { getRateLimitKey } = require("./src/security/rateLimitKey");
const productRoutes = require("./src/routes/product.routes");
const {
  createOrderRouter,
} = require("./src/routes/order.routes");
const {
  createAuthRouter,
} = require("./src/routes/auth.routes");
const {
  createArtisanRouter,
} = require("./src/routes/artisan.routes");
const {
  createProvenanceRouter,
} = require("./src/routes/provenance.routes");
const {
  createPaymentRouter,
} = require("./src/routes/payment.routes");
const {
  createRazorpayWebhookRouter,
} = require("./src/routes/razorpayWebhook.routes");
const {
  validateRbacConfiguration,
} = require("./src/constants/validateRbac");

const app = express();
app.disable("x-powered-by");

const rbacStatus = validateRbacConfiguration();

console.log("RBAC:", rbacStatus);
console.log("RBAC configuration validated successfully.");

app.use(helmet());

app.use(
  "/api/payments/razorpay/webhook",
  createRazorpayWebhookRouter()
);

app.use(express.json());

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      },
    });
  },
});

app.use("/api", apiRateLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AVsilks API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Active",
  });
});

app.use("/api/auth", createAuthRouter());
app.use("/api/products", productRoutes);
app.use("/api/orders", createOrderRouter());
app.use("/api/artisans", createArtisanRouter());
app.use("/api/provenance", createProvenanceRouter());
app.use("/api/payments", createPaymentRouter());

module.exports = app;
