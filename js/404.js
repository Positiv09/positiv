/* 404 page: the spheres drift a little against the mouse (each at its own depth). Decorative only; off for reduced motion and touch. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches) return;
  const orbs = [...document.querySelectorAll('.orb')];
  if (!orbs.length) return;
  let tx = 0, ty = 0, raf = 0;
  const apply = () => { raf = 0; orbs.forEach((o) => { const d = parseFloat(o.dataset.depth) || 0.4; o.style.transform = `translate(${(tx * d * -26).toFixed(1)}px, ${(ty * d * -18).toFixed(1)}px)`; }); };
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
})();
