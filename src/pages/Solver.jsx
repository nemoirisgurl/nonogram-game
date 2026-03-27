import { useEffect, useMemo, useState } from "react";
import { getAllRowPatterns } from "../lib/nonogramEngine";
import '../App.css'

const SIZE_OPTIONS = [5, 10, 15, 20];
const DEFAULT_5 = ["1", "3", "5", "3", "1"].join("\n");
const EMPTY_HINT = "0";
const CELL_SIZE = 28;

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

function buildDefaultClues(size) {
  if (size === 5) {
    return { rows: DEFAULT_5, cols: DEFAULT_5 };
  }

  return {
    rows: Array.from({ length: size }, () => EMPTY_HINT).join("\n"),
    cols: Array.from({ length: size }, () => EMPTY_HINT).join("\n"),
  };
}

function parseClueLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "0") return [0];

  const values = trimmed.split(/[\s,]+/).filter(Boolean).map(Number);
  if (values.length === 0 || values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error(`Invalid clue line: "${line}"`);
  }

  const filtered = values.filter((value) => value > 0);
  return filtered.length > 0 ? filtered : [0];
}

function parseClues(text, size, label) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length !== size) {
    throw new Error(`${label} must contain exactly ${size} lines.`);
  }

  return lines.map(parseClueLine);
}

function countLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function matchesConstraint(pattern, constraintRow) {
  return pattern.every((cell, index) => {
    const constraint = constraintRow[index] ?? 0;
    if (constraint === 1) return cell === 1;
    if (constraint === -1) return cell === 0;
    return true;
  });
}

function isColumnPrefixConsistent(prefix, clue, remainingCells) {
  if (clue.length === 1 && clue[0] === 0) {
    return !prefix.includes(1);
  }

  const completedRuns = [];
  let currentRun = 0;

  for (const cell of prefix) {
    if (cell === 1) currentRun += 1;
    else if (currentRun > 0) {
      completedRuns.push(currentRun);
      currentRun = 0;
    }
  }

  const inRun = currentRun > 0;
  for (let index = 0; index < completedRuns.length; index += 1) {
    if (index >= clue.length || completedRuns[index] !== clue[index]) return false;
  }

  const runIndex = completedRuns.length;
  if (!inRun) {
    const remainingClues = clue.slice(runIndex);
    const minimumNeeded = remainingClues.length === 0
      ? 0
      : remainingClues.reduce((sum, value) => sum + value, 0) + (remainingClues.length - 1);
    return minimumNeeded <= remainingCells;
  }

  if (runIndex >= clue.length || currentRun > clue[runIndex]) return false;

  const currentGap = clue[runIndex] - currentRun;
  const after = clue.slice(runIndex + 1);
  let minimumNeeded = currentGap;
  if (after.length > 0) {
    minimumNeeded += 1 + after.reduce((sum, value) => sum + value, 0) + (after.length - 1);
  }

  return minimumNeeded <= remainingCells;
}

function solveWithConstraints(rowClues, colClues, constraints, size, limit = 2) {
  const rowPatterns = rowClues.map((clue, rowIndex) => {
    const patterns = getAllRowPatterns(clue, size);
    if (!patterns || patterns.length === 0) return [];
    return patterns.filter((pattern) => matchesConstraint(pattern, constraints[rowIndex]));
  });

  if (rowPatterns.some((patterns) => patterns.length === 0)) {
    return { status: "unsolved", message: "No solution matches the current clues and constraints." };
  }

  const grid = Array.from({ length: size }, () => null);
  let solutionCount = 0;
  let firstSolution = null;

  function backtrack(rowIndex) {
    if (solutionCount >= limit) return;
    if (rowIndex === size) {
      solutionCount += 1;
      if (!firstSolution) firstSolution = grid.map((row) => row.slice());
      return;
    }

    for (const pattern of rowPatterns[rowIndex]) {
      let valid = true;

      for (let colIndex = 0; colIndex < size; colIndex += 1) {
        const prefix = [];
        for (let currentRow = 0; currentRow < rowIndex; currentRow += 1) {
          prefix.push(grid[currentRow][colIndex]);
        }
        prefix.push(pattern[colIndex]);

        if (!isColumnPrefixConsistent(prefix, colClues[colIndex], size - rowIndex - 1)) {
          valid = false;
          break;
        }
      }

      if (!valid) continue;
      grid[rowIndex] = pattern;
      backtrack(rowIndex + 1);
      if (solutionCount >= limit) return;
    }
  }

  backtrack(0);

  if (solutionCount === 0) {
    return { status: "unsolved", message: "No solution matches the current clues and constraints." };
  }
  if (solutionCount > 1) {
    return { status: "multiple", message: "Multiple solutions still fit these clues and constraints." };
  }

  return { status: "solved", message: "Unique solution found.", solution: firstSolution };
}

