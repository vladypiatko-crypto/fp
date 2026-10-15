'use strict';
/* QUACK ATTACK! — story: dialog boxes, cutscene characters and the intro / ending cutscenes.
 *
 * LORE: Princess Daisy of Puddle Pond has the legendary GOLDEN QUACK, a voice so pure it can
 * power any machine. The evil goose scientist DR. HONK kidnaps her to power his Mega Honk Mech,
 * and sends his robot army to keep the ducks busy. Our heroes chase his airship across five worlds.
 * Chapter 2 (the stolen Golden Quack) lives in chapter2.js. */

// ================================================================ characters
const HONK_SPR = spr([
  '....KK.www..',
  '....wwwwww..',
  '....wwGGwoo.',
  '....wwwwwooo',
  '.....wwww...',
  '......ww....',
  '......ww....',
  '.....wwww...',
  '..cccccccc..',
  '.ccccrcccc..',
  'cccccrccccc.',
  'ccccccccccc.',
  '.cccccccccc.',
  '..cccccccc..',
  '...f....f...',
], { K: '#3d3a52', w: '#f4f4f4', G: '#ffd23f', o: '#ff9f1c', c: '#bfc7d9', r: '#e8343b', f: '#ff9f1c' });
function drawHonk(x, y, flip = false, sc = 1, t = 0) {
  const bob = Math.round(Math.abs(Math.sin(t * 6))) * sc;
  drawSprX(HONK_SPR, x, y - bob, { flip, sc, ay: 1 });
}
function drawDaisy(x, y, o = {}) {
  drawDuck(x, y, Object.assign({ skin: 'daisy', hat: 'bow', facing: 'down', t: 0, sc: 2 }, o));
}
function drawAirship(x, y, t, sc = 1) {
  x = Math.round(x); y = Math.round(y);
  const s = sc;
  // ropes + gondola
  pline(x - 10 * s, y + 8 * s, x - 8 * s, y + 14 * s, OUT); pline(x + 10 * s, y + 8 * s, x + 8 * s, y + 14 * s, OUT);
  panel(x - 13 * s, y + 13 * s, 26 * s, 9 * s, '#3d3a52', OUT, '#5a5872', false);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = (Math.floor(t * 3) + i) % 3 ? '#ffd23f' : '#fff3b0'; ctx.fillRect(x - 9 * s + i * 7 * s, y + 15 * s, 3 * s, 3 * s); }
  // tail fins
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(x - 30 * s, y); ctx.lineTo(x - 42 * s, y - 12 * s); ctx.lineTo(x - 38 * s, y); ctx.lineTo(x - 42 * s, y + 12 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5b3f8f'; ctx.beginPath(); ctx.moveTo(x - 30 * s, y); ctx.lineTo(x - 40 * s, y - 10 * s); ctx.lineTo(x - 37 * s, y); ctx.lineTo(x - 40 * s, y + 10 * s); ctx.closePath(); ctx.fill();
  // propeller
  const pa = t * 30;
  pline(x - 44 * s, y - Math.cos(pa) * 7 * s, x - 44 * s, y + Math.cos(pa) * 7 * s, '#d5dbe6', s);
  // balloon
  pellipse(x, y, 35 * s, 14 * s, OUT); pellipse(x, y, 34 * s, 13 * s, '#7b4fd6'); pellipse(x - 4 * s, y - 4 * s, 26 * s, 6 * s, '#9d74f0');
  ctx.fillStyle = '#5b3f8f'; for (let i = -2; i <= 2; i++) ctx.fillRect(x + i * 10 * s, y - 12 * s + Math.abs(i) * 2 * s, s, 24 * s - Math.abs(i) * 4 * s);
  // goose emblem
  pcirc(x + 16 * s, y, 7 * s, OUT); pcirc(x + 16 * s, y, 6 * s, '#f4f4f4');
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 15 * s, y - 3 * s, 4 * s, 2 * s);
  ctx.fillStyle = '#ff9f1c'; ctx.fillRect(x + 20 * s, y - 1 * s, 5 * s, 3 * s);
  text('HONK', x - 8 * s, y - 2 * s, '#ffd23f', s, 1, null);
}
function drawClaw(x, y0, y1, open) {
  pline(x, y0, x, y1, '#5a5872', 2);
  const o = open ? 5 : 2;
  pline(x, y1, x - o, y1 + 4, '#9aa3b5', 2); pline(x - o, y1 + 4, x - o + 2, y1 + 8, '#9aa3b5', 2);
  pline(x, y1, x + o, y1 + 4, '#9aa3b5', 2); pline(x + o, y1 + 4, x + o - 2, y1 + 8, '#9aa3b5', 2);
}
function drawCage(x, y, lift = 0) {
  const w = 38, h = 40, top = y - h - lift;
  ctx.fillStyle = '#5a5872'; ctx.fillRect(x - w / 2, top, w, 3); ctx.fillRect(x - w / 2, y - 2 - lift, w, 3);
  for (let i = 0; i <= 5; i++) { ctx.fillStyle = '#9aa3b5'; ctx.fillRect(Math.round(x - w / 2 + i * (w - 2) / 5), top, 2, h); }
  pline(x, top, x, top - 40, '#5a5872', 2);
}
// portrait for dialog boxes
function drawPortrait(who, x, y, t, talking) {
  panel(x, y, 30, 30, '#3a2a4f', OUT, C.uiL, false);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, 28, 28); ctx.clip();
  const bob = talking ? Math.round(Math.abs(Math.sin(t * 14))) : 0;
  if (who === 'honk') drawSprX(HONK_SPR, x + 11, y + 46 - bob, { sc: 3, ay: 1 });
  else if (who === 'daisy') drawDuck(x + 15, y + 40 - bob, { skin: 'daisy', hat: 'bow', facing: 'down', sc: 3, blink: (t * 0.7 % 3) > 2.85, t });
  else if (who === 'duck') { const lo = Save.data.loadout[0]; drawDuck(x + 15, y + 40 - bob, { skin: lo.skin, hat: lo.hat, facing: 'down', sc: 3, blink: (t * 0.7 % 3) > 2.85, t }); }
  ctx.restore();
}

