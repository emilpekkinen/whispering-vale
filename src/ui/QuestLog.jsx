import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

function QuestCard({ quest, npcName }) {
  const isCompleted = quest.status === 'completed'

  return (
    <div className={`quest-card ${isCompleted ? 'completed' : ''}`}>
      <div className="quest-card-title">
        <span className="status-icon">{isCompleted ? '✓' : '◈'}</span>
        {quest.title}
      </div>
      <div className="quest-card-giver">Given by {npcName || quest.npc_id}</div>
      <div className="quest-card-desc">{quest.description}</div>

      <div className="quest-objectives">
        {quest.objectives.map((obj, i) => (
          <div key={i} className="quest-objective">{obj}</div>
        ))}
      </div>

      <div className="quest-reward">
        {isCompleted ? '✓ Completed' : `Reward: ${quest.reward_description}`}
        {!isCompleted && quest.reward_gold > 0 && ` · ${quest.reward_gold} gold`}
        {!isCompleted && quest.reward_items?.length > 0 && ` · ${quest.reward_items.join(', ')}`}
      </div>
    </div>
  )
}

export default function QuestLog() {
  const isQuestLogOpen = useGameStore(s => s.isQuestLogOpen)
  const toggleQuestLog = useGameStore(s => s.toggleQuestLog)
  const quests = useGameStore(s => s.quests)
  const npcs = useGameStore(s => s.npcs)

  // Q key toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        if (!useGameStore.getState().isDialogueOpen) {
          toggleQuestLog()
        }
      }
      if (e.key === 'Escape' && isQuestLogOpen) {
        toggleQuestLog()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isQuestLogOpen, toggleQuestLog])

  if (!isQuestLogOpen) return null

  const activeQuests = quests.filter(q => q.status === 'active')
  const completedQuests = quests.filter(q => q.status === 'completed')

  const npcNameMap = Object.fromEntries(npcs.map(n => [n.id, n.name]))

  return (
    <div className="quest-log-overlay">
      <div className="quest-log-panel">
        <div className="quest-log-header">
          <span className="quest-log-title">Quest Log</span>
          <button className="quest-log-close" onClick={toggleQuestLog}>
            Close [Q]
          </button>
        </div>

        <div className="quest-log-body">
          {/* Active quests */}
          <div className="quest-section-title">
            Active — {activeQuests.length}
          </div>
          {activeQuests.length === 0 ? (
            <div className="no-quests">No active quests.<br />Speak with the villagers to begin.</div>
          ) : (
            activeQuests.map(q => (
              <QuestCard key={q.id} quest={q} npcName={npcNameMap[q.npc_id]} />
            ))
          )}

          {/* Completed quests */}
          {completedQuests.length > 0 && (
            <>
              <div className="quest-section-title" style={{ marginTop: 24 }}>
                Completed — {completedQuests.length}
              </div>
              {completedQuests.map(q => (
                <QuestCard key={q.id} quest={q} npcName={npcNameMap[q.npc_id]} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
