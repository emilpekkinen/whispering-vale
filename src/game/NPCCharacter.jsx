import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const tmpVec = new THREE.Vector3()

export default function NPCCharacter({ npc, isNearby }) {
  const groupRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()

  // Gentle idle animation
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      // Subtle bob
      groupRef.current.position.y = Math.sin(t * 1.2 + npc.id.length) * 0.04
      // Face the player
      const cam = state.camera.position
      tmpVec.set(cam.x - npc.position[0], 0, cam.z - npc.position[2])
      if (tmpVec.lengthSq() > 0.01) {
        const angle = Math.atan2(tmpVec.x, tmpVec.z)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          angle,
          0.05
        )
      }
    }
    // Arm swing
    if (armLRef.current) {
      armLRef.current.rotation.x = Math.sin(t * 1.2 + npc.id.length) * 0.18
    }
    if (armRRef.current) {
      armRRef.current.rotation.x = -Math.sin(t * 1.2 + npc.id.length) * 0.18
    }
  })

  const bc = npc.appearance.bodyColor
  const hc = npc.appearance.headColor
  const height = npc.appearance.height || 1.8

  return (
    <group position={npc.position}>
      <group ref={groupRef}>
        {/* Legs */}
        <mesh position={[-0.15, height * 0.22, 0]} castShadow>
          <boxGeometry args={[0.2, height * 0.44, 0.2]} />
          <meshLambertMaterial color={bc} />
        </mesh>
        <mesh position={[0.15, height * 0.22, 0]} castShadow>
          <boxGeometry args={[0.2, height * 0.44, 0.2]} />
          <meshLambertMaterial color={bc} />
        </mesh>

        {/* Body / torso */}
        <mesh position={[0, height * 0.6, 0]} castShadow>
          <boxGeometry args={[0.55, height * 0.35, 0.28]} />
          <meshLambertMaterial color={bc} />
        </mesh>

        {/* Left arm */}
        <group ref={armLRef} position={[-0.38, height * 0.62, 0]}>
          <mesh position={[0, -height * 0.12, 0]} castShadow>
            <boxGeometry args={[0.16, height * 0.32, 0.16]} />
            <meshLambertMaterial color={bc} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={armRRef} position={[0.38, height * 0.62, 0]}>
          <mesh position={[0, -height * 0.12, 0]} castShadow>
            <boxGeometry args={[0.16, height * 0.32, 0.16]} />
            <meshLambertMaterial color={bc} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, height * 0.8, 0]} castShadow>
          <boxGeometry args={[0.18, height * 0.08, 0.18]} />
          <meshLambertMaterial color={hc} />
        </mesh>

        {/* Head */}
        <mesh position={[0, height * 0.9, 0]} castShadow>
          <boxGeometry args={[0.46, 0.44, 0.44]} />
          <meshLambertMaterial color={hc} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.12, height * 0.91, 0.23]}>
          <boxGeometry args={[0.08, 0.06, 0.02]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.12, height * 0.91, 0.23]}>
          <boxGeometry args={[0.08, 0.06, 0.02]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>

        {/* Nearby glow ring */}
        {isNearby && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.75, 24]} />
            <meshBasicMaterial color="#f0d060" transparent opacity={0.5} />
          </mesh>
        )}

        {/* Name label */}
        <Html position={[0, height + 0.6, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
          <div className="npc-label">{npc.name}</div>
        </Html>
      </group>
    </group>
  )
}
