import { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import Nonogram from "./component/nonogram";
import GameSetup from "./pages/GameSetup";
import Solver from "./pages/Solver";

const routes = [
  { hash: "#/", label: "Home" },
  { hash: "#/play", label: "Play" },
  { hash: "#/solver", label: "Solver" },
];

function getRouteFromHash() {
  const hash = window.location.hash || "#/";
  return routes.some((route) => route.hash === hash) ? hash : "#/";
}

function App() {
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [playerName, setPlayerName] = useState("");
  const [size, setSize] = useState(5);
  const [isInGame, setIsInGame] = useState(false);

  useEffect(() => {
    const syncRoute = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (route !== "#/play") {
      setIsInGame(false);
    }
  }, [route]);

  const renderPage = () => {
    if (route === "#/solver") {
      return <Solver />;
    }

    if (route === "#/play") {
      return !isInGame ? (
        <GameSetup
          initialName={playerName}
          initialSize={size}
          onStart={({ playerName: nextName, size: nextSize }) => {
            setPlayerName(nextName);
            setSize(nextSize);
            setIsInGame(true);
          }}
        />
      ) : (
        <div style={{ display: "grid", gap: 16, width: "min(960px, 100%)" }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              type="button"
              onClick={() => setIsInGame(false)}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(15, 23, 42, 0.14)",
                background: "#ffffff",
                color: "#111111",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Change player / size
            </button>
          </div>
          <Nonogram size={size} playerName={playerName} />
        </div>
      );
    }

    return <Home />;
  };

  return <section id="center">{renderPage()}</section>;
}

export default App;
