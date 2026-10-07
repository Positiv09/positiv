/* Work (library): a walkable 3D library (Three.js). First-person camera: WASD / arrows to walk, mouse to look (click to capture the pointer, Esc to release).
   Four bookcases = four categories; every project is a book on its shelf. Look at a book and click to take it, then read it (flip the pages with the
   arrows). The glowing door at the south wall leads back to the home page. Project data below is placeholder (same order as project.html?p=N). */
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

/* ---------------- renderer ---------------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!renderer) { $('lib-fallback').hidden = false; $('lib-start').hidden = true; throw new Error('no webgl'); }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0a09);
scene.fog = new THREE.Fog(0x0d0a09, 14, 30);
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60);
camera.rotation.order = 'YXZ'; scene.add(camera);
const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

/* ---------------- procedural textures ---------------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const canvasTex = (w, h, draw, opts = {}) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
};
const woodTex = (base, repeat, planks) => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const n = planks || 1, pw = w / n;
  for (let p = 0; p < n; p++) {
    const x0 = p * pw, tint = rnd(-14, 14);
    g.fillStyle = `rgba(${tint > 0 ? 255 : 0},${tint > 0 ? 200 : 0},${tint > 0 ? 140 : 0},${Math.abs(tint) / 90})`; g.fillRect(x0, 0, pw, h);
    for (let k = 0; k < 90; k++) {
      const x = x0 + rnd(0, pw), wv = rnd(0.5, 2.2);
      g.strokeStyle = `rgba(${Math.random() < 0.5 ? '30,16,8' : '255,225,180'},${rnd(0.03, 0.16)})`; g.lineWidth = wv;
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 64) g.lineTo(x + Math.sin(y * 0.012 + p * 3 + k) * rnd(1, 6), y); g.stroke();
    }
    if (planks) { g.fillStyle = 'rgba(12,6,3,.7)'; g.fillRect(x0, 0, 2.5, h); const cut = rnd(0.2, 0.8) * h; g.fillRect(x0, cut, pw, 2.5); }
  }
}, { repeat });
const rugTex = () => canvasTex(1024, 704, (g, w, h) => {
  g.fillStyle = '#4a1d1f'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#d9c9a0'; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h - 52); g.strokeStyle = '#1c2a3a'; g.lineWidth = 22; g.strokeRect(60, 60, w - 120, h - 120);
  g.strokeStyle = '#d9c9a0'; g.lineWidth = 3; g.strokeRect(96, 96, w - 192, h - 192);
  for (let x = 130; x < w - 120; x += 62) for (let y = 130; y < h - 120; y += 62) {
    g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = ((x + y) / 62) % 2 < 1 ? '#7a2c2f' : '#1f3045'; g.fillRect(-18, -18, 36, 36);
    g.strokeStyle = '#d9c9a0'; g.lineWidth = 2; g.strokeRect(-18, -18, 36, 36); g.restore();
  }
  g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 4); g.fillStyle = '#f0f879'; g.fillRect(-46, -46, 92, 92); g.fillStyle = '#4a1d1f'; g.fillRect(-30, -30, 60, 60); g.restore();
  const img = g.getImageData(0, 0, w, h); for (let i = 0; i < img.data.length; i += 4) { const nz = (Math.random() - 0.5) * 26; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz; } g.putImageData(img, 0, 0);
});
const wallTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#2b3430'; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h); for (let i = 0; i < img.data.length; i += 4) { const nz = (Math.random() - 0.5) * 14; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz; } g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 2; for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
}, { repeat: [8, 2] });
const labelTex = (text, sub, w = 1024, h = 256) => canvasTex(w, h, (g) => {
  const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#2a2420'); grd.addColorStop(1, '#161210'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f0f879'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.strokeStyle = 'rgba(240,248,121,.35)'; g.lineWidth = 2; g.strokeRect(30, 30, w - 60, h - 60);
  g.fillStyle = '#f0f879'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${h * 0.42}px "Optima Nova", Georgia, serif`; g.fillText(text, w / 2, h * 0.46);
  g.fillStyle = '#b2b2b2'; g.font = `500 ${h * 0.12}px Poppins, sans-serif`; g.fillText(sub, w / 2, h * 0.8);
});

/* ---------------- materials ---------------- */
const M = {
  floor: new THREE.MeshStandardMaterial({ map: woodTex('#6a4528', [7, 6], 11), roughness: 0.5, metalness: 0.02 }),
  wall: new THREE.MeshStandardMaterial({ map: wallTex(), roughness: 0.92 }),
  wain: new THREE.MeshStandardMaterial({ map: woodTex('#3a2416', [4, 1]), roughness: 0.6 }),
  ceil: new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.95 }),
  beam: new THREE.MeshStandardMaterial({ map: woodTex('#3b2415', [3, 1]), roughness: 0.65 }),
  case: new THREE.MeshStandardMaterial({ map: woodTex('#5b3a22', [2, 2]), roughness: 0.55 }),
  caseIn: new THREE.MeshStandardMaterial({ color: 0x2a1b12, roughness: 0.9 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.35, metalness: 0.85 }),
  rug: new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1 }),
  page: new THREE.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.9 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x4b2a22, roughness: 0.6 }),
  green: new THREE.MeshStandardMaterial({ color: 0x244233, roughness: 0.8 }),
  pot: new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2f6b3d, roughness: 0.7 }),
};
const add = (parent, geo, mat, x = 0, y = 0, z = 0, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/* ---------------- room ---------------- */
const RX = 9, RZ = 7, RH = 4.4;
add(scene, new THREE.PlaneGeometry(RX * 2, RZ * 2), M.floor, 0, 0, 0, false, true).rotation.x = -Math.PI / 2;
add(scene, new THREE.PlaneGeometry(RX * 2, RZ * 2), M.ceil, 0, RH, 0, false, true).rotation.x = Math.PI / 2;
const wall = (w, x, z, ry) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  add(g, new THREE.PlaneGeometry(w, RH), M.wall, 0, RH / 2, 0, false, true);
  add(g, box(w, 1.1, 0.05), M.wain, 0, 0.55, 0.03, false, true); add(g, box(w, 0.07, 0.09), M.case, 0, 1.12, 0.05, false, true); add(g, box(w, 0.14, 0.07), M.case, 0, 0.07, 0.04, false, true);
  add(g, box(w, 0.2, 0.14), M.case, 0, RH - 0.1, 0.07, false, true);
  return g;
};
wall(RX * 2, 0, -RZ, 0); wall(RX * 2, 0, RZ, Math.PI); wall(RZ * 2, -RX, 0, Math.PI / 2); wall(RZ * 2, RX, 0, -Math.PI / 2);
for (let i = -2; i <= 2; i++) add(scene, box(RX * 2, 0.22, 0.28), M.beam, 0, RH - 0.11, i * 3.2);   // ceiling beams
for (let i = -3; i <= 3; i++) add(scene, box(0.2, 0.2, RZ * 2), M.beam, i * 3, RH - 0.1, 0, true, false);
add(scene, new THREE.PlaneGeometry(6, 4.2), M.rug, 0, 0.012, 0.2, false, true).rotation.x = -Math.PI / 2;

