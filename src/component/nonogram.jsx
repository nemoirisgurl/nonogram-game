import { useState, useEffect, useRef } from "react";

const GRID_SIZE = 50; // Pixel size of each square cell
const LINE_PADDING = 8; // Margin for the 'X' mark in crossed-out cells

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

function deriveLineClues(line) {
  const runs = [];
  let current = 0;
  for (const cell of line) {
    if (cell === 1) current += 1;
    else if (current > 0) {
      runs.push(current);
      current = 0;
    }
  }
  if (current > 0) runs.push(current);
  return runs.length ? runs : [0];
}

function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const out = Array.from({ length: cols }, () => Array.from({ length: rows }, () => 0));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) out[c][r] = matrix[r][c];
  }
  return out;
}

export function generatePuzzle(size) {
  const density = size <= 5 ? 0.45 : 0.4;
  let solution = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() < density ? 1 : 0)),
  );

  // Avoid the degenerate all-empty puzzle.
  const anyFilled = solution.some((row) => row.some((cell) => cell === 1));
  if (!anyFilled) solution = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  if (!anyFilled) solution[Math.floor(size / 2)][Math.floor(size / 2)] = 1;

  const rowClues = solution.map(deriveLineClues);
  const colClues = transpose(solution).map(deriveLineClues);

  return { size, solution, rowClues, colClues };
}

export function checkWin(grid, solution) {
  const size = solution.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c] === -1) continue; // ignore crossed cells
      const isFilled = grid[r][c] === 1;
      const shouldBeFilled = solution[r][c] === 1;
      if (isFilled !== shouldBeFilled) return false;
    }
  }
  return true;
}

export default function Nonogram() {
  const canvasRef = useRef(null);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(5));
  const [grid, setGrid] = useState(() => createEmptyGrid(5));
  const [didWin, setDidWin] = useState(false);

  const maxRowClues = Math.max(...puzzle.rowClues.map((c) => c.length));
  const maxColClues = Math.max(...puzzle.colClues.map((c) => c.length));
  const leftGutterPx = maxRowClues * GRID_SIZE;
  const topGutterPx = maxColClues * GRID_SIZE;
  const canvasWidth = leftGutterPx + puzzle.size * GRID_SIZE;
  const canvasHeight = topGutterPx + puzzle.size * GRID_SIZE;

  const newGame = (size) => {
    const next = generatePuzzle(size);
    setPuzzle(next);
    setGrid(createEmptyGrid(size));
    setDidWin(false);
  };

    /**
     * Handles cell interaction.
     * Toggles cell state: 0 (Empty) -> 1 (Filled) -> -1 (Crossed)
     */
  const handleClick = (e, isRightClick = false) => {
    if (isRightClick) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Calculate click coordinates relative to the canvas origin
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only the grid (not clue gutters) is interactive.
    if (x < leftGutterPx || y < topGutterPx) return;
    const gridX = x - leftGutterPx;
    const gridY = y - topGutterPx;

    const row = Math.floor(gridY / GRID_SIZE);
    const col = Math.floor(gridX / GRID_SIZE);
    if (row < 0 || col < 0 || row >= puzzle.size || col >= puzzle.size) return;

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const newRow = [...newGrid[row]];

      const current = newRow[col];
      if (isRightClick) newRow[col] = current === -1 ? 0 : -1;
      else newRow[col] = current === 0 ? 1 : 0;

      newGrid[row] = newRow;
      return newGrid;
    });
  };

    /**
     * Effect: Re-renders the Canvas whenever the grid state changes.
     * Handles drawing squares, grid lines, and the "X" marks.
     */
  useEffect(() => {
    setDidWin(checkWin(grid, puzzle.solution));
  }, [grid, puzzle.solution]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clue gutters background
    ctx.fillStyle = "#f6f6f6";
    ctx.fillRect(0, 0, canvas.width, topGutterPx);
    ctx.fillRect(0, 0, leftGutterPx, canvas.height);

    // Draw clues
    ctx.fillStyle = "black";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Column clues (top gutter)
    for (let c = 0; c < puzzle.size; c += 1) {
      const clues = puzzle.colClues[c];
      const startRow = maxColClues - clues.length;
      for (let i = 0; i < clues.length; i += 1) {
        const gutterRow = startRow + i;
        const cx = leftGutterPx + c * GRID_SIZE + GRID_SIZE / 2;
        const cy = gutterRow * GRID_SIZE + GRID_SIZE / 2;
        ctx.fillText(String(clues[i]), cx, cy);
      }
    }

    // Row clues (left gutter)
    for (let r = 0; r < puzzle.size; r += 1) {
      const clues = puzzle.rowClues[r];
      const startCol = maxRowClues - clues.length;
      for (let i = 0; i < clues.length; i += 1) {
        const gutterCol = startCol + i;
        const cx = gutterCol * GRID_SIZE + GRID_SIZE / 2;
        const cy = topGutterPx + r * GRID_SIZE + GRID_SIZE / 2;
        ctx.fillText(String(clues[i]), cx, cy);
      }
    }

    // Gutter grid lines
    ctx.strokeStyle = "#d0d0d0";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasWidth; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, topGutterPx);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(leftGutterPx, y);
      ctx.stroke();
    }

    // Draw playable grid
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = leftGutterPx + c * GRID_SIZE;
        const y = topGutterPx + r * GRID_SIZE;

        ctx.fillStyle = cell === 1 ? "black" : "white";
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

        if (cell === -1) {
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + LINE_PADDING, y + LINE_PADDING);
          ctx.lineTo(x + GRID_SIZE - LINE_PADDING, y + GRID_SIZE - LINE_PADDING);
          ctx.moveTo(x + GRID_SIZE - LINE_PADDING, y + LINE_PADDING);
          ctx.lineTo(x + LINE_PADDING, y + GRID_SIZE - LINE_PADDING);
          ctx.stroke();
        }

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
      });
    });

    // Separator lines between gutters and grid
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftGutterPx, 0);
    ctx.lineTo(leftGutterPx, canvasHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, topGutterPx);
    ctx.lineTo(canvasWidth, topGutterPx);
    ctx.stroke();
  }, [
    grid,
    puzzle.colClues,
    puzzle.rowClues,
    puzzle.size,
    canvasHeight,
    canvasWidth,
    leftGutterPx,
    topGutterPx,
    maxColClues,
    maxRowClues,
  ]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => newGame(5)}>
          New Game 5x5
        </button>
        <button type="button" onClick={() => newGame(10)}>
          New Game 10x10
        </button>
        <button type="button" onClick={() => newGame(15)}>
          New Game 15x15
        </button>
        <button type="button" onClick={() => newGame(20)}>
          New Game 20x20
        </button>
        <span aria-live="polite" style={{ fontWeight: 700 }}>
          {didWin ? "You win!" : ""}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={(e) => handleClick(e, false)} // Left click for fill
        onContextMenu={(e) => handleClick(e, true)} // Right click for cross
        aria-label="Nonogram Grid"
      />
    </div>
  );
}