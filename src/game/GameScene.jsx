import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import World from './World'
import Player from './Player'
import NPCCharacter from './NPCCharacter'
import WeaponView from './WeaponView'
import GeneratedArea from './GeneratedArea'
import { useGameStore } from '../stores/gameStore'

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} color="#c8d4e8" />
      <directionalLight
        position={[60, 80, 40]}
        intensity={1.2}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight position={[-40, 20, -30]} intensity={0.25} color="#8090c0" />
    </>
  )
}

function VillageNPCs() {
  const npcs      = useGameStore(s => s.npcs)
  const locations = useGameStore(s => s.locations)
  const nearbyNPC = useGameStore(s => s.nearbyNPC)

  // Village NPCs are those NOT in any generated location
  const locationNpcIds = new Set(
    locations.flatMap(loc => {
      if (!loc.spec) return []
      try { return JSON.parse(loc.spec).npcs?.map(n => n.id) || [] }
      catch { return [] }
    })
  )

  return (
    <>
      {npcs
        .filter(npc => !locationNpcIds.has(npc.id))
        .map(npc => (
          <NPCCharacter key={npc.id} npc={npc} isNearby={nearbyNPC?.id === npc.id} />
        ))}
    </>
  )
}

function GeneratedAreas() {
  const locations     = useGameStore(s => s.locations)
  const playerPos     = useGameStore(s => s.playerPosition)

  const RENDER_DIST = 140

  const visible = locations.filter(loc => {
    if (loc.status !== 'ready' || !loc.spec) return false
    const dx = playerPos[0] - loc.position_x
    const dz = playerPos[2] - loc.position_z
    return Math.sqrt(dx * dx + dz * dz) < RENDER_DIST
  })

  return (
    <>
      {visible.map(loc => (
        <GeneratedArea key={loc.id} location={loc} />
      ))}
    </>
  )
}

export default function GameScene() {
  return (
    <Canvas
      id="game-canvas"
      shadows
      camera={{ fov: 75, near: 0.1, far: 300 }}
      style={{ width: '100vw', height: '100vh', display: 'block' }}
      gl={{ antialias: true }}
    >
      <fog attach="fog" args={['#b8cce0', 60, 180]} />
      <color attach="background" args={['#87CEEB']} />

      <Suspense fallback={null}>
        <SceneLighting />
        <Sky distance={450000} sunPosition={[100, 40, 50]} inclination={0.48} azimuth={0.25} turbidity={5} rayleigh={2} />
        <Stars radius={150} depth={60} count={2000} factor={3} saturation={0} fade />
        <World />
        <VillageNPCs />
        <GeneratedAreas />
        <Player />
        <WeaponView />
      </Suspense>
    </Canvas>
  )
}
