import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchActiveArtisans,
  createArtisan,
} from "../services/artisan.js";

import {
  createProvenance,
} from "../services/provenanceCreate.js";

import {
  createEmptyArtisanForm,
  createEmptyProvenanceForm,
  getEligibleProvenanceProducts,
  buildArtisanCreatePayload,
  buildProvenanceCreatePayload,
} from "../services/provenanceSetupModel.js";

const fieldStyle = {
  width: "100%",
  minHeight: "50px",
  padding: "12px 14px",
  border:
    "1px solid var(--color-border-medium)",
  borderRadius:
    "var(--radius-sm)",
  background: "#fff",
  fontSize: "16px",
  outline: "none",
};

const labelStyle = {
  display: "grid",
  gap: "7px",
  fontWeight: 700,
  color: "var(--color-text)",
};

const sectionStyle = {
  padding: "var(--space-5)",
  border:
    "1px solid var(--color-border-light)",
  borderRadius: "12px",
  display: "grid",
  gap: "var(--space-4)",
};

function getErrorMessage(
  error,
  fallback
) {
  return (
    typeof error?.message === "string" &&
    error.message.trim()
      ? error.message.trim()
      : fallback
  );
}

function sortArtisans(
  artisans
) {
  return [...artisans].sort(
    (left, right) =>
      left.displayName.localeCompare(
        right.displayName,
        undefined,
        {
          sensitivity: "base",
        }
      )
  );
}

