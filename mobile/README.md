# Centralized Brain Mobile App

React Native mobile app for brainstorming and task management on iOS and Android.

## Features

- **Brainstorming**: Voice and text input for creative sessions
- **Task Queue**: View and manage tasks from anywhere
- **Voice Chat**: Full conversation with AI (speak, listen)
- **Cross-Device Sync**: Sessions sync with desktop via Firebase

## Setup

```bash
npm install
npm start
```

## Development

Built with React Native and TypeScript. Migrated from Dog Pak Voice repo.

### Key Screens
- `BrainstormScreen` - Start/list sessions
- `BrainstormSessionScreen` - Active brainstorm conversation
- `TaskQueueScreen` - View and manage tasks

### Services
- `voice.ts` - Google Cloud STT/TTS, audio capture/playback
- `api.ts` - Backend API calls
- `firebase.ts` - Cloud sync (real Firebase)
- `sync.ts` - Sync orchestration

## Building for Production

### iOS
```bash
npm run build:ios
```

### Android
```bash
npm run build:android
```

## Notes

- Voice uses Google Cloud (can be swapped for local options)
- Firebase sync syncs all sessions and tasks
- Audio playback of AI responses for full voice conversation
- Connection to backend is configurable (QR scan or manual URL)

## Future

- Local voice backends (Whisper, Piper)
- Task assignment and approval workflows
- Offline mode with sync
- Task execution monitoring
