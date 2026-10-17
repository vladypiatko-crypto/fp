'use strict';
/* QUACK ATTACK! — gameplay. One GameScene = one story level or one endless run.
 * Helper functions below work on R, the run currently being played. */

const WORLD_SIZE = 1500;
let R = null;

// ================================================================ spatial hash for robots
const CELL = 32, grid = new Map();
function buildGrid() {
  grid.clear();
  for (const e of R.enemies) {
    if (e.dead || e.spawnT > 0) continue;
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
  for (const e of R.enemies) {
    if (e.dead || e.spawnT > 0 || e.bs === 'burrow' || (skip && skip.has(e))) continue;
    const dd = d2(x, y, e.x, e.y); if (dd < bd) { bd = dd; best = e; }
  }
  return best;
}

// ================================================================ small helpers
const lvl = (p, k) => p.up[k] || 0;
// a duck's permanent training from the shop (p.train), e.g. trainLv(p, 'hp')
const trainLv = (p, k) => (p.train && p.train[k]) || 0;
const pSpeed = p => 70 * (1 + 0.1 * lvl(p, 'speed')) * (1 + 0.04 * trainLv(p, 'spd'));
const pMagnet = p => 34 * (1 + 0.45 * lvl(p, 'magnet')) * (1 + 0.12 * trainLv(p, 'mag'));
const reachMul = p => 1 + 0.15 * lvl(p, 'reach');
const pDashCd = p => 1.2 * (1 - 0.12 * lvl(p, 'dash'));
const xpFor = lv => Math.round(3 + lv * 4 + lv * lv * 0.45);
const alivePlayers = () => R.players.filter(p => !p.down);
const tScale = () => (R.mode === 'story' ? 1 + R.t / 450 : 1 + R.t / 500); // player damage growth over a run
function hpMul() {
  // story robots toughen up over time, but stop shortly after the boss arrives so a long boss fight can't snowball
  if (R.mode === 'story') return (1 + (R.level.diff - 1) * 0.15) * (1 + Math.min(R.t, R.level.time + 20) / 150);
  return 1 + R.t / 100 + Math.pow(R.t / 280, 2);
}
// later story levels hand out more XP so you level up as fast as in the first ones
const xpMul = () => (R.mode === 'story' ? 1 + (R.level.diff - 1) * 0.3 : 1);
function banner(str, col, dur = 2.2, sub = '') { R.banners.push({ str, col, t: 0, dur, sub }); if (R.banners.length > 2) R.banners.shift(); }
function floatText(x, y, str, col = C.white, life = 0.6, sc = 1) {
  if (R.texts.length > 90) R.texts.shift();
  R.texts.push({ x, y, str: String(str), col, life, max: life, sc, vy: -18 });
}
function burst(x, y, cols, n = 8, spd = 60, life = 0.45, size = 1, grav = 120) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(spd * 0.3, spd);
    R.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(life * 0.5, life), max: life, col: Array.isArray(cols) ? pick(cols) : cols, size, grav });
  }
  if (R.parts.length > 700) R.parts.splice(0, R.parts.length - 700);
}
function debris(x, y, n, spd = 80) { // gears and bolts flying out of a destroyed robot
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(spd * 0.4, spd);
    R.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rand(0.4, 0.8), max: 0.8, s: Math.random() < 0.4 ? ART.gear : ART.bolt, grav: 260, rot: rand(0, TAU), vr: rand(-12, 12) });
  }
}
function splat(x, y, col, n = 10, r = 6) {
  const px = [];
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), d = rand(0, r); px.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d * 0.7)]); }
  R.decals.push({ x: Math.round(x), y: Math.round(y), col, px, life: 10 });
  if (R.decals.length > 140) R.decals.shift();
}
function shakeAt(x, y, amt) { if (Net.role === 'host') Net.evt.push(['shk', amt, Math.round(x), Math.round(y)]); for (const v of R.views) { const p = R.players[v.pid]; if (p && d2(p.x, p.y, x, y) < 170 * 170) v.shake = Math.max(v.shake, amt); } }
function shakeFor(p, amt) { if (Net.role === 'host') Net.evt.push(['shkp', amt, p.id]); for (const v of R.views) if (v.pid === p.id) v.shake = Math.max(v.shake, amt); }
function inAnyView(x, y, m = 0) { return R.views.some(v => x > v.camX - m && x < v.camX + v.w + m && y > v.camY - m && y < v.camY + v.h + m); }

// ================================================================ the scene
class GameScene {
  // opts: { mode: 'story' | 'endless', level (LEVELS entry, story only), np: 1-4,
  //         world?, net?: { role: 'host' | 'client', pid, members, seed } for online play }
  constructor(opts) {
    R = this;
    this.mode = opts.mode; this.level = opts.level || null; this.np = opts.np;
    this.net = opts.net || null; this.online = !!this.net; this.role = this.net ? this.net.role : 'local';
    this.world = opts.world || (this.level ? this.level.world : pick(Object.keys(WORLD_THEME)));
    this.rnd = this.net ? mulberry32(this.net.seed) : Math.random; // online: everyone decorates the same world
    this.localPid = this.net ? this.net.pid : 0;
    this.viewPids = this.online ? [this.localPid] : (this.np === 1 ? [0] : [0, 1]);
    this.theme = WORLD_THEME[this.world];
    this.t = 0; this.state = 'play'; this.stateT = 0;
    this.enemies = []; this.shots = []; this.eshots = []; this.drops = []; this.items = []; this.parts = []; this.tparts = [];
    this.texts = []; this.fx = []; this.decals = []; this.bombs = []; this.marks = []; this.banners = []; this.puddles = [];
    this.spawnAcc = 0; this.nextEvent = 40; this.eventN = 0; this.nextBoss = this.mode === 'endless' ? 150 : Infinity;
    this.bossCount = 0; this.boss = null; this.bossSpawned = false; this.kills = 0; this.coins = 0; this.gemCombo = 0; this.gemComboT = 0;
    this.uid = 1; this.hintT = 0; this.slow = 1; this.sticks = [null, null, null, null]; this.ui = new UI(); this.pauseUI = new UI(); this.resUI = new UI();
    this.results = null; this.dialog = null;
    this.pendDash = false; this.pendOk = false; this.inAcc = 0; this.sndT = 0; this.clientEnemies = new Map();
    this.players = [];
    const members = this.net ? this.net.members : null;
    for (let i = 0; i < this.np; i++) this.players.push(this.newPlayer(i, members ? members[i].lo : null, members ? members[i].name : null, members ? members[i].tr : null));
    this.useBoosters();
    this.makeDecor();
    this.layout();
    for (const v of this.views) { const p = this.players[v.pid]; v.camX = p.x - v.w / 2; v.camY = p.y - v.h / 2; }
    if (this.role === 'client') this.state = 'play'; // the host starts the match and sends us its state
    else if (this.level && this.level.intro.length && !this.online) { this.state = 'dialog'; this.dialog = new Dialog(this.level.intro, () => this.begin()); }
    else this.begin();
    Music.play(this.state === 'dialog' ? 'calm' : worldSong(this.world));
  }
  begin() {
    this.state = 'play'; this.dialog = null;
    Music.play(worldSong(this.world));
    banner(this.level ? fmt('LEVEL {0}: {1}', this.level.n, this.level.name) : 'SURVIVE!', C.gold, 2.4, this.level ? 'SURVIVE UNTIL THE BOSS ARRIVES' : '');
    for (let i = 0; i < 5; i++) spawnEnemy('bolt', spawnPos());
  }
  newPlayer(id, lo0, name, tr0) {
    const lo = lo0 || Save.data.loadout[id] || Save.data.loadout[0];
    const train = cleanTrain(tr0 || (this.online ? {} : Save.data.train)), hp = 100 + 10 * (train.hp || 0);
    const ring = this.np > 1 ? [Math.cos(id / this.np * TAU) * 28, Math.sin(id / this.np * TAU) * 28] : [0, 0];
    return {
      id, lo, name: name || 'P' + (id + 1), weapon: lo.weapon, x: WORLD_SIZE / 2 + ring[0], y: WORLD_SIZE / 2 + ring[1], r: 5, hp, maxHp: hp, spd: 70, gone: false, train,
      facing: 'down', turnT: 0, ax: 1, ay: 0, aim: 0, iframes: 0, dashT: 0, dashCd: 0, dvx: 0, dvy: 0, dashHit: new Set(),
      xp: 0, level: 1, xpNext: xpFor(1), kills: 0, down: false, reviveT: 0, up: {}, over: {}, shieldT: 0, tm: { main: 0.3, bread: 1, zap: 1.5, quack: 2, feather: 1.2, puddle: 1.5 },
      pending: 0, choice: null, sel: 1, choiceT: 0, anim: 0, moving: false, eggAng: 0, blinkT: rand(1, 4), hurtFlash: 0, moved: false,
      trailT: 0, rainbow: [], ghosts: [], target: null, squash: 0,
    };
  }
  makeDecor() {
    const th = this.theme, r = this.rnd;
    const pickW = tbl => { let sum = 0; for (const k in tbl) sum += tbl[k]; let x = r() * sum; for (const k in tbl) { x -= tbl[k]; if (x <= 0) return k; } return Object.keys(tbl)[0]; };
    this.decor = []; this.tall = [];
    const mid = WORLD_SIZE / 2;
    for (let i = 0; i < 650; i++) this.decor.push({ x: 16 + r() * (WORLD_SIZE - 32), y: 16 + r() * (WORLD_SIZE - 32), s: DECO_ART[pickW(th.deco)] });
    for (let i = 0; i < 70; i++) {
      const x = 30 + r() * (WORLD_SIZE - 60), y = 30 + r() * (WORLD_SIZE - 60);
      if (d2(x, y, mid, mid) < 70 * 70) continue;
      this.tall.push({ x, y, s: DECO_ART[pickW(th.tall)], tall: true });
    }
  }
  layout() {
    const old = this.views || [];
    this.views = [];
    const vp = this.viewPids;
    if (vp.length === 1) this.views.push({ pid: vp[0], x: 0, y: 0, w: W, h: H });
    else if (W >= H) { const hw = Math.floor(W / 2); this.views.push({ pid: vp[0], x: 0, y: 0, w: hw - 1, h: H }, { pid: vp[1], x: hw + 1, y: 0, w: W - hw - 1, h: H }); }
    else { const hh = Math.floor(H / 2); this.views.push({ pid: vp[0], x: 0, y: hh + 1, w: W, h: H - hh - 1 }, { pid: vp[1], x: 0, y: 0, w: W, h: hh - 1 }); }
    for (const v of this.views) {
      const o = old.find(q => q.pid === v.pid), p = this.players[v.pid];
      v.camX = o ? o.camX : p.x - v.w / 2; v.camY = o ? o.camY : p.y - v.h / 2; v.shake = 0;
    }
  }
  resize() { this.layout(); }