// ================================================================ dialog box (typewriter)
class Dialog {
  constructor(lines, done) { this.lines = lines; this.i = 0; this.chars = 0; this.done = done; this.t = 0; this.blipN = 0; }
  get line() { return this.lines[this.i]; }
  // the speaker's sound: Dr. Honk honks, the ducks quack
  announce() {
    const L = this.line; if (!L) return;
    if (L[0] === 'honk') sfx.honk(1.2);
    else if (L[0] === 'duck' || L[0] === 'daisy') sfx.quack(L[0] === 'daisy' ? 1.2 : 1);
  }
  update(dt, acts) {
    this.t += dt;
    if (this.lastI !== this.i) { this.lastI = this.i; this.announce(); }
    if (!this.line) return;
    const msg = tr(this.line[1]), full = msg.length; // typed out in the chosen language
    const prev = Math.floor(this.chars);
    this.chars = Math.min(full, this.chars + dt * 48);
    if (Math.floor(this.chars) > prev && msg[prev] !== ' ' && this.blipN++ % 2 === 0) {
      const who = this.line[0];
      tone(who === 'honk' ? 180 : who === 'daisy' ? 900 : who === 'duck' ? 600 : 400, 0.03, 'square', 0.025);
    }
    const tap = (acts && (acts.ok || acts.back)) || Input.ptrEv.some(e => e.type === 'down') || Input.dash(0, 1) || Input.pads.some(p => p.e.a);
    if (acts && acts.start) { this.finish(); return; }
    if (tap && this.t > 0.15) { if (this.chars < full) this.chars = full; else this.next(); }
  }
  next() { this.i++; this.chars = 0; this.t = 0; if (this.i >= this.lines.length) this.finish(); }
  finish() { if (this.finished) return; this.finished = true; this.done && this.done(); }
  draw() {
    if (!this.line) return;
    const who = this.line[0], msg = tr(this.line[1]), sp = SPEAKERS[who] || SPEAKERS.narr;
    const bw = Math.min(W - 12, 320), bh = 42, bx = Math.floor((W - bw) / 2), by = H - bh - 6;
    const k = Ease.outBack(Math.min(1, this.t / 0.25));
    const yy = by + Math.round((1 - k) * 30);
    panel(bx, yy, bw, bh, C.uiD, OUT, C.uiL);
    const hasP = who !== 'narr';
    if (hasP) drawPortrait(who, bx + 6, yy + 6, this.t, this.chars < msg.length);
    const tx = bx + (hasP ? 42 : 10), tw = bw - (hasP ? 50 : 20);
    if (sp.name) { const nw = textW(sp.name) + 8; panel(tx - 2, yy - 6, nw, 10, sp.col, OUT, null, false); text(sp.name, tx + 2, yy - 4, OUT, 1, 0, null); }
    const shown = msg.slice(0, Math.floor(this.chars));
    wrapText(RAW + shown, tw).slice(0, 4).forEach((ln, i) => text(ln, tx, yy + 8 + i * 8, C.white, 1, 0));
    if (this.chars >= msg.length && (this.t * 3 | 0) % 2) text('>', bx + bw - 9, yy + bh - 9, C.gold, 1, 0);
  }
}