/* north wall: tall window with a moonlit night */
{
  const g = new THREE.Group(); g.position.set(0, 0, -RZ + 0.03); scene.add(g);
  const sky = canvasTex(512, 768, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#07101f'); gr.addColorStop(1, '#2a3550'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${rnd(0.2, 0.9)})`; c.fillRect(rnd(0, w), rnd(0, h * 0.8), rnd(1, 2.4), rnd(1, 2.4)); }
    c.fillStyle = '#f4efd6'; c.beginPath(); c.arc(340, 170, 46, 0, 7); c.fill(); c.fillStyle = 'rgba(244,239,214,.16)'; c.beginPath(); c.arc(340, 170, 110, 0, 7); c.fill();
    c.fillStyle = '#0a1018'; for (let i = 0; i < 9; i++) { const x = i * 70 - 20, hh = rnd(120, 260); c.fillRect(x, h - hh, 64, hh); }
  });
  add(g, new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false }), 0, 2.3, 0.0, false, false);
  [[-1.38, 2.3, 0.14, 3.7], [1.38, 2.3, 0.14, 3.7]].forEach((p) => add(g, box(p[2], p[3], 0.14), M.case, p[0], p[1], 0.07));
  add(g, box(2.9, 0.14, 0.14), M.case, 0, 4.1, 0.07); add(g, box(3.0, 0.1, 0.3), M.case, 0, 0.55, 0.1); add(g, box(0.05, 3.4, 0.05), M.case, 0, 2.3, 0.04); add(g, box(2.6, 0.05, 0.05), M.case, 0, 2.5, 0.04);
  const moon = new THREE.PointLight(0x7f9bd8, 7, 11, 2); moon.position.set(0, 2.4, -RZ + 1.2); scene.add(moon);
}