  // ------------------------------------------------------------ update
  update(dt) {
    this.juice(dt); // combo counter, announcer, vibration (quests.js)
    if (this.role === 'client') { this.clientUpdate(dt); return; }
    const acts = Input.menu();
    if (this.state === 'dialog') { this.dialog.update(dt, acts); this.tickCosmetics(dt); updateParticles(dt); return; }
    if (this.state === 'results') { this.updateResults(dt, acts); return; }
    if (this.state === 'paused') { this.updatePause(dt, acts); return; }
    if (acts.start && this.state === 'play') { this.pause(); return; }
    this.handlePointers();
    this.ui.update(dt, null);
    for (const p of this.players) tickPicked(p, dt);
    if (choosing()) updateLevelUp(dt, cardsPauseAll());
    if (cardsPauseAll()) { this.tickCosmetics(dt); this.netPump(dt); return; } // everyone is picking: hold the world still
    if (Impact.stop > 0) { this.netPump(dt); return; } // impact frame: the world holds still for a moment
    if (this.state === 'dying' || this.state === 'clear') {
      this.stateT += dt;
      dt *= this.state === 'dying' ? 0.3 : (this.stateT < 1.2 ? 0.35 : 1);
      if (this.state === 'dying' && this.stateT > 1.6) { this.finish(false); return; }
      if (this.state === 'clear') this.updateClear();
    }
    this.t += dt; this.hintT += dt;
    if (this.bossIntro) this.bossIntro.t += dt;
    buildGrid();
    if (this.state === 'play') director(dt);
    for (const p of this.players) updatePlayer(p, dt);
    updateEnemies(dt);
    buildGrid();
    updateShots(dt);
    updateBombs(dt); updatePuddles(dt);
    updateDrops(dt);
    updateParticles(dt);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < f.dur);
    for (const d of this.decals) d.life -= dt;
    this.decals = this.decals.filter(d => d.life > 0);
    this.enemies = this.enemies.filter(e => !e.dead);
    for (const b of this.banners) b.t += dt;
    this.banners = this.banners.filter(b => b.t < b.dur);
    this.gemComboT -= dt; if (this.gemComboT <= 0) this.gemCombo = 0;
    if (this.state === 'play' && !alivePlayers().length) { this.state = 'dying'; this.stateT = 0; Music.play(null); }
    this.updateCameras(dt);
    this.netPump(dt);
  }
  tickCosmetics(dt) { for (const p of this.players) { p.anim += dt; p.blinkT -= dt; if (p.blinkT < -0.12) p.blinkT = rand(2, 5); } }
  handlePointers() {
    for (const ev of Input.ptrEv) {
      if (ev.type === 'down') {
        if (this.ui.hitTest(ev.x, ev.y)) continue;
        if (this.state !== 'play') continue;
        const v = viewAt(ev.x, ev.y); if (!v) continue;
        const pid = v.pid, p = this.players[pid];
        if (p.choice) { cardTap(ev); continue; } // this screen's duck is picking a card
        if (Input.touch && d2(ev.x, ev.y, dashBtn(v).x, dashBtn(v).y) < 20 * 20) { this.dashFor(pid); continue; }
        if (!this.sticks[pid]) this.sticks[pid] = { id: ev.id, bx: ev.x, by: ev.y, x: ev.x, y: ev.y };
        else this.dashFor(pid);
      } else if (ev.type === 'move') {
        for (const s of this.sticks) if (s && s.id === ev.id) {
          s.x = ev.x; s.y = ev.y;
          const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy), lim = STICK_R * 1.6;
          if (dl > lim) { s.bx = s.x - dx / dl * lim; s.by = s.y - dy / dl * lim; }
        }
      } else if (ev.type === 'up') {
        for (let i = 0; i < this.sticks.length; i++) if (this.sticks[i] && this.sticks[i].id === ev.id) this.sticks[i] = null;
      }
    }
  }
  updateCameras(dt) {
    for (const v of this.views) {
      const p = this.players[v.pid];
      const lx = p.moving ? p.mvx * 14 : 0, ly = p.moving ? p.mvy * 10 : 0;
      v.camX = lerp(v.camX, p.x + lx - v.w / 2, Math.min(1, dt * 6));
      v.camY = lerp(v.camY, p.y + ly - v.h / 2, Math.min(1, dt * 6));
      v.shake = Math.max(0, v.shake - dt * 20);
    }
  }
  updateClear() {
    // after the boss falls, the remaining robots pop one by one
    if (this.stateT > 0.4) {
      const e = this.enemies.find(q => !q.dead && q.spawnT <= 0);
      if (e && Math.random() < 0.5) killEnemy(e, null, true);
    }
    if (Math.random() < 0.3) { const p = pick(this.players); burst(p.x + rand(-60, 60), p.y + rand(-50, 20), RAINBOW, 10, 70, 0.8); }
    if (this.stateT > 3.2) {
      const outro = this.level && this.level.outro && !this.online;
      if (outro && outro.length && !this.outroDone) { this.outroDone = true; this.state = 'dialog'; this.dialog = new Dialog(outro, () => this.finish(true)); Music.play('calm'); }
      else this.finish(true);
    }
  }
  // online, a pause stops the game for everybody (and anybody can carry on)
  pause(by) {
    this.adminMenu = false;
    this.state = 'paused'; this.sticks = [null, null, null, null]; Music.paused = true; sfx.uiBack();
    this.pausedBy = by === undefined ? this.localPid || 0 : by;
    if (this.role === 'client') { this.pauseAskT = nowSec() + 0.6; Net.relay('host', { t: 'in', pause: 1 }); }
  }
  resume() {
    this.state = 'play'; Music.paused = false;
    if (this.role === 'client') { this.pauseAskT = nowSec() + 0.6; Net.relay('host', { t: 'in', resume: 1 }); }
  }
  updatePause(dt, acts) {
    if (acts.start || acts.back) { this.resume(); return; }
    this.pauseUI.update(dt, acts);
    this.tickCosmetics(dt);
    this.netPump(dt); // online: keep friends up to date (they see the pause too)
  }
  // end of a run: work out coins and unlocks, then show the results panel
  finish(won) {
    const res = { won, t: this.t, kills: this.kills, coins: this.coins, bonus: 0, reward: null, best: false, shown: 0 };
    res.bonus = Math.floor(this.t / 8) + Math.floor(this.kills / 20) + this.bossCount * 25;
    res.bosses = this.bossCount - (this.boss && !this.boss.dead ? 1 : 0); // bosses beaten (for quests)
    if (this.mode === 'story' && won && this.level.event) { // an event level: its reward, but no story progress
      res.bonus += 150;
      const rw = rewardOf(this.level);
      if (Save.unlock(rw.cat, rw.id)) res.reward = rw;
    } else if (this.mode === 'story' && won) {
      const first = !Save.data.story.cleared[this.level.n];
      res.bonus += first ? 120 : 40;
      Save.data.story.cleared[this.level.n] = true;
      Save.data.story.reached = Math.max(Save.data.story.reached, this.level.n + 1);
      const rw = rewardOf(this.level);
      if (Save.unlock(rw.cat, rw.id)) res.reward = rw;
    }
    if (this.mode === 'endless') {
      const k = 'e' + this.np;
      if (this.t > Save.data.best[k]) { Save.data.best[k] = this.t; res.best = true; }
    }
    res.perk = payRun(res);
    this.results = res;
    this.state = 'results'; this.stateT = 0;
    Music.paused = false;
    if (won) { sfx.win(); Music.play('title'); } else { sfx.over(); Music.play('calm'); }
  }
  updateResults(dt, acts) {
    this.stateT += dt;
    this.netPump(dt);
    const r = this.results;
    const total = r.coins + r.bonus + (r.perk || 0);
    if (r.shown < total) { r.shown = Math.min(total, r.shown + Math.max(1, total * dt * 0.9)); if (Math.random() < 0.5) sfx.coin(); }
    this.resUI.update(dt, this.stateT > 0.6 ? acts : null);
    this.tickCosmetics(dt);
    updateParticles(dt);
  }

  // ------------------------------------------------------------ draw
  draw() {
    ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
    // event looks (snow, bats, santa hats...): an event's own level only shows that event
    const looks = this.level && this.level.event ? [this.level.event] : runningEvents().filter(id => EVENTS[id].kind === 'holiday');
    const eh = looks.find(id => EVENTS[id].hat); this.eventHat = eh ? EVENTS[eh].hat : null;
    for (const v of this.views) {
      drawView(v);
      if (this.theme.underwater) drawUnderwaterView(v, this.t);
      for (const id of looks) if (EVENTS[id].view) EVENTS[id].view(v, this.t);
    }
    if (this.views.length === 2) { ctx.fillStyle = OUT; if (W >= H) ctx.fillRect(this.views[0].w, 0, 2, H); else ctx.fillRect(0, this.views[1].h, W, 2); }
    this.ui.begin();
    drawTopBar();
    if (this.state === 'play') this.drawJuice();
    if (this.state === 'play') for (const v of this.views) drawLevelUp(v);
    if (this.state === 'dialog') this.dialog.draw();
    if (this.state === 'paused') this.drawPause();
    if (this.state === 'results') this.drawResults();
  }
  // the admin's cheat menu (only on the admin's device, and online only for the host)
  adminPowers() {
    const close = (msg) => { this.adminMenu = false; this.resume(); if (msg) banner(msg, '#ff5ce1', 1.6); };
    return [
      ['a_heal', 'HEAL EVERYONE', () => { for (const p of this.players) if (!p.gone) { p.down = false; p.reviveT = 0; p.hp = p.maxHp; } sfx.revive(); close('HEALED!'); }],
      ['a_level', 'LEVEL UP', () => { for (const p of this.players) if (!p.gone) gainXp(p, p.xpNext - p.xp); close('LEVEL UP!'); }],
      ['a_clear', 'CLEAR ROBOTS', () => { for (const e of this.enemies) if (!e.dead && !e.boss) killEnemy(e, this.players[0]); sfx.bigBoom(); close('KABOOM!'); }],
      ['a_boss', 'SPAWN BOSS', () => { if (this.boss && !this.boss.dead) return; close(); spawnBoss(this.level ? this.level.boss : BOSS_ORDER[this.bossCount % BOSS_ORDER.length]); }],
      ['a_god', this.godMode ? 'GOD MODE: ON' : 'GOD MODE: OFF', () => { this.godMode = !this.godMode; sfx.uiMove(); }],
      ['a_back', 'BACK', () => { this.adminMenu = false; }],
    ];
  }
  drawPause() {
    ctx.fillStyle = 'rgba(15,10,26,0.78)'; ctx.fillRect(0, 0, W, H);
    const ui = this.pauseUI; ui.begin();
    if (this.adminMenu) { this.drawAdminPowers(ui); return; }
    const bw = 104, bh = 16, gap = 4;
    const labels = [['resume', 'RESUME', () => this.resume()]];
    if (!this.online) labels.push(['locker', 'LOCKER', () => Trans.go(() => Scenes.push(new LockerScene({ fromPause: true })))]);
    if (typeof Cloud !== 'undefined' && Cloud.isAdmin() && this.role !== 'client') labels.push(['admin', 'ADMIN POWERS', () => { this.adminMenu = true; sfx.uiMove(); }]);
    labels.push(['sound', AU.muted ? 'SOUND: OFF' : 'SOUND: ON', () => { setMuted(!AU.muted); Save.data.muted = AU.muted; Save.write(); }]);
    if (fsSupported()) labels.push(['fs', document.fullscreenElement ? 'EXIT FULLSCREEN' : 'FULLSCREEN', toggleFullscreen]);
    labels.push(['quit', this.online ? 'LEAVE GAME' : this.mode === 'story' ? 'QUIT TO MAP' : 'QUIT TO MENU',
      () => (this.online ? this.quitOnline() : Trans.go(() => { Music.paused = false; Scenes.set(this.mode === 'story' ? new MapScene(this.np) : new TitleScene(true)); }))]);
    const total = labels.length * (bh + gap) - gap + 26;
    const px = Math.floor(W / 2 - bw / 2 - 8), py = Math.floor(H / 2 - total / 2);
    panel(px, py, bw + 16, total + 12, C.uiD, OUT, C.uiL);
    text('PAUSED', W / 2, py + 6, C.gold, 2, 1, 'outline');
    const pp = this.online && this.players[this.pausedBy];
    if (pp) text(pp.id === this.localPid ? 'THE GAME IS PAUSED FOR EVERYONE' : fmt('{0} PAUSED THE GAME', keep(pp.name)), W / 2, py - 10, C.white, 1, 1, 'outline');
    labels.forEach(([id, label, on], i) => {
      drawButton(ui, id, px + 8, py + 26 + i * (bh + gap), bw, bh, label, { on, def: i === 0 });
      if (id === 'locker' && Save.anyNew()) drawNewTag(px + bw - 6, py + 26 + i * (bh + gap), performance.now() / 1000);
    });
    // the ducks dance a little while you wait
    this.players.forEach((p, i) => {
      const x = px - 22 + (i ? bw + 60 : 0), y = py + total / 2 + 12;
      if (x < 8 || x > W - 8) return;
      shadow(x, y, 6);
      drawDuck(x, y + Math.round(Math.abs(Math.sin(p.anim * 5)) * -2), { skin: p.lo.skin, hat: p.lo.hat, halo: p.lo.halo, facing: ['down', 'right', 'up', 'left'][Math.floor(p.anim * 2) % 4], frame: Math.floor(p.anim * 6) % 2, blink: p.blinkT < 0, t: p.anim, sc: 2 });
    });
  }
  drawAdminPowers(ui) {
    const items = this.adminPowers(), bw = 120, bh = 15, gap = 3;
    const total = items.length * (bh + gap) - gap + 24;
    const px = Math.floor(W / 2 - bw / 2 - 8), py = Math.floor(H / 2 - total / 2);
    panel(px, py, bw + 16, total + 12, '#2a1238', '#ff5ce1', C.uiL);
    text('ADMIN POWERS', W / 2, py + 6, rarityCol('admin', performance.now() / 1000), 1, 1, 'outline');
    items.forEach(([id, label, on], i) => drawButton(ui, id, px + 8, py + 22 + i * (bh + gap), bw, bh, label, { on, def: i === 0, col: id === 'a_back' ? C.ui : '#4b2a6b' }));
  }
  drawResults() {
    const r = this.results, k = Math.min(1, this.stateT / 0.4);
    ctx.fillStyle = `rgba(15,10,26,${0.8 * k})`; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(W - 16, 240), ph = Math.min(H - 12, 172);
    const px = Math.floor(W / 2 - pw / 2), py = Math.floor(H / 2 - ph / 2 + (1 - Ease.outBack(k)) * 40);
    panel(px, py, pw, ph, C.uiD, OUT, C.uiL);
    const title = r.won ? (this.mode === 'story' ? 'LEVEL CLEAR!' : 'VICTORY!') : 'GAME OVER';
    const tsc = pw > 200 ? 3 : 2;
    text(title, W / 2, py + 8, r.won ? C.gold : C.red, tsc, 1, 'outline');
    let y = py + 12 + tsc * 5 + 6;
    if (!r.won) { text(this.mode === 'story' ? 'THE ROBOTS GOT YOU... TRY AGAIN!' : 'THE ROBOTS WON THIS TIME...', W / 2, y, C.white, 1, 1); y += 10; }
    else if (this.mode === 'story') { text(fmt('{0} IS SAFE AGAIN!', this.level.name), W / 2, y, C.white, 1, 1); y += 10; }
    const row = (a, b, col = C.white) => { text(a, px + 14, y, C.gray, 1, 0); text(b, px + pw - 14, y, col, 1, 2); y += 8; };
    row('TIME', fmtTime(r.t));
    row('ROBOTS SCRAPPED', r.kills);
    row('COINS PICKED UP', r.coins, C.gold);
    row('BONUS', '+' + r.bonus, C.gold);
    if (this.myPerk) row(this.myPerkLabel || 'SHOP BONUS', '+' + this.myPerk, C.gold);
    if (r.best) { if ((this.stateT * 4 | 0) % 2) text('NEW BEST TIME!', W / 2, y, C.pink, 1, 1); y += 8; }
    y += 2;
    coinIcon(Math.floor(W / 2 - textW('+' + Math.floor(r.shown), 2) / 2 - 8), y + 1, this.stateT);
    text('+' + Math.floor(r.shown), W / 2 + 4, y, C.gold, 2, 1);
    y += 15;
    if (r.reward) {
      const it = itemOf(r.reward.cat, r.reward.id);
      ctx.save(); ctx.beginPath(); ctx.rect(px + 8, y - 6, 22, 18); ctx.clip();
      drawItemIcon(r.reward.cat, r.reward.id, px + 19, y + 3, this.stateT, this.players[0].lo); ctx.restore();
      text(fmt(r.reward.cat === 'weapon' ? 'NEW WEAPON: {0}!' : 'NEW ITEM: {0}!', it.name), px + 32, y + 1, RARITY[it.rarity].col, 1, 0);
      y += 13;
    }
    // ducks cheering or crying
    this.players.forEach((p, i) => {
      const x = px + (i ? pw - 24 : 24), yy = py + ph - 26;
      const hop = r.won ? Math.round(Math.abs(Math.sin(p.anim * 7 + i)) * -7) : 0;
      shadow(x, yy, 8);
      drawDuck(x, yy + hop, { skin: p.lo.skin, hat: p.lo.hat, halo: p.lo.halo, facing: 'down', frame: 0, blink: !r.won || p.blinkT < 0, t: p.anim, sc: 2 });
    });
    const ui = this.resUI; ui.begin();
    const bw = Math.min(70, Math.floor((pw - 40) / 3)), bh = 15, by = py + ph - bh - 7;
    let btns;
    if (this.online) btns = this.onlineResultButtons();
    else if (this.mode === 'story' && this.level.event) {
      btns = [[r.won ? 'menu' : 'retry', r.won ? 'MENU' : 'RETRY', () => Trans.go(() => Scenes.set(r.won ? new TitleScene(true) : new GameScene({ mode: 'story', level: this.level, np: this.np })))],
        ['locker', 'LOCKER', () => Trans.go(() => Scenes.push(new LockerScene({})))], ['menu2', 'MENU', () => Trans.go(() => Scenes.set(new TitleScene(true)))]];
      if (r.won) btns.pop();
    } else if (this.mode === 'story') {
      btns = r.won
        ? [['next', CHAPTERS.some(c => c.to === this.level.n) ? 'ENDING' : 'NEXT', () => Trans.go(() => {
          // the last level of a chapter plays its ending, then back to the map (or the title after the very last one)
          const ch = CHAPTERS.find(c => c.to === this.level.n);
          if (ch) Scenes.set(new CutsceneScene(ch.ending, () => Scenes.set(this.level.n === LEVELS.length ? new TitleScene(true) : new MapScene(this.np)), this.np));
          else Scenes.set(new MapScene(this.np));
        })],
          ['locker', 'LOCKER', () => Trans.go(() => Scenes.push(new LockerScene({})))]]
        : [['retry', 'RETRY', () => Trans.go(() => Scenes.set(new GameScene({ mode: 'story', level: this.level, np: this.np })))],
          ['map', 'MAP', () => Trans.go(() => Scenes.set(new MapScene(this.np)))]];
    } else {
      btns = [['retry', 'RETRY', () => Trans.go(() => Scenes.set(new GameScene({ mode: 'endless', np: this.np })))],
        ['locker', 'LOCKER', () => Trans.go(() => Scenes.push(new LockerScene({})))],
        ['menu', 'MENU', () => Trans.go(() => Scenes.set(new TitleScene(true)))]];
    }
    const tw = btns.length * bw + (btns.length - 1) * 5;
    btns.forEach(([id, label, on], i) => {
      const x = Math.floor(W / 2 - tw / 2) + i * (bw + 5);
      drawButton(ui, id, x, by, bw, bh, label, { on, def: i === 0 });
      if (id === 'locker' && Save.anyNew()) drawNewTag(x + bw - 8, by, this.stateT);
    });
  }
}

// ================================================================ spawning
function spawnEnemy(type, pos, opts = {}) {
  const d = ENEMIES[type];
  const hp = d.hp * hpMul() * (opts.hpScale || 1);
  const e = {
    id: R.uid++, type, d, x: pos.x, y: pos.y, kx: 0, ky: 0, hp, maxHp: hp, r: d.r, spd: d.spd * rand(0.9, 1.1),
    dmg: d.dmg * (R.mode === 'story' ? 1 + (R.level.diff - 1) * 0.08 : 1 + R.t / 400), flash: 0, anim: rand(0, 10), dead: false, eggCd: 0,
    spawnT: opts.instant ? 0 : 0.45, flip: false, st: 'move', stT: rand(1, 2), shootT: rand(1.5, 3), fuse: -1, rot: 0, z: 0,
  };
  if (!opts.instant && R.t > 20 && Math.random() < ELITE_CHANCE) makeElite(e); // a rare golden ELITE (quests.js)
  if (e.spawnT > 0 && inAnyView(e.x, e.y, 10)) sfx.warp();
  R.enemies.push(e);
  return e;
}
// every world has its own song
const WORLD_SONG = { pond: 'battle', woods: 'battle', peaks: 'sky', factory: 'factory', tower: 'factory', beach: 'beach', swamp: 'swamp', clouds: 'sky', moon: 'space', ship: 'factory',
  volcano: 'volcano', desert: 'beach', candy: 'candy', crystal: 'cave', castle: 'castle',
  jungle: 'jungle', pirate: 'pirate', knight: 'castle', west: 'western', neon: 'neon',
  reef: 'ocean', wreck: 'deep', kelp: 'ocean', abyss: 'deep', atlantis: 'ocean' };
const worldSong = w => WORLD_SONG[w] || 'battle';
function spawnBoss(id) {
  const b = BOSSES[id];
  const pos = spawnPos();
  let hp = b.hp * (1 + 0.6 * (R.np - 1));
  if (R.mode === 'endless') hp *= (1 + R.bossCount * 0.6) * (1 + R.t / 600);
  const e = {
    id: R.uid++, type: id, d: Object.assign({ xp: 0, fx: b.fx || 'metal', heavy: 0.05 }, b), boss: true, x: pos.x, y: pos.y, kx: 0, ky: 0,
    hp, maxHp: hp, r: b.r, spd: b.spd, dmg: b.dmg, flash: 0, anim: 0, dead: false, eggCd: 0, spawnT: 0.8, flip: false,
    bs: 'walk', bt: 2.5, last: null, phase: 1, z: 0, rot: 0,
  };
  R.enemies.push(e);
  R.boss = e; R.bossCount++;
  R.bossIntro = { t: 0, name: b.name };
  Music.play(b.final ? 'final' : 'boss'); sfx.bossIntro(); sfx.honk(b.final ? 0.8 : 1.15); sfx.warn(); Impact.trigger('big');
  return e;
}
function spawnPos() {
  let x = WORLD_SIZE / 2, y = WORLD_SIZE / 2;
  const alive = alivePlayers(); if (!alive.length) return { x, y };
  for (let tries = 0; tries < 10; tries++) {
    const p = pick(alive);
    const v = R.views.find(q => q.pid === p.id) || R.views[0];
    const hw = v.w / 2 + 14, hh = v.h / 2 + 14, side = rint(0, 3);
    if (side === 0) { x = p.x + rand(-hw, hw); y = p.y - hh; } else if (side === 1) { x = p.x + rand(-hw, hw); y = p.y + hh; }
    else if (side === 2) { x = p.x - hw; y = p.y + rand(-hh, hh); } else { x = p.x + hw; y = p.y + rand(-hh, hh); }
    x = clamp(x, 10, WORLD_SIZE - 10); y = clamp(y, 10, WORLD_SIZE - 10);
    if (!inAnyView(x, y, 6)) break;
  }
  return { x, y };
}
function rollType() {
  if (R.mode === 'story') return weighted(R.level.pool);
  const tbl = {};
  for (const [t0, k, w] of ENDLESS_POOL_STEPS) if (R.t >= t0) tbl[k] = w + (k === 'boom' || k === 'tank' ? R.t / 120 : 0);
  return weighted(tbl);
}
function director(dt) {
  const t = R.t;
  let rate;
  if (R.mode === 'story') rate = Math.min(9, 0.9 + (R.level.diff - 1) * 0.15 + t * 0.02);
  else rate = Math.min(11, 0.9 + t * 0.024 + Math.max(0, t - 180) * 0.02);
  rate *= 1 + 0.5 * (R.np - 1);
  if (R.boss && !R.boss.dead) rate *= 0.4;
  R.spawnAcc += rate * dt;
  const cap = R.np >= 2 ? 360 : 260;
  while (R.spawnAcc >= 1) { R.spawnAcc -= 1; if (R.enemies.length < cap) spawnEnemy(rollType(), spawnPos()); }
  // swarm events
  if (t >= R.nextEvent && !(R.boss && !R.boss.dead)) {
    R.nextEvent += R.mode === 'story' ? 35 : 50;
    const alive = alivePlayers();
    if (alive.length) {
      const p = pick(alive), kind = R.eventN++ % 3;
      const types = ['bolt', 'boom', 'minigoo'], names = ['BOLT BOT STAMPEDE!', 'BOOM BOT BLITZ!', 'GOO FLOOD!'];
      const n = Math.floor(14 + t / 9) + (kind === 2 ? 10 : 0);
      banner(names[kind], C.pink, 2.2);
      sfx.warn();
      const v = R.views.find(q => q.pid === p.id) || R.views[0];
      const rad = Math.hypot(v.w, v.h) / 2 + 10;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        spawnEnemy(types[kind], { x: clamp(p.x + Math.cos(a) * rad, 10, WORLD_SIZE - 10), y: clamp(p.y + Math.sin(a) * rad, 10, WORLD_SIZE - 10) });
      }
    }
  }
  // bosses
  if (R.mode === 'story' && !R.bossSpawned && t >= R.level.time) { R.bossSpawned = true; spawnBoss(R.level.boss); }
  if (R.mode === 'endless' && t >= R.nextBoss) { R.nextBoss += 150; spawnBoss(BOSS_ORDER[R.bossCount % BOSS_ORDER.length]); }
}

