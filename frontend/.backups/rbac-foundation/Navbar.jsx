import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaShoppingBag,
  FaBoxOpen,
  FaUser,
  FaCog,
  FaUserShield,
  FaSignInAlt,
  FaSignOutAlt,
  FaShieldAlt
} from "react-icons/fa";
import { signOut } from "firebase/auth";

import { auth } from "../firebase";
import { useCart } from "../context/CartContext";
import { STORE } from "../constants/store";
import { BRAND } from "../config/branding";
import { isAdminUser } from "../constants/admin";
import logo from "../assets/logo.png";
import "./Navbar.css";

function Navbar({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const { cart = [] } = useCart();
  const navigate = useNavigate();

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const isTemporaryAdmin =
    ["+917729911578", "+919999999991"].includes(user?.phoneNumber);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function closeDrawer() {
    setIsOpen(false);
  }

  async function handleLogout() {
    try {
      closeDrawer();

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // Already cleared.
        }

        window.recaptchaVerifier = null;
      }

      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.");
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <button
            type="button"
            className="site-header__icon-button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
          >
            <FaBars />
          </button>

          <Link
            to="/"
            className="site-header__brand"
            aria-label={`${BRAND.name} home`}
          >
            <img
              src={logo}
              className="site-header__logo"
              alt=""
              loading="eager"
              decoding="async"
            />

            <span className="site-header__brand-text">
              <strong>{BRAND.name}</strong>
              <small>{BRAND.tagline}</small>
            </span>
          </Link>

          <nav
            className="site-header__desktop-nav"
            aria-label="Main navigation"
          >
            <Link to="/">Home</Link>
            <a href="/#featured-products">Collection</a>
            <Link to="/privacy">Privacy</Link>
          </nav>

          <div className="site-header__actions">
            {user ? (
              <Link
                to="/profile"
                className="site-header__account"
                aria-label="Open profile"
              >
                <FaUser />
                <span>Profile</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="site-header__account"
                aria-label="Login"
              >
                <FaSignInAlt />
                <span>Login</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="site-header__cart"
              aria-label={`Cart with ${cartCount} items`}
            >
              <FaShoppingBag />

              {cartCount > 0 ? (
                <span className="site-header__cart-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`nav-overlay ${
          isOpen ? "nav-overlay--visible" : ""
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        className={`nav-drawer ${
          isOpen ? "nav-drawer--open" : ""
        }`}
        aria-hidden={!isOpen}
        aria-label="Navigation drawer"
      >
        <div className="nav-drawer__header">
          <Link
            to="/"
            className="nav-drawer__brand"
            onClick={closeDrawer}
          >
            <img
              src={logo}
              alt=""
              loading="eager"
              decoding="async"
            />
            <div>
              <strong>{BRAND.name}</strong>
              <small>{BRAND.tagline}</small>
            </div>
          </Link>

          <button
            type="button"
            className="nav-drawer__close"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="nav-drawer__account">
          <div className="nav-drawer__avatar">
            <FaUser />
          </div>

          <div>
            <strong>
              {user?.displayName ||
                user?.phoneNumber ||
                 `Welcome to ${BRAND.name}` }
            </strong>

            <span>
              {user
                ? "Your shopping account"
                : "Login to checkout and view orders"}
            </span>
          </div>
        </div>

        <nav className="nav-drawer__links">
          <Link to="/" onClick={closeDrawer}>
            <FaHome />
            <span>Home</span>
          </Link>

          <Link to="/cart" onClick={closeDrawer}>
            <FaShoppingBag />
            <span>My Cart</span>

            {cartCount > 0 ? (
              <small>{cartCount}</small>
            ) : null}
          </Link>

          {user ? (
            <>
              <Link to="/profile" onClick={closeDrawer}>
                <FaUser />
                <span>My Profile</span>
              </Link>

              <Link to="/orders" onClick={closeDrawer}>
                <FaBoxOpen />
                <span>My Orders</span>
              </Link>

              <Link to="/settings" onClick={closeDrawer}>
                <FaCog />
                <span>Settings</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              onClick={closeDrawer}
              className="nav-drawer__login-link"
            >
              <FaSignInAlt />
              <span>Login / Register</span>
            </Link>
          )}

          <Link to="/privacy" onClick={closeDrawer}>
            <FaShieldAlt />
            <span>Privacy Policy</span>
          </Link>

          {isTemporaryAdmin ? (
            <Link
              to="/admin"
              onClick={closeDrawer}
              className="nav-drawer__admin-link"
            >
              <FaUserShield />
              <span>Admin Panel</span>
            </Link>
          ) : null}
        </nav>

        <div className="nav-drawer__footer">
          {user ? (
            <button
              type="button"
              className="nav-drawer__logout"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn--primary nav-drawer__login-button"
              onClick={closeDrawer}
            >
              <FaSignInAlt />
              Login to {BRAND.name}
            </Link>
          )}

          <small>
            {BRAND.copyright}
          </small>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
