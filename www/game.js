/* QUACK ATTACK! — a pixel survival shooter for 1–2 players.
 * Ducks with auto-aiming blasters vs. a horde of angry vegetables.
 * Plain JS + canvas, no dependencies. */
'use strict';
(() => {

// ============================================================ utils
const rand = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const store = {
  get(k, def) { try { const v = localStorage.getItem('quack_' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('quack_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

// ============================================================ canvas / scaling
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
let W = 320, H = 200, SCALE = 1, DPR = 1;

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
  layoutViews();
}

// ============================================================ palette
const OUT = '#1b1325';
const C = {
  ink: OUT, white: '#fff8e7', grass: '#5bb450', grassD: '#4a9a43', grassL: '#74c862',
  water: '#2f6fb3', waterL: '#4f95d8', sand: '#e9cf8a', sandD: '#c9ab66',
  red: '#e8343b', gold: '#ffd23f', blue: '#5ec8ff', pink: '#ff6fae', green: '#51cf66',
  ui: '#2a2140', uiL: '#40325f', gray: '#8b8aa0',
};
const PCOL = ['#ffd23f', '#5ec8ff'];
const PNAME = ['P1', 'P2'];

// ============================================================ bitmap font (variable width, 5px tall)
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
  '#': ['01010', '11111', '11111', '01110', '00100'], // heart
};
const GLYPH = {};
let fontAtlasW = 0;
for (const ch in FONT) { GLYPH[ch] = { x: fontAtlasW, w: FONT[ch][0].length }; fontAtlasW += FONT[ch][0].length + 1; }
const fontBase = mkCanvas(fontAtlasW, 5);
{
  const g = fontBase.getContext('2d'); g.fillStyle = '#fff';
  for (const ch in FONT) FONT[ch].forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') g.fillRect(GLYPH[ch].x + x, y, 1, 1); });
}
const fontCache = new Map();
function fontFor(col) {
  let c = fontCache.get(col);
  if (!c) {
    c = mkCanvas(fontAtlasW, 5); const g = c.getContext('2d');
    g.drawImage(fontBase, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, fontAtlasW, 5);
    fontCache.set(col, c);
  }
  return c;
}
const glyphOf = ch => GLYPH[ch] || GLYPH[ch.toUpperCase()];
function textW(s, sc = 1) {
  s = String(s); let w = 0;
  for (const ch of s) { const g = glyphOf(ch); w += (g ? g.w : 2) + 1; }
  return Math.max(0, w - 1) * sc;
}
function rawText(s, x, y, col, sc) {
  const img = fontFor(col);
  for (const ch of s) {
    const g = glyphOf(ch);
    if (!g) { x += 3 * sc; continue; }
    ctx.drawImage(img, g.x, 0, g.w, 5, x, y, g.w * sc, 5 * sc);
    x += (g.w + 1) * sc;
  }
}
// align: 0 left, 1 center, 2 right. shadow: colour or null. outline: draw a full outline instead of a drop shadow.
function text(s, x, y, col = C.white, sc = 1, align = 0, shadow = OUT, outline = false) {
  s = String(s);
  const w = textW(s, sc);
  if (align === 1) x -= w / 2; else if (align === 2) x -= w;
  x = Math.round(x); y = Math.round(y);
  if (shadow) {
    if (outline) {
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) rawText(s, x + ox * sc, y + oy * sc, shadow, sc);
      rawText(s, x, y + sc, shadow, sc);
    } else rawText(s, x + Math.max(1, sc >> 1), y + Math.max(1, sc >> 1), shadow, sc);
  }
  rawText(s, x, y, col, sc);
  return w;
}
function wrap(s, maxW) {
  const words = s.split(' '), lines = []; let cur = '';
  for (const wd of words) {
    const t = cur ? cur + ' ' + wd : wd;
    if (textW(t) > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ============================================================ sprites (auto-outlined pixel art)
function tinted(src, col) {
  const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function flipped(src) {
  const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
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
    g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x + 1, y + 1, 1, 1);
  }
  const f = flipped(c);
  return { img: c, flip: f, white: tinted(c, '#fff'), whiteFlip: tinted(f, '#fff'), w: c.width, h: c.height };
}
function drawSpr(s, x, y, flip = false, white = false, sc = 1) {
  const img = white ? (flip ? s.whiteFlip : s.white) : (flip ? s.flip : s.img);
  ctx.drawImage(img, Math.round(x - s.w * sc / 2), Math.round(y - s.h * sc / 2), s.w * sc, s.h * sc);
}

const DUCK_ROWS = [
  '....yyyy....',
  '..rrrrrrr...',
  '.r.yyyyKyoo.',
  'r..yyyyyyooo',
  '....yyyyy...',
  '..yyyyyyyyy.',
  '.yyyyyyyyyyy',
  '.yyyywwwyyyy',
  '..yyyyyyyyyd',
  '...ddddddd..',
];
const DUCK_FEET = ['....o...o...', '.....o.o....'];
function duckSprites(body, shade, band, wing) {
  const pal = { y: body, d: shade, r: band, w: wing, K: OUT, o: '#ff9f1c' };
  return [spr([...DUCK_ROWS, DUCK_FEET[0]], pal), spr([...DUCK_ROWS, DUCK_FEET[1]], pal)];
}
const S = {};
S.duck = [duckSprites('#ffd23f', '#e0a526', '#e8343b', '#fff3b0'), duckSprites('#f4f1ff', '#bdb6d8', '#2f7fe0', '#ffffff')];
S.egg = spr(['..eee..', '.eeeee.', 'eeKeKee', 'eeeeeee', 'eeehhee', '.eeeee.'], { e: '#fff3dc', K: OUT, h: '#ffb3c7' });
S.carrot = spr(['.g.g.g.', '..ggg..', '.ooooo.', '.oKoKo.', '.ooooo.', '..oMo..', '..ooo..', '...o...'],
  { g: '#51cf66', o: '#ff8c1a', K: OUT, M: '#9a3c00' });
S.tomato = spr(['...ggg...', '..g.g.g..', '.rhrrrrr.', 'rrKrrrKrr', 'rrrrrrrrr', 'rrMMMMMrr', '.rrrrrrr.', '..rrrrr..'],
  { g: '#2f9e44', r: '#e8343b', h: '#ff9aa2', K: OUT, M: '#7a0f1f' });
S.peapod = spr(['....ggggg...', '..gglglglgg.', '.gKglglglggg', '..gglglglgg.', '....ggggg...'],
  { g: '#2f9e44', l: '#a9e34b', K: OUT });
S.pea = spr(['.ll.', 'lKlK', 'llll', '.ll.'], { l: '#a9e34b', K: OUT });
S.broccoli = spr([
  '..GG.GGG...', '.GgGGGgGG..', 'GGgGgGGgGG.', 'GgGGGGgGGGG', 'GGGKGGGKGgG', '.GGGGGGGGG.',
  '..GGMMMGG..', '...lllll...', '....lll....', '....lll....', '...ll.ll...'],
{ G: '#2f9e44', g: '#69db7c', l: '#a9e34b', K: OUT, M: '#123d1c' });
S.eggplant = spr([
  '...gg...', '..gggg..', '.gqppg..', '.qpppppp', 'pppKpKpp', 'pppppppp', 'ppMMMMpp', 'pppppppp', '.pppppp.', '.pppppp.', '..pppp..'],
{ g: '#2f9e44', p: '#7b2cbf', q: '#b07ce8', K: OUT, M: '#2b0a45' });
S.pumpkin = spr([
  '..y..y...y..y..',
  '..yyyyyyyyyyy..',
  '..yRyyByyRyyy..',
  '.......gg......',
  '..ooooooooooo..',
  '.ooOooOooOooOo.',
  'ooOooOooOooOooo',
  'oOoKKoooooKKoOo',
  'oOooKKoooKKooOo',
  'oOoooooKoooooOo',
  'oOooooooooooOoo',
  'oOoKoKoKoKoKoOo',
  'oOooKoKoKoKooOo',
  '.ooOooOooOooOo.',
  '..ooooooooooo..',
], { y: '#ffd23f', R: '#e8343b', B: '#5ec8ff', g: '#2f9e44', o: '#ff8c1a', O: '#d9620b', K: '#3a1300' });
S.heart = spr(['.hh.hh.', 'hHhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'], { h: '#ff4d6d', H: '#ffc2d1' });
S.magnet = spr(['.rrrrr.', 'rr...rr', 'rr...rr', 'rr...rr', 'ww...ww'], { r: '#e8343b', w: '#dde3ea' });
S.sauce = spr(['..k..', '.ttt.', '..r..', '.rrr.', 'rrrrr', 'rwwwr', 'rwrwr', 'rrrrr', '.rrr.'],
  { k: '#ffd23f', t: '#2f9e44', r: '#e8343b', w: '#fff8e7' });
S.goldcorn = spr(['..g..', '.yyy.', 'yYyYy', 'yyyyy', 'yYyYy', 'yyyyy', '.yyy.', 'g.g.g'], { y: '#ffd23f', Y: '#fff3b0', g: '#51cf66' });
S.gem = [
  spr(['.y.', 'yYy', '.y.'], { y: '#ffd23f', Y: '#fff8e7' }),
  spr(['.b.', 'bBb', 'bBb', '.b.'], { b: '#3fa7ff', B: '#c9ecff' }),
  spr(['..p..', '.pPp.', 'pPPPp', '.pPp.', '..p..'], { p: '#ff4dc4', P: '#ffd1f1' }),
];
S.bread = spr(['.bbb.', 'bBbBb', 'bbbbb'], { b: '#d9902f', B: '#ffd39a' });
S.eggOrb = spr(['.ww.', 'wwww', 'wwwh', '.ww.'], { w: '#fff8e7', h: '#ffd23f' });
S.seed = spr(['ss', 'ss'], { s: '#b07ce8' });

// upgrade icons (9x9-ish)
const ICON = {
  rapid: spr(['y..y..', '.y..y.', '..y..y', '.y..y.', 'y..y..'], { y: '#ffd23f' }),
  power: spr(['.rrr.', 'rRrrr', 'rrrrr', 'rrrrr', '.rrr.'], { r: '#ff8c1a', R: '#fff3b0' }),
  spread: spr(['....y.', '.y....', 'yy..yy', '.y....', '....y.'], { y: '#ffd23f' }),
  pierce: spr(['..b...', '..bb..', 'bbbbbb', '..bb..', '..b...'], { b: '#5ec8ff' }),
  egg: S.eggOrb,
  bread: S.bread,
  zap: spr(['...yy', '..yy.', '.yyyy', '..yy.', '.yy..', 'yy...'], { y: '#fff36b' }),
  quack: spr(['.yyy..o', 'yyKyoo.', '.yyy..o', '..yy...'], { y: '#ffd23f', o: '#ff9f1c', K: OUT }),
  speed: spr(['..www', '.wwww', 'www..', 'ww...', 'w....'], { w: '#c9ecff' }),
  heart: S.heart,
  magnet: S.magnet,
  regen: spr(['..g..', '..g..', 'ggggg', '..g..', '..g..'], { g: '#51cf66' }),
  dash: spr(['w..ww.', '.wwwww', 'w..ww.'], { w: '#ff6fae' }),
  snack: S.heart,
};

// ============================================================ audio (WebAudio chiptune)
const AU = { ctx: null, master: null, music: null, sfx: null, muted: store.get('muted', false), lastShot: 0, seqT: 0, step: 0, timer: null };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const a = new AC(); AU.ctx = a;
  AU.master = a.createGain(); AU.master.gain.value = AU.muted ? 0 : 0.8; AU.master.connect(a.destination);
  AU.sfx = a.createGain(); AU.sfx.gain.value = 0.9; AU.sfx.connect(AU.master);
  AU.music = a.createGain(); AU.music.gain.value = 0.45; AU.music.connect(AU.master);
  const len = a.sampleRate * 0.5, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AU.noise = buf;
  AU.seqT = a.currentTime + 0.1;
  AU.timer = setInterval(musicTick, 30);
}
function setMuted(m) { AU.muted = m; store.set('muted', m); if (AU.master) AU.master.gain.value = m ? 0 : 0.8; }
function tone(freq, dur, type = 'square', vol = 0.1, slide = 0, when = 0, dest = null) {
  const a = AU.ctx; if (!a || AU.muted) return;
  const t = (when || a.currentTime);
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest || AU.sfx); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.1, freq = 2000, when = 0, dest = null, q = 0.7) {
  const a = AU.ctx; if (!a || AU.muted) return;
  const t = when || a.currentTime;
  const s = a.createBufferSource(); s.buffer = AU.noise;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || AU.sfx); s.start(t); s.stop(t + dur + 0.02);
}
const sfx = {
  shoot(pid) { const a = AU.ctx; if (!a) return; if (a.currentTime - AU.lastShot < 0.045) return; AU.lastShot = a.currentTime; tone(pid ? 1050 : 880, 0.06, 'square', 0.025, pid ? 520 : 420); },
  hit() { noise(0.04, 0.05, 3500); },
  kill() { tone(rand(260, 320), 0.09, 'square', 0.05, 90); },
  gem(n) { tone(900 + Math.min(n, 20) * 45, 0.05, 'sine', 0.06, 1400 + Math.min(n, 20) * 60); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.06, 0, AU.ctx && AU.ctx.currentTime + i * 0.07)); },
  hurt() { tone(220, 0.18, 'sawtooth', 0.08, 60); noise(0.1, 0.06, 1200); },
  boom() { noise(0.35, 0.16, 900); tone(120, 0.3, 'sine', 0.12, 35); },
  quack() {
    const a = AU.ctx; if (!a || AU.muted) return;
    const t = a.currentTime, o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(rand(520, 600), t); o.frequency.exponentialRampToValueAtTime(330, t + 0.13);
    f.type = 'bandpass'; f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.13); f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.15);
    o.connect(f); f.connect(g); g.connect(AU.sfx); o.start(t); o.stop(t + 0.17);
  },
  zap() { tone(1600, 0.12, 'sawtooth', 0.04, 200); noise(0.08, 0.04, 6000); },
  pickup() { tone(660, 0.07, 'square', 0.06, 0); tone(990, 0.1, 'square', 0.06, 0, AU.ctx && AU.ctx.currentTime + 0.07); },
  warn() { for (let i = 0; i < 3; i++) { const t = AU.ctx && AU.ctx.currentTime + i * 0.35; tone(330, 0.25, 'square', 0.06, 220, t); } },
  revive() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.1, 'triangle', 0.08, 0, AU.ctx && AU.ctx.currentTime + i * 0.06)); },
  click() { tone(700, 0.04, 'square', 0.05, 900); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, f * 0.97, AU.ctx && AU.ctx.currentTime + i * 0.22)); },
};
// tiny looping chiptune: A minor, 150bpm, 16th notes
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const BASS = [45, 0, 45, 57, 0, 45, 55, 0, 41, 0, 41, 53, 0, 41, 52, 0, 43, 0, 43, 55, 0, 43, 50, 0, 40, 0, 40, 52, 0, 52, 47, 0];
const LEAD = [
  69, 0, 72, 0, 76, 0, 74, 72, 0, 0, 69, 0, 72, 0, 0, 0, 65, 0, 69, 0, 72, 0, 71, 69, 0, 0, 65, 0, 69, 0, 0, 0,
  67, 0, 71, 0, 74, 0, 72, 71, 0, 0, 67, 0, 71, 0, 74, 0, 64, 0, 68, 0, 71, 0, 76, 0, 74, 0, 72, 0, 71, 0, 68, 0,
];
function musicTick() {
  const a = AU.ctx; if (!a) return;
  const stepDur = 60 / 150 / 4;
  if (AU.seqT < a.currentTime - 0.5) AU.seqT = a.currentTime + 0.05;
  while (AU.seqT < a.currentTime + 0.15) {
    const s = AU.step, t = AU.seqT, intense = G.mode === 'play';
    if (!AU.muted && !G.paused) {
      const b = s % 2 === 0 ? BASS[(s >> 1) % 32] : 0;
      if (b) tone(NOTE(b), stepDur * 1.8, 'triangle', 0.13, 0, t, AU.music);
      const l = LEAD[s % 64];
      if (l && intense) tone(NOTE(l), stepDur * 1.6, 'square', 0.035, 0, t, AU.music);
      if (intense) {
        if (s % 8 === 0) tone(150, 0.12, 'sine', 0.22, 40, t, AU.music);
        if (s % 8 === 4) noise(0.09, 0.07, 3000, t, AU.music);
        if (s % 2 === 1) noise(0.025, 0.025, 9000, t, AU.music);
      }
    }
    AU.seqT += stepDur; AU.step = (s + 1) % 64;
  }
}

