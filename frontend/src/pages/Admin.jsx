import { useEffect, useState } from "react";
import {
  FaBox,
  FaPlus,
  FaUser,
  FaTrash,
  FaInfoCircle
} from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { useOrders } from "../context/OrderContext";
import { BRAND } from "../config/branding";
import ProvenanceSetupPanel from "../components/ProvenanceSetupPanel.jsx";
import {
  fetchManagedProvenance,
} from "../services/provenanceManagement.js";
import {
  publishProvenance,
  archiveProvenance,
} from "../services/provenanceLifecycle.js";
import {
  generatePublicProvenanceQrDataUrl,
} from "../services/provenanceQr.js";
import {
  buildPrintableProvenanceTagModel,
} from "../services/provenancePrint.js";

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  originalPrice: "",
  category: "Kanchipuram",
  desc: "",
  stock: "",
  sku: "",
  image: "",
  offer: "",
  featured: false,
  active: true
};

const ORDER_FULFILMENT_ACTIONS =
  Object.freeze({
    Processing: Object.freeze({
      nextStatus: "Confirmed",
      label: "Confirm Order"
    }),

    Confirmed: Object.freeze({
      nextStatus: "Packed",
      label: "Mark Packed"
    }),

    Packed: Object.freeze({
      nextStatus: "Shipped",
      label: "Mark Shipped"
    }),

    Shipped: Object.freeze({
      nextStatus: "Delivered",
      label: "Mark Delivered"
    })
  });

