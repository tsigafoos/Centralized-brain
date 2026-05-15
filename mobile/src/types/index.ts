export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Task {
  id: string
  title: string
  success_criteria: string[]
  status: 'pending' | 'in_progress' | 'completed'
  priority: number
  created_at: string
}

export interface BrainstormSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  status: 'active' | 'archived'
  device_origin: string
}

export interface ModelInfo {
  id: string
  name: string
  size_mb: number
  loaded: boolean
}

export interface SettingsState {
  backendUrl: string
  maxContextSize: number
  voiceBackend: 'local' | 'google'
}
