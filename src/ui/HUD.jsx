import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

export default function HUD() {
  const gold          = useGameStore(s => s.gold)
  const inventory     = useGameStore(s => s.inventory)
  const quests        = useGameStore(s => s.quests)
  const nearbyNPC     = useGameStore(s => s.nearbyNPC)
  const playerHp      = useGameStore(s => s.playerHp)
  const playerMaxHp   = useGameStore(s => s.playerMaxHp)
  const isRespawning  = useGameStore(s => s.isRespawning)
  const isDialogueOpen   = useGameStore(s => s.isDialogueOpen)
  const isQuestLogOpen   = useGameStore(s => s.isQuestLogOpen)
  const isMapOpen        = useGameStore(s => s.isMapOpen)
  const isInventoryOpen  = useGameStore(s => s.isInventoryOpen)
  const toggleQuestLog   = useGameStore(s => s.toggleQuestLog)
  const toggleMap        = useGameStore(s => s.toggleMap)
  const toggleInventory  = useGameStore(s => s.toggleInventory)
  const notification     = useGameStore(s => s.notification)
  const clearNotification = useGameStore(s => s.clearNotification)
  const isAttacking      = useGameStore(s => s.isAttacking)
  const attackCooldown   = useGameStore(s => s.attackCooldown)

  const activeQuests  = quests.filter(q => q.status === 'active')
  const anyPanelOpen  = isDialogueOpen || isQuestLogOpen || isMapOpen || isInventoryOpen
  const hpPct         = playerHp / playerMaxHp
  const hpColor       = hpPct > 0.6 ? '#50c040' : hpPct > 0.3 ? '#d0a020' : '#d03020'

  useEffect(() => {
    if (notification) {
      const t = setTimeout(clearNotification, 3500)
      return () => clearTimeout(t)
    }
  }, [notification, clearNotification])

  return (
    <div className="hud">
      {/* Respawn overlay */}
      {isRespawning && (
        <div className="respawn-overlay">
          <div className="respawn-text">You have fallen…</div>
        </div>
      )}

      {/* Attack flash */}
      {isAttacking && <div className="attack-flash" />}

      {/* Crosshair */}
      {!anyPanelOpen && !isRespawning && <div className="crosshair" />}

      {/* Top-left stats */}
      <div className="hud-top-left">
        {/* HP bar */}
        <div className="hud-hp-block">
          <span className="label">HP</span>
          <div className="hud-hp-bar">
            <div className="hud-hp-fill" style={{ width: `${hpPct * 100}%`, background: hpColor }} />
          </div>
          <span className="hud-hp-text">{playerHp}/{playerMaxHp}</span>
        </div>
        <div className="hud-stat">
          <span className="label">Gold</span>
          {gold} ✦
        </div>
        <div className="hud-stat">
          <span className="label">Items</span>
          {Math.max(inventory.length, 1)}
        </div>
      </div>

      {/* Top-right buttons */}
      <div className="hud-top-right">
        <div className="hud-btn-row">
          <button className="hud-btn" onClick={toggleInventory}>
            ⚔ Inv <span className="hud-key">[I]</span>
          </button>
          <button className="hud-btn" onClick={toggleMap}>
            ◈ Map <span className="hud-key">[M]</span>
          </button>
          <button className="hud-btn" onClick={toggleQuestLog}>
            ☰ Quests {activeQuests.length > 0 && `(${activeQuests.length})`}
            <span className="hud-key">[Q]</span>
          </button>
        </div>
      </div>

      {/* Attack cooldown bar */}
      {attackCooldown && !anyPanelOpen && (
        <div className="cooldown-bar"><div className="cooldown-fill" /></div>
      )}

      {/* Nearby NPC prompt */}
      {nearbyNPC && !isDialogueOpen && !isRespawning && (
        <div className="interact-prompt">
          <div className="npc-name">{nearbyNPC.name}</div>
          <div className="hint">Press E to speak</div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.text}
        </div>
      )}

      {/* Control hints */}
      {!anyPanelOpen && !isRespawning && (
        <div className="locked-notice">
          Click to capture mouse · WASD move · Space jump · Left click attack · E talk · Q/M/I for panels
        </div>
      )}
    </div>
  )
}
