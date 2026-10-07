/* Work (world): CSS-3D tunnel. Scroll = fly forward, mouse = look around, frames fade in from the fog and out behind the camera.
   Project data below is placeholder (14 tiles, same order as project.html?p=N). */
(() => {
  const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
    'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
  const CAT = ['Brand · Sales', 'Web', 'Brand', 'Web · Campaign', 'Brand system', 'Sales assets', 'Brand', 'Campaign', 'Sales', 'Web', 'Marketing', 'Brand', 'Sales assets', 'Web'];
  const CATS = ['brand sales', 'web', 'brand', 'web campaign', 'brand', 'sales', 'brand', 'campaign', 'sales', 'web', 'campaign', 'brand', 'sales', 'web'];
  const MARK = 'M150.395 0.5H244.963C257.384 0.5 267.584 10.6174 266.597 22.9238C265.216 40.1243 262.313 67.6814 258.035 94.9336C253.755 122.202 248.106 149.108 241.249 165.042C240.034 167.862 240.865 170.538 242.698 172.091C244.473 173.594 247.149 174.014 249.691 172.576L249.937 172.432C281.394 153.101 316.713 140.351 354.274 136.422C367.156 135.074 378.5 144.959 378.5 157.871V251.421C378.5 261.9 370.016 272.02 359.698 273.991C302.932 284.846 258.065 342.094 249.959 401.12C248.507 411.686 239.496 419.5 228.82 419.5H134.042C121.184 419.5 111.42 408.319 112.564 395.499C115.653 360.916 125.196 327.315 139.94 296.366H139.941C141.21 293.699 140.453 290.938 138.74 289.215C137.023 287.487 134.318 286.782 131.729 288.25C99.5424 306.498 63.2213 318.293 24.4883 321.806C11.6803 322.968 0.5 313.147 0.5 300.327V206.524C0.500083 201.633 2.41029 196.501 5.5459 192.382C8.68198 188.262 13.0097 185.198 17.8066 184.375C46.5412 179.454 72.2308 153.025 91.7568 120.525C111.299 87.9993 124.755 49.2492 128.958 19.4414C130.43 8.99447 139.851 0.5 150.395 0.5Z';
  const N = IMG.length, GAP = 900, START = 700;
  const $ = (id) => document.getElementById(id);
  const sec = $('wv'), world = $('wv-world');
  if (!sec || !world) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 991px)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---- build the world ---- */
  const frames = IMG.map((img, i) => {
    const side = i % 2 ? 1 : -1;
    const x = side * (small ? rnd(60, 110) : rnd(300, 470)), y = rnd(small ? -70 : -130, small ? 70 : 90), z = -(START + i * GAP);
    const el = document.createElement('div'); el.className = 'wv-frame';
    el.innerHTML = `<span class="wv-frame__num">${String(i + 1).padStart(2, '0')}</span>
      <a class="wv-frame__card" href="project.html?p=${i + 1}" data-cursor="View" style="background-image:url('assets/img/${img}')" aria-label="Angel East — ${CAT[i]}">
        <span class="wv-frame__meta"><strong>Angel East</strong><em>${CAT[i]}</em></span></a>
      <span class="wv-frame__ref" style="background-image:url('assets/img/${img}')"></span>`;
    el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${-side * rnd(10, 18)}deg)`;
    world.appendChild(el);
    el.dataset.cat = CATS[i];
    return { el, z, x, y, i, base: z, on: true };
  });
  const rings = Array.from({ length: Math.ceil(N * 0.9) }, (_, i) => {
    const w = rnd(560, 880), el = document.createElement('div'); el.className = 'wv-ring';
    el.innerHTML = `<svg viewBox="-4 -4 387 428" width="${w}" height="${(w * 428) / 387}" fill="none" aria-hidden="true"><path d="${MARK}" stroke="rgb(240,248,121)" stroke-opacity=".55" stroke-width="1.6" fill="rgb(240,248,121)" fill-opacity=".035"/></svg>`;
    const z = -(START - 300 + i * GAP * 1.1);
    el.style.cssText = `left:${-w / 2}px;top:${(-w * 428) / 387 / 2}px;transform:translate3d(${rnd(-50, 50)}px,${rnd(-30, 30)}px,${z}px) rotateZ(${rnd(-6, 6)}deg)`;
    world.appendChild(el); return { el, z };
  });
  const dots = Array.from({ length: small ? 60 : 130 }, () => {
    const s = rnd(2, 5), z = -rnd(100, N * GAP + 600), el = document.createElement('div');
    el.className = 'wv-dot' + (Math.random() < 0.3 ? ' wv-dot--lime' : '');
    el.style.cssText = `width:${s}px;height:${s}px;transform:translate3d(${rnd(-900, 900)}px,${rnd(-500, 500)}px,${z}px)`;
    world.appendChild(el); return { el, z, op: rnd(0.25, 0.9) };
  });
  let M = N, range = (M - 1) * GAP + START + 500;

  /* ---- state ---- */
  const intro = $('wv-intro'), hint = sec.querySelector('.wv__hint');
  const hud = { num: $('wv-num'), name: $('wv-name'), cat: $('wv-cat'), bar: $('wv-bar') };
  $('wv-total').textContent = String(N).padStart(2, '0');
  let target = 0, cam = 0, mx = 0, my = 0, tx = 0, ty = 0, active = -1, raf = 0, visible = true;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  const measure = () => {
    const r = sec.getBoundingClientRect(), max = sec.offsetHeight - innerHeight;
    target = clamp(-r.top / max, 0, 1);
  };
  const frame = () => {
    raf = 0;
    cam += (target * range - cam) * (reduce ? 1 : 0.075);
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    world.style.transform = `translate3d(${(-mx * 60).toFixed(1)}px, ${(-my * 36).toFixed(1)}px, ${cam.toFixed(1)}px) rotateX(${(my * -6).toFixed(2)}deg) rotateY(${(mx * 9).toFixed(2)}deg)`;
    let best = -1, bestD = 1e9;
    const fade = (eff) => eff < -3800 ? 0 : eff < -2300 ? (eff + 3800) / 1500 : eff < 150 ? 1 : eff < 640 ? 1 - (eff - 150) / 490 : 0;
    frames.forEach((f, i) => {
      const eff = f.z + cam; f.el.style.opacity = f.on ? fade(eff).toFixed(3) : 0;
      f.el.style.pointerEvents = f.on && eff > -2300 && eff < 150 ? 'auto' : 'none';
      const d = f.on ? Math.abs(eff + 760) : 1e9; if (d < bestD) { bestD = d; best = i; }
    });
    rings.forEach((r) => { const e = r.z + cam; r.el.style.opacity = (fade(e) * 0.8).toFixed(3); });
    dots.forEach((d) => { const e = d.z + cam; d.el.style.opacity = (fade(e) * d.op).toFixed(3); });
    const p = clamp(cam / range, 0, 1);
    intro.style.opacity = clamp(1 - p * 14, 0, 1).toFixed(3); intro.style.transform = `translate(-50%, calc(-50% - ${(p * 900).toFixed(0)}px)) scale(${(1 + p * 6).toFixed(3)})`;
    hint.style.opacity = p > 0.06 ? 0.45 : 1;
    hud.bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (best !== active) { active = best; hud.num.textContent = String(frames[best].slot + 1).padStart(2, '0'); hud.name.textContent = 'Angel East'; hud.cat.textContent = CAT[best]; }
    if (Math.abs(target * range - cam) > 0.5 || Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  /* ---- filter: matching projects are re-spaced along the tunnel, the others fade away, the camera flies back to the start ---- */
  const filters = [...sec.querySelectorAll('.wv__filter')];
  const place = () => {
    let slot = 0;
    frames.forEach((f) => {
      f.slot = f.on ? slot++ : 0;
      const z = f.on ? -(START + f.slot * GAP) : -(START + N * GAP + 2000);
      f.z = z;
      const side = f.slot % 2 ? 1 : -1;
      f.el.style.transform = `translate3d(${f.x}px, ${f.y}px, ${z}px) rotateY(${-Math.sign(f.x || side) * 14}deg)`;
      f.el.querySelector('.wv-frame__num').textContent = String(f.slot + 1).padStart(2, '0');
    });
    M = Math.max(slot, 1); range = (M - 1) * GAP + START + 500;
    sec.style.height = `calc(100vh + ${Math.round(M * 52 + 120)}vh)`;
    $('wv-total').textContent = String(M).padStart(2, '0');
    active = -1;
  };
  const applyFilter = (f) => {
    filters.forEach((b) => { const on = b.dataset.filter === f; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    frames.forEach((fr) => { fr.on = f === 'all' || CATS[fr.i].split(' ').includes(f); });
    place(); scrollTo({ top: sec.offsetTop, behavior: reduce ? 'auto' : 'smooth' }); measure(); kick();
  };
  filters.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  place();

  window.addEventListener('scroll', () => { measure(); kick(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); kick(); });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; kick(); }, { passive: true });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) kick(); }).observe(sec);
  measure(); frame();
})();
