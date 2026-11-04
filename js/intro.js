/* First-visit opener: the Positiv mark draws its outline, floods with lime from the bottom and settles while a thin bar + percentage counts 0 -> 100%
   (about 3.6s, then it fades out; held until the page has really loaded, 6s at most). Shown once per browser session, skipped for reduced motion.
   The cover itself is painted by css/intro.css (html.intro-on) so there is no flash before this script runs. */
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro-on')) return;

  const el = document.createElement('div');
  el.className = 'intro'; el.setAttribute('role', 'presentation'); el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="intro__stack">'
    + '<svg class="intro__logo-svg" viewBox="0 0 916 1017" xmlns="http://www.w3.org/2000/svg"><defs>'
    + '<path id="pv-shape" pathLength="1" d="M360 0H595Q645 0 645 55C635 180 615 320 585 402Q580 420 603 413C680 365 760 335 860 328Q916 328 916 380V610Q916 655 865 663C740 690 630 800 605 968Q598 1017 550 1017H325Q270 1017 270 960C280 870 300 790 337 715Q340 695 320 697C240 740 150 770 55 778Q0 778 0 725V495Q0 452 40 445C170 420 280 220 310 45Q318 0 360 0Z"/>'
    + '<clipPath id="pv-clip"><use href="#pv-shape"/></clipPath></defs>'
    + '<g class="intro__mark"><g clip-path="url(#pv-clip)"><rect class="intro__fill" x="-10" y="-10" width="936" height="1037" fill="#eef677"/></g><use class="intro__outline" href="#pv-shape"/></g></svg>'
    + '<div class="intro__loader"><div class="intro__track"><div class="intro__bar"></div></div><span class="intro__pct">0%</span></div>'
    + '</div><button class="intro__skip" type="button">Skip</button>';
  document.body.appendChild(el);

  const bar = el.querySelector('.intro__bar'), pct = el.querySelector('.intro__pct'), skip = el.querySelector('.intro__skip');

  // percentage 0 -> 100% while the mark draws and fills, finishing just before the fade
  const delay = 200, duration = 3100, start = performance.now() + delay;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let counting = true;
  const tick = (now) => {
    if (!counting) return;
    const t = Math.min(Math.max((now - start) / duration, 0), 1), p = ease(t);
    bar.style.transform = 'scaleX(' + p + ')';
    pct.textContent = Math.round(p * 100) + '%';
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  let finished = false;
  const exit = (fast) => {
    if (finished) return; finished = true; counting = false;
    if (fast) { bar.style.transform = 'scaleX(1)'; pct.textContent = '100%'; el.style.transitionDuration = '.25s, 0s'; el.style.transitionDelay = '0s, .25s'; }
    el.classList.add('is-out');
    root.classList.remove('intro-on');                                   // the cover goes, the opener fades over the page
    try { sessionStorage.setItem('positivIntro', '1'); } catch (e) {}
    setTimeout(() => document.dispatchEvent(new Event('positiv:intro-done')), fast ? 80 : 300);   // the hero starts while the opener fades
    setTimeout(() => el.remove(), fast ? 400 : 800);
  };

  const loaded = new Promise((r) => { if (document.readyState === 'complete') r(); else window.addEventListener('load', r, { once: true }); });
  const minTime = new Promise((r) => setTimeout(r, 3600));
  Promise.all([minTime, Promise.race([loaded, new Promise((r) => setTimeout(r, 6000))])]).then(() => exit(false));
  skip.addEventListener('click', () => exit(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') exit(true); });
})();
