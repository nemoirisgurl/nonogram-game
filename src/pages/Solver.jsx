import { useState } from "react";
import Navbar from "../component/navbar";
import Nonogram from "../component/nonogram";
import { getAllRowPatterns, solveNonogram } from "../lib/nonogramEngine";

const SIZE_OPTIONS = [5, 10, 15, 20];

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

function createEmptyClueMatrix(size) {
  const clueDepth = Math.max(1, Math.ceil(size / 2));
  return Array.from({ length: size }, () => Array.from({ length: clueDepth }, () => ""));
}

function sanitizeClueInput(value, size) {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (digitsOnly === "") return "";
  return String(Math.min(size, Number(digitsOnly)));
}

function parseClueMatrix(matrix, size) {
  return matrix.map((line, lineIndex) => {
    const rawValues = line
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Number(value));

    if (rawValues.length === 0) {
      return [0];
    }

    if (rawValues.some((value) => !Number.isInteger(value) || value < 0 || value > size)) {
      throw new Error(`Clues on line ${lineIndex + 1} must be numbers from 0 to ${size}.`);
    }

    if (rawValues.some((value) => value === 0)) {
      if (rawValues.length !== 1 || rawValues[0] !== 0) {
        throw new Error(`Line ${lineIndex + 1} can only use 0 by itself.`);
      }
      return [0];
    }

    return rawValues;
  });
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
  let exceededPatternBudget = false;
  const rowPatterns = rowClues.map((clue, rowIndex) => {
    const patterns = getAllRowPatterns(clue, size);
    if (patterns === null) {
      exceededPatternBudget = true;
      return [];
    }
    if (!patterns || patterns.length === 0) return [];
    return patterns.filter((pattern) => matchesConstraint(pattern, constraints[rowIndex]));
  });

  if (exceededPatternBudget) {
    return { status: "multiple" };
  }

  if (rowPatterns.some((patterns) => patterns.length === 0)) {
    return { status: "unsolved" };
  }

  const workingGrid = Array.from({ length: size }, () => null);
  let solutionCount = 0;
  let firstSolution = null;

  function backtrack(rowIndex) {
    if (solutionCount >= limit) return;
    if (rowIndex === size) {
      solutionCount += 1;
      if (!firstSolution) firstSolution = workingGrid.map((row) => row.slice());
      return;
    }

    for (const pattern of rowPatterns[rowIndex]) {
      let valid = true;

      for (let colIndex = 0; colIndex < size; colIndex += 1) {
        const prefix = [];
        for (let currentRow = 0; currentRow < rowIndex; currentRow += 1) {
          prefix.push(workingGrid[currentRow][colIndex]);
        }
        prefix.push(pattern[colIndex]);

        if (!isColumnPrefixConsistent(prefix, colClues[colIndex], size - rowIndex - 1)) {
          valid = false;
          break;
        }
      }

      if (!valid) continue;
      workingGrid[rowIndex] = pattern;
      backtrack(rowIndex + 1);
      if (solutionCount >= limit) return;
    }
  }

  backtrack(0);

  if (solutionCount === 0) return { status: "unsolved" };
  if (solutionCount > 1) return { status: "multiple" };

  return { status: "solved", solution: firstSolution };
}

function hasConstraints(grid) {
  return grid.some((row) => row.some((cell) => cell !== 0));
}

