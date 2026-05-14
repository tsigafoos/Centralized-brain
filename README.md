# Centralized Brain

A single-brain AI system that runs all day across your devices. Own your entire stack—no vendor lock-in, no surprise pricing.

**The Vision**: One intelligent assistant that understands context, remembers what you've said, and routes work intelligently. You chat or speak ideas throughout the day. The brain parses those into tasks with clear success criteria. You manually prioritize them on a desktop GUI. Tasks get routed to execution—whether that's local, on another machine, or back to you. Everything syncs across mobile, desktop, and cloud so you never lose context.

## Architecture

This is a monorepo with three major components:

- **`/backend`** - Rust backend: task queue, brainstorming sessions, voice I/O, cloud sync
- **`/mobile`** - React Native mobile app: brainstorming interface, task queue, voice chat
- **`/hooks`** - Installation scripts for different machines (local, remote, CI/CD)

## Quick Start

### Backend

```bash
cd backend
cargo run
```

Server starts on `http://localhost:8000`

**First time?** Copy `.env.default` to `.env` (defaults are sensible).

### Mobile

```bash
cd mobile
npm install
npm start
```

### Remote Machine

```bash
curl https://your-domain/install | bash
```

## Key Features

- **Brainstorming**: Full voice/text conversations with AI. Sessions sync across devices.
- **Task Creation**: AI extracts actionable tasks from brainstorm outcomes with success criteria.
- **Task Queue**: Visual management, prioritization, assignment to machines.
- **Voice I/O**: Speech-to-text and text-to-speech. Local-first (Whisper + Piper) with optional Google Cloud.
- **Cross-Device Sync**: Everything syncs via Firebase. Start on mobile, continue on desktop.
- **Zero Vendor Lock-in**: Run completely local or integrate cloud services as you choose.

## Configuration

See `.env.default` for all options. Key choices:

- `VOICE_BACKEND=local` (default, completely offline) or `google` (requires credentials)
- `OPENAI_ENDPOINT` - your local LLM endpoint
- `FIREBASE_PROJECT_ID` - optional, for cloud sync

## Development

- Backend: Rust with Tokio, Axum, trait-based design for pluggability
- Mobile: React Native with TypeScript
- Storage: In-memory by default, trait-based for SQLite/hybrid
- Voice: Pluggable providers (local Whisper/Piper or Google Cloud)

## Philosophy

Stupid simple to install and use. Powerful functionality, minimal complexity. No feature bloat. Defaults are sensible—zero configuration for local-only setup.
