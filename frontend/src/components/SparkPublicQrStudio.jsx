import {
  useState,
} from "react";

import {
  BRAND,
} from "../config/branding";

import {
  fetchPublicProvenance,
} from "../services/publicProvenance.js";

import {
  generatePublicProvenanceQrDataUrl,
} from "../services/provenanceQr.js";

import {
  buildPrintableProvenanceTagModel,
} from "../services/provenancePrint.js";

function appendText(
  documentRef,
  parent,
  className,
  text
) {
  const element =
    documentRef.createElement(
      "div"
    );

  element.className =
    className;

  element.textContent =
    text;

  parent.appendChild(
    element
  );

  return element;
}

function openPrintableTag({
  provenance,
  qrDataUrl,
}) {
  const model =
    buildPrintableProvenanceTagModel({
      brandName:
        BRAND.name,

      provenance: {
        ...provenance,
        status:
          "published",
      },

      qrDataUrl,

      origin:
        window.location.origin,
    });

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=520,height=760"
    );

  if (!printWindow) {
    throw new Error(
      "Print window open కాలేదు. Browser popup permission check చేయండి."
    );
  }

  printWindow.opener = null;

  const doc =
    printWindow.document;

  doc.title =
    `${model.product.name} - Provenance Tag`;

  const style =
    doc.createElement(
      "style"
    );

  style.textContent = `
    @page {
      size: 90mm 140mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 8px;
      background: #fff;
      color: #111;
      font-family: Arial, sans-serif;
    }

    .tag {
      width: 90mm;
      min-height: 140mm;
      margin: 0 auto;
      padding: 8px;
      border: 1px solid #111;
      border-radius: 10px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .brand {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 2px;
    }

    .subtitle {
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .qr {
      display: block;
      width: 180px;
      max-width: 100%;
      height: auto;
      margin: 2px auto 6px;
    }

    .product {
      margin: 4px 0 6px;
      font-size: 14px;
      font-weight: 800;
    }

    .details {
      display: grid;
      gap: 3px;
      text-align: left;
      font-size: 10px;
      line-height: 1.25;
    }

    .public-id {
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px solid #bbb;
      font-size: 8px;
      overflow-wrap: anywhere;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  `;

  doc.head.appendChild(
    style
  );

  const tag =
    doc.createElement(
      "main"
    );

  tag.className =
    "tag";

  appendText(
    doc,
    tag,
    "brand",
    model.brandName
  );

  appendText(
    doc,
    tag,
    "subtitle",
    "Verified Handloom Provenance"
  );

  const image =
    doc.createElement(
      "img"
    );

  image.className =
    "qr";

  image.alt =
    "Public provenance verification QR code";

  tag.appendChild(
    image
  );

  appendText(
    doc,
    tag,
    "product",
    model.product.name
  );

  const details =
    doc.createElement(
      "section"
    );

  details.className =
    "details";

  const rows = [
    [
      "SKU",
      model.product.sku,
    ],
    [
      "Artisan",
      `${model.artisan.name} (${model.artisan.code})`,
    ],
    [
      "Material",
      model.material,
    ],
    [
      "Weave",
      model.weaveTechnique,
    ],
    [
      "Loom",
      model.loomType,
    ],
    [
      "Origin",
      [
        model.origin.village,
        model.origin.district,
        model.origin.state,
        model.origin.country,
      ].join(", "),
    ],
  ];

  for (const [
    label,
    value,
  ] of rows) {
    appendText(
      doc,
      details,
      "",
      `${label}: ${value}`
    );
  }

  tag.appendChild(
    details
  );

  appendText(
    doc,
    tag,
    "public-id",
    `Scan QR to verify · Public ID: ${model.publicId}`
  );

  doc.body.replaceChildren(
    tag
  );

  image.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  image.onerror = () => {
    printWindow.close();
  };

  image.src =
    model.qrDataUrl;
}

