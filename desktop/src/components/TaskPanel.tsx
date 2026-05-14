import { useState } from 'react'
import './TaskPanel.css'

interface Task {
  id: string
  title: string
  success_criteria: string[]
  status: 'pending' | 'in_progress' | 'completed'
  priority: number
  created_at: string
}

interface Props {
  tasks: Task[]
  onDeleteTask: (taskId: string) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onToggle: () => void
}

export default function TaskPanel({
  tasks,
  onDeleteTask,
  onUpdateTask,
  onToggle,
}: Props) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const priorityLabel = (p: number) => {
    if (p >= 8) return '🔴 Critical'
    if (p >= 6) return '🟠 High'
    if (p >= 4) return '🟡 Medium'
    return '🟢 Low'
  }

  const statusLabel = (status: Task['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'in_progress': return '⚙️'
      case 'completed': return '✅'
    }
  }

  return (
    <div className="task-panel">
      <div className="panel-header">
        <h2>Tasks ({tasks.length})</h2>
        <button
          className="collapse-btn"
          onClick={onToggle}
          title="Collapse task panel"
        >
          ✕
        </button>
      </div>

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-tasks">
            <div className="empty-icon">📋</div>
            <p>No tasks yet</p>
            <small>Convert brainstorm responses to tasks</small>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-item">
              <div
                className="task-header"
                onClick={() =>
                  setExpandedTaskId(
                    expandedTaskId === task.id ? null : task.id
                  )
                }
              >
                <div className="task-title-area">
                  <span className="task-status">
                    {statusLabel(task.status)}
                  </span>
                  <span className="task-title">{task.title}</span>
                </div>
                <div className="task-priority">
                  {priorityLabel(task.priority)}
                </div>
              </div>

              {expandedTaskId === task.id && (
                <div className="task-details">
                  {task.success_criteria.length > 0 && (
                    <div className="criteria">
                      <h4>Success Criteria:</h4>
                      <ul>
                        {task.success_criteria.map((criterion, i) => (
                          <li key={i}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        onUpdateTask(task.id, {
                          status: e.target.value as Task['status'],
                        })
                      }
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={task.priority}
                      onChange={(e) =>
                        onUpdateTask(task.id, {
                          priority: parseInt(e.target.value),
                        })
                      }
                      className="priority-slider"
                      title="Adjust priority"
                    />

                    <button
                      className="delete-btn"
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
