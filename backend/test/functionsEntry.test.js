"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  api,
} = require("../functions");

test(
  "exports the Express API as a Firebase Functions v2 HTTP function",
  () => {
    assert.equal(
      typeof api,
      "function"
    );

    assert.ok(
      api.__endpoint,
      "Firebase endpoint metadata must exist"
    );

    assert.equal(
      api.__endpoint.platform,
      "gcfv2"
    );

    const region = (
      api.__endpoint.region
    );

    if (Array.isArray(region)) {
      assert.ok(
        region.includes(
          "asia-south1"
        )
      );
    } else {
      assert.equal(
        region,
        "asia-south1"
      );
    }

    assert.equal(
      api.__endpoint.maxInstances,
      2
    );
  }
);
