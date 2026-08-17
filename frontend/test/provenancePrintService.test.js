'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVENANCE_PRINT_ERROR,
  buildPrintableProvenanceTagModel,
} from '../src/services/provenancePrint.js';

function createPublishedProvenance() {
  return {
    id:
      'internal-prov-001',

    publicId:
      'PUB-001',

    status:
      'published',

    product: {
      sku:
        'AV-SILK-001',

      name:
        'Handloom Silk Saree',
    },

    artisan: {
      code:
        'ART-001',

      name:
        'Lakshmi Weaver',
    },

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
  };
}

test(
  'builds frozen printable tag using only public-safe provenance fields',
  () => {
    const model =
      buildPrintableProvenanceTagModel({
        brandName:
          'AV Silks',

        provenance:
          createPublishedProvenance(),

        qrDataUrl:
          'data:image/png;base64,VEVTVA==',

        origin:
          'https://handloom.example.gov',
      });

    assert.deepEqual(
      model,
      {
        brandName:
          'AV Silks',

        publicId:
          'PUB-001',

        verificationUrl:
          'https://handloom.example.gov/provenance/PUB-001',

        qrDataUrl:
          'data:image/png;base64,VEVTVA==',

        product: {
          sku:
            'AV-SILK-001',

          name:
            'Handloom Silk Saree',
        },

        artisan: {
          code:
            'ART-001',

          name:
            'Lakshmi Weaver',
        },

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
      Object.isFrozen(model),
      true
    );

    assert.equal(
      Object.hasOwn(model, 'id'),
      false
    );

    assert.equal(
      Object.hasOwn(model, 'status'),
      false
    );
  }
);

test(
  'trims printable text fields',
  () => {
    const provenance =
      createPublishedProvenance();

    provenance.product.name =
      '  Handloom Silk Saree  ';

    provenance.artisan.name =
      '  Lakshmi Weaver  ';

    const model =
      buildPrintableProvenanceTagModel({
        brandName:
          '  AV Silks  ',

        provenance,

        qrDataUrl:
          'data:image/png;base64,VEVTVA==',

        origin:
          'https://example.org',
      });

    assert.equal(
      model.brandName,
      'AV Silks'
    );

    assert.equal(
      model.product.name,
      'Handloom Silk Saree'
    );

    assert.equal(
      model.artisan.name,
      'Lakshmi Weaver'
    );
  }
);

test(
  'rejects draft and archived provenance for printable public tag',
  () => {
    for (const status of [
      'draft',
      'archived',
    ]) {
      const provenance =
        createPublishedProvenance();

      provenance.status =
        status;

      assert.throws(
        () =>
          buildPrintableProvenanceTagModel({
            brandName:
              'AV Silks',

            provenance,

            qrDataUrl:
              'data:image/png;base64,VEVTVA==',

            origin:
              'https://example.org',
          }),
        (error) =>
          error.code ===
          PROVENANCE_PRINT_ERROR
            .NOT_PUBLISHED
      );
    }
  }
);

test(
  'rejects malformed QR PNG data URL',
  () => {
    assert.throws(
      () =>
        buildPrintableProvenanceTagModel({
          brandName:
            'AV Silks',

          provenance:
            createPublishedProvenance(),

          qrDataUrl:
            'https://example.org/qr.png',

          origin:
            'https://example.org',
        }),
      (error) =>
        error.code ===
        PROVENANCE_PRINT_ERROR
          .INVALID_QR
    );
  }
);

test(
  'rejects malformed printable provenance data',
  () => {
    const provenance =
      createPublishedProvenance();

    provenance.artisan.name =
      '';

    assert.throws(
      () =>
        buildPrintableProvenanceTagModel({
          brandName:
            'AV Silks',

          provenance,

          qrDataUrl:
            'data:image/png;base64,VEVTVA==',

          origin:
            'https://example.org',
        }),
      (error) =>
        error.code ===
        PROVENANCE_PRINT_ERROR
          .INVALID_DATA
    );
  }
);

test(
  'rejects missing brand name',
  () => {
    assert.throws(
      () =>
        buildPrintableProvenanceTagModel({
          brandName:
            '   ',

          provenance:
            createPublishedProvenance(),

          qrDataUrl:
            'data:image/png;base64,VEVTVA==',

          origin:
            'https://example.org',
        }),
      (error) =>
        error.code ===
        PROVENANCE_PRINT_ERROR
          .INVALID_DATA
    );
  }
);
