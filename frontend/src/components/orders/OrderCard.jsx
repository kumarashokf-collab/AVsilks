import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaRedoAlt
} from "react-icons/fa";

import OrderStatusBadge from "./OrderStatusBadge";
import "./orders.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="300">
      <rect width="240" height="300" fill="#f7f1ec"/>
      <text x="120" y="140" text-anchor="middle"
        font-family="Arial" font-size="24" fill="#6b2d2d">
        AV Silks
      </text>
      <text x="120" y="175" text-anchor="middle"
        font-family="Arial" font-size="13" fill="#8b6f63">
        Saree Image
      </text>
    </svg>
  `);

function normalizeOrder(order) {
  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const firstItem = items[0] || {};

  return {
    id: order?.id || "Unknown Order",
    date: order?.date || "Date unavailable",
    status: order?.status || "Processing",
    payment: order?.payment || "Cash on Delivery",
    total: Number(order?.price || order?.total || 0),
    customerName:
      order?.customer?.name ||
      "AV Silks Customer",
    city:
      order?.customer?.address?.city ||
      "",
    itemCount: items.reduce(
      (sum, item) =>
        sum + Number(item?.quantity || 1),
      0
    ),
    title:
      order?.product ||
      firstItem?.name ||
      "AV Silks Order",
    image:
      firstItem?.image ||
      firstItem?.imageUrl ||
      FALLBACK_IMAGE
  };
}

function OrderCard({
  order,
  onCancel,
  onReorder
}) {
  const normalized = normalizeOrder(order);

  function handleImageError(event) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  }

  return (
    <article className="order-card card">
      <div className="order-card__header">
        <div>
          <span className="order-card__label">
            Order ID
          </span>

          <strong>{normalized.id}</strong>
        </div>

        <OrderStatusBadge
          status={normalized.status}
        />
      </div>

      <div className="order-card__body">
        <img
          src={normalized.image}
          alt={normalized.title}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          className="order-card__image"
        />

        <div className="order-card__content">
          <h3>{normalized.title}</h3>

          <div className="order-card__meta">
            <span>
              <FaCalendarAlt />
              {normalized.date}
            </span>

            <span>
              <FaBoxOpen />
              {normalized.itemCount || 1} item(s)
            </span>

            {normalized.city ? (
              <span>
                <FaMapMarkerAlt />
                {normalized.city}
              </span>
            ) : null}
          </div>

          <div className="order-card__payment">
            <span>{normalized.payment}</span>

            <strong>
              ₹{normalized.total.toLocaleString("en-IN")}
            </strong>
          </div>
        </div>
      </div>

      <div className="order-card__actions">
        <Link
          to={`/orders/${normalized.id}`}
          className="btn btn--primary"
        >
          View Details
        </Link>

        {normalized.status === "Processing" ? (
          <button
            type="button"
            className="btn btn--ghost order-card__cancel"
            onClick={() => onCancel?.(normalized.id)}
          >
            Cancel
          </button>
        ) : null}

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onReorder?.(order)}
        >
          <FaRedoAlt />
          Reorder
        </button>
      </div>
    </article>
  );
}

export default OrderCard;