/* ---------------- bookcases ---------------- */
const BC_W = 3.8, BC_H = 3.3, BC_D = 0.46, LEVELS = [0.2, 0.86, 1.52, 2.18, 2.84];
const cases = {}; const colliders = []; const projectBooks = []; const fillers = [];
const spineColors = ['#6b2a2c', '#25324a', '#2c4a3a', '#8a6a2a', '#3a3a3e', '#d8cfb6', '#16120f', '#5a3a5e', '#7a3b20', '#1f3a44'];
const bookcase = (cat, x, z, ry) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  add(g, box(0.07, BC_H, BC_D), M.case, -BC_W / 2 + 0.035, BC_H / 2, 0); add(g, box(0.07, BC_H, BC_D), M.case, BC_W / 2 - 0.035, BC_H / 2, 0);
  add(g, box(BC_W, 0.07, BC_D), M.case, 0, BC_H - 0.035, 0); add(g, box(BC_W + 0.1, 0.09, BC_D + 0.1), M.case, 0, BC_H + 0.045, 0.03); add(g, box(BC_W + 0.18, 0.14, BC_D + 0.16), M.case, 0, BC_H + 0.16, 0.05);
  add(g, box(BC_W, BC_H, 0.03), M.caseIn, 0, BC_H / 2, -BC_D / 2 + 0.015, false, true);
  add(g, box(BC_W + 0.06, 0.16, BC_D + 0.06), M.case, 0, 0.08, 0.02);
  LEVELS.forEach((y) => { add(g, box(BC_W - 0.14, 0.045, BC_D - 0.02), M.case, 0, y - 0.02, 0.0); add(g, box(BC_W - 0.14, 0.012, 0.012), M.brass, 0, y + 0.004, BC_D / 2 - 0.012, false, false); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.48), new THREE.MeshStandardMaterial({ map: labelTex(CAT_LABEL[cat].toUpperCase(), 'LIBRARY OF WORK', 1024, 256), emissive: 0xffffff, roughness: 0.6 }));
  sign.material.emissive.set(0x2a2a10); sign.position.set(0, BC_H + 0.46, BC_D / 2 + 0.06); g.add(sign);
  add(g, box(1.98, 0.56, 0.05), M.brass, 0, BC_H + 0.46, BC_D / 2 + 0.03, false, false);
  const cl = new THREE.SpotLight(0xffd9a0, 34, 7.5, 0.95, 0.7, 1.5); cl.position.set(0, BC_H + 1.0, 1.6); cl.target.position.set(0, 1.7, 0); g.add(cl, cl.target);
  g.updateMatrixWorld(true); cases[cat] = g;
  const wm = new THREE.Box3().setFromObject(g); colliders.push({ minX: wm.min.x - 0.3, maxX: wm.max.x + 0.3, minZ: wm.min.z - 0.3, maxZ: wm.max.z + 0.3 });
  return g;
};
bookcase('brand', -4.7, -RZ + BC_D / 2 + 0.04, 0);
bookcase('sales', 4.7, -RZ + BC_D / 2 + 0.04, 0);
bookcase('web', -RX + BC_D / 2 + 0.04, 0, Math.PI / 2);
bookcase('campaign', RX - BC_D / 2 - 0.04, 0, -Math.PI / 2);

/* spine of a project book */
const spineTex = (p, color) => canvasTex(128, 640, (g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h); for (let i = 0; i < img.data.length; i += 4) { const nz = (Math.random() - 0.5) * 12; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz; } g.putImageData(img, 0, 0);
  g.fillStyle = '#f0f879'; g.fillRect(0, 36, w, 8); g.fillRect(0, h - 44, w, 8); g.fillRect(0, 54, w, 3); g.fillRect(0, h - 58, w, 3);
  g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
  const dark = ['#d8cfb6', '#f0f879'].includes(color); g.fillStyle = dark ? '#211d1d' : '#f2f2ed'; g.font = '600 46px "Optima Nova", Georgia, serif'; g.fillText('Angel East', 0, -8);
  g.fillStyle = dark ? '#4a4646' : '#f0f879'; g.font = '500 20px Poppins, sans-serif'; g.fillText(`${CAT_LABEL[p.cat].toUpperCase()}  ·  ${String(p.i + 1).padStart(2, '0')}`, 0, 30); g.restore();
});
const PB = { w: 0.062, h: 0.36, d: 0.24 };
const projectBook = (p, color) => {
  const g = new THREE.Group();
  const spine = new THREE.MeshStandardMaterial({ map: spineTex(p, color), roughness: 0.55, emissive: 0x000000 });
  const cover = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const mats = [cover, cover, M.page, M.page, spine, M.page];
  const b = new THREE.Mesh(box(PB.w, PB.h, PB.d), mats); b.castShadow = true; b.receiveShadow = true; g.add(b);
  g.userData = { project: p, spine, base: 0 };
  return g;
};
const COLORS = ['#25324a', '#6b2a2c', '#2c4a3a', '#5a3a5e', '#16120f', '#d8cfb6'];

