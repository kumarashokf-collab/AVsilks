const productService = require('../services/product.service');
const { db } = require('../config/firebase'); 

const createProduct = async (req, res) => {
  try {
    const adminUid = req.user ? req.user.uid : 'admin_test';
    const product = await productService.createProduct(req.body, adminUid);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createProduct, getProducts };

