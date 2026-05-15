import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native'
import { SettingsState } from '../types'
import { checkHealth } from '../services/api'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  settingGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sliderContainer: {
    paddingVertical: 12,
  },
  sliderValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  statusGood: {
    color: '#4CAF50',
  },
  statusError: {
    color: '#f44336',
  },
  code: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#c41c3b',
    marginTop: 8,
  },
})

interface SettingsScreenProps {
  initialSettings: SettingsState
  onSettingsChange: (settings: SettingsState) => void
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  initialSettings,
  onSettingsChange,
}) => {
  const [backendUrl, setBackendUrl] = useState(initialSettings.backendUrl)
  const [maxContextSize, setMaxContextSize] = useState(
    initialSettings.maxContextSize.toString()
  )
  const [voiceBackend, setVoiceBackend] = useState(initialSettings.voiceBackend)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [backendUrl])

  const checkConnection = async () => {
    try {
      await checkHealth()
      setConnectionStatus('connected')
    } catch (error) {
      setConnectionStatus('disconnected')
    }
  }

  const handleSave = () => {
    const contextSize = parseInt(maxContextSize) || 2000
    if (contextSize < 512 || contextSize > 8192) {
      Alert.alert('Error', 'Context size must be between 512 and 8192')
      return
    }

    onSettingsChange({
      backendUrl,
      maxContextSize: contextSize,
      voiceBackend,
    })

    Alert.alert('Success', 'Settings saved!')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.scrollView}>
        {/* Backend Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Configuration</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>Backend URL</Text>
            <Text style={styles.description}>
              The address of your Centralized Brain backend server
            </Text>
            <TextInput
              style={styles.input}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="http://localhost:9000"
              editable
            />
            {connectionStatus && (
              <Text
                style={[
                  styles.statusText,
                  connectionStatus === 'connected'
                    ? styles.statusGood
                    : styles.statusError,
                ]}
              >
                {connectionStatus === 'connected'
                  ? '✓ Connected'
                  : '✗ Not reachable'}
              </Text>
            )}
          </View>
        </View>

        {/* Context Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context Management</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>Context Window Size</Text>
            <Text style={styles.description}>
              Controls how much conversation history is sent to the model. Larger values preserve more context but use more tokens.
            </Text>
            <TextInput
              style={styles.input}
              value={maxContextSize}
              onChangeText={setMaxContextSize}
              keyboardType="number-pad"
              placeholder="2000"
            />
            <Text style={styles.sliderValue}>
              ~{Math.round(parseInt(maxContextSize) * 4 || 8000)} characters
            </Text>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.description}>
              • Keeps last 6 messages in full{'\n'}
              • Summarizes older messages if space available{'\n'}
              • Summary included with each request
            </Text>
          </View>
        </View>

        {/* Voice Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Local Voice (Whisper + Piper)</Text>
            <Switch
              value={voiceBackend === 'local'}
              onValueChange={() =>
                setVoiceBackend(voiceBackend === 'local' ? 'google' : 'local')
              }
            />
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.description}>
              {voiceBackend === 'local'
                ? 'Using local Whisper (STT) and Piper (TTS) - completely offline'
                : 'Using Google Cloud Speech and Text-to-Speech - requires credentials'}
            </Text>
          </View>
        </View>

        {/* API Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Endpoints</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>Available Endpoints</Text>
            <Text style={styles.description}>
              Chat Completions: POST /v1/chat/completions
            </Text>
            <Text style={styles.code}>
              {`{
  "messages": [...],
  "max_tokens": 512,
  "temperature": 0.7
}`}
            </Text>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.description}>
              Models: GET /v1/models
            </Text>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.description}>
              Tasks: POST /task, GET /task
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
