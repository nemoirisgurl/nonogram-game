import { combination } from "./combination";

const UNIQUE_SOLVE_MAX_SIZE = 10;
const MAX_ROW_PATTERNS = 5000;

function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

function sum(nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}

function nChooseK(n, k) {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= kk; i += 1) {
    result = (result * (n - kk + i)) / i;
    if (result > MAX_ROW_PATTERNS) return MAX_ROW_PATTERNS + 1;
  }
  return result;
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

export function getAllRowPatterns(clues, length) {
  if (clues.length === 1 && clues[0] === 0) return [Array.from({ length }, () => 0)];

  const minUsed = sum(clues) + (clues.length - 1);
  const slack = length - minUsed;
  if (slack < 0) return [];

  const gaps = clues.length + 1;
  const barsToPick = gaps - 1;
  const totalSlots = slack + gaps - 1; // stars+bars positions

  // Guardrail: patterns grow combinatorially; avoid freezing the UI/solver.
  const estimatedCount = barsToPick === 0 ? 1 : nChooseK(totalSlots, barsToPick);
  if (estimatedCount > MAX_ROW_PATTERNS) return null;

  const patterns = [];
  for (const bars of barsToPick === 0
    ? [[]]
    : combination(range(totalSlots), barsToPick, MAX_ROW_PATTERNS + 1)) {
    patterns.push(barsToRowPattern(bars, clues, totalSlots));
    if (patterns.length > MAX_ROW_PATTERNS) return null;
  }
  return patterns;
}

function barsToRowPattern(bars, clues, totalSlots) {
  const parts = [];
  let prev = -1;
  for (const b of bars) {
    parts.push(b - prev - 1);
    prev = b;
  }
  parts.push(totalSlots - prev - 1);

  const out = [];
  out.push(...Array.from({ length: parts[0] }, () => 0));

  for (let i = 0; i < clues.length; i += 1) {
    out.push(...Array.from({ length: clues[i] }, () => 1));
    if (i < clues.length - 1) {
      const between = 1 + parts[i + 1];
      out.push(...Array.from({ length: between }, () => 0));
    }
  }

  out.push(...Array.from({ length: parts[parts.length - 1] }, () => 0));
  return out;
}

function getRowPatternIterable(clues, length) {
  if (clues.length === 1 && clues[0] === 0) {
    return { tooMany: false, iterable: [Array.from({ length }, () => 0)] };
  }

  const minUsed = sum(clues) + (clues.length - 1);
  const slack = length - minUsed;
  if (slack < 0) return { tooMany: false, iterable: [] };

  const gaps = clues.length + 1;
  const barsToPick = gaps - 1;
  const totalSlots = slack + gaps - 1;

  const estimatedCount = barsToPick === 0 ? 1 : nChooseK(totalSlots, barsToPick);
  if (estimatedCount > MAX_ROW_PATTERNS) return { tooMany: true, iterable: [] };

  if (barsToPick === 0) {
    return { tooMany: false, iterable: [barsToRowPattern([], clues, totalSlots)] };
  }

  function* iter() {
    let produced = 0;
    for (const bars of combination(range(totalSlots), barsToPick, MAX_ROW_PATTERNS + 1)) {
      produced += 1;
      if (produced > MAX_ROW_PATTERNS) return;
      yield barsToRowPattern(bars, clues, totalSlots);
    }
  }

  return { tooMany: false, iterable: { [Symbol.iterator]: iter } };
}

function isColumnPrefixConsistent(prefix, clue, remainingCells) {
  if (clue.length === 1 && clue[0] === 0) return !prefix.includes(1);

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

  for (let i = 0; i < completedRuns.length; i += 1) {
    if (i >= clue.length) return false;
    if (completedRuns[i] !== clue[i]) return false;
  }

  const runIndex = completedRuns.length;
  if (!inRun) {
    const remainingClues = clue.slice(runIndex);
    const minNeeded =
      remainingClues.length === 0 ? 0 : sum(remainingClues) + (remainingClues.length - 1);
    return minNeeded <= remainingCells;
  }

  if (runIndex >= clue.length) return false;
  if (currentRun > clue[runIndex]) return false;

  const needToFinishCurrent = clue[runIndex] - currentRun;
  const after = clue.slice(runIndex + 1);
  let minNeeded = needToFinishCurrent;
  if (after.length > 0) minNeeded += 1 + sum(after) + (after.length - 1);
  return minNeeded <= remainingCells;
}

function solveCount(rowClues, colClues, size, limit = 2) {
  const grid = Array.from({ length: size }, () => null);
  let count = 0;
  let firstSolution = null;

  function backtrack(r) {
    if (count >= limit) return;
    if (r === size) {
      count += 1;
      if (!firstSolution) firstSolution = grid.map((row) => row.slice());
      return;
    }

    const { tooMany, iterable } = getRowPatternIterable(rowClues[r], size);
    if (tooMany) {
      // Too many branches to explore under our limits; treat as "non-unique/unknown".
      count = limit;
      return;
    }
    if (iterable.length === 0) return;

    for (const pattern of iterable) {
      grid[r] = pattern;

      let ok = true;
      for (let c = 0; c < size; c += 1) {
        const prefix = [];
        for (let rr = 0; rr <= r; rr += 1) prefix.push(grid[rr][c]);
        if (!isColumnPrefixConsistent(prefix, colClues[c], size - 1 - r)) {
          ok = false;
          break;
        }
      }

      if (ok) backtrack(r + 1);
      if (count >= limit) return;
    }
  }

  backtrack(0);
  return { count, solution: firstSolution };
}

function generatePuzzleRandom(size) {
  const density = size <= 5 ? 0.45 : 0.4;
  let solution = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() < density ? 1 : 0)),
  );

  const anyFilled = solution.some((row) => row.some((cell) => cell === 1));
  if (!anyFilled) solution = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  if (!anyFilled) solution[Math.floor(size / 2)][Math.floor(size / 2)] = 1;

  const rowClues = solution.map(deriveLineClues);
  const colClues = transpose(solution).map(deriveLineClues);

  return { size, solution, rowClues, colClues };
}

export function generatePuzzle(size, budgetMs = 100) {
  // Uniqueness is expensive for larger boards; keep the UI responsive.
  if (size > UNIQUE_SOLVE_MAX_SIZE) return generatePuzzleRandom(size);

  const start = typeof performance !== "undefined" ? performance.now() : Date.now();

  while (true) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - start > budgetMs) return generatePuzzleRandom(size);

    const candidate = generatePuzzleRandom(size);
    const { count, solution } = solveCount(candidate.rowClues, candidate.colClues, size, 2);
    if (count === 1 && solution) return { ...candidate, solution };
  }
}

export function checkWin(grid, solution) {
  const size = solution.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c] === -1) continue;
      const isFilled = grid[r][c] === 1;
      const shouldBeFilled = solution[r][c] === 1;
      if (isFilled !== shouldBeFilled) return false;
    }
  }
  return true;
}