function BoardView({ size, rowClues, colClues, grid, onCellClick, title }) {
  const maxRowClues = Math.max(...rowClues.map((clue) => clue.length));
  const maxColClues = Math.max(...colClues.map((clue) => clue.length));
  const totalColumns = maxRowClues + size;
  const safeGrid = Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, colIndex) => grid?.[rowIndex]?.[colIndex] ?? 0),
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalColumns}, ${CELL_SIZE}px)`,
          gridAutoRows: `${CELL_SIZE}px`,
          width: "fit-content",
          padding: 12,
          border: "1px solid #d1d5db",
          borderRadius: 16,
          background: "#f8fafc",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        {Array.from({ length: maxColClues }).flatMap((_, gutterRow) =>
          Array.from({ length: totalColumns }, (_, columnIndex) => {
            if (columnIndex < maxRowClues) {
              return (
                <div
                  key={`corner-${gutterRow}-${columnIndex}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE, border: "1px solid #e5e7eb" }}
                />
              );
            }

            const clue = colClues[columnIndex - maxRowClues];
            const startRow = maxColClues - clue.length;
            const value = gutterRow >= startRow ? clue[gutterRow - startRow] : "";

            return (
              <div
                key={`col-${gutterRow}-${columnIndex}`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  border: "1px solid #d1d5db",
                  display: "grid",
                  placeItems: "center",
                  background: "#f1f5f9",
                  fontWeight: 700,
                }}
              >
                {value}
              </div>
            );
          }),
        )}

        {Array.from({ length: size }).flatMap((_, rowIndex) =>
          Array.from({ length: totalColumns }, (_, columnIndex) => {
            if (columnIndex < maxRowClues) {
              const clue = rowClues[rowIndex];
              const startCol = maxRowClues - clue.length;
              const value = columnIndex >= startCol ? clue[columnIndex - startCol] : "";

              return (
                <div
                  key={`row-clue-${rowIndex}-${columnIndex}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    border: "1px solid #d1d5db",
                    display: "grid",
                    placeItems: "center",
                    background: "#f1f5f9",
                    fontWeight: 700,
                  }}
                >
                  {value}
                </div>
              );
            }

            const cell = safeGrid[rowIndex][columnIndex - maxRowClues];
            const isInteractive = typeof onCellClick === "function";

            return (
              <button
                key={`cell-${rowIndex}-${columnIndex}`}
                type="button"
                onClick={() => onCellClick?.(rowIndex, columnIndex - maxRowClues)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  border: "1px solid #94a3b8",
                  background: cell === 1 ? "#111827" : "#ffffff",
                  color: "#111827",
                  padding: 0,
                  cursor: isInteractive ? "pointer" : "default",
                  position: "relative",
                }}
                aria-label={`Row ${rowIndex + 1}, Column ${columnIndex - maxRowClues + 1}`}
              >
                {cell === -1 ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      fontWeight: 700,
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

export default function Solver() {
  const [size, setSize] = useState(5);
  const [rowInput, setRowInput] = useState(DEFAULT_5);
  const [colInput, setColInput] = useState(DEFAULT_5);
  const [constraints, setConstraints] = useState(() => createEmptyGrid(5));
  const [result, setResult] = useState({ status: "idle", message: "Enter clues, add constraints, and solve." });

  useEffect(() => {
    setConstraints((prev) =>
      Array.from({ length: size }, (_, rowIndex) =>
        Array.from({ length: size }, (_, colIndex) => prev?.[rowIndex]?.[colIndex] ?? 0),
      ),
    );
    setResult({ status: "idle", message: "Enter clues, add constraints, and solve." });
  }, [size]);

  const preview = useMemo(
    () => ({
      rowCount: countLines(rowInput),
      colCount: countLines(colInput),
    }),
    [rowInput, colInput],
  );

  const parsedClues = useMemo(() => {
    try {
      return {
        rowClues: parseClues(rowInput, size, "Row clues"),
        colClues: parseClues(colInput, size, "Column clues"),
        error: null,
      };
    } catch (error) {
      return {
        rowClues: Array.from({ length: size }, () => [0]),
        colClues: Array.from({ length: size }, () => [0]),
        error: error instanceof Error ? error.message : "Unable to parse clues.",
      };
    }
  }, [rowInput, colInput, size]);

  const toggleConstraint = (rowIndex, colIndex) => {
    setConstraints((prev) => {
      const next = prev.map((row) => row.slice());
      const current = next[rowIndex][colIndex];
      next[rowIndex][colIndex] = current === 0 ? -1 : 0;
      return next;
    });
  };

  const clearConstraints = () => {
    setConstraints(createEmptyGrid(size));
    setResult((prev) => ({ ...prev, message: "Constraints cleared." }));
  };

  const handleSizeChange = (nextSize) => {
    const defaults = buildDefaultClues(nextSize);
    setSize(nextSize);
    setRowInput(defaults.rows);
    setColInput(defaults.cols);
    setConstraints(createEmptyGrid(nextSize));
    setResult({ status: "idle", message: "Enter clues, add constraints, and solve." });
  };

  const handleSolve = (e) => {
    e.preventDefault();
    if (parsedClues.error) {
      setResult({ status: "invalid", message: parsedClues.error });
      return;
    }

    setResult(
      solveWithConstraints(
        parsedClues.rowClues,
        parsedClues.colClues,
        constraints,
        size,
        2,
      ),
    );
  };

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 25 }}>Nonogram Solver</h1>
        <p style={{ margin: 25 }}>
          Add clues, mark known filled cells or crosses in the board, then solve against those constraints.
        </p>
      </div>

      <form onSubmit={handleSolve} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 6, maxWidth: 180 }}>
          <span style={{ fontWeight: 700 }}>Board size</span>
          <select value={size} onChange={(e) => handleSizeChange(Number(e.target.value))}>
            {SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} x {option}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Row clues</span>
            <textarea
              rows={10}
              value={rowInput}
              onChange={(e) => setRowInput(e.target.value)}
              style={{ fontFamily: "monospace", resize: "vertical" }}
            />
            <span>{preview.rowCount} lines entered</span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Column clues</span>
            <textarea
              rows={10}
              value={colInput}
              onChange={(e) => setColInput(e.target.value)}
              style={{ fontFamily: "monospace", resize: "vertical" }}
            />
            <span>{preview.colCount} lines entered</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit">Solve puzzle</button>
          <button type="button" onClick={clearConstraints}>
            Clear constraints
          </button>
          <span aria-live="polite" style={{ fontWeight: 700 }}>
            {result.message}
          </span>
        </div>
      </form>

      <BoardView
        size={size}
        rowClues={parsedClues.rowClues}
        colClues={parsedClues.colClues}
        grid={constraints}
        onCellClick={toggleConstraint}
        title="Constraints"
      />

      {result.status === "solved" && Array.isArray(result.solution) ? (
        <BoardView
          size={size}
          rowClues={parsedClues.rowClues}
          colClues={parsedClues.colClues}
          grid={result.solution}
          title="Solved board"
        />
      ) : null}
    </section>
  );
}
