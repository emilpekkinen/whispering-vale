import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Enemy from './Enemy'
import NPCCharacter from './NPCCharacter'
import { useGameStore } from '../stores/gameStore'

// ─── AREA OBJECTS ────────────────────────────────────────────────────────────

function RuinPillar({ position, rotation, scale }) {
  const h = 2.2 * scale
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.28 * scale, 0.33 * scale, h, 8]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      {/* Broken top */}
      <mesh position={[0.12 * scale, h - 0.1, 0.08 * scale]} castShadow>
        <boxGeometry args={[0.22 * scale, 0.25 * scale, 0.2 * scale]} />
        <meshLambertMaterial color="#7a7060" />
      </mesh>
    </group>
  )
}

function RuinWall({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.0 * scale, 0]} castShadow>
        <boxGeometry args={[4 * scale, 2.0 * scale, 0.45 * scale]} />
        <meshLambertMaterial color="#7a7060" />
      </mesh>
      <mesh position={[1.6 * scale, 2.2 * scale, 0]} castShadow>
        <boxGeometry args={[0.8 * scale, 0.6 * scale, 0.45 * scale]} />
        <meshLambertMaterial color="#6a6050" />
      </mesh>
    </group>
  )
}

function Arch({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[-0.85 * scale, 1.2 * scale, 0]} castShadow>
        <boxGeometry args={[0.4 * scale, 2.4 * scale, 0.4 * scale]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      <mesh position={[0.85 * scale, 1.2 * scale, 0]} castShadow>
        <boxGeometry args={[0.4 * scale, 2.4 * scale, 0.4 * scale]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      <mesh position={[0, 2.5 * scale, 0]} castShadow>
        <boxGeometry args={[2.1 * scale, 0.4 * scale, 0.4 * scale]} />
        <meshLambertMaterial color="#9a9080" />
      </mesh>
    </group>
  )
}

function Tower({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 2.5 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.9 * scale, 1.0 * scale, 5.0 * scale, 8]} />
        <meshLambertMaterial color="#7a7060" />
      </mesh>
      <mesh position={[0, 5.2 * scale, 0]} castShadow>
        <coneGeometry args={[1.1 * scale, 1.2 * scale, 8]} />
        <meshLambertMaterial color="#5a4a38" />
      </mesh>
    </group>
  )
}

function Tent({ position, scale }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1.1 * scale, 0]} castShadow>
        <coneGeometry args={[1.6 * scale, 2.2 * scale, 6]} />
        <meshLambertMaterial color="#8a6a40" />
      </mesh>
      {/* Door opening */}
      <mesh position={[0, 0.5 * scale, 1.4 * scale]}>
        <boxGeometry args={[0.6 * scale, 1.0 * scale, 0.05]} />
        <meshLambertMaterial color="#2a1800" />
      </mesh>
    </group>
  )
}

function Campfire({ position }) {
  const flameRef = useRef()
  useFrame((state) => {
    if (flameRef.current) {
      const t = state.clock.elapsedTime
      flameRef.current.scale.y = 0.9 + Math.sin(t * 8) * 0.18
      flameRef.current.scale.x = 0.9 + Math.sin(t * 5.3) * 0.1
    }
  })
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* Logs */}
      <mesh position={[0.3, 0.1, 0]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.8, 5]} />
        <meshLambertMaterial color="#4a2a10" />
      </mesh>
      <mesh position={[-0.25, 0.1, 0.15]} rotation={[0, -0.8, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.7, 5]} />
        <meshLambertMaterial color="#4a2a10" />
      </mesh>
      {/* Embers */}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.18, 6, 4]} />
        <meshBasicMaterial color="#ff6010" />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.45, 0]}>
        <coneGeometry args={[0.14, 0.55, 5]} />
        <meshBasicMaterial color="#ff9020" transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={1.2} color="#ff8020" distance={8} decay={2} />
    </group>
  )
}

