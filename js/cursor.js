/* Round "View" cursor: over any element with data-cursor="Label" the mouse pointer turns into a lime circle with that label (same idea as the
   "Play video +" ball on the home page). Mouse only; touch devices and reduced-motion users keep the normal pointer. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ball = document.createElement('div');
  ball.className = 'view-cursor'; ball.setAttribute('aria-hidden', 'true');
  ball.innerHTML = '<span></span>';
  document.body.appendChild(ball);
  const label = ball.firstChild;
  let x = -100, y = -100, cx = x, cy = y, on = false, raf = 0;
  const draw = () => {
    cx += (x - cx) * (reduce ? 1 : 0.22); cy += (y - cy) * (reduce ? 1 : 0.22);
    ball.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${on ? 1 : 0})`;
    raf = (Math.abs(x - cx) > 0.3 || Math.abs(y - cy) > 0.3) ? requestAnimationFrame(draw) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    const t = e.target.closest && e.target.closest('[data-cursor]');
    if (t) { label.textContent = t.dataset.cursor; if (!on) { cx = x; cy = y; } }
    if (!!t !== on) { on = !!t; ball.classList.toggle('is-on', on); document.documentElement.classList.toggle('cursor-view', on); }
    kick();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { on = false; ball.classList.remove('is-on'); document.documentElement.classList.remove('cursor-view'); kick(); });
})();
