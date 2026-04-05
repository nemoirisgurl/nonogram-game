import { supabase } from "./supabase";

const avatarBucket = "avatar_icons";
const activeSessionStorageKey = "nonogram-active-session";

export function getAvatarStorageKey(userId) {
  return `nonogram-avatar-${userId}`;
}

export function saveAvatarPreference(userId, avatarVariant, avatarImage) {
  window.localStorage.setItem(
    getAvatarStorageKey(userId),
    JSON.stringify({
      avatarVariant,
      avatarImage,
    })
  );
  window.dispatchEvent(new Event("avatar-change"));
}

export function getAvatarObjectPath(userId) {
  return `${userId}/avatar`;
}

export function getAvatarPublicUrl(userId, cacheKey = Date.now()) {
  const { data } = supabase.storage.from(avatarBucket).getPublicUrl(getAvatarObjectPath(userId));
  return data?.publicUrl ? `${data.publicUrl}?t=${cacheKey}` : "";
}

export function getInitials(username) {
  if (!username) {
    return "";
  }

  return username
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function formatDate(value) {
  if (!value) {
    return "No data yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatStatus(value) {
  if (!value) {
    return "No active game";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function loadActiveSession(playerId) {
  if (!playerId) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(activeSessionStorageKey);
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || parsed.playerId !== playerId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function normalizeSession(session) {
  if (!session) {
    return null;
  }

  return {
    ...session,
    hint_count: session.hint_count ?? session.hintCount ?? 0,
    hint_limit: session.hint_limit ?? session.hintLimit ?? null,
    game_status: session.game_status ?? session.gameStatus ?? "",
    started_at: session.started_at ?? session.startedAt ?? null,
    saved_at: session.saved_at ?? session.savedAt ?? null,
  };
}

export function normalizeSizeRow(item) {
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

export function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export function createEmptyClueMatrix(size) {
  const clueDepth = Math.max(1, Math.ceil(size / 2));
  return Array.from({ length: size }, () => Array.from({ length: clueDepth }, () => ""));
}

export function sanitizeClueInput(value, size) {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (digitsOnly === "") return "";
  return String(Math.min(size, Number(digitsOnly)));
}

export function parseClueMatrix(matrix, size) {
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

export function matchesConstraint(pattern, constraintRow) {
  return pattern.every((cell, index) => {
    const constraint = constraintRow[index] ?? 0;
    if (constraint === 1) return cell === 1;
    if (constraint === -1) return cell === 0;
    return true;
  });
}

export function isColumnPrefixConsistent(prefix, clue, remainingCells) {
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

export function hasConstraints(grid) {
  return grid.some((row) => row.some((cell) => cell !== 0));
}
