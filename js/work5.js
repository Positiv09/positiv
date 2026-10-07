/* Work (library): a walkable 3D reading room (Three.js, photographic PBR textures). Five bookcases: Brand, Web (left wall), Sales, Campaign (right wall) and a
   "Coming soon" one beside the exit door. Our projects are the pale, cool-coloured books on one board of each case (random positions); every other book is dark and says
   "Coming soon" when you look at it. Click a project book: it comes off the shelf into your hands with the project picture as its cover; open it (the cover really swings
   open), flip through the pages (images + information), close it and put it back. First person: WASD / ZQSD / arrows, mouse look (click = pointer lock, drag works), Shift = run.
   The arched door leads back home. Project data below is placeholder (same order as project.html?p=N). */
import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from './vendor/jsm/geometries/RoundedBoxGeometry.js';

const $ = (id) => document.getElementById(id);
const stage = $('lib'), host = $('lib-canvas');
if (!stage || !host) throw new Error('no stage');

/* ---------------- data ---------------- */
const IMG = ['portfolio-fig.webp', 'hero-b.jpg', 'portfolio-2.webp', 'service-web.jpg', 'hero-g.png', 'portfolio-1.jpg', 'service-brand.webp',
  'hero-d.jpg', 'portfolio-3.webp', 'hero-h.png', 'service-marketing.webp', 'hero-e.jpg', 'service-sales.jpg', 'hero-c.jpg'];
const CATS = ['brand', 'web', 'brand', 'web', 'brand', 'sales', 'brand', 'campaign', 'sales', 'web', 'campaign', 'brand', 'sales', 'web'];
const CAT_LABEL = { brand: 'Brand', sales: 'Sales', web: 'Web', campaign: 'Campaign', soon: 'Coming soon' };
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const FOG = 0x0f0b09;
scene.background = new THREE.Color(FOG);
scene.fog = new THREE.FogExp2(FOG, 0.045);
const camera = new THREE.PerspectiveCamera(66, 1, 0.04, 60);
camera.rotation.order = 'YXZ'; scene.add(camera);
const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

/* image based lighting from a tiny baked room, so wood, brass and leather reflect something believable */
{
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x1b130d })));
  [[0, 9, 0, 6, 0xffd9a8], [-8, 3, 0, 3, 0xffcf96], [8, 3, 2, 3, 0xffcf96], [0, 2, -9, 4, 0xfff3d6], [0, 4, 9, 2, 0x7a98cc]].forEach(([x, y, z, s, c]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(5) })); m.position.set(x, y, z); env.add(m); });
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture; scene.environmentIntensity = 0.5; pm.dispose();
}

/* ---------------- textures ---------------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const noise = (g, w, h, amp) => { const img = g.getImageData(0, 0, w, h); for (let i = 0; i < img.data.length; i += 4) { const nz = (Math.random() - 0.5) * amp; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz; } g.putImageData(img, 0, 0); };
const canvasTex = (w, h, draw, opts = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
};
const loader = new THREE.TextureLoader();
const photo = (url, repeat, srgb) => { const t = loader.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = maxAniso; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
const pbr = (name, repeat, extra = {}) => new THREE.MeshStandardMaterial({ map: photo(`assets/tex/${name}_diff.jpg`, repeat, true), normalMap: photo(`assets/tex/${name}_nor_gl.jpg`, repeat), roughnessMap: photo(`assets/tex/${name}_rough.jpg`, repeat), roughness: 1, ...extra });
const rugTex = () => canvasTex(512, 1536, (g, w, h) => {
  g.fillStyle = '#4a1a1c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#cdbf98'; g.lineWidth = 5; g.strokeRect(14, 14, w - 28, h - 28); g.strokeStyle = '#1c2a3a'; g.lineWidth = 26; g.strokeRect(46, 46, w - 92, h - 92); g.strokeStyle = '#cdbf98'; g.lineWidth = 3; g.strokeRect(80, 80, w - 160, h - 160);
  for (let y = 120; y < h - 100; y += 100) { g.save(); g.translate(w / 2, y + 50); g.rotate(Math.PI / 4); g.fillStyle = '#7a2a2d'; g.fillRect(-48, -48, 96, 96); g.strokeStyle = '#cdbf98'; g.lineWidth = 3; g.strokeRect(-48, -48, 96, 96); g.fillStyle = '#1f3045'; g.fillRect(-30, -30, 60, 60); g.fillStyle = '#9a7a3a'; g.fillRect(-14, -14, 28, 28); g.restore(); }
  for (let i = 0; i < 6; i++) noise(g, w, h, 18);
});
const labelTex = (text, sub, w = 1024, h = 300) => canvasTex(w, h, (g) => {
  const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#241d18'); grd.addColorStop(1, '#14100d'); g.fillStyle = grd; g.fillRect(0, 0, w, h); noise(g, w, h, 10);
  g.strokeStyle = '#a98a4a'; g.lineWidth = 7; g.strokeRect(16, 16, w - 32, h - 32); g.strokeStyle = 'rgba(169,138,74,.4)'; g.lineWidth = 2; g.strokeRect(34, 34, w - 68, h - 68);
  g.fillStyle = '#d8e4ec'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${h * 0.4}px "Optima Nova", Georgia, serif`; g.fillText(text, w / 2, h * 0.45);
  g.fillStyle = '#a89c80'; g.font = `500 ${h * 0.11}px Poppins, sans-serif`; g.fillText(sub, w / 2, h * 0.8);
});
const glowTex = (inner, outer) => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const beamTex = () => canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,236,196,0.9)'); gr.addColorStop(1, 'rgba(255,236,196,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h); });

const pageEdge = canvasTex(32, 128, (g, w, h) => { g.fillStyle = '#d3cab3'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(90,70,40,${0.05 + Math.random() * 0.14})`; g.fillRect(0, y, w, 1); } }, { repeat: [1, 2] });
const aoTex = canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

/* dark spine atlas for the "coming soon" books: 32 x 4 spines (64 x 512 each); the vertex shader picks one per instance */
const SP_COLS = 32, SP_ROWS = 4;
const spineAtlas = canvasTex(2048, 2048, (g) => {
  const cols = ['#1d1612', '#261b15', '#1a1f1b', '#2b1e1b', '#15171c', '#2a231c', '#1f1a22', '#32251b', '#171210', '#201a16'];
  for (let r = 0; r < SP_ROWS; r++) for (let c = 0; c < SP_COLS; c++) {
    const x = c * 64, y = r * 512, col = pick(cols);
    g.save(); g.beginPath(); g.rect(x, y, 64, 512); g.clip(); g.translate(x, y);
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)');
    g.fillStyle = col; g.fillRect(0, 0, 64, 512); g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,235,200'},${rnd(0.02, 0.08)})`; g.fillRect(rnd(0, 64), rnd(0, 512), rnd(1, 3), rnd(6, 70)); }
    const gold = Math.random() < 0.6 ? '#86693a' : '#9a8f78', band = (yy) => { g.fillStyle = gold; g.globalAlpha = 0.7; g.fillRect(0, yy, 64, 3); g.globalAlpha = 1; };
    band(28); band(36); band(512 - 40); band(512 - 32);
    g.save(); g.translate(32, 256); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = gold; g.font = `${pick(['600', '500'])} ${rnd(19, 25)}px "Optima Nova", Georgia, serif`; g.globalAlpha = 0.8;
    g.fillText(pick(BOOK_TITLES).toUpperCase(), 0, 0); g.restore(); g.restore();
  }
});

