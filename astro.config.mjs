// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// The site itself is static. The committee dashboard at /keystatic is the only part that
// runs on the server, which is why the Vercel adapter is here.
export default defineConfig({
  integrations: [react(), keystatic()],
  adapter: vercel(),
  // Workshops moved into the Events page; keep old links working.
  redirects: {
    '/workshops': '/events#workshops',
  },
});
