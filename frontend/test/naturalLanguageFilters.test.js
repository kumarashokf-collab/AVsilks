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
  getProductFilterPrice,
  matchesNaturalLanguageFilters,
  parseNaturalLanguageQuery,
} from "../src/services/naturalLanguageFilters.js";

import {
  filterProductsByQuery,
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

const products = [
  {
    id: "p1",
    name:
      "Kanchipuram Silk Saree",
    category: "Silk",
    description:
      "Traditional handloom saree",
    color: "Red",
    fabric: "Silk",
    price: 5200,
    salePrice: 4500,
    stock: 3,
    isNew: true,
  },
  {
    id: "p2",
    name:
      "Cotton Handloom Saree",
    category: "Cotton",
    description:
      "Soft daily wear saree",
    color: "Blue",
    fabric: "Cotton",
    price: 1800,
    stock: 6,
    isNew: true,
  },
  {
    id: "p3",
    name:
      "Premium Red Silk Saree",
    category: "Silk",
    description:
      "Festive silk saree",
    color: "Red",
    fabric: "Silk",
    price: 5500,
    stock: 2,
    isNew: false,
  },
  {
    id: "p4",
    name:
      "Classic Red Silk Saree",
    category: "Silk",
    description:
      "Traditional silk saree",
    color: "Red",
    fabric: "Silk",
    price: 4000,
    stock: 0,
    isNew: false,
  },
];

test(
  "parses English natural-language price and stock filters",
  () => {
    const parsed =
      parseNaturalLanguageQuery(
        "show me red silk sarees under ₹5k in stock",
        "en"
      );

    assert.equal(
      parsed.textQuery,
      "red silk sarees"
    );

    assert.equal(
      parsed.maxPrice,
      5000
    );

    assert.equal(
      parsed.minPrice,
      null
    );

    assert.equal(
      parsed.inStockOnly,
      true
    );

    assert.equal(
      parsed.recognizedFilterCount,
      2
    );
  }
);

test(
  "parses regional-language maximum-price phrases",
  () => {
    for (
      const [
        locale,
        query
      ] of [
        [
          "te",
          "₹5000 లోపు ఎరుపు పట్టు చీర"
        ],
        [
          "hi",
          "₹5000 से कम लाल रेशम साड़ी"
        ],
        [
          "ta",
          "₹5000க்கு கீழ் சிவப்பு பட்டு சேலை"
        ],
        [
          "kn",
          "₹5000ಕ್ಕಿಂತ ಕಡಿಮೆ ಕೆಂಪು ರೇಷ್ಮೆ ಸೀರೆ"
        ],
      ]
    ) {
      const parsed =
        parseNaturalLanguageQuery(
          query,
          locale
        );

      assert.equal(
        parsed.maxPrice,
        5000,
        `${locale} max price`
      );

      assert.ok(
        parsed.textQuery.length >
          0
      );
    }
  }
);

test(
  "parses price ranges including Indian comma formatting",
  () => {
    const english =
      parseNaturalLanguageQuery(
        "silk sarees between ₹2,000 and ₹5,000",
        "en"
      );

    assert.equal(
      english.minPrice,
      2000
    );

    assert.equal(
      english.maxPrice,
      5000
    );

    assert.equal(
      english.textQuery,
      "silk sarees"
    );

    const telugu =
      parseNaturalLanguageQuery(
        "₹2000 నుంచి ₹5000 వరకు పట్టు చీర",
        "te"
      );

    assert.equal(
      telugu.minPrice,
      2000
    );

    assert.equal(
      telugu.maxPrice,
      5000
    );
  }
);

test(
  "parses minimum price new and availability filters",
  () => {
    const parsed =
      parseNaturalLanguageQuery(
        "latest sarees above ₹3000 available",
        "en"
      );

    assert.equal(
      parsed.minPrice,
      3000
    );

    assert.equal(
      parsed.newOnly,
      true
    );

    assert.equal(
      parsed.inStockOnly,
      true
    );

    assert.equal(
      parsed.textQuery,
      "sarees"
    );
  }
);

test(
  "uses selling price before regular price",
  () => {
    assert.equal(
      getProductFilterPrice(
        products[0]
      ),
      4500
    );

    assert.equal(
      matchesNaturalLanguageFilters(
        products[0],
        {
          minPrice: null,
          maxPrice: 5000,
          inStockOnly: true,
          newOnly: false,
          impossible: false,
        }
      ),
      true
    );
  }
);

test(
  "combines structured filters with existing fuzzy multilingual search",
  () => {
    const result =
      filterProductsByQuery(
        products,
        "show me red silk sarees under ₹5k in stock",
        "en"
      );

    assert.deepEqual(
      result.map(
        (product) =>
          product.id
      ),
      ["p1"]
    );

    const telugu =
      filterProductsByQuery(
        products,
        "₹5000 లోపు ఎరుపు పట్టు చీర",
        "te"
      );

    assert.deepEqual(
      telugu.map(
        (product) =>
          product.id
      ),
      [
        "p1",
        "p4",
      ]
    );
  }
);

test(
  "supports new-product natural-language filtering",
  () => {
    const result =
      filterProductsByQuery(
        products,
        "latest cotton saree under 2000",
        "en"
      );

    assert.deepEqual(
      result.map(
        (product) =>
          product.id
      ),
      ["p2"]
    );
  }
);

test(
  "fails closed for contradictory price filters",
  () => {
    const parsed =
      parseNaturalLanguageQuery(
        "silk sarees above 5000 under 3000",
        "en"
      );

    assert.equal(
      parsed.impossible,
      true
    );

    assert.deepEqual(
      filterProductsByQuery(
        products,
        "silk sarees above 5000 under 3000",
        "en"
      ),
      []
    );
  }
);

test(
  "preserves ordinary typo and alias search compatibility",
  () => {
    assert.deepEqual(
      filterProductsByQuery(
        products,
        "kanjivram",
        "en"
      ).map(
        (product) =>
          product.id
      ),
      ["p1"]
    );

    assert.deepEqual(
      filterProductsByQuery(
        products,
        "cottn",
        "en"
      ).map(
        (product) =>
          product.id
      ),
      ["p2"]
    );
  }
);

test(
  "keeps the parser rules-only with no network or dynamic-code execution",
  () => {
    const service =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "services",
          "naturalLanguageFilters.js"
        ),
        "utf8"
      );

    assert.doesNotMatch(
      service,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      service,
      /\baxios\b/
    );

    assert.doesNotMatch(
      service,
      /XMLHttpRequest/
    );

    assert.doesNotMatch(
      service,
      /\beval\s*\(/
    );

    assert.doesNotMatch(
      service,
      /\bnew\s+Function\b/
    );
  }
);

console.log(
  "NATURAL_LANGUAGE_FILTER_TEST_SETUP=PASS"
);
