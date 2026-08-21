import {
  normalizeSearchText
} from "../i18n/locale.js";

export const MAX_FILTER_PRICE =
  10_000_000;

const AMOUNT_SOURCE =
  String.raw`(?:₹\s*|rs\.?\s*|inr\s*)?\d[\d,]*(?:\.\d{1,2})?\s*k?`;

const AMOUNT_SCAN =
  /(?:₹\s*|rs\.?\s*|inr\s*)?(\d[\d,]*(?:\.\d{1,2})?)\s*(k)?/giu;

const RANGE_PATTERNS = [
  new RegExp(
    String.raw`\bbetween\s+${AMOUNT_SOURCE}\s+(?:and|to)\s+${AMOUNT_SOURCE}\b`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:నుంచి|నుండి)\s*${AMOUNT_SOURCE}\s*(?:వరకు|మధ్య)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*से\s*${AMOUNT_SOURCE}\s*(?:तक|के\s*बीच)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:முதல்|இருந்து)\s*${AMOUNT_SOURCE}\s*வரை`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*ರಿಂದ\s*${AMOUNT_SOURCE}\s*(?:ವರೆಗೆ|ನಡುವೆ)`,
    "iu"
  ),
];

const MAX_PATTERNS = [
  new RegExp(
    String.raw`\b(?:under|below|less\s+than|up\s+to|within|max(?:imum)?)\s+${AMOUNT_SOURCE}\b`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:లోపు|కంటే\s*తక్కువ|వరకు)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:से\s*कम|तक)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:க்கு\s*கீழ்|கீழ்|வரை)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:ಕ್ಕಿಂತ\s*ಕಡಿಮೆ|ಕೆಳಗೆ|ವರೆಗೆ)`,
    "iu"
  ),
];

const MIN_PATTERNS = [
  new RegExp(
    String.raw`\b(?:over|above|more\s+than|at\s+least|min(?:imum)?)\s+${AMOUNT_SOURCE}\b`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:పైగా|కంటే\s*ఎక్కువ)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:से\s*अधिक|से\s*ज्यादा)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:க்கு\s*மேல்|மேல்)`,
    "iu"
  ),

  new RegExp(
    String.raw`${AMOUNT_SOURCE}\s*(?:ಕ್ಕಿಂತ\s*ಹೆಚ್ಚು|ಮೇಲೆ)`,
    "iu"
  ),
];

const IN_STOCK_PATTERNS = [
  /\b(?:in\s+stock|available)\b/iu,
  /(?:స్టాక్‌లో|అందుబాటులో)/iu,
  /(?:स्टॉक\s*में|उपलब्ध)/iu,
  /(?:கையிருப்பில்|கிடைக்கும்)/iu,
  /(?:ಸ್ಟಾಕ್‌ನಲ್ಲಿ|ಲಭ್ಯ)/iu,
];

const NEW_PATTERNS = [
  /\b(?:new|latest)\b/iu,
  /(?:కొత్త|తాజా)/iu,
  /(?:नया|नई|नवीन)/iu,
  /(?:புதிய|சமீபத்திய)/iu,
  /(?:ಹೊಸ|ಇತ್ತೀಚಿನ)/iu,
];

const FILLER_PATTERNS = [
  /\b(?:show\s+me|find\s+me|show|find|please|i\s+want|looking\s+for)\b/giu,
  /(?:నాకు\s*చూపించు|చూపించండి|చూపించు|కావాలి|వెతుకు)/giu,
  /(?:मुझे\s*दिखाओ|दिखाइए|दिखाओ|चाहिए|खोजो)/giu,
  /(?:எனக்கு\s*காட்டு|காட்டுங்கள்|காட்டு|வேண்டும்|தேடு)/giu,
  /(?:ನನಗೆ\s*ತೋರಿಸು|ತೋರಿಸಿ|ತೋರಿಸು|ಬೇಕು|ಹುಡುಕು)/giu,
];

