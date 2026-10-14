'use strict';
/* QUACK ATTACK! — menus: title screen, level map, locker (customisation) and chests. */

const Scenes = {
  stack: [],
  top() { return this.stack[this.stack.length - 1]; },
  set(s) { this.stack = [s]; },
  push(s) { this.stack.push(s); },
  pop() { this.stack.pop(); const t = this.top(); if (t && t.resumed) t.resumed(); },
};

// small coin counter used on several screens
function drawCoins(x, y, n, t) {
  const s = String(n), w = textW(s) + 16;
  panel(x, y, w, 13, C.ui, OUT, C.uiL);
  coinIcon(x + 3, y + 3, t);
  text(s, x + 12, y + 4, C.gold, 1, 0, null);
  return w;
}
function iconButton(ui, id, x, y, draw, on) {
  const f = ui.isFocus(id), dn = ui.isDown(id);
  panel(x, y + (dn ? 1 : 0), 13, 13, f ? C.uiSel : C.ui, f ? C.gold : OUT, C.uiL);
  draw(x, y + (dn ? 1 : 0));
  ui.add(id, x, y, 13, 13, on);
}
function drawSoundIcon(x, y) {
  ctx.fillStyle = AU.muted ? C.gray : C.white;
  ctx.fillRect(x + 3, y + 5, 2, 3); ctx.fillRect(x + 5, y + 4, 1, 5); ctx.fillRect(x + 6, y + 3, 1, 7);
  if (AU.muted) { ctx.fillStyle = '#ff4d6d'; for (let i = 0; i < 4; i++) { ctx.fillRect(x + 7 + i, y + 4 + i, 1, 1); ctx.fillRect(x + 10 - i, y + 4 + i, 1, 1); } }
  else { ctx.fillRect(x + 8, y + 5, 1, 3); ctx.fillRect(x + 10, y + 4, 1, 5); }
}
function drawFsIcon(x, y) {
  ctx.fillStyle = C.white;
  ctx.fillRect(x + 3, y + 3, 3, 1); ctx.fillRect(x + 3, y + 3, 1, 3); ctx.fillRect(x + 7, y + 3, 3, 1); ctx.fillRect(x + 9, y + 3, 1, 3);
  ctx.fillRect(x + 3, y + 9, 3, 1); ctx.fillRect(x + 3, y + 7, 1, 3); ctx.fillRect(x + 7, y + 9, 3, 1); ctx.fillRect(x + 9, y + 7, 1, 3);
  if (document.fullscreenElement) ctx.fillRect(x + 5, y + 5, 3, 3);
}
function toggleSound() { setMuted(!AU.muted); Save.data.muted = AU.muted; Save.write(); }
function drawGearIcon(x, y) {
  pring(x + 6, y + 6, 3, C.white, 1); pcirc(x + 6, y + 6, 1, C.white);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.fillStyle = C.white; ctx.fillRect(Math.round(x + 6 + Math.cos(a) * 4.5), Math.round(y + 6 + Math.sin(a) * 4.5), 2, 2); }
}

