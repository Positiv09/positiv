/* Scroll reveal shared by the pricing page and the home page (loaded after main.js): each .pr-reveal block fades up 28px
   as it enters the viewport, and blocks that sit side by side in the same parent enter one after another (0.12s apart).
   It plays every time: once a block has left the screen completely it is put back to its hidden state, so scrolling
   back over it (up or down) makes it rise again. Without JS / with reduced motion the content is simply visible (see
   css/sections.css). On the home page the hero waits for the intro curtain to lift, so its reveal is actually seen. */
(() => {
  'use strict';
  const items = [...document.querySelectorAll('.pr-reveal')];
  if (!items.length) return;
  const root = document.documentElement;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('is-in', 'is-done'));
    return;
  }
  // blocks that sit in the same parent enter one after another
  items.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('pr-reveal'));
    if (sibs.length > 1) el.style.setProperty('--d', `${sibs.indexOf(el) * 0.12}s`);
  });
  const timers = new WeakMap();
  const show = (el) => {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    el.dispatchEvent(new CustomEvent('reveal:in', { bubbles: true }));
    // once it has arrived the element goes back to its own CSS (its hover / press transitions, no reveal delay on them)
    const d = parseFloat(el.style.getPropertyValue('--d')) || 0;
    timers.set(el, setTimeout(() => el.classList.add('is-done'), (0.95 + d) * 1000));
  };
  // fully off screen (either side): hidden again, ready to rise the next time it comes into view
  const hide = (el) => {
    if (!el.classList.contains('is-in')) return;
    clearTimeout(timers.get(el));
    el.classList.remove('is-in', 'is-done');
    el.dispatchEvent(new CustomEvent('reveal:out', { bubbles: true }));
  };
  const inIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) show(e.target); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const outIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) return;
      const r = e.target.getBoundingClientRect();
      if (r.width || r.height) hide(e.target);          // skip blocks that are not displayed at this screen size
    });
  }, { rootMargin: '0px', threshold: 0 });
  // the last lines of a page can never climb above the bottom 8% (there is nothing left to scroll), so at the very end
  // everything already on screen comes in
  let raf = 0;
  const atEnd = () => {
    raf = 0;
    if (window.scrollY + window.innerHeight < root.scrollHeight - 4) return;
    items.forEach((el) => { if (el.classList.contains('is-in')) return; const r = el.getBoundingClientRect(); if (r.width && r.top < window.innerHeight && r.bottom > 0) show(el); });
  };
  const start = () => {
    items.forEach((el) => { inIo.observe(el); outIo.observe(el); });
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(atEnd); }, { passive: true });
    atEnd();
  };
  if (root.classList.contains('intro-on')) document.addEventListener('positiv:intro-done', start, { once: true });
  else start();
})();
