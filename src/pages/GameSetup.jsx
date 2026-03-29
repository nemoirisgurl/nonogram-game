import { useMemo, useState } from "react";
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

const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 999,
  border: "1.5px solid rgba(15, 23, 42, 0.18)",
  background: "#ffffff",
  color: "#111111",
  fontSize: 15,
  outline: "none",
};

export default function GameSetup({ initialName = "", initialSize = 5, onStart }) {
  const [name, setName] = useState(initialName);
  const [size, setSize] = useState(initialSize);
  const [hint, setHint] = useState("");

  const sizeOptions = useMemo(() => [5, 10, 15, 20], []);
  const canStart = name.trim().length > 0 && Number.isFinite(size) && size > 0;

  return (
    <section style={shellStyle}>
      <Navbar />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canStart) return;
          onStart?.({ playerName: name.trim(), size });
        }}
        style={{
          margin: 24,
          padding: "30px clamp(18px, 4vw, 36px)",
          background: "#d7f1ff",
          borderRadius: 18,
          display: "grid",
          gap: 22,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 34, color: "#111111" }}>Game Setup</h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 22,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <label htmlFor="playerName" style={{ display: "grid", gap: 8, fontWeight: 800, color: "#111111" }}>
              Player Name
              <input
                id="playerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your username..."
                autoComplete="nickname"
                style={fieldStyle}
              />
            </label>

            <label
              htmlFor="nonogramSize"
              style={{ display: "grid", gap: 8, fontWeight: 800, color: "#111111" }}
            >
              Puzzle Size
              <select
                id="nonogramSize"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                style={fieldStyle}
              >
                {sizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} x {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <label htmlFor="hintText" style={{ display: "grid", gap: 8, fontWeight: 800, color: "#111111" }}>
              Hints
              <input
                id="hintText"
                type="number"
                min={0}
                max={3}
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Enter your hint limit..."
                style={fieldStyle}
              />
            </label>

            <button
              type="submit"
              disabled={!canStart}
              style={{
                justifySelf: "start",
                padding: "12px 18px",
                borderRadius: 999,
                border: "none",
                background: canStart ? "#ffca2c" : "#f1d88a",
                color: "#111111",
                fontWeight: 800,
                fontSize: 16,
                cursor: canStart ? "pointer" : "not-allowed",
                boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              Start the game!
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