/* fill the shelves: instanced "filler" books + the project books on the eye-level board */
const fillerGeo = box(1, 1, 1);
const fillerInst = new THREE.InstancedMesh(fillerGeo, new THREE.MeshStandardMaterial({ roughness: 0.62 }), 1400); fillerInst.castShadow = true; fillerInst.receiveShadow = true;
let fi = 0; const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color();
Object.entries(cases).forEach(([cat, g]) => {
  const mine = PROJECTS.filter((p) => p.cat === cat);
  LEVELS.forEach((y, li) => {
    const x0 = -BC_W / 2 + 0.1, x1 = BC_W / 2 - 0.1; let x = x0;
    const proj = li === 2 ? mine.slice() : [];
    const slots = proj.map((_, k) => x0 + 0.35 + ((x1 - x0 - 0.7) / Math.max(proj.length, 1)) * (k + 0.5));
    while (x < x1 - 0.05) {
      const slot = slots.findIndex((s) => Math.abs(s - x) < 0.09);
      if (proj.length && slot >= 0 && !proj[slot]?.placed) {
        const p = proj[slot]; p.placed = true;
        const bk = projectBook(p, COLORS[p.i % COLORS.length]); bk.position.set(x + PB.w / 2, y + 0.025 + PB.h / 2, 0.02); g.add(bk); bk.userData.base = bk.position.z;
        projectBooks.push(bk); x += PB.w + 0.012; continue;
      }
      const t = rnd(0.028, 0.075), h = rnd(0.22, 0.34) * (li === 4 ? 0.9 : 1), d = rnd(0.17, 0.25);
      if (x + t > x1) break;
      if (Math.random() < 0.05) { x += rnd(0.1, 0.24); continue; }
      const lean = Math.random() < 0.025 ? rnd(-0.14, 0.14) : 0;
      tmpP.set(x + t / 2, y + 0.025 + h / 2, 0.01 + (0.2 - d) * 0.3); tmpQ.setFromEuler(new THREE.Euler(0, 0, lean)); tmpS.set(t, h, d);
      tmpM.compose(tmpP, tmpQ, tmpS).premultiply(g.matrixWorld); fillerInst.setMatrixAt(fi, tmpM);
      tmpC.set(pick(spineColors)).multiplyScalar(rnd(0.7, 1.1)); if (Math.random() < 0.04) tmpC.set('#f0f879').multiplyScalar(0.6); fillerInst.setColorAt(fi, tmpC);
      fi++; x += t + rnd(0.0, 0.006);
    }
    // little decor on some top corners
  });
});
fillerInst.count = fi; fillerInst.instanceMatrix.needsUpdate = true; if (fillerInst.instanceColor) fillerInst.instanceColor.needsUpdate = true; scene.add(fillerInst);
scene.updateMatrixWorld(true);

