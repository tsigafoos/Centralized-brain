import axios from 'axios'
import { Message, Task, ModelInfo } from '../types'

let backendUrl = 'http://localhost:9000'

export const setBackendUrl = (url: string) => {
  backendUrl = url
}

export const getBackendUrl = () => backendUrl

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get(`${backendUrl}/health`)
    return response.data
  } catch (error) {
    throw new Error(`Backend not reachable at ${backendUrl}`)
  }
}

// Chat completions
export const chatCompletions = async (
  messages: Array<{ role: string; content: string }>,
  maxTokens = 512,
  temperature = 0.7
) => {
  const response = await api.post(`${backendUrl}/v1/chat/completions`, {
    messages,
    max_tokens: maxTokens,
    temperature,
  })
  return response.data.choices[0].message.content
}

// List models
export const listModels = async (): Promise<ModelInfo[]> => {
  const response = await api.get(`${backendUrl}/v1/models`)
  return response.data.data
}

// Load model
export const loadModel = async (modelId: string) => {
  const response = await api.post(`${backendUrl}/v1/models/${modelId}/load`)
  return response.data
}

// Unload model
export const unloadModel = async () => {
  const response = await api.post(`${backendUrl}/v1/models/unload`)
  return response.data
}

// Create task
export const createTask = async (title: string, successCriteria: string[] = []) => {
  const response = await api.post(`${backendUrl}/task`, {
    title,
    success_criteria: successCriteria,
  })
  return response.data
}

// List tasks
export const listTasks = async (): Promise<Task[]> => {
  const response = await api.get(`${backendUrl}/task`)
  return response.data
}

// Create session
export const createSession = async (title: string, deviceOrigin: string) => {
  const response = await api.post(`${backendUrl}/session`, {
    title,
    device_origin: deviceOrigin,
  })
  return response.data
}

// List sessions
export const listSessions = async () => {
  const response = await api.get(`${backendUrl}/session`)
  return response.data
}
