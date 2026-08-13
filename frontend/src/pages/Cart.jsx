import { Link, useNavigate } from "react-router-dom";
import {
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaTrash
} from "react-icons/fa";

import { useCart } from "../context/CartContext";
import { BRAND } from "../config/branding";
import "./Cart.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="360">
      <rect width="300" height="360" fill="#f7f1ec"/>
      <text x="150" y="170" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#6b2d2d">
        ${BRAND.name}
      </text>
      <text x="150" y="210" text-anchor="middle"
        font-family="Arial" font-size="15" fill="#8b6f63">
        Image unavailable
      </text>
    </svg>
  `);

function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    subtotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const shippingCharge =
    subtotal >= 999 || subtotal === 0 ? 0 : 79;

  const grandTotal = subtotal + shippingCharge;

  function handleImageError(event) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  }

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="container cart-empty">
          <div className="cart-empty__icon">
            <FaShoppingBag />
          </div>

          <h1>Your cart is empty</h1>

          <p>
            మీకు నచ్చిన చీరలను ఎంచుకొని cartలో
            జోడించండి.
          </p>

          <Link
            to="/#featured-products"
            className="btn btn--primary"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container">
        <div className="cart-page__header">
          <div>
            <p className="section__eyebrow">
              Your Selection
            </p>

            <h1>Shopping Cart</h1>
          </div>

          <button
            type="button"
            className="cart-page__clear"
            onClick={clearCart}
          >
            Clear cart
          </button>
        </div>

        <div className="cart-layout">
          <section className="cart-items">
            {cart.map((item) => (
              <article
                key={item.id}
                className="cart-item card"
              >
                <img
                  src={item.image || FALLBACK_IMAGE}
                  alt={item.name}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  className="cart-item__image"
                />

                <div className="cart-item__details">
                  <h2>{item.name}</h2>

                  <p className="cart-item__price">
                    ₹
                    {Number(item.price).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <div className="cart-item__controls">
                    <div className="cart-item__quantity">
                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        aria-label="Decrease quantity"
                      >
                        <FaMinus />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        aria-label="Increase quantity"
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      <FaTrash />
                      Remove
                    </button>
                  </div>
                </div>

                <strong className="cart-item__total">
                  ₹
                  {(
                    Number(item.price) *
                    Number(item.quantity)
                  ).toLocaleString("en-IN")}
                </strong>
              </article>
            ))}
          </section>

          <aside className="cart-summary card">
            <h2>Order Summary</h2>

            <div className="cart-summary__row">
              <span>Subtotal</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="cart-summary__row">
              <span>Shipping</span>
              <strong>
                {shippingCharge === 0
                  ? "Free"
                  : `₹${shippingCharge}`}
              </strong>
            </div>

            <div className="cart-summary__divider" />

            <div className="cart-summary__row cart-summary__total">
              <span>Total</span>
              <strong>
                ₹{grandTotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <p className="cart-summary__note">
              Final price and stock will be verified
              during checkout.
            </p>

            <button
              type="button"
              className="btn btn--primary cart-summary__checkout"
              onClick={() =>
                navigate("/checkout", {
                  state: {
                    items: cart,
                    subtotal,
                    shippingCharge,
                    grandTotal
                  }
                })
              }
            >
              Proceed to Checkout
            </button>

            <Link
              to="/#featured-products"
              className="cart-summary__continue"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;
