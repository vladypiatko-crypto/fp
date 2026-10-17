'use strict';
/* QUACK ATTACK! — engine
 * math helpers, low-res pixel canvas, bitmap font, sprites, drawing primitives,
 * chiptune audio, input (keyboard / gamepad / touch / mouse), immediate-mode UI,
 * screen transitions and the save file.
 * All game files are classic scripts that share top-level declarations. */

// ================================================================ math
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const approach = (v, t, s) => (v < t ? Math.min(t, v + s) : Math.max(t, v - s));
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const fmtTime = t => { t = Math.max(0, Math.floor(t)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const Ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
};
function weighted(table) {
  let sum = 0; for (const k in table) sum += table[k];
  let r = Math.random() * sum;
  for (const k in table) { r -= table[k]; if (r <= 0) return k; }
  return Object.keys(table)[0];
}

// seeded RNG so every online player builds the same world decoration
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ================================================================ canvas (rendered at ~216px tall, scaled up crisp)
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
let W = 384, H = 216, SCALE = 1, DPR = 1;
const onResize = [];
function resize() {
  DPR = window.devicePixelRatio || 1;
  const sw = window.innerWidth, sh = window.innerHeight;
  SCALE = Math.max(1, Math.round(Math.min(sw, sh) * DPR / 216));
  W = Math.ceil(sw * DPR / SCALE);
  H = Math.ceil(sh * DPR / SCALE);
  cvs.width = W; cvs.height = H;
  cvs.style.width = (W * SCALE / DPR) + 'px';
  cvs.style.height = (H * SCALE / DPR) + 'px';
  ctx.imageSmoothingEnabled = false;
  for (const f of onResize) f();
}

// ================================================================ palette
const OUT = '#1b1325';
const C = {
  ink: OUT, white: '#fff8e7', cream: '#fff3dc', gray: '#8b8aa0', grayD: '#5a5872',
  red: '#e8343b', redL: '#ff6b6b', orange: '#ff8c1a', gold: '#ffd23f', goldL: '#fff3b0',
  green: '#51cf66', greenD: '#2f9e44', blue: '#5ec8ff', blueD: '#2f7fe0', pink: '#ff6fae', purple: '#9d5cff',
  ui: '#2a2140', uiL: '#40325f', uiD: '#1f1830', uiSel: '#4b3a72',
};
const PCOL = ['#ffd23f', '#5ec8ff'];
const RARITY = {
  common: { name: 'COMMON', col: '#c3c2d4', w: 60 },
  rare: { name: 'RARE', col: '#5ec8ff', w: 28 },
  epic: { name: 'EPIC', col: '#c06bff', w: 10 },
  legendary: { name: 'LEGENDARY', col: '#ffd23f', w: 3 },
  admin: { name: 'ADMIN', col: '#ff5ce1', w: 0, rainbow: true }, // only the admin can hand these out
  limited: { name: 'LIMITED', col: '#ff8c1a', w: 0 }, // only while an event is on (see EVENT_STATE)
};
// rarity colour; ADMIN items cycle through the rainbow
function rarityCol(r, t = performance.now() / 1000) { const R0 = RARITY[r] || RARITY.common; return R0.rainbow ? RAINBOW[Math.floor(t * 8) % RAINBOW.length] : R0.col; }

// ================================================================ bitmap font (5px tall, variable width)
const FONT = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'], K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
  M: ['10001', '11011', '10101', '10001', '10001'], N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['010', '101', '101', '101', '010'], P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '110', '011'],
  R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'], W: ['10001', '10001', '10101', '11011', '10001'],
  X: ['101', '101', '010', '101', '101'], Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['110', '001', '010', '100', '111'],
  3: ['110', '001', '010', '001', '110'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '110', '001', '110'],
  6: ['011', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '110'],
  '!': ['1', '1', '1', '0', '1'], '.': ['0', '0', '0', '0', '1'], ':': ['0', '1', '0', '1', '0'], ',': ['00', '00', '00', '01', '10'],
  '-': ['000', '000', '111', '000', '000'], '+': ['000', '010', '111', '010', '000'], '/': ['001', '001', '010', '100', '100'],
  '%': ['101', '001', '010', '100', '101'], '?': ['110', '001', '010', '000', '010'], "'": ['1', '1', '0', '0', '0'],
  '(': ['01', '10', '10', '10', '01'], ')': ['10', '01', '01', '01', '10'], '>': ['100', '010', '001', '010', '100'],
  '<': ['001', '010', '100', '010', '001'], ' ': ['00', '00', '00', '00', '00'], '*': ['000', '101', '010', '101', '000'],
  '&': ['010', '101', '010', '101', '011'], '"': ['101', '101', '000', '000', '000'], '=': ['000', '111', '000', '111', '000'],
  '#': ['01010', '11111', '11111', '01110', '00100'], // heart
  '@': ['00100', '01110', '11111', '01110', '01010'], // star
  '$': ['01110', '11011', '10101', '11011', '01110'], // coin
  '^': ['010', '111', '000', '000', '000'],
};
// German and Russian letters. A 6-row glyph has its accent (dots, breve) in the first row, drawn just above the letter.
const SAME = { 'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'З': '3', 'Ч': '4' };
for (const ch in SAME) FONT[ch] = FONT[SAME[ch]];
Object.assign(FONT, {
  'Ä': ['101', ...FONT.A], 'Ö': ['101', ...FONT.O], 'Ü': ['101', ...FONT.U], 'Ё': ['101', ...FONT.E],
  'Б': ['111', '100', '110', '101', '110'], 'Г': ['111', '100', '100', '100', '100'], 'Д': ['0110', '1010', '1010', '1111', '1001'],
  'Ж': ['10101', '10101', '01110', '10101', '10101'], 'И': ['1001', '1011', '1101', '1001', '1001'],
  'Й': ['0110', '1001', '1011', '1101', '1001', '1001'], 'Л': ['011', '101', '101', '101', '101'], 'П': ['111', '101', '101', '101', '101'],
  'У': ['101', '101', '011', '001', '110'], 'Ф': ['01110', '10101', '10101', '01110', '00100'], 'Ц': ['1010', '1010', '1010', '1111', '0001'],
  'Ш': ['10101', '10101', '10101', '10101', '11111'], 'Щ': ['101010', '101010', '101010', '111111', '000001'],
  'Ъ': ['1100', '0100', '0110', '0101', '0110'], 'Ы': ['10001', '10001', '11001', '10101', '11001'], 'Ь': ['100', '100', '110', '101', '110'],
  'Э': ['110', '001', '011', '001', '110'], 'Ю': ['10010', '10101', '11101', '10101', '10010'], 'Я': ['011', '101', '011', '101', '101'],
});
// atlas rows: 0 = accents, 1 = gap, 2..6 = the letter
const GLYPH = {};
let fontAtlasW = 0;
for (const ch in FONT) { GLYPH[ch] = { x: fontAtlasW, w: FONT[ch][0].length }; fontAtlasW += FONT[ch][0].length + 1; }
const fontBase = mkCanvas(fontAtlasW, 7);
{
  const g = fontBase.getContext('2d'); g.fillStyle = '#fff';
  for (const ch in FONT) {
    const rows = FONT[ch], top = rows.length === 6 ? 0 : 2;
    rows.forEach((row, i) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') g.fillRect(GLYPH[ch].x + x, top + i, 1, 1); });
  }
}
const fontCache = new Map();
function fontFor(col) {
  let c = fontCache.get(col);
  if (!c) {
    c = mkCanvas(fontAtlasW, 7); const g = c.getContext('2d');
    g.drawImage(fontBase, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, fontAtlasW, 7);
    fontCache.set(col, c);
  }
  return c;
}
const glyphOf = ch => GLYPH[ch] || GLYPH[ch.toUpperCase()];
// every string is translated (lang.js) right before it is measured or drawn
function textW(s, sc = 1) {
  let w = 0;
  for (const ch of tr(s)) { const g = glyphOf(ch); w += (g ? g.w : 2) + 1; }
  return Math.max(0, w - 1) * sc;
}
function rawText(s, x, y, col, sc, g = ctx) {
  const img = fontFor(col);
  for (const ch of s) {
    const gl = glyphOf(ch);
    if (!gl) { x += 3 * sc; continue; }
    g.drawImage(img, gl.x, 0, gl.w, 7, x, y - 2 * sc, gl.w * sc, 7 * sc);
    x += (gl.w + 1) * sc;
  }
}
const OUTLINE8 = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
// align: 0 left, 1 centre, 2 right. style: 'shadow' (default), 'outline', or null
function text(s, x, y, col = C.white, sc = 1, align = 0, style = 'shadow', shadowCol = OUT) {
  s = tr(s);
  const w = textW(RAW + s, sc);
  if (align === 1) x -= w / 2; else if (align === 2) x -= w;
  x = Math.round(x); y = Math.round(y);
  if (style === 'outline') {
    for (const [ox, oy] of OUTLINE8) rawText(s, x + ox * sc, y + oy * sc, shadowCol, sc);
    rawText(s, x, y + sc * 2, shadowCol, sc);
  } else if (style === 'shadow') rawText(s, x + Math.max(1, sc >> 1), y + Math.max(1, sc >> 1), shadowCol, sc);
  rawText(s, x, y, col, sc);
  return w;
}
function wrapText(s, maxW, sc = 1) {
  const lines = [];
  for (const para of tr(s).split('\n')) {
    let cur = '';
    for (const wd of para.split(' ')) {
      const t = cur ? cur + ' ' + wd : wd;
      if (textW(RAW + t, sc) > maxW && cur) { lines.push(RAW + cur); cur = wd; } else cur = t;
    }
    lines.push(RAW + cur);
  }
  return lines; // already translated (RAW), so drawing them doesn't translate again
}
// Renders a string once to its own little canvas (used for smooth zooming titles).
function textCanvas(s, col, sc = 1, outline = true) {
  s = tr(s);
  const w = textW(RAW + s, sc) + 4 * sc, h = 5 * sc + 5 * sc;
  const c = mkCanvas(w, h), g = c.getContext('2d');
  const ox = 2 * sc, oy = 2 * sc;
  if (outline) {
    for (const [dx, dy] of OUTLINE8) rawText(s, ox + dx * sc, oy + dy * sc, OUT, sc, g);
    rawText(s, ox, oy + 2 * sc, OUT, sc, g);
  }
  rawText(s, ox, oy, col, sc, g);
  return c;
}

// ================================================================ sprites (pixel-art strings, auto-outlined)
class Sprite {
  constructor(img) { this.img = img; this.w = img.width; this.h = img.height; }
  get flip() { return this._f || (this._f = flipCanvas(this.img)); }
  get white() { return this._w || (this._w = tintCanvas(this.img, '#ffffff')); }
  get whiteFlip() { return this._wf || (this._wf = flipCanvas(this.white)); }
  get sil() { return this._s || (this._s = tintCanvas(this.img, '#0d0a14')); }
}
function tintCanvas(src, col) {
  const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function flipCanvas(src) {
  const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
// rows: array of strings, '.' = transparent; pal maps chars to colours. Adds a 1px outline.
function spr(rows, pal, outline = OUT) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = mkCanvas(w + 2, h + 2), g = c.getContext('2d');
  const solid = (x, y) => y >= 0 && y < h && x >= 0 && x < rows[y].length && rows[y][x] !== '.';
  if (outline) {
    g.fillStyle = outline;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++)
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x]; if (ch === '.') continue;
    g.fillStyle = pal[ch] || '#ff00ff'; g.fillRect(x + 1, y + 1, 1, 1);
  }
  return new Sprite(c);
}
// fast path: centred, optional flip / white flash / integer scale
function drawSpr(s, x, y, flip = false, white = false, sc = 1) {
  const img = white ? (flip ? s.whiteFlip : s.white) : (flip ? s.flip : s.img);
  ctx.drawImage(img, Math.round(x - s.w * sc / 2), Math.round(y - s.h * sc / 2), s.w * sc, s.h * sc);
}
// full control: o = { flip, white, sil, sc, sx, sy, ax, ay, alpha, rot, flipY }
function drawSprX(s, x, y, o = {}) {
  const img = o.sil ? s.sil : o.white ? (o.flip ? s.whiteFlip : s.white) : (o.flip ? s.flip : s.img);
  const sc = o.sc || 1, sx = (o.sx === undefined ? 1 : o.sx) * sc, sy = (o.sy === undefined ? 1 : o.sy) * sc;
  const ax = o.ax === undefined ? 0.5 : o.ax, ay = o.ay === undefined ? 0.5 : o.ay;
  const w = s.w * sx, h = s.h * sy;
  const a = ctx.globalAlpha;
  if (o.alpha !== undefined) ctx.globalAlpha = a * o.alpha;
  if (o.rot || o.flipY) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y));
    if (o.rot) ctx.rotate(o.rot);
    if (o.flipY) ctx.scale(1, -1);
    ctx.drawImage(img, Math.round(-w * ax), Math.round(-h * ay), Math.round(w), Math.round(h));
    ctx.restore();
  } else ctx.drawImage(img, Math.round(x - w * ax), Math.round(y - h * ay), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  ctx.globalAlpha = a;
}

