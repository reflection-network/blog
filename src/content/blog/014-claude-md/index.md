---
title: "014: Teaching the AI Your Codebase"
description: "Splitting a monolithic CLAUDE.md into per-repo files so the AI assistant has the right context wherever it works."
date: 2026-03-30T18:00:00
---

Reflection is built by a human and an AI working together in [Claude Code](https://docs.anthropic.com/en/docs/claude-code). The AI reads a `CLAUDE.md` file at the start of every session — project conventions, architecture decisions, workflow rules. It's the persistent memory between conversations.

Until now, everything lived in one file: Nix schema details, Telegram transport behavior, blog writing guidelines, image generation prompts, commit conventions, iteration process. One file for twelve repos. This iteration splits it into pieces that match the workspace structure.

## The problem with one file

Reflection is a workspace of independent Git repos. agent.nix defines the schema, adapters wrap it for specific runtimes, the blog is an Astro site, the launcher is a bash script. Each repo has its own stack, its own conventions, its own gotchas.

Claude Code loads `CLAUDE.md` from the project root. When working inside `adapter-zeroclaw/`, the AI gets the workspace-level file — which mentions that adapter-zeroclaw uses "Nix, ZeroClaw (Rust binary), TOML config generation" in a table row. That's not enough context to work effectively. The details about config.toml generation, secret injection via sed, the nginx reverse proxy to port 42617 — none of that was written down for the AI.

Meanwhile, the workspace-level file included four paragraphs about blog featured images and a Twitter thread format that was no longer accurate. Repo-specific knowledge was either missing or buried in the wrong place.

## What stays, what moves

The split follows a simple rule: **process stays at the workspace level, technical details move to the repo.**

The workspace `CLAUDE.md` keeps the things that apply everywhere: what Reflection is, the directory structure, commit workflow (GPG-signed, approval required), commit message format, iteration process, the artifacts checklist. These are conventions you need regardless of which repo you're in.

Everything else moves to a `CLAUDE.md` at each repo's root:

- **agent.nix** gets its schema fields, what mkAgent produces, Docker image details (non-root UID 1000, nginx on 8080, the conf.d extension point)
- **adapter-zeroclaw** gets build-time config generation, runtime secret injection, multi-provider support, the gateway proxy
- **adapter-claude** gets Telegram long-polling details, session management, required env vars
- **launcher** gets its env vars table, the key invariant (working copy = last successful build), the worktree build flow
- **blog** already had its own `CLAUDE.md` — it absorbs the code image tools reference

Twelve files total, each self-contained for its repo.

## Where to put the file

Claude Code looks for `CLAUDE.md` in two places: `.claude/CLAUDE.md` (project-level, loaded automatically) and `CLAUDE.md` at the repo root (also loaded automatically). The workspace already used `.claude/CLAUDE.md` for the main file. The blog already had `CLAUDE.md` at the root.

Per-repo files go at the root — `CLAUDE.md`, not `.claude/CLAUDE.md`. It's simpler, it's visible, and it's consistent with what `blog/` already does.

## Catching contradictions

Migration forces you to decide where information lives canonically. When the same topic exists in two places with different content, you have to pick one.

The workspace `CLAUDE.md` described a "Twitter thread format" — multiple tweets separated by `---`, a `#BuildInPublic` hashtag, a thread starter template. The blog's `CLAUDE.md` said: "One tweet, not a thread. No hashtags." These had diverged at some point and nobody noticed because both files were maintained separately.

The blog file was correct — the format had evolved from threads to single tweets. The workspace file was stale. Without the migration, this contradiction would have persisted indefinitely. Moving the tweet format canonically to `blog/CLAUDE.md` and removing it from the workspace file resolved it.

## The result

The workspace `CLAUDE.md` went from 165 lines to 97. It no longer mentions nginx ports, Pygments syntax highlighting, or JPEG conversion commands. It's pure process.

Each repo now has context that's specific and actionable. When the AI works inside `launcher/`, it knows about `POLL_INTERVAL`, `WEB_PORT`, and the worktree build invariant. When it works inside `tools/`, it knows about `-bg`, `-fg`, `-fs` flags and the available font list. No irrelevant information, no missing context.

Twelve repos, twelve `CLAUDE.md` files, one workspace-level file tying them together.
