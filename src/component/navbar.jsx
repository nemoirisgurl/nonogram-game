import logo from "/logo.png";
import AvatarIcon from "./avatarIcon";
const topBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "clamp(12px, 2.5vw, 14px) clamp(14px, 3vw, 18px)",
  background: "#f5f5f5",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
  minWidth: 0,
  flex: "1 1 240px",
};

const linkStyle = {
  color: "#111111",
  textDecoration: "none",
  fontSize: "clamp(1rem, 2.8vw, 1.375rem)",
  fontWeight: 700,
};

export default function Navbar() {
  return (
    <header style={topBarStyle}>
      <a href="#/" aria-label="Go to home" style={brandStyle}>
        <img
          src={logo}
          alt="Nonogrammer logo"
          style={{ width: "clamp(28px, 6vw, 36px)", height: "clamp(28px, 6vw, 36px)", objectFit: "contain", flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: "clamp(1.4rem, 4.8vw, 2rem)",
            fontWeight: 800,
            color: "#111111",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Nonogrammer
        </span>
      </a>

      <nav style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 24px)", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <a href="#/play" style={linkStyle}>
          Play
        </a>
        <a href="#/solver" style={linkStyle}>
          Solver
        </a>
        <a href="#/profile" style={linkStyle}>
          <AvatarIcon style={{ width: "clamp(32px, 5vw, 40px)", height: "clamp(32px, 5vw, 40px)" }} />
        </a>
      </nav>
    </header>
  );
}
