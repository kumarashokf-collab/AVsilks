import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaDatabase,
  FaGlobe,
  FaKey,
  FaLock,
  FaShieldAlt,
  FaTrashAlt
} from "react-icons/fa";

function Settings() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState(true);

  const [language, setLanguage] =
    useState("English");

  const [isChangingPin, setIsChangingPin] =
    useState(false);

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isResetting, setIsResetting] =
    useState(false);

  const cardStyle = {
    background: "white",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    marginBottom: "20px"
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "15px 0",
    borderBottom: "1px solid #eee"
  };

  function ToggleBtn({ state, setState }) {
    return (
      <button
        type="button"
        onClick={() => setState(!state)}
        aria-pressed={state}
        style={{
          width: "45px",
          height: "24px",
          padding: 0,
          border: "none",
          background: state ? "#237a4b" : "#ccc",
          borderRadius: "20px",
          position: "relative",
          cursor: "pointer",
          transition: "0.3s"
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            background: "white",
            borderRadius: "50%",
            position: "absolute",
            top: "2px",
            left: state ? "23px" : "2px",
            transition: "0.3s",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        />
      </button>
    );
  }

  function handlePinChange(event) {
    event.preventDefault();

    const currentPin =
      localStorage.getItem("av_app_pin") || "2026";

    if (oldPin !== currentPin) {
      alert("పాత PIN తప్పుగా ఉంది.");
      return;
    }

    if (!/^[0-9]{4}$/.test(newPin)) {
      alert("కొత్త PIN ఖచ్చితంగా 4 అంకెలు ఉండాలి.");
      return;
    }

    localStorage.setItem("av_app_pin", newPin);

    alert("App PIN విజయవంతంగా మార్చబడింది.");

    setIsChangingPin(false);
    setOldPin("");
    setNewPin("");
  }

  function handleResetDemoData() {
    const confirmed = window.confirm(
      "పాత demo orders, cart మరియు saved addressను పూర్తిగా తొలగించాలా?\n\nఈ చర్యను తిరిగి మార్చలేరు."
    );

    if (!confirmed) {
      return;
    }

    setIsResetting(true);

    try {
      localStorage.removeItem("av_orders");
      localStorage.removeItem("avsilks_cart");
      localStorage.removeItem(
        "avsilks_delivery_address"
      );

      alert(
        "Demo data విజయవంతంగా reset అయింది.\nApp ఇప్పుడు refresh అవుతుంది."
      );

      window.location.replace("/");
    } catch (error) {
      console.error("Reset failed:", error);

      alert(
        "Data reset చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి."
      );

      setIsResetting(false);
    }
  }

  return (
    <main
      style={{
        padding: "32px 0 64px",
        background: "var(--color-cream-50)",
        minHeight: "100vh"
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "760px"
        }}
      >
        <header
          style={{
            marginBottom: "24px",
            textAlign: "center"
          }}
        >
          <p className="section__eyebrow">
            Account Preferences
          </p>

          <h1
            style={{
              marginBottom: "8px"
            }}
          >
            Settings
          </h1>

          <p
            style={{
              marginBottom: 0,
              color: "var(--color-text-secondary)"
            }}
          >
            మీ app preferences, security మరియు local
            demo dataను నిర్వహించండి.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            Preferences
          </h2>

          <div style={rowStyle}>
            <div style={labelStyle}>
              <FaGlobe color="#7b2928" size={20} />
              <span>App Language</span>
            </div>

            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);

                alert(
                  `భాష ${event.target.value}కు మార్చబడింది.`
                );
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border:
                  "1px solid var(--color-border-medium)",
                background: "var(--color-cream-50)",
                fontWeight: 700
              }}
            >
              <option value="English">
                English
              </option>

              <option value="తెలుగు">
                తెలుగు
              </option>
            </select>
          </div>

          <div
            style={{
              ...rowStyle,
              borderBottom: "none"
            }}
          >
            <div style={labelStyle}>
              <FaBell color="#7b2928" size={20} />
              <span>Notifications</span>
            </div>

            <ToggleBtn
              state={notifications}
              setState={setNotifications}
            />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            Privacy & Security
          </h2>

          <div style={rowStyle}>
            <div style={labelStyle}>
              <FaLock color="#7b2928" size={20} />
              <span>App Permissions</span>
            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Browser permissionsను మీ browser settingsలో నిర్వహించాలి."
                )
              }
              style={textButtonStyle}
            >
              Manage
            </button>
          </div>

          <div style={rowStyle}>
            <div style={labelStyle}>
              <FaKey color="#7b2928" size={20} />
              <span>Manage App PIN</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsChangingPin((current) => !current)
              }
              style={textButtonStyle}
            >
              {isChangingPin
                ? "Close"
                : "Change PIN"}
            </button>
          </div>

          {isChangingPin ? (
            <form
              onSubmit={handlePinChange}
              style={{
                marginTop: "12px",
                padding: "16px",
                borderRadius: "12px",
                display: "grid",
                gap: "12px",
                background: "var(--color-gold-100)"
              }}
            >
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Current PIN"
                required
                value={oldPin}
                onChange={(event) =>
                  setOldPin(event.target.value)
                }
                style={inputStyle}
              />

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="New 4-digit PIN"
                required
                value={newPin}
                onChange={(event) =>
                  setNewPin(event.target.value)
                }
                style={inputStyle}
              />

              <button
                type="submit"
                className="btn btn--primary"
              >
                Update PIN
              </button>
            </form>
          ) : null}

          <button
            type="button"
            onClick={() => navigate("/privacy")}
            style={{
              ...rowStyle,
              width: "100%",
              borderTop: "none",
              borderRight: "none",
              borderBottom: "none",
              borderLeft: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <div style={labelStyle}>
              <FaShieldAlt
                color="#7b2928"
                size={20}
              />

              <span>Privacy Policy</span>
            </div>

            <span
              style={{
                color: "#aaa",
                fontSize: "18px"
              }}
            >
              ›
            </span>
          </button>
        </section>

        <section
          style={{
            ...cardStyle,
            border: "1px solid #f0c4c0"
          }}
        >
          <h2 style={sectionTitleStyle}>
            Demo Data Management
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              marginBottom: "18px"
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                flex: "0 0 42px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "#fff0ef",
                color: "#b3261e"
              }}
            >
              <FaDatabase />
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  marginBottom: "5px"
                }}
              >
                Reset Local Demo Data
              </strong>

              <p
                style={{
                  margin: 0,
                  color:
                    "var(--color-text-secondary)",
                  fontSize: "14px"
                }}
              >
                ఇది పాత orders, cart మరియు saved delivery
                addressను తొలగిస్తుంది. App PIN మాత్రం
                అలాగే ఉంటుంది.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDemoData}
            disabled={isResetting}
            style={{
              width: "100%",
              minHeight: "46px",
              border: "1px solid #e8aaa4",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              background: "#fff0ef",
              color: "#b3261e",
              fontWeight: 800,
              cursor: isResetting
                ? "not-allowed"
                : "pointer",
              opacity: isResetting ? 0.65 : 1
            }}
          >
            <FaTrashAlt />

            {isResetting
              ? "Resetting..."
              : "Reset Demo Data"}
          </button>
        </section>
      </div>
    </main>
  );
}

const sectionTitleStyle = {
  margin: "0 0 10px",
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-family-body)",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const labelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  color: "var(--color-text-primary)",
  fontWeight: 750
};

const textButtonStyle = {
  border: "none",
  background: "transparent",
  color: "var(--color-info)",
  fontWeight: 800,
  cursor: "pointer"
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  border:
    "1px solid var(--color-border-medium)",
  borderRadius: "8px",
  background: "white"
};

export default Settings;
