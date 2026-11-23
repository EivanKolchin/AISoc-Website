// Everything that needs the visitor's real date or a click: the mobile menu, the
// calendar, the next-event card, the event lists and the Calendar/List switch.
// Pages are already complete without this script; it only brings them up to date.

import eventsData from '../data/events.json';
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

const events = eventsData as EventItem[];
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
    selectedId = chip.dataset.ev ?? null;
    gridEl.querySelectorAll<HTMLElement>('[data-ev]').forEach((other) => {
      other.setAttribute('aria-pressed', String(other.dataset.ev === selectedId));
    });
    drawDetail();
    // The preview finishes its move to the right and the details panel grows in.
    chip.classList.add('launch');
    window.setTimeout(() => chip.classList.remove('launch'), 450);
    detailEl.classList.remove('detail-enter');
    void detailEl.offsetWidth;
    detailEl.classList.add('detail-enter');
    // On a phone the details sit below the grid: bring them into view.
    const box = detailEl.getBoundingClientRect();
    if (box.top > window.innerHeight - 120 || box.bottom < 0) detailEl.scrollIntoView({ block: 'nearest' });
  });

  drawGrid();
  drawDetail();
  if (afterEl) afterEl.textContent = afterWeekLine(events, today);
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

// On the live site, "Subscribe" opens the feed in the visitor's calendar app,
// which keeps itself up to date. Locally it stays a plain download.
function initSubscribe(): void {
  if (location.protocol !== 'https:') return;
  document.querySelectorAll<HTMLAnchorElement>('[data-subscribe]').forEach((link) => {
    link.href = `webcal://${location.host}/calendar.ics`;
  });
}

initMenu();
document.querySelectorAll<HTMLElement>('[data-calendar]').forEach(initCalendar);
initNextEvent();
initEventLists();
initDateLists();
initViewSwitch();
initDialogs();
initSubscribe();
