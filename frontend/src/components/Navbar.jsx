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
import { BRAND } from "../config/branding";
import { useLocale } from "../context/LocaleContext";
import { isAdministrativeRole } from "../constants/roles";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Navbar.css";

function Navbar({ user, trustedSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const { cart = [] } = useCart();
  const navigate = useNavigate();
  const { t } = useLocale();

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const isAdmin = isAdministrativeRole(trustedSession?.role);

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
      alert(t("errors.logout"));
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
            aria-label={t("aria.openMenu")}
          >
            <FaBars />
          </button>

          <Link
            to="/"
            className="site-header__brand"
            aria-label={t("aria.brandHome", { brand: BRAND.name })}
          >
            <img
              src={BRAND.logo}
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
            aria-label={t("aria.mainNavigation")}
          >
            <Link to="/">{t("nav.home")}</Link>
            <a href="/#featured-products">{t("nav.collection")}</a>
            <Link to="/privacy">{t("nav.privacy")}</Link>
          </nav>

          <div className="site-header__actions">
            {user ? (
              <Link
                to="/profile"
                className="site-header__account"
                aria-label={t("aria.profile")}
              >
                <FaUser />
                <span>{t("actions.profile")}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="site-header__account"
                aria-label={t("aria.login")}
              >
                <FaSignInAlt />
                <span>{t("actions.login")}</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="site-header__cart"
              aria-label={t("aria.cartItems", { count: cartCount })}
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
        aria-label={t("aria.drawer")}
      >
        <div className="nav-drawer__header">
          <Link
            to="/"
            className="nav-drawer__brand"
            onClick={closeDrawer}
          >
            <img
              src={BRAND.logo}
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
            aria-label={t("aria.closeMenu")}
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
                 t("account.welcome", { brand: BRAND.name }) }
            </strong>

            <span>
              {user
                ? t("account.shoppingAccount")
                : t("account.loginPrompt")}
            </span>
          </div>
        </div>

        <div className="nav-drawer__language">
          <LanguageSwitcher />
        </div>

        <nav className="nav-drawer__links">
          <Link to="/" onClick={closeDrawer}>
            <FaHome />
            <span>{t("nav.home")}</span>
          </Link>

          <Link to="/cart" onClick={closeDrawer}>
            <FaShoppingBag />
            <span>{t("nav.myCart")}</span>

            {cartCount > 0 ? (
              <small>{cartCount}</small>
            ) : null}
          </Link>

          {user ? (
            <>
              <Link to="/profile" onClick={closeDrawer}>
                <FaUser />
                <span>{t("nav.myProfile")}</span>
              </Link>

              <Link to="/orders" onClick={closeDrawer}>
                <FaBoxOpen />
                <span>{t("nav.myOrders")}</span>
              </Link>

              <Link to="/settings" onClick={closeDrawer}>
                <FaCog />
                <span>{t("nav.settings")}</span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              onClick={closeDrawer}
              className="nav-drawer__login-link"
            >
              <FaSignInAlt />
              <span>{t("nav.loginRegister")}</span>
            </Link>
          )}

          <Link to="/privacy" onClick={closeDrawer}>
            <FaShieldAlt />
            <span>{t("nav.privacyPolicy")}</span>
          </Link>

          {isAdmin ? (
            <Link
              to="/admin"
              onClick={closeDrawer}
              className="nav-drawer__admin-link"
            >
              <FaUserShield />
              <span>{t("nav.adminPanel")}</span>
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
              {t("actions.logout")}
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn--primary nav-drawer__login-button"
              onClick={closeDrawer}
            >
              <FaSignInAlt />
              {t("actions.loginToBrand", { brand: BRAND.name })}
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
