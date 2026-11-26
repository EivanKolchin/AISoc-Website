// Everything that needs the visitor's real date or a click: the mobile menu, the
// calendar, the next-event card, the event lists and the Calendar/List switch.
// Pages are already complete without this script; it only brings them up to date.

import { allEvents } from '../lib/event-data';
import { type EventItem, addDays, past, startOfDay, upcoming } from '../lib/events';
import {
  type CalView,
  afterWeekLine,
  calendarTitle,
  renderDetail,
  renderEventList,
  renderGrid,
  renderDateList,
  renderNextEvent,
} from '../lib/calendar';

const events = allEvents;
const now = new Date();
const today = startOfDay(now);
const nextEvent = upcoming(events, now)[0] ?? null;

function initMenu(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-menu]');
  const nav = document.getElementById('site-nav');
  if (!button || !nav) return;
  const setOpen = (open: boolean) => {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close' : 'Menu';
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
}

function initCalendar(root: HTMLElement): void {
  const mode = root.dataset.mode === 'events' ? 'events' : 'home';
  const layout = mode === 'home' ? 'row' : 'stack';
  const headingTag = mode === 'home' ? 'h3' : 'h2';
  let view: CalView = root.dataset.view === 'month' ? 'month' : 'week';
  let anchor = today;
  let selectedId: string | null = nextEvent?.id ?? null;

  const titleEl = root.querySelector<HTMLElement>('[data-cal-title]');
  const gridEl = root.querySelector<HTMLElement>('[data-cal-grid]');
  const detailEl = root.querySelector<HTMLElement>('[data-cal-detail]');
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-cal-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-cal-next]');
  const toggleBtn = root.querySelector<HTMLButtonElement>('[data-cal-toggle]');
  const toggleLabel = root.querySelector<HTMLElement>('[data-cal-toggle-label]');
  const afterEl = root.querySelector<HTMLElement>('[data-cal-after]');
  if (!titleEl || !gridEl || !detailEl) return;

  const drawDetail = () => {
    const ev = events.find((item) => item.id === selectedId) ?? null;
    detailEl.innerHTML = renderDetail(ev, layout, now, headingTag);
  };

  const drawGrid = () => {
    const unit = view === 'week' ? 'week' : 'month';
    titleEl.textContent = calendarTitle(view, anchor, today);
    gridEl.innerHTML = renderGrid(view, anchor, events, selectedId, today);
    gridEl.scrollLeft = 0;
    prevBtn?.setAttribute('aria-label', `Previous ${unit}`);
    nextBtn?.setAttribute('aria-label', `Next ${unit}`);
    root.dataset.view = view;
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(view === 'month'));
      if (toggleLabel) toggleLabel.textContent = view === 'month' ? 'Back to this week' : 'Show the whole month';
    }
  };

  const shift = (direction: number) => {
    anchor = view === 'week' ? addDays(anchor, 7 * direction) : new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
    drawGrid();
  };

  prevBtn?.addEventListener('click', () => shift(-1));
  nextBtn?.addEventListener('click', () => shift(1));

  toggleBtn?.addEventListener('click', () => {
    if (view === 'week') {
      view = 'month';
    } else {
      view = 'week';
      anchor = today;
    }
    drawGrid();
  });

  // Choosing an event only flips the pressed state, so keyboard focus stays on the chip.
  gridEl.addEventListener('click', (event) => {
    const chip = (event.target as Element).closest<HTMLElement>('[data-ev]');
    if (!chip) return;
    // Where the card is now (its open preview if there is one), before anything changes.
    const peek = chip.querySelector<HTMLElement>('.mc-peek');
    const source = peek && getComputedStyle(peek).visibility === 'visible' ? peek : chip;
    const from = source.getBoundingClientRect();
    const fromBg = getComputedStyle(source).backgroundColor;
    const fromFg = getComputedStyle(source).color;
    const title = chip.querySelector('.pk-title')?.textContent ?? chip.textContent ?? '';

    selectedId = chip.dataset.ev ?? null;
    gridEl.querySelectorAll<HTMLElement>('[data-ev]').forEach((other) => {
      other.setAttribute('aria-pressed', String(other.dataset.ev === selectedId));
    });
    drawDetail();
    // On a phone the details sit below the grid. The page glides down to them while the
    // card flies, on the same curve, so the card lands exactly where the panel ends up.
    const shift = scrollNeeded(detailEl);
    flyToDetail(from, fromBg, fromFg, title, detailEl.firstElementChild as HTMLElement | null, shift);
    glideBy(shift, FLIGHT_MS);
  });

  drawGrid();
  drawDetail();
  if (afterEl) afterEl.textContent = afterWeekLine(events, today);
}

const FLIGHT_MS = 780;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// How far the page has to move so the details panel is in view. Positive is down.
function scrollNeeded(el: HTMLElement): number {
  const box = el.getBoundingClientRect();
  const room = window.innerHeight;
  let delta = 0;
  if (box.bottom > room - 16) delta = Math.min(box.bottom - room + 16, box.top - 16);
  else if (box.top < 16) delta = box.top - 16;
  const furthest = document.documentElement.scrollHeight - room - window.scrollY;
  return Math.round(Math.max(-window.scrollY, Math.min(delta, furthest)));
}

