/* Work page: project cards rise in as they enter the viewport */
(() => {
  const cards = [...document.querySelectorAll('.work-card')];
  if (!('IntersectionObserver' in window)) { cards.forEach((c) => c.classList.add('is-in')); return; }
  const io = new IntersectionObserver((ens) => ens.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  cards.forEach((c, i) => { c.style.transitionDelay = `${(i % 2) * 120}ms`; io.observe(c); });
})();
