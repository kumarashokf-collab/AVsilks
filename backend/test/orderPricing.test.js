'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateOrderTotals,
  toPaise,
  fromPaise,
} = require('../src/services/orderPricing.service');

test('charges standard shipping below ₹999', () => {
  assert.deepEqual(
    calculateOrderTotals([
      { price: 998, quantity: 1 },
    ]),
    {
      subtotal: 998,
      shippingCharge: 79,
      total: 1077,
      currency: 'INR',
    }
  );
});

test('provides free shipping from ₹999', () => {
  assert.deepEqual(
    calculateOrderTotals([
      { price: 999, quantity: 1 },
    ]),
    {
      subtotal: 999,
      shippingCharge: 0,
      total: 999,
      currency: 'INR',
    }
  );
});

test('calculates multiple order lines accurately', () => {
  assert.deepEqual(
    calculateOrderTotals([
      { price: 450, quantity: 2 },
      { price: 49.5, quantity: 2 },
    ]),
    {
      subtotal: 999,
      shippingCharge: 0,
      total: 999,
      currency: 'INR',
    }
  );
});

test('handles decimal currency through paise conversion', () => {
  assert.equal(toPaise(499.99, 'price'), 49999);
  assert.equal(fromPaise(49999), 499.99);

  assert.deepEqual(
    calculateOrderTotals([
      { price: 333.33, quantity: 3 },
    ]),
    {
      subtotal: 999.99,
      shippingCharge: 0,
      total: 999.99,
      currency: 'INR',
    }
  );
});

test('rejects invalid prices', () => {
  for (const price of [
    0,
    -1,
    'invalid',
    Infinity,
    null,
  ]) {
    assert.throws(() =>
      calculateOrderTotals([
        { price, quantity: 1 },
      ])
    );
  }
});

test('rejects invalid quantities', () => {
  for (const quantity of [
    0,
    -1,
    1.5,
    11,
    'invalid',
  ]) {
    assert.throws(() =>
      calculateOrderTotals([
        { price: 500, quantity },
      ])
    );
  }
});

test('rejects empty and excessive order lines', () => {
  assert.throws(() =>
    calculateOrderTotals([])
  );

  assert.throws(() =>
    calculateOrderTotals(
      Array.from(
        { length: 21 },
        (_, index) => ({
          price: 100,
          quantity: 1,
          productId: `product-${index + 1}`,
        })
      )
    )
  );
});

test('returns an immutable totals object', () => {
  const totals = calculateOrderTotals([
    { price: 999, quantity: 1 },
  ]);

  assert.equal(Object.isFrozen(totals), true);
});
