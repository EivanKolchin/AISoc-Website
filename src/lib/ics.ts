// Builds iCalendar (.ics) text from the events data, for "Add to calendar" and the
// subscribable /calendar.ics feed. Times are written in the Europe/London zone.

import { type EventItem, addDays, hasTime, parseLocal } from './events';

const CRLF = '\r\n';

const LONDON_TZ = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/London',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:BST',
  'DTSTART:19700329T010000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:GMT',
  'DTSTART:19701025T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateOnly(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function dateTime(date: Date): string {
  return `${dateOnly(date)}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function utcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function text(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold lines longer than 75 octets, as the format requires. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(' ' + rest);
  return parts.join(CRLF);
}

function eventLines(ev: EventItem, stamp: string): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${ev.id}@aisoc.soton`, `DTSTAMP:${stamp}`];
  const start = parseLocal(ev.start);
  if (hasTime(ev.start)) {
    const end = ev.end && hasTime(ev.end) ? parseLocal(ev.end) : new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(`DTSTART;TZID=Europe/London:${dateTime(start)}`);
    lines.push(`DTEND;TZID=Europe/London:${dateTime(end)}`);
  } else {
    const lastDay = ev.end ? parseLocal(ev.end.split('T')[0]) : start;
    lines.push(`DTSTART;VALUE=DATE:${dateOnly(start)}`);
    lines.push(`DTEND;VALUE=DATE:${dateOnly(addDays(lastDay, 1))}`);
  }
  lines.push(`SUMMARY:${text(ev.title)}`);
  if (ev.location) lines.push(`LOCATION:${text(ev.location)}`);
  const about: string[] = [];
  if (ev.level) about.push(ev.level + '.');
  if (ev.with.length) about.push(`With ${ev.with.join(', ')}.`);
  if (ev.note) about.push(ev.note);
  about.push('Southampton AI Society.');
  lines.push(`DESCRIPTION:${text(about.join(' '))}`);
  if (ev.page && ev.page !== '#') lines.push(`URL:${ev.page}`);
  lines.push('END:VEVENT');
  return lines;
}

export function buildCalendar(events: EventItem[], name = 'Southampton AI Society'): string {
  const stamp = utcStamp(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Southampton AI Society//Website//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${text(name)}`,
    'X-WR-TIMEZONE:Europe/London',
    ...LONDON_TZ,
  ];
  for (const ev of events) lines.push(...eventLines(ev, stamp));
  lines.push('END:VCALENDAR');
  return lines.map(fold).join(CRLF) + CRLF;
}
