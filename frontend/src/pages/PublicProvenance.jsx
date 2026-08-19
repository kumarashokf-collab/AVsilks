import React, {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  BRAND,
} from "../config/branding";

import {
  PUBLIC_PROVENANCE_ERROR,
  fetchPublicProvenance,
} from "../services/publicProvenance.js";

const STATE = Object.freeze({
  LOADING: "loading",
  VERIFIED: "verified",
  NOT_FOUND: "not-found",
  ERROR: "error",
});

const pageStyle = {
  minHeight: "100vh",
  background:
    "var(--color-cream-50)",
  color:
    "var(--color-text-primary)",
  padding:
    "var(--space-8) var(--space-4) var(--space-12)",
};

const cardStyle = {
  width: "min(100%, 760px)",
  margin: "0 auto",
  background:
    "var(--color-white)",
  border:
    "1px solid var(--color-border-light)",
  borderRadius:
    "var(--radius-xl)",
  boxShadow:
    "var(--shadow-md)",
  overflow: "hidden",
};

const sectionStyle = {
  padding:
    "var(--space-6)",
  borderTop:
    "1px solid var(--color-border-light)",
};

const labelStyle = {
  margin: 0,
  color:
    "var(--color-text-muted)",
  fontSize:
    "var(--font-size-sm)",
  fontWeight: 700,
};

const valueStyle = {
  margin:
    "var(--space-1) 0 0",
  fontSize:
    "var(--font-size-md)",
  overflowWrap:
    "anywhere",
};

function Detail({
  label,
  value,
}) {
  return (
    <div>
      <p style={labelStyle}>
        {label}
      </p>

      <p style={valueStyle}>
        {value || "—"}
      </p>
    </div>
  );
}

function StatusMessage({
  title,
  message,
  verified = false,
}) {
  return (
    <main style={pageStyle}>
      <section
        style={{
          ...cardStyle,
          padding:
            "var(--space-8) var(--space-6)",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "64px",
            height: "64px",
            margin:
              "0 auto var(--space-4)",
            borderRadius:
              "var(--radius-pill)",
            display: "grid",
            placeItems: "center",
            fontSize: "30px",
            background:
              verified
                ? "rgba(35, 122, 75, 0.12)"
                : "var(--color-cream-200)",
            color:
              verified
                ? "var(--color-success)"
                : "var(--color-wine-800)",
          }}
        >
          {verified ? "✓" : "!"}
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily:
              "var(--font-family-heading)",
            color:
              "var(--color-wine-800)",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin:
              "var(--space-3) auto 0",
            maxWidth: "520px",
            color:
              "var(--color-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      </section>
    </main>
  );
}

