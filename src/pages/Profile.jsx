import { useEffect, useState } from "react";
import Navbar from "../component/navbar";
import AvatarIcon from "../component/avataricon";
import { supabase } from "../lib/supabase";

const shellStyle = {
  width: "min(920px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
};

const buttonStyle = {
  border: "none",
  borderRadius: 999,
  background: "#ffca2c",
  color: "#111111",
  fontWeight: 800,
  fontSize: "clamp(1rem, 2.6vw, 1.15rem)",
  padding: "12px 26px",
  minWidth: 178,
  cursor: "pointer",
  boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
  transition: "background-color 0.2s ease, transform 0.2s ease",
};

const labelStyle = {
  margin: 0,
  color: "#111111",
  fontSize: "clamp(1rem, 2.8vw, 1.08rem)",
  lineHeight: 1.5,
};

const avatarOptions = ["amber", "mint", "sky", "coral"];
const avatarBucket = "avatar_icons";

function getAvatarStorageKey(userId) {
  return `nonogram-avatar-${userId}`;
}

function saveAvatarPreference(userId, avatarVariant, avatarImage) {
  window.localStorage.setItem(
    getAvatarStorageKey(userId),
    JSON.stringify({
      avatarVariant,
      avatarImage,
    })
  );
  window.dispatchEvent(new Event("avatar-change"));
}

function getAvatarObjectPath(userId) {
  return `${userId}/avatar`;
}

function getAvatarPublicUrl(userId, cacheKey = Date.now()) {
  const { data } = supabase.storage.from(avatarBucket).getPublicUrl(getAvatarObjectPath(userId));
  return data?.publicUrl ? `${data.publicUrl}?t=${cacheKey}` : "";
}