/* ---------------- materials ---------------- */
const M = {
  floor: pbr('floor', [3.4, 6], { envMapIntensity: 0.8, color: 0xb8aa9c }),
  wall: pbr('wall', [3, 1.2], { color: 0x6f716a }),
  wood: pbr('wood', [1, 1], { color: 0xcbb8a4, envMapIntensity: 0.7 }),
  woodLong: pbr('wood', [3, 0.5], { color: 0xcbb8a4, envMapIntensity: 0.7 }),
  caseIn: new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.95 }),
  ceil: new THREE.MeshStandardMaterial({ color: 0x1b1612, roughness: 0.95 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb08d45, roughness: 0.32, metalness: 0.9 }),
  rug: pbr('carpet', [1.1, 4.5], { color: 0xc58585 }),
  page: new THREE.MeshStandardMaterial({ map: pageEdge, color: 0xf2ead4, roughness: 0.95 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x3a2018, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0x5e1a20, roughness: 0.9 }),
  pot: new THREE.MeshStandardMaterial({ color: 0x7a4f34, roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2c5a38, roughness: 0.65 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x8c8474, roughness: 0.85 }),
};
const add = (parent, geo, mat, x = 0, y = 0, z = 0, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/* ---------------- the room (half the size of before) ---------------- */
const RX = 3.4, RZ = 6, RH = 4.2;
add(scene, new THREE.PlaneGeometry(RX * 2, RZ * 2), M.floor, 0, 0, 0, false, true).rotation.x = -Math.PI / 2;
add(scene, new THREE.PlaneGeometry(RX * 2, RZ * 2), M.ceil, 0, RH, 0, false, true).rotation.x = Math.PI / 2;
const wallPanel = (w, x, z, ry, plain) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  add(g, new THREE.PlaneGeometry(w, RH), M.wall, 0, RH / 2, 0, false, true);
  if (!plain) { add(g, box(w, 1.05, 0.05), M.woodLong, 0, 0.525, 0.03, false, true); add(g, box(w, 0.06, 0.08), M.wood, 0, 1.06, 0.05, false, true); add(g, box(w, 0.13, 0.06), M.wood, 0, 0.065, 0.04, false, true); }
  add(g, box(w, 0.2, 0.14), M.wood, 0, RH - 0.1, 0.07, false, true);
  return g;
};
wallPanel(RX * 2, 0, -RZ, 0); wallPanel(RX * 2, 0, RZ, Math.PI); wallPanel(RZ * 2, -RX, 0, Math.PI / 2, true); wallPanel(RZ * 2, RX, 0, -Math.PI / 2, true);
for (let z = -4.5; z <= 5; z += 3) add(scene, box(RX * 2, 0.26, 0.26), M.woodLong, 0, RH - 0.13, z);
add(scene, new THREE.PlaneGeometry(2.1, 9), M.rug, 0, 0.01, -0.3, false, true).rotation.x = -Math.PI / 2;

/* ---------------- real 3D models (Poly Haven, CC0): loader ---------------- */
const gltfLoader = new GLTFLoader();
const loadModel = (id, height) => new Promise((res) => gltfLoader.load(`assets/models/${id}/${id}_1k.gltf`, (g) => {
  const o = g.scene, bb0 = new THREE.Box3().setFromObject(o), localH = bb0.max.y - bb0.min.y, s = height / localH;
  o.scale.setScalar(s); o.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(o); o.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  const w = new THREE.Group(); w.add(o);
  o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach((x) => { x.envMapIntensity = 0.85; }); } });
  w.userData = { scale: s, localH, size: new THREE.Vector3().subVectors(bb.max, bb.min) }; res(w);
}, undefined, () => res(null)));

/* ---------------- bookcases ---------------- */
const BC_H = 3.5, BC_D = 0.46, NLEV = 7, LEV = (k) => 0.2 + k * 0.5, PROJ_LEVEL = 3;
const cases = []; const colliders = []; const projectBooks = [];
const bookcase = (cat, x, z, ry, W) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  add(g, box(0.08, BC_H, BC_D), M.wood, -W / 2 + 0.04, BC_H / 2, 0); add(g, box(0.08, BC_H, BC_D), M.wood, W / 2 - 0.04, BC_H / 2, 0);
  add(g, box(W, 0.08, BC_D), M.wood, 0, BC_H - 0.04, 0); add(g, box(W + 0.1, 0.09, BC_D + 0.1), M.wood, 0, BC_H + 0.045, 0.03); add(g, box(W + 0.16, 0.14, BC_D + 0.14), M.wood, 0, BC_H + 0.16, 0.05);
  add(g, box(W, BC_H, 0.03), M.caseIn, 0, BC_H / 2, -BC_D / 2 + 0.015, false, true); add(g, box(W + 0.05, 0.16, BC_D + 0.05), M.wood, 0, 0.08, 0.02);
  for (let k = 0; k < NLEV; k++) add(g, box(W - 0.16, 0.045, BC_D - 0.02), M.wood, 0, LEV(k) - 0.022, 0);
  { const aoM = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false }); for (let k = 0; k < NLEV; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, 0.3), aoM); p.position.set(0, LEV(k) - 0.19, -BC_D / 2 + 0.036); g.add(p); } }
  const divs = Math.round(W / 1.55) - 1; for (let d = 1; d <= divs; d++) add(g, box(0.045, BC_H - 0.2, BC_D - 0.04), M.wood, -W / 2 + (W / (divs + 1)) * d, BC_H / 2, 0);
  g.updateMatrixWorld(true);
  const wm = new THREE.Box3().setFromObject(g); colliders.push({ minX: wm.min.x - 0.28, maxX: wm.max.x + 0.28, minZ: wm.min.z - 0.28, maxZ: wm.max.z + 0.28 });
  const c = { cat, g, W }; cases.push(c); return c;
};
const wx = -RX + BC_D / 2 + 0.03, ex = RX - BC_D / 2 - 0.03;
bookcase('brand', wx, -1.5, Math.PI / 2, 4.5); bookcase('web', wx, 3.3, Math.PI / 2, 4.5);
bookcase('sales', ex, -1.5, -Math.PI / 2, 4.5); bookcase('campaign', ex, 3.3, -Math.PI / 2, 4.5);
bookcase('soon', 1.95, -RZ + BC_D / 2 + 0.03, 0, 2.7);

