/* Work (library): a walkable, realistic 3D library (Three.js). A long hall of floor-to-ceiling bookcases (one per category), rolling ladders, piles of books,
   a rug, an armchair and a lit arched door at the end. First-person camera: WASD / ZQSD / arrows, mouse look (click = pointer lock, drag works too), Shift = run.
   Look at a project book and click to take it, read it (4 spreads, page flips), put it back. Bump into the stacks of books and they collapse (simple rigid-body
   physics); the pendant lamps swing when you pass. The arched door leads back to the home page. Project data is placeholder (same order as project.html?p=N). */
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const stage = $('lib'), host = $('lib-canvas');
if (!stage || !host) throw new Error('no stage');

/* ---------------- data ---------------- */
const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
  'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
const CATS = ['brand', 'web', 'brand', 'web', 'brand', 'sales', 'brand', 'campaign', 'sales', 'web', 'campaign', 'brand', 'sales', 'web'];
const CAT_LABEL = { brand: 'Brand', sales: 'Sales', web: 'Web', campaign: 'Campaign' };
const TITLES = ['Connecting founders with capital', 'A product people want to open', 'One identity, every partner', 'Built to be found', 'A system that scales', 'Decks reps actually use',
  'Positioning with teeth', 'Launch at deal speed', 'Proposals that close', 'A site that sells', 'The creative that keeps pipeline fed', 'Co-branding without compromise', 'Battle cards, sharpened', 'Landing pages in a week'];
const BRIEF = 'A growing business with real ambition needed to look and sound like one team. Positioning, templates and assets had to be easy to use and impossible to get wrong.';
const APPROACH = 'We built the system around a clear narrative and a small set of rules, then turned it into the templates, decks and pages partners actually reach for.';
const OUTCOME = 'Partner teams now start from the same strong foundation. Conversations open with a consistent story and assets are produced in hours instead of weeks.';
const PROJECTS = IMG.map((img, i) => ({ i, img: `assets/img/${img}`, cat: CATS[i], name: 'Angel East', title: TITLES[i], href: `project.html?p=${i + 1}` }));
const BOOK_TITLES = ['The Art of Brand', 'Sales Fluency', 'Channel Craft', 'Typographic Systems', 'Atlas of Partners', 'Design & Deals', 'Field Notes', 'The Long Game', 'Quiet Authority',
  'Positioning', 'Visual Grammar', 'Pipeline', 'Case Studies', 'Brand Voice', 'Growth Loops', 'Pattern Language', 'The Manual', 'Co-Branding', 'First Impressions', 'Make It Land'];

/* ---------------- renderer ---------------- */
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { $('lib-fallback').hidden = false; $('lib-start').hidden = true; throw new Error('no webgl'); }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const FOG = 0x120d0a;
scene.background = new THREE.Color(FOG);
scene.fog = new THREE.FogExp2(FOG, 0.034);
const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 80);
camera.rotation.order = 'YXZ'; scene.add(camera);
const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

/* image based lighting: a tiny procedural "room" (dark, warm, a few bright windows) baked once into an environment map, so wood, brass and varnish reflect something */
{
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x1a120c })));
  [[0, 9, 0, 6, 0xffd9a8], [-8, 3, 0, 3, 0xffcf96], [8, 3, 2, 3, 0xffcf96], [0, 2, -9, 4, 0xfff3d6], [0, 4, 9, 2, 0x6f8fc9]].forEach(([x, y, z, s, c]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(5) })); m.position.set(x, y, z); env.add(m); });
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture; scene.environmentIntensity = 0.55; pm.dispose();
}

/* ---------------- procedural textures ---------------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const noise = (g, w, h, amp) => { const img = g.getImageData(0, 0, w, h); for (let i = 0; i < img.data.length; i += 4) { const nz = (Math.random() - 0.5) * amp; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz; } g.putImageData(img, 0, 0); };
const canvasTex = (w, h, draw, opts = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
};
const woodDraw = (base, planks) => (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const n = planks || 1, pw = w / n;
  for (let p = 0; p < n; p++) {
    const x0 = p * pw, tint = rnd(-18, 18);
    g.fillStyle = `rgba(${tint > 0 ? 255 : 0},${tint > 0 ? 200 : 0},${tint > 0 ? 140 : 0},${Math.abs(tint) / 85})`; g.fillRect(x0, 0, pw, h);
    for (let k = 0; k < 130; k++) {
      const x = x0 + rnd(0, pw);
      g.strokeStyle = `rgba(${Math.random() < 0.55 ? '24,12,6' : '255,225,180'},${rnd(0.03, 0.2)})`; g.lineWidth = rnd(0.5, 2.4);
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 64) g.lineTo(x + Math.sin(y * 0.012 + p * 3 + k) * rnd(1, 7), y); g.stroke();
    }
    if (planks) { g.fillStyle = 'rgba(8,4,2,.75)'; g.fillRect(x0, 0, 2.5, h); const cut = rnd(0.15, 0.85) * h; g.fillRect(x0, cut, pw, 2.5); }
  }
  noise(g, w, h, 10);
};
const woodTex = (base, repeat, planks) => canvasTex(1024, 1024, woodDraw(base, planks), { repeat });
const woodBump = (repeat, planks) => canvasTex(512, 512, (g, w, h) => { woodDraw('#808080', planks)(g, w, h); }, { repeat, linear: true });
const rugTex = () => canvasTex(512, 2048, (g, w, h) => {
  g.fillStyle = '#4a1a1c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#d9c9a0'; g.lineWidth = 5; g.strokeRect(14, 14, w - 28, h - 28); g.strokeStyle = '#1c2a3a'; g.lineWidth = 26; g.strokeRect(46, 46, w - 92, h - 92); g.strokeStyle = '#d9c9a0'; g.lineWidth = 3; g.strokeRect(80, 80, w - 160, h - 160);
  for (let y = 120; y < h - 100; y += 100) {
    g.save(); g.translate(w / 2, y + 50); g.rotate(Math.PI / 4); g.fillStyle = '#7a2a2d'; g.fillRect(-48, -48, 96, 96); g.strokeStyle = '#d9c9a0'; g.lineWidth = 3; g.strokeRect(-48, -48, 96, 96);
    g.fillStyle = '#1f3045'; g.fillRect(-30, -30, 60, 60); g.fillStyle = (y / 100) % 2 < 1 ? '#c9a14a' : '#7a2a2d'; g.fillRect(-14, -14, 28, 28); g.restore();
    g.fillStyle = 'rgba(217,201,160,.55)'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(120 + k * 45, y + 50, 5, 0, 7); g.fill(); g.beginPath(); g.arc(w - 120 - k * 45, y + 50, 5, 0, 7); g.fill(); }
  }
  noise(g, w, h, 30);
});
const wallTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#2a2f2a'; g.fillRect(0, 0, w, h); noise(g, w, h, 18);
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
}, { repeat: [10, 2] });
const labelTex = (text, sub, w = 1024, h = 300) => canvasTex(w, h, (g) => {
  const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#2a2420'); grd.addColorStop(1, '#161210'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9a14a'; g.lineWidth = 8; g.strokeRect(16, 16, w - 32, h - 32); g.strokeStyle = 'rgba(201,161,74,.4)'; g.lineWidth = 2; g.strokeRect(34, 34, w - 68, h - 68);
  g.fillStyle = '#f0f879'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${h * 0.4}px "Optima Nova", Georgia, serif`; g.fillText(text, w / 2, h * 0.45);
  g.fillStyle = '#b8a77a'; g.font = `500 ${h * 0.11}px Poppins, sans-serif`; g.fillText(sub, w / 2, h * 0.8);
});
const glowTex = (inner, outer) => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const beamTex = () => canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,236,196,0.9)'); gr.addColorStop(1, 'rgba(255,236,196,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h); });

/* spine atlas for the filler books: 32 x 4 spines, each 64 x 512 (UV offset per instance) */
const SP_COLS = 32, SP_ROWS = 4;
const spineAtlas = canvasTex(2048, 2048, (g) => {
  const cols = ['#5e2326', '#1f2c44', '#27422f', '#7a5a22', '#34343a', '#cfc4a8', '#17120f', '#53375a', '#7a3b20', '#1a3540', '#3d2a1e', '#8a2f2a'];
  for (let r = 0; r < SP_ROWS; r++) for (let c = 0; c < SP_COLS; c++) {
    const x = c * 64, y = r * 512, col = pick(cols);
    g.save(); g.beginPath(); g.rect(x, y, 64, 512); g.clip(); g.translate(x, y);
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = col; g.fillRect(0, 0, 64, 512); g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,235,200'},${rnd(0.02, 0.1)})`; g.fillRect(rnd(0, 64), rnd(0, 512), rnd(1, 3), rnd(6, 60)); }
    const gold = Math.random() < 0.7 ? '#c9a14a' : '#e8dfc4', band = (yy) => { g.fillStyle = gold; g.globalAlpha = 0.85; g.fillRect(0, yy, 64, 3); g.globalAlpha = 1; };
    band(26); band(34); band(512 - 40); band(512 - 32); if (Math.random() < 0.5) { band(190); band(198); }
    g.save(); g.translate(32, 256); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = gold; g.font = `${pick(['600', '500', '700'])} ${rnd(20, 27)}px "Optima Nova", Georgia, serif`; g.globalAlpha = 0.92;
    g.fillText(pick(BOOK_TITLES).toUpperCase(), 0, 0); g.restore(); g.restore();
  }
});

