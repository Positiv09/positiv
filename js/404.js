/* 404: the light behind the digits follows the mouse, eased so it glides rather than snaps.
   Until the mouse moves (and on touch screens) the CSS loop plays; when the mouse leaves the window the loop takes over again. */
(() => {
  const glow = document.querySelector('.e4__glow');
  if (!glow || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let tx = 37, ty = 40, x = 37, y = 40, raf = 0, following = false;

  const tick = () => {
    x += (tx - x) * 0.09;
    y += (ty - y) * 0.09;
    glow.style.setProperty('--gx', x.toFixed(2) + '%');
    glow.style.setProperty('--gy', y.toFixed(2) + '%');
    raf = Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : 0;
  };

  const follow = (e) => {
    const r = glow.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 100;
    ty = ((e.clientY - r.top) / r.height) * 100;
    if (!following) {
      // start from where the loop's light is right now, so the switch has no jump
      const cs = getComputedStyle(glow);
      x = parseFloat(cs.getPropertyValue('--gx')) || x;
      y = parseFloat(cs.getPropertyValue('--gy')) || y;
      following = true;
      glow.classList.add('is-following');
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const release = () => {
    following = false;
    cancelAnimationFrame(raf); raf = 0;
    glow.classList.remove('is-following');
    glow.style.removeProperty('--gx');
    glow.style.removeProperty('--gy');
  };

  window.addEventListener('pointermove', follow, { passive: true });
  document.documentElement.addEventListener('mouseleave', release);
  window.addEventListener('blur', release);
})();
