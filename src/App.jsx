import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Home from './pages/Home'
import Nonogram from './component/nonogram'
import GameSetup from './pages/GameSetup'

function App() {
  const [playerName, setPlayerName] = useState('')
  const [size, setSize] = useState(5)
  const [isInGame, setIsInGame] = useState(false)

  return (
    <>
      <section id="center">
        <Home />
        {!isInGame ? (
          <GameSetup
            initialName={playerName}
            initialSize={size}
            onStart={({ playerName: nextName, size: nextSize }) => {
              setPlayerName(nextName)
              setSize(nextSize)
              setIsInGame(true)
            }}
          />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setIsInGame(false)}>
                Change player / size
              </button>
            </div>
            <Nonogram size={size} playerName={playerName} />
          </div>
        )}
      </section>
    </>
  )
}

export default App
