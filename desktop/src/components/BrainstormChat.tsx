import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { synthesizeVoice, playAudioBlob, stopAudio } from '../services/voice'
import './BrainstormChat.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isSummary?: boolean
}

interface Task {
  id: string
  title: string
  success_criteria: string[]
  status: 'pending' | 'in_progress' | 'completed'
  priority: number
  created_at: string
}

interface Props {
  messages: Message[]
  onAddMessage: (message: Message) => void
  onAddTask: (task: Task) => void
  maxContextSize: number
  backendUrl: string
}

const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4)
}

export default function BrainstormChat({
  messages,
  onAddMessage,
  onAddTask,
  maxContextSize,
  backendUrl,
}: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>(messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [synthesizingVoiceId, setSynthesizingVoiceId] = useState<string | null>(null)

  useEffect(() => {
    setLocalMessages(messages)
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const buildContextWindow = (allMessages: Message[]): { messages: Message[]; summary: string } => {
    if (allMessages.length === 0) {
      return { messages: [], summary: '' }
    }

    const KEEP_RECENT = 6
    let summary = ''

    // Start with last 6 messages (guaranteed)
    let recentMessages = allMessages.slice(Math.max(0, allMessages.length - KEEP_RECENT))
    let usedTokens = estimateTokens(JSON.stringify(recentMessages))
    let availableTokens = maxContextSize - usedTokens

    // If we have older messages, try to fit them (summarized) in remaining space
    const olderMessages = allMessages.slice(0, Math.max(0, allMessages.length - KEEP_RECENT))
    let summarized: string[] = []

    if (olderMessages.length > 0 && availableTokens > 100) {
      // Try to summarize and fit older messages
      for (let i = olderMessages.length - 1; i >= 0; i--) {
        const msg = olderMessages[i]
        const role = msg.role === 'user' ? 'User' : 'Assistant'
        const preview = msg.content.substring(0, 40)
        const msgSummary = `${role}: "${preview}${msg.content.length > 40 ? '...' : ''}"`
        const summaryTokens = estimateTokens(msgSummary)

        if (summaryTokens <= availableTokens) {
          summarized.unshift(msgSummary)
          availableTokens -= summaryTokens
        }
      }

      if (summarized.length > 0) {
        summary = `[Earlier: ${summarized.join(' | ')}]`
      }
    }

    // If recent messages exceed limit (shouldn't happen but handle it), shrink from oldest recent
    while (usedTokens > maxContextSize && recentMessages.length > 1) {
      recentMessages.shift()
      usedTokens = estimateTokens(JSON.stringify(recentMessages))
    }

    return { messages: recentMessages, summary }
  }

  const generateSummary = (msgs: Message[]): string => {
    if (msgs.length === 0) return ''
    const userMessages = msgs.filter(m => m.role === 'user').map(m => m.content).join('; ')
    return `[Earlier conversation summary: User discussed: ${userMessages.substring(0, 200)}...]`
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...localMessages, userMessage]
    setLocalMessages(updatedMessages)
    onAddMessage(userMessage)
    setInput('')
    setLoading(true)

    try {
      const { messages: contextMessages, summary } = buildContextWindow(updatedMessages)

      // Build conversation history with summary prepended if needed
      const conversationHistory = []

      if (summary) {
        conversationHistory.push({
          role: 'system' as const,
          content: summary,
        })
      }

      // Add all context messages (these already exclude summarized ones)
      contextMessages.forEach(m => {
        conversationHistory.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })
      })

      const response = await fetch(`${backendUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          max_tokens: 512,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      const assistantContent = data.choices?.[0]?.message?.content || 'No response'

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      }

      setLocalMessages(prev => [...prev, assistantMessage])
      onAddMessage(assistantMessage)
    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
      }
      setLocalMessages(prev => [...prev, errorMessage])
      onAddMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVoicePlayback = async (messageId: string, content: string) => {
    try {
      if (playingVoiceId === messageId) {
        stopAudio()
        setPlayingVoiceId(null)
        return
      }

      setSynthesizingVoiceId(messageId)
      const audioBlob = await synthesizeVoice(content, backendUrl)
      setSynthesizingVoiceId(null)

      if (audioBlob) {
        setPlayingVoiceId(messageId)
        await playAudioBlob(audioBlob)
        setPlayingVoiceId(null)
      }
    } catch (error) {
      console.error('Voice playback error:', error)
      setSynthesizingVoiceId(null)
    }
  }

  const handleConvertToTask = (messageId: string, content: string) => {
    const task: Task = {
      id: uuidv4(),
      title: content.substring(0, 100),
      success_criteria: [],
      status: 'pending',
      priority: 1,
      created_at: new Date().toISOString(),
    }
    onAddTask(task)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-container">
      <div className="messages-area">
        {localMessages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🧠</div>
            <h2>Start Brainstorming</h2>
            <p>Type your thoughts, ideas, or tasks below to begin</p>
          </div>
        )}

        {localMessages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.role}`}
            onMouseEnter={() => setHoveredMessageId(msg.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.isSummary && <div className="summary-badge">Summary</div>}
              <p>{msg.content}</p>
              {msg.role === 'assistant' && hoveredMessageId === msg.id && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    className="convert-task-btn"
                    onClick={() => handleVoicePlayback(msg.id, msg.content)}
                    disabled={synthesizingVoiceId === msg.id}
                    title="Play AI response as voice"
                    style={{
                      flex: 1,
                      background:
                        playingVoiceId === msg.id ? '#f44336' : '#4CAF50',
                    }}
                  >
                    {synthesizingVoiceId === msg.id
                      ? '🔊 Generating...'
                      : playingVoiceId === msg.id
                      ? '⏸ Stop'
                      : '🔊 Play Voice'}
                  </button>
                  <button
                    className="convert-task-btn"
                    onClick={() => handleConvertToTask(msg.id, msg.content)}
                    title="Convert this response to a task"
                  >
                    ➕ Add Task
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your thoughts or questions... (Shift+Enter for new line)"
          disabled={loading}
          className="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="send-btn"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
