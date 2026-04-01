import { useEffect, useState } from "react";
import logo from "/logo.png";
import AvatarIcon from "./avataricon";

const topBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "clamp(12px, 2.5vw, 14px) clamp(14px, 3vw, 18px)",
  background: "#f5f5f5",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
  minWidth: 0,
  flex: "1 1 240px",
};

const linkStyle = {
  color: "#111111",
  textDecoration: "none",
  fontSize: "clamp(1rem, 2.8vw, 1.375rem)",
  fontWeight: 700,
};

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

function getAvatarStorageKey(userId) {
  return `nonogram-avatar-${userId}`;
}

function loadStoredAvatar(userId) {
  if (!userId) {
    return { avatarVariant: "amber", avatarImage: "" };
  }

  try {
    const stored = window.localStorage.getItem(getAvatarStorageKey(userId));
    const parsed = stored ? JSON.parse(stored) : null;

    return {
      avatarVariant: parsed?.avatarVariant || "amber",
      avatarImage: parsed?.avatarImage || "",
    };
  } catch {
    return { avatarVariant: "amber", avatarImage: "" };
  }
}

function loadNavbarUser() {
  try {
    const storedUser = window.localStorage.getItem("nonogram-auth-user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (!parsedUser) {
      return null;
    }

    const storedAvatar = loadStoredAvatar(parsedUser.id);

    return {
      ...parsedUser,
      avatarVariant: storedAvatar.avatarVariant || parsedUser.avatarVariant || "amber",
      avatarImage: storedAvatar.avatarImage || parsedUser.avatarImage || "",
    };
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [navbarUser, setNavbarUser] = useState(() => loadNavbarUser());

  useEffect(() => {
    const syncNavbarUser = () => setNavbarUser(loadNavbarUser());

    window.addEventListener("avatar-change", syncNavbarUser);
    window.addEventListener("auth-user-change", syncNavbarUser);
    window.addEventListener("storage", syncNavbarUser);

    return () => {
      window.removeEventListener("avatar-change", syncNavbarUser);
      window.removeEventListener("auth-user-change", syncNavbarUser);
      window.removeEventListener("storage", syncNavbarUser);
    };
  }, []);

  return (
    <header style={topBarStyle}>
      <a href="#/" aria-label="Go to home" style={brandStyle}>
        <img
          src={logo}
          alt="Nonogrammer logo"
          style={{ width: "clamp(28px, 6vw, 36px)", height: "clamp(28px, 6vw, 36px)", objectFit: "contain", flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: "clamp(1.4rem, 4.8vw, 2rem)",
            fontWeight: 800,
            color: "#111111",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Nonogrammer
        </span>
      </a>

      <nav style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 24px)", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <a href="#/play" style={linkStyle}>
          Play
        </a>
        <a href="#/solver" style={linkStyle}>
          Solver
        </a>
        {navbarUser ? null : (
          <>
            <a href="#/login" style={linkStyle}>
              Login
            </a>
            <a href="#/register" style={linkStyle}>
              Register
            </a>
          </>
        )}
        {navbarUser ? (
          <a
            href="#/profile"
            aria-label={`${navbarUser.username} profile`}
            title={`${navbarUser.username} profile`}
            style={{
              ...linkStyle,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "clamp(40px, 6vw, 48px)",
              height: "clamp(40px, 6vw, 48px)",
              borderRadius: 999,
              background: "rgba(17, 17, 17, 0.05)",
            }}
          >
            <AvatarIcon
              variant={navbarUser.avatarVariant}
              initials={getInitials(navbarUser.username)}
              imageSrc={navbarUser.avatarImage}
              style={{ width: "clamp(32px, 5vw, 40px)", height: "clamp(32px, 5vw, 40px)" }}
            />
          </a>
        ) : null}
      </nav>
    </header>
  );
}
