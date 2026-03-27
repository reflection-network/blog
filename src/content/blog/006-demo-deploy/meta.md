## Title

Demo Deploy

## Description

A dev launcher watches the capsule's git repo, builds in an isolated git worktree, and restarts the container automatically. Push a change, the agent updates itself — safely.

## Key themes

- Safety via isolation: build in a worktree, never touch working copy until success
- Self-updating agent: the agent pushes commits, launcher detects and rebuilds
- Deployment invariant: working copy always contains last successfully built code
- Worktree as safety net: failed build → worktree removed, old version keeps running
- Edit → commit → push → wait: development loop is just git operations
- Image name discovery: parse Docker load output, no configuration needed

## Tweet

Push a commit, the agent updates itself — safely. A dev launcher builds in an isolated git worktree. If the build fails, the old version keeps running. The working copy always has the last good build.

https://blog.reflection.network/006-demo-deploy/

## Image idea

Circular pipeline loop with nodes at each stage. One node brighter (active build). A branch leads to an isolated workspace and reconnects on success; a dashed dead-end branch for failed builds. The main loop never stops.

## Image prompt

Abstract futuristic blueprint-style artwork on a deep navy background (#1a1a2e), drawn with thin technical lines in light gray (#e0e0e0).

A circular loop structure with discrete stages (nodes) along its path — like a conveyor or pipeline. One node is slightly brighter than others (the active build). A secondary path branches off from one node into an isolated workspace (the worktree) and reconnects only on success. A faint dashed branch leads to a dead end (failed build, safely discarded). The main loop continues regardless. Arrows indicate direction of flow.

Include faint blueprint grid lines and technical construction marks, but keep them minimal and clean.

No text, no labels, no UI elements — purely abstract.

Style: minimal, precise, engineering blueprint aesthetic, high contrast, lots of negative space, strict geometry.

No gradients, no glow effects beyond very subtle line intensity variation.

Mood: calm, systemic, engineered.
