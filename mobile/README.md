# Centralized Brain Mobile

React Native mobile app for brainstorming and task management with Expo.

## Features

### Brainstorm Screen
- Text input for thoughts and ideas
- Voice input with microphone button (speech-to-text)
- Real-time AI responses from backend
- Context windowing: last 6 messages + older ones summarized
- "Add Task" button on AI responses for quick task creation
- Message history with typing indicators

### Task Queue Screen
- View all extracted/created tasks
- Priority-based sorting (critical → low)
- Status management (pending, in progress, completed)
- Success criteria display
- Quick actions: Start, Complete, Delete

### Settings Screen
- Configure backend URL (default: http://localhost:9000)
- Adjust context window size (512-8192 tokens)
- Choose voice backend (local Whisper or Google Cloud)
- API endpoint reference

## Architecture

- **Framework**: Expo + React Native + TypeScript
- **Navigation**: React Navigation (bottom tabs)
- **State Management**: React hooks + SecureStore
- **Voice**: Expo AV + backend endpoints
- **Backend**: Connected to Centralized Brain on port 9000

## Setup

### Prerequisites
- Node.js 16+
- Expo CLI

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web

## API Integration

All communication goes through the backend at `http://localhost:9000`:

### Chat Completions
```
POST /v1/chat/completions
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "max_tokens": 512,
  "temperature": 0.7
}
```

### Model Management
- `GET /v1/models` - List available models
- `POST /v1/models/:id/load` - Load a model
- `POST /v1/models/unload` - Unload model

### Task Management
- `POST /task` - Create task
- `GET /task` - List tasks

## Context Windowing

The app sends:
1. Last 6 messages in full (for recent context)
2. Summary of older messages if space available
3. All within configurable token limit (default 2000)

Example sent context:
```
[Earlier: User: "..." | Assistant: "..." | ...]
User: "What should I prioritize?"
Assistant: "Based on the earlier discussion..."
```

## Voice Integration

**Local Mode** (default):
- Uses backend's Whisper (STT) implementation
- Uses backend's Piper (TTS) implementation
- Completely offline
- No external credentials needed

**Google Mode** (optional):
- Uses Google Cloud Speech-to-Text
- Uses Google Cloud Text-to-Speech
- Requires credentials in backend config

## Screen Flow

```
[Brainstorm Tab]
  ├─ Message history
  ├─ Text input + voice button
  └─ Send to AI → Get response → Add Task button

[Tasks Tab]
  ├─ Priority-sorted task list
  ├─ Expandable task details
  └─ Status/priority management

[Settings Tab]
  ├─ Backend URL configuration
  ├─ Context size slider
  ├─ Voice backend selection
  └─ API endpoint reference
```

## File Structure

```
mobile/
├── App.tsx                 # Main app with navigation
├── app.json                # Expo config
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── src/
    ├── screens/
    │   ├── BrainstormScreen.tsx
    │   ├── TaskQueueScreen.tsx
    │   └── SettingsScreen.tsx
    ├── services/
    │   ├── api.ts          # Backend API calls
    │   └── voice.ts        # Audio recording/playback
    └── types/
        └── index.ts        # TypeScript interfaces
```

## Development Notes

- Settings persist via SecureStore (encrypted on-device storage)
- Voice recording stores URI that can be sent to backend
- Tasks sorted by priority (highest first)
- Context window recalculates on each message
- All network requests timeout after 30s

## Future Enhancements

- [ ] Full speech-to-text integration
- [ ] Full text-to-speech with audio playback
- [ ] Firebase sync for cross-device sessions
- [ ] Offline mode with sync on reconnect
- [ ] Task templates for quick creation
- [ ] Session history and favorites
