import { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import Game from "./pages/Game";
import GameSetup from "./pages/GameSetup";
import Solver from "./pages/Solver";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

const routes = ["#/", "#/play", "#/game", "#/solver", "#/profile", "#/login", "#/register"];
const storageKey = "nonogram-auth-user";

function getRouteFromHash() {
  const hash = window.location.hash || "#/";
  return routes.includes(hash) ? hash : "#/";
}

function App() {
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [playerName, setPlayerName] = useState("");
  const [size, setSize] = useState(5);
  const [hintLimit, setHintLimit] = useState(null);
  const [isInGame, setIsInGame] = useState(false);
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
    if (route === "#/game" && !isInGame) {
      window.location.hash = "#/play";
    }
  }, [route, isInGame]);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(storageKey, JSON.stringify(currentUser));
      return;
    }

    window.localStorage.removeItem(storageKey);
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

  const handleLogout = () => {
    setCurrentUser(null);
    window.location.hash = "#/login";
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

      return <Profile currentUser={currentUser} onLogout={handleLogout} />;
    }

    return <Home />;
  };

  return <section id="center">{renderPage()}</section>;
}

export default App;
