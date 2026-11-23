# Southampton AI Society website

The website for the University of Southampton Artificial Intelligence Society, built
with [Astro](https://astro.build). Every page is plain HTML and CSS, with a small script
for the calendar. The only part that runs on a server is the committee dashboard.

This file is for the committee. You do not need to know Astro to keep the site up to
date: use the dashboard, or edit the data files described below.

## Edit the site from the dashboard

Committee members sign in with **Committee login** at the bottom of every page (or go
straight to `/keystatic`). Sign in with your GitHub account. From there you can change
events, the committee, partners, the Gallery, SotonShip and its winners, the News box
on the home page and the other pages, and upload photos.

Pressing **Save** commits the change to the GitHub repository. Vercel then rebuilds the
site, and the change is live a minute or two later.

To be able to sign in, your GitHub account needs write access to
[EivanKolchin/AISoc-Website](https://github.com/EivanKolchin/AISoc-Website). Ask whoever
looks after the repository to add you as a collaborator.

When you run the site on your own laptop (`npm run dev`), the dashboard at
http://localhost:4321/keystatic saves straight to the files on your computer instead,
with no sign-in.

### Setting up the login (once, after the first deploy)

The dashboard signs people in through a GitHub App. It only has to be created once,
and Keystatic only allows that from a laptop, not from the live site:

1. On your laptop, run `npm run dashboard:setup` and open
   http://127.0.0.1:4321/keystatic/setup.
2. In **Deployed App URL**, enter the live address (for example
   `https://ai-soc-website-orpin.vercel.app`, or the society's own domain once it has
   one). Choose **Create GitHub App**, confirm on GitHub, then install the app on the
   `AISoc-Website` repository only.
3. GitHub sends you back to the laptop, and Keystatic writes four values to `.env`.
   Add the same four to the Vercel project (Settings, Environment Variables,
   Production):
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
   - `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`
4. Redeploy. **Committee login** now asks for GitHub and saves to the repository.

If the site moves to a new address, add
`https://<new address>/api/keystatic/github/oauth/callback` to the app's callback URLs
on GitHub (Settings, Developer settings, GitHub Apps).

Never commit the `.env` file: it holds the app's secret. It is already ignored by git.

### Two things to know about saving

- When you save a section with photos in it, the dashboard files the photos into
  numbered folders (for example `src/assets/gallery/photos/3/file.jpg`). That is
  normal and the pages find them wherever they are.
- Fields you leave empty are left out of the file. The pages treat a missing field as
  empty, so nothing breaks.

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
| `npm run build`   | Builds the finished site                              |
| `npm run preview` | Serves the built site, to check it before publishing  |

## Where the content lives

The dashboard edits these files in `src/data/`, and you can also edit them by hand:

| File             | What is in it                                                                   |
| :--------------- | :------------------------------------------------------------------------------ |
| `site.json`      | Society name, email, home statement, News box, "Who we are" text, workshop slot, social links |
| `events.json`    | Every event, past and future. Drives the calendar, the lists and the .ics files |
| `committee.json` | Committee members (photo, role, email, what they look after), and "Who to ask"  |
| `hackathons.json`| The SotonShip page: every hackathon we ran, winners, and other societies' ones  |
| `projects.json`  | The large project panels and the smaller builds                                 |
| `partners.json`  | Partners, audience numbers and the partnerships contact                         |
| `workshops.json` | The workshop library by year and the "New to this?" steps (on the Events page)  |
| `gallery.json`   | Which photos the Gallery shows, in order, with a description of each            |

Two rules for these files:

- Only write things that are true. Do not add placeholder text.
- If you do not have a link yet, write `"#"` (or leave it `""`). The site hides any
  button or link whose address is `"#"`, so nothing on the page is ever a dead end.

### Add an event

In the dashboard, open **Events** and press **Add**. By hand, open
`src/data/events.json` and copy an existing entry inside `events`:

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
  known, write only the date (`"2026-12-10"`) and leave `end` empty.
- `short` is the name shown on the calendar square, so keep it to a few words.
- `with` lists co-hosts. `note` is one short practical sentence.
- `page` is the sign-up or event page. `recap` is where photos or a write-up live once
  it is over. Leave either as `"#"` until you have it.
- Once an event has happened, fill in `stat` (for example `"90 came"`), `summary` (the
  line shown in "Past events") and `blurb` (a one-sentence description).

You never move an event from "coming up" to "past": the site works that out from the
date. The home page next-event bar and "Upcoming events" list, the calendar, and the
"Add to calendar" and "Subscribe" files all update from this one file.

### Add a partner

Add an entry to `partners` in `src/data/partners.json` (or **Partners** in the
dashboard, which uploads the logo for you). Logos added by hand go in `public/partners/`:

```json
{ "name": "Example Ltd", "url": "https://example.com", "logo": "/partners/example.svg", "since": "2026 to 2027", "about": "One sentence about them." }
```

Partners are the society's partners for the year. A hackathon's own sponsors go in
`sponsors` in `src/data/hackathons.json` instead, grouped by tier, with logos in
`public/sponsors/`. When you update the audience numbers, update `asOf` in the same
file so the date shown beside them stays honest.

### Add or change a committee member

In `src/data/committee.json`, add the person to `people`, in the order you want them shown:

```json
{ "name": "Full Name", "otherNames": "", "role": "Role title", "email": "fn1g25@soton.ac.uk", "initials": "FN", "photo": "full-name.jpg", "about": "One sentence on what they look after.", "bio": "" }
```

- `email` is their university address. The **Email** button on their card, and any
  "Who to ask" row that names them, opens a message to them with the society inbox
  copied in.
- `otherNames` is a name they also go by. It shows as "Also known as ..." under their
  name. Leave it empty if there is none.
- `photo` is a file in `src/assets/committee/`. A square photo works best. Leave it
  `""` and the card shows the person's initials instead.
- `about` shows when someone opens the card. `bio` is an optional longer paragraph,
  written by the person themselves.
- If the person should be the contact for a topic, also update the matching row in
  `ask`, using their name exactly as it is written in `people`.

The count on the Committee page ("Thirteen students...") updates by itself.

### Add a hackathon, or its winners

`src/data/hackathons.json` drives the SotonShip page. The newest hackathon goes first
in `editions`. Each one has a `results` list with a winner and runner-up per track:

```json
{ "track": "FinTech", "winner": { "team": "Team name", "project": "What they built", "photo": "sotonship-26-fintech-winners.jpg" }, "runnerUp": { "team": "", "project": "", "photo": "" } }
```

Photos go in `src/assets/hackathons/`. `elsewhere` lists other societies' hackathons.

### Add a photo to the Gallery

In the dashboard, open **Gallery**, press **Add** under Photos and choose the file. By hand:

1. Put the photo in `src/assets/gallery/` (`.jpg`, `.png` or `.webp`). The site makes
   smaller copies itself, so a normal camera or phone photo is fine.
2. Add an entry to `photos` in `src/data/gallery.json`, where you want it to appear:

```json
{ "file": "bunfight-stall.jpg", "event": "sessions", "alt": "Two committee members at the society stall at Bunfight" }
```

`alt` describes the photo for people who cannot see it: one plain sentence about what
is in it. It also shows when someone opens the photo. `event` is one of the IDs in
`events` at the top of the same file (add a new one for a new event); the Gallery uses
it for the filter buttons and to say where and when the photo was taken.

The photos at the top of the home and Events pages and in "Who we are" are not part of
the Gallery. They live in `src/assets/site/`; to swap one, replace the file and keep
its name, or change the name in `src/pages/index.astro` or `src/pages/events.astro`.

### Change wording on a page

Each page is one file in `src/pages/` (`index.astro` is the home page). The text is
readable in the file: find the sentence and edit it.

## How the site is put together

```text
public/                 Files served as they are (the logo; brand/ holds the footer marks)
keystatic.config.ts     The dashboard: which fields each section has
src/
  data/                 The content files described above
  assets/               Photos, resized by Astro when the site is built
    site/                 Fixed photos on the home and Events pages
    gallery/, committee/, hackathons/   Photos managed from the dashboard
  pages/                One file per page, plus the calendar feeds
    calendar.ics.ts       All events as one calendar file (Subscribe)
    events/[id].ics.ts    One calendar file per event (Add to calendar)
  layouts/Base.astro    The frame shared by every page: head, header, footer
  components/           Header, footer, social badges, calendar, project panel
  lib/                  Date handling, calendar drawing, .ics writing, photo and email helpers
  scripts/site.ts       The browser script: calendar, mobile menu, list switch, dialogs
  styles/global.css     The whole design system: colours, type, buttons, cards
  styles/home.css       The home page sections
```

Colours, fonts and spacing are set once at the top of `src/styles/global.css`. The
accent is a dark blue (`--accent`); the cyan stays only in the society logo. Lines (the
menu underline, heading bars, outlined buttons, the News border) use `--grad`, a
gradient centred on that blue. The font is Inter, the one the ECS society site uses.

Workshops have no page of their own: they are a section of the Events page, and the
old `/workshops` address redirects there (set in `astro.config.mjs`).

## Still to fill in

These are marked `"#"` or empty in the data files, so the site currently hides them:

- `site.json`: the WhatsApp community link.
- `events.json`: the event page link (`page`) for every event except SotonShip 26, and
  the recap link (`recap`) for "Can AI save the planet?" and "Someone Should Probably
  Build That". The time and place of "Someone Should Probably Build That" are also
  missing, so it shows as an all-day event.
- `hackathons.json`: the SotonShip 26 winners and runners-up, and the details of
  HackAI 22 and 23.

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
- Committee photos, and more photos of SotonShip.

## Publishing

The site is hosted on Vercel. In Vercel, choose **Add New**, **Project**, import
`EivanKolchin/AISoc-Website` from GitHub and keep the detected Astro settings. Every
push to `main` (including every Save in the dashboard) then deploys by itself.

The pages are built as static files; the dashboard at `/keystatic` runs as a small
Vercel function, which is why `astro.config.mjs` uses the Vercel adapter. After the
first deploy, set up the login as described in
[Setting up the login](#setting-up-the-login-once-after-the-first-deploy).