/* hanging brass signs */
cases.forEach((c) => {
  const g = c.g, north = c.cat === 'soon';
  const sg = new THREE.Group(); scene.add(sg);
  if (north) sg.position.set(g.position.x, 3.0, g.position.z + 0.75); else { const side = g.position.x < 0 ? 1 : -1; sg.position.set(g.position.x + side * 0.95, 3.0, g.position.z); sg.rotation.y = Math.PI / 2; }
  const tex = labelTex(CAT_LABEL[c.cat].toUpperCase(), c.cat === 'soon' ? 'MORE PROJECTS ON THE WAY' : 'LIBRARY OF WORK', 1024, 300);
  const faceM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0x1a2128, emissiveMap: tex, emissiveIntensity: 0.55 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.6 });
  add(sg, new THREE.BoxGeometry(1.4, 0.42, 0.045), edge, 0, 0, 0);
  [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.42), faceM); p.rotation.y = s > 0 ? 0 : Math.PI; p.position.z = s * 0.025; sg.add(p); });
  [-0.55, 0.55].forEach((x) => add(sg, new THREE.CylinderGeometry(0.008, 0.008, RH - 3.0, 6), M.brass, x, (RH - 3.0) / 2, 0, false, false));
});

/* project books: pale, cool colours (they open); everything else is dark (coming soon) */
const PB = { w: 0.064, h: 0.38, d: 0.25 };
const COOL = ['#4c7d99', '#6f9fb8', '#8fb6c9', '#547f8a', '#6f8fb0', '#a4c3d1', '#5b86a3', '#7fa7bd'];
const spineTex = (p, color) => canvasTex(128, 640, (g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h); noise(g, w, h, 12);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, 34, w, 5); g.fillRect(0, h - 40, w, 5); g.fillRect(0, 48, w, 2); g.fillRect(0, h - 52, w, 2);
  g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#10161b'; g.font = '700 46px "Optima Nova", Georgia, serif'; g.fillText(p.name, 0, -8);
  g.fillStyle = 'rgba(16,22,27,.75)'; g.font = '500 20px Poppins, sans-serif'; g.fillText(`${CAT_LABEL[p.cat].toUpperCase()}  ·  ${String(p.i + 1).padStart(2, '0')}`, 0, 30); g.restore();
});
const projectBook = (p, color) => {
  const g = new THREE.Group();
  const spine = new THREE.MeshStandardMaterial({ map: spineTex(p, color), roughness: 0.5, emissive: 0x000000, envMapIntensity: 0.9 });
  const cover = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const b = new THREE.Mesh(new RoundedBoxGeometry(PB.w, PB.h, PB.d, 2, 0.012), [cover, cover, M.page, M.page, spine, M.page]); b.castShadow = true; b.receiveShadow = true; g.add(b);
  g.userData = { project: p, spine, base: 0, home: null, lift: 0 };
  return g;
};

/* dark filler books: ONE instanced mesh, per-instance spine from the atlas */
const MAXF = 4200;
const fillerGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.16);
const cellAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAXF * 2), 2); fillerGeo.setAttribute('aCell', cellAttr);
const spineMat = new THREE.MeshStandardMaterial({ map: spineAtlas, roughness: 0.6, envMapIntensity: 0.6 });
spineMat.onBeforeCompile = (sh) => { sh.vertexShader = 'attribute vec2 aCell;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = uv * vec2(' + (1 / SP_COLS).toFixed(6) + ', ' + (1 / SP_ROWS).toFixed(6) + ') + aCell;\n#endif'); };
const coverFill = new THREE.MeshStandardMaterial({ color: 0x1d1511, roughness: 0.7 });
const pageDark = new THREE.MeshStandardMaterial({ map: pageEdge, color: 0x9a927c, roughness: 0.95 });
const fillerInst = new THREE.InstancedMesh(fillerGeo, [coverFill, coverFill, pageDark, pageDark, spineMat, pageDark], MAXF); fillerInst.castShadow = true; fillerInst.receiveShadow = true; fillerInst.frustumCulled = false;
let fi = 0; const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
const fillCase = (c) => {
  const g = c.g, W = c.W, mine = PROJECTS.filter((p) => p.cat === c.cat);
  for (let li = 0; li < NLEV; li++) {
    const y = LEV(li), x0 = -W / 2 + 0.1, x1 = W / 2 - 0.1; let x = x0;
    // the project books of this case sit on ONE board, at random places along it
    const proj = li === PROJ_LEVEL ? mine.map((p) => p) : [];
    const spots = proj.map(() => rnd(x0 + 0.3, x1 - 0.3)).sort((a, b) => a - b);
    for (let k = 1; k < spots.length; k++) if (spots[k] - spots[k - 1] < 0.45) spots[k] = Math.min(spots[k - 1] + 0.45, x1 - 0.2);
    let pi = 0;
    while (x < x1 - 0.05 && fi < MAXF - 1) {
      if (pi < proj.length && x >= spots[pi] - 0.02) {
        const p = proj[pi++], bk = projectBook(p, COOL[p.i % COOL.length]); bk.position.set(x + PB.w / 2, y + 0.025 + PB.h / 2, 0.02); g.add(bk); bk.userData.base = bk.position.z; bk.userData.home = bk.position.clone();
        projectBooks.push(bk); x += PB.w + 0.012; continue;
      }
      const t = rnd(0.028, 0.08), h = rnd(0.22, 0.42), d = rnd(0.17, 0.27);
      if (x + t > x1) break;
      if (Math.random() < 0.04) { x += rnd(0.1, 0.28); continue; }
      const lean = Math.random() < 0.03 ? rnd(-0.16, 0.16) : 0;
      tmpP.set(x + t / 2, y + 0.025 + h / 2, 0.01 + (0.24 - d) * 0.3); tmpQ.setFromEuler(new THREE.Euler(0, 0, lean)); tmpS.set(t, h, d);
      tmpM.compose(tmpP, tmpQ, tmpS).premultiply(g.matrixWorld); fillerInst.setMatrixAt(fi, tmpM);
      const cell = (Math.random() * SP_COLS * SP_ROWS) | 0; cellAttr.setXY(fi, (cell % SP_COLS) / SP_COLS, 1 - (Math.floor(cell / SP_COLS) + 1) / SP_ROWS);
      fi++; x += t + rnd(0, 0.006);
    }
  }
};
cases.forEach(fillCase);
fillerInst.count = fi; fillerInst.instanceMatrix.needsUpdate = true; cellAttr.needsUpdate = true; scene.add(fillerInst);
scene.updateMatrixWorld(true);

/* rolling ladders on two cases */
const ladder = (g, lx, W) => {
  loadModel('wooden_ladder_02', 3.5).then((l) => { if (!l) return; l.position.set(lx, 0, BC_D / 2 + 0.3); l.rotation.set(-0.1, Math.PI, 0); g.add(l); });
  add(g, box(W - 0.3, 0.022, 0.022), M.brass, 0, 3.8, BC_D / 2 + 0.04, false, false);
};
ladder(cases[1].g, -0.7, cases[1].W); ladder(cases[2].g, 0.9, cases[2].W);

