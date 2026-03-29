import Navbar from "../component/navbar";

const shellStyle = {
  width: "min(920px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

const cardStyle = {
  flex: "1 1 260px",
  maxWidth: 280,
  minHeight: 255,
  background: "linear-gradient(180deg, #ffe6b8 0%, #ffd06a 100%)",
  borderRadius: 18,
  padding: "26px 22px 20px",
  textAlign: "center",
  boxShadow: "0 18px 36px rgba(245, 158, 11, 0.18)",
};

const actionStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 94,
  padding: "10px 18px",
  borderRadius: 999,
  background: "#ffca2c",
  color: "#111111",
  textDecoration: "none",
  fontWeight: 800,
  boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
};

export default function Home() {
  return (
    <section style={shellStyle}>
      <Navbar />

      <div style={{ padding: "36px 24px 44px" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 34px" }}>
          <h1 style={{ margin: "0 0 10px", fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#111111" }}>
            Master the Grid.
          </h1>
          <p style={{ margin: "0 0 4px", color: "#374151", fontSize: 16 }}>
            Solve challenging nonogram puzzles with logic and precision.
          </p>
          <p style={{ margin: 0, color: "#374151", fontSize: 16 }}>
            Sharpen your mind with pixel-perfect logic games.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
          <article style={cardStyle}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, color: "#111111" }}>Nonogram Puzzle</h2>
            <p style={{ margin: "0 0 26px", color: "#3f3f46", lineHeight: 1.55 }}>
              Solve challenging nonogram puzzles with logic and precision. Sharpen your mind with
              pixel-perfect logic games.
            </p>
            <a href="#/play" style={actionStyle}>
              Play
            </a>
          </article>

          <article style={cardStyle}>
            <h2 style={{ margin: "0 0 14px", fontSize: 22, color: "#111111" }}>Stuck on a puzzle?</h2>
            <p style={{ margin: "0 0 26px", color: "#3f3f46", lineHeight: 1.55 }}>
              Need solution right away? We can show its solution by just input your clues and constraints. It
              will solve for you in seconds.
            </p>
            <a href="#/solver" style={actionStyle}>
              Go to Solver
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