// ================================================================ drawing primitives
function pcirc(x, y, r, col) {
  ctx.fillStyle = col; x = Math.round(x); y = Math.round(y); r = Math.round(r);
  for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8)); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); }
}
function pellipse(x, y, rx, ry, col) {
  ctx.fillStyle = col; x = Math.round(x); y = Math.round(y); ry = Math.max(1, Math.round(ry));
  for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.5)))); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); }
}
function pring(x, y, r, col, th = 1, ry = null) {
  ctx.fillStyle = col; x = Math.round(x); y = Math.round(y);
  const n = Math.max(12, Math.ceil(TAU * r * 1.2)), k = ry === null ? 1 : ry / r;
  for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * k), th, th); }
}
function pline(x0, y0, x1, y1, col, th = 1) {
  ctx.fillStyle = col;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  const o = th > 1 ? Math.floor(th / 2) : 0;
  for (;;) {
    ctx.fillRect(x0 - o, y0 - o, th, th);
    if ((x0 === x1 && y0 === y1) || n++ > 800) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function shadow(x, y, w) { pellipse(x, y, w, Math.max(1, w * 0.35), 'rgba(20,10,30,0.28)'); }
// rounded-corner panel with top highlight and drop shadow
function panel(x, y, w, h, fill = C.ui, border = OUT, hi = C.uiL, drop = true) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (drop) { ctx.fillStyle = 'rgba(10,6,18,0.45)'; ctx.fillRect(x + 1, y + h, w - 2, 2); }
  ctx.fillStyle = border; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  if (hi) { ctx.fillStyle = hi; ctx.fillRect(x + 2, y + 1, w - 4, 1); }
}
function bar(x, y, w, h, frac, col, back = '#3a2a4f') {
  panel(x, y, w, h, back, OUT, null, false);
  const fw = Math.round((w - 2) * clamp(frac, 0, 1));
  if (fw > 0) { ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, fw, h - 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 1, fw, 1); }
}
function coinIcon(x, y, t = 0) {
  const k = Math.abs(Math.cos(t * 3));
  const w = Math.max(1, Math.round(3 * k));
  ctx.fillStyle = OUT; ctx.fillRect(x + 3 - w - 1, y, w * 2 + 2, 7); ctx.fillRect(x + 3 - w, y - 1, w * 2, 9);
  ctx.fillStyle = '#e0a526'; ctx.fillRect(x + 3 - w, y, w * 2, 7);
  ctx.fillStyle = C.gold; ctx.fillRect(x + 3 - w, y, Math.max(1, w * 2 - 1), 6);
  if (w > 1) { ctx.fillStyle = C.goldL; ctx.fillRect(x + 3 - w + 1, y + 1, 1, 3); }
}

