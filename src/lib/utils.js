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
