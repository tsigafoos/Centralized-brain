# Centralized Brain - Complete Testing Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 16+ (for desktop/mobile)
- Mistral API key (free from https://mistral.ai/)
- Git

## Quick Start

### 1. Backend Setup

**Option A: Docker (Recommended)**
```bash
# Clone/prepare the repo
cd /home/user/Centralized-brain

# Set your Voxtral API key in docker-compose.yml
# Edit VOXTRAL_API_KEY environment variable

# Start backend
docker-compose up -d

# Verify it's running
curl http://localhost:9000/health
```

Expected response:
```json
{"status":"healthy","version":"0.1.0","type":"centralized-brain-desktop"}
```

**Option B: Local Rust Binary**
```bash
cd backend

# Set environment
export VOXTRAL_API_KEY=your-mistral-api-key
export INFERENCE_MODE=cloud
export OPENAI_ENDPOINT=http://127.0.0.1:8001  # or real LLM endpoint

# Run
cargo run --release
```

### 2. Desktop App Setup

```bash
cd desktop

# Install dependencies
npm install

# Start dev server
npm run dev
```

Opens http://localhost:5173

---

## Desktop Test Workflow

### Phase 1: Basic Chat (No Voice)

1. **Start both services:**
   - Backend: `docker-compose up` (or `cargo run`)
   - Desktop: `npm run dev` in /desktop

2. **Open browser:** http://localhost:5173

3. **Test chat:**
   - Type: "I need to organize my week. Priorities: finish project, review code, meeting prep"
   - Expected: AI responds with organized thoughts
   - Button appears: "🔊 Play Voice" and "➕ Add Task"

4. **Backend check:**
   ```bash
   # List models
   curl http://localhost:9000/v1/models
   
   # Check health
   curl http://localhost:9000/health
   ```

### Phase 2: Voice Synthesis

1. **Verify Voxtral API key is set:**
   ```bash
   docker-compose logs backend | grep Voxtral
   # Should show: "Voxtral TTS enabled" if key is configured
   ```

2. **Test voice endpoint directly:**
   ```bash
   curl -X POST http://localhost:9000/speak \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello world", "voice": "Alice"}' \
     --output audio.wav
   
   # Should create audio.wav file
   ```

3. **Test in desktop UI:**
   - Send a chat message
   - Click "🔊 Play Voice" on AI response
   - Should hear synthesized voice (if Voxtral key is valid)
   - Button shows "Generating..." then "Stop" while playing

### Phase 3: Task Creation

1. **Click "➕ Add Task" on any AI response**
   - Task should appear in right panel
   - Sorted by priority
   - Can expand to edit status, priority, delete

2. **Test task operations:**
   - Mark as "In Progress"
   - Adjust priority slider
   - Delete task

### Phase 4: Context Windowing

1. **Send 10+ messages** in chat
2. **Verify context management:**
   - Last 6 messages kept in full
   - Older messages summarized
   - Summary appears as system message in API calls
3. **Check token efficiency:** Look at browser console (Network tab) to see request sizes

---

## Mobile Test Workflow

### Setup

```bash
cd mobile

npm install

npm start
```

Choose:
- `a` for Android emulator
- `i` for iOS simulator  
- `w` for web

### Phase 1: Backend Connection

1. **Configure in app:**
   - Go to ⚙️ Settings tab
   - Set Backend URL: `http://localhost:9000` (if local)
   - Should show: "✓ Connected"

2. **Test API:**
   - Backend URL should turn green (connected)
   - If red, backend not reachable

### Phase 2: Mobile Chat

1. **Go to 🧠 Brainstorm tab**
2. **Type message:** "Plan my day"
3. **Expected:** AI response appears with "🔊 Play Voice" and "➕ Add Task"
4. **Click "🔊 Play Voice"** - should hear voice
5. **Click "➕ Add Task"** - task appears in 📋 Tasks tab

### Phase 3: Cross-Device Sync (Future)

1. **Create task on desktop**
2. **Check mobile 📋 Tasks tab** - should appear (when sync is implemented)

---

## Full End-to-End Test (Desktop → Mobile)

### Test Scenario: Daily Planning

#### Desktop (Main Device):
1. Start brainstorm: "I have three projects..."
2. AI responds with structured plan
3. Click "🔊 Play Voice" → hear response
4. Click "➕ Add Task" three times for each project
5. See tasks in right panel
6. Adjust priorities

#### Mobile (Companion Device):
1. Open 📋 Tasks tab
2. Verify all three tasks appear
3. Mark one as "In Progress"
4. Brainstorm tab: send follow-up question
5. Get AI response with voice
6. Create additional task

#### Verification:
- [ ] Desktop chat works (text in/out)
- [ ] Voice synthesis works (Voxtral)
- [ ] Voice playback works (browser audio)
- [ ] Tasks created and appear in panel
- [ ] Task priority/status changes work
- [ ] Context windowing works (10+ messages)
- [ ] Mobile connects to backend
- [ ] Mobile voice synthesis works
- [ ] Mobile tasks list updates

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Port 9000 already in use: lsof -i :9000
# 2. Voxtral API key invalid: check VOXTRAL_API_KEY env
# 3. Out of memory: docker stats
```

### Voice synthesis fails
```bash
# Test endpoint directly
curl -X POST http://localhost:9000/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "test", "voice": "Alice"}'

# If error, check:
# 1. VOXTRAL_API_KEY is set
# 2. Mistral API key is valid (try on mistral.ai)
# 3. Network connectivity to api.mistral.ai
```

### Desktop can't reach backend
```bash
# Check backend is running
curl http://localhost:9000/health

# If fails, restart:
docker-compose down
docker-compose up -d

# Or locally:
cd backend && cargo run --release
```

### Mobile can't reach backend
```bash
# If on same WiFi (local):
# Use your machine's IP: 192.168.x.x:9000
# Not localhost:9000

# If different network (cloud):
# Need to deploy to cloud VM
# See docker-compose.yml for cloud setup
```

---

## Performance Testing

### Check Context Window Efficiency
```bash
# Send 20 messages
# Open browser DevTools → Network tab
# Look at /v1/chat/completions request
# Should see small request body due to summarization
```

### Check Model Loading
```bash
# List available models
curl http://localhost:9000/v1/models

# Load a model
curl -X POST http://localhost:9000/v1/models/MODEL_ID/load

# Check response time
time curl -X POST http://localhost:9000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
```

### Memory/CPU Usage
```bash
# While running tests
docker stats centralized-brain-backend

# Should see reasonable CPU/memory usage
# (depends on model, but should be < 4GB RAM)
```

---

## Next Steps After Testing

1. **Local Success:** All tests pass locally
2. **Deploy to Cloud:** Use docker-compose on GC VM
3. **Cross-Device:** Mobile connects to cloud backend
4. **Firebase Sync:** Implement task/session sync
5. **Voice Input:** Add speech-to-text

---

## Files to Monitor During Testing

- Backend logs: `docker-compose logs -f backend`
- Desktop console: Browser DevTools (F12)
- Mobile console: Expo dev tools
- Data files: `./data/` directory

---

## Success Criteria

- ✅ Backend starts and serves /health
- ✅ Desktop app loads and connects
- ✅ Chat works: message sent → AI response
- ✅ Voice synthesis works: hear response
- ✅ Tasks created and managed
- ✅ Mobile app connects to backend
- ✅ Mobile chat works
- ✅ Mobile voice works
- ✅ Context windowing visible (10+ messages)
- ✅ No errors in logs

Once all tests pass → Ready for production deployment!
