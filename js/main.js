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

  /* ---------- Hero image columns: expand buttons (added before the loop clone so copies get them too) ---------- */
  $$('.hero__tile').forEach((t) => {
    t.insertAdjacentHTML('beforeend', '<button class="hero__expand" type="button" aria-label="Expand image"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>');
  });

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
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }).observe(heroMedia);
    }
    raf = requestAnimationFrame(tick);

    // Lightbox
    const lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image preview');
    lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img class="lightbox__img" alt="">';
    document.body.appendChild(lb);
    const lbImg = $('.lightbox__img', lb);
    let opener = null;
    const openLb = (src, from) => { lbImg.src = src; lb.classList.add('is-open'); heroPaused = true; opener = from; $('.lightbox__close', lb).focus(); };
    openLightbox = openLb;
    const closeLb = () => { if (!lb.classList.contains('is-open')) return; lb.classList.remove('is-open'); heroPaused = false; opener?.focus?.({ preventScroll: true }); };
    // Clicking anywhere on an image (not just the expand button) opens it — unless that click ended a drag.
    heroMedia.addEventListener('click', (e) => {
      const tile = e.target.closest('.hero__tile');
      if (!tile) return;
      if (heroState.some((s) => s.moved)) { heroState.forEach((s) => { s.moved = false; }); return; }
      const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(tile).backgroundImage);
      if (m) openLb(m[1], $('.hero__expand', tile));
    });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lightbox__close')) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }

  /* ---------- Hero heading: bouncy letter entrance + the Positiv mark as every "t" ----------
     The text is split into masked words/letters (aria-label keeps it readable). With GSAP: letters spring up with a
     back-ease stagger, each mark pops in with an elastic spin, then idles (rocking + an occasional squash-and-hop) and
     letters bounce when hovered. Without GSAP (or with reduced motion) a plain CSS stagger / static state is used. */
  const eyebrow = $('.hero__eyebrow');
  if (eyebrow && !eyebrow.dataset.split) {
    const text = eyebrow.textContent.trim();
    eyebrow.setAttribute('aria-label', text);
    eyebrow.dataset.split = '1';
    eyebrow.textContent = '';
    let idx = 0;
    text.split(' ').forEach((w, wi, arr) => {
      const word = document.createElement('span');
      word.className = 'hero__mask'; word.setAttribute('aria-hidden', 'true');
      [...w].forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'hero__char'; c.style.setProperty('--i', idx++);
        if (ch.toLowerCase() === 't') {
          c.classList.add('hero__char--t');
          c.innerHTML = `<span class="t-base">${ch}</span><svg class="t-stem" viewBox="61.79 1.9 11.08 22.07" aria-hidden="true"><path fill="#fff" d="M70.7672 20.5501C69.5899 20.3215 68.83 19.4028 68.8304 18.1959L68.8317 13.5938H64.9297L65.0085 18.9944C65.0369 20.9064 66.1129 22.662 67.8574 23.3833C69.4681 24.0496 71.1897 23.9665 72.8638 23.9665C72.8754 22.8889 72.8575 21.6911 72.8613 20.5797C72.0209 20.5839 71.4495 20.6828 70.7672 20.5501Z"/></svg><svg class="t-mark" viewBox="61.79 1.9 11.08 22.07" aria-hidden="true"><path fill="#f0f879" d="M71.8464 5.7464C70.7662 5.85237 69.7507 6.21659 68.8477 6.77229C68.7105 6.85699 68.5587 6.72891 68.6225 6.5808C69.0121 5.67506 69.2623 3.52733 69.3403 2.55276C69.3691 2.19522 69.0734 1.90234 68.7147 1.90234H66.0409C65.7415 1.90234 65.4658 2.11178 65.4266 2.4084C65.2056 4.09013 63.914 6.83362 62.2866 7.10939C61.9892 7.15945 61.7891 7.44649 61.7891 7.74854V10.4053C61.7891 10.7649 62.0848 11.0615 62.443 11.031C63.5549 10.9359 64.5975 10.5997 65.5205 10.0757C65.661 9.99598 65.807 10.1312 65.7373 10.2772C65.2189 11.3636 64.9262 12.5655 64.9266 13.7933H68.8327C68.8327 11.9372 70.2169 9.97888 72.0065 9.66514C72.3051 9.61299 72.5041 9.32346 72.5041 9.02057V6.3722C72.5041 6.01049 72.2063 5.71094 71.8464 5.7464Z"/></svg>`;
        } else c.textContent = ch;
        word.appendChild(c);
      });
      eyebrow.appendChild(word);
      if (wi < arr.length - 1) eyebrow.appendChild(document.createTextNode(' '));
    });

    const chars = $$('.hero__char', eyebrow), marks = $$('.t-mark', eyebrow);
    if (window.gsap && !reduceMotion) {
      eyebrow.classList.add('is-gsap');
      gsap.set(eyebrow, { opacity: 1 });
      gsap.set(marks, { transformOrigin: '50% 80%' });
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(chars, { yPercent: 140, rotation: (i) => (i % 2 ? 10 : -10), transformOrigin: '0% 100%', opacity: 0, duration: 1.15, ease: 'back.out(1.8)', stagger: 0.04 }, 0)
        .from(marks, { scale: 0, opacity: 0, duration: 1.4, ease: 'elastic.out(1, 0.45)', stagger: 0.3 }, 0.5)
        .add(() => {                                                                      // idle hop (squash & stretch, no tilting), started once the entrance is done
          marks.forEach((m, i) => {
            gsap.timeline({ repeat: -1, repeatDelay: 2.2 + i * 1.2, delay: 0.8 + i * 1.4 })
              .to(m, { yPercent: -16, scaleX: 0.94, scaleY: 1.1, duration: 0.26, ease: 'power2.out' })
              .to(m, { yPercent: 0, scaleX: 1.12, scaleY: 0.84, duration: 0.17, ease: 'power2.in' })
              .to(m, { scaleX: 1, scaleY: 1, duration: 1.05, ease: 'elastic.out(1, 0.3)' });
          });
        }, '>-0.2');
      chars.forEach((c) => c.addEventListener('pointerenter', () => {                    // springy hover on every letter
        const lime = c.classList.contains('hero__char--t') ? {} : { color: '#f0f879' };
        gsap.timeline({ overwrite: 'auto' })
          .to(c, { y: '-0.14em', ...lime, duration: 0.2, ease: 'power2.out' })
          .to(c, { y: 0, color: '#ffffff', duration: 1.15, ease: 'elastic.out(1, 0.28)' });
      }));
    } else {                                                                             // CSS-only path
      requestAnimationFrame(() => requestAnimationFrame(() => eyebrow.classList.add('is-in')));
      setTimeout(() => eyebrow.classList.add('is-ready'), 400 + idx * 34 + 1000);
    }
  }

  /* ---------- "We adapt to you…" title: replaying word reveal + repel hover ----------
     Words start dim, lowered and blurred; each time the title enters the viewport they develop in a stagger. On hover the words are
     pushed away from the cursor (magnetic repulsion with a slight turn) and spring back elastically on leave. */
  const ftTitle = $('.features__title');
  if (ftTitle && window.gsap && !reduceMotion) {
    const label = ftTitle.textContent.replace(/\s+/g, ' ').trim();
    ftTitle.setAttribute('aria-label', label);
    const fw = [];
    const splitNode = (node, into, cls) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { into.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'ft-word' + (cls ? ' ' + cls : ''); w.textContent = tok; w.setAttribute('aria-hidden', 'true');
            into.appendChild(w); fw.push(w);
          });
        } else if (n.nodeType === 1) {
          const wrap = document.createElement(n.tagName.toLowerCase());
          wrap.className = n.className; wrap.setAttribute('aria-hidden', 'true');
          splitNode(n, wrap, n.className); into.appendChild(wrap);
        }
      });
    };
    const holder = document.createDocumentFragment();
    splitNode(ftTitle, holder);
    ftTitle.textContent = ''; ftTitle.appendChild(holder);
    ftTitle.classList.add('is-split');
    gsap.set(fw, { opacity: 0.12, yPercent: 60, filter: 'blur(8px)', rotation: 3 });

    // Plays every time the title enters the viewport (≥35% visible) and resets once it has fully left, so scrolling
    // away and back replays it. Words develop in a stagger: lift, un-blur and fade in, with a soft overshoot.
    let shown = false, revealTween = null;
    const playIn = () => {
      shown = true; revealTween?.kill();
      revealTween = gsap.fromTo(fw, { opacity: 0.12, yPercent: 60, filter: 'blur(8px)', rotation: 3 },
        { opacity: 1, yPercent: 0, filter: 'blur(0px)', rotation: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.09, overwrite: 'auto' });
    };
    const resetOut = () => {
      shown = false; revealTween?.kill();
      gsap.set(fw, { opacity: 0.12, yPercent: 60, filter: 'blur(8px)', rotation: 3, x: 0, y: 0 });
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && en.intersectionRatio >= 0.35 && !shown) playIn();
        else if (!en.isIntersecting && shown) resetOut();                                // fully out of view → arm it again
      }, { threshold: [0, 0.35] }).observe(ftTitle);
    } else gsap.set(fw, { opacity: 1, yPercent: 0, filter: 'none' });

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const R = 190;
      ftTitle.addEventListener('pointermove', (e) => {
        fw.forEach((w) => {
          const b = w.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          const dx = cx - e.clientX, dy = cy - e.clientY, d = Math.hypot(dx, dy) || 1, k = Math.max(0, 1 - d / R);
          gsap.to(w, { x: (dx / d) * k * 26, y: (dy / d) * k * 16, rotation: (dx / d) * k * 5, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
        });
      });
      ftTitle.addEventListener('pointerleave', () => {
        gsap.to(fw, { x: 0, y: 0, rotation: 0, duration: 1.3, ease: 'elastic.out(1, 0.32)', stagger: { each: 0.015, from: 'center' }, overwrite: 'auto' });
      });
    }
  }

  /* ---------- "Our creative impact…" title: decode / scramble reveal + re-scramble hover ----------
     A new motion for this heading (not used elsewhere): every letter first cycles through random glyphs in lime and then
     locks onto its real character, left to right, word after word. Replays each time the title enters the viewport.
     Hovering a word scrambles it again and lights it up. Each letter's width is pinned so the line never jitters. */
  const impHead = $('.impact__head');
  if (impHead && window.gsap && !reduceMotion) {
    const targets = [$('.impact__title', impHead), ...$$('.impact__sub > span:not(.glyph), .impact__sub .glyph > span', impHead)].filter(Boolean);
    const words = [];
    const CH = 'abcdefghijklmnopqrstuvwxyz';
    targets.forEach((el) => {
      if (el.getAttribute('aria-hidden') === 'true') return;
      const text = el.textContent;
      if (!text.trim()) return;
      el.setAttribute('aria-label', text.trim());
      el.textContent = '';
      text.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'sc-word'; w.setAttribute('aria-hidden', 'true');
        const chars = [...tok].map((ch) => { const c = document.createElement('span'); c.className = 'sc-char'; c.textContent = ch; w.appendChild(c); return { el: c, ch }; });
        el.appendChild(w);
        words.push({ el: w, chars, tween: null });
      });
    });
    // the decorative "t" glyph (aria-hidden) is split too so the whole heading decodes together
    $$('.impact__sub .glyph > span[aria-hidden="true"]', impHead).forEach((el) => {
      const text = el.textContent; el.textContent = '';
      const w = document.createElement('span'); w.className = 'sc-word'; w.setAttribute('aria-hidden', 'true');
      const chars = [...text].map((ch) => { const c = document.createElement('span'); c.className = 'sc-char'; c.textContent = ch; w.appendChild(c); return { el: c, ch }; });
      el.appendChild(w); words.push({ el: w, chars, tween: null });
    });

    // pin every letter to its real width (measured with the real character, whatever it currently shows)
    const pin = () => words.forEach((wd) => wd.chars.forEach((c) => {
      const keep = c.el.textContent; c.el.style.width = ''; c.el.textContent = c.ch;
      c.el.style.width = `${c.el.getBoundingClientRect().width}px`; c.el.textContent = keep;
    }));
    (document.fonts?.ready || Promise.resolve()).then(pin);
    window.addEventListener('resize', pin);

    const scramble = (wd, dur, delay = 0) => {
      wd.tween?.kill();
      const n = wd.chars.length, state = { p: 0 };
      wd.el.classList.add('is-scrambling');
      wd.tween = gsap.to(state, {
        p: 1, duration: dur, delay, ease: 'none',
        onUpdate: () => {
          wd.chars.forEach((c, i) => {
            const settle = (i + 1) / n * 0.78 + 0.1;                                     // letters lock left → right
            const done = state.p >= settle;
            c.el.textContent = done || !/[a-z]/i.test(c.ch) ? c.ch : (c.ch === c.ch.toUpperCase() ? CH[(Math.random() * 26) | 0].toUpperCase() : CH[(Math.random() * 26) | 0]);
            c.el.classList.toggle('is-lock', done);
          });
        },
        onComplete: () => { wd.chars.forEach((c) => { c.el.textContent = c.ch; c.el.classList.add('is-lock'); }); wd.el.classList.remove('is-scrambling'); }
      });
    };
    const hide = () => { words.forEach((wd) => { wd.tween?.kill(); wd.el.classList.remove('is-scrambling'); wd.chars.forEach((c) => { c.el.textContent = ' '; c.el.classList.remove('is-lock'); }); wd.el.style.opacity = 0; }); };
    const play = () => { let d = 0; words.forEach((wd) => { wd.el.style.opacity = 1; scramble(wd, 0.55 + wd.chars.length * 0.07, d); d += 0.16; }); };
    pin(); hide();
    let shownI = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && en.intersectionRatio >= 0.5 && !shownI) { shownI = true; play(); }
        else if (!en.isIntersecting && shownI) { shownI = false; hide(); }
      }, { threshold: [0, 0.5] }).observe(impHead);
    } else play();

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      words.forEach((wd) => {
        wd.el.addEventListener('pointerenter', () => { if (!shownI) return; wd.el.classList.add('is-hot'); scramble(wd, 0.45 + wd.chars.length * 0.05); });
        wd.el.addEventListener('pointerleave', () => wd.el.classList.remove('is-hot'));
      });
    }
  }

  /* ---------- "We bring you innovative solutions…" headline: 3D card-flip reveal + tilt hover ----------
     New motion: every word is a little card that flips down into place (rotateX from -95° with perspective) in a
     stagger with an elastic settle, line after line; it replays whenever the headline re-enters the viewport. On hover
     the words turn in 3D toward the cursor (rotateX/rotateY + a lift toward you) and spring back on leave.
     The video's landing slot is left untouched. */
  const svcHead = $('.services__headline');
  if (svcHead && window.gsap && !reduceMotion) {
    const eyebrow2 = $('.services__eyebrow', svcHead), lines = $('.services__lines', svcHead);
    const fw = [];
    $$('h4', lines).forEach((h) => {
      const text = h.textContent.trim();
      h.setAttribute('aria-label', text); h.textContent = '';
      text.split(/\s+/).forEach((tok, i, arr) => {
        const w = document.createElement('span'); w.className = 'sw-word'; w.textContent = tok; w.setAttribute('aria-hidden', 'true');
        h.appendChild(w); fw.push(w);
        if (i < arr.length - 1) h.appendChild(document.createTextNode(' '));
      });
    });
    const parts = [eyebrow2, ...fw].filter(Boolean);
    gsap.set(fw, { transformPerspective: 800, transformOrigin: '50% 0%' });
    const hideS = () => gsap.set(parts, { opacity: 0, rotationX: -95, y: 18 });
    hideS();
    let shownS = false, tlS = null;
    const playS = () => {
      shownS = true; tlS?.kill();
      tlS = gsap.timeline();
      if (eyebrow2) tlS.fromTo(eyebrow2, { opacity: 0, y: 14, rotationX: 0 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0);
      tlS.to(fw, { opacity: 1, rotationX: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.55)', stagger: 0.075 }, 0.1);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && en.intersectionRatio >= 0.5 && !shownS) playS();
        else if (!en.isIntersecting && shownS) { shownS = false; tlS?.kill(); hideS(); }
      }, { threshold: [0, 0.5] }).observe(svcHead);
    } else gsap.set(parts, { opacity: 1, rotationX: 0, y: 0 });

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const R = 360;
      lines.addEventListener('pointermove', (e) => {
        if (!shownS) return;
        fw.forEach((w) => {
          const b = w.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / R)), ny = Math.max(-1, Math.min(1, (e.clientY - cy) / R));
          const near = Math.max(0, 1 - Math.hypot(e.clientX - cx, e.clientY - cy) / R);
          gsap.to(w, { rotationY: nx * 26, rotationX: -ny * 20, z: near * 46, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        });
      });
      lines.addEventListener('pointerleave', () => {
        gsap.to(fw, { rotationY: 0, rotationX: 0, z: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)', stagger: { each: 0.012, from: 'center' }, overwrite: 'auto' });
      });
    }
  }

  /* ---------- Hero word rotator ----------
     GSAP version: each word is split into masked letters. The current word's letters shear up and out (power3.in,
     staggered), then the next word's letters spring up from below with a back-ease and a slight rotation, while a
     soft blur clears. On hover the letters near the cursor lift and light up. Falls back to the CSS cross-fade
     without GSAP, and stays static with reduced motion. */
  const rotator = $('[data-rotator]');
  if (rotator && !reduceMotion) {
    const words = $$('.hero__word', rotator);
    if (window.gsap) {
      rotator.classList.add('is-gsap-rot');
      const split = words.map((w) => {
        const label = w.textContent.trim();
        w.setAttribute('aria-label', label); w.textContent = '';
        const chars = [];
        label.split(' ').forEach((part, pi, arr) => {
          const mask = document.createElement('span'); mask.className = 'rot-mask'; mask.setAttribute('aria-hidden', 'true');
          [...part].forEach((ch) => { const c = document.createElement('span'); c.className = 'rot-char'; c.textContent = ch; mask.appendChild(c); chars.push(c); });
          w.appendChild(mask);
          if (pi < arr.length - 1) w.appendChild(document.createTextNode(' '));
        });
        return chars;
      });
      let cur = 0;
      words.forEach((w, i) => { w.classList.toggle('is-active', i === 0); });
      gsap.set(split.flatMap((c, i) => (i === 0 ? [] : c)), { yPercent: 125 });
      const intro = gsap.from(split[0], { yPercent: 125, rotation: 7, transformOrigin: '0% 100%', duration: 1.1, ease: 'back.out(1.7)', stagger: 0.035, delay: 0.9 });
      const change = () => {
        const next = (cur + 1) % words.length, outChars = split[cur], inChars = split[next];
        const tl = gsap.timeline({ onComplete: () => { cur = next; schedule(); } });
        tl.to(outChars, { yPercent: -125, rotation: -7, transformOrigin: '0% 100%', duration: 0.55, ease: 'power3.in', stagger: { each: 0.02 } }, 0)
          .add(() => {
            words[cur].classList.remove('is-active'); words[next].classList.add('is-active');
          }, 0.5)
          .fromTo(inChars, { yPercent: 125, rotation: 7, filter: 'blur(6px)' }, { yPercent: 0, rotation: 0, filter: 'blur(0px)', transformOrigin: '0% 100%', duration: 1, ease: 'back.out(1.7)', stagger: { each: 0.035 } }, 0.52);
      };
      // Hover: letters near the cursor lift, scale and turn white (falloff by distance); leaving springs them back (elastic)
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const R = 130;
        rotator.addEventListener('pointermove', (e) => {
          split[cur].forEach((c) => {
            const r = c.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
            const k = Math.max(0, 1 - d / R);                                               // 1 under the cursor → 0 at R px away
            gsap.to(c, { y: -k * 18, scale: 1 + k * 0.22, color: k > 0.12 ? '#ffffff' : '#f0f879', duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
          });
        });
        rotator.addEventListener('pointerleave', () => {
          gsap.to(split[cur], { y: 0, scale: 1, color: '#f0f879', duration: 1.1, ease: 'elastic.out(1, 0.35)', stagger: { each: 0.012, from: 'center' }, overwrite: 'auto' });
        });
      }
      let timer = null;
      const schedule = () => { timer = gsap.delayedCall(2.4, () => { if (document.hidden) { schedule(); return; } change(); }); };
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
    if (!$('.w-dropdown-list', dd)) return;                       // "Results" is a plain link
    toggle.setAttribute('role', 'button'); toggle.setAttribute('tabindex', '0'); toggle.setAttribute('aria-haspopup', 'true');
    dd.addEventListener('mouseenter', () => { if (!isDesktop()) return; clearTimeout(leaveTimer); closeAll(dd); setOpen(dd, true); });
    dd.addEventListener('mouseleave', () => { if (!isDesktop()) return; leaveTimer = setTimeout(() => setOpen(dd, false), 150); });
    toggle.addEventListener('click', (e) => { e.preventDefault(); const open = !toggle.classList.contains('w--open'); closeAll(dd); setOpen(dd, open); });
    toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); } });
  });
  navButton?.addEventListener('click', () => {
    const open = !navButton.classList.contains('w--open');
    navButton.classList.toggle('w--open', open);
    navMenu.classList.toggle('w--nav-menu-open', open);
    navMenu.style.display = open ? 'block' : '';
  });
  window.addEventListener('resize', () => { if (isDesktop()) { navMenu && (navMenu.style.display = ''); navButton?.classList.remove('w--open'); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.w-nav')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); closeModal(); } });

  /* ---------- Header: solid background once scrolled ---------- */
  const header = $('#site-header');
  if (header) {
    const onHeaderScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* ---------- Stats count-up ---------- */
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    counters.forEach((c) => { c.textContent = '0'; io.observe(c); });
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
    let range = 0, target = 0, current = 0, raf = 0;
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const setFill = (p) => { fill.style.transform = `scaleX(${0.07 + p * 0.93})`; };

    const render = () => {
      raf = 0;
      current += (target - current) * (reduceMotion ? 1 : 0.12);       // light easing; swap for gsap.quickTo later
      if (Math.abs(target - current) < 0.0005) current = target;
      track.style.transform = `translate3d(${-current * range}px,0,0)`;
      setFill(current);
      if (current !== target) raf = requestAnimationFrame(render);
    };
    const measure = () => {
      const pinned = mq.matches;
      work.classList.toggle('is-pinned', pinned);
      if (!pinned) { work.style.height = ''; track.style.transform = ''; onNativeScroll(); return; }
      range = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      work.style.height = `${pin.offsetHeight + range}px`;
      onScroll();
    };
    const onScroll = () => {
      if (!mq.matches) return;
      target = clamp(-work.getBoundingClientRect().top / (range || 1));
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

    // Page-scroll positions where the rail is pinned: start → end of the sideways travel
    const pinStart = () => work.getBoundingClientRect().top + window.scrollY;
    const clampToRail = (y) => { const s = pinStart(); return Math.min(Math.max(y, s), s + range); };

    // Drag with the mouse → scroll the page by the same distance, but never past either end of the rail
    let drag = null;
    viewport.addEventListener('pointerdown', (e) => {
      if (!mq.matches || e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, y: window.scrollY };
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (drag) window.scrollTo({ top: clampToRail(drag.y - (e.clientX - drag.x)), behavior: 'instant' });
    });
    const endDrag = () => { drag = null; viewport.classList.remove('is-dragging'); };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    // Horizontal wheel / trackpad swipe — also stops at the ends
    viewport.addEventListener('wheel', (e) => {
      if (mq.matches && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        window.scrollTo({ top: clampToRail(window.scrollY + e.deltaX), behavior: 'instant' });
      }
    }, { passive: false });

    measure();
  }

  /* ---------- Feature cards: stacked sticky cards that shrink as the next one lands ---------- */
  const cards = $$('.feature-card');
  const desktop = matchMedia('(min-width: 992px)');
  const SHRINK = 0.05;                       // scale lost per card stacked on top
  if (cards.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      if (!desktop.matches) { cards.forEach((c) => { c.style.transform = ''; }); return; }
      const vh = window.innerHeight;
      // progress 0→1 of each card travelling from below into its sticky position
      const progress = cards.map((c) => {
        const stick = parseFloat(getComputedStyle(c).top) || 0;
        return Math.min(Math.max(1 - (c.getBoundingClientRect().top - stick) / (vh * 0.7), 0), 1);
      });
      cards.forEach((c, i) => {
        let covered = 0;
        for (let j = i + 1; j < cards.length; j++) covered += progress[j];
        c.style.transform = covered ? `scale(${1 - SHRINK * covered})` : '';
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
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
    const T_START = 1.346, T_END = 0.596;                    // pill top (× vh) where the shrink starts / finishes
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    const ease = (t) => t * t * (3 - 2 * t);
    let S0 = 0, off = 0;
    const measureV = () => {
      if (!mqV.matches) { vFrame.removeAttribute('style'); stage.style.paddingBottom = stage.style.marginBottom = ''; return; }
      const vh = window.innerHeight;
      stage.style.paddingBottom = stage.style.marginBottom = '';
      off = vHead.getBoundingClientRect().bottom - vSlot.getBoundingClientRect().top;   // pill top → headline bottom
      // keep the pin engaged until the video has landed (pill at T_END), then pull the cards up to sit GAP under the headline
      const pad = Math.max(vh - (T_END * vh + off), 0);
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
      const liveEnd = { x: s.left, y: s.top + (s.height - fh) / 2 - 7, w: fw, h: fh };   // rides with the pill
      const t = clamp01((T_START * vh - s.top) / ((T_START - T_END) * vh));              // linear, as measured
      let r;
      if (t <= 0) r = { ...base, r: 24 };
      else if (t >= 1) r = { ...liveEnd, r: 20 };
      else {
        const F = { x: s.left, y: T_END * vh + (s.height - fh) / 2 - 7, w: fw, h: fh };  // where the pill will be at T_END
        r = { x: lerp(base.x, F.x, t), y: lerp(base.y, F.y, t), w: lerp(base.w, F.w, t), h: lerp(base.h, F.h, t), r: lerp(24, 20, t) };
      }
      vFrame.style.cssText = `left:${r.x}px;top:${r.y - pinTop}px;width:${r.w}px;height:${r.h}px;border-radius:${r.r}px`;
    };
    window.addEventListener('scroll', updateV, { passive: true });
    window.addEventListener('resize', measureV);
    window.addEventListener('load', measureV);
    mqV.addEventListener?.('change', measureV);
    measureV();
  }

  /* ---------- Stacked service card ----------
     Timings measured on the staging build (1920×1000): the card is pinned for 3.6vh of scroll; panels cross-fade
     (opacity 0→1 with a 34px rise) at 1.15vh, then every .805vh; the image tiles rotate through four slots
     (main · bottom-peek · hidden · top-peek) shortly before each cross-fade. Pure function of scroll → GSAP-ready. */
  const svc = $('[data-svc]');
  if (svc) {
    const card = $('[data-svc-card]', svc);
    const panels = $$('[data-svc-panel]', svc);
    const tiles = $$('[data-svc-tile]', svc);
    const media = $('[data-svc-media]', svc);
    const mqS = matchMedia('(min-width: 992px)');
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const E1 = 1.15, STEP = 0.805, PANEL_W = 0.10, TILE_END = 0.08, TILE_W = 0.17;   // in vh
    // slots as fractions of the card height (measured at 800px): [top, height]
    const SLOT = { main: [168, 480], bottom: [678, 200], hidden: [678, 0], top: [-62, 200], gone: [-85, 0] };
    let pinStart = 0;
    const measureS = () => { pinStart = svc.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(card).top); updateS(true); };
    // The target progress follows the scroll position; the value actually drawn eases toward it every frame, so wheel
    // notches glide instead of stepping (time constant ≈ 110ms).
    let curPx = null, targetPx = 0, rafS = 0, lastS = 0;
    const applyS = (px) => {
      const scale = media.clientHeight / 800;
      // panels
      const u = [0, 1, 2, 3].map((k) => (k === 0 ? 1 : clamp01((px - (E1 + STEP * (k - 1) - PANEL_W)) / PANEL_W)));
      panels.forEach((p, j) => {
        const inn = u[j], out = j === 3 ? 1 : 1 - u[j + 1], o = inn * out;
        p.style.opacity = o; p.style.transform = `translateY(${34 * (1 - o)}px)`; p.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      });
      // tiles: find the running transition k (0..2) and its progress
      let k = 0, t = 0;
      for (let n = 1; n <= 3; n++) {
        const end = E1 + STEP * (n - 1) - TILE_END, start = end - TILE_W;
        if (px >= end) { k = n; t = 0; } else if (px > start) { k = n - 1; t = clamp01((px - start) / TILE_W); break; } else break;
      }
      k = Math.min(k, 3);
      tiles.forEach((tile, i) => {
        const d = (((i - k) % 4) + 4) % 4;
        const from = [SLOT.main, SLOT.bottom, SLOT.hidden, SLOT.top][d];
        const to = k >= 3 ? from : [SLOT.top, SLOT.main, SLOT.bottom, SLOT.gone][d];
        const top = lerp(from[0], to[0], t) * scale, height = lerp(from[1], to[1], t) * scale;
        tile.style.top = `${top}px`; tile.style.height = `${Math.max(height, 0)}px`;
      });
    };
    const loopS = (now) => {
      rafS = 0;
      const dt = Math.min((now - lastS) / 1000, 0.05); lastS = now;
      curPx += (targetPx - curPx) * (1 - Math.exp(-dt * 9));
      if (Math.abs(targetPx - curPx) < 0.0004) curPx = targetPx;
      applyS(curPx);
      if (curPx !== targetPx) rafS = requestAnimationFrame(loopS);
    };
    const updateS = (instant) => {
      if (!mqS.matches) { panels.forEach((p) => p.removeAttribute('style')); tiles.forEach((t) => t.removeAttribute('style')); curPx = null; return; }
      targetPx = (window.scrollY - pinStart) / window.innerHeight;                      // progress in vh units
      if (curPx === null || instant === true || reduceMotion) { curPx = targetPx; applyS(curPx); return; }
      if (!rafS) { lastS = performance.now(); rafS = requestAnimationFrame(loopS); }
    };
    // hover: every tile gets an expand button that opens the image in the lightbox
    tiles.forEach((tile) => {
      tile.insertAdjacentHTML('beforeend', '<button class="svc-tile__expand" type="button" aria-label="Expand image"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>');
      const open = () => {
        const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(tile).backgroundImage);
        if (m && openLightbox) openLightbox(m[1], tile.querySelector('.svc-tile__expand'));
      };
      tile.addEventListener('click', open);
    });
    window.addEventListener('scroll', () => updateS(), { passive: true });
    window.addEventListener('resize', measureS);
    window.addEventListener('load', measureS);
    mqS.addEventListener?.('change', measureS);
    measureS();
  }

  /* ---------- Feature cards: one wheel gesture = one card ----------
     While the stacked cards are on screen, a wheel gesture glides to the next (or previous) card instead of
     scrolling freely. Snap positions = where card i sits at its sticky line. Outside the first/last card the page
     scrolls normally, so the section never traps the user. Desktop wheel/trackpad only. */
  const snapCards = $$('.feature-card');
  if (snapCards.length && !reduceMotion) {
    const wrapEl = $('.features__wrap');
    const mqSnap = matchMedia('(min-width: 992px)');
    let animating = false, lastWheel = 0, rafSnap = 0;
    const snapPoints = () => {
      const h = snapCards[0].offsetHeight + (parseFloat(getComputedStyle(wrapEl).rowGap) || 0);   // card + gap
      const top = wrapEl.getBoundingClientRect().top + window.scrollY;
      return snapCards.map((c, i) => Math.round(top + i * h - (parseFloat(getComputedStyle(c).top) || 0)));
    };
    const glideTo = (target) => {
      const from = window.scrollY, dist = target - from, dur = Math.min(1100, 600 + Math.abs(dist) * 0.35), t0 = performance.now();
      animating = true;
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        window.scrollTo({ top: from + dist * ease(p), behavior: 'instant' });
        if (p < 1) rafSnap = requestAnimationFrame(step);
        else { animating = false; lastWheel = performance.now(); }
      };
      cancelAnimationFrame(rafSnap); rafSnap = requestAnimationFrame(step);
    };
    window.addEventListener('wheel', (e) => {
      if (!mqSnap.matches || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX) || Math.abs(e.deltaY) < 4) return;
      const now = performance.now(), newGesture = now - lastWheel > 150;
      lastWheel = now;
      const pts = snapPoints(), y = window.scrollY, vh = window.innerHeight, down = e.deltaY > 0;
      const first = pts[0], last = pts[pts.length - 1];
      let target = null;
      if (down) {
        if (y >= first - 0.6 * vh && y < last - 4) target = pts.find((p) => p > y + 4);          // next card down
      } else if (y <= last + 0.5 * vh && y > first + 4) {
        target = [...pts].reverse().find((p) => p < y - 4);                                      // previous card up
        if (target === undefined && y > last) target = last;
      }
      if (!down && y > last + 4 && y <= last + 0.5 * vh) target = last;                          // coming back from below
      if (target == null) return;                                                                // outside the stack: normal scroll
      e.preventDefault();                                                                        // inside: we own this gesture
      if (animating || !newGesture) return;                                                      // ignore the tail of the same gesture
      glideTo(target);
    }, { passive: false });
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
    const go = (i, animate = true) => {
      index = Math.min(Math.max(i, 0), cardsT.length - 1);
      tRail.classList.toggle('is-dragging', !animate);
      tRail.style.transform = `translate3d(${-index * pitch}px,0,0)`;
      tabs.forEach((t, n) => { t.classList.toggle('is-active', n === index); t.setAttribute('aria-selected', String(n === index)); });
    };
    tabs.forEach((t, n) => t.addEventListener('click', () => go(n)));
    tabs.forEach((t, n) => t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { go(n + 1); tabs[index].focus(); }
      if (e.key === 'ArrowLeft') { go(n - 1); tabs[index].focus(); }
    }));
    // drag / swipe: follow the pointer, then snap to the nearest card (flick past 18% of a card or 60px changes card)
    let drag = null;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('a,button')) return;
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
      go(index + (Math.abs(dx) > Math.max(60, pitch * 0.18) ? (dx < 0 ? 1 : -1) : 0));
    };
    viewport.addEventListener('pointerup', endT);
    viewport.addEventListener('pointercancel', endT);
    window.addEventListener('resize', measureT);
    window.addEventListener('load', measureT);
    measureT();
  }
})();