/* ---------------- materials ---------------- */
const M = {
  floor: new THREE.MeshPhysicalMaterial({ map: woodTex('#4a2f1c', [3.5, 12], 9), bumpMap: woodBump([3.5, 12], 9), bumpScale: 1.4, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.35, envMapIntensity: 0.9 }),
  wall: new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.94 }),
  wain: new THREE.MeshStandardMaterial({ map: woodTex('#33200f', [4, 1]), roughness: 0.55, envMapIntensity: 0.6 }),
  ceil: new THREE.MeshStandardMaterial({ color: 0x1e1814, roughness: 0.95 }),
  beam: new THREE.MeshStandardMaterial({ map: woodTex('#321f11', [3, 1]), bumpMap: woodBump([3, 1]), bumpScale: 1, roughness: 0.6 }),
  case: new THREE.MeshStandardMaterial({ map: woodTex('#5a3920', [2, 3]), bumpMap: woodBump([2, 3]), bumpScale: 1.2, roughness: 0.5, envMapIntensity: 0.7 }),
  caseIn: new THREE.MeshStandardMaterial({ color: 0x1c120b, roughness: 0.95 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.3, metalness: 0.9 }),
  rug: new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1 }),
  page: new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.95 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x4b2a22, roughness: 0.55 }),
  red: new THREE.MeshStandardMaterial({ color: 0x6e1f26, roughness: 0.88 }),
  pot: new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2f6b3d, roughness: 0.65 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x8c8474, roughness: 0.85 }),
};
const add = (parent, geo, mat, x = 0, y = 0, z = 0, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/* ---------------- the hall ---------------- */
const RX = 4.2, RZ = 12, RH = 5.6;
add(scene, new THREE.PlaneGeometry(RX * 2, RZ * 2), M.floor, 0, 0, 0, false, true).rotation.x = -Math.PI / 2;
add(scene, new THREE.PlaneGeometry(RX * 2, RZ * 2), M.ceil, 0, RH, 0, false, true).rotation.x = Math.PI / 2;
const wallPanel = (w, x, z, ry, plain) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  add(g, new THREE.PlaneGeometry(w, RH), M.wall, 0, RH / 2, 0, false, true);
  if (!plain) { add(g, box(w, 1.1, 0.05), M.wain, 0, 0.55, 0.03, false, true); add(g, box(w, 0.07, 0.09), M.case, 0, 1.12, 0.05, false, true); add(g, box(w, 0.14, 0.07), M.case, 0, 0.07, 0.04, false, true); }
  add(g, box(w, 0.22, 0.16), M.case, 0, RH - 0.11, 0.08, false, true);
  return g;
};
wallPanel(RX * 2, 0, -RZ, 0); wallPanel(RX * 2, 0, RZ, Math.PI); wallPanel(RZ * 2, -RX, 0, Math.PI / 2, true); wallPanel(RZ * 2, RX, 0, -Math.PI / 2, true);
for (let z = -10.5; z <= 11; z += 3) add(scene, box(RX * 2, 0.3, 0.3), M.beam, 0, RH - 0.15, z);
for (const x of [-2.8, 0, 2.8]) add(scene, box(0.22, 0.22, RZ * 2), M.beam, x, RH - 0.11, 0, true, false);
add(scene, new THREE.PlaneGeometry(2.7, 15), M.rug, 0, 0.012, -2.2, false, true).rotation.x = -Math.PI / 2;
const rug2 = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1 })); rug2.rotation.x = -Math.PI / 2; rug2.position.set(-1.6, 0.016, 3.4); rug2.receiveShadow = true; scene.add(rug2);