// ============================================================ world decoration
const WORLD = 1600;
const grassTile = (() => {
  const c = mkCanvas(96, 96), g = c.getContext('2d');
  g.fillStyle = C.grass; g.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? C.grassD : C.grassL; g.fillRect(rint(0, 95), rint(0, 95), 1, Math.random() < 0.3 ? 2 : 1); }
  for (let i = 0; i < 14; i++) { const x = rint(1, 93), y = rint(1, 93); g.fillStyle = C.grassD; g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 3); }
  return c;
})();
const waterTile = (() => {
  const c = mkCanvas(32, 32), g = c.getContext('2d');
  g.fillStyle = C.water; g.fillRect(0, 0, 32, 32);
  g.fillStyle = C.waterL;
  for (let i = 0; i < 6; i++) { const x = rint(0, 28), y = rint(0, 30); g.fillRect(x, y, 4, 1); }
  return c;
})();
let grassPat = null, waterPat = null;
const DECO_SPR = [
  spr(['.p.', 'pyp', '.p.'], { p: '#ff6fae', y: '#ffd23f' }, null),
  spr(['.w.', 'wyw', '.w.'], { w: '#fff8e7', y: '#ffd23f' }, null),
  spr(['.b.', 'byb', '.b.'], { b: '#7ab8ff', y: '#ffd23f' }),
  spr(['.ggg.', 'ggGgg', 'gGggG'], { g: '#3f8f3a', G: '#6fd06a' }),
  spr(['.rr.', 'rRrr', 'rrrr'], { r: '#8b8aa0', R: '#c3c2d4' }),
  spr(['.RRR.', 'RwRwR', '..s..', '..s..'], { R: '#e8343b', w: '#fff8e7', s: '#f2e3c6' }),
  spr(['..ggg...', '.gGgggg.', 'ggggGggg', 'gGgggggG', '.gggggg.', '...bb...'], { g: '#3f8f3a', G: '#6fd06a', b: '#7a4a24' }),
];
let DECOS = [];
function makeDecos() {
  DECOS = [];
  for (let i = 0; i < 700; i++) {
    const t = Math.random(), kind = t < 0.45 ? rint(0, 2) : t < 0.7 ? 3 : t < 0.82 ? 4 : t < 0.9 ? 5 : 6;
    DECOS.push({ x: rand(20, WORLD - 20), y: rand(20, WORLD - 20), s: DECO_SPR[kind] });
  }
}

// ============================================================ game state
const G = {
  mode: 'title', np: 1, t: 0, paused: false, players: [], enemies: [], bullets: [], ebullets: [], gems: [], pickups: [],
  parts: [], texts: [], fx: [], decals: [], bombs: [], views: [], spawnAcc: 0, nextEvent: 45, eventN: 0, nextBoss: 150,
  bossCount: 0, kills: 0, overT: 0, overDelay: 0, banners: [], gemCombo: 0, gemComboT: 0, titleSel: 0, best: store.get('best', 0),
  newBest: false, menuT: 0, uid: 1, hintT: 0, pauseSel: 0,
};

function xpFor(lv) { return Math.round(3 + lv * 4 + lv * lv * 0.45); }

function newPlayer(id) {
  return {
    id, x: WORLD / 2 + (G.np === 2 ? (id ? 18 : -18) : 0), y: WORLD / 2, r: 5, hp: 100, maxHp: 100, facing: 1, ax: 1, ay: 0,
    iframes: 0, dashT: 0, dashCd: 0, dvx: 0, dvy: 0, dashHit: new Set(), xp: 0, level: 1, xpNext: xpFor(1), kills: 0,
    down: false, reviveT: 0, up: { blaster: 1 }, tm: { blaster: 0.3, bread: 1, zap: 1.5, quack: 2 }, pending: 0, choice: null,
    sel: 1, choiceDelay: 0, anim: 0, moving: false, eggAng: 0, trail: [], hurtFlash: 0, regenAcc: 0, moved: false, aimT: null,
  };
}
const lvl = (p, k) => p.up[k] || 0;
const pSpeed = p => 70 * (1 + 0.1 * lvl(p, 'speed'));
const pMagnet = p => 34 * (1 + 0.45 * lvl(p, 'magnet'));
const pDashCd = p => 1.25 * (1 - 0.12 * lvl(p, 'dash'));

function startGame(np) {
  audioInit();
  Object.assign(G, {
    mode: 'play', np, t: 0, paused: false, enemies: [], bullets: [], ebullets: [], gems: [], pickups: [], parts: [], texts: [],
    fx: [], decals: [], bombs: [], spawnAcc: 0, nextEvent: 45, eventN: 0, nextBoss: 150, bossCount: 0, kills: 0, overT: 0,
    banners: [], newBest: false, hintT: 0,
  });
  G.players = [];
  for (let i = 0; i < np; i++) G.players.push(newPlayer(i));
  makeDecos();
  layoutViews();
  for (const v of G.views) { const p = G.players[v.pid]; v.camX = p.x - v.w / 2; v.camY = p.y - v.h / 2; }
  banner('SURVIVE!', C.gold, 2);
  for (let i = 0; i < 6; i++) spawnEnemy('carrot', spawnPos());
}

function layoutViews() {
  const old = G.views;
  G.views = [];
  if (G.mode === 'title') { G.views.push({ pid: 0, x: 0, y: 0, w: W, h: H, camX: 0, camY: 0, shake: 0 }); return; }
  if (G.np === 1) G.views.push({ pid: 0, x: 0, y: 0, w: W, h: H });
  else if (W >= H) { const hw = Math.floor(W / 2); G.views.push({ pid: 0, x: 0, y: 0, w: hw - 1, h: H }, { pid: 1, x: hw + 1, y: 0, w: W - hw - 1, h: H }); }
  else { const hh = Math.floor(H / 2); G.views.push({ pid: 0, x: 0, y: hh + 1, w: W, h: H - hh - 1 }, { pid: 1, x: 0, y: 0, w: W, h: hh - 1 }); }
  for (const v of G.views) {
    const o = old && old.find(q => q.pid === v.pid);
    const p = G.players[v.pid];
    v.camX = o && o.camX !== undefined ? o.camX : (p ? p.x - v.w / 2 : 0);
    v.camY = o && o.camY !== undefined ? o.camY : (p ? p.y - v.h / 2 : 0);
    v.shake = 0; v.flash = 0;
  }
}

// ============================================================ effects helpers
function banner(str, col, dur = 2.2, sub = '') { G.banners.push({ str, col, t: 0, dur, sub }); }
function floatText(x, y, str, col = C.white, life = 0.6, sc = 1) {
  if (G.texts.length > 90) G.texts.shift();
  G.texts.push({ x, y, str, col, life, max: life, sc });
}
function burst(x, y, col, n = 8, spd = 60, life = 0.45, size = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(spd * 0.3, spd);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(life * 0.5, life), col: Array.isArray(col) ? pick(col) : col, size, grav: 120 });
  }
  if (G.parts.length > 600) G.parts.splice(0, G.parts.length - 600);
}
function splat(x, y, col, n = 10, r = 6) {
  const px = [];
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), d = rand(0, r); px.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d * 0.7)]); }
  G.decals.push({ x: Math.round(x), y: Math.round(y), col, px, life: 10 });
  if (G.decals.length > 140) G.decals.shift();
}
function shakeFor(p, amt) { for (const v of G.views) if (!p || v.pid === p.id) v.shake = Math.max(v.shake || 0, amt); }
function shakeAt(x, y, amt) { for (const v of G.views) { const p = G.players[v.pid]; if (p && d2(p.x, p.y, x, y) < 160 * 160) v.shake = Math.max(v.shake || 0, amt); } }

