import {
  normalizeSearchText
} from "../i18n/locale.js";

export const SEARCH_ALIAS_GROUPS =
  Object.freeze([
    Object.freeze([
      "saree",
      "sari",
      "చీర",
      "साड़ी",
      "சேலை",
      "ಸೀರೆ",
    ]),

    Object.freeze([
      "silk",
      "pattu",
      "పట్టు",
      "रेशम",
      "பட்டு",
      "ರೇಷ್ಮೆ",
    ]),

    Object.freeze([
      "cotton",
      "పత్తి",
      "सूती",
      "பருத்தி",
      "ಹತ್ತಿ",
    ]),

    Object.freeze([
      "kanchipuram",
      "kanjivaram",
      "kancheepuram",
      "కాంచీపురం",
      "कांचीपुरम",
      "காஞ்சிபுரம்",
      "ಕಾಂಚೀಪುರಂ",
    ]),

    Object.freeze([
      "dharmavaram",
      "ధర్మవరం",
      "धर्मावरम",
      "தர்மாவரம்",
      "ಧರ್ಮಾವರಂ",
    ]),

    Object.freeze([
      "handloom",
      "handwoven",
      "hand woven",
      "చేనేత",
      "हथकरघा",
      "கைத்தறி",
      "ಕೈಮಗ್ಗ",
    ]),

    Object.freeze([
      "red",
      "ఎరుపు",
      "लाल",
      "சிவப்பு",
      "ಕೆಂಪು",
    ]),

    Object.freeze([
      "green",
      "ఆకుపచ్చ",
      "हरा",
      "பச்சை",
      "ಹಸಿರು",
    ]),

    Object.freeze([
      "blue",
      "నీలం",
      "नीला",
      "நீலம்",
      "ನೀಲಿ",
    ]),

    Object.freeze([
      "black",
      "నలుపు",
      "काला",
      "கருப்பு",
      "ಕಪ್ಪು",
    ]),

    Object.freeze([
      "white",
      "తెలుపు",
      "सफेद",
      "வெள்ளை",
      "ಬಿಳಿ",
    ]),

    Object.freeze([
      "gold",
      "golden",
      "బంగారం",
      "सोना",
      "தங்கம்",
      "ಚಿನ್ನ",
    ]),
  ]);

function toCharacters(value) {
  return Array.from(
    String(value ?? "")
  );
}

export function damerauLevenshtein(
  left,
  right
) {
  const a = toCharacters(left);
  const b = toCharacters(right);

  if (a.length === 0) {
    return b.length;
  }

  if (b.length === 0) {
    return a.length;
  }

  const matrix = Array.from(
    {
      length: a.length + 1,
    },
    () =>
      Array(
        b.length + 1
      ).fill(0)
  );

  for (
    let row = 0;
    row <= a.length;
    row += 1
  ) {
    matrix[row][0] = row;
  }

  for (
    let column = 0;
    column <= b.length;
    column += 1
  ) {
    matrix[0][column] =
      column;
  }

  for (
    let row = 1;
    row <= a.length;
    row += 1
  ) {
    for (
      let column = 1;
      column <= b.length;
      column += 1
    ) {
      const cost =
        a[row - 1] ===
        b[column - 1]
          ? 0
          : 1;

      matrix[row][column] =
        Math.min(
          matrix[row - 1][
            column
          ] + 1,
          matrix[row][
            column - 1
          ] + 1,
          matrix[row - 1][
            column - 1
          ] + cost
        );

      if (
        row > 1 &&
        column > 1 &&
        a[row - 1] ===
          b[column - 2] &&
        a[row - 2] ===
          b[column - 1]
      ) {
        matrix[row][column] =
          Math.min(
            matrix[row][
              column
            ],
            matrix[row - 2][
              column - 2
            ] + 1
          );
      }
    }
  }

  return matrix[a.length][
    b.length
  ];
}

