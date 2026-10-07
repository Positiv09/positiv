/* Work page: reveal on scroll + category filter (cards fade out/in, counts and status line stay in sync) */
(() => {
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const cards = $$('.w-card'), filters = $$('.w-filter'), status = document.getElementById('w-status');

  const items = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ens) => ens.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    items.forEach((el, i) => { if (el.classList.contains('w-card')) el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
  } else items.forEach((el) => el.classList.add('is-in'));

  const pad = (n) => String(n).padStart(2, '0');
  const countOf = (f) => cards.filter((c) => f === 'all' || c.dataset.cat === f).length;
  $$('[data-count]').forEach((el) => { el.textContent = pad(countOf(el.dataset.count)); });

  let timer;
  const apply = (f) => {
    filters.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === f));
    clearTimeout(timer);
    cards.forEach((c) => { c.style.transitionDelay = '0ms'; c.classList.add('is-out'); });
    timer = setTimeout(() => {
      cards.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.cat === f); });
      requestAnimationFrame(() => cards.forEach((c) => c.classList.remove('is-out')));
    }, 250);
    const n = countOf(f);
    if (status) status.textContent = f === 'all' ? `Showing all ${n} projects` : `Showing ${n} ${f} project${n === 1 ? '' : 's'}`;
  };
  filters.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));
})();
