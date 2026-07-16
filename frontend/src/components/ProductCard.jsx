import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaShoppingBag,
  FaEye,
  FaShareAlt
} from "react-icons/fa";

import { useCart } from "../context/CartContext";
import "./ProductCard.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
      <rect width="600" height="750" fill="#f7f1ec"/>
      <rect x="45" y="45" width="510" height="660" rx="24" fill="#fffaf6" stroke="#d7c3b5" stroke-width="4"/>
      <text x="300" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="#6b2d2d">
        AV Silks
      </text>
      <text x="300" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" fill="#8b6f63">
        Product image coming soon
      </text>
    </svg>
  `);

function getProductImage(product) {
  const image = product?.image || product?.imageUrl;

  if (typeof image !== "string" || !image.trim()) {
    return FALLBACK_IMAGE;
  }

  return image.trim();
}

function getSafePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const productName = product?.name?.trim() || "AV Silks Saree";
  const category = product?.category?.trim() || "Saree";

  const originalPrice = getSafePrice(
    product?.originalPrice || product?.mrp || product?.price
  );

  const sellingPrice = getSafePrice(
    product?.salePrice || product?.price
  );

  const stock =
    product?.stock === undefined || product?.stock === null
      ? null
      : Number(product.stock);

  const discountPercentage = useMemo(() => {
    if (
      originalPrice > 0 &&
      sellingPrice > 0 &&
      originalPrice > sellingPrice
    ) {
      return Math.round(
        ((originalPrice - sellingPrice) / originalPrice) * 100
      );
    }

    return 0;
  }, [originalPrice, sellingPrice]);

  const isOutOfStock =
    Number.isFinite(stock) && stock <= 0;

  function handleImageError(event) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  }

  function handleOpenProduct() {
    if (product?.id) {
      navigate(`/product/${product.id}`);
    }
  }

  function handleWishlist(event) {
    event.stopPropagation();
    setIsWishlisted((current) => !current);
  }

  async function handleShare(event) {
    event.stopPropagation();

    const shareData = {
      title: productName,
      text: `Check out ${productName} at AV Silks`,
      url: `${window.location.origin}/product/${product?.id || ""}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Product link copied.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }

  function handleAddToCart(event) {
    event.stopPropagation();

    if (!product?.id || isOutOfStock) {
      return;
    }

    addToCart(product);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1200);
  }

  return (
    <article
      className="premium-product-card"
      onClick={handleOpenProduct}
    >
      <div className="premium-product-card__media">
        <img
          src={getProductImage(product)}
          alt={productName}
          onError={handleImageError}
          loading="lazy"
          className="premium-product-card__image"
        />

        <div className="premium-product-card__badges">
          {discountPercentage > 0 ? (
            <span className="premium-product-card__badge premium-product-card__badge--discount">
              {discountPercentage}% OFF
            </span>
          ) : null}

          {product?.isNew ? (
            <span className="premium-product-card__badge premium-product-card__badge--new">
              New
            </span>
          ) : null}
        </div>

        <div className="premium-product-card__actions">
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
          >
            {isWishlisted ? <FaHeart /> : <FaRegHeart />}
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share product"
          >
            <FaShareAlt />
          </button>
        </div>

        <button
          type="button"
          className="premium-product-card__quick-view"
          onClick={(event) => {
            event.stopPropagation();
            handleOpenProduct();
          }}
        >
          <FaEye />
          Quick View
        </button>
      </div>

      <div className="premium-product-card__body">
        <p className="premium-product-card__category">
          {category}
        </p>

        <h3 className="premium-product-card__title">
          {productName}
        </h3>

        <div className="premium-product-card__stock">
          {isOutOfStock ? (
            <span className="premium-product-card__stock--out">
              Out of stock
            </span>
          ) : stock !== null && Number.isFinite(stock) ? (
            <span>
              {stock <= 5 ? `Only ${stock} left` : "In stock"}
            </span>
          ) : (
            <span>Available</span>
          )}
        </div>

        <div className="premium-product-card__pricing">
          <strong>
            ₹{sellingPrice.toLocaleString("en-IN")}
          </strong>

          {originalPrice > sellingPrice ? (
            <del>
              ₹{originalPrice.toLocaleString("en-IN")}
            </del>
          ) : null}
        </div>

        <button
          type="button"
          className={`premium-product-card__cart-button ${
            added
              ? "premium-product-card__cart-button--added"
              : ""
          }`}
          disabled={!product?.id || isOutOfStock}
          onClick={handleAddToCart}
        >
          <FaShoppingBag />
          {isOutOfStock
            ? "Out of Stock"
            : added
              ? "Added"
              : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
