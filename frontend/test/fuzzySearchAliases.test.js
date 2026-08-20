import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";
import path from "node:path";
import {
  fileURLToPath
} from "node:url";

import {
  SEARCH_ALIAS_GROUPS,
  damerauLevenshtein,
  filterProductsByQuery,
  fuzzyTokenMatch,
  matchesProductSearch,
  matchesSearchText,
} from "../src/services/searchMatching.js";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(__filename);

const frontendRoot =
  path.resolve(
    __dirname,
    ".."
  );

const silkProduct = {
  id: "p1",
  name:
    "Kanchipuram Silk Saree",
  category: "Silk",
  description:
    "Traditional handloom saree",
  sku: "AV-KS-001",
  color: "Red",
  fabric: "Silk",
  slug:
    "kanchipuram-silk-saree",
};

const cottonProduct = {
  id: "p2",
  name:
    "Cotton Handloom Saree",
  category: "Cotton",
  description:
    "Soft daily wear saree",
  sku: "AV-CT-001",
  color: "Blue",
  fabric: "Cotton",
  slug:
    "cotton-handloom-saree",
};

test(
  "supports bounded typo tolerance including transposition",
  () => {
    assert.equal(
      damerauLevenshtein(
        "silk",
        "sikl"
      ),
      1
    );

    assert.equal(
      fuzzyTokenMatch(
        "cottn",
        "cotton"
      ),
      true
    );

    assert.equal(
      fuzzyTokenMatch(
        "xyz",
        "silk"
      ),
      false
    );
  }
);

test(
  "recognizes Kanjivaram spelling aliases and typos",
  () => {
    assert.equal(
      matchesProductSearch(
        silkProduct,
        "kanjivaram",
        "en"
      ),
      true
    );

    assert.equal(
      matchesProductSearch(
        silkProduct,
        "kanjivram",
        "en"
      ),
      true
    );
  }
);

test(
  "maps silk saree aliases across Telugu Hindi Tamil and Kannada",
  () => {
    for (
      const [
        locale,
        query
      ] of [
        [
          "te",
          "పట్టు చీర"
        ],
        [
          "hi",
          "रेशम साड़ी"
        ],
        [
          "ta",
          "பட்டு சேலை"
        ],
        [
          "kn",
          "ರೇಷ್ಮೆ ಸೀರೆ"
        ],
      ]
    ) {
      assert.equal(
        matchesProductSearch(
          silkProduct,
          query,
          locale
        ),
        true,
        `${locale} alias should match`
      );
    }
  }
);

test(
  "maps multilingual colour aliases to English catalogue colour",
  () => {
    for (
      const [
        locale,
        query
      ] of [
        ["te", "ఎరుపు"],
        ["hi", "लाल"],
        ["ta", "சிவப்பு"],
        ["kn", "ಕೆಂಪು"],
      ]
    ) {
      assert.equal(
        matchesProductSearch(
          silkProduct,
          query,
          locale
        ),
        true
      );
    }
  }
);

test(
  "requires all multi-token search terms to match",
  () => {
    assert.equal(
      matchesProductSearch(
        silkProduct,
        "red silk",
        "en"
      ),
      true
    );

    assert.equal(
      matchesProductSearch(
        silkProduct,
        "red cotton",
        "en"
      ),
      false
    );
  }
);

test(
  "keeps unrelated queries fail closed",
  () => {
    assert.equal(
      matchesProductSearch(
        silkProduct,
        "leather jacket",
        "en"
      ),
      false
    );
  }
);

test(
  "filters catalogue without mutating source data",
  () => {
    const products = [
      silkProduct,
      cottonProduct,
    ];

    const result =
      filterProductsByQuery(
        products,
        "cottn",
        "en"
      );

    assert.deepEqual(
      result.map(
        (product) =>
          product.id
      ),
      ["p2"]
    );

    assert.equal(
      products.length,
      2
    );
  }
);

test(
  "keeps Unicode-safe direct search matching",
  () => {
    assert.equal(
      matchesSearchText(
        "ಧರ್ಮಾವರಂ ರೇಷ್ಮೆ ಸೀರೆ",
        "ಧರ್ಮಾವರಂ",
        "kn"
      ),
      true
    );

    assert.equal(
      matchesSearchText(
        "కాంచీపురం పట్టు చీర",
        "పట్టు",
        "te"
      ),
      true
    );
  }
);

test(
  "locks multilingual alias groups",
  () => {
    const flattened =
      SEARCH_ALIAS_GROUPS.flat();

    for (
      const term of [
        "పట్టు",
        "रेशम",
        "பட்டு",
        "ರೇಷ್ಮೆ",
        "చేనేత",
        "हथकरघा",
        "கைத்தறி",
        "ಕೈಮಗ್ಗ",
      ]
    ) {
      assert.ok(
        flattened.includes(
          term
        )
      );
    }
  }
);

test(
  "Home Products and SearchAI use centralized fuzzy search",
  () => {
    const home =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "pages",
          "Home.jsx"
        ),
        "utf8"
      );

    const products =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "pages",
          "Products.jsx"
        ),
        "utf8"
      );

    const searchAI =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "components",
          "SearchAI.jsx"
        ),
        "utf8"
      );

    assert.match(
      home,
      /filterProductsByQuery/
    );

    assert.match(
      products,
      /filterProductsByQuery/
    );

    assert.match(
      searchAI,
      /matchesSearchText/
    );

    assert.doesNotMatch(
      home,
      /searchableText\.includes/
    );

    assert.doesNotMatch(
      products,
      /searchableText\.includes/
    );
  }
);

console.log(
  "FUZZY_MULTILINGUAL_SEARCH_TEST_SETUP=PASS"
);
