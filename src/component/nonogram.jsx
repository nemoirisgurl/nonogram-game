import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyCompletedLineMarks,
  checkWin,
  generatePuzzle,
  getCompletedLines,
  getHint,
} from "../lib/nonogramEngine";

const LINE_PADDING = 8;

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Nonogram({ size = 5, playerName = "", hintLimit = null, onAbandon }) {
  const canvasRef = useRef(null);
  const dragActionRef = useRef(null);
  const lastDraggedCellRef = useRef(null);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(size, 100));
  const [grid, setGrid] = useState(() => createEmptyGrid(size));
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [didWin, setDidWin] = useState(false);
  const [hintMessage, setHintMessage] = useState("");
  const [toolMode, setToolMode] = useState("fill");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");
  const [hoveredButton, setHoveredButton] = useState(null);
  const maxRowClues = Math.max(...puzzle.rowClues.map((clue) => clue.length));
  const maxColClues = Math.max(...puzzle.colClues.map((clue) => clue.length));
  const maxBoardWidth = Math.min(viewportSize.w * 0.52, 620);
  const maxBoardHeight = Math.min(viewportSize.h * 0.58, 620);
  const gridSize = useMemo(() => {
    const totalHorizontalCells = puzzle.size + maxRowClues;
    const totalVerticalCells = puzzle.size + maxColClues;
    const sizeByWidth = Math.floor(maxBoardWidth / totalHorizontalCells);
    const sizeByHeight = Math.floor(maxBoardHeight / totalVerticalCells);
    return Math.max(20, Math.min(42, sizeByWidth, sizeByHeight));
  }, [maxBoardHeight, maxBoardWidth, maxColClues, maxRowClues, puzzle.size]);
  const leftGutterPx = maxRowClues * gridSize;
  const topGutterPx = maxColClues * gridSize;
  const canvasWidth = leftGutterPx + puzzle.size * gridSize;
  const canvasHeight = topGutterPx + puzzle.size * gridSize;
  const completedLines = useMemo(
    () => getCompletedLines(grid, puzzle.solution),
    [grid, puzzle.solution],
  );
  const hintCap = Number.isFinite(hintLimit) ? Math.max(0, hintLimit) : null;
  const hintsRemaining = hintCap === null ? null : Math.max(0, hintCap - hintsUsed);

  useEffect(() => {
    const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const nextPuzzle = generatePuzzle(size, 100);
    setPuzzle(nextPuzzle);
    setGrid(createEmptyGrid(size));
    setDidWin(false);
    setHintMessage("");
    setElapsedSeconds(0);
    setHintsUsed(0);
    setSaveMessage("");
    setToolMode("fill");
    dragActionRef.current = null;
    lastDraggedCellRef.current = null;
  }, [size]);

  useEffect(() => {
    if (didWin) return undefined;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [didWin]);

  useEffect(() => {
    setDidWin(checkWin(grid, puzzle.solution));
  }, [grid, puzzle.solution]);

  useEffect(() => {
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

  function endDrag() {
    dragActionRef.current = null;
    lastDraggedCellRef.current = null;
  }

  const getCellFromEvent = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < leftGutterPx || y < topGutterPx) return null;

    const row = Math.floor((y - topGutterPx) / gridSize);
    const col = Math.floor((x - leftGutterPx) / gridSize);

    if (row < 0 || col < 0 || row >= puzzle.size || col >= puzzle.size) return null;
    return { row, col };
  };

  const updateCell = (row, col, nextValue) => {
    setGrid((previousGrid) => {
      if (previousGrid[row][col] === nextValue) return previousGrid;

      const newGrid = [...previousGrid];
      const newRow = [...newGrid[row]];
      newRow[col] = nextValue;
      newGrid[row] = newRow;
      return applyCompletedLineMarks(newGrid, puzzle.solution);
    });
  };

  const beginDrag = (event) => {
    if (didWin) return;

    const isRightClick = event.button === 2;
    if (isRightClick) event.preventDefault();

    const cell = getCellFromEvent(event);
    if (!cell) {
      endDrag();
      return;
    }

    const currentValue = grid[cell.row][cell.col];
    const intendedValue = isRightClick
      ? currentValue === -1 ? 0 : -1
      : toolMode === "fill"
        ? currentValue === 1 ? 0 : 1
        : currentValue === -1 ? 0 : -1;

    setHintMessage("");
    setSaveMessage("");
    dragActionRef.current = intendedValue;
    lastDraggedCellRef.current = `${cell.row}:${cell.col}`;
    updateCell(cell.row, cell.col, intendedValue);
  };

  const handleDrag = (event) => {
    if (didWin || dragActionRef.current === null) return;

    const cell = getCellFromEvent(event);
    if (!cell) return;

    const key = `${cell.row}:${cell.col}`;
    if (lastDraggedCellRef.current === key) return;

    lastDraggedCellRef.current = key;
    updateCell(cell.row, cell.col, dragActionRef.current);
  };

  const applyHint = () => {
    if (didWin) {
      setHintMessage("Puzzle already solved.");
      return;
    }

    if (hintsRemaining !== null && hintsRemaining <= 0) {
      setHintMessage("No hints left.");
      return;
    }

    const hint = getHint(grid, puzzle.solution, puzzle.rowClues, puzzle.colClues);
    if (!hint) {
      setHintMessage("No hint available.");
      return;
    }

    setHintMessage(hint.message ?? "Hint ready.");
    setSaveMessage("");
    setHintsUsed((current) => current + 1);
    if (typeof hint.row === "number" && typeof hint.col === "number" && typeof hint.value === "number") {
      updateCell(hint.row, hint.col, hint.value);
    }
  };

  const saveGame = () => {
    const snapshot = {
      playerName,
      size,
      hintLimit: hintCap,
      hintsUsed,
      elapsedSeconds,
      toolMode,
      grid,
      puzzle,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("nonogrammer-save", JSON.stringify(snapshot));
    setHintMessage("");
    setSaveMessage("Saved locally.");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(0, 0, canvas.width, topGutterPx);
    ctx.fillRect(0, 0, leftGutterPx, canvas.height);

    ctx.fillStyle = "#111111";
    ctx.font = `${Math.max(12, Math.floor(gridSize * 0.48))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let colIndex = 0; colIndex < puzzle.size; colIndex += 1) {
      const clues = puzzle.colClues[colIndex];
      const startRow = maxColClues - clues.length;
      const isComplete = completedLines.completedCols[colIndex];

      for (let clueIndex = 0; clueIndex < clues.length; clueIndex += 1) {
        const gutterRow = startRow + clueIndex;
        const x = leftGutterPx + colIndex * gridSize + gridSize / 2;
        const y = gutterRow * gridSize + gridSize / 2;
        ctx.fillStyle = isComplete ? "#0f766e" : "#111111";
        ctx.fillText(String(clues[clueIndex]), x, y);
      }
    }

    for (let rowIndex = 0; rowIndex < puzzle.size; rowIndex += 1) {
      const clues = puzzle.rowClues[rowIndex];
      const startCol = maxRowClues - clues.length;
      const isComplete = completedLines.completedRows[rowIndex];

      for (let clueIndex = 0; clueIndex < clues.length; clueIndex += 1) {
        const gutterCol = startCol + clueIndex;
        const x = gutterCol * gridSize + gridSize / 2;
        const y = topGutterPx + rowIndex * gridSize + gridSize / 2;
        ctx.fillStyle = isComplete ? "#0f766e" : "#111111";
        ctx.fillText(String(clues[clueIndex]), x, y);
      }
    }

    ctx.strokeStyle = "#d4d4d4";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, topGutterPx);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(leftGutterPx, y);
      ctx.stroke();
    }

    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = leftGutterPx + colIndex * gridSize;
        const y = topGutterPx + rowIndex * gridSize;
        const isLineComplete = completedLines.completedRows[rowIndex] || completedLines.completedCols[colIndex];

        ctx.fillStyle = cell === 1 ? "#111111" : isLineComplete ? "#f4fcf8" : "#ffffff";
        ctx.fillRect(x, y, gridSize, gridSize);

        if (cell === -1) {
          ctx.strokeStyle = "#111111";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + LINE_PADDING, y + LINE_PADDING);
          ctx.lineTo(x + gridSize - LINE_PADDING, y + gridSize - LINE_PADDING);
          ctx.moveTo(x + gridSize - LINE_PADDING, y + LINE_PADDING);
          ctx.lineTo(x + LINE_PADDING, y + gridSize - LINE_PADDING);
          ctx.stroke();
        }

        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, gridSize, gridSize);
      });
    });

    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftGutterPx, 0);
    ctx.lineTo(leftGutterPx, canvasHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, topGutterPx);
    ctx.lineTo(canvasWidth, topGutterPx);
    ctx.stroke();
  }, [
    canvasHeight,
    canvasWidth,
    completedLines,
    grid,
    gridSize,
    leftGutterPx,
    maxColClues,
    maxRowClues,
    puzzle.colClues,
    puzzle.rowClues,
    puzzle.size,
    topGutterPx,
  ]);

  const panelButtonStyle = (isActive) => ({
    border: "none",
    borderRadius: 999,
    padding: "10px 22px",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    background: isActive ? "#0f6fc7" : hoveredButton === "use" ? "#ececec" : "#ffffff",
    color: isActive ? "#ffffff" : "#111111",
    boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
    transition: "background-color 0.12s ease",
  });

  const actionButtonStyle = (buttonId) => ({
    width: "100%",
    border: "none",
    borderRadius: 18,
    padding: "14px 16px",
    background: hoveredButton === buttonId ? "#e3b11f" : "#ffca2c",
    color: "#111111",
    fontWeight: 800,
    fontSize: 18,
    cursor: "pointer",
    boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
    transition: "background-color 0.12s ease",
  });

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 28,
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            background: "#ffffff",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
            overflow: "auto",
            maxWidth: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={beginDrag}
            onMouseMove={handleDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onContextMenu={(event) => event.preventDefault()}
            aria-label="Nonogram Grid"
            aria-disabled={didWin}
            style={{ cursor: didWin ? "default" : "crosshair", display: "block" }}
          />
        </div>
        <p style={{ fontSize: 14, color: "#5b6473", textAlign: "center" }}>
          Left click uses the selected tool. Right click always places a cross.
        </p>
      </div>

      <aside
        style={{
          display: "grid",
          gap: 18,
          padding: "28px 22px",
          borderRadius: 22,
          background: "#d7f1ff",
          boxShadow: "0 18px 40px rgba(56, 189, 248, 0.18)",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "baseline" }}>
            <strong style={{ fontSize: 22, color: "#111111" }}>Player:</strong>
            <span style={{ color: "#5b6473", fontSize: 18 }}>{playerName || "Your Username..."}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "baseline" }}>
            <strong style={{ fontSize: 22, color: "#111111" }}>Time:</strong>
            <span style={{ color: "#5b6473", fontSize: 18 }}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ fontSize: 22, color: "#111111" }}>Mode</strong>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setToolMode("fill")}
                style={panelButtonStyle(toolMode === "fill")}
              >
                F
              </button>
              <button
                type="button"
                onClick={() => setToolMode("cross")}
                style={panelButtonStyle(toolMode === "cross")}
              >
                C
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ fontSize: 22, color: "#111111" }}>Hints</strong>
            <span style={{ color: "#5b6473", fontSize: 16 }}>
              {hintCap === null ? "Unlimited hints" : `${hintsRemaining}/${hintCap}`}
            </span>
            <button
              type="button"
              onClick={applyHint}
              disabled={didWin || hintsRemaining === 0}
              onMouseEnter={() => setHoveredButton("use")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                ...panelButtonStyle(false),
                opacity: didWin || hintsRemaining === 0 ? 0.55 : 1,
                cursor: didWin || hintsRemaining === 0 ? "not-allowed" : "pointer",
              }}
            >
              Use
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={saveGame}
          onMouseEnter={() => setHoveredButton("save")}
          onMouseLeave={() => setHoveredButton(null)}
          style={actionButtonStyle("save")}
        >
          Save game (Local)
        </button>

        <button
          type="button"
          onClick={onAbandon}
          onMouseEnter={() => setHoveredButton("abandon")}
          onMouseLeave={() => setHoveredButton(null)}
          style={actionButtonStyle("abandon")}
        >
          Abandon
        </button>

        <div aria-live="polite" style={{ minHeight: 44, fontWeight: 700, color: didWin ? "#0f766e" : "#374151" }}>
          {didWin ? "You win!" : hintMessage || saveMessage}
        </div>
      </aside>
    </section>
  );
}
