export function formatOrderDate(order = {}) {
  const value =
    order.createdAt ||
    order.orderDate ||
    order.date ||
    order.statusHistory?.[0]?.date;

  if (!value) {
    return "Date unavailable";
  }

  let date;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value === "object" && value.seconds) {
    date = new Date(value.seconds * 1000);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