// ================================================================ title screen
class TitleScene {
  constructor(skipIntro = false) {
    this.t = skipIntro ? 3 : 0; this.T = 0; this.ui = new UI(); this.modal = null; this.modalUI = new UI(); this.modalT = 0;
    this.shake = 0; this.flash = 0; this.landed = skipIntro; this.parts = [];
    this.words = [['QUACK', C.gold], ['ATTACK!', '#ff8c1a']].map(([w, col]) => ({ w, whole: textCanvas(w, col, 1, true), white: textCanvas(w, '#ffffff', 1, false) }));
    this.ducks = [0, 1].map(i => ({ x: W * (0.3 + i * 0.4), y: H * 0.86, tx: 0, ty: 0, wait: rand(0.5, 2), facing: 'down', frame: 0, anim: rand(0, 5), hop: 0, turnT: 0, quackT: 0 }));
    this.ship = { x: -80, t: 6 };
    Music.play('title');
  }
  layout() {
    // each word image is 10 rows: 2 padding, 5 letter, 3 outline + drop shadow
    const s = clamp(Math.floor(Math.min(W * 0.62 / textW('ATTACK!'), H * 0.36 / 18)), 2, 7);
    return { s, ty: Math.floor(H * 0.05) + 2 };
  }
  update(dt) {
    this.t += dt; this.T += dt; this.modalT += dt;
    this.shake = Math.max(0, this.shake - dt * 12); this.flash = Math.max(0, this.flash - dt * 3);
    if (!this.landed && this.t >= 1.1) { this.landed = true; this.shake = 5; this.flash = 1; sfx.title(); sfx.quack(); const L = this.layout(); this.burst(W / 2, L.ty + L.s * 6, [C.gold, '#ff8c1a', '#fff8e7'], 40, 140); }
    const acts = Input.menu();
    if (this.t < 1.9) { // any input skips the intro
      if (acts.ok || acts.back || Input.ptrEv.some(e => e.type === 'down')) { this.t = 1.9; if (!this.landed) { this.landed = true; this.flash = 0.6; sfx.title(); } }
      return;
    }
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 90 * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    this.updateDucks(dt);
    this.ship.t -= dt;
    if (this.ship.t <= 0) { this.ship.x += dt * 22; if (this.ship.x > W + 90) { this.ship.x = -90; this.ship.t = rand(10, 18); } }
    if (this.modal) {
      if (acts.back) { this.modal = null; sfx.uiBack(); return; }
      this.modalUI.update(dt, acts);
      return;
    }
    const hit = this.ui.update(dt, acts);
    if (!hit) for (const ev of Input.ptrEv) if (ev.type === 'down') {
      for (const d of this.ducks) if (Math.abs(ev.x - d.x) < 16 && ev.y > d.y - 34 && ev.y < d.y + 3) { d.hop = 0.35; d.quackT = 0.8; sfx.quack(d === this.ducks[1] ? 1.15 : 1); }
    }
  }
  updateDucks(dt) {
    const ymin = H * 0.78, ymax = H - 8;
    for (const d of this.ducks) {
      d.anim += dt; d.hop = Math.max(0, d.hop - dt); d.turnT = Math.max(0, d.turnT - dt); d.quackT = Math.max(0, d.quackT - dt);
      if (d.wait > 0) { d.wait -= dt; if (d.wait <= 0) { d.tx = rand(16, W - 16); d.ty = rand(ymin, ymax); } d.moving = false; }
      else {
        const dx = d.tx - d.x, dy = d.ty - d.y, dl = Math.hypot(dx, dy);
        if (dl < 2) { d.wait = rand(0.8, 3); if (Math.random() < 0.3) d.quackT = 0.8; }
        else {
          d.x += dx / dl * 28 * dt; d.y += dy / dl * 28 * dt; d.moving = true;
          const nf = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
          if (nf !== d.facing) { d.facing = nf; d.turnT = 0.14; }
        }
      }
      d.y = clamp(d.y, ymin, ymax);
    }
  }
  burst(x, y, cols, n, spd) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(spd * 0.3, spd); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: rand(0.5, 1.2), col: pick(cols) }); } }
  openModal(kind) { this.modal = kind; this.modalT = 0; this.modalUI = new UI(); }
  start(np) {
    const kind = this.modal;
    Trans.go(() => {
      if (kind === 'endless') Scenes.set(new GameScene({ mode: 'endless', np }));
      else if (!Save.data.introSeen) { Save.data.introSeen = true; Save.write(); Scenes.set(new CutsceneScene('intro', () => Scenes.set(new MapScene(np)), np)); }
      else Scenes.set(new MapScene(np));
    });
  }
  draw() {
    const { s, ty } = this.layout();
    ctx.save();
    if (this.shake) ctx.translate(Math.round(rand(-this.shake, this.shake)), Math.round(rand(-this.shake, this.shake)));
    if (this.t < 0.25) { ctx.fillStyle = OUT; ctx.fillRect(-10, -10, W + 20, H + 20); ctx.restore(); return; }
    // backdrop: sky, hills, meadow, pond
    drawSky('#8fd3ff', '#e3f6ff', this.T);
    if (this.ship.t <= 0) { drawAirship(this.ship.x, H * 0.12 + Math.sin(this.T) * 3, this.T, 0.6); }
    const gy = Math.floor(H * 0.62);
    pellipse(W * 0.15, gy + 6, W * 0.3, 24, '#4a9a43'); pellipse(W * 0.7, gy + 8, W * 0.45, 30, '#3f8f3a');
    drawTowerFar(W * 0.93, gy + 2);
    if (!pondPat) pondPat = ctx.createPattern(groundTile('pond'), 'repeat');
    ctx.fillStyle = pondPat; ctx.fillRect(0, gy, W, H - gy);
    pellipse(W * 0.12, gy + 18, 34, 9, OUT); pellipse(W * 0.12, gy + 18, 33, 8, '#2f6fb3'); pellipse(W * 0.12 - 4, gy + 16, 20, 3, '#4f95d8');
    drawSpr(DECO_ART.tree, W * 0.04, gy - 2); drawSpr(DECO_ART.tree, W * 0.96, gy + 4); drawSpr(DECO_ART.cattail, W * 0.24, gy + 16);
    // ducks wandering around
    if (this.t > 1.6) {
      const order = this.ducks.map((d, i) => [d, i]).sort((a, b) => a[0].y - b[0].y);
      for (const [d, i] of order) {
        const lo = Save.data.loadout[i], pop = Ease.outBack(clamp((this.t - 1.6 - i * 0.15) / 0.4, 0, 1));
        shadow(d.x, d.y, 9);
        let sx = 1;
        if (d.turnT > 0) sx = 1 - 0.55 * Math.sin(Math.PI * (1 - d.turnT / 0.14));
        const hop = d.hop > 0 ? Math.sin(d.hop / 0.35 * Math.PI) * 8 : d.moving ? Math.abs(Math.sin(d.anim * 9)) : 0;
        drawDuck(d.x, d.y - hop, { skin: lo.skin, hat: lo.hat, halo: lo.halo, facing: d.facing, frame: d.moving ? Math.floor(d.anim * 9) % 2 : 0, blink: d.anim % 3.4 > 3.25, t: d.anim, sx: sx * pop, sy: pop, sc: 2,
          sparkle: (x, y) => this.parts.push({ x, y, vx: rand(-5, 5), vy: rand(-20, -8), life: 0.6, col: pick(['#fff3b0', '#c9a6ff']) }) });
        if (d.quackT > 0) text('QUACK!', d.x, d.y - 48, PCOL[i], 1, 1, 'outline');
      }
    }
    // title: zooms in from huge, then gently waves
    const k = clamp((this.t - 0.25) / 0.85, 0, 1);
    if (!this.landed) {
      const e = Ease.outBack(k), sc = lerp(s * 7, s, e), rot = lerp(-0.35, 0, Ease.outCubic(k));
      ctx.globalAlpha = Math.min(1, k * 3);
      drawScaled(this.words[0].whole, W / 2, ty + s * 5, sc, rot);
      drawScaled(this.words[1].whole, W / 2, ty + s * 14, sc, rot);
      ctx.globalAlpha = 1;
    } else {
      // each letter is a vertical slice of the word image, bobbing on its own wave
      this.words.forEach((wd, wi) => {
        const c = wd.whole, chars = [...wd.w], edges = [0];
        let cum = 0;
        chars.forEach((ch, i) => { if (i) edges.push(2 + cum); cum += glyphOf(ch).w + 1; });
        edges.push(c.width);
        const x0 = Math.round(W / 2 - c.width * s / 2), top = ty + wi * s * 9;
        for (let i = 0; i < chars.length; i++) {
          const a = edges[i], b = edges[i + 1];
          const wave = Math.round(Math.sin(this.T * 3 + i * 0.6 + wi * 1.5) * s * 0.35);
          ctx.drawImage(c, a, 0, b - a, c.height, x0 + a * s, top + wave, (b - a) * s, c.height * s);
          const shine = ((this.T * 1.2) % 4) * 9 - (i + wi * 3) * 1.5;
          if (shine > 0 && shine < 1.5) { ctx.globalAlpha = 0.7; ctx.drawImage(wd.white, a, 0, b - a, c.height, x0 + a * s, top + wave, (b - a) * s, c.height * s); ctx.globalAlpha = 1; }
        }
      });
    }
    for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    ctx.restore();
    if (this.flash) { ctx.globalAlpha = this.flash; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    this.ui.begin();
    if (this.t < 1.2) return;
    const sub = 'DUCKS WITH AUTO-AIM BLASTERS VS. DR. HONK\'S ROBOTS';
    const subY = ty + s * 18 + 4 + Math.ceil(s * 0.35); // below ATTACK!'s shadow and its wave
    ctx.globalAlpha = clamp((this.t - 1.2) / 0.3, 0, 1);
    text(textW(sub) < W - 10 ? sub : 'DUCKS VS. ROBOTS', W / 2, subY, C.white, 1, 1, 'outline');
    ctx.globalAlpha = 1;
    // main buttons slide up one after another
    const labels = [['story', 'STORY', ICON.play, () => this.openModal('story')], ['endless', 'ENDLESS', null, () => this.openModal('endless')],
      ['online', 'ONLINE', null, () => Trans.go(() => Scenes.set(new OnlineScene()))], ['locker', 'LOCKER', ICON.locker, () => Trans.go(() => Scenes.push(new LockerScene({})))]];
    const stack = W < 300, n = labels.length;
    const bw = stack ? 96 : Math.min(84, Math.floor((W - 40) / n)), bh = 18, gap = 6;
    const rowW = stack ? bw : bw * n + gap * (n - 1);
    const by0 = Math.min(subY + 12, H * 0.62 - (stack ? n * (bh + 4) : bh) - 4);
    labels.forEach(([id, label, icon, on], i) => {
      const k2 = Ease.outBack(clamp((this.t - 1.3 - i * 0.12) / 0.4, 0, 1));
      const x = stack ? Math.floor(W / 2 - bw / 2) : Math.floor(W / 2 - rowW / 2) + i * (bw + gap);
      const y = (stack ? by0 + i * (bh + 4) : by0) + Math.round((1 - k2) * (H - by0));
      drawButton(this.modal ? new UI() : this.ui, id, x, y, bw, bh, label, { on, icon, def: i === 0, col: i === 0 ? '#3d2f63' : C.ui });
    });
    // corner widgets
    drawCoins(4, 4, Save.data.coins, this.T);
    iconButton(this.ui, 'snd', W - 17, 4, drawSoundIcon, toggleSound);
    if (fsSupported()) iconButton(this.ui, 'fs', W - 33, 4, drawFsIcon, toggleFullscreen);
    iconButton(this.ui, 'set', W - (fsSupported() ? 49 : 33), 4, drawGearIcon, () => this.openModal('settings'));
    const b = Save.data.best;
    if (b.e1 || b.e2) text('BEST ENDLESS  1P ' + fmtTime(b.e1) + '  2P ' + fmtTime(b.e2), W / 2, H - 9, C.white, 1, 1, 'outline');
    if (this.modal === 'settings') this.drawSettings();
    else if (this.modal) this.drawModal();
  }
  drawSettings() {
    ctx.fillStyle = 'rgba(15,10,26,0.7)'; ctx.fillRect(0, 0, W, H);
    const k = Ease.outBack(Math.min(1, this.modalT / 0.3));
    const pw = Math.min(W - 20, 190), ph = 112, px = Math.floor(W / 2 - pw / 2), py = Math.floor(H / 2 - ph / 2 + (1 - k) * 30);
    panel(px, py, pw, ph, C.uiD, OUT, C.uiL);
    text('SETTINGS', W / 2, py + 7, C.gold, 2, 1, 'outline');
    const ui = this.modalUI; ui.begin();
    const st = Save.data.settings;
    [['shake', 'SCREEN SHAKE'], ['flash', 'IMPACT FLASH'], ['music', 'MUSIC']].forEach(([key, label], i) => {
      const on = st[key];
      drawButton(ui, 'set_' + key, px + 10, py + 26 + i * 18, pw - 20, 15, label + ': ' + (on ? 'ON' : 'OFF'),
        { def: i === 0, col: on ? C.ui : '#2a2535', tcol: on ? C.white : C.gray,
          on: () => { st[key] = !st[key]; Save.write(); if (key === 'music' && AU.musicBus) AU.musicBus.gain.value = st.music ? 0.42 : 0; } });
    });
    drawButton(ui, 'set_back', Math.floor(W / 2 - 30), py + ph - 20, 60, 13, 'BACK', { on: () => { this.modal = null; } });
  }
  drawModal() {
    ctx.fillStyle = 'rgba(15,10,26,0.7)'; ctx.fillRect(0, 0, W, H);
    const k = Ease.outBack(Math.min(1, this.modalT / 0.3));
    const pw = Math.min(W - 20, 200), ph = 96, px = Math.floor(W / 2 - pw / 2), py = Math.floor(H / 2 - ph / 2 + (1 - k) * 30);
    panel(px, py, pw, ph, C.uiD, OUT, C.uiL);
    text(this.modal === 'story' ? 'STORY MODE' : 'ENDLESS MODE', W / 2, py + 6, C.gold, 1, 1);
    text('HOW MANY DUCKS?', W / 2, py + 16, C.white, 2, 1, 'outline');
    const ui = this.modalUI; ui.begin();
    const bw = Math.floor((pw - 24) / 2), bh = 40;
    [1, 2].forEach((n, i) => {
      const x = px + 8 + i * (bw + 8), y = py + 32, id = 'np' + n;
      const f = ui.isFocus(id), dn = ui.isDown(id);
      panel(x, y + (dn ? 1 : 0), bw, bh, f ? C.uiSel : C.ui, f ? C.gold : OUT, C.uiL);
      for (let d = 0; d < n; d++) {
        const lo = Save.data.loadout[d];
        drawDuck(x + bw / 2 + (n === 2 ? (d ? 9 : -9) : 0), y + 27 + (dn ? 1 : 0) - (f ? Math.abs(Math.sin(this.T * 8 + d)) * 2 : 0), { skin: lo.skin, hat: lo.hat, halo: lo.halo, facing: 'down', t: this.T, frame: f ? Math.floor(this.T * 8) % 2 : 0 });
      }
      text(n === 1 ? '1 DUCK' : '2 DUCKS', x + bw / 2, y + bh - 9 + (dn ? 1 : 0), C.white, 1, 1);
      ui.add(id, x, y, bw, bh, () => this.start(n), { def: i === 0 });
    });
    drawButton(ui, 'back', W / 2 - 30, py + ph - 20, 60, 13, 'BACK', { on: () => { this.modal = null; } });
    if (this.modal === 'story') text('2 DUCKS = SPLIT SCREEN CO-OP!', W / 2, py + ph + 6, C.white, 1, 1, 'outline');
  }
}
function drawScaled(c, x, y, sc, rot = 0) {
  const w = c.width * sc, h = c.height * sc;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (rot) ctx.rotate(rot);
  ctx.drawImage(c, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}

// ================================================================ level map
class MapScene {
  constructor(np) {
    this.np = np; this.ui = new UI(); this.T = 0;
    this.sel = Math.min(Save.data.story.reached, LEVELS.length) - 1;
    this.from = this.sel; this.moveT = 1;
    Music.play('calm');
  }
  nodes() {
    return LEVELS.map((lv, i) => ({ lv, x: Math.round(W * (0.12 + i * 0.19)), y: Math.round(H * (0.44 + (i % 2 ? -0.1 : 0.08))) }));
  }
  update(dt) {
    this.T += dt; this.moveT = Math.min(1, this.moveT + dt / 0.45);
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); Trans.go(() => Scenes.set(new TitleScene(true))); return; }
    if (acts.left || acts.right) {
      const n = clamp(this.sel + (acts.left ? -1 : 1), 0, Math.min(Save.data.story.reached, LEVELS.length) - 1);
      if (n !== this.sel) this.select(n);
      acts.left = acts.right = false;
    }
    this.ui.update(dt, acts);
  }
  select(i) { if (i === this.sel) return; this.from = this.sel; this.sel = i; this.moveT = 0; sfx.uiMove(); }
  play() { const lv = LEVELS[this.sel]; Trans.go(() => Scenes.set(new GameScene({ mode: 'story', level: lv, np: this.np }))); }
  draw() {
    const T = this.T;
    if (!this.waterPat) this.waterPat = ctx.createPattern(edgeTile('pond'), 'repeat');
    ctx.save(); ctx.translate(Math.floor(T * 5) % 32, 0); ctx.fillStyle = this.waterPat; ctx.fillRect(-32, 0, W + 64, H); ctx.restore();
    const nodes = this.nodes(), reached = Math.min(Save.data.story.reached, LEVELS.length);
    // island blobs under every node
    for (const n of nodes) { pellipse(n.x, n.y + 6, 30, 15, '#c9ab66'); pellipse(n.x, n.y + 4, 29, 13, '#e9cf8a'); pellipse(n.x, n.y + 3, 24, 10, n.lv.world === 'peaks' ? '#e8f1ff' : n.lv.world === 'factory' ? '#4a4658' : n.lv.world === 'tower' ? '#3b2a5c' : n.lv.world === 'woods' ? '#3f8a4a' : '#5bb450'); }
    // dotted path
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1], open = i + 1 < reached;
      for (let k = 0; k <= 12; k++) { const t = k / 12; ctx.fillStyle = open ? '#fff8e7' : 'rgba(255,248,231,0.3)'; ctx.fillRect(Math.round(lerp(a.x, b.x, t)), Math.round(lerp(a.y, b.y, t) + Math.sin(t * Math.PI) * -6), 2, 2); }
    }
    this.ui.begin();
    nodes.forEach((n, i) => {
      const unlocked = i < reached, cleared = Save.data.story.cleared[n.lv.n], f = this.ui.isFocus('n' + i);
      drawLandmark(n.lv.world, n.x, n.y, T, unlocked);
      if (!unlocked) drawSpr(ART.lock, n.x, n.y - 4, false, false, 2);
      panel(n.x - 7, n.y + 9, 14, 10, i === this.sel ? C.gold : C.ui, OUT, null, false);
      text(n.lv.n, n.x, n.y + 12, i === this.sel ? OUT : C.white, 1, 1, null);
      if (cleared) text('@', n.x + 10, n.y + 10, C.gold, 1, 0);
      if (f && i !== this.sel) pring(n.x, n.y + 2, 16, C.gold, 1, 9);
      this.ui.add('n' + i, n.x - 18, n.y - 20, 36, 40, () => { if (i === this.sel) this.play(); else this.select(i); }, { disabled: !unlocked, def: i === this.sel });
    });
    // ducks hop along the path to the chosen level
    const a = nodes[this.from], b = nodes[this.sel], k = Ease.inOutSine(this.moveT);
    const dx = lerp(a.x, b.x, k), dy = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 10 - 2;
    heroes(this.np).forEach((lo, i) => {
      const x = dx - 5 + i * 10, hop = this.moveT < 1 ? Math.abs(Math.sin(T * 14 + i)) * 4 : Math.abs(Math.sin(T * 3 + i)) * 1;
      shadow(x, dy, 4);
      drawDuck(x, dy - hop, { skin: lo.skin, hat: lo.hat, halo: lo.halo, facing: this.moveT < 1 ? (b.x < a.x ? 'left' : 'right') : 'down', frame: this.moveT < 1 ? Math.floor(T * 10) % 2 : 0, t: T, blink: (T + i) % 3.5 > 3.35 });
    });
    // header + info panel
    panel(-2, -2, W + 4, 18, C.uiD, OUT, null, false);
    text('STORY - SAVE PRINCESS DAISY!', W / 2, 5, C.gold, 1, 1);
    const lv = LEVELS[this.sel], pw = Math.min(W - 12, 260), px = Math.floor(W / 2 - pw / 2), py = H - 50;
    panel(px, py, pw, 44, C.uiD, OUT, C.uiL);
    text('LEVEL ' + lv.n + ': ' + lv.name, px + 8, py + 6, C.gold, 1, 0);
    text('BOSS: ' + BOSSES[lv.boss].name, px + 8, py + 15, C.white, 1, 0);
    const cleared = Save.data.story.cleared[lv.n];
    if (!Save.has('weapon', lv.reward)) { text('REWARD:', px + 8, py + 24, C.gray, 1, 0); drawSprX(GUN_ART[lv.reward], px + 46, py + 27, { sc: 1 }); text(itemOf('weapon', lv.reward).name, px + 56, py + 24, RARITY[itemOf('weapon', lv.reward).rarity].col, 1, 0); }
    else text(cleared ? 'CLEARED! @' : 'REWARD ALREADY UNLOCKED', px + 8, py + 24, cleared ? C.gold : C.gray, 1, 0);
    drawButton(this.ui, 'play', px + pw - 58, py + 6, 50, 16, 'PLAY', { on: () => this.play(), icon: ICON.play, col: '#3d2f63' });
    drawButton(this.ui, 'locker', px + pw - 58, py + 25, 50, 13, 'LOCKER', { on: () => Trans.go(() => Scenes.push(new LockerScene({}))) });
    drawButton(this.ui, 'back', 4, 20, 34, 12, 'BACK', { on: () => Trans.go(() => Scenes.set(new TitleScene(true))) });
    drawCoins(W - textW(Save.data.coins) - 22, 20, Save.data.coins, T);
  }
}
function drawLandmark(world, x, y, T, on) {
  ctx.globalAlpha = on ? 1 : 0.45;
  if (world === 'pond') { pellipse(x, y + 2, 12, 5, OUT); pellipse(x, y + 2, 11, 4, '#4f95d8'); drawSpr(DECO_ART.cattail, x + 9, y - 2); drawSpr(DECO_ART.flowerP, x - 10, y); }
  else if (world === 'woods') { drawSpr(DECO_ART.tree, x - 6, y - 6); drawSpr(DECO_ART.tree, x + 7, y - 4); drawSpr(DECO_ART.mush, x, y + 3); }
  else if (world === 'peaks') {
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(x - 15, y + 5); ctx.lineTo(x, y - 17); ctx.lineTo(x + 15, y + 5); ctx.fill();
    ctx.fillStyle = '#8fb3d4'; ctx.beginPath(); ctx.moveTo(x - 13, y + 4); ctx.lineTo(x, y - 15); ctx.lineTo(x + 13, y + 4); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 5, y - 7); ctx.lineTo(x, y - 15); ctx.lineTo(x + 5, y - 7); ctx.fill();
  } else if (world === 'factory') {
    panel(x - 12, y - 8, 24, 14, '#7a3d22', OUT, '#c97b4a', false); panel(x + 4, y - 18, 6, 12, '#5a5872', OUT, null, false);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 8, y - 4, 3, 3); ctx.fillRect(x - 2, y - 4, 3, 3);
    if (on) for (let i = 0; i < 3; i++) pcirc(x + 7 + Math.sin(T * 2 + i) * 2, y - 22 - ((T * 8 + i * 6) % 18), 2 + i * 0.5, 'rgba(160,160,180,0.6)');
  } else if (world === 'tower') { drawTowerFar(x, y + 6); if (on) { ctx.fillStyle = (T * 2 | 0) % 2 ? '#e8343b' : '#ffd23f'; ctx.fillRect(x - 1, y - 52, 2, 2); } }
  ctx.globalAlpha = 1;
}

