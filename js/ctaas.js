/* Creative Team as a Service: timeline scroll interaction (matches the approved prototype).
   - each step comes in (fade, rise, un-blur, staggered) once its top passes 72% of the viewport,
     and resets only after it drops back below the viewport, so it replays on the way down again;
   - its dot settles in, the latest step's dot gets a soft lime ring;
   - a lime streak glides down the rail lines, eased toward the middle of the viewport.
   Without JS or with reduced motion nothing is hidden: the section shows exactly as designed. */
(() => {
  'use strict';
  const steps = [...document.querySelectorAll('[data-ct-step]')];
  if (!steps.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  root.classList.add('ct-motion');
  const lines = [...document.querySelectorAll('.ct-rail__line')];

  let lineTops = [];
  const measureLines = () => { lineTops = lines.map((l) => l.getBoundingClientRect().top + window.scrollY); };

  let shown = steps.map(() => false);
  const update = () => {
    const vh = window.innerHeight;
    let now = -1;
    steps.forEach((el, i) => {
      const top = el.getBoundingClientRect().top;
      const on = top < vh * 0.72 || (shown[i] && top < vh);
      if (on !== shown[i]) { shown[i] = on; el.classList.toggle('is-in', on); }
      if (on) now = i;
    });
    steps.forEach((el, i) => el.classList.toggle('is-now', i === now));
  };

  // streak: one point (the viewport's middle, in page coordinates) eased with a little inertia,
  // drawn inside every rail line (each line clips it), so it reads as one light running down the timeline
  let target = 0, current = null, glideRaf = 0;
  const paint = () => {
    lines.forEach((l, i) => l.style.setProperty('--beam', (current - lineTops[i] - 100).toFixed(1) + 'px'));
  };
  const glide = () => {
    glideRaf = 0;
    const d = target - current;
    current += d * 0.12;
    paint();
    if (Math.abs(d) > 0.3) glideRaf = requestAnimationFrame(glide);
  };
  const track = () => {
    target = window.scrollY + window.innerHeight * 0.5;
    if (current === null) { current = target; paint(); }
    if (!glideRaf) glideRaf = requestAnimationFrame(glide);
  };

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; update(); track(); });
  };
  const onResize = () => { measureLines(); onScroll(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);
  measureLines(); update(); track();
})();
