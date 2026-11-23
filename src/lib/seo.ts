// Structured data (JSON-LD, schema.org) for search engines: who the society is, the
// names people search for it by, and its events. Base.astro writes it into the page.
import site from '../data/site.json';
import { type EventItem, hasLink } from './events';

type Data = Record<string, unknown>;

/** Other names the society goes by, so a search for any of them finds the site. */
const OTHER_NAMES = ['AISoc', 'AI Society', 'Artificial Intelligence Society', 'UoS Artificial Intelligence Society', 'University of Southampton AI Society'];

/** Profiles that belong to the society (invite links and sign-up forms are not profiles). */
const PROFILE_IDS = ['instagram', 'facebook', 'linkedin', 'github'];

function root(base: URL | undefined): URL {
  if (!base) throw new Error('Set "site" in astro.config.mjs');
  return base;
}

const society = (base: URL) => ({ '@type': 'Organization', name: site.name, url: base.href });

/** The website itself: tells Google which name to show for the site in results. */
export function websiteData(base: URL | undefined): Data {
  const url = root(base);
  return {
    '@type': 'WebSite',
    '@id': new URL('/#website', url).href,
    name: site.name,
    alternateName: OTHER_NAMES.slice(0, 2),
    url: url.href,
    inLanguage: 'en-GB',
    publisher: { '@id': new URL('/#society', url).href },
  };
}

/** The society as an organisation, with its logo, email and social profiles. */
export function societyData(base: URL | undefined): Data {
  const url = root(base);
  const profiles = site.social.filter((item) => PROFILE_IDS.includes(item.id) && hasLink(item.url)).map((item) => item.url);
  return {
    '@type': 'Organization',
    '@id': new URL('/#society', url).href,
    name: site.name,
    alternateName: OTHER_NAMES,
    description: site.tagline,
    url: url.href,
    logo: new URL('/logo-mark.png', url).href,
    email: site.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Southampton', addressCountry: 'GB' },
    parentOrganization: { '@type': 'Organization', name: "Southampton University Students' Union", alternateName: 'SUSU', url: 'https://www.susu.org/' },
    sameAs: [...profiles, site.membership.url].filter(hasLink),
  };
}

/** "2026-12-03T18:00" in UK time becomes "2026-12-03T18:00:00+00:00" (or +01:00 in summer). */
export function ukDateTime(value: string): string {
  if (!value.includes('T')) return value;
  const zone =
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })
      .formatToParts(new Date(`${value}:00Z`))
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  return `${value}:00${zone === 'GMT' ? '+00:00' : zone.replace('GMT', '')}`;
}

/** One event, in the shape Google uses for event listings. Events with no place yet are left out. */
export function eventData(ev: EventItem, base: URL | undefined): Data | null {
  const url = root(base);
  const where = ev.location.trim();
  if (!where) return null;
  const online = /^online$/i.test(where);
  const link = hasLink(ev.page) ? new URL(ev.page, url).href : new URL('/events', url).href;
  const place = /southampton|campus/i.test(where) ? where : `${where}, ${site.university}`;
  return {
    '@type': 'Event',
    name: ev.title,
    description: ev.blurb || ev.note || `${ev.title}, run by ${site.name}.`,
    startDate: ukDateTime(ev.start),
    ...(ev.end ? { endDate: ukDateTime(ev.end) } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', url: link }
      : { '@type': 'Place', name: place, address: { '@type': 'PostalAddress', addressLocality: 'Southampton', addressCountry: 'GB' } },
    url: link,
    organizer: society(url),
  };
}

/** The script body for a page's structured data. "<" is escaped so text can never end the tag. */
export function jsonLd(items: Data[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': items }).replace(/</g, '\\u003c');
}