// ================================================================ cutscene backgrounds
function drawSky(top, bottom, t, sun = true) {
  const n = 6;
  for (let i = 0; i < n; i++) { ctx.fillStyle = mixCol(top, bottom, i / (n - 1)); ctx.fillRect(0, Math.floor(i * H * 0.6 / n), W, Math.ceil(H * 0.6 / n) + 1); }
  if (sun) { pcirc(W * 0.8, H * 0.16, 12, '#fff3b0'); pcirc(W * 0.8, H * 0.16, 9, '#ffd23f'); }
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 97 + t * (4 + i)) % (W + 80)) - 40, cy = H * (0.08 + i * 0.07);
    pellipse(cx, cy, 16, 5, '#ffffff'); pellipse(cx + 9, cy - 3, 9, 5, '#ffffff'); pellipse(cx - 8, cy - 1, 8, 4, '#f2f6ff');
  }
}
function mixCol(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, k)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k)), bl = Math.round(lerp(pa & 255, pb & 255, k));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
let pondPat = null;
function drawPondScene(t, dark = 0) {
  drawSky('#8fd3ff', '#d6f0ff', t);
  const gy = Math.floor(H * 0.6);
  pellipse(W * 0.2, gy + 4, W * 0.35, 26, '#4a9a43'); pellipse(W * 0.75, gy + 6, W * 0.4, 30, '#3f8f3a');
  if (!pondPat) pondPat = ctx.createPattern(groundTile('pond'), 'repeat');
  ctx.fillStyle = pondPat; ctx.fillRect(0, gy, W, H - gy);
  pellipse(W * 0.82, gy + 30, 46, 14, OUT); pellipse(W * 0.82, gy + 30, 45, 13, '#2f6fb3'); pellipse(W * 0.82 - 6, gy + 27, 30, 6, '#4f95d8');
  drawSpr(DECO_ART.tree, W * 0.08, gy + 2); drawSpr(DECO_ART.cattail, W * 0.66, gy + 26); drawSpr(DECO_ART.flowerP, W * 0.3, gy + 40); drawSpr(DECO_ART.flowerW, W * 0.55, gy + 50);
  if (dark > 0) { ctx.fillStyle = `rgba(20,10,40,${dark})`; ctx.fillRect(0, 0, W, H); }
  return gy;
}
function drawTowerScene(t) {
  ctx.fillStyle = '#1d1233'; ctx.fillRect(0, 0, W, H);
  if (!drawTowerScene.pat) drawTowerScene.pat = ctx.createPattern(groundTile('tower'), 'repeat');
  const gy = Math.floor(H * 0.58);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#2a1b45' : '#251740'; ctx.fillRect(i * W / 8, 0, W / 8 + 1, gy); }
  for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2); ctx.fillStyle = '#5ec8ff'; ctx.globalAlpha = 0.3 + Math.sin(t * 3 + i) * 0.2; ctx.fillRect(x, 20, 2, gy - 30); ctx.globalAlpha = 1; }
  ctx.fillStyle = drawTowerScene.pat; ctx.fillRect(0, gy, W, H - gy);
  drawSpr(DECO_ART.vat, W * 0.08, gy - 2); drawSpr(DECO_ART.console, W * 0.92, gy); drawSpr(DECO_ART.vat, W * 0.18, gy + 4);
  return gy;
}
function heroes(np) { return Save.data.loadout.slice(0, Math.max(1, np)); }

