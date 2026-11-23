// The contact form's topics, and who each one reaches.
//
// Every message goes to the society inbox (site.json "email"). The committee members for
// its topic are copied in, found by their role in committee.json, so a new committee only
// needs its roles kept the same. The President and Vice President are copied in on
// everything except welfare, which goes only to the Welfare Officer.
import site from '../data/site.json';
import { holders, listLine } from './mail';

export interface Topic {
  id: string;
  /** On the option card. */
  name: string;
  /** The line under it. */
  note: string;
  /** In square brackets at the start of the subject, so the inbox can sort by it. */
  tag: string;
  /** The question above the message box. */
  ask: string;
  placeholder: string;
  /** Committee roles copied in. */
  roles: string[];
  /** Also copy in the President and Vice President. */
  leaders: boolean;
}

const LEADERS = ['President', 'Vice President'];

export const TOPICS: Topic[] = [
  {
    id: 'joining',
    name: 'Joining or getting involved',
    note: 'Membership, helping out, the committee',
    tag: 'Joining',
    ask: 'How would you like to get involved?',
    placeholder: 'For example: I would like to help run workshops next term.',
    roles: ['Secretary'],
    leaders: true,
  },
  {
    id: 'hackathons',
    name: 'Hackathons and SotonShip',
    note: 'Taking part, mentoring or judging',
    tag: 'Hackathons',
    ask: 'What would you like to know about our hackathons?',
    placeholder: 'For example: can first years enter SotonShip as a team of two?',
    roles: ['Hackathon Officer', 'Hackathon Engineer'],
    leaders: true,
  },
  {
    id: 'projects',
    name: 'Projects and SotonLM',
    note: 'Joining a project, or building something with us',
    tag: 'Projects',
    ask: 'Which project, or what would you like to build together?',
    placeholder: 'For example: our lab would like to try SotonLM on our own data.',
    roles: ['Lead Project Architect'],
    leaders: true,
  },
  {
    id: 'workshops',
    name: 'Workshops',
    note: 'Coming to one, or teaching one',
    tag: 'Workshops',
    ask: 'What would you like to know about the workshops?',
    placeholder: 'For example: I could teach a session on computer vision.',
    roles: ['Head of Education'],
    leaders: true,
  },
  {
    id: 'partners',
    name: 'Sponsoring or partnering',
    note: 'Sponsorship, speaking at an event, working with us',
    tag: 'Partnerships',
    ask: 'Tell us about your organisation and what you have in mind.',
    placeholder: 'For example: we would like to sponsor SotonShip and run a challenge.',
    roles: ['Head of Partnerships', 'Treasurer'],
    leaders: true,
  },
  {
    id: 'money',
    name: 'Money',
    note: 'Payments, refunds and claiming back costs',
    tag: 'Money',
    ask: 'What is the payment or cost about?',
    placeholder: 'For example: I paid for pizza at the last workshop and need to claim it back.',
    roles: ['Treasurer'],
    leaders: true,
  },
  {
    id: 'promotion',
    name: 'Promotion and press',
    note: 'Social media, posters, sharing your event',
    tag: 'Promotion',
    ask: 'What would you like us to share or talk about?',
    placeholder: 'For example: could you post about our AI ethics talk next week?',
    roles: ['Head of Marketing', 'Head of Communications'],
    leaders: true,
  },
  {
    id: 'welfare',
    name: 'Something worrying you',
    note: 'Goes only to our Welfare Officer and the society inbox',
    tag: 'Welfare',
    ask: 'What is on your mind?',
    placeholder: 'Write as much or as little as you like.',
    roles: ['Welfare Officer'],
    leaders: false,
  },
];

export const OTHER: Topic = {
  id: 'other',
  name: 'Something else',
  note: 'Any other question, or just hello',
  tag: 'Other',
  ask: 'What would you like to ask?',
  placeholder: 'Ask us anything.',
  roles: [],
  leaders: true,
};

export const ALL_TOPICS = [...TOPICS, OTHER];

export function topicById(id: string | null | undefined): Topic {
  return ALL_TOPICS.find((topic) => topic.id === id) ?? OTHER;
}

/** The committee members copied in on a topic, in the order of its roles. */
export function readersFor(topic: Topic) {
  return holders([...topic.roles, ...(topic.leaders ? LEADERS : [])]).filter((person) => person.email.trim());
}

/** Who the email is addressed to, and who is copied in. */
export function recipientsFor(topic: Topic): { to: string; cc: string[] } {
  return { to: site.email, cc: readersFor(topic).map((person) => person.email.trim()) };
}

/** "Mehmet Icen (Hackathon Officer) and Sumayea Akter (Hackathon Engineer)" */
export function readersLine(topic: Topic): string {
  return listLine(readersFor(topic).map((person) => `${person.name} (${person.role})`));
}

export const MAX_NAME = 80;
export const MAX_EMAIL = 120;
export const MAX_MESSAGE = 4000;

export const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/** The subject line: "[Hackathons] Jane Smith, from the website". */
export const subjectFor = (topic: Topic, name: string) => `[${topic.tag}] ${name}, from the website`;

/** The same email, addressed and filled in, for the visitor's own mail app. */
export function mailtoFor(topic: Topic, name = '', message = ''): string {
  const { to, cc } = recipientsFor(topic);
  const params = [
    cc.length ? `cc=${cc.join(',')}` : '',
    `subject=${encodeURIComponent(subjectFor(topic, name || 'A message'))}`,
    message ? `body=${encodeURIComponent(message)}` : '',
  ].filter(Boolean);
  return `mailto:${to}?${params.join('&')}`;
}