// Scroll by a set amount over a set time, easing out like the card's flight.
function glideBy(delta: number, duration: number): void {
  if (!delta) return;
  const startY = window.scrollY;
  if (reduceMotion()) {
    window.scrollTo({ top: startY + delta, behavior: 'instant' });
    return;
  }
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo({ top: startY + delta * (1 - Math.pow(1 - t, 3)), behavior: 'instant' });
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// The chosen event's card travels from the calendar to the details panel, growing and
// softening on the way, then hands over to the real panel. `shift` is how far the page
// is about to scroll, so the card aims for where the panel will be, not where it is now.
function flyToDetail(from: DOMRect, fromBg: string, fromFg: string, title: string, target: HTMLElement | null, shift = 0): void {
  if (!target || reduceMotion()) return;
  const now = target.getBoundingClientRect();
  const to = new DOMRect(now.left, now.top - shift, now.width, now.height);
  const onScreen = to.top < window.innerHeight && to.bottom > 0 && from.width > 0;
  if (!onScreen) return;

  const ghost = document.createElement('div');
  ghost.className = 'cal-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = title;
  ghost.append(label);
  document.body.append(ghost);

  const box = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  const timing = { duration: FLIGHT_MS, easing: 'cubic-bezier(0.22, 0.9, 0.25, 1)', fill: 'forwards' as FillMode };
  // A phone's day square is too small for the name, so the name fades in on the way.
  const small = from.width < 90;
  target.style.opacity = '0';
  const flight = ghost.animate(
    [
      { ...box(from), borderRadius: small ? '10px' : '14px', backgroundColor: fromBg, color: fromFg },
      { offset: 0.55, borderRadius: '18px', backgroundColor: '#12233b', color: '#ffffff' },
      { ...box(to), borderRadius: '16px', backgroundColor: '#0f141a', color: '#ffffff' },
    ],
    timing,
  );
  label.animate(
    [
      { fontSize: small ? '18px' : '15px', opacity: small ? 0 : 1 },
      { fontSize: '24px', opacity: 1, offset: 0.6 },
      { fontSize: '26px', opacity: 0 },
    ],
    timing,
  );

  flight.onfinish = () => {
    target.style.transition = 'opacity 0.3s ease-out';
    target.style.opacity = '1';
    ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {
      ghost.remove();
      target.style.removeProperty('transition');
    };
  };
}

function initNextEvent(): void {
  document.querySelectorAll<HTMLElement>('[data-next-event]').forEach((card) => {
    card.innerHTML = renderNextEvent(nextEvent, now, card.dataset.slot ?? '');
  });
}

function initEventLists(): void {
  document.querySelectorAll<HTMLElement>('[data-event-list]').forEach((list) => {
    const kind = list.dataset.eventList === 'past' ? 'past' : 'upcoming';
    const items = kind === 'past' ? past(events, now) : upcoming(events, now);
    list.innerHTML = renderEventList(items, now, kind);
  });
}

// The home "Upcoming events" list skips the event already shown in the bar above it.
function initDateLists(): void {
  document.querySelectorAll<HTMLElement>('[data-date-list]').forEach((list) => {
    const skip = Number(list.dataset.skip ?? 0);
    const count = Number(list.dataset.count ?? 3);
    list.innerHTML = renderDateList(upcoming(events, now).slice(skip, skip + count), list.dataset.empty ?? '');
  });
}

function initViewSwitch(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-view-btn]');
  const calendarPanel = document.querySelector<HTMLElement>('[data-view-panel="calendar"]');
  if (!buttons.length || !calendarPanel) return;
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      calendarPanel.hidden = button.dataset.viewBtn === 'list';
    });
  });
}

// Committee cards open a detail panel. A click on the dimmed backdrop closes it.
function initDialogs(): void {
  document.querySelectorAll<HTMLElement>('[data-dialog-open]').forEach((trigger) => {
    const dialog = document.getElementById(trigger.dataset.dialogOpen ?? '');
    if (!(dialog instanceof HTMLDialogElement)) return;
    trigger.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

// "Copy" buttons put their text on the clipboard and say so for a moment.
function initCopy(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    const label = button.textContent?.trim() ?? 'Copy';
    let timer = 0;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? '');
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Could not copy';
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (button.textContent = label), 2000);
    });
  });
}

// On the live site, "Subscribe" opens the feed in the visitor's calendar app,
// which keeps itself up to date. Locally it stays a plain download.
function initSubscribe(): void {
  if (location.protocol !== 'https:') return;
  document.querySelectorAll<HTMLAnchorElement>('[data-subscribe]').forEach((link) => {
    link.href = `webcal://${location.host}/calendar.ics`;
  });
}

// The page's base colour shows only if a browser bounces past an edge. Near the bottom it
// switches to the footer's navy (see html.at-end in global.css), so a bounce there matches the
// footer instead of showing the dark base underneath it.
function initEdgeColour(): void {
  const root = document.documentElement;
  // toggle() with an unchanged value leaves the class list alone, so this is cheap on every scroll.
  const update = () => {
    const halfway = (root.scrollHeight - window.innerHeight) / 2;
    root.classList.toggle('at-end', window.scrollY > halfway);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

initMenu();
initEdgeColour();
document.querySelectorAll<HTMLElement>('[data-calendar]').forEach(initCalendar);
initNextEvent();
initEventLists();
initDateLists();
initViewSwitch();
initDialogs();
initCopy();
initSubscribe();
