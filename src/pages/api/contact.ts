// POST /api/contact: the contact form sends its message here, and this sends it on as an
// email to the society inbox with the right committee members copied in (src/lib/contact.ts).
//
// Delivery goes through one of two services, chosen by the Vercel settings:
// - FormSubmit (formsubmit.co), the default. No account or key. The first message sent
//   asks the society inbox to activate the form; FORMSUBMIT_TO can then hold the random
//   address FormSubmit gives, so the real address is not used in the request.
// - Resend (resend.com), when RESEND_API_KEY and CONTACT_FROM are set. CONTACT_FROM must
//   be an address on a domain verified in Resend, for example "AI Society <website@example.org>".
//
// On a laptop (astro dev) nothing is sent: the email is printed in the terminal instead.
import type { APIRoute } from 'astro';
import site from '../../data/site.json';
import { MAX_EMAIL, MAX_MESSAGE, MAX_NAME, type Topic, looksLikeEmail, mailtoFor, recipientsFor, subjectFor, topicById } from '../../lib/contact';

export const prerender = false;

interface Mail {
  topic: Topic;
  name: string;
  email: string;
  message: string;
  to: string;
  cc: string[];
  subject: string;
  origin: string;
}

const env = (key: string) => (process.env[key] ?? '').trim();

function plainText(mail: Mail): string {
  return [
    `Topic: ${mail.topic.name}`,
    `From: ${mail.name} <${mail.email}>`,
    '',
    mail.message,
    '',
    '--',
    `Sent from the contact form on ${mail.origin}/contact. Reply to this email to answer ${mail.name}.`,
  ].join('\n');
}

async function viaResend(mail: Mail, key: string, from: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [mail.to], cc: mail.cc, reply_to: mail.email, subject: mail.subject, text: plainText(mail) }),
  });
  if (!res.ok) console.error(`contact: Resend answered ${res.status}: ${await res.text()}`);
  return res.ok;
}

async function viaFormSubmit(mail: Mail): Promise<boolean> {
  const target = env('FORMSUBMIT_TO') || mail.to;
  const res = await fetch(`https://formsubmit.co/ajax/${target}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: mail.origin, Referer: `${mail.origin}/contact` },
    body: JSON.stringify({
      _subject: mail.subject,
      _cc: mail.cc.join(','),
      _replyto: mail.email,
      _template: 'table',
      _captcha: 'false',
      Topic: mail.topic.name,
      Name: mail.name,
      email: mail.email,
      Message: mail.message,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: unknown; message?: unknown };
  const ok = res.ok && String(body.success) === 'true';
  // Until the society inbox activates the form, FormSubmit answers with a request to do so.
  if (!ok) console.error(`contact: FormSubmit answered ${res.status}: ${String(body.message ?? '')}`);
  return ok;
}

async function deliver(mail: Mail): Promise<boolean> {
  if (import.meta.env.DEV) {
    console.log(`\ncontact (not sent on a laptop)\nTo: ${mail.to}\nCc: ${mail.cc.join(', ')}\nReply-To: ${mail.email}\nSubject: ${mail.subject}\n\n${plainText(mail)}\n`);
    return true;
  }
  try {
    const key = env('RESEND_API_KEY');
    const from = env('CONTACT_FROM');
    return key && from ? await viaResend(mail, key, from) : await viaFormSubmit(mail);
  } catch (error) {
    console.error('contact: sending failed', error);
    return false;
  }
}

export const POST: APIRoute = async ({ request, url }) => {
  // The form posts with fetch and asks for JSON; without JavaScript it is an ordinary form post.
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const answer = (status: number, body: { ok: boolean; error?: string; mailto?: string }) =>
    wantsJson
      ? Response.json(body, { status })
      : Response.redirect(new URL(body.ok ? '/contact/sent' : '/contact/not-sent', url), 303);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return answer(400, { ok: false, error: 'That message could not be read. Try again.' });
  }
  const field = (key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max);

  // A box people never see. Anything typed in it came from a bot: say thank you and send nothing.
  if (field('website', 200)) return answer(200, { ok: true });

  const topic = topicById(field('topic', 40));
  const name = field('name', MAX_NAME).replace(/[\r\n]+/g, ' ');
  const email = field('email', MAX_EMAIL);
  const message = field('message', MAX_MESSAGE);

  if (name.length < 2) return answer(422, { ok: false, error: 'Add your name, so we know who to write back to.' });
  if (!looksLikeEmail(email)) return answer(422, { ok: false, error: 'That email address is missing something. Check it and try again.' });
  if (message.length < 2) return answer(422, { ok: false, error: 'Write your message first.' });

  const { to, cc } = recipientsFor(topic);
  const sent = await deliver({ topic, name, email, message, to, cc, subject: subjectFor(topic, name), origin: url.origin });
  if (sent) return answer(200, { ok: true });
  return answer(502, {
    ok: false,
    error: `That did not go through. Send it from your own email instead, to ${site.email}.`,
    mailto: mailtoFor(topic, name, message),
  });
};
