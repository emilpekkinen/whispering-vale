import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './db/database.js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())
app.use(cors())

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY })

// ─── NPC SOUL REGISTRY ────────────────────────────────────────────────────────

const npcSouls = {}

function loadNPCsFromDir() {
  const npcsDir = join(__dirname, 'npcs')
  readdirSync(npcsDir).forEach(file => {
    if (file.endsWith('.json')) {
      const soul = JSON.parse(readFileSync(join(npcsDir, file), 'utf8'))
      npcSouls[soul.id] = soul
    }
  })
}
loadNPCsFromDir()

function loadLocationNPCsFromDB() {
  try {
    const db = getDb()
    const readyLocs = db.prepare("SELECT position_x, position_z, spec FROM locations WHERE status = 'ready' AND spec IS NOT NULL").all()
    for (const loc of readyLocs) {
      const spec = JSON.parse(loc.spec)
      for (const npc of (spec.npcs || [])) {
        registerLocationNPC(npc, loc.position_x, loc.position_z)
      }
    }
    console.log(`Loaded ${readyLocs.length} previously generated locations`)
  } catch (e) { /* DB may not have the table yet on first run */ }
}

function registerLocationNPC(npc, worldX, worldZ) {
  npcSouls[npc.id] = {
    ...npc,
    position: [worldX + (npc.position?.[0] || 0), 0, worldZ + (npc.position?.[1] || 0)],
    appearance: npc.appearance || { bodyColor: '#8a6a4a', headColor: '#c0956a', height: 1.8 }
  }
}

// ─── WORLD PLACEMENT ──────────────────────────────────────────────────────────

const AREA_DISTANCE = 110
const DIRECTION_BASES = {
  north:     [0,    -AREA_DISTANCE],
  south:     [0,     AREA_DISTANCE],
  east:      [ AREA_DISTANCE, 0],
  west:      [-AREA_DISTANCE, 0],
  northeast: [ AREA_DISTANCE * 0.72, -AREA_DISTANCE * 0.72],
  northwest: [-AREA_DISTANCE * 0.72, -AREA_DISTANCE * 0.72],
  southeast: [ AREA_DISTANCE * 0.72,  AREA_DISTANCE * 0.72],
  southwest: [-AREA_DISTANCE * 0.72,  AREA_DISTANCE * 0.72],
}

function directionToWorldPos(direction, db) {
  const base = DIRECTION_BASES[direction?.toLowerCase()] || [AREA_DISTANCE, 0]
  const existing = db.prepare('SELECT position_x, position_z FROM locations WHERE direction = ?').all(direction)
  // Offset each extra location in same direction by 40 units
  const shift = existing.length * 40
  return [base[0] + shift, base[1] + shift]
}

// ─── LOCATION GENERATION ──────────────────────────────────────────────────────

async function generateLocationSpec(locationId, input, worldPos, db) {
  const prompt = `You are a procedural game world generator for a dark fantasy RPG called "The Whispering Vale".

Generate a richly detailed game area based on this concept:
Name: ${input.name}
Type: ${input.type || 'unknown'}
Description: ${input.description}
Danger level: ${input.danger_level || 'moderate'}

Respond with ONLY valid JSON (no markdown fences, no explanation text). Use this exact structure:

{
  "lore_text": "Atmospheric 2-3 sentence description shown when the player first enters.",
  "ambience": "one of: normal, dark, mystical, tense, peaceful",
  "objects": [
    {
      "type": "ruin_pillar|ruin_wall|arch|tower|tent|campfire|altar|chest|barrel|crate|rock|hut|cave_mouth|statue|torch|fence_post|obelisk|gravestone",
      "position": [x, z],
      "rotation": 0.0,
      "scale": 1.0
    }
  ],
  "enemies": [
    {
      "type": "skeleton|shadow|wolf|bandit|golem|cultist|spider",
      "name": "Thematic display name",
      "count": 2,
      "hp": 30,
      "damage": 8,
      "speed": 2.0,
      "aggro_range": 10,
      "spawn_center": [x, z],
      "loot": ["item name"]
    }
  ],
  "npcs": [
    {
      "id": "unique_snake_case_id_prefixed_with_location",
      "name": "Full Name",
      "description": "brief one-line role",
      "personality": "personality traits, 1-2 sentences",
      "backstory": "2-3 sentence backstory tying them to this location",
      "speechStyle": "how they speak",
      "currentSituation": "what they need right now, what danger or opportunity they represent",
      "position": [x, z],
      "appearance": { "bodyColor": "#rrggbb", "headColor": "#rrggbb", "height": 1.8 }
    }
  ]
}

Design rules:
- All positions are LOCAL to the area center, range [-20, 20]
- Create 5-12 objects that strongly theme this location (ruins→pillars/altars, camp→tents/campfires, cave→rocks/torches)
- Enemy count by danger: safe=0 enemies, moderate=1-2 types (2-3 each), dangerous=2-3 types (3-4 each), deadly=3-4 types (4-5 each)
- Create 0-2 NPCs with compelling backstories — survivors, hermits, merchants, scholars, cultists (non-hostile)
- NPC IDs MUST be globally unique — prefix with the location name in snake_case
- Enemy loot = 1-2 thematic items per enemy type
- Make every element feel purposeful and connected to the lore_text`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = response.content.find(b => b.type === 'text')?.text || '{}'
    const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const spec = JSON.parse(jsonText)

    db.prepare("UPDATE locations SET spec = ?, status = 'ready' WHERE id = ?").run(JSON.stringify(spec), locationId)

    // Register any NPCs from this location
    for (const npc of (spec.npcs || [])) {
      registerLocationNPC(npc, worldPos[0], worldPos[1])
      console.log(`  ↳ Registered NPC: ${npc.name} (${npc.id})`)
    }

    console.log(`✓ Location "${input.name}" generated (${(spec.enemies || []).reduce((n, e) => n + e.count, 0)} enemies, ${(spec.npcs || []).length} NPCs)`)
  } catch (err) {
    console.error(`✗ Location generation failed for "${input.name}":`, err.message)
    db.prepare("UPDATE locations SET status = 'failed' WHERE id = ?").run(locationId)
  }
}

