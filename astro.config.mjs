// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// The site's public address, used for the sitemap, robots.txt, security.txt and the links
// search engines and link previews read. On Vercel this is the project's production domain,
// so adding a custom domain there updates it on the next deploy.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'ai-soc-website-orpin.vercel.app';

// https://astro.build/config
// The site itself is static. The committee dashboard at /keystatic is the only part that
// runs on the server, which is why the Vercel adapter is here.
export default defineConfig({
  site: `https://${productionHost}`,
  integrations: [
    react(),
    keystatic(),
    sitemap({
      filter: (page) => !/\/(keystatic|404)(\/|$)/.test(new URL(page).pathname),
      // Internal links have no trailing slash, so the sitemap lists pages the same way.
      serialize: (item) => {
        const url = new URL(item.url);
        if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
        return { ...item, url: url.href };
      },
    }),
  ],
  adapter: vercel(),
  // Workshops moved into the Events page; keep old links working.
  redirects: {
    '/workshops': '/events#workshops',
  },
});
