/* Creative Team as a Service: "How it works" stepper.
   Four steps on one hairline and one showcase panel. The current step's segment fills while it plays
   (6s each, only while the section is on screen); then the next step and its illustration take over.
   Hovering or focusing the steps holds it; clicking a step jumps to it.
   Without JS the first step and its illustration show; with reduced motion it never auto-plays. */
(() => {
  'use strict';
  const root = document.querySelector('[data-ct-journey]');
  if (!root) return;
  const stops = [...root.querySelectorAll('[data-ct-stop]')];
  const layers = [...root.querySelectorAll('[data-ct-layer]')];
  const fills = stops.map((s) => s.querySelector('[data-ct-fill]'));
  if (stops.length !== layers.length || !stops.length) return;

  const DUR = 6000;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0, t = 0, last = 0, held = false, inView = false, raf = 0;

  const show = (i) => {
    active = i; t = 0;
    stops.forEach((el, k) => {
      el.classList.toggle('is-active', k === i);
      el.classList.toggle('is-done', k < i);
      el.querySelector('button').setAttribute('aria-pressed', k === i ? 'true' : 'false');
      fills[k].style.width = '';
    });
    layers.forEach((el, k) => {
      el.classList.toggle('is-on', k === i);
      el.setAttribute('aria-hidden', k === i ? 'false' : 'true');
    });
  };

  const tick = (now) => {
    raf = 0;
    const dt = last ? Math.min(64, now - last) : 0;
    last = now;
    if (!held) t += dt;
    if (t >= DUR) show((active + 1) % stops.length);
    fills[active].style.width = (t / DUR * 100).toFixed(2) + '%';
    if (inView && !reduce) raf = requestAnimationFrame(tick);
  };
  const play = () => { if (!raf && inView && !reduce) { last = 0; raf = requestAnimationFrame(tick); } };

  stops.forEach((el, i) => el.querySelector('button').addEventListener('click', () => { show(i); play(); }));
  root.addEventListener('mouseenter', () => { held = true; });
  root.addEventListener('mouseleave', () => { held = false; });
  root.addEventListener('focusin', () => { held = true; });
  root.addEventListener('focusout', () => { held = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      inView = es[0].isIntersecting;
      if (inView) play(); else { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.3 }).observe(root);
  } else { inView = true; play(); }

  show(0);
})();