// ================================================================ audio (WebAudio chiptune, no files)
const AU = { ctx: null, master: null, sfxBus: null, musicBus: null, muted: false, noise: null, last: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended' && !AppState.away) AU.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const a = new AC(); AU.ctx = a;
  AU.master = a.createGain(); AU.master.gain.value = AU.muted ? 0 : 0.8; AU.master.connect(a.destination);
  AU.sfxBus = a.createGain(); AU.sfxBus.gain.value = 0.9; AU.sfxBus.connect(AU.master);
  AU.musicBus = a.createGain(); AU.musicBus.gain.value = (Save.data && Save.data.settings && !Save.data.settings.music) ? 0 : 0.42; AU.musicBus.connect(AU.master);
  const len = a.sampleRate * 0.6, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AU.noise = buf;
  Music.seqT = a.currentTime + 0.1;
  setInterval(() => Music.tick(), 30);
}
function setMuted(m) { AU.muted = m; if (AU.master) AU.master.gain.value = m ? 0 : 0.8; }
const atime = (dt = 0) => (AU.ctx ? AU.ctx.currentTime + dt : 0);
function tone(freq, dur, type = 'square', vol = 0.1, slide = 0, when = 0, dest = null) {
  const a = AU.ctx; if (!a || AU.muted) return;
  const t = when || a.currentTime;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest || AU.sfxBus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.1, freq = 2000, when = 0, dest = null, type = 'lowpass') {
  const a = AU.ctx; if (!a || AU.muted) return;
  const t = when || a.currentTime;
  const s = a.createBufferSource(); s.buffer = AU.noise;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || AU.sfxBus); s.start(t); s.stop(t + dur + 0.02);
}
function voice(f0, f1, dur, formant, vol = 0.16, when = 0) { // quack / honk
  const a = AU.ctx; if (!a || AU.muted) return;
  const t = when || a.currentTime, o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  f.type = 'bandpass'; f.frequency.setValueAtTime(formant, t); f.frequency.exponentialRampToValueAtTime(formant * 0.5, t + dur); f.Q.value = 3;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.02);
  o.connect(f); f.connect(g); g.connect(AU.sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
// throttle very frequent sounds
function every(key, gap) { const t = atime(); if (t - (AU.last[key] || 0) < gap) return false; AU.last[key] = t; return true; }
// a goose honk: detuned sawtooth with vibrato, pushed through a nasal bandpass
function honkVoice(f, dur, vol, when = 0) {
  const a = AU.ctx; if (!a || AU.muted) return;
  const t = when || a.currentTime;
  const o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), bp = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.12, t); o.frequency.exponentialRampToValueAtTime(f * 0.86, t + dur);
  lfo.type = 'sine'; lfo.frequency.value = 24; lg.gain.value = f * 0.035; lfo.connect(lg); lg.connect(o.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 3.5;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.035); g.gain.setValueAtTime(vol, t + dur - 0.07); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(bp); bp.connect(g); g.connect(AU.sfxBus);
  o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}
// shooting sounds other files can add: SHOOT_SFX[weapon] = p => { ... } (p: pitch)
const SHOOT_SFX = {};
const sfx = {
  shoot(kind, pid) {
    if (!every('shoot' + pid, 0.05)) return;
    const p = pid ? 1.15 : 1;
    if (SHOOT_SFX[kind]) { SHOOT_SFX[kind](p); return; }
    if (kind === 'shotgun') { noise(0.12, 0.09, 2500); tone(180 * p, 0.1, 'square', 0.05, 70); }
    else if (kind === 'laser') { tone(1400 * p, 0.12, 'sawtooth', 0.035, 300); }
    else if (kind === 'bubble') { tone(500 * p, 0.08, 'sine', 0.07, 900); }
    else if (kind === 'rang') { noise(0.15, 0.04, 1200, 0, null, 'bandpass'); }
    else if (kind === 'minigun') { if (every('mg' + pid, 0.07)) tone(700 * p, 0.035, 'square', 0.022, 350); }
    else if (kind === 'corn') { tone(260 * p, 0.09, 'square', 0.05, 520); noise(0.05, 0.04, 2000); }
    else if (kind === 'frost') { tone(1800 * p, 0.07, 'sine', 0.05, 2600); tone(2400 * p, 0.05, 'triangle', 0.025, 1600, atime(0.03)); }
    else if (kind === 'rocket') { noise(0.3, 0.06, 900, 0, null, 'bandpass'); tone(140 * p, 0.25, 'sawtooth', 0.03, 420); }
    else if (kind === 'tesla') { tone(90 * p, 0.12, 'sawtooth', 0.04, 60); noise(0.08, 0.05, 7000, 0, null, 'highpass'); }
    else if (kind === 'flame') { if (every('fl' + pid, 0.09)) noise(0.12, 0.035, 900, 0, null, 'bandpass'); }
    else if (kind === 'eggnade') { tone(160 * p, 0.12, 'square', 0.05, 90); noise(0.06, 0.04, 1500); }
    else if (kind === 'sawblade') { tone(900 * p, 0.14, 'sawtooth', 0.025, 1500); }
    else if (kind === 'sniper') { noise(0.25, 0.12, 2500); tone(110 * p, 0.3, 'square', 0.07, 40); }
    else if (kind === 'vortex') { tone(220 * p, 0.4, 'sine', 0.08, 60); tone(330 * p, 0.3, 'triangle', 0.03, 90, atime(0.05)); }
    else if (kind === 'mine') { tone(300 * p, 0.06, 'square', 0.04, 200); }
    else if (kind === 'shuriken') { noise(0.06, 0.04, 6000, 0, null, 'highpass'); }
    else if (kind === 'bees') { tone(220 * p, 0.2, 'sawtooth', 0.02, 260); }
    else if (kind === 'harpoon') { tone(140 * p, 0.12, 'square', 0.05, 80); noise(0.08, 0.05, 1500); }
    else if (kind === 'meteor') { tone(600 * p, 0.4, 'sine', 0.04, 120); }
    else if (kind === 'scythe') { noise(0.18, 0.06, 2500, 0, null, 'bandpass'); tone(300 * p, 0.15, 'triangle', 0.03, 120); }
    else if (kind === 'candycorn') { tone(1100 * p, 0.05, 'square', 0.025, 700); }
    else if (kind === 'sword') { noise(0.12, 0.06, 4000, 0, null, 'highpass'); tone(700 * p, 0.08, 'triangle', 0.03, 1400); }
    else if (kind === 'prism') { tone(1500 * p, 0.1, 'sine', 0.035, 2200); tone(1900 * p, 0.1, 'sine', 0.025, 2600, atime(0.03)); }
    else if (kind === 'banhammer') { tone(90 * p, 0.3, 'square', 0.09, 40); noise(0.3, 0.12, 900); }
    else if (kind === 'goldgun') { tone(1320 * p, 0.07, 'square', 0.025, 1760); tone(1980 * p, 0.09, 'sine', 0.03, 0, atime(0.04)); }
    else tone(880 * p, 0.06, 'square', 0.025, 420 * p);
  },
  hit() { if (every('hit', 0.03)) noise(0.04, 0.05, 3500); },
  clank() { if (!every('clank', 0.04)) return; tone(rand(300, 380), 0.08, 'square', 0.045, 90); noise(0.06, 0.05, 6000, 0, null, 'highpass'); },
  squish() { if (every('squish', 0.04)) tone(rand(180, 220), 0.12, 'sine', 0.08, 60); },
  gem(n) { if (every('gem', 0.025)) tone(900 + Math.min(n, 24) * 40, 0.05, 'sine', 0.05, 1400 + Math.min(n, 24) * 55); },
  coin() { if (!every('coin', 0.04)) return; tone(1320, 0.05, 'square', 0.04); tone(1760, 0.09, 'square', 0.04, 0, atime(0.05)); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.06, 0, atime(i * 0.07))); },
  hurt() { tone(220, 0.18, 'sawtooth', 0.08, 60); noise(0.1, 0.06, 1200); },
  boom() { if (!every('boom', 0.05)) return; noise(0.35, 0.16, 900); tone(120, 0.3, 'sine', 0.12, 35); },
  bigBoom() { noise(0.9, 0.22, 600); tone(90, 0.8, 'sine', 0.2, 25); tone(60, 1, 'triangle', 0.15, 20, atime(0.1)); },
  // a two-syllable "qu-ACK" with a little breath of noise
  quack(pitch = 1) { voice(520 * pitch, 360 * pitch, 0.1, 1500 * pitch, 0.16); voice(470 * pitch, 260 * pitch, 0.15, 1100 * pitch, 0.14, atime(0.12)); noise(0.1, 0.02, 2600, atime(0.02), null, 'bandpass'); },
  honk(pitch = 1) { honkVoice(330 * pitch, 0.42, 0.2); honkVoice(312 * pitch, 0.36, 0.16, atime(0.46)); },
  zap() { tone(1600, 0.12, 'sawtooth', 0.04, 200); noise(0.08, 0.04, 6000); },
  pop() { tone(700, 0.06, 'sine', 0.08, 1500); },
  pickup() { tone(660, 0.07, 'square', 0.06); tone(990, 0.1, 'square', 0.06, 0, atime(0.07)); },
  warn() { for (let i = 0; i < 3; i++) tone(330, 0.25, 'square', 0.06, 220, atime(i * 0.35)); },
  warp() { if (every('warp', 0.08)) tone(300, 0.25, 'sine', 0.03, 1200); },
  revive() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.1, 'triangle', 0.08, 0, atime(i * 0.06))); },
  uiMove() { tone(520, 0.03, 'square', 0.035, 600); },
  uiOk() { tone(700, 0.04, 'square', 0.05, 900); tone(1050, 0.05, 'square', 0.04, 0, atime(0.04)); },
  uiBack() { tone(500, 0.06, 'square', 0.045, 300); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, f * 0.97, atime(i * 0.22))); },
  win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.16, 'square', 0.06, 0, atime(i * 0.1))); },
  chestShake(n) { tone(200 + n * 60, 0.08, 'square', 0.06, 120); noise(0.06, 0.05, 2000); },
  chestOpen(rar) {
    noise(0.3, 0.12, 3000); tone(300, 0.2, 'sine', 0.1, 900);
    const notes = { common: [523, 659], rare: [523, 659, 784], epic: [523, 659, 784, 1046], legendary: [523, 659, 784, 1046, 1318, 1568], admin: [523, 659, 784, 1046, 1318, 1568, 2093] }[rar] || [523, 659];
    notes.forEach((f, i) => tone(f, 0.18, 'square', 0.06, 0, atime(0.15 + i * 0.08)));
  },
  title() { noise(0.5, 0.15, 800); tone(110, 0.5, 'sine', 0.18, 40); },
  bossIntro() { tone(110, 0.9, 'sawtooth', 0.08, 55); tone(82, 1.2, 'square', 0.06, 41, atime(0.3)); },
};
// every sound the host plays is also sent to the other online players (see online.js)
// (at most one of each sound per snapshot, or a busy fight floods a friend's phone with hundreds of sounds)
for (const k of Object.keys(sfx)) {
  const f = sfx[k];
  sfx[k] = (...a) => {
    if (Net.role === 'host') { const key = k + ':' + (typeof a[0] === 'number' || typeof a[0] === 'string' ? a[0] : ''); if (!Net.sfxSent[key]) { Net.sfxSent[key] = 1; Net.evt.push(['sfx', k, ...a]); } }
    return f(...a);
  };
}

