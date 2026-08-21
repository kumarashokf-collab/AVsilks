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
  getRecommendationPrice,
  getRuleBasedRecommendations,
  isRecommendationAvailable,
  scoreRecommendation
} from "../src/services/recommendations.js";

import {
  translate
} from "../src/i18n/locale.js";

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

const current = {
  id: "p1",
  name:
    "Kanchipuram Red Silk Saree",
  category: "Silk",
  fabric: "Silk",
  color: "Red",
  price: 5200,
  salePrice: 4500,
  stock: 2
};

const catalogue = [
  current,
  {
    id: "p2",
    name:
      "Festival Silk Saree",
    category: "Silk",
    fabric: "Silk",
    color: "Blue",
    price: 4600,
    stock: 4
  },
  {
    id: "p3",
    name:
      "Red Heritage Saree",
    category: "Silk",
    fabric: "Cotton",
    color: "Red",
    price: 7000,
    stock: 5
  },
  {
    id: "p4",
    name:
      "Budget Cotton Saree",
    category: "Cotton",
    fabric: "Cotton",
    color: "Blue",
    price: 4400,
    stock: 8
  },
  {
    id: "p5",
    name:
      "Unavailable Silk Saree",
    category: "Silk",
    fabric: "Silk",
    color: "Red",
    price: 4400,
    stock: 0
  },
  {
    id: "p6",
    name:
      "Inactive Silk Saree",
    category: "Silk",
    fabric: "Silk",
    color: "Red",
    price: 4500,
    stock: 5,
    active: false
  }
];

test(
  "uses sale price before regular price",
  () => {
    assert.equal(
      getRecommendationPrice(
        current
      ),
      4500
    );
  }
);

test(
  "fails closed for unavailable and inactive products",
  () => {
    assert.equal(
      isRecommendationAvailable(
        catalogue[4]
      ),
      false
    );

    assert.equal(
      isRecommendationAvailable(
        catalogue[5]
      ),
      false
    );

    assert.equal(
      isRecommendationAvailable({
        id: "legacy",
        stock: "In Stock"
      }),
      true
    );
  }
);

test(
  "scores category fabric colour and price affinity deterministically",
  () => {
    const ranking =
      scoreRecommendation(
        current,
        catalogue[1],
        "en"
      );

    assert.equal(
      ranking.affinityScore,
      110
    );

    assert.ok(
      ranking.reasons.includes(
        "same_category"
      )
    );

    assert.ok(
      ranking.reasons.includes(
        "same_fabric"
      )
    );

    assert.ok(
      ranking.reasons.includes(
        "similar_price"
      )
    );
  }
);

test(
  "excludes current unavailable and inactive products",
  () => {
    const result =
      getRuleBasedRecommendations(
        catalogue,
        current,
        {
          limit: 10,
          locale: "en"
        }
      );

    assert.deepEqual(
      result.map(
        (product) =>
          product.id
      ),
      [
        "p2",
        "p3",
        "p4"
      ]
    );
  }
);

test(
  "uses deterministic tie breaking",
  () => {
    const tieProducts = [
      current,
      {
        id: "b",
        name: "Beta Silk",
        category: "Silk",
        fabric: "Silk",
        color: "Blue",
        price: 4500,
        stock: 2
      },
      {
        id: "a",
        name: "Alpha Silk",
        category: "Silk",
        fabric: "Silk",
        color: "Blue",
        price: 4500,
        stock: 2
      }
    ];

    const result =
      getRuleBasedRecommendations(
        tieProducts,
        current,
        {
          locale: "en"
        }
      );

    assert.deepEqual(
      result.map(
        (product) =>
          product.id
      ),
      ["a", "b"]
    );
  }
);

test(
  "enforces recommendation limit without mutating catalogue",
  () => {
    const snapshot =
      catalogue.map(
        (product) => ({
          ...product
        })
      );

    const result =
      getRuleBasedRecommendations(
        catalogue,
        current,
        {
          limit: 2,
          locale: "en"
        }
      );

    assert.equal(
      result.length,
      2
    );

    assert.equal(
      Object.isFrozen(result),
      true
    );

    assert.deepEqual(
      catalogue,
      snapshot
    );
  }
);

test(
  "provides recommendation heading in all five locales and wires ProductDetails",
  () => {
    for (
      const locale of [
        "en",
        "te",
        "hi",
        "ta",
        "kn"
      ]
    ) {
      assert.notEqual(
        translate(
          locale,
          "recommendations.title"
        ),
        "recommendations.title"
      );
    }

    const details =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "pages",
          "ProductDetails.jsx"
        ),
        "utf8"
      );

    assert.match(
      details,
      /getRuleBasedRecommendations/
    );

    assert.match(
      details,
      /recommendations\.title/
    );

    assert.match(
      details,
      /<ProductCard/
    );

    assert.match(
      details,
      /limit:\s*4/
    );
  }
);

test(
  "keeps recommendations privacy safe rules only and network free",
  () => {
    const service =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "services",
          "recommendations.js"
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
      /localStorage/
    );

    assert.doesNotMatch(
      service,
      /sessionStorage/
    );

    assert.doesNotMatch(
      service,
      /document\.cookie/
    );

    assert.doesNotMatch(
      service,
      /\beval\s*\(/
    );
  }
);

console.log(
  "RULES_BASED_RECOMMENDATIONS_TEST_SETUP=PASS"
);
