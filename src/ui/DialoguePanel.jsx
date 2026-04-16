import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

async function sendMessage(npcId, message, playerId) {
  const res = await fetch('/api/npc/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ npcId, message, playerId })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fetchPlayerData(playerId) {
  const res = await fetch(`/api/player/${playerId}`)
  if (!res.ok) return null
  return res.json()
}

export default function DialoguePanel() {
  const activeNPC = useGameStore(s => s.activeNPC)
  const isDialogueOpen = useGameStore(s => s.isDialogueOpen)
  const closeDialogue = useGameStore(s => s.closeDialogue)
  const dialogueHistory = useGameStore(s => s.dialogueHistory)
  const addDialogueMessage = useGameStore(s => s.addDialogueMessage)
  const isLoading = useGameStore(s => s.isLoading)
  const setLoading = useGameStore(s => s.setLoading)
  const applyActions = useGameStore(s => s.applyActions)
  const setPlayerData = useGameStore(s => s.setPlayerData)
  const playerId = useGameStore(s => s.playerId)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const messages = activeNPC ? (dialogueHistory[activeNPC.id] || []) : []

  // Add greeting when opening dialogue for first time
  useEffect(() => {
    if (isDialogueOpen && activeNPC) {
      const existing = dialogueHistory[activeNPC.id]
      if (!existing || existing.length === 0) {
        // Trigger opening greeting
        triggerGreeting()
      }
      // Focus input after short delay
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isDialogueOpen, activeNPC?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ESC to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isDialogueOpen) closeDialogue()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDialogueOpen, closeDialogue])

  async function triggerGreeting() {
    if (!activeNPC) return
    setLoading(true)
    try {
      const data = await sendMessage(activeNPC.id, '(The player approaches and greets you.)', playerId)
      addDialogueMessage(activeNPC.id, 'assistant', data.message)
      if (data.actions?.length) {
        applyActions(data.actions)
        const playerData = await fetchPlayerData(playerId)
        if (playerData) setPlayerData(playerData)
      }
    } catch (err) {
      addDialogueMessage(activeNPC.id, 'system', 'Could not reach the NPC. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading || !activeNPC) return

    setInput('')
    addDialogueMessage(activeNPC.id, 'user', text)
    setLoading(true)

    try {
      const data = await sendMessage(activeNPC.id, text, playerId)
      addDialogueMessage(activeNPC.id, 'assistant', data.message)
      if (data.actions?.length) {
        applyActions(data.actions)
        const playerData = await fetchPlayerData(playerId)
        if (playerData) setPlayerData(playerData)
      }
    } catch (err) {
      addDialogueMessage(activeNPC.id, 'system', 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    e.stopPropagation() // Prevent game keys from firing
  }

  if (!isDialogueOpen || !activeNPC) return null

  return (
    <div className="dialogue-overlay">
      <div className="dialogue-panel">
        <div className="dialogue-header">
          <span className="dialogue-npc-name">{activeNPC.name}</span>
          <button className="dialogue-close-btn" onClick={closeDialogue}>
            Close [ESC]
          </button>
        </div>

        <div className="dialogue-messages">
          {messages.length === 0 && !isLoading && (
            <div className="dialogue-msg system">
              <div className="bubble">Approaching {activeNPC.name}…</div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`dialogue-msg ${msg.role === 'user' ? 'player' : msg.role === 'assistant' ? 'npc' : 'system'}`}>
              {msg.role !== 'system' && (
                <span className="speaker">
                  {msg.role === 'user' ? 'You' : activeNPC.name}
                </span>
              )}
              <div className="bubble">{msg.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className="dialogue-msg npc">
              <span className="speaker">{activeNPC.name}</span>
              <div className="bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="dialogue-input-row">
          <input
            ref={inputRef}
            className="dialogue-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something…"
            disabled={isLoading}
            maxLength={300}
          />
          <button
            className="dialogue-send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
