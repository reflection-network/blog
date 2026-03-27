## Title

Second Adapter

## Description

One adapter is an implementation. Two adapters is a pattern. ZeroClaw proves the capsule abstraction holds across completely different runtimes.

## Key themes

- One vs two: implementation becomes pattern with the second adapter
- Schema extension without breakage: new optional fields that existing capsules ignore
- ZeroClaw as proof: Rust binary vs bash scripts, same capsule config
- autoPatchelfHook: patching ELF binary for Nix containers
- Secret injection at runtime: sed injects TOML secrets the entrypoint
- Conditional dependencies: provider field controls what goes into the image
- Same capsule, two runtimes: one import line changes, everything else identical
- Comparison table: adapter-claude vs adapter-zeroclaw tradeoffs

## Tweet

One adapter is an implementation. Two adapters is a pattern. Same capsule config, two completely different runtimes — bash+Claude CLI vs ZeroClaw (Rust). The abstraction holds.

https://blog.reflection.network/009-zeroclaw-adapter/

## Image idea

Two different geometric systems on opposite sides, connected by an adapter piece in the center. The adapter's left side matches the left system, right side matches the right. Above both — one shared shape (capsule), identical for both runtimes.

## Image prompt

Abstract futuristic blueprint-style artwork on a deep navy background (#1a1a2e), drawn with thin technical lines in light gray (#e0e0e0).

Two distinct geometric systems on opposite sides of the composition — different internal structures, different edge patterns, clearly different architectures. In the center, a translation layer connects them: an adapter piece whose left side matches the geometry of the left system and right side matches the right. Above both systems, a single shared shape floats — the capsule config, identical for both, connecting to each system through the adapter. One implementation becomes a pattern.

Include faint blueprint grid lines and technical construction marks, but keep them minimal and clean.

No text, no labels, no UI elements — purely abstract.

Style: minimal, precise, engineering blueprint aesthetic, high contrast, lots of negative space, strict geometry.

No gradients, no glow effects beyond very subtle line intensity variation.

Mood: calm, systemic, engineered.