// ================================================================ damage
function hurtEnemy(e, dmg, kx, ky, kb, owner) {
  if (e.dead || e.spawnT > 0 || e.bs === 'burrow') return; // a burrowed boss is safe underground
  const crit = owner && owner.up && lvl(owner, 'crit') && Math.random() < 0.08 * lvl(owner, 'crit');
  if (crit) dmg *= 2; // lucky shot
  if (owner && owner.train) dmg *= 1 + 0.06 * trainLv(owner, 'dmg'); // sharper beak (shop training)
  e.hp -= dmg; e.flash = 0.08;
  const res = e.d.heavy || 1;
  e.kx += kx * kb * res; e.ky += ky * kb * res;
  floatText(e.x + rand(-3, 3), e.y - e.r - 6 - e.z, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ff8c1a' : dmg >= 40 ? C.gold : C.white, crit ? 0.6 : 0.45);
  if (e.boss && dmg > e.maxHp * 0.015) Impact.trigger('small');
  if (e.hp <= 0) killEnemy(e, owner); else if (e.d.fx === 'goo') sfx.squish(); else sfx.hit();
}
function killEnemy(e, owner, quiet) {
  if (e.dead) return;
  e.dead = true; R.kills++;
  if (owner) owner.kills++;
  const goo = e.d.fx === 'goo';
  if (goo) { burst(e.x, e.y, ['#7ee04a', '#c3ff9a', '#2f6b1a'], e.boss ? 50 : 10, e.boss ? 120 : 70, 0.5, e.boss ? 2 : 1); splat(e.x, e.y + 2, '#5fbf3a', e.boss ? 40 : 10, e.boss ? 20 : 5); sfx.squish(); }
  else {
    burst(e.x, e.y, ['#ffd23f', '#ff8c1a', '#fff8e7'], e.boss ? 40 : 6, e.boss ? 120 : 60, 0.35);
    debris(e.x, e.y, e.boss ? 24 : (e.r > 5 ? 5 : 3));
    R.fx.push({ k: 'pop', x: e.x, y: e.y, r: e.r + 3, t: 0, dur: 0.18 });
    splat(e.x, e.y + 2, '#3d3a52', e.boss ? 30 : 6, e.boss ? 16 : 4);
    sfx.clank();
  }
  if (quiet) return;
  if (e.elite) eliteLoot(e);
  if (e.d.xp) dropAt(e.x, e.y, 'xp', e.d.xp * xpMul());
  const coinChance = (e.type === 'tank' ? 0.2 : 0.06) * (1 + 0.5 * (owner && owner.up ? lvl(owner, 'greed') : 0));
  if (owner && owner.up && lvl(owner, 'vamp') && !owner.down) owner.hp = Math.min(owner.maxHp, owner.hp + 0.4 * lvl(owner, 'vamp'));
  if (Math.random() < coinChance) dropAt(e.x + rand(-3, 3), e.y + rand(-3, 3), 'coin', 1);
  const luck = Math.random();
  if (luck < 0.011) R.items.push({ k: 'heart', x: e.x, y: e.y, t: 0 });
  else if (luck < 0.015) R.items.push({ k: 'magnet', x: e.x, y: e.y, t: 0 });
  else if (luck < 0.018) R.items.push({ k: 'sauce', x: e.x, y: e.y, t: 0 });
  if (e.d.ai === 'bomber') explode(e.x, e.y, 24, 22 * hpMul(), owner, false);
  if (e.d.split) for (let i = 0; i < 3; i++) { const m = spawnEnemy(e.d.split, { x: e.x + rand(-4, 4), y: e.y + rand(-4, 4) }, { instant: true }); m.kx = rand(-80, 80); m.ky = rand(-80, 80); }
  if (e.type === 'tank') impactAt('big', e.x, e.y);
  if (e.boss) bossDefeated(e);
}
// an impact frame aimed at a spot in the world (the speed lines and shockwave converge on it)
function impactAt(kind, x, y) {
  const v = R.views && R.views.find(q => x >= q.camX && x <= q.camX + q.w && y >= q.camY && y <= q.camY + q.h);
  if (v) Impact.trigger(kind, v.x + x - v.camX, v.y + y - v.camY); else Impact.trigger(kind);
}
function bossDefeated(e) {
  sfx.bigBoom(); shakeAt(e.x, e.y, 9);
  impactAt('huge', e.x, e.y);
  for (let i = 0; i < 6; i++) R.fx.push({ k: 'boom', x: e.x + rand(-20, 20), y: e.y + rand(-20, 20), r: rand(14, 26), t: -i * 0.12, dur: 0.35 });
  for (let i = 0; i < 25; i++) dropAt(e.x + rand(-24, 24), e.y + rand(-24, 24), 'xp', 5);
  for (let i = 0; i < 18; i++) dropAt(e.x + rand(-24, 24), e.y + rand(-24, 24), 'coin', 2);
  R.items.push({ k: 'heart', x: e.x + 10, y: e.y, t: 0 });
  for (let i = 0; i < R.np; i++) R.items.push({ k: 'goldegg', x: e.x - 10 + i * 6, y: e.y + 8, t: 0 });
  banner(fmt('{0} DESTROYED!', e.d.name), C.gold, 2.6);
  R.boss = null;
  if (R.mode === 'story') { R.state = 'clear'; R.stateT = 0; Music.play(null); sfx.win(); for (const p of R.players) if (p.down) { p.down = false; p.hp = p.maxHp * 0.5; } }
  else Music.play(worldSong(R.world));
}
function dropAt(x, y, k, v) {
  if (R.drops.length > 400 && k === 'xp') {
    for (const g of R.drops) if (g.k === 'xp' && !g.tgt && d2(g.x, g.y, x, y) < 60 * 60) { g.v += v; return; }
  }
  R.drops.push({ k, x, y, v, tgt: null, sp: 0, bob: rand(0, 6), vx: rand(-30, 30), vy: rand(-40, -10), z: 0, vz: k === 'coin' ? rand(50, 80) : 0 });
}
function explode(x, y, r, dmg, owner, hurtsPlayers) {
  R.fx.push({ k: 'boom', x, y, r, t: 0, dur: 0.3 });
  burst(x, y, ['#ffd23f', '#ff8c1a', '#e8343b', '#fff8e7'], 14, 90, 0.4);
  sfx.boom(); shakeAt(x, y, hurtsPlayers ? 5 : 3);
  forNear(x, y, r + 8, e => {
    if (d2(x, y, e.x, e.y) < (r + e.r) * (r + e.r)) { const a = Math.atan2(e.y - y, e.x - x); hurtEnemy(e, dmg, Math.cos(a), Math.sin(a), 140, owner); }
  });
  if (hurtsPlayers) for (const p of alivePlayers()) if (d2(x, y, p.x, p.y) < (r + p.r) ** 2) hurtPlayer(p, dmg);
}
function hurtPlayer(p, dmg) {
  if (R.godMode) return; // admin power: nothing hurts
  if (p.down || p.iframes > 0 || p.dashT > 0 || R.state === 'clear' || picking(p)) return;
  if (lvl(p, 'shield') && p.shieldT <= 0) { // bubble shield: this hit pops the bubble instead
    p.shieldT = shieldCd(p); p.iframes = 0.5;
    R.fx.push({ k: 'ring', x: p.x, y: p.y - 6, r: p.over.shield ? 60 : 36, t: 0, dur: 0.3, col: '#9fdcff' });
    burst(p.x, p.y - 6, ['#9fdcff', '#ffffff'], 12, 70, 0.4); sfx.pop();
    forNear(p.x, p.y, 44, e => { const a = Math.atan2(e.y - p.y, e.x - p.x); if (d2(p.x, p.y, e.x, e.y) < 40 * 40) hurtEnemy(e, 4 * tScale(), Math.cos(a), Math.sin(a), 240, p); });
    if (p.over.shield) for (const b of R.eshots) if (d2(p.x, p.y, b.x, b.y) < 60 * 60) b.life = 0;
    return;
  }
  dmg *= 1 - 0.08 * lvl(p, 'armor'); // tough feathers
  p.hp -= dmg; p.iframes = 0.6; p.hurtFlash = 0.25; p.squash = 0.2;
  sfx.hurt(); shakeFor(p, 4);
  floatText(p.x, p.y - 16, '-' + Math.round(dmg), C.red, 0.7);
  burst(p.x, p.y - 4, ['#fff8e7', PCOL[p.id]], 6, 50, 0.4);
  if (p.hp <= 0 && lvl(p, 'phoenix') && !p.phoenixUsed) { // second wind: once per run, straight back up
    p.phoenixUsed = true; p.hp = p.maxHp * 0.5; p.iframes = 1.5;
    R.fx.push({ k: 'ring', x: p.x, y: p.y - 6, r: 50, t: 0, dur: 0.5, col: '#ff8c1a' });
    burst(p.x, p.y - 6, ['#ff8c1a', '#ffd23f', '#e8343b'], 26, 100, 0.7); sfx.revive();
    forNear(p.x, p.y, 54, e => { const a = Math.atan2(e.y - p.y, e.x - p.x); hurtEnemy(e, 20 * tScale(), Math.cos(a), Math.sin(a), 300, p); });
    banner('SECOND WIND!', '#ff8c1a', 1.6);
    return;
  }
  if (p.hp <= 0) {
    p.hp = 0; p.down = true; p.reviveT = 0; impactAt('huge', p.x, p.y);
    burst(p.x, p.y, ['#fff8e7', '#ffd23f'], 20, 90, 0.7);
    if (alivePlayers().length) banner(fmt('{0} IS DOWN!', R.online ? keep(p.name) : 'P' + (p.id + 1)), PCOL[p.id], 2, 'STAND NEXT TO THEIR EGG TO REVIVE');
  }
}

// ================================================================ players
function updatePlayer(p, dt) {
  if (p.gone) return; // a friend who left the online game
  p.anim += dt;
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  p.turnT = Math.max(0, p.turnT - dt);
  p.squash = Math.max(0, p.squash - dt);
  p.blinkT -= dt; if (p.blinkT < -0.12) p.blinkT = rand(2, 5);
  p.weapon = p.lo.weapon;
  updateTrail(p, dt);
  if (p.down) {
    const helper = R.players.find(o => o !== p && !o.down && d2(o.x, o.y, p.x, p.y) < 22 * 22);
    if (helper) {
      p.reviveT += dt;
      if (p.reviveT >= 2.5) {
        p.down = false; p.hp = Math.round(p.maxHp * 0.5); p.iframes = 2; p.reviveT = 0; p.squash = 0.3;
        sfx.revive(); sfx.quack(1.2); impactAt('big', p.x, p.y); burst(p.x, p.y, ['#51cf66', '#fff8e7', PCOL[p.id]], 24, 90, 0.7);
        floatText(p.x, p.y - 18, 'REVIVED!', C.green, 1.2);
      }
    } else p.reviveT = Math.max(0, p.reviveT - dt * 0.5);
    p.dashReq = false;
    return;
  }
  // movement input: keys + pads + touch stick
  const busy = picking(p); // picking a card: stand still inside a shield bubble
  const mv = R.state === 'clear' || busy ? { x: 0, y: 0 } : Input.move(p.id, R.np);
  const s = busy ? null : R.sticks[p.id];
  if (s) { const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy); if (dl > 2) { const m = Math.min(1, dl / STICK_R); mv.x += dx / dl * m; mv.y += dy / dl * m; } }
  const ml = Math.hypot(mv.x, mv.y);
  if (ml > 1) { mv.x /= ml; mv.y /= ml; }
  p.moving = ml > 0.1; p.mvx = mv.x; p.mvy = mv.y;
  if (p.moving) p.moved = true;
  dustFor(p, dt); heartbeatFor(p, dt);
  p.iframes = Math.max(0, p.iframes - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  const rg = lvl(p, 'regen');
  if (rg && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + rg * 0.6 * dt);

  // dash
  if (!busy && (p.dashReq || Input.dash(p.id, R.np)) && p.dashCd <= 0 && R.state === 'play') {
    let dx = mv.x, dy = mv.y, l = Math.hypot(dx, dy);
    if (l < 0.1) { dx = p.facing === 'left' ? -1 : p.facing === 'right' ? 1 : 0; dy = p.facing === 'up' ? -1 : p.facing === 'down' ? 1 : 0; l = 1; }
    const sp = pSpeed(p) * 3.6;
    p.dvx = dx / l * sp; p.dvy = dy / l * sp;
    p.dashT = 0.18; p.dashCd = pDashCd(p); p.iframes = Math.max(p.iframes, 0.28);
    p.dashHit.clear();
    if (netRemote(p.id)) Net.inputs[p.id].dashUntil = 0;
    sfx.quack(p.id ? 1.15 : 1);
    floatText(p.x + rand(-4, 4), p.y - 18, 'QUACK!', PCOL[p.id], 0.5);
    burst(p.x, p.y, ['#e9f5db', '#c9e4a6'], 6, 40, 0.35);
  }
  p.dashReq = false;
  let vx, vy;
  if (p.dashT > 0) {
    p.dashT -= dt; vx = p.dvx; vy = p.dvy;
    p.ghosts.push({ x: p.x, y: p.y, t: 0.18, facing: p.facing });
    const dl = lvl(p, 'dash');
    if (dl) forNear(p.x, p.y, 14, e => {
      if (!p.dashHit.has(e) && d2(p.x, p.y, e.x, e.y) < (e.r + p.r + 5) ** 2) {
        p.dashHit.add(e); const a = Math.atan2(e.y - p.y, e.x - p.x);
        hurtEnemy(e, (14 + 12 * dl) * tScale(), Math.cos(a), Math.sin(a), 160, p);
      }
    });
  } else { const sp = pSpeed(p); vx = mv.x * sp; vy = mv.y * sp; }
  const ri = netRemote(p.id) && Net.inputs[p.id];
  if (ri && ri.x !== undefined && !busy) { // a friend's duck: their device moves it (dashes too), we glide it to where they say
    const k = Math.min(1, dt * 20);
    p.x = clamp(p.x + (ri.x - p.x) * k, 8, WORLD_SIZE - 8); p.y = clamp(p.y + (ri.y - p.y) * k, 10, WORLD_SIZE - 6);
  } else {
    p.x = clamp(p.x + vx * dt, 8, WORLD_SIZE - 8);
    p.y = clamp(p.y + vy * dt, 10, WORLD_SIZE - 6);
  }

  // auto-aim: lock on the nearest robot within range
  const range = WEAPONS[p.weapon].range * reachMul(p);
  const tgt = nearestEnemy(p.x, p.y, range);
  p.target = tgt;
  if (tgt) { p.aim = Math.atan2(tgt.y - p.y, tgt.x - p.x); p.ax = Math.cos(p.aim); p.ay = Math.sin(p.aim); }
  else if (p.moving) { p.aim = Math.atan2(mv.y, mv.x); p.ax = Math.cos(p.aim); p.ay = Math.sin(p.aim); }
  // turning: face where you walk, or where you shoot when standing still
  const fx = p.moving ? mv.x : (tgt ? p.ax : 0), fy = p.moving ? mv.y : (tgt ? p.ay : 0);
  if (fx || fy) {
    let nf = p.facing;
    if (Math.abs(fx) > Math.abs(fy) * 1.15) nf = fx < 0 ? 'left' : 'right';
    else if (Math.abs(fy) > Math.abs(fx) * 1.15) nf = fy < 0 ? 'up' : 'down';
    if (nf !== p.facing) { p.facing = nf; p.turnT = 0.14; }
  }
  if (R.state !== 'play') return;
  fireWeapons(p, dt, tgt);
}
function updateTrail(p, dt) {
  for (const g of p.ghosts) g.t -= dt;
  p.ghosts = p.ghosts.filter(g => g.t > 0);
  const trail = p.lo.trail;
  if (!trail || trail === 'none' || p.down) { p.rainbow.length = 0; return; }
  p.trailT -= dt;
  if (trail === 'rainbow') {
    if (p.moving || p.dashT > 0) p.rainbow.push({ x: p.x, y: p.y - 4, t: 0.35 });
    for (const q of p.rainbow) q.t -= dt;
    while (p.rainbow.length && p.rainbow[0].t <= 0) p.rainbow.shift();
    return;
  }
  if (!(p.moving || p.dashT > 0) || p.trailT > 0) return;
  p.trailT = trail === 'ghost' ? 0.07 : 0.05;
  const x = p.x + rand(-3, 3), y = p.y - rand(0, 4);
  const T = R.tparts;
  if (trail === 'sparkle') T.push({ x, y: y - 3, vx: rand(-5, 5), vy: rand(-12, -4), life: 0.6, max: 0.6, col: pick(['#fff8e7', '#ffd23f', '#fff3b0']), tw: true });
  else if (trail === 'bubbles') T.push({ x, y: y - 3, vx: rand(-4, 4), vy: rand(-16, -8), life: 0.8, max: 0.8, bub: rand(1, 2.5) });
  else if (trail === 'hearts') T.push({ x, y: y - 4, vx: rand(-4, 4), vy: -14, life: 0.8, max: 0.8, s: ART.tinyHeart });
  else if (trail === 'notes') T.push({ x, y: y - 6, vx: rand(-6, 6), vy: -16, life: 0.9, max: 0.9, s: ART.note });
  else if (trail === 'leaves') T.push({ x, y: y - 5, vx: rand(-12, 12), vy: rand(4, 10), life: 1, max: 1, s: ART.leaf, sway: rand(0, 6) });
  else if (trail === 'fire') { for (let i = 0; i < 2; i++) T.push({ x: x + rand(-2, 2), y, vx: rand(-6, 6), vy: rand(-26, -14), life: 0.4, max: 0.4, col: pick(['#ff8c1a', '#ffd23f', '#e8343b']), size: 2 }); }
  else if (trail === 'ghost') p.ghosts.push({ x: p.x, y: p.y, t: 0.3, facing: p.facing, soft: true });
  else if (TRAIL_FX[trail]) TRAIL_FX[trail](T, x, y, p);
  if (T.length > 400) T.splice(0, T.length - 400);
}
function fireWeapons(p, dt, tgt) {
  // --- main weapon
  const wd = WEAPONS[p.weapon];
  p.tm.main -= dt;
  if (p.tm.main <= 0) {
    if (tgt) { fireMain(p, tgt, wd); p.tm.main = wd.cd * Math.pow(0.84, lvl(p, 'rapid')); }
    else p.tm.main = 0.05;
  }
  // --- egg orbit: eggs hurt and push robots away, and block bullets
  const eg = lvl(p, 'egg');
  if (eg) {
    p.eggAng += dt * eggSpeed(p);
    const big = !!p.over.egg, hitR = big ? 8 : 3, dmg = (6 + 4 * eg) * tScale() * (big ? 2.2 : 1);
    for (const [ex, ey] of eggSpots(p)) {
      forNear(ex, ey, 14, e => {
        if (e.eggCd <= 0 && d2(ex, ey, e.x, e.y) < (e.r + hitR) ** 2) { e.eggCd = 0.35; const k = Math.atan2(e.y - p.y, e.x - p.x); hurtEnemy(e, dmg, Math.cos(k), Math.sin(k), big ? 260 : 170, p); }
      });
      for (const b of R.eshots) if (!(b.wait > 0) && b.life > 0 && d2(ex, ey, b.x, b.y) < (hitR + 3) ** 2) { b.life = 0; burst(b.x, b.y, ['#fff8e7', '#ffd23f'], 3, 40, 0.2); }
    }
  }
  // --- bread bombs
  const br = lvl(p, 'bread');
  if (br) {
    p.tm.bread -= dt;
    if (p.tm.bread <= 0) {
      p.tm.bread = (2.8 - 0.25 * br) * (p.over.bread ? 0.7 : 1);
      for (let i = 0; i < 1 + Math.floor(br / 2); i++) {
        const near = R.enemies.filter(e => !e.dead && e.spawnT <= 0 && d2(e.x, e.y, p.x, p.y) < 130 * 130);
        const t = near.length ? pick(near) : null;
        R.bombs.push({ x0: p.x, y0: p.y, x1: t ? t.x : p.x + rand(-60, 60), y1: t ? t.y : p.y + rand(-50, 50), t: 0, dur: 0.65 + i * 0.08, r: 20 + 4 * br, dmg: (18 + 10 * br) * tScale(), owner: p });
      }
    }
  }
  // --- zap
  const zp = lvl(p, 'zap');
  if (zp) {
    p.tm.zap -= dt;
    if (p.tm.zap <= 0) {
      const oz = !!p.over.zap;
      let cur = nearestEnemy(p.x, p.y, oz ? 160 : 120);
      if (cur) {
        p.tm.zap = (2.2 - 0.25 * zp) * (oz ? 0.5 : 1);
        const pts = [[p.x, p.y - 6]], hit = new Set(), dmg = (12 + 7 * zp) * tScale() * (oz ? 1.5 : 1);
        for (let i = 0; i < 2 + zp + (oz ? 6 : 0) && cur; i++) { hit.add(cur); pts.push([cur.x, cur.y]); hurtEnemy(cur, dmg, 0, 0, 0, p); cur = nearestEnemy(cur.x, cur.y, oz ? 110 : 70, hit); }
        R.fx.push({ k: 'zap', pts, t: 0, dur: 0.18 });
        sfx.zap();
      } else p.tm.zap = 0.2;
    }
  }
  // --- mega quack
  const qk = lvl(p, 'quack');
  if (qk) {
    p.tm.quack -= dt;
    const oq = !!p.over.quack, rad = (34 + 8 * qk) * (oq ? 1.8 : 1);
    if (p.tm.quack <= 0) {
      if (nearestEnemy(p.x, p.y, rad)) {
        p.tm.quack = (4.6 - 0.5 * qk) * (oq ? 0.5 : 1);
        if (oq) Impact.trigger('small');
        R.fx.push({ k: 'ring', x: p.x, y: p.y - 3, r: rad, t: 0, dur: 0.3, col: PCOL[p.id] });
        floatText(p.x, p.y - 20, 'QUAAACK!', PCOL[p.id], 0.7);
        sfx.quack(0.8); p.squash = 0.2;
        forNear(p.x, p.y, rad + 8, e => {
          if (d2(p.x, p.y, e.x, e.y) < (rad + e.r) ** 2) { const a = Math.atan2(e.y - p.y, e.x - p.x); hurtEnemy(e, (6 + 5 * qk) * tScale() * (oq ? 2 : 1), Math.cos(a), Math.sin(a), oq ? 420 : 260, p); }
        });
      } else p.tm.quack = 0.2;
    }
  }
  // --- feather darts: homing feathers at the nearest robots
  const fe = lvl(p, 'feather');
  if (fe) {
    p.tm.feather -= dt;
    if (p.tm.feather <= 0) {
      const of = !!p.over.feather, near = R.enemies.filter(e => !e.dead && e.spawnT <= 0 && d2(e.x, e.y, p.x, p.y) < 150 * 150);
      if (near.length) {
        p.tm.feather = (1.6 - 0.12 * fe) * (of ? 0.6 : 1);
        const n = (1 + fe) * (of ? 2 : 1);
        for (let i = 0; i < n; i++) {
          const a = rand(0, TAU), tgt = pick(near);
          R.shots.push({ kind: 'feather', x: p.x, y: p.y - 6, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 1.4, max: 1.4, dmg: (7 + 4 * fe) * tScale() * (of ? 1.5 : 1),
            pierce: of ? 2 : 0, hit: new Set(), owner: p, r: 2, col: '#fff8e7', kb: 40, rot: 0, tgt });
        }
        sfx.pop();
      } else p.tm.feather = 0.25;
    }
  }
  // --- duck turret: a little turret floats next to you and shoots the closest robot
  const tu = lvl(p, 'turret');
  if (tu) {
    p.tm.turret = (p.tm.turret || 0) - dt;
    if (p.tm.turret <= 0) {
      p.tm.turret = (0.95 - 0.1 * tu) * (p.over.turret ? 0.6 : 1);
      for (const [tx, ty] of turretSpots(p)) {
        const t = nearestEnemy(tx, ty, 140); if (!t) continue;
        const a = Math.atan2(t.y - ty, t.x - tx);
        R.shots.push({ kind: 'bullet', x: tx, y: ty, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, life: 0.7, max: 0.7, dmg: (6 + 3 * tu) * tScale(), pierce: 0, hit: new Set(), owner: p, r: 1, col: '#5ec8ff', kb: 30, rot: 0 });
        R.fx.push({ k: 'muzzle', x: tx + Math.cos(a) * 3, y: ty + Math.sin(a) * 3, t: 0, dur: 0.06, col: '#5ec8ff' });
      }
    }
  }
  // --- sun beam: a beam from the sky hits a robot (three with the solar flare)
  const sb = lvl(p, 'sunbeam');
  if (sb) {
    p.tm.sunbeam = (p.tm.sunbeam || 0) - dt;
    if (p.tm.sunbeam <= 0) {
      const near = R.enemies.filter(e => !e.dead && e.spawnT <= 0 && e.bs !== 'burrow' && d2(e.x, e.y, p.x, p.y) < 150 * 150);
      if (near.length) {
        const of = !!p.over.sunbeam;
        p.tm.sunbeam = 3.2 - 0.3 * sb;
        for (let i = 0; i < (of ? 3 : 1); i++) {
          const t = pick(near), r = of ? 26 : 14;
          R.fx.push({ k: 'sunbeam', x: t.x, y: t.y, r, t: 0, dur: 0.35 });
          forNear(t.x, t.y, r + 8, e => { if (d2(t.x, t.y, e.x, e.y) < (r + e.r) ** 2) hurtEnemy(e, (20 + 12 * sb) * tScale() * (of ? 1.5 : 1), 0, 0, 0, p); });
          burst(t.x, t.y, ['#ffd23f', '#fff3b0', '#ffffff'], 10, 70, 0.4);
        }
        sfx.zap();
      } else p.tm.sunbeam = 0.3;
    }
  }
  // --- frost nova: freezes and hurts robots around you
  const nv = lvl(p, 'nova');
  if (nv) {
    p.tm.nova = (p.tm.nova || 0) - dt;
    const bz = !!p.over.nova, rad = (40 + 6 * nv) * (bz ? 1.8 : 1);
    if (p.tm.nova <= 0) {
      if (nearestEnemy(p.x, p.y, rad)) {
        p.tm.nova = (4.5 - 0.4 * nv) * (bz ? 0.5 : 1);
        R.fx.push({ k: 'ring', x: p.x, y: p.y - 4, r: rad, t: 0, dur: 0.35, col: '#9fdcff' });
        burst(p.x, p.y - 4, ['#9fdcff', '#ffffff'], 16, rad * 1.5, 0.4);
        forNear(p.x, p.y, rad + 8, e => { if (d2(p.x, p.y, e.x, e.y) < (rad + e.r) ** 2) { hurtEnemy(e, (5 + 3 * nv) * tScale(), 0, 0, 0, p); e.slowT = (1.5 + 0.2 * nv) * (bz ? 1.6 : 1); } });
        sfx.pop();
      } else p.tm.nova = 0.25;
    }
  }
  // --- splash puddle: drop a puddle that hurts robots standing in it
  const pu = lvl(p, 'puddle');
  if (pu) {
    p.tm.puddle -= dt;
    if (p.tm.puddle <= 0 && nearestEnemy(p.x, p.y, 110)) {
      const lava = !!p.over.puddle;
      p.tm.puddle = (3.4 - 0.3 * pu) * (lava ? 0.6 : 1);
      R.puddles.push({ x: p.x, y: p.y + 2, r: (16 + 3 * pu) * (lava ? 1.8 : 1), t: 0, dur: 3 + 0.3 * pu, tick: 0, dmg: (5 + 3 * pu) * tScale() * (lava ? 2 : 1), owner: p, lava });
      sfx.pop();
    }
  }
  // --- bubble shield: recharges (the block itself happens in hurtPlayer)
  if (lvl(p, 'shield')) p.shieldT = Math.max(0, p.shieldT - dt);
}
// egg geometry, shared by the game and the drawing
const eggSpeed = p => (2.6 + lvl(p, 'egg') * 0.25) * (p.over && p.over.egg ? 2.6 : 1);
function eggSpots(p) {
  const eg = lvl(p, 'egg'), out = [];
  if (!eg) return out;
  const n = eg + 1, rad = p.over && p.over.egg ? 31 + eg * 1.5 : 22 + eg;
  for (let i = 0; i < n; i++) { const a = p.eggAng + i * TAU / n; out.push([p.x + Math.cos(a) * rad, p.y - 3 + Math.sin(a) * rad]); }
  return out;
}
const shieldCd = p => (p.over && p.over.shield ? 3 : 9 - 1.2 * lvl(p, 'shield'));
function updatePuddles(dt) {
  for (const q of R.puddles) {
    q.t += dt; q.tick -= dt;
    if (q.tick <= 0) {
      q.tick = 0.35;
      forNear(q.x, q.y, q.r + 8, e => { if (d2(q.x, q.y, e.x, e.y) < (q.r * 0.9 + e.r) ** 2) hurtEnemy(e, q.dmg, 0, 0, 0, q.owner); });
    }
  }
  R.puddles = R.puddles.filter(q => q.t < q.dur);
}
function drawPuddle(q) {
  const k = q.t / q.dur, a = Math.min(1, q.t * 6) * Math.min(1, (1 - k) * 4), r = q.r * (0.85 + Math.min(1, q.t * 5) * 0.15);
  ctx.globalAlpha = a * 0.55; pellipse(q.x, q.y, r, r * 0.55, q.lava ? '#ff6b1a' : '#3fa7ff');
  ctx.globalAlpha = a * 0.7; pellipse(q.x - r * 0.15, q.y - r * 0.1, r * 0.55, r * 0.22, q.lava ? '#ffd23f' : '#9fdcff');
  ctx.globalAlpha = a; const rr = (q.t * 22) % r; pring(q.x, q.y, rr, q.lava ? '#ffd23f' : '#c9ecff', 1, rr * 0.55);
  ctx.globalAlpha = 1;
}
function fireMain(p, tgt, wd) {
  const pw = lvl(p, 'power'), multi = lvl(p, 'spread');
  const dmg = wd.dmg * (1 + 0.35 * pw) * (1 + 0.12 * lvl(p, 'bigshot')) * tScale();
  const base = Math.atan2(tgt.y - p.y, tgt.x - p.x);
  const n = wd.n + multi * (p.weapon === 'shotgun' ? 2 : 1);
  const mx = p.x + Math.cos(base) * 7, my = p.y - 5 + Math.sin(base) * 7;
  const col = wd.col || PCOL[p.id];
  sfx.shoot(p.weapon, p.id);
  p.recoil = 0.08;
  R.fx.push({ k: 'muzzle', x: mx, y: my, t: 0, dur: 0.07, col });
  if (p.weapon === 'laser' || p.weapon === 'prism') {
    const rainbow = p.weapon === 'prism';
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * wd.spread, cx = Math.cos(a), cy = Math.sin(a);
      const len = wd.range * reachMul(p);
      for (const e of R.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        const ex = e.x - mx, ey = e.y - my, proj = ex * cx + ey * cy;
        if (proj < 0 || proj > len) continue;
        const perp = Math.abs(ex * cy - ey * cx);
        if (perp < e.r + 2) hurtEnemy(e, dmg, cx, cy, wd.kb, p);
      }
      R.fx.push({ k: 'beam', x0: mx, y0: my, x1: mx + cx * len, y1: my + cy * len, t: 0, dur: 0.14, col: rainbow ? RAINBOW[(i * 2 + Math.floor(R.t * 6)) % 6] : col });
    }
    return;
  }
  if (wd.melee) { // sword and scythe: slash in an arc; multi shot makes it wider and longer
    const arc = wd.arc + multi * 0.35, reach = wd.reach + multi * 4;
    for (const e of R.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d > reach + e.r) continue;
      let da = Math.atan2(dy, dx) - base; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > arc / 2 && d > e.r + 6) continue;
      hurtEnemy(e, dmg, dx / (d || 1), dy / (d || 1), wd.kb, p);
      if (wd.heal) p.hp = Math.min(p.maxHp, p.hp + wd.heal);
    }
    p.swing = (p.swing || 1) * -1;
    R.fx.push({ k: 'slash', x: p.x, y: p.y - 5, a: base, arc, r: reach, t: 0, dur: 0.16, col, dir: p.swing });
    return;
  }
  if (p.weapon === 'banhammer') { // SMASH
    const x = tgt.x, y = tgt.y;
    R.fx.push({ k: 'hammer', x, y, t: 0, dur: 0.22 });
    R.fx.push({ k: 'ring', x, y, r: wd.aoe, t: 0, dur: 0.3, col });
    forNear(x, y, wd.aoe + 10, e => { const dd = Math.hypot(e.x - x, e.y - y); if (dd < wd.aoe + e.r) hurtEnemy(e, dmg, (e.x - x) / (dd || 1), (e.y - y) / (dd || 1), wd.kb, p); });
    burst(x, y, ['#ff5ce1', '#ffd23f', '#ffffff'], 18, 110, 0.5);
    floatText(x, y - 22, 'BANNED!', '#ff5ce1', 0.8);
    shakeFor(p, 4); impactAt('small', x, y);
    return;
  }
  if (p.weapon === 'mine') { // drop mines around you, a step towards the target
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * wd.spread, x = p.x + Math.cos(a) * 12, y = p.y + 2 + Math.sin(a) * 12;
      R.shots.push({ kind: 'mine', x, y, vx: 0, vy: 0, life: wd.life, max: wd.life, dmg, pierce: 0, hit: new Set(), owner: p, r: wd.r, col: wd.col, kb: 0, aoe: wd.aoe, rot: 0 });
    }
    return;
  }
  if (p.weapon === 'sniper') { // one big instant shot through everything in the line
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * wd.spread, cx = Math.cos(a), cy = Math.sin(a), len = wd.range * reachMul(p);
      let hits = 0;
      for (const e of R.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        const ex = e.x - mx, ey = e.y - my, proj = ex * cx + ey * cy;
        if (proj < 0 || proj > len || Math.abs(ex * cy - ey * cx) > e.r + 2) continue;
        hurtEnemy(e, dmg, cx, cy, wd.kb, p); hits++;
        burst(e.x, e.y, ['#fff3b0', '#ffffff'], 4, 70, 0.25);
      }
      R.fx.push({ k: 'beam', x0: mx, y0: my, x1: mx + cx * len, y1: my + cy * len, t: 0, dur: 0.12, col });
      if (hits >= 3) impactAt('small', tgt.x, tgt.y);
    }
    shakeFor(p, 2);
    return;
  }
  if (p.weapon === 'meteor') { // meteors fall out of the sky onto the target
    for (let i = 0; i < n; i++) {
      const x = tgt.x + (i ? rand(-30, 30) : 0), y = tgt.y + (i ? rand(-24, 24) : 0);
      R.bombs.push({ x0: x + 50, y0: y - 150, x1: x, y1: y, t: 0, dur: 0.55 + i * 0.12, r: wd.aoe, dmg, owner: p, meteor: true });
      R.marks.push({ x, y, r: wd.aoe, t: 0, dur: 0.55 + i * 0.12, dmg: 0, friendly: true });
    }
    return;
  }
  if (p.weapon === 'eggnade') { // lob eggs that burst where they land
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 16;
      R.bombs.push({ x0: mx, y0: my, x1: tgt.x + off * -Math.sin(base) + rand(-6, 6), y1: tgt.y + off * Math.cos(base) + rand(-6, 6), t: 0, dur: 0.5 + i * 0.05, r: wd.aoe, dmg, owner: p, egg: true });
    }
    return;
  }
  if (p.weapon === 'tesla') { // lightning: hits the target, then jumps on (multi shot and piercing add jumps)
    let cur = tgt, d = dmg;
    const pts = [[mx, my]], hit = new Set();
    for (let i = 0; i <= wd.chain + multi + lvl(p, 'pierce') && cur; i++) {
      hit.add(cur); pts.push([cur.x, cur.y - 2]);
      const k = Math.atan2(cur.y - p.y, cur.x - p.x);
      hurtEnemy(cur, d, Math.cos(k), Math.sin(k), wd.kb, p);
      burst(cur.x, cur.y, ['#7dfff5', '#ffffff'], 2, 40, 0.2);
      d *= 0.85; cur = nearestEnemy(cur.x, cur.y, 62, hit);
    }
    R.fx.push({ k: 'zap', pts, t: 0, dur: 0.14, col: '#7dfff5' });
    return;
  }
  const kind = SHOT_KIND[p.weapon] || 'bullet', sx = SHOT_EXTRA[kind];
  for (let i = 0; i < n; i++) {
    let a = base + (i - (n - 1) / 2) * wd.spread;
    if (wd.jitter) a += rand(-wd.jitter, wd.jitter);
    if (p.weapon === 'shotgun') a += rand(-0.05, 0.05);
    const sp = wd.speed * (p.weapon === 'shotgun' || p.weapon === 'flame' ? rand(0.85, 1.1) : 1);
    const shot = { kind, x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: wd.life, max: wd.life, dmg, pierce: lvl(p, 'pierce') + (p.weapon === 'rang' || p.weapon === 'flame' ? 99 : p.weapon === 'goldgun' ? 2 : 0), hit: new Set(), owner: p, r: wd.r + (pw >= 3 && p.weapon === 'blaster' ? 1 : 0), col, kb: wd.kb, aoe: wd.aoe, rot: 0 };
    if (kind === 'rang') { shot.ang = a; shot.sp = sp; shot.back = false; }
    if (kind === 'rocket') { shot.tgt = tgt; shot.pierce = 0; }
    if (kind === 'saw') shot.pierce = wd.bounces + lvl(p, 'pierce');
    shot.r += lvl(p, 'bigshot'); shot.life *= reachMul(p); shot.max = shot.life; // big bullets, eagle eye
    if (kind === 'candy' || kind === 'star') shot.pierce += 1;
    if (kind === 'harpoon') shot.pierce += 3;
    if (kind === 'bee') shot.tgt = tgt;
    if (kind === 'vortex') { shot.pierce = 999; shot.tick = 0; }
    if (sx) { shot.pierce += sx.pierce || 0; if (sx.home) shot.tgt = tgt; }
    R.shots.push(shot);
  }
  if (p.weapon === 'shotgun') burst(mx, my, ['#ffd23f', '#fff8e7'], 4, 50, 0.15);
  else if (p.weapon === 'rocket') burst(mx, my, ['#ffd23f', '#fff8e7', '#ff6fae'], 5, 50, 0.2);
}
// which kind of shot each weapon fires (plain 'bullet' if it isn't here)
const SHOT_KIND = { shuriken: 'star', bees: 'bee', harpoon: 'harpoon', candycorn: 'candy', bubble: 'bubble', rang: 'rang', corn: 'corn', frost: 'frost', rocket: 'rocket', flame: 'flame', goldgun: 'goldgun', sawblade: 'saw', vortex: 'vortex' };
// shot kinds other files can add (event weapons): SHOT_KIND[weapon] = kind, then SHOT_EXTRA[kind] =
//   { art: PROJ_ART key, spin: spin speed (or point where it flies), home: homes in, pierce: extra robots, slow: seconds of slow,
//     boom: explodes on the first robot (with the weapon's aoe), cols: explosion colours }
const SHOT_EXTRA = {};
function rocketSmoke(b) { if (Math.random() < 0.6) R.parts.push({ x: b.x - b.vx * 0.02, y: b.y - b.vy * 0.02, vx: rand(-8, 8), vy: rand(-12, -2), life: 0.35, max: 0.35, col: pick(['#d5dbe6', '#fff8e7', '#ffd23f']), size: 1, grav: 0 }); }
// shots that do something special when they hit or run out
function shotEnd(b, hitE) {
  if (b.ended) return; b.ended = true;
  if (b.kind === 'bubble') popBubble(b);
  else if (b.kind === 'corn') { // pop into popcorn that flies everywhere
    const n = WEAPONS.corn.pop, a0 = rand(0, TAU);
    R.fx.push({ k: 'ring', x: b.x, y: b.y, r: 10, t: 0, dur: 0.15, col: '#fff8e7' });
    burst(b.x, b.y, ['#fff8e7', '#ffd23f'], 5, 60, 0.25);
    for (let i = 0; i < n; i++) {
      const a = a0 + i / n * TAU, sp = rand(150, 190);
      const s = { kind: 'popcorn', x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.28, max: 0.28, dmg: b.dmg * 0.45, pierce: 0, hit: new Set(), owner: b.owner, r: 1, col: '#fff8e7', kb: 30, rot: rand(0, TAU) };
      if (hitE) s.hit.add(hitE.id);
      R.shots.push(s);
    }
    sfx.pop();
  } else if (b.kind === 'mine') {
    explode(b.x, b.y, b.aoe, b.dmg, b.owner);
  } else if (b.kind === 'vortex') { // the black hole pops
    R.fx.push({ k: 'ring', x: b.x, y: b.y, r: 34, t: 0, dur: 0.3, col: '#9d5cff' });
    burst(b.x, b.y, ['#9d5cff', '#c9a6ff', '#0c0a1a'], 18, 110, 0.5);
    forNear(b.x, b.y, 42, e => { if (d2(b.x, b.y, e.x, e.y) < (30 + e.r) ** 2) { const a = Math.atan2(e.y - b.y, e.x - b.x); hurtEnemy(e, b.dmg, Math.cos(a), Math.sin(a), 160, b.owner); } });
    shakeAt(b.x, b.y, 3); sfx.boom();
  } else if (SHOT_EXTRA[b.kind] && SHOT_EXTRA[b.kind].boom) {
    explode(b.x, b.y, b.aoe || 20, b.dmg, b.owner);
    burst(b.x, b.y, SHOT_EXTRA[b.kind].cols || ['#ffd23f', '#fff8e7'], 14, 120, 0.5, 1, 40);
  } else if (b.kind === 'rocket') { // firework!
    explode(b.x, b.y, b.aoe, b.dmg, b.owner);
    burst(b.x, b.y, pick([['#ff6fae', '#ffd23f'], ['#5ec8ff', '#fff8e7'], ['#51cf66', '#ffd23f'], ['#c06bff', '#ff6fae']]), 16, 140, 0.55, 1, 40);
  }
}
function updateShots(dt) {
  for (const b of R.shots) {
    b.life -= dt; b.rot += dt * 18;
    if (b.kind === 'bee') { b.vx += rand(-200, 200) * dt; b.vy += rand(-200, 200) * dt; } // bees wobble about
    if (b.kind === 'feather' || (b.kind === 'bee' && b.max - b.life > 0.3) || (SHOT_EXTRA[b.kind] && SHOT_EXTRA[b.kind].home && b.max - b.life > 0.12)) { // home in on the target (or the nearest robot once it's gone)
      if (!b.tgt || b.tgt.dead) b.tgt = nearestEnemy(b.x, b.y, 120);
      if (b.tgt) { const dx = b.tgt.x - b.x, dy = b.tgt.y - b.y, dl = Math.hypot(dx, dy) || 1, sp = 170; b.vx += (dx / dl * sp - b.vx) * Math.min(1, dt * 7); b.vy += (dy / dl * sp - b.vy) * Math.min(1, dt * 7); }
    }
    if (b.kind === 'rang') {
      // flies out, slows, then homes back to its owner
      const tLeft = b.life / b.max;
      if (!b.back && tLeft < 0.55) { b.back = true; b.hit.clear(); }
      if (b.back) {
        const o = b.owner, dx = o.x - b.x, dy = o.y - 5 - b.y, dl = Math.hypot(dx, dy) || 1;
        b.vx = dx / dl * b.sp * 1.1; b.vy = dy / dl * b.sp * 1.1;
        if (dl < 8) b.life = 0;
        if (b.life <= 0 && dl >= 8) b.life = 0.01;
      } else { const k = Math.max(0.15, (tLeft - 0.55) / 0.45); b.vx = Math.cos(b.ang) * b.sp * k; b.vy = Math.sin(b.ang) * b.sp * k; }
    }
    if (b.kind === 'rocket') { // speeds up and steers towards its target, leaving smoke
      if (!b.tgt || b.tgt.dead) b.tgt = nearestEnemy(b.x, b.y, 120);
      const sp = Math.min(300, Math.hypot(b.vx, b.vy) + 420 * dt);
      let a = Math.atan2(b.vy, b.vx);
      if (b.tgt) { let da = Math.atan2(b.tgt.y - b.y, b.tgt.x - b.x) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); a += clamp(da, -dt * 4, dt * 4); }
      b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
      rocketSmoke(b);
    } else if (b.kind === 'flame') { const k = Math.pow(0.08, dt); b.vx *= k; b.vy *= k; b.r = 2 + (1 - b.life / b.max) * 4; }
    else if (b.kind === 'vortex') { // slows down, drags robots in and grinds them
      const k = Math.pow(0.35, dt); b.vx *= k; b.vy *= k;
      const pull = WEAPONS.vortex.pull;
      b.tick -= dt;
      const grind = b.tick <= 0; if (grind) b.tick = 0.2;
      forNear(b.x, b.y, pull + 8, e => {
        if (e.bs === 'burrow') return;
        const dx = b.x - e.x, dy = b.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (d > pull + e.r) return;
        const f = Math.min(1, dt * (e.boss ? 0.6 : 3.2)); e.x += dx * f; e.y += dy * f;
        if (grind && d < 14 + e.r) hurtEnemy(e, b.dmg * 0.22, 0, 0, 0, b.owner);
      });
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.life <= 0) shotEnd(b);
      continue;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.life <= 0) { shotEnd(b); continue; }
    forNear(b.x, b.y, 18, e => {
      if (b.hit.has(e.id) || e.bs === 'burrow') return;
      if (b.kind === 'mine' && b.max - b.life < 0.4) return; // not armed yet
      const rr = e.r + b.r + 1;
      if (d2(b.x, b.y, e.x, e.y) < rr * rr) {
        if (b.kind === 'bubble' || b.kind === 'rocket' || b.kind === 'mine' || (SHOT_EXTRA[b.kind] && SHOT_EXTRA[b.kind].boom)) { b.life = 0; shotEnd(b, e); return true; }
        b.hit.add(e.id);
        const l = Math.hypot(b.vx, b.vy) || 1;
        hurtEnemy(e, b.dmg, b.vx / l, b.vy / l, b.kb, b.owner);
        if (b.kind === 'frost') { e.slowT = WEAPONS.frost.slow; burst(b.x, b.y, ['#9fdcff', '#ffffff'], 4, 50, 0.3); }
        else if (SHOT_EXTRA[b.kind] && SHOT_EXTRA[b.kind].slow) { e.slowT = SHOT_EXTRA[b.kind].slow; burst(b.x, b.y, ['#ffffff', '#bde6ff'], 4, 50, 0.3); }
        else if (b.kind === 'flame') { if (Math.random() < 0.3) burst(b.x, b.y, ['#ff8c1a', '#ffd23f'], 1, 30, 0.2); }
        else burst(b.x, b.y, [b.col, '#fff8e7'], 2, 40, 0.2);
        if (b.pierce-- <= 0) { b.life = 0; shotEnd(b, e); return true; }
        if (b.kind === 'saw') { // bounce on to the closest robot it hasn't cut yet
          let nx = null, nd = 90 * 90;
          for (const o of R.enemies) if (!o.dead && o.spawnT <= 0 && o.bs !== 'burrow' && !b.hit.has(o.id)) { const dd = d2(b.x, b.y, o.x, o.y); if (dd < nd) { nd = dd; nx = o; } }
          if (nx) { const sp = Math.hypot(b.vx, b.vy) || 210, a = Math.atan2(nx.y - b.y, nx.x - b.x); b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.life = Math.max(b.life, 0.5); sfx.clank(); }
          return true;
        }
      }
    });
  }
  R.shots = R.shots.filter(b => b.life > 0);
  for (const b of R.eshots) {
    if (b.wait > 0) { b.wait -= dt; if (b.src) { b.x = b.src.x; b.y = b.src.y - 6; } if (b.src && b.src.dead) b.life = 0; continue; }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const p of alivePlayers()) if (d2(b.x, b.y, p.x, p.y - 4) < (p.r + 2) ** 2 && p.iframes <= 0 && p.dashT <= 0) { hurtPlayer(p, b.dmg); b.life = 0; }
  }
  R.eshots = R.eshots.filter(b => b.life > 0);
  for (const m of R.marks) {
    m.t += dt;
    if (m.t >= m.dur && !m.done) { m.done = true; if (!m.friendly) explode(m.x, m.y, m.r, m.dmg, null, true); } // friendly marks only show where a meteor lands
  }
  R.marks = R.marks.filter(m => !m.done);
}
function popBubble(b) {
  if (b.popped) return; b.popped = true;
  R.fx.push({ k: 'ring', x: b.x, y: b.y, r: b.aoe, t: 0, dur: 0.2, col: '#bde6ff' });
  burst(b.x, b.y, ['#bde6ff', '#ffffff'], 8, 60, 0.3);
  sfx.pop();
  forNear(b.x, b.y, b.aoe + 8, e => { if (d2(b.x, b.y, e.x, e.y) < (b.aoe + e.r) ** 2) { const a = Math.atan2(e.y - b.y, e.x - b.x); hurtEnemy(e, b.dmg, Math.cos(a), Math.sin(a), b.kb, b.owner); } });
}
function updateBombs(dt) {
  const extra = [];
  for (const b of R.bombs) {
    b.t += dt;
    if (b.t >= b.dur && !b.done) {
      b.done = true; explode(b.x1, b.y1, b.r, b.dmg, b.owner, false);
      if (b.egg) burst(b.x1, b.y1, ['#fff8e7', '#ffd23f'], 8, 70, 0.4);
      if (b.meteor) { burst(b.x1, b.y1, ['#ff8c1a', '#ffd23f', '#e8343b'], 14, 100, 0.5); shakeAt(b.x1, b.y1, 3); }
      if (!b.mini && !b.egg && !b.meteor && b.owner && b.owner.over && b.owner.over.bread) // overcharged: the bomb bursts into four more
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + rand(-0.3, 0.3); extra.push({ x0: b.x1, y0: b.y1, x1: b.x1 + Math.cos(a) * 34, y1: b.y1 + Math.sin(a) * 34, t: 0, dur: 0.35 + i * 0.05, r: b.r * 0.7, dmg: b.dmg * 0.6, owner: b.owner, mini: true }); }
    }
  }
  R.bombs.push(...extra);
  R.bombs = R.bombs.filter(b => !b.done);
}
function gainXp(p, v) {
  p.xp += v * (1 + 0.15 * lvl(p, 'wisdom')) * (1 + 0.05 * trainLv(p, 'xp')) * (eventOn('doublexp') ? 2 : 1);
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext; p.level++; p.xpNext = xpFor(p.level); p.pending++;
    sfx.level(); floatText(p.x, p.y - 20, 'LEVEL UP!', C.gold, 1.2);
    R.fx.push({ k: 'ring', x: p.x, y: p.y - 4, r: 28, t: 0, dur: 0.4, col: C.gold });
    burst(p.x, p.y - 4, ['#ffd23f', '#fff8e7', PCOL[p.id]], 18, 80, 0.6);
  }
}
function updateDrops(dt) {
  const alive = alivePlayers();
  for (const g of R.drops) {
    g.bob += dt;
    if (g.vz || g.z > 0) { g.z += g.vz * dt; g.vz -= 300 * dt; g.x += g.vx * dt; g.y += g.vy * dt * 0.3; if (g.z <= 0) { g.z = 0; g.vz = Math.abs(g.vz) > 30 ? -g.vz * 0.4 : 0; g.vx *= 0.5; } }
    if (g.tgt && g.tgt.down) g.tgt = null;
    if (!g.tgt) for (const p of alive) { const m = pMagnet(p); if (d2(g.x, g.y, p.x, p.y) < m * m) { g.tgt = p; g.sp = -40; break; } }
    if (g.tgt) {
      const p = g.tgt; g.sp += 500 * dt;
      const dx = p.x - g.x, dy = p.y - 4 - g.y, d = Math.hypot(dx, dy) || 1;
      const st = Math.min(d, Math.max(g.sp, -40) * dt);
      g.x += dx / d * st; g.y += dy / d * st;
      if (d < 6) {
        g.done = true;
        if (g.k === 'coin') { R.coins += g.v; sfx.coin(); floatText(p.x + 6, p.y - 14, '+' + g.v, C.gold, 0.5); burst(p.x, p.y - 6, ['#ffd23f', '#fff3b0'], 4, 40, 0.3); }
        else { gainXp(p, g.v); R.gemCombo++; R.gemComboT = 0.4; sfx.gem(R.gemCombo); }
      }
    }
  }
  R.drops = R.drops.filter(g => !g.done);
  for (const k of R.items) {
    k.t += dt;
    for (const p of alive) {
      if (d2(k.x, k.y, p.x, p.y) < 11 * 11) {
        k.done = true; sfx.pickup();
        if (k.k === 'heart') { p.hp = Math.min(p.maxHp, p.hp + 30); floatText(p.x, p.y - 18, '+30 HP', C.green, 1); }
        else if (k.k === 'magnet') { for (const g of R.drops) { g.tgt = p; g.sp = 120; } floatText(p.x, p.y - 18, 'MAGNET!', C.blue, 1); }
        else if (k.k === 'sauce') {
          floatText(p.x, p.y - 18, 'HOT SAUCE!!', C.red, 1.2);
          R.fx.push({ k: 'flash', t: 0, dur: 0.35, pid: p.id }); shakeFor(p, 6); sfx.bigBoom();
          for (const e of R.enemies) if (!e.dead && e.spawnT <= 0 && d2(e.x, e.y, p.x, p.y) < 170 * 170) hurtEnemy(e, e.boss ? 150 : 9999, 0, 0, 0, p);
        } else if (k.k === 'goldegg') { gainXp(p, p.xpNext - p.xp); floatText(p.x, p.y - 26, 'GOLDEN EGG!', C.gold, 1.4); }
        break;
      }
    }
  }
  R.items = R.items.filter(k => !k.done && k.t < 40);
}
function updateParticles(dt) {
  for (const q of R.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.grav || 0) * dt; q.vx *= 0.96; q.life -= dt; if (q.vr) q.rot += q.vr * dt; }
  R.parts = R.parts.filter(q => q.life > 0);
  for (const q of R.tparts) { q.x += q.vx * dt + (q.sway !== undefined ? Math.sin(q.life * 6 + q.sway) * 0.3 : 0); q.y += q.vy * dt; if (q.grav) q.vy += q.grav * dt; q.life -= dt; }
  R.tparts = R.tparts.filter(q => q.life > 0);
  for (const t of R.texts) { t.y += t.vy * dt; t.vy *= 0.94; t.life -= dt; }
  R.texts = R.texts.filter(t => t.life > 0);
}