function getInitials(username) {
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

function formatDate(value) {
  if (!value) {
    return "No data yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function GridPreview() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" style={{ width: "100%", height: "100%" }}>
      <rect x="18" y="18" width="58" height="58" fill="#ffffff" stroke="#111111" strokeWidth="2.5" />
      <line x1="30" y1="18" x2="30" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="38" y1="18" x2="38" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="46" y1="18" x2="46" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="54" y1="18" x2="54" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="62" y1="18" x2="62" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="70" y1="18" x2="70" y2="76" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="30" x2="76" y2="30" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="38" x2="76" y2="38" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="46" x2="76" y2="46" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="54" x2="76" y2="54" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="62" x2="76" y2="62" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="70" x2="76" y2="70" stroke="#111111" strokeWidth="1.2" />
      <line x1="18" y1="18" x2="76" y2="18" stroke="#111111" strokeWidth="2.5" />
      <line x1="18" y1="18" x2="18" y2="76" stroke="#111111" strokeWidth="2.5" />
      <path d="M8 20h10M8 28h10M24 8v10M32 8v10" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
      <text x="22" y="33" fontSize="10" fontWeight="700" fill="#111111">
        2
      </text>
    </svg>
  );
}

export default function Profile({ currentUser, onLogout, onProfileUpdate }) {
  const [hoveredAction, setHoveredAction] = useState(null);
  const [avatarVariant, setAvatarVariant] = useState(currentUser?.avatarVariant || "amber");
  const [avatarImage, setAvatarImage] = useState(currentUser?.avatarImage || "");
  const [savedAvatarVariant, setSavedAvatarVariant] = useState(currentUser?.avatarVariant || "amber");
  const [savedAvatarImage, setSavedAvatarImage] = useState(currentUser?.avatarImage || "");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [latestSession, setLatestSession] = useState(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setAvatarVariant(currentUser?.avatarVariant || "amber");
    setAvatarImage(currentUser?.avatarImage || "");
    setSavedAvatarVariant(currentUser?.avatarVariant || "amber");
    setSavedAvatarImage(currentUser?.avatarImage || "");
    setSelectedAvatarFile(null);
  }, [currentUser?.avatarVariant, currentUser?.avatarImage]);

  useEffect(() => {
    let isMounted = true;

    const loadLatestSession = async () => {
      const { data, error } = await supabase
        .from("play_sessions")
        .select("started_at, saved_at, hint_count, hint_limit, game_status, grids(created_at, sizes(rows, columns))")
        .eq("player_id", currentUser.id)
        .order("saved_at", { ascending: false, nullsFirst: false })
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      setLatestSession(data);
    };

    loadLatestSession();

    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  const handleAvatarChange = async (nextVariant) => {
    if (nextVariant === avatarVariant) {
      return;
    }

    setAvatarVariant(nextVariant);
    setStatusMessage("Avatar selection changed. Save to apply it.");
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please choose an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const nextImage = typeof reader.result === "string" ? reader.result : "";

      setSelectedAvatarFile(file);
      setAvatarImage(nextImage);
      setStatusMessage("Custom avatar selected. Save to apply it.");
    };

    reader.readAsDataURL(file);
  };

  const handleResetAvatarImage = () => {
    setSelectedAvatarFile(null);
    setAvatarImage("");
    setStatusMessage("Returned to icon avatar. Save to apply it.");
  };

  const handleSaveAvatar = async () => {
    setIsSavingAvatar(true);

    try {
      let nextAvatarImage = savedAvatarImage;

      if (selectedAvatarFile) {
        const { error: uploadError } = await supabase.storage.from(avatarBucket).upload(getAvatarObjectPath(currentUser.id), selectedAvatarFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: selectedAvatarFile.type,
        });

        if (uploadError) {
          throw uploadError;
        }

        nextAvatarImage = getAvatarPublicUrl(currentUser.id);
      } else if (!avatarImage && savedAvatarImage) {
        const { error: deleteError } = await supabase.storage.from(avatarBucket).remove([getAvatarObjectPath(currentUser.id)]);

        if (deleteError) {
          throw deleteError;
        }

        nextAvatarImage = "";
      } else if (!avatarImage) {
        nextAvatarImage = "";
      }

      saveAvatarPreference(currentUser.id, avatarVariant, nextAvatarImage);
      setSavedAvatarVariant(avatarVariant);
      setSavedAvatarImage(nextAvatarImage);
      setSelectedAvatarFile(null);
      setAvatarImage(nextAvatarImage);
      onProfileUpdate({
        ...currentUser,
        avatarVariant,
        avatarImage: nextAvatarImage,
      });
      setStatusMessage("Profile icon saved.");
    } catch (error) {
      setStatusMessage(error?.message || "Unable to save profile icon right now.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleLogoutClick = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await onLogout();
    } catch (error) {
      setStatusMessage(error?.message || "Unable to logout right now.");
      setIsLoggingOut(false);
    }
  };

  const latestGrid = latestSession?.grids;
  const latestSize = Array.isArray(latestGrid?.sizes) ? latestGrid.sizes[0] : latestGrid?.sizes;
  const hintsLeft =
    latestSession && latestSession.hint_limit !== null && latestSession.hint_limit !== undefined
      ? Math.max(latestSession.hint_limit - latestSession.hint_count, 0)
      : "No limit";
  const hasUnsavedAvatarChanges = avatarVariant !== savedAvatarVariant || avatarImage !== savedAvatarImage;

  return (
    <section style={shellStyle}>
      <Navbar />

      <div style={{ padding: "clamp(26px, 6vw, 42px) clamp(18px, 5vw, 56px) clamp(34px, 7vw, 50px)" }}>
        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(18px, 5vw, 52px)",
            flexWrap: "wrap",
            marginBottom: "clamp(24px, 5vw, 34px)",
          }}
        >
          <div style={{ width: "clamp(96px, 22vw, 126px)", aspectRatio: "1 / 1", flexShrink: 0 }}>
            <AvatarIcon variant={avatarVariant} initials={getInitials(currentUser.username)} imageSrc={avatarImage} />
          </div>

          <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.5rem, 4vw, 2.1rem)",
                lineHeight: 1.2,
                color: "#111111",
                textAlign: "center",
              }}
            >
              <span style={{ fontWeight: 800 }}>Welcome back!</span>{" "}
              <span style={{ fontWeight: 400 }}>{currentUser.username}</span>
            </h1>
            <p style={{ margin: 0, color: "#45556c", fontSize: "clamp(0.96rem, 2.6vw, 1.02rem)" }}>{currentUser.email || "No email found"}</p>
          </div>
        </section>

        <section>
          <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(1.2rem, 3.4vw, 1.6rem)", color: "#111111" }}>Choose your avatar</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {avatarOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAvatarChange(option)}
                  disabled={isSavingAvatar}
                  style={{
                    width: 72,
                    aspectRatio: "1 / 1",
                    borderRadius: 18,
                    border: option === avatarVariant ? "2px solid #111111" : "1px solid rgba(15, 23, 42, 0.12)",
                    background: "#ffffff",
                    padding: 10,
                    cursor: "pointer",
                  }}
                >
                  <AvatarIcon variant={option} initials={getInitials(currentUser.username)} />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label
                style={{
                  ...buttonStyle,
                  minWidth: 180,
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#3b82f6",
                  color: "#ffffff",
                }}
              >
                Browse Avatar
                <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: "none" }} />
              </label>
              <button
                type="button"
                onClick={handleResetAvatarImage}
                style={{ ...buttonStyle, minWidth: 180, background: "#e5e7eb", color: "#111111" }}
              >
                Use Default Icon
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={!hasUnsavedAvatarChanges || isSavingAvatar}
                style={{
                  ...buttonStyle,
                  minWidth: 200,
                  background: hasUnsavedAvatarChanges ? "#111111" : "#9ca3af",
                  color: "#ffffff",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                  cursor: hasUnsavedAvatarChanges ? "pointer" : "not-allowed",
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, fill: "currentColor" }}>
                  <path d="M5 3h11l3 3v15H5zm2 2v4h8V5zm0 8v6h10v-6zm2 1h6v4H9z" />
                </svg>
                {isSavingAvatar ? "Saving..." : "Save Profile Icon"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {statusMessage ? <p style={{ margin: 0, color: "#45556c" }}>{statusMessage}</p> : null}
              <button
                type="button"
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                style={{
                  ...buttonStyle,
                  minWidth: 160,
                  background: "#111111",
                  color: "#ffffff",
                  opacity: isLoggingOut ? 0.72 : 1,
                  cursor: isLoggingOut ? "not-allowed" : "pointer",
                }}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>

          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(1.4rem, 3.7vw, 2rem)",
              color: "#111111",
            }}
          >
            Your progress
          </h2>

          <article
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(18px, 4vw, 34px)",
              flexWrap: "wrap",
              borderRadius: "clamp(18px, 3vw, 22px)",
              padding: "clamp(18px, 4vw, 28px)",
              background: "linear-gradient(90deg, #d3f7c8 0%, #c8f8c5 48%, #ccf7d2 100%)",
            }}
          >
            <div style={{ width: "clamp(84px, 14vw, 108px)", aspectRatio: "1 / 1", flexShrink: 0 }}>
              <GridPreview />
            </div>

            <div
              style={{
                flex: "1 1 280px",
                display: "grid",
                gap: 10,
                minWidth: "min(100%, 240px)",
              }}
            >
              <p style={labelStyle}>
                <strong>Created at:</strong> {formatDate(latestGrid?.created_at)}
              </p>
              <p style={labelStyle}>
                <strong>Size:</strong> {latestSize ? `${latestSize.rows} × ${latestSize.columns}` : "No puzzle yet"}
              </p>
              <p style={labelStyle}>
                <strong>Hints left:</strong> {hintsLeft}
              </p>
            </div>

            <div
              style={{
                flex: "1 1 220px",
                display: "grid",
                justifyItems: "start",
                alignContent: "center",
                gap: 22,
              }}
            >
              <p style={labelStyle}>
                <strong>Last saved:</strong> {formatDate(latestSession?.saved_at || latestSession?.started_at)}
              </p>
              <p style={labelStyle}>
                <strong>Status:</strong> {latestSession?.game_status || "No active game"}
              </p>
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  background: hoveredAction === "continue" ? "#e3b11f" : "#ffca2c",
                  transform: hoveredAction === "continue" ? "translateY(-1px)" : "translateY(0)",
                }}
                onMouseEnter={() => setHoveredAction("continue")}
                onMouseLeave={() => setHoveredAction(null)}
              >
                {latestSession ? "Continue" : "No Save Yet"}
              </button>
            </div>
          </article>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "clamp(12px, 3vw, 20px)",
              flexWrap: "wrap",
              marginTop: "clamp(20px, 5vw, 28px)",
            }}
          >
            <p style={{ margin: 0, color: "#111111", fontSize: "clamp(1rem, 2.8vw, 1.1rem)" }}>
              Wanna play new puzzle?
            </p>
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  background: hoveredAction === "new" ? "#e3b11f" : "#ffca2c",
                  transform: hoveredAction === "new" ? "translateY(-1px)" : "translateY(0)",
                }}
                onClick={() => {
                  window.location.hash = "#/play";
                }}
              onMouseEnter={() => setHoveredAction("new")}
              onMouseLeave={() => setHoveredAction(null)}
            >
              New Puzzle
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
