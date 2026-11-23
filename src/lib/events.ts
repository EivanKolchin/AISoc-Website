// Date and event helpers shared by the build (Astro) and the browser (calendar script).
// Each event is a file in src/data/events/. Times are UK wall-clock times, written
// without an offset.

export interface EventItem {
  /** The file name, which is also the address of the event's calendar file. */
  id: string;
  title: string;
  short: string;
  level: string;
  /** "YYYY-MM-DD" (time not known) or "YYYY-MM-DDTHH:mm" */
  start: string;
  end: string | null;
  location: string;
  locationShort: string;
  with: string[];
  note: string;
  blurb: string;
  page: string;
  stat: string;
  recap: string;
  recapLabel: string;
}

/** An event file as the dashboard writes it: the after-the-event details sit in a group. */
export type EventFile = Partial<Omit<EventItem, 'stat' | 'recap' | 'recapLabel'>> & {
  after?: Partial<Pick<EventItem, 'stat' | 'recap' | 'recapLabel'>>;
};

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WD_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_EVENT: Omit<EventItem, 'id' | 'title' | 'start'> = {
  short: '',
  level: '',
  end: null,
  location: '',
  locationShort: '',
  with: [],
  note: '',
  blurb: '',
  page: '',
  stat: '',
  recap: '',
  recapLabel: '',
};

/**
 * Turns event files into the list the pages use, in date order. The dashboard leaves
 * out fields that are empty when it saves, so they are filled back in here.
 */
export function eventList(raw: ReadonlyArray<EventFile>): EventItem[] {
  return raw
    .filter((ev) => ev.id && ev.title && ev.start)
    .map(({ after, ...ev }) => {
      const item = { ...EMPTY_EVENT, ...ev, ...after } as EventItem;
      if (!item.short) item.short = item.title;
      if (!item.end) item.end = null;
      if (!Array.isArray(item.with)) item.with = [];
      return item;
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function hasTime(value: string): boolean {
  return value.includes('T');
}

export function parseLocal(value: string): Date {
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!timePart) return new Date(y, m - 1, d);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday of the week that contains the date. */
export function mondayOf(date: Date): Date {
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  return addDays(startOfDay(date), -day);
}

/** Index of the weekday with Monday as 0. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function ymd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fmtTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function eventStart(ev: EventItem): Date {
  return parseLocal(ev.start);
}

/** When the event is over. Date-only events last until the end of their day. */
export function eventEnd(ev: EventItem): Date {
  if (ev.end) {
    return hasTime(ev.end) ? parseLocal(ev.end) : addDays(parseLocal(ev.end), 1);
  }
  const start = parseLocal(ev.start);
  if (!hasTime(ev.start)) return addDays(start, 1);
  return new Date(start.getTime() + 60 * 60 * 1000);
}

export function isPast(ev: EventItem, now: Date): boolean {
  return eventEnd(ev).getTime() <= now.getTime();
}

export function byStart(a: EventItem, b: EventItem): number {
  return eventStart(a).getTime() - eventStart(b).getTime();
}

export function upcoming(events: EventItem[], now: Date): EventItem[] {
  return events.filter((ev) => !isPast(ev, now)).sort(byStart);
}

export function past(events: EventItem[], now: Date): EventItem[] {
  return events.filter((ev) => isPast(ev, now)).sort((a, b) => byStart(b, a));
}

/** Every calendar day an event touches, as "YYYY-MM-DD". */
export function eventDays(ev: EventItem): string[] {
  const first = startOfDay(eventStart(ev));
  const lastInstant = ev.end ? (hasTime(ev.end) ? parseLocal(ev.end) : parseLocal(ev.end)) : first;
  const last = startOfDay(lastInstant);
  const days: string[] = [];
  for (let d = first; d.getTime() <= last.getTime(); d = addDays(d, 1)) days.push(ymd(d));
  return days;
}

export function isMultiDay(ev: EventItem): boolean {
  return eventDays(ev).length > 1;
}

/** "Tue 24 Nov" */
export function dayLabel(date: Date): string {
  return `${WD_SHORT[weekdayIndex(date)]} ${date.getDate()} ${MON_SHORT[date.getMonth()]}`;
}

/** "Tuesday 24 November" */
export function longDayLabel(date: Date): string {
  return `${WEEKDAYS[weekdayIndex(date)]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "17:00 to 18:00", a multi-day range, or "" when no time is known. */
export function whenLine(ev: EventItem): string {
  const start = eventStart(ev);
  if (isMultiDay(ev) && ev.end) {
    const end = parseLocal(ev.end);
    const a = hasTime(ev.start) ? `${dayLabel(start)}, ${fmtTime(start)}` : dayLabel(start);
    const b = hasTime(ev.end) ? `${dayLabel(end)}, ${fmtTime(end)}` : dayLabel(end);
    return `${a} to ${b}`;
  }
  if (!hasTime(ev.start)) return '';
  if (ev.end && hasTime(ev.end)) return `${fmtTime(start)} to ${fmtTime(parseLocal(ev.end))}`;
  return fmtTime(start);
}

/** One line for list rows: the written summary if there is one, else time and place. */
export function rowLine(ev: EventItem): string {
  if (ev.summary) return ev.summary;
  const when = whenLine(ev);
  const where = ev.location === 'Online' ? 'online' : ev.location;
  const base = [when, where].filter(Boolean).join(', ');
  return ev.note ? `${base}. ${ev.note}` : base;
}

/** "Today", "Tomorrow", "In 3 days", or "Now" while it is running. */
export function relativeDay(ev: EventItem, now: Date): string {
  const start = eventStart(ev);
  if (start.getTime() <= now.getTime() && !isPast(ev, now)) return hasTime(ev.start) ? 'Now' : 'Today';
  const days = Math.round((startOfDay(start).getTime() - startOfDay(now).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function hasLink(url: string | null | undefined): boolean {
  return !!url && url !== '#';
}

const SMALL_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

export function numberWord(n: number): string {
  return SMALL_NUMBERS[n] ?? String(n);
}

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
