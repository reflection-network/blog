---
title: "008: Persistent Home"
description: "Docker named volumes, a self-healing entrypoint, memory limits, and graceful shutdown. The agent's state survives redeploys."
date: 2026-03-25T11:19:50
featured_image: ./featured.jpg
---

The agent [remembers](/005-agent-remembers/) — within a container's lifetime. Iteration 005 added session persistence: each Telegram chat maps to a Claude session ID, stored as a flat file in `$HOME/sessions/`. Works perfectly until you push a config change. The [launcher](/006-demo-deploy/) detects the new commit, rebuilds the image, and recreates the container. Everything in `/home/agent` is gone. Sessions, files the agent created, any runtime state — wiped on every deploy.

The agent has long-term memory that doesn't survive a `git push`. That's not persistence, that's a grace period.

Docker named volumes persist data across container restarts and removals. Mount a volume at `/home/agent` and the agent's entire home directory survives redeploys. Sessions, conversation history, files — all preserved.

The idea is simple. The implementation has a subtlety: the adapter mounts Claude credentials into `/home/agent/.claude/.credentials.json` via a bind mount. If the `.claude/` directory doesn't exist in the volume (first run, manual deletion, corruption), Docker creates it as root. Claude Code runs as uid 1000, finds a root-owned `.claude/` directory, and hangs silently. No error, no timeout — just nothing.

The fix needs two parts: the volume mount for persistence, and a safety net ensuring `.claude/` always exists with correct ownership.

## The volume mount

The launcher's `start_container()` now mounts a named volume and sets a memory limit:

```bash
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  --memory "$CONTAINER_MEMORY" \
  -v "${CONTAINER_NAME}-home:/home/agent" \
  -v "$CREDENTIALS_FILE:/home/agent/.claude/.credentials.json" \
  "${IMAGE_NAME}:latest"
```

The named volume `${CONTAINER_NAME}-home` mounts at `/home/agent`. The credentials bind mount sits on top — Docker lets a file bind mount override a path inside a volume mount. The credentials always come from the host, everything else persists in the volume.

On the first run, Docker's volume initialization copies the image's `/home/agent` contents into the volume. This includes the `.claude/` directory created by `fakeRootCommands` in the Nix image build, already owned by uid 1000. On subsequent runs, the volume retains its data and Docker skips the copy.

The volume name derives from the container name: container `my-agent` gets volume `my-agent-home`. Predictable naming makes inspection and cleanup straightforward:

```bash
docker volume ls | grep home
docker volume rm my-agent-home  # full reset
```

## The safety net

The first-run initialization works. But volumes can be manually edited, `.claude/` can be deleted, things can go wrong. If `.claude/` is missing when Docker tries to create the credentials bind mount's parent path, Docker creates it as root.

The fix is a single line in the adapter-claude entrypoint:

```nix
entrypoint = pkgs.writeShellScript "entrypoint" ''
  export PATH="...":$PATH"
  export AGENT_SYSTEM_PROMPT=...
  mkdir -p "$HOME/.claude"
  exec ${telegramTransport}
'';
```

The entrypoint runs as uid 1000 (the container's `User` config). `mkdir -p` either finds the directory already there (common case, no-op) or creates it with the right ownership. This runs before `exec`, so Claude Code always finds a writable `.claude/` directory.

Self-healing: delete `.claude/` from the volume, restart the container, it's recreated automatically. No init containers, no external scripts, no manual intervention.

## Container name from directory

A small quality-of-life change: `CONTAINER_NAME` now defaults to the capsule's directory name instead of the generic "agent":

```bash
CONTAINER_NAME="${CONTAINER_NAME:-$(basename "$REPO_DIR")}"
```

Run the launcher from `~/my-agent/` and the container is named `my-agent`, the volume is `my-agent-home`. No `CONTAINER_NAME=...` prefix needed for the common case. The environment variable still overrides it when a different name is needed.

## Credentials beside the capsule

Each agent needs its own Claude OAuth credentials — tokens are single-use, and if the agent refreshes a shared token, the host user's session breaks. The credentials file needs to live somewhere predictable.

The convention: `$REPO_DIR/.credentials.json`. The credentials file sits next to the capsule, gitignored, and the launcher finds it automatically:

```bash
CREDENTIALS_FILE="${CREDENTIALS_FILE:-$REPO_DIR/.credentials.json}"
```

Claude Code refreshes OAuth tokens at runtime. Because the file is bind-mounted, the refresh writes through to the host — the updated token persists across redeploys.

## Memory limit

The first test deploy crashed the server. Not a container crash — the entire machine became unresponsive, no ping, hard reboot required.

The cause: Claude Code inside the container allocated memory without limit, the server had zero swap, and Linux locked up before the OOM killer could act. This is a known failure mode — with no swap, the kernel has no breathing room to identify and kill the offending process.

The fix: `--memory` on `docker run`. If the container exceeds the limit, Docker kills it — the server stays up. The default is 4GB, configurable via `CONTAINER_MEMORY`:

```bash
CONTAINER_MEMORY="${CONTAINER_MEMORY:-4g}"
```

This is one of those lessons you only learn by watching a server go dark. The container that works perfectly in manual testing can kill the host through the launcher because nothing was limiting it. The memory flag costs nothing and prevents the worst possible failure mode.

## Graceful shutdown

Without cleanup, Ctrl+C kills the launcher but leaves the container running in the background. A dangling container that nobody is monitoring — no redeploys, no restarts if it crashes.

A trap fixes this:

```bash
trap 'log "Shutting down..."; stop_container; exit 0' INT TERM
```

Ctrl+C or `SIGTERM` → stop the container → exit. The volume stays — the next launch picks up where it left off. The container is ephemeral, the data is not.

## Five changes, one theme

Five changes, each small, each addressing a real problem encountered while running the agent:

- **Named volume** — sessions and files survive redeploys
- **`mkdir -p` in entrypoint** — self-healing if `.claude/` is missing from volume
- **Memory limit** — container can't take down the host
- **Credentials beside the capsule** — each agent owns its tokens, no shared state
- **Graceful shutdown** — Ctrl+C stops the container, volume preserved

The capsule directory now holds everything the launcher needs:

```
my-agent/
├── flake.nix            # agent config
├── .env                 # TELEGRAM_BOT_TOKEN
└── .credentials.json    # Claude OAuth credentials
```

Run `nix run ../launcher` from the directory. No env vars, no flags. The container name, volume name, credentials path, and memory limit all derive from sensible defaults.

[Iteration 005](/005-agent-remembers/) gave the agent memory within a session. [Iteration 006](/006-demo-deploy/) gave it automatic deploys. This iteration makes them compatible — the agent evolves its config through git pushes without losing its conversational state. Memory and mutation, together.
