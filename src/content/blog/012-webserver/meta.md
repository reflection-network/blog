## Title
Agent Gets a Web Server

## Description
Adding nginx to every agent container — the base layer owns the web server, adapters extend it through conf.d, and nginx specificity rules make the whole thing composable.

## Key themes
- nginx as base infrastructure in agent.nix, not in adapters — identity belongs in the base layer
- Composability through conf.d + nginx specificity: adapters drop catch-all proxy, agent.nix claims specific paths
- The /agent/ prefix that didn't work: SPA with hardcoded absolute paths breaks sub-path proxying
- Custom tunnel trick: a shell script that pretends to be a tunnel for ZeroClaw's public URL
- The flake-utils transpose bug: `base.web.${system}` not `base.${system}.web`

## Tweet
Every Reflection agent now has a web server. nginx in the base layer, proxy configs in the adapter. agent.nix owns the server and claims specific paths, the adapter drops a catch-all proxy into conf.d. Composable by design.

https://blog.reflection.network/012-webserver/

## Image idea
An abstract schematic of a gateway or portal structure. A central rectangular frame with clean geometric pathways branching through it — one direct path to a static element, another path routing through a proxy node. Blueprint precision, architectural routing.

## Image prompt
Abstract futuristic blueprint-style artwork on a deep navy background (#1a1a2e), drawn with thin technical lines in light gray (#e0e0e0).

A schematic cross-section of a gateway architecture. A central rectangular portal frame with two distinct pathways passing through it. The upper path leads directly to a simple static element — a flat panel or display. The lower path routes through a smaller intermediary node before reaching a more complex structure behind the gateway. Faint connection lines show the routing logic. The gateway frame is prominent and precisely drawn, with subtle structural supports and alignment marks.

Include faint blueprint grid lines and technical construction marks, but keep them minimal and clean.

No text, no labels, no UI elements — purely abstract.

Style: minimal, precise, engineering blueprint aesthetic, high contrast, lots of negative space, strict geometry.

No gradients, no glow effects beyond very subtle line intensity variation.

Mood: calm, systemic, engineered — a controlled entry point.