const shellStyle = {
  width: "min(1120px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

export default function Solver() {
  const [size, setSize] = useState(10);
  const [grid, setGrid] = useState(() => createEmptyGrid(10));
  const [rowClues, setRowClues] = useState(() => createEmptyClueMatrix(10));
  const [colClues, setColClues] = useState(() => createEmptyClueMatrix(10));
  const [message, setMessage] = useState("");

  const resetBoard = (nextSize) => {
    setGrid(createEmptyGrid(nextSize));
    setRowClues(createEmptyClueMatrix(nextSize));
    setColClues(createEmptyClueMatrix(nextSize));
    setMessage("");
  };

  const handleSizeChange = (nextSize) => {
    setSize(nextSize);
    resetBoard(nextSize);
  };

  const updateRowClue = (rowIndex, clueIndex, value) => {
    setRowClues((current) => {
      const next = current.map((row) => row.slice());
      next[rowIndex][clueIndex] = sanitizeClueInput(value, size);
      return next;
    });
  };

  const updateColClue = (colIndex, clueIndex, value) => {
    setColClues((current) => {
      const next = current.map((col) => col.slice());
      next[colIndex][clueIndex] = sanitizeClueInput(value, size);
      return next;
    });
  };

  const toggleCell = (rowIndex, colIndex) => {
    setGrid((current) => {
      const next = current.map((row) => row.slice());
      const cell = next[rowIndex][colIndex];
      next[rowIndex][colIndex] = cell === -1 ? 0 : -1;
      return next;
    });
    setMessage("");
  };

  const handleSolve = () => {
    try {
      const parsedRowClues = parseClueMatrix(rowClues, size);
      const parsedColClues = parseClueMatrix(colClues, size);
      const result = hasConstraints(grid)
        ? solveWithConstraints(parsedRowClues, parsedColClues, grid, size, 2)
        : solveNonogram(parsedRowClues, parsedColClues, size, 2);

      if (result.status === "solved" && Array.isArray(result.solution)) {
        setGrid(result.solution.map((row) => row.map((cell) => (cell === 1 ? 1 : 0))));
        setMessage("Solved.");
        return;
      }

      if (result.status === "multiple") {
        setMessage("Not unique solution.");
        return;
      }

      setMessage("No solution.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid clues.");
    }
  };

  const handleClear = () => {
    resetBoard(size);
  };

  return (
    <section style={shellStyle}>
      <Navbar />
      <div
        style={{
          padding: "clamp(18px, 4vw, 30px) clamp(12px, 4vw, 36px) clamp(20px, 5vw, 36px)",
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
            <Nonogram
              mode="solver"
              size={size}
              grid={grid}
              rowClues={rowClues}
              colClues={colClues}
              onCellToggle={toggleCell}
              onRowClueChange={updateRowClue}
              onColClueChange={updateColClue}
            />
          </div>
          <p style={{ fontSize: "clamp(0.8rem, 2.6vw, 0.875rem)", color: "#5b6473", textAlign: "center" }}>
            Click cells to toggle crosses. pressing Solve will replace the board with the solved grid.
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
          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ fontSize: "clamp(1.1rem, 3.6vw, 1.375rem)", color: "#111111" }}>Nonogram Solver</strong>
            <span style={{ color: "#5b6473", fontSize: "clamp(0.95rem, 3vw, 1.125rem)" }}>
              Enter clues and mark confirmed empty cells before solving.
            </span>
          </div>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 800, color: "#111111", fontSize: "clamp(1.1rem, 3.6vw, 1.375rem)" }}>Puzzle Size</span>
            <select
              value={size}
              onChange={(event) => handleSizeChange(Number(event.target.value))}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "10px 22px",
                background: "#ffffff",
                color: "#111111",
                fontWeight: 800,
                fontSize: 16,
                boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              {SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} x {option}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gap: 10 }}>
            <button
              type="button"
              onClick={handleSolve}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 18,
                padding: "14px 16px",
                background: "#ffca2c",
                color: "#111111",
                fontWeight: 800,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              Solve
            </button>

            <button
              type="button"
              onClick={handleClear}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 18,
                padding: "14px 16px",
                background: "#ffca2c",
                color: "#111111",
                fontWeight: 800,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              Clear
            </button>
          </div>

          <div
            aria-live="polite"
            style={{
              minHeight: 24,
              fontWeight: 700,
              color: message === "Solved." ? "#166534" : "#111111",
            }}
          >
            {message}
          </div>
        </aside>
      </div>
    </section>
  );
}
