import { useMemo, useState } from "react";

export default function GameSetup({ initialName = "", initialSize = 5, onStart }) {
  const [name, setName] = useState(initialName);
  const [size, setSize] = useState(initialSize);

  const sizeOptions = useMemo(() => [5, 10, 15, 20], []);

  const canStart = name.trim().length > 0 && Number.isFinite(size) && size > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canStart) return;
        onStart?.({ playerName: name.trim(), size });
      }}
      style={{
        display: "grid",
        gap: 12,
        padding: 12,
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 12,
        maxWidth: 420,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="playerName" style={{ fontWeight: 700 }}>
          Player name
        </label>
        <input
          id="playerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nemo"
          autoComplete="nickname"
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label htmlFor="nonogramSize" style={{ fontWeight: 700 }}>
          Nonogram size
        </label>
        <select
          id="nonogramSize"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        >
          {sizeOptions.map((s) => (
            <option key={s} value={s}>
              {s} x {s}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={!canStart}>
        Start game
      </button>
    </form>
  );
}