/* ---------------- bookcases ---------------- */
const BC_W = 5.6, BC_H = 5.0, BC_D = 0.5, NLEV = 9, LEV = (k) => 0.2 + k * 0.52, PROJ_LEVEL = 3;
const cases = {}; const decorCases = []; const colliders = []; const projectBooks = [];
const bookcase = (cat, x, z, ry, decor) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  add(g, box(0.08, BC_H, BC_D), M.case, -BC_W / 2 + 0.04, BC_H / 2, 0); add(g, box(0.08, BC_H, BC_D), M.case, BC_W / 2 - 0.04, BC_H / 2, 0);
  add(g, box(BC_W, 0.08, BC_D), M.case, 0, BC_H - 0.04, 0); add(g, box(BC_W + 0.1, 0.1, BC_D + 0.1), M.case, 0, BC_H + 0.05, 0.03); add(g, box(BC_W + 0.18, 0.16, BC_D + 0.16), M.case, 0, BC_H + 0.18, 0.05);
  add(g, box(BC_W, BC_H, 0.03), M.caseIn, 0, BC_H / 2, -BC_D / 2 + 0.015, false, true); add(g, box(BC_W + 0.06, 0.18, BC_D + 0.06), M.case, 0, 0.09, 0.02);
  for (let k = 0; k < NLEV; k++) { const y = LEV(k); add(g, box(BC_W - 0.16, 0.05, BC_D - 0.02), M.case, 0, y - 0.025, 0); add(g, box(BC_W - 0.16, 0.012, 0.012), M.brass, 0, y + 0.004, BC_D / 2 - 0.012, false, false); }
  for (let d = 1; d < 3; d++) add(g, box(0.05, BC_H - 0.2, BC_D - 0.04), M.case, -BC_W / 2 + (BC_W / 3) * d, BC_H / 2, 0);
  g.updateMatrixWorld(true); if (decor) decorCases.push(g); else cases[cat] = g;
  const wm = new THREE.Box3().setFromObject(g); colliders.push({ minX: wm.min.x - 0.28, maxX: wm.max.x + 0.28, minZ: wm.min.z - 0.28, maxZ: wm.max.z + 0.28 });
  return g;
};
const wx = -RX + BC_D / 2 + 0.03, ex = RX - BC_D / 2 - 0.03;
bookcase('brand', wx, -8.5, Math.PI / 2); bookcase('web', wx, -2.8, Math.PI / 2);
bookcase('sales', ex, -8.5, -Math.PI / 2); bookcase('campaign', ex, -2.8, -Math.PI / 2);
[3.0, 8.8].forEach((z) => { bookcase('', wx, z, Math.PI / 2, true); bookcase('', ex, z, -Math.PI / 2, true); });

/* hanging aisle signs (perpendicular to the wall, readable while walking down the hall) */
Object.entries(cases).forEach(([cat, g]) => {
  const side = g.position.x < 0 ? 1 : -1, sg = new THREE.Group(); sg.position.set(g.position.x + side * 1.0, 3.55, g.position.z); scene.add(sg);
  const tex = labelTex(CAT_LABEL[cat].toUpperCase(), 'LIBRARY OF WORK');
  const faceM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0x2a2406, emissiveMap: tex, emissiveIntensity: 0.7 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x2a1b12, roughness: 0.6 });
  add(sg, new THREE.BoxGeometry(0.05, 0.42, 1.5), edge, 0, 0, 0);
  [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42), faceM); p.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; p.position.x = s * 0.028; sg.add(p); });
  add(sg, box(1.0, 0.03, 0.04), M.brass, -side * 0.5, 0.2, 0.55); add(sg, box(1.0, 0.03, 0.04), M.brass, -side * 0.5, 0.2, -0.55);
});

/* a project book (standing on a shelf) with its own spine */
const PB = { w: 0.066, h: 0.4, d: 0.26 };
const spineTex = (p, color) => canvasTex(128, 640, (g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h); noise(g, w, h, 14);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f0f879'; g.fillRect(0, 36, w, 8); g.fillRect(0, h - 44, w, 8); g.fillRect(0, 54, w, 3); g.fillRect(0, h - 58, w, 3);
  g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
  const light = color === '#cfc4a8'; g.fillStyle = light ? '#211d1d' : '#f2f2ed'; g.font = '600 46px "Optima Nova", Georgia, serif'; g.fillText('Angel East', 0, -8);
  g.fillStyle = light ? '#4a4646' : '#f0f879'; g.font = '500 20px Poppins, sans-serif'; g.fillText(`${CAT_LABEL[p.cat].toUpperCase()}  ·  ${String(p.i + 1).padStart(2, '0')}`, 0, 30); g.restore();
});
const projectBook = (p, color) => {
  const g = new THREE.Group();
  const spine = new THREE.MeshStandardMaterial({ map: spineTex(p, color), roughness: 0.5, emissive: 0x000000, envMapIntensity: 0.8 });
  const cover = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const b = new THREE.Mesh(box(PB.w, PB.h, PB.d), [cover, cover, M.page, M.page, spine, M.page]); b.castShadow = true; b.receiveShadow = true; g.add(b);
  g.userData = { project: p, spine, base: 0, home: null };
  return g;
};
const COLORS = ['#25324a', '#6b2a2c', '#2c4a3a', '#5a3a5e', '#16120f', '#cfc4a8'];

/* filler books: ONE instanced mesh, per-instance spine from the atlas (vertex shader tweak), slight leans and gaps */
const fillerGeo = box(1, 1, 1);
const MAXF = 8200;
const cellAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAXF * 2), 2); fillerGeo.setAttribute('aCell', cellAttr);
const spineMat = new THREE.MeshStandardMaterial({ map: spineAtlas, roughness: 0.55, envMapIntensity: 0.7 });
spineMat.onBeforeCompile = (sh) => {
  sh.vertexShader = 'attribute vec2 aCell;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = uv * vec2(' + (1 / SP_COLS).toFixed(6) + ', ' + (1 / SP_ROWS).toFixed(6) + ') + aCell;\n#endif');
};
const coverFill = new THREE.MeshStandardMaterial({ color: 0x2a1f1a, roughness: 0.7 });
const fillerInst = new THREE.InstancedMesh(fillerGeo, [coverFill, coverFill, M.page, M.page, spineMat, M.page], MAXF); fillerInst.castShadow = true; fillerInst.receiveShadow = true; fillerInst.frustumCulled = false;
let fi = 0; const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
const fillCase = (g, mine) => {
  for (let li = 0; li < NLEV; li++) {
    const y = LEV(li), x0 = -BC_W / 2 + 0.1, x1 = BC_W / 2 - 0.1; let x = x0;
    const proj = li === PROJ_LEVEL ? mine.slice() : [];
    const slots = proj.map((_, k) => x0 + 0.5 + ((x1 - x0 - 1.0) / Math.max(proj.length, 1)) * (k + 0.5));
    while (x < x1 - 0.05 && fi < MAXF - 1) {
      const slot = slots.findIndex((s, k) => !proj[k].placed && Math.abs(s - x) < 0.1);
      if (slot >= 0) {
        const p = proj[slot]; p.placed = true;
        const bk = projectBook(p, COLORS[p.i % COLORS.length]); bk.position.set(x + PB.w / 2, y + 0.025 + PB.h / 2, 0.02); g.add(bk); bk.userData.base = bk.position.z; bk.userData.home = bk.position.clone();
        projectBooks.push(bk); x += PB.w + 0.012; continue;
      }
      const t = rnd(0.028, 0.08), h = rnd(0.24, 0.45), d = rnd(0.18, 0.28);
      if (x + t > x1) break;
      if (Math.random() < 0.045) { x += rnd(0.1, 0.3); continue; }
      const lean = Math.random() < 0.03 ? rnd(-0.16, 0.16) : 0;
      tmpP.set(x + t / 2, y + 0.025 + h / 2, 0.01 + (0.24 - d) * 0.3); tmpQ.setFromEuler(new THREE.Euler(0, 0, lean)); tmpS.set(t, h, d);
      tmpM.compose(tmpP, tmpQ, tmpS).premultiply(g.matrixWorld); fillerInst.setMatrixAt(fi, tmpM);
      const cell = (Math.random() * SP_COLS * SP_ROWS) | 0; cellAttr.setXY(fi, (cell % SP_COLS) / SP_COLS, 1 - (Math.floor(cell / SP_COLS) + 1) / SP_ROWS);
      fi++; x += t + rnd(0.0, 0.006);
    }
  }
};
Object.entries(cases).forEach(([cat, g]) => fillCase(g, PROJECTS.filter((p) => p.cat === cat)));
decorCases.forEach((g) => fillCase(g, []));
fillerInst.count = fi; fillerInst.instanceMatrix.needsUpdate = true; cellAttr.needsUpdate = true; scene.add(fillerInst);
scene.updateMatrixWorld(true);

