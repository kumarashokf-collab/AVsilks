import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import ProductDetails from "./pages/ProductDetails";
import Products from "./pages/Products";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OrderDetails from "./pages/orders/OrderDetails";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";
import { isAdminUser } from "./constants/admin";
import { BRAND } from "./config/branding";

function RequireAuth({ user, children }) {
  if (!user) { return <Navigate to="/login" replace />; }
  return children;
}

function RequireAdmin({ user, children }) {
  const temporaryAdminPhone = "+917729911578";
  if (!user) { return <Navigate to="/login" replace />; }
  if (![temporaryAdminPhone, "+919999999991"].includes(user.phoneNumber)) { return <Navigate to="/" replace />; }
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
          </Router>
        </CartProvider>
      </ProductProvider>
    </OrderProvider>
  );
}
export default App;
