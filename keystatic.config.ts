// The committee dashboard at /keystatic. Events are one file each in src/data/events/;
// every other section edits one file in src/data.
// On your own computer (npm run dev) it saves straight to the files. On the live site it
// signs you in with GitHub and saves to the repository, which rebuilds the site.
// `npm run dashboard:setup` runs the GitHub version locally, which is needed once to
// create the GitHub App the login uses (see README).
import { createElement } from 'react';
import { collection, config, fields, singleton } from '@keystatic/core';
import gallery from './src/data/gallery.json';

const useGitHub = import.meta.env.PROD || import.meta.env.MODE === 'github';

const text = (label: string, description?: string) => fields.text({ label, description });
const long = (label: string, description?: string) => fields.text({ label, description, multiline: true });
const link = (label: string, description = 'A full web address, a page on this site such as /events, or # if there is none yet.') =>
  fields.text({ label, description });

const DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const DATE_HELP = 'Write the date as 2026-12-10, or the date and UK time as 2026-12-10T18:00.';
const galleryEventIds = (gallery.events as { id: string }[]).map((ev) => ev.id).join(', ');

export default config({
  storage: useGitHub ? { kind: 'github', repo: 'EivanKolchin/AISoc-Website' } : { kind: 'local' },
  ui: {
    brand: {
      name: 'AI Society',
      mark: () => createElement('img', { src: '/logo-mark.png', alt: '', height: 28, style: { height: 28, width: 'auto', display: 'block' } }),
    },
    // Ordered by how often each part changes.
    navigation: {
      'Week to week': ['events', 'home', 'gallery'],
      People: ['committee', 'partners'],
      Hackathons: ['hackathons'],
      'Other pages': ['projects', 'workshops', 'site'],
    },
  },
  collections: {
    events: collection({
      label: 'Events',
      slugField: 'title',
      path: 'src/data/events/*',
      format: { data: 'json' },
      columns: ['title', 'start'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: {
            label: 'Web address',
            description: 'Made from the title. It names the event\'s "Add to calendar" file, so leave it alone once the event is announced.',
          },
        }),
        start: fields.text({
          label: 'Starts',
          description: `${DATE_HELP} Use just the date if the time is not known yet.`,
          validation: { isRequired: true, pattern: { regex: DATE, message: DATE_HELP } },
        }),
        end: fields.text({
          label: 'Ends',
          description: 'Same format as Starts. Leave empty if not known.',
          validation: { pattern: { regex: /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?)?$/, message: DATE_HELP } },
        }),
        location: text('Where', 'In full, for example "Building 100, room 3023", or Online.'),
        locationShort: text('Where, short', 'For small spaces, for example B100/3023.'),
        short: text('Name on the calendar', 'A few words for the small calendar square. Leave empty to use the title.'),
        level: text('Who it is for', 'Optional, for example "Beginners welcome".'),
        with: fields.array(text('Society or company'), { label: 'Run with', itemLabel: (props) => props.value || 'Co-host' }),
        note: text('Note', 'One short practical line, for example "Bring a laptop."'),
        blurb: long('Description', 'A sentence or two. It goes into the "Add to calendar" file.'),
        page: link('Sign-up or event page'),
        after: fields.object(
          {
            stat: text('How many came', 'For example "90 came" or "120 builders".'),
            recap: link('Photos or write-up', 'Where people can see what happened, for example /gallery or /sotonship. Adds a button to the event under Past events.'),
            recapLabel: text('Button text', 'For example "Look back" or "See the photos".'),
          },
          { label: 'After the event' },
        ),
      },
    }),
  },
  singletons: {
    home: singleton({
      label: 'Home page and News',
      path: 'src/data/home',
      format: { data: 'json' },
      schema: {
        notice: fields.object(
          {
            text: long('News', 'The box under the top of the home page. Leave empty to hide the box.'),
            url: link('Where the box links to'),
          },
          { label: 'News box' },
        ),
        statement: long('Statement', 'The large sentence at the top of the home page.'),
        about: fields.object(
          {
            who: long('Who we are'),
            what: long('What we do'),
            aim: long('What we aim for'),
          },
          { label: 'Who we are' },
        ),
      },
    }),

    site: singleton({
      label: 'Society details',
      path: 'src/data/site',
      format: { data: 'json' },
      schema: {
        name: text('Society name', 'Used in page titles, for example "Southampton AI Society".'),
        shortName: text('Short name', 'Shown in the header beside the logo.'),
        university: text('University'),
        tagline: text('Description for search engines', 'One sentence shown under the site in Google results.'),
        email: text('Society email', 'Copied in on every email sent from the site.'),
        workshopSlot: fields.object(
          {
            day: text('Day', 'For example Thursday.'),
            start: text('Starts', 'For example 18:00.'),
            end: text('Ends', 'For example 19:00.'),
            room: text('Room'),
            campus: text('Campus'),
            bring: text('What to bring'),
            cost: text('Cost'),
          },
          { label: 'Weekly workshop' },
        ),
        membership: fields.object({ label: text('Label'), url: link('SUSU page') }, { label: 'Membership' }),
        stats: fields.object(
          {
            asOf: text('Figures as of', 'The date you counted them, for example 2026-11-23.'),
            discordMembers: fields.integer({ label: 'Discord members' }),
            instagramFollowers: fields.integer({ label: 'Instagram followers' }),
            facebookFollowers: fields.integer({ label: 'Facebook followers' }),
            whatsappMembers: fields.integer({ label: 'WhatsApp group members', description: 'Leave empty to show no number.' }),
          },
          { label: 'Numbers' },
        ),
        social: fields.array(
          fields.object({
            id: fields.select({
              label: 'Network',
              options: [
                { label: 'Discord', value: 'discord' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'GitHub', value: 'github' },
              ],
              defaultValue: 'discord',
            }),
            label: text('Label'),
            url: link('Link'),
          }),
          { label: 'Social links', itemLabel: (props) => props.fields.label.value },
        ),
      },
    }),

    committee: singleton({
      label: 'Committee',
      path: 'src/data/committee',
      format: { data: 'json' },
      schema: {
        year: text('Committee year', 'For example 2026 to 2027'),
        people: fields.array(
          fields.object({
            name: text('Name'),
            otherNames: text('Other names', 'Optional, a name they also go by. Shown as "Also known as …"'),
            role: text('Role'),
            email: text('Email', 'Their university email. The Email button writes to it with the society inbox copied in.'),
            initials: text('Initials', 'Shown on their card until there is a photo. Leave empty to use the first letters of their name.'),
            photo: fields.image({ label: 'Photo', description: 'A square photo works best', directory: 'src/assets/committee' }),
            about: long('What they look after'),
            bio: long('Bio', 'Optional, written by the person'),
          }),
          { label: 'Members', itemLabel: (props) => `${props.fields.name.value}, ${props.fields.role.value}` },
        ),
        ask: fields.array(
          fields.object({
            topic: text('Topic'),
            who: text('Who', 'Names exactly as written under Members, separated by commas. The row emails them.'),
            role: text('Their role'),
          }),
          { label: 'Who to ask', itemLabel: (props) => props.fields.topic.value },
        ),
      },
    }),

    partners: singleton({
      label: 'Partners',
      path: 'src/data/partners',
      format: { data: 'json' },
      schema: {
        intro: long('Introduction'),
        partners: fields.array(
          fields.object({
            name: text('Name'),
            url: link('Website'),
            logo: fields.image({ label: 'Logo', directory: 'public/partners', publicPath: '/partners/' }),
            since: text('Partner for', 'For example 2026 to 2027'),
            about: long('About them'),
          }),
          { label: 'Partners', itemLabel: (props) => props.fields.name.value },
        ),
        sotonshipNote: long('Note about SotonShip sponsors'),
        contact: fields.object({ name: text('Name'), role: text('Role') }, { label: 'Partnerships contact' }),
        audience: fields.object(
          {
            asOf: text('Figures as of'),
            facts: fields.array(fields.object({ value: text('Number'), label: text('What it counts') }), {
              label: 'Numbers',
              itemLabel: (props) => `${props.fields.value.value} ${props.fields.label.value}`,
            }),
          },
          { label: 'Who comes' },
        ),
        ways: fields.array(fields.object({ title: text('Title'), text: long('Text') }), {
          label: 'How partners take part',
          itemLabel: (props) => props.fields.title.value,
        }),
      },
    }),

    gallery: singleton({
      label: 'Gallery',
      path: 'src/data/gallery',
      format: { data: 'json' },
      schema: {
        intro: long('Introduction'),
        events: fields.array(
          fields.object({
            id: text('ID', 'Short, lower case, for example sotonship-26. Photos use it to say which event they are from.'),
            name: text('Name'),
            when: text('When'),
            where: text('Where'),
            link: link('More about it'),
          }),
          { label: 'Events the photos are from', itemLabel: (props) => props.fields.name.value },
        ),
        photos: fields.array(
          fields.object({
            file: fields.image({ label: 'Photo', directory: 'src/assets/gallery', validation: { isRequired: true } }),
            event: text('Event ID', `Which event the photo is from: one of the IDs in the list above (${galleryEventIds}).`),
            alt: long('Description', 'One plain sentence about what is in the photo. It is read out to people who cannot see it and shown when the photo is opened.'),
          }),
          { label: 'Photos', itemLabel: (props) => props.fields.alt.value || 'Photo' },
        ),
      },
    }),

    hackathons: singleton({
      label: 'SotonShip and hackathons',
      path: 'src/data/hackathons',
      format: { data: 'json' },
      schema: {
        intro: long('Introduction'),
        heroPhoto: fields.image({ label: 'Photo at the top', directory: 'src/assets/hackathons' }),
        editions: fields.array(
          fields.object({
            id: text('ID'),
            name: text('Name'),
            when: text('When'),
            where: text('Where'),
            summary: long('Look-back text', 'Only shown for the newest hackathon'),
            blurb: long('Short description'),
            facts: fields.array(fields.object({ label: text('Label'), value: text('Value') }), {
              label: 'Key facts',
              itemLabel: (props) => props.fields.label.value,
            }),
            tracks: fields.array(fields.object({ name: text('Track'), text: long('Description') }), {
              label: 'Tracks',
              itemLabel: (props) => props.fields.name.value,
            }),
            links: fields.array(fields.object({ label: text('Button text'), url: link('Link') }), {
              label: 'Buttons',
              itemLabel: (props) => props.fields.label.value,
            }),
            photos: fields.array(
              fields.object({
                file: fields.image({ label: 'Photo', directory: 'src/assets/hackathons' }),
                alt: long('Description'),
              }),
              { label: 'Photos', itemLabel: (props) => props.fields.alt.value || 'Photo' },
            ),
            results: fields.array(
              fields.object({
                track: text('Track or prize'),
                winner: fields.object(
                  {
                    team: text('Team'),
                    project: text('Project'),
                    photo: fields.image({ label: 'Photo', directory: 'src/assets/hackathons' }),
                  },
                  { label: 'Winners' },
                ),
                runnerUp: fields.object(
                  {
                    team: text('Team'),
                    project: text('Project'),
                    photo: fields.image({ label: 'Photo', directory: 'src/assets/hackathons' }),
                  },
                  { label: 'Runners-up' },
                ),
              }),
              { label: 'Winners and runners-up', itemLabel: (props) => props.fields.track.value },
            ),
            sponsors: fields.array(
              fields.object({
                tier: text('Tier', 'For example Event partners and sponsors'),
                items: fields.array(
                  fields.object({
                    name: text('Company'),
                    logo: fields.image({ label: 'Logo', directory: 'public/sponsors', publicPath: '/sponsors/' }),
                  }),
                  { label: 'Companies', itemLabel: (props) => props.fields.name.value },
                ),
              }),
              { label: 'Sponsors', itemLabel: (props) => props.fields.tier.value },
            ),
          }),
          { label: 'Hackathons, newest first', itemLabel: (props) => props.fields.name.value },
        ),
        earlierPhotos: fields.array(
          fields.object({
            file: fields.image({ label: 'Photo', directory: 'src/assets/hackathons' }),
            alt: long('Description'),
          }),
          { label: "Photos from earlier hackathons", itemLabel: (props) => props.fields.alt.value || 'Photo' },
        ),
        elsewhere: fields.array(
          fields.object({
            name: text('Name'),
            by: text('Run by'),
            text: long('Description'),
            logo: fields.image({ label: 'Logo', directory: 'public/hackathons', publicPath: '/hackathons/' }),
            logoTone: fields.select({
              label: 'Logo background',
              options: [
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ],
              defaultValue: 'light',
            }),
            links: fields.array(fields.object({ label: text('Button text'), url: link('Link') }), {
              label: 'Buttons',
              itemLabel: (props) => props.fields.label.value,
            }),
          }),
          { label: 'Other societies’ hackathons', itemLabel: (props) => props.fields.name.value },
        ),
      },
    }),

    projects: singleton({
      label: 'Projects',
      path: 'src/data/projects',
      format: { data: 'json' },
      schema: {
        intro: long('Introduction'),
        lead: text('Projects lead'),
        flagships: fields.array(
          fields.object({
            id: text('ID'),
            name: text('Name'),
            plate: fields.select({
              label: 'Drawing',
              options: [
                { label: 'Token blocks', value: 'tokens' },
                { label: '48 hours', value: 'hours' },
                { label: 'Face', value: 'face' },
                { label: 'Pen stroke', value: 'stroke' },
              ],
              defaultValue: 'tokens',
            }),
            plateAlt: text('Drawing description'),
            tags: fields.array(fields.object({ label: text('Label'), live: fields.checkbox({ label: 'Highlighted' }) }), {
              label: 'Tags',
              itemLabel: (props) => props.fields.label.value,
            }),
            title: text('Title'),
            summary: long('Summary'),
            teaser: long('Teaser'),
            facts: fields.array(fields.object({ label: text('Label'), value: text('Value'), url: link('Link', 'Optional') }), {
              label: 'Facts',
              itemLabel: (props) => props.fields.label.value,
            }),
            actions: fields.array(fields.object({ label: text('Button text'), url: link('Link'), primary: fields.checkbox({ label: 'Main button' }) }), {
              label: 'Buttons',
              itemLabel: (props) => props.fields.label.value,
            }),
          }),
          { label: 'Large projects', itemLabel: (props) => props.fields.name.value },
        ),
        small: fields.array(
          fields.object({
            id: text('ID'),
            name: text('Name'),
            plate: fields.select({
              label: 'Drawing',
              options: [
                { label: 'Token blocks', value: 'tokens' },
                { label: '48 hours', value: 'hours' },
                { label: 'Face', value: 'face' },
                { label: 'Pen stroke', value: 'stroke' },
              ],
              defaultValue: 'face',
            }),
            tag: text('Tag'),
            summary: long('Summary'),
            action: fields.object({ label: text('Button text'), url: link('Link') }, { label: 'Button' }),
          }),
          { label: 'Smaller builds', itemLabel: (props) => props.fields.name.value },
        ),
      },
    }),

    workshops: singleton({
      label: 'Workshops',
      path: 'src/data/workshops',
      format: { data: 'json' },
      schema: {
        intro: long('Introduction'),
        years: fields.array(
          fields.object({
            label: text('Year', 'For example 2024 to 2025'),
            repo: link('GitHub repository'),
            topics: fields.array(text('Topic'), { label: 'Topics', itemLabel: (props) => props.value }),
          }),
          { label: 'Workshop material by year', itemLabel: (props) => props.fields.label.value },
        ),
        path: fields.array(fields.object({ title: text('Step'), text: long('Text') }), {
          label: 'New to this? steps',
          itemLabel: (props) => props.fields.title.value,
        }),
      },
    }),
  },
});
