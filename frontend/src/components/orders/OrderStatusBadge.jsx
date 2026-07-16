import "./orders.css";
const STATUS_CONFIG = {
  Processing: {
    label: "Processing",
    className: "order-status order-status--processing"
  },
  Confirmed: {
    label: "Confirmed",
    className: "order-status order-status--confirmed"
  },
  Packed: {
    label: "Packed",
    className: "order-status order-status--packed"
  },
  Shipped: {
    label: "Shipped",
    className: "order-status order-status--shipped"
  },
  Delivered: {
    label: "Delivered",
    className: "order-status order-status--delivered"
  },
  Cancelled: {
    label: "Cancelled",
    className: "order-status order-status--cancelled"
  },
  Returned: {
    label: "Returned",
    className: "order-status order-status--returned"
  }
};

function OrderStatusBadge({ status }) {
  const config =
    STATUS_CONFIG[status] || {
      label: status || "Processing",
      className: "order-status order-status--processing"
    };

  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
}

export default OrderStatusBadge;