/* rolling ladders, leaning on four of the bookcases */
const ladder = (g, lx) => {
  const l = new THREE.Group(); l.position.set(lx, 0, BC_D / 2 + 0.16); l.rotation.x = -0.1; g.add(l);
  [-0.23, 0.23].forEach((x) => add(l, box(0.045, 4.4, 0.035), M.case, x, 2.2, 0));
  for (let k = 0; k < 14; k++) add(l, box(0.46, 0.035, 0.06), M.case, 0, 0.35 + k * 0.3, 0.02);
  add(l, box(0.07, 0.07, 0.07), M.brass, -0.23, 4.45, -0.03); add(l, box(0.07, 0.07, 0.07), M.brass, 0.23, 4.45, -0.03);
  add(g, box(BC_W - 0.3, 0.025, 0.025), M.brass, 0, 4.5, BC_D / 2 + 0.04, false, false);
};
ladder(cases.web, -0.9); ladder(cases.campaign, 1.2); if (decorCases[0]) ladder(decorCases[0], 0.6); if (decorCases[3]) ladder(decorCases[3], -1.0);

/* ---------------- furniture, plants, lamps ---------------- */
const dust = []; const pendants = [];
{
  const t = new THREE.Group(); t.position.set(1.4, 0, 2.2); scene.add(t);
  add(t, new THREE.CylinderGeometry(0.7, 0.7, 0.06, 36), M.case, 0, 0.78, 0); add(t, new THREE.CylinderGeometry(0.1, 0.16, 0.74, 14), M.case, 0, 0.37, 0); add(t, new THREE.CylinderGeometry(0.4, 0.46, 0.05, 28), M.case, 0, 0.025, 0);
  add(t, box(0.3, 0.04, 0.2), M.leather, -0.2, 0.83, 0.15); add(t, box(0.28, 0.025, 0.2), M.page, -0.2, 0.865, 0.15).rotation.y = 0.2; add(t, box(0.26, 0.05, 0.18), M.red, 0.1, 0.84, -0.2).rotation.y = -0.4;
  const lamp = new THREE.Group(); lamp.position.set(0.25, 0.81, 0.15); t.add(lamp);
  add(lamp, new THREE.CylinderGeometry(0.07, 0.09, 0.03, 20), M.brass, 0, 0.015, 0); add(lamp, new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), M.brass, 0, 0.19, 0);
  add(lamp, new THREE.CylinderGeometry(0.1, 0.16, 0.16, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f6b4a, side: THREE.DoubleSide, emissive: 0x3a9a6a, emissiveIntensity: 0.7, roughness: 0.5 }), 0, 0.4, 0, false, false);
  const bulb = new THREE.PointLight(0xffd38a, 5, 5, 2); bulb.position.set(1.65, 1.25, 2.35); scene.add(bulb);
  colliders.push({ minX: 0.55, maxX: 2.25, minZ: 1.35, maxZ: 3.05 });
  const c = new THREE.Group(); c.position.set(-1.65, 0, 3.4); c.rotation.y = 0.7; scene.add(c);
  add(c, box(0.95, 0.3, 0.9), M.red, 0, 0.32, 0); add(c, box(0.95, 0.62, 0.22), M.red, 0, 0.7, -0.34); add(c, box(0.18, 0.42, 0.9), M.red, -0.5, 0.5, 0); add(c, box(0.18, 0.42, 0.9), M.red, 0.5, 0.5, 0); add(c, box(0.72, 0.1, 0.66), M.red, 0, 0.5, 0.06);
  [[-0.42, -0.4], [0.42, -0.4], [-0.42, 0.4], [0.42, 0.4]].forEach(([a, b]) => add(c, box(0.06, 0.18, 0.06), M.case, a, 0.09, b));
  colliders.push({ minX: -2.3, maxX: -1.0, minZ: 2.7, maxZ: 4.1 });
  [[-3.5, 11.0], [3.5, 11.0], [-3.5, -11.0], [3.5, -11.0]].forEach(([x, z]) => {
    const pl = new THREE.Group(); pl.position.set(x, 0, z); scene.add(pl);
    add(pl, new THREE.CylinderGeometry(0.26, 0.2, 0.5, 16), M.pot, 0, 0.25, 0);
    for (let i = 0; i < 14; i++) { const l = add(pl, new THREE.SphereGeometry(rnd(0.14, 0.26), 8, 6), M.leaf, rnd(-0.24, 0.24), 0.75 + rnd(0, 0.8), rnd(-0.24, 0.24)); l.scale.set(1, rnd(0.6, 1.4), 1); }
    colliders.push({ minX: x - 0.42, maxX: x + 0.42, minZ: z - 0.42, maxZ: z + 0.42 });
  });
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd89a, emissiveIntensity: 2.4 });
  const shadeM = new THREE.MeshStandardMaterial({ color: 0x1f3a2c, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.5 });
  [[0, 8.2], [0, 3.2], [0, -2.0], [0, -7.0]].forEach(([x, z], i) => {
    const root = new THREE.Group(); root.position.set(x, RH, z); scene.add(root);
    const sw = new THREE.Group(); root.add(sw);
    add(sw, new THREE.CylinderGeometry(0.01, 0.01, 1.2, 6), M.brass, 0, -0.6, 0, false, false);
    add(sw, new THREE.ConeGeometry(0.36, 0.28, 24, 1, true), shadeM, 0, -1.3, 0, true, false).rotation.x = Math.PI;
    add(sw, new THREE.SphereGeometry(0.08, 12, 10), bulbM, 0, -1.34, 0, false, false);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,214,150,.55)', 'rgba(255,214,150,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.scale.set(1.5, 1.5, 1); halo.position.set(0, -1.36, 0); sw.add(halo);
    const pl = new THREE.PointLight(0xffc27a, 20, 11, 2); pl.position.set(0, -1.45, 0); sw.add(pl);
    pendants.push({ root: sw, light: pl, ang: 0, vel: 0, base: 20, phase: i * 1.7, x, z });
  });
  scene.add(new THREE.HemisphereLight(0xffe6c4, 0x2a1d14, 0.55));
}

