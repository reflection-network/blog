## Key themes

- Server death spiral: first deploy crashed the entire machine (no swap + unbounded memory)
- Silent failures again: root-owned .claude/ directory makes uid 1000 hang silently
- Self-healing entrypoint: mkdir -p at startup creates directory with correct ownership
- Memory limit as discipline: --memory 4g costs nothing, prevents worst-case
- Five small fixes, one theme: persistence requires multiple safeguards together
- Volume persistence: named volume survives redeploys, credentials flow from host
- Graceful shutdown trap: Ctrl+C preserves state

## Tweet

Reflection agents now keep their state across redeploys. Push a config change, the agent updates without losing conversations or files.

https://blog.reflection.network/008-persistent-home/

## Image idea

Heavy, dense foundation at the bottom — immovable. Above it, structures being torn down and rebuilt. Some show cracks and stress marks (failures). The foundation absorbs everything. Transient above, permanent below.

## Image prompt

Abstract futuristic blueprint-style artwork on a deep navy background (#1a1a2e), drawn with thin technical lines in light gray (#e0e0e0).

A solid geometric foundation — a heavy, dense platform at the bottom of the composition. Above it, structures disassemble and reassemble: wireframe containers being torn down and rebuilt. But the foundation never moves, never changes. Cracks and stress marks on some of the upper structures (the failures — crashed server, silent hangs). The platform absorbs it all. Weight and gravity implied by composition — everything above is transient, the base is permanent.

Include faint blueprint grid lines and technical construction marks, but keep them minimal and clean.

No text, no labels, no UI elements — purely abstract.

Style: minimal, precise, engineering blueprint aesthetic, high contrast, lots of negative space, strict geometry.

No gradients, no glow effects beyond very subtle line intensity variation.

Mood: calm, resilient, systemic — stability beneath chaos.
