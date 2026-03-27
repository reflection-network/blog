---
title: "000: What if an AI Agent Was Just a Git Repo?"
description: "Every AI agent framework wants you to write code their way. What if the agent's identity just lived in a Git repo instead?"
date: 2026-03-22T16:28:23
featured_image: ./featured.jpg
---

Every AI agent framework makes the same pitch: here's our SDK, write your agent our way, deploy on our infra, pay us money.

The agent becomes inseparable from the framework. Want to switch LLMs? Rewrite. Move to a different cloud? Rewrite. Version control your agent's evolution? Well, you can version control the code that defines the agent, but the agent itself — its personality, its memory, its configuration — lives somewhere in a database you don't control.

There's a better approach.

## The core idea

An AI agent is a thing that has:

- A name
- A personality (system prompt)
- Ways to talk to the world (transports)
- Memory

That's it. Everything else — which LLM it runs on, how the container is built, how secrets are managed — is infrastructure. Important infrastructure, but not the agent's identity.

What if the agent's identity lived in a Git repo? A config file that says who the agent is, and nothing more:

```
agent = {
  name = "Agent";

  system-prompt = "
    You are a helpful assistant.
    You respond in the same language
    the user writes to you.
  ";
};
```

## Why Git?

Git already solves half the problems agent frameworks are trying to reinvent:

**Version history is agent evolution.** Every commit is a snapshot of who the agent was at that point. Changed the system prompt? That's a commit. Added a new skill? That's a commit. The agent's entire life is in `git log`.

**Branches are experiments.** Want to try a different personality? Branch. If it works, merge. If it doesn't, delete the branch. No one gets hurt.

**Pull requests are change review.** This gets interesting when the agent itself can open PRs. "I think my system prompt should be updated because..." — and a human reviews it before it goes live.

**Forks are reproduction.** Want a new agent based on an existing one? Fork the repo. Tweak the config. A new agent with shared ancestry, and you can even pull upstream improvements.

None of this requires inventing anything. Git has been doing this for 20 years.

## Why declarative config?

Code says HOW. Config says WHAT.

"I am Agent, I speak via Telegram" is a statement of identity. It's not an implementation detail. The moment you write `def handle_message(msg):` you've coupled the agent to a specific runtime, a specific language, a specific way of doing things.

A declarative config is a contract. It says what the agent needs without saying how to provide it. This means the entire runtime can be swapped — today a bash script, tomorrow a proper agent runtime, next month a completely different LLM provider. Same config. Same agent. Different machinery.

This is the first in a series of engineering posts documenting how we're building Reflection — the decisions, the dead ends, and the things that actually worked.
