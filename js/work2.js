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
    // the floating bar sits far down the page: bring the (re-flowed) mosaic back to the top
    if (bar && bar.classList.contains('is-floating')) window.scrollTo({ top: mosaic.getBoundingClientRect().top + scrollY - 100, behavior: 'smooth' });
  }));

  // floating filter bar: docks at the bottom of the screen once its place in the hero has scrolled away, until the mosaic ends
  const bar = document.querySelector('.m-filters');
  const slot = document.querySelector('[data-filters-slot]');
  if (bar && slot && mosaic) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const floating = bar.classList.contains('is-floating');
      const slotBottom = (floating ? slot.getBoundingClientRect().top + slot.offsetHeight : bar.getBoundingClientRect().bottom);
      const want = slotBottom < 0 && mosaic.getBoundingClientRect().bottom > innerHeight * 0.6;
      if (want === floating) return;
      if (want) slot.style.height = bar.offsetHeight + 'px';   // keep the hero from collapsing when the bar leaves it
      else slot.style.height = '';
      bar.classList.toggle('is-floating', want);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }
})();
