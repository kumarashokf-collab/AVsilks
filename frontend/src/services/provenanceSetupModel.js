function normalizeText(
  value
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isSafeDocumentId(
  value
) {
  const normalized =
    normalizeText(value);

  return Boolean(
    normalized &&
    !normalized.includes("/") &&
    normalized.length <= 128
  );
}

function requireSafeDocumentId(
  value
) {
  const normalized =
    normalizeText(value);

  if (
    !isSafeDocumentId(
      normalized
    )
  ) {
    throw new Error(
      "Provenance setup input is invalid."
    );
  }

  return normalized;
}

function requireText(
  value
) {
  const normalized =
    normalizeText(value);

  if (
    normalized.length < 2
  ) {
    throw new Error(
      "Provenance setup input is invalid."
    );
  }

  return normalized;
}

function requireArtisanCode(
  value
) {
  const normalized =
    normalizeText(value);

  if (
    !normalized ||
    normalized.length > 128 ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
      normalized
    )
  ) {
    throw new Error(
      "Provenance setup input is invalid."
    );
  }

  return normalized;
}

export function createEmptyArtisanForm() {
  return {
    artisanCode: "",
    displayName: "",
    craftType: "",
    village: "",
    district: "",
    state: "",
    country: "India",
    loomType: "",
  };
}

export function createEmptyProvenanceForm() {
  return {
    productId: "",
    artisanId: "",
    material: "",
    weaveTechnique: "",
    loomType: "",
    village: "",
    district: "",
    state: "",
    country: "India",
  };
}

export function getEligibleProvenanceProducts(
  products
) {
  if (!Array.isArray(products)) {
    return Object.freeze([]);
  }

  const eligible =
    products
      .filter(
        (product) => {
          if (
            !product ||
            typeof product !== "object" ||
            Array.isArray(product) ||
            !isSafeDocumentId(
              product.id
            ) ||
            !normalizeText(
              product.name
            )
          ) {
            return false;
          }

          if (
            Object.prototype.hasOwnProperty.call(
              product,
              "provenanceId"
            )
          ) {
            const provenanceId =
              product.provenanceId;

            if (
              typeof provenanceId === "string"
                ? Boolean(
                    provenanceId.trim()
                  )
                : provenanceId != null
            ) {
              return false;
            }
          }

          return true;
        }
      )
      .map(
        (product) =>
          Object.freeze({
            id:
              normalizeText(
                product.id
              ),

            name:
              normalizeText(
                product.name
              ),

            sku:
              normalizeText(
                product.sku
              ),
          })
      )
      .sort(
        (left, right) => {
          const byName =
            left.name.localeCompare(
              right.name,
              undefined,
              {
                sensitivity:
                  "base",
              }
            );

          if (byName !== 0) {
            return byName;
          }

          return left.id.localeCompare(
            right.id
          );
        }
      );

  return Object.freeze(
    eligible
  );
}

export function buildArtisanCreatePayload(
  form
) {
  if (
    !form ||
    typeof form !== "object" ||
    Array.isArray(form)
  ) {
    throw new Error(
      "Provenance setup input is invalid."
    );
  }

  return Object.freeze({
    artisanCode:
      requireArtisanCode(
        form.artisanCode
      ),

    displayName:
      requireText(
        form.displayName
      ),

    craftType:
      requireText(
        form.craftType
      ),

    village:
      requireText(
        form.village
      ),

    district:
      requireText(
        form.district
      ),

    state:
      requireText(
        form.state
      ),

    country:
      requireText(
        form.country
      ),

    loomType:
      requireText(
        form.loomType
      ),

    active:
      true,
  });
}

export function buildProvenanceCreatePayload(
  form
) {
  if (
    !form ||
    typeof form !== "object" ||
    Array.isArray(form)
  ) {
    throw new Error(
      "Provenance setup input is invalid."
    );
  }

  const origin =
    Object.freeze({
      village:
        requireText(
          form.village
        ),

      district:
        requireText(
          form.district
        ),

      state:
        requireText(
          form.state
        ),

      country:
        requireText(
          form.country
        ),
    });

  return Object.freeze({
    productId:
      requireSafeDocumentId(
        form.productId
      ),

    artisanId:
      requireSafeDocumentId(
        form.artisanId
      ),

    material:
      requireText(
        form.material
      ),

    weaveTechnique:
      requireText(
        form.weaveTechnique
      ),

    loomType:
      requireText(
        form.loomType
      ),

    origin,
  });
}
