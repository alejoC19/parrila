import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import data from './src/data/restaurant.json' with { type: 'json' };

export default defineConfig({
  site: data.meta.siteUrl,
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
