// HTML renderers for the calendar, the event detail panel and the next-event card.
// The same functions run at build time (so pages are complete without JavaScript)
// and in the browser (so the calendar follows the real date and responds to clicks).

import {
  type EventItem,
  MONTHS,
  MON_SHORT,
  WEEKDAYS,
  WD_SHORT,
  addDays,
  capitalise,
  dayLabel,
  esc,
  eventDays,
  eventStart,
  fmtTime,
  hasLink,
  hasTime,
  isPast,
  longDayLabel,
  mondayOf,
  sameDay,
  whenLine,
  ymd,
} from './events';

export type CalView = 'week' | 'month';

function eventsByDay(events: EventItem[]): Map<string, EventItem[]> {
  const map = new Map<string, EventItem[]>();
  for (const ev of events) {
    for (const day of eventDays(ev)) {
      const list = map.get(day) ?? [];
      list.push(ev);
      map.set(day, list);
    }
  }
  return map;
}

function chipLabel(ev: EventItem, date: Date): string {
  return `${ev.title}, ${longDayLabel(date)}`;
}

export function calendarTitle(view: CalView, anchor: Date, today: Date): string {
  if (view === 'month') return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const monday = mondayOf(anchor);
  const thisMonday = mondayOf(today);
  if (sameDay(monday, thisMonday)) return 'This week';
  if (sameDay(monday, addDays(thisMonday, 7))) return 'Next week';
  if (sameDay(monday, addDays(thisMonday, -7))) return 'Last week';
  return `Week of ${monday.getDate()} ${MONTHS[monday.getMonth()]}`;
}