// ---------------------------------------------------------------- music: tiny step sequencer with a few songs
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  title: {
    bpm: 132, lead: 'square', drums: 'light',
    bass: [48, 0, 48, 55, 48, 0, 55, 48, 45, 0, 45, 52, 45, 0, 52, 45, 41, 0, 41, 48, 41, 0, 48, 41, 43, 0, 43, 50, 43, 0, 47, 50],
    mel: [72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 76, 0, 74, 0, 72, 0, 69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 72, 0, 71, 0, 69, 0,
      65, 0, 69, 0, 72, 0, 69, 0, 71, 0, 72, 0, 74, 0, 76, 0, 79, 0, 0, 77, 76, 0, 74, 0, 71, 0, 74, 0, 79, 0, 0, 0],
  },
  calm: {
    bpm: 100, lead: 'triangle', drums: null,
    bass: [41, 0, 48, 0, 45, 0, 48, 0, 46, 0, 50, 0, 53, 0, 50, 0, 48, 0, 52, 0, 55, 0, 52, 0, 41, 0, 45, 0, 48, 0, 53, 0],
    mel: [77, 0, 0, 0, 76, 0, 72, 0, 0, 0, 74, 0, 0, 0, 0, 0, 74, 0, 0, 0, 72, 0, 70, 0, 0, 0, 69, 0, 0, 0, 0, 0,
      72, 0, 0, 0, 74, 0, 76, 0, 0, 0, 79, 0, 77, 0, 76, 0, 77, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0],
  },
  battle: {
    bpm: 150, lead: 'square', drums: 'full',
    bass: [45, 0, 45, 57, 0, 45, 55, 0, 41, 0, 41, 53, 0, 41, 52, 0, 43, 0, 43, 55, 0, 43, 50, 0, 40, 0, 40, 52, 0, 52, 47, 0],
    mel: [69, 0, 72, 0, 76, 0, 74, 72, 0, 0, 69, 0, 72, 0, 0, 0, 65, 0, 69, 0, 72, 0, 71, 69, 0, 0, 65, 0, 69, 0, 0, 0,
      67, 0, 71, 0, 74, 0, 72, 71, 0, 0, 67, 0, 71, 0, 74, 0, 64, 0, 68, 0, 71, 0, 76, 0, 74, 0, 72, 0, 71, 0, 68, 0],
  },
  boss: {
    bpm: 168, lead: 'sawtooth', drums: 'full',
    bass: [38, 38, 50, 38, 38, 50, 38, 48, 36, 36, 48, 36, 36, 48, 36, 46, 34, 34, 46, 34, 34, 46, 34, 45, 33, 33, 45, 33, 45, 33, 44, 45],
    mel: [74, 0, 77, 0, 81, 0, 77, 0, 76, 0, 74, 0, 73, 0, 74, 0, 72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 70, 0, 72, 0,
      70, 0, 74, 0, 77, 0, 74, 0, 72, 0, 70, 0, 69, 0, 70, 0, 69, 0, 73, 0, 76, 0, 81, 0, 79, 0, 76, 0, 73, 0, 0, 0],
  },
  // one song per world (see WORLD_THEME.song), the chapter finales and the locker
  beach: {
    bpm: 138, lead: 'square', drums: 'light',
    bass: [48, 0, 55, 48, 52, 0, 55, 0, 41, 0, 48, 41, 45, 0, 48, 0, 43, 0, 50, 43, 47, 0, 50, 0, 48, 0, 55, 48, 52, 55, 48, 0],
    mel: [76, 0, 0, 79, 0, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0, 77, 0, 0, 81, 0, 0, 77, 0, 76, 0, 74, 0, 72, 0, 69, 0,
      71, 0, 0, 74, 0, 0, 79, 0, 77, 0, 76, 0, 74, 0, 71, 0, 72, 0, 76, 0, 79, 0, 84, 0, 0, 0, 79, 0, 76, 0, 0, 0],
  },
  swamp: {
    bpm: 112, lead: 'triangle', drums: 'light',
    bass: [45, 0, 0, 45, 52, 0, 45, 0, 38, 0, 0, 38, 45, 0, 38, 0, 40, 0, 0, 40, 47, 0, 44, 0, 45, 0, 52, 0, 45, 0, 44, 0],
    mel: [69, 0, 0, 72, 0, 0, 71, 0, 69, 0, 0, 0, 64, 0, 0, 0, 65, 0, 0, 69, 0, 0, 72, 0, 74, 0, 0, 0, 72, 0, 0, 0,
      71, 0, 0, 68, 0, 0, 64, 0, 68, 0, 71, 0, 74, 0, 0, 0, 72, 0, 71, 0, 69, 0, 0, 0, 68, 0, 0, 0, 69, 0, 0, 0],
  },
  sky: {
    bpm: 156, lead: 'square', drums: 'full',
    bass: [50, 0, 57, 0, 50, 57, 62, 57, 47, 0, 54, 0, 47, 54, 59, 54, 43, 0, 50, 0, 43, 50, 55, 50, 45, 0, 52, 0, 45, 52, 57, 52],
    mel: [74, 0, 78, 0, 81, 0, 86, 0, 0, 0, 85, 0, 81, 0, 78, 0, 83, 0, 0, 0, 81, 0, 78, 0, 74, 0, 78, 0, 79, 0, 81, 0,
      79, 0, 83, 0, 86, 0, 83, 0, 81, 0, 79, 0, 78, 0, 76, 0, 78, 0, 0, 76, 0, 0, 73, 0, 76, 0, 79, 0, 81, 0, 0, 0],
  },
  space: {
    bpm: 120, lead: 'triangle', drums: 'light',
    bass: [40, 0, 47, 0, 52, 0, 47, 0, 36, 0, 43, 0, 48, 0, 43, 0, 38, 0, 45, 0, 50, 0, 45, 0, 35, 0, 42, 0, 47, 0, 51, 0],
    mel: [76, 0, 0, 0, 79, 0, 0, 0, 83, 0, 0, 0, 81, 0, 79, 0, 76, 0, 0, 0, 72, 0, 0, 0, 79, 0, 0, 0, 76, 0, 0, 0,
      74, 0, 0, 0, 78, 0, 0, 0, 81, 0, 0, 0, 79, 0, 78, 0, 75, 0, 0, 0, 78, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0],
  },
  factory: {
    bpm: 158, lead: 'sawtooth', drums: 'full',
    bass: [36, 36, 48, 36, 0, 36, 46, 48, 32, 32, 44, 32, 0, 32, 43, 44, 34, 34, 46, 34, 0, 34, 44, 46, 31, 31, 43, 31, 43, 31, 42, 43],
    mel: [72, 0, 72, 75, 0, 72, 0, 79, 0, 77, 0, 75, 74, 0, 72, 0, 68, 0, 68, 72, 0, 68, 0, 75, 0, 74, 0, 72, 70, 0, 68, 0,
      70, 0, 70, 74, 0, 70, 0, 77, 0, 75, 0, 74, 72, 0, 70, 0, 67, 0, 71, 0, 74, 0, 77, 0, 79, 0, 0, 77, 0, 74, 71, 0],
  },
  final: {
    bpm: 178, lead: 'sawtooth', drums: 'full',
    bass: [38, 38, 50, 38, 50, 38, 48, 50, 34, 34, 46, 34, 46, 34, 45, 46, 36, 36, 48, 36, 48, 36, 47, 48, 33, 33, 45, 33, 45, 44, 45, 47],
    mel: [74, 0, 0, 74, 77, 0, 81, 0, 86, 0, 0, 84, 0, 81, 0, 0, 82, 0, 0, 81, 0, 77, 0, 74, 77, 0, 0, 0, 74, 0, 77, 0,
      79, 0, 0, 79, 84, 0, 79, 0, 76, 0, 0, 79, 0, 84, 0, 0, 81, 0, 80, 0, 81, 0, 85, 0, 88, 0, 0, 0, 85, 0, 81, 0],
  },
  // chapter 3
  volcano: {
    bpm: 150, lead: 'sawtooth', drums: 'full',
    bass: [40, 40, 52, 40, 41, 40, 52, 40, 40, 40, 52, 40, 43, 41, 40, 0, 36, 36, 48, 36, 38, 36, 48, 36, 38, 38, 50, 38, 41, 40, 38, 0],
    mel: [76, 0, 77, 0, 76, 0, 0, 74, 76, 0, 0, 0, 71, 0, 72, 0, 74, 0, 76, 0, 74, 0, 0, 72, 71, 0, 0, 0, 0, 0, 0, 0,
      72, 0, 74, 0, 76, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 72, 0, 71, 0, 69, 0, 71, 0, 0, 0, 64, 0, 0, 0],
  },
  candy: {
    bpm: 144, lead: 'square', drums: 'light',
    bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 48, 0, 52, 0, 41, 0, 48, 0, 45, 0, 48, 0, 43, 0, 50, 0, 47, 0, 43, 0],
    mel: [84, 0, 79, 0, 76, 0, 79, 0, 84, 0, 86, 0, 84, 0, 0, 0, 81, 0, 76, 0, 72, 0, 76, 0, 81, 0, 83, 0, 81, 0, 0, 0,
      77, 0, 79, 0, 81, 0, 77, 0, 76, 0, 77, 0, 79, 0, 76, 0, 74, 0, 76, 0, 77, 0, 79, 0, 84, 0, 0, 0, 0, 0, 0, 0],
  },
  cave: {
    bpm: 108, lead: 'triangle', drums: 'light',
    bass: [45, 0, 0, 0, 52, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 40, 0, 0, 0, 47, 0, 44, 0],
    mel: [76, 0, 0, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0, 0, 0, 77, 0, 0, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0, 0, 0,
      79, 0, 0, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 67, 0, 76, 0, 0, 0, 75, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0],
  },
  castle: {
    bpm: 140, lead: 'square', drums: 'full',
    bass: [38, 0, 38, 0, 45, 0, 38, 0, 34, 0, 34, 0, 41, 0, 34, 0, 36, 0, 36, 0, 43, 0, 36, 0, 33, 0, 33, 0, 40, 0, 37, 0],
    mel: [74, 0, 74, 74, 77, 0, 74, 0, 81, 0, 0, 0, 79, 0, 77, 0, 77, 0, 77, 77, 81, 0, 77, 0, 82, 0, 0, 0, 81, 0, 79, 0,
      79, 0, 79, 79, 84, 0, 79, 0, 82, 0, 81, 0, 79, 0, 77, 0, 76, 0, 77, 0, 79, 0, 81, 0, 73, 0, 0, 0, 76, 0, 0, 0],
  },
  // chapter 4
  jungle: {
    bpm: 128, lead: 'triangle', drums: 'light',
    bass: [43, 0, 50, 43, 0, 43, 50, 0, 41, 0, 48, 41, 0, 41, 48, 0, 43, 0, 50, 43, 0, 43, 50, 0, 38, 0, 45, 38, 0, 40, 41, 0],
    mel: [67, 0, 71, 0, 74, 0, 72, 71, 69, 0, 67, 0, 0, 0, 0, 0, 65, 0, 69, 0, 72, 0, 71, 69, 67, 0, 65, 0, 0, 0, 0, 0,
      67, 0, 71, 0, 74, 0, 77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 0, 71, 0, 0, 72, 0, 74, 0, 0, 0, 0, 0, 0, 0],
  },
  pirate: {
    bpm: 150, lead: 'square', drums: 'full',
    bass: [38, 0, 45, 0, 38, 0, 45, 0, 41, 0, 48, 0, 41, 0, 48, 0, 36, 0, 43, 0, 36, 0, 43, 0, 33, 0, 40, 0, 45, 0, 40, 0],
    mel: [74, 0, 74, 0, 74, 0, 77, 0, 76, 0, 74, 0, 72, 0, 69, 0, 77, 0, 77, 0, 77, 0, 81, 0, 79, 0, 77, 0, 76, 0, 72, 0,
      72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 70, 0, 69, 0, 69, 0, 73, 0, 76, 0, 73, 0, 74, 0, 0, 0, 0, 0, 0, 0],
  },
  western: {
    bpm: 132, lead: 'square', drums: 'light',
    bass: [45, 0, 0, 52, 45, 0, 52, 0, 43, 0, 0, 50, 43, 0, 50, 0, 41, 0, 0, 48, 41, 0, 48, 0, 40, 0, 0, 47, 40, 0, 44, 0],
    mel: [69, 0, 0, 0, 72, 0, 76, 0, 74, 0, 0, 0, 72, 0, 0, 0, 71, 0, 0, 0, 74, 0, 79, 0, 77, 0, 0, 0, 76, 0, 0, 0,
      72, 0, 0, 0, 69, 0, 65, 0, 69, 0, 72, 0, 77, 0, 76, 0, 76, 0, 0, 0, 75, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0],
  },
  neon: {
    bpm: 124, lead: 'sawtooth', drums: 'full',
    bass: [42, 42, 54, 42, 42, 54, 42, 54, 38, 38, 50, 38, 38, 50, 38, 50, 45, 45, 57, 45, 45, 57, 45, 57, 40, 40, 52, 40, 40, 52, 40, 52],
    mel: [78, 0, 0, 0, 81, 0, 0, 0, 85, 0, 83, 0, 81, 0, 0, 0, 74, 0, 0, 0, 78, 0, 0, 0, 81, 0, 0, 0, 78, 0, 0, 0,
      81, 0, 0, 0, 85, 0, 0, 0, 88, 0, 86, 0, 85, 0, 0, 0, 83, 0, 0, 0, 80, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0],
  },
  shop: {
    bpm: 120, lead: 'square', drums: 'light',
    bass: [41, 0, 48, 0, 45, 0, 48, 0, 38, 0, 45, 0, 41, 0, 45, 0, 43, 0, 50, 0, 46, 0, 50, 0, 36, 0, 43, 0, 40, 0, 46, 0],
    mel: [77, 0, 81, 0, 84, 0, 81, 0, 79, 0, 77, 0, 0, 0, 72, 0, 74, 0, 77, 0, 81, 0, 77, 0, 76, 0, 74, 0, 0, 0, 0, 0,
      74, 0, 0, 77, 0, 0, 79, 0, 82, 0, 81, 0, 79, 0, 77, 0, 76, 0, 77, 0, 79, 0, 72, 0, 76, 0, 79, 0, 82, 0, 0, 0],
  },
};
// the app went to the background or the phone screen turned off: silence all sound until it's back.
// Browsers tell us with visibilitychange; the Android app also calls __appPause / __appResume itself (MainActivity.java)
const AppState = { away: false, onAway: [] };
function appAway(away) {
  if (AppState.away === away) return;
  AppState.away = away;
  if (AU.ctx) { if (away) AU.ctx.suspend().catch(() => {}); else AU.ctx.resume().catch(() => {}); }
  if (away) for (const f of AppState.onAway) f();
}
window.__appPause = () => appAway(true);
window.__appResume = () => appAway(false);
document.addEventListener('visibilitychange', () => appAway(document.hidden));
window.addEventListener('pagehide', () => appAway(true));
window.addEventListener('pageshow', () => appAway(document.hidden));

