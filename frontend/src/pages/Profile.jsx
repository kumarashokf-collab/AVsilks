import {
  FaCamera,
  FaEnvelope,
  FaHeadset,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaUser
} from "react-icons/fa";

import { BRAND } from "../config/branding";
import { CONTACT } from "../config/contact";

function Profile({ user }) {
  const displayName =
    user?.displayName ||
    `${BRAND.name} Customer`;

  const phoneNumber =
    user?.phoneNumber ||
    "Phone number not available";

  const email =
    user?.email ||
    "Email not added";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 0 72px",
        background: "var(--color-cream-50)"
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
            textAlign: "center",
            marginBottom: "26px"
          }}
        >
          <p className="section__eyebrow">
            Your Account
          </p>

          <h1 style={{ marginBottom: "8px" }}>
            My Profile
          </h1>

          <p
            style={{
              margin: 0,
              color: "var(--color-text-secondary)"
            }}
          >
            మీ account మరియు customer వివరాలను
            ఇక్కడ చూడవచ్చు.
          </p>
        </header>

        <section
          className="card"
          style={{
            padding: "24px",
            display: "grid",
            gap: "22px"
          }}
        >
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: "12px"
            }}
          >
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--color-gold-100)",
                color: "var(--color-wine-800)",
                fontSize: "36px",
                position: "relative"
              }}
            >
              <FaUser />

              <button
                type="button"
                aria-label="Add profile photo"
                style={{
                  position: "absolute",
                  right: "-4px",
                  bottom: "2px",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--color-wine-800)",
                  color: "white"
                }}
              >
                <FaCamera size={14} />
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <h2 style={{ marginBottom: "4px" }}>
                {displayName}
              </h2>

              <small
                style={{
                  color: "var(--color-text-secondary)"
                }}
              >
                {BRAND.name} Customer
              </small>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "14px"
            }}
          >
            <ProfileRow
              icon={<FaPhone />}
              label="Phone Number"
              value={phoneNumber}
            />

            <ProfileRow
              icon={<FaEnvelope />}
              label="Email"
              value={email}
            />

            <ProfileRow
              icon={<FaIdCard />}
              label="Customer ID"
              value={user?.uid || "Not available"}
            />

            <ProfileRow
              icon={<FaMapMarkerAlt />}
              label="Default Address"
              value="No saved address yet"
            />

            <ProfileRow
              icon={<FaHeadset />}
              label="Support Phone"
              value={CONTACT.phone}
            />

            <ProfileRow
              icon={<FaEnvelope />}
              label="Support Email"
              value={CONTACT.email}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px"
            }}
          >
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                alert(
                  "Edit Profile feature తదుపరి stepలో add చేస్తాం."
                )
              }
            >
              Edit Profile
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                alert(
                  "Manage Addresses feature తదుపరి stepలో add చేస్తాం."
                )
              }
            >
              Manage Addresses
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileRow({
  icon,
  label,
  value
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "15px",
        border:
          "1px solid var(--color-border-light)",
        borderRadius: "var(--radius-sm)",
        background: "#fff"
      }}
    >
      <span
        style={{
          color: "var(--color-wine-800)",
          fontSize: "18px",
          marginTop: "2px"
        }}
      >
        {icon}
      </span>

      <div>
        <small
          style={{
            display: "block",
            marginBottom: "4px",
            color: "var(--color-text-secondary)"
          }}
        >
          {label}
        </small>

        <strong
          style={{
            wordBreak: "break-word"
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

export default Profile;