/* ---------------- real 3D models (Poly Haven, CC0) ---------------- */
const props = { plants: [], chair: null, lamp: null, flame: null };
/* a plant bends away from you and rustles as you walk past: a spring-driven push + wind, applied in the vertex shader (height^2 weighting, so the roots stay put) */
const makePlant = (w, x, z, ry) => {
  w.position.set(x, 0, z); w.rotation.y = ry; scene.add(w);
  const u = { uPush: { value: new THREE.Vector2() }, uTime: { value: 0 }, uH: { value: w.userData.localH }, uRustle: { value: 0 } };
  w.traverse((m) => { if (!m.isMesh) return; (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => {
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, u);
      sh.vertexShader = 'uniform vec2 uPush; uniform float uTime; uniform float uH; uniform float uRustle;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float hh = clamp(transformed.y / uH, 0.0, 1.0); float bend = hh * hh;\n transformed.xz += uPush * bend + vec2(sin(uTime * 1.7 + transformed.y * 7.0 + transformed.x * 9.0), cos(uTime * 1.3 + transformed.z * 8.0)) * (0.006 + uRustle * 0.035) * uH * bend;'); };
    mat.needsUpdate = true; }); });
  colliders.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3 });
  props.plants.push({ w, u, x, z, ry, push: new THREE.Vector2(), vel: new THREE.Vector2() });
};
function buildProps() {
  loadModel('round_wooden_table_01', 0.76).then((t) => { if (!t) return; t.position.set(0.7, 0, 2.4); scene.add(t); const r = Math.max(t.userData.size.x, t.userData.size.z) / 2 + 0.05; colliders.push({ minX: 0.7 - r, maxX: 0.7 + r, minZ: 2.4 - r, maxZ: 2.4 + r }); });
  loadModel('vintage_oil_lamp', 0.34).then((l) => { if (!l) return; l.position.set(0.55, 0.77, 2.3); scene.add(l);
    const f = new THREE.PointLight(0xffb15c, 4.2, 5, 2); f.position.set(0.55, 1.02, 2.3); scene.add(f); props.lamp = f;
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,200,120,.9)', 'rgba(255,170,80,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); flame.scale.set(0.22, 0.22, 1); flame.position.set(0.55, 0.99, 2.3); scene.add(flame); props.flame = flame; });
  loadModel('brass_vase_01', 0.26).then((v) => { if (!v) return; v.position.set(0.98, 0.77, 2.55); scene.add(v); });
  loadModel('ArmChair_01', 0.95).then((c) => { if (!c) return; c.position.set(-1.25, 0, 4.5); c.rotation.y = 0.8 + Math.PI; scene.add(c); props.chair = { obj: c, x: -1.25, z: 4.5, vx: 0, vz: 0, yaw: c.rotation.y }; });
  loadModel('potted_plant_01', 1.5).then((w) => w && makePlant(w, -2.6, 5.3, 0.4));
  loadModel('potted_plant_02', 1.15).then((w) => w && makePlant(w, 2.6, 5.3, 2.0));
  loadModel('potted_plant_02', 1.05).then((w) => w && makePlant(w, -2.65, -5.15, 4.0));
}
const updateProps = (dt, clock) => {
  const sp = Math.hypot(player.vel.x, player.vel.z);
  props.plants.forEach((p) => {
    const dx = p.x - player.pos.x, dz = p.z - player.pos.z, d = Math.hypot(dx, dz) || 1, near = Math.max(0, 1 - d / 1.1);
    const k = near * (0.04 + Math.min(sp, 3) * 0.045);
    const wx = (dx / d) * k, wz = (dz / d) * k, c = Math.cos(p.ry), s = Math.sin(p.ry);
    const tx = (c * wx - s * wz) / p.w.userData.scale, tz = (s * wx + c * wz) / p.w.userData.scale;
    p.vel.x += ((tx - p.push.x) * 55 - p.vel.x * 6) * dt; p.vel.y += ((tz - p.push.y) * 55 - p.vel.y * 6) * dt; p.push.x += p.vel.x * dt; p.push.y += p.vel.y * dt;
    p.u.uPush.value.copy(p.push); p.u.uTime.value = clock; p.u.uRustle.value = near * Math.min(sp / 2, 1) + Math.hypot(p.vel.x, p.vel.y) * 0.4;
  });
  if (props.chair) {
    const c = props.chair;
    if (mode === 'play') { const dx = c.x - player.pos.x, dz = c.z - player.pos.z, d = Math.hypot(dx, dz) || 1, r = 0.78;
      if (d < r) { const push = r - d; c.x += (dx / d) * push * 0.9; c.z += (dz / d) * push * 0.9; c.vx += (dx / d) * (0.4 + sp * 0.5); c.vz += (dz / d) * (0.4 + sp * 0.5); const ty = Math.atan2(dx, dz) + Math.PI; c.yaw += Math.atan2(Math.sin(ty - c.yaw), Math.cos(ty - c.yaw)) * Math.min(dt * 1.2 * sp, 0.2); } }
    c.x += c.vx * dt; c.z += c.vz * dt; const fr = Math.exp(-dt * 4.5); c.vx *= fr; c.vz *= fr;
    const tdx = c.x - 0.7, tdz = c.z - 2.4, td = Math.hypot(tdx, tdz) || 1; if (td < 1.05) { c.x = 0.7 + (tdx / td) * 1.05; c.z = 2.4 + (tdz / td) * 1.05; c.vx *= 0.3; c.vz *= 0.3; }
    c.x = Math.min(Math.max(c.x, -2.15), 2.15); c.z = Math.min(Math.max(c.z, -5.0), 5.3);
    c.obj.position.set(c.x, 0, c.z); c.obj.rotation.y = c.yaw;
  }
  if (props.lamp) { const fl = 0.86 + Math.sin(clock * 11) * 0.06 + Math.sin(clock * 23.7) * 0.04 + Math.sin(clock * 5.3) * 0.05; props.lamp.intensity = 4.2 * fl; if (props.flame) props.flame.material.opacity = 0.7 + fl * 0.3; }
};

