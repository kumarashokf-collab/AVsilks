'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEmptyArtisanForm,
  createEmptyProvenanceForm,
  getEligibleProvenanceProducts,
  buildArtisanCreatePayload,
  buildProvenanceCreatePayload,
} from '../src/services/provenanceSetupModel.js';

test(
  'creates independent empty artisan and provenance forms',
  () => {
    const artisanA =
      createEmptyArtisanForm();

    const artisanB =
      createEmptyArtisanForm();

    const provenanceA =
      createEmptyProvenanceForm();

    const provenanceB =
      createEmptyProvenanceForm();

    assert.deepEqual(
      artisanA,
      {
        artisanCode: '',
        displayName: '',
        craftType: '',
        village: '',
        district: '',
        state: '',
        country: 'India',
        loomType: '',
      }
    );

    assert.deepEqual(
      provenanceA,
      {
        productId: '',
        artisanId: '',
        material: '',
        weaveTechnique: '',
        loomType: '',
        village: '',
        district: '',
        state: '',
        country: 'India',
      }
    );

    assert.notEqual(
      artisanA,
      artisanB
    );

    assert.notEqual(
      provenanceA,
      provenanceB
    );
  }
);

test(
  'returns only safe products that are not already linked to provenance',
  () => {
    const products = [
      {
        id: 'p-002',
        name: 'Second Saree',
        sku: 'SKU-002',
      },
      {
        id: 'p-001',
        name: 'First Saree',
        sku: 'SKU-001',
      },
      {
        id: 'p-linked',
        name: 'Linked Saree',
        sku: 'SKU-003',
        provenanceId: 'prov-001',
      },
      {
        id: 'bad/product',
        name: 'Bad Product',
        sku: 'BAD',
      },
      null,
    ];

    const result =
      getEligibleProvenanceProducts(
        products
      );

    assert.deepEqual(
      result.map(
        (product) =>
          product.id
      ),
      [
        'p-001',
        'p-002',
      ]
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.equal(
      Object.isFrozen(result[0]),
      true
    );
  }
);

test(
  'builds normalized artisan create payload',
  () => {
    const payload =
      buildArtisanCreatePayload({
        artisanCode:
          ' art-001 ',

        displayName:
          ' Lakshmi Weaver ',

        craftType:
          ' Handloom Weaving ',

        village:
          ' Pochampally ',

        district:
          ' Yadadri Bhuvanagiri ',

        state:
          ' Telangana ',

        country:
          ' India ',

        loomType:
          ' Pit Loom ',
      });

    assert.deepEqual(
      payload,
      {
        artisanCode:
          'art-001',

        displayName:
          'Lakshmi Weaver',

        craftType:
          'Handloom Weaving',

        village:
          'Pochampally',

        district:
          'Yadadri Bhuvanagiri',

        state:
          'Telangana',

        country:
          'India',

        loomType:
          'Pit Loom',

        active:
          true,
      }
    );

    assert.equal(
      Object.isFrozen(payload),
      true
    );
  }
);

test(
  'builds normalized provenance create payload',
  () => {
    const payload =
      buildProvenanceCreatePayload({
        productId:
          ' product-001 ',

        artisanId:
          ' artisan-001 ',

        material:
          ' Pure Silk ',

        weaveTechnique:
          ' Handloom Ikat ',

        loomType:
          ' Pit Loom ',

        village:
          ' Pochampally ',

        district:
          ' Yadadri Bhuvanagiri ',

        state:
          ' Telangana ',

        country:
          ' India ',
      });

    assert.deepEqual(
      payload,
      {
        productId:
          'product-001',

        artisanId:
          'artisan-001',

        material:
          'Pure Silk',

        weaveTechnique:
          'Handloom Ikat',

        loomType:
          'Pit Loom',

        origin: {
          village:
            'Pochampally',

          district:
            'Yadadri Bhuvanagiri',

          state:
            'Telangana',

          country:
            'India',
        },
      }
    );

    assert.equal(
      Object.isFrozen(payload),
      true
    );

    assert.equal(
      Object.isFrozen(
        payload.origin
      ),
      true
    );
  }
);

test(
  'rejects unsafe or incomplete setup values before service calls',
  () => {
    assert.throws(
      () =>
        buildArtisanCreatePayload({
          artisanCode:
            'bad/code',

          displayName:
            'Lakshmi',

          craftType:
            'Weaving',

          village:
            'Village',

          district:
            'District',

          state:
            'State',

          country:
            'India',

          loomType:
            'Pit Loom',
        }),
      /invalid/i
    );

    assert.throws(
      () =>
        buildProvenanceCreatePayload({
          productId:
            'bad/product',

          artisanId:
            'artisan-001',

          material:
            'Silk',

          weaveTechnique:
            'Ikat',

          loomType:
            'Pit Loom',

          village:
            'Village',

          district:
            'District',

          state:
            'State',

          country:
            'India',
        }),
      /invalid/i
    );

    assert.throws(
      () =>
        buildProvenanceCreatePayload({
          productId:
            'product-001',

          artisanId:
            '',

          material:
            'Silk',

          weaveTechnique:
            'Ikat',

          loomType:
            'Pit Loom',

          village:
            'Village',

          district:
            'District',

          state:
            'State',

          country:
            'India',
        }),
      /invalid/i
    );

    assert.throws(
      () =>
        buildProvenanceCreatePayload({
          productId:
            'product-001',

          artisanId:
            'artisan-001',

          material:
            ' ',

          weaveTechnique:
            'Ikat',

          loomType:
            'Pit Loom',

          village:
            'Village',

          district:
            'District',

          state:
            'State',

          country:
            'India',
        }),
      /invalid/i
    );
  }
);
