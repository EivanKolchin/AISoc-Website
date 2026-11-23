// /.well-known/security.txt (RFC 9116): who to tell about a security problem with the site.
// The expiry date is set a little under a year after each deploy, so it renews itself.
import type { APIRoute } from 'astro';
import site from '../../data/site.json';

const DAY = 24 * 60 * 60 * 1000;

export const GET: APIRoute = ({ site: siteUrl }) => {
  const expires = new Date(Date.now() + 364 * DAY).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const body = [
    `# Found a security problem with the ${site.name} website? Email the committee.`,
    `Contact: mailto:${site.email}`,
    `Expires: ${expires}`,
    'Preferred-Languages: en',
    `Canonical: ${new URL('/.well-known/security.txt', siteUrl).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
