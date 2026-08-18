import test from "node:test";
import assert from "node:assert/strict";

import {
  PUBLIC_PROVENANCE_ERROR,
  fetchPublicProvenance,
} from "../src/services/publicProvenance.js";

function createPublishedDocument() {
  return {
    publicId:
      "pub-001",

    product: {
      sku:
        "SKU-001",
      name:
        "Handloom Silk Saree",
    },

    artisan: {
      code:
        "ART-0001",
      name:
        "Lakshmi Weaver",
    },

    material:
      "Pure Silk",

    weaveTechnique:
      "Handloom Ikat",

    loomType:
      "Pit Loom",

    origin: {
      village:
        "Pochampally",
      district:
        "Yadadri Bhuvanagiri",
      state:
        "Telangana",
      country:
        "India",
    },
  };
}

test(
  "reads sanitized public provenance by exact public document ID",
  async () => {
    let capturedPublicId = null;

    const result =
      await fetchPublicProvenance(
        "  pub-001  ",
        {
          async readPublicDocument(
            publicId
          ) {
            capturedPublicId =
              publicId;

            return createPublishedDocument();
          },
        }
      );

    assert.equal(
      capturedPublicId,
      "pub-001"
    );

    assert.equal(
      result.publicId,
      "pub-001"
    );

    assert.equal(
      result.product.name,
      "Handloom Silk Saree"
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );
  }
);

test(
  "rejects invalid public provenance ID before Firestore access",
  async () => {
    let readCalled = false;

    for (const publicId of [
      "",
      "bad/id",
      "x".repeat(129),
    ]) {
      await assert.rejects(
        () =>
          fetchPublicProvenance(
            publicId,
            {
              async readPublicDocument() {
                readCalled = true;
                return null;
              },
            }
          ),
        (error) =>
          error.code ===
          PUBLIC_PROVENANCE_ERROR
            .INVALID_PUBLIC_ID
      );
    }

    assert.equal(
      readCalled,
      false
    );
  }
);

test(
  "maps unavailable public provenance to generic not found",
  async () => {
    await assert.rejects(
      () =>
        fetchPublicProvenance(
          "pub-001",
          {
            async readPublicDocument() {
              return null;
            },
          }
        ),
      (error) =>
        error.code ===
          PUBLIC_PROVENANCE_ERROR
            .NOT_FOUND &&
        error.message ===
          "Provenance verification was not found."
    );
  }
);

test(
  "rejects malformed or mismatched public provenance documents",
  async () => {
    const invalidDocuments = [
      null,
      {
        publicId:
          "different-public-id",
      },
      {
        ...createPublishedDocument(),
        artisan: null,
      },
      {
        ...createPublishedDocument(),
        material: 123,
      },
    ];

    for (
      const documentData of
      invalidDocuments.slice(1)
    ) {
      await assert.rejects(
        () =>
          fetchPublicProvenance(
            "pub-001",
            {
              async readPublicDocument() {
                return documentData;
              },
            }
          ),
        (error) =>
          error.code ===
          PUBLIC_PROVENANCE_ERROR
            .INVALID_RESPONSE
      );
    }
  }
);

test(
  "maps Firestore read failures to generic request failed",
  async () => {
    await assert.rejects(
      () =>
        fetchPublicProvenance(
          "pub-001",
          {
            async readPublicDocument() {
              throw new Error(
                "internal firestore error"
              );
            },
          }
        ),
      (error) =>
        error.code ===
          PUBLIC_PROVENANCE_ERROR
            .REQUEST_FAILED &&
        error.message ===
          "Provenance verification request failed."
    );
  }
);

test(
  "rejects invalid public provenance reader dependency",
  async () => {
    await assert.rejects(
      () =>
        fetchPublicProvenance(
          "pub-001",
          {
            readPublicDocument:
              "not-a-function",
          }
        ),
      TypeError
    );
  }
);
