import { useState } from "react";
import { FaBoxOpen, FaShoppingBag } from "react-icons/fa";

import { useOrders } from "../context/OrderContext";
import { useCart } from "../context/CartContext";
import OrderCard from "../components/orders/OrderCard";

function Profile() {
  const { orders, cancelOrder } = useOrders();
  const { addToCart } = useCart();

  const [cancelOrderId, setCancelOrderId] =
    useState(null);

  const [cancelReason, setCancelReason] =
    useState("");

  const [
    cancelSubmitting,
    setCancelSubmitting
  ] = useState(false);

  const [
    cancelError,
    setCancelError
  ] = useState("");

  function handleOpenCancel(orderId) {
    setCancelOrderId(orderId);
    setCancelReason("");
    setCancelError("");
  }

  function handleCloseCancel() {
    if (cancelSubmitting) {
      return;
    }

    setCancelOrderId(null);
    setCancelReason("");
    setCancelError("");
  }

  async function handleConfirmCancel() {
    const reason =
      cancelReason.trim();

    if (
      reason.length < 3 ||
      reason.length > 300
    ) {
      setCancelError(
        "Cancel reason 3 నుంచి 300 characters మధ్య ఉండాలి."
      );
      return;
    }

    if (
      cancelSubmitting ||
      !cancelOrderId
    ) {
      return;
    }

    setCancelSubmitting(true);
    setCancelError("");

    try {
      await cancelOrder(
        cancelOrderId,
        reason
      );

      setCancelOrderId(null);
      setCancelReason("");
    } catch (error) {
      setCancelError(
        error?.message ||
        "Order cancel కాలేదు. మళ్లీ ప్రయత్నించండి."
      );
    } finally {
      setCancelSubmitting(false);
    }
  }

  function handleReorder(order) {
    const items = Array.isArray(order?.items)
      ? order.items
      : [];

    if (items.length === 0) {
      alert("ఈ orderలో product details లేవు.");
      return;
    }

    items.forEach((item) => {
      addToCart(item, item.quantity || 1);
    });

    alert("Order items cartలోకి add అయ్యాయి.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 0 64px",
        background: "var(--color-cream-50)"
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "900px"
        }}
      >
        <header
          style={{
            marginBottom: "28px",
            textAlign: "center"
          }}
        >
          <p className="section__eyebrow">
            Your Account
          </p>

          <h1
            style={{
              marginBottom: "8px"
            }}
          >
            My Orders
          </h1>

          <p
            style={{
              marginBottom: 0,
              color: "var(--color-text-secondary)"
            }}
          >
            మీ orders, payment మరియు delivery statusను
            ఇక్కడ చూడవచ్చు.
          </p>
        </header>

        {orders.length === 0 ? (
          <section
            className="card"
            style={{
              minHeight: "340px",
              padding: "32px",
              display: "grid",
              placeItems: "center",
              alignContent: "center",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "76px",
                height: "76px",
                marginBottom: "18px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--color-gold-100)",
                color: "var(--color-wine-800)",
                fontSize: "28px"
              }}
            >
              <FaBoxOpen />
            </div>

            <h2>No orders yet</h2>

            <p
              style={{
                maxWidth: "420px",
                color: "var(--color-text-secondary)"
              }}
            >
              మీకు నచ్చిన చీరలను cartలో add చేసి మొదటి
              order place చేయండి.
            </p>

            <a
              href="/#featured-products"
              className="btn btn--primary"
            >
              <FaShoppingBag />
              Start Shopping
            </a>
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gap: "20px"
            }}
          >
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={handleOpenCancel}
                onReorder={handleReorder}
              />
            ))}
          </section>
        )}
      </div>

      {cancelOrderId ? (
        <div
          role="presentation"
          onClick={handleCloseCancel}
          style={{
            position: "fixed",
            zIndex: 3000,
            inset: 0,
            padding: "20px",
            display: "grid",
            placeItems: "center",
            background: "rgba(23,17,15,0.58)"
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="card"
            style={{
              width: "min(100%, 460px)",
              padding: "24px"
            }}
          >
            <h2
              id="cancel-order-title"
              style={{
                marginBottom: "10px"
              }}
            >
              Cancel Order
            </h2>

            <p
              style={{
                color: "var(--color-text-secondary)"
              }}
            >
              Order ID: <strong>{cancelOrderId}</strong>
            </p>

            <label
              htmlFor="cancelReason"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 800
              }}
            >
              Cancel Reason
            </label>

            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(event.target.value)
              }
              disabled={cancelSubmitting}
              maxLength={300}
              placeholder="ఉదాహరణ: తప్పు product ఎంపిక చేశాను"
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid var(--color-border-medium)",
                borderRadius: "var(--radius-md)",
                resize: "vertical"
              }}
            />

            {cancelError ? (
              <p
                role="alert"
                style={{
                  marginTop: "10px",
                  color:
                    "var(--color-danger)",
                  fontWeight: 700
                }}
              >
                {cancelError}
              </p>
            ) : null}

            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px"
              }}
            >
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCloseCancel}
                disabled={cancelSubmitting}
              >
                Keep Order
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleConfirmCancel}
                disabled={cancelSubmitting}
                style={{
                  background: "var(--color-danger)",
                  color: "white"
                }}
              >
                {cancelSubmitting
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default Profile;
