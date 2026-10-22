/* Contact page: reveal on scroll, FAQ (one open at a time), form validation + success state.
   The form has no back end yet: submit() below is the single place to connect one (Formspree, Netlify Forms, your own endpoint...). */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* reveal */
  const items = $$('.c-card, .rv, .faq');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ens) => ens.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    items.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
  } else items.forEach((el) => el.classList.add('is-in'));

  /* FAQ: opening one closes the others */
  const faqs = $$('.faq');
  faqs.forEach((d) => d.addEventListener('toggle', () => { if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; }); }));

  /* form */
  const form = $('#contact-form');
  if (!form) return;
  const err = $('#form-error'), ok = $('#form-success'), btn = $('.contact-submit', form), label = $('span', btn);
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const setInvalid = (input, bad) => input.closest('.field')?.classList.toggle('is-invalid', bad);
  $$('input[required], textarea[required]', form).forEach((i) => i.addEventListener('input', () => setInvalid(i, false)));

  const validate = () => {
    let first = null, msg = '';
    $$('input[required], textarea[required]', form).forEach((i) => {
      const v = i.value.trim(), bad = !v || (i.type === 'email' && !emailRe.test(v));
      setInvalid(i, bad);
      if (bad && !first) { first = i; msg = i.type === 'email' && v ? 'Please enter a valid email address.' : 'Please fill in the required fields.'; }
    });
    err.hidden = !first; err.textContent = msg;
    if (first) first.focus();
    return !first;
  };

  /* ---------- Sending (FormSubmit: no account, the message arrives as an email) ----------
     The first message ever sent through this address makes FormSubmit mail an activation link to it; click it once and every later message is delivered. */
  const ENDPOINT = 'https://formsubmit.co/ajax/tikarirafik@gmail.com';
  const COOLDOWN = 60 * 60 * 1000;                                   // one message per device per hour
  const KEY = 'positivContactSentAt', loadedAt = Date.now();

  /* One-per-hour limit. Remembered in localStorage and in a 1-hour cookie, so clearing only one of them does not lift it.
     It is a browser-side guard (a visitor who clears all site data or switches browser can send again): a hard limit needs a server. */
  const readStored = () => {
    let a = 0, b = 0;
    try { a = +localStorage.getItem(KEY) || 0; } catch (x) { /* storage blocked */ }
    try { b = +((document.cookie.split('; ').find((c) => c.indexOf(KEY + '=') === 0) || '').slice(KEY.length + 1)) || 0; } catch (x) { /* cookies blocked */ }
    return Math.max(a, b);
  };
  const remaining = () => { const t = readStored(), left = t ? t + COOLDOWN - Date.now() : 0; return left > 0 && left <= COOLDOWN + 60000 ? left : 0; };
  const remember = () => {
    const t = Date.now();
    try { localStorage.setItem(KEY, String(t)); } catch (x) { /* storage blocked */ }
    try { document.cookie = `${KEY}=${t}; max-age=${COOLDOWN / 1000}; path=/; SameSite=Lax`; } catch (x) { /* cookies blocked */ }
  };
  const minutes = (ms) => { const m = Math.ceil(ms / 60000); return m <= 1 ? 'less than a minute' : `${m} minutes`; };

  const limit = document.createElement('div');                        // the "already sent" notice, built here so the markup stays as it is
  limit.className = 'form-limit'; limit.id = 'form-limit'; limit.setAttribute('role', 'status'); limit.hidden = true;
  limit.innerHTML = '<strong>Your message has already been sent</strong><span></span>';
  btn.parentNode.insertBefore(limit, btn);
  let tick = 0;
  const applyLimit = () => {
    clearInterval(tick);
    const left = remaining();
    limit.hidden = !left; btn.disabled = !!left; btn.classList.toggle('is-limited', !!left);
    if (!left) return;
    $('span', limit).textContent = `Thank you, we have it. To keep our inbox free of spam, one message can be sent per hour from this device. You can write to us again in ${minutes(left)}.`;
    tick = setInterval(applyLimit, 30000);
  };
  applyLimit();

  const honey = document.createElement('input');                      // bot trap: people never see or fill it
  honey.type = 'text'; honey.name = '_honey'; honey.tabIndex = -1; honey.autocomplete = 'off'; honey.setAttribute('aria-hidden', 'true');
  honey.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
  form.appendChild(honey);

  const send = async () => {
    const f = form.elements, topics = $$('input[name="topic"]:checked', form).map((i) => i.value).join(', ') || 'Not specified';
    const res = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        Name: f.name.value.trim(), Email: f.email.value.trim(), Company: f.company.value.trim() || '-', Role: f.role.value.trim() || '-',
        Needs: topics, Message: f.message.value.trim(), Page: location.href, 'Sent at': new Date().toString(),
        _subject: `New message from ${f.name.value.trim()} - Positiv website`, _replyto: f.email.value.trim(), _template: 'table', _captcha: 'false'
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || String(data.success) === 'false') throw new Error(data.message || `HTTP ${res.status}`);
  };

  const okText = $('p', ok), okOrig = okText.textContent, resetBtn = $('.form-reset', ok), resetOrig = resetBtn?.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (remaining()) { applyLimit(); return; }                         // limit first (also covers a second tab)
    if (!validate()) return;
    if (honey.value || Date.now() - loadedAt < 1500) { ok.hidden = false; return; }   // bot: looks like success, nothing is sent
    btn.classList.add('is-sending'); label.textContent = 'Sending...';
    try {
      await send();
      remember();
      const first = form.elements.name.value.trim().split(/\s+/)[0] || 'friend';
      $('[data-first-name]', ok).textContent = first;
      okText.textContent = `Your message has been sent. We will reply to ${form.elements.email.value.trim()} within one business day.`;
      if (resetBtn) resetBtn.textContent = 'Close';
      ok.hidden = false; ok.focus?.(); err.hidden = true;
      applyLimit();
    } catch (x) {
      console.warn('contact form:', x);
      err.hidden = false; err.textContent = 'We could not send your message just now. Please try again in a few minutes.';
    } finally { btn.classList.remove('is-sending'); label.textContent = 'Send message'; }
  });

  resetBtn?.addEventListener('click', () => {
    form.reset(); ok.hidden = true; err.hidden = true; okText.textContent = okOrig; resetBtn.textContent = resetOrig;
    $$('.is-invalid', form).forEach((f) => f.classList.remove('is-invalid'));
    applyLimit(); if (!remaining()) form.elements.name.focus();
  });
})();
