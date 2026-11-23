# Southampton AI Society website

The website for the University of Southampton Artificial Intelligence Society. It is a
static site built with [Astro](https://astro.build): every page is plain HTML and CSS,
with a small script for the calendar.

This file is for the committee. You do not need to know Astro to keep the site up to
date: almost everything you will change lives in six data files.

## Run it on your laptop

You need [Node.js](https://nodejs.org) 22.23 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:4321. The page reloads when you save a file.

| Command           | What it does                                          |
| :---------------- | :---------------------------------------------------- |
| `npm run dev`     | Runs the site locally at `localhost:4321`             |
| `npm run build`   | Builds the finished site into `dist/`                 |
| `npm run preview` | Serves the built site, to check it before publishing  |

## Where the content lives

Everything the committee edits is in `src/data/`:

| File             | What is in it                                                                   |
| :--------------- | :------------------------------------------------------------------------------ |
| `site.json`      | Society name, email, home statement, News box, "Who we are" text, workshop slot, social links |
| `events.json`    | Every event, past and future. Drives the calendar, the lists and the .ics files |
| `committee.json` | Committee members (photo, role, what they look after), and "Who to ask"         |
| `hackathons.json`| The SotonShip page: every hackathon we ran, winners, and other societies' ones  |
| `projects.json`  | The large project panels and the smaller builds                                 |
| `partners.json`  | Supporters, audience numbers and the partnerships contact                       |
| `workshops.json` | The workshop library by year and the "New to this?" steps (on the Events page)  |
| `gallery.json`   | Which photos the Gallery shows, in order, with a description of each            |

Two rules for these files:

- Only write things that are true. Do not add placeholder text.
- If you do not have a link yet, write `"#"` (or leave it `""`). The site hides any
  button or link whose address is `"#"`, so nothing on the page is ever a dead end.

### Add an event

Open `src/data/events.json`, copy an existing entry and change it:

```json
{
  "id": "thursday-workshop-2026-12-10",
  "title": "Thursday workshop",
  "short": "Workshop",
  "type": "Workshop",
  "level": "Every week",
  "start": "2026-12-10T18:00",
  "end": "2026-12-10T19:00",
  "location": "B100/3023",
  "locationShort": "B100/3023",
  "with": [],
  "note": "Bring a laptop.",
  "stat": "",
  "summary": "",
  "blurb": "",
  "page": "#",
  "recap": "#",
  "recapLabel": "Recap"
}
```

- `id` must be unique, lower case, with hyphens. It becomes the address of the
  calendar file (`/events/<id>.ics`).
- `start` and `end` are UK times written as `YYYY-MM-DDTHH:mm`. If the time is not
  known, write only the date (`"2026-12-10"`) and set `"end": null`.
- `short` is the name shown on the small calendar chip, so keep it to a few words.
- `with` lists co-hosts. `note` is one short practical sentence.
- `page` is the sign-up or event page. `recap` is where photos or a write-up live once
  it is over. Leave either as `"#"` until you have it.
- Once an event has happened, fill in `stat` (for example `"90 came"`), `summary` (the
  line shown in "Past events") and `blurb` (a one-sentence description).

You never move an event from "coming up" to "past": the site works that out from the
date. The home page next-event bar and "Upcoming events" list, the calendar, and the "Add to calendar" and
"Subscribe" files all update from this one file.

### Add a sponsor or partner

Add a line to `partners` in `src/data/partners.json`, and put the company's logo in
`public/partners/`:

```json
{ "name": "Example Ltd", "url": "https://example.com", "logo": "/partners/example.svg", "since": "2026 to 2027" }
```

Partners are the society's partners for the year. A hackathon's own sponsors go in
`sponsors` in `src/data/hackathons.json` instead, grouped by tier, with logos in
`public/sponsors/`.
When you update the audience numbers, update `asOf` in the same file so the date shown
beside them stays honest.

### Add or change a committee member

In `src/data/committee.json`, add the person to `people`, in the order you want them shown:

```json
{ "name": "Full Name", "role": "Role title", "initials": "FN", "photo": "full-name.jpg", "about": "One sentence on what they look after.", "bio": "" }
```

- `photo` is a file in `src/assets/committee/`. A square photo works best. Leave it
  `""` and the card shows the person's initials instead.
- `about` shows when someone opens the card. `bio` is an optional longer paragraph,
  written by the person themselves.
- If the person should be the contact for a topic, also update the matching row in `ask`.

The count on the Committee page ("Thirteen students...") updates by itself.

### Add a hackathon, or its winners

`src/data/hackathons.json` drives the SotonShip page. The newest hackathon goes first
in `editions`. Each one has a `results` list with a winner and runner-up per track:

```json
{ "track": "FinTech", "winner": { "team": "Team name", "project": "What they built", "photo": "sotonship-26-fintech-winners.jpg" }, "runnerUp": { "team": "", "project": "", "photo": "" } }
```

Photos go in `src/assets/hackathons/`. `elsewhere` lists other societies' hackathons.

### Add a photo to the Gallery

1. Put the photo in `src/assets/gallery/` (`.jpg`, `.png` or `.webp`). The site makes
   smaller copies itself, so a normal camera or phone photo is fine.
2. Add a line to `photos` in `src/data/gallery.json`, where you want it to appear:

```json
{ "file": "bunfight-stall.jpg", "event": "sessions", "alt": "Two committee members at the society stall at Bunfight" }
```

`alt` describes the photo for people who cannot see it: one plain sentence about what
is in it. It also shows when someone opens the photo. `event` is one of the keys in
`events` at the top of the same file (add a new one for a new event); the Gallery uses
it for the filter buttons and to say where and when the photo was taken. The home page photo (`bt24-group-photo.jpg`) and the "Who we are" photo
(`group-photo.jpg`) come from the same folder; change the file name in
`src/pages/index.astro` to swap either one. The current photos come from the
society's SUSU page.

### Change wording on a page

Each page is one file in `src/pages/` (`index.astro` is the home page). The text is
readable in the file: find the sentence and edit it.

## How the site is put together

```text
public/                 Files served as they are (the logo; brand/ holds the footer marks)
src/
  data/                 The content files described above
  assets/gallery/       Photos, resized by Astro when the site is built
  pages/                One file per page, plus the calendar feeds
    calendar.ics.ts       All events as one calendar file (Subscribe)
    events/[id].ics.ts    One calendar file per event (Add to calendar)
  layouts/Base.astro    The frame shared by every page: head, header, footer
  components/           Header, footer, social badges, calendar, event row,
                        person card, project panel
  lib/                  Date handling, calendar drawing, .ics writing
  scripts/site.ts       The browser script: calendar, mobile menu, list switch
  styles/global.css     The whole design system: colours, type, buttons, cards
  styles/home.css       The home page sections
```

Colours, fonts and spacing are set once at the top of `src/styles/global.css`. The
accent is the cyan from the society logo (`--accent`). Lines (the menu underline,
heading bars, outlined buttons, the News border) use `--grad`, a gradient centred on
that cyan. The font is Inter, the one the ECS society site uses.

Workshops have no page of their own: they are a section of the Events page, and the
old `/workshops` address redirects there (set in `astro.config.mjs`).

## Still to fill in

These are marked `"#"` or empty in the data files, so the site currently hides them:

- `site.json`: the WhatsApp community link.
- `events.json`: the event page link (`page`) for every event except SotonShip 26, and
  the recap link (`recap`) for "Can AI save the planet?" and "Someone Should Probably
  Build That". The time and place of "Someone Should Probably Build That" are also
  missing, so it shows as an all-day event.
- `partners.json`: a website link for each supporter.

These are filled in but should be checked by someone who knows:

- `workshops.json`: the six GitHub repository addresses, and the topics for the years
  before 2024 to 2025 (currently blank).
- `projects.json`: the SotonShip gallery address and photo count, and whether the two
  Bunfight demos have a live address to link to instead of the code.
- `site.json`: the Discord member count (`stats`, shown on the Discord badge), and
  `updated`. Change both whenever the numbers are refreshed.

Assets we do not have yet:

- The original logo file. `public/logo-mark.png` is a crop taken from the SUSU page,
  and `public/brand/aisoc-mark-white.png` is a white version made from it for the
  footer. An SVG from whoever made the logo would be sharper.
- Permission to show the SUSU and University of Southampton logos in the footer
  (`public/brand/`). Check both organisations' brand rules before the site goes live.
- More photos, especially of the committee and of SotonShip.
- Supporter logos, with permission to use them.

## Publishing

The site will be hosted on Vercel, which builds it with `npm run build` and serves the
`dist/` folder. No extra configuration is needed for that. It has not been connected yet.

## Committee login

A way for committee members to sign in and edit events, sponsors and pages without
touching these files is planned. The approach has not been chosen yet. Until it is,
content is edited in `src/data/` as described above.
