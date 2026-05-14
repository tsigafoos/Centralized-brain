import { useState, useEffect } from 'react'
import BrainstormChat from './components/BrainstormChat'
import TaskPanel from './components/TaskPanel'
import SettingsPanel from './components/SettingsPanel'
import './App.css'

interface Task {
  id: string
  title: string
  success_criteria: string[]
  status: 'pending' | 'in_progress' | 'completed'
  priority: number
  created_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskPanelOpen, setTaskPanelOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [maxContextSize, setMaxContextSize] = useState(2000)
  const [backendUrl] = useState('http://localhost:9000')

  useEffect(() => {
    const savedContextSize = localStorage.getItem('maxContextSize')
    if (savedContextSize) {
      setMaxContextSize(parseInt(savedContextSize))
    }
  }, [])

  const handleContextSizeChange = (newSize: number) => {
    setMaxContextSize(newSize)
    localStorage.setItem('maxContextSize', newSize.toString())
  }

  const handleAddMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
  }

  const handleAddTask = (task: Task) => {
    setTasks(prev => {
      const updated = [...prev, task]
      return updated.sort((a, b) => b.priority - a.priority)
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, ...updates } : t)
    )
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>🧠 Centralized Brain</h1>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div className="main-content">
        <BrainstormChat
          messages={messages}
          onAddMessage={handleAddMessage}
          onAddTask={handleAddTask}
          maxContextSize={maxContextSize}
          backendUrl={backendUrl}
        />

        {taskPanelOpen && (
          <TaskPanel
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            onToggle={() => setTaskPanelOpen(false)}
          />
        )}

        {!taskPanelOpen && (
          <button
            className="expand-tasks-btn"
            onClick={() => setTaskPanelOpen(true)}
            title="Show task panel"
          >
            📋
          </button>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          maxContextSize={maxContextSize}
          onContextSizeChange={handleContextSizeChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
