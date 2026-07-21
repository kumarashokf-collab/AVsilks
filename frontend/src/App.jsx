import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./components/Navbar";
const Home = lazy(() => import("./pages/Home"));
const Cart = lazy(() => import("./pages/Cart"));
const Profile = lazy(() => import("./pages/Profile"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Products = lazy(() => import("./pages/Products"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const OrderDetails = lazy(() => import("./pages/orders/OrderDetails"));
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";
import { getUserRole } from "./constants/admin";
import { ROLES } from "./constants/roles";
import { BRAND } from "./config/branding";

function RequireAuth({ user, children }) {
  if (!user) { return <Navigate to="/login" replace />; }
  return children;
}

function RequireAdmin({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (getUserRole(user) !== ROLES.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--color-cream-50)", color: "var(--color-wine-800)", fontFamily: "var(--font-family-body)" }}>
        <div style={{ textAlign: "center" }}>
          <strong style={{ fontSize: "20px" }}>{BRAND.name}</strong>
          <p style={{ marginTop: "8px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <OrderProvider user={user}>
      <ProductProvider>
        <CartProvider>
          <Router>
            <Navbar user={user} />
            <Suspense
              fallback={
                <div
                  style={{
                    minHeight: "50vh",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-wine-800)"
                  }}
                >
                  Loading page...
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/products" element={<Products />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/checkout" element={<RequireAuth user={user}><Checkout /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth user={user}><MyOrders /></RequireAuth>} />
              <Route path="/orders/:id" element={<RequireAuth user={user}><OrderDetails /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth user={user}><Profile user={user} /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth user={user}><Settings /></RequireAuth>} />
              <Route path="/admin" element={<RequireAdmin user={user}><Admin /></RequireAdmin>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </CartProvider>
      </ProductProvider>
    </OrderProvider>
  );
}
export default App;
