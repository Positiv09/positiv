/* Creative Team as a Service: "How it works" timeline.
   Each step's illustration only animates while its step is on screen (.is-live), and the lime streak on the
   second step's rail travels down the line as that step scrolls past. Without JS the pictures simply play
   and the streak sits where the design shows it; with reduced motion it stays put. */
(() => {
  'use strict';
  const steps = [...document.querySelectorAll('[data-ct-step]')];
  if (!steps.length) return;

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    }, { rootMargin: '10% 0px' });
    steps.forEach((s) => io.observe(s));
  } else {
    steps.forEach((s) => s.classList.add('is-live'));
  }

  const beam = document.querySelector('[data-ct-beam]');
  if (!beam || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const step = beam.closest('[data-ct-step]');
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = step.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));   // 0 as the step enters at the bottom, 1 as it leaves at the top
    beam.style.setProperty('--p', p.toFixed(3));
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
