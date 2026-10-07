/* Project page (classic style): one template filled by ?p=<1..7> - 1 is the featured project, 2..7 follow the cards on work.html. Placeholder content. */
(() => {
  const P = [
    { img: 'portfolio-fig.webp', cat: 'Investment', scope: 'Brand & sales assets', tag: 'story.', title: 'Connecting founders with the capital to scale', lead: 'Angel East is an investment firm focused on supporting innovative and high-potential companies. It connects entrepreneurs with investors and provides capital to help businesses grow and scale.', ind: 'Investment', fmt: 'Ongoing partnership' },
    { img: 'portfolio-2.webp', cat: 'Brand system', scope: 'Brand system', tag: 'identity.', title: 'One identity, every partner', lead: 'A brand system built for the room, not the award show: one identity, applied the same way by every partner team.', ind: 'Technology', fmt: 'Foundation' },
    { img: 'portfolio-1.jpg', cat: 'Sales assets', scope: 'Sales assets', tag: 'decks.', title: 'Decks reps actually use', lead: "Twelve years on sales floors tells us what wins deals, and what doesn't. Reps abandon master decks when they're built for show.", ind: 'SaaS', fmt: 'Embedded team' },
    { img: 'service-web.jpg', cat: 'Digital experience', scope: 'Website & campaign', tag: 'site.', title: 'Built to be found', lead: "A partner-facing site that answers the buyer's next question before they have to ask it.", ind: 'Finance', fmt: 'Foundation' },
    { img: 'portfolio-3.webp', cat: 'Sales assets', scope: 'Pitch & proposals', tag: 'proposals.', title: 'Proposals that close', lead: 'Pitch and proposal systems that reps adopt by name and refresh every quarter.', ind: 'Technology', fmt: 'Embedded team' },
    { img: 'service-brand.webp', cat: 'Brand system', scope: 'Guidelines & co-branding', tag: 'guidelines.', title: 'Co-branding without compromise', lead: 'Guidelines, templates and co-branding kits that keep channel partners on-message.', ind: 'Retail', fmt: 'Foundation' },
    { img: 'service-marketing.webp', cat: 'Digital experience', scope: 'Landing pages & campaigns', tag: 'launch.', title: 'Landing pages in a week', lead: 'Landing pages and campaign hubs for partner launches, shipped fast and kept current.', ind: 'SaaS', fmt: 'Embedded team' },
  ];
  const IMGS = ['hero-b.jpg', 'hero-d.jpg', 'hero-e.jpg', 'hero-g.png', 'hero-h.png', 'hero-c.jpg', 'portfolio-1.jpg', 'portfolio-2.webp'];
  const BRIEF = 'A growing business with real ambition needed to look and sound like one team. Positioning, templates and assets had to be easy to use and impossible to get wrong.';
  const APPROACH = 'We built the system around a clear narrative and a small set of rules, then turned it into the templates, decks and pages partners actually reach for.';
  const OUTCOME = 'Partner teams now start from the same strong foundation. Conversations open with a consistent story and assets are produced in hours instead of weeks.';
  const QUOTE = ['Working with Positiv was a seamless experience from start to finish. Their team transformed complex ideas into visually compelling designs that elevated our brand presence.', 'Positiv became more than a design partner - they became an extension of our team.'];
  const WHO = [['Alexis Johnson', 'CEO of Light Node Ventures'], ['Mansour Al Derei', 'Trendz Podcast Host | Investor']];
  const $ = (id) => document.getElementById(id), n = P.length;
  let id = parseInt(new URLSearchParams(location.search).get('p'), 10); if (!(id >= 1 && id <= n)) id = 1;
  const i = id - 1, p = P[i], img = (f) => `assets/img/${f}`;
  document.title = `Angel East — ${p.title} — Positiv`;
  $('k-cat').textContent = p.cat; $('k-name').textContent = 'Angel East'; $('k-tag').textContent = p.tag; $('k-lead').textContent = p.lead;
  $('k-facts').innerHTML = [['Project', p.title], ['Industry', p.ind], ['Scope', p.scope], ['Format', p.fmt], ['Year', '2026']].map(([a, b]) => `<div class="k-fact"><dt>${a}</dt><dd>${b}</dd></div>`).join('');
  $('k-cover').style.backgroundImage = `url('${img(p.img)}')`;
  $('k-brief').textContent = BRIEF; $('k-approach').textContent = APPROACH; $('k-outcome').textContent = OUTCOME;
  $('k-gallery').innerHTML = [0, 1, 2, 3].map((k) => `<div class="k-shot rv" style="background-image:url('${img(IMGS[(i * 2 + k) % IMGS.length])}')"></div>`).join('');
  const q = i % 2; $('k-quote').textContent = QUOTE[q]; $('k-who').textContent = WHO[q][0]; $('k-role').textContent = WHO[q][1];
  $('k-more').innerHTML = [1, 2, 3].map((d) => { const k = (i + d) % n, o = P[k]; return `<a class="k-card rv" href="project1.html?p=${k + 1}"><span class="k-card__img" style="background-image:url('${img(o.img)}')"></span><span class="k-card__cat">${o.cat}</span><strong>${o.title}</strong><span class="k-card__go">View project</span></a>`; }).join('');

  const items = [...document.querySelectorAll('.rv')];
  if (!('IntersectionObserver' in window)) items.forEach((e) => e.classList.add('is-in'));
  else { const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12 }); items.forEach((e, k) => { e.style.transitionDelay = `${(k % 3) * 90}ms`; io.observe(e); }); }
})();