const Music = {
  song: null, step: 0, seqT: 0, paused: false,
  play(name) { if (this.song === name) return; this.song = name; this.step = 0; if (AU.ctx) this.seqT = AU.ctx.currentTime + 0.08; },
  tick() {
    const a = AU.ctx; if (!a) return;
    if (this.seqT < a.currentTime - 0.5) this.seqT = a.currentTime + 0.05;
    const song = SONGS[this.song];
    if (!song) { this.seqT = a.currentTime + 0.1; return; }
    const sd = 60 / song.bpm / 4, bus = AU.musicBus;
    while (this.seqT < a.currentTime + 0.15) {
      const s = this.step, t = this.seqT;
      if (!AU.muted && !this.paused) {
        const b = s % 2 === 0 ? song.bass[(s >> 1) % 32] : 0;
        if (b) tone(NOTE(b), sd * 1.8, 'triangle', 0.13, 0, t, bus);
        const l = song.mel[s % 64];
        if (l) tone(NOTE(l), sd * (song.lead === 'triangle' ? 3 : 1.6), song.lead, song.lead === 'triangle' ? 0.07 : song.lead === 'sawtooth' ? 0.025 : 0.035, 0, t, bus);
        if (song.drums) {
          if (s % 8 === 0) tone(150, 0.12, 'sine', 0.22, 40, t, bus);
          if (song.drums === 'full' && s % 8 === 4) noise(0.09, 0.07, 3000, t, bus);
          if (s % 2 === 1) noise(0.025, song.drums === 'full' ? 0.025 : 0.015, 9000, t, bus);
        }
      }
      this.seqT += sd; this.step = (s + 1) % 64;
    }
  },
};