function Altar({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45 * scale, 0]} castShadow>
        <boxGeometry args={[1.8 * scale, 0.9 * scale, 1.0 * scale]} />
        <meshLambertMaterial color="#6a6050" />
      </mesh>
      <mesh position={[0, 1.0 * scale, 0]} castShadow>
        <boxGeometry args={[1.5 * scale, 0.15 * scale, 0.8 * scale]} />
        <meshLambertMaterial color="#8a8070" />
      </mesh>
      {/* Candles */}
      <mesh position={[-0.5 * scale, 1.22 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.25, 5]} />
        <meshLambertMaterial color="#e8e0c0" />
      </mesh>
      <mesh position={[0.5 * scale, 1.22 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.25, 5]} />
        <meshLambertMaterial color="#e8e0c0" />
      </mesh>
      <pointLight position={[0, 1.6 * scale, 0]} intensity={0.4} color="#ff9040" distance={5} decay={2} />
    </group>
  )
}

function Chest({ position, rotation }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.45]} />
        <meshLambertMaterial color="#6a4a20" />
      </mesh>
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[0.72, 0.22, 0.46]} />
        <meshLambertMaterial color="#8a6a30" />
      </mesh>
      {/* Gold latch */}
      <mesh position={[0, 0.42, 0.24]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#d4a820" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Rock({ position, scale }) {
  return (
    <mesh position={[position[0], 0.3 * scale, position[1]]} castShadow>
      <sphereGeometry args={[0.5 * scale, 6, 5]} />
      <meshLambertMaterial color="#7a7668" />
    </mesh>
  )
}

function Torch({ position }) {
  const flameRef = useRef()
  useFrame((state) => {
    if (flameRef.current) {
      flameRef.current.scale.y = 0.85 + Math.sin(state.clock.elapsedTime * 9 + position[0]) * 0.2
    }
  })
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 2.0, 5]} />
        <meshLambertMaterial color="#4a2a10" />
      </mesh>
      <mesh ref={flameRef} position={[0, 2.1, 0]}>
        <coneGeometry args={[0.1, 0.3, 5]} />
        <meshBasicMaterial color="#ff9020" transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 2.0, 0]} intensity={0.8} color="#ff8020" distance={7} decay={2} />
    </group>
  )
}

function Statue({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.3 * scale, 0]} castShadow>
        <boxGeometry args={[0.8 * scale, 0.6 * scale, 0.8 * scale]} />
        <meshLambertMaterial color="#707060" />
      </mesh>
      <mesh position={[0, 1.1 * scale, 0]} castShadow>
        <boxGeometry args={[0.45 * scale, 0.9 * scale, 0.3 * scale]} />
        <meshLambertMaterial color="#888070" />
      </mesh>
      <mesh position={[0, 1.75 * scale, 0]} castShadow>
        <sphereGeometry args={[0.22 * scale, 7, 6]} />
        <meshLambertMaterial color="#909080" />
      </mesh>
    </group>
  )
}

function FencePost({ position }) {
  return (
    <mesh position={[position[0], 0.6, position[1]]} castShadow>
      <cylinderGeometry args={[0.06, 0.08, 1.2, 5]} />
      <meshLambertMaterial color="#5a3a18" />
    </mesh>
  )
}

function Barrel({ position }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.25, 0.75, 8]} />
        <meshLambertMaterial color="#7a5020" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.30, 0.30, 0.04, 8]} />
        <meshLambertMaterial color="#4a3010" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.30, 0.30, 0.04, 8]} />
        <meshLambertMaterial color="#4a3010" />
      </mesh>
    </group>
  )
}

function Crate({ position, rotation }) {
  return (
    <mesh position={[position[0], 0.25, position[1]]} rotation={[0, rotation, 0]} castShadow>
      <boxGeometry args={[0.55, 0.55, 0.55]} />
      <meshLambertMaterial color="#8a6a30" />
    </mesh>
  )
}

function Gravestone({ position, rotation }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.4, 1.1, 0.12]} />
        <meshLambertMaterial color="#707070" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.21, 0.08, 16, 1, false, 0, Math.PI]} />
        <meshLambertMaterial color="#606060" />
      </mesh>
    </group>
  )
}