/* ---------------- furniture, plants, lamps ---------------- */
{
  const t = new THREE.Group(); t.position.set(0, 0, -0.4); scene.add(t);
  add(t, box(2.4, 0.07, 1.1), M.case, 0, 0.78, 0); add(t, box(2.2, 0.06, 0.9), M.leather, 0, 0.745, 0);
  [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]].forEach(([x, z]) => add(t, box(0.08, 0.76, 0.08), M.case, x, 0.38, z));
  add(t, box(0.3, 0.012, 0.2), M.page, -0.5, 0.82, 0.1); add(t, box(0.3, 0.03, 0.2), M.leather, 0.3, 0.84, -0.1);
  const lamp = new THREE.Group(); lamp.position.set(0.8, 0.815, -0.1); t.add(lamp);
  add(lamp, new THREE.CylinderGeometry(0.07, 0.09, 0.03, 20), M.brass, 0, 0.015, 0); add(lamp, new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), M.brass, 0, 0.19, 0);
  add(lamp, new THREE.CylinderGeometry(0.1, 0.16, 0.16, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f6b4a, side: THREE.DoubleSide, emissive: 0x3a9a6a, emissiveIntensity: 0.55, roughness: 0.5 }), 0, 0.4, 0, false, false);
  const bulb = new THREE.PointLight(0xffd38a, 6, 6, 2); bulb.position.set(0.8, 1.2, -0.5); bulb.castShadow = false; scene.add(bulb);
  colliders.push({ minX: -1.5, maxX: 1.5, minZ: -1.2, maxZ: 0.5 });
  // two armchairs
  [[-1.9, 1.5, 0.5], [1.9, 1.5, -0.5]].forEach(([x, z, r]) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r; scene.add(c);
    add(c, box(0.8, 0.28, 0.8), M.green, 0, 0.3, 0); add(c, box(0.8, 0.5, 0.18), M.green, 0, 0.62, -0.31); add(c, box(0.14, 0.36, 0.8), M.green, -0.4, 0.46, 0); add(c, box(0.14, 0.36, 0.8), M.green, 0.4, 0.46, 0);
    [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]].forEach(([a, b]) => add(c, box(0.05, 0.16, 0.05), M.case, a, 0.08, b));
    colliders.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6 });
  });
  // plants
  [[-8.1, 5.9], [8.1, 5.9], [-8.1, -6.1], [8.1, -6.1]].forEach(([x, z]) => {
    const pl = new THREE.Group(); pl.position.set(x, 0, z); scene.add(pl);
    add(pl, new THREE.CylinderGeometry(0.25, 0.19, 0.46, 16), M.pot, 0, 0.23, 0);
    for (let i = 0; i < 12; i++) { const l = add(pl, new THREE.SphereGeometry(rnd(0.14, 0.24), 8, 6), M.leaf, rnd(-0.22, 0.22), 0.7 + rnd(0, 0.7), rnd(-0.22, 0.22)); l.scale.set(1, rnd(0.6, 1.4), 1); }
    colliders.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4 });
  });
  // pendant lamps
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd89a, emissiveIntensity: 2.2 });
  [[-4.2, -2.3], [4.2, -2.3], [-4.2, 3.4], [4.2, 3.4], [0, 1.6]].forEach(([x, z], i) => {
    add(scene, new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6), M.brass, x, RH - 0.5, z, false, false);
    add(scene, new THREE.ConeGeometry(0.34, 0.26, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f3a2c, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.4 }), x, RH - 1.08, z, true, false).rotation.x = Math.PI;
    add(scene, new THREE.SphereGeometry(0.075, 12, 10), bulbM, x, RH - 1.12, z, false, false);
    const pl = new THREE.PointLight(0xffc98a, 16, 10.5, 2); pl.position.set(x, RH - 1.25, z);
    if (i === 4) { pl.castShadow = true; pl.shadow.mapSize.set(1024, 1024); pl.shadow.bias = -0.0008; pl.intensity = 22; }
    scene.add(pl);
  });
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0x3a2c22, 1.0));
}