// ─── NPC TOOLS ────────────────────────────────────────────────────────────────

const NPC_TOOLS = [
  {
    name: 'give_quest',
    description: 'Give the player a new quest/task. Use when narratively appropriate. Do NOT give duplicate quests.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        objectives: { type: 'array', items: { type: 'string' } },
        reward_description: { type: 'string' },
        reward_gold: { type: 'number' },
        reward_items: { type: 'array', items: { type: 'string' } }
      },
      required: ['title', 'description', 'objectives', 'reward_description', 'reward_gold', 'reward_items']
    }
  },
  {
    name: 'complete_quest',
    description: 'Mark a quest as completed and grant the reward. Only use when the player credibly reports completion.',
    input_schema: {
      type: 'object',
      properties: {
        quest_id: { type: 'string' },
        completion_message: { type: 'string' }
      },
      required: ['quest_id', 'completion_message']
    }
  },
  {
    name: 'remember_fact',
    description: 'Store an important fact about this player for future conversations.',
    input_schema: {
      type: 'object',
      properties: {
        fact: { type: 'string' }
      },
      required: ['fact']
    }
  },
  {
    name: 'discover_location',
    description: 'Register a new named place in the world when you mention it for the first time. Use this the FIRST time you reference a specific named location outside the village (ruins, forest, pass, quarry, camp, etc.). Do NOT call it for the village itself or for locations already in your known list.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the place (e.g. "The Sunken Ruins", "Coldpeak Pass")' },
        description: { type: 'string', description: 'What kind of place it is and why it matters to your story (2-3 sentences)' },
        type: {
          type: 'string',
          enum: ['ruins', 'forest', 'cave', 'camp', 'mine', 'dungeon', 'settlement', 'pass', 'shrine', 'tower'],
          description: 'The type of location'
        },
        direction: {
          type: 'string',
          enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'],
          description: 'Rough direction from the village'
        },
        danger_level: {
          type: 'string',
          enum: ['safe', 'moderate', 'dangerous', 'deadly'],
          description: 'How dangerous this place is'
        }
      },
      required: ['name', 'description', 'type', 'direction', 'danger_level']
    }
  }
]

// ─── SYSTEM PROMPT BUILDER ────────────────────────────────────────────────────