// ================================================================ input
const KEYS = {
  p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], dash: ['Space', 'ShiftLeft', 'KeyF'] },
  p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], dash: ['Enter', 'ShiftRight', 'NumpadEnter', 'Slash', 'Numpad0'] },
  menu: {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    ok: ['Enter', 'Space', 'NumpadEnter'], back: ['Escape', 'Backspace'], start: ['Escape', 'KeyP'],
  },
};
const Input = {
  held: new Set(), hit: new Set(), ptrEv: [], ptrs: new Map(), typed: [],
  pads: [], padPrev: [],
  device: (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 'touch' : 'keys',
  get touch() { return this.device === 'touch'; },
  showFocus() { return this.device === 'keys' || this.device === 'pad'; },
  anyHeld(codes) { for (const c of codes) if (this.held.has(c)) return true; return false; },
  anyHit(codes) { for (const c of codes) if (this.hit.has(c)) return true; return false; },
  poll() {
    const out = [];
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    let n = 0;
    for (const gp of list) {
      if (!gp || !gp.connected) continue;
      const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
      let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
      if (Math.hypot(x, y) < 0.22) { x = 0; y = 0; }
      if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1;
      const st = { x, y, a: b(0), b: b(1), dash: b(0) || b(1) || b(2) || b(4) || b(5) || b(6) || b(7), start: b(9) };
      const pv = this.padPrev[n] || {};
      st.e = {
        a: st.a && !pv.a, b: st.b && !pv.b, dash: st.dash && !pv.dash, start: st.start && !pv.start,
        left: x < -0.5 && !(pv.x < -0.5), right: x > 0.5 && !(pv.x > 0.5), up: y < -0.5 && !(pv.y < -0.5), down: y > 0.5 && !(pv.y > 0.5),
      };
      if (st.x || st.y || st.a || st.b || st.start) this.device = 'pad';
      out.push(st); this.padPrev[n] = st;
      if (++n >= 2) break;
    }
    this.pads = out;
  },
  // combined menu actions from every keyboard map and pad
  menu() {
    const m = KEYS.menu, a = {
      up: this.anyHit(m.up), down: this.anyHit(m.down), left: this.anyHit(m.left), right: this.anyHit(m.right),
      ok: this.anyHit(m.ok), back: this.anyHit(m.back), start: this.anyHit(m.start),
    };
    for (const p of this.pads) { for (const k of ['up', 'down', 'left', 'right']) a[k] = a[k] || p.e[k]; a.ok = a.ok || p.e.a; a.back = a.back || p.e.b; a.start = a.start || p.e.start; }
    return a;
  },
  // per-player menu actions (used for level-up cards in split screen)
  menuFor(pid, np) {
    if (netRemote(pid)) { const r = Net.inputs[pid], a = { left: false, right: false, ok: !!r.ok }; r.ok = false; return a; }
    const maps = np === 1 ? [KEYS.p1, KEYS.p2] : [pid ? KEYS.p2 : KEYS.p1];
    const a = { left: false, right: false, ok: false };
    for (const m of maps) { a.left = a.left || this.anyHit(m.left); a.right = a.right || this.anyHit(m.right); a.ok = a.ok || this.anyHit(m.dash); }
    const pads = np === 1 ? this.pads : (this.pads[pid] ? [this.pads[pid]] : []);
    for (const p of pads) { a.left = a.left || p.e.left; a.right = a.right || p.e.right; a.ok = a.ok || p.e.a || p.e.dash; }
    return a;
  },
  move(pid, np) {
    if (netRemote(pid)) { const r = Net.inputs[pid]; return { x: r.mx || 0, y: r.my || 0 }; }
    let x = 0, y = 0;
    const maps = np === 1 ? [KEYS.p1, KEYS.p2] : [pid ? KEYS.p2 : KEYS.p1];
    for (const m of maps) {
      if (this.anyHeld(m.left)) x -= 1; if (this.anyHeld(m.right)) x += 1;
      if (this.anyHeld(m.up)) y -= 1; if (this.anyHeld(m.down)) y += 1;
    }
    const pads = np === 1 ? this.pads : (this.pads[pid] ? [this.pads[pid]] : []);
    for (const p of pads) { x += p.x; y += p.y; }
    return { x, y };
  },
  dash(pid, np) {
    if (netRemote(pid)) return nowSec() < (Net.inputs[pid].dashUntil || 0); // a friend's dash waits a moment for the cooldown
    const maps = np === 1 ? [KEYS.p1, KEYS.p2] : [pid ? KEYS.p2 : KEYS.p1];
    for (const m of maps) if (this.anyHit(m.dash)) return true;
    const pads = np === 1 ? this.pads : (this.pads[pid] ? [this.pads[pid]] : []);
    return pads.some(p => p.e.dash);
  },
  endFrame() { this.hit.clear(); this.ptrEv.length = 0; this.typed.length = 0; },
};
const toGame = e => ({ x: e.clientX * DPR / SCALE, y: e.clientY * DPR / SCALE });
window.addEventListener('keydown', e => {
  if (e.code === 'F11' || e.code === 'F12' || (e.ctrlKey && e.code === 'KeyR')) return;
  e.preventDefault(); audioInit();
  Input.device = 'keys';
  if (!e.repeat) {
    Input.hit.add(e.code);
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) Input.typed.push(e.key.toUpperCase());
    if (e.code === 'Backspace') Input.typed.push('<');
  }
  Input.held.add(e.code);
});
window.addEventListener('keyup', e => Input.held.delete(e.code));
window.addEventListener('blur', () => Input.held.clear());
function ptrEvent(type, e) {
  const p = toGame(e);
  if (type === 'down') { Input.device = e.pointerType === 'touch' ? 'touch' : 'mouse'; audioInit(); }
  if (type === 'move' && e.pointerType === 'mouse' && Input.device !== 'pad' && Input.device !== 'keys') Input.device = 'mouse';
  const ev = { type, id: e.pointerId, x: p.x, y: p.y, ptype: e.pointerType };
  Input.ptrEv.push(ev);
  if (type === 'down') Input.ptrs.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y });
  else if (type === 'move') { const q = Input.ptrs.get(e.pointerId); if (q) { q.x = p.x; q.y = p.y; } }
  else Input.ptrs.delete(e.pointerId);
}
cvs.addEventListener('pointerdown', e => { e.preventDefault(); try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* */ } ptrEvent('down', e); }, { passive: false });
cvs.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && Input.device === 'keys' && !e.buttons) { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) Input.device = 'mouse'; } ptrEvent('move', e); }, { passive: false });
cvs.addEventListener('pointerup', e => ptrEvent('up', e));
cvs.addEventListener('pointercancel', e => ptrEvent('up', e));
cvs.addEventListener('contextmenu', e => e.preventDefault());

