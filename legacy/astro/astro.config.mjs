// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Keep in sync with `site.url` in src/config/site.ts. The live site canonicalises to www.
const SITE_URL = 'https://www.nothingwrongwithyou.org';

/**
 * Opens external links in Markdown content in a new tab (templates set target= by hand).
 * Links to this site's own absolute URL stay in the same tab.
 */
const OWN_HOST = new URL(SITE_URL).hostname.replace(/^www\./, '');
const externalLinksInNewTab = {
  name: 'external-links-in-new-tab',
  element: {
    filter: ['a'],
    /**
     * @param {any} node
     * @param {any} ctx
     */
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
      if (new URL(href).hostname.replace(/^www\./, '') === OWN_HOST) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', 'noopener noreferrer');
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [sitemap()],
  markdown: { processor: satteri({ hastPlugins: [externalLinksInNewTab] }) },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      provider: fontProviders.fontsource(),
      weights: [300, 400, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow',
      provider: fontProviders.fontsource(),
      weights: [600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
  ],
});
