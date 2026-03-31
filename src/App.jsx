import { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import Game from "./pages/Game";
import GameSetup from "./pages/GameSetup";
import Solver from "./pages/Solver";
import Profile from "./pages/Profile";

const routes = ["#/", "#/play", "#/game", "#/solver", "#/profile"];

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

  const renderPage = () => {
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
      return <Profile />;
    }

    return <Home />;
  };

  return <section id="center">{renderPage()}</section>;
}

export default App;
