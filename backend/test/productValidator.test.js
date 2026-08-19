'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const validatorPath = path.join(
  __dirname,
  '..',
  'src',
  'validators',
  'product.validator.js'
);

const validatorExists =
  fs.existsSync(validatorPath);

console.log(
  'PRODUCT_VALIDATOR_RED_TEST_SETUP=PASS'
);

test(
  'defines a dedicated strict product validator',
  () => {
    assert.equal(
      validatorExists,
      true,
      'product.validator.js must exist'
    );
  }
);

test(
  'accepts and normalizes the approved product create fields',
  { skip: !validatorExists },
  () => {
    const {
      validateCreateProductInput,
    } = require(validatorPath);

    const { value, error } =
      validateCreateProductInput({
        name: '  Local Handloom Saree  ',
        description: '  Handwoven silk saree  ',
        price: '3200',
        originalPrice: '4000',
        category: '  Silk  ',
        stock: '1',
        sku: '  e2e-handloom-001  ',
        offer: '20%',
        image:
          'https://example.com/saree.jpg',
        images: [
          'https://example.com/saree.jpg',
        ],
        featured: false,
        active: true,
      });

    assert.equal(error, undefined);
    assert.equal(
      value.name,
      'Local Handloom Saree'
    );
    assert.equal(value.price, 3200);
    assert.equal(value.originalPrice, 4000);
    assert.equal(value.stock, 1);
    assert.equal(
      value.sku,
      'E2E-HANDLOOM-001'
    );
  }
);

test(
  'rejects server-controlled and unknown product fields',
  { skip: !validatorExists },
  () => {
    const {
      validateCreateProductInput,
    } = require(validatorPath);

    for (const forbidden of [
      'id',
      'adminUid',
      'createdAt',
      'updatedAt',
      'stockStatus',
      'provenanceId',
    ]) {
      const payload = {
        name: 'Handloom Saree',
        description: 'Traditional saree',
        price: 3200,
        originalPrice: 4000,
        category: 'Silk',
        stock: 1,
        sku: 'SAFE-SKU-001',
        offer: '20%',
        image:
          'https://example.com/saree.jpg',
        images: [
          'https://example.com/saree.jpg',
        ],
        featured: false,
        active: true,
        [forbidden]: 'CLIENT_CONTROLLED',
      };

      const { error } =
        validateCreateProductInput(payload);

      assert.ok(
        error,
        forbidden + ' must be rejected'
      );
    }
  }
);

test(
  'rejects unsafe product price stock sku and image input',
  { skip: !validatorExists },
  () => {
    const {
      validateCreateProductInput,
    } = require(validatorPath);

    const base = {
      name: 'Handloom Saree',
      description: 'Traditional saree',
      price: 3200,
      originalPrice: 4000,
      category: 'Silk',
      stock: 1,
      sku: 'SAFE-SKU-001',
      offer: '20%',
      image:
        'https://example.com/saree.jpg',
      images: [
        'https://example.com/saree.jpg',
      ],
      featured: false,
      active: true,
    };

    const invalidCases = [
      { ...base, price: 0 },
      { ...base, price: -1 },
      { ...base, stock: -1 },
      { ...base, stock: 1.5 },
      { ...base, sku: '' },
      {
        ...base,
        image: 'javascript:alert(1)',
      },
      {
        ...base,
        images: Array(6).fill(
          'https://example.com/saree.jpg'
        ),
      },
    ];

    for (const payload of invalidCases) {
      const { error } =
        validateCreateProductInput(payload);

      assert.ok(
        error,
        'unsafe product input must fail'
      );
    }
  }
);