/* moonlight / daylight shafts from two skylights: shadow-casting spots + faint additive beams + floating dust */
let dustPoints = null;
{
  const beam = beamTex();
  [[0.4, 5.5, 0xcfe0ff], [-0.2, -4.6, 0xffe2b0]].forEach(([x, z, col]) => {
    const sp = new THREE.SpotLight(col, 130, 14, 0.36, 0.55, 1.2); sp.position.set(x, RH - 0.1, z); sp.target.position.set(x * 0.4, 0, z - 0.6); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -0.0004; sp.shadow.radius = 4; scene.add(sp, sp.target);
    add(scene, box(1.6, 0.06, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.2), toneMapped: false }), x, RH - 0.03, z, false, false);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 2.0, RH - 0.1, 28, 1, true), new THREE.MeshBasicMaterial({ map: beam, color: col, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    cone.position.set(x * 0.7, (RH - 0.1) / 2, z - 0.3); scene.add(cone);
  });
  const N = 520, pos = new Float32Array(N * 3), mt = glowTex('rgba(255,236,200,1)', 'rgba(255,236,200,0)');
  for (let i = 0; i < N; i++) { pos[i * 3] = rnd(-3.4, 3.4); pos[i * 3 + 1] = rnd(0.2, RH - 0.3); pos[i * 3 + 2] = rnd(-11, 11); dust.push({ s: rnd(0.04, 0.2), p: rnd(0, 7) }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustPoints = new THREE.Points(geo, new THREE.PointsMaterial({ map: mt, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false })); dustPoints.frustumCulled = false; scene.add(dustPoints);
}

/* ---------------- the arched exit door (north end) ---------------- */
const door = { hingeL: null, hingeR: null, open: 0, opening: false, root: new THREE.Group() };
{
  const g = door.root; g.position.set(0, 0, -RZ + 0.03); scene.add(g);
  const archShape = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h); s.absarc(0, h, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); return s; };
  const glow = canvasTex(256, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fffdf0'); gr.addColorStop(1, '#ffe7b0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const lightGeo = new THREE.ShapeGeometry(archShape(1.9, 2.2)); const uv = lightGeo.attributes.uv, ps = lightGeo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (ps.getX(i) + 0.95) / 1.9, ps.getY(i) / 3.15);
  g.add(new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ map: glow, toneMapped: false, fog: false })));
  const outer = archShape(2.4, 2.4), hole = new THREE.Path(); hole.moveTo(-0.97, 0); hole.lineTo(-0.97, 2.2); hole.absarc(0, 2.2, 0.97, Math.PI, 0, true); hole.lineTo(0.97, 0); hole.lineTo(-0.97, 0); outer.holes.push(hole);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.34, bevelEnabled: false }), M.stone); frame.castShadow = true; frame.receiveShadow = true; frame.userData.isDoorFrame = true; g.add(frame);
  const mk = (sx) => { const h = new THREE.Group(); h.position.set(sx * 0.97, 0, 0.18); g.add(h);
    add(h, box(0.97, 2.2, 0.06), M.case, -sx * 0.485, 1.1, 0); add(h, box(0.7, 0.8, 0.02), M.wain, -sx * 0.485, 1.55, 0.04); add(h, box(0.7, 0.5, 0.02), M.wain, -sx * 0.485, 0.55, 0.04); add(h, new THREE.SphereGeometry(0.035, 12, 10), M.brass, -sx * 0.88, 1.05, 0.07);
    h.traverse((o) => { if (o.isMesh) o.userData.isDoor = true; }); return h; };
  door.hingeL = mk(-1); door.hingeR = mk(1);
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(512, 170, (c, w, h) => { c.fillStyle = '#10261a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f0f879'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#f0f879'; c.font = '700 96px Poppins, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EXIT', w / 2, h / 2 + 4); }) }));
  exitSign.position.set(0, 3.15, 0.36); g.add(exitSign);
  const dl = new THREE.PointLight(0xffefc8, 26, 14, 1.6); dl.position.set(0, 1.6, -RZ + 1.4); scene.add(dl);
  const bloom = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,244,214,.75)', 'rgba(255,244,214,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); bloom.scale.set(6, 6, 1); bloom.position.set(0, 1.6, 0.5); g.add(bloom);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5), new THREE.MeshBasicMaterial({ map: beamTex(), color: 0xffe3a8, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.02, 2.6); g.add(spill);
}

/* ---------------- loose books + stacks with simple rigid-body physics ---------------- */
const loose = []; const stacks = [];
{
  const BW = 0.2, BH = 0.045, BD = 0.29;
  const tops = ['#25324a', '#6b2a2c', '#2c4a3a', '#5a3a5e', '#7a5a22', '#34343a', '#8a2f2a'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const mkBook = (w, h, d, mat) => { const m = new THREE.Mesh(box(w, h, d), [mat, mat, M.page, mat, mat, M.page]); m.castShadow = true; m.receiveShadow = true; return m; };
  [[-2.7, 7.2, 9], [2.6, 5.4, 11], [-2.8, -0.8, 7], [2.7, 0.6, 12], [-0.2, -9.6, 8], [-2.6, 10.2, 6], [0.6, 6.3, 5]].forEach(([sx, sz, n], si) => {
    const stack = { cx: sx, cz: sz, books: [], fallen: false }; let y = 0;
    for (let k = 0; k < n; k++) {
      const h = BH * rnd(0.8, 1.7), w = BW * rnd(0.8, 1.1), d = BD * rnd(0.85, 1.1), m = mkBook(w, h, d, tops[(si + k) % tops.length]);
      m.position.set(sx + rnd(-0.03, 0.03), y + h / 2 + 0.02, sz + rnd(-0.03, 0.03)); m.rotation.y = rnd(-0.35, 0.35); scene.add(m); y += h;
      const b = { mesh: m, h, vel: new THREE.Vector3(), ang: new THREE.Vector3(), free: false, flat: false, ofs: rnd(0, 0.008) }; stack.books.push(b); loose.push(b);
    }
    stacks.push(stack);
  });
  for (let k = 0; k < 7; k++) { const h = BH * 1.3, m = mkBook(BW, h, BD, tops[k % 7]); m.position.set(rnd(-2.6, 2.6), h / 2 + 0.015, rnd(-9, 9)); m.rotation.y = rnd(0, 7); scene.add(m); loose.push({ mesh: m, h, vel: new THREE.Vector3(), ang: new THREE.Vector3(), free: false, flat: true, ofs: 0.01 }); }
}

/* ---------------- player ---------------- */
const player = { pos: new THREE.Vector3(0, 1.65, 9.6), yaw: 0, pitch: 0, vel: new THREE.Vector3() };
const keys = {};
const BOUNDS = { minX: -RX + 0.9, maxX: RX - 0.9, minZ: -RZ + 0.75, maxZ: RZ - 0.75 };
let locked = false, mode = 'start', reading = null, last = performance.now();
const syncCam = (bob = 0) => { camera.position.set(player.pos.x, player.pos.y + bob, player.pos.z); camera.rotation.y = player.yaw; camera.rotation.x = player.pitch; };
syncCam();
const collide = (nx, nz) => {
  nx = Math.min(Math.max(nx, BOUNDS.minX), BOUNDS.maxX); nz = Math.min(Math.max(nz, BOUNDS.minZ), BOUNDS.maxZ);
  for (const c of colliders) if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) {
    const dx = Math.min(nx - c.minX, c.maxX - nx), dz = Math.min(nz - c.minZ, c.maxZ - nz);
    if (dx < dz) nx = nx - c.minX < c.maxX - nx ? c.minX : c.maxX; else nz = nz - c.minZ < c.maxZ - nz ? c.minZ : c.maxZ;
  }
  return [nx, nz];
};

