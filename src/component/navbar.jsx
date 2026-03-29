const topBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 18px",
  background: "#f5f5f5",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
};

const linkStyle = {
  color: "#111111",
  textDecoration: "none",
  fontSize: 22,
  fontWeight: 700,
};

export default function Navbar() {
  return (
    <header style={topBarStyle}>
      <a href="#/" aria-label="Go to home" style={brandStyle}>
        <img
          src="src/assets/logo.png"
          alt="Nonogrammer logo"
          style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
        />
        <span style={{ fontSize: 32, fontWeight: 800, color: "#111111", lineHeight: 1 }}>
          Nonogrammer
        </span>
      </a>

      <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <a href="#/play" style={linkStyle}>
          Play
        </a>
        <a href="#/solver" style={linkStyle}>
          Solver
        </a>
      </nav>
    </header>
  );
}