/* ---------------- furniture, plants, lamps ---------------- */
const pendants = [], dust = [];
let dustPoints = null;
{
  buildProps();
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd89a, emissiveIntensity: 2.2 });
  const shadeM = new THREE.MeshStandardMaterial({ color: 0x1d3328, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.5 });
  [[0, 3.6], [0, 0.3], [0, -3.2]].forEach(([x, z], i) => {
    const root = new THREE.Group(); root.position.set(x, RH, z); scene.add(root);
    const sw = new THREE.Group(); root.add(sw);
    loadModel('lantern_chandelier_01', 0.9).then((m) => { if (m) { m.position.set(0, -0.95, 0); sw.add(m); } });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,214,150,.4)', 'rgba(255,214,150,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.scale.set(1.2, 1.2, 1); halo.position.set(0, -0.62, 0); sw.add(halo);
    const pl = new THREE.PointLight(0xffc27a, 15, 8.5, 2); pl.position.set(0, -0.72, 0); sw.add(pl);
    pendants.push({ root: sw, light: pl, ang: 0, vel: 0, base: 15, phase: i * 1.7, x, z });
  });
  scene.add(new THREE.HemisphereLight(0xffe6c4, 0x261a12, 0.45));
  const beam = beamTex();
  [[0.3, 2.4, 0xcfe0ff], [-0.3, -2.0, 0xffe2b0]].forEach(([x, z, col]) => {
    const sp = new THREE.SpotLight(col, 85, 11, 0.4, 0.6, 1.2); sp.position.set(x, RH - 0.1, z); sp.target.position.set(x * 0.4, 0, z - 0.5); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -0.0004; sp.shadow.radius = 4; scene.add(sp, sp.target);
    add(scene, box(1.3, 0.05, 0.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.0), toneMapped: false }), x, RH - 0.025, z, false, false);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.6, RH - 0.1, 28, 1, true), new THREE.MeshBasicMaterial({ map: beam, color: col, transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    cone.position.set(x * 0.7, (RH - 0.1) / 2, z - 0.25); scene.add(cone);
  });
  const N = 340, pos = new Float32Array(N * 3), mt = glowTex('rgba(255,236,200,1)', 'rgba(255,236,200,0)');
  for (let i = 0; i < N; i++) { pos[i * 3] = rnd(-2.8, 2.8); pos[i * 3 + 1] = rnd(0.2, RH - 0.3); pos[i * 3 + 2] = rnd(-5.4, 5.4); dust.push({ s: rnd(0.04, 0.2), p: rnd(0, 7) }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustPoints = new THREE.Points(geo, new THREE.PointsMaterial({ map: mt, size: 0.06, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false })); dustPoints.frustumCulled = false; scene.add(dustPoints);
}

/* ---------------- the arched exit door (north wall, left of the "coming soon" case) ---------------- */
const door = { hingeL: null, hingeR: null, open: 0, opening: false, root: new THREE.Group() };
{
  const g = door.root; g.position.set(-1.0, 0, -RZ + 0.03); scene.add(g);
  const archShape = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h); s.absarc(0, h, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); return s; };
  const glow = canvasTex(256, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fffdf0'); gr.addColorStop(1, '#ffe7b0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const lightGeo = new THREE.ShapeGeometry(archShape(1.7, 2.0)); const uv = lightGeo.attributes.uv, ps = lightGeo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (ps.getX(i) + 0.85) / 1.7, ps.getY(i) / 2.85);
  g.add(new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ map: glow, toneMapped: false, fog: false })));
  const outer = archShape(2.1, 2.1), hole = new THREE.Path(); hole.moveTo(-0.87, 0); hole.lineTo(-0.87, 2.0); hole.absarc(0, 2.0, 0.87, Math.PI, 0, true); hole.lineTo(0.87, 0); hole.lineTo(-0.87, 0); outer.holes.push(hole);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.32, bevelEnabled: false }), M.stone); frame.castShadow = true; frame.receiveShadow = true; frame.userData.isDoorFrame = true; g.add(frame);
  const mk = (sx) => { const h = new THREE.Group(); h.position.set(sx * 0.87, 0, 0.17); g.add(h);
    add(h, box(0.87, 2.0, 0.055), M.wood, -sx * 0.435, 1.0, 0); add(h, box(0.62, 0.72, 0.02), M.woodLong, -sx * 0.435, 1.4, 0.04); add(h, box(0.62, 0.45, 0.02), M.woodLong, -sx * 0.435, 0.5, 0.04); add(h, new THREE.SphereGeometry(0.03, 12, 10), M.brass, -sx * 0.78, 0.95, 0.065);
    h.traverse((o) => { if (o.isMesh) o.userData.isDoor = true; }); return h; };
  door.hingeL = mk(-1); door.hingeR = mk(1);
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.27), new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(512, 170, (c, w, h) => { c.fillStyle = '#10261a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#cfe0ec'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#cfe0ec'; c.font = '700 96px Poppins, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EXIT', w / 2, h / 2 + 4); }) }));
  exitSign.position.set(0, 2.85, 0.34); g.add(exitSign);
  const dl = new THREE.PointLight(0xffefc8, 20, 10, 1.6); dl.position.set(-1.0, 1.4, -RZ + 1.2); scene.add(dl);
  const bloom = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,244,214,.6)', 'rgba(255,244,214,0)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); bloom.scale.set(4.6, 4.6, 1); bloom.position.set(0, 1.4, 0.5); g.add(bloom);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4), new THREE.MeshBasicMaterial({ map: beamTex(), color: 0xffe3a8, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.02, 2.2); g.add(spill);
}

/* ---------------- loose books + stacks (rigid-body-ish physics) ---------------- */
const loose = []; const stacks = [];
{
  const BW = 0.2, BH = 0.045, BD = 0.29;
  const leN = photo('assets/tex/leather_nor_gl.jpg', [1, 1]), leR = photo('assets/tex/leather_rough.jpg', [1, 1]);
  const tops = ['#25324a', '#5c2326', '#2c4a3a', '#4a3350', '#6a5020', '#2f2f35', '#7a2a25'].map((c) => new THREE.MeshStandardMaterial({ color: c, normalMap: leN, roughnessMap: leR, roughness: 1, normalScale: new THREE.Vector2(0.8, 0.8) }));
  const mkBook = (w, h, d, mat) => { const m = new THREE.Mesh(box(w, h, d), [mat, mat, M.page, mat, mat, M.page]); m.castShadow = true; m.receiveShadow = true; return m; };
  [[-2.2, 1.9, 8], [2.2, 3.9, 10], [-2.2, -3.9, 6], [2.1, -4.0, 9], [0.5, -2.6, 5]].forEach(([sx, sz, n], si) => {
    const stack = { cx: sx, cz: sz, books: [], fallen: false }; let y = 0;
    for (let k = 0; k < n; k++) {
      const h = BH * rnd(0.8, 1.7), w = BW * rnd(0.8, 1.1), d = BD * rnd(0.85, 1.1), m = mkBook(w, h, d, tops[(si + k) % tops.length]);
      m.position.set(sx + rnd(-0.03, 0.03), y + h / 2 + 0.02, sz + rnd(-0.03, 0.03)); m.rotation.y = rnd(-0.35, 0.35); scene.add(m); y += h;
      const b = { mesh: m, h, vel: new THREE.Vector3(), ang: new THREE.Vector3(), free: false, flat: false, ofs: rnd(0, 0.008) }; stack.books.push(b); loose.push(b);
    }
    stacks.push(stack);
  });
  for (let k = 0; k < 5; k++) { const h = BH * 1.3, m = mkBook(BW, h, BD, tops[k % 7]); m.position.set(rnd(-1.8, 1.8), h / 2 + 0.015, rnd(-4, 4)); m.rotation.y = rnd(0, 7); scene.add(m); loose.push({ mesh: m, h, vel: new THREE.Vector3(), ang: new THREE.Vector3(), free: false, flat: true, ofs: 0.01 }); }
}

/* ---------------- player ---------------- */
const player = { pos: new THREE.Vector3(0, 1.65, 4.9), yaw: 0, pitch: 0, vel: new THREE.Vector3() };
const keys = {};
const BOUNDS = { minX: -RX + 0.95, maxX: RX - 0.95, minZ: -RZ + 0.7, maxZ: RZ - 0.6 };
let locked = false, mode = 'start', last = performance.now();
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
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; if (!locked && mode === 'play') setMode('paused'); if (locked && mode === 'paused') setMode('play'); });
document.addEventListener('mousemove', (e) => { if (locked && mode === 'play') look(e.movementX, e.movementY); });
let drag = null;
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; drag = { x: e.clientX, y: e.clientY }; });
window.addEventListener('pointermove', (e) => { if (!drag || locked || mode !== 'play') return; look(e.clientX - drag.x, e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; });
window.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('click', (e) => {
  if (mode === 'reading') { if (R.state === 'hold') openCover(); return; }
  if (mode === 'start' || mode === 'paused') return;
  if (!locked && mode === 'play' && e.pointerType !== 'touch') { try { canvas.requestPointerLock(); } catch (er) { /* ignore */ } }
  if (mode === 'play') interact();
});
canvas.addEventListener('wheel', (e) => { if (mode === 'play') e.preventDefault(); }, { passive: false });
const keyName = (e) => ({ KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' }[e.code]);
window.addEventListener('keydown', (e) => {
  if (mode === 'reading') {
    if (R.state === 'open') { if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); flip(1); } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); flip(-1); } else if (e.code === 'Escape') closeCover(); }
    else if (R.state === 'hold') { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); openCover(); } else if (e.code === 'Escape') putBack(); }
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