/* physics: bumping a stack topples it; books fall under gravity, bounce a little, slide with friction and settle flat */
const GRAV = -9.8;
const bump = (st, dirx, dirz, speed) => {
  if (st.fallen) return; st.fallen = true;
  st.books.forEach((b, k) => { b.free = true; b.flat = false; const f = 1.2 + speed * 0.5 + k * 0.06; b.vel.set(dirx * f + rnd(-0.7, 0.7), 1.0 + rnd(0, 1.6), dirz * f + rnd(-0.7, 0.7)); b.ang.set(rnd(-4, 4), rnd(-5, 5), rnd(-4, 4)); });
};
const stepPhysics = (dt) => {
  const sp = Math.hypot(player.vel.x, player.vel.z);
  stacks.forEach((st) => { const dx = st.cx - player.pos.x, dz = st.cz - player.pos.z, d = Math.hypot(dx, dz); if (!st.fallen && d < 0.62 && sp > 0.5) bump(st, dx / (d || 1), dz / (d || 1), sp); });
  loose.forEach((b) => {
    const m = b.mesh, dx = m.position.x - player.pos.x, dz = m.position.z - player.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.5 && sp > 0.5 && (b.flat || b.free)) { b.free = true; b.flat = false; const f = 0.8 + sp * 0.5; b.vel.set((dx / (d || 1)) * f, 0.5 + rnd(0, 0.8), (dz / (d || 1)) * f); b.ang.set(rnd(-3, 3), rnd(-4, 4), rnd(-3, 3)); }
    if (!b.free) return;
    b.vel.y += GRAV * dt; m.position.addScaledVector(b.vel, dt);
    m.rotation.x += b.ang.x * dt; m.rotation.y += b.ang.y * dt; m.rotation.z += b.ang.z * dt;
    const floor = b.h / 2 + 0.014 + b.ofs;
    if (m.position.y <= floor) {
      m.position.y = floor; if (b.vel.y < -0.6) { b.vel.y *= -0.28; b.vel.x *= 0.7; b.vel.z *= 0.7; b.ang.multiplyScalar(0.55); } else b.vel.y = 0;
      const fr = Math.exp(-dt * 6.5); b.vel.x *= fr; b.vel.z *= fr; b.ang.multiplyScalar(Math.exp(-dt * 7));
      if (b.vel.lengthSq() < 0.02 && b.ang.lengthSq() < 0.05) { b.free = false; b.flat = true; b.vel.set(0, 0, 0); b.ang.set(0, 0, 0); }
      m.rotation.x += (Math.round(m.rotation.x / Math.PI) * Math.PI - m.rotation.x) * Math.min(dt * 8, 1); m.rotation.z += (Math.round(m.rotation.z / Math.PI) * Math.PI - m.rotation.z) * Math.min(dt * 8, 1);
    }
    m.position.x = Math.min(Math.max(m.position.x, -RX + 0.8), RX - 0.8); m.position.z = Math.min(Math.max(m.position.z, -RZ + 0.6), RZ - 0.6);
  });
};

/* ---------------- input ---------------- */
const SENS = 0.0022;
const look = (dx, dy) => { player.yaw -= dx * SENS; player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - dy * SENS)); };
const canvas = renderer.domElement;
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; if (!locked && mode === 'play') setMode('paused'); if (locked && mode !== 'reading') setMode('play'); });
document.addEventListener('mousemove', (e) => { if (locked && mode === 'play') look(e.movementX, e.movementY); });
let drag = null;
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; drag = { x: e.clientX, y: e.clientY }; });
window.addEventListener('pointermove', (e) => { if (!drag || locked || mode !== 'play') return; look(e.clientX - drag.x, e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; });
window.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('click', (e) => {
  if (mode === 'start' || mode === 'paused') return;
  if (!locked && mode === 'play' && e.pointerType !== 'touch') { try { canvas.requestPointerLock(); } catch (er) { /* ignore */ } }
  if (mode === 'play') interact();
});
canvas.addEventListener('wheel', (e) => { if (mode === 'play') e.preventDefault(); }, { passive: false });
const keyName = (e) => ({ KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' }[e.code]);
window.addEventListener('keydown', (e) => {
  if (mode === 'reading') {
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); flip(1); } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); flip(-1); } else if (e.code === 'Escape') closeBook();
    return;
  }
  if (mode !== 'play') return;
  const k = keyName(e); if (k) { keys[k] = true; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); interact(); }
});
window.addEventListener('keyup', (e) => { const k = keyName(e); if (k) keys[k] = false; });
window.addEventListener('blur', () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); });
const touch = { move: null, look: null, vx: 0, vz: 0 };
const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
if (isTouch) {
  stage.classList.add('is-touch');
  canvas.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { if (t.clientX < innerWidth / 2 && !touch.move) touch.move = { id: t.identifier, x: t.clientX, y: t.clientY }; else if (!touch.look) touch.look = { id: t.identifier, x: t.clientX, y: t.clientY }; } e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { touch.vx = Math.max(-1, Math.min(1, (t.clientX - touch.move.x) / 60)); touch.vz = Math.max(-1, Math.min(1, (t.clientY - touch.move.y) / 60)); }
    else if (touch.look && t.identifier === touch.look.id) { look((t.clientX - touch.look.x) * 1.6, (t.clientY - touch.look.y) * 1.6); touch.look.x = t.clientX; touch.look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (touch.move && t.identifier === touch.move.id) { touch.move = null; touch.vx = touch.vz = 0; } if (touch.look && t.identifier === touch.look.id) touch.look = null; } });
}

/* ---------------- interaction ---------------- */
const ray = new THREE.Raycaster(); ray.far = 3.4;
const targets = [...projectBooks, door.root];
let aimed = null;
const label = $('lib-label'), labelCat = $('lib-label-cat'), labelName = $('lib-label-name'), labelHint = $('lib-label-hint');
const aim = () => {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObjects(targets, true);
  let found = null;
  for (const h of hits) {
    if (h.object.userData.isDoor || h.object.userData.isDoorFrame) { found = { type: 'door' }; break; }
    let o = h.object; while (o && !o.userData.project) o = o.parent;
    if (o) { found = { type: 'book', obj: o }; break; }
  }
  if (aimed?.type === 'book' && (!found || found.obj !== aimed.obj)) aimed.obj.userData.spine.emissive.set(0x000000);
  aimed = found;
  if (found?.type === 'book') { found.obj.userData.spine.emissive.set(0x3d4010); const p = found.obj.userData.project; labelCat.textContent = CAT_LABEL[p.cat]; labelName.textContent = `${p.name} — ${p.title}`; labelHint.textContent = isTouch ? 'Tap Take' : 'Click to take the book'; }
  else if (found?.type === 'door') { labelCat.textContent = 'Exit'; labelName.textContent = 'Back to the home page'; labelHint.textContent = isTouch ? 'Tap Take' : 'Click to open the door'; }
  label.classList.toggle('is-on', !!found && mode === 'play'); $('lib-take').classList.toggle('is-on', !!found && mode === 'play' && isTouch);
};
const interact = () => { if (!aimed || mode !== 'play') return; if (aimed.type === 'door') return openDoor(); openBook(aimed.obj); };
const openDoor = () => { if (door.opening) return; door.opening = true; mode = 'leaving'; stage.classList.add('is-leaving'); setTimeout(() => { location.href = 'index.html'; }, 2400); };

