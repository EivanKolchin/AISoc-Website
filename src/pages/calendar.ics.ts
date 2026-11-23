// /calendar.ics: every event in one file, for "Subscribe" in a calendar app.
import type { APIRoute } from 'astro';
import { allEvents } from '../lib/event-data';
import { buildCalendar } from '../lib/ics';

export const GET: APIRoute = () =>
  new Response(buildCalendar(allEvents), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
