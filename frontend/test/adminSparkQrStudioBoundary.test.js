import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";

const here =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );

const frontendRoot =
  path.resolve(
    here,
    ".."
  );

const adminSource =
  fs.readFileSync(
    path.join(
      frontendRoot,
      "src",
      "pages",
      "Admin.jsx"
    ),
    "utf8"
  );

const studioSource =
  fs.readFileSync(
    path.join(
      frontendRoot,
      "src",
      "components",
      "SparkPublicQrStudio.jsx"
    ),
    "utf8"
  );

test(
  "adds the Spark QR Studio without removing the future Blaze provenance panel",
  () => {
    assert.match(
      adminSource,
      /<SparkPublicQrStudio\s*\/>/
    );

    assert.match(
      adminSource,
      /<ProvenanceSetupPanel/
    );
  }
);

test(
  "Spark QR Studio uses public provenance reads and QR generation only",
  () => {
    assert.match(
      studioSource,
      /fetchPublicProvenance/
    );

    assert.match(
      studioSource,
      /generatePublicProvenanceQrDataUrl/
    );

    assert.doesNotMatch(
      studioSource,
      /getApiBaseUrl|\/api\//
    );

    assert.doesNotMatch(
      studioSource,
      /\b(?:addDoc|setDoc|updateDoc|deleteDoc)\b/
    );
  }
);

test(
  "Spark QR Studio exposes the complete Load Generate Print workflow",
  () => {
    assert.match(
      studioSource,
      /Load Published Provenance/
    );

    assert.match(
      studioSource,
      /Generate QR/
    );

    assert.match(
      studioSource,
      /QR Preview/
    );

    assert.match(
      studioSource,
      /Print Saree Tag/
    );

    assert.match(
      studioSource,
      /90mm 140mm/
    );
  }
);
