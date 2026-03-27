---
title: "009: Second Adapter"
description: "One adapter is an implementation. Two adapters is a pattern. ZeroClaw proves the capsule abstraction holds across completely different runtimes."
date: 2026-03-26T10:00:00
featured_image: ./capsule-config.png
---

One adapter is an implementation. Two adapters is a pattern.

The first eight iterations built everything on adapter-claude: a bash script that pipes Telegram messages through Claude Code CLI. It works, but it's a single point of coupling. The agent's entire runtime is one shell script, one LLM backend, one way of doing things. The schema says `name` and `system-prompt` — that's all an agent can express.

The question isn't whether Claude Code is a good backend. It's whether the capsule abstraction holds when the backend is swapped entirely.

## Schema extension

agent.nix gets three new optional fields. Optional is important — existing capsules must keep working unchanged.

```nix
agent = {
  name = "Agent";                          # required (unchanged)
  system-prompt = "You are a helpful...";  # required (unchanged)
  provider = "anthropic";                  # optional: LLM provider
  model = "claude-sonnet-4-5-20250929";    # optional: model identifier
  transports.telegram.enable = true;       # optional: channel config
};
```

Validation uses helpers that only fire when the field is present:

```nix
optString = field:
  !(cfg ? ${field}) || (builtins.isString cfg.${field} && cfg.${field} != "");

optBool = path:
  let
    val = builtins.foldl'
      (acc: k: if acc != null && acc ? ${k} then acc.${k} else null)
      cfg path;
  in
  val == null || builtins.isBool val;
```

A capsule with just `name` and `system-prompt` passes validation. A capsule with `provider = 42` fails. The schema grows without breaking backward compatibility.

## Packaging ZeroClaw

ZeroClaw is an open-source agent runtime written in Rust. Single binary, 8 MB, cold start under 10 ms. Built-in Telegram channel, sqlite memory, 60+ tools, session persistence — things that adapter-claude implements in a bash script, ZeroClaw ships as compiled code.

It publishes prebuilt binaries on GitHub. The Nix derivation fetches the tarball and patches the dynamic linker:

```nix
zeroclaw-bin = pkgs.stdenv.mkDerivation {
  pname = "zeroclaw";
  version = "0.6.0";
  src = pkgs.fetchurl {
    url = "https://...zeroclaw-${arch}.tar.gz";
    hash = archInfo.hash;
  };
  nativeBuildInputs = [ pkgs.autoPatchelfHook ];
  buildInputs = [ pkgs.stdenv.cc.cc.lib ];
  installPhase = ''
    mkdir -p $out/bin
    cp zeroclaw $out/bin/zeroclaw
  '';
};
```

`autoPatchelfHook` rewrites the ELF interpreter and library paths to point at the Nix store's glibc. Without it, the binary fails with `required file not found` — the Nix container image has no `/lib64/ld-linux-x86-64.so.2`.

## Config generation

ZeroClaw reads a TOML config file. The adapter generates it from the capsule's agent attributes:

```nix
configToml = pkgs.writeText "config.toml" ''
  default_provider = "${provider}"
  default_model = "${model}"
  default_temperature = 0.7

  [channels_config]
  cli = false
  session_persistence = true

  [channels_config.telegram]
  allowed_users = ${toTomlArray telegramAllowedUsers}

  [memory]
  backend = "sqlite"
  auto_save = true

  [autonomy]
  level = "supervised"
'';
```

The system prompt goes into `IDENTITY.md` in ZeroClaw's workspace directory. ZeroClaw reads workspace identity files at startup and injects them into the LLM system prompt — the same mechanism it uses for its own personality system.

## The provider problem

adapter-claude uses Claude Code CLI, which authenticates through OAuth credentials stored in `~/.claude/.credentials.json`. No API key needed — the CLI manages its own tokens.

ZeroClaw calls LLM providers directly. Using Anthropic means passing an API key. But for testing, the existing Claude Code credentials can be reused.

ZeroClaw has a `claude-code` provider — it spawns the Claude Code CLI as a subprocess. So the adapter conditionally includes the CLI in the Docker image:

