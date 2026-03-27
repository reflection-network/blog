---
title: "001: The Agent Is a Repo"
description: "An agent defined in 17 lines of Nix. A schema that validates identity at eval time. Two repos, zero frameworks."
date: 2026-03-22T16:37:53
featured_image: ./featured.jpg
---

The [previous post](/000-intro/) described an idea: an AI agent as a Git repo with a config file. Now let's see if it actually works.

If an agent is just a config — name and system prompt — then it should be possible to express it declaratively and have the tooling validate it. No runtime, no framework, just a schema that says "this is an agent" and rejects anything that isn't.

Nix is a good fit here. It's already declarative, it already has a type system (sort of), and it already knows how to build things reproducibly. If we can define an agent as a Nix expression, we get validation, reproducibility, and composability for free.

## agent.nix — the schema

Two repos. That's all this iteration produced.

A Nix flake that exports one function: `mkAgent`. Give it a config, it gives back a dev shell with the agent's identity baked in.

The schema is minimal on purpose. An agent needs two things to exist: a name and a system prompt. Everything else — transports, memory, adapters — comes later. The schema enforces this:

```nix
{
  description = "Reflection agent.nix — declarative agent schema";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    {
      lib.mkAgent = { agent }:
        flake-utils.lib.eachDefaultSystem (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
            cfg = agent;

            assertions = [
              {
                assertion = cfg ? name
                  && builtins.isString cfg.name
                  && cfg.name != "";
                message =
                  "agent.name must be a non-empty string";
              }
              {
                assertion = cfg ? system-prompt
                  && builtins.isString cfg.system-prompt
                  && cfg.system-prompt != "";
                message =
                  "agent.system-prompt must be a non-empty string";
              }
            ];

            failedAssertions =
              builtins.filter (a: !a.assertion) assertions;

            assertionCheck =
              if failedAssertions != [] then
                throw (builtins.concatStringsSep "\n"
                  (map (a: "assertion failed: ${a.message}")
                    failedAssertions))
              else
                true;

            agent-info = pkgs.writeShellScriptBin "agent-info" ''
              echo "name: ${cfg.name}"
              echo ""
              echo "system prompt:"
              echo "${cfg.system-prompt}"
            '';
          in
          assert assertionCheck;
          {
            devShells.default = pkgs.mkShell {
              packages = [ agent-info ];
              shellHook = ''
                echo ""
                echo "  reflection: ${cfg.name}"
                echo ""
              '';
            };
          }
        );
    };
}
```

The key design decision: `mkAgent` returns flake outputs, not a derivation. The capsule's `flake.nix` just calls `mkAgent` and returns whatever it gives back. This means the capsule doesn't need to know about `nixpkgs` or `flake-utils` — those are the schema's concern.

Assertions run at evaluation time. Forget the name, and Nix tells you before anything gets built:

```
error: assertion failed: agent.name must be a non-empty string
```

## The capsule

The capsule is almost comically simple:

```nix
{
  description = "Example Reflection agent capsule";

  inputs = {
    agent-nix.url = "github:reflection-network/agent.nix";
  };

  outputs = { self, agent-nix }:
    agent-nix.lib.mkAgent {
      agent = {
        name = "Agent";
        system-prompt = ''
          You are a helpful assistant.
          You respond in the same language the user writes to you.
        '';
      };
    };
}
```

That's the entire agent definition. 17 lines. `nix develop` drops into a shell:

```
  reflection: Agent

```

The shell includes an `agent-info` command that prints the full config:

```
$ agent-info
name: Agent

system prompt:
You are a helpful assistant.
You respond in the same language the user writes to you.
```

## What we learned

It works. An agent is a 17-line flake.nix that imports a schema and declares its identity. The schema validates the config at evaluation time. The dev shell gives a way to inspect the agent.

**The capsule knows nothing about infrastructure.** It doesn't import nixpkgs. It doesn't know what system it's running on. It just says "I am Agent, here is my prompt" and the schema handles everything else. The agent definition is pure identity, no machinery.

**Nix assertions are surprisingly good for this.** No need for a proper type system or validation library. `assert` with a `throw` gives clear error messages at eval time, and that's enough for a schema this small.

**`eachDefaultSystem` does the heavy lifting.** The capsule author doesn't think about architectures. `mkAgent` produces outputs for every platform.

What's missing is obvious: the agent can't do anything yet. It can tell you who it is, but it can't talk to anyone.
