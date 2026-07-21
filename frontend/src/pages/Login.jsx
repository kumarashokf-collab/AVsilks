import { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../firebase";
import logo from "../assets/logo.png";
import { BRAND } from "../config/branding";
import { getUserRole } from "../constants/admin";
import { ROLES } from "../constants/roles";

function Login() {
  const navigate = useNavigate();

  const verifierRef = useRef(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [loading, setLoading] = useState(false);

  function clearRecaptcha() {
    try {
      verifierRef.current?.clear();
    } catch (error) {
      console.warn("reCAPTCHA clear warning:", error);
    }

    verifierRef.current = null;

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Already cleared.
      }

      window.recaptchaVerifier = null;
    }

    const container = document.getElementById(
      "recaptcha-container"
    );

    if (container) {
      container.innerHTML = "";
    }
  }

  function createRecaptcha() {
    clearRecaptcha();

    const verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        "expired-callback": () => {
          clearRecaptcha();
        }
      }
    );

    verifierRef.current = verifier;
    window.recaptchaVerifier = verifier;

    return verifier;
  }

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  function handlePhoneChange(event) {
    const digits = event.target.value
      .replace(/\D/g, "")
      .slice(0, 10);

    setPhone(digits);
  }

  async function handleSendOtp(event) {
    event.preventDefault();

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      alert("సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.");
      return;
    }

    setLoading(true);

    try {
      const verifier = createRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        verifier
      );

      setConfirmationResult(result);
      setOtp("");
    } catch (error) {
      console.error("OTP send failed:", error);

      clearRecaptcha();

      alert(
        `${error?.code || "unknown-error"}\n\n${
          error?.message || String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    if (!confirmationResult) {
      alert("ముందుగా Get OTP నొక్కండి.");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      alert("సరైన 6 అంకెల OTP నమోదు చేయండి.");
      return;
    }

    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);

      clearRecaptcha();

      if (getUserRole(result.user) === ROLES.ADMIN) {
        navigate("/admin", {
          replace: true
        });
      } else {
        navigate("/", {
          replace: true
        });
      }
    } catch (error) {
      console.error("OTP verification failed:", error);

      alert(
        `${error?.code || "Invalid OTP"}\n\n${
          error?.message ||
          "దయచేసి సరైన OTP ఇవ్వండి."
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleUseDifferentNumber() {
    setConfirmationResult(null);
    setOtp("");
    clearRecaptcha();
  }

  return (
    <main
      style={{
        minHeight: "calc(100dvh - 64px)",
        padding: "32px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "#fcf9f2",
        overflowX: "hidden"
      }}
    >
      <div
        id="recaptcha-container"
        style={{
          position: "fixed",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none"
        }}
      />

      <section
        style={{
          width: "100%",
          maxWidth: "430px",
          margin: "24px auto 0",
          padding: "28px 24px",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow:
            "0 10px 30px rgba(74, 28, 28, 0.10)",
          textAlign: "center"
        }}
      >
        <img
          src={logo}
          alt={BRAND.name}
          loading="eager"
          decoding="async"
          style={{
            width: "88px",
            height: "88px",
            objectFit: "contain",
            marginBottom: "14px"
          }}
        />

        <h1
          style={{
            margin: "0 0 6px",
            color: "#4a1c1c",
            fontSize: "28px",
            lineHeight: 1.2
          }}
        >
          Welcome to {BRAND.name}
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            color: "#777"
          }}
        >
          Sign in to continue
        </p>

        {!confirmationResult ? (
          <form
            onSubmit={handleSendOtp}
            style={{
              display: "grid",
              gap: "16px"
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                minHeight: "52px",
                border: "1px solid #d8d8d8",
                borderRadius: "10px",
                overflow: "hidden"
              }}
            >
              <span
                style={{
                  padding: "14px 16px",
                  display: "grid",
                  placeItems: "center",
                  background: "#f7f7f7",
                  borderRight: "1px solid #d8d8d8",
                  fontWeight: 700
                }}
              >
                +91
              </span>

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Enter Mobile Number"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                required
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "14px",
                  border: "none",
                  outline: "none",
                  fontSize: "16px"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                minHeight: "52px",
                border: "none",
                borderRadius: "10px",
                background: "#ff9900",
                color: "white",
                fontSize: "17px",
                fontWeight: 800,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading
                ? "Sending OTP..."
                : "Get OTP"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            style={{
              display: "grid",
              gap: "16px"
            }}
          >
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              maxLength={6}
              required
              style={{
                width: "100%",
                minHeight: "52px",
                padding: "14px",
                border: "1px solid #d8d8d8",
                borderRadius: "10px",
                outline: "none",
                textAlign: "center",
                fontSize: "20px",
                letterSpacing: "5px"
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                minHeight: "52px",
                border: "none",
                borderRadius: "10px",
                background: "#4a1c1c",
                color: "white",
                fontSize: "17px",
                fontWeight: 800,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading
                ? "Verifying..."
                : "Verify & Login"}
            </button>

            <button
              type="button"
              onClick={handleUseDifferentNumber}
              disabled={loading}
              style={{
                border: "none",
                background: "transparent",
                color: "#7b2928",
                fontWeight: 700
              }}
            >
              Use different mobile number
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default Login;
