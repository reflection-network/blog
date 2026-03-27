---
title: "003: Config to Container"
description: "nix build turns a capsule into a Docker image. Non-root user, writable home, zero Dockerfiles."
date: 2026-03-23T10:34:32
featured_image: ./featured.png
---

The [agent can identify itself](/001-agent-is-a-repo/). It has a name, a system prompt, and a dev shell where you can ask it who it is. But it has no body. It exists only inside `nix develop` — the moment you leave the shell, it's gone.

This iteration gives the agent a body: `nix build` turns a capsule into a Docker image.

If the agent schema already knows everything about the agent's identity, it should also know how to package that identity into a container. One command, one image. The capsule author shouldn't need to write a Dockerfile or understand Docker layers — the schema handles it.

## The road to `buildLayeredImage`

Getting to a working Docker image took multiple attempts. Each failure taught something specific about how Nix and Docker interact.

**Attempt: `buildImage` + `extraCommands`.** The Nix `buildImage` function assembles the image contents using `buildEnv`, which creates a symlink farm. When the `extraCommands` script tried to write `/etc/passwd`, it failed — the path was a read-only symlink into the Nix store. Creating passwd and group as a separate derivation (included in `contents`) solved this specific problem, but others remained.

**Attempt: `chown` in a normal derivation.** The obvious approach — `chown -R 1000:1000 home/agent` in a build script — silently does nothing. The Nix sandbox doesn't grant `CAP_CHOWN`, and `chown` in this context doesn't error out. The container builds, the home directory exists, but it's owned by root. The agent can't write to its own home. Silent failure is the worst kind of failure.

**The Claude Code discovery.** During testing, Claude Code would hang indefinitely when `$HOME` wasn't writable. No error message, no timeout — just silence. This turned a "nice to have" (writable home) into a hard requirement. Any image that doesn't give uid 1000 a writable home directory produces a container that silently breaks at runtime.

The solution that actually works: `buildLayeredImage` with `fakeRootCommands`. This is the only combination that lets you set file ownership in a Nix-built Docker image reliably.

## The image builder

Three new pieces inside `mkAgent`:

```nix
etcFiles = pkgs.runCommand "etc-files" {} ''
  mkdir -p $out/etc
  echo "root:x:0:0:root:/root:/bin/sh" \
    > $out/etc/passwd
  echo "agent:x:1000:1000:Agent:/home/agent:/bin/bash" \
    >> $out/etc/passwd
  echo "root:x:0:" > $out/etc/group
  echo "agent:x:1000:" >> $out/etc/group
'';

imageName = builtins.replaceStrings [ " " ] [ "-" ]
  (pkgs.lib.toLower cfg.name);
```

`etcFiles` creates `/etc/passwd` and `/etc/group` so the container has a proper `agent` user. `imageName` derives the Docker image name from the agent's display name — "Agent" becomes `agent`, "My Agent" becomes `my-agent`.

Then the image itself:

```nix
packages.docker = pkgs.dockerTools.buildLayeredImage {
  name = imageName;
  tag = "latest";
  contents = [
    pkgs.bash pkgs.coreutils agent-info etcFiles
  ];
  fakeRootCommands = ''
    mkdir -p home/agent tmp
    chmod 1777 tmp
    chown -R 1000:1000 home/agent
  '';
  config = {
    User = "1000:1000";
    Env = [ "HOME=/home/agent" ];
    WorkingDir = "/home/agent";
    Entrypoint = [ "${agent-info}/bin/agent-info" ];
  };
};
```

The contents are deliberately minimal: `bash`, `coreutils`, the `agent-info` script, and the etc files. No `curl`, no `jq`, no LLM runtime. Those belong to adapters — the next layer up. The base image is just identity and a shell.

The entrypoint is `agent-info`. When the container runs, the agent tells you who it is. This is the right default — it proves the image works without requiring any external services. Adapters override the entrypoint with their own runtime.

## What `fakeRootCommands` actually does

This is the part that requires the most attention when building Nix Docker images. In a Nix-built Docker image, everything is owned by root and lives in `/nix/store`. You can't `chown` things in a normal derivation because the build sandbox doesn't have root.

`fakeRootCommands` runs in a fakeroot environment — it thinks it's root, so `chown` and `chmod` work, and those ownership changes get baked into the image layer. Without it, there's no way to create a writable `/home/agent` owned by uid 1000.

The sticky bit on `/tmp` (`chmod 1777`) is standard — any user can write files but can't delete other users' files.

## Testing it

```
$ nix build .#packages.x86_64-linux.docker
$ docker load < result
Loaded image: agent:latest

$ docker run --rm agent:latest
name: Agent

system prompt:
You are a helpful assistant.
You respond in the same language the user writes to you.
```

The agent identifies itself. Now the internals:

```
$ docker run --rm --entrypoint bash agent:latest \
    -c 'id && ls -la /home/agent && touch /home/agent/test && echo writable'
uid=1000(agent) gid=1000(agent) groups=1000(agent)
total 2
drwxr-xr-x 2 agent agent 2 Jan  1  1980 .
drwxr-xr-x 3 root  root  3 Jan  1  1980 ..
writable
```

Non-root user, writable home directory, everything works. The `Jan 1 1980` timestamps are a Nix artifact — reproducible builds mean no real timestamps.

## The pattern

`nix build` now turns any capsule into a Docker image. The capsule author adds zero configuration — it just works because `mkAgent` knows how.

The capsule's `flake.nix` hasn't changed at all:

```nix
{
  inputs.agent-nix.url =
    "github:reflection-network/agent.nix";

  outputs = { self, agent-nix }:
    agent-nix.lib.mkAgent {
      agent = {
        name = "Agent";
        system-prompt = "You are a helpful assistant.";
      };
    };
}
```

Same 17 lines. But now `nix build .#packages.x86_64-linux.docker` produces a container. The schema grew, the capsule didn't.

This is the pattern we're after. The complexity lives in the schema, not the agent definition. When adapters, transports, and memory arrive — the capsule stays simple. A declaration of identity. Everything else is someone else's problem.

What's missing: the agent can only tell you who it is. It can't talk to anyone. Next up: Telegram transport, real messages, real conversations.
