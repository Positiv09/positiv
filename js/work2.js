/* Work (mosaic): tiles rise in as they enter the viewport */
(() => {
  const tiles = [...document.querySelectorAll('.m-tile')];
  if (!('IntersectionObserver' in window)) { tiles.forEach((t) => t.classList.add('is-in')); return; }
  const io = new IntersectionObserver((ens) => ens.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  tiles.forEach((t, i) => { t.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(t); });
})();
