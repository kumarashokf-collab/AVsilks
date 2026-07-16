import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const OrderContext = createContext(null);
const STORAGE_KEY = "av_orders";

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders must be used inside OrderProvider"
    );
  }

  return context;
}

function readStoredOrders() {
  try {
    const savedOrders =
      localStorage.getItem(STORAGE_KEY);

    const parsedOrders = savedOrders
      ? JSON.parse(savedOrders)
      : [];

    return Array.isArray(parsedOrders)
      ? parsedOrders
      : [];
  } catch (error) {
    console.warn(
      "Unable to read saved orders:",
      error
    );

    return [];
  }
}

function createOrderId() {
  const timestamp = Date.now();
  const randomPart = Math.floor(
    1000 + Math.random() * 9000
  );

  return `ORD${timestamp}${randomPart}`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: item?.id || "",
    name: item?.name || "AV Silks Saree",
    price: Number(item?.price || 0),
    quantity: Math.max(
      1,
      Number(item?.quantity || 1)
    ),
    image:
      item?.image ||
      item?.imageUrl ||
      "",
    sku: item?.sku || "",
    category: item?.category || ""
  }));
}

export function OrderProvider({ children }) {
  const [orders, setOrders] =
    useState(readStoredOrders);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders)
      );
    } catch (error) {
      console.warn(
        "Unable to save orders:",
        error
      );
    }
  }, [orders]);

  function sendNotification(title, body) {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body
      });
    }
  }

  function placeOrder(orderData = {}) {
    const items = normalizeItems(
      orderData.items
    );

    if (items.length === 0) {
      throw new Error(
        "Order must contain at least one item."
      );
    }

    const customer = {
      name:
        orderData.customer?.name?.trim() ||
        "",
      phone:
        orderData.customer?.phone?.trim() ||
        "",
      address: {
        house:
          orderData.customer?.address?.house?.trim() ||
          "",
        street:
          orderData.customer?.address?.street?.trim() ||
          "",
        city:
          orderData.customer?.address?.city?.trim() ||
          "",
        state:
          orderData.customer?.address?.state?.trim() ||
          "",
        pin:
          orderData.customer?.address?.pin?.trim() ||
          ""
      }
    };

    const subtotal = Number(
      orderData.subtotal ??
      items.reduce(
        (sum, item) =>
          sum +
          item.price * item.quantity,
        0
      )
    );

    const shippingCharge = Number(
      orderData.shippingCharge || 0
    );

    const total = Number(
      orderData.total ??
      subtotal + shippingCharge
    );

    const productLabel = items
      .map((item) => item.name)
      .join(", ");

    const now = new Date();

    const newOrder = {
      id: createOrderId(),

      customer,
      customerName: customer.name,
      customerPhone: customer.phone,

      product: productLabel,
      items,

      subtotal,
      shippingCharge,
      total,
      price: total,

      payment:
        orderData.payment ||
        "Cash on Delivery",

      paymentStatus:
        orderData.paymentStatus ||
        "Pending on Delivery",

      status: "Processing",

      date: now.toLocaleDateString(
        "en-IN"
      ),

      createdAt: now.toISOString(),

      statusHistory: [
        {
          status: "Processing",
          date: now.toISOString(),
          note: "Order placed successfully"
        }
      ]
    };

    setOrders((currentOrders) => [
      newOrder,
      ...currentOrders
    ]);

    return newOrder;
  }

  function updateOrderStatus(
    id,
    newStatus,
    reason = ""
  ) {
    setOrders((currentOrders) =>
      currentOrders.map((order) => {
        if (order.id !== id) {
          return order;
        }

        const now = new Date();

        sendNotification(
          "AV Silks Update",
          `మీ ఆర్డర్ ${order.product} స్టేటస్ ${newStatus}కి మారింది.`
        );

        return {
          ...order,
          status: newStatus,
          cancelReason: reason,
          updatedAt: now.toISOString(),
          statusHistory: [
            ...(Array.isArray(
              order.statusHistory
            )
              ? order.statusHistory
              : []),
            {
              status: newStatus,
              date: now.toISOString(),
              note: reason
            }
          ]
        };
      })
    );
  }

  function clearOrders() {
    setOrders([]);
  }

  const value = {
    orders,
    placeOrder,
    updateOrderStatus,
    clearOrders
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}