function buildSystemPrompt(soul, memories, playerQuests, db) {
  const myActiveQuests = playerQuests.filter(q => q.status === 'active' && q.npc_id === soul.id)
  const myCompletedQuests = playerQuests.filter(q => q.status === 'completed' && q.npc_id === soul.id)
  const knownLocations = db.prepare('SELECT name, direction, type FROM locations WHERE discovered_by_npc = ?').all(soul.id)

  return `You are ${soul.name}, ${soul.description}.

## YOUR CHARACTER
**Personality:** ${soul.personality}
**Backstory:** ${soul.backstory}
**Speech style:** ${soul.speechStyle}
**Your current situation:** ${soul.currentSituation}

## WHAT YOU KNOW ABOUT THIS PLAYER
${memories.length > 0 ? memories.map(m => `- ${m}`).join('\n') : '- You have not met this player before.'}

## QUEST STATUS
${myActiveQuests.length > 0 ? `Active quests you gave:\n${myActiveQuests.map(q => `- [ID: ${q.id}] "${q.title}"`).join('\n')}` : 'No active quests.'}
${myCompletedQuests.length > 0 ? `\nCompleted quests:\n${myCompletedQuests.map(q => `- "${q.title}"`).join('\n')}` : ''}

## PLACES YOU'VE TOLD THE PLAYER ABOUT
${knownLocations.length > 0 ? knownLocations.map(l => `- "${l.name}" (${l.type}, to the ${l.direction})`).join('\n') : 'None yet.'}

## INSTRUCTIONS
- Stay completely in character. Never mention AI, LLMs, or game mechanics.
- Keep responses concise — 2-4 sentences normally, up to 6 for important moments.
- Use give_quest naturally when the player seems willing to help.
- Only use complete_quest when the player provides convincing completion evidence.
- Use remember_fact for genuinely important player information.
- Use discover_location the FIRST TIME you mention a specific named place outside the village. Check your known places list above to avoid duplicates.
- Do NOT give duplicate quests.`
}

// ─── TOOL PROCESSING ──────────────────────────────────────────────────────────

