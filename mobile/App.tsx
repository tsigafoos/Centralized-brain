import React, { useState, useEffect } from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import * as SecureStore from 'expo-secure-store'
import { BrainstormScreen } from './src/screens/BrainstormScreen'
import { TaskQueueScreen } from './src/screens/TaskQueueScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { Task, SettingsState } from './src/types'
import { setBackendUrl } from './src/services/api'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const DEFAULT_SETTINGS: SettingsState = {
  backendUrl: 'http://localhost:9000',
  maxContextSize: 2000,
  voiceBackend: 'local',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        setBackendUrl(parsed.backendUrl)
      } else {
        setBackendUrl(DEFAULT_SETTINGS.backendUrl)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setBackendUrl(DEFAULT_SETTINGS.backendUrl)
    } finally {
      setSettingsLoaded(true)
    }
  }

  const handleSettingsChange = async (newSettings: SettingsState) => {
    try {
      await SecureStore.setItemAsync('settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      setBackendUrl(newSettings.backendUrl)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => {
      const updated = [...prev, task]
      return updated.sort((a, b) => b.priority - a.priority)
    })
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const handleTaskUpdate = (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
  }

  if (!settingsLoaded) {
    return null
  }

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => {
              let emoji = '🧠'
              if (route.name === 'Tasks') emoji = '📋'
              if (route.name === 'Settings') emoji = '⚙️'
              return <View style={{ fontSize: 20 }}>{emoji}</View>
            },
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: '#999',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#f8f9fa',
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
            },
          })}
        >
          <Tab.Screen
            name="Brainstorm"
            options={{
              title: '🧠 Brainstorm',
              headerShown: true,
            }}
          >
            {() => (
              <BrainstormScreen onTaskCreated={handleTaskCreated} />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Tasks"
            options={{
              title: '📋 Tasks',
              headerShown: true,
            }}
          >
            {() => (
              <TaskQueueScreen
                tasks={tasks}
                onTaskDelete={handleTaskDelete}
                onTaskUpdate={handleTaskUpdate}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Settings"
            options={{
              title: '⚙️ Settings',
              headerShown: true,
            }}
          >
            {() => (
              <SettingsScreen
                initialSettings={settings}
                onSettingsChange={handleSettingsChange}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  )
}