/* ---------------- exit door (south wall) ---------------- */
const door = { group: new THREE.Group(), open: 0, opening: false, hinge: null };
{
  const g = door.group; g.position.set(0, 0, RZ - 0.03); g.rotation.y = Math.PI; scene.add(g);
  const glow = canvasTex(256, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fffbe6'); gr.addColorStop(1, '#ffe3a0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  add(g, new THREE.PlaneGeometry(1.3, 2.3), new THREE.MeshBasicMaterial({ map: glow, toneMapped: false }), 0, 1.15, -0.02, false, false);   // the light outside
  add(g, box(0.16, 2.5, 0.2), M.case, -0.72, 1.25, 0.05); add(g, box(0.16, 2.5, 0.2), M.case, 0.72, 1.25, 0.05); add(g, box(1.6, 0.16, 0.2), M.case, 0, 2.5, 0.05); add(g, box(1.75, 0.08, 0.26), M.case, 0, 2.62, 0.06);
  const hinge = new THREE.Group(); hinge.position.set(-0.64, 0, 0.1); g.add(hinge); door.hinge = hinge;
  const leaf = add(hinge, box(1.28, 2.32, 0.06), M.case, 0.64, 1.16, 0);
  add(hinge, box(0.46, 0.8, 0.02), M.wain, 0.4, 1.6, 0.04); add(hinge, box(0.46, 0.8, 0.02), M.wain, 0.88, 1.6, 0.04); add(hinge, box(1.0, 0.5, 0.02), M.wain, 0.64, 0.62, 0.04);
  add(hinge, new THREE.SphereGeometry(0.04, 12, 10), M.brass, 1.14, 1.05, 0.08); add(hinge, new THREE.SphereGeometry(0.04, 12, 10), M.brass, 1.14, 1.05, -0.08);
  leaf.userData.isDoor = true; hinge.traverse((o) => { o.userData.isDoor = true; });
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(512, 170, (c, w, h) => { c.fillStyle = '#10261a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f0f879'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#f0f879'; c.font = '700 96px Poppins, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EXIT', w / 2 - 20, h / 2 + 4); c.beginPath(); c.moveTo(w - 78, h / 2); c.lineTo(w - 42, h / 2 - 22); c.lineTo(w - 42, h / 2 + 22); c.fill(); }), toneMapped: false }));
  exitSign.position.set(0, 2.98, 0.2); g.add(exitSign);
  const dl = new THREE.PointLight(0xffe6b0, 9, 7, 2); dl.position.set(0, 1.4, RZ - 0.8); scene.add(dl);
  g.traverse((o) => { if (o.isMesh) o.userData.isDoor = true; });
  g.updateMatrixWorld(true);
}

/* ---------------- player ---------------- */
const player = { pos: new THREE.Vector3(0, 1.65, 4.6), yaw: 0, pitch: 0, vel: new THREE.Vector3() };
const keys = {};
const BOUNDS = { minX: -RX + 0.75, maxX: RX - 0.75, minZ: -RZ + 0.85, maxZ: RZ - 0.85 };
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

/* ---------------- input ---------------- */
const SENS = 0.0022;
const look = (dx, dy) => { player.yaw -= dx * SENS; player.pitch = Math.max(-1.25, Math.min(1.25, player.pitch - dy * SENS)); };
const canvas = renderer.domElement;
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; if (!locked && mode === 'play') setMode('paused'); if (locked && mode !== 'reading') setMode('play'); });
document.addEventListener('mousemove', (e) => { if (locked && mode === 'play') look(e.movementX, e.movementY); });
let drag = null;
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; drag = { x: e.clientX, y: e.clientY, moved: 0 }; });
window.addEventListener('pointermove', (e) => { if (!drag || locked || mode !== 'play') return; look(e.clientX - drag.x, e.clientY - drag.y); drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; });
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

/* touch: left half = joystick, right half = look */
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
const targets = [...projectBooks, door.group];
let aimed = null;
const label = $('lib-label'), labelCat = $('lib-label-cat'), labelName = $('lib-label-name'), labelHint = $('lib-label-hint');
const aim = () => {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObjects(targets, true);
  let found = null;
  for (const h of hits) { let o = h.object; while (o && !o.userData.project && !o.userData.isDoor) o = o.parent; if (o) { found = o.userData.project ? { type: 'book', obj: o } : { type: 'door' }; break; } }
  if (found?.type === 'book' && aimed?.obj !== found.obj) { if (aimed?.type === 'book') aimed.obj.userData.spine.emissive.set(0x000000); }
  if (aimed?.type === 'book' && (!found || found.obj !== aimed.obj)) aimed.obj.userData.spine.emissive.set(0x000000);
  aimed = found;
  if (found?.type === 'book') { found.obj.userData.spine.emissive.set(0x3a3d10); const p = found.obj.userData.project; labelCat.textContent = CAT_LABEL[p.cat]; labelName.textContent = `${p.name} — ${p.title}`; labelHint.textContent = isTouch ? 'Tap Take' : 'Click to take the book'; }
  else if (found?.type === 'door') { labelCat.textContent = 'Exit'; labelName.textContent = 'Back to the home page'; labelHint.textContent = isTouch ? 'Tap Take' : 'Click to open the door'; }
  label.classList.toggle('is-on', !!found && mode === 'play'); $('lib-take').classList.toggle('is-on', !!found && mode === 'play' && isTouch);
};
const interact = () => {
  if (!aimed || mode !== 'play') return;
  if (aimed.type === 'door') return openDoor();
  openBook(aimed.obj);
};

/* door */
const openDoor = () => {
  if (door.opening) return; door.opening = true; mode = 'leaving'; stage.classList.add('is-leaving');
  setTimeout(() => { location.href = 'index.html'; }, 2300);
};

