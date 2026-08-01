'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MAX_ITEM_QUANTITY,
  MAX_ORDER_LINES,
  validateCreateOrderInput,
} = require('../src/validators/order.validator');

function createValidPayload() {
  return {
    customer: {
      name: 'Ashok Kumar',
      phone: '9876543210',
      address: {
        house: '1-2',
        street: 'Main Road',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pin: '517501',
      },
    },
    items: [
      {
        productId: 'product-test-1',
        quantity: 2,
      },
    ],
    idempotencyKey: 'checkout-test-key-0001',
  };
}

test('accepts a valid COD order and applies the default payment method', () => {
  const result = validateCreateOrderInput(
    createValidPayload()
  );

  assert.equal(result.error, undefined);
  assert.equal(result.value.paymentMethod, 'cod');
  assert.equal(result.value.items[0].quantity, 2);
});

test('rejects client-controlled order totals and statuses', () => {
  const forbiddenFields = [
    'subtotal',
    'shippingCharge',
    'total',
    'paymentStatus',
    'status',
  ];

  for (const field of forbiddenFields) {
    const result = validateCreateOrderInput({
      ...createValidPayload(),
      [field]: field === 'status' ? 'Paid' : 1,
    });

    assert.ok(result.error, `${field} must be rejected`);
  }
});

test('rejects client-controlled product snapshot fields', () => {
  const forbiddenFields = [
    'price',
    'stock',
    'name',
    'sku',
  ];

  for (const field of forbiddenFields) {
    const payload = createValidPayload();

    payload.items[0][field] =
      field === 'name' || field === 'sku'
        ? 'tampered'
        : 1;

    const result = validateCreateOrderInput(payload);

    assert.ok(result.error, `${field} must be rejected`);
  }
});

test('rejects duplicate product IDs', () => {
  const payload = createValidPayload();

  payload.items.push({
    productId: 'product-test-1',
    quantity: 1,
  });

  const result = validateCreateOrderInput(payload);

  assert.ok(result.error);
});

test('enforces item quantity limits', () => {
  for (const quantity of [
    0,
    -1,
    MAX_ITEM_QUANTITY + 1,
    1.5,
  ]) {
    const payload = createValidPayload();
    payload.items[0].quantity = quantity;

    const result = validateCreateOrderInput(payload);

    assert.ok(
      result.error,
      `quantity ${quantity} must be rejected`
    );
  }
});

test('validates Indian phone number and PIN code', () => {
  const invalidPhone = createValidPayload();
  invalidPhone.customer.phone = '1234567890';

  const invalidPin = createValidPayload();
  invalidPin.customer.address.pin = '12345';

  assert.ok(
    validateCreateOrderInput(invalidPhone).error
  );

  assert.ok(
    validateCreateOrderInput(invalidPin).error
  );
});

test('enforces product ID and order-line limits', () => {
  const invalidProductId = createValidPayload();
  invalidProductId.items[0].productId =
    'products/product-test-1';

  assert.ok(
    validateCreateOrderInput(invalidProductId).error
  );

  const excessiveLines = createValidPayload();

  excessiveLines.items = Array.from(
    { length: MAX_ORDER_LINES + 1 },
    (_, index) => ({
      productId: `product-${index + 1}`,
      quantity: 1,
    })
  );

  assert.ok(
    validateCreateOrderInput(excessiveLines).error
  );
});


test('requires a valid checkout idempotency key', () => {
  const missingKey = createValidPayload();
  delete missingKey.idempotencyKey;

  assert.ok(
    validateCreateOrderInput(missingKey).error
  );

  for (const idempotencyKey of [
    'short',
    'invalid key with spaces',
    '/invalid-key-0000001',
    'invalid/key-0000001',
  ]) {
    const payload = createValidPayload();
    payload.idempotencyKey = idempotencyKey;

    assert.ok(
      validateCreateOrderInput(payload).error,
      `${idempotencyKey} must be rejected`
    );
  }
});