// ================================================================ robots
function updateEnemies(dt) {
  const alive = alivePlayers();
  for (const e of R.enemies) {
    if (e.dead) continue;
    e.anim += dt; e.flash = Math.max(0, e.flash - dt); e.eggCd -= dt;
    if (e.spawnT > 0) { e.spawnT -= dt; if (e.spawnT <= 0) burst(e.x, e.y, ['#5ec8ff', '#fff8e7'], 5, 40, 0.3); continue; }
    let tgt = null, bd = Infinity;
    for (const p of alive) { const dd = d2(e.x, e.y, p.x, p.y); if (dd < bd) { bd = dd; tgt = p; } }
    const dist = Math.sqrt(bd);
    let mx = 0, my = 0;
    if (tgt) {
      const dx = (tgt.x - e.x) / (dist || 1), dy = (tgt.y - e.y) / (dist || 1);
      if (e.boss) { const m = updateBoss(e, tgt, dx, dy, dist, dt); mx = m[0]; my = m[1]; }
      else {
        e.flip = tgt.x < e.x;
        const ai = e.d.ai;
        if (ai === 'shooter') {
          if (dist > 110) { mx = dx * e.spd; my = dy * e.spd; } else if (dist < 70) { mx = -dx * e.spd * 0.7; my = -dy * e.spd * 0.7; }
          e.shootT -= dt;
          if (e.shootT < 0.3) e.flash = (e.shootT * 20 | 0) % 2 ? 0.05 : 0;
          if (e.shootT <= 0 && dist < 150) {
            e.shootT = rand(2, 2.8);
            R.eshots.push({ x: e.x, y: e.y, vx: dx * 75, vy: dy * 75, life: 3, dmg: 8 * (e.dmg / e.d.dmg), s: PROJ_ART.seed, r: 2 });
            if (inAnyView(e.x, e.y)) tone(300, 0.06, 'square', 0.025, 200);
          }
        } else if (ai === 'bomber') {
          if (e.fuse >= 0) {
            e.fuse -= dt; e.flash = (e.fuse * 14 | 0) % 2 ? 0.05 : 0;
            if (e.fuse <= 0) { e.dead = true; explode(e.x, e.y, 26, e.dmg, null, true); debris(e.x, e.y, 4); continue; }
          } else { mx = dx * e.spd; my = dy * e.spd; if (dist < e.r + tgt.r + 6) e.fuse = 0.45; }
        } else if (ai === 'charger') {
          e.rot += dt * (e.st === 'dash' ? 30 : 8);
          e.stT -= dt;
          if (e.st === 'move') { mx = dx * e.spd; my = dy * e.spd; if (e.stT <= 0 && dist < 95) { e.st = 'wind'; e.stT = 0.5; } }
          else if (e.st === 'wind') { e.flash = (e.stT * 16 | 0) % 2 ? 0.05 : 0; if (e.stT <= 0) { e.st = 'dash'; e.stT = 0.6; e.cx = dx; e.cy = dy; } }
          else if (e.st === 'dash') { mx = e.cx * 160; my = e.cy * 160; if (Math.random() < 0.4) burst(e.x, e.y + 4, ['#d5dbe6', '#fff8e7'], 1, 30, 0.2); if (e.stT <= 0) { e.st = 'move'; e.stT = rand(1.5, 2.5); } }
        } else if (ai === 'turret') { // stands still and fires a three-way spread
          e.shootT -= dt;
          if (e.shootT < 0.4) e.flash = (e.shootT * 20 | 0) % 2 ? 0.05 : 0;
          if (e.shootT <= 0 && dist < 140) {
            e.shootT = rand(2.8, 3.4);
            const a = Math.atan2(tgt.y - e.y, tgt.x - e.x);
            for (const o of [-0.3, 0, 0.3]) R.eshots.push({ x: e.x, y: e.y - 5, vx: Math.cos(a + o) * 70, vy: Math.sin(a + o) * 70, life: 3, dmg: 7 * (e.dmg / e.d.dmg), s: PROJ_ART.seed, r: 2 });
            if (inAnyView(e.x, e.y)) tone(240, 0.07, 'square', 0.03, 140);
          }
        } else if (ai === 'skitter') { // fast and twitchy: zig-zags towards you
          e.stT -= dt; if (e.stT <= 0) { e.stT = rand(0.25, 0.5); e.zig = rand(-1.2, 1.2); }
          const c = Math.cos(e.zig || 0), s = Math.sin(e.zig || 0);
          mx = (dx * c - dy * s) * e.spd; my = (dx * s + dy * c) * e.spd;
        } else { mx = dx * e.spd; my = dy * e.spd; }
      }
      if (e.d.ai !== 'bomber' && e.z <= 2 && e.bs !== 'burrow' && dist < e.r + tgt.r + 1) hurtPlayer(tgt, e.dmg);
    } else { mx = Math.cos(e.anim) * 10; my = Math.sin(e.anim * 0.7) * 10; }
    // keep robots from stacking into one blob
    let sx = 0, sy = 0;
    forNear(e.x, e.y, e.r + 8, o => {
      if (o === e) return;
      const ddx = e.x - o.x, ddy = e.y - o.y, rr = e.r + o.r, dd = ddx * ddx + ddy * ddy;
      if (dd < rr * rr && dd > 0.0001) { const d = Math.sqrt(dd), push = (rr - d) / rr; sx += ddx / d * push; sy += ddy / d * push; }
    });
    if (e.slowT > 0) { e.slowT -= dt; const k = e.boss ? 0.7 : 0.45; mx *= k; my *= k; } // frozen by the frost blaster
    const sepK = e.boss ? 10 : 50;
    e.x = clamp(e.x + (mx + e.kx + sx * sepK) * dt, 6, WORLD_SIZE - 6);
    e.y = clamp(e.y + (my + e.ky + sy * sepK) * dt, 6, WORLD_SIZE - 6);
    const kd = Math.pow(0.0005, dt); e.kx *= kd; e.ky *= kd;
    if (tgt && dist > 430 && !e.boss) { const p = spawnPos(); e.x = p.x; e.y = p.y; }
  }
}
// bosses pick from a set of telegraphed attacks
function updateBoss(e, tgt, dx, dy, dist, dt) {
  const B = e.d;
  if (e.phase === 1 && B.final && e.hp < e.maxHp * 0.5) { e.phase = 2; banner(B.rage || 'HONK RAGE MODE!', C.red, 2.4, 'HE IS REALLY ANGRY NOW'); if (B.rage) sfx.clank(); else sfx.honk(0.7); impactAt('big', e.x, e.y); e.bt = 0.6; }
  const fast = e.phase === 2 ? 0.65 : 1;
  e.bt -= dt;
  e.flip = tgt.x < e.x;
  let mx = 0, my = 0;
  const bk = B.bullet && PROJ_ART[B.bullet] ? B.bullet : 'seed'; // each boss has its own bullet (sent online by name)
  const shoot = (ang, sp, sprite, wait = 0) => R.eshots.push({ x: e.x, y: e.y - 6, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 4, dmg: e.dmg * 0.6, s: PROJ_ART[bk], sk: bk, r: 2, wait, src: e });
  const bullet = PROJ_ART[bk];
  switch (e.bs) {
    case 'walk':
      mx = dx * e.spd; my = dy * e.spd;
      if (e.bt <= 0) {
        const opts = B.attacks.filter(a => a !== e.last);
        const a = pick(opts); e.last = a; e.bs = a; e.bt = 0; e.step = 0;
        if (a === 'charge') { e.bs = 'wind'; e.bt = 0.7 * fast; }
        if (a === 'jump') { e.bs = 'jumpUp'; e.bt = 0.45; e.jx = tgt.x; e.jy = tgt.y; e.sx0 = e.x; e.sy0 = e.y; }
      }
      break;
    case 'wind':
      e.flash = (e.bt * 12 | 0) % 2 ? 0.05 : 0;
      if (e.bt <= 0) { e.bs = 'charge'; e.bt = 0.85; e.cx = dx; e.cy = dy; shakeAt(e.x, e.y, 3); }
      break;
    case 'charge':
      mx = e.cx * 185; my = e.cy * 185;
      if (Math.random() < 0.6) burst(e.x, e.y + 12, ['#c9a26b', '#e9cf8a'], 1, 30, 0.4);
      if (e.bt <= 0) { e.bs = 'walk'; e.bt = 2.6 * fast; }
      break;
    case 'summon': {
      const n = 6 + (e.phase === 2 ? 4 : 0);
      for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(pick(B.summon), { x: e.x + Math.cos(a) * 30, y: e.y + Math.sin(a) * 30 }); }
      floatText(e.x, e.y - 36, B.summonText || (B.final ? 'MINIONS! HONK!' : 'BZZT! REINFORCEMENTS!'), C.gold, 1.2);
      e.bs = 'walk'; e.bt = 3 * fast;
      break;
    }
    case 'ring': {
      const n = 16 + (e.phase === 2 ? 8 : 0), off = rand(0, TAU);
      for (let w = 0; w < 2; w++) for (let i = 0; i < n; i++) shoot(off + (i + w * 0.5) / n * TAU, 70, bullet, w * 0.35);
      shakeAt(e.x, e.y, 2);
      e.bs = 'walk'; e.bt = 2.8 * fast;
      break;
    }
    case 'volley':
      if (e.bt <= 0) {
        const a = Math.atan2(tgt.y - e.y, tgt.x - e.x);
        shoot(a, 115, bullet); shoot(a + 0.2, 115, bullet); shoot(a - 0.2, 115, bullet);
        e.step++; e.bt = 0.22;
        if (e.step >= 5) { e.bs = 'walk'; e.bt = 2.6 * fast; }
      }
      break;
    case 'missiles': {
      const targets = alivePlayers();
      for (const p of targets) for (let i = 0; i < 4 + (e.phase === 2 ? 2 : 0); i++)
        R.marks.push({ x: p.x + rand(-40, 40) + (i === 0 ? 0 : 0), y: p.y + rand(-30, 30), r: 18, t: -i * 0.15, dur: 1.1, dmg: e.dmg * 0.8 });
      floatText(e.x, e.y - 36, 'MISSILES!', C.red, 1);
      e.bs = 'walk'; e.bt = 3.2 * fast;
      break;
    }
    case 'spiral': // stands still and sprays a turning spiral of bullets
      e.flash = 0;
      if (e.bt <= 0) {
        e.sa = (e.sa || 0) + 0.38;
        const arms = e.phase === 2 ? 3 : 2;
        for (let i = 0; i < arms; i++) shoot(e.sa + i / arms * TAU, 82, bullet);
        e.step++; e.bt = 0.09;
        if (e.step >= 30) { e.bs = 'walk'; e.bt = 2.6 * fast; }
      }
      break;
    case 'breath': { // stands and breathes a cone of fire that slowly follows you
      if (e.step === 0) { e.step = 1; e.bt = 1.5; e.ba = Math.atan2(tgt.y - e.y, tgt.x - e.x); e.tick = 0; floatText(e.x, e.y - 36, 'FWOOOSH!', C.orange, 0.9); }
      let da = Math.atan2(tgt.y - e.y, tgt.x - e.x) - e.ba; da = Math.atan2(Math.sin(da), Math.cos(da));
      e.ba += clamp(da, -dt * 0.9, dt * 0.9);
      e.tick -= dt;
      if (e.tick <= 0) { e.tick = 0.045; shoot(e.ba + rand(-0.32, 0.32), rand(105, 135), bullet); }
      if (e.bt <= 0) { e.bs = 'walk'; e.bt = 2.4 * fast; }
      break;
    }
    case 'warp': // fades out, pops up right next to you and bursts
      if (e.step === 0) { e.step = 1; e.bt = 0.55; sfx.warp(); }
      if (e.bt <= 0) {
        const a = rand(0, TAU); e.x = clamp(tgt.x + Math.cos(a) * 46, 20, WORLD_SIZE - 20); e.y = clamp(tgt.y + Math.sin(a) * 46, 20, WORLD_SIZE - 20);
        R.fx.push({ k: 'ring', x: e.x, y: e.y, r: 36, t: 0, dur: 0.3, col: B.col });
        for (let i = 0; i < 12; i++) shoot(i / 12 * TAU, 78, bullet);
        burst(e.x, e.y, [B.col, '#ffffff'], 16, 90, 0.4); shakeAt(e.x, e.y, 4);
        e.bs = 'walk'; e.bt = 2.2 * fast;
      }
      break;
    case 'burrow': { // dives underground (can't be hit), tunnels after you and bursts out under your feet
      if (e.step === 0) { e.step = 1; e.bt = 1.7; burst(e.x, e.y + 8, ['#c98a4a', '#e0a86a'], 16, 70, 0.5); shakeAt(e.x, e.y, 3); sfx.boom(); }
      mx = dx * e.spd * 2.4; my = dy * e.spd * 2.4;
      if (Math.random() < 0.5) burst(e.x + rand(-6, 6), e.y + 6, ['#c98a4a', '#e0a86a', '#8f5a2a'], 1, 30, 0.4);
      if (e.bt <= 0) {
        e.bs = 'walk'; e.bt = 2.4 * fast;
        R.fx.push({ k: 'ring', x: e.x, y: e.y, r: 40, t: 0, dur: 0.35, col: B.col });
        impactAt('small', e.x, e.y); shakeAt(e.x, e.y, 6); sfx.bigBoom();
        for (const p of alivePlayers()) if (d2(p.x, p.y, e.x, e.y) < 40 * 40) hurtPlayer(p, e.dmg);
        for (let i = 0; i < 14; i++) shoot(i / 14 * TAU, 85, bullet);
        burst(e.x, e.y + 6, ['#c98a4a', '#e0a86a', B.col], 26, 100, 0.6);
      }
      break;
    }
    case 'jumpUp':
      e.z = Ease.outCubic(1 - Math.max(0, e.bt) / 0.45) * 60;
      if (e.bt <= 0) { e.bs = 'jumpAir'; e.bt = 0.6; }
      break;
    case 'jumpAir': {
      const k = 1 - Math.max(0, e.bt) / 0.6;
      e.x = lerp(e.sx0, e.jx, k); e.y = lerp(e.sy0, e.jy, k); e.z = 60 * (1 - k * k);
      if (e.bt <= 0) {
        e.z = 0; e.bs = 'walk'; e.bt = 2.4 * fast;
        R.fx.push({ k: 'ring', x: e.x, y: e.y, r: 46, t: 0, dur: 0.35, col: B.col });
        shakeAt(e.x, e.y, 7); sfx.boom();
        for (const p of alivePlayers()) if (d2(p.x, p.y, e.x, e.y) < 46 * 46) hurtPlayer(p, e.dmg);
        for (let i = 0; i < 12; i++) shoot(i / 12 * TAU, 80, bullet);
        burst(e.x, e.y + 10, ['#c9a26b', '#e9cf8a', B.col], 20, 90, 0.5);
      }
      break;
    }
  }
  return [mx, my];
}

