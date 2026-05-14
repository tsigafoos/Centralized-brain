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

### 1. Inference: Local-First + Pluggable
- **Default**: Embedded llama.cpp with GGUF models (completely offline, like local-brain)
- **Optional**: OpenAI-compatible endpoint (OpenAI, local ollama, vLLM, etc.)
- **Implementation**: Trait-based `InferenceProvider`
- **Config**: `INFERENCE_MODE=local` (default) or `cloud`
- **User choice determines what runs** - if local, zero cloud dependencies
- **Model management**: Add/remove GGUF models, load/unload at runtime via API

### 1b. Voice Backend: Local-First + Pluggable
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

### ✅ Newly Complete (Inference Phase)
1. **Inference Module**: Full trait-based InferenceProvider
   - LocalGGUFInference: Embedded llama.cpp with llama_cpp_2 crate
   - CloudOpenAIInference: OpenAI-compatible endpoint client
   - Both sync (infer) and async streaming (infer_stream) modes
   - Temperature sampling, context management, token streaming
2. **Cargo.toml**: Updated with llama-cpp-2, encoding_rs, tokio-tungstenite, rusqlite

### ✅ Newly Complete (Desktop Phase)
1. **Desktop GUI**: Complete Tauri + React + TypeScript scaffolding
   - BrainstormChat component: message history, typing indicators, animations
   - TaskPanel component: priority-based sorting, status tracking, collapsible
   - SettingsPanel component: context size configuration, persistent settings
   - API integration: wired to /v1/chat/completions on port 9000
   - Context windowing: dynamic summarization when exceeding MAX_CONTEXT_SIZE
   - Token estimation: ~0.25 tokens per character for real-time management

### ⚠️ Stubs/TODO
1. **ResponseParser**: Needs to use InferenceProvider to extract tasks from brainstorm
2. **Model Management**: /v1/models endpoints (list, load, unload, download GGUF)
3. **Voice Providers**: All voice implementations are stubs (TODO comments)
4. **Firebase Sync**: Mock only, real implementation needed
5. **Hooks**: Directory created, needs shell/Python scripts
6. **Tests**: No unit tests yet

### 🔧 Working But Minimal
1. **Server**: Starts, health check works, can create/list tasks and sessions in memory
2. **Endpoints**: Basic CRUD, no message handling yet
3. **Storage**: In-memory only (data lost on restart)

## Key Files & Their Purpose

### Backend
- **src/main.rs** - Axum server, route handlers, AppState (TODO: wire InferenceProvider)
- **src/lib.rs** - Module re-exports
- **src/inference/provider.rs** - InferenceProvider trait, LocalGGUFConfig, CloudOpenAIConfig
- **src/inference/local_gguf.rs** - LocalGGUFInference: llama.cpp with llama_cpp_2
- **src/inference/cloud_openai.rs** - CloudOpenAIInference: OpenAI-compatible fallback
- **src/inference/response_parser.rs** - ResponseParser (TODO: use inference for task extraction)
- **src/task_queue/task.rs** - Task struct, Status, Priority enums
- **src/task_queue/storage.rs** - TaskStore trait, InMemoryTaskStore
- **src/brainstorm/session.rs** - BrainstormSession struct
- **src/brainstorm/context.rs** - SessionContext, ConversationMessage, message types
- **src/brainstorm/storage.rs** - BrainstormStore trait, InMemoryBrainstormStore
- **src/voice/integration.rs** - SpeechToTextProvider trait, Whisper + Google impls (stubs)
- **src/voice/synthesis.rs** - TextToSpeechProvider trait, Piper + Google impls (stubs)
- **src/sync/cloud_api.rs** - CloudSync trait, MockCloudSync, FirebaseSync (stubs)
- **src/config/settings.rs** - Settings struct, VoiceBackend enum, env loading (TODO: add InferenceMode)
- **Cargo.toml** - Dependencies (updated with llama-cpp-2)
- **.env.default** - Default config (TODO: document inference mode)
- **README.md** - API endpoints, architecture, features (TODO: add inference docs)

## Next Priorities (In Order)

### Phase 1: Wire Inference into Desktop Backend ✅ COMPLETE
1. ✅ Update config/settings.rs to support INFERENCE_MODE=local|cloud
2. ✅ Update main.rs: wire InferenceProvider into AppState
3. ✅ Test: `cargo build` and `cargo run`
4. ✅ Manual test: /v1/chat endpoint using loaded model
5. ✅ Commit documentation + main.rs changes

### Phase 2: Desktop GUI + Brainstorm Integration ✅ COMPLETE
1. ✅ Create Tauri + React desktop app in `/desktop`
2. ✅ Brainstorm chat component (text input, message history)
3. ✅ Connect to /v1/chat/completions endpoint
4. ✅ Display AI responses with typing indicators
5. ✅ Context windowing: dynamic summarization when exceeding MAX_CONTEXT_SIZE
6. ✅ "Convert to task" button on responses
7. ✅ Task panel with priority-based sorting
8. ✅ Settings panel for context size configuration

### Phase 3: Model Management + Task Parsing ← WE ARE HERE
1. Test end-to-end: run backend, start desktop app, test chat → inference → responses
2. Add /v1/models endpoints (list, load, unload, download)
3. Implement ResponseParser to extract tasks from model output
4. Wire inference → response parser → task creation
5. Test: Brainstorm → AI response → Auto-generated tasks

### Phase 4: Mobile App & Cross-Device Sync
1. Adapt desktop UI for mobile (React Native from `/mobile`)
2. Firebase sync: tasks and brainstorm sessions across devices
3. Voice integration: Whisper STT + Piper TTS
4. Test cross-device brainstorming

### Phase 5: Production Readiness
1. Persistent storage (JSON/SQLite TaskStore, BrainstormStore)
2. Real Firebase integration
3. Installation hooks (desktop systemd, remote Python)
4. Model auto-download from HuggingFace

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
- Commits: 4 (initial scaffold, complete scaffold with voice/main, add embedded llama.cpp, desktop GUI)
- Latest: Desktop GUI (Tauri + React brainstorm chat with task management)
- Pushed: ✅ Ready for testing and Phase 3

## Current Handoff Checklist
- [x] Wire InferenceProvider into main.rs AppState
- [x] Update config/settings.rs for INFERENCE_MODE env var
- [x] Verify `cargo build` succeeds
- [x] Verify `cargo run` starts server with inference provider
- [x] Add /v1/chat/completions endpoint using InferenceProvider
- [x] Create desktop GUI (Tauri + React web app)
- [ ] Test end-to-end: npm install → npm run dev → test chat flow
- [ ] Verify context windowing works when conversation exceeds MAX_CONTEXT_SIZE
- [ ] Test "Convert to task" button creates tasks in panel
- [ ] Test task priority adjustment and deletion
- [ ] Add /v1/models endpoints
- [ ] Implement ResponseParser for task extraction
- [ ] Commit and push final changes
