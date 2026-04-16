import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

// Derive icon + type from item name
function getItemMeta(itemName) {
  const name = itemName.toLowerCase()
  if (name.includes('sword') || name.includes('blade') || name.includes('dagger'))
    return { icon: '⚔️', type: 'Weapon', color: '#c0c8d8' }
  if (name.includes('axe') || name.includes('hammer') || name.includes('mace'))
    return { icon: '🪓', type: 'Weapon', color: '#c0c8d8' }
  if (name.includes('bow') || name.includes('arrow'))
    return { icon: '🏹', type: 'Weapon', color: '#c0c8d8' }
  if (name.includes('shield') || name.includes('armor') || name.includes('helm'))
    return { icon: '🛡️', type: 'Armor', color: '#8ab0c8' }
  if (name.includes('potion') || name.includes('elixir') || name.includes('brew'))
    return { icon: '🧪', type: 'Consumable', color: '#a8c870' }
  if (name.includes('key'))
    return { icon: '🗝️', type: 'Key Item', color: '#f0d060' }
  if (name.includes('stone') || name.includes('ore') || name.includes('crystal'))
    return { icon: '💎', type: 'Material', color: '#90d8f0' }
  if (name.includes('wood') || name.includes('charcoal') || name.includes('log'))
    return { icon: '🪵', type: 'Material', color: '#c8a070' }
  if (name.includes('gold') || name.includes('coin'))
    return { icon: '🪙', type: 'Currency', color: '#f0d060' }
  if (name.includes('letter') || name.includes('note') || name.includes('scroll'))
    return { icon: '📜', type: 'Quest Item', color: '#e8d090' }
  return { icon: '📦', type: 'Misc', color: '#a09080' }
}

function ItemSlot({ item, index }) {
  const name = typeof item === 'string' ? item : item.item
  const { icon, type, color } = getItemMeta(name)

  return (
    <div className="inv-slot" title={name}>
      <div className="inv-slot-icon">{icon}</div>
      <div className="inv-slot-name" style={{ color }}>{name}</div>
      <div className="inv-slot-type">{type}</div>
    </div>
  )
}

function EmptySlot() {
  return <div className="inv-slot inv-slot-empty" />
}

export default function InventoryPanel() {
  const isInventoryOpen = useGameStore(s => s.isInventoryOpen)
  const toggleInventory = useGameStore(s => s.toggleInventory)
  const inventory = useGameStore(s => s.inventory)
  const gold = useGameStore(s => s.gold)

  // Ensure starter sword is always shown even if server hasn't confirmed it yet
  const items = inventory.length > 0
    ? inventory
    : [{ item: 'Beginner Sword' }]

  // Fill to a minimum grid (4 columns × rows, at least 12 slots shown)
  const GRID_COLS = 4
  const minSlots = Math.max(items.length, 12)
  const slots = Math.ceil(minSlots / GRID_COLS) * GRID_COLS

  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'i' || e.key === 'I') && isInventoryOpen) toggleInventory()
      if (e.key === 'Escape' && isInventoryOpen) toggleInventory()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isInventoryOpen, toggleInventory])

  if (!isInventoryOpen) return null

  return (
    <div className="inv-overlay">
      <div className="inv-panel">
        <div className="inv-header">
          <span className="inv-title">Inventory</span>
          <button className="inv-close-btn" onClick={toggleInventory}>Close [I]</button>
        </div>

        <div className="inv-gold-row">
          <span className="inv-gold">🪙 {gold} Gold</span>
          <span className="inv-count">{items.length} items</span>
        </div>

        <div
          className="inv-grid"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
        >
          {Array.from({ length: slots }).map((_, i) =>
            i < items.length
              ? <ItemSlot key={i} item={items[i]} index={i} />
              : <EmptySlot key={i} />
          )}
        </div>

        <div className="inv-footer">
          Items are gained by completing quests and exploring the world.
        </div>
      </div>
    </div>
  )
}
