# Whispering Vale

A 3D browser RPG where every NPC is powered by a large language model. Characters hold persistent memories, form opinions about the player, hand out quests, and reward completion. New areas of the world are procedurally generated mid-game whenever an NPC mentions an unexplored location in conversation.

**Play it live → [pekkinen.com/whispering-vale](https://pekkinen.com/whispering-vale/)**

---

## Features

- **Living NPCs** — Each character has a unique personality, backstory, speech style, and current situation defined in a JSON soul file. Conversations are driven by Claude (claude-sonnet-4-6) with a full agentic tool loop.
- **Persistent memory** — NPCs remember facts about the player across sessions using a `remember_fact` tool. Memories are stored in SQLite and injected into future conversations.
- **Quest system** — NPCs can issue and complete quests mid-conversation via `give_quest` / `complete_quest` tools. Rewards (gold, items) are applied to the player's inventory automatically.
- **Procedural world generation** — When an NPC mentions a named location that doesn't exist yet, a `discover_location` tool call triggers Claude to generate a full area spec (buildings, enemies, lore objects, area NPCs) which is rendered in the 3D world.
- **User accounts** — Username/password login with bcrypt-hashed passwords. Each player's progress (quests, gold, inventory, conversation history, discovered locations) is saved separately.
- **First-person 3D** — Built with React Three Fiber. Pointer-lock controls, jumping, sprinting, melee combat with an enemy registry, respawn system, and a minimap.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) + [@react-three/drei](https://github.com/pmndrs/drei) |
| State | Zustand |
| Backend | Node.js + Express |
| AI | Anthropic SDK (claude-sonnet-4-6) with tool use |
| Database | SQLite via better-sqlite3 |
| Auth | bcryptjs |
| Deployment | Fly.io (backend) + GitHub Pages (frontend) |

---

## Project Structure

```
server/
  index.js          # Express server, NPC agentic loop, location generation
  db/database.js    # SQLite schema & connection
  npcs/             # NPC soul files (JSON)
    elara.json      # Elara Moonwhisper — village elder, keeper of lore
    grom.json       # Grom Ironhide — blacksmith, war veteran
    mira.json       # Mira — ...

src/
  game/
    GameScene.jsx   # Root 3D scene
    Player.jsx      # First-person controller, combat, respawn
    Enemy.jsx       # Patrol/aggro AI, melee, loot drops
    GeneratedArea.jsx  # Renders procedurally generated locations
    World.jsx       # Village terrain and static objects
    NPCCharacter.jsx   # Animated NPC mesh with name label
    enemyRegistry.js   # Module-level enemy position map (avoids re-renders)
  ui/
    DialoguePanel.jsx  # Chat interface with NPC
    HUD.jsx            # HP bar, gold, notifications, controls
    QuestLog.jsx       # Active and completed quests
    MapPanel.jsx       # Canvas minimap with discovered locations
    InventoryPanel.jsx # Item grid
    LoginScreen.jsx    # Username/password auth
    StartScreen.jsx    # Game intro and controls
  stores/
    gameStore.js    # Zustand global state
  lib/
    api.js          # API_BASE from VITE_API_URL env var
```

---

## NPCs

The three village characters each have a distinct arc:

- **Elara Moonwhisper** — A three-century-old archmage keeping watch over a weakening seal. Speaks in archaic, poetic language and addresses the player as "young traveler."
- **Grom Ironhide** — A gruff blacksmith and sole survivor of the Iron Ravens regiment. Short sentences, forge metaphors, deep distrust of strangers that can be earned away.
- **Mira Sundale** — The warm-hearted innkeeper of the Silver Stag Inn. Talks in one long breath, calls everyone "love", and knows every piece of village gossip.

New NPCs are generated automatically when locations are discovered and registered into the live soul registry.

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/emilpekkinen/whispering-vale.git
cd whispering-vale

# 2. Install
npm install

# 3. Set your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 4. Start (runs Vite dev server + Express concurrently)
npm run dev
```

The frontend proxies `/api` to `localhost:3001` in development, so no `VITE_API_URL` is needed locally.

---

## Deploying

### Backend (Fly.io)

```bash
fly auth login
fly apps create whispering-vale-backend
fly volumes create game_data --region arn --size 1 --yes
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

Set `DB_PATH=/data/game.db` in Fly secrets to persist SQLite to the volume.

### Frontend (static)

```bash
VITE_API_URL=https://your-backend.fly.dev npm run build
# deploy dist/ to any static host
```

---

## Adding an NPC

Create a JSON file in `server/npcs/`:

```json
{
  "id": "aldric",
  "name": "Aldric the Wanderer",
  "description": "a mysterious traveller passing through",
  "personality": "...",
  "backstory": "...",
  "speechStyle": "...",
  "currentSituation": "...",
  "position": [5, 0, -12],
  "appearance": {
    "bodyColor": "#2c3e50",
    "headColor": "#f0d9b5",
    "robeColor": "#1a252f",
    "height": 1.8
  }
}
```

Restart the server — the NPC is immediately chattable in-game.

---

## License

MIT
