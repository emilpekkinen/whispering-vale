import { useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'

// The map viewport covers a larger area now that world extends to ±155
const WORLD_HALF = 160
const MAP_SIZE   = 500
const SCALE      = MAP_SIZE / (WORLD_HALF * 2)

function worldToMap(wx, wz) {
  return [
    (wx + WORLD_HALF) * SCALE,
    (wz + WORLD_HALF) * SCALE
  ]
}

const BUILDINGS = [
  [0,   -22, 11, 9,  'Inn'],
  [-18,  6,   7, 5.5, 'Smithy'],
  [22,   8,   6, 5.5, 'Elder'],
  [-14, -18, 5.5, 4.5, ''],
  [15,  -20,  5,  4,  ''],
]

const DANGER_COLORS = {
  safe:       '#40c040',
  moderate:   '#e0a020',
  dangerous:  '#e04020',
  deadly:     '#c000c0',
}

const TYPE_ICONS = {
  ruins: '🏛', forest: '🌲', cave: '🕳', camp: '⛺', mine: '⛏',
  dungeon: '☠', settlement: '🏘', pass: '⛰', shrine: '✨', tower: '🗼',
}

function drawMap(ctx, playerPos, playerFacing, npcs, locations) {
  const W = MAP_SIZE
  ctx.clearRect(0, 0, W, W)

  // Background
  ctx.fillStyle = '#1a1408'
  ctx.fillRect(0, 0, W, W)

  // Ground
  ctx.fillStyle = '#2d4020'
  ctx.fillRect(0, 0, W, W)

  // Village center dirt
  const [cx, cz] = worldToMap(0, 0)
  ctx.beginPath()
  ctx.arc(cx, cz, 22 * SCALE, 0, Math.PI * 2)
  ctx.fillStyle = '#5a4830'
  ctx.fill()

  // Stone paths
  ctx.strokeStyle = '#7a6a58'
  ctx.lineWidth = 1.5 * SCALE
  ctx.lineCap = 'round'
  ;[[0,5,0,-20],[0,5,18,8],[0,5,-14,7]].forEach(([x1,z1,x2,z2]) => {
    const [ax,ay] = worldToMap(x1,z1)
    const [bx,by] = worldToMap(x2,z2)
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke()
  })

  // Trees
  ;[[-25,-25],[-30,-10],[-28,12],[-22,28],[-18,-30],[25,-22],[30,5],[26,20],[22,-8],[28,-32],
    [-8,32],[5,35],[14,30],[-15,35],[20,32],[-32,-28],[35,-15],[32,28],[-35,18],[10,-35]]
    .forEach(([tx,tz]) => {
      const [px,py] = worldToMap(tx,tz)
      ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2)
      ctx.fillStyle = '#2d5a27'; ctx.fill()
    })

  // Buildings
  BUILDINGS.forEach(([bx,bz,bw,bd,label]) => {
    const [mx,mz] = worldToMap(bx-bw/2, bz-bd/2)
    ctx.fillStyle = '#6a5840'; ctx.strokeStyle = '#8a7860'; ctx.lineWidth = 1
    ctx.fillRect(mx,mz,bw*SCALE,bd*SCALE); ctx.strokeRect(mx,mz,bw*SCALE,bd*SCALE)
    if (label) {
      const [lx,lz] = worldToMap(bx,bz)
      ctx.fillStyle = 'rgba(220,190,120,0.55)'; ctx.font = `${7}px Georgia`
      ctx.textAlign = 'center'; ctx.fillText(label, lx, lz+3)
    }
  })

  // ── Generated Locations ─────────────────────────────────────────────────
  for (const loc of locations) {
    if (!loc.position_x && loc.position_x !== 0) continue
    const [lx, lz] = worldToMap(loc.position_x, loc.position_z)
    const isReady = loc.status === 'ready'
    const dc = DANGER_COLORS[loc.danger_level] || '#888'

    // Area circle
    ctx.beginPath()
    ctx.arc(lx, lz, 12 * SCALE, 0, Math.PI * 2)
    ctx.fillStyle = isReady
      ? `${dc}28`
      : 'rgba(100,100,100,0.12)'
    ctx.fill()
    ctx.strokeStyle = isReady ? dc : 'rgba(150,150,150,0.5)'
    ctx.lineWidth = isReady ? 1.5 : 1
    ctx.setLineDash(isReady ? [] : [3, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Icon dot
    ctx.beginPath()
    ctx.arc(lx, lz, 4, 0, Math.PI * 2)
    ctx.fillStyle = isReady ? dc : '#666'
    ctx.fill()

    // Name label
    ctx.fillStyle = isReady ? 'rgba(255,200,100,0.85)' : 'rgba(160,160,160,0.6)'
    ctx.font = `${isReady ? 'bold ' : ''}8px Georgia`
    ctx.textAlign = 'center'
    ctx.fillText(loc.name, lx, lz - 7)

    if (!isReady) {
      ctx.fillStyle = 'rgba(150,150,150,0.5)'
      ctx.font = '7px Georgia'
      ctx.fillText('generating…', lx, lz + 12)
    }
  }

  // ── Village NPCs ────────────────────────────────────────────────────────
  npcs.forEach(npc => {
    const [nx, nz] = worldToMap(npc.position[0], npc.position[2])
    ctx.beginPath(); ctx.arc(nx,nz,4,0,Math.PI*2)
    ctx.fillStyle = npc.appearance.bodyColor; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = 'rgba(240,208,96,0.85)'; ctx.font = '8px Georgia'; ctx.textAlign = 'center'
    ctx.fillText(npc.name.split(' ')[0], nx, nz-7)
  })

  // ── Player arrow ────────────────────────────────────────────────────────
  const [px, pz] = worldToMap(playerPos[0], playerPos[2])
  ctx.save()
  ctx.translate(px, pz)
  ctx.rotate(playerFacing)
  ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(5,6); ctx.lineTo(0,3); ctx.lineTo(-5,6); ctx.closePath()
  ctx.fillStyle = '#f0d060'; ctx.fill()
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke()
  ctx.restore()

  // Player range ring
  ctx.beginPath(); ctx.arc(px,pz,5*SCALE,0,Math.PI*2)
  ctx.strokeStyle = 'rgba(240,208,96,0.18)'; ctx.lineWidth = 1; ctx.stroke()

  // Compass
  ctx.fillStyle = 'rgba(240,208,96,0.6)'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'
  ctx.fillText('N',W/2,13); ctx.fillText('S',W/2,W-3)
  ctx.fillText('W',7,W/2+4); ctx.fillText('E',W-7,W/2+4)

  // Border
  ctx.strokeStyle = 'rgba(200,160,60,0.4)'; ctx.lineWidth = 2
  ctx.strokeRect(1,1,W-2,W-2)
}

export default function MapPanel() {
  const isMapOpen      = useGameStore(s => s.isMapOpen)
  const toggleMap      = useGameStore(s => s.toggleMap)
  const playerPosition = useGameStore(s => s.playerPosition)
  const playerFacing   = useGameStore(s => s.playerFacing)
  const npcs           = useGameStore(s => s.npcs)
  const locations      = useGameStore(s => s.locations)
  const canvasRef      = useRef()

  // Redraw every render when open
  useEffect(() => {
    if (!isMapOpen || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    drawMap(ctx, playerPosition, playerFacing, npcs, locations)
  })

  useEffect(() => {
    const h = (e) => {
      if ((e.key === 'm' || e.key === 'M' || e.key === 'Escape') && isMapOpen) toggleMap()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isMapOpen, toggleMap])

  if (!isMapOpen) return null

  const readyLocs = locations.filter(l => l.status === 'ready')
  const genLocs   = locations.filter(l => l.status === 'generating')

  return (
    <div className="map-overlay" onClick={toggleMap}>
      <div className="map-panel" onClick={e => e.stopPropagation()}>
        <div className="map-header">
          <span className="map-title">The Whispering Vale</span>
          <button className="map-close-btn" onClick={toggleMap}>Close [M]</button>
        </div>
        <canvas ref={canvasRef} width={MAP_SIZE} height={MAP_SIZE} className="map-canvas" />
        <div className="map-legend">
          <span className="legend-item"><span style={{color:'#f0d060'}}>▲</span> You</span>
          {locations.length > 0 && (
            <>
              <span className="legend-item"><span style={{color:'#e0a020'}}>●</span> Area ({readyLocs.length} ready{genLocs.length > 0 ? `, ${genLocs.length} generating` : ''})</span>
            </>
          )}
          <span className="legend-item" style={{opacity:0.5, fontSize:11}}>
            Speak with NPCs to discover new areas
          </span>
        </div>
      </div>
    </div>
  )
}
