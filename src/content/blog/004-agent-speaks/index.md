---
title: "004: Agent Speaks"
description: "The agent gets a Telegram transport. Same config, different adapter import. One line changes, silent container becomes a chatbot."
date: 2026-03-23T12:14:48
featured_image: ./featured.png
---

The agent has a body — a [Docker container built from pure Nix](/003-config-to-container/). It can tell you its name and system prompt. But it can't talk to anyone. No input, no output. A brain in a jar.

This iteration gives the agent a voice. Telegram transport, real messages, real responses.

The agent's identity is already declarative. Adding a communication channel should be a matter of swapping one import. The capsule shouldn't need to know how Telegram works, or how Claude Code works, or how HTTP long polling works. It declares who it is. Someone else handles the plumbing.

That "someone else" is an adapter.

## The adapter pattern

Three layers:

```
Capsule (flake.nix)  →  Adapter  →  Runtime
     who                  how        what runs
```

The capsule declares identity. The adapter translates that identity into a running system. The runtime does the actual work — in this case, Claude Code CLI talking to Telegram.

Each adapter is its own Nix flake. It exports `lib.mkAgent { agent }` — the same interface as agent-nix. A capsule switches backends by changing one import line. The agent config doesn't change at all.

## adapter-claude

The adapter flake wraps agent-nix. It keeps the dev shell from the base schema (so `nix develop` and `agent-info` still work) and replaces `packages.docker` with its own image that includes the Claude Code runtime.

```nix
lib.mkAgent = { agent }:
  let
    base = agent-nix.lib.mkAgent { inherit agent; };
  in
  flake-utils.lib.eachDefaultSystem (system:
    {
      devShells = base.${system}.devShells or {};
      packages.docker = # ... adapter's image
    }
  );
```

The adapter's Docker image is heavier than the base. It needs `claude-code` (which is unfree — requires `allowUnfreePredicate`), `curl` and `jq` for the Telegram API, and `cacert` for HTTPS. The entrypoint bakes in the system prompt at build time and launches the transport:

```nix
entrypoint = pkgs.writeShellScript "entrypoint" ''
  export PATH="${pkgs.lib.makeBinPath
    (with pkgs; [ claude-code curl jq coreutils bash ])}:$PATH"
  export AGENT_SYSTEM_PROMPT=${
    pkgs.lib.escapeShellArg agent.system-prompt}
  exec ${telegramTransport}
'';
```

`AGENT_SYSTEM_PROMPT` is baked into the entrypoint script at Nix evaluation time — it's a build-time constant, not a runtime variable. `TELEGRAM_BOT_TOKEN` is the only secret, provided at runtime via environment variable.

## The transport

The Telegram transport is a bash script that long-polls the Bot API.

The core loop:

```bash
while true; do
  UPDATES=$(curl -s \
    "${API}/getUpdates?offset=${OFFSET}&timeout=30")
  # ... process each message
done
```

Each message goes to `claude -p` — print mode, single-shot, no conversation history:

```bash
response=$(claude -p \
  --system-prompt "${AGENT_SYSTEM_PROMPT}" \
  "$text" 2>/dev/null)
```

The response goes back via `sendMessage`. Simple.

One hard-won detail: the offset=-1 flush on startup. Without it, the bot re-processes every message that arrived while it was offline. Telegram holds unacknowledged updates indefinitely. On restart, `OFFSET` is 0, so `getUpdates` returns the entire backlog. The fix:

```bash
FLUSH=$(curl -s "${API}/getUpdates?offset=-1")
LAST_ID=$(echo "$FLUSH" | jq -r \
  '.result[-1].update_id // empty')
if [ -n "$LAST_ID" ]; then
  OFFSET=$((LAST_ID + 1))
fi
```

`offset=-1` returns only the last update. Setting the offset past it acknowledges everything before. Messages sent while the bot was down are silently dropped. This is a trade-off — but for an initial implementation, it's the right one. Better to skip stale messages than to spam delayed responses.

## The capsule switch

Here's what changing the backend looks like:

Before (agent-nix — identity only):
```nix
inputs.agent-nix.url = "...agent.nix";

outputs = { self, agent-nix }:
  agent-nix.lib.mkAgent {
    agent = { name = "Agent"; system-prompt = "..."; };
  };
```

After (adapter-claude — full Telegram bot):
```nix
inputs.adapter-claude.url = "...adapter-claude";

outputs = { self, adapter-claude }:
  adapter-claude.lib.mkAgent {
    agent = { name = "Agent"; system-prompt = "..."; };
  };
```

Same `agent` block. Different import. The agent goes from silent container to Telegram bot with zero changes to its identity declaration.

## Running it

```
$ nix build .#packages.x86_64-linux.docker
$ docker load < result
Loaded image: agent:latest

$ docker run --rm \
    -e TELEGRAM_BOT_TOKEN=<token> \
    -v ~/.claude/.credentials.json:\
       /home/agent/.claude/.credentials.json \
    agent:latest
[2026-03-23T...] Starting Telegram transport...
[2026-03-23T...] Bot: @agent_bot
[2026-03-23T...] Flushed old updates, starting from offset 42
[2026-03-23T...] Waiting for messages...
```

Send a message in Telegram. The bot responds. It works.

## What this means

A capsule author writes the same 15 lines of config — name and system prompt — but now `nix build` produces a Docker image with a fully functional Telegram bot backed by Claude.

The adapter pattern works as designed. Swapping the backend is one line. The implementation — long polling, HTTP calls, Claude CLI invocation — is completely hidden from the capsule. When a better transport implementation arrives, the adapter internals get swapped. Capsules don't notice.

What's missing: the agent has no memory. Every message is independent — it doesn't remember what you said ten seconds ago.
