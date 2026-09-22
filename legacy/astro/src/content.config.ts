import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** The original Squarespace path segment(s) after /blog/, kept so existing URLs keep working. */
    path: z.string(),
    excerpt: z.string().default(''),
    tags: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const collage = defineCollection({
  loader: file('./src/data/collage.json'),
  schema: ({ image }) =>
    z.object({
      image: image(),
      alt: z.string(),
    }),
});

const songs = defineCollection({
  loader: file('./src/data/songs.json'),
  schema: z.object({
    title: z.string(),
    artist: z.string(),
    duration: z.string(),
    src: z.string(),
  }),
});

const videos = defineCollection({
  loader: file('./src/data/videos.json'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      youtubeId: z.string(),
      poster: image(),
    }),
});

export const collections = { blog, pages, collage, songs, videos };
