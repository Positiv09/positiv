# Positiv homepage (Webflow → code)

Static build of https://positiv.agency/hometest — plain HTML + modular CSS + vanilla JS, no build step.
Open `index.html` directly or serve the folder (`npx serve .`).

```
index.html            semantic markup, one <section data-section="…"> per block
css/tokens.css        colours, fonts, radii, layout vars (single source of truth)
css/base.css          reset, typography, .btn / .pill
css/nav.css           fixed header + mega-menu + mobile menu
css/sections.css      every section, in page order; responsive rules at the bottom
js/main.js            nav, hero word rotator, marquees, count-up, rails, video cursor/modal
assets/img|video|fonts  extracted from the live site (semantic filenames)
```

## Animation hooks (GSAP / ScrollTrigger / Lenis / Three.js)
| Hook | Use |
| --- | --- |
| `[data-section]` | scope for each ScrollTrigger |
| `[data-hero-media]` | swap for a `<canvas>` (WebGL) |
| `.feature-card` (`--sticky-top`) | stacked cards — currently CSS `position: sticky` |
| `[data-portfolio]` / `-viewport` / `-track` / `-progress` | pin + scrub horizontally (currently native scroll + drag) |
| `[data-video-stage]` / `[data-video-frame]` | sticky video; replace `<video>` with a 3D model canvas |
| `[data-count]` | stat numbers (IntersectionObserver count-up) |

GSAP/Lenis script tags are included commented-out at the bottom of `index.html`.

## Notes
- Client logos are `.logo-slot` placeholders (`data-logo="n"`) — replace with `<img>`/`<svg>`.
- Images in `assets/img` are the original (large) files; compress/convert to WebP before launch.
- Breakpoints mirror Webflow: 991 / 767 / 479 (max-width).
