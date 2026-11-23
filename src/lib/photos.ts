// Photos live in src/assets/gallery so Astro can resize them. gallery.json says which
// to show, in what order, which event each is from, and how to describe it.
import type { ImageMetadata } from 'astro';
import gallery from '../data/gallery.json';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/gallery/*.{jpg,jpeg,png,webp}', { eager: true });

export function photo(file: string): ImageMetadata {
  const match = Object.entries(files).find(([path]) => path.endsWith(`/${file}`));
  if (!match) throw new Error(`Photo "${file}" is listed but not in src/assets/gallery`);
  return match[1].default;
}

type EventInfo = { name: string; when: string; where: string; link: string };
const events = gallery.events as Record<string, EventInfo>;

export const galleryEvents = Object.entries(events).map(([id, info]) => ({ id, ...info }));

export const galleryPhotos = gallery.photos.map((item) => ({
  ...item,
  image: photo(item.file),
  eventInfo: item.event ? events[item.event] : undefined,
}));
