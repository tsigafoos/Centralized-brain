# Installation Hooks

One-command setup for running Centralized Brain on different machines.

## Local Machine (Desktop)

```bash
cd local
./install.sh
```

Sets up systemd service on Linux/macOS, auto-starts on boot.

## Remote Machine

```bash
curl https://your-domain/install | bash
```

Or manually:

```bash
cd remote
./install.sh --backend-url http://your-machine:8000
```

Registers machine, starts polling for tasks, executes them locally.

## CI/CD (GitHub Actions)

```bash
cp ci-cd/github-actions.yml .github/workflows/
```

Trigger task execution from GitHub Actions workflows.

## Docker (Optional)

```bash
docker build -f docker/Dockerfile -t centralized-brain .
docker run --name brain -p 8000:8000 centralized-brain
```

## What These Do

### `local/install.sh`
- Creates systemd service file
- Enables auto-start on boot
- Links to backend binary
- Logs to `/var/log/centralized-brain.log`

### `remote/install.sh`
- Installs executor script
- Registers with backend
- Starts polling service
- Configurable task timeout and retry logic

### `remote/executor.py`
- Lightweight Python task executor
- Polls backend for assigned tasks
- Executes tasks with timeout
- Reports status back to backend

## Configuration

Each hook can be customized via environment variables:

```bash
# Local
RUST_LOG=debug ./install.sh

# Remote
BACKEND_URL=http://machine:8000 TASK_TIMEOUT=300 ./install.sh
```

## Machine Registration

When a remote machine connects:
1. Registers hostname/UUID
2. Sends capabilities (OS, available tools)
3. Starts polling for tasks
4. Reports health and task status

Backend keeps track of all registered machines.

## Future

- Kubernetes deployment
- Docker Compose multi-machine setup
- Cloud provider integrations (AWS Lambda, Google Cloud Functions)
- Webhook-based task triggering
