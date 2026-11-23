// /events/<id>.ics: one file per event, for "Add to calendar".
import type { APIRoute, GetStaticPaths } from 'astro';
import { allEvents } from '../../lib/event-data';
import type { EventItem } from '../../lib/events';
import { buildCalendar } from '../../lib/ics';

const events = allEvents;

export const getStaticPaths: GetStaticPaths = () => events.map((event) => ({ params: { id: event.id }, props: { event } }));

export const GET: APIRoute = ({ props }) => {
  const event = props.event as EventItem;
  return new Response(buildCalendar([event], event.title), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