// ============================================================ enemies
const ETYPE = {
  carrot: { s: 'carrot', hp: 10, spd: 47, dmg: 7, r: 4, xp: 1, col: ['#ff8c1a', '#51cf66'], juice: '#ff8c1a' },
  tomato: { s: 'tomato', hp: 15, spd: 37, dmg: 16, r: 5, xp: 1, col: ['#e8343b', '#ff9aa2'], juice: '#c81d25', explode: true },
  peapod: { s: 'peapod', hp: 26, spd: 30, dmg: 8, r: 5, xp: 2, col: ['#2f9e44', '#a9e34b'], juice: '#69db7c', split: true },
  pea: { s: 'pea', hp: 4, spd: 64, dmg: 4, r: 3, xp: 0, col: ['#a9e34b'], juice: '#a9e34b' },
  broccoli: { s: 'broccoli', hp: 65, spd: 22, dmg: 12, r: 7, xp: 4, col: ['#2f9e44', '#69db7c'], juice: '#2f9e44', heavy: 0.35 },
  eggplant: { s: 'eggplant', hp: 24, spd: 30, dmg: 8, r: 5, xp: 3, col: ['#7b2cbf', '#b07ce8'], juice: '#7b2cbf', ranged: true },
  boss: { s: 'pumpkin', hp: 1200, spd: 24, dmg: 20, r: 14, xp: 0, col: ['#ff8c1a', '#ffd23f', '#d9620b'], juice: '#d9620b', heavy: 0.06, boss: true },
};
const hpMul = () => 1 + G.t / 100 + Math.pow(G.t / 280, 2);
function spawnEnemy(type, pos, hpScale = 1) {
  const d = ETYPE[type];
  const hp = d.hp * (d.boss ? 1 : hpMul()) * hpScale;
  const e = {
    id: G.uid++, type, d, x: pos.x, y: pos.y, kx: 0, ky: 0, hp, maxHp: hp, r: d.r, spd: d.spd * rand(0.9, 1.1), dmg: d.dmg * (1 + G.t / 400),
    flash: 0, anim: rand(0, 10), dead: false, eggCd: 0, shootT: rand(1.5, 3), fuse: -1, flip: false,
    bs: 'walk', bt: 3,
  };
  G.enemies.push(e);
  return e;
}
function alivePlayers() { return G.players.filter(p => !p.down); }
function spawnPos() {
  let x = WORLD / 2, y = WORLD / 2;
  const alive = alivePlayers(); if (!alive.length) return { x, y };
  for (let tries = 0; tries < 10; tries++) {
    const p = pick(alive);
    const v = G.views.find(q => q.pid === p.id) || G.views[0];
    const hw = v.w / 2 + 14, hh = v.h / 2 + 14, side = rint(0, 3);
    if (side === 0) { x = p.x + rand(-hw, hw); y = p.y - hh; } else if (side === 1) { x = p.x + rand(-hw, hw); y = p.y + hh; }
    else if (side === 2) { x = p.x - hw; y = p.y + rand(-hh, hh); } else { x = p.x + hw; y = p.y + rand(-hh, hh); }
    x = clamp(x, 10, WORLD - 10); y = clamp(y, 10, WORLD - 10);
    if (!G.views.some(q => x > q.camX - 6 && x < q.camX + q.w + 6 && y > q.camY - 6 && y < q.camY + q.h + 6)) break;
  }
  return { x, y };
}
function rollType() {
  const t = G.t, w = [['carrot', 10]];
  if (t > 25) w.push(['tomato', 4 + t / 60]);
  if (t > 55) w.push(['peapod', 3]);
  if (t > 85) w.push(['eggplant', 2.5]);
  if (t > 110) w.push(['broccoli', 2 + t / 120]);
  let s = 0; for (const [, n] of w) s += n;
  let r = Math.random() * s;
  for (const [k, n] of w) { r -= n; if (r <= 0) return k; }
  return 'carrot';
}

// spatial hash for enemy queries
const CELL = 32, grid = new Map();
function buildGrid() {
  grid.clear();
  for (const e of G.enemies) {
    if (e.dead) continue;
    const k = ((e.x / CELL) | 0) + ((e.y / CELL) | 0) * 1000;
    let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(e);
  }
}
function forNear(x, y, r, fn) {
  const x0 = ((x - r) / CELL) | 0, x1 = ((x + r) / CELL) | 0, y0 = ((y - r) / CELL) | 0, y1 = ((y + r) / CELL) | 0;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    const a = grid.get(cx + cy * 1000); if (!a) continue;
    for (let i = 0; i < a.length; i++) if (!a[i].dead && fn(a[i]) === true) return;
  }
}
function nearestEnemy(x, y, maxR, skip) {
  let best = null, bd = maxR * maxR;
  for (const e of G.enemies) {
    if (e.dead || (skip && skip.has(e))) continue;
    const dd = d2(x, y, e.x, e.y); if (dd < bd) { bd = dd; best = e; }
  }
  return best;
}

function hurtEnemy(e, dmg, kx, ky, kb, owner) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.08;
  const res = e.d.heavy || 1; // heavy veggies barely budge
  e.kx += kx * kb * res; e.ky += ky * kb * res;
  floatText(e.x + rand(-3, 3), e.y - e.r - 4, Math.round(dmg), dmg >= 40 ? C.gold : C.white, 0.5);
  if (e.hp <= 0) killEnemy(e, owner); else sfx.hit();
}
function killEnemy(e, owner) {
  e.dead = true; G.kills++;
  if (owner) owner.kills++;
  burst(e.x, e.y, e.d.col, e.d.boss ? 50 : 9, e.d.boss ? 120 : 70, 0.5, e.d.boss ? 2 : 1);
  splat(e.x, e.y + 2, e.d.juice, e.d.boss ? 40 : 10, e.d.boss ? 18 : 5);
  sfx.kill();
  if (e.d.xp) dropGem(e.x, e.y, e.d.xp);
  const luck = Math.random();
  if (luck < 0.012) G.pickups.push({ k: 'heart', x: e.x, y: e.y, t: 0 });
  else if (luck < 0.016) G.pickups.push({ k: 'magnet', x: e.x, y: e.y, t: 0 });
  else if (luck < 0.019) G.pickups.push({ k: 'sauce', x: e.x, y: e.y, t: 0 });
  if (e.d.explode) explode(e.x, e.y, 24, 22 * hpMul(), owner, false);
  if (e.d.split) for (let i = 0; i < 3; i++) { const p = spawnEnemy('pea', { x: e.x + rand(-4, 4), y: e.y + rand(-4, 4) }); p.kx = rand(-80, 80); p.ky = rand(-80, 80); }
  if (e.d.boss) {
    sfx.boom(); shakeAt(e.x, e.y, 8);
    for (let i = 0; i < 24; i++) dropGem(e.x + rand(-20, 20), e.y + rand(-20, 20), 5);
    G.pickups.push({ k: 'goldcorn', x: e.x - 8, y: e.y, t: 0 }, { k: 'heart', x: e.x + 8, y: e.y, t: 0 });
    if (G.np === 2) G.pickups.push({ k: 'goldcorn', x: e.x, y: e.y + 10, t: 0 });
    banner('PUMPKIN KING SMASHED!', C.gold, 2.5);
  }
}
function dropGem(x, y, v) {
  if (G.gems.length > 380) {
    for (const g of G.gems) if (!g.tgt && d2(g.x, g.y, x, y) < 60 * 60) { g.v += v; return; }
  }
  G.gems.push({ x, y, v, tgt: null, sp: 0, bob: rand(0, 6) });
}
function explode(x, y, r, dmg, owner, hurtsPlayers) {
  G.fx.push({ k: 'boom', x, y, r, t: 0, dur: 0.3 });
  burst(x, y, ['#ffd23f', '#ff8c1a', '#e8343b', '#fff8e7'], 14, 90, 0.4);
  sfx.boom(); shakeAt(x, y, hurtsPlayers ? 5 : 3);
  forNear(x, y, r + 8, e => {
    if (d2(x, y, e.x, e.y) < (r + e.r) * (r + e.r)) {
      const a = Math.atan2(e.y - y, e.x - x);
      hurtEnemy(e, dmg, Math.cos(a), Math.sin(a), 140, owner);
    }
  });
  if (hurtsPlayers) for (const p of alivePlayers()) if (d2(x, y, p.x, p.y) < (r + p.r) * (r + p.r)) hurtPlayer(p, dmg);
}

// ============================================================ players
function hurtPlayer(p, dmg) {
  if (p.down || p.iframes > 0 || p.dashT > 0) return;
  p.hp -= dmg; p.iframes = 0.6; p.hurtFlash = 0.25;
  sfx.hurt(); shakeFor(p, 4);
  floatText(p.x, p.y - 12, '-' + Math.round(dmg), C.red, 0.7);
  burst(p.x, p.y, ['#fff8e7', PCOL[p.id]], 6, 50, 0.4);
  if (p.hp <= 0) {
    p.hp = 0; p.down = true; p.reviveT = 0; p.trail = [];
    burst(p.x, p.y, ['#fff8e7', '#ffd23f'], 20, 90, 0.7);
    if (alivePlayers().length) banner(PNAME[p.id] + ' IS DOWN!', PCOL[p.id], 2, 'STAND NEXT TO THEM TO REVIVE');
  }
}

const UPG = [
  { k: 'rapid', name: 'RAPID FIRE', max: 5, d: () => 'SHOOT 16% FASTER' },
  { k: 'power', name: 'BIG BULLETS', max: 5, d: () => '+35% BLASTER DAMAGE' },
  { k: 'spread', name: 'SPREAD SHOT', max: 4, d: () => '+1 BULLET PER SHOT' },
  { k: 'pierce', name: 'PIERCING', max: 3, d: () => 'BULLETS PASS THROUGH +1' },
  { k: 'egg', name: 'EGG ORBIT', max: 5, d: l => l ? '+1 EGG, MORE DAMAGE' : 'SPINNING EGGS GUARD YOU' },
  { k: 'bread', name: 'BREAD BOMB', max: 5, d: l => l ? 'BIGGER, FASTER BOOMS' : 'LOB EXPLODING BREAD' },
  { k: 'zap', name: 'ZAP', max: 5, d: l => l ? 'MORE CHAINS + DAMAGE' : 'CHAIN LIGHTNING' },
  { k: 'quack', name: 'MEGA QUACK', max: 5, d: l => l ? 'BIGGER SHOCKWAVE' : 'QUACK KNOCKS FOES BACK' },
  { k: 'speed', name: 'SWIFT FEET', max: 5, d: () => '+10% MOVE SPEED' },
  { k: 'heart', name: 'BIG HEART', max: 5, d: () => '+20 MAX HP AND HEAL' },
  { k: 'magnet', name: 'CORN MAGNET', max: 4, d: () => 'GRAB XP FROM FARTHER' },
  { k: 'regen', name: 'REGEN', max: 5, d: () => 'HEAL 0.6 HP PER SEC' },
  { k: 'dash', name: 'DASH ATTACK', max: 5, d: l => l ? 'MORE DASH DAMAGE' : 'DASH HURTS VEGGIES' },
];
function rollChoices(p) {
  const pool = UPG.filter(u => lvl(p, u.k) < u.max);
  // early on, favour new weapons a bit so builds get fun quickly
  const opts = [];
  while (opts.length < 3 && pool.length) {
    let i = Math.floor(Math.random() * pool.length);
    if (p.level <= 6 && Math.random() < 0.35) { const w = pool.findIndex(u => ['egg', 'bread', 'zap', 'quack'].includes(u.k) && !lvl(p, u.k)); if (w >= 0) i = w; }
    opts.push(pool.splice(i, 1)[0]);
  }
  while (opts.length < 3) opts.push({ k: 'snack', name: 'SNACK', max: 99, d: () => 'HEAL 40 HP' });
  return opts;
}
function applyUpgrade(p, u) {
  sfx.pickup();
  if (u.k === 'snack') { p.hp = Math.min(p.maxHp, p.hp + 40); } else {
    p.up[u.k] = lvl(p, u.k) + 1;
    if (u.k === 'heart') { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 30); }
  }
  floatText(p.x, p.y - 14, u.name + '!', PCOL[p.id], 1.1);
  p.pending--; p.choice = null;
}
function gainXp(p, v) {
  p.xp += v;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext; p.level++; p.xpNext = xpFor(p.level); p.pending++;
    sfx.level(); floatText(p.x, p.y - 16, 'LEVEL UP!', C.gold, 1.2);
    burst(p.x, p.y, ['#ffd23f', '#fff8e7', PCOL[p.id]], 18, 80, 0.6);
  }
}

