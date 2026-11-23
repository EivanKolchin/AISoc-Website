// Photo lookups. Astro resizes everything under src/assets at build time.
//
// - src/assets/site: the fixed photos on the home and Events pages (not edited from the dashboard).
// - src/assets/gallery: the Gallery, managed from the dashboard. The dashboard may file
//   uploads in sub-folders (for example photos/3/file.jpg), so lookups search the whole folder.
import type { ImageMetadata } from 'astro';
import gallery from '../data/gallery.json';

type Files = Record<string, { default: ImageMetadata }>;

const siteFiles: Files = import.meta.glob('../assets/site/*.{jpg,jpeg,png,webp}', { eager: true });
const galleryFiles: Files = import.meta.glob('../assets/gallery/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}', { eager: true });

/** Find a file in a folder by the name or relative path written in the data. */
export function findIn(files: Files, file: string | null | undefined): ImageMetadata | undefined {
  if (!file) return undefined;
  const clean = file.replace(/^\/+/, '');
  return Object.entries(files).find(([path]) => path.endsWith(`/${clean}`))?.[1].default;
}

export function sitePhoto(file: string): ImageMetadata {
  const image = findIn(siteFiles, file);
  if (!image) throw new Error(`Photo "${file}" is not in src/assets/site`);
  return image;
}

type EventInfo = { id: string; name: string; when: string; where: string; link: string };
const events = gallery.events as EventInfo[];

export const galleryEvents = events;

// Photos whose file is missing are skipped rather than breaking the build.
export const galleryPhotos = gallery.photos
  .map((item) => ({
    ...item,
    image: findIn(galleryFiles, item.file),
    eventInfo: events.find((ev) => ev.id === item.event),
  }))
  .filter((item): item is typeof item & { image: ImageMetadata } => Boolean(item.image));
