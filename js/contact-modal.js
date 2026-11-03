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

  const html = `
<div class="cm" id="contact-modal" aria-hidden="true">
  <button type="button" class="cm__close" data-cm-close aria-label="Close">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
  </button>
  <div class="cm__card" role="dialog" aria-modal="true" aria-labelledby="cm-title" tabindex="-1">
    <div class="cm__view" data-cm-form-view>
      <div class="cm__head">
        <h2 class="cm__title" id="cm-title">Get in touch</h2>
        <a class="cm__mail" href="mailto:hello@positiv.studio">hello@positiv.studio</a>
      </div>
      <form class="cm__form" novalidate>
        <label class="cm__field" data-error="Add your name so we know who to reply to."><span class="cm__sr">Full name</span><input class="cm__line" name="name" type="text" autocomplete="name" placeholder="Full name" required></label>
        <label class="cm__field" data-error="Add your work email so we can reply." data-error-format="Check your email address, it looks incomplete."><span class="cm__sr">Work email</span><input class="cm__line" name="email" type="email" autocomplete="email" placeholder="Work email" required></label>
        <label class="cm__field" data-error="Add your company name."><span class="cm__sr">Company name</span><input class="cm__line" name="company" type="text" autocomplete="organization" placeholder="Company name" required></label>
        <label class="cm__field" data-error="Choose your industry."><span class="cm__sr">Industry</span>
          <select class="cm__line cm__select" name="industry" required>
            <option value="" disabled selected>Industry</option>
            <option data-desc="Salesforce, NetSuite, HubSpot, ServiceNow">Channel partner</option>
            <option data-desc="Security, AI, FinTech, SaaS &amp; dev tools">Technology</option>
            <option data-desc="Consulting, advisory and financial services firms">Finance &amp; Consulting</option>
            <option>Other</option>
          </select>${chev}</label>
        <label class="cm__field" data-error="Choose your company size."><span class="cm__sr">Company size</span>
          <select class="cm__line cm__select" name="size" required>
            <option value="" disabled selected>Company size</option>
            <option>1–10</option><option>11–50</option><option>51–199</option><option>200–500</option><option>500+</option>
          </select>${chev}</label>
        <label class="cm__field" data-error="Choose what you need."><span class="cm__sr">What do you need?</span>
          <select class="cm__line cm__select" name="need" multiple required data-max="3" data-hint="Pick up to 3.">
            <option value="" disabled>What do you need?</option>
            <option data-desc="It doesn't reflect how good we actually are">Brand</option>
            <option data-desc="Decks and materials that aren't winning deals">Sales assets</option>
            <option data-desc="It gets visits but doesn't bring in leads">Website</option>
            <option data-desc="Campaigns and content are inconsistent or slow">Marketing</option>
            <option data-desc="Something's off and we'd like help finding what" data-exclusive data-divider>I'm not sure yet</option>
          </select>${chev}</label>
        <label class="cm__field"><span class="cm__sr">Your message</span><textarea class="cm__box" name="message" rows="5" placeholder="Anything else we should know? (optional)"></textarea></label>
        <input class="cm__honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="cm__error" role="alert" hidden></p>
        <div class="cm__actions">
          <button type="submit" class="cm__send"><span>Send</span></button>
        </div>
      </form>
    </div>
    <div class="cm__thanks" data-cm-thanks hidden>
      <h2 class="cm__title" tabindex="-1">Thanks, <span data-cm-first>there</span>.</h2>
      <p class="cm__lead" data-cm-thanks-text>We have your message. A member of the team will reply within one business day.</p>
      <button type="button" class="cm__send" data-cm-close><span>Close</span></button>
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
      const f = $$('button, [href], input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea').filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    $$('input, select', form).forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => setFieldError(i, '')));
    form.addEventListener('submit', onSubmit);
    $$('select', form).forEach(enhance);
  };

  /* Custom dropdown on top of each native select (the native list cannot be styled).
     The select stays in the form for the value and validation; the button + listbox are what people use. */
  let uid = 0;
  function enhance(sel) {
    const field = sel.closest('.cm__field'), ph = sel.options[0].text, id = 'cm-list-' + (++uid);
    sel.classList.add('cm__native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'cm__line cm__trigger is-empty';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id);
    const list = document.createElement('ul');
    list.className = 'cm__list'; list.id = id; list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', ph); list.tabIndex = -1;
    const multi = sel.multiple, max = +sel.dataset.max || Infinity;
    if (multi) list.setAttribute('aria-multiselectable', 'true');
    if (sel.dataset.hint) { const h = document.createElement('li'); h.className = 'cm__opt-hint'; h.setAttribute('role', 'presentation'); h.textContent = sel.dataset.hint; list.appendChild(h); }
    const opts = [...sel.options].slice(1).map((o, i) => {
      if (o.hasAttribute('data-divider')) { const d = document.createElement('li'); d.className = 'cm__opt-sep'; d.setAttribute('role', 'separator'); list.appendChild(d); }
      const li = document.createElement('li');
      li.className = 'cm__opt'; li.id = `${id}-${i}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false'); li.dataset.title = o.text;
      const t = document.createElement('span'); t.className = 'cm__opt-title'; t.textContent = o.text; li.appendChild(t);
      if (o.dataset.desc) { const d = document.createElement('span'); d.className = 'cm__opt-desc'; d.textContent = o.dataset.desc; li.appendChild(d); }
      li.insertAdjacentHTML('beforeend', '<svg class="cm__opt-check" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      li.addEventListener('mousedown', (e) => e.preventDefault());
      li.addEventListener('click', () => { choose(i); if (!multi) hide(); btn.focus(); });
      li.addEventListener('mousemove', () => setActive(i));
      list.appendChild(li); return li;
    });
    const flabel = document.createElement('span'); flabel.className = 'cm__flabel'; flabel.textContent = ph; flabel.setAttribute('aria-hidden', 'true');
    sel.before(btn); btn.before(flabel); field.appendChild(list);
    list.addEventListener('click', (e) => e.preventDefault());   // the field is a <label>: without this, a click in the list re-activates the trigger
    let active = -1;
    const isOpen = () => field.classList.contains('is-open');
    const setActive = (i) => {
      active = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach((li, n) => li.classList.toggle('is-active', n === active));
      btn.setAttribute('aria-activedescendant', opts[active].id);
      const li = opts[active];
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    };
    const picked = () => [...sel.options].slice(1).map((o, n) => (o.selected ? n : -1)).filter((n) => n >= 0);
    const sync = () => {
      const on = picked(), names = on.map((n) => opts[n].dataset.title).join(', ');
      btn.textContent = on.length ? names : ph;
      btn.classList.toggle('is-empty', !on.length);
      field.classList.toggle('has-value', !!on.length);
      btn.setAttribute('aria-label', `${ph} ${on.length ? names : 'not selected'}`);
      opts.forEach((li, n) => li.setAttribute('aria-selected', String(on.includes(n))));
      if (multi) {
        const full = on.length >= max;
        opts.forEach((li, n) => li.classList.toggle('is-disabled', full && !on.includes(n) && !sel.options[n + 1].hasAttribute('data-exclusive')));
      }
    };
    const choose = (i) => {
      const o = sel.options[i + 1];
      if (!multi) sel.selectedIndex = i + 1;
      else if (o.selected) o.selected = false;
      else {
        if (o.hasAttribute('data-exclusive')) [...sel.options].forEach((x) => { x.selected = false; });
        else {
          [...sel.options].forEach((x) => { if (x.hasAttribute('data-exclusive')) x.selected = false; });
          if (picked().length >= max) return;   // already 3
        }
        o.selected = true;
      }
      sel.dispatchEvent(new Event('change', { bubbles: true })); sync();
    };
    const show = () => {
      $$('.cm__field.is-open', form).forEach((f) => f !== field && f.__cmHide && f.__cmHide());
      field.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      const on = picked(); setActive(on.length ? on[0] : 0);
    };
    const hide = () => { field.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant'); };
    field.__cmHide = hide;
    btn.addEventListener('click', (e) => { e.preventDefault(); isOpen() ? hide() : show(); });
    btn.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); if (!isOpen()) show(); else setActive(active + (k === 'ArrowDown' ? 1 : -1)); }
      else if (k === 'Home' || k === 'End') { if (isOpen()) { e.preventDefault(); setActive(k === 'Home' ? 0 : opts.length - 1); } }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (isOpen()) { choose(active); if (!multi) hide(); } else show(); }
      else if (k === 'Escape' && isOpen()) { e.preventDefault(); e.stopPropagation(); hide(); }
      else if (k === 'Tab' && isOpen()) hide();
      else if (k.length === 1 && /\S/.test(k)) {
        const n = opts.findIndex((li) => li.dataset.title.toLowerCase().startsWith(k.toLowerCase()));
        if (n >= 0) { if (isOpen()) setActive(n); else if (!multi) choose(n); }
      }
    });
    btn.addEventListener('blur', () => setTimeout(() => { if (!field.contains(document.activeElement)) hide(); }, 0));
    document.addEventListener('mousedown', (e) => { if (isOpen() && !field.contains(e.target)) hide(); });
    form.addEventListener('reset', () => setTimeout(sync, 0));
    sync();
  }

  // one message under each field that needs fixing
  function setFieldError(i, msg) {
    const field = i.closest('.cm__field');
    if (!field) return;
    let el = field.querySelector('.cm__ferr');
    if (!el) { el = document.createElement('span'); el.className = 'cm__ferr'; el.id = 'cm-err-' + i.name; field.appendChild(el); }
    el.textContent = msg; el.hidden = !msg;
    field.classList.toggle('is-invalid', !!msg);
    const target = i.tagName === 'SELECT' ? field.querySelector('.cm__trigger') : i;
    if (msg) { target.setAttribute('aria-invalid', 'true'); target.setAttribute('aria-describedby', el.id); }
    else { target.removeAttribute('aria-invalid'); target.removeAttribute('aria-describedby'); }
  }

  const validate = () => {
    let first = null;
    $$('[required]', form).forEach((i) => {
      const v = i.value.trim(), field = i.closest('.cm__field');
      const msg = !v ? field.dataset.error : (i.type === 'email' && !emailRe.test(v) ? field.dataset.errorFormat : '');
      setFieldError(i, msg || '');
      if (msg && !first) first = i;
    });
    showError('');
    if (first) (first.tagName === 'SELECT' ? first.closest('.cm__field').querySelector('.cm__trigger') : first).focus();
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
    sendBtn.classList.add('is-sending'); sendBtn.disabled = true; sendBtn.querySelector('span').textContent = 'Sending...';
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(ENDPOINT, {
        signal: ctl.signal, method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Name: f.name.value.trim(), Email: f.email.value.trim(), Company: f.company.value.trim(), 'Company size': f.size.value, Industry: f.industry.value,
          Needs: [...f.need.selectedOptions].map((o) => o.value).join(', '), Message: f.message.value.trim() || '-', Page: location.href, 'Sent at': new Date().toString(),
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
      sendBtn.classList.remove('is-sending'); sendBtn.querySelector('span').textContent = 'Send'; sendBtn.disabled = false;
    }
  }

  function open(from) {
    build();
    opener = from || document.activeElement;
    openedAt = Date.now();
    if (!$('[data-cm-thanks]').hidden) { form.reset(); $$('[required]', form).forEach((i) => setFieldError(i, '')); $('[data-cm-thanks]').hidden = true; $('[data-cm-form-view]').hidden = false; }
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
