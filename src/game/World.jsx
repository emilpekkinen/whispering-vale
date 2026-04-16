import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Simple tree component
function Tree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 1.8, 6]} />
        <meshLambertMaterial color="#5d3a1a" />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.9, 2.4, 7]} />
        <meshLambertMaterial color="#2d5a27" />
      </mesh>
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[0.65, 1.9, 7]} />
        <meshLambertMaterial color="#3a6e32" />
      </mesh>
    </group>
  )
}

// Simple building
function Building({ position, size, color = '#8a7a6a', roofColor = '#6a4a3a' }) {
  const [w, h, d] = size
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h + 0.6, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.72, 1.4, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshLambertMaterial color={roofColor} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.7, d / 2 + 0.01]}>
        <boxGeometry args={[0.8, 1.4, 0.05]} />
        <meshLambertMaterial color="#3a2510" />
      </mesh>
    </group>
  )
}

// Stone well
function Well({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.75, 0.8, 10, 1, true]} />
        <meshLambertMaterial color="#8a8070" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.1, 10]} />
        <meshLambertMaterial color="#6a6060" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.08, 10]} />
        <meshLambertMaterial color="#9a9080" />
      </mesh>
      {/* Posts */}
      <mesh position={[-0.7, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 5]} />
        <meshLambertMaterial color="#5d3a1a" />
      </mesh>
      <mesh position={[0.7, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 5]} />
        <meshLambertMaterial color="#5d3a1a" />
      </mesh>
      {/* Crossbeam */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[1.5, 0.1, 0.1]} />
        <meshLambertMaterial color="#5d3a1a" />
      </mesh>
    </group>
  )
}

// Forge / anvil stand
function Forge({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2.5, 0.8, 1.5]} />
        <meshLambertMaterial color="#5a5050" />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[2, 0.2, 1]} />
        <meshLambertMaterial color="#3a3030" />
      </mesh>
      {/* Chimney effect */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 2.2, 8]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
    </group>
  )
}

// Ancient obelisk
function Obelisk({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.7, 3, 0.7]} />
        <meshLambertMaterial color="#706050" />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <coneGeometry args={[0.5, 0.9, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshLambertMaterial color="#908070" />
      </mesh>
    </group>
  )
}

// Path stones
function StonePath({ from, to, width = 1.5 }) {
  const dir = [to[0] - from[0], to[2] - from[2]]
  const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2)
  const angle = Math.atan2(dir[0], dir[1])
  const midX = (from[0] + to[0]) / 2
  const midZ = (from[2] + to[2]) / 2
  return (
    <mesh position={[midX, 0.01, midZ]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
      <planeGeometry args={[width, len]} />
      <meshLambertMaterial color="#8a7a6a" />
    </mesh>
  )
}

export default function World() {
  // Deterministic tree positions (no random so no re-renders)
  const treePlacements = useMemo(() => [
    [-25, 0, -25], [-30, 0, -10], [-28, 0, 12], [-22, 0, 28], [-18, 0, -30],
    [25, 0, -22], [30, 0, 5], [26, 0, 20], [22, 0, -8], [28, 0, -32],
    [-8, 0, 32], [5, 0, 35], [14, 0, 30], [-15, 0, 35], [20, 0, 32],
    [-32, 0, -28], [35, 0, -15], [32, 0, 28], [-35, 0, 18], [10, 0, -35],
    [-6, 0, -28], [18, 0, -25],
  ], [])

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color="#3d5c2a" />
      </mesh>

      {/* Village center dirt patch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[22, 32]} />
        <meshLambertMaterial color="#7a6545" />
      </mesh>

      {/* Stone paths */}
      <StonePath from={[0, 0, 5]} to={[0, 0, -20]} />
      <StonePath from={[0, 0, 5]} to={[18, 0, 8]} />
      <StonePath from={[0, 0, 5]} to={[-14, 0, 7]} />

      {/* Buildings */}
      {/* Inn */}
      <Building position={[0, 0, -22]} size={[11, 4.5, 9]} color="#9a8a70" roofColor="#704030" />
      {/* Blacksmith shop */}
      <Building position={[-18, 0, 6]} size={[7, 3.5, 5.5]} color="#7a6a58" roofColor="#5a4028" />
      {/* Elder's cottage */}
      <Building position={[22, 0, 8]} size={[6, 3.2, 5.5]} color="#8a7a68" roofColor="#6a5040" />
      {/* Extra houses */}
      <Building position={[-14, 0, -18]} size={[5.5, 3, 4.5]} color="#7a7060" roofColor="#603828" />
      <Building position={[15, 0, -20]} size={[5, 2.8, 4]} color="#888070" roofColor="#584030" />

      {/* Village well (center) */}
      <Well position={[0, 0, 0]} />

      {/* Forge near blacksmith */}
      <Forge position={[-13, 0, 3]} />

      {/* Ancient obelisk near Elara */}
      <Obelisk position={[20, 0, 4]} />

      {/* Trees */}
      {treePlacements.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}

      {/* Boundary fence posts */}
      {[-38, -30, -22, -14, -6, 2, 10, 18, 26, 34].map((x, i) => (
        <mesh key={`fp-n${i}`} position={[x, 0.6, 38]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 1.2, 5]} />
          <meshLambertMaterial color="#6a4a2a" />
        </mesh>
      ))}
    </>
  )
}
