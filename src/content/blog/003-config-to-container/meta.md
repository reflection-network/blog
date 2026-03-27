## Title

Config to Container

## Description

nix build turns a capsule into a Docker image. Non-root user, writable home, zero Dockerfiles.

## Key themes

- Silent failures: Claude Code hangs when $HOME not writable — no error, just silence
- buildLayeredImage + fakeRootCommands: the only combination that works for file ownership
- Body for the agent: a Docker container the agent can inhabit
- Nix sandbox limitations: CAP_CHOWN denied, chown silently fails
- Reproducible timestamps: Jan 1 1980 from deterministic builds
- Multiple failed attempts: streamLayeredImage, runAsRoot, each wrong in its own way

## Tweet

nix build turns a capsule into a Docker image. Non-root user, writable home, zero Dockerfiles. Getting there took multiple failed attempts — chown silently failing in a sandbox was the worst.

https://blog.reflection.network/003-config-to-container/

## Image idea

Flat 2D schematic on the left transforming into a sealed 3D container on the right. Config becoming a runnable image. Below, a couple of discarded incomplete constructions — failed attempts.

## Image prompt

Abstract futuristic blueprint-style artwork on a deep navy background (#1a1a2e), drawn with thin technical lines in light gray (#e0e0e0).

A flat 2D schematic on the left side — clean, structured, like a floor plan or circuit diagram. On the right side, the same structure extruded into a three-dimensional sealed container — a cube with visible internal compartments. Between them, transformation lines show the morphing process: 2D becoming 3D. The container is closed, complete, ready to run. A few failed construction attempts visible as faint, incomplete shapes discarded below.

Include faint blueprint grid lines and technical construction marks, but keep them minimal and clean.

No text, no labels, no UI elements — purely abstract.

Style: minimal, precise, engineering blueprint aesthetic, high contrast, lots of negative space, strict geometry.

No gradients, no glow effects beyond very subtle line intensity variation.

Mood: calm, systemic, engineered.
