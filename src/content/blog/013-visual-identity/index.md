---
title: "013: Visual Identity"
description: "One color palette across the landing page, docs, and blog. The landing page gets simpler, the docs stop looking like a default template."
date: 2026-03-30T12:00:00
featured_image: ./featured.jpg
---

Reflection has five public surfaces: [landing page](https://reflection.network), [docs](https://docs.reflection.network), [blog](https://blog.reflection.network), [GitHub](https://github.com/reflection-network), and [X](https://x.com/reflection_dev). Three of them are web properties we control — and each looks different. The landing page has its own color scheme from [iteration 010](/010-vision-roadmap/). The docs site uses Starlight's default purple theme. The blog has a dark palette that matches the [blueprint images](/011-blog/).

A visitor moving between the three shouldn't feel like they've left the project. This iteration brings them to a single visual identity.

## Less on the landing page

Iteration 010 added five feature cards with "Built" and "Coming Soon" badges. It was the right move when articulating the vision — the cards mapped out where the project was heading. But a landing page with "Coming Soon" badges is making promises. That contradicts a principle we've held since the start: only publish what works.

The five cards became three one-line highlights:

- **Declarative agents.** Nix config, no SDK lock-in.
- **Git-native.** Branch, fork, version, roll back.
- **Run anywhere.** Self-host, swap runtimes with one line.

No badges, no status indicators. Each line describes something that exists today. The landing page's job is to orient — what is this, where to learn more. The docs and the blog do the rest.

The layout also got a proper structure. The previous `index.astro` was a monolith: HTML head, body, styles, content — all in one file. PostHog analytics lived in a dedicated `PostHogLayout` that only injected a script tag. Now there's a `BaseLayout` with a `Nav` and `Footer` component, and PostHog is part of it. The nav links to Docs, Blog, GitHub, and X — all five surfaces reachable from one place.

## One palette

The blog already established its colors: deep navy `#1a1a2e` background, light gray `#e0e0e0` text, `#4fc3f7` accent. The blueprint featured images use the same values. The landing page used different shades — pure white text, slightly different background gradient.

Now the landing page uses the blog's palette. `rgba(224, 224, 224, ...)` instead of `rgba(255, 255, 255, ...)`. The same `#4fc3f7` for hover states. No gradient — flat `#1a1a2e` background.

For the docs, Starlight exposes its entire theme through CSS custom properties. One file overrides them:

```css
:root[data-theme='dark'] {
  --sl-color-bg: #1a1a2e;
  --sl-color-accent: #4fc3f7;
  --sl-color-text: #e0e0e0;
}
```

Nineteen variables in total — backgrounds, text shades, borders, accent colors. Starlight defaults to light mode with a toggle, but Reflection is a dark-themed project — the landing page, the blog, and the blueprint images are all dark. A light docs site breaks the continuity. Two component overrides force dark mode and remove the theme toggle: `ThemeProvider` sets `data-theme='dark'` on load, an empty `ThemeSelect` hides the switcher.

The docs stop looking like a Starlight template and start looking like Reflection.

## Three repos, one palette

The website repo lost a layout, gained three components, and dropped from five feature sections to three highlights. The docs repo gained a CSS file and two component overrides. The blog already had the right colors — it defined the palette in the first place.

Analytics across all three sites now create visitor profiles automatically, tracking the journey across surfaces through PostHog's reverse proxy.

The visual identity is consistent across every web property we ship — same navy, same gray, same blue accent. A visitor can move between the landing page, the docs, and the blog without noticing the seam.
