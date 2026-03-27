---
title: "007: Readable Repos"
description: "Seven repos, seven READMEs. Consistent format, no boilerplate. The project goes from 'read the Nix' to 'read the README' in one iteration."
date: 2026-03-25T10:53:03
featured_image: ./featured.png
---

Six iterations of code. An [agent schema](/001-agent-is-a-repo/), [Docker builds](/003-config-to-container/), [Telegram transport](/004-agent-speaks/), [session persistence](/005-agent-remembers/), a [dev launcher](/006-demo-deploy/). All working, all deployed. And if you `git clone` any of these repos, you see... a `flake.nix` and nothing else.

No README. No explanation of what the repo does, how to use it, or how the pieces fit together. You'd have to read the Nix code to figure it out. That's fine when you're the only developer. It's a wall when anyone else shows up.

A README is the first file a visitor reads. GitHub renders it on the repo page. It's the handshake between the project and the person. Without it, even working software looks abandoned — or worse, unapproachable.

Adding a concise README to every repo should make the project self-explanatory without requiring any code changes. The test is whether someone can understand each repo's purpose and run it by reading the README alone.

There are seven repos to document: `agent.nix`, `example-agent`, `adapter-claude`, `launcher`, `docs`, `website`, and `tools`. The website has a README, but it's the Astro starter template — "Seasoned astronaut? Delete this file." Time to delete it.

## The format

Every README follows the same structure:

- **H1** with the repo name
- One-line description
- **What it does** — 2-3 sentences explaining the repo's purpose
- **Usage** — commands to build and run
- **Configuration** — env vars or options (only where applicable)
- **Architecture** — how components connect (only for complex repos)

No badges, no contributing guidelines, no license boilerplate. Each README answers three questions: what is this, how do I use it, and how does it work.

## agent.nix

The schema repo. Its README explains that it's a library — you don't clone it directly, you import it as a flake input. It shows the `mkAgent` call with both required fields (`name`, `system-prompt`), documents the outputs (devShell and Docker image), and explains how adapters extend it.

```nix
{
  inputs.agent-nix.url =
    "github:reflection-network/agent.nix";

  outputs = { self, agent-nix }:
    agent-nix.lib.mkAgent {
      agent = {
        name = "Agent";
        system-prompt =
          "You are a helpful assistant.";
      };
    };
}
```

The key thing to communicate: agent.nix is intentionally minimal. Two required fields, validation at eval time, Docker image out the other end. Adapters add everything else.

## example-agent

The simplest possible capsule. Its README shows the entire `flake.nix` — because the entire capsule *is* a `flake.nix`. Build commands, and a section showing how to switch to an adapter for a real backend. The README is basically a getting-started tutorial in miniature.

## adapter-claude

The most complex repo to document. Two files (`flake.nix` and `telegram-transport.sh`), but the architecture has layers: the adapter wraps agent.nix, builds a Docker image with Claude Code CLI, and the entrypoint runs a Telegram long-polling loop with per-chat session management.

The README includes an architecture diagram (as text) showing the flow from capsule config to running bot. It documents the one runtime secret (`TELEGRAM_BOT_TOKEN`), the baked-in system prompt, and the session lifecycle.

## launcher

Its README focuses on the safety mechanism — build in a worktree, only pull after success. The configuration table (five env vars, all optional) and the deploy cycle (fetch → worktree → build → pull → restart) are the two things a user needs to understand.

## docs, website, tools

Simpler repos, simpler READMEs. The docs site: Astro + Starlight, how to add pages, how it deploys. The website: single-page landing page, dev commands, GitHub Pages deployment. The tools repo: `code2png` and `ascii2png` usage with option tables.

The website README replaces the Astro boilerplate. The seasoned astronaut can finally rest.

## Documentation links

Every README ends with links to the relevant docs pages. The agent.nix README links to the getting-started guide and adapters page. The launcher README links to its detailed documentation. READMEs are the entry point; docs are the depth.

## Restructuring the docs site

Writing READMEs exposed a problem with the docs: the getting-started guide was doing too much. It covered capsule creation, Docker builds, adapters, Telegram setup, and the adapter pattern — all on one page. That's fine for a walkthrough, but it makes it hard to link to specific topics from READMEs.

The fix: split getting-started into three focused pages:

- **Getting started** — create a capsule, required fields, try it in a dev shell
- **Building containers** — `nix build` → Docker image, what's in it, security defaults
- **Adapters** — the adapter pattern, adapter-claude, running a Telegram bot

Each page answers one question. The READMEs link to the specific page that's relevant, not a monolithic guide.

## What changed

Seven repos, seven READMEs. Each one answers what-how-why without over-explaining. The project went from "read the Nix" to "read the README" in one iteration. The docs site went from one overloaded page to four focused ones.

The format is deliberately uniform. When you jump between repos, the structure is familiar: H1, one-liner, what it does, usage, documentation links. You know where to look for build commands (Usage section) and where to find env vars (Configuration section). Consistency is the real documentation.

Two layers of docs now: READMEs for the quick "what is this and how do I run it" answer, docs site for the full walkthrough. The READMEs link to the docs, the docs link between topics. A visitor can start at any repo and find their way to the depth they need.

The deeper lesson: documentation isn't a separate activity from building. Every iteration that adds a feature without explaining it creates debt. These seven READMEs took less effort than any single feature iteration — the hard part was building the things they describe. Writing them down was easy because the code was already clear. Good code makes good documentation possible; good documentation makes good code accessible.