// ============================================================ input
const keys = new Set();
const TEST = { bot: [null, null] };
const dashReq = [false, false];
const navReq = [{ dx: 0, ok: false }, { dx: 0, ok: false }];
const KEYMAP = {
  0: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], dash: ['Space', 'ShiftLeft', 'KeyF'] },
  1: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], dash: ['Enter', 'ShiftRight', 'NumpadEnter', 'Slash', 'Numpad0'] },
};
let usingTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function keyOwner(code) {
  for (const id of [0, 1]) for (const k in KEYMAP[id]) if (KEYMAP[id][k].includes(code)) return { id, k };
  return null;
}
window.addEventListener('keydown', e => {
  if (e.code === 'F11' || e.code === 'F12') return;
  e.preventDefault();
  audioInit();
  if (e.repeat) return;
  keys.add(e.code);
  const o = keyOwner(e.code);
  const pid = o ? (G.np === 1 ? 0 : o.id) : -1;
  if (G.mode === 'title') {
    if (e.code === 'Digit1' || e.code === 'Numpad1') { startGame(1); return; }
    if (e.code === 'Digit2' || e.code === 'Numpad2') { startGame(2); return; }
    if (o && (o.k === 'left' || o.k === 'up')) { G.titleSel = 0; sfx.click(); }
    if (o && (o.k === 'right' || o.k === 'down')) { G.titleSel = 1; sfx.click(); }
    if (o && o.k === 'dash') startGame(G.titleSel + 1);
    return;
  }
  if (G.mode === 'over') { if (G.overDelay <= 0 && (o && o.k === 'dash' || e.code === 'Escape')) toTitle(); return; }
  if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
  if (G.paused) {
    if (o && (o.k === 'up' || o.k === 'left')) { G.pauseSel = (G.pauseSel + 2) % 3; sfx.click(); }
    if (o && (o.k === 'down' || o.k === 'right')) { G.pauseSel = (G.pauseSel + 1) % 3; sfx.click(); }
    if (o && o.k === 'dash') pauseAction(G.pauseSel);
    return;
  }
  if (e.code === 'KeyM') setMuted(!AU.muted);
  if (o && pid >= 0) {
    if (o.k === 'dash') { dashReq[pid] = true; navReq[pid].ok = true; }
    if (o.k === 'left') navReq[pid].dx = -1;
    if (o.k === 'right') navReq[pid].dx = 1;
  }
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); if (G.mode === 'play' && !G.paused) togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play' && !G.paused) togglePause(); });

// gamepads
const padPrev = [{}, {}, {}, {}];
function readPads() {
  const out = [];
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let n = 0;
  for (const gp of pads) {
    if (!gp || !gp.connected) continue;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    let x = Math.abs(ax) > 0.2 ? ax : 0, y = Math.abs(ay) > 0.2 ? ay : 0;
    const b = i => gp.buttons[i] && gp.buttons[i].pressed;
    if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1;
    const dash = b(0) || b(1) || b(5) || b(7) || b(4) || b(6);
    const start = b(9);
    const prev = padPrev[n] || {};
    out.push({ x, y, dash, dashP: dash && !prev.dash, startP: start && !prev.start, leftP: x < -0.5 && !(prev.x < -0.5), rightP: x > 0.5 && !(prev.x > 0.5), upP: y < -0.5 && !(prev.y < -0.5), downP: y > 0.5 && !(prev.y > 0.5) });
    padPrev[n] = { dash, start, x, y };
    if (++n >= 2) break;
  }
  return out;
}

// touch / mouse (pointer events): floating joystick per split-screen half + dash button
const pointers = new Map();
const sticks = [null, null];
const STICK_R = 20;
function toGame(e) { return { x: e.clientX * DPR / SCALE, y: e.clientY * DPR / SCALE }; }
function viewAt(x, y) { return G.views.find(v => x >= v.x - 1 && x < v.x + v.w + 1 && y >= v.y - 1 && y < v.y + v.h + 1); }
function dashBtn(v) {
  const r = 15;
  if (G.np === 1) return { x: v.x + v.w - r - 12, y: v.y + v.h - r - 12, r };
  if (W >= H) return v.pid === 0 ? { x: v.x + r + 10, y: v.y + v.h - r - 12, r } : { x: v.x + v.w - r - 10, y: v.y + v.h - r - 12, r };
  return { x: v.x + v.w - r - 12, y: v.y + v.h - r - 10, r };
}
function inCircle(p, c, pad = 4) { return d2(p.x, p.y, c.x, c.y) < (c.r + pad) * (c.r + pad); }
const topButtons = () => {
  const cx = Math.floor(W / 2);
  return { pause: { x: cx - 30, y: 3, w: 11, h: 11 }, mute: { x: cx + 19, y: 3, w: 11, h: 11 }, fs: { x: cx + 33, y: 3, w: 11, h: 11 } };
};
// Fullscreen works in browsers and the Electron window. The Android app is already full-screen, so hide the button there.
const fsSupported = () => !!document.fullscreenEnabled && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  } catch (e) { /* not allowed here */ }
}
const inRect = (p, r) => p.x >= r.x - 3 && p.x < r.x + r.w + 3 && p.y >= r.y - 3 && p.y < r.y + r.h + 3;

cvs.addEventListener('pointerdown', e => {
  e.preventDefault();
  audioInit();
  if (e.pointerType === 'touch') usingTouch = true;
  try { cvs.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const p = toGame(e);
  if (G.mode === 'title') { titleClick(p); return; }
  if (G.mode === 'over') { if (G.overDelay <= 0) toTitle(); return; }
  const tb = topButtons();
  if (inRect(p, tb.pause)) { togglePause(); sfx.click(); return; }
  if (inRect(p, tb.mute)) { setMuted(!AU.muted); sfx.click(); return; }
  if (fsSupported() && inRect(p, tb.fs)) { toggleFullscreen(); sfx.click(); return; }
  if (G.paused) { pauseClick(p); return; }
  if (choosingActive()) { cardClick(p); return; }
  const v = viewAt(p.x, p.y); if (!v) return;
  const pid = v.pid;
  if (usingTouch && inCircle(p, dashBtn(v))) { dashReq[pid] = true; pointers.set(e.pointerId, { pid, role: 'dash' }); return; }
  if (!sticks[pid]) {
    sticks[pid] = { id: e.pointerId, bx: p.x, by: p.y, x: p.x, y: p.y };
    pointers.set(e.pointerId, { pid, role: 'stick' });
  } else { dashReq[pid] = true; pointers.set(e.pointerId, { pid, role: 'dash' }); }
}, { passive: false });
cvs.addEventListener('pointermove', e => {
  const ptr = pointers.get(e.pointerId); if (!ptr || ptr.role !== 'stick') return;
  const s = sticks[ptr.pid]; if (!s || s.id !== e.pointerId) return;
  const p = toGame(e); s.x = p.x; s.y = p.y;
  // drag the base along if the finger goes far, so the stick never "runs out"
  const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy);
  if (dl > STICK_R * 1.6) { s.bx = s.x - dx / dl * STICK_R * 1.6; s.by = s.y - dy / dl * STICK_R * 1.6; }
}, { passive: false });
function endPointer(e) {
  const ptr = pointers.get(e.pointerId);
  if (ptr && ptr.role === 'stick' && sticks[ptr.pid] && sticks[ptr.pid].id === e.pointerId) sticks[ptr.pid] = null;
  pointers.delete(e.pointerId);
}
cvs.addEventListener('pointerup', endPointer);
cvs.addEventListener('pointercancel', endPointer);
cvs.addEventListener('contextmenu', e => e.preventDefault());

function moveInput(pid, pads) {
  let x = 0, y = 0;
  const ids = G.np === 1 ? [0, 1] : [pid];
  for (const id of ids) {
    const m = KEYMAP[id], has = arr => arr.some(k => keys.has(k));
    if (has(m.left)) x -= 1; if (has(m.right)) x += 1; if (has(m.up)) y -= 1; if (has(m.down)) y += 1;
  }
  const s = sticks[pid];
  if (s) {
    const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy);
    if (dl > 2) { const m = Math.min(1, dl / STICK_R); x += dx / dl * m; y += dy / dl * m; }
  }
  const bot = TEST.bot[pid]; if (bot) { x += bot.x; y += bot.y; }
  const padList = G.np === 1 ? pads : (pads[pid] ? [pads[pid]] : []);
  for (const pd of padList) { x += pd.x; y += pd.y; }
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  return { x, y };
}

// ============================================================ menus
function toTitle() { G.mode = 'title'; G.paused = false; G.menuT = 0; layoutViews(); sticks[0] = sticks[1] = null; pointers.clear(); }
function togglePause() {
  if (G.mode !== 'play') return;
  G.paused = !G.paused; G.pauseSel = 0;
  sticks[0] = sticks[1] = null;
}
function pauseButtons() {
  const bw = 84, bh = 16, x = Math.floor(W / 2 - bw / 2), y0 = Math.floor(H / 2 - 18);
  return [
    { x, y: y0, w: bw, h: bh, label: 'RESUME' },
    { x, y: y0 + 22, w: bw, h: bh, label: AU.muted ? 'SOUND: OFF' : 'SOUND: ON' },
    { x, y: y0 + 44, w: bw, h: bh, label: 'QUIT TO MENU' },
  ];
}
function pauseAction(i) {
  sfx.click();
  if (i === 0) togglePause();
  else if (i === 1) setMuted(!AU.muted);
  else toTitle();
}
function pauseClick(p) { pauseButtons().forEach((b, i) => { if (inRect(p, b)) pauseAction(i); }); }
function titleButtons() {
  const bw = Math.min(110, Math.floor(W / 2 - 16)), bh = 30, gap = 10;
  const y = Math.floor(H * 0.56);
  return [
    { x: Math.floor(W / 2 - bw - gap / 2), y, w: bw, h: bh, np: 1 },
    { x: Math.floor(W / 2 + gap / 2), y, w: bw, h: bh, np: 2 },
  ];
}
function titleClick(p) {
  if (inRect(p, { x: W - 16, y: 3, w: 11, h: 11 })) { setMuted(!AU.muted); sfx.click(); return; }
  if (fsSupported() && inRect(p, { x: W - 30, y: 3, w: 11, h: 11 })) { toggleFullscreen(); sfx.click(); return; }
  for (const b of titleButtons()) if (inRect(p, b)) { sfx.click(); startGame(b.np); return; }
}
function choosingActive() { return G.mode === 'play' && G.players.some(p => p.pending > 0 && !p.down); }
function cardRects(v) {
  const n = 3, gap = 5;
  const cw = Math.min(72, Math.floor((v.w - 16 - gap * 2) / 3));
  const ch = Math.min(80, v.h - 56);
  const total = cw * n + gap * (n - 1);
  const x0 = v.x + Math.floor((v.w - total) / 2), y0 = v.y + Math.floor((v.h - ch) / 2) + 10;
  const r = [];
  for (let i = 0; i < n; i++) r.push({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch });
  return r;
}
function cardClick(pt) {
  const v = viewAt(pt.x, pt.y); if (!v) return;
  const p = G.players[v.pid];
  if (!p || !p.choice || p.choiceDelay > 0) return;
  cardRects(v).forEach((r, i) => { if (inRect(pt, r)) { p.sel = i; applyUpgrade(p, p.choice[i]); } });
}

// ============================================================ update
let pads = [];
function update(dt) {
  pads = readPads();
  // gamepad → menus
  if (G.mode === 'title') {
    G.menuT += dt;
    for (const pd of pads) {
      if (pd.leftP || pd.upP) { G.titleSel = 0; sfx.click(); }
      if (pd.rightP || pd.downP) { G.titleSel = 1; sfx.click(); }
      if (pd.dashP || pd.startP) { audioInit(); startGame(G.titleSel + 1); return; }
    }
    updateTitleAnim(dt);
    return;
  }
  if (G.mode === 'over') {
    G.overDelay -= dt;
    for (const pd of pads) if ((pd.dashP || pd.startP) && G.overDelay <= 0) toTitle();
    updateParticles(dt * 0.5);
    return;
  }
  pads.forEach((pd, i) => {
    if (pd.startP) togglePause();
    const pid = G.np === 1 ? 0 : i;
    if (G.paused) {
      if (pd.upP || pd.leftP) { G.pauseSel = (G.pauseSel + 2) % 3; sfx.click(); }
      if (pd.downP || pd.rightP) { G.pauseSel = (G.pauseSel + 1) % 3; sfx.click(); }
      if (pd.dashP) pauseAction(G.pauseSel);
      return;
    }
    if (pd.dashP) { dashReq[pid] = true; navReq[pid].ok = true; }
    if (pd.leftP) navReq[pid].dx = -1;
    if (pd.rightP) navReq[pid].dx = 1;
  });
  if (G.paused) { clearReqs(); return; }

  // level-up choices pause the action
  if (choosingActive()) {
    for (const p of G.players) {
      if (p.pending > 0 && !p.down) {
        if (!p.choice) { p.choice = rollChoices(p); p.sel = 1; p.choiceDelay = 0.35; }
        p.choiceDelay -= dt;
        if (p.choiceDelay <= 0) {
          const nr = navReq[p.id];
          if (nr.dx) { p.sel = (p.sel + nr.dx + 3) % 3; sfx.click(); }
          if (nr.ok) applyUpgrade(p, p.choice[p.sel]);
        }
      }
    }
    clearReqs();
    for (const v of G.views) v.shake = 0;
    return;
  }

  if (G.overT > 0) {
    G.overT -= dt; dt *= 0.3;
    if (G.overT <= 0) { gameOver(); return; }
  }

  G.t += dt;
  G.hintT += dt;
  buildGrid();
  director(dt);
  for (const p of G.players) updatePlayer(p, dt);
  updateEnemies(dt);
  buildGrid();
  updateBullets(dt);
  updateBombs(dt);
  updateGems(dt);
  updatePickups(dt);
  updateParticles(dt);
  for (const f of G.fx) f.t += dt;
  G.fx = G.fx.filter(f => f.t < f.dur);
  for (const d of G.decals) d.life -= dt;
  G.decals = G.decals.filter(d => d.life > 0);
  G.enemies = G.enemies.filter(e => !e.dead);
  for (const b of G.banners) b.t += dt;
  G.banners = G.banners.filter(b => b.t < b.dur);
  if (G.banners.length > 2) G.banners.splice(0, G.banners.length - 2);
  G.gemComboT -= dt; if (G.gemComboT <= 0) G.gemCombo = 0;

  if (G.overT <= 0 && !alivePlayers().length) { G.overT = 1.4; }
  updateCameras(dt);
  clearReqs();
}
function clearReqs() { dashReq[0] = dashReq[1] = false; for (const n of navReq) { n.dx = 0; n.ok = false; } }