// ================================================================ cutscene scene
// A cutscene is a list of beats; each beat has a line of dialog and draws the stage at time t.
class CutsceneScene {
  constructor(id, done, np = 1) {
    this.id = id; this.done = done; this.np = np; this.beat = 0; this.t = 0; this.T = 0; this.chars = 0;
    this.parts = []; this.ui = new UI(); this.shake = 0;
    this.beats = { intro: INTRO_BEATS, ending: ENDING_BEATS, intro2: INTRO2_BEATS, ending2: ENDING2_BEATS }[id] || INTRO_BEATS;
    Music.play(id.startsWith('ending') ? 'title' : 'calm');
    if (id === 'ending' && !Save.data.endingSeen) { Save.data.endingSeen = true; Save.addCoins(500); this.paid = true; }
    if (id === 'ending2' && !Save.data.ending2Seen) { Save.data.ending2Seen = true; Save.addCoins(1000); this.paid = true; }
    if (this.beats[0].enter) this.beats[0].enter(this);
  }
  update(dt) {
    this.t += dt; this.T += dt;
    this.shake = Math.max(0, this.shake - dt * 10);
    const b = this.beats[this.beat];
    const msg = b.say ? b.say[1] : '';
    const prev = Math.floor(this.chars);
    this.chars = Math.min(msg.length, this.chars + dt * 45);
    if (b.say && Math.floor(this.chars) > prev && msg[prev] !== ' ' && prev % 2 === 0) {
      const w = b.say[0]; tone(w === 'honk' ? 180 : w === 'daisy' ? 900 : w === 'duck' ? 600 : 400, 0.03, 'square', 0.025);
    }
    if (b.tick) b.tick(this, this.t, dt);
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    const acts = Input.menu();
    this.ui.update(dt, null);
    if (acts.start || acts.back) { this.finish(); return; }
    const tap = acts.ok || Input.ptrEv.some(e => e.type === 'down' && !this.ui.hitTest(e.x, e.y)) || Input.pads.some(p => p.e.a);
    if (tap && this.t > 0.2) { if (this.chars < msg.length) this.chars = msg.length; else this.next(); }
    else if (this.t > b.dur + msg.length * 0.045 + 1.6) this.next();
  }
  next() {
    this.beat++; this.t = 0; this.chars = 0;
    if (this.beat >= this.beats.length) { this.beat = this.beats.length - 1; this.finish(); return; }
    const b = this.beats[this.beat];
    if (b.enter) b.enter(this);
  }
  finish() { if (this.finished) return; this.finished = true; Trans.go(() => this.done()); }
  burst(x, y, cols, n, spd = 60, life = 0.8, g = 60) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(spd * 0.3, spd); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(life * 0.5, life), col: pick(cols), g }); }
  }
  draw() {
    ctx.save();
    if (this.shake) ctx.translate(Math.round(rand(-this.shake, this.shake)), Math.round(rand(-this.shake, this.shake)));
    const b = this.beats[this.beat];
    b.draw(this, Math.min(this.t, b.dur), this.T);
    for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    ctx.restore();
    // letterbox bars
    ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 4, W, 4);
    if (b.say) {
      const d = Object.assign(Object.create(Dialog.prototype), { lines: [b.say], i: 0, chars: this.chars, t: this.t });
      d.draw();
    }
    this.ui.begin();
    drawButton(this.ui, 'skip', W - 46, 12, 40, 12, 'SKIP >', { on: () => this.finish(), silent: false });
  }
}

