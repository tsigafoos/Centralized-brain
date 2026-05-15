import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import { Message } from '../types'
import { chatCompletions, createTask } from '../services/api'
import { startRecording, stopRecording, initAudio, synthesizeVoice, playAudio, stopAudio } from '../services/voice'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  message: {
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  messageUser: {
    justifyContent: 'flex-end',
  },
  messageAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 8,
  },
  bubbleUser: {
    backgroundColor: '#4CAF50',
  },
  bubbleAssistant: {
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#fff',
  },
  textAssistant: {
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#f44336',
  },
})

interface BrainstormScreenProps {
  onTaskCreated?: (task: any) => void
}

export const BrainstormScreen: React.FC<BrainstormScreenProps> = ({
  onTaskCreated,
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [voiceSynthesizing, setVoiceSynthesizing] = useState<string | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    initAudio()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }

  const buildContextWindow = (allMessages: Message[]) => {
    if (allMessages.length === 0) {
      return { messages: [], summary: '' }
    }

    const KEEP_RECENT = 6
    let summary = ''

    let recentMessages = allMessages.slice(
      Math.max(0, allMessages.length - KEEP_RECENT)
    )
    let usedTokens = estimateTokens(JSON.stringify(recentMessages))
    let availableTokens = 2000 - usedTokens

    const olderMessages = allMessages.slice(
      0,
      Math.max(0, allMessages.length - KEEP_RECENT)
    )
    let summarized: string[] = []

    if (olderMessages.length > 0 && availableTokens > 100) {
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

    return { messages: recentMessages, summary }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    scrollToBottom()

    try {
      const { messages: contextMessages, summary } =
        buildContextWindow(updatedMessages)
      const conversationHistory = []

      if (summary) {
        conversationHistory.push({
          role: 'system',
          content: summary,
        })
      }

      contextMessages.forEach((m) => {
        conversationHistory.push({
          role: m.role,
          content: m.content,
        })
      })

      const response = await chatCompletions(conversationHistory)

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      scrollToBottom()
    } catch (error) {
      Alert.alert('Error', `Failed to get response: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = async () => {
    try {
      if (!recording) {
        await startRecording()
        setRecording(true)
      } else {
        const uri = await stopRecording()
        setRecording(false)

        if (uri) {
          // TODO: Implement speech-to-text using backend endpoint
          Alert.alert('Voice', 'Speech-to-text coming soon')
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to handle voice input')
    }
  }

  const handleVoicePlayback = async (messageId: string, content: string) => {
    try {
      if (playingVoiceId === messageId) {
        // Stop playback
        await stopAudio()
        setPlayingVoiceId(null)
        return
      }

      // Synthesize voice
      setVoiceSynthesizing(messageId)
      const audioUri = await synthesizeVoice(content)
      setVoiceSynthesizing(null)

      if (audioUri) {
        await playAudio(audioUri)
        setPlayingVoiceId(messageId)
      } else {
        Alert.alert('Error', 'Failed to synthesize voice')
      }
    } catch (error) {
      setVoiceSynthesizing(null)
      Alert.alert('Error', 'Failed to play voice')
    }
  }

  const handleTaskConversion = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    try {
      const task = await createTask(
        message.content.substring(0, 100),
        []
      )
      onTaskCreated?.(task)
      Alert.alert('Success', 'Task created!')
    } catch (error) {
      Alert.alert('Error', 'Failed to create task')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={
          messages.length === 0 ? { flex: 1, justifyContent: 'center' } : {}
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🧠 Start Brainstorming</Text>
            <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
              Type your thoughts or use voice
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.message,
                msg.role === 'user'
                  ? styles.messageUser
                  : styles.messageAssistant,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user'
                    ? styles.bubbleUser
                    : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user'
                      ? styles.textUser
                      : styles.textAssistant,
                  ]}
                >
                  {msg.content}
                </Text>
                {msg.role === 'assistant' && (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <TouchableOpacity
                      onPress={() =>
                        handleVoicePlayback(msg.id, msg.content)
                      }
                      disabled={voiceSynthesizing === msg.id}
                    >
                      <Text
                        style={{
                          color: playingVoiceId === msg.id ? '#f44336' : '#4CAF50',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {voiceSynthesizing === msg.id
                          ? '🔊 Generating...'
                          : playingVoiceId === msg.id
                          ? '⏸ Stop Voice'
                          : '🔊 Play Voice'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleTaskConversion(msg.id)}
                    >
                      <Text style={{ color: '#4CAF50', fontSize: 12 }}>
                        ➕ Add Task
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        {loading && (
          <View style={styles.typingIndicator}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your thoughts..."
            value={input}
            onChangeText={setInput}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.recordButton,
              recording && styles.recordButtonActive,
            ]}
            onPress={handleVoiceInput}
            disabled={loading}
          >
            <Text style={{ fontSize: 20 }}>🎤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