function gameOver() {
  G.mode = 'over'; G.overDelay = 1.2;
  if (G.t > G.best) { G.best = G.t; G.newBest = true; store.set('best', G.best); }
  sfx.over();
  sticks[0] = sticks[1] = null; pointers.clear();
}

function director(dt) {
  const t = G.t, boss = G.enemies.some(e => e.d.boss);
  let rate = Math.min(11, 0.9 + t * 0.024 + Math.max(0, t - 180) * 0.02) * (G.np === 2 ? 1.5 : 1);
  if (boss) rate *= 0.45;
  G.spawnAcc += rate * dt;
  const cap = G.np === 2 ? 360 : 260;
  while (G.spawnAcc >= 1) { G.spawnAcc -= 1; if (G.enemies.length < cap) spawnEnemy(rollType(), spawnPos()); }

  if (t >= G.nextEvent) {
    G.nextEvent += 50;
    const alive = alivePlayers();
    if (alive.length) {
      const p = pick(alive), kind = G.eventN++ % 3;
      const types = ['carrot', 'tomato', 'pea'], names = ['CARROT STAMPEDE!', 'TOMATO TSUNAMI!', 'PEA PARTY!'];
      const n = Math.floor(16 + t / 9) + (kind === 2 ? 10 : 0);
      banner(names[kind], C.pink, 2.2);
      sfx.warn();
      const v = G.views.find(q => q.pid === p.id) || G.views[0];
      const R = Math.hypot(v.w, v.h) / 2 + 12;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        spawnEnemy(types[kind], { x: clamp(p.x + Math.cos(a) * R, 10, WORLD - 10), y: clamp(p.y + Math.sin(a) * R, 10, WORLD - 10) });
      }
    }
  }
  if (t >= G.nextBoss) {
    G.nextBoss += 150;
    G.bossCount++;
    const e = spawnEnemy('boss', spawnPos());
    e.hp = e.maxHp = 1200 * (1 + (G.bossCount - 1) * 0.9) * (G.np === 2 ? 1.6 : 1) * (1 + t / 600);
    banner('PUMPKIN KING APPROACHES!', C.red, 3, 'BOSS FIGHT');
    sfx.warn();
  }
}

function updatePlayer(p, dt) {
  p.anim += dt;
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  if (p.down) {
    // revive by standing next to the downed duck
    const helper = G.players.find(o => o !== p && !o.down && d2(o.x, o.y, p.x, p.y) < 22 * 22);
    if (helper) {
      p.reviveT += dt;
      if (p.reviveT >= 2.5) {
        p.down = false; p.hp = Math.round(p.maxHp * 0.5); p.iframes = 2; p.reviveT = 0;
        sfx.revive(); burst(p.x, p.y, ['#51cf66', '#fff8e7', PCOL[p.id]], 24, 90, 0.7);
        floatText(p.x, p.y - 16, 'REVIVED!', C.green, 1.2);
      }
    } else p.reviveT = Math.max(0, p.reviveT - dt * 0.5);
    dashReq[p.id] = false;
    return;
  }
  const mv = moveInput(p.id, pads);
  p.moving = Math.hypot(mv.x, mv.y) > 0.1;
  if (p.moving) p.moved = true;
  p.iframes = Math.max(0, p.iframes - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  // regen
  const rg = lvl(p, 'regen');
  if (rg && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + rg * 0.6 * dt);

  // dash
  if (dashReq[p.id] && p.dashCd <= 0) {
    let dx = mv.x, dy = mv.y, l = Math.hypot(dx, dy);
    if (l < 0.1) { dx = p.facing; dy = 0; l = 1; }
    const sp = pSpeed(p) * 3.6;
    p.dvx = dx / l * sp; p.dvy = dy / l * sp;
    p.dashT = 0.18; p.dashCd = pDashCd(p); p.iframes = Math.max(p.iframes, 0.28);
    p.dashHit.clear();
    sfx.quack();
    floatText(p.x + rand(-4, 4), p.y - 14, 'QUACK!', PCOL[p.id], 0.5);
    burst(p.x, p.y + 4, ['#e9f5db', '#c9e4a6'], 6, 40, 0.35);
  }
  let vx, vy;
  if (p.dashT > 0) {
    p.dashT -= dt; vx = p.dvx; vy = p.dvy;
    p.trail.push({ x: p.x, y: p.y, t: 0.2 });
    const dl = lvl(p, 'dash');
    if (dl) forNear(p.x, p.y, 14, e => {
      if (!p.dashHit.has(e) && d2(p.x, p.y, e.x, e.y) < (e.r + p.r + 5) ** 2) {
        p.dashHit.add(e); const a = Math.atan2(e.y - p.y, e.x - p.x);
        hurtEnemy(e, (14 + 12 * dl) * (1 + G.t / 400), Math.cos(a), Math.sin(a), 160, p);
      }
    });
  } else { const sp = pSpeed(p); vx = mv.x * sp; vy = mv.y * sp; }
  for (const tr of p.trail) tr.t -= dt;
  p.trail = p.trail.filter(tr => tr.t > 0);
  p.x = clamp(p.x + vx * dt, 8, WORLD - 8);
  p.y = clamp(p.y + vy * dt, 8, WORLD - 8);

  // auto-aim: lock on the nearest veggie
  const tgt = nearestEnemy(p.x, p.y, 150);
  if (tgt) {
    const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
    p.ax = Math.cos(a); p.ay = Math.sin(a);
    p.facing = p.ax < 0 ? -1 : 1;
  } else if (p.moving) {
    const l = Math.hypot(mv.x, mv.y); p.ax = mv.x / l; p.ay = mv.y / l;
    if (Math.abs(mv.x) > 0.1) p.facing = mv.x < 0 ? -1 : 1;
  }
  p.aimT = tgt;

  // --- blaster
  p.tm.blaster -= dt;
  if (p.tm.blaster <= 0) {
    if (tgt) {
      const shots = 1 + lvl(p, 'spread'), pw = lvl(p, 'power');
      const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      for (let i = 0; i < shots; i++) {
        const a = base + (i - (shots - 1) / 2) * 0.17;
        G.bullets.push({
          x: p.x + p.ax * 6, y: p.y + 1 + p.ay * 6, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, life: 0.75,
          dmg: 10 * (1 + 0.35 * pw), pierce: lvl(p, 'pierce'), hit: [], owner: p, r: 1 + (pw >= 3 ? 1 : 0),
        });
      }
      sfx.shoot(p.id);
      p.tm.blaster = 0.46 * Math.pow(0.84, lvl(p, 'rapid'));
    } else p.tm.blaster = 0.05;
  }
  // --- egg orbit
  const eg = lvl(p, 'egg');
  if (eg) {
    p.eggAng += dt * (2.6 + eg * 0.25);
    const n = eg + 1, R = 22 + eg;
    for (let i = 0; i < n; i++) {
      const a = p.eggAng + i * TAU / n, ex = p.x + Math.cos(a) * R, ey = p.y + Math.sin(a) * R;
      forNear(ex, ey, 10, e => {
        if (e.eggCd <= 0 && d2(ex, ey, e.x, e.y) < (e.r + 3) ** 2) {
          e.eggCd = 0.35; const k = Math.atan2(e.y - p.y, e.x - p.x);
          hurtEnemy(e, 6 + 4 * eg, Math.cos(k), Math.sin(k), 90, p);
        }
      });
    }
  }
  // --- bread bombs
  const br = lvl(p, 'bread');
  if (br) {
    p.tm.bread -= dt;
    if (p.tm.bread <= 0) {
      p.tm.bread = 2.8 - 0.25 * br;
      const n = 1 + Math.floor(br / 2);
      for (let i = 0; i < n; i++) {
        const near = G.enemies.filter(e => !e.dead && d2(e.x, e.y, p.x, p.y) < 130 * 130);
        const t = near.length ? pick(near) : null;
        const tx = t ? t.x : p.x + rand(-60, 60), ty = t ? t.y : p.y + rand(-50, 50);
        G.bombs.push({ x0: p.x, y0: p.y, x1: tx, y1: ty, t: 0, dur: 0.65 + i * 0.08, r: 20 + 4 * br, dmg: 18 + 10 * br, owner: p });
      }
    }
  }
  // --- zap
  const zp = lvl(p, 'zap');
  if (zp) {
    p.tm.zap -= dt;
    if (p.tm.zap <= 0) {
      let cur = nearestEnemy(p.x, p.y, 120);
      if (cur) {
        p.tm.zap = 2.2 - 0.25 * zp;
        const pts = [[p.x, p.y - 2]], hit = new Set();
        const dmg = (12 + 7 * zp) * (1 + G.t / 500);
        for (let i = 0; i < 2 + zp && cur; i++) {
          hit.add(cur); pts.push([cur.x, cur.y]);
          hurtEnemy(cur, dmg, 0, 0, 0, p);
          cur = nearestEnemy(cur.x, cur.y, 70, hit);
        }
        G.fx.push({ k: 'zap', pts, t: 0, dur: 0.18 });
        sfx.zap();
      } else p.tm.zap = 0.2;
    }
  }
  // --- mega quack
  const qk = lvl(p, 'quack');
  if (qk) {
    p.tm.quack -= dt;
    const R = 34 + 8 * qk;
    if (p.tm.quack <= 0) {
      if (nearestEnemy(p.x, p.y, R)) {
        p.tm.quack = 4.6 - 0.5 * qk;
        G.fx.push({ k: 'ring', x: p.x, y: p.y, r: R, t: 0, dur: 0.3, col: PCOL[p.id] });
        floatText(p.x, p.y - 16, 'QUAAACK!', PCOL[p.id], 0.7, 1);
        sfx.quack(); setTimeout(sfx.quack, 90);
        forNear(p.x, p.y, R + 8, e => {
          if (d2(p.x, p.y, e.x, e.y) < (R + e.r) ** 2) {
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            hurtEnemy(e, (6 + 5 * qk) * (1 + G.t / 500), Math.cos(a), Math.sin(a), 260, p);
          }
        });
      } else p.tm.quack = 0.2;
    }
  }
}

function updateEnemies(dt) {
  const alive = alivePlayers();
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.anim += dt; e.flash = Math.max(0, e.flash - dt); e.eggCd -= dt;
    // target nearest living player
    let tgt = null, bd = Infinity;
    for (const p of alive) { const dd = d2(e.x, e.y, p.x, p.y); if (dd < bd) { bd = dd; tgt = p; } }
    let mx = 0, my = 0;
    const dist = Math.sqrt(bd);
    if (tgt) {
      const dx = (tgt.x - e.x) / (dist || 1), dy = (tgt.y - e.y) / (dist || 1);
      e.flip = tgt.x < e.x;
      if (e.d.boss) {
        e.bt -= dt;
        if (e.bs === 'walk') {
          mx = dx * e.spd; my = dy * e.spd;
          if (e.bt <= 0) {
            if (Math.random() < 0.55) { e.bs = 'wind'; e.bt = 0.8; } else {
              e.bs = 'walk'; e.bt = 3.5;
              const n = 8;
              for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(Math.random() < 0.5 ? 'carrot' : 'tomato', { x: e.x + Math.cos(a) * 26, y: e.y + Math.sin(a) * 26 }); }
              floatText(e.x, e.y - 30, 'RISE, MY VEGGIES!', C.gold, 1.2);
              burst(e.x, e.y, e.d.col, 20, 90, 0.5);
            }
          }
        } else if (e.bs === 'wind') {
          e.flash = (e.bt * 10 | 0) % 2 ? 0.05 : 0;
          if (e.bt <= 0) { e.bs = 'charge'; e.bt = 0.85; e.cx = dx; e.cy = dy; shakeAt(e.x, e.y, 3); }
        } else if (e.bs === 'charge') {
          mx = e.cx * 175; my = e.cy * 175;
          if (Math.random() < 0.6) burst(e.x, e.y + 12, ['#c9a26b', '#e9cf8a'], 1, 30, 0.4);
          if (e.bt <= 0) { e.bs = 'walk'; e.bt = 3; }
        }
      } else if (e.d.ranged) {
        if (dist > 110) { mx = dx * e.spd; my = dy * e.spd; } else if (dist < 70) { mx = -dx * e.spd * 0.7; my = -dy * e.spd * 0.7; }
        e.shootT -= dt;
        if (e.shootT <= 0 && dist < 150) {
          e.shootT = rand(2, 2.8);
          G.ebullets.push({ x: e.x, y: e.y, vx: dx * 72, vy: dy * 72, life: 3, dmg: 8 * (1 + G.t / 400) });
          tone(300, 0.06, 'square', 0.025, 200);
        }
      } else if (e.d.explode) {
        if (e.fuse >= 0) {
          e.fuse -= dt; e.flash = (e.fuse * 14 | 0) % 2 ? 0.05 : 0;
          if (e.fuse <= 0) { e.dead = true; explode(e.x, e.y, 26, e.dmg, null, true); splat(e.x, e.y, e.d.juice, 16, 8); continue; }
        } else {
          mx = dx * e.spd; my = dy * e.spd;
          if (dist < e.r + tgt.r + 6) e.fuse = 0.45;
        }
      } else { mx = dx * e.spd; my = dy * e.spd; }
      // contact damage
      if (!e.d.explode && dist < e.r + tgt.r + 1) hurtPlayer(tgt, e.dmg);
    } else {
      e.anim += dt; mx = Math.cos(e.anim) * 10; my = Math.sin(e.anim * 0.7) * 10;
    }
    // separation
    let sx = 0, sy = 0;
    forNear(e.x, e.y, e.r + 8, o => {
      if (o === e) return;
      const dx = e.x - o.x, dy = e.y - o.y, rr = e.r + o.r;
      const dd = dx * dx + dy * dy;
      if (dd < rr * rr && dd > 0.0001) { const d = Math.sqrt(dd), push = (rr - d) / rr; sx += dx / d * push; sy += dy / d * push; }
    });
    const sepK = e.d.boss ? 10 : 50;
    e.x += (mx + e.kx + sx * sepK) * dt;
    e.y += (my + e.ky + sy * sepK) * dt;
    e.x = clamp(e.x, 6, WORLD - 6); e.y = clamp(e.y, 6, WORLD - 6);
    const kd = Math.pow(0.0005, dt);
    e.kx *= kd; e.ky *= kd;
    // recycle stragglers that drifted far behind
    if (tgt && dist > 420 && !e.d.boss) { const p = spawnPos(); e.x = p.x; e.y = p.y; }
  }
}

