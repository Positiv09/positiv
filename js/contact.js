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

  /* Replace this with a real request, e.g.
       return fetch('https://formspree.io/f/XXXX', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
     It must resolve on success and reject (throw) on failure. */
  const submit = () => new Promise((resolve) => setTimeout(resolve, 900));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    btn.classList.add('is-sending'); label.textContent = 'Sending...';
    try {
      await submit(new FormData(form));
      $('[data-first-name]', ok).textContent = form.elements.name.value.trim().split(/\s+/)[0] || 'friend';
      ok.hidden = false; ok.focus?.();
    } catch (x) {
      err.hidden = false; err.textContent = 'Something went wrong. Please try again or email us directly.';
    } finally { btn.classList.remove('is-sending'); label.textContent = 'Send message'; }
  });

  $('.form-reset', ok)?.addEventListener('click', () => { form.reset(); ok.hidden = true; err.hidden = true; $$('.is-invalid', form).forEach((f) => f.classList.remove('is-invalid')); form.elements.name.focus(); });
})();