// ================================================================ level-up cards
// A duck that levels up gets three cards. The world only stops when every duck is picking at once
// (so in single player); otherwise the picker stands still in a shield bubble while the others play on.
const CARD_IN = 0.14, CARD_FLIP = 0.3, CARD_STAGGER = 0.12;
const CARD_READY = CARD_IN + CARD_STAGGER * 2 + CARD_FLIP; // all three cards are face up
const CARD_TIME = 12;                                       // auto-pick while the game keeps running
const CARD_STYLE = { weapon: ['#ff6fae', 'POWER-UP'], main: ['#ffd23f', 'GUN'], stat: ['#5ec8ff', 'DUCK'], snack: ['#51cf66', 'SNACK'], over: ['#ff3b3b', 'OVERCHARGE'] };
const cardKind = k => (k.startsWith('over:') ? 'over' : SIDE_WEAPONS.includes(k) ? 'weapon' : ['rapid', 'power', 'spread', 'pierce', 'bigshot', 'crit', 'reach'].includes(k) ? 'main' : k === 'snack' ? 'snack' : 'stat');
const picking = p => p.pending > 0 && !p.down && !p.gone;
function choosing() { return R.state === 'play' && R.players.some(picking); }
function cardsPauseAll() {
  if (R.state !== 'play') return false;
  const alive = R.players.filter(p => !p.down && !p.gone);
  return alive.length > 0 && alive.every(picking);
}
function tickPicked(p, dt) { if (p.picked) { p.picked.t += dt; if (p.picked.t > 0.45) p.picked = null; } }
const ownedPowers = p => SIDE_WEAPONS.filter(k => lvl(p, k));
function rollChoices(p) {
  // three power-up slots: once they're full, only those three keep coming (gun and duck upgrades always can)
  const full = ownedPowers(p).length >= POWER_SLOTS;
  const pool = UPGRADES.filter(u => lvl(p, u.k) < u.max && !(full && SIDE_WEAPONS.includes(u.k) && !lvl(p, u.k)));
  const opts = [];
  // now and then a maxed power-up offers its overcharge
  const ready = ownedPowers(p).filter(k => lvl(p, k) >= UPGRADES.find(u => u.k === k).max && !p.over[k]);
  if (ready.length && Math.random() < OVER_CHANCE) opts.push(overCard(pick(ready)));
  while (opts.length < 3 && pool.length) {
    let i = Math.floor(Math.random() * pool.length);
    if (p.level <= 6 && Math.random() < 0.35) { const w = pool.findIndex(u => SIDE_WEAPONS.includes(u.k) && !lvl(p, u.k)); if (w >= 0) i = w; }
    opts.push(pool.splice(i, 1)[0]);
  }
  while (opts.length < 3) opts.push({ k: 'snack', name: 'BREAD SNACK', max: 99, d: () => 'HEAL 40 HP' });
  if (opts[0].over) opts.splice(rint(0, 2), 0, opts.shift()); // the red card can land anywhere
  return opts;
}
function applyUpgrade(p, u) {
  sfx.pickup();
  if (u.k === 'snack') p.hp = Math.min(p.maxHp, p.hp + 40);
  else if (u.over) {
    p.over[u.over] = true;
    impactAt('big', p.x, p.y); sfx.chestOpen('legendary');
    R.fx.push({ k: 'ring', x: p.x, y: p.y - 6, r: 46, t: 0, dur: 0.5, col: '#ff3b3b' });
    burst(p.x, p.y - 6, ['#ff3b3b', '#ffd23f', '#fff8e7'], 30, 110, 0.7);
    banner('OVERCHARGE!', '#ff3b3b', 2.2, u.name);
  } else { p.up[u.k] = lvl(p, u.k) + 1; if (u.k === 'heart') { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 30); } }
  floatText(p.x, p.y - 18, fmt('{0}!', u.name), PCOL[p.id], 1.1);
  if (p.choice) p.picked = { choice: p.choice, sel: Math.max(0, p.choice.indexOf(u)), t: 0 };
  p.pending--; p.choice = null; p.squash = 0.25;
}
function updateLevelUp(dt, paused) {
  for (const p of R.players) {
    if (!picking(p)) continue;
    if (!p.choice) { p.choice = rollChoices(p); p.sel = 1; p.choiceT = 0; p.cardSnd = 0; }
    p.choiceT += dt;
    if (p.choiceT < CARD_READY) continue;
    const a = Input.menuFor(p.id, R.np);
    if (a.left) { p.sel = (p.sel + 2) % 3; sfx.uiMove(); }
    if (a.right) { p.sel = (p.sel + 1) % 3; sfx.uiMove(); }
    if (a.ok || (!paused && p.choiceT > CARD_TIME)) applyUpgrade(p, p.choice[p.sel]);
  }
  if (paused) for (const v of R.views) v.shake = 0;
}
function cardRects(v) {
  const gap = 6, cw = Math.min(70, Math.floor((v.w - 16 - gap * 2) / 3)), ch = Math.min(86, v.h - 62);
  const total = cw * 3 + gap * 2;
  const x0 = v.x + Math.floor((v.w - total) / 2), y0 = v.y + Math.floor((v.h - ch) / 2) + 10;
  return [0, 1, 2].map(i => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch }));
}
function cardTap(ev) {
  const v = viewAt(ev.x, ev.y); if (!v) return;
  const p = R.players[v.pid];
  if (!p.choice || p.choiceT < CARD_READY) return;
  cardRects(v).forEach((r, i) => {
    if (ev.x >= r.x && ev.x < r.x + r.w && ev.y >= r.y && ev.y < r.y + r.h) {
      p.sel = i;
      if (R.role === 'client') R.pendOk = true; // online: the host applies the pick
      else applyUpgrade(p, p.choice[i]);
    }
  });
}
// little things that make moving feel good
function dustFor(p, dt) {
  if (!p.moving || p.dashT > 0 || p.down) return;
  p.dustT = (p.dustT || 0) - dt;
  if (p.dustT > 0) return;
  p.dustT = 0.2;
  const st = R.theme.style, col = st === 'snow' ? '#ffffff' : st === 'grass' ? '#c9e4a6' : '#8b8aa0';
  R.tparts.push({ x: p.x + rand(-3, 3), y: p.y - 1, vx: -(p.mvx || 0) * 12 + rand(-4, 4), vy: rand(-8, -3), life: 0.35, max: 0.35, col, size: 2 });
}
// low health: a heartbeat only this device hears
function heartbeatFor(p, dt) {
  if (p.down || p.hp >= p.maxHp * 0.3 || !R.viewPids.includes(p.id)) return;
  p.beatT = (p.beatT || 0) - dt;
  if (p.beatT > 0) return;
  p.beatT = 0.9;
  tone(70, 0.12, 'sine', 0.18, 45); tone(62, 0.12, 'sine', 0.14, 40, atime(0.16));
}