export function renderWeek(anchor: Date, events: EventItem[], selectedId: string | null, today: Date): string {
  const monday = mondayOf(anchor);
  const byDay = eventsByDay(events);
  let html = '<div class="cal-week">';
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const isToday = sameDay(date, today);
    const dayEvents = byDay.get(ymd(date)) ?? [];
    html += `<div class="cal-day${isToday ? ' today' : ''}">`;
    html += `<span class="cal-dow">${WD_SHORT[i]}${isToday ? ', today' : ''}</span>`;
    html += `<span class="cal-num">${date.getDate()}</span>`;
    if (dayEvents.length) {
      html += '<span class="cal-events">';
      for (const ev of dayEvents) {
        const start = eventStart(ev);
        const time = hasTime(ev.start) && sameDay(start, date) ? fmtTime(start) : '';
        const meta = [time, ev.locationShort].filter(Boolean).join(', ');
        const pastClass = isPast(ev, today) ? ' past' : '';
        html += `<button class="evc${pastClass}" type="button" data-ev="${esc(ev.id)}" aria-pressed="${ev.id === selectedId}" aria-label="${esc(chipLabel(ev, date))}">`;
        html += `<span class="t">${esc(ev.short)}</span>`;
        if (meta) html += `<span class="m">${esc(meta)}</span>`;
        html += '</button>';
      }
      html += '</span>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

export function renderMonth(anchor: Date, events: EventItem[], selectedId: string | null, today: Date): string {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = mondayOf(first);
  const gridEnd = addDays(mondayOf(last), 6);
  const byDay = eventsByDay(events);
  let html = '<div class="cal-month">';
  html += '<div class="cal-dows" aria-hidden="true">' + WD_SHORT.map((d) => `<span>${d}</span>`).join('') + '</div>';
  html += '<div class="cal-cells">';
  for (let date = gridStart; date.getTime() <= gridEnd.getTime(); date = addDays(date, 1)) {
    const off = date.getMonth() !== anchor.getMonth();
    const isToday = sameDay(date, today);
    const dayEvents = byDay.get(ymd(date)) ?? [];
    html += `<div class="mcell${off ? ' off' : ''}${isToday ? ' today' : ''}">`;
    html += `<span class="mnum">${date.getDate()}${isToday ? '<span class="sr-only">, today</span>' : ''}</span>`;
    for (const ev of dayEvents) {
      const pastClass = isPast(ev, today) ? ' past' : '';
      // The square shows only the name. Hovering slides out a short preview; the time
      // and place stay for the preview and the details panel.
      const wd = (date.getDay() + 6) % 7;
      const multi = eventDays(ev).length > 1;
      const when = multi ? whenLine(ev) : [dayLabel(eventStart(ev)), whenLine(ev)].filter(Boolean).join(', ');
      const place = ev.location === 'Online' ? 'Online' : ev.location;
      const hint = isPast(ev, today) ? 'See what happened' : 'Open the details';
      html +=
        `<button class="mchip${pastClass}${wd >= 5 ? ' flip' : ''}" type="button" data-ev="${esc(ev.id)}" aria-pressed="${ev.id === selectedId}" aria-label="${esc(chipLabel(ev, date))}">` +
        `<span class="mc-title">${esc(ev.short)}</span>` +
        `<span class="mc-peek" aria-hidden="true"><span class="pk-title">${esc(ev.title)}</span><span class="pk-when">${esc(when)}</span>` +
        (place ? `<span class="pk-place">${esc(place)}</span>` : '') +
        `<span class="pk-hint">${hint}</span></span></button>`;
    }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

export function renderGrid(view: CalView, anchor: Date, events: EventItem[], selectedId: string | null, today: Date): string {
  return view === 'week' ? renderWeek(anchor, events, selectedId, today) : renderMonth(anchor, events, selectedId, today);
}

function factsHtml(ev: EventItem): string {
  const rows: string[] = [];
  const when = whenLine(ev);
  if (when) rows.push(`<dt>When</dt><dd>${esc(when)}</dd>`);
  if (ev.location) rows.push(`<dt>Where</dt><dd>${esc(ev.location)}</dd>`);
  if (ev.with.length) {
    rows.push(`<dt>With</dt><dd>${esc(ev.with.join(', '))}${ev.note ? `. ${esc(ev.note)}` : ''}</dd>`);
  } else if (ev.note) {
    rows.push(`<dt>Note</dt><dd>${esc(ev.note)}</dd>`);
  }
  return rows.length ? `<dl class="facts">${rows.join('')}</dl>` : '';
}

function actionsHtml(ev: EventItem, now: Date): string {
  const actions: string[] = [];
  if (!isPast(ev, now)) {
    actions.push(`<a class="btn btn-p" href="/events/${esc(ev.id)}.ics" download>Add to calendar</a>`);
    if (hasLink(ev.page)) actions.push(`<a class="btn btn-o" href="${esc(ev.page)}">Event page</a>`);
  } else {
    if (hasLink(ev.recap)) actions.push(`<a class="btn btn-p" href="${esc(ev.recap)}">${esc(ev.recapLabel || 'Recap')}</a>`);
    if (hasLink(ev.page)) actions.push(`<a class="btn btn-o" href="${esc(ev.page)}">Event page</a>`);
  }
  return actions.length ? `<p class="actions">${actions.join('')}</p>` : '';
}

function plateHtml(ev: EventItem): string {
  const start = eventStart(ev);
  const weekday = WEEKDAYS[(start.getDay() + 6) % 7];
  return (
    `<div class="plate detail-plate"><p class="big-date">` +
    `<span class="n">${start.getDate()}</span>` +
    `<span class="l">${weekday}, ${MONTHS[start.getMonth()]}</span>` +
    `</p></div>`
  );
}

/** layout "row": date panel beside the text (home). "stack": date panel on top (events page). */
export function renderDetail(ev: EventItem | null, layout: 'row' | 'stack', now: Date, headingTag: 'h2' | 'h3' = 'h3'): string {
  if (!ev) {
    return (
      `<div class="detail-empty"><p class="detail-empty-title">Nothing is scheduled right now.</p>` +
      `<p>Workshops run every Thursday at 18:00. New dates are posted on Discord first.</p></div>`
    );
  }
  const body =
    `<div class="detail-body">` +
    `<${headingTag} class="detail-title">${esc(ev.title)}</${headingTag}>` +
    factsHtml(ev) +
    actionsHtml(ev, now) +
    `</div>`;
  if (layout === 'row') return `<article class="detail detail--row">${plateHtml(ev)}${body}</article>`;
  return `<article class="detail detail--stack card">${plateHtml(ev)}${body}</article>`;
}

function placeWord(ev: EventItem): string {
  if (ev.location === 'Online') return 'online';
  return ev.locationShort || ev.location;
}

/** Inner HTML of the home "next event" bar: the date block, the title and the actions. */
export function renderNextEvent(ev: EventItem | null, now: Date, slotLine: string): string {
  if (!ev) {
    return (
      `<div class="nb-title"><h2>Nothing is scheduled right now</h2><p class="nb-sub">${esc(slotLine)}</p></div>` +
      `<div class="nb-act"><a class="btn btn-o" href="/events">All events</a></div>`
    );
  }
  const start = eventStart(ev);
  const day = dayLabel(start);
  const line = [whenLine(ev), placeWord(ev)].filter(Boolean).join(', ');
  return (
    `<div class="nb-date"><span class="nb-day">${esc(day)}</span>${line ? `<span class="nb-time">${esc(line)}</span>` : ''}</div>` +
    `<div class="nb-title"><h2>${esc(ev.title)}</h2></div>` +
    `<div class="nb-act"><a class="btn btn-p" href="/events/${esc(ev.id)}.ics" download>Add to calendar</a><a class="btn btn-o" href="/events">All events</a></div>`
  );
}

const ICON_CAL =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2" y="3.2" width="12" height="10.6" rx="1.5"></rect><path d="M2 6.6h12M5.2 1.8v2.6M10.8 1.8v2.6"></path></svg>';
const ICON_PIN =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 14.4s4.4-4.1 4.4-7.5a4.4 4.4 0 0 0-8.8 0c0 3.4 4.4 7.5 4.4 7.5z"></path><circle cx="8" cy="6.8" r="1.5"></circle></svg>';

const ICON_PHOTOS =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1.8" y="3" width="12.4" height="10" rx="2"></rect><circle cx="5.6" cy="6.6" r="1.2"></circle><path d="M2.4 12l3.6-3.4 2.4 2.2 2.2-2 3.2 3"></path></svg>';
const ICON_PEOPLE =
  '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6" cy="5.6" r="2.4"></circle><path d="M1.8 13.6c.5-2.4 2.2-3.6 4.2-3.6s3.7 1.2 4.2 3.6"></path><path d="M10.6 3.4a2.3 2.3 0 0 1 0 4.4M12.2 10.3c1 .6 1.7 1.7 2 3.3"></path></svg>';

/** The Princeton-style event list: month over day, then title, date, place and,
 *  for past events, what happened. Used on the home page and the Events page. */
export function renderDateList(list: EventItem[], emptyLine: string, kind: 'upcoming' | 'past' = 'upcoming'): string {
  if (!list.length) return `<p class="dl-empty">${esc(emptyLine)}</p>`;
  return list
    .map((ev) => {
      const start = eventStart(ev);
      const when = isMultiDayRange(ev) ? whenLine(ev) : [dayLabel(start), whenLine(ev)].filter(Boolean).join(', ');
      const past = kind === 'past';
      // Past events link to their recap as a whole card. Upcoming ones carry their own links.
      const link = past && hasLink(ev.recap) ? ev.recap : '';
      const tag = link ? 'a' : 'div';
      const pageLink = !past && hasLink(ev.page) ? `<a class="dl-add" href="${esc(ev.page)}">Event page</a>` : '';
      const place = ev.location === 'Online' ? 'Online' : ev.location;
      const year = past ? `<span class="y">${start.getFullYear()}</span>` : '';
      return (
        `<${tag} class="dl-ev${past ? ' dl-ev--past' : ''}"${link ? ` href="${esc(link)}"` : ''}>` +
        `<span class="dl-date"><span class="m">${MON_SHORT[start.getMonth()]}</span><span class="d">${start.getDate()}</span>${year}</span>` +
        `<span class="dl-body">` +
        `<span class="dl-title">${esc(ev.title)}</span>` +
        `<span class="dl-meta">${ICON_CAL}${esc(when)}</span>` +
        (place ? `<span class="dl-meta">${ICON_PIN}${esc(place)}</span>` : '') +
        (past && ev.stat ? `<span class="dl-meta">${ICON_PEOPLE}${esc(capitalise(ev.stat))}</span>` : '') +
        (!past ? `<span class="dl-act"><a class="dl-add" href="/events/${esc(ev.id)}.ics" download aria-label="Add to calendar: ${esc(ev.title)}">Add to calendar</a>${pageLink}</span>` : '') +
        (past && link ? `<span class="dl-act"><span class="dl-recap">${ICON_PHOTOS}<span>${esc(ev.recapLabel || 'Recap')}</span></span></span>` : '') +
        `</span></${tag}>`
      );
    })
    .join('');
}

function isMultiDayRange(ev: EventItem): boolean {
  return eventDays(ev).length > 1;
}

export function renderEventList(list: EventItem[], _now: Date, kind: 'upcoming' | 'past'): string {
  const empty =
    kind === 'upcoming' ? 'Nothing is scheduled right now. New dates are posted on Discord first.' : 'No past events are listed yet.';
  return renderDateList(list, empty, kind);
}

/** "After this week: Thursday workshop, 3 December." or "" when nothing later is listed. */
export function afterWeekLine(events: EventItem[], today: Date): string {
  const nextMonday = addDays(mondayOf(today), 7);
  const later = events
    .filter((ev) => eventStart(ev).getTime() >= nextMonday.getTime())
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())[0];
  if (!later) return '';
  return `After this week: ${later.title}, ${dayMonth(eventStart(later))}.`;
}

/** "3 December" */
export function dayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "17 Nov" */
export function dayMonShort(date: Date): string {
  return `${date.getDate()} ${MON_SHORT[date.getMonth()]}`;
}
