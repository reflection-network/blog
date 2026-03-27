# blog

Reflection Network blog at [blog.reflection.network](https://blog.reflection.network).

## What it does

An Astro 5 static blog with Content Collections. Posts live in `src/content/blog/` as Markdown directories with images. Deployed to GitHub Pages.

## Development

```bash
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Adding a post

Create a directory in `src/content/blog/` with an `index.md`:

```
src/content/blog/my-post-slug/
├── index.md        # post content
├── featured.png    # featured image (optional)
└── tweet.md        # single tweet text (not rendered on site)
```

Frontmatter:

```yaml
---
title: "Post Title"
description: "Brief summary"
date: 2026-03-25T12:00:00
featured_image: ./featured.png
twitter_discussion: "https://x.com/..."
---
```

Post URLs follow the pattern `/YYYY/MM/slug/`, derived from the frontmatter date and directory name.

## Deployment

Automatic via GitHub Actions on push to `main`. Builds with Node 20 and deploys to GitHub Pages with CNAME `blog.reflection.network`.