// ================================================================ fullscreen
const fsSupported = () => !!document.fullscreenEnabled && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  } catch (e) { /* not allowed */ }
}

// ================================================================ immediate-mode UI
// Scenes register widgets while drawing (ui.add) and the UI handles focus,
// keyboard/gamepad navigation and taps in update() using what was drawn last frame.
class UI {
  constructor() { this.items = []; this.focus = null; this.down = null; this.downPtr = null; this.pulse = {}; this.enabled = true; }
  begin() { this.items = []; }
  add(id, x, y, w, h, on, extra) { const it = Object.assign({ id, x, y, w, h, on }, extra); this.items.push(it); return it; }
  isFocus(id) { return this.focus === id && (Input.showFocus() || Input.device === 'mouse'); }
  isDown(id) { return this.down === id; }
  pulseOf(id) { return this.pulse[id] || 0; }
  setFocus(id) { this.focus = id; }
  hitTest(x, y) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (!it.disabled && x >= it.x - 2 && x < it.x + it.w + 2 && y >= it.y - 2 && y < it.y + it.h + 2) return it;
    }
    return null;
  }
  fire(it) { this.pulse[it.id] = 1; if (!it.silent) sfx.uiOk(); if (it.on) it.on(it); }
  // returns true if a pointer event hit a widget
  update(dt, acts) {
    for (const k in this.pulse) { this.pulse[k] -= dt * 5; if (this.pulse[k] <= 0) delete this.pulse[k]; }
    if (!this.enabled) return false;
    const items = this.items.filter(i => !i.disabled && !i.noFocus);
    if (items.length && !items.some(i => i.id === this.focus)) this.focus = (items.find(i => i.def) || items[0]).id;
    if (acts) {
      for (const dir of ['up', 'down', 'left', 'right']) if (acts[dir]) this.nav(dir, items);
      if (acts.ok) { const it = items.find(i => i.id === this.focus); if (it) this.fire(it); }
    }
    let consumed = false;
    for (const ev of Input.ptrEv) {
      const it = this.hitTest(ev.x, ev.y);
      if (ev.type === 'down') { if (it) { this.down = it.id; this.downPtr = ev.id; this.focus = it.id; consumed = true; } }
      else if (ev.type === 'up') {
        if (ev.id === this.downPtr) { if (it && it.id === this.down) { this.fire(it); consumed = true; } this.down = null; this.downPtr = null; }
      } else if (ev.type === 'move' && ev.ptype === 'mouse' && it && !it.noFocus) this.focus = it.id;
    }
    return consumed;
  }
  nav(dir, items) {
    const cur = items.find(i => i.id === this.focus);
    if (!cur) return;
    const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
    let best = null, bs = Infinity;
    for (const it of items) {
      if (it === cur) continue;
      const x = it.x + it.w / 2, y = it.y + it.h / 2, dx = x - cx, dy = y - cy;
      let main, side;
      if (dir === 'left') { main = -dx; side = Math.abs(dy); } else if (dir === 'right') { main = dx; side = Math.abs(dy); }
      else if (dir === 'up') { main = -dy; side = Math.abs(dx); } else { main = dy; side = Math.abs(dx); }
      if (main <= 2) continue;
      const s = main + side * 2.2;
      if (s < bs) { bs = s; best = it; }
    }
    if (best) { this.focus = best.id; sfx.uiMove(); }
  }
}
// standard chunky button
// a colour made lighter (amt > 0) or darker (amt < 0), e.g. shade('#3d2f63', -0.4)
const shadeCache = new Map();
function shade(hex, amt) {
  const key = hex + amt;
  let out = shadeCache.get(key);
  if (!out) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex; // only plain #rrggbb colours can be shaded
    const n = parseInt(hex.slice(1), 16), to = amt > 0 ? 255 : 0, k = Math.abs(amt);
    const ch = [n >> 16, (n >> 8) & 255, n & 255].map(c => Math.round(c + (to - c) * k));
    out = '#' + ch.map(c => c.toString(16).padStart(2, '0')).join('');
    shadeCache.set(key, out);
  }
  return out;
}
// a chunky pixel button: a raised face on a darker base, a shine across the top, and a sweep of light
// over the one that has focus. Pressed buttons sink down onto their base.
function drawButton(ui, id, x, y, w, h, label, opts = {}) {
  const f = ui.isFocus(id), dn = ui.isDown(id), p = ui.pulseOf(id), off = opts.disabled;
  x = Math.round(x); y = Math.round(y + (f && !dn ? -1 : 0)); w = Math.round(w); h = Math.round(h);
  const col = off ? '#2a2535' : f ? (opts.focusCol || C.uiSel) : (opts.col || C.ui);
  const depth = off || dn || h < 9 ? 1 : 2; // how thick the button is
  // shadow on the ground, outline, then the darker base the face sits on
  if (!dn) { ctx.fillStyle = 'rgba(10,6,18,0.45)'; ctx.fillRect(x + 1, y + h, w - 2, f ? 3 : 2); }
  ctx.fillStyle = f && !off ? (opts.ring || C.gold) : OUT; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = shade(col, -0.45); ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  const fy = y + 1 + (dn ? 1 : 0), fh = h - 2 - depth - (dn ? 1 : 0) + (dn ? 1 : 0);
  ctx.fillStyle = col; ctx.fillRect(x + 1, fy, w - 2, fh);
  if (!off) {
    ctx.fillStyle = shade(col, 0.1); ctx.fillRect(x + 1, fy, w - 2, Math.floor(fh / 2)); // top half a little lighter
    ctx.fillStyle = shade(col, 0.35); ctx.fillRect(x + 2, fy, w - 4, 1); // shine along the top
    ctx.fillStyle = shade(col, 0.2); ctx.fillRect(x + 1, fy + 1, 1, Math.max(0, fh - 2)); // and down the left side
  }
  if (f && !off && w > 12) { // a diagonal glint sweeping across
    const tt = (performance.now() / 1000 * 0.8) % 1.6, gx = x - 10 + tt / 1.6 * (w + 30);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, fy, w - 2, fh); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < fh; i++) ctx.fillRect(Math.round(gx - i * 0.6), fy + i, 4, 1);
    ctx.restore();
  }
  if (p > 0) { ctx.globalAlpha = p * 0.5; ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, fy, w - 2, fh); ctx.globalAlpha = 1; }
  const sc = opts.sc || 1;
  const lw = label ? textW(label, sc) : 0, iw = opts.icon ? opts.icon.w + 2 : 0;
  const left = Math.round(x + w / 2 - (lw + iw) / 2), my = fy + fh / 2;
  if (opts.icon) drawSpr(opts.icon, left + opts.icon.w / 2, Math.round(my));
  if (label) text(label, left + iw, Math.round(my - 2.5 * sc), off ? C.gray : opts.tcol || C.white, sc, 0, 'shadow', shade(col, -0.65));
  return ui.add(id, x, y, w, h, opts.on, { def: opts.def, disabled: off, silent: opts.silent });
}
// red tag for something you haven't looked at yet: hops, squashes when it lands, rests, repeats
const NEW_RED = '#e8343b';
function drawNewTag(x, y, t, label = 'NEW!') {
  const ph = (t * 1.6) % 1;
  const up = ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI) * 4 : 0, squash = ph >= 0.4 && ph < 0.5 ? 1 : 0;
  const w = textW(label) + 6 + squash * 2, h = 9 - squash;
  const px = Math.round(x - w / 2), py = Math.round(y - 4 - up + squash);
  panel(px, py, w, h, NEW_RED, OUT, '#ff7a7a');
  text(label, x, py + 2, C.white, 1, 1, null);
}
function drawNewDot(x, y, t) {
  const up = Math.round(Math.abs(Math.sin(t * 6)) * 2);
  panel(x - 3, y - 4 - up, 7, 9, NEW_RED, OUT, '#ff7a7a', false);
  ctx.fillStyle = C.white; ctx.fillRect(x, y - 2 - up, 1, 3); ctx.fillRect(x, y + 2 - up, 1, 1);
}

