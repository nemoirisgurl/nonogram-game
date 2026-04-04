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

function SolverBoard({
  size,
  grid,
  rowClues,
  colClues,
  onCellToggle,
  onRowClueChange,
  onColClueChange,
}) {
  const clueDepth = Math.max(1, Math.ceil(size / 2));
  const safeGrid = Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, colIndex) => grid?.[rowIndex]?.[colIndex] ?? 0),
  );
  const safeRowClues = Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: clueDepth }, (_, clueIndex) => rowClues?.[rowIndex]?.[clueIndex] ?? ""),
  );
  const safeColClues = Array.from({ length: size }, (_, colIndex) =>
    Array.from({ length: clueDepth }, (_, clueIndex) => colClues?.[colIndex]?.[clueIndex] ?? ""),
  );
  const cellSize = size >= 15 ? 26 : size >= 10 ? 32 : 44;
  const gutterSize = Math.max(32, cellSize - 2);
  const totalColumns = clueDepth + size;

  const clueInputStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    textAlign: "center",
    fontSize: Math.max(12, Math.floor(cellSize * 0.34)),
    fontWeight: 700,
    color: "#111111",
    background: "transparent",
    padding: 0,
  };

  const focusClueInput = (kind, primaryIndex, secondaryIndex) => {
    const selector = [
      'input[data-clue-kind="',
      kind,
      '"][data-primary-index="',
      String(primaryIndex),
      '"][data-secondary-index="',
      String(secondaryIndex),
      '"]',
    ].join("");
    const nextInput = document.querySelector(selector);
    if (nextInput instanceof HTMLInputElement) {
      nextInput.focus();
      nextInput.select();
    }
  };

  const handleClueKeyDown = (event, kind, primaryIndex, secondaryIndex) => {
    const key = event.key.toLowerCase();
    let nextPrimaryIndex = primaryIndex;
    let nextSecondaryIndex = secondaryIndex;

    if (key === "arrowup" || key === "w") {
      nextPrimaryIndex = kind === "row" ? primaryIndex - 1 : primaryIndex;
      nextSecondaryIndex = kind === "row" ? secondaryIndex : secondaryIndex - 1;
    } else if (key === "arrowdown" || key === "s") {
      nextPrimaryIndex = kind === "row" ? primaryIndex + 1 : primaryIndex;
      nextSecondaryIndex = kind === "row" ? secondaryIndex : secondaryIndex + 1;
    } else if (key === "arrowleft" || key === "a") {
      nextPrimaryIndex = kind === "row" ? primaryIndex : primaryIndex - 1;
      nextSecondaryIndex = kind === "row" ? secondaryIndex - 1 : secondaryIndex;
    } else if (key === "arrowright" || key === "d") {
      nextPrimaryIndex = kind === "row" ? primaryIndex : primaryIndex + 1;
      nextSecondaryIndex = kind === "row" ? secondaryIndex + 1 : secondaryIndex;
    } else {
      return;
    }

    const maxPrimaryIndex = size - 1;
    const maxSecondaryIndex = clueDepth - 1;
    if (
      nextPrimaryIndex < 0 ||
      nextSecondaryIndex < 0 ||
      nextPrimaryIndex > maxPrimaryIndex ||
      nextSecondaryIndex > maxSecondaryIndex
    ) {
      return;
    }

    event.preventDefault();
    focusClueInput(kind, nextPrimaryIndex, nextSecondaryIndex);
  };

  const getGridBorderRight = (columnIndex) => {
    if (columnIndex === totalColumns - 1) return "none";
    const boardColumnIndex = columnIndex - clueDepth + 1;
    if (boardColumnIndex > 0 && boardColumnIndex % 5 === 0) return "2px solid #111111";
    return "1px solid #111111";
  };

  const getGridBorderBottom = (rowIndex) => {
    if (rowIndex === size - 1) return "none";
    if ((rowIndex + 1) % 5 === 0) return "2px solid #111111";
    return "1px solid #111111";
  };

  return (
    <div
      style={{
        padding: "clamp(10px, 3vw, 18px)",
        borderRadius: "clamp(14px, 3vw, 18px)",
        background: "#ffffff",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
        overflow: "auto",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalColumns}, minmax(${gutterSize}px, ${cellSize}px))`,
          gridAutoRows: `minmax(${gutterSize}px, ${cellSize}px)`,
          width: "fit-content",
          background: "#ffffff",
          border: "1px solid #d4d4d4",
        }}
      >
        {Array.from({ length: clueDepth }).flatMap((_, gutterRow) =>
          Array.from({ length: totalColumns }, (_, columnIndex) => {
            if (columnIndex < clueDepth) {
              return (
                <div
                  key={`corner-${gutterRow}-${columnIndex}`}
                  style={{
                    borderRight: "1px solid #d4d4d4",
                    borderBottom: "1px solid #d4d4d4",
                    background: "#f7f7f7",
                  }}
                />
              );
            }

            const colIndex = columnIndex - clueDepth;
            const value = safeColClues[colIndex][gutterRow];

            return (
              <div
                key={`col-clue-${gutterRow}-${columnIndex}`}
                style={{
                  borderRight: getGridBorderRight(columnIndex).replace("#111111", "#d4d4d4"),
                  borderBottom: gutterRow === clueDepth - 1 ? "2px solid #111111" : "1px solid #d4d4d4",
                  background: "#f7f7f7",
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={value}
                  onChange={(event) => onColClueChange?.(colIndex, gutterRow, event.target.value)}
                  onKeyDown={(event) => handleClueKeyDown(event, "col", colIndex, gutterRow)}
                  style={clueInputStyle}
                  data-clue-kind="col"
                  data-primary-index={colIndex}
                  data-secondary-index={gutterRow}
                  aria-label={`Column ${colIndex + 1} clue ${gutterRow + 1}`}
                />
              </div>
            );
          }),
        )}

        {Array.from({ length: size }).flatMap((_, rowIndex) =>
          Array.from({ length: totalColumns }, (_, columnIndex) => {
            if (columnIndex < clueDepth) {
              const value = safeRowClues[rowIndex][columnIndex];

              return (
                <div
                  key={`row-clue-${rowIndex}-${columnIndex}`}
                  style={{
                    borderRight: columnIndex === clueDepth - 1 ? "2px solid #111111" : "1px solid #d4d4d4",
                    borderBottom: getGridBorderBottom(rowIndex).replace("#111111", "#d4d4d4"),
                    background: "#f7f7f7",
                  }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={(event) => onRowClueChange?.(rowIndex, columnIndex, event.target.value)}
                    onKeyDown={(event) => handleClueKeyDown(event, "row", rowIndex, columnIndex)}
                    style={clueInputStyle}
                    data-clue-kind="row"
                    data-primary-index={rowIndex}
                    data-secondary-index={columnIndex}
                    aria-label={`Row ${rowIndex + 1} clue ${columnIndex + 1}`}
                  />
                </div>
              );
            }

            const colIndex = columnIndex - clueDepth;
            const cell = safeGrid[rowIndex][colIndex];

            return (
              <button
                key={`solver-cell-${rowIndex}-${colIndex}`}
                type="button"
                onClick={() => onCellToggle?.(rowIndex, colIndex)}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRight: getGridBorderRight(columnIndex),
                  borderBottom: getGridBorderBottom(rowIndex),
                  background: cell === 1 ? "#111111" : "#ffffff",
                  cursor: "pointer",
                  position: "relative",
                  padding: 0,
                }}
                aria-label={`Solver row ${rowIndex + 1}, column ${colIndex + 1}`}
              >
                {cell === -1 ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      color: "#111111",
                      fontSize: Math.max(12, Math.floor(cellSize * 0.45)),
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export default function Nonogram({
  mode = "game",
  size = 5,
  initialPuzzle = null,
  initialState = null,
  playerName = "",
  hintLimit = null,
  onAbandon,
  onProgressChange,
  grid: controlledGrid,
  rowClues: controlledRowClues,
  colClues: controlledColClues,
  onCellToggle,
  onRowClueChange,
  onColClueChange,
}) {
  if (mode === "solver") {
    return (
      <SolverBoard
        size={size}
        grid={controlledGrid}
        rowClues={controlledRowClues}
        colClues={controlledColClues}
        onCellToggle={onCellToggle}
        onRowClueChange={onRowClueChange}
        onColClueChange={onColClueChange}
      />
    );
  }

  const bootPuzzle = initialState?.puzzle || initialPuzzle || generatePuzzle(size, 100);
  const bootGrid = initialState?.grid || createEmptyGrid(size);
  const canvasRef = useRef(null);
  const dragActionRef = useRef(null);
  const lastDraggedCellRef = useRef(null);
  const [puzzle, setPuzzle] = useState(() => bootPuzzle);
  const [grid, setGrid] = useState(() => bootGrid);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [didWin, setDidWin] = useState(() => checkWin(bootGrid, bootPuzzle.solution));
  const [hintMessage, setHintMessage] = useState("");
  const [toolMode, setToolMode] = useState(() => initialState?.toolMode || "fill");
  const [elapsedSeconds, setElapsedSeconds] = useState(() => initialState?.elapsedSeconds ?? 0);
  const [hintsUsed, setHintsUsed] = useState(() => initialState?.hintsUsed ?? 0);
  const [lockedCells, setLockedCells] = useState(() => new Set(initialState?.lockedCells || []));
  const [saveMessage, setSaveMessage] = useState("");
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isUseHovered, setIsUseHovered] = useState(false);
  const [isCrossHovered, setIsCrossHovered] = useState(false);
  const [startedAt, setStartedAt] = useState(() => initialState?.startedAt || new Date().toISOString());
  const maxRowClues = Math.max(...puzzle.rowClues.map((clue) => clue.length));
  const maxColClues = Math.max(...puzzle.colClues.map((clue) => clue.length));
  const isCompactViewport = viewportSize.w < 820;
  const maxBoardWidth = Math.min(viewportSize.w * (isCompactViewport ? 0.84 : 0.52), 620);
  const maxBoardHeight = Math.min(viewportSize.h * (isCompactViewport ? 0.48 : 0.58), 620);
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
    const nextPuzzle = initialState?.puzzle || initialPuzzle || generatePuzzle(size, 100);
    const nextGrid = initialState?.grid || createEmptyGrid(size);

    setPuzzle(nextPuzzle);
    setGrid(nextGrid);
    setDidWin(checkWin(nextGrid, nextPuzzle.solution));
    setHintMessage("");
    setElapsedSeconds(initialState?.elapsedSeconds ?? 0);
    setHintsUsed(initialState?.hintsUsed ?? 0);
    setStartedAt(initialState?.startedAt || new Date().toISOString());
    setLockedCells(new Set(initialState?.lockedCells || []));
    setSaveMessage("");
    setToolMode(initialState?.toolMode || "fill");
    dragActionRef.current = null;
    lastDraggedCellRef.current = null;
  }, [initialPuzzle, initialState, size]);

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

  const buildSnapshot = () => ({
    playerName,
    size,
    hintLimit: hintCap,
    hintsUsed,
    lockedCells: Array.from(lockedCells),
    elapsedSeconds,
    toolMode,
    grid,
    puzzle,
    startedAt,
    savedAt: new Date().toISOString(),
    gameStatus: didWin ? "completed" : "in_progress",
  });

  useEffect(() => {
    onProgressChange?.(buildSnapshot());
  }, [didWin, elapsedSeconds, grid, hintCap, hintsUsed, lockedCells, onProgressChange, playerName, puzzle, size, startedAt, toolMode]);

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
    if (lockedCells.has(`${row}:${col}`)) return;

    setGrid((previousGrid) => {
      if (previousGrid[row][col] === nextValue) return previousGrid;

      const newGrid = [...previousGrid];
      const newRow = [...newGrid[row]];
      newRow[col] = nextValue;
      newGrid[row] = newRow;
      return applyCompletedLineMarks(newGrid, puzzle.solution);
    });
  };

  const applyLockedCell = (row, col, nextValue) => {
    setGrid((previousGrid) => {
      if (previousGrid[row][col] === nextValue) return previousGrid;

      const newGrid = [...previousGrid];
      const newRow = [...newGrid[row]];
      newRow[col] = nextValue;
      newGrid[row] = newRow;
      return applyCompletedLineMarks(newGrid, puzzle.solution);
    });

    setLockedCells((current) => {
      const next = new Set(current);
      next.add(`${row}:${col}`);
      return next;
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
    if (lockedCells.has(`${cell.row}:${cell.col}`)) {
      endDrag();
      return;
    }
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
      applyLockedCell(hint.row, hint.col, hint.value);
    }
  };

  const saveGame = () => {
    const snapshot = buildSnapshot();
    window.localStorage.setItem("nonogrammer-save", JSON.stringify(snapshot));
    onProgressChange?.(snapshot);
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
    ctx.font = `700 ${Math.max(12, Math.floor(gridSize * 0.48))}px "Segoe UI", Roboto, sans-serif`;
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
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      const columnIndex = x / gridSize;
      ctx.lineWidth = columnIndex > maxRowClues && (columnIndex - maxRowClues) % 5 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, topGutterPx);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      const rowIndex = y / gridSize;
      ctx.lineWidth = rowIndex > maxColClues && (rowIndex - maxColClues) % 5 === 0 ? 2 : 1;
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
        ctx.lineWidth = (colIndex + 1) % 5 === 0 || (rowIndex + 1) % 5 === 0 ? 2 : 1;
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
    background: isActive ? "#0f6fc7" : "#ffffff",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "clamp(18px, 4vw, 28px)",
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
        <div
          style={{
            padding: "clamp(10px, 3vw, 18px)",
            borderRadius: "clamp(14px, 3vw, 18px)",
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
        <p style={{ fontSize: "clamp(0.8rem, 2.6vw, 0.875rem)", color: "#5b6473", textAlign: "center" }}>
          Left click uses the selected tool. Right click always places a cross.
        </p>
      </div>

      <aside
        style={{
          display: "grid",
          gap: "clamp(14px, 3vw, 18px)",
          padding: "clamp(16px, 4vw, 28px) clamp(14px, 4vw, 22px)",
          borderRadius: "clamp(16px, 3vw, 22px)",
          background: "#d7f1ff",
          boxShadow: "0 18px 40px rgba(56, 189, 248, 0.18)",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "baseline" }}>
            <strong style={{ fontSize: "clamp(1.1rem, 3.6vw, 1.375rem)", color: "#111111" }}>Player:</strong>
            <span style={{ color: "#5b6473", fontSize: "clamp(0.95rem, 3vw, 1.125rem)" }}>{playerName || "Your Username..."}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "baseline" }}>
            <strong style={{ fontSize: "clamp(1.1rem, 3.6vw, 1.375rem)", color: "#111111" }}>Time:</strong>
            <span style={{ color: "#5b6473", fontSize: "clamp(0.95rem, 3vw, 1.125rem)" }}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ fontSize: "clamp(1.1rem, 3.6vw, 1.375rem)", color: "#111111" }}>Mode</strong>
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
                onMouseEnter={() => setIsCrossHovered(true)}
                onMouseLeave={() => setIsCrossHovered(false)}
                style={{ ...panelButtonStyle(toolMode === "cross"), background: toolMode === "cross" ? "#0f67c7" : isCrossHovered ? "#f0f0f0" : "#ffffff" }}
              >
                C
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ fontSize: "clamp(1.1rem, 3.6vw, 1.375rem)", color: "#111111" }}>Hints</strong>
            <span style={{ color: "#5b6473", fontSize: "clamp(0.9rem, 2.8vw, 1rem)" }}>
              {hintCap === null ? "Unlimited hints" : `${hintsRemaining}/${hintCap}`}
            </span>
            <button
              type="button"
              onClick={applyHint}
              disabled={didWin || hintsRemaining === 0}
              onMouseEnter={() => setIsUseHovered("use")}
              onMouseLeave={() => setIsUseHovered(null)}
              style={{
                ...panelButtonStyle(false),
                background: isUseHovered ? "#ececec" : "#ffffff",
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
          Save game
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