```nix
useClaudeCode = provider == "claude-code";

runtimeDeps = [ zeroclaw-bin pkgs.coreutils pkgs.bash ]
  ++ pkgs.lib.optionals useClaudeCode [ pkgs.claude-code ];
```

With `provider = "claude-code"`, ZeroClaw uses Claude Code CLI as its LLM backend. Same credentials, same model access. Switch to `provider = "anthropic"` and it calls the API directly with an `API_KEY` env var. The capsule declares intent, the adapter handles plumbing.

## Secret injection

ZeroClaw's TOML parser requires `bot_token` in the telegram config section — the field is not optional, and there's no env var override. Secrets can't be baked into the Nix store (it's world-readable), so the entrypoint injects them at runtime:

```bash
if [ -n "${TELEGRAM_BOT_TOKEN:-}" ]; then
  sed -i "s|\[channels_config\.telegram\]|[channels_config.telegram]\nbot_token = \"$TELEGRAM_BOT_TOKEN\"|" \
    "$ZC_DIR/config.toml"
fi
```

Config baked at build time, secrets injected at runtime. Same pattern as adapter-claude, different mechanism.

## The same capsule, two runtimes

A capsule targeting adapter-claude:

```nix
inputs.adapter-claude.url = "github:reflection-network/adapter-claude";
outputs = { self, adapter-claude }:
  adapter-claude.lib.mkAgent {
    agent = {
      name = "Agent";
      system-prompt = "You are a helpful assistant.";
    };
  };
```

The same agent targeting adapter-zeroclaw:

```nix
inputs.adapter-zeroclaw.url = "github:reflection-network/adapter-zeroclaw";
outputs = { self, adapter-zeroclaw }:
  adapter-zeroclaw.lib.mkAgent {
    agent = {
      name = "Agent";
      system-prompt = "You are a helpful assistant.";
      provider = "claude-code";
      transports.telegram.enable = true;
    };
  };
```

One line changes (the input URL). The extra fields (`provider`, `transports`) are optional — adapter-claude ignores them, adapter-zeroclaw uses them.

## The crash

The first test run killed the server. Not the container — the entire machine went unresponsive, no ping, hard reboot required.

ZeroClaw at steady state uses 20 MB of RAM. Claude Code CLI wasn't launched — no messages were sent. A second run with `--memory 2g` worked fine. The exact cause remains unknown — it could be a startup spike, a kernel interaction, something else entirely.

The rule is simple: always limit container memory. The server has no swap, and any runaway allocation — from any process — kills the machine before the OOM killer can act.

```bash
docker run -d --memory 4g \
  -e TELEGRAM_BOT_TOKEN=... \
  -v ~/.claude/.credentials.json:/home/agent/.claude/.credentials.json \
  agent:latest
```

## It works

```
$ nix build .#docker && docker load < result
Loaded image: agent:latest

$ docker run -d --memory 4g -e TELEGRAM_BOT_TOKEN=... agent:latest
```

```
INFO zeroclaw: Starting ZeroClaw Daemon on 0.0.0.0:42617
INFO zeroclaw: Warming up provider connection pool provider="claude-code"
ZeroClaw Channel Server
  Model:    claude-sonnet-4-5-20250929
  Memory:   sqlite (auto-save: on)
  Channels: telegram
  Listening for messages...
```

ZeroClaw starts, loads the generated config, connects to Telegram, and waits for messages. The bot works end-to-end — messages go in through Telegram, ZeroClaw routes them to Claude Code CLI, responses come back.

What each adapter brings to the table:

| | adapter-claude | adapter-zeroclaw |
|---|---|---|
| Runtime | Bash + Claude Code CLI | ZeroClaw (Rust binary) |
| LLM backend | Claude Code only | 15+ providers |
| Telegram | Long-poll bash loop | Native channel |
| Memory | Claude's `--resume` | Built-in sqlite |
| Tools | Claude Code's tools | 60+ built-in |
| Image size | ~120 MB | ~136 MB |
| Transport script | 154 lines of bash | Zero (built-in) |

The schema isn't final. `provider`, `model`, and `transports.telegram` are the minimum for ZeroClaw to function. Security policy, memory settings, tool configuration — these will come when a third adapter needs them. The schema grows from real requirements, not upfront design.

Two adapters, one schema. The abstraction holds.
