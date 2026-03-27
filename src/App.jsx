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
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setIsInGame(false)}>
              Change player / size
            </button>
          </div>
          <Nonogram size={size} playerName={playerName} />
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Home />
        <p style={{ margin: 0 }}>
          Use the navigation above to start a puzzle or open the solver with custom row and column clues.
        </p>
      </div>
    );
  };

  return (
    <section id="center">
      <nav
        aria-label="Primary"
        style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}
      >
        {routes.map((item) => (
          <a
            key={item.hash}
            href={item.hash}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              textDecoration: "none",
              border: "1px solid var(--border)",
              color: route === item.hash ? "white" : "var(--text-h)",
              background: route === item.hash ? "var(--accent)" : "transparent",
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {renderPage()}
    </section>
  );
}

export default App;
