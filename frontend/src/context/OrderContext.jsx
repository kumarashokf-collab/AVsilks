import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

import { db } from "../firebase";
import { getUserRole } from "../constants/admin";
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
  children
}) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] =
    useState(true);
  const [ordersError, setOrdersError] =
    useState("");

  const admin = useMemo(
    () => getUserRole(user) === ROLES.ADMIN,
    [user]
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

    const items = normalizeItems(
      orderData.items
    );

    if (items.length === 0) {
      throw new Error(
        "Order must contain at least one item."
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

    const orderPayload = {
      userId: user.uid,
      userPhone: user.phoneNumber || "",
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
      cancelReason: "",
      statusHistory: [
        {
          status: "Processing",
          date: new Date().toISOString(),
          note: "Order placed successfully"
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const orderRef = await addDoc(
      collection(db, "orders"),
      orderPayload
    );

    return {
      id: orderRef.id,
      ...orderPayload
    };
  }

  async function updateOrderStatus(
    id,
    newStatus,
    reason = ""
  ) {
    if (!admin) {
      throw new Error(
        "Only admin can update order status."
      );
    }

    const currentOrder = orders.find(
      (order) => order.id === id
    );

    const currentHistory =
      Array.isArray(currentOrder?.statusHistory)
        ? currentOrder.statusHistory
        : [];

    await updateDoc(
      doc(db, "orders", id),
      {
        status: newStatus,
        cancelReason: reason,
        updatedAt: serverTimestamp(),
        statusHistory: [
          ...currentHistory,
          {
            status: newStatus,
            date: new Date().toISOString(),
            note: reason
          }
        ]
      }
    );
  }

  function clearOrders() {
    setOrders([]);
  }

  const value = {
    orders,
    ordersLoading,
    ordersError,
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
