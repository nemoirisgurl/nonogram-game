import { useEffect, useState } from "react";
import Navbar from "../component/navbar";
import Nonogram from "../component/nonogram";
import { getAllRowPatterns, solveNonogram } from "../lib/nonogramEngine";
import { supabase } from "../lib/supabase";
import {
  createEmptyGrid,
  createEmptyClueMatrix,
  sanitizeClueInput,
  parseClueMatrix,
  matchesConstraint,
  isColumnPrefixConsistent,
  hasConstraints,
  normalizeSizeRow,
} from "../lib/utils";

const fallbackSizeOptions = [5, 10, 15, 20];

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
  const [sizeOptions, setSizeOptions] = useState(
    fallbackSizeOptions.map((option) => ({
      key: option,
      id: null,
      value: option,
      label: `${option} x ${option}`,
    })),
  );
  const [grid, setGrid] = useState(() => createEmptyGrid(10));
  const [rowClues, setRowClues] = useState(() => createEmptyClueMatrix(10));
  const [colClues, setColClues] = useState(() => createEmptyClueMatrix(10));
  const [message, setMessage] = useState("");

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
              {sizeOptions.map((option) => (
                <option key={option.key} value={option.value}>
                  {option.label}
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
