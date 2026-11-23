// /calendar.ics: every event in one file, for "Subscribe" in a calendar app.
import type { APIRoute } from 'astro';
import eventsData from '../data/events.json';
import type { EventItem } from '../lib/events';
import { buildCalendar } from '../lib/ics';

export const GET: APIRoute = () =>
  new Response(buildCalendar(eventsData as EventItem[]), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
