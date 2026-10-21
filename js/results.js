/* Work (mosaic): tiles rise in as they enter the viewport; the filter pills fade the tiles out, hide the ones that do not match and re-flow the rest */
(() => {
  const mosaic = document.querySelector('.m-mosaic');
  const tiles = [...document.querySelectorAll('.m-tile')];
  const filters = [...document.querySelectorAll('.m-filter')];

  if (!('IntersectionObserver' in window)) tiles.forEach((t) => t.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((ens) => ens.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    tiles.forEach((t, i) => { t.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(t); });
  }

  let timer;
  const apply = (f) => {
    filters.forEach((b) => { const on = b.dataset.filter === f; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    clearTimeout(timer);
    tiles.forEach((t) => { t.style.transitionDelay = '0ms'; t.classList.add('is-out'); });
    timer = setTimeout(() => {
      mosaic.classList.toggle('is-filtered', f !== 'all');
      tiles.forEach((t) => { t.hidden = !(f === 'all' || t.dataset.cat.split(' ').includes(f)); t.classList.add('is-in'); });
      requestAnimationFrame(() => tiles.forEach((t, i) => { t.style.transitionDelay = `${(i % 4) * 60}ms`; t.classList.remove('is-out'); }));
    }, 280);
  };
  filters.forEach((b) => b.addEventListener('click', () => {
    apply(b.dataset.filter);
    // a filtered mosaic is a new list: start it from the top of the page (the hero), so the page is never left stranded mid-scroll
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));

  // the filter bar is docked at the bottom of the screen; it hides once the mosaic is (almost) scrolled past
  const bar = document.querySelector('.m-filters');
  if (bar && mosaic) {
    let ticking = false;
    const update = () => { ticking = false; bar.classList.toggle('is-hidden', mosaic.getBoundingClientRect().bottom < innerHeight * 0.6); };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }
})();
