/* Pricing page behaviour (loaded after main.js): scroll reveal with a small stagger for sibling cards. Without JS / with
   reduced motion the content is simply visible (see css/pricing.css). */
(() => {
  'use strict';
  const items = [...document.querySelectorAll('.pr-reveal')];
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  // cards that sit in the same grid enter one after another
  items.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('pr-reveal'));
    if (sibs.length > 1) el.style.setProperty('--d', `${sibs.indexOf(el) * 0.12}s`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => io.observe(el));
})();
