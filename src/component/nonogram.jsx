import { useState, useEffect, useRef, useMemo } from "react";
import { checkWin, generatePuzzle } from "../lib/nonogramEngine";

let GRID_SIZE = 30; // Pixel size of each square cell
const LINE_PADDING = 8; // Margin for the 'X' mark in crossed-out cells

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export default function Nonogram() {
  const canvasRef = useRef(null);
  const dragActionRef = useRef(null);
  const lastDraggedCellRef = useRef(null);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(5, 100));
  const [grid, setGrid] = useState(() => createEmptyGrid(5));
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [didWin, setDidWin] = useState(false);
  const MAX_W = viewportSize.w * 0.8;
  const MAX_H = viewportSize.h * 0.7;
  const maxRowClues = Math.max(...puzzle.rowClues.map((c) => c.length));
  const maxColClues = Math.max(...puzzle.colClues.map((c) => c.length));
  const GRID_SIZE = useMemo(() => {
    const totalHorizontalCells = puzzle.size + maxRowClues;
    const totalVerticalCells = puzzle.size + maxColClues;
    const sizeByWidth = Math.floor(MAX_W / totalHorizontalCells);
    const sizeByHeight = Math.floor(MAX_H / totalVerticalCells);
    return Math.max(20, Math.min(50, sizeByWidth, sizeByHeight));
}, [puzzle.size, maxRowClues, maxColClues, viewportSize]);
  const leftGutterPx = maxRowClues * GRID_SIZE;
  const topGutterPx = maxColClues * GRID_SIZE;
  const canvasWidth = leftGutterPx + puzzle.size * GRID_SIZE;
  const canvasHeight = topGutterPx + puzzle.size * GRID_SIZE;


  const newGame = (size) => {
    const next = generatePuzzle(size, 100);
    setPuzzle(next);
    setGrid(createEmptyGrid(size));
    setDidWin(false);
    dragActionRef.current = null;
    lastDraggedCellRef.current = null;
    return size;
  };

  const getCellFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < leftGutterPx || y < topGutterPx) return null;
    const gridX = x - leftGutterPx;
    const gridY = y - topGutterPx;

    const row = Math.floor(gridY / GRID_SIZE);
    const col = Math.floor(gridX / GRID_SIZE);
    if (row < 0 || col < 0 || row >= puzzle.size || col >= puzzle.size) return null;

    return { row, col };
  };

  const updateCell = (row, col, nextValue) => {
    setGrid((prevGrid) => {
      if (prevGrid[row][col] === nextValue) return prevGrid;

      const newGrid = [...prevGrid];
      const newRow = [...newGrid[row]];
      newRow[col] = nextValue;
      newGrid[row] = newRow;
      return newGrid;
    });
  };

  const beginDrag = (e) => {
    const isRightClick = e.button === 2;
    if (isRightClick) e.preventDefault();

    const cell = getCellFromEvent(e);
    if (!cell) {
      dragActionRef.current = null;
      lastDraggedCellRef.current = null;
      return;
    }

    const current = grid[cell.row][cell.col];
    const nextValue = isRightClick
      ? current === -1 ? 0 : -1
      : current === 1 ? 0 : 1;

    dragActionRef.current = nextValue;
    lastDraggedCellRef.current = `${cell.row}:${cell.col}`;
    updateCell(cell.row, cell.col, nextValue);
  };

  const handleDrag = (e) => {
    if (dragActionRef.current === null) return;

    const cell = getCellFromEvent(e);
    if (!cell) return;

    const key = `${cell.row}:${cell.col}`;
    if (lastDraggedCellRef.current === key) return;

    lastDraggedCellRef.current = key;
    updateCell(cell.row, cell.col, dragActionRef.current);
  };

  const endDrag = () => {
    dragActionRef.current = null;
    lastDraggedCellRef.current = null;
  };

    /**
     * Effect: Re-renders the Canvas whenever the grid state changes.
     * Handles drawing squares, grid lines, and the "X" marks.
     */
  useEffect(() => {
    setDidWin(checkWin(grid, puzzle.solution));
  }, [grid, puzzle.solution]);

  useEffect(() => {
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

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
        onMouseDown={beginDrag}
        onMouseMove={handleDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Nonogram Grid"
      />
    </div>
  );
}
