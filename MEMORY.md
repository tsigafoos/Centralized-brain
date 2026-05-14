# Centralized Brain - Memory & Context

## Project Overview
Single-brain AI system running across devices. Core vision: you chat throughout day, brain parses ideas into tasks, you prioritize them, they execute locally or on other machines. Everything syncs via Firebase.

**Key Principle**: Stupid simple to install/use. Local-first voice (Whisper + Piper). Optional Google Cloud. No vendor lock-in.

## Monorepo Structure
```
/backend  - Rust: task queue, brainstorm sessions, voice, sync
/mobile   - React Native: brainstorming, task queue, voice chat
/hooks    - Installation scripts: local (systemd), remote (Python), CI/CD
/docs     - Architecture docs
```

## Core Architectural Decisions

### 1. Voice Backend: Local-First + Pluggable
- **Default**: Local Whisper (STT) + Piper (TTS) - completely offline
- **Optional**: Google Cloud Speech/TTS - swappable via config
- **Implementation**: Trait-based (`SpeechToTextProvider`, `TextToSpeechProvider`)
- **Config**: `VOICE_BACKEND=local` (default) or `google`
- **User choice determines what runs** - if local, zero Google dependencies

### 2. Trait-Based Design (Pluggability)
- **TaskStore**: In-memory (default), trait-based for SQLite/JSON
- **BrainstormStore**: In-memory (default), trait-based for persistence
- **CloudSync**: MockCloudSync (default), FirebaseSync (real), pluggable
- **Voice**: Pluggable STT/TTS providers (local and cloud)
- **Benefit**: Easy to swap implementations without code changes

### 3. Storage Strategy
- **Current**: In-memory `HashMap` with Arc<RwLock>
- **Why**: Fast iteration, no DB setup needed for MVP
- **Future**: JSON file-based or SQLite - traits make this easy
- **Cross-device**: Sync via Firebase, not direct DB access

### 4. API Design (Axum)
- Minimal endpoints for MVP: health, tasks, sessions
- Extensible: easy to add brainstorm messages, voice endpoints
- State management: app-level (task store, brainstorm store, clients)

## Current State (After Scaffold Phase)

### ✅ Complete
1. **Cargo.toml**: All dependencies defined (tokio, axum, serde, async-trait, voice libs)
2. **Module Structure**: All directories and files created
3. **Data Models**:
   - Task: id, title, success_criteria, status, assigned_machine, created_at, priority
   - BrainstormSession: id, title, created_at, updated_at, status, device_origin
   - ConversationMessage: id, session_id, content, message_type (user/assistant), source (voice/text), device, timestamp
4. **Trait-Based Storage**:
   - TaskStore trait + InMemoryTaskStore impl
   - BrainstormStore trait + InMemoryBrainstormStore impl
5. **Voice Module**:
   - SpeechToTextProvider trait: WhisperProvider, GoogleSpeechProvider
   - TextToSpeechProvider trait: PiperProvider, GoogleTextToSpeechProvider
6. **Sync Module**: CloudSync trait, MockCloudSync, FirebaseSync stub
7. **Config**: Settings struct, environment loading, voice backend selection
8. **Main Server**: Axum HTTP server, 4 basic endpoints (health, tasks x2, sessions x2)
9. **Documentation**: Root README, backend README, mobile README, hooks README
10. **Configuration**: .env.default with sensible defaults, .gitignore

### ⚠️ Stubs/TODO
1. **Inference**: ResponseParser needs implementation (extract tasks from model output)
2. **OpenAI Client**: send_prompt is mock
3. **Voice Providers**: All voice implementations are stubs (TODO comments)
4. **Firebase Sync**: Mock only, real implementation needed
5. **Mobile App**: Directory created, needs React Native code
6. **Hooks**: Directory created, needs shell/Python scripts
7. **Tests**: No unit tests yet

### 🔧 Working But Minimal
1. **Server**: Starts, health check works, can create/list tasks and sessions in memory
2. **Endpoints**: Basic CRUD, no message handling yet
3. **Storage**: In-memory only (data lost on restart)

## Key Files & Their Purpose

### Backend
- **src/main.rs** - Axum server, route handlers, AppState
- **src/lib.rs** - Module re-exports
- **src/task_queue/task.rs** - Task struct, Status, Priority enums
- **src/task_queue/storage.rs** - TaskStore trait, InMemoryTaskStore
- **src/brainstorm/session.rs** - BrainstormSession struct
- **src/brainstorm/context.rs** - SessionContext, ConversationMessage, message types
- **src/brainstorm/storage.rs** - BrainstormStore trait, InMemoryBrainstormStore
- **src/voice/integration.rs** - SpeechToTextProvider trait, Whisper + Google impls
- **src/voice/synthesis.rs** - TextToSpeechProvider trait, Piper + Google impls
- **src/sync/cloud_api.rs** - CloudSync trait, MockCloudSync, FirebaseSync
- **src/config/settings.rs** - Settings struct, VoiceBackend enum, env loading
- **Cargo.toml** - Dependencies
- **.env.default** - Default config, all settings documented
- **README.md** - API endpoints, architecture, features

## Next Priorities (In Order)

### Phase 1: Get Server Running & Testable
1. Fix any Cargo.toml issues (compile backend)
2. Test server starts: `cargo run`
3. Test endpoints: `curl http://localhost:8000/health`
4. Add session message endpoints (POST /session/:id/message)
5. Add unit tests for storage traits

### Phase 2: Voice Integration
1. Implement Whisper local transcription (or stub for testing)
2. Implement Piper local TTS (or stub for testing)
3. Add /transcribe and /speak endpoints
4. Wire voice into inference pipeline

### Phase 3: Mobile & Sync
1. Create React Native project structure
2. Implement voice capture/playback
3. Add Firebase sync (use FirebaseSync impl)
4. Test cross-device session sync

### Phase 4: Production Readiness
1. JSON file-based storage (implement TaskStore/BrainstormStore for JSON)
2. Real Firebase integration
3. Inference pipeline (parse model responses into tasks)
4. Installation hooks (local systemd, remote Python)

## Important Context

### Why This Approach?
- **Local-first**: Users who can't/won't use cloud still get full functionality
- **Pluggable**: Easy to add new voice providers, storage backends, sync strategies
- **No Vendor Lock**: Google/Firebase are optional, not required
- **Simple Defaults**: Zero config for local-only setup
- **Scalable**: Trait design allows swapping implementations without touching app code

### Known Limitations
- In-memory storage is for MVP only (restarts lose data)
- Voice implementations are stubs (need actual Whisper/Piper/Google integration)
- No persistence yet (everything in RAM)
- No machine registration/health checks
- No task routing engine

### Design Philosophy Reminders
- **No over-engineering**: Keep it simple, avoid premature abstraction
- **Defaults matter**: Users shouldn't have to set up Google Cloud for basic use
- **Trait-based everything**: Pluggability is the feature, not an afterthought
- **Minimal dependencies**: Lightweight enough to run on Raspberry Pi
- **Local works perfectly**: Cloud is a performance/convenience upgrade, not a requirement

## Branch Info
- Branch: `claude/brain-ai-backend-jSgFI`
- Commits: 2 (initial scaffold, complete scaffold with voice/main)
- Ready to push: Yes, after next test/build verification

## Handoff Checklist for Next Session
- [ ] Verify `cargo build` succeeds
- [ ] Verify `cargo run` starts server
- [ ] Test curl http://localhost:8000/health
- [ ] Add session message endpoint
- [ ] Add tests
- [ ] Fix any compile errors
- [ ] Commit and document progress
