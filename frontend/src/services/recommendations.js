import {
  normalizeSearchText
} from "../i18n/locale.js";

export const DEFAULT_RECOMMENDATION_LIMIT = 4;
export const MAX_RECOMMENDATION_LIMIT = 12;

function normalized(
  value,
  locale
) {
  return normalizeSearchText(
    value,
    locale
  );
}

function sameValue(
  left,
  right,
  locale
) {
  const a = normalized(
    left,
    locale
  );

  const b = normalized(
    right,
    locale
  );

  return Boolean(
    a &&
    b &&
    a === b
  );
}

export function getRecommendationPrice(
  product
) {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return null;
  }

  const salePrice =
    Number(product.salePrice);

  if (
    Number.isFinite(salePrice) &&
    salePrice > 0
  ) {
    return salePrice;
  }

  const price =
    Number(product.price);

  if (
    Number.isFinite(price) &&
    price > 0
  ) {
    return price;
  }

  return null;
}

export function isRecommendationAvailable(
  product
) {
  if (
    !product ||
    typeof product !== "object" ||
    !String(product.id ?? "").trim()
  ) {
    return false;
  }

  if (
    product.active === false ||
    product.isActive === false
  ) {
    return false;
  }

  const rawStock = product.stock;
  const numericStock =
    Number(rawStock);

  if (
    rawStock !== null &&
    rawStock !== undefined &&
    String(rawStock).trim() &&
    Number.isFinite(numericStock)
  ) {
    return numericStock > 0;
  }

  const textStock =
    String(rawStock ?? "")
      .trim()
      .toLowerCase();

  return (
    textStock === "in stock" ||
    textStock === "available"
  );
}

function priceAffinity(
  currentPrice,
  candidatePrice
) {
  if (
    currentPrice === null ||
    candidatePrice === null
  ) {
    return {
      score: 0,
      distance:
        Number.POSITIVE_INFINITY
    };
  }

  const distance =
    Math.abs(
      candidatePrice -
      currentPrice
    );

  const ratio =
    distance /
    Math.max(currentPrice, 1);

  if (ratio <= 0.15) {
    return {
      score: 20,
      distance
    };
  }

  if (ratio <= 0.30) {
    return {
      score: 10,
      distance
    };
  }

  return {
    score: 0,
    distance
  };
}

export function scoreRecommendation(
  currentProduct,
  candidate,
  locale = "en"
) {
  if (
    !currentProduct ||
    !candidate ||
    typeof currentProduct !== "object" ||
    typeof candidate !== "object"
  ) {
    return Object.freeze({
      score: 0,
      affinityScore: 0,
      priceDistance:
        Number.POSITIVE_INFINITY,
      reasons:
        Object.freeze([])
    });
  }

  let affinityScore = 0;
  let bonusScore = 0;
  const reasons = [];

  if (
    sameValue(
      currentProduct.category,
      candidate.category,
      locale
    )
  ) {
    affinityScore += 50;
    reasons.push(
      "same_category"
    );
  }

  if (
    sameValue(
      currentProduct.fabric,
      candidate.fabric,
      locale
    )
  ) {
    affinityScore += 40;
    reasons.push(
      "same_fabric"
    );
  }

  if (
    sameValue(
      currentProduct.color,
      candidate.color,
      locale
    )
  ) {
    affinityScore += 30;
    reasons.push(
      "same_color"
    );
  }

  const price =
    priceAffinity(
      getRecommendationPrice(
        currentProduct
      ),
      getRecommendationPrice(
        candidate
      )
    );

  if (price.score > 0) {
    affinityScore +=
      price.score;

    reasons.push(
      "similar_price"
    );
  }

  if (candidate.isNew === true) {
    bonusScore += 5;
    reasons.push("new");
  }

  return Object.freeze({
    score:
      affinityScore +
      bonusScore,
    affinityScore,
    priceDistance:
      price.distance,
    reasons:
      Object.freeze(
        [...reasons]
      )
  });
}

function normalizeLimit(
  value
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return DEFAULT_RECOMMENDATION_LIMIT;
  }

  return Math.min(
    parsed,
    MAX_RECOMMENDATION_LIMIT
  );
}

export function getRuleBasedRecommendations(
  products,
  currentProduct,
  {
    limit =
      DEFAULT_RECOMMENDATION_LIMIT,
    locale = "en"
  } = {}
) {
  if (
    !Array.isArray(products) ||
    !currentProduct ||
    typeof currentProduct !== "object"
  ) {
    return Object.freeze([]);
  }

  const currentId =
    String(
      currentProduct.id ?? ""
    ).trim();

  if (!currentId) {
    return Object.freeze([]);
  }

  const safeLimit =
    normalizeLimit(limit);

  const ranked =
    products
      .filter(
        (candidate) =>
          String(
            candidate?.id ?? ""
          ).trim() !==
            currentId &&
          isRecommendationAvailable(
            candidate
          )
      )
      .map(
        (candidate) => {
          const ranking =
            scoreRecommendation(
              currentProduct,
              candidate,
              locale
            );

          return {
            product: candidate,
            ...ranking
          };
        }
      )
      .filter(
        (entry) =>
          entry.affinityScore > 0
      )
      .sort(
        (left, right) => {
          if (
            right.score !==
            left.score
          ) {
            return (
              right.score -
              left.score
            );
          }

          if (
            left.priceDistance !==
            right.priceDistance
          ) {
            return (
              left.priceDistance -
              right.priceDistance
            );
          }

          const leftName =
            normalized(
              left.product?.name,
              locale
            );

          const rightName =
            normalized(
              right.product?.name,
              locale
            );

          const nameOrder =
            leftName.localeCompare(
              rightName
            );

          if (nameOrder !== 0) {
            return nameOrder;
          }

          return String(
            left.product?.id ?? ""
          ).localeCompare(
            String(
              right.product?.id ?? ""
            )
          );
        }
      )
      .slice(
        0,
        safeLimit
      )
      .map(
        (entry) =>
          entry.product
      );

  return Object.freeze(
    ranked
  );
}
