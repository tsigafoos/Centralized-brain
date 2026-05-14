import './SettingsPanel.css'

interface Props {
  maxContextSize: number
  onContextSizeChange: (size: number) => void
  onClose: () => void
}

export default function SettingsPanel({
  maxContextSize,
  onContextSizeChange,
  onClose,
}: Props) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label htmlFor="context-size">
              Context Window Size (tokens)
              <span className="setting-help">
                Controls how much conversation history is kept. Larger = more memory, more processing. Smaller = more summarization.
              </span>
            </label>
            <input
              id="context-size"
              type="range"
              min="512"
              max="8192"
              step="256"
              value={maxContextSize}
              onChange={(e) => onContextSizeChange(parseInt(e.target.value))}
              className="context-slider"
            />
            <div className="context-value">
              <span>{maxContextSize} tokens</span>
              <span className="context-estimate">
                ~{Math.round(maxContextSize * 4)} characters
              </span>
            </div>
          </div>

          <div className="setting-group">
            <h3>Context Management</h3>
            <p className="setting-description">
              When your conversation exceeds the context size:
            </p>
            <ul className="setting-list">
              <li>Recent messages are kept in full</li>
              <li>Older messages are summarized</li>
              <li>Summary is sent with each request for continuity</li>
            </ul>
          </div>

          <div className="setting-group">
            <h3>API Configuration</h3>
            <p className="setting-description">
              Backend: <code>http://localhost:9000</code>
            </p>
            <p className="setting-note">
              Make sure the backend is running before starting brainstorming.
            </p>
          </div>
        </div>

        <div className="settings-footer">
          <button className="close-settings-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
