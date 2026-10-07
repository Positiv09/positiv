/* Project page: one template, filled from the list below by ?p=<number> (matches the tile order on work2.html).
   Names, taglines, copy and quotes are placeholders - replace them (and the images) with the real projects. */
(() => {
  const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
    'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
  const P = [
    ['Angel East', 'Connecting founders with capital', ['Brand', 'Sales']],
    ['Angel East', 'A product people want to open', ['Web']],
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
  const WHO = [['Alexis Johnson', 'CEO of Light Node Ventures'], ['Mansour Al Derei', 'Trendz Podcast Host | Investor']];

  const $ = (s) => document.querySelector(s);
  const total = P.length;
  let id = parseInt(new URLSearchParams(location.search).get('p'), 10);
  if (!(id >= 1 && id <= total)) id = 1;
  const i = id - 1, p = P[i];
  const url = (n) => `assets/img/${IMG[((n % total) + total) % total]}`;

  document.title = `${p[0]} — ${p[1]} — Positiv`;
  $('#p-hero').style.backgroundImage = `url('${url(i)}')`;
  $('#p-name').textContent = p[0] + '™';
  $('#p-title').textContent = p[1];
  $('#p-tags').innerHTML = p[2].map((t) => `<li>${t}</li>`).join('');
  $('#p-more').innerHTML = BODY.map((t) => `<p>${t}</p>`).join('');
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
})();
