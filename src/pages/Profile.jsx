import { useState } from "react";
import Navbar from "../component/navbar";
import AvatarIcon from "../component/avatarIcon";

const shellStyle = {
  width: "min(920px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

const buttonStyle = {
  border: "none",
  borderRadius: 999,
  background: "#ffca2c",
  color: "#111111",
  fontWeight: 800,
  fontSize: "clamp(1rem, 2.6vw, 1.15rem)",
  padding: "12px 26px",
  minWidth: 178,
  cursor: "pointer",
  boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
  transition: "background-color 0.2s ease, transform 0.2s ease",
};

const labelStyle = {
  margin: 0,
  color: "#111111",
  fontSize: "clamp(1rem, 2.8vw, 1.08rem)",
  lineHeight: 1.5,
};

function GridPreview() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" style={{ width: "100%", height: "100%" }}>
      <rect x="18" y="18" width="58" height="58" fill="#ffffff" stroke="#111111" strokeWidth="2.5" />
      <line x1="30" y1="18" x2="30" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="38" y1="18" x2="38" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="46" y1="18" x2="46" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="54" y1="18" x2="54" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="62" y1="18" x2="62" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="70" y1="18" x2="70" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="30" x2="76" y2="30" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="38" x2="76" y2="38" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="46" x2="76" y2="46" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="54" x2="76" y2="54" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="62" x2="76" y2="62" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="70" x2="76" y2="70" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="18" x2="76" y2="18" stroke="#111111" strokeWidth="2.5" />
      <line x1="18" y1="18" x2="18" y2="76" stroke="#111111" strokeWidth="2.5" />
      <path d="M8 20h10M8 28h10M24 8v10M32 8v10" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
      <text x="22" y="33" fontSize="10" fontWeight="700" fill="#111111">
        2
      </text>
    </svg>
  );
}

export default function Profile() {
  const [hoveredAction, setHoveredAction] = useState(null);

  return (
    <section style={shellStyle}>
      <Navbar />

      <div style={{ padding: "clamp(26px, 6vw, 42px) clamp(18px, 5vw, 56px) clamp(34px, 7vw, 50px)" }}>
        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(18px, 5vw, 52px)",
            flexWrap: "wrap",
            marginBottom: "clamp(24px, 5vw, 34px)",
          }}
        >
          <div style={{ width: "clamp(96px, 22vw, 126px)", aspectRatio: "1 / 1", flexShrink: 0 }}>
            <AvatarIcon />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.5rem, 4vw, 2.1rem)",
              lineHeight: 1.2,
              color: "#111111",
              textAlign: "center",
            }}
          >
            <span style={{ fontWeight: 800 }}>Welcome back!</span>{" "}
            <span style={{ fontWeight: 400 }}>{"{your username}"}</span>
          </h1>
        </section>

        <section>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(1.4rem, 3.7vw, 2rem)",
              color: "#111111",
            }}
          >
            Your progress
          </h2>

          <article
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(18px, 4vw, 34px)",
              flexWrap: "wrap",
              borderRadius: "clamp(18px, 3vw, 22px)",
              padding: "clamp(18px, 4vw, 28px)",
              background: "linear-gradient(90deg, #d3f7c8 0%, #c8f8c5 48%, #ccf7d2 100%)",
            }}
          >
            <div style={{ width: "clamp(84px, 14vw, 108px)", aspectRatio: "1 / 1", flexShrink: 0 }}>
              <GridPreview />
            </div>

            <div
              style={{
                flex: "1 1 280px",
                display: "grid",
                gap: 10,
                minWidth: "min(100%, 240px)",
              }}
            >
              <p style={labelStyle}>
                <strong>Created at:</strong> {"{time created}"}
              </p>
              <p style={labelStyle}>
                <strong>Size:</strong> {"{rows}"} × {"{columns}"}
              </p>
              <p style={labelStyle}>
                <strong>Hints left:</strong> {"{hints left}"}
              </p>
            </div>

            <div
              style={{
                flex: "1 1 220px",
                display: "grid",
                justifyItems: "start",
                alignContent: "center",
                gap: 22,
              }}
            >
              <p style={labelStyle}>
                <strong>Last saved:</strong> {"{time saved}"}
              </p>
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  background: hoveredAction === "continue" ? "#e3b11f" : "#ffca2c",
                  transform: hoveredAction === "continue" ? "translateY(-1px)" : "translateY(0)",
                }}
                onMouseEnter={() => setHoveredAction("continue")}
                onMouseLeave={() => setHoveredAction(null)}
              >
                Continue
              </button>
            </div>
          </article>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "clamp(12px, 3vw, 20px)",
              flexWrap: "wrap",
              marginTop: "clamp(20px, 5vw, 28px)",
            }}
          >
            <p style={{ margin: 0, color: "#111111", fontSize: "clamp(1rem, 2.8vw, 1.1rem)" }}>
              Wanna play new puzzle?
            </p>
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: hoveredAction === "new" ? "#e3b11f" : "#ffca2c",
                transform: hoveredAction === "new" ? "translateY(-1px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHoveredAction("new")}
              onMouseLeave={() => setHoveredAction(null)}
            >
              New Puzzle
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