function Obelisk({ position, scale }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 1.8 * scale, 0]} castShadow>
        <boxGeometry args={[0.7 * scale, 3.6 * scale, 0.7 * scale]} />
        <meshLambertMaterial color="#706050" />
      </mesh>
      <mesh position={[0, 3.8 * scale, 0]} castShadow>
        <coneGeometry args={[0.5 * scale, 0.9 * scale, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshLambertMaterial color="#908070" />
      </mesh>
    </group>
  )
}

function CaveMouth({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      {/* Rock frame */}
      <mesh position={[-1.2 * scale, 1.5 * scale, 0]} castShadow>
        <boxGeometry args={[0.8 * scale, 3.0 * scale, 1.0 * scale]} />
        <meshLambertMaterial color="#6a6258" />
      </mesh>
      <mesh position={[1.2 * scale, 1.5 * scale, 0]} castShadow>
        <boxGeometry args={[0.8 * scale, 3.0 * scale, 1.0 * scale]} />
        <meshLambertMaterial color="#6a6258" />
      </mesh>
      <mesh position={[0, 2.8 * scale, 0]} castShadow>
        <boxGeometry args={[3.2 * scale, 0.9 * scale, 1.0 * scale]} />
        <meshLambertMaterial color="#7a7268" />
      </mesh>
      {/* Dark interior */}
      <mesh position={[0, 1.2 * scale, 0.1]}>
        <boxGeometry args={[1.8 * scale, 2.4 * scale, 0.5]} />
        <meshBasicMaterial color="#060404" />
      </mesh>
    </group>
  )
}

function Hut({ position, rotation, scale }) {
  const s = scale
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.5 * s, 0]} castShadow>
        <boxGeometry args={[4 * s, 3 * s, 3.5 * s]} />
        <meshLambertMaterial color="#9a8a70" />
      </mesh>
      <mesh position={[0, 3.3 * s, 0]} castShadow>
        <coneGeometry args={[2.8 * s, 1.5 * s, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshLambertMaterial color="#6a4a30" />
      </mesh>
    </group>
  )
}

// ─── OBJECT DISPATCHER ───────────────────────────────────────────────────────

function AreaObject({ obj }) {
  const pos   = obj.position || [0, 0]
  const rot   = obj.rotation || 0
  const scale = obj.scale   || 1.0

  switch (obj.type) {
    case 'ruin_pillar':  return <RuinPillar  position={pos} rotation={rot} scale={scale} />
    case 'ruin_wall':    return <RuinWall    position={pos} rotation={rot} scale={scale} />
    case 'arch':         return <Arch        position={pos} rotation={rot} scale={scale} />
    case 'tower':        return <Tower       position={pos} rotation={rot} scale={scale} />
    case 'tent':         return <Tent        position={pos} scale={scale} />
    case 'campfire':     return <Campfire    position={pos} />
    case 'altar':        return <Altar       position={pos} rotation={rot} scale={scale} />
    case 'chest':        return <Chest       position={pos} rotation={rot} />
    case 'barrel':       return <Barrel      position={pos} />
    case 'crate':        return <Crate       position={pos} rotation={rot} />
    case 'rock':         return <Rock        position={pos} scale={scale} />
    case 'torch':        return <Torch       position={pos} />
    case 'statue':       return <Statue      position={pos} rotation={rot} scale={scale} />
    case 'fence_post':   return <FencePost   position={pos} />
    case 'gravestone':   return <Gravestone  position={pos} rotation={rot} />
    case 'obelisk':      return <Obelisk     position={pos} scale={scale} />
    case 'cave_mouth':   return <CaveMouth   position={pos} rotation={rot} scale={scale} />
    case 'hut':          return <Hut         position={pos} rotation={rot} scale={scale} />
    default:
      return (
        <mesh position={[pos[0], 0.5 * scale, pos[1]]} castShadow>
          <boxGeometry args={[1 * scale, 1 * scale, 1 * scale]} />
          <meshLambertMaterial color="#8a7a6a" />
        </mesh>
      )
  }
}

// ─── GROUND PATCH ────────────────────────────────────────────────────────────

