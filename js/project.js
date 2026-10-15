/* Project page: one template, filled from the list below by ?p=<number> (matches the tile order on work2.html).
   Names, taglines, copy and quotes are placeholders - replace them (and the images) with the real projects. */
(() => {
  const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
    'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
  const P = [
    ['Angel East', 'Connecting founders with capital', ['Brand', 'Sales']],
    ['QuickPick', 'A logo built shape by shape', ['Brand']],
    ['Angel East', 'One identity, every partner', ['Brand']],
    ['Angel East', 'Built to be found', ['Web', 'Campaign']],
    ['Angel East', 'A system that scales', ['Brand system']],
    ['Angel East', 'Decks reps actually use', ['Sales assets']],
    ['Angel East', 'Positioning with teeth', ['Brand']],
    ['Angel East', 'Launch at deal speed', ['Campaign']],
    ['Angel East', 'Proposals that close', ['Sales']],
    ['Angel East', 'A site that sells', ['Web']],
    ['Angel East', 'The creative that keeps pipeline fed', ['Marketing']],
    ['Angel East', 'Co-branding without compromise', ['Brand']],
    ['Angel East', 'Battle cards, sharpened', ['Sales assets']],
    ['Angel East', 'Landing pages in a week', ['Web']],
  ];
  const BODY = [
    'Angel East connects entrepreneurs with investors and provides capital to help businesses grow and scale. We built the brand and the sales assets so every conversation starts from the same, confident story.',
    'The brief was simple: make the partner team look like one team, whoever is in the room. We built the templates, the rules and the library that keep it that way.',
  ];
  const QUOTE = ['Working with Positiv was a seamless experience from start to finish. Their team transformed complex ideas into visually compelling designs that elevated our brand presence.',
    'Positiv became more than a design partner - they became an extension of our team. Their deep understanding of our business, combined with outstanding creative execution, resulted in solutions that exceeded expectations.'];
  // per-project overrides: a clip for the hero, and its own intro copy
  const VIDEO = { 0: 'assets/video/tile-1.mp4', 1: 'assets/video/tile-2.mp4' };
  const OWN_BODY = { 0: ['Angel East is an investment firm focused on supporting innovative and high-potential companies. It connects entrepreneurs with investors and provides capital to help businesses grow and scale.',
    'We built the brand and the sales assets so every conversation, from the first call to the pitch deck, starts from the same confident story.'],
    1: ['QuickPick needed a mark that works at any size and moves well on screen. We built the logo from a small set of shapes and animated how it comes together.',
    'The same construction drives the static logo, the motion version and the rules for using them.'] };
  const WHO = [['Alexis Johnson', 'CEO of Light Node Ventures'], ['Mansour Al Derei', 'Trendz Podcast Host | Investor']];

  const $ = (s) => document.querySelector(s);
  const total = P.length;
  let id = parseInt(new URLSearchParams(location.search).get('p'), 10);
  if (!(id >= 1 && id <= total)) id = 1;
  const i = id - 1, p = P[i];
  const url = (n) => `assets/img/${IMG[((n % total) + total) % total]}`;

  document.title = `${p[0]} — ${p[1]} — Positiv`;
  $('#p-hero').style.backgroundImage = `url('${url(i)}')`;
  if (VIDEO[i]) {
    const v = document.createElement('video');
    v.src = VIDEO[i]; v.autoplay = v.loop = v.muted = v.playsInline = true; v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block';
    $('#p-hero').appendChild(v);
  }
  $('#p-name').textContent = p[0] + '™';
  $('#p-title').textContent = p[1];
  $('#p-tags').innerHTML = p[2].map((t) => `<li>${t}</li>`).join('');
  $('#p-more').innerHTML = (OWN_BODY[i] || BODY).map((t) => `<p>${t}</p>`).join('');
  const rm = $('#p-readmore'), more = $('#p-more');
  rm.addEventListener('click', () => {
    const open = more.hidden;
    more.hidden = !open; rm.setAttribute('aria-expanded', String(open));
    rm.firstChild.nodeValue = open ? 'Read less ' : 'Read more '; rm.lastElementChild.textContent = open ? '–' : '+';
  });
  document.querySelectorAll('[data-gal]').forEach((g, k) => { g.style.backgroundImage = `url('${url(i + 1 + k * 2)}')`; });
  $('#p-quote').textContent = QUOTE[i % 2];
  $('#p-who').textContent = WHO[i % 2][0]; $('#p-role').textContent = WHO[i % 2][1];

  // "View more work": every other project, numbered
  const rail = $('#p-rail');
  rail.innerHTML = P.map((q, k) => k === i ? '' : `<a class="p-card" href="project.html?p=${k + 1}" data-cursor="View" style="background-image:url('${url(k)}')"><span class="p-card__meta"><strong>${q[0]}</strong><em>${String(k + 1).padStart(2, '0')}/${total}</em></span></a>`).join('');
  const step = () => Math.max(rail.clientWidth * 0.8, 300);
  $('#p-prev').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#p-next').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  // drag the rail with the mouse (a drag never opens a card)
  let down = false, moved = 0, sx = 0, sl = 0;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 5) { rail.classList.add('is-dragging'); rail.scrollLeft = sl - dx; } });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => rail.classList.remove('is-dragging'), 0); });
  rail.addEventListener('click', (e) => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  rail.addEventListener('dragstart', (e) => e.preventDefault());
})();
