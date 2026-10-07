/* Project page (cards layout): one template filled by ?p=<number> (same order as the cards on work3.html). Placeholder content - replace with real projects. */
(() => {
  const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
    'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
  const P = [
    ['Angel East', 'Investment', ['Brand', 'Sales']], ['Angel East', 'SaaS', ['Web']], ['Angel East', 'Finance', ['Brand']], ['Angel East', 'Retail', ['Web', 'Campaign']],
    ['Angel East', 'Technology', ['Brand system']], ['Angel East', 'Technology', ['Sales assets']], ['Angel East', 'Investment', ['Brand']], ['Angel East', 'Retail', ['Campaign']],
    ['Angel East', 'Finance', ['Sales']], ['Angel East', 'SaaS', ['Web']], ['Angel East', 'Technology', ['Marketing']], ['Angel East', 'Investment', ['Brand']],
    ['Angel East', 'Technology', ['Sales assets']], ['Angel East', 'SaaS', ['Web']]];
  const LEAD = 'A bold, confident brand built for the channel: one story, applied the same way by every partner team, from the first deck to the last campaign.';
  const BRIEF = 'A growing business with genuine ambition needed to look and sound like one team. Positioning, templates and assets had to be easy to use and impossible to get wrong.';
  const APPROACH = 'We built the system around a clear narrative and a small set of rules, then turned it into the templates, decks and pages partners actually reach for. Motion and detail stay in service of the message.';
  const OUTCOME = 'Partner teams now start from the same strong foundation. Conversations open with a consistent story, assets are produced in hours instead of weeks, and the brand finally feels like it belongs to everyone using it.';
  const ABOUT = 'The project brings together brand, sales and digital work into one coherent system. Each deliverable is designed to be reused: master decks, battle cards, landing pages and campaign kits that keep partners on message while leaving room for their own voice.';
  const PAGES = ['Home', 'Services', 'Case studies', 'Contact'];
  const FEATURES = ['Brand guidelines', 'Master deck system', 'Template library', 'Landing pages', 'Co-branding kit'];

  const $ = (s) => document.querySelector(s);
  const total = P.length;
  let id = parseInt(new URLSearchParams(location.search).get('p'), 10);
  if (!(id >= 1 && id <= total)) id = 1;
  const i = id - 1, p = P[i];
  const url = (n) => `assets/img/${IMG[((n % total) + total) % total]}`;

  document.title = `${p[0]} — Positiv`;
  $('#q-title').textContent = p[0];
  $('#q-lead').textContent = LEAD;
  $('#q-industry').textContent = p[1]; $('#q-year').textContent = '2026'; $('#q-pages').textContent = String(PAGES.length); $('#q-platform').textContent = 'Webflow';
  $('#q-shots').innerHTML = [0, 1, 2, 3].map((k) => `<div class="q-shot" style="background-image:url('${url(i + k)}')"></div>`).join('');
  $('#q-brief').textContent = BRIEF; $('#q-approach').textContent = APPROACH; $('#q-outcome').textContent = OUTCOME; $('#q-about').textContent = ABOUT;
  $('#q-pageslist').innerHTML = PAGES.map((t) => `<li>${t}</li>`).join('');
  $('#q-features').innerHTML = FEATURES.map((t) => `<li>${t}</li>`).join('');
  const others = [1, 2, 3].map((k) => (i + k) % total);
  $('#q-more').innerHTML = others.map((k) => `<a class="q-mcard" href="project3.html?p=${k + 1}"><span class="q-mcard__img" style="background-image:url('${url(k)}')"></span><strong>${P[k][0]}</strong><span>${P[k][1]}</span></a>`).join('');
})();
