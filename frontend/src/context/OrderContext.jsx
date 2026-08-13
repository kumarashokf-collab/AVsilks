import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebase";
import { getApiBaseUrl } from "../services/api";
import { ROLES } from "../constants/roles";

const OrderContext = createContext(null);

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders must be used inside OrderProvider"
    );
  }

  return context;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: String(item?.id || ""),
    name: String(
      item?.name || "AV Silks Saree"
    ),
    price: Number(item?.price || 0),
    quantity: Math.max(
      1,
      Number(item?.quantity || 1)
    ),
    image: String(
      item?.image ||
      item?.imageUrl ||
      ""
    ),
    images: Array.isArray(item?.images)
      ? item.images.filter(Boolean).slice(0, 5)
      : [],
    sku: String(item?.sku || ""),
    category: String(item?.category || "")
  }));
}

export function OrderProvider({
  user,
  trustedSession,
  children
}) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] =
    useState(true);
  const [ordersError, setOrdersError] =
    useState("");

  const admin = useMemo(
    () => trustedSession?.role === ROLES.ADMIN,
    [trustedSession]
  );

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError("");
      return;
    }

    setOrdersLoading(true);

    const ordersRef = collection(db, "orders");

    const ordersQuery = admin
      ? query(
          ordersRef,
          orderBy("createdAt", "desc")
        )
      : query(
          ordersRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const nextOrders = snapshot.docs.map(
          (orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data()
          })
        );

        setOrders(nextOrders);
        setOrdersError("");
        setOrdersLoading(false);
      },
      (error) => {
        console.error(
          "Firestore orders load failed:",
          error
        );

        setOrdersError(
          error?.message ||
          "Orders load కాలేదు."
        );
        setOrdersLoading(false);
      }
    );

    return unsubscribe;
  }, [user, admin]);

  async function placeOrder(orderData = {}) {
    if (!user) {
      throw new Error(
        "Order place చేయడానికి login అవసరం."
      );
    }

    if (typeof user.getIdToken !== "function") {
      throw new Error(
        "Authentication session verify కాలేదు. మళ్లీ login చేయండి."
      );
    }

    const idempotencyKey = String(
      orderData.idempotencyKey || ""
    ).trim();

    if (
      idempotencyKey.length < 16 ||
      idempotencyKey.length > 128
    ) {
      throw new Error(
        "Secure checkout key invalidగా ఉంది. మళ్లీ ప్రయత్నించండి."
      );
    }

    const items = normalizeItems(
      orderData.items
    ).map((item) => ({
      productId: item.id,
      quantity: item.quantity
    }));

    if (
      items.length === 0 ||
      items.some((item) => !item.productId)
    ) {
      throw new Error(
        "Order must contain valid products."
      );
    }

    const customer = {
      name: String(
        orderData.customer?.name || ""
      ).trim(),
      phone: String(
        orderData.customer?.phone || ""
      ).trim(),
      address: {
        house: String(
          orderData.customer?.address?.house || ""
        ).trim(),
        street: String(
          orderData.customer?.address?.street || ""
        ).trim(),
        city: String(
          orderData.customer?.address?.city || ""
        ).trim(),
        state: String(
          orderData.customer?.address?.state || ""
        ).trim(),
        pin: String(
          orderData.customer?.address?.pin || ""
        ).trim()
      }
    };

    const apiBaseUrl =
      getApiBaseUrl();

    const idToken =
      await user.getIdToken();

    const response = await fetch(
      `${apiBaseUrl}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          idempotencyKey,
          customer,
          items,
          paymentMethod: "cod"
        })
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (
      !response.ok ||
      result?.success !== true ||
      !result?.data?.id
    ) {
      const requestError = new Error(
        result?.message ||
        "ఆర్డర్ నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి."
      );

      requestError.code =
        result?.code ||
        "ORDER_REQUEST_FAILED";

      requestError.details =
        Array.isArray(result?.details)
          ? result.details
          : [];

      throw requestError;
    }

    return result.data;
  }

  async function cancelOrder(
    id,
    reason
  ) {
    if (!user) {
      throw new Error(
        "Order cancel చేయడానికి login అవసరం."
      );
    }

    if (
      typeof user.getIdToken !==
      "function"
    ) {
      throw new Error(
        "Authentication session verify కాలేదు. మళ్లీ login చేయండి."
      );
    }

    const orderId =
      String(id || "").trim();

    const cancellationReason =
      String(reason || "").trim();

    if (
      !orderId ||
      orderId.includes("/") ||
      orderId.length > 128
    ) {
      throw new Error(
        "Valid order ID అవసరం."
      );
    }

    if (
      cancellationReason.length < 3 ||
      cancellationReason.length > 300
    ) {
      throw new Error(
        "Cancel reason 3 నుంచి 300 characters మధ్య ఉండాలి."
      );
    }

    const idToken =
      await user.getIdToken();

    const response = await fetch(
      `${getApiBaseUrl()}/orders/${encodeURIComponent(
        orderId
      )}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${idToken}`
        },
        body: JSON.stringify({
          reason:
            cancellationReason
        })
      }
    );

    let result = null;

    try {
      result =
        await response.json();
    } catch {
      result = null;
    }

    if (
      !response.ok ||
      result?.success !== true ||
      !result?.data?.id
    ) {
      const requestError =
        new Error(
          result?.message ||
          "Order cancel కాలేదు. మళ్లీ ప్రయత్నించండి."
        );

      requestError.code =
        result?.code ||
        "ORDER_CANCELLATION_FAILED";

      requestError.details =
        Array.isArray(
          result?.details
        )
          ? result.details
          : [];

      throw requestError;
    }

    return result.data;
  }

  async function updateOrderStatus(
    id,
    newStatus,
    note = ""
  ) {
    if (!admin) {
      throw new Error(
        "Only admin can update order status."
      );
    }

    if (
      !user ||
      typeof user.getIdToken !==
        "function"
    ) {
      throw new Error(
        "Authentication session verify కాలేదు. మళ్లీ login చేయండి."
      );
    }

    const orderId =
      String(id || "").trim();

    const status =
      String(newStatus || "").trim();

    const normalizedNote =
      String(note || "").trim();

    const allowedStatuses =
      new Set([
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered"
      ]);

    if (
      !orderId ||
      orderId.includes("/") ||
      orderId.length > 128
    ) {
      throw new Error(
        "Valid order ID అవసరం."
      );
    }

    if (!allowedStatuses.has(status)) {
      throw new Error(
        "Valid fulfilment status అవసరం."
      );
    }

    if (normalizedNote.length > 300) {
      throw new Error(
        "Status note 300 characters కంటే ఎక్కువ ఉండకూడదు."
      );
    }

    const idToken =
      await user.getIdToken();

    const response = await fetch(
      `${getApiBaseUrl()}/orders/${encodeURIComponent(
        orderId
      )}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${idToken}`
        },
        body: JSON.stringify({
          status,
          note: normalizedNote
        })
      }
    );

    let result = null;

    try {
      result =
        await response.json();
    } catch {
      result = null;
    }

    if (
      !response.ok ||
      result?.success !== true ||
      !result?.data?.id
    ) {
      const requestError =
        new Error(
          result?.message ||
          "Order status update కాలేదు. మళ్లీ ప్రయత్నించండి."
        );

      requestError.code =
        result?.code ||
        "ORDER_TRANSITION_FAILED";

      requestError.details =
        Array.isArray(
          result?.details
        )
          ? result.details
          : [];

      throw requestError;
    }

    return result.data;
  }

  function clearOrders() {
    setOrders([]);
  }

  const value = {
    orders,
    ordersLoading,
    ordersError,
    placeOrder,
    cancelOrder,
    updateOrderStatus,
    clearOrders
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}
