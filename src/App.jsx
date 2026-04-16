import { useEffect, useRef } from 'react'
import { useGameStore } from './stores/gameStore'
import GameScene from './game/GameScene'
import HUD from './ui/HUD'
import DialoguePanel from './ui/DialoguePanel'
import QuestLog from './ui/QuestLog'
import MapPanel from './ui/MapPanel'
import InventoryPanel from './ui/InventoryPanel'
import StartScreen from './ui/StartScreen'

export default function App() {
  const gameStarted   = useGameStore(s => s.gameStarted)
  const setNpcs       = useGameStore(s => s.setNpcs)
  const setPlayerData = useGameStore(s => s.setPlayerData)
  const setLocations  = useGameStore(s => s.setLocations)
  const playerId      = useGameStore(s => s.playerId)
  const prevReadyCount = useRef(0)

  // Initial load
  useEffect(() => {
    fetch('/api/npcs').then(r => r.json()).then(setNpcs).catch(console.error)
    fetch(`/api/player/${playerId}`).then(r => r.json()).then(setPlayerData).catch(console.error)
    fetch('/api/locations').then(r => r.json()).then(setLocations).catch(console.error)
  }, [])

  // Poll locations every 8 s; when new ones finish generating, refresh NPCs so area NPCs appear
  useEffect(() => {
    const poll = async () => {
      try {
        const locs = await fetch('/api/locations').then(r => r.json())
        setLocations(locs)
        const readyNow = locs.filter(l => l.status === 'ready').length
        if (readyNow !== prevReadyCount.current) {
          prevReadyCount.current = readyNow
          // Reload NPC list so newly registered area NPCs are pickable
          fetch('/api/npcs').then(r => r.json()).then(setNpcs).catch(console.error)
        }
      } catch { /* ignore network errors during polling */ }
    }
    const id = setInterval(poll, 8000)
    return () => clearInterval(id)
  }, [setLocations, setNpcs])

  return (
    <>
      <GameScene />
      {gameStarted ? (
        <>
          <HUD />
          <DialoguePanel />
          <QuestLog />
          <MapPanel />
          <InventoryPanel />
        </>
      ) : (
        <StartScreen />
      )}
    </>
  )
}