// ---------------------------------------------------------------- intro: the kidnapping
const INTRO_BEATS = [
  { dur: 3, say: ['narr', 'PUDDLE POND. THE HAPPIEST POND IN ALL OF DUCKLAND...'],
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawPicnic(gy, T, 1);
      const k = Ease.outCubic(Math.min(1, t / 2.6));
      drawHeroes(cs, lerp(-30, W * 0.3, k), gy + 34, T, k < 1, 'right');
    } },
  { dur: 2.5, say: ['daisy', 'WHAT A PERFECT DAY FOR A PICNIC! WHO WANTS CAKE?'],
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawPicnic(gy, T, 1, Math.abs(Math.sin(t * 8)) * 3);
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right');
      if (Math.random() < 0.05) cs.burst(W * 0.52, gy + 14, ['#ff6fae', '#ffb3d9'], 2, 20, 1, -10);
    } },
  { dur: 2.2, say: ['narr', '...HONK.'],
    enter(cs) { cs.shake = 3; sfx.honk(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, Math.min(0.45, t * 0.4));
      drawPicnic(gy, T, 1);
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right', t > 0.8 ? '!' : '');
    } },
  { dur: 2.5, say: ['honk', 'HONK HONK! GREETINGS, FEATHERBRAINS! IT IS I, THE GENIUS DR. HONK!'],
    enter() { Music.play('boss'); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.45);
      drawPicnic(gy, T, 1);
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right', '!');
      const ay = lerp(-40, H * 0.2, Ease.outCubic(Math.min(1, t / 1.6)));
      drawAirship(W * 0.55, ay, T);
      drawHonk(W * 0.55 + 2, ay + 13, false, 1, T);
    } },
  { dur: 2.6, say: ['honk', 'I NEED THE PRINCESS AND HER LEGENDARY GOLDEN QUACK TO POWER MY MEGA MECH!'],
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.45);
      const ay = H * 0.2, clawY = lerp(ay + 22, gy + 4, Ease.inCubic(Math.min(1, t / 1.8)));
      drawPicnic(gy, T, 1);
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right', '!');
      drawAirship(W * 0.55, ay, T); drawHonk(W * 0.55 + 2, ay + 13, false, 1, T);
      drawClaw(W * 0.52, ay + 22, clawY, true);
    } },
  { dur: 2.4, say: ['daisy', 'HEEEELP! QUAAAACK!'],
    enter(cs) { sfx.quack(1.6); cs.shake = 2; },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.45);
      const ay = H * 0.2, k = Ease.inOutSine(Math.min(1, t / 1.6)), dy = lerp(gy + 28, ay + 46, k);
      drawPicnic(gy, T, 0);
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right', '!!', true);
      drawAirship(W * 0.55, ay, T); drawHonk(W * 0.55 + 2, ay + 13, false, 1, T);
      drawClaw(W * 0.52, ay + 22, dy - 30, false);
      drawDaisy(W * 0.52, dy, { frame: Math.floor(T * 10) % 2, t: T });
    } },
  { dur: 2.8, say: ['honk', 'MY ROBOTS WILL TAKE GOOD CARE OF YOU. TOODLES! HONK HONK!'],
    enter(cs) { sfx.honk(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.35);
      const k = Ease.inCubic(Math.min(1, t / 2.4));
      drawTowerFar(W * 0.92, H * 0.58);
      drawPicnic(gy, T, 0);
      drawAirship(lerp(W * 0.55, W + 70, k), H * 0.2 - k * 20, T, 1 - k * 0.4);
      for (let i = 0; i < 4; i++) {
        const x = W * (0.6 + i * 0.1), y = gy + 22 + (i % 2) * 14, ap = t - i * 0.3;
        if (ap > 0) drawSprX(enemySprite('bolt', Math.floor(T * 8) % 2, null), x, y, { ay: 1, sy: Math.min(1, ap * 3) });
      }
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right', '!!');
    } },
  { dur: 2.2, say: ['duck', 'NOBODY QUACKS WITH OUR PRINCESS! LET\'S GO!'],
    enter(cs) { Music.play('battle'); sfx.quack(); cs.burst(W * 0.3, H * 0.75, ['#ffd23f', '#fff8e7'], 16, 70); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.2);
      drawTowerFar(W * 0.92, H * 0.58);
      drawPicnic(gy, T, 0);
      for (let i = 0; i < 4; i++) drawSprX(enemySprite('bolt', Math.floor(T * 8) % 2, null), W * (0.6 + i * 0.1), gy + 22 + (i % 2) * 14, { ay: 1, flip: true });
      drawHeroes(cs, W * 0.3, gy + 34, T, false, 'right', '', false, true);
    } },
  { dur: 2.4,
    enter(cs) { sfx.title(); cs.shake = 4; },
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.5));
      drawZoomText('CHAPTER 1', W / 2, H * 0.38, lerp(9, 3, k), C.gold);
      if (t > 0.5) text('SAVE PRINCESS DAISY!', W / 2, H * 0.58, C.white, 1, 1);
      drawHeroes(cs, W / 2 - 6, H * 0.85, T, true, 'right', '', false, true);
    } },
];
// ---------------------------------------------------------------- ending: the rescue
const ENDING_BEATS = [
  { dur: 2.6, say: ['narr', 'THE MEGA HONK MECH IS NOTHING BUT SCRAP!'],
    enter(cs) { cs.shake = 5; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawTowerScene(T);
      drawSprX(enemySprite('honk', 0, null), W * 0.62, gy + 30, { sc: 2, ay: 1, white: (T * 6 | 0) % 2 === 0 && t < 1 });
      if (Math.random() < 0.3) cs.burst(W * 0.62 + rand(-16, 16), gy + rand(-10, 20), ['#5a5872', '#8b8aa0'], 1, 15, 1.2, -25);
      drawCage(W * 0.85, gy + 34); drawDaisy(W * 0.85, gy + 32, { t: T, blink: true });
      drawHeroes(cs, W * 0.25, gy + 40, T, false, 'right');
    } },
  { dur: 2.6, say: ['honk', 'NOOO! MY BEAUTIFUL MECH! THIS ISN\'T OVER, FEATHERBRAINS!'],
    draw(cs, t, T) {
      const gy = drawTowerScene(T);
      drawSprX(enemySprite('honk', 0, null), W * 0.62, gy + 30, { sc: 2, ay: 1 });
      if (Math.random() < 0.3) cs.burst(W * 0.62 + rand(-16, 16), gy, ['#5a5872', '#8b8aa0'], 1, 15, 1.2, -25);
      drawHonk(W * 0.62, gy + 34 - Math.min(1, t / 0.6) * 4, true, 1, T);
      drawCage(W * 0.85, gy + 34); drawDaisy(W * 0.85, gy + 32, { t: T });
      drawHeroes(cs, W * 0.25, gy + 40, T, false, 'right', '!');
    } },
  { dur: 2.2, say: ['narr', 'HOOOOOOONK...!'],
    enter(cs) { sfx.honk(); },
    draw(cs, t, T) {
      const gy = drawTowerScene(T);
      drawSprX(enemySprite('honk', 0, null), W * 0.62, gy + 30, { sc: 2, ay: 1 });
      const ry = gy + 30 - Ease.inCubic(Math.min(1, t / 1.5)) * (gy + 80);
      if (ry > -20) { drawHonk(W * 0.62, ry, true, 1, T); ctx.fillStyle = '#e8343b'; ctx.fillRect(W * 0.62 - 3, ry, 6, 6); cs.burst(W * 0.62, ry + 6, ['#ffd23f', '#ff8c1a'], 2, 30, 0.4, 60); }
      if (t > 1.5) { const s = (t * 10 | 0) % 2; text(s ? '*' : '+', W * 0.62, 14, C.gold, 1, 1); }
      drawCage(W * 0.85, gy + 34); drawDaisy(W * 0.85, gy + 32, { t: T });
      drawHeroes(cs, W * 0.25, gy + 40, T, false, 'right', '?');
    } },
  { dur: 2.8, say: ['daisy', 'YOU CAME FOR ME! QUACK QUACK HOORAY!'],
    enter(cs) { sfx.revive(); },
    draw(cs, t, T) {
      const gy = drawTowerScene(T);
      drawSprX(enemySprite('honk', 0, null), W * 0.62, gy + 30, { sc: 2, ay: 1, alpha: 0.6 });
      drawCage(W * 0.85, gy + 34, Math.min(1, t / 0.8) * 60);
      const k = Ease.outCubic(clamp((t - 0.6) / 1.2, 0, 1));
      const dx = lerp(W * 0.85, W * 0.25 + 30, k);
      drawDaisy(dx, gy + 32 - Math.abs(Math.sin(T * 9)) * 3, { facing: k < 1 ? 'left' : 'down', frame: Math.floor(T * 10) % 2, t: T });
      if (k >= 1 && Math.random() < 0.15) cs.burst(dx, gy + 20, ['#ff6fae', '#ffb3d9', '#ff4d6d'], 3, 30, 1, -20);
      drawHeroes(cs, W * 0.25, gy + 40, T, k >= 1, 'right');
    } },
  { dur: 3.2, say: ['narr', 'AND PUDDLE POND WAS PEACEFUL AGAIN... FOR NOW.'],
    enter() { sfx.win(); },
    draw(cs, t, T) {
      drawSky('#2a1b45', '#ff8c6b', T, false);
      const gy = Math.floor(H * 0.6);
      if (!pondPat) pondPat = ctx.createPattern(groundTile('pond'), 'repeat');
      ctx.fillStyle = pondPat; ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = 'rgba(42,27,69,0.35)'; ctx.fillRect(0, gy, W, H - gy);
      if (Math.random() < 0.06) { const x = rand(W * 0.1, W * 0.9), y = rand(H * 0.1, H * 0.35); cs.burst(x, y, pick([RAINBOW, ['#ffd23f', '#fff8e7'], ['#ff6fae', '#5ec8ff']]), 26, 60, 1.1, 30); tone(rand(300, 600), 0.3, 'triangle', 0.05, 80); }
      drawHeroes(cs, W * 0.35, gy + 36, T, true, 'right');
      drawDaisy(W * 0.62, gy + 36 - Math.abs(Math.sin(T * 7)) * 4, { t: T, frame: Math.floor(T * 7) % 2 });
    } },
  { dur: 4,
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      if (Math.random() < 0.1) cs.burst(rand(0, W), rand(0, H * 0.5), RAINBOW, 20, 50, 1.2, 30);
      const k = Ease.outBack(Math.min(1, t / 0.6));
      drawZoomText('CHAPTER 1 CLEAR!', W / 2, H * 0.3, lerp(10, 3, k), C.gold);
      if (t > 0.6) text('CHAPTER 2 IS UNLOCKED!', W / 2, H * 0.5, C.white, 1, 1);
      if (t > 1.0 && cs.paid) { const lw = textW('+500 COINS REWARD!'); coinIcon(Math.floor(W / 2 - lw / 2 - 6), Math.floor(H * 0.6), T); text('+500 COINS REWARD!', W / 2 + 4, H * 0.6 + 1, C.gold, 1, 1); }
      drawHeroes(cs, W / 2 - 20, H * 0.88, T, true, 'down');
      drawDaisy(W / 2 + 26, H * 0.88 - Math.abs(Math.sin(T * 7)) * 3, { t: T });
    } },
];
function drawPicnic(gy, T, daisyThere, hop = 0) {
  const bx = Math.floor(W * 0.44), by = gy + 14;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? '#e8343b' : '#fff8e7'; ctx.fillRect(bx + x * 7, by + y * 5, 7, 5); }
  // cake
  ctx.fillStyle = OUT; ctx.fillRect(bx + 38, by - 8, 14, 11); ctx.fillStyle = '#ffd39a'; ctx.fillRect(bx + 39, by - 7, 12, 9); ctx.fillStyle = '#ff6fae'; ctx.fillRect(bx + 39, by - 7, 12, 3);
  ctx.fillStyle = '#e8343b'; ctx.fillRect(bx + 44, by - 11, 2, 3); ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx + 44, by - 13, 2, 2);
  if (daisyThere) drawDaisy(bx + 20, by + 14 - hop, { t: T, blink: (T % 3) > 2.85 });
}
function drawHeroes(cs, x, y, T, walking, facing = 'right', shout = '', scared = false, armed = false) {
  const los = heroes(cs.np);
  los.forEach((lo, i) => {
    const px = x - i * 30, py = y - i * 8;
    const hop = scared ? Math.abs(Math.sin(T * 12 + i)) * 4 : walking ? Math.abs(Math.sin(T * 9 + i)) : 0;
    shadow(px, py, 9);
    drawDuck(px, py - hop, { skin: lo.skin, hat: lo.hat, halo: lo.halo, facing, frame: walking ? Math.floor(T * 9 + i) % 2 : 0, blink: (T + i) % 3.3 > 3.15, t: T, weapon: armed ? lo.weapon : null, aim: 0, sc: 2 });
    if (shout) text(shout, px, py - 50, C.red, 2, 1, 'outline');
  });
}
function drawTowerFar(x, y) {
  ctx.fillStyle = '#5b3f8f'; ctx.fillRect(x - 6, y - 50, 12, 50); ctx.fillRect(x - 9, y - 56, 18, 8);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 2, y - 44, 3, 3); ctx.fillRect(x - 2, y - 30, 3, 3);
  pline(x, y - 56, x, y - 66, '#3d3a52'); ctx.fillStyle = '#e8343b'; ctx.fillRect(x + 1, y - 66, 6, 4);
}
// big text that can scale smoothly (rendered once, drawn scaled)
const zoomCache = new Map();
function drawZoomText(str, x, y, sc, col, rot = 0) {
  const key = LANG + str + col;
  let c = zoomCache.get(key);
  if (!c) { c = textCanvas(str, col, 1, true); zoomCache.set(key, c); }
  const w = c.width * sc, h = c.height * sc;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (rot) ctx.rotate(rot);
  ctx.drawImage(c, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}
