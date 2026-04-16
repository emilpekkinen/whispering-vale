import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../stores/gameStore'
import { enemyRegistry, ATTACK_DAMAGE, ATTACK_RANGE } from './enemyRegistry'

const SPEED          = 6
const SPRINT_SPEED   = 11
const INTERACTION_RADIUS = 5
const PLAYER_HEIGHT  = 1.7
const JUMP_FORCE     = 9
const GRAVITY        = -22

const keys = {}

function attackNearestEnemy(cameraPos) {
  let nearest = null
  let minDist  = ATTACK_RANGE
  for (const [, data] of enemyRegistry) {
    const ep   = data.getPosition()
    const dx   = cameraPos.x - ep[0]
    const dz   = cameraPos.z - ep[1]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < minDist) { minDist = dist; nearest = data }
  }
  nearest?.takeDamage(ATTACK_DAMAGE)
}

export default function Player() {
  const { camera } = useThree()
  const controlsRef = useRef()

  const isDialogueOpen  = useGameStore(s => s.isDialogueOpen)
  const isQuestLogOpen  = useGameStore(s => s.isQuestLogOpen)
  const isMapOpen       = useGameStore(s => s.isMapOpen)
  const isInventoryOpen = useGameStore(s => s.isInventoryOpen)
  const isRespawning    = useGameStore(s => s.isRespawning)
  const npcs            = useGameStore(s => s.npcs)
  const setNearbyNPC    = useGameStore(s => s.setNearbyNPC)
  const openDialogue    = useGameStore(s => s.openDialogue)
  const triggerAttack   = useGameStore(s => s.triggerAttack)
  const toggleMap       = useGameStore(s => s.toggleMap)
  const toggleInventory = useGameStore(s => s.toggleInventory)
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition)

  const verticalVelocity = useRef(0)
  const isOnGround       = useRef(true)
  const forward  = useRef(new THREE.Vector3())
  const right    = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 8)
  }, [camera])

  // Respawn — teleport back to village
  useEffect(() => {
    if (isRespawning) {
      controlsRef.current?.unlock()
      setTimeout(() => {
        camera.position.set(0, PLAYER_HEIGHT, 8)
        verticalVelocity.current = 0
        isOnGround.current = true
      }, 1200)
    }
  }, [isRespawning, camera])

  useEffect(() => {
    const onKeyDown = (e) => {
      keys[e.code] = true
      if (e.code === 'KeyE' && !isDialogueOpen) {
        const nearby = useGameStore.getState().nearbyNPC
        if (nearby) { controlsRef.current?.unlock(); openDialogue(nearby) }
      }
      if (e.code === 'KeyM') toggleMap()
      if (e.code === 'KeyI') toggleInventory()
    }
    const onKeyUp = (e) => { keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isDialogueOpen, openDialogue, toggleMap, toggleInventory])

  // Left click — swing sword + hit nearest enemy
  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.button === 0 && controlsRef.current?.isLocked) {
        triggerAttack()
        attackNearestEnemy(camera.position)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [triggerAttack, camera])

  const anyUIOpen = isDialogueOpen || isQuestLogOpen || isMapOpen || isInventoryOpen
  useEffect(() => {
    if (anyUIOpen) controlsRef.current?.unlock()
  }, [anyUIOpen])

  useFrame((_, delta) => {
    if (isRespawning) return
    const isLocked = controlsRef.current?.isLocked
    if (!isLocked) return

    const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? SPRINT_SPEED : SPEED

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, new THREE.Vector3(0, 1, 0)).normalize()

    direction.current.set(0, 0, 0)
    if (keys['KeyW'] || keys['ArrowUp'])    direction.current.addScaledVector(forward.current, 1)
    if (keys['KeyS'] || keys['ArrowDown'])  direction.current.addScaledVector(forward.current, -1)
    if (keys['KeyA'] || keys['ArrowLeft'])  direction.current.addScaledVector(right.current, -1)
    if (keys['KeyD'] || keys['ArrowRight']) direction.current.addScaledVector(right.current, 1)

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize()
      camera.position.addScaledVector(direction.current, speed * delta)
    }

    // Jump + gravity
    if (keys['Space'] && isOnGround.current) {
      verticalVelocity.current = JUMP_FORCE
      isOnGround.current = false
    }
    verticalVelocity.current += GRAVITY * delta
    camera.position.y += verticalVelocity.current * delta
    if (camera.position.y <= PLAYER_HEIGHT) {
      camera.position.y = PLAYER_HEIGHT
      verticalVelocity.current = 0
      isOnGround.current = true
    }

    // World boundary — expand for generated areas
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -155, 155)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -155, 155)

    // Minimap
    const facing = Math.atan2(forward.current.x, forward.current.z)
    setPlayerPosition([camera.position.x, camera.position.y, camera.position.z], facing)

    // NPC proximity (village + area NPCs all in store)
    let closest = null
    let minDist = INTERACTION_RADIUS
    for (const npc of npcs) {
      const dx = camera.position.x - npc.position[0]
      const dz = camera.position.z - npc.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < minDist) { minDist = dist; closest = npc }
    }
    setNearbyNPC(closest)
  })

  return <PointerLockControls ref={controlsRef} selector="#game-canvas" />
}
