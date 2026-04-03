import { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import Game from "./pages/Game";
import GameSetup from "./pages/GameSetup";
import Solver from "./pages/Solver";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { supabase } from "./lib/supabase";

const routes = ["#/", "#/play", "#/game", "#/solver", "#/profile", "#/login", "#/register"];
const storageKey = "nonogram-auth-user";
const avatarBucket = "avatar_icons";

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

function getRouteFromHash() {
  const hash = window.location.hash || "#/";
  return routes.includes(hash) ? hash : "#/";
}

function getAvatarObjectPath(userId) {
  return `${userId}/avatar`;
}

async function loadAvatarUrl(userId) {
  if (!userId) {
    return "";
  }

  try {
    const { data, error } = await supabase.storage.from(avatarBucket).list(userId, {
      limit: 10,
    });

    if (error) {
      return "";
    }

    const avatarObject = data?.find((item) => item.name === "avatar");

    if (!avatarObject) {
      return "";
    }

    const { data: publicUrlData } = supabase.storage.from(avatarBucket).getPublicUrl(getAvatarObjectPath(userId));
    return publicUrlData?.publicUrl ? `${publicUrlData.publicUrl}?t=${avatarObject.updated_at || Date.now()}` : "";
  } catch {
    return "";
  }
}

async function loadCurrentUser(sessionUser) {
  if (!sessionUser) {
    return null;
  }

  let profile = null;

  try {
    const { data } = await supabase.from("users").select("username, role").eq("id", sessionUser.id).maybeSingle();
    profile = data;
  } catch {
    profile = null;
  }

  const storedAvatar = loadStoredAvatar(sessionUser.id);
  const remoteAvatarUrl = await loadAvatarUrl(sessionUser.id);

  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    username: profile?.username || sessionUser.user_metadata?.username || "",
    role: profile?.role || "guest",
    avatarVariant: storedAvatar.avatarVariant || sessionUser.user_metadata?.avatarVariant || "amber",
    avatarImage: remoteAvatarUrl || storedAvatar.avatarImage,
  };
}

function App() {
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [playerName, setPlayerName] = useState("");
  const [size, setSize] = useState(5);
  const [hintLimit, setHintLimit] = useState(null);
  const [isInGame, setIsInGame] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem(storageKey);

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      window.localStorage.removeItem(storageKey);
      return null;
    }
  });

  useEffect(() => {
    const syncRoute = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const applySessionUser = async (sessionUser) => {
      try {
        const nextUser = await loadCurrentUser(sessionUser);

        if (isMounted) {
          setCurrentUser(nextUser);
          if (nextUser?.username) {
            setPlayerName(nextUser.username);
          }
        }
      } catch (error) {
        const message = error?.message || "";

        if (!isMounted || message.includes("NavigatorLockAcquireTimeoutError") || message.includes("another request stole it")) {
          return;
        }
      }
    };

    const syncSession = async () => {
      if (isSigningOut || !isMounted) {
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await applySessionUser(session?.user || null);
      } catch (error) {
        const message = error?.message || "";

        if (!isMounted || message.includes("NavigatorLockAcquireTimeoutError") || message.includes("another request stole it")) {
          return;
        }
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isSigningOut) {
        return;
      }

      window.setTimeout(() => {
        if (!isMounted || isSigningOut) {
          return;
        }

        void applySessionUser(session?.user || null);
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isSigningOut]);

  useEffect(() => {
    if (route === "#/game" && !isInGame) {
      window.location.hash = "#/play";
    }
  }, [route, isInGame]);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(storageKey, JSON.stringify(currentUser));
      window.dispatchEvent(new Event("auth-user-change"));
      return;
    }

    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event("auth-user-change"));
  }, [currentUser]);

  const startGame = ({ playerName: nextName, size: nextSize, hintLimit: nextHintLimit }) => {
    setPlayerName(nextName);
    setSize(nextSize);
    setHintLimit(nextHintLimit);
    setIsInGame(true);
    window.location.hash = "#/game";
  };

  const abandonGame = () => {
    setIsInGame(false);
    window.location.hash = "#/play";
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setPlayerName(user.username);
    window.location.hash = "#/profile";
  };

  const handleProfileUpdate = (user) => {
    setCurrentUser(user);
    if (user?.username) {
      setPlayerName(user.username);
    }
  };

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setCurrentUser(null);
    window.location.hash = "#/";

    try {
      await supabase.auth.signOut();
    } catch (error) {
      const message = error?.message || "";

      if (!message.includes("NavigatorLockAcquireTimeoutError") && !message.includes("another request stole it")) {
        setIsSigningOut(false);
        throw error;
      }
    }
    setIsSigningOut(false);
  };

  const renderPage = () => {
    if (route === "#/login") {
      if (currentUser) {
        window.location.hash = "#/profile";
        return null;
      }

      return <Login currentUser={currentUser} onLogin={handleLogin} />;
    }

    if (route === "#/register") {
      if (currentUser) {
        window.location.hash = "#/profile";
        return null;
      }

      return <Register onRegister={handleLogin} />;
    }

    if (route === "#/solver") {
      return <Solver />;
    }

    if (route === "#/game" && isInGame) {
      return <Game playerName={playerName} size={size} hintLimit={hintLimit} onAbandon={abandonGame} />;
    }

    if (route === "#/play") {
      return <GameSetup initialName={playerName} initialSize={size} initialHintLimit={hintLimit} onStart={startGame} />;
    }

    if (route === "#/profile") {
      if (!currentUser) {
        window.location.hash = "#/login";
        return null;
      }

      return <Profile currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
    }

    return <Home />;
  };

  return <section id="center">{renderPage()}</section>;
}

export default App;
