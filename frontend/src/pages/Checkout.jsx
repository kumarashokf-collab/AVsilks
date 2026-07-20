import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";

const ADDRESS_KEY = "avsilks_delivery_address";

function readSavedAddress() {
  try {
    const saved = localStorage.getItem(ADDRESS_KEY);

    return saved
      ? JSON.parse(saved)
      : {
          name: "",
          phone: "",
          house: "",
          street: "",
          city: "",
          state: "Andhra Pradesh",
          pin: ""
        };
  } catch {
    return {
      name: "",
      phone: "",
      house: "",
      street: "",
      city: "",
      state: "Andhra Pradesh",
      pin: ""
    };
  }
}

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    cart,
    clearCart
  } = useCart();

  const { placeOrder } = useOrders();
  const { products = [] } = useProducts();

  const items =
    location.state?.items ||
    (location.state?.product
      ? [
          {
            ...location.state.product,
            quantity: 1
          }
        ]
      : cart);

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 1),
    0
  );

  const shippingCharge =
    subtotal >= 999 || subtotal === 0 ? 0 : 79;

  const grandTotal = subtotal + shippingCharge;

  const [form, setForm] = useState(readSavedAddress);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function validateForm() {
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.house.trim() ||
      !form.street.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pin.trim()
    ) {
      return "దయచేసి అన్ని అడ్రస్ వివరాలు నమోదు చేయండి.";
    }

    if (!/^[6-9][0-9]{9}$/.test(form.phone.trim())) {
      return "సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.";
    }

    if (!/^[0-9]{6}$/.test(form.pin.trim())) {
      return "సరైన 6 అంకెల PIN Code నమోదు చేయండి.";
    }

    if (items.length === 0) {
      return "మీ cart ఖాళీగా ఉంది.";
    }

    return "";
  }

  async function handlePlaceOrder() {
    const validationError = validateForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const validatedItems = [];

      for (const item of items) {
        const liveProduct = products.find(
          (product) => product.id === item.id
        );

        if (!liveProduct) {
          throw new Error(
            `${item.name || "Product"} ఇప్పుడు అందుబాటులో లేదు.`
          );
        }

        if (liveProduct.active === false) {
          throw new Error(
            `${liveProduct.name || item.name} ప్రస్తుతం inactiveగా ఉంది.`
          );
        }

        const liveStock = Number(liveProduct.stock || 0);
        const requestedQuantity = Math.max(
          1,
          Number(item.quantity || 1)
        );

        if (!Number.isFinite(liveStock) || liveStock <= 0) {
          throw new Error(
            `${liveProduct.name || item.name} ప్రస్తుతం out of stock.`
          );
        }

        if (requestedQuantity > liveStock) {
          throw new Error(
            `${liveProduct.name || item.name}కి ప్రస్తుతం ${liveStock} మాత్రమే stock ఉంది. Cartలో quantity తగ్గించండి.`
          );
        }

        const livePrice = Number(
          liveProduct.salePrice ||
          liveProduct.price ||
          0
        );

        if (!Number.isFinite(livePrice) || livePrice <= 0) {
          throw new Error(
            `${liveProduct.name || item.name} ధర verify కాలేదు.`
          );
        }

        validatedItems.push({
          ...item,
          name: liveProduct.name || item.name,
          price: livePrice,
          stock: liveStock,
          image:
            liveProduct.image ||
            liveProduct.imageUrl ||
            item.image ||
            "",
          quantity: requestedQuantity
        });
      }

      const validatedSubtotal = validatedItems.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity || 1),
        0
      );

      const validatedShippingCharge =
        validatedSubtotal >= 999 ||
        validatedSubtotal === 0
          ? 0
          : 79;

      const validatedGrandTotal =
        validatedSubtotal +
        validatedShippingCharge;

      localStorage.setItem(
        ADDRESS_KEY,
        JSON.stringify(form)
      );

      const newOrder = await placeOrder({
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: {
            house: form.house.trim(),
            street: form.street.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pin: form.pin.trim()
          }
        },
        items: validatedItems,
        subtotal: validatedSubtotal,
        shippingCharge: validatedShippingCharge,
        total: validatedGrandTotal,
        payment: "Cash on Delivery"
      });

      clearCart();

      alert(
        `ఆర్డర్ విజయవంతంగా నమోదు అయింది!\nOrder ID: ${newOrder.id}`
      );

      navigate("/profile", {
        replace: true
      });
    } catch (error) {
      console.error("Order failed:", error);
      alert(
        error?.message ||
        "ఆర్డర్ నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 0 64px",
        background: "var(--color-cream-50)"
      }}
    >
      <div className="container">
        <header
          style={{
            marginBottom: "24px"
          }}
        >
          <p className="section__eyebrow">
            Secure Checkout
          </p>

          <h1
            style={{
              marginBottom: "8px"
            }}
          >
            Delivery Details
          </h1>

          <p
            style={{
              color: "var(--color-text-secondary)"
            }}
          >
            మీ ఆర్డర్ డెలివరీ కోసం సరైన వివరాలు
            నమోదు చేయండి.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gap: "24px"
          }}
        >
          <section
            className="card"
            style={{
              padding: "20px"
            }}
          >
            <h2
              style={{
                marginBottom: "18px",
                fontSize: "20px"
              }}
            >
              Customer Address
            </h2>

            <div
              style={{
                display: "grid",
                gap: "14px"
              }}
            >
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                autoComplete="name"
                style={inputStyle}
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit Mobile Number"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                style={inputStyle}
              />

              <input
                name="house"
                value={form.house}
                onChange={handleChange}
                placeholder="House / Flat Number"
                style={inputStyle}
              />

              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="Street / Area / Landmark"
                style={inputStyle}
              />

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Village / City / District"
                style={inputStyle}
              />

              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                style={inputStyle}
              />

              <input
                name="pin"
                value={form.pin}
                onChange={handleChange}
                placeholder="6-digit PIN Code"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                style={inputStyle}
              />
            </div>
          </section>

          <aside
            className="card"
            style={{
              padding: "20px"
            }}
          >
            <h2
              style={{
                marginBottom: "18px",
                fontSize: "20px"
              }}
            >
              Order Summary
            </h2>

            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    "1px solid var(--color-border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px"
                }}
              >
                <span>
                  {item.name} × {item.quantity || 1}
                </span>

                <strong>
                  ₹
                  {(
                    Number(item.price || 0) *
                    Number(item.quantity || 1)
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            ))}

            <div style={summaryRowStyle}>
              <span>Subtotal</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <div style={summaryRowStyle}>
              <span>Shipping</span>
              <strong>
                {shippingCharge === 0
                  ? "Free"
                  : `₹${shippingCharge}`}
              </strong>
            </div>

            <div
              style={{
                ...summaryRowStyle,
                paddingTop: "16px",
                borderTop:
                  "1px solid var(--color-border-medium)",
                fontSize: "18px"
              }}
            >
              <span>Total</span>
              <strong>
                ₹{grandTotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "10px",
                background: "var(--color-gold-100)"
              }}
            >
              <strong>Payment Method</strong>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "var(--color-text-secondary)"
                }}
              >
                Cash on Delivery
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={
                isSubmitting || items.length === 0
              }
              className="btn btn--primary"
              style={{
                width: "100%",
                marginTop: "20px"
              }}
            >
              {isSubmitting
                ? "Placing Order..."
                : "Place Cash on Delivery Order"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: "48px",
  padding: "12px 14px",
  border: "1px solid var(--color-border-medium)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-white)",
  color: "var(--color-text-primary)",
  outline: "none"
};

const summaryRowStyle = {
  marginTop: "14px",
  display: "flex",
  justifyContent: "space-between",
  gap: "16px"
};

export default Checkout;