function updateBullets(dt) {
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) continue;
    forNear(b.x, b.y, 16, e => {
      if (b.hit.includes(e.id)) return;
      const rr = e.r + b.r + 1;
      if (d2(b.x, b.y, e.x, e.y) < rr * rr) {
        b.hit.push(e.id);
        const l = Math.hypot(b.vx, b.vy);
        hurtEnemy(e, b.dmg * (1 + G.t / 600), b.vx / l, b.vy / l, 60, b.owner);
        burst(b.x, b.y, [PCOL[b.owner.id], '#fff8e7'], 2, 40, 0.2);
        if (b.pierce-- <= 0) { b.life = 0; return true; }
      }
    });
  }
  G.bullets = G.bullets.filter(b => b.life > 0);
  for (const b of G.ebullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const p of alivePlayers()) if (d2(b.x, b.y, p.x, p.y) < (p.r + 2) ** 2 && p.iframes <= 0 && p.dashT <= 0) { hurtPlayer(p, b.dmg); b.life = 0; }
  }
  G.ebullets = G.ebullets.filter(b => b.life > 0);
}

function updateBombs(dt) {
  for (const b of G.bombs) {
    b.t += dt;
    if (b.t >= b.dur && !b.done) { b.done = true; explode(b.x1, b.y1, b.r, b.dmg * (1 + G.t / 500), b.owner, false); }
  }
  G.bombs = G.bombs.filter(b => !b.done);
}

function updateGems(dt) {
  const alive = alivePlayers();
  for (const g of G.gems) {
    g.bob += dt;
    if (g.tgt && g.tgt.down) g.tgt = null;
    if (!g.tgt) {
      for (const p of alive) { const m = pMagnet(p); if (d2(g.x, g.y, p.x, p.y) < m * m) { g.tgt = p; g.sp = -40; break; } }
    }
    if (g.tgt) {
      const p = g.tgt; g.sp += 500 * dt;
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
      const st = Math.min(d, Math.max(g.sp, -40) * dt);
      g.x += dx / d * st; g.y += dy / d * st;
      if (d < 6) {
        g.done = true; gainXp(p, g.v);
        G.gemCombo++; G.gemComboT = 0.4; sfx.gem(G.gemCombo);
      }
    }
  }
  G.gems = G.gems.filter(g => !g.done);
}

function updatePickups(dt) {
  for (const k of G.pickups) {
    k.t += dt;
    for (const p of alivePlayers()) {
      if (d2(k.x, k.y, p.x, p.y) < 10 * 10) {
        k.done = true; sfx.pickup();
        if (k.k === 'heart') { p.hp = Math.min(p.maxHp, p.hp + 30); floatText(p.x, p.y - 14, '+30 HP', C.green, 1); }
        else if (k.k === 'magnet') { for (const g of G.gems) { g.tgt = p; g.sp = 120; } floatText(p.x, p.y - 14, 'CORN MAGNET!', C.blue, 1); }
        else if (k.k === 'sauce') {
          floatText(p.x, p.y - 14, 'HOT SAUCE!!', C.red, 1.2);
          G.fx.push({ k: 'flash', t: 0, dur: 0.35, pid: p.id });
          shakeFor(p, 6); sfx.boom();
          for (const e of G.enemies) if (!e.dead && d2(e.x, e.y, p.x, p.y) < 170 * 170) hurtEnemy(e, e.d.boss ? 150 : 9999, 0, 0, 0, p);
        } else if (k.k === 'goldcorn') { gainXp(p, p.xpNext - p.xp); floatText(p.x, p.y - 22, 'GOLDEN CORN!', C.gold, 1.4); }
        break;
      }
    }
  }
  G.pickups = G.pickups.filter(k => !k.done && k.t < 40);
}

function updateParticles(dt) {
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.grav * dt; q.vx *= 0.96; q.life -= dt; }
  G.parts = G.parts.filter(q => q.life > 0);
  for (const t of G.texts) { t.y -= 18 * dt; t.life -= dt; }
  G.texts = G.texts.filter(t => t.life > 0);
}

function updateCameras(dt) {
  for (const v of G.views) {
    const p = G.players[v.pid]; if (!p) continue;
    v.camX = lerp(v.camX, p.x - v.w / 2, Math.min(1, dt * 8));
    v.camY = lerp(v.camY, p.y - v.h / 2, Math.min(1, dt * 8));
    v.shake = Math.max(0, (v.shake || 0) - dt * 20);
  }
}

// ============================================================ title screen animation
const titleChase = { ents: [], t: 0 };
function updateTitleAnim(dt) {
  titleChase.t += dt;
  if (titleChase.ents.length < 14 && Math.random() < dt * 3) {
    const kinds = ['carrot', 'tomato', 'broccoli', 'eggplant', 'peapod'];
    titleChase.ents.push({ k: pick(kinds), x: -20, y: rand(H * 0.82, H - 8), sp: rand(30, 50), anim: rand(0, 5) });
  }
  for (const e of titleChase.ents) { e.x += e.sp * dt; e.anim += dt; }
  titleChase.ents = titleChase.ents.filter(e => e.x < W + 30);
  updateParticles(dt);
}

