/* Contact pop-up (Figma: "Contact — pop-up (minimal)").
   Any link to contact.html opens this pop-up instead of leaving the page; contact.html stays as the fallback
   (no JS, new tab, direct visits). A URL ending in #contact opens it on load.
   Sending uses the same FormSubmit address and the same one-message-per-hour guard as the contact page. */
(() => {
  const ENDPOINT = 'https://formsubmit.co/ajax/tikarirafik@gmail.com';
  const COOLDOWN = 60 * 60 * 1000;
  const KEY = 'positivContactSentAt';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const chev = '<svg class="cm__chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="#211d1d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const mark = '<svg class="cm__mark" width="62" height="70" viewBox="0 0 62 70" fill="none" aria-hidden="true"><path d="M24.1846 0.539062H39.3916C41.2924 0.539062 42.8523 2.13087 42.7012 4.06543C42.4794 6.90519 42.0133 11.4563 41.3262 15.9561C40.6378 20.4638 39.7316 24.8923 38.6377 27.5049C38.4155 28.0354 38.5655 28.5542 38.916 28.8594C39.2673 29.165 39.7983 29.2365 40.2822 28.9307L40.2832 28.9316C45.3218 25.749 50.9763 23.6513 56.9883 23.0049C58.9557 22.7932 60.6963 24.3454 60.6963 26.3838V41.8467C60.6961 43.5019 59.3857 45.1035 57.8096 45.4131H57.8086C48.5899 47.2254 41.3374 56.7626 40.0273 66.5684C39.8042 68.236 38.4229 69.4609 36.7959 69.4609H21.5547C19.5987 69.4608 18.0939 67.7082 18.2705 65.6748C18.7345 60.3346 20.1074 55.1359 22.2246 50.3057L22.6582 49.3447C22.8931 48.8369 22.7529 48.3078 22.4336 47.9775C22.1109 47.644 21.5901 47.5013 21.0967 47.7891C15.9413 50.7932 10.1247 52.7354 3.92188 53.3135C1.96483 53.4959 0.25 51.953 0.25 49.9297V34.4258C0.25 33.6569 0.542838 32.8422 1.02832 32.1865C1.51437 31.5302 2.17623 31.0552 2.89355 30.9287C7.59322 30.1012 11.7582 25.6729 14.9023 20.2939C18.055 14.9003 20.2262 8.47499 20.9053 3.52539C21.1317 1.87297 22.5825 0.539062 24.1846 0.539062Z" stroke="url(#cmMarkStroke)" stroke-width="0.5"/><defs><linearGradient id="cmMarkStroke" x1="30" y1="-6" x2="30" y2="63.5" gradientUnits="userSpaceOnUse"><stop stop-color="#211D1D"/><stop offset="1" stop-color="#393939" stop-opacity="0"/></linearGradient></defs></svg>';

  const html = `
<div class="cm" id="contact-modal" aria-hidden="true">
  <button type="button" class="cm__close" data-cm-close aria-label="Close">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
  </button>
  <div class="cm__card" role="dialog" aria-modal="true" aria-labelledby="cm-title" tabindex="-1">
    <div class="cm__head">${mark}</div>
    <div class="cm__view" data-cm-form-view>
      <div class="cm__head">
        <h2 class="cm__title" id="cm-title">Get in touch</h2>
        <p class="cm__lead">Tell us what you are working on. We reply within one business day.</p>
        <a class="cm__mail" href="mailto:hello@positiv.studio">hello@positiv.studio</a>
      </div>
      <form class="cm__form" novalidate>
        <label class="cm__field"><span class="cm__sr">Full name</span><input class="cm__line" name="name" type="text" autocomplete="name" placeholder="Full name" required></label>
        <label class="cm__field"><span class="cm__sr">Work email</span><input class="cm__line" name="email" type="email" autocomplete="email" placeholder="Work email" required></label>
        <label class="cm__field"><span class="cm__sr">Company name</span><input class="cm__line" name="company" type="text" autocomplete="organization" placeholder="Company name"></label>
        <label class="cm__field"><span class="cm__sr">Company size</span>
          <select class="cm__line cm__select" name="size" required>
            <option value="" disabled selected>Company size</option>
            <option>1–10 employees</option><option>11–50 employees</option><option>51–200 employees</option><option>201–500 employees</option><option>500+ employees</option>
          </select>${chev}</label>
        <label class="cm__field"><span class="cm__sr">What do you need?</span>
          <select class="cm__line cm__select" name="need" required>
            <option value="" disabled selected>What do you need?</option>
            <option>Creative Team as a Service</option><option>A Foundation (brand, sales or web)</option><option>Brand</option><option>Sales assets</option><option>Web</option><option>Marketing &amp; campaigns</option><option>Not sure yet</option>
          </select>${chev}</label>
        <label class="cm__field"><span class="cm__sr">Your message</span><textarea class="cm__box" name="message" rows="5" placeholder="Your message"></textarea></label>
        <input class="cm__honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="cm__error" role="alert" hidden></p>
        <div class="cm__actions">
          <button type="submit" class="cm__send">Send</button>
          <p class="cm__note">By sending this you agree to be contacted about your request.</p>
        </div>
      </form>
    </div>
    <div class="cm__thanks" data-cm-thanks hidden>
      <h2 class="cm__title" tabindex="-1">Thanks, <span data-cm-first>there</span>.</h2>
      <p class="cm__lead" data-cm-thanks-text>We have your message. A member of the team will reply within one business day.</p>
      <button type="button" class="cm__send" data-cm-close>Close</button>
    </div>
  </div>
</div>`;

  let root, card, form, err, sendBtn, opener = null, openedAt = 0;
  const $ = (s, c) => (c || root).querySelector(s);
  const $$ = (s, c) => [...(c || root).querySelectorAll(s)];

  /* one-per-hour guard, shared with the contact page */
  const readStored = () => {
    let a = 0, b = 0;
    try { a = +localStorage.getItem(KEY) || 0; } catch (x) { /* blocked */ }
    try { b = +((document.cookie.split('; ').find((c) => c.indexOf(KEY + '=') === 0) || '').slice(KEY.length + 1)) || 0; } catch (x) { /* blocked */ }
    return Math.max(a, b);
  };
  const remaining = () => { const t = readStored(), left = t ? t + COOLDOWN - Date.now() : 0; return left > 0 && left <= COOLDOWN + 60000 ? left : 0; };
  const remember = () => {
    const t = Date.now();
    try { localStorage.setItem(KEY, String(t)); } catch (x) { /* blocked */ }
    try { document.cookie = `${KEY}=${t}; max-age=${COOLDOWN / 1000}; path=/; SameSite=Lax`; } catch (x) { /* blocked */ }
  };
  const minutes = (ms) => { const m = Math.ceil(ms / 60000); return m <= 1 ? 'less than a minute' : `${m} minutes`; };

  const showError = (msg) => { err.textContent = msg || ''; err.hidden = !msg; };
  const applyLimit = () => {
    const left = remaining();
    sendBtn.disabled = !!left;
    if (left) showError(`Your message has already been sent. To keep our inbox free of spam, one message can be sent per hour from this device. You can write to us again in ${minutes(left)}.`);
    return left;
  };

  const build = () => {
    if (root) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    root = wrap.firstElementChild;
    document.body.appendChild(root);
    card = $('.cm__card'); form = $('form'); err = $('.cm__error'); sendBtn = $('.cm__send', form);

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-cm-close]') || e.target === root) close();
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = $$('button, [href], input:not([tabindex="-1"]), select, textarea').filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    $$('input, select', form).forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => i.closest('.cm__field').classList.remove('is-invalid')));
    form.addEventListener('submit', onSubmit);
  };

  const validate = () => {
    let first = null, msg = '';
    $$('[required]', form).forEach((i) => {
      const v = i.value.trim(), bad = !v || (i.type === 'email' && !emailRe.test(v));
      i.closest('.cm__field').classList.toggle('is-invalid', bad);
      if (bad && !first) { first = i; msg = i.type === 'email' && v ? 'Please enter a valid email address.' : 'Please fill in the highlighted fields.'; }
    });
    showError(msg);
    if (first) first.focus();
    return !first;
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (applyLimit()) return;
    if (!validate()) return;
    const f = form.elements;
    const first = f.name.value.trim().split(/\s+/)[0] || 'there';
    const done = (text) => {
      $('[data-cm-first]').textContent = first;
      if (text) $('[data-cm-thanks-text]').textContent = text;
      $('[data-cm-form-view]').hidden = true;
      $('[data-cm-thanks]').hidden = false;
      $('[data-cm-thanks] .cm__title').focus();
    };
    if (f._honey.value || Date.now() - openedAt < 1500) { done(); return; }   // bot: looks like success, nothing is sent
    sendBtn.classList.add('is-sending'); sendBtn.disabled = true; sendBtn.textContent = 'Sending...';
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(ENDPOINT, {
        signal: ctl.signal, method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Name: f.name.value.trim(), Email: f.email.value.trim(), Company: f.company.value.trim() || '-', 'Company size': f.size.value,
          Needs: f.need.value, Message: f.message.value.trim() || '-', Page: location.href, 'Sent at': new Date().toString(),
          _subject: `New message from ${f.name.value.trim()} - Positiv website`, _replyto: f.email.value.trim(), _template: 'table', _captcha: 'false'
        })
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || `HTTP ${res.status}`);
      remember();
      done(`We have your message. We will reply to ${f.email.value.trim()} within one business day.`);
    } catch (x) {
      console.warn('contact pop-up:', x);
      showError('We could not send your message just now. Please try again in a few minutes, or write to hello@positiv.studio.');
    } finally {
      sendBtn.classList.remove('is-sending'); sendBtn.textContent = 'Send'; sendBtn.disabled = false;
    }
  }

  function open(from) {
    build();
    opener = from || document.activeElement;
    openedAt = Date.now();
    if (!$('[data-cm-thanks]').hidden) { form.reset(); $('[data-cm-thanks]').hidden = true; $('[data-cm-form-view]').hidden = false; }
    showError(''); sendBtn.disabled = false; applyLimit();
    document.documentElement.classList.add('cm-lock');
    root.setAttribute('aria-hidden', 'false');
    root.scrollTop = 0;
    requestAnimationFrame(() => { root.classList.add('is-open'); card.focus({ preventScroll: true }); });
  }

  function close() {
    if (!root || !root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('cm-lock');
    if (location.hash === '#contact') history.replaceState(null, '', location.pathname + location.search);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  const isContactLink = (a) => {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    try { const u = new URL(a.href, location.href); return u.origin === location.origin && /\/contact(\.html)?$/.test(u.pathname) && !u.hash; } catch (x) { return false; }
  };
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!isContactLink(a)) return;
    e.preventDefault();
    open(a);
  }, true);

  window.PositivContact = { open: () => open(), close };
  if (location.hash === '#contact') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => open()); else open();
  }
})();