export function fuzzyThreshold(
  token
) {
  const length =
    toCharacters(token).length;

  if (length <= 2) {
    return 0;
  }

  if (length <= 4) {
    return 1;
  }

  return 2;
}

export function fuzzyTokenMatch(
  queryToken,
  targetToken
) {
  const query =
    String(
      queryToken ?? ""
    ).trim();

  const target =
    String(
      targetToken ?? ""
    ).trim();

  if (!query || !target) {
    return false;
  }

  if (query === target) {
    return true;
  }

  const queryLength =
    toCharacters(query).length;

  const targetLength =
    toCharacters(target).length;

  if (
    Math.min(
      queryLength,
      targetLength
    ) >= 3 &&
    (
      target.includes(query) ||
      query.includes(target)
    )
  ) {
    return true;
  }

  const threshold =
    fuzzyThreshold(query);

  if (threshold === 0) {
    return false;
  }

  if (
    Math.abs(
      queryLength -
      targetLength
    ) > threshold
  ) {
    return false;
  }

  return (
    damerauLevenshtein(
      query,
      target
    ) <= threshold
  );
}

function tokenize(
  value,
  locale
) {
  return normalizeSearchText(
    value,
    locale
  )
    .split(" ")
    .filter(Boolean);
}

function expandAliasVariants(
  token,
  locale
) {
  const variants =
    new Set([token]);

  for (
    const group
    of SEARCH_ALIAS_GROUPS
  ) {
    const normalizedGroup =
      group.map((alias) =>
        normalizeSearchText(
          alias,
          locale
        )
      );

    const belongsToGroup =
      normalizedGroup.some(
        (alias) =>
          fuzzyTokenMatch(
            token,
            alias
          )
      );

    if (!belongsToGroup) {
      continue;
    }

    for (
      const alias
      of normalizedGroup
    ) {
      for (
        const aliasToken
        of alias
          .split(" ")
          .filter(Boolean)
      ) {
        variants.add(
          aliasToken
        );
      }
    }
  }

  return variants;
}

export function matchesSearchText(
  value,
  query,
  locale = "en"
) {
  const normalizedValue =
    normalizeSearchText(
      value,
      locale
    );

  const normalizedQuery =
    normalizeSearchText(
      query,
      locale
    );

  if (!normalizedQuery) {
    return true;
  }

  if (!normalizedValue) {
    return false;
  }

  if (
    normalizedValue.includes(
      normalizedQuery
    )
  ) {
    return true;
  }

  const targetTokens =
    tokenize(
      normalizedValue,
      locale
    );

  const queryTokens =
    tokenize(
      normalizedQuery,
      locale
    );

  return queryTokens.every(
    (queryToken) => {
      const variants =
        expandAliasVariants(
          queryToken,
          locale
        );

      return Array.from(
        variants
      ).some(
        (variant) =>
          targetTokens.some(
            (targetToken) =>
              fuzzyTokenMatch(
                variant,
                targetToken
              )
          )
      );
    }
  );
}

export function buildProductSearchText(
  product
) {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return "";
  }

  return [
    product.name,
    product.category,
    product.description,
    product.sku,
    product.color,
    product.fabric,
    product.slug,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined
    )
    .map((value) =>
      String(value)
    )
    .join(" ");
}

export function matchesProductSearch(
  product,
  query,
  locale = "en"
) {
  return matchesSearchText(
    buildProductSearchText(
      product
    ),
    query,
    locale
  );
}

export function filterProductsByQuery(
  products,
  query,
  locale = "en"
) {
  const safeProducts =
    Array.isArray(products)
      ? products
      : [];

  const normalizedQuery =
    normalizeSearchText(
      query,
      locale
    );

  if (!normalizedQuery) {
    return safeProducts;
  }

  return safeProducts.filter(
    (product) =>
      matchesProductSearch(
        product,
        normalizedQuery,
        locale
      )
  );
}
