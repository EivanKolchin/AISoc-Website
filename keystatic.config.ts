// The committee dashboard at /keystatic. Each section edits one file in src/data.
// On your own computer (npm run dev) it saves straight to the files. On the live site it
// signs you in with GitHub and saves to the repository, which rebuilds the site.
// `npm run dashboard:setup` runs the GitHub version locally, which is needed once to
// create the GitHub App the login uses (see README).
import { config, fields, singleton } from '@keystatic/core';

const useGitHub = import.meta.env.PROD || import.meta.env.MODE === 'github';

const text = (label: string, description?: string) => fields.text({ label, description });
const long = (label: string, description?: string) => fields.text({ label, description, multiline: true });
const link = (label: string, description = 'A full web address, a page on this site such as /events, or # if there is none yet') =>
  fields.text({ label, description });

export default config({
  storage: useGitHub ? { kind: 'github', repo: 'EivanKolchin/AISoc-Website' } : { kind: 'local' },
  ui: {
    brand: { name: 'AI Society dashboard' },
    navigation: {
      'This term': ['events', 'site'],
      People: ['committee', 'partners'],
      'Photos and hackathons': ['gallery', 'hackathons'],
      'Other pages': ['projects', 'workshops'],
    },
  },
  singletons: {
    events: singleton({
      label: 'Events',
      path: 'src/data/events',
      format: { data: 'json' },
      schema: {
        events: fields.array(
          fields.object({
            id: text('ID', 'Lower case with hyphens, unique, for example thursday-workshop-2026-12-10. It becomes the calendar file name.'),
            title: text('Title'),
            short: text('Short name', 'A few words for the calendar square'),
            type: text('Type', 'For example Workshop, Talk, Hackathon'),
            level: text('Level', 'Optional, for example Beginners welcome'),
            start: text('Starts', 'UK time as YYYY-MM-DDTHH:mm, for example 2026-12-10T18:00. Just the date if the time is not known.'),
            end: text('Ends', 'Same format as Starts. Leave empty if not known.'),
            location: text('Where', 'For example Building 100, room 3023, or Online'),
            locationShort: text('Where, short', 'For example B100/3023'),
            with: fields.array(text('Co-host'), { label: 'Run with', itemLabel: (props) => props.value || 'Co-host' }),
            note: text('Note', 'One short practical sentence, for example Bring a laptop.'),
            stat: text('Attendance', 'After the event, for example 90 came'),
            summary: text('Summary', 'One line shown in the lists'),
            blurb: long('Description'),
            page: link('Sign-up or event page'),
            recap: link('Recap or photos', 'Where the write-up or photos are once it is over, or #'),
            recapLabel: text('Recap button text', 'For example Look back'),
          }),
          { label: 'Events', itemLabel: (props) => `${props.fields.start.value.slice(0, 10)}  ${props.fields.title.value}` },
        ),
      },
    }),

    site: singleton({
      label: 'Home page and society details',
      path: 'src/data/site',
      format: { data: 'json' },
      schema: {
        name: text('Society name'),
        shortName: text('Short name'),
        university: text('University'),
        legalName: text('Full legal name'),
        tagline: text('Tagline'),
        statement: long('Home page statement', 'The large sentence at the top of the home page'),
        intro: long('Short introduction'),
        notice: fields.object(
          {
            text: long('News text'),
            url: link('News link'),
          },
          { label: 'News box on the home page' },
        ),
        about: fields.object(
          {
            who: long('Who we are'),
            what: long('What we do'),
            aim: long('What we aim for'),
          },
          { label: 'Who we are block' },
        ),
        email: text('Email'),
        updated: text('Last updated', 'YYYY-MM-DD'),
        workshopSlot: fields.object(
          {
            day: text('Day'),
            start: text('Starts', 'HH:mm'),
            end: text('Ends', 'HH:mm'),
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
            asOf: text('Figures as of', 'YYYY-MM-DD'),
            discordMembers: fields.integer({ label: 'Discord members' }),
            instagramFollowers: fields.integer({ label: 'Instagram followers' }),
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
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'GitHub', value: 'github' },
              ],
              defaultValue: 'discord',
            }),
            label: text('Label'),
            url: link('Link'),
            hero: fields.checkbox({ label: 'Show at the top of the home page' }),
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
            initials: text('Initials', 'Shown when there is no photo'),
            photo: fields.image({ label: 'Photo', description: 'A square photo works best', directory: 'src/assets/committee' }),
            about: long('What they look after'),
            bio: long('Bio', 'Optional, written by the person'),
          }),
          { label: 'Members', itemLabel: (props) => `${props.fields.name.value}, ${props.fields.role.value}` },
        ),
        ask: fields.array(
          fields.object({
            topic: text('Topic'),
            who: text('Who'),
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
            event: text('Event ID', 'One of the IDs in the list above'),
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