/* ---------------- the reader (open book in hand) ---------------- */
const reader = new THREE.Group(); reader.visible = false; camera.add(reader);
const READ = { pos: new THREE.Vector3(0, -0.08, -0.7), rotX: -0.42 };
const pageGeo = new THREE.PlaneGeometry(0.34, 0.47);
const pageMat = () => new THREE.MeshBasicMaterial({ color: 0xf4f0e6, toneMapped: false });
let leftP, rightP, leafF, leafB, leaf;
{
  const base = add(reader, box(0.78, 0.53, 0.03), M.leather, 0, 0, -0.025, false, false);
  add(reader, box(0.37, 0.5, 0.022), M.page, -0.185, 0, -0.005, false, false); add(reader, box(0.37, 0.5, 0.022), M.page, 0.185, 0, -0.005, false, false);
  leftP = new THREE.Mesh(pageGeo, pageMat()); leftP.position.set(-0.175, 0, 0.007); reader.add(leftP);
  rightP = new THREE.Mesh(pageGeo, pageMat()); rightP.position.set(0.175, 0, 0.007); reader.add(rightP);
  leaf = new THREE.Group(); leaf.position.set(0, 0, 0.009); reader.add(leaf);
  leafF = new THREE.Mesh(pageGeo, pageMat()); leafF.position.set(0.175, 0, 0.002); leaf.add(leafF);
  leafB = new THREE.Mesh(pageGeo, pageMat()); leafB.position.set(0.175, 0, -0.002); leafB.rotation.y = Math.PI; leaf.add(leafB);
  leaf.visible = false;
  const rl = new THREE.PointLight(0xfff0d0, 2.4, 3, 2); rl.position.set(0, 0.2, 0.5); reader.add(rl);
}
const imgCache = {};
const loadImg = (src) => imgCache[src] || (imgCache[src] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
const wrap = (g, text, x, y, maxW, lh) => { const words = text.split(' '); let line = ''; for (const w of words) { const t = line + w + ' '; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); line = w + ' '; y += lh; } else line = t; } g.fillText(line, x, y); return y + lh; };
const pageCanvas = (draw) => canvasTex(800, 1104, (g, w, h) => {
  g.fillStyle = '#efe7d3'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h); for (let i = 0; i < img.data.length; i += 4) { const nz = (Math.random() - 0.5) * 8; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz; } g.putImageData(img, 0, 0);
  g.fillStyle = '#211d1d'; draw(g, w, h);
});
const cover = (g, im, x, y, w, h) => { if (!im) { g.fillStyle = '#ccc'; g.fillRect(x, y, w, h); return; } const s = Math.max(w / im.width, h / im.height); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s); g.restore(); };
const spreadsFor = async (p) => {
  const im = await loadImg(p.img), im2 = await loadImg(`assets/img/${IMG[(p.i + 3) % IMG.length]}`), im3 = await loadImg(`assets/img/${IMG[(p.i + 6) % IMG.length]}`);
  const head = (g, t) => { g.fillStyle = '#6d6d68'; g.font = '500 26px Poppins, sans-serif'; g.fillText(t.toUpperCase(), 70, 100); g.fillStyle = '#f0f879'; g.fillRect(70, 116, 90, 6); g.fillStyle = '#211d1d'; };
  return [
    [pageCanvas((g, w, h) => { cover(g, im, 40, 40, w - 80, h - 80); g.fillStyle = 'rgba(33,29,29,.0)'; }),
     pageCanvas((g, w, h) => { head(g, `${CAT_LABEL[p.cat]} · ${String(p.i + 1).padStart(2, '0')}`); g.font = '600 92px "Optima Nova", Georgia, serif'; let y = wrap(g, p.name, 70, 300, w - 140, 100); g.font = '400 40px Poppins, sans-serif'; g.fillStyle = '#4a4646'; y = wrap(g, p.title, 70, y + 20, w - 140, 54); g.font = '400 28px Poppins, sans-serif'; g.fillStyle = '#6d6d68'; g.fillText('Positiv · 2026 · Case study', 70, h - 90); })],
    [pageCanvas((g, w, h) => { head(g, 'The brief'); g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillText('The Brief', 70, 240); g.font = '400 34px Poppins, sans-serif'; g.fillStyle = '#4a4646'; wrap(g, BRIEF, 70, 320, w - 140, 52); }),
     pageCanvas((g, w, h) => { head(g, 'The approach'); g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillText('The Approach', 70, 240); g.font = '400 34px Poppins, sans-serif'; g.fillStyle = '#4a4646'; wrap(g, APPROACH, 70, 320, w - 140, 52); })],
    [pageCanvas((g, w, h) => { cover(g, im2, 40, 40, w - 80, (h - 120) / 2); cover(g, im3, 40, 40 + (h - 120) / 2 + 40, w - 80, (h - 120) / 2); }),
     pageCanvas((g, w, h) => { head(g, 'The outcome'); g.font = '600 56px "Optima Nova", Georgia, serif'; g.fillText('The Outcome', 70, 240); g.font = '400 34px Poppins, sans-serif'; g.fillStyle = '#4a4646'; let y = wrap(g, OUTCOME, 70, 320, w - 140, 52); g.fillStyle = '#211d1d'; g.fillRect(70, h - 190, w - 140, 78); g.fillStyle = '#f0f879'; g.font = '600 32px Poppins, sans-serif'; g.fillText('Open the full project  →', 100, h - 140); })],
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
  mode = m;
  stage.dataset.mode = m;
  const start = $('lib-start');
  if (m === 'play') start.classList.add('is-hidden'); else if (m !== 'reading' && m !== 'leaving') { start.classList.remove('is-hidden'); $('lib-start-btn').textContent = m === 'paused' ? 'Resume' : 'Enter the library'; }
}
$('lib-start-btn').addEventListener('click', () => {
  Object.keys(keys).forEach((k) => { keys[k] = false; });
  setMode('play');
  if (!isTouch) { try { canvas.requestPointerLock(); } catch (e) { /* drag-look still works */ } }
});
setMode('start');

/* ---------------- loop ---------------- */
const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
window.addEventListener('resize', resize); resize();
let bobT = 0, onScreen = true;
if ('IntersectionObserver' in window) new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; }).observe(stage);
const tick = (now) => {
  requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!onScreen || document.hidden) return;
  if (mode === 'play') {
    const f = (keys.f ? 1 : 0) - (keys.b ? 1 : 0) - touch.vz, s = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + touch.vx;
    const speed = (keys.run ? 4.2 : 2.4);
    const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
    const wx = (-sin * f + cos * s), wz = (-cos * f - sin * s), len = Math.hypot(wx, wz) || 1;
    const tvx = f || s ? (wx / len) * speed : 0, tvz = f || s ? (wz / len) * speed : 0;
    player.vel.x += (tvx - player.vel.x) * Math.min(dt * 9, 1); player.vel.z += (tvz - player.vel.z) * Math.min(dt * 9, 1);
    const [nx, nz] = collide(player.pos.x + player.vel.x * dt, player.pos.z + player.vel.z * dt); player.pos.x = nx; player.pos.z = nz;
    const moving = Math.hypot(player.vel.x, player.vel.z); bobT += dt * (keys.run ? 11 : 8) * Math.min(moving, 2) / 2;
    syncCam(Math.sin(bobT) * 0.018 * Math.min(moving / 2, 1));
    aim();
  } else if (mode === 'reading') {
    const t = Math.min((performance.now() - reader.userData.t0) / 900, 1), e = 1 - Math.pow(1 - t, 3);
    reader.position.lerpVectors(reader.userData.from, READ.pos, e); reader.scale.setScalar(0.25 + 0.75 * e); reader.rotation.set(READ.rotX * e + (1 - e) * 0.3, (1 - e) * 0.6, (1 - e) * 0.4);
    syncCam();
  } else if (mode === 'leaving') {
    door.open = Math.min(door.open + dt / 1.4, 1); door.hinge.rotation.y = -door.open * Math.PI * 0.55;
    const e = 1 - Math.pow(1 - door.open, 2); player.pos.z = Math.min(player.pos.z + dt * 1.1, RZ - 1.2); player.yaw += (Math.PI * 0 - player.yaw) * 0.0; syncCam();
  } else if (mode === 'start') {
    const t = now / 1000; player.yaw = Math.sin(t * 0.15) * 0.35; player.pitch = -0.02; player.pos.set(0, 1.65, 4.8); syncCam();
  }
  renderer.render(scene, camera);
};
requestAnimationFrame(tick);
(document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 40px "Optima Nova"'), document.fonts.load('500 20px Poppins')]).catch(() => {}) : Promise.resolve()).then(() => { $('lib-loading').classList.add('is-done'); });

/* tiny hook for manual testing from the console */
window.__lib = { player, camera, scene, projectBooks, door, setMode, interact, aim, openBook, flip, get mode() { return mode; }, face(i) { const b = projectBooks[i]; const v = b.getWorldPosition(new THREE.Vector3()); const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion())); player.pos.set(v.x + dir.x * 1.4, 1.65, v.z + dir.z * 1.4); const dx = v.x - player.pos.x, dz = v.z - player.pos.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(v.y - player.pos.y, Math.hypot(dx, dz)); syncCam(); } };