/* ---------------- aiming / hover ---------------- */
const ray = new THREE.Raycaster(); ray.far = 3.4;
const targets = [...projectBooks, fillerInst, door.root];
let aimed = null;
const label = $('lib-label'), labelCat = $('lib-label-cat'), labelName = $('lib-label-name'), labelHint = $('lib-label-hint');
const aim = () => {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObjects(targets, true);
  let found = null;
  for (const h of hits) {
    if (h.object.userData.isDoor || h.object.userData.isDoorFrame) { found = { type: 'door' }; break; }
    if (h.object === fillerInst) { found = { type: 'soon' }; break; }
    let o = h.object; while (o && !o.userData.project) o = o.parent;
    if (o) { found = { type: 'book', obj: o }; break; }
  }
  if (aimed?.type === 'book' && (!found || found.obj !== aimed.obj)) aimed.obj.userData.spine.emissive.set(0x000000);
  aimed = found;
  if (found?.type === 'book') { found.obj.userData.spine.emissive.set(0x1a2a36); const p = found.obj.userData.project; labelCat.textContent = CAT_LABEL[p.cat]; labelName.textContent = `${p.name} — ${p.title}`; labelHint.textContent = isTouch ? 'Tap Take' : 'Click to take the book'; }
  else if (found?.type === 'soon') { labelCat.textContent = 'Coming soon'; labelName.textContent = 'This book is still being written'; labelHint.textContent = 'A future project will live here'; }
  else if (found?.type === 'door') { labelCat.textContent = 'Exit'; labelName.textContent = 'Back to the home page'; labelHint.textContent = isTouch ? 'Tap Take' : 'Click to open the door'; }
  label.classList.toggle('is-on', !!found && mode === 'play'); $('lib-take').classList.toggle('is-on', !!found && found.type !== 'soon' && mode === 'play' && isTouch);
};
const interact = () => { if (!aimed || mode !== 'play') return; if (aimed.type === 'door') return openDoor(); if (aimed.type === 'book') takeBook(aimed.obj); };
const openDoor = () => { if (door.opening) return; door.opening = true; mode = 'leaving'; stage.classList.add('is-leaving'); setTimeout(() => { location.href = 'index.html'; }, 2400); };

/* ---------------- the book in your hands ---------------- */
const handRoot = new THREE.Group(); handRoot.visible = false; camera.add(handRoot);
const rb = new THREE.Group(); handRoot.add(rb);     // the book itself: spine on the local Y axis at x = 0
const BKW = 0.34, BKH = 0.47;
const pageGeo = new THREE.PlaneGeometry(BKW - 0.012, BKH - 0.02);
const pageMat = () => new THREE.MeshBasicMaterial({ color: 0xf1ede2, toneMapped: false, fog: false });
const coverOut = new THREE.MeshStandardMaterial({ color: 0x4c7d99, roughness: 0.55, envMapIntensity: 0.9 });
const coverIn = new THREE.MeshBasicMaterial({ color: 0xf1ede2, toneMapped: false, fog: false });
const coverEdge = new THREE.MeshStandardMaterial({ color: 0x35586b, roughness: 0.55 });
add(rb, box(BKW + 0.01, BKH + 0.01, 0.012), coverEdge, BKW / 2, 0, -0.03, false, false);
add(rb, box(BKW - 0.012, BKH - 0.02, 0.05), M.page, BKW / 2 - 0.004, 0, -0.005, false, false);
const pagesL = add(rb, box(BKW - 0.012, BKH - 0.02, 0.03), M.page, -BKW / 2 + 0.004, 0, -0.015, false, false);
add(rb, box(0.014, BKH + 0.01, 0.075), coverEdge, 0, 0, 0, false, false);
const rightP = new THREE.Mesh(pageGeo, pageMat()); rightP.position.set(BKW / 2, 0, 0.0215); rb.add(rightP);
const leftP = new THREE.Mesh(pageGeo, pageMat()); leftP.position.set(-BKW / 2, 0, 0.0015); rb.add(leftP);
const coverPivot = new THREE.Group(); coverPivot.position.set(0, 0, 0.034); rb.add(coverPivot);
add(coverPivot, box(BKW + 0.01, BKH + 0.01, 0.012), [coverEdge, coverEdge, coverEdge, coverEdge, coverOut, coverIn], BKW / 2, 0, 0, false, false);
const leaf = new THREE.Group(); leaf.position.set(0, 0, 0.024); rb.add(leaf); leaf.visible = false;
const leafF = new THREE.Mesh(pageGeo, pageMat()); leafF.position.set(BKW / 2, 0, 0.002); leaf.add(leafF);
const leafB = new THREE.Mesh(pageGeo, pageMat()); leafB.position.set(BKW / 2, 0, -0.002); leafB.rotation.y = Math.PI; leaf.add(leafB);

