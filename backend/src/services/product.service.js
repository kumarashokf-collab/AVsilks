const productRepo = require("../repositories/product.repository");
const createProduct = async (data, adminUid) => {
  const existingProduct = await productRepo.findBySku(data.sku);
  if (existingProduct) { throw new Error("Product with this SKU already exists"); }
  const calculatedStock = data.stock || 0;
  const productData = { ...data, stock: calculatedStock, createdAt: new Date().toISOString() };
  return await productRepo.createProductWithTransaction(productData, adminUid);
};
module.exports = { createProduct };
