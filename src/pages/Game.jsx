import Navbar from "../component/navbar";
import Nonogram from "../component/nonogram";

const shellStyle = {
  width: "min(1120px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

export default function Game({ playerName, size, hintLimit, onAbandon }) {
  return (
    <section style={shellStyle}>
      <Navbar />
      <div style={{ padding: "clamp(18px, 4vw, 30px) clamp(12px, 4vw, 36px) clamp(20px, 5vw, 36px)" }}>
        <Nonogram size={size} playerName={playerName} hintLimit={hintLimit} onAbandon={onAbandon} />
      </div>
    </section>
  );
}
