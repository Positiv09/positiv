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
  // one speed for all images, so both rows keep their straight lines and the 16px gap between them (as in the design)
  const speeds = imgs.map(() => 0.04);
  const parallax = () => {
    const y = window.scrollY;
    if (y > 1800) return;
    imgs.forEach((el, i) => { el.style.translate = `0 ${(-y * speeds[i]).toFixed(1)}px`; });
  };
  window.addEventListener('scroll', parallax, { passive: true }); parallax();

  /* Team slider: prev / next switch the profile (photo wipe, name, role, bio, avatars, counter) and the progress line
     auto-advances every 6s (paused on hover). Profile data lives in TEAM below. Only Kevin Bruno exists in the design —
     entries 2-5 are PLACEHOLDERS built from existing portraits so the slider can be demonstrated; replace them. */
  const IMG = 'assets/img/about/';
  const TEAM = [
    { name: 'Kevin Bruno', role: 'Creative Director', photo: IMG + 'team-kevin.png', avatar: IMG + 'team-avatar-1.png', pos: '50% 50%',
      bio: "I'm a web and UI/UX designer. For [X] years I've designed websites and digital experiences built to convert — not just to look good. I focus on accessible, conversion-focused design: websites," },
    { name: 'Team Member 02', role: 'Role / Title', photo: IMG + 'collage-04.png', avatar: IMG + 'collage-04.png', pos: '55% 40%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' },
    { name: 'Team Member 03', role: 'Role / Title', photo: IMG + 'collage-06.png', avatar: IMG + 'collage-06.png', pos: '45% 35%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' },
    { name: 'Team Member 04', role: 'Role / Title', photo: IMG + 'collage-03.png', avatar: IMG + 'collage-03.png', pos: '60% 40%',
      bio: 'Placeholder profile — replace the photo, name, role and this text in the TEAM array of js/about.js.' },
    { name: 'Team Member 05', role: 'Role / Title', photo: IMG + 'collage-02.png', avatar: IMG + 'collage-02.png', pos: '45% 60%',
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
