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

async function loadCurrentUser(sessionUser) {
  if (!sessionUser) {
    return null;
  }

  const { data: profile } = await supabase.from("users").select("username, role").eq("id", sessionUser.id).maybeSingle();
  const storedAvatar = loadStoredAvatar(sessionUser.id);

  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    username: profile?.username || sessionUser.user_metadata?.username || "",
    role: profile?.role || "guest",
    avatarVariant: storedAvatar.avatarVariant || sessionUser.user_metadata?.avatarVariant || "amber",
    avatarImage: storedAvatar.avatarImage,
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

    const syncSession = async () => {
      if (isSigningOut) {
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const nextUser = await loadCurrentUser(session?.user || null);

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

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isSigningOut) {
        return;
      }

      try {
        const nextUser = await loadCurrentUser(session?.user || null);

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

    try {
      await supabase.auth.signOut();
    } catch (error) {
      const message = error?.message || "";

      if (!message.includes("NavigatorLockAcquireTimeoutError") && !message.includes("another request stole it")) {
        setIsSigningOut(false);
        throw error;
      }
    }

    setCurrentUser(null);
    window.location.hash = "#/";
    setIsSigningOut(false);
  };

  const renderPage = () => {
    if (route === "#/login") {
      return <Login currentUser={currentUser} onLogin={handleLogin} />;
    }

    if (route === "#/register") {
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