function tidyText(value) {
  return String(value ?? "")
    .replace(/[?!,;:()[\]{}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function parseAmount(
  numeric,
  thousandsMarker
) {
  const base = Number(
    String(numeric ?? "")
      .replace(/,/g, "")
  );

  if (
    !Number.isFinite(base) ||
    base <= 0
  ) {
    return null;
  }

  const amount =
    thousandsMarker
      ? base * 1000
      : base;

  if (
    !Number.isFinite(amount) ||
    amount >
      MAX_FILTER_PRICE
  ) {
    return null;
  }

  return amount;
}

function extractAmounts(value) {
  const amounts = [];

  for (
    const match of
    String(value ?? "")
      .matchAll(AMOUNT_SCAN)
  ) {
    const amount =
      parseAmount(
        match[1],
        match[2]
      );

    if (amount !== null) {
      amounts.push(amount);
    }
  }

  return amounts;
}

function removeMatch(
  value,
  match
) {
  return tidyText(
    String(value).slice(
      0,
      match.index
    ) +
    " " +
    String(value).slice(
      match.index +
      match[0].length
    )
  );
}

function consumeFirst(
  value,
  patterns,
  handler
) {
  for (
    const pattern
    of patterns
  ) {
    const match =
      pattern.exec(value);

    if (!match) {
      continue;
    }

    const accepted =
      handler(match[0]);

    if (!accepted) {
      return {
        value,
        matched: false,
      };
    }

    return {
      value:
        removeMatch(
          value,
          match
        ),
      matched: true,
    };
  }

  return {
    value,
    matched: false,
  };
}

function removeBooleanPhrase(
  value,
  patterns
) {
  for (
    const pattern
    of patterns
  ) {
    const match =
      pattern.exec(value);

    if (!match) {
      continue;
    }

    return {
      value:
        removeMatch(
          value,
          match
        ),
      matched: true,
    };
  }

  return {
    value,
    matched: false,
  };
}

function removeFillers(value) {
  let result =
    String(value ?? "");

  for (
    const pattern
    of FILLER_PATTERNS
  ) {
    result =
      result.replace(
        pattern,
        " "
      );
  }

  return tidyText(result);
}

export function parseNaturalLanguageQuery(
  query,
  locale = "en"
) {
  let working =
    normalizeSearchText(
      query,
      locale
    );

  let minPrice = null;
  let maxPrice = null;
  let inStockOnly = false;
  let newOnly = false;
  let recognizedFilterCount = 0;

  const rangeResult =
    consumeFirst(
      working,
      RANGE_PATTERNS,
      (phrase) => {
        const amounts =
          extractAmounts(
            phrase
          );

        if (
          amounts.length !== 2
        ) {
          return false;
        }

        minPrice =
          Math.min(
            amounts[0],
            amounts[1]
          );

        maxPrice =
          Math.max(
            amounts[0],
            amounts[1]
          );

        return true;
      }
    );

  working =
    rangeResult.value;

  if (rangeResult.matched) {
    recognizedFilterCount += 1;
  }

  const maxResult =
    consumeFirst(
      working,
      MAX_PATTERNS,
      (phrase) => {
        const amounts =
          extractAmounts(
            phrase
          );

        if (
          amounts.length !== 1
        ) {
          return false;
        }

        maxPrice = amounts[0];

        return true;
      }
    );

  working = maxResult.value;

  if (maxResult.matched) {
    recognizedFilterCount += 1;
  }

  const minResult =
    consumeFirst(
      working,
      MIN_PATTERNS,
      (phrase) => {
        const amounts =
          extractAmounts(
            phrase
          );

        if (
          amounts.length !== 1
        ) {
          return false;
        }

        minPrice = amounts[0];

        return true;
      }
    );

  working = minResult.value;

  if (minResult.matched) {
    recognizedFilterCount += 1;
  }

  const stockResult =
    removeBooleanPhrase(
      working,
      IN_STOCK_PATTERNS
    );

  working =
    stockResult.value;

  if (stockResult.matched) {
    inStockOnly = true;
    recognizedFilterCount += 1;
  }

  const newResult =
    removeBooleanPhrase(
      working,
      NEW_PATTERNS
    );

  working =
    newResult.value;

  if (newResult.matched) {
    newOnly = true;
    recognizedFilterCount += 1;
  }

  const textQuery =
    removeFillers(
      working
    );

  const impossible =
    minPrice !== null &&
    maxPrice !== null &&
    minPrice > maxPrice;

  return Object.freeze({
    textQuery,
    minPrice,
    maxPrice,
    inStockOnly,
    newOnly,
    impossible,
    recognizedFilterCount,
  });
}

export function getProductFilterPrice(
  product
) {
  if (
    !product ||
    typeof product !==
      "object"
  ) {
    return null;
  }

  const salePrice =
    Number(
      product.salePrice
    );

  if (
    Number.isFinite(
      salePrice
    ) &&
    salePrice > 0
  ) {
    return salePrice;
  }

  const price =
    Number(
      product.price
    );

  if (
    Number.isFinite(price) &&
    price > 0
  ) {
    return price;
  }

  return null;
}

export function matchesNaturalLanguageFilters(
  product,
  filters
) {
  if (
    !filters ||
    typeof filters !==
      "object"
  ) {
    return false;
  }

  if (filters.impossible) {
    return false;
  }

  if (
    filters.minPrice !==
      null ||
    filters.maxPrice !==
      null
  ) {
    const price =
      getProductFilterPrice(
        product
      );

    if (price === null) {
      return false;
    }

    if (
      filters.minPrice !==
        null &&
      price <
        filters.minPrice
    ) {
      return false;
    }

    if (
      filters.maxPrice !==
        null &&
      price >
        filters.maxPrice
    ) {
      return false;
    }
  }

  if (
    filters.inStockOnly
  ) {
    const stock =
      Number(
        product?.stock
      );

    if (
      !Number.isFinite(
        stock
      ) ||
      stock <= 0
    ) {
      return false;
    }
  }

  if (
    filters.newOnly &&
    product?.isNew !== true
  ) {
    return false;
  }

  return true;
}
