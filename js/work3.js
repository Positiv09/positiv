/* Work (cards): cards rise in as they enter the viewport; the filter pills fade them out, hide the ones that do not match and show the rest */
(() => {
  const cards = [...document.querySelectorAll('.c-card')];
  const filters = [...document.querySelectorAll('.m-filter')];

  if (!('IntersectionObserver' in window)) cards.forEach((c) => c.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((ens) => ens.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    cards.forEach((c, i) => { c.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(c); });
  }

  let timer;
  const apply = (f) => {
    filters.forEach((b) => { const on = b.dataset.filter === f; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    clearTimeout(timer);
    cards.forEach((c) => { c.style.transitionDelay = '0ms'; c.classList.add('is-out'); });
    timer = setTimeout(() => {
      cards.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.cat.split(' ').includes(f)); c.classList.add('is-in'); });
      requestAnimationFrame(() => cards.forEach((c, i) => { c.style.transitionDelay = `${(i % 3) * 70}ms`; c.classList.remove('is-out'); }));
    }, 280);
  };
  filters.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));
})();
