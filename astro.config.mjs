// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Workshops moved into the Events page; keep old links working.
  redirects: {
    '/workshops': '/events#workshops',
  },
});
