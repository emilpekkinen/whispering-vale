import { create } from 'zustand'

function loadAuth() {
  try {
    const raw = localStorage.getItem('wv_auth')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const savedAuth = loadAuth()

export const useGameStore = create((set, get) => ({
  // Game state
  gameStarted: false,
  isAuthenticated: !!savedAuth,
  playerId: savedAuth?.playerId || 'player1',
  username: savedAuth?.username || null,

  // Player data (synced from server)
  gold: 0,
  inventory: [],
  quests: [],

  // Player world state (updated each frame for minimap)
  playerPosition: [0, 0, 8],
  playerFacing: 0, // radians

  // Player HP
  playerHp: 100,
  playerMaxHp: 100,
  isRespawning: false,

  // NPC world data
  npcs: [],

  // Generated locations
  locations: [],

  // Interaction state
  nearbyNPC: null,
  activeNPC: null,
  isDialogueOpen: false,

  // Dialogue
  dialogueHistory: {},   // { npcId: [{ role, content }] }
  isLoading: false,

  // Combat
  isAttacking: false,
  attackCooldown: false,

  // UI
  isQuestLogOpen: false,
  isMapOpen: false,
  isInventoryOpen: false,
  notification: null,    // { text, type } — for popups

  // Actions
  setGameStarted: (v) => set({ gameStarted: v }),

  setAuth: ({ playerId, username }) => {
    localStorage.setItem('wv_auth', JSON.stringify({ playerId, username }))
    set({ isAuthenticated: true, playerId, username })
  },

  logout: () => {
    localStorage.removeItem('wv_auth')
    set({ isAuthenticated: false, playerId: 'player1', username: null, gameStarted: false,
      gold: 0, inventory: [], quests: [], dialogueHistory: {}, locations: [], npcs: [] })
  },
  setNpcs: (npcs) => set({ npcs }),
  setNearbyNPC: (npc) => set({ nearbyNPC: npc }),
  setPlayerPosition: (pos, facing) => set({ playerPosition: pos, playerFacing: facing }),

  openDialogue: (npc) => set({
    activeNPC: npc,
    isDialogueOpen: true,
    isQuestLogOpen: false,
    isMapOpen: false,
    isInventoryOpen: false,
  }),

  closeDialogue: () => set({
    activeNPC: null,
    isDialogueOpen: false
  }),

  toggleQuestLog: () => set(s => ({
    isQuestLogOpen: !s.isQuestLogOpen,
    isDialogueOpen: s.isQuestLogOpen ? s.isDialogueOpen : false,
    isMapOpen: false,
    isInventoryOpen: false,
  })),

  toggleMap: () => set(s => ({
    isMapOpen: !s.isMapOpen,
    isDialogueOpen: false,
    isInventoryOpen: false,
    isQuestLogOpen: false,
  })),

  toggleInventory: () => set(s => ({
    isInventoryOpen: !s.isInventoryOpen,
    isDialogueOpen: false,
    isMapOpen: false,
    isQuestLogOpen: false,
  })),

  triggerAttack: () => {
    if (get().attackCooldown || get().isDialogueOpen) return
    set({ isAttacking: true, attackCooldown: true })
    setTimeout(() => set({ isAttacking: false }), 300)
    setTimeout(() => set({ attackCooldown: false }), 700)
  },

  setLocations: (locs) => set({ locations: locs }),

  upsertLocation: (loc) => set(s => ({
    locations: [...s.locations.filter(l => l.id !== loc.id), loc]
  })),

  damagePlayer: (amount) => {
    const s = useGameStore.getState()
    if (s.isRespawning) return
    const hp = Math.max(0, s.playerHp - amount)
    useGameStore.setState({ playerHp: hp })
    if (hp === 0) {
      useGameStore.setState({ isRespawning: true, notification: { text: 'You have fallen...', type: 'system' } })
      setTimeout(() => {
        useGameStore.setState({ playerHp: 100, isRespawning: false, notification: { text: 'You awaken back in the village.', type: 'system' } })
      }, 2500)
    }
  },

  addLootItem: (item) => set(s => ({
    inventory: [...s.inventory, { item, obtained_at: new Date().toISOString() }]
  })),

  showNotification: (text, type = 'quest') => set({ notification: { text, type } }),

  addDialogueMessage: (npcId, role, content) => set(s => ({
    dialogueHistory: {
      ...s.dialogueHistory,
      [npcId]: [...(s.dialogueHistory[npcId] || []), { role, content, id: Date.now() }]
    }
  })),

  setLoading: (v) => set({ isLoading: v }),

  setPlayerData: (data) => set(s => ({
    gold: data.gold || 0,
    // Merge server inventory with any pre-existing local items (e.g. starter sword)
    inventory: data.inventory?.length > 0 ? data.inventory : s.inventory,
    quests: data.quests || []
  })),

  applyActions: (actions) => {
    for (const action of actions) {
      if (action.type === 'quest_given') {
        set(s => ({
          quests: [...s.quests, action.quest],
          notification: { text: `New quest: ${action.quest.title}`, type: 'quest' }
        }))
      } else if (action.type === 'quest_completed') {
        set(s => ({
          quests: s.quests.map(q =>
            q.id === action.questId ? { ...q, status: 'completed' } : q
          ),
          gold: s.gold + (action.rewardGold || 0),
          inventory: action.rewardItems?.length > 0
            ? [...s.inventory, ...action.rewardItems.map(item => ({ item }))]
            : s.inventory,
          notification: {
            text: `Quest complete! +${action.rewardGold || 0} gold${action.rewardItems?.length ? ` +${action.rewardItems.join(', ')}` : ''}`,
            type: 'reward'
          }
        }))
      } else if (action.type === 'location_discovered' && !action.location?.alreadyKnown) {
        set(s => ({
          locations: [...s.locations.filter(l => l.id !== action.location.id), action.location],
          notification: {
            text: `New place discovered: ${action.location.name} (${action.location.direction})`,
            type: 'location'
          }
        }))
      }
    }
  },

  clearNotification: () => set({ notification: null })
}))
