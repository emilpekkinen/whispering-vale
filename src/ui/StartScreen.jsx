import { useGameStore } from '../stores/gameStore'

export default function StartScreen() {
  const setGameStarted = useGameStore(s => s.setGameStarted)

  return (
    <div className="start-screen">
      <div>
        <div className="start-title">The Whispering Vale</div>
        <div style={{ height: 8 }} />
        <div className="start-subtitle">A world of living minds</div>
      </div>

      <div className="start-description">
        A quiet village where the NPCs remember, think, and feel.
        Speak with the villagers, earn their trust, and accept their quests.
        Every conversation is powered by a living intelligence.
      </div>

      <div className="start-controls">
        <div className="ctrl-row">
          <span className="key">WASD</span>
          <span>Move</span>
        </div>
        <div className="ctrl-row">
          <span className="key">Mouse</span>
          <span>Look around</span>
        </div>
        <div className="ctrl-row">
          <span className="key">Space</span>
          <span>Jump</span>
        </div>
        <div className="ctrl-row">
          <span className="key">Left Click</span>
          <span>Attack</span>
        </div>
        <div className="ctrl-row">
          <span className="key">E</span>
          <span>Talk to nearby NPC</span>
        </div>
        <div className="ctrl-row">
          <span className="key">Q / M / I</span>
          <span>Quest log / Map / Inventory</span>
        </div>
        <div className="ctrl-row">
          <span className="key">Shift</span>
          <span>Sprint</span>
        </div>
        <div className="ctrl-row">
          <span className="key">ESC</span>
          <span>Release mouse / close panel</span>
        </div>
      </div>

      <button className="start-btn" onClick={() => setGameStarted(true)}>
        Enter the Vale
      </button>
    </div>
  )
}