// ================================================================ touch controls
const STICK_R = 20;
function viewAt(x, y) { return R.views.find(v => x >= v.x - 1 && x < v.x + v.w + 1 && y >= v.y - 1 && y < v.y + v.h + 1); }
function dashBtn(v) {
  const r = 15;
  if (R.views.length === 1) return { x: v.x + v.w - r - 12, y: v.y + v.h - r - 12, r };
  if (W >= H) return v.pid === 0 ? { x: v.x + r + 10, y: v.y + v.h - r - 12, r } : { x: v.x + v.w - r - 10, y: v.y + v.h - r - 12, r };
  return { x: v.x + v.w - r - 12, y: v.y + v.h - r - 10, r };
}

// ================================================================ rendering
function drawView(v) {
  const p = R.players[v.pid];
  ctx.save();
  ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  const sh = Save.data.settings.shake ? v.shake : 0;
  const cx = Math.round(v.camX + (sh ? rand(-sh, sh) : 0)), cy = Math.round(v.camY + (sh ? rand(-sh, sh) : 0));
  ctx.translate(v.x - cx, v.y - cy);
  drawGround(cx, cy, v.w, v.h);
  const inV = (x, y, m = 24) => x > cx - m && x < cx + v.w + m && y > cy - m && y < cy + v.h + m;
  for (const d of R.decor) if (inV(d.x, d.y, 8)) drawSpr(d.s, d.x, d.y);
  for (const d of R.decals) {
    if (!inV(d.x, d.y)) continue;
    ctx.globalAlpha = Math.min(1, d.life / 2) * 0.7; ctx.fillStyle = d.col;
    for (const [ox, oy] of d.px) ctx.fillRect(d.x + ox, d.y + oy, 2, 1);
  }
  ctx.globalAlpha = 1;
  for (const q of R.puddles) if (inV(q.x, q.y, q.r)) drawPuddle(q);
  // telegraphs on the ground
  for (const m of R.marks) {
    if (m.t < 0 || !inV(m.x, m.y)) continue;
    const k = m.t / m.dur;
    if (m.friendly) { pring(m.x, m.y, m.r * (1.2 - k * 0.2), '#ff8c1a', 1, m.r * 0.6); continue; }
    pring(m.x, m.y, m.r, (m.t * 10 | 0) % 2 ? '#e8343b' : '#ffd23f', 1, m.r * 0.6);
    pellipse(m.x, m.y, m.r * k, m.r * 0.6 * k, 'rgba(232,52,59,0.3)');
    const mz = (1 - k) * 120;
    drawSpr(PROJ_ART.missile, m.x, m.y - mz);
  }
  // pickups
  for (const g of R.drops) {
    if (!inV(g.x, g.y)) continue;
    if (g.k === 'coin') { shadow(g.x, g.y + 3, 2); coinIcon(Math.round(g.x - 3), Math.round(g.y - 4 - g.z), g.bob); }
    else drawSpr(ART.gem[g.v >= 20 ? 2 : g.v >= 5 ? 1 : 0], g.x, g.y + Math.round(Math.sin(g.bob * 4)));
  }
  for (const k of R.items) {
    if (!inV(k.x, k.y) || (k.t > 34 && (k.t * 8 | 0) % 2)) continue;
    shadow(k.x, k.y + 6, 3);
    drawSpr(ART[k.k], k.x, k.y + Math.round(Math.sin(k.t * 4) * 1.5) - 1);
  }
  // revive rings
  for (const q of R.players) if (q.down) {
    pring(q.x, q.y - 2, 22, 'rgba(255,255,255,0.25)', 1, 14);
    if (q.reviveT > 0) {
      const n = Math.floor(q.reviveT / 2.5 * 40);
      ctx.fillStyle = C.green;
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / 40 * TAU; ctx.fillRect(Math.round(q.x + Math.cos(a) * 12), Math.round(q.y - 4 + Math.sin(a) * 12), 2, 2); }
    }
  }
  // trails under the ducks
  for (const q of R.players) drawTrail(q);
  for (const t of R.tparts) {
    if (!inV(t.x, t.y, 8)) continue;
    const a = t.life / t.max;
    if (t.s) drawSprX(t.s, t.x, t.y, { alpha: Math.min(1, a * 2) });
    else if (t.bub) { ctx.globalAlpha = Math.min(1, a * 2); pring(t.x, t.y, t.bub, '#bde6ff'); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(t.x - t.bub / 2), Math.round(t.y - t.bub / 2), 1, 1); ctx.globalAlpha = 1; }
    else { if (t.tw && (t.life * 20 | 0) % 2) continue; ctx.fillStyle = t.col; const s = t.size ? Math.max(1, Math.round(t.size * a)) : 1; ctx.fillRect(Math.round(t.x), Math.round(t.y), s, s); }
  }
  // shadows, then y-sorted actors (robots, ducks, trees)
  const actors = [];
  for (const e of R.enemies) if (!e.dead && inV(e.x, e.y, 40)) actors.push(e);
  for (const q of R.players) actors.push(q);
  for (const d of R.tall) if (inV(d.x, d.y, 24)) actors.push(d);
  for (const a of actors) {
    if (a.tall) shadow(a.x, a.y + a.s.h / 2 - 1, a.s.w * 0.35);
    else if (a.d) { if (a.spawnT <= 0) shadow(a.x, a.y + (a.boss ? a.r - 1 : a.r + 1), a.boss ? a.r * (1 - a.z / 120) : a.r); }
    else shadow(a.x, a.y, 5);
  }
  actors.sort((a, b) => (a.tall ? a.y + a.s.h / 2 - 2 : a.d ? a.y + a.r : a.y) - (b.tall ? b.y + b.s.h / 2 - 2 : b.d ? b.y + b.r : b.y));
  for (const a of actors) { if (a.tall) drawSpr(a.s, a.x, a.y); else if (a.d) drawEnemy(a); else drawPlayer(a); }
  // bread bombs
  for (const b of R.bombs) {
    const t = clamp(b.t / b.dur, 0, 1), x = lerp(b.x0, b.x1, t), y = lerp(b.y0, b.y1, t);
    shadow(x, y + 3, 2);
    if (b.meteor) { // falls straight in with a fiery tail
      for (let k = 1; k <= 4; k++) pcirc(x + k * 3, y - k * 9, 3 - k * 0.5, k % 2 ? '#ff8c1a' : '#ffd23f');
      drawSprX(PROJ_ART.rock, x, y, { rot: t * 6 });
    } else drawSprX(b.egg ? PROJ_ART.eggbomb : ART.bread, x, y - Math.sin(t * Math.PI) * (b.egg ? 22 : 30), { rot: t * 8 });
    if (t > 0.5) pring(b.x1, b.y1, b.r * (1 - t) + 3, 'rgba(255,80,60,0.5)');
  }
  // projectiles
  for (const b of R.shots) {
    if (!inV(b.x, b.y, 6)) continue;
    if (b.kind === 'bubble') { pcirc(b.x, b.y, b.r, 'rgba(189,230,255,0.45)'); pring(b.x, b.y, b.r, '#bde6ff'); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(b.x - 2), Math.round(b.y - 2), 1, 1); }
    else if (b.kind === 'rang') drawSprX(PROJ_ART.rang, b.x, b.y, { rot: b.rot });
    else if (b.kind === 'feather') drawSprX(PROJ_ART.feather, b.x, b.y, { rot: Math.atan2(b.vy, b.vx) });
    else if (b.kind === 'corn') drawSprX(PROJ_ART.corn, b.x, b.y, { rot: b.rot * 0.3 });
    else if (b.kind === 'saw') drawSprX(PROJ_ART.saw, b.x, b.y, { rot: b.rot * 1.5 });
    else if (b.kind === 'candy') drawSprX(PROJ_ART.candycorn, b.x, b.y, { rot: Math.atan2(b.vy, b.vx) });
    else if (SHOT_EXTRA[b.kind]) { const sx = SHOT_EXTRA[b.kind]; drawSprX(PROJ_ART[sx.art], b.x, b.y, { rot: sx.spin ? b.rot * sx.spin : Math.atan2(b.vy, b.vx) }); }
    else if (b.kind === 'star') drawSprX(PROJ_ART.star, b.x, b.y, { rot: b.rot * 2 });
    else if (b.kind === 'bee') { drawSprX(PROJ_ART.bee, b.x, b.y); if ((b.rot * 3 | 0) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 2), 3, 1); } }
    else if (b.kind === 'harpoon') { const l = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / l, uy = b.vy / l; pline(b.x - ux * 9, b.y - uy * 9, b.x, b.y, '#a0642d', 2); pline(b.x, b.y, b.x + ux * 3, b.y + uy * 3, '#ffffff', 2); }
    else if (b.kind === 'mine') {
      drawSprX(PROJ_ART.mine, b.x, b.y);
      const armed = b.max - b.life >= 0.4, blink = (b.life * (b.life < 1.5 ? 12 : 4) | 0) % 2;
      ctx.fillStyle = armed && blink ? '#ff3b3b' : '#7a1f24'; ctx.fillRect(Math.round(b.x), Math.round(b.y - 3), 1, 1);
    }
    else if (b.kind === 'vortex') { // a little black hole with spinning purple rings
      const pulse = Math.sin(b.rot * 0.5) * 1.5;
      pcirc(b.x, b.y, 9 + pulse, 'rgba(157,92,255,0.25)'); pring(b.x, b.y, 7 + pulse, '#9d5cff', 1); pcirc(b.x, b.y, 4, '#0c0a1a'); pring(b.x, b.y, 4, '#c9a6ff', 1);
      for (let i = 0; i < 4; i++) { const a = b.rot * 0.4 + i / 4 * TAU, rr = 12 - ((b.rot * 2 + i * 3) % 10); ctx.fillStyle = '#c9a6ff'; ctx.fillRect(Math.round(b.x + Math.cos(a) * rr), Math.round(b.y + Math.sin(a) * rr), 1, 1); }
    }
    else if (b.kind === 'popcorn') drawSprX(PROJ_ART.popcorn, b.x, b.y, { rot: b.rot });
    else if (b.kind === 'frost') {
      const l = Math.hypot(b.vx, b.vy) || 1;
      pline(b.x, b.y, b.x - b.vx / l * 7, b.y - b.vy / l * 7, 'rgba(159,220,255,0.6)', 2);
      drawSprX(PROJ_ART.frost, b.x, b.y, { rot: b.rot * 0.5 });
    } else if (b.kind === 'rocket') drawSprX(PROJ_ART.rocket, b.x, b.y, { rot: Math.atan2(b.vy, b.vx) });
    else if (b.kind === 'flame') { // yellow, then orange, red and finally smoke
      const k = 1 - b.life / b.max, c = k < 0.25 ? '#fff36b' : k < 0.5 ? '#ffd23f' : k < 0.75 ? '#ff8c1a' : '#e8343b';
      ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      pcirc(b.x, b.y, b.r, c); if (k < 0.6) pcirc(b.x, b.y, b.r * 0.45, '#fff8e7');
      ctx.globalAlpha = 1;
    } else if (b.kind === 'goldgun') {
      const l = Math.hypot(b.vx, b.vy) || 1;
      pline(b.x, b.y, b.x - b.vx / l * 6, b.y - b.vy / l * 6, '#ffd23f', 2); pline(b.x, b.y, b.x - b.vx / l * 3, b.y - b.vy / l * 3, '#ffffff');
      if ((b.rot * 3 | 0) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(b.x + rand(-3, 3)), Math.round(b.y + rand(-3, 3)), 1, 1); }
    }
    else if (b.owner.weapon === 'minigun' || b.r <= 1 && b.owner.weapon === 'shotgun') {
      const l = Math.hypot(b.vx, b.vy) || 1;
      pline(b.x, b.y, b.x - b.vx / l * 4, b.y - b.vy / l * 4, b.col);
    } else {
      ctx.fillStyle = OUT; ctx.fillRect(Math.round(b.x - b.r - 1), Math.round(b.y - b.r - 1), b.r * 2 + 3, b.r * 2 + 3);
      ctx.fillStyle = b.col; ctx.fillRect(Math.round(b.x - b.r), Math.round(b.y - b.r), b.r * 2 + 1, b.r * 2 + 1);
      ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(b.x - b.r), Math.round(b.y - b.r), 1, 1);
    }
  }
  for (const b of R.eshots) if (!(b.wait > 0) && inV(b.x, b.y, 4)) drawSpr(b.s, b.x, b.y);
  // effects
  for (const f of R.fx) {
    if (f.t < 0) continue;
    const k = f.t / f.dur;
    if (f.k === 'boom') { pcirc(f.x, f.y, f.r * (0.4 + k * 0.6), k < 0.3 ? '#fff8e7' : k < 0.6 ? '#ffd23f' : 'rgba(255,140,26,0.6)'); pring(f.x, f.y, f.r * (0.5 + k * 0.6), '#e8343b'); }
    else if (f.k === 'pop') { pring(f.x, f.y, f.r * (0.6 + k), '#fff8e7'); }
    else if (f.k === 'muzzle') { pcirc(f.x, f.y, 3 - k * 2, '#fff8e7'); pring(f.x, f.y, 2 + k * 3, f.col); }
    else if (f.k === 'ring') { pring(f.x, f.y, f.r * (0.2 + k * 0.8), f.col, 2); pring(f.x, f.y, f.r * (0.15 + k * 0.7), '#fff8e7', 1); }
    else if (f.k === 'zap') {
      for (let i = 0; i < f.pts.length - 1; i++) {
        const [x0, y0] = f.pts[i], [x1, y1] = f.pts[i + 1], mx = (x0 + x1) / 2 + rand(-6, 6), my = (y0 + y1) / 2 + rand(-6, 6);
        pline(x0, y0, mx, my, f.col || '#fff36b', 2); pline(mx, my, x1, y1, f.col || '#fff36b', 2); pline(x0, y0, mx, my, '#fff'); pline(mx, my, x1, y1, '#fff');
      }
    } else if (f.k === 'sunbeam') { // a column of light from the sky
      const w = f.r * (1 - k * 0.7);
      ctx.globalAlpha = 0.85 * (1 - k);
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(Math.round(f.x - w / 2), Math.round(f.y - 220), Math.round(w), 220);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x - w / 6), Math.round(f.y - 220), Math.max(1, Math.round(w / 3)), 220);
      ctx.globalAlpha = 1; pring(f.x, f.y, f.r * (0.5 + k), '#ffd23f', 1, f.r * 0.4 * (0.5 + k));
    } else if (f.k === 'slash') { // a bright arc swept in the swing direction
      const n = 9, sweep = Math.min(1, k * 1.6);
      for (let i = 0; i < n - 1; i++) {
        const u = i / (n - 1); if (u > sweep) break;
        const a = f.a + (u - 0.5) * f.arc * (f.dir || 1), a2 = f.a + ((i + 1) / (n - 1) - 0.5) * f.arc * (f.dir || 1);
        const r = f.r * (0.85 + 0.15 * Math.sin(u * Math.PI));
        ctx.globalAlpha = 1 - k * 0.7;
        pline(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, f.x + Math.cos(a2) * r, f.y + Math.sin(a2) * r, f.col, 3);
        pline(f.x + Math.cos(a) * (r - 3), f.y + Math.sin(a) * (r - 3), f.x + Math.cos(a2) * (r - 3), f.y + Math.sin(a2) * (r - 3), '#ffffff', 1);
        ctx.globalAlpha = 1;
      }
    } else if (f.k === 'hammer') { // the ban hammer comes down
      drawSprX(GUN_ART.banhammer, f.x - 4, f.y - 14, { sc: 2, rot: -Math.PI / 2 + Math.min(1, k * 2) * Math.PI / 2 * 0.9, ax: 0.1, ay: 0.5, alpha: 1 - Math.max(0, k - 0.6) * 2.5 });
    } else if (f.k === 'beam') {
      const th = k < 0.5 ? 3 : 2;
      pline(f.x0, f.y0, f.x1, f.y1, f.col, th + 1); pline(f.x0, f.y0, f.x1, f.y1, '#ffffff', 1);
    }
  }
  // particles + debris
  for (const q of R.parts) {
    if (!inV(q.x, q.y, 4)) continue;
    if (q.s) drawSprX(q.s, q.x, q.y, { rot: q.rot, alpha: Math.min(1, q.life / q.max * 3) });
    else { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size); }
  }
  for (const t of R.texts) {
    if (!inV(t.x, t.y, 40)) continue;
    ctx.globalAlpha = Math.min(1, t.life / t.max * 2.5);
    text(t.str, t.x, t.y, t.col, t.sc, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // screen-space overlays for this view
  ctx.save();
  ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  if (p.hurtFlash > 0) { ctx.globalAlpha = p.hurtFlash * 1.6; ctx.fillStyle = '#e8343b'; ctx.fillRect(v.x, v.y, v.w, 3); ctx.fillRect(v.x, v.y + v.h - 3, v.w, 3); ctx.fillRect(v.x, v.y, 3, v.h); ctx.fillRect(v.x + v.w - 3, v.y, 3, v.h); ctx.globalAlpha = 1; }
  if (!p.down && p.hp < p.maxHp * 0.3 && R.state === 'play') { // low health: the screen edge pulses red
    ctx.fillStyle = `rgba(232,52,59,${(0.2 + Math.sin(R.t * 7) * 0.1).toFixed(2)})`;
    ctx.fillRect(v.x, v.y, v.w, 4); ctx.fillRect(v.x, v.y + v.h - 4, v.w, 4); ctx.fillRect(v.x, v.y, 4, v.h); ctx.fillRect(v.x + v.w - 4, v.y, 4, v.h);
  }
  for (const f of R.fx) if (f.k === 'flash' && (R.views.length === 1 || f.pid === v.pid)) { ctx.globalAlpha = 1 - f.t / f.dur; ctx.fillStyle = '#ffeedd'; ctx.fillRect(v.x, v.y, v.w, v.h); ctx.globalAlpha = 1; }
  if (R.state !== 'results') drawHud(v, p, cx, cy);
  ctx.restore();
}
function drawGround(cx, cy, vw, vh) {
  const th = R.theme;
  if (!R.pats) R.pats = { g: ctx.createPattern(groundTile(R.world), 'repeat'), e: ctx.createPattern(edgeTile(R.world), 'repeat') };
  const wo = Math.floor(R.t * (th.edge === 'lava' ? 3 : 5)) % 32;
  ctx.fillStyle = R.pats.e;
  ctx.save(); ctx.translate(wo, th.edge === 'void' ? 0 : Math.round(Math.sin(R.t) * 2)); ctx.fillRect(cx - wo - 32, cy - 32, vw + 64, vh + 64); ctx.restore();
  if (th.edge === 'lava') { ctx.fillStyle = `rgba(255,200,60,${0.12 + Math.sin(R.t * 3) * 0.06})`; ctx.fillRect(cx, cy, vw, vh); }
  ctx.fillStyle = th.shoreD; ctx.fillRect(-6, -4, WORLD_SIZE + 12, WORLD_SIZE + 12);
  ctx.fillStyle = th.shore; ctx.fillRect(-6, -6, WORLD_SIZE + 12, WORLD_SIZE + 10);
  ctx.fillStyle = R.pats.g; ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
}
function drawTrail(p) {
  if (p.rainbow.length > 1) {
    for (let i = 1; i < p.rainbow.length; i++) {
      const a = p.rainbow[i - 1], b = p.rainbow[i];
      ctx.globalAlpha = Math.min(1, b.t * 3);
      for (let k = 0; k < 6; k++) pline(a.x, a.y - 3 + k, b.x, b.y - 3 + k, RAINBOW[k]);
    }
    ctx.globalAlpha = 1;
  }
  for (const g of p.ghosts) {
    const set = duckSet(p.lo.skin), view = g.facing === 'up' ? 'up' : g.facing === 'down' ? 'down' : 'side';
    drawSprX(set[view][0][0], g.x, g.y, { flip: g.facing === 'left', white: !g.soft, alpha: g.soft ? g.t * 1.5 : g.t * 3, ax: 0.5, ay: 1 });
  }
}
function drawEnemy(e) {
  if (e.bs === 'warp' && (e.anim * 24 | 0) % 2) return; // flickering out of time
  if (e.bs === 'burrow') { // underground: only a mound of earth moving along
    const w = 10 + Math.sin(e.anim * 20) * 2;
    pellipse(e.x, e.y + 6, w + 1, 5, OUT); pellipse(e.x, e.y + 6, w, 4, '#c98a4a'); pellipse(e.x - 2, e.y + 5, w * 0.6, 2, '#e0a86a');
    return;
  }
  if (e.spawnT > 0) { // teleport beam
    const k = 1 - e.spawnT / 0.45;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#5ec8ff'; ctx.fillRect(Math.round(e.x - 1 - (1 - k) * 3), Math.round(e.y - 40), Math.round(2 + (1 - k) * 6), 40 + e.r);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(e.x), Math.round(e.y - 40), 1, 40 + e.r);
    ctx.globalAlpha = 1;
    if (k > 0.5) drawSprX(enemySprite(e.type, 0, R.theme.tint), e.x, e.y, { white: true, sy: (k - 0.5) * 2, sc: e.boss ? 2 : 1, ay: 1 });
    return;
  }
  const frame = Math.floor(e.anim * (e.d.ai === 'charger' ? 4 : 8)) % 2;
  const s = enemySprite(e.type, frame, e.d.fx === 'goo' ? null : R.theme.tint);
  const sc = e.boss ? 2 : e.elite ? 1.5 : 1;
  let sx = 1, sy = 1, bob = 0;
  if (e.d.fx === 'goo') { const q = Math.sin(e.anim * 8); sx = 1 + q * 0.12; sy = 1 - q * 0.12; }
  else if (e.d.fly) bob = -6 + Math.round(Math.sin(e.anim * 5) * 2);
  else bob = -Math.round(Math.abs(Math.sin(e.anim * 10)) * 1.5);
  if (e.boss && e.bs === 'wind') { sx = 1.1; sy = 0.9; } else if (e.flash > 0) { sx *= 1.14; sy *= 0.88; } // squash when hit
  const fuse = e.fuse >= 0;
  if (e.d.ai === 'charger') drawSprX(s, e.x, e.y + bob, { rot: e.rot, white: e.flash > 0, sc });
  else drawSprX(s, e.x, e.y + bob - e.z + s.h * sc / 2, { flip: e.flip, white: e.flash > 0, sc, sx, sy, ay: 1 });
  if (fuse) pring(e.x, e.y, 4 + (1 - e.fuse / 0.45) * 22, 'rgba(232,52,59,0.6)');
  if (!e.boss && e.d.ai !== 'charger' && R.eventHat) drawSprX(R.eventHat, e.x, e.y + bob - e.z - s.h * sc / 2 + 3, { ay: 1 }); // events: pumpkins, santa hats...
  if (e.elite) drawEliteMark(e, e.y + bob - e.z - s.h * sc / 2 - (R.eventHat ? 2 : 0));
  if (e.slowT > 0) { // frozen: icy ring and sparkles
    pring(e.x, e.y + 1, e.r * sc + 2, 'rgba(159,220,255,0.75)');
    if ((e.anim * 6 | 0) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(e.x + Math.sin(e.anim * 9) * e.r * sc), Math.round(e.y - e.r * sc + bob), 1, 1); }
  }
  if (e.d.ai === 'charger' && e.st === 'wind') pline(e.x, e.y, e.x + (R.players[0].x - e.x) * 0.3, e.y + (R.players[0].y - e.y) * 0.3, 'rgba(232,52,59,0.5)');
  if (!e.boss && e.hp < e.maxHp && e.maxHp > 30) {
    const w = e.r * 2 + 2, x = Math.round(e.x - w / 2), y = Math.round(e.y - e.r - 7 + bob);
    ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, 3);
    ctx.fillStyle = '#e8343b'; ctx.fillRect(x, y, Math.max(1, Math.round(w * e.hp / e.maxHp)), 1);
  }
}
// where the duck turret(s) hover: beside the duck, bobbing
function turretSpots(p) {
  const b = Math.sin(p.anim * 3) * 2, out = [[p.x - 13, p.y - 16 + b]];
  if (p.over && p.over.turret) out.push([p.x + 13, p.y - 16 - b]);
  return out;
}
function drawPlayer(p) {
  if (p.down) {
    const set = duckSet(p.lo.skin);
    drawSprX(set.egg, p.x, p.y + Math.round(Math.sin(p.anim * 3)), { ay: 1 });
    if ((p.anim * 2 | 0) % 2 === 0) text('HELP!', p.x, p.y - 20, PCOL[p.id], 1, 1);
    return;
  }
  if (p.iframes > 0 && p.dashT <= 0 && (p.iframes * 16 | 0) % 2 === 0) return;
  let sx = 1, sy = 1;
  if (p.moving) { const q = Math.sin(p.anim * 18); sx = 1 - q * 0.05; sy = 1 + q * 0.06; }
  else { const q = Math.sin(p.anim * 3); sy = 1 + q * 0.03; sx = 1 - q * 0.02; }
  if (p.dashT > 0) { if (p.facing === 'left' || p.facing === 'right') { sx = 1.25; sy = 0.82; } else { sx = 0.82; sy = 1.2; } }
  if (p.turnT > 0) sx *= 1 - 0.55 * Math.sin(Math.PI * (1 - p.turnT / 0.14));
  if (p.squash > 0) { const q = Math.sin(p.squash / 0.25 * Math.PI); sx *= 1 + q * 0.2; sy *= 1 - q * 0.18; }
  const bob = p.moving ? -Math.round(Math.abs(Math.sin(p.anim * 9))) : 0;
  const eggs = eggSpots(p), eggSc = p.over && p.over.egg ? 2 : 1;
  for (const [x, y] of eggs) if (y < p.y - 3) drawSprX(ART.eggOrb, x, y, { sc: eggSc });
  drawDuck(p.x, p.y + bob, {
    skin: p.lo.skin, hat: p.lo.hat, halo: p.lo.halo, weapon: p.weapon, facing: p.facing, frame: p.moving ? Math.floor(p.anim * 9) % 2 : 0,
    blink: p.blinkT < 0, aim: p.aim, sx, sy, white: p.hurtFlash > 0.15, t: p.anim,
    sparkle: (x, y) => R.tparts.push({ x, y, vx: rand(-4, 4), vy: rand(-14, -6), life: 0.6, max: 0.6, col: pick(['#fff3b0', '#ffd23f', '#c9a6ff']), tw: true }),
    ember: (x, y) => R.tparts.push({ x, y, vx: rand(-4, 4), vy: rand(-18, -8), life: 0.4, max: 0.4, col: pick(['#ff8c1a', '#ffd23f']), size: 1 }),
  });
  for (const [x, y] of eggs) if (y >= p.y - 3) drawSprX(ART.eggOrb, x, y, { sc: eggSc });
  if (lvl(p, 'turret')) for (const [x, y] of turretSpots(p)) { shadow(x, y + 12, 3); drawSprX(ICON.turret, x, y); }
  if (lvl(p, 'shield') && p.shieldT <= 0 && !p.choice) { // bubble shield is up
    const r = 11 + Math.sin(p.anim * 4) * 0.6, ov = p.over && p.over.shield;
    ctx.globalAlpha = 0.16; pcirc(p.x, p.y - 7, r, ov ? '#ffd1e6' : '#9fdcff'); ctx.globalAlpha = 0.8;
    pring(p.x, p.y - 7, r, ov ? '#ff9ccb' : '#9fdcff'); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x - r * 0.5), Math.round(p.y - 7 - r * 0.6), 2, 1);
  }
  if (picking(p) || p.choice) { // shield bubble while picking a card
    const r = 12 + Math.sin(p.anim * 5) * 0.8, a = p.anim * 3;
    ctx.globalAlpha = 0.22; pcirc(p.x, p.y - 7, r, PCOL[p.id]); ctx.globalAlpha = 1;
    pring(p.x, p.y - 7, r, PCOL[p.id]);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x + Math.cos(a) * r), Math.round(p.y - 7 + Math.sin(a) * r), 2, 2);
  }
  if (R.players.length > 1) text(R.online ? keep(p.name) : 'P' + (p.id + 1), p.x, p.y - 26 - (p.lo.hat === 'wizard' || p.lo.hat === 'viking' ? 6 : 0), PCOL[p.id], 1, 1);
}

