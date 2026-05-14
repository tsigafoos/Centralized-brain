import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
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

    let contextMessages = [...allMessages]
    let summaries: string[] = []
    let totalTokens = estimateTokens(JSON.stringify(contextMessages))

    // Iteratively summarize oldest messages until we fit within the limit
    while (totalTokens > maxContextSize && contextMessages.length > 1) {
      // Remove the oldest message and summarize it
      const removedMessage = contextMessages.shift()
      if (removedMessage) {
        const msgSummary = `User: "${removedMessage.content.substring(0, 50)}${removedMessage.content.length > 50 ? '...' : ''}"`
        summaries.unshift(msgSummary)
      }

      // Recalculate total tokens with remaining messages
      totalTokens = estimateTokens(JSON.stringify(contextMessages))
      summaries.forEach(s => {
        totalTokens += estimateTokens(s)
      })
    }

    const summary = summaries.length > 0
      ? `[Earlier messages: ${summaries.join(' → ')}]`
      : ''

    return { messages: contextMessages, summary }
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
                <button
                  className="convert-task-btn"
                  onClick={() => handleConvertToTask(msg.id, msg.content)}
                  title="Convert this response to a task"
                >
                  ➕ Add Task
                </button>
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