function processToolCall(toolName, input, npcId, playerId, db) {
  if (toolName === 'give_quest') {
    const questId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    db.prepare(`
      INSERT INTO quests (id, player_id, npc_id, title, description, objectives, reward_description, reward_gold, reward_items, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(questId, playerId, npcId, input.title, input.description,
      JSON.stringify(input.objectives || []), input.reward_description || '',
      input.reward_gold || 0, JSON.stringify(input.reward_items || []))
    return {
      type: 'quest_given',
      quest: {
        id: questId, npc_id: npcId, title: input.title, description: input.description,
        objectives: input.objectives || [], reward_description: input.reward_description,
        reward_gold: input.reward_gold || 0, reward_items: input.reward_items || [], status: 'active'
      }
    }
  }

  if (toolName === 'complete_quest') {
    const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND player_id = ?').get(input.quest_id, playerId)
    if (!quest) return { type: 'error', message: 'Quest not found' }
    db.prepare("UPDATE quests SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(quest.id)
    const rewardGold = quest.reward_gold || 0
    const rewardItems = JSON.parse(quest.reward_items || '[]')
    if (rewardGold > 0) {
      db.prepare('INSERT OR IGNORE INTO players (id, gold) VALUES (?, 0)').run(playerId)
      db.prepare('UPDATE players SET gold = gold + ? WHERE id = ?').run(rewardGold, playerId)
    }
    for (const item of rewardItems) {
      db.prepare('INSERT INTO inventory (player_id, item) VALUES (?, ?)').run(playerId, item)
    }
    return { type: 'quest_completed', questId: quest.id, questTitle: quest.title, rewardGold, rewardItems }
  }

  if (toolName === 'remember_fact') {
    db.prepare('INSERT INTO npc_memories (npc_id, player_id, memory) VALUES (?, ?, ?)').run(npcId, playerId, input.fact)
    return { type: 'memory_saved', fact: input.fact }
  }

  if (toolName === 'discover_location') {
    const locationId = `loc_${input.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32)}`

    // Idempotent — don't re-create if already exists
    const existing = db.prepare('SELECT id, name, status, position_x, position_z, direction FROM locations WHERE id = ?').get(locationId)
    if (existing) {
      return {
        type: 'location_discovered',
        location: { id: existing.id, name: existing.name, status: existing.status, position: [existing.position_x, existing.position_z], direction: existing.direction, alreadyKnown: true }
      }
    }

    const worldPos = directionToWorldPos(input.direction, db)

    db.prepare(`
      INSERT INTO locations (id, name, description, type, danger_level, direction, position_x, position_z, status, discovered_by_npc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generating', ?)
    `).run(locationId, input.name, input.description, input.type, input.danger_level, input.direction, worldPos[0], worldPos[1], npcId)

    console.log(`📍 New location discovered: "${input.name}" (${input.direction}) — generating...`)

    // Kick off async generation without blocking the chat response
    generateLocationSpec(locationId, input, worldPos, db).catch(console.error)

    return {
      type: 'location_discovered',
      location: {
        id: locationId, name: input.name, type: input.type,
        direction: input.direction, danger_level: input.danger_level,
        position: worldPos, status: 'generating'
      }
    }
  }

  return null
}

// ─── API ROUTES ───────────────────────────────────────────────────────────────

app.get('/api/npcs', (req, res) => {
  res.json(Object.values(npcSouls).map(n => ({
    id: n.id, name: n.name, position: n.position, appearance: n.appearance
  })))
})

app.get('/api/locations', (req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT id, name, description, type, danger_level, direction, position_x, position_z, status, spec, discovered_by_npc FROM locations ORDER BY created_at ASC').all()
  res.json(rows)
})

app.post('/api/npc/chat', async (req, res) => {
  const { npcId, message, playerId = 'player1' } = req.body
  if (!npcId || !message) return res.status(400).json({ error: 'npcId and message required' })

  const db = getDb()
  const soul = npcSouls[npcId]
  if (!soul) return res.status(404).json({ error: `NPC "${npcId}" not found` })

  db.prepare('INSERT OR IGNORE INTO players (id, gold) VALUES (?, 0)').run(playerId)

  const history = db.prepare(
    'SELECT role, content FROM conversations WHERE npc_id = ? AND player_id = ? ORDER BY created_at ASC LIMIT 40'
  ).all(npcId, playerId)

  const memories = db.prepare(
    'SELECT memory FROM npc_memories WHERE npc_id = ? AND player_id = ? ORDER BY created_at DESC LIMIT 10'
  ).all(npcId, playerId).map(r => r.memory)

  const playerQuests = db.prepare('SELECT * FROM quests WHERE player_id = ?').all(playerId)
  const systemPrompt = buildSystemPrompt(soul, memories, playerQuests, db)

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ]

  try {
    let assistantText = ''
    const actions = []
    let currentMessages = [...messages]

    for (let round = 0; round < 4; round++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        tools: NPC_TOOLS,
        messages: currentMessages
      })

      const textBlocks = response.content.filter(b => b.type === 'text')
      const toolBlocks = response.content.filter(b => b.type === 'tool_use')

      if (textBlocks.length > 0) {
        assistantText = textBlocks.map(b => b.text).join(' ').trim()
      }

      if (response.stop_reason === 'end_turn' || toolBlocks.length === 0) break

      const toolResults = []
      for (const block of toolBlocks) {
        const result = processToolCall(block.name, block.input, npcId, playerId, db)
        if (result) actions.push(result)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result || { success: true }) })
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      ]
    }

    db.prepare('INSERT INTO conversations (npc_id, player_id, role, content) VALUES (?, ?, ?, ?)').run(npcId, playerId, 'user', message)
    db.prepare('INSERT INTO conversations (npc_id, player_id, role, content) VALUES (?, ?, ?, ?)').run(npcId, playerId, 'assistant', assistantText)

    res.json({ message: assistantText, npcName: soul.name, actions })
  } catch (err) {
    console.error('LLM error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/player/:playerId', (req, res) => {
  const db = getDb()
  const { playerId } = req.params
  const isNew = !db.prepare('SELECT id FROM players WHERE id = ?').get(playerId)
  db.prepare('INSERT OR IGNORE INTO players (id, gold) VALUES (?, 0)').run(playerId)
  if (isNew) {
    db.prepare('INSERT INTO inventory (player_id, item) VALUES (?, ?)').run(playerId, 'Beginner Sword')
  }
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId)
  const inventory = db.prepare('SELECT item, obtained_at FROM inventory WHERE player_id = ? ORDER BY obtained_at DESC').all(playerId)
  const quests = db.prepare('SELECT * FROM quests WHERE player_id = ? ORDER BY created_at DESC').all(playerId).map(q => ({
    ...q, objectives: JSON.parse(q.objectives), reward_items: JSON.parse(q.reward_items)
  }))
  res.json({ ...player, inventory, quests })
})

app.delete('/api/player/:playerId', (req, res) => {
  const db = getDb()
  const { playerId } = req.params
  db.prepare('DELETE FROM conversations WHERE player_id = ?').run(playerId)
  db.prepare('DELETE FROM npc_memories WHERE player_id = ?').run(playerId)
  db.prepare('DELETE FROM quests WHERE player_id = ?').run(playerId)
  db.prepare('DELETE FROM inventory WHERE player_id = ?').run(playerId)
  db.prepare('DELETE FROM players WHERE id = ?').run(playerId)
  res.json({ success: true })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🗡  LLM NPC World — server on http://localhost:${PORT}`)
  console.log(`NPCs loaded: ${Object.keys(npcSouls).join(', ')}`)
  loadLocationNPCsFromDB()
})
