# Handoff Document - Centralized Brain Backend

**Date**: 2026-05-14  
**Branch**: `claude/brain-ai-backend-jSgFI`  
**Status**: Backend scaffold complete. Server structure ready. Stubs in place. Ready for implementation.

## What's Done

✅ **Project Structure**
- Monorepo layout: /backend, /mobile, /hooks, /docs
- Cargo.toml with all dependencies
- .env.default with sensible defaults
- Root and module READMEs

✅ **Backend Core**
- Axum HTTP server on localhost:8000
- 4 working endpoints: health, POST/GET tasks, POST/GET sessions
- In-memory storage (works for testing)
- Trait-based design for all major components

✅ **Data Models**
- Task: id, title, success_criteria, status, assigned_machine, priority
- BrainstormSession: id, title, status, device_origin
- ConversationMessage: id, content, type, source (voice/text), device

✅ **Pluggable Architecture**
- Voice: LocalSTT/LocalTTS + CloudSTT/CloudTTS (trait-based)
- Storage: TaskStore/BrainstormStore traits (in-memory default)
- Sync: CloudSync trait (mock default, Firebase impl stubbed)
- Config: Environment-based voice backend selection

## What Needs Work

⚠️ **Before Server is Ready**
1. **Compile & run**
   - `cd backend && cargo build`
   - `cargo run`
   - Verify: `curl http://localhost:8000/health`

2. **Add Session Messages Endpoint**
   - POST /session/:id/message (add ConversationMessage)
   - GET /session/:id (retrieve with full context)
   - Return ConversationMessage struct

3. **Add Voice Endpoints** (for testing)
   - POST /transcribe (accept audio, return text)
   - POST /speak (accept text, return audio stream)
   - Wire to voice providers

4. **Unit Tests**
   - Test TaskStore CRUD
   - Test BrainstormStore CRUD
   - Test main.rs endpoints with test client

### Implementation Path (Suggested)

**Priority 1**: Get server buildable and testable
1. `cargo build` - fix any compile errors
2. Verify endpoints work
3. Add session message endpoint
4. Write basic tests

**Priority 2**: Voice implementation (stubs → real)
1. Implement Whisper provider (local STT)
2. Implement Piper provider (local TTS)
3. Test with /transcribe and /speak endpoints
4. Add error handling

**Priority 3**: Storage & Sync
1. Implement JSON TaskStore (persistent)
2. Implement JSON BrainstormStore
3. Implement Firebase CloudSync
4. Test cross-device sync with mobile

**Priority 4**: Mobile & Hooks
1. Create React Native app (migrate from Dog Pak Voice)
2. Implement local and remote installation hooks
3. Wire task execution

## Key Architectural Points

### Voice Backend Selection
```rust
// User sets VOICE_BACKEND=local or google in .env
// Server picks implementation at startup
if settings.voice_backend == VoiceBackend::Local {
    let stt = WhisperProvider::new("./models/whisper-base".to_string());
    let tts = PiperProvider::new("./models/piper-en".to_string());
} else {
    let stt = GoogleSpeechProvider::new();
    let tts = GoogleTextToSpeechProvider::new();
}
```

### Storage is Swappable
```rust
// Current: InMemoryTaskStore
// Next: JsonTaskStore / SqliteTaskStore
// All implement TaskStore trait, swap at startup

let task_store: Arc<dyn TaskStore> = Arc::new(InMemoryTaskStore::new());
```

### Sync is Optional
```rust
// Current: MockCloudSync (does nothing)
// Next: FirebaseSync (real implementation)
// Both implement CloudSync trait

let sync: Arc<dyn CloudSync> = Arc::new(MockCloudSync);
```

## Running the Server

```bash
cd backend

# Development
cargo run

# Production
cargo build --release
./target/release/centralized-brain

# With custom config
VOICE_BACKEND=google SERVER_PORT=9000 cargo run
```

## Testing Endpoints

```bash
# Health
curl http://localhost:8000/health

# Create task
curl -X POST http://localhost:8000/task \
  -H "Content-Type: application/json" \
  -d '{"title": "My Task", "success_criteria": ["done"]}'

# List tasks
curl http://localhost:8000/task

# Create session
curl -X POST http://localhost:8000/session \
  -H "Content-Type: application/json" \
  -d '{"title": "Brainstorm Session", "device_origin": "mobile"}'

# List sessions
curl http://localhost:8000/session
```

## Common Issues & Solutions

**Problem**: `cargo build` fails on dependencies
- **Solution**: Check Cargo.toml, ensure correct versions. Google Cloud deps can be finicky.

**Problem**: Server won't bind to port
- **Solution**: Change SERVER_PORT in .env. Default is 8000.

**Problem**: Don't know where to start
- **Solution**: Follow "Priority 1" above. Get it compiling, then add features incrementally.

## Files to Know

- `src/main.rs` - Server, routes, handlers
- `src/lib.rs` - Module exports
- `src/task_queue/task.rs` - Task struct
- `src/brainstorm/session.rs` - Session struct
- `src/voice/` - Voice providers (to implement)
- `src/config/settings.rs` - Settings and env loading
- `Cargo.toml` - Dependencies
- `.env.default` - Configuration template

## Questions?

See MEMORY.md for project context and design decisions. See README.md in each directory for module-specific info.

## Next Commit Should

- [ ] Verify cargo build succeeds
- [ ] Add session message endpoints
- [ ] Add basic tests
- [ ] Document any compile issues fixed
- [ ] Update HANDOFF if major changes made

---

**Last Updated**: 2026-05-14  
**By**: Claude (via Centralized Brain scaffolding)  
**Ready For**: Human developer or AI agent to implement next phase