// ================================================================ transitions (diamond wipe)
const Trans = {
  phase: null, t: 0, fn: null, dur: 0.32, queue: [],
  // keep = true: a network event must not be lost, so it waits for the current wipe to finish
  go(fn, keep = false) { if (this.phase) { if (keep) this.queue.push(fn); return false; } this.phase = 'out'; this.t = 0; this.fn = fn; return true; },
  busy() { return !!this.phase; },
  update(dt) {
    if (!this.phase) return;
    this.t += dt / this.dur;
    if (this.t >= 1) {
      if (this.phase === 'out') { this.phase = 'in'; this.t = 0; const f = this.fn; this.fn = null; if (f) f(); }
      else { this.phase = null; if (this.queue.length) this.go(this.queue.shift()); }
    }
  },
  draw() {
    if (!this.phase) return;
    const p = this.phase === 'out' ? this.t : 1 - this.t;
    const cell = 14;
    ctx.fillStyle = OUT;
    for (let y = 0; y < H + cell; y += cell) for (let x = 0; x < W + cell; x += cell) {
      const th = (x / W) * 0.6 + (y / H) * 0.4;
      const s = clamp((p * 1.7 - th) * 2.2, 0, 1) * cell * 0.75;
      if (s <= 0) continue;
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill();
    }
  },
};

// ================================================================ network state (the functions live in online.js)
const Net = { role: null, inputs: [{}, {}, {}, {}], idToPid: {}, evt: [], sfxSent: {}, sndT: 0, ws: null, open: false, handlers: {}, room: null, myId: null };
function netRemote(pid) { return Net.role === 'host' && pid > 0; } // host: this duck is driven by a friend's device
const nowSec = () => performance.now() / 1000;

// ================================================================ impact frames
// The big moments freeze the game for a few frames: first an inverted "impact frame" with hard black speed
// lines and a camera punch, then the real frame with white lines easing out and a shockwave ring.
const Impact = {
  stop: 0, stopMax: 0, kind: null, lines: 0, ring: 0, snap: null, fx: 0, fy: 0, seed: 1,
  trigger(kind = 'small', fx, fy) {
    if (Net.role === 'host' && !Net.evt.some(e => e[0] === 'imp' && e[1] === kind)) Net.evt.push(['imp', kind]);
    const cfg = { small: [0.035, 0, 0], big: [0.085, 0.7, 1], huge: [0.15, 1, 1] }[kind] || [0.035, 0, 0];
    if (cfg[0] >= this.stop) { this.stop = this.stopMax = cfg[0]; this.kind = kind; }
    const s = Save.data && Save.data.settings;
    if (!s || !s.flash || kind === 'small') return;
    this.fx = fx === undefined ? W / 2 : fx; this.fy = fy === undefined ? H / 2 : fy;
    this.lines = Math.max(this.lines, cfg[1]); this.ring = Math.max(this.ring, cfg[2]); this.seed = Math.random() * 1000;
    if (!this.snap || this.snap.width !== cvs.width || this.snap.height !== cvs.height) this.snap = mkCanvas(cvs.width, cvs.height);
    this.snap.getContext('2d').drawImage(cvs, 0, 0);
  },
  update(dt) { this.stop = Math.max(0, this.stop - dt); this.lines = Math.max(0, this.lines - dt * 3.2); this.ring = Math.max(0, this.ring - dt * 2.4); },
  // speed lines: wedges pointing at the focus, leaving a clear circle around it
  speedLines(col, alpha, heavy) {
    const n = heavy ? 30 : 22, R0 = Math.min(W, H) * (heavy ? 0.2 : 0.28), R1 = Math.hypot(W, H);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const h = Math.sin(this.seed + i * 12.9898) * 43758.5453, r = h - Math.floor(h); // stable per hit
      const a = (i + r * 0.6) / n * TAU, w = (heavy ? 0.035 : 0.02) * (0.5 + r), r0 = R0 * (0.9 + r * 0.5);
      ctx.beginPath();
      ctx.moveTo(this.fx + Math.cos(a) * r0, this.fy + Math.sin(a) * r0);
      ctx.lineTo(this.fx + Math.cos(a - w) * R1, this.fy + Math.sin(a - w) * R1);
      ctx.lineTo(this.fx + Math.cos(a + w) * R1, this.fy + Math.sin(a + w) * R1);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  draw() {
    const on = Save.data && Save.data.settings && Save.data.settings.flash;
    if (!on) return;
    if (this.stop > 0 && this.snap && this.kind !== 'small') {
      const k = 1 - this.stop / this.stopMax, heavy = this.kind === 'huge';
      const z = 1 + (heavy ? 0.07 : 0.045) * (1 - Ease.outCubic(k)); // camera punch, settling back
      ctx.save(); ctx.translate(this.fx, this.fy); ctx.scale(z, z); ctx.translate(-this.fx, -this.fy);
      ctx.drawImage(this.snap, 0, 0, W, H); ctx.restore();
      if (k < 0.5) { // the impact frame itself: inverted colours, hard black lines
        ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore();
        this.speedLines('#000000', 0.9, true);
      } else this.speedLines('#ffffff', 0.85, heavy);
    } else if (this.lines > 0.02) this.speedLines('#ffffff', Math.min(1, this.lines) * 0.55, false);
    if (this.ring > 0.02) { // shockwave ring
      const k = 1 - this.ring, r = Ease.outCubic(k) * Math.hypot(W, H) * 0.55;
      ctx.globalAlpha = this.ring * 0.7; pring(this.fx, this.fy, r, '#ffffff', 2); pring(this.fx, this.fy, r * 0.82, '#fff3b0', 1); ctx.globalAlpha = 1;
    }
  },
};

// ================================================================ save file (shared by both players)
const SAVE_KEY = 'quackattack_save_v2';
const Save = {
  data: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { d = null; }
    const def = defaultSave();
    if (!d || d.v !== 2) d = def;
    else if (d.onlineNewsSeen === undefined) d.onlineNewsSeen = false; // played before online existed: tell them it's here
    for (const k in def) if (d[k] === undefined) d[k] = def[k];
    for (const id of def.unlocked) if (!d.unlocked.includes(id)) d.unlocked.push(id);
    this.data = d;
    setMuted(!!d.muted);
  },
  // quiet: don't send this change to the online account (used when the change came from there)
  write(quiet) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* storage blocked */ } if (!quiet && typeof Cloud !== 'undefined') Cloud.dirty = true; },
  has(cat, id) { return this.data.unlocked.includes(cat + ':' + id); },
  unlock(cat, id) { if (!this.has(cat, id)) { this.data.unlocked.push(cat + ':' + id); this.data.newItems.push(cat + ':' + id); this.write(); return true; } return false; },
  isNew(cat, id) { return this.data.newItems.includes(cat + ':' + id); },
  anyNew(cat) { return this.data.newItems.some(k => !cat || k.startsWith(cat + ':')); },
  seen(cat, id) { const i = this.data.newItems.indexOf(cat + ':' + id); if (i >= 0) { this.data.newItems.splice(i, 1); this.write(); } },
  addCoins(n) { this.data.coins = Math.max(0, this.data.coins + Math.round(n)); this.write(); },
};
