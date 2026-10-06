/* About page behaviour (loaded after main.js). GSAP is optional: without it the page is simply static. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Testimonial rows: duplicate each set once so the CSS loop (-50%) is seamless */
  $$('[data-quote-set]').forEach((set) => {
    const clone = set.cloneNode(true);
    clone.removeAttribute('data-quote-set'); clone.setAttribute('aria-hidden', 'true');
    set.parentElement.appendChild(clone);
  });

  /* Testimonial rows: auto-scroll (JS) + drag with the mouse / touch, with a little inertia; paused while hovered */
  const rows = $$('[data-quote-row]').map((row, i) => {
    const track = $('.quote-row__track', row), set = $('.quote-row__set', row);
    row.classList.add('is-js');
    const st = { row, track, set, pos: 0, vel: 0, drag: false, hover: false, dir: row.classList.contains('quote-row--reverse') ? 1 : -1 };
    st.pos = st.dir < 0 ? 0 : -set.offsetWidth * 0.5;
    let sx = 0, sp = 0, lx = 0, lt = 0, moved = false;
    row.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      st.drag = true; moved = false; sx = lx = e.clientX; sp = st.pos; lt = performance.now(); st.vel = 0;
    });
    window.addEventListener('pointermove', (e) => {
      if (!st.drag) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 4) { moved = true; row.classList.add('is-drag'); }
      if (!moved) return;
      const now = performance.now(), dt = Math.max(now - lt, 1);
      st.vel = (e.clientX - lx) / dt * 1000; lx = e.clientX; lt = now;
      st.pos = sp + dx;
    });
    const end = () => { if (!st.drag) return; st.drag = false; row.classList.remove('is-drag'); if (performance.now() - lt > 80) st.vel = 0; };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    row.addEventListener('mouseenter', () => { st.hover = true; });
    row.addEventListener('mouseleave', () => { st.hover = false; });
    row.addEventListener('dragstart', (e) => e.preventDefault());
    return st;
  });
  if (rows.length) {
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - prev) / 1000, 0.05); prev = now;
      rows.forEach((st) => {
        const W = st.set.offsetWidth; if (!W) return;
        if (!st.drag) {
          if (Math.abs(st.vel) > 1) { st.pos += st.vel * dt; st.vel *= Math.pow(0.04, dt); }       // inertia after release
          else if (!st.hover && !reduce) st.pos += st.dir * (W / 80) * dt;                         // idle drift: one set per 80s
        }
        st.pos = ((st.pos % W) - W) % W;                                                            // seamless wrap into [-W, 0)
        st.track.style.transform = `translate3d(${st.pos.toFixed(1)}px,0,0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (!window.gsap || reduce) return;

  /* Hero collage: images rise in with a stagger, then drift together (a slow parallax) while scrolling */
  const imgs = $$('.about-collage__img');
  gsap.from(imgs, { y: 90, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: { each: 0.07, from: 'start' }, delay: 0.25 });
  // The two rows slide in opposite directions, endlessly: the top row right -> left, the bottom row left -> right. Every picture is cloned
  // once (a second copy one period away) and wrapped, so the rows never run out. The slow vertical parallax is kept, and the motion eases
  // to a stop while the pointer is on a picture. Desktop only (below 992px the collage is a static grid).
  const mqCol = matchMedia('(min-width: 992px)');
  const ringEl = $('.scroll-ring');
  let over = 0;
  const inner = $('.about-collage__inner');
  let slides = [];
  const buildSlides = () => {
    slides.forEach((o) => { if (o.clone) o.el.remove(); o.el.style.translate = ''; });
    slides = [];
    if (!mqCol.matches || !inner) return;
    const rows = [imgs.slice(0, 5), imgs.slice(5)];
    rows.forEach((row, ri) => {
      const xs = row.map((el) => parseFloat(el.style.getPropertyValue('--x'))), ws = row.map((el) => parseFloat(el.style.getPropertyValue('--w')));
      const period = Math.max(...xs.map((x, i) => x + ws[i])) - Math.min(...xs) + 16;   // row length + one gap, in design units
      row.forEach((el, i) => {
        const clone = el.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); clone.style.opacity = ''; clone.style.transform = ''; clone.style.translate = ''; inner.appendChild(clone);
        slides.push({ el, row: ri, base: xs[i], w: ws[i], period, dir: ri === 0 ? -1 : 1, off: 0, copy: 0 });
        slides.push({ el: clone, row: ri, clone: true, base: xs[i], w: ws[i], period, dir: ri === 0 ? -1 : 1, off: 0, copy: 1 });
      });
    });
  };
  const SPEED = 42;                                                    // design units per second
  const slowR = [1, 1]; let hoverRow = -1, lastT = performance.now(), px = 0;
  // drag with the mouse / finger: both rows follow the pointer, and let go with a flick that keeps gliding before the auto-drift resumes
  let drag = null; const vels = [0, 0];
  inner?.addEventListener('pointerdown', (e) => {
    if (!mqCol.matches || e.button !== 0 || !e.target.closest('.about-collage__img')) return;
    const hit = slides.find((o) => o.el === e.target.closest('.about-collage__img'));
    if (!hit) return;
    drag = { x: e.clientX, t: performance.now(), row: hit.row, vel: 0 }; vels[hit.row] = 0; inner.classList.add('is-dragging');
    inner.setPointerCapture(e.pointerId);
  });
  inner?.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const now = performance.now(), du = (e.clientX - drag.x) / (innerWidth / 1440), dt = Math.max((now - drag.t) / 1000, 0.001);
    slides.forEach((o) => { if (o.row === drag.row) o.off += du; });
    drag.vel = Math.max(-1600, Math.min(1600, drag.vel * 0.6 + (du / dt) * 0.4)); drag.x = e.clientX; drag.t = now;
  });
  const endDrag = () => { if (!drag) return; vels[drag.row] = drag.vel; drag = null; inner.classList.remove('is-dragging'); };
  inner?.addEventListener('pointerup', endDrag); inner?.addEventListener('pointercancel', endDrag);
  inner?.addEventListener('dragstart', (e) => e.preventDefault());
  inner?.addEventListener('mouseover', (e) => { const h = slides.find((o) => o.el === e.target.closest('.about-collage__img')); hoverRow = h ? h.row : -1; });
  inner?.addEventListener('mouseleave', () => { hoverRow = -1; });
  const paint = (now) => {
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    slowR.forEach((v, r) => { slowR[r] += (((hoverRow === r) ? 0.18 : 1) - v) * Math.min(dt * 4, 1); });   // only the hovered row eases down to a crawl
    const dragRow = drag ? drag.row : -1;
    vels.forEach((v, r) => {
      if (drag && drag.row === r) return;
      if (Math.abs(v) > 1) { slides.forEach((o) => { if (o.row === r) o.off += v * dt; }); vels[r] = v * Math.exp(-dt * 3.2); } else vels[r] = 0;
    });
    const y = window.scrollY;
    if (slides.length && y < 1800) {
      const ux = innerWidth / 1440;
      slides.forEach((o) => {
        o.off += o.dir * SPEED * (o.row === dragRow ? 0 : slowR[o.row]) * dt;
        const span = 2 * o.period, wrapMin = -(o.w + 40);
        // position of this copy in design units, wrapped to [wrapMin, wrapMin + span)
        let x = o.base + o.copy * o.period + o.off;
        x = ((x - wrapMin) % span + span) % span + wrapMin;
        o.el.style.translate = `${((x - o.base) * ux).toFixed(1)}px ${(-y * 0.04).toFixed(1)}px`;
      });
    } else if (!slides.length) {
      imgs.forEach((el) => { el.style.translate = `0 ${(-y * 0.04).toFixed(1)}px`; });
    }
    // water drop: the more the scroll ring sits on a picture, the more it turns from a paper disc into a glassy drop that sinks into the image
    if (ringEl && slides.length) {
      const rr = ringEl.getBoundingClientRect();
      let best = 0;
      slides.forEach((o) => {
        const b = o.el.getBoundingClientRect();
        const ix = Math.min(rr.right, b.right) - Math.max(rr.left, b.left), iy = Math.min(rr.bottom, b.bottom) - Math.max(rr.top, b.top);
        if (ix > 0 && iy > 0) best = Math.max(best, Math.min((ix * iy) / (rr.width * rr.height) * 1.6, 1));
      });
      over += (best - over) * Math.min(dt * 7, 1);
      ringEl.style.setProperty('--over', over.toFixed(3));
    }
    requestAnimationFrame(paint);
  };
  buildSlides();
  mqCol.addEventListener?.('change', buildSlides);
  requestAnimationFrame(paint);

  /* Team slider: prev / next switch the profile (photo wipe, name, role, bio, avatars, counter) and the progress line
     auto-advances every 6s (paused on hover). Profile data lives in TEAM below. Only Kevin Bruno exists in the design —
     entries 2-5 are PLACEHOLDERS built from existing portraits so the slider can be demonstrated; replace them. */
  const IMG = 'assets/img/about/';
  const TEAM = [
    { name: 'Kevin Bruno', role: 'Creative Director', photo: IMG + 'team-kevin.png', avatar: IMG + 'team-avatar-1.png', pos: '50% 50%',
      bio: "I'm a web and UI/UX designer. For [X] years I've designed websites and digital experiences built to convert — not just to look good. I focus on accessible, conversion-focused design: websites," },
    { name: 'Team Member 02', role: 'Role / Title', photo: IMG + 'collage-04.webp', avatar: IMG + 'collage-04.webp', pos: '55% 40%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' },
    { name: 'Team Member 03', role: 'Role / Title', photo: IMG + 'collage-06.webp', avatar: IMG + 'collage-06.webp', pos: '45% 35%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' },
    { name: 'Team Member 04', role: 'Role / Title', photo: IMG + 'collage-03.webp', avatar: IMG + 'collage-03.webp', pos: '60% 40%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' },
    { name: 'Team Member 05', role: 'Role / Title', photo: IMG + 'collage-02.webp', avatar: IMG + 'collage-02.webp', pos: '45% 60%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' }
  ];
  const card = $('[data-team-card]'), bar = $('[data-team-progress]');
  if (card) {
    const photoWrap = card;
    const el = {
      name: $('[data-team-name]'), bio: $('[data-team-bio]'), who: $('[data-team-who]'), role: $('[data-team-role]'),
      avatar: $('[data-team-avatar]'), thumbs: $('[data-team-thumbs]'), count: $('[data-team-count]'), total: $('[data-team-total]'),
      right: $('[data-team]')
    };
    const pad = (n) => String(n).padStart(2, '0');
    const wrap = (n) => (n + TEAM.length) % TEAM.length;
    el.total.textContent = pad(TEAM.length);
    let cur = 0, busy = false, auto = null;

    const thumbs = (i) => {
      el.thumbs.innerHTML = '';
      [i, wrap(i + 1)].forEach((k, n) => {
        const s = document.createElement('span'); s.className = 'team__thumb' + (n === 0 ? ' team__thumb--on' : '');
        s.innerHTML = `<img src="${TEAM[k].avatar}" alt="" style="object-position:${TEAM[k].pos}">` +
          (n === 0 ? '<svg class="team__ring" viewBox="0 0 70 70" aria-hidden="true"><circle class="ring-track" cx="35" cy="35" r="33" pathLength="100"/><circle class="ring-bar" cx="35" cy="35" r="33" pathLength="100"/></svg>' : ''); el.thumbs.appendChild(s);
      });
    };
    const startProgress = () => {
      auto?.kill();
      if (!bar) return;
      auto = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 6, ease: 'none', onUpdate() { const r = $('.ring-bar', el.thumbs); if (r) r.style.strokeDashoffset = 100 - this.progress() * 100; }, onComplete: () => { if (busy) startProgress(); else go(1); } });   // never leave the timer dead if a transition is still running
    };
    const go = (dir) => {
      if (busy) return; busy = true;
      const next = wrap(cur + dir), m = TEAM[next], old = $('.team__photo', photoWrap);
      const img = document.createElement('img');
      img.className = 'team__photo team__photo--in'; img.alt = m.name; img.src = m.photo; img.style.objectPosition = m.pos;
      photoWrap.insertBefore(img, old.nextSibling);
      const from = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      const tl = gsap.timeline({ onComplete: () => { old.remove(); img.classList.remove('team__photo--in'); gsap.set(img, { clearProps: 'clipPath,scale' }); cur = next; busy = false; } });
      tl.fromTo(img, { clipPath: from, scale: 1.12 }, { clipPath: 'inset(0 0% 0 0%)', scale: 1, duration: 0.9, ease: 'power3.inOut' }, 0)
        .to(old, { scale: 1.06, xPercent: dir > 0 ? -8 : 8, duration: 0.9, ease: 'power3.inOut' }, 0);
      // texts: slide out, swap, slide in
      const texts = [el.name, el.bio, el.who, el.role];
      tl.to(texts, { opacity: 0, y: -14, duration: 0.25, ease: 'power2.in', stagger: 0.03 }, 0)
        .add(() => {
          el.name.textContent = m.name; el.bio.textContent = m.bio; el.who.textContent = m.name; el.role.textContent = m.role;
          el.avatar.src = m.avatar; el.avatar.style.objectPosition = m.pos; thumbs(next);
          el.count.textContent = pad(next + 1);
        }, 0.3)
        .fromTo(texts, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.05 }, 0.32)
        .fromTo(el.thumbs.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08 }, 0.4);
      startProgress();
    };
    $('[data-team-next]')?.addEventListener('click', () => go(1));
    $('[data-team-prev]')?.addEventListener('click', () => go(-1));
            document.addEventListener('visibilitychange', () => { if (!document.hidden && auto && auto.paused()) auto.resume(); });
    thumbs(0); startProgress();
  }
})();
