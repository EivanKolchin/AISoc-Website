// The contact form, one question at a time: what it is about, where to reply, the message.
// Picking a topic with the mouse moves straight on; keyboard users press Continue.
// The message is posted to /api/contact. If sending fails, the same email can be opened
// in the visitor's own mail app instead.

const STEPS = 3; // the three questions; step 3 is the "sent" screen
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initContact(form: HTMLFormElement): void {
  const q = <T extends Element>(selector: string) => form.querySelector<T>(selector);
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const segments = [...form.querySelectorAll<HTMLElement>('.cf-progress span')];
  const count = q<HTMLElement>('[data-cf-count]');
  const hint = q<HTMLElement>('[data-cf-hint]');
  const fallback = q<HTMLAnchorElement>('[data-cf-fallback]');
  const ask = q<HTMLElement>('[data-cf-ask]');
  const readers = q<HTMLElement>('[data-cf-readers]');
  const doneName = q<HTMLElement>('[data-cf-name]');
  const doneText = q<HTMLElement>('[data-cf-done-text]');
  const send = q<HTMLButtonElement>('[data-cf-send]');
  const name = q<HTMLInputElement>('input[name="name"]');
  const email = q<HTMLInputElement>('input[name="email"]');
  const message = q<HTMLTextAreaElement>('textarea[name="message"]');
  const topics = [...form.querySelectorAll<HTMLInputElement>('input[name="topic"]')];
  const inbox = form.dataset.inbox ?? '';
  if (!name || !email || !message || !send) return;

  let current = 0;
  form.classList.add('is-stepped');

  const chosen = () => topics.find((input) => input.checked) ?? null;

  function say(text: string, error = false): void {
    if (!hint) return;
    hint.textContent = text;
    hint.classList.toggle('is-error', error && text !== '');
  }

  function flag(field: HTMLElement, text: string): false {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', 'cf-hint');
    say(text, true);
    field.focus();
    return false;
  }

  function clearFlags(): void {
    form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  }

  function show(step: number, moveFocus = true): void {
    const back = step < current;
    current = step;
    steps.forEach((el, i) => {
      el.hidden = i !== step;
      el.classList.toggle('is-back', back);
    });
    segments.forEach((seg, i) => seg.classList.toggle('is-filled', i <= step));
    if (count) count.textContent = step < STEPS ? `Step ${step + 1} of ${STEPS}` : 'Sent';
    say('');
    clearFlags();
    if (!moveFocus) return;
    const target =
      step === 0 ? (chosen() ?? topics[0]) : step === 1 ? (name!.value ? email : name) : step === 2 ? message : steps[3]?.querySelector<HTMLElement>('h2');
    target?.focus({ preventScroll: true });
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  // The message step asks about the chosen topic and says who will read it.
  function applyTopic(): void {
    const topic = chosen();
    if (!topic) return;
    if (ask) ask.textContent = topic.dataset.ask ?? '';
    message!.placeholder = topic.dataset.placeholder ?? '';
    const copied = topic.dataset.readers ?? '';
    if (readers) readers.textContent = `It goes to ${inbox}${copied ? `, with ${copied} copied in` : ''}.`;
  }

  function mailApp(): string {
    const topic = chosen();
    const cc = topic?.dataset.cc ?? '';
    const subject = `[${topic?.dataset.tag ?? 'Other'}] ${name!.value.trim() || 'A message'}, from the website`;
    const params = [cc && `cc=${cc}`, `subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(message!.value.trim())}`].filter(Boolean);
    return `mailto:${inbox}?${params.join('&')}`;
  }

  function offerMailApp(href: string): void {
    if (!fallback) return;
    fallback.href = href;
    fallback.hidden = false;
  }

  function checkStep(step: number): boolean {
    if (step === 0 && !chosen()) return flag(topics[0], 'Pick what your message is about first.');
    if (step === 1) {
      if (name!.value.trim().length < 2) return flag(name!, 'Add your name, so we know who to write back to.');
      if (!email!.value.trim()) return flag(email!, 'Add your email, so we can reply.');
      if (!looksLikeEmail(email!.value)) return flag(email!, 'That email address is missing something. Check it and carry on.');
    }
    if (step === 2 && message!.value.trim().length < 2) return flag(message!, 'Write your message first.');
    return true;
  }

  // A mouse or finger on a topic moves on by itself. A keyboard selection (click with no
  // detail, or the label passing the click to its radio) waits for Continue.
  form.querySelectorAll<HTMLLabelElement>('.cf-opt').forEach((option) => {
    option.addEventListener('click', (event) => {
      if (event.target instanceof HTMLInputElement || event.detail === 0) return;
      window.setTimeout(() => {
        applyTopic();
        show(1);
      }, 160);
    });
  });
  topics.forEach((input) => input.addEventListener('change', applyTopic));

  form.querySelectorAll('[data-cf-next]').forEach((button) =>
    button.addEventListener('click', () => {
      if (checkStep(current)) show(current + 1);
    }),
  );
  form.querySelectorAll('[data-cf-back]').forEach((button) => button.addEventListener('click', () => show(current - 1)));
  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute('aria-invalid')) {
      event.target.removeAttribute('aria-invalid');
      say('');
    }
  });

  q('[data-cf-again]')?.addEventListener('click', () => {
    message.value = '';
    topics.forEach((input) => (input.checked = false));
    if (fallback) fallback.hidden = true;
    show(0);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Enter in an earlier step means Continue.
    if (current < 2) {
      if (checkStep(current)) show(current + 1);
      return;
    }
    if (!checkStep(2) || send.disabled) return;

    send.disabled = true;
    send.setAttribute('aria-busy', 'true');
    send.textContent = 'Sending…';
    say('');
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; mailto?: string };
      if (res.ok && body.ok) {
        const first = name.value.trim().split(/\s+/)[0];
        if (doneName) doneName.textContent = first ? `, ${first}` : '';
        const copied = chosen()?.dataset.readers ?? '';
        if (doneText)
          doneText.textContent = `It is in the society inbox${copied ? `, and ${copied} ${copied.includes(' and ') ? 'have' : 'has'} a copy` : ''}. We will reply to ${email.value.trim()}.`;
        if (fallback) fallback.hidden = true;
        show(3);
        return;
      }
      say(body.error || 'That did not go through. You can send it from your own email instead.', true);
      if (res.status !== 422) offerMailApp(body.mailto || mailApp());
    } catch {
      say('That did not go through, which can happen on a weak connection. You can send it from your own email instead.', true);
      offerMailApp(mailApp());
    } finally {
      send.disabled = false;
      send.removeAttribute('aria-busy');
      send.textContent = 'Send message';
    }
  });

  // /contact?topic=hackathons starts with that topic chosen.
  const wanted = new URLSearchParams(location.search).get('topic');
  const preset = topics.find((input) => input.value === wanted);
  if (preset) {
    preset.checked = true;
    applyTopic();
  }
  show(preset ? 1 : 0, false);
}

document.querySelectorAll<HTMLFormElement>('[data-contact]').forEach(initContact);
