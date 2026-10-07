/* Page transition: leaving an internal page, a dark curtain rises over the screen (curved top edge, lime Positiv bolt in the middle) and then the
   next page loads; on arrival (also on reload) the curtain keeps rising and uncovers the page. Skipped on the very first visit (the intro does the job),
   for reduced motion, for modified clicks (Ctrl/Cmd/Shift, middle button), new-tab links, external links, #anchors and downloads. */
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap) { root.classList.remove('pt-cover'); return; }

  const el = document.createElement('div');
  el.className = 'pt'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="pt__curve"></div><img class="pt__bolt" src="/assets/logo.svg" alt="" width="150" height="38" draggable="false">';
  document.body.appendChild(el);
  const bolt = el.querySelector('.pt__bolt');
  const curveH = () => window.innerHeight * 0.14;
  const park = () => gsap.set(el, { visibility: 'hidden', yPercent: 100, y: curveH() });
  park();

  /* arrival: the page is still covered (html.pt-cover) -> curtain stays up until the page has loaded, then lifts away */
  let revealed = false;
  const reveal = () => {
    if (revealed) return; revealed = true;
    if (!root.classList.contains('pt-cover')) return;
    gsap.set(el, { visibility: 'visible', yPercent: 0, y: 0 });
    gsap.set(bolt, { opacity: 1, scale: 1 });
    root.classList.remove('pt-cover');
    document.dispatchEvent(new Event('positiv:intro-done'));         // lets the hero heading start as the curtain rises (same hook as the intro)
    gsap.timeline({ onComplete: park })
      .to(bolt, { opacity: 0, scale: 0.8, duration: 0.25, ease: 'power2.in' }, 0)
      .to(el, { yPercent: -100, y: 0, duration: 0.95, ease: 'power4.inOut' }, 0.12);
  };
  if (root.classList.contains('pt-cover')) {
    const loaded = new Promise((r) => { if (document.readyState === 'complete') r(); else window.addEventListener('load', r, { once: true }); });
    Promise.race([loaded, new Promise((r) => setTimeout(r, 3000))]).then(() => setTimeout(reveal, 120));
  }

  /* leaving */
  let busy = false;
  const leave = (href) => {
    busy = true;
    gsap.set(el, { visibility: 'visible', yPercent: 100, y: curveH() });
    gsap.set(bolt, { opacity: 0, scale: 0.6 });
    gsap.timeline({ onComplete: () => { location.href = href; } })
      .to(el, { yPercent: 0, y: 0, duration: 0.6, ease: 'power3.inOut' }, 0)
      .to(bolt, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, 0.32);
    setTimeout(() => { if (busy) { busy = false; park(); } }, 6000);   // safety: navigation was blocked
  };
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    let u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || !/(\.html?|\/)$/.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;       // same page / #anchor
    e.preventDefault();
    if (!busy) leave(u.href);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { busy = false; revealed = true; root.classList.remove('pt-cover'); park(); } });   // back button (bfcache)
})();
