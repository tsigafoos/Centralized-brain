# Centralized Brain Desktop

Tauri-based desktop application for brainstorming and task management with local LLM inference.

## Architecture

- **Frontend**: React 18 + TypeScript with Vite
- **Desktop Framework**: Tauri 2.0
- **Backend API**: Communicates with `/backend` service on `http://localhost:9000`
- **State Management**: React hooks with localStorage for settings

## Features

### Brainstorm Chat
- Clean, vanilla chat interface
- Real-time message streaming
- Context windowing with dynamic summarization
- Adjustable context size (512-8192 tokens)
- Typing indicators and message animations

### Task Management
- Convert brainstorm responses to tasks directly
- Priority-based sorting (critical, high, medium, low)
- Status tracking (pending, in progress, completed)
- Collapsible task panel
- Drag-to-reorder and edit functionality

### Context Windowing
The chat intelligently manages conversation history:
- Keeps recent messages in full
- Summarizes older messages when context limit is reached
- Summary is included with each API request for continuity
- User-adjustable context size based on model capabilities

### Settings
- Configure context window size
- View API endpoint information
- Persistent settings via localStorage

## Development

### Prerequisites
- Node.js 16+
- Rust 1.70+
- Tauri CLI

### Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for release
npm run build

# Type checking
npm run type-check
```

### Project Structure

```
desktop/
├── src/
│   ├── components/
│   │   ├── BrainstormChat.tsx    # Main chat interface
│   │   ├── TaskPanel.tsx         # Task list and management
│   │   └── SettingsPanel.tsx     # Configuration UI
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # App layout styles
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global styles
├── src-tauri/
│   ├── src/main.rs               # Tauri app entry point
│   ├── Cargo.toml                # Rust dependencies
│   └── build.rs                  # Build script
├── package.json                  # npm dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite bundler config
└── tauri.conf.json               # Tauri app configuration
```

## API Integration

The frontend communicates with the backend at `http://localhost:9000`:

### Chat Completions
- **Endpoint**: `POST /v1/chat/completions`
- **Body**: 
  ```json
  {
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "..." }
    ],
    "max_tokens": 512,
    "temperature": 0.7
  }
  ```
- **Response**:
  ```json
  {
    "choices": [
      {
        "message": { "role": "assistant", "content": "..." },
        "finish_reason": "stop"
      }
    ]
  }
  ```

## Context Windowing Strategy

1. **Token Estimation**: Each character ≈ 0.25 tokens
2. **Building Context Window**:
   - Keep recent messages until total tokens approach `maxContextSize`
   - When limit would be exceeded, summarize earlier messages
   - Include summary as system message in API request
3. **User Control**: 
   - Adjustable via Settings panel
   - Default: 2000 tokens (~8000 characters)
   - Range: 512-8192 tokens

## Styling Philosophy

- Clean, minimal design
- Vanilla CSS (no framework)
- Dark accents (#4CAF50 green) for primary actions
- Responsive and accessible
- Performance-focused animations

## Future Enhancements

- [ ] Voice input/output integration
- [ ] Task serialization to backend
- [ ] Cross-device sync via Firebase
- [ ] Model hot-loading
- [ ] Session persistence
- [ ] Rich text formatting in chat
- [ ] File attachment support
