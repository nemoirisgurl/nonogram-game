import { useEffect, useState } from "react";
import Navbar from "../component/navbar";
import { supabase } from "../lib/supabase";
import { generatePuzzle } from "../lib/nonogramEngine";

const fallbackSizeOptions = [5, 10, 15, 20];

const shellStyle = {
  width: "min(920px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

const fieldStyle = {
  width: "100%",
  padding: "clamp(10px, 2.8vw, 12px) clamp(12px, 3vw, 14px)",
  borderRadius: 999,
  border: "1.5px solid rgba(15, 23, 42, 0.18)",
  background: "#ffffff",
  color: "#111111",
  fontSize: "clamp(0.95rem, 2.8vw, 1rem)",
  outline: "none",
};

function normalizeSizeRow(item) {
  const rows = Number(item.rows);
  const columns = Number(item.columns);
  const squareSize = Number(item.size ?? item.value);

  if (Number.isFinite(rows) && Number.isFinite(columns) && rows > 0 && columns > 0) {
    return {
      key: item.id || `${rows}x${columns}`,
      value: rows,
      label: `${rows} x ${columns}`,
      accepted: rows === columns,
      reason: rows === columns ? "" : "Only square puzzle sizes are supported right now.",
    };
  }

  if (Number.isFinite(squareSize) && squareSize > 0) {
    return {
      key: item.id || squareSize,
      value: squareSize,
      label: `${squareSize} x ${squareSize}`,
      accepted: true,
      reason: "",
    };
  }

  return {
    key: item.id || "unknown",
    value: null,
    label: "Invalid size row",
    accepted: false,
    reason: "Missing numeric rows/columns or size value.",
  };
}

export default function GameSetup({ currentUser, initialName = "", initialSize = 5, initialHintLimit = null, onStart }) {
  const [name, setName] = useState(initialName);
  const [size, setSize] = useState(initialSize);
  const [hint, setHint] = useState(initialHintLimit ?? "");
  const [isStartHovered, setIsStartHovered] = useState(false);
  const [sizeOptions, setSizeOptions] = useState(
    fallbackSizeOptions.map((option) => ({
      key: option,
      id: null,
      value: option,
      label: `${option} x ${option}`,
    })),
  );

  const lockedName = currentUser?.username?.trim() || "";
  const playerName = lockedName || name.trim();
  const canStart = playerName.length > 0 && Number.isFinite(size) && size > 0;
  const selectedSizeOption = sizeOptions.find((option) => option.value === size) || null;

  useEffect(() => {
    if (lockedName) {
      setName(lockedName);
    }
  }, [lockedName]);

  useEffect(() => {
    let isMounted = true;

    const loadSizes = async () => {
      const { data, error } = await supabase.from("sizes").select();

      if (!isMounted || error || !Array.isArray(data)) {
        return;
      }

      const mappedRows = data.map((item) => ({
        ...normalizeSizeRow(item),
        id: item.id || null,
      }));

      const nextSizeOptions = mappedRows
        .filter((item) => item.accepted)
        .sort((a, b) => a.value - b.value);

      if (!nextSizeOptions.length) {
        return;
      }

      const uniqueSizeOptions = Array.from(new Map(nextSizeOptions.map((item) => [item.value, item])).values());
      setSizeOptions(uniqueSizeOptions);

      setSize((currentSize) => (uniqueSizeOptions.some((option) => option.value === currentSize) ? currentSize : uniqueSizeOptions[0].value));
    };

    void loadSizes();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section style={shellStyle}>
      <Navbar />

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canStart) return;

          let gridId = null;
          const puzzle = generatePuzzle(size, 100);

          if (currentUser?.id && selectedSizeOption?.id) {
            try {
              const { data: createdGrid } = await supabase
                .from("grids")
                .insert({
                  author_id: currentUser?.id || null,
                  size_id: selectedSizeOption.id,
                  difficulty: "normal",
                  solution: puzzle.solution,
                })
                .select("id")
                .single();

              gridId = createdGrid?.id || null;
            } catch {
              gridId = null;
            }
          }

          onStart?.({
            playerName,
            size,
            hintLimit: hint === "" ? null : Math.max(0, Number(hint)),
            sizeId: selectedSizeOption?.id || null,
            gridId,
            puzzle,
          });
        }}
        style={{
          margin: "clamp(14px, 3vw, 24px)",
          padding: "30px clamp(18px, 4vw, 36px)",
          background: "#d7f1ff",
          borderRadius: "clamp(16px, 3vw, 18px)",
          display: "grid",
          gap: "clamp(18px, 4vw, 22px)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.7rem, 5vw, 2.125rem)", color: "#111111" }}>Game Setup</h1>
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
                value={playerName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your username..."
                autoComplete="nickname"
                readOnly={Boolean(lockedName)}
                style={{ ...fieldStyle, background: lockedName ? "#f5f5f5" : "#ffffff", cursor: lockedName ? "not-allowed" : "text" }}
              />
            </label>
            {lockedName ? <p style={{ margin: 0, color: "#45556c", fontSize: "0.95rem" }}>Signed-in players use their Supabase username.</p> : null}

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
                  <option key={option.key} value={option.value}>
                    {option.label}
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
              onMouseEnter={() => setIsStartHovered(true)}
              onMouseLeave={() => setIsStartHovered(false)}
              style={{
                justifySelf: "start",
                padding: "12px 18px",
                borderRadius: 999,
                border: "none",
                background: canStart ? (isStartHovered ? "#e3b11f" : "#ffca2c") : "#f1d88a",
                color: "#111111",
                fontWeight: 800,
                fontSize: "clamp(0.95rem, 3vw, 1rem)",
                cursor: canStart ? "pointer" : "not-allowed",
                boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
                transform: canStart ? "scale(1.02)" : "none",
                transition: "transform 0.1s ease, background-color 0.1s ease",
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
