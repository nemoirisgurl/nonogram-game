import Navbar from "../component/navbar";
import Nonogram from "../component/nonogram";

const shellStyle = {
  width: "min(1120px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 22,
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

export default function Game({ playerName, size, hintLimit, onAbandon }) {
  return (
    <section style={shellStyle}>
      <Navbar />
      <div style={{ padding: "30px clamp(16px, 4vw, 36px) 36px" }}>
        <Nonogram size={size} playerName={playerName} hintLimit={hintLimit} onAbandon={onAbandon} />
      </div>
    </section>
  );
}