// ============================================================ drawing primitives
function pcirc(x, y, r, col) {
  ctx.fillStyle = col; x = Math.round(x); y = Math.round(y); r = Math.round(r);
  for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); }
}
function pring(x, y, r, col, th = 1) {
  ctx.fillStyle = col; x = Math.round(x); y = Math.round(y);
  const n = Math.max(12, Math.ceil(TAU * r));
  for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), th, th); }
}
function pline(x0, y0, x1, y1, col, th = 1) {
  ctx.fillStyle = col;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  for (;;) {
    ctx.fillRect(x0, y0, th, th);
    if ((x0 === x1 && y0 === y1) || n++ > 600) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function shadow(x, y, w) {
  ctx.fillStyle = 'rgba(20,10,30,0.28)';
  x = Math.round(x); y = Math.round(y);
  ctx.fillRect(x - w + 1, y - 1, w * 2 - 2, 3);
  ctx.fillRect(x - w, y, w * 2, 1);
}
function box(x, y, w, h, fill, border = OUT, hi = null) {
  ctx.fillStyle = border; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  if (hi) { ctx.fillStyle = hi; ctx.fillRect(x + 2, y + 1, w - 4, 1); }
}
function bar(x, y, w, h, frac, col, back = '#3a2a4f') {
  box(x, y, w, h, back);
  const fw = Math.round((w - 2) * clamp(frac, 0, 1));
  if (fw > 0) { ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, fw, h - 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 1, fw, 1); }
}
const fmtTime = t => { t = Math.floor(t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };

// ============================================================ render
function render() {
  if (!grassPat) { grassPat = ctx.createPattern(grassTile, 'repeat'); waterPat = ctx.createPattern(waterTile, 'repeat'); }
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
  if (G.mode === 'title') { drawTitle(); return; }
  for (const v of G.views) drawView(v);
  if (G.np === 2) {
    ctx.fillStyle = OUT;
    if (W >= H) ctx.fillRect(G.views[0].x + G.views[0].w, 0, 2, H); else ctx.fillRect(0, G.views[1].y + G.views[1].h, W, 2);
  }
  drawTopBar();
  if (choosingActive() && !G.paused) for (const v of G.views) drawLevelUp(v);
  if (G.paused) drawPause();
  if (G.mode === 'over') drawGameOver();
}

function drawWorld(camX, camY, vw, vh, t) {
  // water + island
  ctx.fillStyle = waterPat;
  const wo = Math.floor(t * 4) % 32;
  ctx.save(); ctx.translate(wo, 0); ctx.fillRect(camX - wo - 32, camY - 32, vw + 64, vh + 64); ctx.restore();
  ctx.fillStyle = C.sandD; ctx.fillRect(-6, -4, WORLD + 12, WORLD + 12);
  ctx.fillStyle = C.sand; ctx.fillRect(-6, -6, WORLD + 12, WORLD + 10);
  ctx.fillStyle = grassPat; ctx.fillRect(0, 0, WORLD, WORLD);
  ctx.fillStyle = C.grassD; ctx.fillRect(0, WORLD, WORLD, 1);
  // decorations
  for (const d of DECOS) if (d.x > camX - 10 && d.x < camX + vw + 10 && d.y > camY - 10 && d.y < camY + vh + 10) drawSpr(d.s, d.x, d.y);
}

function drawView(v) {
  const p = G.players[v.pid];
  ctx.save();
  ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  const sh = v.shake || 0;
  const cx = Math.round(v.camX + (sh ? rand(-sh, sh) : 0)), cy = Math.round(v.camY + (sh ? rand(-sh, sh) : 0));
  ctx.translate(v.x - cx, v.y - cy);
  drawWorld(cx, cy, v.w, v.h, G.t);
  const inV = (x, y, m = 24) => x > cx - m && x < cx + v.w + m && y > cy - m && y < cy + v.h + m;

  // decals
  for (const d of G.decals) {
    if (!inV(d.x, d.y)) continue;
    ctx.globalAlpha = Math.min(1, d.life / 2) * 0.75; ctx.fillStyle = d.col;
    for (const [ox, oy] of d.px) ctx.fillRect(d.x + ox, d.y + oy, 2, 1);
  }
  ctx.globalAlpha = 1;
  // gems & pickups
  for (const g of G.gems) {
    if (!inV(g.x, g.y)) continue;
    const s = S.gem[g.v >= 20 ? 2 : g.v >= 5 ? 1 : 0];
    drawSpr(s, g.x, g.y + Math.round(Math.sin(g.bob * 4) * 1));
  }
  for (const k of G.pickups) {
    if (!inV(k.x, k.y)) continue;
    if (k.t > 34 && (k.t * 8 | 0) % 2) continue;
    const s = S[k.k];
    shadow(k.x, k.y + 6, 3);
    drawSpr(s, k.x, k.y + Math.round(Math.sin(k.t * 4) * 1.5) - 1);
  }
  // revive rings
  for (const q of G.players) if (q.down) {
    pring(q.x, q.y + 1, 22, 'rgba(255,255,255,0.25)');
    if (q.reviveT > 0) {
      const n = Math.floor(q.reviveT / 2.5 * 40);
      ctx.fillStyle = C.green;
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / 40 * TAU; ctx.fillRect(Math.round(q.x + Math.cos(a) * 12), Math.round(q.y - 2 + Math.sin(a) * 12), 2, 2); }
    }
  }
  // sorted actors
  const actors = [];
  for (const e of G.enemies) if (!e.dead && inV(e.x, e.y, 40)) actors.push(e);
  for (const q of G.players) actors.push(q);
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) { if (a.d) shadow(a.x, a.y + (a.d.boss ? 15 : a.r + 1), a.d.boss ? 14 : a.r); else shadow(a.x, a.y + 6, 5); }
  for (const a of actors) { if (a.d) drawEnemy(a); else drawPlayer(a); }
  // bombs in flight
  for (const b of G.bombs) {
    const t = clamp(b.t / b.dur, 0, 1), x = lerp(b.x0, b.x1, t), y = lerp(b.y0, b.y1, t);
    shadow(x, y + 3, 2);
    drawSpr(S.bread, x, y - Math.sin(t * Math.PI) * 30);
    if (t > 0.5) pring(b.x1, b.y1, b.r * (1 - t) + 3, 'rgba(255,80,60,0.5)');
  }
  // bullets
  for (const b of G.bullets) {
    if (!inV(b.x, b.y, 4)) continue;
    const col = PCOL[b.owner.id];
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(b.x - b.r - 1), Math.round(b.y - b.r - 1), b.r * 2 + 3, b.r * 2 + 3);
    ctx.fillStyle = col; ctx.fillRect(Math.round(b.x - b.r), Math.round(b.y - b.r), b.r * 2 + 1, b.r * 2 + 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(b.x - b.r), Math.round(b.y - b.r), 1, 1);
  }
  for (const b of G.ebullets) if (inV(b.x, b.y, 4)) drawSpr(S.seed, b.x, b.y);
  // effects
  for (const f of G.fx) {
    const k = f.t / f.dur;
    if (f.k === 'boom') {
      pcirc(f.x, f.y, f.r * (0.4 + k * 0.6), k < 0.3 ? '#fff8e7' : k < 0.6 ? '#ffd23f' : 'rgba(255,140,26,0.6)');
      pring(f.x, f.y, f.r * (0.5 + k * 0.6), '#e8343b');
    } else if (f.k === 'ring') {
      pring(f.x, f.y, f.r * (0.2 + k * 0.8), f.col, 2);
      pring(f.x, f.y, f.r * (0.15 + k * 0.7), '#fff8e7', 1);
    } else if (f.k === 'zap') {
      for (let i = 0; i < f.pts.length - 1; i++) {
        const [x0, y0] = f.pts[i], [x1, y1] = f.pts[i + 1];
        const mx = (x0 + x1) / 2 + rand(-6, 6), my = (y0 + y1) / 2 + rand(-6, 6);
        pline(x0, y0, mx, my, '#fff36b', 2); pline(mx, my, x1, y1, '#fff36b', 2);
        pline(x0, y0, mx, my, '#fff', 1); pline(mx, my, x1, y1, '#fff', 1);
      }
    }
  }
  // particles
  for (const q of G.parts) { if (!inV(q.x, q.y, 4)) continue; ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size); }
  // floating text
  for (const t of G.texts) {
    if (!inV(t.x, t.y, 40)) continue;
    ctx.globalAlpha = Math.min(1, t.life / t.max * 2.5);
    text(t.str, t.x, t.y, t.col, t.sc, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ----- per-view overlays (screen space)
  ctx.save();
  ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  if (p && p.hurtFlash > 0) { ctx.globalAlpha = p.hurtFlash * 1.6; ctx.fillStyle = '#e8343b'; ctx.fillRect(v.x, v.y, v.w, 3); ctx.fillRect(v.x, v.y + v.h - 3, v.w, 3); ctx.fillRect(v.x, v.y, 3, v.h); ctx.fillRect(v.x + v.w - 3, v.y, 3, v.h); ctx.globalAlpha = 1; }
  for (const f of G.fx) if (f.k === 'flash' && (G.np === 1 || f.pid === v.pid)) { ctx.globalAlpha = 1 - f.t / f.dur; ctx.fillStyle = '#ffeedd'; ctx.fillRect(v.x, v.y, v.w, v.h); ctx.globalAlpha = 1; }
  if (p) drawHud(v, p, cx, cy);
  ctx.restore();
}

function drawEnemy(e) {
  const s = S[e.d.s];
  const bob = e.d.boss ? Math.round(Math.abs(Math.sin(e.anim * 4)) * -2) : Math.round(Math.abs(Math.sin(e.anim * 10)) * -1.5);
  const sc = e.d.boss ? 2 : 1;
  const fuse = e.fuse >= 0;
  drawSpr(s, e.x, e.y + bob - (fuse ? 1 : 0), e.flip, e.flash > 0, sc);
  if (fuse) pring(e.x, e.y, 4 + (1 - e.fuse / 0.45) * 22, 'rgba(232,52,59,0.6)');
  if (e.hp < e.maxHp && !e.d.boss && e.maxHp > 30) {
    const w = e.r * 2 + 2, x = Math.round(e.x - w / 2), y = Math.round(e.y - e.r - 6);
    ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, 3);
    ctx.fillStyle = '#e8343b'; ctx.fillRect(x, y, Math.max(1, Math.round(w * e.hp / e.maxHp)), 1);
  }
}

function drawPlayer(p) {
  const fr = S.duck[p.id];
  if (p.down) {
    drawSpr(S.egg, p.x, p.y + Math.round(Math.sin(p.anim * 3)));
    if ((p.anim * 2 | 0) % 2 === 0) text('HELP!', p.x, p.y - 16, PCOL[p.id], 1, 1);
    return;
  }
  for (const tr of p.trail) { ctx.globalAlpha = tr.t * 2; drawSpr(fr[0], tr.x, tr.y, p.facing < 0, true); }
  ctx.globalAlpha = 1;
  if (p.iframes > 0 && p.dashT <= 0 && (p.iframes * 16 | 0) % 2 === 0) return;
  const frame = p.moving ? (Math.floor(p.anim * 9) % 2) : 0;
  const bob = p.moving ? -Math.round(Math.abs(Math.sin(p.anim * 9))) : 0;
  // egg orbitals behind / in front
  const eg = lvl(p, 'egg');
  const eggs = [];
  if (eg) { const n = eg + 1, R = 22 + eg; for (let i = 0; i < n; i++) { const a = p.eggAng + i * TAU / n; eggs.push([p.x + Math.cos(a) * R, p.y + Math.sin(a) * R]); } }
  for (const [x, y] of eggs) if (y < p.y) drawSpr(S.eggOrb, x, y);
  drawSpr(fr[frame], p.x, p.y + bob, p.facing < 0, p.hurtFlash > 0.15);
  // the blaster, pointing at the auto-aimed target
  const gx = p.x + p.facing * 2, gy = p.y + 2 + bob;
  pline(gx, gy, gx + p.ax * 7, gy + p.ay * 7, '#3d3a52', 2);
  ctx.fillStyle = PCOL[p.id]; ctx.fillRect(Math.round(gx + p.ax * 7), Math.round(gy + p.ay * 7), 2, 2);
  for (const [x, y] of eggs) if (y >= p.y) drawSpr(S.eggOrb, x, y);
  if (G.np === 2) text(PNAME[p.id], p.x, p.y - 15, PCOL[p.id], 1, 1);
}

function drawHud(v, p, cx, cy) {
  let x = v.x + 4, y = v.y + 4;
  const hpW = Math.min(64, Math.floor(v.w * 0.32));
  // keep the HUD clear of the timer/pause/mute cluster at the top centre of the screen
  const mid = Math.floor(W / 2), hudW = hpW + 30;
  if (v.y === 0 && x < mid + 32 && x + hudW > mid - 32) { if (v.x >= mid - 32) x = mid + 33; else y += 15; }
  // HP
  text('#', x, y + 1, '#ff4d6d', 1, 0);
  bar(x + 7, y, hpW, 7, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? '#ff4d6d' : '#51cf66');
  text(Math.ceil(p.hp), x + 9, y + 1, C.white, 1, 0, null);
  // XP
  bar(x, y + 9, hpW + 7, 5, p.xp / p.xpNext, PCOL[p.id]);
  text('LV' + p.level, x + hpW + 11, y + 9, PCOL[p.id], 1, 0);
  // kills
  text(p.kills + ' KO', x, y + 17, C.white, 1, 0);
  // dash cooldown (keyboard/gamepad users get a small pip)
  if (!usingTouch) {
    const ready = p.dashCd <= 0;
    text(ready ? 'DASH OK' : 'DASH', x, y + 25, ready ? PCOL[p.id] : C.gray, 1, 0);
  }
  // weapon icons
  let ix = x;
  const iy = v.y + v.h - 13;
  for (const u of UPG) {
    const l = lvl(p, u.k); if (!l || !['egg', 'bread', 'zap', 'quack'].includes(u.k)) continue;
    if (usingTouch && G.np === 2 && W >= H && v.pid === 0) break;
    drawSpr(ICON[u.k], ix + 4, iy + 4);
    text(l, ix + 9, iy + 4, C.white, 1, 0);
    ix += 16;
  }
  // partner arrow
  if (G.np === 2) {
    const o = G.players[1 - p.id];
    const ox = o.x - cx, oy = o.y - cy;
    if (ox < 0 || oy < 0 || ox > v.w || oy > v.h) {
      const mx = v.w / 2, my = v.h / 2, dx = ox - mx, dy = oy - my;
      const k = Math.min((v.w / 2 - 12) / Math.abs(dx || 1e-6), (v.h / 2 - 12) / Math.abs(dy || 1e-6));
      const ax = v.x + mx + dx * k, ay = v.y + my + dy * k, a = Math.atan2(dy, dx);
      pcirc(ax, ay, 6, OUT); pcirc(ax, ay, 5, o.down ? '#ff4d6d' : PCOL[o.id]);
      pline(ax + Math.cos(a) * 6, ay + Math.sin(a) * 6, ax + Math.cos(a) * 10, ay + Math.sin(a) * 10, o.down ? '#ff4d6d' : PCOL[o.id], 2);
      text(o.down ? '!' : PNAME[o.id][1], ax, ay - 2, OUT, 1, 1, null);
    }
  }
  // boss bar
  const boss = G.enemies.find(e => e.d.boss && !e.dead);
  if (boss) {
    const bw = Math.min(160, v.w - 40), bx = v.x + Math.floor((v.w - bw) / 2), by = v.y + v.h - (usingTouch ? 46 : 12);
    bar(bx, by, bw, 6, boss.hp / boss.maxHp, '#ff8c1a');
    text('PUMPKIN KING', v.x + v.w / 2, by - 7, C.gold, 1, 1);
  }
  // banners
  G.banners.forEach((b, i) => {
    const k = b.t / b.dur;
    const sc = v.w > 260 ? 2 : 1;
    const by = v.y + Math.floor(v.h * 0.26) + i * (sc * 7 + 10);
    const slide = k < 0.12 ? (1 - k / 0.12) * v.w : 0;
    if (k > 0.85 && (b.t * 12 | 0) % 2) return;
    text(b.str, v.x + v.w / 2 + slide, by, b.col, sc, 1, OUT, true);
    if (b.sub) text(b.sub, v.x + v.w / 2 + slide, by + sc * 6 + 3, C.white, 1, 1);
  });
  // touch controls
  if (usingTouch && !p.down) {
    const db = dashBtn(v);
    const ready = p.dashCd <= 0;
    pcirc(db.x, db.y, db.r, 'rgba(27,19,37,0.45)');
    pring(db.x, db.y, db.r, ready ? PCOL[p.id] : 'rgba(255,255,255,0.3)', 1);
    if (!ready) { const f = 1 - p.dashCd / pDashCd(p); pcirc(db.x, db.y, Math.max(1, (db.r - 2) * f), 'rgba(255,255,255,0.2)'); }
    text('DASH', db.x, db.y - 2, ready ? C.white : C.gray, 1, 1);
    const s = sticks[v.pid];
    if (s) {
      pcirc(s.bx, s.by, STICK_R, 'rgba(27,19,37,0.35)'); pring(s.bx, s.by, STICK_R, 'rgba(255,255,255,0.45)');
      const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy), m = Math.min(dl, STICK_R);
      const kx = dl ? s.bx + dx / dl * m : s.bx, ky = dl ? s.by + dy / dl * m : s.by;
      pcirc(kx, ky, 8, 'rgba(255,255,255,0.55)'); pring(kx, ky, 8, PCOL[v.pid]);
    } else if (!p.moved && G.hintT < 12) {
      const hx = v.x + (db.x < v.x + v.w / 2 ? v.w * 0.7 : v.w * 0.3), hy = v.y + v.h * 0.7;
      const ox = Math.cos(G.hintT * 3) * 10, oy = Math.sin(G.hintT * 3) * 6;
      ctx.globalAlpha = 0.6;
      pring(hx, hy, STICK_R, '#fff'); pcirc(hx + ox, hy + oy, 7, 'rgba(255,255,255,0.6)');
      ctx.globalAlpha = 1;
      text('DRAG TO MOVE', hx, hy + STICK_R + 5, C.white, 1, 1);
    }
  } else if (!p.moved && G.hintT < 10 && !usingTouch) {
    const hint = G.np === 1 ? 'MOVE: WASD / ARROWS / STICK   DASH: SPACE' : (p.id === 0 ? 'MOVE: WASD  DASH: SPACE' : 'MOVE: ARROWS  DASH: ENTER');
    text(hint, v.x + v.w / 2, v.y + v.h - 22, C.white, 1, 1);
    text('YOUR BLASTER AIMS ITSELF!', v.x + v.w / 2, v.y + v.h - 14, C.gold, 1, 1);
  }
}