/* ---------------- the reader (open book in hand) ---------------- */
const reader = new THREE.Group(); reader.visible = false; camera.add(reader);
const READ = { pos: new THREE.Vector3(0, -0.08, -0.7), rotX: -0.42 };
const pageGeo = new THREE.PlaneGeometry(0.34, 0.47);
const pageMat = () => new THREE.MeshBasicMaterial({ color: 0xf4f0e6, toneMapped: false, fog: false });
let leftP, rightP, leafF, leafB, leaf;
{
  add(reader, box(0.78, 0.53, 0.03), M.leather, 0, 0, -0.025, false, false);
  add(reader, box(0.37, 0.5, 0.022), M.page, -0.185, 0, -0.005, false, false); add(reader, box(0.37, 0.5, 0.022), M.page, 0.185, 0, -0.005, false, false);
  leftP = new THREE.Mesh(pageGeo, pageMat()); leftP.position.set(-0.175, 0, 0.007); reader.add(leftP);
  rightP = new THREE.Mesh(pageGeo, pageMat()); rightP.position.set(0.175, 0, 0.007); reader.add(rightP);
  leaf = new THREE.Group(); leaf.position.set(0, 0, 0.009); reader.add(leaf);
  leafF = new THREE.Mesh(pageGeo, pageMat()); leafF.position.set(0.175, 0, 0.002); leaf.add(leafF);
  leafB = new THREE.Mesh(pageGeo, pageMat()); leafB.position.set(0.175, 0, -0.002); leafB.rotation.y = Math.PI; leaf.add(leafB);
  leaf.visible = false;
}
const imgCache = {};
const loadImg = (src) => imgCache[src] || (imgCache[src] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
const wrap = (g, text, x, y, maxW, lh) => { const words = text.split(' '); let line = ''; for (const w of words) { const t = line + w + ' '; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); line = w + ' '; y += lh; } else line = t; } g.fillText(line, x, y); return y + lh; };
const pageCanvas = (draw) => canvasTex(800, 1104, (g, w, h) => {
  g.fillStyle = '#efe7d3'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  noise(g, w, h, 8); g.fillStyle = '#211d1d'; draw(g, w, h);
});
const cover = (g, im, x, y, w, h) => { if (!im) { g.fillStyle = '#ccc'; g.fillRect(x, y, w, h); return; } const s = Math.max(w / im.width, h / im.height); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s); g.restore(); };
const spreadsFor = async (p) => {
  const im = await loadImg(p.img), im2 = await loadImg(`assets/img/${IMG[(p.i + 3) % IMG.length]}`), im3 = await loadImg(`assets/img/${IMG[(p.i + 6) % IMG.length]}`);
  const head = (g, t) => { g.fillStyle = '#6d6d68'; g.font = '500 26px Poppins, sans-serif'; g.fillText(t.toUpperCase(), 70, 100); g.fillStyle = '#c9a14a'; g.fillRect(70, 116, 90, 6); g.fillStyle = '#211d1d'; };
  return [
    [pageCanvas((g, w, h) => { cover(g, im, 40, 40, w - 80, h - 80); }),
     pageCanvas((g, w, h) => { head(g, `${CAT_LABEL[p.cat]} · ${String(p.i + 1).padStart(2, '0')}`); g.font = '600 92px "Optima Nova", Georgia, serif'; let y = wrap(g, p.name, 70, 300, w - 140, 100); g.font = '400 40px Poppins, sans-serif'; g.fillStyle = '#4a4646'; y = wrap(g, p.title, 70, y + 20, w - 140, 54); g.font = '400 28px Poppins, sans-serif'; g.fillStyle = '#6d6d68'; g.fillText('Positiv · 2026 · Case study', 70, h - 90); })],
    [pageCanvas((g, w, h) => { head(g, 'The brief'); g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillText('The Brief', 70, 240); g.font = '400 34px Poppins, sans-serif'; g.fillStyle = '#4a4646'; wrap(g, BRIEF, 70, 320, w - 140, 52); }),
     pageCanvas((g, w, h) => { head(g, 'The approach'); g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillText('The Approach', 70, 240); g.font = '400 34px Poppins, sans-serif'; g.fillStyle = '#4a4646'; wrap(g, APPROACH, 70, 320, w - 140, 52); })],
    [pageCanvas((g, w, h) => { cover(g, im2, 40, 40, w - 80, (h - 120) / 2); cover(g, im3, 40, 40 + (h - 120) / 2 + 40, w - 80, (h - 120) / 2); }),
     pageCanvas((g, w, h) => { head(g, 'The outcome'); g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillText('The Outcome', 70, 240); g.font = '400 34px Poppins, sans-serif'; g.fillStyle = '#4a4646'; wrap(g, OUTCOME, 70, 320, w - 140, 52); g.fillStyle = '#211d1d'; g.fillRect(70, h - 190, w - 140, 78); g.fillStyle = '#f0f879'; g.font = '600 32px Poppins, sans-serif'; g.fillText('Open the full project  →', 100, h - 140); })],
  ];
};
let spreadIdx = 0, spreads = null, flipping = false;
const setSpread = (k) => { leftP.material.map = spreads[k][0]; rightP.material.map = spreads[k][1]; leftP.material.needsUpdate = rightP.material.needsUpdate = true; spreadIdx = k; $('lib-page').textContent = `${k + 1} / ${spreads.length}`; $('lib-prev').disabled = k === 0; $('lib-next').disabled = k === spreads.length - 1; };
const flip = (dir) => {
  if (!spreads || flipping) return; const to = spreadIdx + dir; if (to < 0 || to >= spreads.length) return; flipping = true;
  const fm = leafF.material, bm = leafB.material;
  if (dir > 0) { fm.map = spreads[spreadIdx][1]; bm.map = spreads[to][0]; rightP.material.map = spreads[to][1]; }
  else { fm.map = spreads[to][1]; bm.map = spreads[spreadIdx][0]; leftP.material.map = spreads[to][0]; }
  fm.needsUpdate = bm.needsUpdate = leftP.material.needsUpdate = rightP.material.needsUpdate = true;
  leaf.visible = true; const t0 = performance.now(), from = dir > 0 ? 0 : -Math.PI, goal = dir > 0 ? -Math.PI : 0;
  const step = (now) => { const t = Math.min((now - t0) / 650, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; leaf.rotation.y = from + (goal - from) * e; leaf.position.z = 0.009 + Math.sin(e * Math.PI) * 0.05;
    if (t < 1) requestAnimationFrame(step); else { leaf.visible = false; setSpread(to); flipping = false; } };
  requestAnimationFrame(step);
};
const openBook = async (bk) => {
  const p = bk.userData.project; mode = 'reading'; reading = bk; aimed = null; label.classList.remove('is-on'); $('lib-take').classList.remove('is-on');
  if (document.pointerLockElement) document.exitPointerLock();
  stage.classList.add('is-reading'); $('lib-read-title').textContent = `${p.name} — ${p.title}`; $('lib-read-cat').textContent = CAT_LABEL[p.cat]; $('lib-open').href = p.href;
  spreads = await spreadsFor(p); setSpread(0);
  reader.visible = true; reader.userData.t0 = performance.now(); reader.userData.from = camera.worldToLocal(bk.getWorldPosition(new THREE.Vector3()));
  reader.position.copy(reader.userData.from); reader.scale.setScalar(0.25); reader.rotation.set(READ.rotX, 0.6, 0.4);
  bk.visible = false;
};
const closeBook = () => {
  if (mode !== 'reading') return;
  if (reading) reading.visible = true; reading = null; reader.visible = false; stage.classList.remove('is-reading'); mode = 'paused'; setMode('paused');
};
$('lib-prev').addEventListener('click', () => flip(-1)); $('lib-next').addEventListener('click', () => flip(1)); $('lib-close').addEventListener('click', closeBook);
$('lib-take').addEventListener('click', interact);
$('lib-open').addEventListener('click', () => { stage.classList.add('is-leaving'); });

/* ---------------- start / pause overlay ---------------- */
function setMode(m) {
  mode = m; stage.dataset.mode = m;
  const start = $('lib-start');
  if (m === 'play') start.classList.add('is-hidden'); else if (m !== 'reading' && m !== 'leaving') { start.classList.remove('is-hidden'); $('lib-start-btn').textContent = m === 'paused' ? 'Resume' : 'Enter the library'; }
}
$('lib-start-btn').addEventListener('click', () => {
  Object.keys(keys).forEach((k) => { keys[k] = false; }); setMode('play');
  if (!isTouch) { try { canvas.requestPointerLock(); } catch (e) { /* drag-look still works */ } }
});
setMode('start');

/* ---------------- loop ---------------- */
const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
window.addEventListener('resize', resize); resize();
let bobT = 0, onScreen = true, clock = 0;
if ('IntersectionObserver' in window) new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; }).observe(stage);
const dustArr = dustPoints.geometry.attributes.position;
const tick = (now) => {
  requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!onScreen || document.hidden) return;
  clock += dt;
  for (let i = 0; i < dust.length; i++) { const d = dust[i]; let y = dustArr.getY(i) - d.s * dt * 0.35; if (y < 0.1) y = RH - 0.4; dustArr.setY(i, y); dustArr.setX(i, dustArr.getX(i) + Math.sin(clock * 0.3 + d.p) * dt * 0.05); dustArr.setZ(i, dustArr.getZ(i) + Math.cos(clock * 0.25 + d.p) * dt * 0.05); }
  dustArr.needsUpdate = true;
  pendants.forEach((p) => {
    const dx = player.pos.x - p.x, dz = player.pos.z - p.z; if (mode === 'play' && Math.hypot(dx, dz) < 1.2 && Math.hypot(player.vel.x, player.vel.z) > 0.8) p.vel += (Math.random() - 0.4) * dt * 3.2;
    p.vel += (-p.ang * 9 - p.vel * 0.6) * dt; p.ang += p.vel * dt; p.root.rotation.x = p.ang * 0.7 + Math.sin(clock * 0.6 + p.phase) * 0.012; p.root.rotation.z = p.ang * 0.4;
    p.light.intensity = p.base * (0.96 + Math.sin(clock * 7 + p.phase) * 0.012 + Math.sin(clock * 3.1 + p.phase * 2) * 0.018);
  });
  stepPhysics(dt);
  if (mode === 'play') {
    const f = (keys.f ? 1 : 0) - (keys.b ? 1 : 0) - touch.vz, s = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + touch.vx;
    const speed = (keys.run ? 4.3 : 2.4), sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
    const wx = (-sin * f + cos * s), wz = (-cos * f - sin * s), len = Math.hypot(wx, wz) || 1;
    const tvx = f || s ? (wx / len) * speed : 0, tvz = f || s ? (wz / len) * speed : 0;
    player.vel.x += (tvx - player.vel.x) * Math.min(dt * 9, 1); player.vel.z += (tvz - player.vel.z) * Math.min(dt * 9, 1);
    const [nx, nz] = collide(player.pos.x + player.vel.x * dt, player.pos.z + player.vel.z * dt); player.pos.x = nx; player.pos.z = nz;
    const moving = Math.hypot(player.vel.x, player.vel.z); bobT += dt * (keys.run ? 11 : 8) * Math.min(moving, 2) / 2;
    syncCam(Math.sin(bobT) * 0.02 * Math.min(moving / 2, 1)); aim();
  } else if (mode === 'reading') {
    const t = Math.min((performance.now() - reader.userData.t0) / 900, 1), e = 1 - Math.pow(1 - t, 3);
    reader.position.lerpVectors(reader.userData.from, READ.pos, e); reader.scale.setScalar(0.25 + 0.75 * e); reader.rotation.set(READ.rotX * e + (1 - e) * 0.3, (1 - e) * 0.6, (1 - e) * 0.4); syncCam();
  } else if (mode === 'leaving') {
    door.open = Math.min(door.open + dt / 1.5, 1); const e = 1 - Math.pow(1 - door.open, 3);
    door.hingeL.rotation.y = e * Math.PI * 0.62; door.hingeR.rotation.y = -e * Math.PI * 0.62;
    player.pos.z = Math.max(player.pos.z - dt * 1.1, -RZ + 1.4); syncCam();
  } else if (mode === 'start') {
    const t = now / 1000; player.yaw = Math.sin(t * 0.12) * 0.22; player.pitch = -0.015; player.pos.set(Math.sin(t * 0.1) * 0.3, 1.65, 9.6); syncCam();
  }
  renderer.render(scene, camera);
};
requestAnimationFrame(tick);
(document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 40px "Optima Nova"'), document.fonts.load('500 20px Poppins')]).catch(() => {}) : Promise.resolve()).then(() => { $('lib-loading').classList.add('is-done'); });

/* tiny hook for manual testing from the console */
window.__lib = { player, camera, scene, projectBooks, loose, stacks, door, setMode, interact, aim, openBook, flip, get mode() { return mode; },
  face(i) { const b = projectBooks[i]; const v = b.getWorldPosition(new THREE.Vector3()); const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion())); player.pos.set(v.x + dir.x * 1.4, 1.65, v.z + dir.z * 1.4); const dx = v.x - player.pos.x, dz = v.z - player.pos.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(v.y - player.pos.y, Math.hypot(dx, dz)); syncCam(); } };
