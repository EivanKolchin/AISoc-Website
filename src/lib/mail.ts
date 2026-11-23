// Contacts by committee role. Rows such as "Who to ask", the Partners contact and the
// projects lead name a role ("Hackathon Officer"), never a person, so when a new committee
// is elected only the Members list in committee.json changes and every link follows it.
// Messages go to the people concerned with the society inbox copied in, so the rest of
// the committee can pick them up if someone is away.
import site from '../data/site.json';
import committee from '../data/committee.json';

export type Member = (typeof committee.people)[number];

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** "Hackathon Officer, Hackathon Engineer" or a list of roles, as a clean list. */
export function roleList(roles: string | string[] | null | undefined): string[] {
  const list = Array.isArray(roles) ? roles : String(roles ?? '').split(',');
  return list.map((role) => role.trim()).filter(Boolean);
}

/** The committee members who hold these roles, in the order the roles are given. */
export function holders(roles: string | string[] | null | undefined): Member[] {
  const people = roleList(roles).flatMap((role) => committee.people.filter((person) => same(person.role, role)));
  return people.filter((person, i) => people.indexOf(person) === i);
}

/** Their university emails. */
export function emailsFor(roles: string | string[] | null | undefined): string[] {
  return holders(roles)
    .map((person) => person.email.trim())
    .filter(Boolean);
}

/** "A", "A and B", "A, B and C" */
export function listLine(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : (items[0] ?? '');
}

/** The names of whoever holds these roles, or "" while the roles are empty. */
export function namesFor(roles: string | string[] | null | undefined): string {
  return listLine(holders(roles).map((person) => person.name));
}

/** A mailto link to these people with the society inbox copied in, or to the inbox alone. */
export function mailTo(to: string[], subject: string): string {
  const query = `subject=${encodeURIComponent(subject)}`;
  if (!to.length) return `mailto:${site.email}?${query}`;
  return `mailto:${to.join(',')}?cc=${site.email}&${query}`;
}
