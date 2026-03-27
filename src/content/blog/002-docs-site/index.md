---
title: "002: Docs From Day One"
description: "Most projects add docs when they're ready. That's backwards. A standalone Starlight site deployed at iteration two."
date: 2026-03-23T07:21:57
featured_image: ./featured.jpg
---

Two iterations in ([intro](/000-intro/), [agent schema](/001-agent-is-a-repo/)) and we have a schema, an example agent, and a landing page. No documentation. The README in agent.nix explains how to use it, but that's about it.

Most projects add docs when they're "ready." That's backwards. If you're building in the open, documentation is part of the build. It forces you to explain what you've built in a way that makes sense to someone who wasn't there when the decisions were made. And if you can't explain it clearly, maybe the design isn't as clean as you thought.

A standalone documentation site, separate from the landing page, deployed early, gives the project a structure to grow into. Even if there's only one page today, the site itself is an artifact — it says "this project takes documentation seriously."

## Choosing the stack

First question: how do other projects do this?

| Project | Docs repo | Framework | URL |
|---------|-----------|-----------|-----|
| Astro | Separate | Starlight | docs.astro.build |
| Tailwind | Separate | Next.js | tailwindcss.com |
| Deno | Separate | Lume | docs.deno.com |
| Next.js | Same repo | Next.js (private) | nextjs.org/docs |
| nixpkgs | Same repo | nixos-render-docs | nixos.org/manual/ |

The pattern is clear: separate repo, subdomain, purpose-built docs framework. Astro's own documentation runs on Starlight — their docs theme built specifically for this purpose. Since the landing page is already Astro, Starlight is the obvious choice.

Second question: should docs live in the same repo as the landing page? The landing page is one file today, but it won't stay that way. Marketing and documentation serve different audiences, have different update cycles, and benefit from independent deployments. Separate repos.

## Building the site

The docs repo already existed — a single `getting-started.md` from iteration 1. The plan: wrap it in an Astro + Starlight site with a Nix dev shell for the toolchain.

The `flake.nix` is minimal — just a dev shell with Node.js:

```nix
{
  description = "Reflection documentation site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux"
                  "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems
          (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [ pkgs.nodejs ];
        };
      });
    };
}
```

The Astro config sets up Starlight with a sidebar and a Zod workaround (more on that in a moment):

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['zod'],
    },
  },
  integrations: [
    starlight({
      title: 'Reflection Network',
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting started',
              slug: 'getting-started' },
          ],
        },
      ],
    }),
  ],
});
```

The existing `getting-started.md` moved into Starlight's content structure at `src/content/docs/`, gained frontmatter, and became a real documentation page — with sidebar navigation, search (via Pagefind), and a table of contents.

## The Zod v4 bug

The first build failed:

```
Entry docs → 404 was not found.
Cannot read properties of undefined
  (reading '_zod')
```

Astro 5.18 pulls in both Zod v3 (internally) and Zod v4 (via `@astrojs/sitemap`). During the build, Vite externalizes Zod and the rendered chunks import the wrong version. This is a [known issue](https://github.com/withastro/starlight/issues/3333).

The workaround is one line in the Vite config:

```js
vite: {
  ssr: {
    noExternal: ['zod'],
  },
},
```

This forces Vite to bundle Zod instead of externalizing it, so each module gets the version it expects. Build passes, 3 pages generated in 2.7 seconds.

## Connecting the landing page

The landing page had a single "Get started" button pointing to the agent.nix repo on GitHub. That made sense when there were no docs, but now there's a better entry point.

Replaced the single button with two:

```html
<a href="https://docs.reflection.network"
   class="button">Docs</a>
<a href="https://github.com/reflection-network"
   class="button button-secondary">GitHub</a>
```

The primary action is now "read the docs." GitHub is secondary — still visible, but not the first thing you click.

## Three public surfaces

The project now has three public surfaces:

- **reflection.network** — landing page, the pitch
- **docs.reflection.network** — documentation, the how-to
- **github.com/reflection-network** — source code, the what

One page of documentation. One getting-started guide. That's enough for now. The structure is what matters — every new feature from this point forward has a place to be documented before it ships.

The Zod bug cost about 20 minutes of debugging. Not a disaster, but a reminder that even well-maintained ecosystems have version conflicts at the edges. The fix was simple once the issue turned up on GitHub. This is why we prefer established tools — someone else has already hit the bug and written the workaround.