function Admin({ user }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [
    statusUpdatingOrderId,
    setStatusUpdatingOrderId
  ] = useState("");

  const [
    statusUpdateError,
    setStatusUpdateError
  ] = useState(null);

  const [
    provenanceByProductId,
    setProvenanceByProductId
  ] = useState({});

  const [
    provenanceLoadingByProductId,
    setProvenanceLoadingByProductId
  ] = useState({});

  const [
    provenanceErrorByProductId,
    setProvenanceErrorByProductId
  ] = useState({});

  const [
    provenanceActionByProductId,
    setProvenanceActionByProductId
  ] = useState({});

  const [
    provenanceActionErrorByProductId,
    setProvenanceActionErrorByProductId
  ] = useState({});

  const [
    provenanceQrByProductId,
    setProvenanceQrByProductId
  ] = useState({});

  const [
    provenanceQrGeneratingByProductId,
    setProvenanceQrGeneratingByProductId
  ] = useState({});

  const [
    provenanceQrErrorByProductId,
    setProvenanceQrErrorByProductId
  ] = useState({});

  const {
    products = [],
    addProduct,
    removeProduct
  } = useProducts();

  const {
    orders = [],
    updateOrderStatus
  } = useOrders();

  useEffect(() => {
    let active = true;

    async function loadLinkedProvenance() {
      if (
        !user ||
        typeof user.getIdToken !== "function"
      ) {
        return;
      }

      const linkedProducts =
        products.filter((product) => {
          const provenanceId =
            typeof product?.provenanceId === "string"
              ? product.provenanceId.trim()
              : "";

          return Boolean(
            provenanceId &&
            !provenanceId.includes("/") &&
            provenanceId.length <= 128
          );
        });

      for (const product of linkedProducts) {
        const productId =
          String(product.id || "").trim();

        const provenanceId =
          product.provenanceId.trim();

        if (
          !active ||
          !productId
        ) {
          continue;
        }

        setProvenanceLoadingByProductId(
          (current) => ({
            ...current,
            [productId]: true
          })
        );

        setProvenanceErrorByProductId(
          (current) => ({
            ...current,
            [productId]: ""
          })
        );

        try {
          const provenance =
            await fetchManagedProvenance(
              provenanceId,
              user
            );

          if (!active) {
            return;
          }

          setProvenanceByProductId(
            (current) => ({
              ...current,
              [productId]:
                provenance
            })
          );
        } catch (error) {
          if (!active) {
            return;
          }

          setProvenanceErrorByProductId(
            (current) => ({
              ...current,
              [productId]:
                error?.message ||
                "Provenance status load కాలేదు."
            })
          );
        } finally {
          if (active) {
            setProvenanceLoadingByProductId(
              (current) => ({
                ...current,
                [productId]: false
              })
            );
          }
        }
      }
    }

    loadLinkedProvenance();

    return () => {
      active = false;
    };
  }, [products, user]);

  function handlePrintProvenanceTag(
    product
  ) {
    const productId =
      String(product?.id || "").trim();

    const provenance =
      provenanceByProductId[
        productId
      ];

    const qrDataUrl =
      provenanceQrByProductId[
        productId
      ];

    if (
      !productId ||
      !provenance ||
      provenance.status !== "published" ||
      !qrDataUrl
    ) {
      return;
    }

    let model;

    try {
      model =
        buildPrintableProvenanceTagModel({
          brandName:
            BRAND.name,

          provenance,

          qrDataUrl,

          origin:
            window.location.origin,
        });
    } catch (error) {
      setProvenanceQrErrorByProductId(
        (current) => ({
          ...current,
          [productId]:
            error?.message ||
            "Printable tag prepare కాలేదు."
        })
      );

      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=520,height=760"
      );

    if (!printWindow) {
      setProvenanceQrErrorByProductId(
        (current) => ({
          ...current,
          [productId]:
            "Print window open కాలేదు. Browser popup permission check చేయండి."
        })
      );

      return;
    }

    printWindow.opener = null;

    const doc =
      printWindow.document;

    doc.title =
      model.product.name +
      " - Provenance Tag";

    const style =
      doc.createElement(
        "style"
      );

    style.textContent = `
      @page {
        size: auto;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 12px;
        color: #111;
        background: #fff;
        font-family: Arial, sans-serif;
      }

      .tag {
        width: 100%;
        border: 2px solid #111;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
      }

      .brand {
        margin: 0 0 4px;
        font-size: 22px;
        font-weight: 800;
      }

      .subtitle {
        margin: 0 0 14px;
        font-size: 13px;
        font-weight: 700;
      }

      .qr {
        width: 210px;
        max-width: 100%;
        height: auto;
        margin: 4px auto 12px;
        display: block;
      }

      .product {
        margin: 8px 0 12px;
        font-size: 18px;
        font-weight: 800;
      }

      .details {
        display: grid;
        gap: 6px;
        text-align: left;
        font-size: 12px;
        line-height: 1.4;
      }

      .line strong {
        font-weight: 800;
      }

      .verify {
        margin-top: 14px;
        padding-top: 10px;
        border-top: 1px solid #bbb;
        font-size: 11px;
        line-height: 1.4;
        word-break: break-word;
      }

      @media print {
        body {
          padding: 0;
        }

        .tag {
          width: 90mm;
          height: 140mm;
          margin: 0 auto;
          padding: 8px;
          border-width: 1px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .brand {
          font-size: 18px;
          margin-bottom: 2px;
        }

        .subtitle {
          margin: 0 0 6px;
          font-size: 10px;
        }

        .qr {
          width: 180px;
          margin: 2px auto 6px;
        }

        .product {
          margin: 4px 0 6px;
          font-size: 14px;
        }

        .details {
          gap: 3px;
          font-size: 10px;
          line-height: 1.2;
        }

        .verify {
          margin-top: 6px;
          padding-top: 5px;
          font-size: 8px;
          line-height: 1.2;
          overflow-wrap: anywhere;
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

    function addText(
      className,
      text
    ) {
      const element =
        doc.createElement(
          "div"
        );

      element.className =
        className;

      element.textContent =
        text;

      tag.appendChild(
        element
      );

      return element;
    }

    addText(
      "brand",
      model.brandName
    );

    addText(
      "subtitle",
      "Verified Handloom Provenance"
    );

    const qrImage =
      doc.createElement(
        "img"
      );

    qrImage.className =
      "qr";

    qrImage.alt =
      "Public provenance verification QR code";

    tag.appendChild(
      qrImage
    );

    addText(
      "product",
      model.product.name
    );

    const details =
      doc.createElement(
        "section"
      );

    details.className =
      "details";

    function addDetail(
      label,
      value
    ) {
      const row =
        doc.createElement(
          "div"
        );

      row.className =
        "line";

      const strong =
        doc.createElement(
          "strong"
        );

      strong.textContent =
        label + ": ";

      row.appendChild(
        strong
      );

      row.appendChild(
        doc.createTextNode(
          value
        )
      );

      details.appendChild(
        row
      );
    }

    addDetail(
      "SKU",
      model.product.sku
    );

    addDetail(
      "Artisan",
      model.artisan.name +
        " (" +
        model.artisan.code +
        ")"
    );

    addDetail(
      "Material",
      model.material
    );

    addDetail(
      "Weave",
      model.weaveTechnique
    );

    addDetail(
      "Loom",
      model.loomType
    );

    addDetail(
      "Origin",
      [
        model.origin.village,
        model.origin.district,
        model.origin.state,
        model.origin.country,
      ].join(", ")
    );

    tag.appendChild(
      details
    );

    addText(
      "verify",
      "Scan QR to verify · Public ID: " +
        model.publicId
    );

    doc.body.replaceChildren(
      tag
    );

    qrImage.onload = () => {
      printWindow.focus();

      printWindow.print();
    };

    qrImage.onerror = () => {
      printWindow.close();

      setProvenanceQrErrorByProductId(
        (current) => ({
          ...current,
          [productId]:
            "Printable QR image load కాలేదు."
        })
      );
    };

    qrImage.src =
      model.qrDataUrl;
  }

  async function handleGenerateProvenanceQr(
    product
  ) {
    const productId =
      String(product?.id || "").trim();

    const provenance =
      provenanceByProductId[
        productId
      ];

    if (
      !productId ||
      !provenance ||
      provenance.status !== "published"
    ) {
      return;
    }

    setProvenanceQrGeneratingByProductId(
      (current) => ({
        ...current,
        [productId]: true
      })
    );

    setProvenanceQrErrorByProductId(
      (current) => ({
        ...current,
        [productId]: ""
      })
    );

    try {
      const qrDataUrl =
        await generatePublicProvenanceQrDataUrl(
          provenance.publicId
        );

      setProvenanceQrByProductId(
        (current) => ({
          ...current,
          [productId]:
            qrDataUrl
        })
      );
    } catch (error) {
      setProvenanceQrErrorByProductId(
        (current) => ({
          ...current,
          [productId]:
            error?.message ||
            "QR code generate కాలేదు."
        })
      );
    } finally {
      setProvenanceQrGeneratingByProductId(
        (current) => ({
          ...current,
          [productId]: false
        })
      );
    }
  }

  async function handleProvenanceLifecycleAction(
    product,
    action
  ) {
    const productId =
      String(product?.id || "").trim();

    const provenanceId =
      typeof product?.provenanceId === "string"
        ? product.provenanceId.trim()
        : "";

    if (
      !productId ||
      !provenanceId ||
      provenanceId.includes("/") ||
      provenanceId.length > 128
    ) {
      return;
    }

    setProvenanceActionByProductId(
      (current) => ({
        ...current,
        [productId]: action
      })
    );

    setProvenanceActionErrorByProductId(
      (current) => ({
        ...current,
        [productId]: ""
      })
    );

    try {
      if (action === "publish") {
        await publishProvenance(
          provenanceId,
          user
        );
      } else if (action === "archive") {
        await archiveProvenance(
          provenanceId,
          user
        );
      } else {
        throw new Error(
          "Unsupported provenance lifecycle action."
        );
      }

      const refreshed =
        await fetchManagedProvenance(
          provenanceId,
          user
        );

      setProvenanceByProductId(
        (current) => ({
          ...current,
          [productId]:
            refreshed
        })
      );
    } catch (error) {
      setProvenanceActionErrorByProductId(
        (current) => ({
          ...current,
          [productId]:
            error?.message ||
            "Provenance status update కాలేదు."
        })
      );
    } finally {
      setProvenanceActionByProductId(
        (current) => ({
          ...current,
          [productId]: ""
        })
      );
    }
  }

  function updateField(field, value) {
    setNewProduct((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleClear() {
    setNewProduct(EMPTY_PRODUCT);
  }

  function handleImageSlotChange(index, file) {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (
      file.size > 15 * 1024 * 1024 ||
      !allowedTypes.includes(file.type)
    ) {
      alert(
        "Image JPG, PNG లేదా WEBP formatలో 15MB కంటే తక్కువగా ఉండాలి."
      );
      return;
    }

    setSelectedImageFiles((currentFiles) => {
      const nextFiles = [...currentFiles];
      nextFiles[index] = file;
      return nextFiles;
    });

    const previewUrl = URL.createObjectURL(file);

    setImagePreviews((currentPreviews) => {
      const nextPreviews = [...currentPreviews];
      nextPreviews[index] = previewUrl;

      if (index === 0) {
        updateField("image", previewUrl);
      }

      return nextPreviews;
    });

    setUploadProgress(0);
  }

  function removeImageSlot(index) {
    setSelectedImageFiles((currentFiles) => {
      const nextFiles = [...currentFiles];
      nextFiles[index] = undefined;
      return nextFiles;
    });

    setImagePreviews((currentPreviews) => {
      const nextPreviews = [...currentPreviews];
      nextPreviews[index] = "";

      if (index === 0) {
        updateField("image", nextPreviews[1] || "");
      }

      return nextPreviews;
    });
  }

  async function compressImage(file) {
    const imageBitmap = await createImageBitmap(file);

    const maxDimension = 1600;
    const scale = Math.min(
      1,
      maxDimension / Math.max(
        imageBitmap.width,
        imageBitmap.height
      )
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imageBitmap.width * scale);
    canvas.height = Math.round(imageBitmap.height * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Image compression failed.");
    }

    context.drawImage(
      imageBitmap,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const compressedBlob = await new Promise(
      (resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(
                new Error("Compressed image could not be created.")
              );
            }
          },
          "image/webp",
          0.82
        );
      }
    );

    return new File(
      [compressedBlob],
      `${Date.now()}-avsilks.webp`,
      {
        type: "image/webp"
      }
    );
  }

  async function uploadImageToCloudinary(file) {
    const cloudName =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const uploadPreset =
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary configuration missing."
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "avsilks/products");

    setUploadProgress(20);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    setUploadProgress(80);

    const result = await response.json();

    if (!response.ok || !result.secure_url) {
      throw new Error(
        result?.error?.message ||
        "Image upload failed."
      );
    }

    setUploadProgress(100);

    return result.secure_url;
  }

  async function handleAdd(event) {
    event.preventDefault();

    const name = newProduct.name.trim();
    const price = Number(newProduct.price);
    const originalPrice = newProduct.originalPrice
      ? Number(newProduct.originalPrice)
      : price;
    const stock = Number(newProduct.stock);
    const sku = newProduct.sku.trim().toUpperCase();

    if (!name) {
      alert("చీర పేరు నమోదు చేయండి.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("సరైన ధర నమోదు చేయండి.");
      return;
    }

    if (
      !Number.isFinite(originalPrice) ||
      originalPrice < price
    ) {
      alert("Original Price అమ్మకపు ధర కంటే తక్కువగా ఉండకూడదు.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      alert("Stock quantity సరైన సంఖ్యగా ఇవ్వండి.");
      return;
    }

    if (!sku) {
      alert("SKU / Product Code నమోదు చేయండి.");
      return;
    }

    const duplicateSku = products.some(
      (product) =>
        String(product.sku || "").toUpperCase() === sku
    );

    if (duplicateSku) {
      alert("ఈ SKU ఇప్పటికే ఉంది. వేరే SKU ఇవ్వండి.");
      return;
    }

    setSubmitting(true);

    try {
      const offerPercent =
        originalPrice > price
          ? Math.round(
              ((originalPrice - price) / originalPrice) * 100
            )
          : 0;

      const uploadedImages = [];
      const validImageFiles =
        selectedImageFiles.filter(Boolean);

      if (validImageFiles.length === 0) {
        throw new Error(
          "Main product image is required."
        );
      }

      for (const file of validImageFiles) {
        const compressedImage =
          await compressImage(file);

        const imageUrl =
          await uploadImageToCloudinary(
            compressedImage
          );

        uploadedImages.push(imageUrl);
      }

      const uploadedImageUrl =
        uploadedImages[0] || "";

      const result = await addProduct({
        name,
        price,
        originalPrice,
        category: newProduct.category,
        desc: newProduct.desc.trim(),
        stock,
        stockStatus: stock > 0 ? "In Stock" : "Out of Stock",
        sku,
        image: uploadedImageUrl,
        images: uploadedImages,
        offer: newProduct.offer.trim() || `${offerPercent}%`,
        featured: newProduct.featured,
        active: newProduct.active
      }, user);

      if (!result?.success) {
        return;
      }

      alert("కొత్త చీర విజయవంతంగా యాడ్ చేయబడింది!");
      setNewProduct(EMPTY_PRODUCT);
      setSelectedImageFiles([]);
      setImagePreviews([]);
      setUploadProgress(0);
    } catch (error) {
      console.error("Product add failed:", error);
      alert("Product add కాలేదు. మళ్లీ ప్రయత్నించండి.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    minHeight: "52px",
    padding: "14px 16px",
    border: "1px solid var(--color-border-medium)",
    borderRadius: "var(--radius-sm)",
    background: "#fff",
    fontSize: "16px",
    outline: "none"
  };

  const labelStyle = {
    display: "grid",
    gap: "8px",
    fontWeight: 700,
    color: "var(--color-text)"
  };

  async function handleOrderStatusUpdate(
    order
  ) {
    const orderId =
      String(order?.id || "").trim();

    const currentStatus =
      String(order?.status || "").trim();

    const action =
      ORDER_FULFILMENT_ACTIONS[
        currentStatus
      ];

    if (
      !orderId ||
      orderId.includes("/") ||
      orderId.length > 128
    ) {
      setStatusUpdateError({
        orderId,
        message:
          "Valid order ID అందుబాటులో లేదు."
      });

      return;
    }

    if (
      !action ||
      statusUpdatingOrderId
    ) {
      return;
    }

    setStatusUpdatingOrderId(orderId);
    setStatusUpdateError(null);

    try {
      await updateOrderStatus(
        orderId,
        action.nextStatus,
        `Admin changed order status from ${currentStatus} to ${action.nextStatus}.`
      );
    } catch (error) {
      setStatusUpdateError({
        orderId,
        message:
          error?.message ||
          "Order status update కాలేదు. మళ్లీ ప్రయత్నించండి."
      });
    } finally {
      setStatusUpdatingOrderId("");
    }
  }

  return (
    <main
      className="container section"
      style={{ minHeight: "100vh" }}
    >
      <h2
        className="section__title"
        style={{
          textAlign: "center",
          marginBottom: "var(--space-6)"
        }}
      >
        Admin Dashboard
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-8)"
        }}
      >
        <button
          type="button"
          className={`btn ${
            activeTab === "orders"
              ? "btn--primary"
              : "btn--ghost"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          <FaBox /> Orders ({orders.length})
        </button>

        <button
          type="button"
          className={`btn ${
            activeTab === "products"
              ? "btn--primary"
              : "btn--ghost"
          }`}
          onClick={() => setActiveTab("products")}
        >
          <FaPlus /> Manage Sarees
        </button>

        <button
          type="button"
          className={`btn ${
            activeTab === "provenance"
              ? "btn--primary"
              : "btn--ghost"
          }`}
          onClick={() => setActiveTab("provenance")}
        >
          <FaInfoCircle /> Provenance / Traceability
        </button>
      </div>

      {activeTab === "orders" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)"
          }}
        >
          {orders.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "var(--space-6)",
                textAlign: "center"
              }}
            >
              ఇంకా ఆర్డర్స్ రాలేదు.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="card"
                style={{
                  padding: "var(--space-4)",
                  borderLeft:
                    order.status === "Cancelled"
                      ? "5px solid var(--color-danger)"
                      : "5px solid var(--color-success)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-3)",
                    borderBottom:
                      "1px solid var(--color-border-light)",
                    paddingBottom: "var(--space-2)"
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {order.id}
                  </span>

                  <span
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-muted)"
                    }}
                  >
                    {order.date}
                  </span>
                </div>

                <div style={{ marginBottom: "var(--space-3)" }}>
                  <div>
                    <FaUser /> Customer:{" "}
                    {order.customerName || `${BRAND.name} Buyer`}
                  </div>

                  <div
                    style={{
                      background: "var(--color-cream-100)",
                      padding: "var(--space-2)",
                      marginTop: "var(--space-2)",
                      borderRadius: "var(--radius-sm)"
                    }}
                  >
                    <strong>{order.product}</strong>{" "}
                    <span
                      style={{
                        color: "var(--color-success)",
                        fontWeight: "bold"
                      }}
                    >
                      ₹{order.price}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      color:
                        order.status === "Cancelled"
                          ? "var(--color-danger)"
                          : "var(--color-warning)"
                    }}
                  >
                    {order.status}
                  </span>

                  {ORDER_FULFILMENT_ACTIONS[
                    order.status
                  ] ? (
                    <div
                      style={{
                        display: "grid",
                        gap: "8px"
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() =>
                          handleOrderStatusUpdate(
                            order
                          )
                        }
                        disabled={Boolean(
                          statusUpdatingOrderId
                        )}
                      >
                        {statusUpdatingOrderId ===
                        String(order.id || "")
                          ? "Updating..."
                          : ORDER_FULFILMENT_ACTIONS[
                              order.status
                            ].label}
                      </button>

                      {statusUpdateError?.orderId ===
                      String(order.id || "") ? (
                        <span
                          role="alert"
                          style={{
                            color:
                              "var(--color-danger)",
                            fontSize:
                              "var(--font-size-sm)",
                            fontWeight: 700
                          }}
                        >
                          {
                            statusUpdateError.message
                          }
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div style={{ display: "grid", gap: "var(--space-6)" }}>
          <section
            className="card"
            style={{ padding: "var(--space-6)" }}
          >
            <h3 style={{ marginBottom: "var(--space-2)" }}>
              Add New Saree
            </h3>

            <p
              style={{
                marginBottom: "var(--space-5)",
                color: "var(--color-text-muted)"
              }}
            >
              <FaInfoCircle /> Product వివరాలను పూర్తిగా నమోదు
              చేయండి.
            </p>

            <form
              onSubmit={handleAdd}
              style={{
                display: "grid",
                gap: "var(--space-4)"
              }}
            >
              <label style={labelStyle}>
                Saree Name *
                <input
                  type="text"
                  placeholder="Example: Kanchi Pattu Saree"
                  required
                  value={newProduct.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  style={fieldStyle}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "var(--space-4)"
                }}
              >
                <label style={labelStyle}>
                  Selling Price (₹) *
                  <input
                    type="number"
                    min="1"
                    placeholder="3200"
                    required
                    value={newProduct.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                    style={fieldStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Original Price / MRP (₹)
                  <input
                    type="number"
                    min="1"
                    placeholder="4000"
                    value={newProduct.originalPrice}
                    onChange={(event) =>
                      updateField(
                        "originalPrice",
                        event.target.value
                      )
                    }
                    style={fieldStyle}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "var(--space-4)"
                }}
              >
                <label style={labelStyle}>
                  Category *
                  <select
                    value={newProduct.category}
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value
                      )
                    }
                    style={fieldStyle}
                  >
                    <option value="Kanchipuram">
                      Kanchipuram
                    </option>
                    <option value="Dharmavaram">
                      Dharmavaram
                    </option>
                    <option value="Silk">
                      Silk Sarees
                    </option>
                    <option value="Cotton">
                      Cotton Sarees
                    </option>
                    <option value="Wedding">
                      Wedding Collection
                    </option>
                    <option value="New Arrivals">
                      New Arrivals
                    </option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Stock Quantity *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="10"
                    required
                    value={newProduct.stock}
                    onChange={(event) =>
                      updateField("stock", event.target.value)
                    }
                    style={fieldStyle}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "var(--space-4)"
                }}
              >
                <label style={labelStyle}>
                  SKU / Product Code *
                  <input
                    type="text"
                    placeholder="AV-KAN-001"
                    required
                    value={newProduct.sku}
                    onChange={(event) =>
                      updateField("sku", event.target.value)
                    }
                    style={fieldStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Offer
                  <input
                    type="text"
                    placeholder="20% OFF"
                    value={newProduct.offer}
                    onChange={(event) =>
                      updateField("offer", event.target.value)
                    }
                    style={fieldStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Description
                <textarea
                  placeholder="Fabric, colour, border, blouse piece, wash care వంటి వివరాలు..."
                  rows="5"
                  value={newProduct.desc}
                  onChange={(event) =>
                    updateField("desc", event.target.value)
                  }
                  style={{
                    ...fieldStyle,
                    minHeight: "130px",
                    resize: "vertical"
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gap: "14px"
                }}
              >
                <div>
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "6px"
                    }}
                  >
                    Product Images
                  </strong>

                  <small
                    style={{
                      color: "var(--color-text-muted)"
                    }}
                  >
                    Main imageతో కలిపి గరిష్టంగా 5 photos.
                    ప్రతి image 15MB లోపు ఉండాలి;
                    upload ముందు auto-compress అవుతుంది.
                  </small>
                </div>

                {[0, 1, 2, 3, 4].map((slotIndex) => (
                  <div
                    key={slotIndex}
                    style={{
                      padding: "12px",
                      border:
                        "1px solid var(--color-border-light)",
                      borderRadius: "var(--radius-sm)",
                      display: "grid",
                      gap: "10px"
                    }}
                  >
                    <label style={labelStyle}>
                      {slotIndex === 0
                        ? "Main Image *"
                        : `Gallery Image ${slotIndex + 1}`}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file =
                            event.target.files?.[0];

                          handleImageSlotChange(
                            slotIndex,
                            file
                          );
                        }}
                        style={{
                          ...fieldStyle,
                          padding: "12px"
                        }}
                      />
                    </label>

                    {imagePreviews[slotIndex] && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap"
                        }}
                      >
                        <img
                          src={imagePreviews[slotIndex]}
                          alt={`Product preview ${
                            slotIndex + 1
                          }`}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: "100px",
                            aspectRatio: "3 / 4",
                            objectFit: "cover",
                            borderRadius: "10px"
                          }}
                        />

                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() =>
                            removeImageSlot(slotIndex)
                          }
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  padding: "12px 0"
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 700
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newProduct.featured}
                    onChange={(event) =>
                      updateField(
                        "featured",
                        event.target.checked
                      )
                    }
                  />
                  Featured Product
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 700
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newProduct.active}
                    onChange={(event) =>
                      updateField("active", event.target.checked)
                    }
                  />
                  Active
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "var(--space-3)"
                }}
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleClear}
                  disabled={submitting}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                >
                  <FaPlus />
                  {submitting
                    ? "Adding..."
                    : "Add Product"}
                </button>
              </div>
            </form>
          </section>

          <section
            className="card"
            style={{ padding: "var(--space-6)" }}
          >
            <h3 style={{ marginBottom: "var(--space-4)" }}>
              Existing Sarees ({products.length})
            </h3>

            {products.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)" }}>
                ఇంకా products లేవు.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "var(--space-3)"
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "72px minmax(0, 1fr) auto",
                      gap: "12px",
                      alignItems: "center",
                      padding: "12px",
                      border:
                        "1px solid var(--color-border-light)",
                      borderRadius: "var(--radius-sm)"
                    }}
                  >
                    <div
                      style={{
                        width: "72px",
                        height: "86px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "var(--color-cream-100)",
                        display: "grid",
                        placeItems: "center"
                      }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "12px" }}>
                          No Image
                        </span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <strong>{product.name}</strong>
                      <div
                        style={{
                          color: "var(--color-text-muted)",
                          marginTop: "4px"
                        }}
                      >
                        ₹{product.price} ·{" "}
                        {product.category || "Uncategorized"}
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          marginTop: "4px"
                        }}
                      >
                        SKU: {product.sku || "N/A"} · Stock:{" "}
                        {product.stock ?? "N/A"}
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px",
                          border:
                            "1px solid var(--color-border-light)",
                          borderRadius: "10px",
                          display: "grid",
                          gap: "8px"
                        }}
                      >
                        {!product.provenanceId ? (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--color-text-muted)"
                            }}
                          >
                            Provenance: Not linked
                          </span>
                        ) : provenanceLoadingByProductId[
                            product.id
                          ] ? (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--color-text-muted)"
                            }}
                          >
                            Provenance status loading...
                          </span>
                        ) : provenanceErrorByProductId[
                            product.id
                          ] ? (
                          <span
                            role="alert"
                            style={{
                              fontSize: "13px",
                              color: "var(--color-danger)"
                            }}
                          >
                            {
                              provenanceErrorByProductId[
                                product.id
                              ]
                            }
                          </span>
                        ) : provenanceByProductId[
                            product.id
                          ] ? (
                          <>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                flexWrap: "wrap"
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: "13px"
                                }}
                              >
                                Provenance:{" "}
                                {
                                  provenanceByProductId[
                                    product.id
                                  ].status
                                }
                              </strong>

                              <span
                                style={{
                                  fontSize: "12px",
                                  color:
                                    "var(--color-text-muted)",
                                  wordBreak: "break-all"
                                }}
                              >
                                Public ID:{" "}
                                {
                                  provenanceByProductId[
                                    product.id
                                  ].publicId
                                }
                              </span>
                            </div>

                            {provenanceByProductId[
                              product.id
                            ].status === "draft" && (
                              <button
                                type="button"
                                className="btn btn--primary"
                                disabled={Boolean(
                                  provenanceActionByProductId[
                                    product.id
                                  ]
                                )}
                                onClick={() => {
                                  const confirmed =
                                    window.confirm(
                                      "Publish provenance? Once published, it becomes publicly verifiable and cannot return to draft."
                                    );

                                  if (confirmed) {
                                    handleProvenanceLifecycleAction(
                                      product,
                                      "publish"
                                    );
                                  }
                                }}
                              >
                                {provenanceActionByProductId[
                                  product.id
                                ] === "publish"
                                  ? "Publishing..."
                                  : "Publish Provenance"}
                              </button>
                            )}

                            {provenanceByProductId[
                              product.id
                            ].status === "published" && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap"
                                }}
                              >
                                <a
                                  className="btn btn--ghost"
                                  href={`/provenance/${encodeURIComponent(
                                    provenanceByProductId[
                                      product.id
                                    ].publicId
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Verification
                                </a>

                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  disabled={
                                    Boolean(
                                      provenanceActionByProductId[
                                        product.id
                                      ]
                                    ) ||
                                    Boolean(
                                      provenanceQrGeneratingByProductId[
                                        product.id
                                      ]
                                    )
                                  }
                                  onClick={() =>
                                    handleGenerateProvenanceQr(
                                      product
                                    )
                                  }
                                >
                                  {provenanceQrGeneratingByProductId[
                                    product.id
                                  ]
                                    ? "Generating QR..."
                                    : provenanceQrByProductId[
                                        product.id
                                      ]
                                      ? "Regenerate QR"
                                      : "Generate QR"}
                                </button>

                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  disabled={Boolean(
                                    provenanceActionByProductId[
                                      product.id
                                    ]
                                  )}
                                  onClick={() => {
                                    const confirmed =
                                      window.confirm(
                                        "Archive provenance? Public verification will become unavailable and this record cannot be published again."
                                      );

                                    if (confirmed) {
                                      handleProvenanceLifecycleAction(
                                        product,
                                        "archive"
                                      );
                                    }
                                  }}
                                >
                                  {provenanceActionByProductId[
                                    product.id
                                  ] === "archive"
                                    ? "Archiving..."
                                    : "Archive Provenance"}
                                </button>

                                {provenanceQrErrorByProductId[
                                  product.id
                                ] && (
                                  <span
                                    role="alert"
                                    style={{
                                      flexBasis: "100%",
                                      fontSize: "13px",
                                      color:
                                        "var(--color-danger)"
                                    }}
                                  >
                                    {
                                      provenanceQrErrorByProductId[
                                        product.id
                                      ]
                                    }
                                  </span>
                                )}

                                {provenanceQrByProductId[
                                  product.id
                                ] && (
                                  <div
                                    style={{
                                      flexBasis: "100%",
                                      marginTop: "6px",
                                      padding: "14px",
                                      display: "grid",
                                      justifyItems: "center",
                                      gap: "10px",
                                      border:
                                        "1px solid var(--color-border-light)",
                                      borderRadius: "12px",
                                      background: "#ffffff"
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: "14px"
                                      }}
                                    >
                                      QR Preview
                                    </strong>

                                    <img
                                      src={
                                        provenanceQrByProductId[
                                          product.id
                                        ]
                                      }
                                      alt={
                                        "QR code for " +
                                        product.name
                                      }
                                      style={{
                                        width: "220px",
                                        maxWidth: "100%",
                                        height: "auto",
                                        display: "block"
                                      }}
                                    />

                                    <span
                                      style={{
                                        fontSize: "12px",
                                        textAlign: "center",
                                        color:
                                          "var(--color-text-muted)"
                                      }}
                                    >
                                      Scan to verify this saree provenance
                                    </span>

                                    <span
                                      style={{
                                        fontSize: "12px",
                                        textAlign: "center",
                                        wordBreak: "break-all"
                                      }}
                                    >
                                      Public ID:{" "}
                                      {
                                        provenanceByProductId[
                                          product.id
                                        ].publicId
                                      }
                                    </span>

                                    <button
                                      type="button"
                                      className="btn btn--primary"
                                      onClick={() =>
                                        handlePrintProvenanceTag(
                                          product
                                        )
                                      }
                                    >
                                      Print Saree Tag
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {provenanceByProductId[
                              product.id
                            ].status === "archived" && (
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color:
                                    "var(--color-text-muted)"
                                }}
                              >
                                Archived — public verification unavailable
                              </span>
                            )}

                            {provenanceActionErrorByProductId[
                              product.id
                            ] && (
                              <span
                                role="alert"
                                style={{
                                  fontSize: "13px",
                                  color:
                                    "var(--color-danger)"
                                }}
                              >
                                {
                                  provenanceActionErrorByProductId[
                                    product.id
                                  ]
                                }
                              </span>
                            )}
                          </>
                        ) : (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--color-text-muted)"
                            }}
                          >
                            Provenance status unavailable
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `${product.name} తొలగించాలా?`
                        );

                        if (confirmed) {
                          removeProduct(product.id, user);
                        }
                      }}
                      style={{
                        width: "44px",
                        height: "44px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#fff0f0",
                        color: "var(--color-danger)",
                        cursor: "pointer"
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "provenance" && (
        <ProvenanceSetupPanel
          user={user}
          products={products}
        />
      )}
    </main>
  );
}

export default Admin;