function drawTopBar() {
  const cx = Math.floor(W / 2);
  box(cx - 17, 2, 34, 13, C.ui, OUT, C.uiL);
  text(fmtTime(G.t), cx, 6, C.white, 1, 1, null);
  const tb = topButtons();
  box(tb.pause.x, tb.pause.y, 11, 11, C.ui, OUT, C.uiL);
  ctx.fillStyle = C.white; ctx.fillRect(tb.pause.x + 3, tb.pause.y + 3, 2, 5); ctx.fillRect(tb.pause.x + 6, tb.pause.y + 3, 2, 5);
  drawMute(tb.mute.x, tb.mute.y);
  if (fsSupported()) drawFsBtn(tb.fs.x, tb.fs.y);
}
function drawFsBtn(x, y) {
  box(x, y, 11, 11, C.ui, OUT, C.uiL);
  ctx.fillStyle = C.white;
  // four corner brackets; the centre fills in while the game is full-screen
  ctx.fillRect(x + 2, y + 2, 3, 1); ctx.fillRect(x + 2, y + 2, 1, 3);
  ctx.fillRect(x + 6, y + 2, 3, 1); ctx.fillRect(x + 8, y + 2, 1, 3);
  ctx.fillRect(x + 2, y + 8, 3, 1); ctx.fillRect(x + 2, y + 6, 1, 3);
  ctx.fillRect(x + 6, y + 8, 3, 1); ctx.fillRect(x + 8, y + 6, 1, 3);
  if (document.fullscreenElement) ctx.fillRect(x + 4, y + 4, 3, 3);
}
function drawMute(x, y) {
  box(x, y, 11, 11, C.ui, OUT, C.uiL);
  ctx.fillStyle = AU.muted ? C.gray : C.white;
  ctx.fillRect(x + 2, y + 4, 2, 3); ctx.fillRect(x + 4, y + 3, 1, 5); ctx.fillRect(x + 5, y + 2, 1, 7);
  if (AU.muted) { ctx.fillStyle = '#ff4d6d'; for (let i = 0; i < 4; i++) { ctx.fillRect(x + 6 + i, y + 3 + i, 1, 1); ctx.fillRect(x + 9 - i, y + 3 + i, 1, 1); } }
  else { ctx.fillRect(x + 7, y + 4, 1, 3); ctx.fillRect(x + 9, y + 3, 1, 5); }
}

function drawLevelUp(v) {
  const p = G.players[v.pid];
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  ctx.fillStyle = 'rgba(27,19,37,0.72)'; ctx.fillRect(v.x, v.y, v.w, v.h);
  if (!p || !p.choice) {
    const who = G.players.filter(q => q.choice).map(q => PNAME[q.id]).join(' & ');
    text('WAITING FOR ' + who + '...', v.x + v.w / 2, v.y + v.h / 2 - 3, C.white, 1, 1);
    ctx.restore(); return;
  }
  const sc = v.w > 250 ? 2 : 1;
  const rects = cardRects(v);
  text('LEVEL UP!', v.x + v.w / 2, rects[0].y - 15 - sc * 6, PCOL[p.id], sc, 1, OUT, true);
  text('PICK AN UPGRADE', v.x + v.w / 2, rects[0].y - 10, C.white, 1, 1);
  const tt = performance.now() / 1000;
  rects.forEach((r, i) => {
    const u = p.choice[i], l = lvl(p, u.k), sel = i === p.sel && !usingTouch;
    const lift = sel ? -2 : 0;
    box(r.x, r.y + lift, r.w, r.h, sel ? '#4b3a72' : C.ui, sel ? PCOL[p.id] : OUT, C.uiL);
    const ic = ICON[u.k] || S.heart;
    drawSpr(ic, r.x + r.w / 2, r.y + 12 + lift + Math.round(Math.sin(tt * 4 + i) * 1), false, false, 2);
    const nameLines = wrap(u.name, r.w - 6);
    let ty = r.y + 26 + lift;
    for (const ln of nameLines) { text(ln, r.x + r.w / 2, ty, C.gold, 1, 1); ty += 7; }
    text(u.k === 'snack' ? '' : (l ? 'LV ' + l + ' > ' + (l + 1) : 'NEW!'), r.x + r.w / 2, ty, l ? C.blue : C.pink, 1, 1);
    ty += 9;
    for (const ln of wrap(u.d(l), r.w - 6)) { if (ty < r.y + r.h - 6) text(ln, r.x + r.w / 2, ty, C.white, 1, 1, null); ty += 7; }
  });
  if (!usingTouch) text(p.id === 0 || G.np === 1 ? '< > TO PICK, DASH TO CHOOSE' : '< > TO PICK, ENTER TO CHOOSE', v.x + v.w / 2, rects[0].y + rects[0].h + 6, C.gray, 1, 1);
  else text('TAP A CARD', v.x + v.w / 2, rects[0].y + rects[0].h + 6, C.gray, 1, 1);
  ctx.restore();
}

function drawPause() {
  ctx.fillStyle = 'rgba(27,19,37,0.78)'; ctx.fillRect(0, 0, W, H);
  text('PAUSED', W / 2, H / 2 - 44, C.gold, 2, 1, OUT, true);
  pauseButtons().forEach((b, i) => {
    const sel = i === G.pauseSel && !usingTouch;
    box(b.x, b.y, b.w, b.h, sel ? '#4b3a72' : C.ui, sel ? C.gold : OUT, C.uiL);
    text(b.label, b.x + b.w / 2, b.y + 6, C.white, 1, 1);
  });
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(27,19,37,0.8)'; ctx.fillRect(0, 0, W, H);
  const sc = W > 300 ? 3 : 2;
  let y = Math.floor(H * 0.16);
  text('GAME OVER', W / 2, y, C.red, sc, 1, OUT, true); y += sc * 5 + 8;
  text('THE VEGGIES WON THIS TIME...', W / 2, y, C.white, 1, 1); y += 14;
  text('SURVIVED ' + fmtTime(G.t), W / 2, y, C.gold, 2, 1); y += 16;
  if (G.newBest) { if ((performance.now() / 200 | 0) % 2) text('NEW BEST TIME!', W / 2, y, C.pink, 1, 1); }
  else text('BEST ' + fmtTime(G.best), W / 2, y, C.gray, 1, 1);
  y += 12;
  text(G.kills + ' VEGGIES SMASHED', W / 2, y, C.white, 1, 1); y += 12;
  G.players.forEach((p, i) => {
    const xx = G.np === 1 ? W / 2 : W / 2 + (i ? 40 : -40);
    drawSpr(S.duck[p.id][0], xx, y + 8);
    text('LV ' + p.level, xx, y + 18, PCOL[p.id], 1, 1);
    text(p.kills + ' KO', xx, y + 26, C.white, 1, 1);
  });
  y += 38;
  if (G.overDelay <= 0 && (performance.now() / 400 | 0) % 2) text(usingTouch ? 'TAP TO CONTINUE' : 'PRESS DASH TO CONTINUE', W / 2, Math.min(H - 10, y), C.white, 1, 1);
}

function drawTitle() {
  const t = G.menuT;
  const camX = t * 12 % 96 + 400, camY = 400;
  ctx.save(); ctx.translate(-Math.round(camX), -camY);
  ctx.fillStyle = grassPat; ctx.fillRect(camX, camY, W, H);
  ctx.restore();
  ctx.fillStyle = 'rgba(27,19,37,0.25)'; ctx.fillRect(0, 0, W, H);
  // chase parade at the bottom
  for (const e of titleChase.ents) { shadow(e.x, e.y + 5, 4); drawSpr(S[ETYPE[e.k].s], e.x, e.y - Math.abs(Math.sin(e.anim * 10)) * 1.5); }
  // ducks running ahead and blasting back
  const dx = (t * 40) % (W + 80) - 40;
  for (let i = 0; i < 2; i++) {
    const x = (dx + 30 + i * 18) % (W + 60), y = H - 18 - i * 8;
    shadow(x, y + 6, 5);
    drawSpr(S.duck[i][Math.floor(t * 9) % 2], x, y);
  }
  // title
  const s = Math.max(2, Math.min(6, Math.floor(W * 0.8 / textW('QUACK ATTACK!'))));
  const ty = Math.floor(H * 0.13) + Math.round(Math.sin(t * 2) * 2);
  text('QUACK', W / 2, ty, C.gold, s, 1, OUT, true);
  text('ATTACK!', W / 2, ty + s * 6 + 2, '#ff8c1a', s, 1, OUT, true);
  const sub = 'DUCKS WITH AUTO-AIM BLASTERS VS. EVIL VEGGIES';
  text(textW(sub) < W - 10 ? sub : 'DUCKS VS. EVIL VEGGIES', W / 2, ty + s * 12 + 8, C.white, 1, 1);
  // buttons
  titleButtons().forEach((b, i) => {
    const sel = i === G.titleSel && !usingTouch;
    const lift = sel ? Math.round(Math.sin(t * 6)) - 1 : 0;
    box(b.x, b.y + lift, b.w, b.h, sel ? '#4b3a72' : C.ui, sel ? C.gold : OUT, C.uiL);
    for (let k = 0; k <= i; k++) drawSpr(S.duck[k][Math.floor(t * 6 + k) % 2], b.x + 13 + k * 10, b.y + b.h / 2 + lift);
    text(i ? '2 PLAYERS' : '1 PLAYER', b.x + b.w / 2 + (i ? 10 : 6), b.y + b.h / 2 - 2 + lift, C.white, 1, 1);
  });
  const by = titleButtons()[0].y + 38;
  if (G.best > 0) text('BEST TIME ' + fmtTime(G.best), W / 2, by, C.gold, 1, 1);
  const help = usingTouch ? 'EACH PLAYER DRAGS ON THEIR HALF TO MOVE. THE GUN AIMS ITSELF!' : 'P1: WASD+SPACE   P2: ARROWS+ENTER   GAMEPADS WORK TOO!';
  const lines = wrap(help, W - 20);
  lines.forEach((ln, i) => text(ln, W / 2, by + 10 + i * 8, C.white, 1, 1));
  drawMute(W - 16, 3);
  if (fsSupported()) drawFsBtn(W - 30, 3);
}

// ============================================================ main loop
let last = performance.now();
function frame(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', resize);
resize();
makeDecos();
requestAnimationFrame(frame);

// small test hook (used by automated smoke tests)
window.__quack = { G, startGame, toTitle, update, applyUpgrade, TEST };
})();