export default function PublicProvenance() {
  const {
    publicId = "",
  } = useParams();

  const [
    state,
    setState,
  ] = useState(
    STATE.LOADING
  );

  const [
    provenance,
    setProvenance,
  ] = useState(null);

  useEffect(() => {
    let active = true;

    setState(
      STATE.LOADING
    );

    setProvenance(null);

    fetchPublicProvenance(
      publicId
    )
      .then((result) => {
        if (!active) {
          return;
        }

        setProvenance(
          result
        );

        setState(
          STATE.VERIFIED
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (
          error?.code ===
            PUBLIC_PROVENANCE_ERROR.NOT_FOUND ||
          error?.code ===
            PUBLIC_PROVENANCE_ERROR.INVALID_PUBLIC_ID
        ) {
          setState(
            STATE.NOT_FOUND
          );

          return;
        }

        setState(
          STATE.ERROR
        );
      });

    return () => {
      active = false;
    };
  }, [publicId]);

  if (
    state === STATE.LOADING
  ) {
    return (
      <StatusMessage
        title="Verifying provenance"
        message="Please wait while we securely verify this handloom product."
      />
    );
  }

  if (
    state === STATE.NOT_FOUND
  ) {
    return (
      <StatusMessage
        title="Verification unavailable"
        message="This provenance record could not be verified. Please check the QR code or contact the issuing organization."
      />
    );
  }

  if (
    state === STATE.ERROR
  ) {
    return (
      <StatusMessage
        title="Verification temporarily unavailable"
        message="We could not complete verification right now. Please try again later."
      />
    );
  }

  if (
    !provenance
  ) {
    return (
      <StatusMessage
        title="Verification unavailable"
        message="This provenance record could not be verified."
      />
    );
  }

  return (
    <main style={pageStyle}>
      <article style={cardStyle}>
        <header
          style={{
            padding:
              "var(--space-8) var(--space-6)",
            textAlign: "center",
            background:
              "linear-gradient(180deg, var(--color-cream-100), var(--color-white))",
          }}
        >
          <div
            aria-label="Verified provenance"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap:
                "var(--space-2)",
              padding:
                "8px 14px",
              borderRadius:
                "var(--radius-pill)",
              background:
                "rgba(35, 122, 75, 0.12)",
              color:
                "var(--color-success)",
              fontWeight: 800,
              fontSize:
                "var(--font-size-sm)",
            }}
          >
            <span aria-hidden="true">
              ✓
            </span>

            Verified Handloom Provenance
          </div>

          <h1
            style={{
              margin:
                "var(--space-4) 0 var(--space-2)",
              fontFamily:
                "var(--font-family-heading)",
              color:
                "var(--color-wine-800)",
              fontSize:
                "clamp(1.75rem, 6vw, 2.6rem)",
            }}
          >
            {provenance.product.name}
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "var(--color-text-secondary)",
            }}
          >
            Verified by {BRAND.name}
          </p>
        </header>

        <section style={sectionStyle}>
          <h2
            style={{
              margin:
                "0 0 var(--space-4)",
              fontFamily:
                "var(--font-family-heading)",
              color:
                "var(--color-wine-800)",
            }}
          >
            Product
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap:
                "var(--space-5)",
            }}
          >
            <Detail
              label="Product Name"
              value={
                provenance.product.name
              }
            />

            <Detail
              label="Product Code"
              value={
                provenance.product.sku
              }
            />

            <Detail
              label="Material"
              value={
                provenance.material
              }
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <h2
            style={{
              margin:
                "0 0 var(--space-4)",
              fontFamily:
                "var(--font-family-heading)",
              color:
                "var(--color-wine-800)",
            }}
          >
            Artisan
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap:
                "var(--space-5)",
            }}
          >
            <Detail
              label="Artisan Name"
              value={
                provenance.artisan.name
              }
            />

            <Detail
              label="Artisan Code"
              value={
                provenance.artisan.code
              }
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <h2
            style={{
              margin:
                "0 0 var(--space-4)",
              fontFamily:
                "var(--font-family-heading)",
              color:
                "var(--color-wine-800)",
            }}
          >
            Craft
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap:
                "var(--space-5)",
            }}
          >
            <Detail
              label="Weave Technique"
              value={
                provenance.weaveTechnique
              }
            />

            <Detail
              label="Loom Type"
              value={
                provenance.loomType
              }
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <h2
            style={{
              margin:
                "0 0 var(--space-4)",
              fontFamily:
                "var(--font-family-heading)",
              color:
                "var(--color-wine-800)",
            }}
          >
            Origin
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap:
                "var(--space-5)",
            }}
          >
            <Detail
              label="Village"
              value={
                provenance.origin.village
              }
            />

            <Detail
              label="District"
              value={
                provenance.origin.district
              }
            />

            <Detail
              label="State"
              value={
                provenance.origin.state
              }
            />

            <Detail
              label="Country"
              value={
                provenance.origin.country
              }
            />
          </div>
        </section>

        <footer
          style={{
            ...sectionStyle,
            textAlign: "center",
            color:
              "var(--color-text-muted)",
            fontSize:
              "var(--font-size-sm)",
          }}
        >
          <p
            style={{
              margin: 0,
            }}
          >
            Public Verification ID
          </p>

          <strong
            style={{
              display: "block",
              marginTop:
                "var(--space-1)",
              color:
                "var(--color-text-secondary)",
              overflowWrap:
                "anywhere",
            }}
          >
            {provenance.publicId}
          </strong>
        </footer>
      </article>
    </main>
  );
}
