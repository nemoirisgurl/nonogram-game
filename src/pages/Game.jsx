import { useCallback, useEffect, useRef } from "react";
import Navbar from "../component/navbar";
import Nonogram from "../component/nonogram";
import { supabase } from "../lib/supabase";

const activeSessionStorageKey = "nonogram-active-session";

const shellStyle = {
  width: "min(1120px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

function saveActiveSessionLocally(snapshot) {
  window.localStorage.setItem(activeSessionStorageKey, JSON.stringify(snapshot));
  window.dispatchEvent(new Event("active-session-change"));
}

export default function Game({ currentUser, gridId, initialPuzzle, resumeSnapshot = null, playerName, size, hintLimit, onAbandon }) {
  const saveTimeoutRef = useRef(null);
  const currentSessionIdRef = useRef(null);
  const latestSnapshotRef = useRef(null);
  const activeGridId = gridId || resumeSnapshot?.gridId || null;

  const persistSession = useCallback(async (snapshot) => {
    if (!currentUser?.id || !activeGridId) {
      return;
    }

    const payload = {
      player_id: currentUser.id,
      grid_id: activeGridId,
      playtime: snapshot.elapsedSeconds,
      hint_count: snapshot.hintCount,
      hint_limit: snapshot.hintLimit ?? 0,
      current_state: snapshot.currentState ?? null,
      game_status: snapshot.gameStatus,
      started_at: snapshot.startedAt,
      saved_at: snapshot.savedAt,
      finished_at: snapshot.gameStatus === "completed" || snapshot.gameStatus === "abandoned" ? snapshot.savedAt : null,
    };

    try {
      if (currentSessionIdRef.current) {
        await supabase.from("play_sessions").update(payload).eq("id", currentSessionIdRef.current);
        return;
      }

      const { data: existingSession } = await supabase
        .from("play_sessions")
        .select("id")
        .eq("player_id", currentUser.id)
        .eq("game_status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession?.id) {
        currentSessionIdRef.current = existingSession.id;
        await supabase.from("play_sessions").update(payload).eq("id", existingSession.id);
        return;
      }

      const { data: createdSession } = await supabase
        .from("play_sessions")
        .insert(payload)
        .select("id")
        .single();

      currentSessionIdRef.current = createdSession?.id || null;
    } catch {
      // Keep local progress even if the summary sync fails.
    }
  }, [activeGridId, currentUser]);

  const handleProgressChange = useCallback((snapshot) => {
    const activeSnapshot = {
      playerId: currentUser?.id || null,
      gridId: activeGridId,
      playerName: snapshot.playerName,
      size: snapshot.size,
      hintCount: snapshot.hintsUsed,
      hintLimit: snapshot.hintLimit ?? 0,
      elapsedSeconds: snapshot.elapsedSeconds,
      startedAt: snapshot.startedAt,
      savedAt: snapshot.savedAt,
      gameStatus: snapshot.gameStatus,
      currentState: {
        grid: snapshot.grid,
        puzzle: snapshot.puzzle,
        toolMode: snapshot.toolMode,
        lockedCells: snapshot.lockedCells,
        hintLimit: snapshot.hintLimit ?? 0,
        hintsUsed: snapshot.hintsUsed,
        elapsedSeconds: snapshot.elapsedSeconds,
        startedAt: snapshot.startedAt,
      },
    };

    latestSnapshotRef.current = activeSnapshot;
    saveActiveSessionLocally(activeSnapshot);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    if (!currentUser?.id || !activeGridId) {
      return;
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void persistSession(activeSnapshot);
    }, 600);
  }, [activeGridId, currentUser?.id, persistSession]);

  const handleAbandon = useCallback(() => {
    const abandonedSnapshot = {
      ...(latestSnapshotRef.current || {
        playerId: currentUser?.id || null,
        playerName,
        size,
        hintCount: 0,
        hintLimit,
        elapsedSeconds: 0,
        startedAt: new Date().toISOString(),
      }),
      savedAt: new Date().toISOString(),
      gameStatus: "abandoned",
    };

    window.localStorage.removeItem(activeSessionStorageKey);
    window.dispatchEvent(new Event("active-session-change"));
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    if (currentUser?.id) {
      void persistSession(abandonedSnapshot);
    }
    onAbandon?.();
  }, [currentUser?.id, hintLimit, onAbandon, persistSession, playerName, size]);

  useEffect(() => {
    if (!currentUser?.id || !activeGridId || resumeSnapshot) {
      return;
    }

    let isMounted = true;

    const cleanupFinishedSessions = async () => {
      try {
        const { data: finishedSessions, error: sessionLookupError } = await supabase
          .from("play_sessions")
          .select("id, grid_id")
          .eq("player_id", currentUser.id)
          .in("game_status", ["completed", "abandoned"])
          .neq("grid_id", activeGridId);

        if (!isMounted || sessionLookupError || !Array.isArray(finishedSessions) || !finishedSessions.length) {
          return;
        }

        const sessionIds = finishedSessions.map((session) => session.id).filter(Boolean);
        const gridIds = [...new Set(finishedSessions.map((session) => session.grid_id).filter(Boolean))];

        if (sessionIds.length) {
          const { error: deleteSessionError } = await supabase.from("play_sessions").delete().in("id", sessionIds);

          if (deleteSessionError || !gridIds.length) {
            return;
          }
        }

        await supabase.from("grids").delete().in("id", gridIds);
      } catch {
        // Ignore cleanup failures so new games can still start.
      }
    };

    void cleanupFinishedSessions();

    return () => {
      isMounted = false;
    };
  }, [activeGridId, currentUser?.id, resumeSnapshot]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return (
    <section style={shellStyle}>
      <Navbar />
      <div style={{ padding: "clamp(18px, 4vw, 30px) clamp(12px, 4vw, 36px) clamp(20px, 5vw, 36px)" }}>
        <Nonogram
          size={size}
          initialPuzzle={initialPuzzle}
          initialState={resumeSnapshot?.currentState || null}
          playerName={playerName}
          hintLimit={hintLimit}
          onAbandon={handleAbandon}
          onProgressChange={handleProgressChange}
        />
      </div>
    </section>
  );
}
