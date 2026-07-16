const express = require('express');
const { createProduct, getProducts } = require('../controllers/product.controller');

const router = express.Router();

// డేటా యాడ్ చేయడానికి (POST)
router.post('/', createProduct);

// ఫ్రంట్-ఎండ్ నుండి డేటా తీసుకోవడానికి (GET)
router.get('/', getProducts);

module.exports = router;

