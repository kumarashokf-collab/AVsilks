import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { FaArrowLeft, FaStar, FaStarHalfAlt, FaShieldAlt, FaTruck } from 'react-icons/fa';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();

  const product = products.find(
    (item) => String(item.id) === String(id)
  );

  const productImages = useMemo(() => {
    if (!product) {
      return [];
    }

    const galleryImages = Array.isArray(product.images)
      ? product.images
      : [];

    return [
      ...new Set(
        [
          product.image,
          ...galleryImages
        ].filter(Boolean)
      )
    ];
  }, [product]);

  const [selectedImage, setSelectedImage] =
    useState("");
  const [isZoomOpen, setIsZoomOpen] =
    useState(false);
  const [zoomScale, setZoomScale] =
    useState(1);
  const [zoomOffset, setZoomOffset] =
    useState({ x: 0, y: 0 });
  const [touchStartDistance, setTouchStartDistance] =
    useState(null);
  const [touchStartPoint, setTouchStartPoint] =
    useState(null);

  useEffect(() => {
    setSelectedImage(productImages[0] || "");
  }, [productImages]);

  if (!product) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center"
        }}
      >
        చీర వివరాలు దొరకలేదు.
      </div>
    );
  }

  return (
    <div style={{ background: "#f4f6f8", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Top Header */}
      <div style={{ background: "white", padding: "15px 20px", display: "flex", alignItems: "center", gap: "15px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <FaArrowLeft size={20} color="#4a1c1c" onClick={() => navigate(-1)} style={{ cursor: "pointer" }} />
        <h3 style={{ margin: 0, color: "#4a1c1c", fontSize: "18px" }}>Product Details</h3>
      </div>

      {/* Product Image Gallery */}
      <div
        style={{
          background: "white",
          paddingBottom: "14px"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "380px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {product.offer && (
            <span
              style={{
                position: "absolute",
                top: "15px",
                left: "15px",
                background: "#d32f2f",
                color: "white",
                padding: "5px 10px",
                borderRadius: "5px",
                fontSize: "12px",
                fontWeight: "bold",
                zIndex: 10
              }}
            >
              {product.offer} OFF
            </span>
          )}

          <img
            src={
              selectedImage ||
              product.image ||
              "https://via.placeholder.com/400x500?text=No+Image"
            }
            alt={product.name}
            loading="eager"
            decoding="async"
            onClick={() => setIsZoomOpen(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#fff",
              cursor: "zoom-in"
            }}
            onError={(event) => {
              event.currentTarget.src =
                "https://via.placeholder.com/400x500?text=No+Image";
            }}
          />
        </div>

        {productImages.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              padding: "12px 14px 0"
            }}
          >
            {productImages.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={() =>
                  setSelectedImage(imageUrl)
                }
                style={{
                  width: "74px",
                  minWidth: "74px",
                  height: "92px",
                  padding: 0,
                  border:
                    selectedImage === imageUrl
                      ? "3px solid #4a1c1c"
                      : "1px solid #ddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "#fff"
                }}
              >
                <img
                  src={imageUrl}
                  alt={`${product.name} ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: "20px", background: "white", marginTop: "10px", borderRadius: "15px 15px 0 0", boxShadow: "0 -5px 10px rgba(0,0,0,0.02)" }}>
        <h2 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "22px" }}>{product.name}</h2>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <div style={{ color: "#f39c12", display: "flex", fontSize: "14px" }}><FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt /></div>
          <span style={{ color: "#27ae60", fontSize: "13px", fontWeight: "bold" }}>124 Reviews</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "20px" }}>
          <span style={{ color: "#4a1c1c", fontSize: "28px", fontWeight: "900" }}>₹{product.price}</span>
          {product.offer && <span style={{ color: "#999", textDecoration: "line-through", fontSize: "16px" }}>₹{Math.floor(product.price * 1.2)}</span>}
        </div>

        {/* Description */}
        <h4 style={{ margin: "0 0 10px 0", color: "#444" }}>Product Description:</h4>
        <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>
          {product.desc || "ఈ చీర అత్యుత్తమ నాణ్యతతో, సాంప్రదాయ పద్ధతిలో నేయబడింది. వివాహాలు మరియు పండుగలకు ఇది సరైన ఎంపిక. దీని ఫాబ్రిక్ చాలా స్మూత్ గా మరియు కంఫర్టబుల్ గా ఉంటుంది."}
        </p>

        {/* Features */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "15px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#555", fontSize: "13px", fontWeight: "bold" }}><FaShieldAlt color="#4a1c1c" size={18}/> 100% Original</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#555", fontSize: "13px", fontWeight: "bold" }}><FaTruck color="#4a1c1c" size={18}/> Free Delivery</div>
        </div>

        <div style={{ color: product.stock === "In Stock" ? "green" : "red", fontWeight: "bold", fontSize: "15px" }}>
          {product.stock}
        </div>
      </div>

      {isZoomOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsZoomOpen(false)}
          onKeyDown={(event) => {
            if (
              event.key === "Escape" ||
              event.key === "Enter"
            ) {
              setIsZoomOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out"
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsZoomOpen(false);
            }}
            aria-label="Close image zoom"
            style={{
              position: "absolute",
              top: "18px",
              right: "18px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.45)",
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              fontSize: "26px",
              lineHeight: 1,
              cursor: "pointer"
            }}
          >
            ×
          </button>

          <img
            src={
              selectedImage ||
              product.image ||
              "https://via.placeholder.com/400x500?text=No+Image"
            }
            alt={`${product.name} zoom`}
            decoding="async"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              objectFit: "contain",
              touchAction: "pinch-zoom"
            }}
          />
        </div>
      )}

      {/* Fixed Bottom Buttons */}
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", background: "white", padding: "15px", display: "flex", gap: "15px", boxShadow: "0 -2px 10px rgba(0,0,0,0.1)", zIndex: 100 }}>
        <button onClick={() => addToCart(product)} style={{ flex: 1, background: "#fcf9f2", color: "#4a1c1c", border: "2px solid #4a1c1c", padding: "15px", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Add to Cart</button>
        <button onClick={() => navigate('/checkout', { state: { product } })} style={{ flex: 1, background: "#4a1c1c", color: "white", border: "none", padding: "15px", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Buy Now</button>
      </div>
    </div>
  );
}
export default ProductDetails;
