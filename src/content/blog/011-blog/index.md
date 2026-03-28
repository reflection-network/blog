---
title: "011: The Blog Is Infrastructure"
description: "The publishing system behind Reflection's engineering blog — Astro Content Collections, structured metadata, a visual style guide, and a process that makes publishing part of every iteration."
date: 2026-03-28T10:00:00
featured_image: ./featured.jpg
---

Every Reflection iteration produces code, documentation, and a blog post. The blog has been part of the delivery pipeline since [iteration 000](/000-intro/) — before there was working code, before there was a docs site. This post documents the engineering behind the blog itself.

## Why the blog ships with every iteration

The blog isn't a separate activity from development. Each iteration ends with publication: code pushed, docs updated, blog post written. This serves two purposes.

First, writing about a change tests whether it's well-understood. If the reasoning behind an engineering decision can't be articulated clearly, the decision may need revisiting. [Iteration 002](/002-docs-site/) made this argument about documentation; the same applies to the blog.

Second, the blog creates a public record of engineering decisions over time. Documentation describes the current state. The blog preserves the reasoning: which approaches were evaluated, why some were rejected, and what trade-offs shaped the final design. This context is difficult to reconstruct after the fact.

## Stack and content schema

The blog is an Astro 5 site using Content Collections. Each post is a directory containing the content, a featured image, and structured metadata:

```
blog/src/content/blog/
├── 000-intro/
│   ├── index.md
│   ├── featured.jpg
│   └── meta.md
├── 001-agent-is-a-repo/
├── ...
└── 011-blog/
```

The content schema defines five fields:

```typescript
const blog = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: 'src/content/blog',
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    featured_image: image().optional(),
    twitter_discussion:
      z.string().url().optional(),
  }),
});
```

Title and date are required. Description, featured image, and a link to the discussion on X are optional. There are no categories, tags, or series fields — the sequential numbering in directory names (`000-`, `001-`, ...) handles ordering. URLs are derived directly from the directory name: `/011-blog/`.

## Structured metadata with meta.md

Each post directory includes a `meta.md` file that Astro does not render. It contains:

- **Key themes** — the core ideas of the post, for quick reference
- **Tweet** — the announcement text for X
- **Image idea** — a short description of the featured image concept
- **Image prompt** — the full prompt for the image generator

Storing image prompts per-post means they can be re-run on newer models without reconstructing the original intent. Key themes provide a summary layer that's more structured than re-reading the full post.

## Visual identity

Every featured image follows a consistent style: abstract artwork on a deep navy background (`#1a1a2e`) with thin technical lines in light gray (`#e0e0e0`). No text, no UI elements, no gradients — minimal, geometric, high contrast.

These colors match the blog's own CSS (`--bg: #1a1a2e`, `--text-primary: #e0e0e0`). The images are part of the design system, not decoration.

Each image prompt uses a three-part template: a constant opening (style and palette), a per-post metaphor (the unique visual concept), and a constant closing (constraints and mood). This structure maintains visual coherence across the series while allowing each post to have a distinct image.

## Five public surfaces

Reflection now has five distinct public surfaces, each serving a different purpose:

| Surface | URL | Purpose |
|---------|-----|---------|
| Landing page | reflection.network | Product positioning |
| Documentation | docs.reflection.network | Technical how-to |
| Blog | blog.reflection.network | Engineering decisions |
| Source code | github.com/reflection-network | Implementation |
| X | x.com/reflection_dev | Announcements |

The landing page explains what Reflection is. The docs explain how to use it. GitHub provides the source. X announces each iteration. The blog fills a gap that none of the others cover: the reasoning behind engineering decisions, the approaches that were evaluated, and the trade-offs that shaped the design.

## What the blog provides

Eleven posts covering the project's engineering history — from the initial concept through schema design, Docker builds, Telegram transport, session persistence, two adapter implementations, and product vision. An Astro site with a five-field Zod schema, directory-per-post structure, unpublished metadata, and a visual style guide.

The goal is for the blog to serve as a durable engineering record — not just what we built, but why we built it this way.
