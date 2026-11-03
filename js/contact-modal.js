/* Contact pop-up (Figma: "Contact — pop-up (minimal)").
   Any link to contact.html opens this pop-up instead of leaving the page; contact.html stays as the fallback
   (no JS, new tab, direct visits). A URL ending in #contact opens it on load.
   Sending uses the same FormSubmit address and the same one-message-per-hour guard as the contact page.
   Questions match the fit quiz: industry, company size and what they need (up to 3), each option with a short line under it.
   Every field except the message is required and turns red when it is missing. */
(() => {
  const ENDPOINT = 'https://formsubmit.co/ajax/tikarirafik@gmail.com';
  const COOLDOWN = 60 * 60 * 1000;
  const KEY = 'positivContactSentAt';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const chev = '<svg class="cm__chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="#211d1d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const mark = '<svg class="cm__mark" width="62" height="70" viewBox="0 0 62 70" fill="none" aria-hidden="true"><path d="M24.1846 0.539062H39.3916C41.2924 0.539062 42.8523 2.13087 42.7012 4.06543C42.4794 6.90519 42.0133 11.4563 41.3262 15.9561C40.6378 20.4638 39.7316 24.8923 38.6377 27.5049C38.4155 28.0354 38.5655 28.5542 38.916 28.8594C39.2673 29.165 39.7983 29.2365 40.2822 28.9307L40.2832 28.9316C45.3218 25.749 50.9763 23.6513 56.9883 23.0049C58.9557 22.7932 60.6963 24.3454 60.6963 26.3838V41.8467C60.6961 43.5019 59.3857 45.1035 57.8096 45.4131H57.8086C48.5899 47.2254 41.3374 56.7626 40.0273 66.5684C39.8042 68.236 38.4229 69.4609 36.7959 69.4609H21.5547C19.5987 69.4608 18.0939 67.7082 18.2705 65.6748C18.7345 60.3346 20.1074 55.1359 22.2246 50.3057L22.6582 49.3447C22.8931 48.8369 22.7529 48.3078 22.4336 47.9775C22.1109 47.644 21.5901 47.5013 21.0967 47.7891C15.9413 50.7932 10.1247 52.7354 3.92188 53.3135C1.96483 53.4959 0.25 51.953 0.25 49.9297V34.4258C0.25 33.6569 0.542838 32.8422 1.02832 32.1865C1.51437 31.5302 2.17623 31.0552 2.89355 30.9287C7.59322 30.1012 11.7582 25.6729 14.9023 20.2939C18.055 14.9003 20.2262 8.47499 20.9053 3.52539C21.1317 1.87297 22.5825 0.539062 24.1846 0.539062Z" stroke="url(#cmMarkStroke)" stroke-width="0.5"/><defs><linearGradient id="cmMarkStroke" x1="30" y1="-6" x2="30" y2="63.5" gradientUnits="userSpaceOnUse"><stop stop-color="#211D1D"/><stop offset="1" stop-color="#393939" stop-opacity="0"/></linearGradient></defs></svg>';

  const tick = '<svg class="cm__tick" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9.5l3.2 3.2L14 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* The dropdown questions. Each option has a title (t) and an optional short line (s), like the fit quiz.
     multi: how many can be picked. ex: picking it clears the others ("I'm not sure yet"). */
  const DROPDOWNS = {
    industry: { label: 'Industry', opts: [
      { t: 'Channel partner', s: 'Salesforce, NetSuite, HubSpot, ServiceNow' },
      { t: 'Technology', s: 'Security, AI, FinTech, SaaS & dev tools' },
      { t: 'Finance & Consulting', s: 'Consulting, advisory and financial services firms' },
      { t: 'Other' }] },
    size: { label: 'Company size', opts: [
      { t: 'Under 50', review: true }, { t: '50–200' }, { t: '200–500' }, { t: '500+', review: true }] },
    need: { label: 'What do you need?', multi: 3, opts: [
      { t: 'Brand', s: "It doesn't reflect how good we actually are" },
      { t: 'Sales assets', s: "Decks and materials that aren't winning deals" },
      { t: 'Website', s: "It gets visits but doesn't bring in leads" },
      { t: 'Marketing', s: 'Campaigns and content are inconsistent or slow' },
      { t: "I'm not sure yet", s: "Something's off and we'd like help finding what", ex: true }] }
  };

  /* One message per required field, shown under it in red. */
  const MESSAGES = {
    name: 'Add your name so we know who to reply to.',
    email: 'Add your work email so we can reply.',
    emailBad: "That email doesn't look right. Check it and try again.",
    company: 'Add your company name.',
    industry: 'Pick the industry closest to yours.',
    size: 'Pick your company size.',
    need: 'Pick at least one, or "I\'m not sure yet".'
  };

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
        <a class="cm__mail" href="mailto:hello@positiv.studio">hello@positiv.studio</a>
      </div>
      <form class="cm__form" novalidate>
        <label class="cm__field"><span class="cm__sr">Full name</span><input class="cm__line" name="name" type="text" autocomplete="name" placeholder="Full name" required><span class="cm__msg" hidden></span></label>
        <label class="cm__field"><span class="cm__sr">Work email</span><input class="cm__line" name="email" type="email" autocomplete="email" placeholder="Work email" required><span class="cm__msg" hidden></span></label>
        <label class="cm__field"><span class="cm__sr">Company name</span><input class="cm__line" name="company" type="text" autocomplete="organization" placeholder="Company name" required><span class="cm__msg" hidden></span></label>
        <div class="cm__field cm__dd" data-dd="industry"></div>
        <div class="cm__field cm__dd" data-dd="size"></div>
        <div class="cm__field cm__dd" data-dd="need"></div>
        <label class="cm__field"><span class="cm__sr">Message</span><textarea class="cm__box" name="message" rows="5" placeholder="Anything else we should know? (optional)"></textarea></label>
        <input class="cm__honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="cm__error" role="alert" hidden></p>
        <div class="cm__actions">
          <button type="submit" class="cm__send"><span>Send message</span></button>
        </div>
      </form>
    </div>
    <div class="cm__thanks" data-cm-thanks hidden>
      <h2 class="cm__title" tabindex="-1">Thanks, <span data-cm-first>there</span>.</h2>
      <p class="cm__lead" data-cm-thanks-text>We've got your request and we'll reply within one business day.</p>
      <button type="button" class="cm__send" data-cm-close><span>Close</span></button>
    </div>
  </div>
</div>`;

  let root, card, form, err, sendBtn, opener = null, openedAt = 0;
  const dds = {};   // name -> dropdown controller
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

  /* Red state + message under a field. msg = '' clears it. */
  const flag = (field, msg) => {
    field.classList.toggle('is-invalid', !!msg);
    const m = field.querySelector('.cm__msg');
    if (m) { m.textContent = msg || ''; m.hidden = !msg; }
  };
  const inputMessage = (i) => {
    const v = i.value.trim();
    if (i.name === 'email') return !v ? MESSAGES.email : (emailRe.test(v) ? '' : MESSAGES.emailBad);
    return i.required && !v ? MESSAGES[i.name] : '';
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
      const f = $$('button, [href], input:not([tabindex="-1"]):not([type="hidden"]), textarea').filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* Text fields: red as soon as someone leaves one empty (or with a bad email); cleared as they type. */
    $$('input.cm__line', form).forEach((i) => {
      const field = i.closest('.cm__field');
      i.addEventListener('input', () => { if (field.classList.contains('is-invalid') && !inputMessage(i)) flag(field, ''); });
      i.addEventListener('blur', (e) => {
        if (!root.classList.contains('is-open') || (e.relatedTarget && e.relatedTarget.closest('[data-cm-close]'))) return;
        flag(field, inputMessage(i));
      });
    });
    $$('[data-dd]', form).forEach((field) => { dds[field.dataset.dd] = dropdown(field, field.dataset.dd, DROPDOWNS[field.dataset.dd]); });
    form.addEventListener('reset', () => setTimeout(() => {
      Object.values(dds).forEach((d) => d.clear());
      $$('.cm__field', form).forEach((f) => flag(f, ''));
    }, 0));
    form.addEventListener('submit', onSubmit);
  };

  /* Custom dropdown: a button that opens a list (title + short line per option).
     Focus stays on the button; arrow keys move through the list, Enter or Space picks.
     Single choice closes the list. Multiple choice stays open until the limit is reached,
     "I'm not sure yet" is picked, or the visitor clicks elsewhere. No Done button, no inner scroll. */
  let uid = 0;
  function dropdown(field, name, spec) {
    const id = 'cm-list-' + (++uid), multi = spec.multi || 0;
    let sel = [], active = -1;
    field.innerHTML =
      `<input type="hidden" name="${name}">` +
      `<button type="button" class="cm__line cm__trigger is-empty" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}">` +
        `<span class="cm__lbl">${spec.label}</span><span class="cm__val">${spec.label}</span></button>${chev}` +
      `<ul class="cm__list" id="${id}" role="listbox" aria-label="${spec.label}"${multi ? ' aria-multiselectable="true"' : ''} tabindex="-1">` +
        (multi ? `<li class="cm__hint" role="presentation">Pick up to ${multi}.</li>` : '') +
        spec.opts.map((o, i) => (o.ex ? '<li class="cm__sep" role="presentation"></li>' : '') +
          `<li class="cm__opt" id="${id}-${i}" role="option" aria-selected="false"><span class="cm__opt-txt"><span class="cm__opt-t">${o.t}</span>` +
          (o.s ? `<span class="cm__opt-s">${o.s}</span>` : '') + `</span>${tick}</li>`).join('') +
      '</ul><span class="cm__msg" hidden></span>';
    const hidden = field.querySelector('input'), btn = field.querySelector('.cm__trigger'), list = field.querySelector('.cm__list');
    const opts = [...list.querySelectorAll('.cm__opt')];
    const isOpen = () => field.classList.contains('is-open');
    const hasEx = () => sel.some((i) => spec.opts[i].ex);
    const disabled = (i) => multi && !sel.includes(i) && ((hasEx() && !spec.opts[i].ex) || (!spec.opts[i].ex && sel.length >= multi));

    const sync = () => {
      const text = sel.map((i) => spec.opts[i].t).join(', ');
      hidden.value = text;
      field.querySelector('.cm__val').textContent = text || spec.label;
      btn.classList.toggle('is-empty', !sel.length);
      btn.setAttribute('aria-label', `${spec.label}: ${text || 'not selected'}`);
      opts.forEach((li, n) => { li.setAttribute('aria-selected', String(sel.includes(n))); li.toggleAttribute('aria-disabled', disabled(n)); });
    };
    const setActive = (i) => {
      active = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach((li, n) => li.classList.toggle('is-active', n === active));
      btn.setAttribute('aria-activedescendant', opts[active].id);
    };
    const show = () => {
      Object.values(dds).forEach((d) => d !== api && d.hide(false));
      field.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      setActive(sel.length ? sel[0] : 0);
      requestAnimationFrame(() => list.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    };
    /* check: the visitor closed it themselves, so an empty answer turns red now */
    const hide = (check) => {
      if (!isOpen()) return;
      field.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant');
      if (check && !sel.length) flag(field, MESSAGES[name]);
    };
    const choose = (i) => {
      if (disabled(i)) return;
      if (!multi) { sel = [i]; sync(); flag(field, ''); hide(false); btn.focus(); return; }
      const at = sel.indexOf(i);
      if (at >= 0) sel.splice(at, 1);
      else if (spec.opts[i].ex) sel = [i];
      else sel.push(i);
      sync(); if (sel.length) flag(field, '');
      if (at < 0 && (spec.opts[i].ex || sel.length >= multi)) { hide(false); btn.focus(); }
    };

    opts.forEach((li, i) => {
      li.addEventListener('mousedown', (e) => e.preventDefault());   // keep focus on the button
      li.addEventListener('click', () => choose(i));
      li.addEventListener('mousemove', () => setActive(i));
    });
    btn.addEventListener('click', (e) => { e.preventDefault(); isOpen() ? hide(true) : show(); });
    btn.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); if (!isOpen()) show(); else setActive(active + (k === 'ArrowDown' ? 1 : -1)); }
      else if (k === 'Home' || k === 'End') { if (isOpen()) { e.preventDefault(); setActive(k === 'Home' ? 0 : opts.length - 1); } }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (isOpen()) choose(active); else show(); }
      else if (k === 'Escape' && isOpen()) { e.preventDefault(); e.stopPropagation(); hide(true); }
      else if (k === 'Tab' && isOpen()) hide(true);
    });
    btn.addEventListener('blur', () => setTimeout(() => { if (!field.contains(document.activeElement) && root.classList.contains('is-open')) hide(true); }, 0));
    document.addEventListener('mousedown', (e) => { if (isOpen() && !field.contains(e.target)) hide(!e.target.closest('[data-cm-close]') && e.target !== root); });

    const api = {
      hide, sync, btn,
      clear() { sel = []; sync(); hide(false); },
      value: () => sel.map((i) => spec.opts[i]),
      message: () => (sel.length ? '' : MESSAGES[name])
    };
    sync();
    return api;
  }

  /* Every required field turns red with its own message; focus goes to the first one. */
  const validate = () => {
    let first = null;
    $$('.cm__field', form).forEach((field) => {
      const dd = field.dataset.dd && dds[field.dataset.dd], i = field.querySelector('input.cm__line');
      const msg = dd ? dd.message() : (i ? inputMessage(i) : '');
      if (!dd && !i) return;
      flag(field, msg);
      if (msg && !first) first = dd ? dd.btn : i;
    });
    if (first) first.focus();
    return !first;
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (applyLimit()) return;
    showError('');
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
    const size = dds.size.value()[0];
    sendBtn.classList.add('is-sending'); sendBtn.disabled = true; sendBtn.querySelector('span').textContent = 'Sending...';
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(ENDPOINT, {
        signal: ctl.signal, method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Name: f.name.value.trim(), Email: f.email.value.trim(), Company: f.company.value.trim(),
          Industry: f.industry.value, 'Company size': f.size.value, Needs: f.need.value, Message: f.message.value.trim() || '-',
          'Size check': size && size.review ? 'Outside 50–500 employees: review before replying' : 'OK',
          Page: location.href, 'Sent at': new Date().toString(),
          _subject: `New message from ${f.name.value.trim()} - Positiv website`, _replyto: f.email.value.trim(), _template: 'table', _captcha: 'false'
        })
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || `HTTP ${res.status}`);
      remember();
      done();
    } catch (x) {
      console.warn('contact pop-up:', x);
      showError('We could not send your message just now. Please try again in a few minutes, or write to hello@positiv.studio.');
    } finally {
      sendBtn.classList.remove('is-sending'); sendBtn.querySelector('span').textContent = 'Send message'; sendBtn.disabled = false;
    }
  }

  function open(from) {
    build();
    opener = from || document.activeElement;
    openedAt = Date.now();
    if (!$('[data-cm-thanks]').hidden) { form.reset(); $('[data-cm-thanks]').hidden = true; $('[data-cm-form-view]').hidden = false; }
    showError(''); sendBtn.disabled = false; $$('.cm__field', form).forEach((f) => flag(f, '')); applyLimit();
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