// ================================================================ locker: customise skins, hats, halos, trails, weapons
class LockerScene {
  constructor(opts) {
    this.opts = opts; this.pid = 0; this.cat = 'hat'; this.ui = new UI(); this.T = 0; this.parts = [];
    this.spin = 0; this.hop = 0; this.shakeId = null; this.shakeT = 0; this.popup = null; this.popUI = new UI();
    this.prevSong = Music.song;
    Music.play('calm');
    if (!Save.data.wizardSeen) { Save.data.wizardSeen = true; Save.write(); this.popup = { kind: 'gift', t: 0 }; }
  }
  resumed() { Music.play('calm'); }
  close() { Trans.go(() => { Scenes.pop(); Music.play(this.prevSong === 'calm' ? 'calm' : this.prevSong || 'title'); }); }
  update(dt) {
    this.T += dt; this.spin += dt; this.hop = Math.max(0, this.hop - dt); this.shakeT = Math.max(0, this.shakeT - dt);
    const lo = Save.data.loadout[this.pid];
    // demo trail particles for the preview duck
    const L = this.layout();
    if (lo.trail !== 'none' && Math.random() < 0.5) {
      const x = L.dx + rand(-6, 6), y = L.dy - rand(0, 6), tr = lo.trail;
      const q = { x, y, vx: rand(-14, -4) * (tr === 'leaves' ? 1 : 0.5), vy: rand(-20, -6), life: 0.8, max: 0.8 };
      if (tr === 'sparkle') q.col = pick(['#fff8e7', '#ffd23f']); else if (tr === 'fire') { q.col = pick(['#ff8c1a', '#ffd23f', '#e8343b']); q.vy = -30; }
      else if (tr === 'hearts') q.s = ART.tinyHeart; else if (tr === 'notes') q.s = ART.note; else if (tr === 'leaves') { q.s = ART.leaf; q.vy = 8; }
      else if (tr === 'bubbles') q.bub = rand(1, 3); else if (tr === 'rainbow') { q.rb = true; q.vx = -30; q.vy = 0; q.y = L.dy - 10; }
      else if (tr === 'ghost') { if (Math.random() < 0.15) q.ghost = true; else q.life = 0; q.vx = -25; q.vy = 0; q.x = L.dx; q.y = L.dy; }
      this.parts.push(q);
    }
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    const acts = Input.menu();
    if (this.popup) {
      this.popup.t += dt;
      if (this.popup.kind === 'gift' && Math.random() < 0.3) this.parts.push({ x: W / 2 + rand(-30, 30), y: H / 2 + rand(-30, 10), vx: 0, vy: rand(-20, -5), life: 0.8, max: 0.8, col: pick(['#ffd23f', '#c9a6ff', '#fff8e7']) });
      this.popUI.update(dt, this.popup.t > 0.5 ? acts : null);
      return;
    }
    if (acts.back) { sfx.uiBack(); this.close(); return; }
    const hit = this.ui.update(dt, acts);
    if (!hit) for (const ev of Input.ptrEv) if (ev.type === 'down' && Math.abs(ev.x - L.dx) < 20 && ev.y < L.dy + 4 && ev.y > L.dy - 50) { this.hop = 0.4; sfx.quack(this.pid ? 1.15 : 1); }
  }
  layout() {
    const port = W < H * 1.15;
    if (port) return { port, dx: Math.floor(W / 2), dy: Math.floor(H * 0.36), sc: 3, gx: 6, gy: Math.floor(H * 0.42), gw: W - 12 };
    const left = Math.floor(W * 0.4);
    return { port, dx: Math.floor(left / 2) + 2, dy: Math.floor(H * 0.72), sc: H > 200 ? 4 : 3, gx: left + 4, gy: 22, gw: W - left - 10 };
  }
  equip(cat, id) {
    if (!Save.has(cat, id)) { this.shakeId = cat + id; this.shakeT = 0.3; sfx.uiBack(); return; }
    Save.data.loadout[this.pid][cat] = id; Save.write();
    this.hop = 0.4; sfx.pickup();
    const L = this.layout();
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU); this.parts.push({ x: L.dx, y: L.dy - 20, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, life: 0.5, max: 0.5, col: pick([PCOL[this.pid], '#fff8e7']) }); }
  }
  draw() {
    const T = this.T, L = this.layout(), lo = Save.data.loadout[this.pid];
    // room: wall, lockers, floor
    ctx.fillStyle = '#2f2a45'; ctx.fillRect(0, 0, W, H);
    const floorY = L.port ? Math.floor(H * 0.4) : Math.floor(H * 0.66);
    const lw = 22;
    for (let x = 2; x < (L.port ? W : L.gx - 4); x += lw + 2) {
      const lh = floorY - 14;
      panel(x, 8, lw, lh, '#4f5a7a', OUT, '#6c7aa0', false);
      ctx.fillStyle = '#3b4560'; for (let v = 0; v < 3; v++) ctx.fillRect(x + 5, 14 + v * 3, lw - 10, 1);
      ctx.fillStyle = '#c3c2d4'; ctx.fillRect(x + lw - 5, 8 + Math.floor(lh / 2), 2, 5);
    }
    ctx.fillStyle = '#3b3456'; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.fillStyle = '#332c4c'; for (let x = 0; x < W; x += 20) ctx.fillRect(x, floorY, 1, H - floorY);
    // spotlight + pedestal
    ctx.fillStyle = 'rgba(255,248,231,0.07)';
    ctx.beginPath(); ctx.moveTo(L.dx - 8, 0); ctx.lineTo(L.dx + 8, 0); ctx.lineTo(L.dx + 34, L.dy + 6); ctx.lineTo(L.dx - 34, L.dy + 6); ctx.fill();
    pellipse(L.dx, L.dy + 2, 30, 8, OUT); pellipse(L.dx, L.dy + 1, 29, 7, '#5b4f86'); pellipse(L.dx, L.dy, 26, 5, '#7a6bb0');
    // preview particles behind
    for (const q of this.parts) {
      const a = Math.min(1, q.life / q.max * 2);
      if (q.s) drawSprX(q.s, q.x, q.y, { alpha: a }); else if (q.bub) { ctx.globalAlpha = a; pring(q.x, q.y, q.bub, '#bde6ff'); ctx.globalAlpha = 1; }
      else if (q.rb) { ctx.globalAlpha = a; for (let k = 0; k < 6; k++) { ctx.fillStyle = RAINBOW[k]; ctx.fillRect(Math.round(q.x), Math.round(q.y + k), 3, 1); } ctx.globalAlpha = 1; }
      else if (q.ghost) drawSprX(duckSet(lo.skin).side[0][0], q.x, q.y, { alpha: a * 0.5, sc: L.sc, ay: 1 });
      else { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    }
    // the duck slowly turns around so you can see every side
    const faces = ['down', 'right', 'up', 'left'], fi = Math.floor(this.spin / 1.4) % 4, ft = this.spin % 1.4;
    const turn = ft < 0.14 ? 1 - 0.55 * Math.sin(Math.PI * (1 - ft / 0.14)) : 1;
    const hop = this.hop > 0 ? Math.sin(this.hop / 0.4 * Math.PI) * 10 : 0;
    const q = Math.sin(T * 3);
    drawDuck(L.dx, L.dy - hop, { skin: lo.skin, hat: lo.hat, halo: lo.halo, weapon: lo.weapon, facing: faces[fi], frame: Math.floor(T * 4) % 2, blink: T % 3.3 > 3.15, t: T, sc: L.sc,
      sx: turn * (1 - q * 0.02), sy: 1 + q * 0.03, aim: faces[fi] === 'left' ? Math.PI : faces[fi] === 'up' ? -Math.PI / 2 : faces[fi] === 'down' ? Math.PI * 0.25 : 0,
      sparkle: (x, y) => this.parts.push({ x, y, vx: rand(-6, 6), vy: rand(-24, -10), life: 0.7, max: 0.7, col: pick(['#fff3b0', '#ffd23f', '#c9a6ff']) }),
      ember: (x, y) => this.parts.push({ x, y, vx: rand(-6, 6), vy: rand(-24, -10), life: 0.5, max: 0.5, col: pick(['#ff8c1a', '#ffd23f']) }) });
    this.ui.begin();
    // player tabs
    const tabY = L.port ? 4 : 6;
    [0, 1].forEach(i => {
      const x = L.dx - 30 + i * 32, sel = this.pid === i;
      const id = 'p' + i, f = this.ui.isFocus(id);
      panel(x, tabY + (sel ? 0 : 2), 28, 14, sel ? PCOL[i] : C.ui, f ? C.white : OUT, sel ? null : C.uiL);
      text('P' + (i + 1), x + 14, tabY + 4 + (sel ? 0 : 2), sel ? OUT : C.white, 1, 1, null);
      this.ui.add(id, x, tabY, 28, 14, () => { this.pid = i; this.hop = 0.4; });
    });
    drawCoins(4, H - 17, Save.data.coins, T);
    // category tabs
    const tw = Math.min(26, Math.floor((L.gw - 4) / 5) - 2);
    const tabIcons = { skin: ICON.tabSkin, hat: ICON.tabHat, halo: ICON.tabHalo, trail: ICON.tabTrail, weapon: ICON.tabWeapon };
    CATS.forEach((c, i) => {
      const x = L.gx + i * (tw + 2), y = L.gy - (L.port ? 0 : 16), sel = this.cat === c, id = 'cat' + c, f = this.ui.isFocus(id);
      panel(x, y + (sel ? 0 : 1), tw, 15, sel ? C.uiSel : C.ui, f ? C.gold : sel ? PCOL[this.pid] : OUT, C.uiL);
      drawSpr(tabIcons[c], x + tw / 2, y + 8 + (sel ? 0 : 1));
      this.ui.add(id, x, y, tw, 15, () => { this.cat = c; });
    });
    const catLabelY = L.gy - (L.port ? 0 : 16) + 17;
    text(CAT_NAME[this.cat] + 'S', L.gx + 2, catLabelY, C.gold, 1, 0);
    const owned = COSMETICS[this.cat].filter(it => Save.has(this.cat, it.id)).length;
    text(owned + '/' + COSMETICS[this.cat].length, L.gx + L.gw - 2, catLabelY, C.gray, 1, 2);
    // item grid
    const cs = 22, cols = Math.max(3, Math.floor((L.gw + 2) / (cs + 2)));
    const gy0 = catLabelY + 8;
    const items = COSMETICS[this.cat];
    let focusItem = null;
    items.forEach((it, i) => {
      const cx = L.gx + (i % cols) * (cs + 2), cy = gy0 + Math.floor(i / cols) * (cs + 2), id = 'it' + it.id;
      const has = Save.has(this.cat, it.id), eq = lo[this.cat] === it.id, f = this.ui.isFocus(id), rc = RARITY[it.rarity].col;
      const sh = this.shakeT > 0 && this.shakeId === this.cat + it.id ? Math.round(Math.sin(this.shakeT * 60) * 2) : 0;
      panel(cx + sh, cy, cs, cs, has ? (eq ? '#4b3a72' : C.ui) : '#221a33', f ? C.white : eq ? PCOL[this.pid] : rc, null, false);
      if (it.rarity === 'legendary' && has) { const g = (T * 2 + i) % 3; if (g < 1) { ctx.globalAlpha = 0.25 * (1 - g); ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx + 1, cy + 1, cs - 2, cs - 2); ctx.globalAlpha = 1; } }
      ctx.save(); ctx.beginPath(); ctx.rect(cx + 1 + sh, cy + 1, cs - 2, cs - 2); ctx.clip();
      if (has) drawItemIcon(this.cat, it.id, cx + cs / 2 + sh, cy + cs / 2, T, lo);
      else { text('?', cx + cs / 2 + sh, cy + 6, rc, 2, 1, null); }
      ctx.restore();
      if (!has) drawSpr(ART.lock, cx + cs - 4 + sh, cy + cs - 4);
      if (eq) { ctx.fillStyle = PCOL[this.pid]; ctx.fillRect(cx + 2, cy + 2, 3, 3); }
      const other = Save.data.loadout[1 - this.pid];
      if (other[this.cat] === it.id) { ctx.fillStyle = PCOL[1 - this.pid]; ctx.fillRect(cx + cs - 5, cy + 2, 3, 3); }
        this.ui.add(id, cx, cy, cs, cs, () => this.equip(this.cat, it.id), { def: eq, silent: true });
      if (this.ui.focus === id) focusItem = it;
    });
    // info box for the focused item
    const rows = Math.ceil(items.length / cols);
    const iy = Math.min(gy0 + rows * (cs + 2) + 2, H - 40);
    const info = focusItem || items.find(it => it.id === lo[this.cat]);
    if (info) {
      const has = Save.has(this.cat, info.id), rc = RARITY[info.rarity];
      panel(L.gx, iy, L.gw, 20, C.uiD, OUT, null, false);
      text(info.name, L.gx + 4, iy + 3, rc.col, 1, 0);
      text(rc.name, L.gx + L.gw - 4, iy + 3, rc.col, 1, 2);
      let line = info.desc || '';
      if (!has) line = this.cat === 'weapon' && LEVELS.find(l => l.reward === info.id) ? 'BEAT STORY LEVEL ' + LEVELS.find(l => l.reward === info.id).n + ' OR OPEN CHESTS' : 'LOCKED - OPEN CHESTS TO FIND IT';
      else if (lo[this.cat] === info.id) line = line || 'EQUIPPED ON P' + (this.pid + 1);
      else line = line || (Input.touch ? 'TAP TO EQUIP' : 'PRESS ENTER TO EQUIP');
      text(line, L.gx + 4, iy + 12, has ? C.white : C.gray, 1, 0, null);
    }
    // bottom buttons
    const by = H - 17;
    drawButton(this.ui, 'chests', L.gx, by, 62, 14, 'CHESTS', { on: () => Trans.go(() => Scenes.push(new ChestScene(this))), icon: ICON.chestIcon, col: '#5c3416' });
    drawButton(this.ui, 'back', L.gx + L.gw - 46, by, 46, 14, 'BACK', { on: () => this.close(), icon: ICON.back });
    if (this.popup) this.drawPopup();
  }
  drawPopup() {
    const P = this.popup, k = Ease.outBack(Math.min(1, P.t / 0.4));
    ctx.fillStyle = 'rgba(15,10,26,0.8)'; ctx.fillRect(0, 0, W, H);
    // rotating light rays
    ctx.save(); ctx.translate(W / 2, H / 2 - 14); ctx.rotate(P.t * 0.6);
    ctx.fillStyle = 'rgba(255,210,63,0.12)';
    for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -H); ctx.lineTo(10, -H); ctx.fill(); }
    ctx.restore();
    for (const q of this.parts) if (q.col) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    drawZoomText('A GIFT FOR YOU!', W / 2, H * 0.16, lerp(6, 2, k), C.gold);
    const lo = Save.data.loadout[0];
    drawDuck(W / 2, H / 2 + 14 - Math.abs(Math.sin(P.t * 4)) * 4, { skin: lo.skin, hat: 'wizard', facing: 'down', sc: 4 * k, t: P.t, blink: P.t % 3 > 2.85,
      sparkle: (x, y) => this.parts.push({ x, y, vx: rand(-8, 8), vy: rand(-20, -8), life: 0.8, max: 0.8, col: pick(['#fff3b0', '#ffd23f', '#c9a6ff']) }) });
    text('LEGENDARY WIZARD HAT', W / 2, H / 2 + 22, RARITY.legendary.col, 1, 1, 'outline');
    text('JUST FOR YOU :3  (EQUIPPED ON P1)', W / 2, H / 2 + 32, C.white, 1, 1, 'outline');
    this.popUI.begin();
    drawButton(this.popUI, 'ok', W / 2 - 26, H - 26, 52, 16, 'YAY!', { on: () => { this.popup = null; }, col: '#3d2f63', def: true });
  }
}
function drawItemIcon(cat, id, x, y, t, lo) {
  if (cat === 'skin') drawDuck(x, y + 7, { skin: id, facing: 'down', t, blink: t % 3 > 2.9 });
  else if (cat === 'hat') {
    if (id === 'none') { text('-', x, y - 2, C.gray, 1, 1, null); drawDuck(x, y + 9, { skin: lo.skin, facing: 'down', t }); }
    else drawDuck(x, y + 11, { skin: lo.skin, hat: id, facing: 'down', t, blink: t % 3 > 2.9 });
  } else if (cat === 'halo') { if (id === 'none') text('-', x, y - 2, C.gray, 1, 1, null); else { drawHalo(id, x, y - 2, 2, t, 'back'); drawHalo(id, x, y - 2, 2, t, 'front'); } }
  else if (cat === 'trail') { if (id === 'none') text('-', x, y - 2, C.gray, 1, 1, null); else drawTrailIcon(id, x, y, t); }
  else if (cat === 'weapon') drawSprX(GUN_ART[id], x, y, { sc: id === 'minigun' || id === 'shotgun' ? 1 : 2 });
}

