---
title: "005: Agent Remembers"
description: "The agent gets session persistence. Each Telegram chat maps to a UUID, two-phase invocation handles failures gracefully, and ~40 lines of bash give the agent conversational continuity."
date: 2026-03-24T04:45:34
featured_image: ./featured.jpg
---

The agent [can talk](/004-agent-speaks/). Telegram messages go in, Claude responses come back. But every message is a blank slate. "Remember 42" followed by "What number?" gets nothing useful. The agent has amnesia.

This iteration adds session persistence.

Claude Code already has session management — `--resume` picks up a previous conversation, `--session-id` starts a named one. The hard part isn't the mechanism, it's the mapping: one Telegram chat needs to map to one Claude session, reliably, across messages.

If a UUID is stored per chat ID and passed to `--resume`, the agent should maintain context within a conversation. And if `--resume` fails (corrupted session, expired state), falling back to a fresh `--session-id` should recover gracefully without the user noticing anything worse than a memory reset.

## Session storage

Each Telegram chat gets a session file in `$HOME/sessions/`:

```
$HOME/sessions/
├── 123456789    # contains: a1b2c3d4-...
├── 987654321    # contains: e5f6g7h8-...
```

The file name is the Telegram chat ID. The content is a UUID. Simple flat-file storage — no database, no external service. The container's home directory is writable (uid 1000, [set up in iteration 003](/003-config-to-container/)), so this works out of the box.

Three functions manage the lifecycle:

```bash
get_session_id() {
  local chat_id="$1"
  local file="${SESSIONS_DIR}/${chat_id}"
  if [ -f "$file" ]; then
    cat "$file"
  fi
}

new_session() {
  local chat_id="$1"
  local uuid
  uuid=$(cat /proc/sys/kernel/random/uuid)
  echo "$uuid" > "${SESSIONS_DIR}/${chat_id}"
  echo "$uuid"
}

reset_session() {
  local chat_id="$1"
  rm -f "${SESSIONS_DIR}/${chat_id}"
}
```

UUIDs come from `/proc/sys/kernel/random/uuid` — available in any Linux container, no extra packages needed.

## Two-phase invocation

The interesting part is how `process_message` uses sessions. It's a two-phase approach:

```bash
# Phase 1: try resuming existing session
session_id=$(get_session_id "$chat_id")
if [ -n "$session_id" ]; then
  response=$(claude -p \
    --resume "$session_id" \
    "$text") || session_id=""
fi

# Phase 2: fall back to new session
if [ -z "$session_id" ]; then
  session_id=$(new_session "$chat_id")
  response=$(claude -p \
    --session-id "$session_id" \
    "$text")
fi
```

Phase 1: if a session file exists, try `--resume`. If Claude can't resume (session expired, state corrupted), the command fails and `session_id` gets cleared.

Phase 2: if there's no session or resume failed, create a new UUID and start fresh with `--session-id`. The user experiences a memory reset but no error.

The key difference between the two flags: `--resume` requires an existing session to pick up. `--session-id` creates or names a new one. Using `--resume` for the happy path and `--session-id` for recovery gives both continuity and resilience.

## Commands

Two commands reset the session:

- `/start` — Telegram sends this when a user first opens the bot. Now also resets the session, so restarting the bot conversation starts fresh.
- `/new` — explicit "forget everything" command. Users can reset when the conversation goes off track.

Both call `reset_session()` — delete the session file. The next message creates a new UUID automatically.

## No infrastructure changes

No new packages in the Docker image. No changes to `flake.nix`. The sessions directory lives in the agent's home directory, which is already writable. `/proc/sys/kernel/random/uuid` is provided by the kernel. The entire feature is ~40 lines of bash.

## It works

```
User:  Remember 42.
Agent: OK.

User:  What number?
Agent: 42.

User:  /new

User:  What number?
Agent: I don't have any number in mind.
```

Sessions are ephemeral — they live in the container's filesystem and don't survive restarts. For now, this is fine. Persistent volumes or external session stores are future work, and the flat-file design makes migration straightforward: mount a volume at `$HOME/sessions/` and sessions survive restarts.

The two-phase invocation handles edge cases gracefully. If Claude's internal session state expires or corrupts, the agent silently starts fresh rather than returning errors. The user loses context but the conversation continues.

Forty lines of bash. No new dependencies. The agent went from goldfish memory to conversational continuity.
