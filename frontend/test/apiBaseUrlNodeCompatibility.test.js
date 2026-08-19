import test from "node:test";
import assert from "node:assert/strict";

import {
  getApiBaseUrl,
} from "../src/services/api.js";

test(
  "API base URL helper is safe under the Node test runtime",
  () => {
    assert.equal(
      getApiBaseUrl(),
      "/api"
    );
  }
);
