import { useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'
import { enemyRegistry } from './enemyRegistry'

const ENEMY_VISUALS = {
  skeleton: { bodyColor: '#cfc8a0', headColor: '#ede8cc', eyeColor: '#7070ff' },
  shadow:   { bodyColor: '#1a0a2e', headColor: '#2a183a', eyeColor: '#cc00ff' },
  wolf:     { bodyColor: '#5a4030', headColor: '#7a6050', eyeColor: '#ffaa00' },
  bandit:   { bodyColor: '#7a3a10', headColor: '#c07a50', eyeColor: '#282828' },
  golem:    { bodyColor: '#484848', headColor: '#686868', eyeColor: '#ff4400' },
  cultist:  { bodyColor: '#180808', headColor: '#c07050', eyeColor: '#ff0000' },
  spider:   { bodyColor: '#0a0a0a', headColor: '#180a0a', eyeColor: '#00ff44' },
}

const ATTACK_RANGE     = 1.8
const ATTACK_INTERVAL  = 1.4  // seconds between enemy hits on player
const PATROL_SPEED     = 0.8

export default function Enemy({ enemyId, type, name, maxHp, damage, speed, aggroRange, startPos, loot }) {
  const groupRef = useRef()
  const posRef   = useRef([startPos[0], startPos[1]])  // [x, z]
  const lastHitRef = useRef(0)
  const patrolOffset = useRef(Math.random() * Math.PI * 2)

  const [hp, setHp] = useState(maxHp)
  const [isHit, setIsHit] = useState(false)
  const [isDead, setIsDead] = useState(false)

  const damagePlayer = useGameStore(s => s.damagePlayer)

  const takeDamage = useCallback((amount) => {
    setHp(prev => {
      const next = prev - amount
      if (next <= 0) {
        setIsDead(true)
        // Drop loot
        const store = useGameStore.getState()
        if (loot?.length) {
          for (const item of loot) {
            store.addLootItem(item)
          }
          store.showNotification(`${name} dropped: ${loot.join(', ')}`, 'reward')
        }
      }
      return Math.max(0, next)
    })
    setIsHit(true)
    setTimeout(() => setIsHit(false), 140)
  }, [name, loot])

  // Register in global registry so Player can find and attack us
  useEffect(() => {
    enemyRegistry.set(enemyId, {
      getPosition: () => posRef.current,
      takeDamage
    })
    return () => enemyRegistry.delete(enemyId)
  }, [enemyId, takeDamage])

  useFrame((state, delta) => {
    if (isDead || !groupRef.current) return

    const cam = state.camera
    const dx = cam.position.x - posRef.current[0]
    const dz = cam.position.z - posRef.current[1]
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < aggroRange) {
      // Aggro — chase player
      if (dist > ATTACK_RANGE) {
        const spd = speed * delta
        posRef.current[0] += (dx / dist) * spd
        posRef.current[1] += (dz / dist) * spd
      } else {
        // Melee attack on player
        const now = state.clock.elapsedTime
        if (now - lastHitRef.current > ATTACK_INTERVAL) {
          lastHitRef.current = now
          damagePlayer(damage)
        }
      }
      // Face player
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    } else {
      // Idle patrol — gentle circular wander around start position
      const t = state.clock.elapsedTime * PATROL_SPEED + patrolOffset.current
      posRef.current[0] = startPos[0] + Math.sin(t) * 3.5
      posRef.current[1] = startPos[1] + Math.cos(t * 0.8) * 3.5
      groupRef.current.rotation.y = t + Math.PI
    }

    groupRef.current.position.x = posRef.current[0]
    groupRef.current.position.z = posRef.current[1]
  })

  if (isDead) return null

  const vis = ENEMY_VISUALS[type] || ENEMY_VISUALS.skeleton
  const hpPct = hp / maxHp
  const hitColor = '#ff5020'
  const bc = isHit ? hitColor : vis.bodyColor
  const hc = isHit ? hitColor : vis.headColor

  return (
    <group ref={groupRef} position={[startPos[0], 0, startPos[1]]}>
      {/* Legs */}
      <mesh position={[-0.13, 0.3, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.18]} />
        <meshLambertMaterial color={bc} />
      </mesh>
      <mesh position={[0.13, 0.3, 0]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.18]} />
        <meshLambertMaterial color={bc} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.28]} />
        <meshLambertMaterial color={bc} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={hc} />
      </mesh>
      {/* Glowing eyes */}
      <mesh position={[-0.1, 1.47, 0.22]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshBasicMaterial color={vis.eyeColor} />
      </mesh>
      <mesh position={[0.1, 1.47, 0.22]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshBasicMaterial color={vis.eyeColor} />
      </mesh>

      {/* HP bar */}
      <Html position={[0, 2.1, 0]} center distanceFactor={12} zIndexRange={[0, 0]}>
        <div className="enemy-hud">
          <div className="enemy-hud-name">{name}</div>
          <div className="enemy-hud-bar">
            <div
              className="enemy-hud-fill"
              style={{
                width: `${hpPct * 100}%`,
                background: hpPct > 0.5 ? '#50c040' : hpPct > 0.25 ? '#d0a020' : '#d03020'
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  )
}