// ================================================================ chests
function rollChest(kind) {
  const odds = CHESTS[kind].odds;
  const all = [];
  for (const cat of CATS) for (const it of COSMETICS[cat]) if (it.id !== 'none') all.push({ cat, it });
  const locked = all.filter(x => !Save.has(x.cat, x.it.id));
  let rar = weighted(odds);
  let pool = locked.filter(x => x.it.rarity === rar);
  if (!pool.length) { // nothing left at that rarity: try the others, best first
    for (const r of ['legendary', 'epic', 'rare', 'common']) { if (odds[r] && (pool = locked.filter(x => x.it.rarity === r)).length) { rar = r; break; } }
  }
  if (!pool.length) { const any = all.filter(x => odds[x.it.rarity]); const x = pick(any); return { cat: x.cat, it: x.it, dup: true }; }
  const x = pick(pool);
  return { cat: x.cat, it: x.it, dup: false };
}
class ChestScene {
  constructor(locker) { this.locker = locker; this.ui = new UI(); this.T = 0; this.st = 'pick'; this.t = 0; this.parts = []; this.kind = 'wood'; this.result = null; this.shake = 0; this.flash = 0; }
  update(dt) {
    this.T += dt; this.t += dt; this.shake = Math.max(0, this.shake - dt * 10); this.flash = Math.max(0, this.flash - dt * 2.5);
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 80) * dt; q.life -= dt; if (q.vr) q.rot += q.vr * dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    const acts = Input.menu();
    if (this.st === 'shake') {
      const n = Math.floor(this.t / 0.4);
      if (n > (this.thumps || 0) && n <= 3) { this.thumps = n; this.shake = 2 + n * 1.5; sfx.chestShake(n); this.leak(6 * n); }
      if (this.t > 1.45) { this.st = 'open'; this.t = 0; this.flash = 1; sfx.chestOpen(this.result.it.rarity); this.leak(60); this.confetti(); }
      if (acts.ok || Input.ptrEv.some(e => e.type === 'down')) this.t = Math.max(this.t, 1.2);
      return;
    }
    if (this.st === 'open') {
      if (Math.random() < (this.result.it.rarity === 'legendary' ? 0.5 : 0.2)) this.leak(1);
      if (this.t < 0.7) return;
    }
    if (acts.back && this.st === 'pick') { sfx.uiBack(); Trans.go(() => Scenes.pop()); return; }
    this.ui.update(dt, acts);
  }
  leak(n) {
    const col = RARITY[this.result.it.rarity].col, c = this.center();
    for (let i = 0; i < n; i++) { const a = rand(-Math.PI, 0), s = rand(30, 120); this.parts.push({ x: c.x + rand(-20, 20), y: c.y - 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 1), col: pick([col, '#fff8e7']) }); }
  }
  confetti() { for (let i = 0; i < 50; i++) this.parts.push({ x: rand(0, W), y: rand(-20, 0), vx: rand(-20, 20), vy: rand(20, 60), g: 20, life: rand(1.5, 3), col: pick(RAINBOW), conf: true }); }
  center() { return { x: Math.floor(W / 2), y: Math.floor(H * 0.58) }; }
  buy(kind) {
    const ch = CHESTS[kind];
    if (Save.data.coins < ch.price) { sfx.uiBack(); this.nope = 0.5; return; }
    Save.addCoins(-ch.price);
    this.kind = kind; this.result = rollChest(kind);
    if (this.result.dup) Save.addCoins(Math.floor(ch.price * 0.4));
    else Save.unlock(this.result.cat, this.result.it.id);
    this.st = 'shake'; this.t = 0; this.thumps = 0; this.ui = new UI();
  }
  draw() {
    const T = this.T, c = this.center();
    ctx.fillStyle = '#1f1830'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 0 : 12; x < W; x += 24) { ctx.fillStyle = '#251d3a'; ctx.fillRect(x, y, 12, 12); }
    ctx.save();
    if (this.shake) ctx.translate(Math.round(rand(-this.shake, this.shake)), Math.round(rand(-this.shake, this.shake)));
    this.ui.begin();
    if (this.st === 'pick') this.drawPick();
    else this.drawOpening();
    ctx.restore();
    for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.conf ? 2 : 2, q.conf ? 3 : 2); }
    if (this.flash) { ctx.globalAlpha = this.flash; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    drawCoins(4, 4, Save.data.coins, T);
  }
  drawPick() {
    const T = this.T;
    text('CHESTS', W / 2, 8, C.gold, 2, 1, 'outline');
    text('UNLOCKS ARE SHARED BY BOTH DUCKS!', W / 2, 24, C.white, 1, 1);
    const kinds = ['wood', 'gold'], pw = Math.min(110, Math.floor((W - 30) / 2));
    kinds.forEach((k, i) => {
      const ch = CHESTS[k], x = Math.floor(W / 2 - pw - 5 + i * (pw + 10)), y = 36, ph = H - y - 26;
      panel(x, y, pw, ph, C.ui, OUT, C.uiL);
      text(ch.name, x + pw / 2, y + 5, k === 'gold' ? C.gold : C.white, 1, 1);
      const bob = Math.round(Math.sin(T * 3 + i) * 2);
      const cy = y + 34 + bob;
      drawSprX(ART.chest[k].base, x + pw / 2, cy + 14, { sc: 2, ay: 1 });
      drawSprX(ART.chest[k].lid, x + pw / 2, cy + 14 - ART.chest[k].base.h * 2 + 2, { sc: 2, ay: 1 });
      let ly = y + 56;
      for (const r of ['common', 'rare', 'epic', 'legendary']) if (ch.odds[r]) { text(RARITY[r].name, x + 8, ly, RARITY[r].col, 1, 0); text(ch.odds[r] + '%', x + pw - 8, ly, C.white, 1, 2); ly += 7; }
      const can = Save.data.coins >= ch.price;
      drawButton(this.ui, 'buy' + k, x + 8, y + ph - 20, pw - 16, 15, (can ? 'OPEN  ' : 'NEED ') + ch.price, { on: () => this.buy(k), col: can ? '#3d2f63' : '#2a2535', tcol: can ? C.gold : C.gray, def: i === 0 });
    });
    drawButton(this.ui, 'back', W / 2 - 24, H - 18, 48, 14, 'BACK', { on: () => Trans.go(() => Scenes.pop()), icon: ICON.back });
  }
  drawOpening() {
    const c = this.center(), r = this.result, rc = RARITY[r.it.rarity], ch = ART.chest[this.kind];
    if (this.st === 'open') { // light rays in the rarity colour
      ctx.save(); ctx.translate(c.x, c.y - 10); ctx.rotate(this.T * 0.5);
      ctx.globalAlpha = 0.18; ctx.fillStyle = rc.col;
      const n = r.it.rarity === 'legendary' ? 12 : 8;
      for (let i = 0; i < n; i++) { ctx.rotate(TAU / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -W); ctx.lineTo(12, -W); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    const sc = 3;
    const sq = this.st === 'shake' ? Math.sin(this.t * 40) * 0.04 * (1 + this.thumps) : 0;
    drawSprX(ch.base, c.x, c.y + 18, { sc, ay: 1, sx: 1 + sq, sy: 1 - sq });
    const lidY = c.y + 18 - ch.base.h * sc + 3;
    if (this.st === 'shake') drawSprX(ch.lid, c.x, lidY - Math.abs(Math.sin(this.t * 30)) * this.thumps, { sc, ay: 1 });
    else {
      const k = Math.min(1, this.t / 0.5);
      drawSprX(ch.lid, c.x + k * 40, lidY - Math.sin(k * Math.PI) * 50 - k * 10, { sc, ay: 1, rot: k * 1.6, alpha: 1 - k * 0.6 });
      // the item rises out
      const rk = Ease.outBack(clamp((this.t - 0.15) / 0.5, 0, 1));
      const iy = c.y - 8 - rk * 40 + Math.sin(this.T * 3) * 2;
      const lo = Save.data.loadout[this.locker.pid];
      ctx.save(); ctx.translate(c.x, iy); ctx.scale(rk * 2.5, rk * 2.5); ctx.translate(-c.x, -iy);
      pcirc(c.x, iy, 12, 'rgba(15,10,26,0.5)');
      drawItemIcon(r.cat, r.it.id, c.x, iy, this.T, lo);
      ctx.restore();
      if (this.t > 0.6) {
        text(r.dup ? 'DUPLICATE!' : 'YOU OBTAINED:', W / 2, 10, r.dup ? C.gray : C.pink, 1, 1, 'outline');
        text(r.it.name, W / 2, 20, rc.col, 2, 1, 'outline');
        text(rc.name, W / 2, 34, rc.col, 1, 1);
        if (r.dup) text('+' + Math.floor(CHESTS[this.kind].price * 0.4) + ' COINS BACK', W / 2, 44, C.gold, 1, 1);
        const bw = 60, y = H - 20;
        const btns = [];
        if (!r.dup) btns.push(['equip', 'EQUIP P' + (this.locker.pid + 1), () => { this.locker.equip(r.cat, r.it.id); this.locker.cat = r.cat; this.done(); }]);
        btns.push(['again', 'AGAIN', () => { this.st = 'pick'; this.ui = new UI(); }]);
        btns.push(['ok', 'OK', () => this.done()]);
        const tw = btns.length * bw + (btns.length - 1) * 6;
        btns.forEach(([id, l, on], i) => drawButton(this.ui, id, Math.floor(W / 2 - tw / 2) + i * (bw + 6), y, bw, 14, l, { on, def: i === 0, col: i === 0 ? '#3d2f63' : C.ui }));
      }
    }
  }
  done() { Trans.go(() => Scenes.pop()); }
}
