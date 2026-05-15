import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { Task } from '../types'
import { listTasks } from '../services/api'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tasksList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  taskItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e3f2fd',
  },
  statusText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#666',
  },
  criteria: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  criteriaText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  buttonDelete: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
})

interface TaskQueueScreenProps {
  tasks: Task[]
  onTaskUpdate?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
}

export const TaskQueueScreen: React.FC<TaskQueueScreenProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refreshTasks()
  }, [])

  const refreshTasks = async () => {
    setLoading(true)
    try {
      await listTasks()
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const priorityLabel = (p: number) => {
    if (p >= 8) return '🔴 Critical'
    if (p >= 6) return '🟠 High'
    if (p >= 4) return '🟡 Medium'
    return '🟢 Low'
  }

  const statusEmoji = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'in_progress':
        return '⚙️'
      case 'completed':
        return '✅'
      default:
        return '📋'
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Tasks ({tasks.length})</Text>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>📋</Text>
          <Text style={[styles.emptyText, { marginTop: 12 }]}>
            No tasks yet
          </Text>
          <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
            Convert brainstorm responses to tasks
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          style={styles.tasksList}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {statusEmoji(item.status)} {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                <Text style={styles.priorityLabel}>
                  {priorityLabel(item.priority)}
                </Text>
              </View>

              {item.success_criteria.length > 0 && (
                <View style={styles.criteria}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>
                    Success Criteria:
                  </Text>
                  {item.success_criteria.map((criterion, i) => (
                    <Text key={i} style={styles.criteriaText}>
                      • {criterion}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    onTaskUpdate?.({
                      ...item,
                      status: 'in_progress' as const,
                    })
                  }
                >
                  <Text style={styles.buttonText}>Start</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    onTaskUpdate?.({
                      ...item,
                      status: 'completed' as const,
                    })
                  }
                >
                  <Text style={styles.buttonText}>Complete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonDelete]}
                  onPress={() => onTaskDelete?.(item.id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}