export default function SparkPublicQrStudio() {
  const [
    publicId,
    setPublicId,
  ] = useState("");

  const [
    provenance,
    setProvenance,
  ] = useState(null);

  const [
    qrDataUrl,
    setQrDataUrl,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function handleLoad(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setProvenance(null);
    setQrDataUrl("");

    try {
      const result =
        await fetchPublicProvenance(
          publicId
        );

      setPublicId(
        result.publicId
      );

      setProvenance(
        result
      );
    } catch (loadError) {
      setError(
        loadError?.message ||
        "Published provenance load కాలేదు."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQr() {
    if (!provenance) {
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const result =
        await generatePublicProvenanceQrDataUrl(
          provenance.publicId
        );

      setQrDataUrl(
        result
      );
    } catch (qrError) {
      setError(
        qrError?.message ||
        "QR code generate కాలేదు."
      );
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    if (
      !provenance ||
      !qrDataUrl
    ) {
      return;
    }

    setError("");

    try {
      openPrintableTag({
        provenance,
        qrDataUrl,
      });
    } catch (printError) {
      setError(
        printError?.message ||
        "Saree tag print prepare కాలేదు."
      );
    }
  }

  return (
    <section
      className="card"
      style={{
        padding:
          "var(--space-6)",
        display:
          "grid",
        gap:
          "var(--space-4)",
      }}
    >
      <div>
        <h3
          style={{
            margin:
              "0 0 var(--space-2)",
          }}
        >
          Live QR / Saree Tag Studio
        </h3>

        <p
          style={{
            margin: 0,
            color:
              "var(--color-text-muted)",
            lineHeight: 1.6,
          }}
        >
          Published Public Verification ID ఉపయోగించి:
          1) Load Published Provenance →
          2) Generate QR →
          3) Print Saree Tag.
          ఇది Sparkలో read-onlyగా పనిచేస్తుంది;
          future Blaze protected management flow అలాగే ఉంటుంది.
        </p>
      </div>

      <form
        onSubmit={
          handleLoad
        }
        style={{
          display:
            "grid",
          gap:
            "var(--space-3)",
        }}
      >
        <label
          style={{
            display:
              "grid",
            gap:
              "8px",
            fontWeight: 700,
          }}
        >
          Public Verification ID

          <input
            type="text"
            value={
              publicId
            }
            onChange={(
              event
            ) => {
              setPublicId(
                event.target.value
              );

              setProvenance(
                null
              );

              setQrDataUrl(
                ""
              );
            }}
            placeholder="Example: pub_..."
            autoComplete="off"
            style={{
              width:
                "100%",
              minHeight:
                "50px",
              padding:
                "12px 14px",
              border:
                "1px solid var(--color-border-medium)",
              borderRadius:
                "var(--radius-sm)",
              background:
                "#fff",
              fontSize:
                "16px",
            }}
          />
        </label>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={
            loading
          }
        >
          {loading
            ? "Loading..."
            : "Load Published Provenance"}
        </button>
      </form>

      {error ? (
        <div
          role="alert"
          style={{
            color:
              "var(--color-danger)",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      {provenance ? (
        <div
          style={{
            padding:
              "var(--space-4)",
            border:
              "1px solid var(--color-border-light)",
            borderRadius:
              "var(--radius-sm)",
            display:
              "grid",
            gap:
              "var(--space-3)",
          }}
        >
          <div>
            <strong>
              {
                provenance
                  .product
                  .name
              }
            </strong>

            <div
              style={{
                marginTop:
                  "4px",
                color:
                  "var(--color-text-muted)",
              }}
            >
              SKU: {
                provenance
                  .product
                  .sku
              }
            </div>

            <div
              style={{
                marginTop:
                  "4px",
                color:
                  "var(--color-text-muted)",
                overflowWrap:
                  "anywhere",
              }}
            >
              Public ID: {
                provenance
                  .publicId
              }
            </div>
          </div>

          <a
            className="btn btn--ghost"
            href={`/provenance/${encodeURIComponent(
              provenance.publicId
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Verification
          </a>

          <button
            type="button"
            className="btn btn--primary"
            onClick={
              handleGenerateQr
            }
            disabled={
              generating
            }
          >
            {generating
              ? "Generating QR..."
              : qrDataUrl
                ? "Regenerate QR"
                : "Generate QR"}
          </button>

          {qrDataUrl ? (
            <div
              style={{
                display:
                  "grid",
                justifyItems:
                  "center",
                gap:
                  "var(--space-3)",
                padding:
                  "var(--space-4)",
                background:
                  "#fff",
                border:
                  "1px solid var(--color-border-light)",
                borderRadius:
                  "var(--radius-sm)",
              }}
            >
              <strong>
                QR Preview
              </strong>

              <img
                src={
                  qrDataUrl
                }
                alt={
                  `QR code for ${provenance.product.name}`
                }
                style={{
                  width:
                    "220px",
                  maxWidth:
                    "100%",
                  height:
                    "auto",
                }}
              />

              <span
                style={{
                  fontSize:
                    "12px",
                  textAlign:
                    "center",
                }}
              >
                Scan to open the live verification page.
              </span>

              <button
                type="button"
                className="btn btn--primary"
                onClick={
                  handlePrint
                }
              >
                Print Saree Tag
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