const imgCache = {};
const loadImg = (src) => imgCache[src] || (imgCache[src] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
const wrap = (g, text, x, y, maxW, lh) => { const words = text.split(' '); let line = ''; for (const w of words) { const t = line + w + ' '; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); line = w + ' '; y += lh; } else line = t; } g.fillText(line, x, y); return y + lh; };
const pageCanvas = (draw) => canvasTex(800, 1104, (g, w, h) => {
  g.fillStyle = '#efe7d3'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.07)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  noise(g, w, h, 9); g.fillStyle = '#211d1d'; draw(g, w, h);
});
const cover = (g, im, x, y, w, h) => { if (!im) { g.fillStyle = '#bbb'; g.fillRect(x, y, w, h); return; } const s = Math.max(w / im.width, h / im.height); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s); g.restore(); };
const coverFor = (im, p) => canvasTex(800, 1104, (g, w, h) => {
  cover(g, im, 0, 0, w, h);
  const gr = g.createLinearGradient(0, h * 0.62, 0, h); gr.addColorStop(0, 'rgba(10,14,18,0)'); gr.addColorStop(1, 'rgba(10,14,18,.85)'); g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h * 0.38);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.strokeRect(26, 26, w - 52, h - 52);
  g.fillStyle = '#e8f1f6'; g.font = '600 74px "Optima Nova", Georgia, serif'; g.fillText(p.name, 56, h - 112); g.fillStyle = 'rgba(232,241,246,.8)'; g.font = '500 28px Poppins, sans-serif'; g.fillText(`${CAT_LABEL[p.cat].toUpperCase()}  ·  ${String(p.i + 1).padStart(2, '0')}`, 58, h - 62);
});
const spreadsFor = async (p) => {
  const im = await loadImg(p.img), im2 = await loadImg(`assets/img/${IMG[(p.i + 3) % IMG.length]}`), im3 = await loadImg(`assets/img/${IMG[(p.i + 6) % IMG.length]}`), im4 = await loadImg(`assets/img/${IMG[(p.i + 9) % IMG.length]}`);
  const head = (g, t) => { g.fillStyle = '#6d6d68'; g.font = '500 24px Poppins, sans-serif'; g.fillText(t.toUpperCase(), 70, 100); g.fillStyle = '#4c7d99'; g.fillRect(70, 116, 90, 6); g.fillStyle = '#211d1d'; };
  const title = (g, t) => { g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillStyle = '#211d1d'; g.fillText(t, 70, 230); g.font = '400 31px Poppins, sans-serif'; g.fillStyle = '#4a4646'; };
  return [
    [pageCanvas((g, w, h) => { cover(g, im2, 40, 40, w - 80, h - 80); }),
     pageCanvas((g, w, h) => { head(g, `${CAT_LABEL[p.cat]} · ${String(p.i + 1).padStart(2, '0')}`); g.font = '600 88px "Optima Nova", Georgia, serif'; let y = wrap(g, p.name, 70, 300, w - 140, 96); g.font = '400 38px Poppins, sans-serif'; g.fillStyle = '#4a4646'; y = wrap(g, p.title, 70, y + 20, w - 140, 52); cover(g, im, 70, y + 30, w - 140, h - y - 220); g.fillStyle = '#6d6d68'; g.font = '400 26px Poppins, sans-serif'; g.fillText('Positiv · 2026 · Case study', 70, h - 80); })],
    [pageCanvas((g, w, h) => { head(g, 'The brief'); title(g, 'The Brief'); const y = wrap(g, BRIEF, 70, 310, w - 140, 48); cover(g, im3, 70, y + 40, w - 140, h - y - 130); }),
     pageCanvas((g, w, h) => { head(g, 'The approach'); title(g, 'The Approach'); const y = wrap(g, APPROACH, 70, 310, w - 140, 48); cover(g, im4, 70, y + 40, (w - 160) / 2, 360); cover(g, im2, 70 + (w - 160) / 2 + 20, y + 40, (w - 160) / 2, 360); })],
    [pageCanvas((g, w, h) => { cover(g, im3, 40, 40, w - 80, (h - 120) / 2); cover(g, im4, 40, 40 + (h - 120) / 2 + 40, w - 80, (h - 120) / 2); }),
     pageCanvas((g, w, h) => { head(g, 'The outcome'); title(g, 'The Outcome'); let y = wrap(g, OUTCOME, 70, 310, w - 140, 48); y += 20; [['Industry', 'Investment'], ['Services', 'Brand · Sales'], ['Year', '2026'], ['Platform', 'Webflow']].forEach(([a, b]) => { g.fillStyle = 'rgba(33,29,29,.25)'; g.fillRect(70, y, w - 140, 1.5); g.fillStyle = '#6d6d68'; g.font = '500 24px Poppins, sans-serif'; g.fillText(a.toUpperCase(), 70, y + 46); g.fillStyle = '#211d1d'; g.font = '500 30px Poppins, sans-serif'; g.fillText(b, 360, y + 46); y += 70; }); g.fillStyle = '#211d1d'; g.fillRect(70, h - 180, w - 140, 78); g.fillStyle = '#cfe6f2'; g.font = '600 31px Poppins, sans-serif'; g.fillText('Open the full project  →', 100, h - 130); })],
  ];
};

