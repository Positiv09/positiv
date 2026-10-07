/* "View all projects" opens a small chooser: Classic grid (work.html) or Mosaic (work2.html). Without JS the button simply goes to work.html. */
(() => {
  const btn = document.querySelector('.portfolio__all');
  const dlg = document.getElementById('work-chooser');
  if (!btn || !dlg) return;
  let opener = null;
  const open = () => {
    opener = document.activeElement;
    dlg.classList.add('is-open'); dlg.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('chooser-open');
    dlg.querySelector('.wc__opt')?.focus();
  };
  const close = () => {
    dlg.classList.remove('is-open'); dlg.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('chooser-open');
    opener?.focus?.();
  };
  btn.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); open(); });
  dlg.addEventListener('click', (e) => { if (e.target.closest('[data-wc-close]')) close(); });
  document.addEventListener('keydown', (e) => {
    if (!dlg.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {                                   // keep focus inside the dialog
      const f = [...dlg.querySelectorAll('a, button')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
})();
