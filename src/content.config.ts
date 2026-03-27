import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '*/index.md', base: 'src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    featured_image: image().optional(),
    twitter_discussion: z.string().url().optional(),
  }),
});

export const collections = { blog };
