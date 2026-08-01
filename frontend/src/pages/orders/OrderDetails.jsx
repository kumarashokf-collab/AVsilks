import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaShoppingBag,
  FaWallet
} from "react-icons/fa";

import { useOrders } from "../../context/OrderContext";
import { useCart } from "../../context/CartContext";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import "../../components/orders/orders.css";
import { formatOrderDate } from "../../utils/formatOrderDate";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="380">
      <rect width="300" height="380" fill="#f7f1ec"/>
      <text x="150" y="175" text-anchor="middle"
        font-family="Arial" font-size="30" fill="#6b2d2d">
        AV Silks
      </text>
      <text x="150" y="215" text-anchor="middle"
        font-family="Arial" font-size="15" fill="#8b6f63">
        Product Image
      </text>
    </svg>
  `);

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { orders, cancelOrder } = useOrders();
  const { addToCart } = useCart();

  const [
    cancelSubmitting,
    setCancelSubmitting
  ] = useState(false);

  const order = orders.find(
    (item) => String(item.id) === String(id)
  );

  if (!order) {
    return (
      <main className="order-details-page">
        <div className="container order-details-empty card">
          <FaBoxOpen />

          <h1>Order not found</h1>

          <p>
            ఈ Order IDకు సంబంధించిన వివరాలు కనిపించలేదు.
          </p>

          <Link to="/profile" className="btn btn--primary">
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const customer = order.customer || {};
  const address = customer.address || {};

  const total = Number(
    order.total ?? order.price ?? 0
  );

  const canCancel =
    order.status === "Processing" ||
    order.status === "Confirmed";

  function handleImageError(event) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  }

  function handleReorder() {
    if (items.length === 0) {
      alert("ఈ orderలో product details లేవు.");
      return;
    }

    items.forEach((item) => {
      addToCart(item, item.quantity || 1);
    });

    alert("Order items cartలోకి add అయ్యాయి.");
    navigate("/cart");
  }

  async function handleCancel() {
    if (cancelSubmitting) {
      return;
    }

    const reason = window.prompt(
      "Order cancel చేయడానికి కారణం నమోదు చేయండి:"
    );

    const normalizedReason =
      String(reason || "").trim();

    if (!normalizedReason) {
      return;
    }

    if (
      normalizedReason.length < 3 ||
      normalizedReason.length > 300
    ) {
      window.alert(
        "Cancel reason 3 నుంచి 300 characters మధ్య ఉండాలి."
      );
      return;
    }

    setCancelSubmitting(true);

    try {
      await cancelOrder(
        order.id,
        normalizedReason
      );
    } catch (error) {
      window.alert(
        error?.message ||
        "Order cancel కాలేదు. మళ్లీ ప్రయత్నించండి."
      );
    } finally {
      setCancelSubmitting(false);
    }
  }

  return (
    <main className="order-details-page">
      <div className="container">
        <button
          type="button"
          className="order-details-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <header className="order-details-header card">
          <div>
            <span>Order ID</span>
            <h1>{order.id}</h1>
            <p>{formatOrderDate(order)}</p>
          </div>

          <OrderStatusBadge
            status={order.status || "Processing"}
          />
        </header>

        <div className="order-details-layout">
          <div className="order-details-main">
            <section className="card order-details-section">
              <h2>Products</h2>

              {items.length === 0 ? (
                <p>No product details available.</p>
              ) : (
                <div className="order-details-items">
                  {items.map((item, index) => {
                    const quantity =
                      Number(item.quantity || 1);

                    const price =
                      Number(item.price || 0);

                    return (
                      <article
                        key={item.id || index}
                        className="order-details-item"
                      >
                        <img
                          src={
                            item.image ||
                            item.imageUrl ||
                            FALLBACK_IMAGE
                          }
                          alt={
                            item.name ||
                            "AV Silks product"
                          }
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                        />

                        <div>
                          <h3>
                            {item.name ||
                              "AV Silks Saree"}
                          </h3>

                          <p>
                            Quantity: {quantity}
                          </p>

                          <strong>
                            ₹
                            {(
                              price * quantity
                            ).toLocaleString("en-IN")}
                          </strong>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card order-details-section">
              <h2>
                <FaMapMarkerAlt />
                Delivery Address
              </h2>

              <div className="order-details-address">
                <strong>
                  {customer.name ||
                    "Customer name unavailable"}
                </strong>

                {customer.phone ? (
                  <span>
                    <FaPhoneAlt />
                    {customer.phone}
                  </span>
                ) : null}

                <p>
                  {[
                    address.house,
                    address.street,
                    address.city,
                    address.state,
                    address.pin
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "Address unavailable"}
                </p>
              </div>
            </section>

            <section className="card order-details-section">
              <h2>
                <FaWallet />
                Payment
              </h2>

              <div className="order-details-payment">
                <span>Method</span>
                <strong>
                  {order.payment ||
                    "Cash on Delivery"}
                </strong>

                <span>Payment Status</span>
                <strong>
                  {order.paymentStatus ||
                    (order.payment ===
                    "Cash on Delivery"
                      ? "Pending on Delivery"
                      : "Pending")}
                </strong>
              </div>
            </section>
          </div>

          <aside className="card order-details-summary">
            <h2>Order Summary</h2>

            <div>
              <span>Items</span>
              <strong>
                {items.reduce(
                  (sum, item) =>
                    sum +
                    Number(item.quantity || 1),
                  0
                )}
              </strong>
            </div>

            <div>
              <span>Subtotal</span>
              <strong>
                ₹
                {Number(
                  order.subtotal ?? total
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Shipping</span>
              <strong>
                {Number(order.shippingCharge || 0) === 0
                  ? "Free"
                  : `₹${Number(
                      order.shippingCharge
                    ).toLocaleString("en-IN")}`}
              </strong>
            </div>

            <div className="order-details-summary__total">
              <span>Total</span>
              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              onClick={handleReorder}
            >
              <FaShoppingBag />
              Reorder
            </button>

            {canCancel ? (
              <button
                type="button"
                className="btn order-details-cancel"
                onClick={handleCancel}
                disabled={cancelSubmitting}
              >
                {cancelSubmitting
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default OrderDetails;
