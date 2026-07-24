const express = require('express');
const { createProduct, getProducts } = require('../controllers/product.controller');
const verifyAuth = require('../middleware/verifyAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { PERMISSIONS } = require('../constants/permissions');
const router = express.Router();

// డేటా యాడ్ చేయడానికి (POST)
 router.post(


  '/',
  verifyAuth,
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  createProduct
);
   // ఫ్రంట్-ఎండ్ నుండి డేటా తీసుకోవడానికి (GET)
router.get('/', getProducts);

module.exports = router;

