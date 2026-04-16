import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'

const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)

export default function WeaponView() {
  const posRef = useRef()   // follows camera position + orientation
  const swingRef = useRef() // local swing animation
  const swingT = useRef(0)

  const isAttacking = useGameStore(s => s.isAttacking)
  const isDialogueOpen = useGameStore(s => s.isDialogueOpen)

  useFrame((state, delta) => {
    if (!posRef.current || !swingRef.current) return

    const cam = state.camera

    // Compute camera axes
    cam.getWorldDirection(_fwd)
    _right.crossVectors(_fwd, _up).normalize()

    // Position weapon at lower-right of view
    posRef.current.position
      .copy(cam.position)
      .addScaledVector(_right, 0.38)
      .addScaledVector(_up, -0.28)
      .addScaledVector(_fwd, 0.55)

    // Match camera rotation
    posRef.current.quaternion.copy(cam.quaternion)

    // Swing animation
    if (isAttacking) {
      swingT.current = Math.min(swingT.current + delta * 9, 1)
    } else {
      swingT.current = Math.max(swingT.current - delta * 6, 0)
    }

    const swingAngle = Math.sin(swingT.current * Math.PI)
    swingRef.current.rotation.x = -swingAngle * 1.1      // stab forward
    swingRef.current.rotation.z = swingAngle * 0.25      // slight tilt
    swingRef.current.position.z = -swingAngle * 0.12     // push forward
  })

  // Don't render during dialogue (no sword visible in chat)
  if (isDialogueOpen) return null

  return (
    <group ref={posRef}>
      <group ref={swingRef}>
        {/* Blade */}
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.055, 0.72, 0.038]} />
          <meshStandardMaterial color="#d0d8e8" metalness={0.92} roughness={0.08} />
        </mesh>

        {/* Blade fuller (central groove) */}
        <mesh position={[0, 0.38, 0.022]}>
          <boxGeometry args={[0.018, 0.65, 0.005]} />
          <meshStandardMaterial color="#a8b0c0" metalness={0.95} roughness={0.05} />
        </mesh>

        {/* Cross-guard */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.28, 0.055, 0.055]} />
          <meshStandardMaterial color="#c8a020" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Grip */}
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[0.055, 0.28, 0.055]} />
          <meshStandardMaterial color="#4a2810" roughness={0.9} />
        </mesh>

        {/* Pommel */}
        <mesh position={[0, -0.34, 0]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#c8a020" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