/* state machine for the book in hand: taking → hold (closed, cover = project picture) → opening → open ⇄ flipping → closing → hold → putting → back on the shelf */
const R = { state: 'none', book: null, t0: 0, from: null, to: null, spreads: null, idx: 0, flipping: false };
const HOLD = { pos: new THREE.Vector3(0, -0.04, -0.62), rotX: -0.3, closedX: -BKW / 2 };
const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const setRead = (s) => { R.state = s; stage.dataset.read = s; };
const setSpread = (k) => { R.idx = k; const sp = R.spreads[k]; leftP.material.map = sp[0]; rightP.material.map = sp[1]; coverIn.map = R.spreads[0][0]; leftP.material.needsUpdate = rightP.material.needsUpdate = coverIn.needsUpdate = true; $('lib-page').textContent = `${k + 1} / ${R.spreads.length}`; $('lib-prev').disabled = k === 0; $('lib-next').disabled = k === R.spreads.length - 1; };
const flip = (dir) => {
  if (R.state !== 'open' || R.flipping) return; const to = R.idx + dir; if (to < 0 || to >= R.spreads.length) return; R.flipping = true;
  const fm = leafF.material, bm = leafB.material, sp = R.spreads;
  if (dir > 0) { fm.map = sp[R.idx][1]; bm.map = sp[to][0]; rightP.material.map = sp[to][1]; }
  else { fm.map = sp[to][1]; bm.map = sp[R.idx][0]; leftP.material.map = sp[to][0]; }
  fm.needsUpdate = bm.needsUpdate = leftP.material.needsUpdate = rightP.material.needsUpdate = true;
  leaf.visible = true; const t0 = performance.now(), from = dir > 0 ? 0 : -Math.PI, goal = dir > 0 ? -Math.PI : 0;
  const step = (now) => { const t = Math.min((now - t0) / 650, 1), e = easeIO(t); leaf.rotation.y = from + (goal - from) * e; leaf.position.z = 0.024 + Math.sin(e * Math.PI) * 0.05;
    if (t < 1) requestAnimationFrame(step); else { leaf.visible = false; setSpread(to); R.flipping = false; } };
  requestAnimationFrame(step);
};
const takeBook = async (bk) => {
  const p = bk.userData.project; mode = 'reading'; R.book = bk; aimed = null; label.classList.remove('is-on'); $('lib-take').classList.remove('is-on');
  if (document.pointerLockElement) document.exitPointerLock();
  stage.classList.add('is-reading'); $('lib-read-title').textContent = `${p.name} — ${p.title}`; $('lib-read-cat').textContent = CAT_LABEL[p.cat]; $('lib-open').href = p.href;
  setRead('loading');
  R.spreads = await spreadsFor(p); const im = await loadImg(p.img);
  coverOut.map = coverFor(im, p); coverOut.color.set(0xffffff); coverOut.needsUpdate = true; coverEdge.color.set(COOL[p.i % COOL.length]).multiplyScalar(0.55);
  setSpread(0); coverPivot.rotation.y = 0; leaf.visible = false; pagesL.visible = false; leftP.visible = false;
  handRoot.visible = true; R.t0 = performance.now(); R.from = camera.worldToLocal(bk.getWorldPosition(new THREE.Vector3()));
  rb.position.x = HOLD.closedX; handRoot.position.copy(R.from); handRoot.scale.setScalar(0.28); handRoot.rotation.set(0.1, 0.9, 0.5);
  bk.visible = false; setRead('taking');
};
const openCover = () => { if (R.state !== 'hold') return; setRead('opening'); R.t0 = performance.now(); pagesL.visible = true; leftP.visible = true; };
const closeCover = () => { if (R.state !== 'open' || R.flipping) return; if (R.idx !== 0) setSpread(0); setRead('closing'); R.t0 = performance.now(); };
const putBack = () => {
  if (!['hold', 'open'].includes(R.state) || R.flipping) return;
  if (R.state === 'open') setSpread(0);
  R.to = camera.worldToLocal(R.book.getWorldPosition(new THREE.Vector3())); R.t0 = performance.now(); setRead(R.state === 'open' ? 'closingToPut' : 'putting');
};
$('lib-prev').addEventListener('click', () => flip(-1)); $('lib-next').addEventListener('click', () => flip(1));
$('lib-openbook').addEventListener('click', openCover); $('lib-closebook').addEventListener('click', closeCover);
$('lib-putback').addEventListener('click', putBack); $('lib-close').addEventListener('click', putBack);
$('lib-take').addEventListener('click', interact);
$('lib-open').addEventListener('click', () => { stage.classList.add('is-leaving'); });
const readTick = (now) => {
  const dtm = now - R.t0;
  if (R.state === 'taking') { const e = ease(dtm / 950); handRoot.position.lerpVectors(R.from, HOLD.pos, e); handRoot.scale.setScalar(0.28 + 0.72 * e); handRoot.rotation.set(0.1 + (HOLD.rotX - 0.1) * e, 0.9 * (1 - e), 0.5 * (1 - e)); if (dtm >= 950) setRead('hold'); }
  else if (R.state === 'hold') { handRoot.rotation.y = Math.sin(now / 1100) * 0.05; handRoot.rotation.x = HOLD.rotX + Math.sin(now / 1500) * 0.015; }
  else if (R.state === 'opening') { const t = Math.min(dtm / 1300, 1), e = easeIO(t); coverPivot.rotation.y = -Math.PI * e; coverPivot.position.z = 0.034 + Math.sin(e * Math.PI) * 0.03; rb.position.x = HOLD.closedX * (1 - e); handRoot.rotation.y = 0; handRoot.rotation.x = HOLD.rotX + (-0.46 - HOLD.rotX) * e; if (t >= 1) { setRead('open'); coverPivot.position.z = 0.034; } }
  else if (R.state === 'closing' || R.state === 'closingToPut') { const t = Math.min(dtm / 1100, 1), e = easeIO(t); coverPivot.rotation.y = -Math.PI * (1 - e); coverPivot.position.z = 0.034 + Math.sin(e * Math.PI) * 0.03; rb.position.x = HOLD.closedX * e; handRoot.rotation.x = -0.46 + (HOLD.rotX + 0.46) * e; if (t >= 1) { pagesL.visible = false; leftP.visible = false; coverPivot.position.z = 0.034; if (R.state === 'closing') setRead('hold'); else { R.t0 = performance.now(); setRead('putting'); } } }
  else if (R.state === 'putting') { const e = ease(dtm / 900), eo = e * e; handRoot.position.lerpVectors(HOLD.pos, R.to, eo); handRoot.scale.setScalar(1 - 0.72 * eo); handRoot.rotation.set(HOLD.rotX * (1 - eo) + 0.1 * eo, 0.9 * eo, 0.5 * eo); if (dtm >= 900) { R.book.visible = true; handRoot.visible = false; stage.classList.remove('is-reading'); setRead('none'); R.book = null; mode = 'play'; } }
};

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
setMode('start'); setRead('none');

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
    const dx = player.pos.x - p.x, dz = player.pos.z - p.z; if (mode === 'play' && Math.hypot(dx, dz) < 1.1 && Math.hypot(player.vel.x, player.vel.z) > 0.8) p.vel += (Math.random() - 0.4) * dt * 3.2;
    p.vel += (-p.ang * 9 - p.vel * 0.6) * dt; p.ang += p.vel * dt; p.root.rotation.x = p.ang * 0.7 + Math.sin(clock * 0.6 + p.phase) * 0.012; p.root.rotation.z = p.ang * 0.4;
    p.light.intensity = p.base * (0.96 + Math.sin(clock * 7 + p.phase) * 0.012 + Math.sin(clock * 3.1 + p.phase * 2) * 0.018);
  });
  projectBooks.forEach((b) => { if (!b.visible) return; const want = aimed?.obj === b && mode === 'play' ? 0.07 : 0; b.userData.lift += (want - b.userData.lift) * Math.min(dt * 10, 1); b.position.z = b.userData.base + b.userData.lift; });
  stepPhysics(dt); updateProps(dt, clock);
  if (mode === 'play') {
    const f = (keys.f ? 1 : 0) - (keys.b ? 1 : 0) - touch.vz, s = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + touch.vx;
    const speed = (keys.run ? 3.9 : 2.1), sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
    const wx = (-sin * f + cos * s), wz = (-cos * f - sin * s), len = Math.hypot(wx, wz) || 1;
    const tvx = f || s ? (wx / len) * speed : 0, tvz = f || s ? (wz / len) * speed : 0;
    player.vel.x += (tvx - player.vel.x) * Math.min(dt * 9, 1); player.vel.z += (tvz - player.vel.z) * Math.min(dt * 9, 1);
    const [nx, nz] = collide(player.pos.x + player.vel.x * dt, player.pos.z + player.vel.z * dt); player.pos.x = nx; player.pos.z = nz;
    const moving = Math.hypot(player.vel.x, player.vel.z); bobT += dt * (keys.run ? 10 : 7) * Math.min(moving, 2) / 2;
    syncCam(Math.sin(bobT) * 0.018 * Math.min(moving / 2, 1)); aim();
  } else if (mode === 'reading') { readTick(now); syncCam(); }
  else if (mode === 'leaving') {
    door.open = Math.min(door.open + dt / 1.5, 1); const e = 1 - Math.pow(1 - door.open, 3);
    door.hingeL.rotation.y = e * Math.PI * 0.62; door.hingeR.rotation.y = -e * Math.PI * 0.62;
    player.pos.x += (-1.0 - player.pos.x) * Math.min(dt * 1.2, 1); player.pos.z = Math.max(player.pos.z - dt * 1.0, -RZ + 1.3); player.yaw += (0 - player.yaw) * Math.min(dt * 2, 1); syncCam();
  } else if (mode === 'start') {
    const t = now / 1000; player.yaw = Math.sin(t * 0.12) * 0.2; player.pitch = -0.02; player.pos.set(Math.sin(t * 0.1) * 0.3, 1.65, 4.9); syncCam();
  }
  renderer.render(scene, camera);
};
requestAnimationFrame(tick);
(document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 40px "Optima Nova"'), document.fonts.load('500 20px Poppins')]).catch(() => {}) : Promise.resolve()).then(() => { $('lib-loading').classList.add('is-done'); });

/* tiny hook for manual testing from the console */
window.__lib = { player, camera, scene, projectBooks, fillerInst, loose, stacks, door, R, setMode, interact, aim, takeBook, openCover, closeCover, putBack, flip, get mode() { return mode; },
  face(i) { const b = projectBooks[i]; const v = b.getWorldPosition(new THREE.Vector3()); const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion())); player.pos.set(v.x + dir.x * 1.3, 1.65, v.z + dir.z * 1.3); const dx = v.x - player.pos.x, dz = v.z - player.pos.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(v.y - player.pos.y, Math.hypot(dx, dz)); syncCam(); } };
