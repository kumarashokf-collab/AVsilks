'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_ITEM_ERROR,
  buildAuthoritativeOrderItem,
} = require('../src/services/orderItem.service');

function validProduct(overrides = {}) {
  return {
    name: 'AV Silk Saree',
    price: 499.5,
    stock: 5,
    sku: 'av-001',
    category: 'Silk',
    image: 'https://example.com/saree.jpg',
    active: true,
    ...overrides,
  };
}

test('builds an authoritative immutable product snapshot', () => {
  const item = buildAuthoritativeOrderItem({
    productId: 'saree-1',
    quantity: 2,
    productData: validProduct(),
  });

  assert.deepEqual(item, {
    id: 'saree-1',
    productId: 'saree-1',
    name: 'AV Silk Saree',
    sku: 'AV-001',
    category: 'Silk',
    image: 'https://example.com/saree.jpg',
    images: [],
    price: 499.5,
    quantity: 2,
    lineTotal: 999,
  });

  assert.equal(Object.isFrozen(item), true);
  assert.equal(Object.isFrozen(item.images), true);
});

test('prefers authoritative salePrice when available', () => {
  const item = buildAuthoritativeOrderItem({
    productId: 'saree-2',
    quantity: 1,
    productData: validProduct({
      price: 700,
      salePrice: 650,
    }),
  });

  assert.equal(item.price, 650);
  assert.equal(item.lineTotal, 650);
});

test('normalizes optional product snapshot fields', () => {
  const item = buildAuthoritativeOrderItem({
    productId: 'saree-3',
    quantity: 1,
    productData: validProduct({
      sku: '  av-003  ',
      category: '  Cotton  ',
      image: '',
      imageUrl: ' https://example.com/cotton.jpg ',
      images: [
        ' https://example.com/1.jpg ',
        '',
        null,
        'https://example.com/2.jpg',
      ],
    }),
  });

  assert.equal(item.sku, 'AV-003');
  assert.equal(item.category, 'Cotton');
  assert.equal(
    item.image,
    'https://example.com/cotton.jpg'
  );

  assert.deepEqual(item.images, [
    'https://example.com/1.jpg',
    'https://example.com/2.jpg',
  ]);
});

test('rejects unavailable and inactive products', () => {
  assert.throws(
    () =>
      buildAuthoritativeOrderItem({
        productId: 'missing-product',
        quantity: 1,
        productData: null,
      }),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.PRODUCT_NOT_FOUND
  );

  assert.throws(
    () =>
      buildAuthoritativeOrderItem({
        productId: 'inactive-product',
        quantity: 1,
        productData: validProduct({
          active: false,
        }),
      }),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.PRODUCT_INACTIVE
  );
});

test('rejects invalid product identity and quantity', () => {
  assert.throws(
    () =>
      buildAuthoritativeOrderItem({
        productId: 'products/saree-1',
        quantity: 1,
        productData: validProduct(),
      }),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.INVALID_PRODUCT_ID
  );

  for (const quantity of [0, -1, 1.5, 11]) {
    assert.throws(
      () =>
        buildAuthoritativeOrderItem({
          productId: 'saree-1',
          quantity,
          productData: validProduct(),
        }),
      (error) =>
        error.code ===
        ORDER_ITEM_ERROR.INVALID_QUANTITY
    );
  }
});

test('rejects invalid authoritative price and stock', () => {
  for (const price of [0, -1, '500', NaN]) {
    assert.throws(
      () =>
        buildAuthoritativeOrderItem({
          productId: 'saree-1',
          quantity: 1,
          productData: validProduct({ price }),
        }),
      (error) =>
        error.code ===
        ORDER_ITEM_ERROR.PRODUCT_INVALID_PRICE
    );
  }

  for (const stock of [-1, 1.5, '5']) {
    assert.throws(
      () =>
        buildAuthoritativeOrderItem({
          productId: 'saree-1',
          quantity: 1,
          productData: validProduct({ stock }),
        }),
      (error) =>
        error.code ===
        ORDER_ITEM_ERROR.PRODUCT_INVALID_STOCK
    );
  }
});

test('rejects quantity greater than live stock', () => {
  assert.throws(
    () =>
      buildAuthoritativeOrderItem({
        productId: 'limited-saree',
        quantity: 3,
        productData: validProduct({
          stock: 2,
        }),
      }),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.INSUFFICIENT_STOCK
  );
});

test('rejects invalid authoritative product name', () => {
  assert.throws(
    () =>
      buildAuthoritativeOrderItem({
        productId: 'saree-1',
        quantity: 1,
        productData: validProduct({
          name: '',
        }),
      }),
    (error) =>
      error.code ===
      ORDER_ITEM_ERROR.PRODUCT_INVALID_NAME
  );
});
