// Every event, read from the files in src/data/events/ (one per event, named by its ID).
import { type EventFile, type EventItem, eventList } from './events';

const files = import.meta.glob<{ default: EventFile }>('../data/events/*.json', { eager: true });

export const allEvents: EventItem[] = eventList(
  Object.entries(files).map(([path, file]) => ({
    ...file.default,
    id: path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, ''),
  })),
);