// ---------------------------------------------------------------- HUD
function ghostBar(x, y, w, h, frac, ghost, col) {
  panel(x, y, w, h, '#3a2a4f', OUT, null, false);
  const gw = Math.round((w - 2) * clamp(ghost, 0, 1)), fw = Math.round((w - 2) * clamp(frac, 0, 1));
  if (gw > fw) { ctx.fillStyle = '#fff8e7'; ctx.fillRect(x + 1 + fw, y + 1, gw - fw, h - 2); }
  if (fw > 0) { ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, fw, h - 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 1, fw, 1); }
}
function drawHud(v, p, cx, cy) {
  let x = v.x + 4, y = v.y + 4;
  const hpW = Math.min(64, Math.floor(v.w * 0.3));
  // keep clear of the pause / coins / timer cluster at the top centre
  const mid = Math.floor(W / 2), hudW = hpW + 32, half = R.mode === 'story' && !R.bossSpawned ? 36 : 22;
  if (v.y === 0 && x < mid + half && x + hudW > mid - 90) { if (v.x >= mid - 40) x = mid + half + 4; else y += 22; }
  text('#', x, y + 1, '#ff4d6d', 1, 0);
  p.hpG = p.hpG === undefined || p.hp >= p.hpG ? p.hp : p.hpG + (p.hp - p.hpG) * 0.05; // white "ghost" shows the hit you just took
  ghostBar(x + 7, y, hpW, 7, p.hp / p.maxHp, p.hpG / p.maxHp, p.hp / p.maxHp < 0.3 ? '#ff4d6d' : '#51cf66');
  text(Math.ceil(p.hp), x + 9, y + 1, C.white, 1, 0, null);
  bar(x, y + 9, hpW + 7, 5, p.xp / p.xpNext, PCOL[p.id]);
  text(fmt('LV{0}', p.level), x + hpW + 11, y + 9, PCOL[p.id], 1, 0);
  text(fmt('{0} KO', p.kills), x, y + 17, C.white, 1, 0);
  // weapons owned
  let ix = v.x + 4;
  const iy = v.y + v.h - 12;
  const onLeftEdge = Input.touch && R.views.length === 2 && W >= H && v.pid === 0;
  if (!onLeftEdge) {
    panel(ix, iy - 3, 16, 12, C.uiD, OUT, null, false);
    drawSprX(GUN_ART[p.weapon] || GUN_ART.blaster, ix + 8, iy + 3, { ax: 0.5 });
    ix += 19;
    const owned = ownedPowers(p);
    for (let s = 0; s < POWER_SLOTS; s++) {
      const k = owned[s], ov = k && p.over[k];
      if (ov && (R.t * 4 | 0) % 2) { ctx.fillStyle = 'rgba(255,59,59,0.5)'; ctx.fillRect(ix - 2, iy - 5, 22, 16); }
      panel(ix, iy - 3, 20, 12, k ? C.uiD : 'rgba(31,24,48,0.5)', ov ? '#ff3b3b' : OUT, null, false);
      if (k) { drawSpr(ICON[k], ix + 6, iy + 3); text(ov ? '+' : lvl(p, k) >= UPGRADES.find(u => u.k === k).max ? 'M' : lvl(p, k), ix + 12, iy, ov ? '#ff8080' : C.white, 1, 0, null); }
      ix += 22;
    }
  }
  // partner arrow
  if (R.players.length > 1) {
    const o = R.players[(p.id + 1) % R.players.length], ox = o.x - cx, oy = o.y - cy;
    if (ox < 0 || oy < 0 || ox > v.w || oy > v.h) {
      const mx = v.w / 2, my = v.h / 2, dx = ox - mx, dy = oy - my;
      const k = Math.min((v.w / 2 - 12) / Math.abs(dx || 1e-6), (v.h / 2 - 12) / Math.abs(dy || 1e-6));
      const ax = v.x + mx + dx * k, ay = v.y + my + dy * k, a = Math.atan2(dy, dx), col = o.down ? '#ff4d6d' : PCOL[o.id];
      pcirc(ax, ay, 6, OUT); pcirc(ax, ay, 5, col);
      pline(ax + Math.cos(a) * 6, ay + Math.sin(a) * 6, ax + Math.cos(a) * 10, ay + Math.sin(a) * 10, col, 2);
      text(o.down ? '!' : String(o.id + 1), ax, ay - 2, OUT, 1, 1, null);
    }
  }
  // boss bar
  const boss = R.boss && !R.boss.dead ? R.boss : null;
  if (boss && boss.spawnT <= 0) {
    const bw = Math.min(170, v.w - 40), bx = v.x + Math.floor((v.w - bw) / 2), by = v.y + v.h - (Input.touch ? 46 : 14);
    boss.hpG = boss.hpG === undefined || boss.hp >= boss.hpG ? boss.hp : boss.hpG + (boss.hp - boss.hpG) * 0.04;
    ghostBar(bx, by, bw, 7, boss.hp / boss.maxHp, boss.hpG / boss.maxHp, boss.phase === 2 ? '#e8343b' : '#ff8c1a');
    text(boss.d.name, v.x + v.w / 2, by - 7, C.gold, 1, 1);
  }
  // boss intro card
  if (R.bossIntro && R.bossIntro.t < 2.6) {
    const t = R.bossIntro.t, k = Math.min(1, t / 0.3), out = t > 2.2 ? (t - 2.2) / 0.4 : 0;
    const by = v.y + Math.floor(v.h * 0.32);
    ctx.fillStyle = 'rgba(15,10,26,0.7)'; ctx.fillRect(v.x, by - 12, v.w, 40 * (1 - out));
    for (let i = -1; i < v.w / 12 + 1; i++) { ctx.fillStyle = i % 2 ? '#ffd23f' : OUT; ctx.fillRect(v.x + i * 12 + (t * 40 % 24) - 12, by - 12, 12, 3); ctx.fillRect(v.x + i * 12 - (t * 40 % 24) + 12, by + 25 * (1 - out), 12, 3); }
    if (out < 1) {
      text('!! WARNING !!', v.x + v.w / 2 + (1 - k) * v.w, by - 4, C.red, 1, 1);
      text(R.bossIntro.name, v.x + v.w / 2 - (1 - Ease.outBack(k)) * v.w, by + 6, C.gold, v.w > 250 ? 2 : 1, 1, 'outline');
    }
  }
  // banners
  if (!p.choice) R.banners.forEach((b, i) => { // banners step aside while this duck picks a card
    const k = b.t / b.dur, sc = v.w > 260 ? 2 : 1;
    const by = v.y + Math.floor(v.h * 0.24) + i * (sc * 7 + 10);
    const slide = k < 0.12 ? (1 - Ease.outCubic(k / 0.12)) * v.w : 0;
    if (k > 0.85 && (b.t * 12 | 0) % 2) return;
    text(b.str, v.x + v.w / 2 + slide, by, b.col, sc, 1, 'outline');
    if (b.sub) text(b.sub, v.x + v.w / 2 + slide, by + sc * 6 + 4, C.white, 1, 1);
  });
  // touch controls
  if (Input.touch && !p.down && R.state === 'play') {
    const db = dashBtn(v), ready = p.dashCd <= 0;
    pcirc(db.x, db.y, db.r, 'rgba(27,19,37,0.45)');
    pring(db.x, db.y, db.r, ready ? PCOL[p.id] : 'rgba(255,255,255,0.3)');
    if (!ready) pcirc(db.x, db.y, Math.max(1, (db.r - 2) * (1 - p.dashCd / pDashCd(p))), 'rgba(255,255,255,0.2)');
    text('DASH', db.x, db.y - 2, ready ? C.white : C.gray, 1, 1);
    const s = R.sticks[v.pid];
    if (s) {
      pcirc(s.bx, s.by, STICK_R, 'rgba(27,19,37,0.35)'); pring(s.bx, s.by, STICK_R, 'rgba(255,255,255,0.45)');
      const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy), m = Math.min(dl, STICK_R);
      const kx = dl ? s.bx + dx / dl * m : s.bx, ky = dl ? s.by + dy / dl * m : s.by;
      pcirc(kx, ky, 8, 'rgba(255,255,255,0.55)'); pring(kx, ky, 8, PCOL[v.pid]);
    } else if (!p.moved && R.hintT < 12) {
      const hx = v.x + (db.x < v.x + v.w / 2 ? v.w * 0.7 : v.w * 0.3), hy = v.y + v.h * 0.7;
      ctx.globalAlpha = 0.6; pring(hx, hy, STICK_R, '#fff'); pcirc(hx + Math.cos(R.hintT * 3) * 10, hy + Math.sin(R.hintT * 3) * 6, 7, 'rgba(255,255,255,0.6)'); ctx.globalAlpha = 1;
      text('DRAG TO MOVE', hx, hy + STICK_R + 5, C.white, 1, 1);
    }
  } else if (!p.moved && R.hintT < 10 && !Input.touch && R.state === 'play' && !p.choice) {
    const hint = R.np === 1 ? 'MOVE: WASD / ARROWS / STICK   DASH: SPACE' : (p.id === 0 ? 'MOVE: WASD  DASH: SPACE' : 'MOVE: ARROWS  DASH: ENTER');
    text(hint, v.x + v.w / 2, v.y + v.h - 30, C.white, 1, 1);
    text('YOUR WEAPON AIMS ITSELF!', v.x + v.w / 2, v.y + v.h - 22, C.gold, 1, 1);
  }
}
function drawTopBar() {
  const cx = Math.floor(W / 2);
  // timer / boss countdown
  if (R.mode === 'story' && !R.bossSpawned) {
    const left = Math.max(0, R.level.time - R.t);
    panel(cx - 34, 2, 68, 18, C.ui, OUT, C.uiL);
    text(fmt('BOSS IN {0}', fmtTime(left)), cx, 5, C.white, 1, 1, null);
    bar(cx - 30, 12, 60, 5, R.t / R.level.time, '#e8343b');
  } else {
    panel(cx - 20, 2, 40, 13, C.ui, OUT, C.uiL);
    text(fmtTime(R.t), cx, 6, C.white, 1, 1, null);
  }
  // pause button, then coins to its left
  const half = R.mode === 'story' && !R.bossSpawned ? 34 : 20;
  const pb = { x: cx - half - 16, y: 2 };
  const cw = textW(R.coins) + 14, cxx = pb.x - cw - 3;
  panel(cxx, 2, cw, 13, C.ui, OUT, C.uiL);
  coinIcon(cxx + 3, 5, R.t);
  text(R.coins, cxx + 12, 6, C.gold, 1, 0, null);
  const f = R.ui.isFocus('pause');
  panel(pb.x, pb.y, 13, 13, f ? C.uiSel : C.ui, OUT, C.uiL);
  ctx.fillStyle = C.white; ctx.fillRect(pb.x + 4, pb.y + 4, 2, 5); ctx.fillRect(pb.x + 7, pb.y + 4, 2, 5);
  if (R.state === 'play') R.ui.add('pause', pb.x, pb.y, 13, 13, () => R.pause(), { noFocus: true, silent: true });
}
function drawLevelUp(v) {
  const p = R.players[v.pid];
  if (!p || (!p.choice && !p.picked)) return;
  const paused = cardsPauseAll(), showing = !!p.choice, t = showing ? p.choiceT : CARD_READY;
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  // dim the screen (less when the game keeps running, so you can still see the fight)
  const dim = showing ? (paused ? 0.62 : 0.38) * Math.min(1, t / 0.15) : 0.38 * Math.max(0, 1 - p.picked.t / 0.3);
  ctx.fillStyle = `rgba(15,10,26,${dim.toFixed(2)})`; ctx.fillRect(v.x, v.y, v.w, v.h);
  const rects = cardRects(v), choice = showing ? p.choice : p.picked.choice;
  if (showing) {
    const sc = v.w > 250 ? 2 : 1, k = Ease.outBack(Math.min(1, t / 0.25));
    drawZoomText('LEVEL UP!', v.x + v.w / 2, rects[0].y - 13 - sc * 4, lerp(sc * 3, sc, k), PCOL[p.id]);
    text(paused ? 'PICK AN UPGRADE' : 'PICK ONE - YOU ARE SHIELDED', v.x + v.w / 2, rects[0].y - 9, C.white, 1, 1);
  }
  rects.forEach((r, i) => drawCard(r, choice[i], p, i, t, showing ? p.sel : p.picked.sel, showing ? null : p.picked));
  if (showing) {
    const by = rects[0].y + rects[0].h + 5;
    text(Input.touch ? 'TAP A CARD' : (R.views.length === 1 || p.id === 0 ? '< > TO PICK, DASH TO CHOOSE' : '< > TO PICK, ENTER TO CHOOSE'), v.x + v.w / 2, by, C.gray, 1, 1);
    if (!paused && t > CARD_READY) bar(rects[0].x, by + 8, rects[2].x + rects[2].w - rects[0].x, 4, Math.max(0, 1 - t / CARD_TIME), PCOL[p.id]);
  }
  ctx.restore();
}
// a card slides in face down, turns over, and after the pick the chosen one pops while the others flip back
function drawCard(r, u, p, i, t, sel, picked) {
  let y = r.y, sx = 1, front = true, alpha = 1, lift = 0, grow = 1;
  if (!picked) {
    const kin = clamp((t - i * 0.05) / CARD_IN, 0, 1);
    if (kin <= 0) return;
    y += Math.round((1 - Ease.outBack(kin)) * 36);
    const kf = clamp((t - CARD_IN - i * CARD_STAGGER) / CARD_FLIP, 0, 1);
    front = kf >= 0.5; sx = Math.abs(Math.cos(kf * Math.PI)); lift = -Math.round(Math.sin(kf * Math.PI) * 6);
    if (front && !((p.cardSnd || 0) & (1 << i))) {
      p.cardSnd = (p.cardSnd || 0) | (1 << i);
      if (u.over) { [523, 784, 1046, 1568].forEach((f, j) => tone(f, 0.12, 'square', 0.05, 0, atime(j * 0.05))); noise(0.2, 0.05, 4000); }
      else tone(1100 + i * 140, 0.05, 'square', 0.035, 1500 + i * 160);
    }
    if (kf >= 1 && i === sel && !Input.touch) lift = -3 + Math.round(Math.sin(t * 6));
  } else {
    const k = picked.t / 0.45;
    if (i === picked.sel) { grow = 1 + Ease.outCubic(k) * 0.3; alpha = 1 - k; lift = -Math.round(k * 14); }
    else { const kf = Math.min(1, k * 2.2); front = kf < 0.5; sx = Math.abs(Math.cos(kf * Math.PI)); y += Math.round(Math.max(0, k - 0.45) * 50); alpha = 1 - Math.max(0, k - 0.45) * 1.8; }
  }
  if (alpha <= 0) return;
  const w = Math.max(2, Math.round(r.w * sx * grow)), h = Math.round(r.h * grow);
  const x = Math.round(r.x + r.w / 2 - w / 2), yy = Math.round(y + lift + r.h / 2 - h / 2);
  const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * alpha;
  if (front) drawCardFront(x, yy, w, h, u, p, i, t, !picked && i === sel && !Input.touch, sx > 0.9);
  else drawCardBack(x, yy, w, h, u && u.over, t);
  ctx.globalAlpha = a0;
}
function drawCardBack(x, y, w, h, over = false, t = 0) {
  if (over) { const a = ctx.globalAlpha; ctx.globalAlpha = a * (0.4 + Math.sin(t * 14) * 0.2); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.globalAlpha = a; }
  panel(x, y, w, h, over ? '#5c1a24' : '#3b2a5c', OUT, over ? '#8f2a36' : '#5b3f8f');
  if (w < 8) return;
  ctx.fillStyle = 'rgba(255,210,63,0.55)';
  ctx.fillRect(x + 3, y + 3, w - 6, 1); ctx.fillRect(x + 3, y + h - 4, w - 6, 1); ctx.fillRect(x + 3, y + 3, 1, h - 6); ctx.fillRect(x + w - 4, y + 3, 1, h - 6);
  ctx.fillStyle = 'rgba(157,92,255,0.4)';
  for (let yy = y + 6; yy < y + h - 6; yy += 6) for (let xx = x + 6 + ((yy - y) / 6 % 2) * 3; xx < x + w - 6; xx += 6) ctx.fillRect(xx, yy, 2, 2);
  if (w > 22) drawSpr(ICON.quack, x + w / 2, y + h / 2, false, false, 2);
}
function drawCardFront(x, y, w, h, u, p, i, t, selected, full) {
  const [col, label] = CARD_STYLE[cardKind(u.k)];
  if (u.over) { // overcharge: pulsing red glow and sparks running around the edge
    const a = ctx.globalAlpha;
    for (let g = 3; g >= 1; g--) { ctx.globalAlpha = a * (0.16 + Math.sin(t * 9) * 0.06) * (4 - g) / 2; ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x - g * 2, y - g * 2, w + g * 4, h + g * 4); }
    ctx.globalAlpha = a;
  }
  if (selected) { const a = ctx.globalAlpha; ctx.globalAlpha = a * (0.35 + Math.sin(t * 8) * 0.15); ctx.fillStyle = PCOL[p.id]; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.globalAlpha = a; }
  // the card: a shadow, an outline, a body that gets darker towards the bottom, and a thin inner frame in the card's colour
  const body = u.over ? (selected ? '#5a1824' : '#3d1019') : selected ? '#3a2c5e' : '#2a2140';
  ctx.fillStyle = 'rgba(8,5,14,0.5)'; ctx.fillRect(x + 2, y + h, w - 2, 3);
  panel(x, y, w, h, body, u.over ? '#ff3b3b' : selected ? PCOL[p.id] : OUT, null, false);
  if (w < 6) return;
  const steps = 4;
  for (let s = 1; s < steps; s++) { ctx.fillStyle = shade(body, -0.12 * s); ctx.fillRect(x + 1, Math.round(y + 11 + (h - 12) * s / steps), w - 2, Math.ceil((h - 12) / steps)); }
  if (full) {
    const fr = shade(col, -0.35);
    ctx.fillStyle = fr; ctx.fillRect(x + 2, y + 12, 1, h - 14); ctx.fillRect(x + w - 3, y + 12, 1, h - 14); ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillStyle = col; for (const [cx2, cy2] of [[x + 2, y + h - 3], [x + w - 3, y + h - 3]]) ctx.fillRect(cx2, cy2, 1, 1); // little studs in the corners
    if (selected) { // a glint sliding across the chosen card
      const k = (t * 0.7) % 1.4, gx = x - 12 + k / 1.4 * (w + 36);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 2); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < h; i++) ctx.fillRect(Math.round(gx - i * 0.5), y + i, 5, 1);
      ctx.restore();
    }
  }
  if (u.over && full) for (let s = 0; s < 4; s++) { // sparks chase each other around the border
    const k = ((t * 0.9 + s / 4) % 1) * 2 * (w + h), px = k < w ? x + k : k < w + h ? x + w - 1 : k < 2 * w + h ? x + w - 1 - (k - w - h) : x, py = k < w ? y : k < w + h ? y + (k - w) : k < 2 * w + h ? y + h - 1 : y + h - 1 - (k - 2 * w - h);
    ctx.fillStyle = s % 2 ? '#ffd23f' : '#ffffff'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
  }
  // the header band in the card's colour, with a shine on top and a darker edge below
  ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, w - 2, 9);
  ctx.fillStyle = shade(col, 0.4); ctx.fillRect(x + 2, y + 1, w - 4, 1);
  ctx.fillStyle = shade(col, -0.35); ctx.fillRect(x + 1, y + 10, w - 2, 1);
  if (!full) return;
  text(label, x + w / 2, y + 3, OUT, 1, 1, null);
  const cx = x + w / 2, iy = y + 22;
  // the icon sits in a glowing medallion
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * (0.18 + Math.sin(t * 3 + i) * 0.06); pcirc(cx, iy, 13, col); ctx.globalAlpha = ga;
  pcirc(cx, iy, 10, OUT); pcirc(cx, iy, 9, shade(col, -0.7)); pcirc(cx, iy - 2, 6, shade(col, -0.55)); pring(cx, iy, 9, col); pring(cx, iy, 8, shade(col, -0.3));
  drawSpr(ICON[u.over || u.k] || ART.heart, cx, iy + Math.round(Math.sin(t * 4 + i)), false, false, 2);
  if (u.over && (t * 6 | 0) % 2) pring(cx, iy, 11, '#ffd23f');
  let ty = y + 35;
  for (const ln of wrapText(u.name, w - 6)) { text(ln, cx, ty, u.over ? '#ff8080' : C.gold, 1, 1, 'shadow', '#120c1f'); ty += 7; }
  const l = lvl(p, u.k);
  if (u.over) { const nw = textW('MAX+') + 6; panel(Math.round(cx - nw / 2), ty - 1, nw, 8, '#ff3b3b', OUT, null, false); text('MAX+', cx, ty, '#fff8e7', 1, 1, null); ty += 10; }
  else if (u.k !== 'snack') {
    if (!l) { const nw = textW('NEW!') + 6; panel(Math.round(cx - nw / 2), ty - 1, nw, 8, C.pink, OUT, null, false); text('NEW!', cx, ty, OUT, 1, 1, null); }
    else { // one pip per level, the level you're about to get blinks
      const pw = u.max * 4 - 1, px0 = Math.round(cx - pw / 2);
      for (let j = 0; j < u.max; j++) { ctx.fillStyle = j < l ? col : j === l ? ((t * 4 | 0) % 2 ? '#ffffff' : col) : '#1f1830'; ctx.fillRect(px0 + j * 4, ty + 1, 3, 3); }
    }
    ty += 10;
  }
  for (const ln of wrapText(u.d(l), w - 6)) { if (ty < y + h - 6) text(ln, cx, ty, C.white, 1, 1, null); ty += 7; }
}
