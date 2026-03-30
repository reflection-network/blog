# Reflection Blog

Engineering blog at blog.reflection.network. Astro 5, Content Collections.

## What this blog is

Company engineering blog. Each iteration = one feature. Two outputs:

- **Tweet** — product announcement (what's new, why it matters)
- **Blog post** — engineering story behind the feature (decisions, problems, trade-offs)

The tone is technical and direct. No marketing, no hype. Write for engineers who want to understand how things work and why decisions were made. Show real code, real problems, real trade-offs. Admit mistakes. Don't oversell.

## Post structure

Each post is a directory:

```
blog/src/content/blog/NNN-slug/
├── index.md        # post content
├── featured.jpg    # blueprint image (JPEG q90)
└── meta.md         # metadata (not rendered by Astro)
```

### index.md

Frontmatter:

```yaml
title: "NNN: Short Title"
description: "One sentence — what this iteration delivers."
date: YYYY-MM-DDTHH:MM:SS
featured_image: ./featured.jpg
```

Content structure:

- **Opening** (1-2 paragraphs) — what and why. Orients the reader, doesn't summarize the whole post.
- **Body** — engineering story. Sections organized by decisions/problems. Free-form names and count, depends on the iteration.
- **Closing** (1 paragraph) — what changed concretely. Can list repos.

### Principles

1. **Story, not changelog.** Tell the story of decisions, not a list of changes.
2. **Decision-driven.** Each section is a choice: what options existed, what was chosen, why. If there was no real decision — don't inflate into a section.
3. **Honest about failures.** Dead ends, bugs, wrong approaches — the interesting parts.
4. **Real code.** Actual code from repos, not pseudocode. Only when it helps understand the decision.
5. **Concise.** No filler. If a section doesn't add insight, cut it.

### What NOT to include

- "What's next" — the next iteration will tell its own story. The blog is not a roadmap.
- Tutorial-style instructions — that's what docs are for.
- Marketing language — this is an engineering blog.

### meta.md

Not rendered by Astro. Four sections:

```markdown
## Key themes
- ...

## Tweet
...

## Image idea
...

## Image prompt
...
```

- **Key themes** — bullet list of core ideas. Quick sanity check against the actual post.
- **Tweet** — copy-paste to X.
- **Image idea** — short human-readable concept for the featured image.
- **Image prompt** — full self-contained prompt for the image generator.

### Tweet format

One tweet, not a thread. Product-oriented announcement: what's new, why it matters. No hashtags. 1-2 sentences + blog post link.

### Featured images

Blueprint-style abstract artwork, generated via ChatGPT image generation. One image per post.

**Prompt structure:** opening + metaphor + closing. The full prompt is self-contained — copy and paste into an image generator.

Opening (constant):
```
Abstract futuristic blueprint-style artwork on a deep navy background (#1a1a2e), drawn with thin technical lines in light gray (#e0e0e0).
```

Metaphor (per-iteration): 2-4 sentences describing the specific visual scene.

Closing (constant):
```
Include faint blueprint grid lines and technical construction marks, but keep them minimal and clean.

No text, no labels, no UI elements — purely abstract.

Style: minimal, precise, engineering blueprint aesthetic, high contrast, lots of negative space, strict geometry.

No gradients, no glow effects beyond very subtle line intensity variation.

Mood: calm, systemic, engineered.
```

The Mood line can be adjusted per-iteration (e.g. "calm, resilient, systemic").

**Converting to JPEG:**

```bash
nix-shell -p imagemagick --run "magick input.png -quality 90 featured.jpg"
```

Delete the original PNG after conversion — only `featured.jpg` goes into the repo.

## Content schema

Defined in `src/content.config.ts`. Five fields:

- `title` (required)
- `description` (optional)
- `date` (required)
- `featured_image` (optional)
- `twitter_discussion` (optional, URL to the tweet)

Astro only processes `*/index.md` — meta.md is ignored by the loader.