/* Work (world): CSS-3D tunnel. Scroll = fly forward, mouse = look around, frames fade in from the fog and out behind the camera.
   Project data below is placeholder (14 tiles, same order as project.html?p=N). */
(() => {
  const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
    'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
  const CAT = ['Brand · Sales', 'Web', 'Brand', 'Web · Campaign', 'Brand system', 'Sales assets', 'Brand', 'Campaign', 'Sales', 'Web', 'Marketing', 'Brand', 'Sales assets', 'Web'];
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
    return { el, z, x, y };
  });
  const rings = Array.from({ length: Math.ceil(N * 0.9) }, (_, i) => {
    const s = rnd(520, 900), el = document.createElement('div'); el.className = 'wv-ring';
    el.style.cssText = `width:${s}px;height:${s}px;left:${-s / 2}px;top:${-s / 2}px;transform:translate3d(${rnd(-60, 60)}px,${rnd(-40, 40)}px,${-(START - 300 + i * GAP * 1.1)}px)`;
    world.appendChild(el); return { el, z: -(START - 300 + i * GAP * 1.1) };
  });
  const dots = Array.from({ length: small ? 60 : 130 }, () => {
    const s = rnd(2, 5), z = -rnd(100, N * GAP + 600), el = document.createElement('div');
    el.className = 'wv-dot' + (Math.random() < 0.3 ? ' wv-dot--lime' : '');
    el.style.cssText = `width:${s}px;height:${s}px;transform:translate3d(${rnd(-900, 900)}px,${rnd(-500, 500)}px,${z}px)`;
    world.appendChild(el); return { el, z, op: rnd(0.25, 0.9) };
  });
  const range = (N - 1) * GAP + START + 500;

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
      const eff = f.z + cam; f.el.style.opacity = fade(eff).toFixed(3);
      f.el.style.pointerEvents = eff > -2300 && eff < 150 ? 'auto' : 'none';
      const d = Math.abs(eff + 760); if (d < bestD) { bestD = d; best = i; }
    });
    rings.forEach((r) => { const e = r.z + cam; r.el.style.opacity = (fade(e) * 0.8).toFixed(3); });
    dots.forEach((d) => { const e = d.z + cam; d.el.style.opacity = (fade(e) * d.op).toFixed(3); });
    const p = clamp(cam / range, 0, 1);
    intro.style.opacity = clamp(1 - p * 14, 0, 1).toFixed(3); intro.style.transform = `translate(-50%, calc(-50% - ${(p * 900).toFixed(0)}px)) scale(${(1 + p * 6).toFixed(3)})`;
    hint.style.opacity = p > 0.06 ? 0.45 : 1;
    hud.bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (best !== active) { active = best; hud.num.textContent = String(best + 1).padStart(2, '0'); hud.name.textContent = 'Angel East'; hud.cat.textContent = CAT[best]; }
    if (Math.abs(target * range - cam) > 0.5 || Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  window.addEventListener('scroll', () => { measure(); kick(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); kick(); });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; kick(); }, { passive: true });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) kick(); }).observe(sec);
  measure(); frame();
})();
