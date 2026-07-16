const { db, admin } = require("../config/firebase");
const findBySku = async (sku) => {
  const snapshot = await db.collection("products").where("sku", "==", sku).get();
  return snapshot.empty ? null : snapshot.docs[0].data();
};
const createProductWithTransaction = async (productData, adminUid) => {
  const batch = db.batch();
  const productRef = db.collection("products").doc();
  const data = { id: productRef.id, ...productData, adminUid, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  batch.set(productRef, data);
  await batch.commit();
  return data;
};
module.exports = { findBySku, createProductWithTransaction };
