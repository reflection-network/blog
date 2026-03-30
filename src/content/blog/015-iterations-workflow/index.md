---
title: "015: Vertical Iterations"
description: "Why every iteration cuts through the entire stack — code, docs, blog, tooling — instead of building one layer at a time."
date: 2026-03-30T20:00:00
---

The standard approach to building software is horizontal. Design the architecture. Build the backend. Build the frontend. Write the tests. Write the docs. Each phase is a separate task, often assigned to separate people, often months apart.

The problem isn't that it doesn't work. It's that it works too well at hiding surprises. You don't find out the architecture was wrong until you build on it. You don't find out the docs are stale until someone reads them. You don't find out the blog is six months behind until you try to explain what the product does.

Reflection uses a different approach. Every iteration is a vertical cut through the entire stack.

## Horizontal vs vertical

Horizontal development slices a project by layer. First all the infrastructure, then all the features, then all the documentation, then all the tests. Each layer feels productive in isolation. But the layers drift apart. The architecture imagines features that never get built. The docs describe interfaces that changed three times since they were written. The tests cover yesterday's code.

Vertical development slices by increment. Each iteration adds a small piece of functionality, but touches every layer that piece needs: code, configuration, documentation, blog post, deployment. Nothing ships partially. If the code exists, the docs describe it. If the docs describe it, the code works.

Reflection has done fifteen iterations. Each one produced:

- **Code** — commits to the affected repos
- **Notes** — design decisions and trade-offs, written during development
- **Docs** — updated to reflect what exists, not what's planned
- **READMEs** — updated in every changed repo
- **Blog post** — the engineering story behind the iteration
- **Tweet** — a public announcement

Miss any one of these, and the iteration isn't done. This is the rule, not the aspiration. Fourteen times out of fourteen, every artifact shipped together.

## Why this works

The artifacts aren't busywork. Each one catches problems the others miss.

**Writing the blog post tests understanding.** If you can't explain a design decision in plain English, you probably don't understand it well enough. [Iteration 014](/014-claude-md/) restructured the AI assistant's context files. The blog post forced us to articulate why a monolithic config is worse than per-repo files. That reasoning wasn't in the code or the commit messages — it only emerged in the writing.

**Updating docs catches staleness immediately.** When docs are a separate task, they fall behind. When they're part of every iteration, the delta is always small — one page to update, one section to add. The work is trivial because it's never allowed to accumulate.

**The checklist forces completeness.** It's tempting to ship code and promise to write docs later. The iteration checklist makes "later" impossible. Every merge is blocked until every artifact exists.

## The tooling

Vertical iterations across twelve repos need tooling. You can't `cd` into twelve directories and manage branches manually.

The iteration workflow uses Git worktrees. Each iteration gets its own workspace — a directory containing a worktree from every repo, all on the same branch:

```
~/reflection-wip/
├── 015-iterations-workflow/    # workspace
│   ├── adapter-claude/         # worktree on branch 015-iterations-workflow
│   ├── agent.nix/              # worktree on branch 015-iterations-workflow
│   ├── blog/                   # worktree on branch 015-iterations-workflow
│   ├── docs/                   # ...
│   └── ...
├── .claude/                    # shared config (master checkout)
└── wip/                        # workflow scripts (master checkout)
```

One command creates the workspace. One command shows all changes across all repos. One command merges everything back:

```bash
wip-new 015 iterations-workflow   # create workspace
wip-diff 015-iterations-workflow  # total diff across all repos
wip-merge 015-iterations-workflow # merge all branches, push
wip-rm 015-iterations-workflow    # clean up worktrees
```

The repo list lives in a single config file — `repos.conf`. Adding a repo to the workflow means adding one line. Every script reads from it. No duplication, no drift.

The scripts are packaged as a Nix flake. `nix develop` in the `wip/` repo adds all commands to PATH — no manual installation, no symlinks, works from any directory. Nix bakes `repos.conf` into the scripts at build time, so the commands are self-contained.

This iteration moved the scripts themselves into a versioned repo. Before, they were loose files with no git history. The repo list was duplicated in four scripts — adding a repo meant editing four files. Now there's one source of truth, and the tooling is a Nix derivation like everything else in the project.

## What vertical iterations cost

They're slower per feature. A horizontal approach would let you build three features before writing a single doc. Vertical iterations force you to document each one before moving to the next.

They require discipline. It's always faster to skip the blog post, to leave the README for tomorrow. The checklist is the enforcement mechanism, but it only works if you actually follow it.

They require tooling. Managing twelve repos with worktrees and branch naming conventions isn't free. This iteration exists specifically to version and maintain that tooling.

## What they buy

No documentation debt. Every feature that exists is documented. Every doc that exists describes working code.

A public engineering record. Fifteen blog posts tell the story of every decision — what was tried, what failed, what shipped. This context is impossible to reconstruct after the fact.

Smaller blast radius. When every iteration is small, mistakes are small. A bad architecture decision in iteration 003 is three iterations of work to fix, not six months.

Forced clarity. You can't write a blog post about a feature you don't understand. You can't update docs for an interface you haven't tested. The artifacts are forcing functions for quality.

## The result

Fifteen iterations. Twelve repos. A schema, two adapters, a launcher, Docker images, persistent storage, a documentation site, a blog, a landing page, per-repo AI context, and now the workflow tooling itself — all versioned, all documented, all working.

The iteration workflow is now a repo like any other: versioned, shared, part of the workspace it manages.