const GROUND_COLORS = {
  ruins:      '#4a4038',
  forest:     '#2d4020',
  cave:       '#3a3028',
  camp:       '#5a4a30',
  mine:       '#3a3530',
  dungeon:    '#2a2822',
  settlement: '#6a5a40',
  pass:       '#6a6050',
  shrine:     '#3a3848',
  tower:      '#4a4030',
}

// ─── AREA NPC WRAPPER ────────────────────────────────────────────────────────

function AreaNPC({ npc }) {
  const nearbyNPC = useGameStore(s => s.nearbyNPC)
  return <NPCCharacter npc={npc} isNearby={nearbyNPC?.id === npc.id} />
}

// ─── DISCOVERY TRIGGER ───────────────────────────────────────────────────────

const LORE_RADIUS = 16

function LoreText({ lore, locationId, worldX, worldZ }) {
  const shown = useRef(false)
  const playerPos = useGameStore(s => s.playerPosition)
  const showNotification = useGameStore(s => s.showNotification)

  useEffect(() => {
    if (shown.current) return
    const dx = playerPos[0] - worldX
    const dz = playerPos[2] - worldZ
    if (Math.sqrt(dx * dx + dz * dz) < LORE_RADIUS) {
      shown.current = true
      showNotification(lore, 'lore')
    }
  }, [playerPos])

  return null
}

// ─── GENERATED AREA ──────────────────────────────────────────────────────────

// Deterministic spawn offsets per enemy slot index
const SPAWN_JITTER = [
  [0, 0], [4, 2], [-3, 4], [5, -4], [-4, -3],
  [2, 6], [-6, 1], [3, -6], [-2, 5], [6, -2]
]

export default function GeneratedArea({ location }) {
  const spec = useMemo(() => {
    try { return JSON.parse(location.spec) } catch { return null }
  }, [location.spec])

  if (!spec) return null

  const worldX = location.position_x
  const worldZ = location.position_z

  // Flatten enemies: one Enemy per instance
  const enemyInstances = useMemo(() => {
    const instances = []
    for (const e of (spec.enemies || [])) {
      for (let i = 0; i < (e.count || 1); i++) {
        const jitter = SPAWN_JITTER[i % SPAWN_JITTER.length]
        const center = e.spawn_center || [0, 0]
        instances.push({
          enemyId: `${location.id}_${e.type}_${i}`,
          type: e.type,
          name: e.name,
          maxHp: e.hp || 30,
          damage: e.damage || 8,
          speed: e.speed || 2.0,
          aggroRange: e.aggro_range || 10,
          loot: e.loot || [],
          startPos: [worldX + center[0] + jitter[0], worldZ + center[1] + jitter[1]]
        })
      }
    }
    return instances
  }, [spec, location.id, worldX, worldZ])

  // NPCs from spec (already registered in npcSouls server-side)
  const areaNpcs = useMemo(() => (spec.npcs || []).map(npc => ({
    id: npc.id,
    name: npc.name,
    position: [worldX + (npc.position?.[0] || 0), 0, worldZ + (npc.position?.[1] || 0)],
    appearance: npc.appearance || { bodyColor: '#8a6a4a', headColor: '#c0956a', height: 1.8 }
  })), [spec, worldX, worldZ])

  const groundColor = GROUND_COLORS[location.type] || '#4a4030'

  return (
    <group>
      {/* Ground patch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[worldX, 0.008, worldZ]} receiveShadow>
        <circleGeometry args={[26, 24]} />
        <meshLambertMaterial color={groundColor} />
      </mesh>

      {/* Objects — local positions offset to world */}
      <group position={[worldX, 0, worldZ]}>
        {(spec.objects || []).map((obj, i) => (
          <AreaObject key={i} obj={obj} />
        ))}
      </group>

      {/* Enemies */}
      {enemyInstances.map(e => (
        <Enemy key={e.enemyId} {...e} />
      ))}

      {/* Area NPCs — each subscribes to nearbyNPC independently */}
      {areaNpcs.map(npc => (
        <AreaNPC key={npc.id} npc={npc} />
      ))}

      {/* Lore trigger */}
      {spec.lore_text && (
        <LoreText lore={spec.lore_text} locationId={location.id} worldX={worldX} worldZ={worldZ} />
      )}
    </group>
  )
}
