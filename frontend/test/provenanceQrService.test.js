'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVENANCE_QR_ERROR,
  buildPublicProvenanceUrl,
  generatePublicProvenanceQrDataUrl,
} from '../src/services/provenanceQr.js';

test(
  'builds same-origin public provenance verification URL',
  () => {
    const url =
      buildPublicProvenanceUrl(
        '  pub-001  ',
        'https://handloom.example.gov/'
      );

    assert.equal(
      url,
      'https://handloom.example.gov/provenance/pub-001'
    );
  }
);

test(
  'URL-encodes the opaque public provenance identifier',
  () => {
    const url =
      buildPublicProvenanceUrl(
        'PUB 001',
        'https://example.org'
      );

    assert.equal(
      url,
      'https://example.org/provenance/PUB%20001'
    );
  }
);

test(
  'rejects invalid public provenance identifiers',
  () => {
    for (const publicId of [
      '',
      '   ',
      'bad/id',
      'x'.repeat(129),
    ]) {
      assert.throws(
        () =>
          buildPublicProvenanceUrl(
            publicId,
            'https://example.org'
          ),
        (error) =>
          error.code ===
          PROVENANCE_QR_ERROR
            .INVALID_PUBLIC_ID
      );
    }
  }
);

test(
  'rejects unsafe or invalid application origins',
  () => {
    for (const origin of [
      '',
      'javascript:alert(1)',
      'ftp://example.org',
      'https://user:pass@example.org',
    ]) {
      assert.throws(
        () =>
          buildPublicProvenanceUrl(
            'pub-001',
            origin
          ),
        (error) =>
          error.code ===
          PROVENANCE_QR_ERROR
            .INVALID_ORIGIN
      );
    }
  }
);

test(
  'generates a PNG data URL containing only the public verification URL',
  async () => {
    let capturedText = null;
    let capturedOptions = null;

    const result =
      await generatePublicProvenanceQrDataUrl(
        'pub-001',
        {
          origin:
            'https://handloom.example.gov',

          async toDataURL(
            text,
            options
          ) {
            capturedText =
              text;

            capturedOptions =
              options;

            return (
              'data:image/png;base64,' +
              'VEVTVF9RUl9EQVRB'
            );
          },
        }
      );

    assert.equal(
      capturedText,
      'https://handloom.example.gov/provenance/pub-001'
    );

    assert.deepEqual(
      capturedOptions,
      {
        errorCorrectionLevel:
          'M',

        margin:
          2,

        width:
          512,

        type:
          'image/png',
      }
    );

    assert.equal(
      result,
      'data:image/png;base64,VEVTVF9RUl9EQVRB'
    );
  }
);

test(
  'rejects malformed QR generator output and invalid dependencies',
  async () => {
    await assert.rejects(
      () =>
        generatePublicProvenanceQrDataUrl(
          'pub-001',
          {
            origin:
              'https://example.org',

            async toDataURL() {
              return 'not-a-png-data-url';
            },
          }
        ),
      (error) =>
        error.code ===
        PROVENANCE_QR_ERROR
          .INVALID_QR_OUTPUT
    );

    await assert.rejects(
      () =>
        generatePublicProvenanceQrDataUrl(
          'pub-001',
          {
            origin:
              'https://example.org',

            toDataURL:
              'not-a-function',
          }
        ),
      TypeError
    );
  }
);
