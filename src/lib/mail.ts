// Email links. Messages go to the people concerned with the society inbox copied in,
// so the rest of the committee can pick them up if someone is away.
import site from '../data/site.json';
import committee from '../data/committee.json';

type Person = { name: string; email?: string };
const people = committee.people as Person[];

/** University emails of the committee members named in a line such as "Mehmet Icen, Sumayea Akter". */
export function emailsFor(names: string): string[] {
  return people.filter((person) => person.email && names.includes(person.name)).map((person) => person.email as string);
}

/** A mailto link to these people with the society inbox copied in, or to the inbox alone. */
export function mailTo(to: string[], subject: string): string {
  const query = `subject=${encodeURIComponent(subject)}`;
  if (!to.length) return `mailto:${site.email}?${query}`;
  return `mailto:${to.join(',')}?cc=${site.email}&${query}`;
}
