require("dotenv").config();const express = require("express");
const cors = require("cors");
const productRoutes = require("./src/routes/product.routes");
const { validateRbacConfiguration } = require("./src/constants/validateRbac");
const app = express();
const PORT = process.env.PORT || 8080;
const rbacStatus = validateRbacConfiguration();

console.log("RBAC:", rbacStatus);

console.log("RBAC configuration validated successfully.");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "AVsilks API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "Active" });
});

app.use("/api/products", productRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AVsilks API running on http://localhost:${PORT}`);
});
