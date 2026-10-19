/* ==========================================================================
   Basic behaviour (no animation library required).
   Everything is keyed off data-* hooks so GSAP / Lenis / Three.js can take
   over later without touching the markup:
     [data-section]            → ScrollTrigger scopes
     [data-hero-media]         → replace with a <canvas> for WebGL
     [data-portfolio-*]        → pin + scrub horizontally
     [data-video-frame]        → sticky video / 3D model stage
   ========================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Placeholder links (href="#") have no destination yet: clicking them does nothing (no jump to the top of the page, no # in the URL). */
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });

  /* ---------- Seamless marquees ---------- */
  // Vertical hero columns: one clone is enough (a set is taller than the viewport).
  $$('[data-marquee-set]').forEach((set) => {
    if (set.closest('[data-logo-marquee]')) return;
    const clone = set.cloneNode(true);
    clone.removeAttribute('data-marquee-set');
    clone.setAttribute('aria-hidden', 'true');
    set.parentElement.appendChild(clone);
  });

  // Logo rows: clone until the track is wider than 2× the viewport, then animate by exactly one set width.
  const buildLogoMarquee = (row) => {
    const track = $('.logo-marquee__track', row);
    const set = $('[data-marquee-set]', track);
    [...track.children].forEach((c) => { if (c !== set) c.remove(); });
    const w = set.getBoundingClientRect().width;
    if (!w) return;
    const copies = Math.max(2, Math.ceil((row.clientWidth * 2) / w) + 1);
    for (let i = 1; i < copies; i++) {
      const c = set.cloneNode(true);
      c.removeAttribute('data-marquee-set');
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    }
    track.style.setProperty('--shift', `-${w}px`);
    const st = logoState.get(row);
    if (st) st.L = w;                            // loop length = one set (incl. its trailing gap)
  };
  const logoRows = $$('[data-logo-marquee]');
  const logoState = new Map();
  const buildAll = () => logoRows.forEach(buildLogoMarquee);

  /* Logo rows are also draggable: mouse / touch / pen drag in either direction with momentum, trackpad sideways
     swipe too. They keep drifting (row 1 left, row 2 right) and pause while hovered or dragged. A single rAF loop
     drives both rows; `pos` is the only state. */
  logoRows.forEach((row, i) => {
    const st = { row, track: $('.logo-marquee__track', row), dir: row.classList.contains('logo-marquee--reverse') ? -1 : 1,
                 base: 40, L: 0, pos: 0, vel: 0, factor: 1, target: 1, dragging: false, moved: false, startX: 0, lastX: 0, lastT: 0 };
    logoState.set(row, st);
    row.classList.add('is-js');
    row.addEventListener('mouseenter', () => { st.target = 0; });
    row.addEventListener('mouseleave', () => { st.target = 1; });
    row.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      st.dragging = true; st.moved = false; st.vel = 0; st.startX = st.lastX = e.clientX; st.lastT = performance.now();
    });
    row.addEventListener('pointermove', (e) => {
      if (!st.dragging) return;
      if (!st.moved) {
        if (Math.abs(e.clientX - st.startX) < 4) return;                       // small jitter is not a drag
        st.moved = true; row.setPointerCapture(e.pointerId); row.classList.add('is-dragging');
      }
      const now = performance.now(), dx = e.clientX - st.lastX, dt = Math.max((now - st.lastT) / 1000, 0.001);
      st.pos -= dx; st.vel = st.vel * 0.6 + (-dx / dt) * 0.4;                  // content follows the pointer
      st.lastX = e.clientX; st.lastT = now;
    });
    const endLogoDrag = () => { st.dragging = false; row.classList.remove('is-dragging'); };
    row.addEventListener('pointerup', endLogoDrag); row.addEventListener('pointercancel', endLogoDrag);
    row.addEventListener('wheel', (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;      // only sideways swipes; vertical wheel scrolls the page
      e.preventDefault(); st.vel += e.deltaX * 4;
    }, { passive: false });
  });
  /* Custom drag cursor for the logo rows: the system hand is white, so it vanishes on the light background.
     A small brand-yellow dot (cursor-sized) follows the mouse instead (mouse only; touch devices have no cursor). */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && logoRows.length) {
    const cur = document.createElement('div');
    cur.className = 'drag-cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="drag-cursor__ball"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg></span>';
    document.body.appendChild(cur);
    const place = (e) => { cur.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; };
    logoRows.forEach((row) => {
      row.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; place(e); cur.classList.add('is-visible'); });
      row.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') place(e); });
      row.addEventListener('pointerleave', () => { cur.classList.remove('is-visible', 'is-down'); });
      row.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') cur.classList.add('is-down'); });
      row.addEventListener('pointerup', () => cur.classList.remove('is-down'));
      row.addEventListener('pointercancel', () => cur.classList.remove('is-down'));
    });
  }

  buildAll();
  window.addEventListener('load', buildAll);   // re-measure once the SVGs have their natural size
  window.addEventListener('resize', buildAll);

  let logoLast = performance.now(), logoVisible = 0, logoRaf = 0;
  const logoTick = (now) => {
    logoRaf = 0;
    const dt = Math.min((now - logoLast) / 1000, 0.05); logoLast = now;
    logoState.forEach((st) => {
      st.factor += (st.target - st.factor) * Math.min(dt * 6, 1);
      if (!st.dragging) {
        const auto = reduceMotion ? 0 : st.dir * st.base * st.factor;
        st.pos += (auto + st.vel) * dt;
        st.vel *= Math.exp(-dt * 3.5);                                         // fling momentum decays
        if (Math.abs(st.vel) < 0.5) st.vel = 0;
      }
      if (st.L) st.pos = ((st.pos % st.L) + st.L) % st.L;
      st.track.style.transform = `translate3d(${-st.pos}px,0,0)`;
    });
    if (logoVisible > 0) logoRaf = requestAnimationFrame(logoTick);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { logoVisible += en.isIntersecting ? 1 : -1; });
      logoVisible = Math.max(logoVisible, 0);
      if (logoVisible > 0 && !logoRaf) { logoLast = performance.now(); logoRaf = requestAnimationFrame(logoTick); }
    });
    logoRows.forEach((r) => io.observe(r));
  } else { logoVisible = 1; logoRaf = requestAnimationFrame(logoTick); }

  /* ---------- Hero image columns ----------
     Each column is its own scroller: it auto-drifts (cols 1 & 3 up, col 2 down), slows to 25% while hovered,
     scrolls on its own with the mouse wheel / mouse-drag (momentum), and each tile has an expand button that
     opens the image in a lightbox. One rAF loop drives all three columns; everything is a function of `pos`. */
  let openLightbox = null;                          // set by the hero block below; reused by the service-card tiles
  const heroMedia = $('[data-hero-media]');
  const heroState = [];
  let heroPaused = false;
  if (heroMedia) {
    heroMedia.classList.add('is-js');
    const BASE = [34, 22, 26];                       // px/s — matches the old 60s / 90s / 75s CSS loops
    $$('.hero__col', heroMedia).forEach((col, i) => {
      const track = $('.hero__track', col);
      const sets = [...track.children];
      const st = { col, track, dir: col.classList.contains('hero__col--reverse') ? -1 : 1, base: BASE[i] || 28,
                   L: 0, pos: 0, vel: 0, factor: 1, target: 1, dragging: false, lastY: 0, lastT: 0 };
      const measure = () => { st.L = sets[1] ? sets[1].offsetTop - sets[0].offsetTop : sets[0].offsetHeight; };
      measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
      if (st.dir < 0) st.pos = st.L * 0.5;
      col.addEventListener('mouseenter', () => { st.target = 0.25; });
      col.addEventListener('mouseleave', () => { st.target = 1; });
      col.addEventListener('wheel', (e) => {
        if (e.ctrlKey || !matchMedia('(min-width: 992px)').matches) return;       // keep pinch-zoom and touch/tablet page scroll
        e.preventDefault();
        const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
        st.vel += dy * 4;
      }, { passive: false });
      // A press only becomes a drag after 5px of movement; before that it is still a click (opens the image).
      col.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('.hero__expand')) return;
        st.pressed = true; st.moved = false; st.vel = 0; st.startY = st.lastY = e.clientY; st.lastT = performance.now();
      });
      col.addEventListener('pointermove', (e) => {
        if (!st.pressed) return;
        if (!st.dragging) {
          if (Math.abs(e.clientY - st.startY) < 5) return;
          st.dragging = true; st.moved = true; st.lastY = e.clientY; st.lastT = performance.now();
          col.classList.add('is-dragging'); col.setPointerCapture(e.pointerId);
        }
        const now = performance.now(), dy = e.clientY - st.lastY, dt = Math.max((now - st.lastT) / 1000, 0.001);
        st.pos -= dy; st.vel = st.vel * 0.6 + (-dy / dt) * 0.4;                    // content follows the pointer, keep a fling velocity
        st.lastY = e.clientY; st.lastT = now;
      });
      const endDrag = () => { st.pressed = false; if (st.dragging) { st.dragging = false; col.classList.remove('is-dragging'); } };
      col.addEventListener('pointerup', endDrag); col.addEventListener('pointercancel', endDrag);
      heroState.push(st);
    });

    let last = performance.now(), visible = true, raf = 0;
    const tick = (now) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      heroState.forEach((st) => {
        st.factor += (st.target - st.factor) * Math.min(dt * 6, 1);                // eased slow-down on hover
        if (!st.dragging) {
          const auto = reduceMotion || heroPaused ? 0 : st.dir * st.base * st.factor;
          st.pos += (auto + st.vel) * dt;
          st.vel *= Math.exp(-dt * 4);                                             // wheel/fling momentum decays (~.25s)
          if (Math.abs(st.vel) < 0.5) st.vel = 0;
        }
        if (st.L) st.pos = ((st.pos % st.L) + st.L) % st.L;
        st.track.style.transform = `translate3d(0,${-st.pos}px,0)`;
      });
      if (visible) raf = requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((ens) => { const en = ens[ens.length - 1]; visible = en.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }).observe(heroMedia);
    }
    raf = requestAnimationFrame(tick);

    // Lightbox
    const lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image preview');
    lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="lightbox__stage"><div class="lightbox__gallery"><img class="lightbox__img" alt=""><img class="lightbox__extra lightbox__extra--a" alt=""><img class="lightbox__extra lightbox__extra--b" alt=""></div><aside class="lightbox__info" aria-live="polite"></aside></div>';
    document.body.appendChild(lb);
    const lbImg = $('.lightbox__img', lb);
    const lbExtrasAll = $$('.lightbox__extra', lb);
    let opener = null;
    // Figma exported these JPGs with their rounded corners filled light grey; clip the preview to the same radius (measured: the grey corner arc is ~28px on a 492px-wide export, so 6% of the width)
    const fitRadius = () => { lbImg.style.borderRadius = '0'; const w = lbImg.getBoundingClientRect().width; lbImg.style.clipPath = `inset(${(w * 0.025).toFixed(1)}px round ${(w * 0.05).toFixed(1)}px)`; };   // trim 2.5% off every edge: removes the whole grey corner arc (it reaches ~1.7% in), then re-round
    lbImg.addEventListener('load', fitRadius); window.addEventListener('resize', fitRadius);
    // Click the big picture to bring it in front of the two small ones (they dim and settle back); click a small one to hand the front back.
    const lbGallery = $('.lightbox__gallery', lb);
    lbImg.addEventListener('click', () => lbGallery.classList.toggle('is-front'));
    lbExtrasAll.forEach((im) => im.addEventListener('click', () => lbGallery.classList.remove('is-front')));
    const lbInfo = $('.lightbox__info', lb);
    // `panel` (optional): the service-card text panel of that picture, shown beside the image (icon, title, the work, deliverables, number)
    const lbExtras = lbExtrasAll;
    const openLb = (src, from, panel, extras) => {
      lbGallery.classList.remove('is-front');
      lbExtras.forEach((im, i) => { const u = extras && extras[i]; if (u) im.src = u; im.style.display = u ? '' : 'none'; });
      lbInfo.textContent = '';
      if (panel) {
        const c = panel.cloneNode(true);
        c.removeAttribute('style'); c.removeAttribute('data-svc-panel'); c.className = 'lightbox__panel';
        const t = $('.svc-panel__title', c); if (t) t.textContent = t.getAttribute('aria-label') || t.textContent;
        $$('.svc-pill', c).forEach((a) => { const sp = document.createElement('span'); sp.className = 'svc-pill'; sp.textContent = a.textContent; a.replaceWith(sp); });
        lbInfo.appendChild(c);
      }
      lb.classList.toggle('has-info', !!panel);
      lbImg.src = src; lb.classList.add('is-open'); heroPaused = true; opener = from; $('.lightbox__close', lb).focus();
    };
    openLightbox = openLb;
    const closeLb = () => { if (!lb.classList.contains('is-open')) return; lb.classList.remove('is-open'); heroPaused = false; opener?.focus?.({ preventScroll: true }); };
    // (the hero pictures no longer open on click; the lightbox is only used by the service-card pictures)
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lightbox__close')) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }

  /* ---------- CTA background mark: the light starts when the mark scrolls into view ----------
     The strip animation (css .cta-mark__head) only runs while .cta-mark has .is-live; every time the mark comes into view it restarts
     from the beginning at the left edge, and keeps looping while it stays visible. */
  const ctaMark = $('.cta-mark');
  if (ctaMark) {
    const live = (on) => { ctaMark.classList.remove('is-live'); if (on) { void ctaMark.getBoundingClientRect(); ctaMark.classList.add('is-live'); } };   // remove + reflow + add = restart
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver((ens) => { const e = ens[ens.length - 1]; if (e.isIntersecting && !ctaMark.classList.contains('is-live')) live(true); else if (!e.isIntersecting) live(false); }, { threshold: 0.35 }).observe(ctaMark);
    }
  }

  /* ---------- CTA heading ----------
     Masked letters that rise each time the heading scrolls into view; without GSAP / with reduced motion it is simply static. */
  const ctaTitle = $('.cta__title');
  if (ctaTitle && !ctaTitle.dataset.split) {
    const nodes = [...ctaTitle.childNodes];
    ctaTitle.setAttribute('aria-label', ctaTitle.textContent.replace(/\s+/g, ' ').trim());
    ctaTitle.dataset.split = '1';
    ctaTitle.textContent = '';
    let idx = 0;
    nodes.forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'BR') { ctaTitle.appendChild(document.createElement('br')); return; }
      const text = n.textContent.replace(/\s+/g, ' ');
      text.split(' ').forEach((w, wi, arr) => {
        if (w) {
          const word = document.createElement('span');
          word.className = 'hero__mask'; word.setAttribute('aria-hidden', 'true');
          [...w].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'hero__char'; c.style.setProperty('--i', idx++);
            c.textContent = ch;
            word.appendChild(c);
          });
          ctaTitle.appendChild(word);
        }
        if (wi < arr.length - 1) ctaTitle.appendChild(document.createTextNode(' '));
      });
    });
    if (window.gsap && !reduceMotion && 'IntersectionObserver' in window) {
      const chars = $$('.hero__char', ctaTitle), marks = $$('.t-mark', ctaTitle);
      gsap.set(marks, { transformOrigin: '50% 80%' });
      let tl = null, idle = [];
      const stop = () => { tl?.kill(); idle.forEach((t) => t.kill()); idle = []; };
      const reset = () => { stop(); gsap.set(chars, { clearProps: 'transform,opacity' }); gsap.set(chars, { opacity: 0 }); gsap.set(marks, { clearProps: 'transform,opacity' }); gsap.set(marks, { scale: 0, opacity: 0 }); };
      const play = () => {
        stop();
        gsap.set(chars, { clearProps: 'transform,opacity' });
        tl = gsap.timeline();
        tl.fromTo(chars, { yPercent: 140, rotation: (i) => (i % 2 ? 10 : -10), transformOrigin: '0% 100%', opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, duration: 1.15, ease: 'back.out(1.8)', stagger: 0.035 }, 0)
          .fromTo(marks, { scale: 0, opacity: 0, yPercent: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: 'elastic.out(1, 0.45)', stagger: 0.18 }, 0.45)
          .add(() => {
            marks.forEach((m, i) => {
              idle.push(gsap.timeline({ repeat: -1, repeatDelay: 2.2 + i * 1.1, delay: 0.8 + i * 1.3 })
                .to(m, { yPercent: -16, scaleX: 0.94, scaleY: 1.1, duration: 0.26, ease: 'power2.out' })
                .to(m, { yPercent: 0, scaleX: 1.12, scaleY: 0.84, duration: 0.17, ease: 'power2.in' })
                .to(m, { scaleX: 1, scaleY: 1, duration: 1.05, ease: 'elastic.out(1, 0.3)' }));
            });
          }, '>-0.2');
      };
      reset();
      let shown = false;
      new IntersectionObserver((ens) => {
        const en = ens[ens.length - 1];
        if (en.isIntersecting && en.intersectionRatio >= 0.5 && !shown) { shown = true; play(); }
        else if (!en.isIntersecting && shown) { shown = false; reset(); }
      }, { threshold: [0, 0.5] }).observe(ctaTitle);
    }
  }

  /* ---------- Section headings: replaying word reveal (no hover) ----------
     Words start dim, lowered and blurred; each time a heading enters the viewport (≥35% visible) they develop in a
     stagger with a soft overshoot, and it re-arms once the heading has fully left the screen. Applied to every plain
     section heading (only the hero heading and its rotating word keep their own motion). */
  if (window.gsap && !reduceMotion) {
    const headingChecks = [];
    const runChecks = () => headingChecks.forEach((f) => f());
    window.addEventListener('scroll', runChecks, { passive: true });
    window.addEventListener('resize', runChecks);
    setInterval(runChecks, 350);
    const revealHeading = (heading) => {
      const label = heading.textContent.replace(/\s+/g, ' ').trim();
      heading.setAttribute('aria-label', label);
      const fw = [];
      const splitNode = (node, into) => {
        node.childNodes.forEach((n) => {
          if (n.nodeType === 3) {
            n.textContent.split(/(\s+)/).forEach((tok) => {
              if (!tok) return;
              if (/^\s+$/.test(tok)) { into.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span'); w.className = 'ft-word'; w.textContent = tok; w.setAttribute('aria-hidden', 'true');
              into.appendChild(w); fw.push(w);
            });
          } else if (n.nodeType === 1) {
            if (n.tagName === 'BR') { into.appendChild(n.cloneNode()); return; }
            if (n.classList.contains('about-t')) { const w = document.createElement('span'); w.className = 'ft-word'; w.setAttribute('aria-hidden', 'true'); w.appendChild(n.cloneNode(true)); into.appendChild(w); fw.push(w); return; }   // the logo-style "t" travels with its word
            const wrap = document.createElement(n.tagName.toLowerCase());
            wrap.className = n.className; wrap.setAttribute('aria-hidden', 'true');
            splitNode(n, wrap); into.appendChild(wrap);
          }
        });
      };
      const holder = document.createDocumentFragment();
      splitNode(heading, holder);
      heading.textContent = ''; heading.appendChild(holder);
      heading.classList.add('is-split');
      const hide = () => gsap.set(fw, { opacity: 0.12, yPercent: 60, filter: 'blur(8px)', rotation: 3 });
      hide();
      let shown = false, done = false, tw = null;
      const play = () => {
        shown = true; done = false; tw?.kill();
        tw = gsap.fromTo(fw, { opacity: 0.12, yPercent: 60, filter: 'blur(8px)', rotation: 3 },
          { opacity: 1, yPercent: 0, filter: 'blur(0px)', rotation: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.09, overwrite: 'auto', onComplete: () => { done = true; } });
      };
      /* State is re-checked from geometry (not only from IntersectionObserver events), so a slow-loading page,
         a restored scroll position or a batched callback can never leave a heading stuck in its hidden state. */
      const check = () => {
        const r = heading.getBoundingClientRect(), vh = window.innerHeight;
        if (!r.height) return;
        const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        const enough = vis > 0 && (vis / r.height >= 0.35 || vis >= vh * 0.4);
        const out = r.bottom <= 0 || r.top >= vh;
        if (enough && !shown) play();
        else if (out && shown) { shown = false; done = false; tw?.kill(); hide(); }
        else if (enough && shown && !done && tw && !tw.isActive()) play();           // tween was killed/stalled → run it again
      };
      headingChecks.push(check);
      if ('IntersectionObserver' in window) new IntersectionObserver(check, { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1] }).observe(heading);
      else gsap.set(fw, { opacity: 1, yPercent: 0, filter: 'none', rotation: 0 });
    };
    $$('.features__title, .about-title, .impact__title, .impact__sub, .clients__title, .services__eyebrow, .services__lines h4, .testimonials__title, .compare__title, .work-hero__title, .contact-hero__title, .c-h2, .contact-faq__title').forEach(revealHeading);
  }

  /* ---------- Hero word rotator ----------
     The six partner phrases change as whole lines: the current one lifts away and fades with a soft blur, the next one rises in
     the same way. Falls back to the CSS cross-fade without GSAP, and stays static with reduced motion. */
  const rotator = $('[data-rotator]');
  if (rotator && !reduceMotion) {
    const words = $$('.hero__word', rotator);
    if (window.gsap) {
      rotator.classList.add('is-gsap-rot');
      let cur = 0;
      words.forEach((w, i) => { w.classList.toggle('is-active', i === 0); });
      gsap.set(words.slice(1), { opacity: 0 });
      const introOn = document.documentElement.classList.contains('intro-on');
      const intro = gsap.from(words[0], { y: 40, opacity: 0, filter: 'blur(8px)', duration: 1, ease: 'power3.out', delay: introOn ? 0.15 : 0.5, paused: introOn });
      if (introOn) document.addEventListener('positiv:intro-done', () => intro.play(), { once: true });   // start when the intro curtain has lifted
      const change = () => {
        const next = (cur + 1) % words.length;
        gsap.timeline({ onComplete: () => { cur = next; schedule(); } })
          .to(words[cur], { y: -36, opacity: 0, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' })
          .add(() => { words[cur].classList.remove('is-active'); words[next].classList.add('is-active'); })
          .fromTo(words[next], { y: 36, opacity: 0, filter: 'blur(6px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out' });
      };
      const schedule = () => { gsap.delayedCall(2.4, () => { if (document.hidden) { schedule(); return; } change(); }); };
      intro.eventCallback('onComplete', schedule);
    } else {
      let i = 0;
      setInterval(() => {
        words[i].classList.remove('is-active');
        i = (i + 1) % words.length;
        words[i].classList.add('is-active');
      }, 2600);
    }
  }

  /* ---------- Header: Webflow-style dropdowns (hover on desktop, click on touch) + mobile menu ----------
     The markup/classes are the staging build's; this reproduces what Webflow's runtime does: add w--open to the
     dropdown toggle and its list, rotate the chevron (CSS), and open the collapsed menu at ≤991px. */
  const dropdowns = $$('.w-dropdown');
  const navButton = $('.w-nav-button');
  const navMenu = $('.w-nav-menu');
  const isDesktop = () => matchMedia('(min-width: 992px)').matches;
  const setOpen = (dd, open) => {
    const toggle = $('.w-dropdown-toggle', dd), list = $('.w-dropdown-list', dd);
    if (!list) return;
    toggle.classList.toggle('w--open', open); list.classList.toggle('w--open', open);
    toggle.setAttribute('aria-expanded', String(open));
    dd.style.zIndex = open ? '901' : '';
    $('#site-header')?.classList.toggle('is-pricing-open', !!$('.pricingtest .w-dropdown-list.w--open'));   // Pricing has its own blur layer
  };
  const closeAll = (except) => dropdowns.forEach((d) => { if (d !== except) setOpen(d, false); });
  let leaveTimer = 0;
  dropdowns.forEach((dd) => {
    const toggle = $('.w-dropdown-toggle', dd);
    if (!$('.w-dropdown-list', dd)) {                             // "Results" is a plain link: it opens the Work page
      toggle.setAttribute('role', 'link'); toggle.setAttribute('tabindex', '0'); toggle.style.cursor = 'pointer';
      const go = () => { location.href = 'work2.html'; };
      toggle.addEventListener('click', go);
      toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      return;
    }
    toggle.setAttribute('role', 'button'); toggle.setAttribute('tabindex', '0'); toggle.setAttribute('aria-haspopup', 'true');
    dd.addEventListener('mouseenter', () => { if (!isDesktop()) return; clearTimeout(leaveTimer); closeAll(dd); setOpen(dd, true); });
    dd.addEventListener('mouseleave', () => { if (!isDesktop()) return; leaveTimer = setTimeout(() => setOpen(dd, false), 150); });
    const goPricing = dd.classList.contains('pricingtest');         // desktop: clicking "Pricing" opens the Pricing page (hover still shows the menu); touch: tap toggles the menu
    toggle.addEventListener('click', (e) => { e.preventDefault(); if (goPricing && isDesktop()) { location.href = 'pricing.html'; return; } const open = !toggle.classList.contains('w--open'); closeAll(dd); setOpen(dd, open); });
    toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); } });
  });
  if (navMenu && !$('.mobile-menu-cta', navMenu)) {                // the bar's "Get in touch" is hidden on small screens, so a copy sits at the end of the sheet
    const cta = document.createElement('a'); cta.className = 'mobile-menu-cta'; cta.href = '#contact'; cta.textContent = 'Get in touch'; navMenu.appendChild(cta);
  }
  const setMenu = (open) => {
    if (!navButton || !navMenu) return;
    navButton.classList.toggle('w--open', open);
    navMenu.classList.toggle('w--nav-menu-open', open);
    navMenu.style.display = open ? 'block' : '';
    $('#site-header')?.classList.toggle('is-menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) { const nb = $('.wbs-navbar-center-2'); if (nb) document.documentElement.style.setProperty('--hdr-h', Math.round(nb.getBoundingClientRect().bottom) + 'px'); }
    else closeAll();
  };
  navButton?.addEventListener('click', () => setMenu(!navButton.classList.contains('w--open')));
  navMenu?.addEventListener('click', (e) => { const a = e.target.closest('a[href]'); if (a && !isDesktop() && a.getAttribute('href') !== '#') setMenu(false); });
  window.addEventListener('resize', () => { if (isDesktop()) setMenu(false); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.w-nav')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); closeModal(); } });

  /* ---------- Header: solid background once scrolled ---------- */
  const header = $('#site-header');
  if (header) {
    const onHeaderScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* ---------- Stats: light count-up (GSAP) ----------
     Short and quiet: each stat fades up, its number counts from 0 with a soft ease-out (~1.1s, tabular digits so the
     width never jumps) and the divider line draws in. Replays when the stat re-enters the viewport. */
  const stats = $$('[data-stat]');
  if (stats.length && window.gsap && !reduceMotion) {
    stats.forEach((stat) => {
      const numEl = $('[data-count]', stat), unit = $('.stat__unit', stat), rule = $('.stat__rule', stat), text = $('.stat__text', stat);
      const end = +numEl.dataset.count, value = { v: 0 };
      numEl.style.fontVariantNumeric = 'tabular-nums';
      const parts = [text, numEl, unit].filter(Boolean);
      const hide = () => { numEl.textContent = '0'; gsap.set(parts, { opacity: 0, y: 12 }); gsap.set(rule, { scaleX: 0, transformOrigin: 'left' }); };
      hide();
      let shown = false, tl = null;
      const play = () => {
        shown = true; tl?.kill(); value.v = 0;
        tl = gsap.timeline();
        tl.to(parts, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.06 }, 0)
          .to(value, { v: end, duration: 1.1, ease: 'power2.out', onUpdate: () => { numEl.textContent = Math.round(value.v); } }, 0)
          .to(rule, { scaleX: 1, duration: 0.9, ease: 'power2.out' }, 0.1);
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((ens) => {
          const en = ens[ens.length - 1];
          if (en.isIntersecting && en.intersectionRatio >= 0.5 && !shown) play();
          else if (!en.isIntersecting && shown) { shown = false; tl?.kill(); hide(); }
        }, { threshold: [0, 0.5] }).observe(stat);
      } else { numEl.textContent = end; }
    });
  }

  /* ---------- Portfolio rail ----------
     Desktop (≥992px): the section is made tall, the inner block is sticky, and vertical scroll slides the track sideways.
     Mouse-drag and horizontal wheel/trackpad move the *page scroll*, so scroll stays the single source of truth.
     Tablet/mobile: native horizontal scroll with the progress bar following it. */
  const work = $('[data-portfolio]');
  if (work) {
    const pin = $('[data-portfolio-pin]', work);
    const viewport = $('[data-portfolio-viewport]', work);
    const track = $('[data-portfolio-track]', work);
    const fill = $('[data-portfolio-progress]', work);
    const mq = matchMedia('(min-width: 992px)');
    // range = sideways travel driven by the page scroll (pinned until the 4th card is in view); full = the whole rail.
    // Cards beyond the scroll-driven part (5 and 6) are reached only by dragging / swiping, which adds `extra`.
    let range = 0, full = 0, target = 0, current = 0, extra = 0, extraCur = 0, raf = 0;
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const setFill = (p) => { fill.style.transform = `scaleX(${0.07 + p * 0.93})`; };
    const extraLimits = () => [-target * range, Math.max(full - target * range, 0)];
    const setExtra = (v) => { const [lo, hi] = extraLimits(); extra = Math.min(Math.max(v, lo), hi); if (!raf) raf = requestAnimationFrame(render); };

    const render = () => {
      raf = 0;
      const k = reduceMotion ? 1 : 0.12;                              // light easing; swap for gsap.quickTo later
      current += (target - current) * k;
      extraCur += (extra - extraCur) * k;
      if (Math.abs(target - current) < 0.0005) current = target;
      if (Math.abs(extra - extraCur) < 0.5) extraCur = extra;
      const total = Math.min(Math.max(current * range + extraCur, 0), full || 1);
      track.style.transform = `translate3d(${-total}px,0,0)`;
      setFill(full ? total / full : 0);
      if (current !== target || extraCur !== extra) raf = requestAnimationFrame(render);
    };
    const measure = () => {
      const pinned = mq.matches;
      work.classList.toggle('is-pinned', pinned);
      if (!pinned) { work.style.height = ''; track.style.transform = ''; extra = extraCur = 0; onNativeScroll(); return; }
      full = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      const cardsP = $$('.portfolio-card', track), pitch = cardsP[1] ? cardsP[1].offsetLeft - cardsP[0].offsetLeft : cardsP[0].offsetWidth;
      range = Math.min(full, Math.max(4 * pitch - viewport.clientWidth, 0));
      work.style.height = `${pin.offsetHeight + range}px`;
      onScroll();
    };
    const onScroll = () => {
      if (!mq.matches) return;
      target = clamp(-work.getBoundingClientRect().top / (range || 1));
      setExtra(extra);
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onNativeScroll = () => {
      if (mq.matches) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      setFill(max > 0 ? viewport.scrollLeft / max : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    viewport.addEventListener('scroll', onNativeScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    mq.addEventListener?.('change', measure);

    // Drag with the mouse → slides the rail itself (this is the only way to reach the last cards)
    let drag = null;
    viewport.addEventListener('pointerdown', (e) => {
      if (!mq.matches || e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, e0: extra };
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => { if (drag) setExtra(drag.e0 - (e.clientX - drag.x)); });
    const endDrag = () => { drag = null; viewport.classList.remove('is-dragging'); };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    // Horizontal wheel / trackpad swipe does the same
    viewport.addEventListener('wheel', (e) => {
      if (mq.matches && Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); setExtra(extra + e.deltaX); }
    }, { passive: false });

    measure();
  }

  /* ---------- Feature cards: stacked sticky cards, driven by normal scrolling ----------
     Sized from the window: each card sticks a little lower than the one before (PEEK) under the fixed header and fills
     the space left below it (capped at MAX_H), so the whole card — button included — is always on screen.
     As the next card slides up, the cards behind shrink and darken slightly (eased, not linear), each picture settles
     from a small zoom as its card arrives, and the copy staggers in once the card lands. Desktop only; below 992px the
     cards are a plain stacked list. */
  const cards = $$('.feature-card');
  const fWrap = $('.features__wrap');
  const fSection = $('#features');
  const desktop = matchMedia('(min-width: 992px)');
  if (cards.length && fWrap && fSection) {
    const SHRINK = 0.05, DIM = 0.14, SETTLE = 0.08, PEEK = 14, MAX_H = 750, MIN_H = 420;
    const fx = !reduceMotion;
    const header = $('#site-header');
    const medias = cards.map((c) => $('.feature-card__media', c));
    const inn = cards.map(() => false);
    const geo = { tops: [], H: MAX_H, G: 77 };
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const smooth = (t) => t * t * (3 - 2 * t);
    let ticking = false, scT = 0;

    const layout = () => {
      if (!desktop.matches) {
        cards.forEach((c, i) => {
          c.style.top = c.style.height = c.style.transform = '';
          c.style.removeProperty('--dim'); medias[i]?.style.removeProperty('--settle');
        });
        fWrap.style.gap = '';
        fSection.classList.remove('fx-on', 'is-compact');
        return;
      }
      const vh = window.innerHeight, navH = header ? header.offsetHeight : 85;
      const top0 = Math.round(navH + clamp(vh * 0.03, 16, 33));
      geo.tops = cards.map((_, i) => top0 + i * PEEK);
      geo.H = Math.round(clamp(vh - geo.tops[geo.tops.length - 1] - 20, MIN_H, MAX_H));
      geo.G = Math.round(clamp(vh * 0.08, 32, 77));
      fWrap.style.gap = `${geo.G}px`;
      cards.forEach((c, i) => { c.style.top = `${geo.tops[i]}px`; c.style.height = `${geo.H}px`; });
      fSection.classList.toggle('is-compact', geo.H < 640);
      fSection.classList.toggle('fx-on', fx);
    };

    const update = () => {
      ticking = false;
      if (!desktop.matches || !fx) return;
      const y = window.scrollY, vh = window.innerHeight;
      const wrapTop = fWrap.getBoundingClientRect().top + y;      // the wrap itself is not sticky: this is the cards' natural start
      // 0→1 as each card travels into its sticky line (card 1 over 60% of the screen, the others over one card + gap)
      const raw = cards.map((_, i) => {
        const d = wrapTop + i * (geo.H + geo.G) - y - geo.tops[i];
        return clamp(1 - d / (i === 0 ? vh * 0.6 : geo.H + geo.G), 0, 1);
      });
      const eased = raw.map(smooth);
      cards.forEach((c, i) => {
        let covered = 0;
        for (let j = i + 1; j < cards.length; j++) covered += eased[j];
        c.style.transform = covered > 0.0005 ? `scale(${(1 - SHRINK * covered).toFixed(4)})` : '';
        c.style.setProperty('--dim', Math.min(DIM * covered, 0.5).toFixed(3));
        medias[i]?.style.setProperty('--settle', (1 + SETTLE * (1 - eased[i])).toFixed(4));
        const now = inn[i] ? raw[i] > 0.15 : raw[i] > 0.55;         // a little hysteresis so the copy doesn't flicker at the edge
        if (now !== inn[i]) { inn[i] = now; c.classList.toggle('is-in', now); }
      });
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
      // while the page moves: hover effects pause and the cards get their own layer; both drop once it settles (crisp text)
      fSection.classList.add('is-scrolling');
      clearTimeout(scT);
      scT = setTimeout(() => fSection.classList.remove('is-scrolling'), 160);
    };
    const relayout = () => { layout(); update(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', relayout);
    window.addEventListener('load', relayout);
    desktop.addEventListener?.('change', relayout);
    relayout();
  }

  /* ---------- Services video ----------
     Timings measured from the live site at 1920×1000 (all in vh/vw so they scale):
       · the video enters at 80vw×70vh, grows to 96vw×84vh over ≈1.15vh of scroll, then holds ≈1.35vh;
       · it starts shrinking when the headline pill is still .35vh *below* the fold (text not yet visible),
         shrinks linearly while the pill rises to .596vh, and lands on it (final size ≈ .104vw wide);
       · from then on the video just rides with the pill as the page scrolls on.
     The sticky pin holds only the video; the headline is plain flow content, so headline→cards stays 70px. */
  const stage = $('[data-video-stage]');
  const vFrame = $('[data-video-frame]');
  const vSlot = $('[data-video-slot]');
  const vPin = $('[data-video-pin]');
  const vHead = $('[data-video-headline]');
  if (stage && vFrame && vSlot && vPin && vHead) {
    const mqV = matchMedia('(min-width: 992px)');
    const GAP = 70;                                          // headline → cards
    const T_START = 1.35, T_END = 0.95;                      // pill top (× vh) where the shrink starts / finishes (the heading is still below the fold)
    const SEP_A = 0.62, SEP_B = 0.24, HOVER = 140;           // pill top (× vh) where the words start / finish separating; the small video hovers HOVER px above the glued heading, then drops into the gap
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    const ease = (t) => t * t * (3 - 2 * t);
    let S0 = 0, off = 0;
    const vWords = $$('.services__lines h4', vHead);
    const measureV = () => {
      if (!mqV.matches) { vWords.forEach((h) => { h.style.transform = ''; }); vFrame.removeAttribute('style'); stage.style.paddingBottom = stage.style.marginBottom = ''; return; }
      const vh = window.innerHeight;
      stage.style.paddingBottom = stage.style.marginBottom = '';
      off = vHead.getBoundingClientRect().bottom - vSlot.getBoundingClientRect().top;   // pill top → headline bottom
      // keep the pin engaged until the video has landed (pill at T_END), then pull the cards up to sit GAP under the headline
      const pad = Math.max(vh - (SEP_B * vh + off), 0);
      stage.style.paddingBottom = `${pad}px`;
      stage.style.marginBottom = `${GAP - pad}px`;
      S0 = stage.getBoundingClientRect().top + window.scrollY;                           // scroll where the pin engages
      updateV();
    };
    const updateV = () => {
      if (!mqV.matches) return;
      const vw = window.innerWidth, vh = window.innerHeight, y = window.scrollY;
      const s = vSlot.getBoundingClientRect();
      const fw = 0.104 * vw, fh = fw * (840 / 1829);                                    // final (pill) size
      const pinTop = vPin.getBoundingClientRect().top;
      const a = clamp01((y - (S0 - 0.87 * vh)) / (1.31 * vh));                          // grow: starts as the video enters (≈.87vh below the pin line), done 1.31vh later
      const ae = ease(a);                                                               // slow start / slow end, as measured
      const navH = ($('.w-nav')?.offsetHeight || 85), clearance = 28;                        // keep the pinned video clear of the fixed header
      const w = lerp(0.80 * vw, 0.96 * vw, ae), h = Math.min(lerp(0.70 * vh, 0.84 * vh, ae), vh - navH - clearance - 24);
      // before the pin engages the video travels with the page, easing toward the vertical centre of the screen;
      // once pinned it stays centred while it grows (so it never spills past the bottom edge)
      const mid = Math.max((vh - h) / 2, navH + clearance);                                   // centred, but never closer than 28px to the navbar
      const enterY = mid * Math.pow(clamp01(1 - pinTop / (0.45 * vh)), 2.5);
      const top = pinTop > 0 ? pinTop + enterY : mid;
      const base = { x: (vw - w) / 2, y: top, w, h };
      // the headline words sit tight together while the video hovers above; then they slide apart and the video drops into the gap
      const u = ease(clamp01((SEP_A * vh - s.top) / ((SEP_A - SEP_B) * vh))), hov = -HOVER * (1 - u);
      if (vWords.length === 2) {
        const shift = (s.width + 12) / 2 * (1 - u);
        vWords[0].style.transform = `translateX(${shift}px)`; vWords[1].style.transform = `translateX(${-shift}px)`;
      }
      const liveEnd = { x: s.left, y: s.top + (s.height - fh) / 2 - 7 + hov, w: fw, h: fh };   // the pill, hovering above the headline until the words open
      // The rising headline pushes the big video up: its bottom edge never goes lower than 24px above the headline, so it can never cover
      // the words. It shrinks from the full stage into the small pill (progress t = how far the headline has climbed), then drops in.
      const t = clamp01((base.y + base.h + 24 - s.top) / (base.y + base.h + 24 - SEP_A * vh));
      let r;
      if (t <= 0) r = { ...base, r: 24 };
      else {
        const bottom = lerp(s.top - 24, liveEnd.y + fh, t);                                  // always ≥ 24px above the headline
        const top = lerp(base.y, liveEnd.y, t);
        r = { x: lerp(base.x, liveEnd.x, t), y: top, w: lerp(base.w, fw, t), h: Math.max(bottom - top, 0), r: lerp(24, 20, t) };
        if (t >= 1) r = { ...liveEnd, r: 20 };
      }
      vFrame.style.cssText = `left:${r.x}px;top:${r.y - pinTop}px;width:${r.w}px;height:${r.h}px;border-radius:${r.r}px`;
    };
    window.addEventListener('scroll', updateV, { passive: true });
    window.addEventListener('resize', measureV);
    window.addEventListener('load', measureV);
    mqV.addEventListener?.('change', measureV);
    measureV();
  }

  /* ---------- Stacked service card: pinned, scroll-scrubbed ----------
     The card pins under the header (sized from the window) while the picture column moves as one strip, exactly as far
     as the page scrolls — the same 1:1 feel as the "Four reasons" cards. Each service gets one picture of travel plus a
     short pause (HOLD) so its copy can be read. The copy rides along with its picture at a slower rate and fades through
     the middle of the move; the title words rise out of their mask and the deliverable pills follow in a small stagger —
     all driven by the scroll position, nothing on a timer, so stopping half-way leaves everything half-way. No scroll
     takeover: the site-wide smooth scrolling is the only smoothing. Desktop only; below 992px the panels are a list. */
  const svc = $('[data-svc]');
  if (svc) {
    const card = $('[data-svc-card]', svc);
    const panels = $$('[data-svc-panel]', svc);
    const tiles = $$('[data-svc-tile]', svc);
    const media = $('[data-svc-media]', svc);
    const header = $('#site-header');
    const mqS = matchMedia('(min-width: 992px)');
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    const ss = (t) => t * t * (3 - 2 * t);
    const wrap4 = (v) => ((((v + 2) % 4) + 4) % 4) - 2;                  // signed distance from the front, looped (the last picture peeks above the first)
    const HOLD = 0.3, TRAVEL = 90;                                         // pause per service (× one picture of travel), copy travel in px; pictures sit 16px apart
    // title words sit in masks so they can rise into place
    panels.forEach((p) => {
      const t = $('.svc-panel__title', p); if (!t || t.dataset.split) return;
      t.dataset.split = '1'; const label = t.textContent; t.setAttribute('aria-label', label); t.textContent = '';
      label.split(' ').forEach((w, i, arr) => {
        const m = document.createElement('span'); m.className = 'svc-mask'; m.setAttribute('aria-hidden', 'true');
        const s = document.createElement('span'); s.className = 'svc-word'; s.textContent = w; m.appendChild(s); t.appendChild(m);
        if (i < arr.length - 1) t.appendChild(document.createTextNode(' '));
      });
    });
    const words = panels.map((p) => $$('.svc-word', p));
    const pills = panels.map((p) => $$('.svc-pill', p));
    tiles.forEach((tile) => tile.insertAdjacentHTML('beforeend', '<span class="svc-tile__dim" aria-hidden="true"></span>'));
    const dims = tiles.map((t) => $('.svc-tile__dim', t));

    const g = { pinStart: 0, pitch: 1, hold: 0, L: 1 };
    let mainTile = 0, ticking = false, scT = 0;
    const clearS = () => {
      [card, svc].forEach((el) => { el.style.top = el.style.height = ''; });
      svc.classList.remove('is-compact');
      panels.forEach((p) => { p.style.opacity = p.style.transform = p.style.pointerEvents = ''; });
      tiles.forEach((t) => { t.style.top = t.style.height = t.style.opacity = t.style.transform = t.style.pointerEvents = ''; });
      words.flat().forEach((w) => { w.style.transform = ''; });
      pills.flat().forEach((q) => { q.style.opacity = q.style.transform = ''; });
    };
    const layoutS = () => {
      if (!mqS.matches) { clearS(); return; }
      const vh = window.innerHeight, navH = header ? header.offsetHeight : 85;
      const cardH = Math.round(Math.min(Math.max(vh - navH - 48, 460), 900));
      const cardTop = Math.round(navH + Math.max(12, (vh - navH - cardH) / 2));
      card.style.top = `${cardTop}px`; card.style.height = `${cardH}px`;
      const mh = media.clientHeight;
      const tileH = Math.round(mh * 0.8), tileTop = Math.round(mh * 0.11);   // the design's slot: picture at 80% of the column, peeks above and below
      tiles.forEach((t) => { t.style.top = `${tileTop}px`; t.style.height = `${tileH}px`; });
      g.pitch = tileH + 16;
      g.hold = Math.round(g.pitch * HOLD);
      g.L = g.pitch + g.hold;
      svc.style.height = `${Math.round(cardH + 3 * g.L + g.hold + 0.2 * g.pitch)}px`;
      g.pinStart = svc.getBoundingClientRect().top + window.scrollY - cardTop;
      svc.classList.toggle('is-compact', cardH < 700);             // short windows: tighter type, icon and number tucked away
    };
    // scroll → position along the strip (0…3): pauses on each service, then moves linearly (1:1) to the next
    const uAt = (y) => {
      const s = y - g.pinStart;
      if (s <= 0) return 0;
      const n = Math.floor(s / g.L);
      return n >= 3 ? 3 : n + clamp01((s - n * g.L - g.hold) / g.pitch);
    };
    const drawS = () => {
      ticking = false;
      if (!mqS.matches) return;
      const u = uAt(window.scrollY);
      tiles.forEach((t, i) => {
        const x = wrap4(i - u), ax = Math.min(Math.abs(x), 1);
        t.style.transform = `translate3d(0,${(x * g.pitch).toFixed(2)}px,0)`;      // full size, so the gap between pictures is always exactly 16px
        t.style.opacity = clamp01(2 - Math.abs(x)).toFixed(3);
        t.style.pointerEvents = Math.abs(x) < 1.4 ? '' : 'none';
        if (dims[i]) dims[i].style.opacity = reduceMotion ? '0' : (0.4 * ax).toFixed(3);
      });
      panels.forEach((p, i) => {
        const d = i - u, ad = Math.abs(d), o = ss(clamp01((0.5 - ad) / 0.3));
        p.style.opacity = o.toFixed(3);
        p.style.transform = reduceMotion ? '' : `translate3d(0,${(d * TRAVEL).toFixed(2)}px,0)`;
        p.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        if (ad > 1 || reduceMotion) return;
        words[i].forEach((w, k) => {
          const wp = ss(clamp01((0.5 - ad - k * 0.06) / 0.28));
          w.style.transform = wp >= 1 ? '' : `translate3d(0,${((1 - wp) * 112).toFixed(1)}%,0) rotate(${((1 - wp) * 4).toFixed(2)}deg)`;
        });
        pills[i].forEach((q, k) => {
          const pp = ss(clamp01((0.46 - ad - k * 0.035) / 0.24));
          q.style.opacity = pp >= 1 ? '' : pp.toFixed(3);
          q.style.transform = pp >= 1 ? '' : `translate3d(0,${((1 - pp) * 10).toFixed(1)}px,0)`;
        });
      });
      mainTile = Math.min(Math.max(Math.round(u), 0), 3);
    };
    const requestS = () => { if (!ticking) { ticking = true; requestAnimationFrame(drawS); } };
    // hover: every tile gets an expand button that opens the image in the lightbox
    tiles.forEach((tile) => {
      tile.insertAdjacentHTML('beforeend', '<button class="svc-tile__expand" type="button" aria-label="Expand image"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>');
      const open = () => {
        const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(tile).backgroundImage);
        if (m && openLightbox) openLightbox(m[1], tile.querySelector('.svc-tile__expand'), panels[tiles.indexOf(tile)], (tile.dataset.extra || '').split(',').filter(Boolean));
      };
      // the picture in front opens the lightbox; a peeking picture (above / below) glides to its own service
      tile.addEventListener('click', () => {
        const i = tiles.indexOf(tile);
        if (i === mainTile || !mqS.matches) { open(); return; }
        window.scrollTo({ top: g.pinStart + i * g.L + g.hold / 2, behavior: 'smooth' });
      });
    });
    window.addEventListener('scroll', () => {
      requestS();
      // while the page moves: hover effects pause and the moving parts get their own layer; both drop once it settles
      svc.classList.add('is-scrolling');
      clearTimeout(scT);
      scT = setTimeout(() => svc.classList.remove('is-scrolling'), 160);
    }, { passive: true });
    const relayoutS = () => { layoutS(); drawS(); };
    window.addEventListener('resize', relayoutS);
    window.addEventListener('load', relayoutS);
    mqS.addEventListener?.('change', relayoutS);
    relayoutS();
  }

  /* ---------- Smooth wheel scrolling (site-wide) ----------
     Each wheel / trackpad step sets a target and the page glides toward it (frame-rate independent ease), so steps never
     jump and nothing is ever locked: the next input simply moves the target. Registered after every other wheel handler,
     so anything that owns its own gesture (the services video, the portfolio rail, the 3D pages) calls preventDefault
     first and is left alone; so are scroll boxes (menus, modals) and pages with scrolling locked. Scrollbar drags,
     touch, keys and anchor jumps take over at once. */
  if (!reduceMotion) {
    const LERP = 0.1;
    let cur = window.scrollY, target = cur, running = false, raf = 0, lastT = 0, lastSet = -1;
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    const stopGlide = () => { cancelAnimationFrame(raf); running = false; cur = target = window.scrollY; };
    const step = (now) => {
      const dt = Math.min(48, now - lastT); lastT = now;
      cur += (target - cur) * (1 - Math.pow(1 - LERP, dt / 16.667));
      if (Math.abs(target - cur) < 0.3) { cur = target; running = false; }
      window.scrollTo({ top: cur, behavior: 'instant' });
      lastSet = window.scrollY;
      if (running) raf = requestAnimationFrame(step);
    };
    const canScrollInside = (el, dy) => {
      for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        if (el.nodeType !== 1) continue;
        const oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
        }
      }
      return false;
    };
    const pageLocked = () => getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden';
    window.addEventListener('wheel', (e) => {
      if (e.defaultPrevented) { if (running) stopGlide(); return; }                   // another part of the page owns this gesture
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || pageLocked() || canScrollInside(e.target, e.deltaY)) return;
      e.preventDefault();
      if (!running) cur = target = window.scrollY;
      const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
      target = Math.min(Math.max(target + d, 0), maxY());
      if (!running) { running = true; lastT = performance.now(); raf = requestAnimationFrame(step); }
    }, { passive: false });
    window.addEventListener('scroll', () => {
      if (running && Math.abs(window.scrollY - lastSet) > 2) stopGlide();             // scrollbar, keys or an anchor jump took over
      else if (!running) cur = target = window.scrollY;
    }, { passive: true });
    ['pointerdown', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, () => { if (running) stopGlide(); }, { passive: true }));
  }

  /* ---------- Video cursor + modal ---------- */
  const frame = $('[data-video-frame]');
  const ball = $('#video-cursor');
  const modal = $('#video-modal');
  const modalBox = $('#video-modal-container');

  /* Custom player (brand-styled controls instead of the browser's): play/pause, seek bar, time, mute, fullscreen,
     auto-hiding UI, keyboard (Space, ←/→ ±5s, M, F, Esc). */
  const ICONS = {
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6.2" y="5" width="4.2" height="14" rx="1.3"/><rect x="13.6" y="5" width="4.2" height="14" rx="1.3"/></svg>',
    vol: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    fs: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
  };
  const fmtTime = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
  let playerCleanup = null;

  function buildPlayer(src) {
    modalBox.innerHTML = `
      <div class="vplayer is-paused" tabindex="-1">
        <video src="${src}" playsinline preload="auto"></video>
        <button class="vplayer__center" type="button" aria-label="Play">${ICONS.play}</button>
        <div class="vplayer__bar">
          <button class="vplayer__btn vplayer__btn--main" type="button" data-act="toggle" aria-label="Play">${ICONS.play}</button>
          <span class="vplayer__time" data-time>0:00</span>
          <div class="vplayer__track" data-track role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
            <span class="vplayer__buffer" data-buffer></span><span class="vplayer__fill" data-fill></span><span class="vplayer__thumb" data-thumb></span>
          </div>
          <span class="vplayer__dur" data-dur>0:00</span>
          <button class="vplayer__btn" type="button" data-act="mute" aria-label="Mute">${ICONS.vol}</button>
          <button class="vplayer__btn" type="button" data-act="fs" aria-label="Fullscreen">${ICONS.fs}</button>
        </div>
      </div>`;
    const root = $('.vplayer', modalBox), video = $('video', root);
    const toggleBtn = $('[data-act="toggle"]', root), muteBtn = $('[data-act="mute"]', root), centerBtn = $('.vplayer__center', root);
    const track = $('[data-track]', root), fill = $('[data-fill]', root), thumb = $('[data-thumb]', root), buffer = $('[data-buffer]', root);
    const timeEl = $('[data-time]', root), durEl = $('[data-dur]', root);
    let idleTimer = 0;

    const setProgress = () => {
      const p = video.duration ? video.currentTime / video.duration : 0;
      fill.style.width = thumb.style.left = `${p * 100}%`;
      timeEl.textContent = fmtTime(video.currentTime);
      track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    };
    const wake = () => {
      root.classList.remove('is-idle');
      clearTimeout(idleTimer);
      if (!video.paused) idleTimer = setTimeout(() => root.classList.add('is-idle'), 2400);
    };
    const toggle = () => { if (video.paused) video.play().catch(() => {}); else video.pause(); };
    const seekBy = (d) => { video.currentTime = Math.min(Math.max(video.currentTime + d, 0), video.duration || 0); wake(); };
    const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen?.(); };
    const toggleMute = () => { video.muted = !video.muted; muteBtn.innerHTML = video.muted ? ICONS.mute : ICONS.vol; muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute'); };

    video.addEventListener('play', () => { root.classList.remove('is-paused'); toggleBtn.innerHTML = ICONS.pause; toggleBtn.setAttribute('aria-label', 'Pause'); wake(); });
    video.addEventListener('pause', () => { root.classList.add('is-paused'); toggleBtn.innerHTML = ICONS.play; toggleBtn.setAttribute('aria-label', 'Play'); wake(); });
    video.addEventListener('timeupdate', setProgress);
    video.addEventListener('loadedmetadata', () => { durEl.textContent = fmtTime(video.duration); setProgress(); });
    video.addEventListener('progress', () => { if (video.buffered.length && video.duration) buffer.style.width = `${(video.buffered.end(video.buffered.length - 1) / video.duration) * 100}%`; });
    video.addEventListener('ended', () => { root.classList.remove('is-idle'); });

    toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    centerBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    video.addEventListener('click', toggle);
    muteBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); });
    $('[data-act="fs"]', root).addEventListener('click', (e) => { e.stopPropagation(); toggleFs(); });
    root.addEventListener('pointermove', wake);
    root.addEventListener('pointerleave', () => { if (!video.paused) root.classList.add('is-idle'); });

    // seeking: click or drag on the bar
    let seeking = false;
    const seekTo = (e) => { const r = track.getBoundingClientRect(); const p = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1); if (video.duration) video.currentTime = p * video.duration; setProgress(); };
    track.addEventListener('pointerdown', (e) => { e.stopPropagation(); seeking = true; track.setPointerCapture(e.pointerId); root.classList.add('is-seeking'); seekTo(e); });
    track.addEventListener('pointermove', (e) => { if (seeking) seekTo(e); });
    const endSeek = () => { seeking = false; root.classList.remove('is-seeking'); };
    track.addEventListener('pointerup', endSeek); track.addEventListener('pointercancel', endSeek);
    track.addEventListener('click', (e) => e.stopPropagation());

    const onKey = (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seekBy(5); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seekBy(-5); }
      else if (e.key === 'm' || e.key === 'M') toggleMute();
      else if (e.key === 'f' || e.key === 'F') toggleFs();
    };
    document.addEventListener('keydown', onKey);
    playerCleanup = () => { document.removeEventListener('keydown', onKey); clearTimeout(idleTimer); video.pause(); };
    video.play().catch(() => {});            // started by the user's click, so sound is allowed; if blocked the centre button shows
  }

  function openModal() {
    const src = $('video', frame)?.dataset.videoSrc;
    if (!src) return;
    buildPlayer(src);
    modal.classList.add('is-open');
    ball.classList.remove('is-visible');
    $('#video-modal-close')?.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    playerCleanup?.(); playerCleanup = null;
    modal.classList.remove('is-open');
    setTimeout(() => { if (!modal.classList.contains('is-open')) modalBox.innerHTML = ''; }, 350);   // after the fade-out
    frame?.focus?.({ preventScroll: true });
  }

  if (frame && matchMedia('(hover:hover)').matches) {
    frame.addEventListener('mouseenter', () => ball.classList.add('is-visible'));
    frame.addEventListener('mouseleave', () => ball.classList.remove('is-visible'));
    window.addEventListener('mousemove', (e) => {
      ball.style.transform = `translate(${e.clientX}px, ${e.clientY}px) scale(${ball.classList.contains('is-visible') ? 1 : 0})`;
    });
  }
  frame?.addEventListener('click', openModal);
  $('#video-modal-close')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  /* ---------- Testimonials: logo tabs slide the card rail (also swipe/drag) ----------
     Staging build: cards are 1274px wide with a 16px gap; a tab click translates the rail by index × pitch over ≈1.2s
     (ease-out) while the tab bars cross-fade #ddddd8 → #17171e over .3s. */
  const tRail = $('[data-testimonials]');
  if (tRail) {
    const viewport = $('[data-testi-viewport]');
    const tabs = $$('[data-testi-tab]');
    const cardsT = $$('.testimonial-card', tRail);
    let index = 0, pitch = 0;
    const measureT = () => { pitch = cardsT[1] ? cardsT[1].offsetLeft - cardsT[0].offsetLeft : cardsT[0].offsetWidth; go(index, false); };
    // A copy of the first card sits after the last one: on the last card it peeks in from the side like the others, and the
    // automatic advance slides into it, then jumps back (unseen) to the real first card, so the rail loops.
    [cardsT[0], cardsT[1]].filter(Boolean).forEach((src) => {   // the second copy keeps the rail full while the first copy is in front
      const c = src.cloneNode(true);
      c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', ''); c.removeAttribute('data-card');
      tRail.appendChild(c);
    });
    let wrapTimer = 0;
    const finishWrap = () => {
      if (!wrapTimer) return;
      clearTimeout(wrapTimer); wrapTimer = 0;
      tRail.classList.add('is-dragging'); tRail.style.transform = 'translate3d(0,0,0)'; void tRail.offsetWidth;
    };
    const goWrap = () => {
      index = 0;
      tRail.classList.remove('is-dragging');
      tRail.style.transform = `translate3d(${-cardsT.length * pitch}px,0,0)`;
      tabs.forEach((t, n) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', String(n === 0)); });
      void tRail.offsetWidth;
      tabs[0].classList.add('is-active');
      wrapTimer = setTimeout(finishWrap, 1300);
    };
    const go = (i, animate = true) => {
      clearTimeout(wrapTimer); wrapTimer = 0;
      index = Math.min(Math.max(i, 0), cardsT.length - 1);
      tRail.classList.toggle('is-dragging', !animate);
      tRail.style.transform = `translate3d(${-index * pitch}px,0,0)`;
      tabs.forEach((t, n) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', String(n === index)); });
      void tRail.offsetWidth;                                         // restart the active bar's fill from empty
      tabs[index].classList.add('is-active');
    };
    // The active tab's bar fills up in grey -> black; when it is full the next card slides in by itself (loops back to the first).
    // The fill pauses while the pointer is on the cards / tabs or the section is off screen.
    tabs.forEach((t) => $('.testi-tab__bar', t).addEventListener('animationend', (e) => { if (e.animationName === 'testi-fill') { if (index === cardsT.length - 1) goWrap(); else go(index + 1); } }));
    const secT = tRail.closest('section');
    const setPaused = (on) => secT.classList.toggle('is-paused', on);
    ['mouseenter', 'focusin'].forEach((ev) => { viewport.addEventListener(ev, () => setPaused(true)); $('[data-testi-tabs]').addEventListener(ev, () => setPaused(true)); });
    ['mouseleave', 'focusout'].forEach((ev) => { viewport.addEventListener(ev, () => setPaused(false)); $('[data-testi-tabs]').addEventListener(ev, () => setPaused(false)); });
    if ('IntersectionObserver' in window) new IntersectionObserver((ens) => secT.classList.toggle('is-offscreen', !ens[ens.length - 1].isIntersecting), { threshold: 0.2 }).observe(secT);
    const last = () => cardsT.length - 1;
    tabs.forEach((t, n) => t.addEventListener('click', () => { if (n === 0 && index === last()) goWrap(); else go(n); }));   // last → first always slides forward
    tabs.forEach((t, n) => t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { if (n === last()) goWrap(); else go(n + 1); tabs[index].focus(); }
      if (e.key === 'ArrowLeft') { go(n - 1); tabs[index].focus(); }
    }));
    // drag / swipe: follow the pointer, then snap to the nearest card (flick past 18% of a card or 60px changes card)
    let drag = null;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('a,button')) return;
      finishWrap();
      drag = { x: e.clientX, base: -index * pitch, dx: 0 };
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      viewport.classList.add('is-dragging'); tRail.classList.add('is-dragging');
      tRail.style.transform = `translate3d(${drag.base + drag.dx}px,0,0)`;
    });
    const endT = () => {
      if (!drag) return;
      const dx = drag.dx; drag = null;
      viewport.classList.remove('is-dragging');
      const step = Math.abs(dx) > Math.max(60, pitch * 0.18) ? (dx < 0 ? 1 : -1) : 0;
      if (step === 1 && index === last()) goWrap(); else go(index + step);
    };
    viewport.addEventListener('pointerup', endT);
    viewport.addEventListener('pointercancel', endT);
    window.addEventListener('resize', measureT);
    window.addEventListener('load', measureT);
    measureT();
  }
})();
