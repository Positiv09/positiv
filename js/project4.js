/* Project page in the same explorable world as work4: scroll flies the camera through the project - cover, Brief / Approach / Outcome panels, the gallery in the four
   corners, a quote and the next project. The mouse tilts the view. Placeholder content (same order as project.html?p=N). */
(() => {
  const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
    'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
  const CAT = ['Brand · Sales', 'Web', 'Brand', 'Web · Campaign', 'Brand system', 'Sales assets', 'Brand', 'Campaign', 'Sales', 'Web', 'Marketing', 'Brand', 'Sales assets', 'Web'];
  const TITLES = ['Connecting founders with capital', 'A product people want to open', 'One identity, every partner', 'Built to be found', 'A system that scales', 'Decks reps actually use',
    'Positioning with teeth', 'Launch at deal speed', 'Proposals that close', 'A site that sells', 'The creative that keeps pipeline fed', 'Co-branding without compromise', 'Battle cards, sharpened', 'Landing pages in a week'];
  const BRIEF = 'A growing business with real ambition needed to look and sound like one team. Positioning, templates and assets had to be easy to use and impossible to get wrong.';
  const APPROACH = 'We built the system around a clear narrative and a small set of rules, then turned it into the templates, decks and pages partners actually reach for.';
  const OUTCOME = 'Partner teams now start from the same strong foundation. Conversations open with a consistent story and assets are produced in hours instead of weeks.';
  const QUOTE = ['Working with Positiv was a seamless experience from start to finish. Their team transformed complex ideas into visually compelling designs that elevated our brand presence.', 'Positiv became more than a design partner - they became an extension of our team.'];
  const WHO = [['Alexis Johnson', 'CEO of Light Node Ventures'], ['Mansour Al Derei', 'Trendz Podcast Host | Investor']];
  const N = IMG.length, GAP = 940, START = 700;
  const $ = (id) => document.getElementById(id);
  const sec = $('wv'), world = $('wv-world');
  if (!sec || !world) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = matchMedia('(max-width: 991px)').matches;
  let id = parseInt(new URLSearchParams(location.search).get('p'), 10); if (!(id >= 1 && id <= N)) id = 1;
  const i0 = id - 1, img = (k) => `assets/img/${IMG[((k % N) + N) % N]}`;
  document.title = `Angel East — ${TITLES[i0]} — Positiv`;
  $('pv-cat').textContent = CAT[i0]; $('pv-title').textContent = TITLES[i0]; $('pv-sub').textContent = `Angel East · ${CAT[i0]}`;

  /* the corners (as in work4): pictures stay away from the big logo */
  const corner = (k) => { const sx = k % 2 ? 1 : -1, sy = k % 4 < 2 ? -1 : 1, sc = 0.6, hw = small ? 110 : 250, hh = small ? 72 : 160;
    return { sx, sy, x: sx * Math.max((innerWidth / 2 - hw * sc - 26) / sc, hw + 60), y: sy * Math.max((innerHeight / 2 - hh * sc - (small ? 120 : 110)) / sc, hh + 20) }; };

  /* the stops of the journey */
  const items = [
    { k: 'cover', label: 'Cover', at: 'centre' },
    { k: 'text', label: 'The Brief', h: 'The Brief', t: BRIEF, at: 0 },
    { k: 'text', label: 'The Approach', h: 'The Approach', t: APPROACH, at: 1 },
    { k: 'img', label: 'Gallery', src: img(i0 + 3), at: 2 }, { k: 'img', label: 'Gallery', src: img(i0 + 5), at: 3 },
    { k: 'text', label: 'The Outcome', h: 'The Outcome', t: OUTCOME, at: 0 },
    { k: 'img', label: 'Gallery', src: img(i0 + 7), at: 1 }, { k: 'img', label: 'Gallery', src: img(i0 + 9), at: 2 },
    { k: 'quote', label: 'In their words', at: 'centre' },
    { k: 'next', label: 'Next project', at: 'centre' },
  ];
  $('wv-total').textContent = String(items.length).padStart(2, '0');
  const nodes = items.map((it, n) => {
    const el = document.createElement('div'); el.className = 'wv-frame pv-item pv-item--' + it.k;
    let c = it.at === 'centre' ? { x: 0, y: 0, sx: 0, sy: 0 } : corner(it.at);
    if (it.k === 'cover') el.innerHTML = `<a class="wv-frame__card pv-cover" href="#" style="background-image:url('${img(i0)}')" aria-label="Project cover"></a>`;
    else if (it.k === 'img') el.innerHTML = `<div class="wv-frame__card" style="background-image:url('${it.src}')"></div><span class="wv-frame__ref" style="background-image:url('${it.src}')"></span>`;
    else if (it.k === 'text') el.innerHTML = `<div class="pv-panel"><span>${String(n).padStart(2, '0')}</span><h2>${it.h}</h2><p>${it.t}</p></div>`;
    else if (it.k === 'quote') { const q = i0 % 2; el.innerHTML = `<div class="pv-panel pv-panel--quote"><svg width="48" height="36" viewBox="0 0 64 48" fill="currentColor"><path d="M0 48V28C0 12 9 2 26 0v10C17 12 13 17 13 24h13v24H0zm38 0V28C38 12 47 2 64 0v10c-9 2-13 7-13 14h13v24H38z"/></svg><blockquote>${QUOTE[q]}</blockquote><p><strong>${WHO[q][0]}</strong>${WHO[q][1]}</p></div>`; }
    else { const nx = (i0 + 1) % N; el.innerHTML = `<a class="wv-frame__card pv-next" href="project4.html?p=${nx + 1}" data-cursor="View" style="background-image:url('${img(nx)}')"><span class="wv-frame__meta"><strong>Next project</strong><em>${CAT[nx]}</em></span></a><a class="pv-all" href="work4.html">All projects</a>`; }
    const z = -(START + n * GAP);
    el.style.transform = `translate3d(${c.x}px, ${c.y}px, ${z}px) rotateY(${-c.sx * 12}deg) rotateX(${c.sy * 4}deg)`;
    world.appendChild(el); return { el, z };
  });
  const dots = Array.from({ length: small ? 50 : 110 }, () => { const s = 2 + Math.random() * 3, z = -(100 + Math.random() * (N * GAP)), el = document.createElement('div'); el.className = 'wv-dot' + (Math.random() < 0.3 ? ' wv-dot--lime' : '');
    el.style.cssText = `width:${s}px;height:${s}px;transform:translate3d(${(Math.random() - 0.5) * 1800}px,${(Math.random() - 0.5) * 1000}px,${z}px)`; world.appendChild(el); return { el, z, op: 0.25 + Math.random() * 0.65 }; });
  const range = (items.length - 1) * GAP + START + 500;
  sec.style.height = `calc(100vh + ${Math.round(items.length * 60 + 140)}vh)`;

  const intro = $('wv-intro'), hint = sec.querySelector('.wv__hint'), logo = $('wv-logo'), hud = { num: $('wv-num'), name: $('wv-name'), bar: $('wv-bar') };
  let target = 0, cam = 0, mx = 0, my = 0, tx = 0, ty = 0, active = -1, raf = 0, visible = true;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const measure = () => { const r = sec.getBoundingClientRect(), max = sec.offsetHeight - innerHeight; target = clamp(-r.top / max, 0, 1); };
  const fade = (e) => e < -3600 ? 0 : e < -2200 ? (e + 3600) / 1400 : e < 150 ? 1 : e < 620 ? 1 - (e - 150) / 470 : 0;
  const frame = () => {
    raf = 0; cam += (target * range - cam) * (reduce ? 1 : 0.075); mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    world.style.transform = `translate3d(${(-mx * 60).toFixed(1)}px, ${(-my * 36).toFixed(1)}px, ${cam.toFixed(1)}px) rotateX(${(my * -6).toFixed(2)}deg) rotateY(${(mx * 9).toFixed(2)}deg)`;
    let best = 0, bd = 1e9;
    nodes.forEach((n, i) => { const e = n.z + cam; n.el.style.opacity = fade(e).toFixed(3); n.el.style.pointerEvents = e > -2200 && e < 150 ? 'auto' : 'none'; const d = Math.abs(e + 700); if (d < bd) { bd = d; best = i; } });
    dots.forEach((d) => { d.el.style.opacity = (fade(d.z + cam) * d.op).toFixed(3); });
    const p = clamp(cam / range, 0, 1);
    intro.style.opacity = clamp(1 - p * 14, 0, 1).toFixed(3); intro.style.transform = `translate(-50%, calc(0px - ${(p * 900).toFixed(0)}px)) scale(${(1 + p * 6).toFixed(3)})`;
    hint.style.opacity = p > 0.05 ? 0.4 : 1; hud.bar.style.transform = `scaleX(${p.toFixed(4)})`;
    logo.style.transform = `translate(-50%, -50%) translate3d(${(mx * -26).toFixed(1)}px, ${(my * -16).toFixed(1)}px, 0) rotateY(${(mx * 8).toFixed(2)}deg) rotateX(${(my * -6).toFixed(2)}deg)`;
    if (best !== active) { active = best; hud.num.textContent = String(best + 1).padStart(2, '0'); hud.name.textContent = items[best].label; }
    if (Math.abs(target * range - cam) > 0.5 || Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
  window.addEventListener('scroll', () => { measure(); kick(); }, { passive: true }); window.addEventListener('resize', () => { measure(); kick(); });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) window.addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; kick(); }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) kick(); }).observe(sec);
  measure(); frame();
})();
