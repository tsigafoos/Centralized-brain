# Centralized Brain Backend

Rust backend for the Centralized Brain system. Handles brainstorming sessions, task queue, voice I/O, and cloud sync.

## Building

```bash
cargo build --release
```

## Running

```bash
cargo run
```

Server listens on `localhost:8000` by default.

## Configuration

Copy `.env.default` to `.env` and customize:

```bash
cp .env.default .env
```

Key settings:
- `VOICE_BACKEND=local` - Use local Whisper/Piper (default, offline)
- `VOICE_BACKEND=google` - Use Google Cloud (requires credentials)
- `OPENAI_ENDPOINT` - Your local LLM endpoint
- `STORAGE_PATH` - Where to store data locally

## API Endpoints

### Health
- `GET /health` - Server status

### Tasks
- `POST /task` - Create task
- `GET /task` - List tasks
- `PUT /task/:id` - Update task
- `DELETE /task/:id` - Delete task

### Brainstorm Sessions
- `POST /session` - Create session
- `GET /session` - List sessions
- `GET /session/:id` - Get session
- `POST /session/:id/message` - Add message to session

### Voice
- `POST /transcribe` - Audio → text (speech-to-text)
- `POST /speak` - Text → audio (text-to-speech)

## Architecture

### Core Modules

- **api** - OpenAI-compatible client
- **inference** - Response parsing, task extraction
- **task_queue** - Task storage and management
- **brainstorm** - Session and context storage
- **sync** - Cloud sync (Firebase abstraction)
- **voice** - Pluggable STT/TTS providers
- **config** - Settings and environment

### Design Principles

- **Trait-based**: Everything is pluggable (storage, voice, sync)
- **Local-first**: Works completely offline with sensible defaults
- **Async**: All I/O is async with Tokio
- **Simple**: No unnecessary abstractions, minimal dependencies

## Testing

```bash
cargo test
```

## Voice Backends

### Local (Default)
- STT: Whisper (self-hosted or local model)
- TTS: Piper or similar
- Zero external dependencies, completely offline

### Google Cloud
- STT: Google Cloud Speech-to-Text
- TTS: Google Cloud Text-to-Speech
- Set `VOICE_BACKEND=google` and provide credentials

## Storage

Currently uses in-memory storage with `HashMap`. For production:

1. Implement `TaskStore` and `BrainstormStore` traits for SQLite
2. Set environment variable to select implementation
3. Existing trait design makes this straightforward

## Future

- Real Firebase integration for cloud sync
- Persistent JSON/SQLite storage
- Task routing engine
- Machine registration and health checks
- Conversation context management