export default function ProvenanceSetupPanel({
  user,
  products = [],
  onProvenanceCreated,
}) {
  const [
    artisans,
    setArtisans,
  ] = useState([]);

  const [
    artisansLoading,
    setArtisansLoading,
  ] = useState(true);

  const [
    artisansError,
    setArtisansError,
  ] = useState("");

  const [
    showNewArtisanForm,
    setShowNewArtisanForm,
  ] = useState(false);

  const [
    artisanForm,
    setArtisanForm,
  ] = useState(
    createEmptyArtisanForm
  );

  const [
    artisanSubmitting,
    setArtisanSubmitting,
  ] = useState(false);

  const [
    artisanCreateError,
    setArtisanCreateError,
  ] = useState("");

  const [
    artisanCreateSuccess,
    setArtisanCreateSuccess,
  ] = useState("");

  const [
    provenanceForm,
    setProvenanceForm,
  ] = useState(
    createEmptyProvenanceForm
  );

  const [
    provenanceSubmitting,
    setProvenanceSubmitting,
  ] = useState(false);

  const [
    provenanceCreateError,
    setProvenanceCreateError,
  ] = useState("");

  const [
    provenanceCreateSuccess,
    setProvenanceCreateSuccess,
  ] = useState(null);

  const eligibleProducts =
    useMemo(
      () =>
        getEligibleProvenanceProducts(
          products
        ),
      [products]
    );

  useEffect(() => {
    let active = true;

    async function loadArtisans() {
      setArtisansLoading(true);
      setArtisansError("");

      try {
        const result =
          await fetchActiveArtisans(
            user
          );

        if (!active) {
          return;
        }

        setArtisans(
          sortArtisans(result)
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setArtisans([]);

        setArtisansError(
          getErrorMessage(
            error,
            "Artisans load కాలేదు."
          )
        );
      } finally {
        if (active) {
          setArtisansLoading(false);
        }
      }
    }

    if (
      user &&
      typeof user.getIdToken ===
        "function"
    ) {
      loadArtisans();
    } else {
      setArtisans([]);
      setArtisansLoading(false);
      setArtisansError(
        "Authentication required."
      );
    }

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const selectedProductId =
      provenanceForm.productId;

    if (
      !selectedProductId
    ) {
      return;
    }

    const stillEligible =
      eligibleProducts.some(
        (product) =>
          product.id ===
          selectedProductId
      );

    if (!stillEligible) {
      setProvenanceForm(
        (current) => ({
          ...current,
          productId: "",
        })
      );
    }
  }, [
    eligibleProducts,
    provenanceForm.productId,
  ]);

  function updateArtisanField(
    field,
    value
  ) {
    setArtisanForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateProvenanceField(
    field,
    value
  ) {
    setProvenanceForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function handleArtisanSelection(
    artisanId
  ) {
    const selected =
      artisans.find(
        (artisan) =>
          artisan.id === artisanId
      );

    setProvenanceCreateError("");
    setProvenanceCreateSuccess(null);

    setProvenanceForm(
      (current) => ({
        ...current,

        artisanId,

        loomType:
          selected?.loomType ||
          current.loomType,

        village:
          selected?.village ||
          current.village,

        district:
          selected?.district ||
          current.district,

        state:
          selected?.state ||
          current.state,

        country:
          selected?.country ||
          current.country,
      })
    );
  }

  async function handleCreateArtisan(
    event
  ) {
    event.preventDefault();

    setArtisanSubmitting(true);
    setArtisanCreateError("");
    setArtisanCreateSuccess("");

    try {
      const payload =
        buildArtisanCreatePayload(
          artisanForm
        );

      const created =
        await createArtisan(
          payload,
          user
        );

      setArtisans(
        (current) =>
          sortArtisans([
            ...current.filter(
              (artisan) =>
                artisan.id !==
                created.id
            ),
            created,
          ])
      );

      setProvenanceForm(
        (current) => ({
          ...current,

          artisanId:
            created.id,

          loomType:
            created.loomType,

          village:
            created.village,

          district:
            created.district,

          state:
            created.state,

          country:
            created.country,
        })
      );

      setArtisanForm(
        createEmptyArtisanForm()
      );

      setShowNewArtisanForm(false);

      setArtisanCreateSuccess(
        `${created.displayName} artisan create అయింది మరియు selected అయింది.`
      );
    } catch (error) {
      setArtisanCreateError(
        getErrorMessage(
          error,
          "Artisan create కాలేదు."
        )
      );
    } finally {
      setArtisanSubmitting(false);
    }
  }

  async function handleCreateProvenance(
    event
  ) {
    event.preventDefault();

    setProvenanceSubmitting(true);
    setProvenanceCreateError("");
    setProvenanceCreateSuccess(null);

    try {
      const payload =
        buildProvenanceCreatePayload(
          provenanceForm
        );

      const created =
        await createProvenance(
          payload,
          user
        );

      setProvenanceCreateSuccess({
        productId:
          payload.productId,

        provenance:
          created,
      });

      setProvenanceForm(
        createEmptyProvenanceForm()
      );

      if (
        typeof onProvenanceCreated ===
        "function"
      ) {
        onProvenanceCreated({
          productId:
            payload.productId,

          provenance:
            created,
        });
      }
    } catch (error) {
      setProvenanceCreateError(
        getErrorMessage(
          error,
          "Draft provenance create కాలేదు."
        )
      );
    } finally {
      setProvenanceSubmitting(false);
    }
  }

  return (
    <section
      className="card"
      style={{
        padding:
          "var(--space-6)",
        display: "grid",
        gap: "var(--space-5)",
      }}
    >
      <div>
        <h3
          style={{
            marginBottom:
              "var(--space-2)",
          }}
        >
          Handloom Provenance Setup
        </h3>

        <p
          style={{
            color:
              "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Artisan ఎంచుకుని, saree మరియు
          handloom వివరాలు నమోదు చేసి Draft
          Provenance create చేయండి. తర్వాత
          Manage Sareesలో Publish → QR →
          Print చేయవచ్చు.
        </p>
      </div>

      <div style={sectionStyle}>
        <div>
          <strong>
            Step 1 — Artisan
          </strong>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "var(--color-text-muted)",
              fontSize: "14px",
            }}
          >
            Existing artisan ఎంచుకోండి లేదా
            కొత్త artisan create చేయండి.
          </p>
        </div>

        <label style={labelStyle}>
          Existing Artisan *

          <select
            value={
              provenanceForm.artisanId
            }
            onChange={(event) =>
              handleArtisanSelection(
                event.target.value
              )
            }
            disabled={
              artisansLoading ||
              provenanceSubmitting
            }
            style={fieldStyle}
          >
            <option value="">
              {artisansLoading
                ? "Loading artisans..."
                : "Select artisan"}
            </option>

            {artisans.map(
              (artisan) => (
                <option
                  key={artisan.id}
                  value={artisan.id}
                >
                  {artisan.displayName}
                  {" · "}
                  {artisan.artisanCode}
                </option>
              )
            )}
          </select>
        </label>

        {artisansError && (
          <span
            role="alert"
            style={{
              color:
                "var(--color-danger)",
              fontSize: "14px",
            }}
          >
            {artisansError}
          </span>
        )}

        {artisanCreateSuccess && (
          <span
            role="status"
            style={{
              color:
                "var(--color-success)",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {artisanCreateSuccess}
          </span>
        )}

        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setShowNewArtisanForm(
              (current) =>
                !current
            );

            setArtisanCreateError("");
          }}
          disabled={
            artisanSubmitting
          }
        >
          {showNewArtisanForm
            ? "Close New Artisan Form"
            : "+ Create New Artisan"}
        </button>

        {showNewArtisanForm && (
          <form
            onSubmit={
              handleCreateArtisan
            }
            style={{
              display: "grid",
              gap:
                "var(--space-4)",
              paddingTop:
                "var(--space-3)",
              borderTop:
                "1px solid var(--color-border-light)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap:
                  "var(--space-4)",
              }}
            >
              <label style={labelStyle}>
                Artisan Code *

                <input
                  type="text"
                  required
                  placeholder="ART-001"
                  value={
                    artisanForm.artisanCode
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "artisanCode",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                Artisan Name *

                <input
                  type="text"
                  required
                  placeholder="Lakshmi Weaver"
                  value={
                    artisanForm.displayName
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "displayName",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                Craft Type *

                <input
                  type="text"
                  required
                  placeholder="Handloom Weaving"
                  value={
                    artisanForm.craftType
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "craftType",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                Loom Type *

                <input
                  type="text"
                  required
                  placeholder="Pit Loom"
                  value={
                    artisanForm.loomType
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "loomType",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                Village *

                <input
                  type="text"
                  required
                  value={
                    artisanForm.village
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "village",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                District *

                <input
                  type="text"
                  required
                  value={
                    artisanForm.district
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "district",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                State *

                <input
                  type="text"
                  required
                  value={
                    artisanForm.state
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "state",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                Country *

                <input
                  type="text"
                  required
                  value={
                    artisanForm.country
                  }
                  onChange={(event) =>
                    updateArtisanField(
                      "country",
                      event.target.value
                    )
                  }
                  style={fieldStyle}
                />
              </label>
            </div>

            {artisanCreateError && (
              <span
                role="alert"
                style={{
                  color:
                    "var(--color-danger)",
                  fontSize: "14px",
                }}
              >
                {artisanCreateError}
              </span>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={
                artisanSubmitting
              }
            >
              {artisanSubmitting
                ? "Creating Artisan..."
                : "Create & Select Artisan"}
            </button>
          </form>
        )}
      </div>

      <form
        onSubmit={
          handleCreateProvenance
        }
        style={{
          display: "grid",
          gap: "var(--space-5)",
        }}
      >
        <div style={sectionStyle}>
          <div>
            <strong>
              Step 2 — Select Saree
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "var(--color-text-muted)",
                fontSize: "14px",
              }}
            >
              Provenance ఇంకా link కాని sarees
              మాత్రమే ఇక్కడ కనిపిస్తాయి.
            </p>
          </div>

          <label style={labelStyle}>
            Saree *

            <select
              required
              value={
                provenanceForm.productId
              }
              onChange={(event) =>
                updateProvenanceField(
                  "productId",
                  event.target.value
                )
              }
              disabled={
                provenanceSubmitting
              }
              style={fieldStyle}
            >
              <option value="">
                Select saree
              </option>

              {eligibleProducts.map(
                (product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                    {product.sku
                      ? ` · ${product.sku}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          {eligibleProducts.length ===
            0 && (
            <span
              style={{
                color:
                  "var(--color-text-muted)",
                fontSize: "14px",
              }}
            >
              Provenanceకి eligible unlinked
              sarees ప్రస్తుతం లేవు.
            </span>
          )}
        </div>

        <div style={sectionStyle}>
          <div>
            <strong>
              Step 3 — Handloom Details
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "var(--color-text-muted)",
                fontSize: "14px",
              }}
            >
              Material, weave, loom మరియు origin
              వివరాలను నమోదు చేయండి.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap:
                "var(--space-4)",
            }}
          >
            <label style={labelStyle}>
              Material *

              <input
                type="text"
                required
                placeholder="Pure Silk"
                value={
                  provenanceForm.material
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "material",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              Weave Technique *

              <input
                type="text"
                required
                placeholder="Handloom Ikat"
                value={
                  provenanceForm.weaveTechnique
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "weaveTechnique",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              Loom Type *

              <input
                type="text"
                required
                placeholder="Pit Loom"
                value={
                  provenanceForm.loomType
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "loomType",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              Village *

              <input
                type="text"
                required
                value={
                  provenanceForm.village
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "village",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              District *

              <input
                type="text"
                required
                value={
                  provenanceForm.district
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "district",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              State *

              <input
                type="text"
                required
                value={
                  provenanceForm.state
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "state",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>

            <label style={labelStyle}>
              Country *

              <input
                type="text"
                required
                value={
                  provenanceForm.country
                }
                onChange={(event) =>
                  updateProvenanceField(
                    "country",
                    event.target.value
                  )
                }
                style={fieldStyle}
              />
            </label>
          </div>
        </div>

        <div style={sectionStyle}>
          <div>
            <strong>
              Step 4 — Create Draft
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "var(--color-text-muted)",
                fontSize: "14px",
              }}
            >
              Draft create చేసిన తర్వాత publicకి
              కనిపించదు. Manage Sareesలో review
              చేసి Publish చేయాలి.
            </p>
          </div>

          {provenanceCreateError && (
            <span
              role="alert"
              style={{
                color:
                  "var(--color-danger)",
                fontSize: "14px",
              }}
            >
              {provenanceCreateError}
            </span>
          )}

          {provenanceCreateSuccess && (
            <div
              role="status"
              style={{
                padding: "12px",
                border:
                  "1px solid var(--color-border-light)",
                borderRadius: "10px",
                background:
                  "var(--color-cream-100)",
                display: "grid",
                gap: "5px",
              }}
            >
              <strong>
                Draft Provenance created ✅
              </strong>

              <span
                style={{
                  fontSize: "13px",
                  wordBreak:
                    "break-all",
                }}
              >
                Public ID:{" "}
                {
                  provenanceCreateSuccess
                    .provenance.publicId
                }
              </span>

              <span
                style={{
                  fontSize: "13px",
                }}
              >
                Next: Manage Sarees → Publish
                Provenance → Generate QR → Print
                Saree Tag.
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={
              provenanceSubmitting ||
              artisansLoading ||
              eligibleProducts.length ===
                0
            }
          >
            {provenanceSubmitting
              ? "Creating Draft..."
              : "Create Draft Provenance"}
          </button>
        </div>
      </form>
    </section>
  );
}
