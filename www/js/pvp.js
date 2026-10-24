'use strict';
/* QUACK ATTACK! — PvP: duck against duck. Two ducks on one device (split screen) or 2-4 online.
 * Here you aim yourself. Every duck gets an invisible stand-in in R.enemies (e.duck = the duck), so every
 * weapon (beams, explosions, homing bees, the sword...) hits other ducks the same way it hits robots;
 * hurtEnemy() hands those hits to pvpHit(). Also here: the PvP setup screen and the lobby's mode picker. */

const PVP_HALF = 230; // the arena is 460 x 460, fenced in
const PVP_GOAL = 10; // KOs to win
const PVP_GOALS = [5, 10, 15];
const PVP_TIME = 180; // seconds; then most KOs wins
const PVP_RESPAWN = 3;
const PVP_DPS = 30; // every weapon is tuned to about this much damage per second (100 HP each)
const PVP_ARENAS = ['pond', 'beach', 'candy', 'moon', 'crystal', 'castle', 'west', 'neon', 'circus', 'cyber'];
// keyboard: shoot towards where you walk (two ducks on one keyboard); one duck alone aims with the arrows or the mouse
const PVP_FIRE = { p1: ['KeyF', 'KeyG', 'KeyE'], p2: ['Period', 'Comma', 'KeyL', 'ControlRight', 'Numpad1'] };
const PVP_CROWN = spr(['y.y.y', 'yyyyy', 'yYyYy'], { y: '#ffd23f', Y: '#e8343b' });
MENU_ICON.pvp = spr(['w...w', '.w.w.', '..w..', '.w.w.', 'w...w'], { w: '#ffd1e6' }); // crossed swords, more or less
const pname = p => (R.online ? keep(p.name) : 'P' + (p.id + 1));
const arenaName = w => { const lv = LEVELS.find(l => l.world === w); return lv ? lv.name : w.toUpperCase(); };

// how hard each weapon hits a duck: fast or many-bullet weapons less per hit, slow big ones more
const pvpMulCache = {};
function pvpMul(w) {
  if (pvpMulCache[w] !== undefined) return pvpMulCache[w];
  const wd = WEAPONS[w] || WEAPONS.blaster;
  let dps = wd.dmg * (wd.n || 1) / wd.cd;
  if ((wd.n || 1) > 1) dps *= 0.7; // not every pellet hits
  if (wd.melee) dps *= 0.7; // you have to get close
  return (pvpMulCache[w] = clamp(PVP_DPS / dps, 0.15, 3) * (PVP_TUNE[w] || 1));
}
// weapons that do more than their numbers say (they hit again on the way back, pull you in, explode, home in...)
const PVP_TUNE = { rang: 0.4, vortex: 0.35, rocket: 0.7, sniper: 0.85, tesla: 0.8, bees: 0.8, mine: 1.3 };
function pvpStart(id, np) { const a = id / np * TAU + Math.PI / 4; return [Math.cos(a) * 150, Math.sin(a) * 150]; }

// ---------------------------------------------------------------- the match (offline, or on the host)
function pvpBegin() {
  R.heartT = 8; R.warned = false;
  R.proxies = R.players.map(p => ({ id: R.uid++, type: 'duck', duck: p, d: { name: 'DUCK', heavy: 1, fx: 'metal' }, x: p.x, y: p.y - 5, r: 6,
    hp: 1, maxHp: 1, kx: 0, ky: 0, z: 0, spawnT: 0, flash: 0, eggCd: 0, dead: false, anim: 0 }));
  R.enemies.push(...R.proxies);
  for (const p of R.players) { p.kills = 0; p.deaths = 0; p.iframes = 1.5; }
  banner(fmt('FIRST TO {0} KOs!', R.goal), C.gold, 2.6, 'AIM AND SHOOT YOURSELF!');
  sfx.quack(1); sfx.quack(1.2);
}
// keep each duck's stand-in on the duck (and pass on what weapons did to it: black hole pulls, frost)
function pvpSync() {
  for (const e of R.proxies || []) {
    const p = e.duck;
    if (e.sx !== undefined && !p.down) { p.x = clampPX(p.x + (e.x - e.sx) * 0.6); p.y = clampPY(p.y + (e.y - e.sy) * 0.6); }
    if (e.slowT > 0) { p.slowT = Math.max(p.slowT || 0, e.slowT); e.slowT = 0; }
    e.x = e.sx = p.x; e.y = e.sy = p.y - 5;
    e.spawnT = p.down || p.gone || p.dashT > 0 || p.iframes > 0 ? 1 : 0; // dashing or just respawned: shots fly through
  }
}
function pvpHit(p, dmg, kx, ky, kb, att) {
  if (!att || att === p || !att.lo || p.down || p.gone || R.state !== 'play' || p.iframes > 0 || p.dashT > 0) return;
  dmg *= pvpMul(att.weapon);
  p.hp -= dmg; p.hurtFlash = 0.2; p.squash = 0.15;
  if (kb) { p.x = clampPX(p.x + kx * kb * 0.05); p.y = clampPY(p.y + ky * kb * 0.05); }
  floatText(p.x + rand(-3, 3), p.y - 18, Math.max(1, Math.round(dmg)), dmg >= 25 ? C.gold : C.white, 0.45);
  if (R.t - (p.hurtSnd || -1) > 0.09) { p.hurtSnd = R.t; sfx.hurt(); }
  shakeFor(p, 2);
  burst(p.x, p.y - 5, ['#fff8e7', PCOL[p.id]], 2, 40, 0.25);
  if (p.hp <= 0) pvpKO(p, att);
}
function pvpKO(p, att) {
  p.hp = 0; p.down = true; p.reviveT = PVP_RESPAWN; p.deaths = (p.deaths || 0) + 1; att.kills++;
  impactAt('big', p.x, p.y); sfx.clank(); sfx.quack(0.7);
  burst(p.x, p.y - 4, ['#fff8e7', '#ffd23f', PCOL[p.id]], 22, 100, 0.6);
  banner(fmt("{0} KO'D {1}!", pname(att), pname(p)), PCOL[att.id], 1.8);
  floatText(att.x, att.y - 22, 'KO!', C.gold, 1);
  if (att.kills >= R.goal) pvpEnd();
}
function pvpDownTick(p, dt) {
  p.reviveT -= dt;
  if (p.reviveT <= 0 && R.state === 'play' && !p.gone) pvpRespawn(p);
}
function pvpRespawn(p) {
  // the free spot furthest from everyone else
  const others = R.players.filter(o => o !== p && !o.down && !o.gone), m = WORLD_SIZE / 2, lim = PVP_HALF - 30;
  let best = null, bd = -1;
  for (let i = 0; i < 12; i++) {
    const x = m + rand(-lim, lim), y = m + rand(-lim, lim);
    const d = others.length ? Math.min(...others.map(o => d2(x, y, o.x, o.y))) : 1;
    if (d > bd) { bd = d; best = [x, y]; }
  }
  p.x = best[0]; p.y = best[1]; p.hp = p.maxHp; p.down = false; p.reviveT = 0; p.iframes = 1.5; p.dashT = 0; p.slowT = 0; p.squash = 0.3;
  R.fx.push({ k: 'ring', x: p.x, y: p.y - 4, r: 20, t: 0, dur: 0.35, col: PCOL[p.id] });
  burst(p.x, p.y - 4, ['#fff8e7', PCOL[p.id]], 14, 70, 0.5); sfx.revive();
}
function pvpTick(dt) {
  for (const p of R.players) p.slowT = Math.max(0, (p.slowT || 0) - dt);
  const left = PVP_TIME - R.t;
  if (left <= 30 && !R.warned) { R.warned = true; banner('30 SECONDS LEFT!', C.red, 2); }
  if (left <= 0 || (R.online && R.players.filter(p => !p.gone).length < 2)) { pvpEnd(); return; }
  // hearts drop into the arena now and then
  R.heartT -= dt;
  if (R.heartT <= 0) {
    R.heartT = 9;
    if (R.items.filter(k => k.k === 'heart').length < 2) { const m = WORLD_SIZE / 2, l = PVP_HALF - 25; R.items.push({ k: 'heart', x: m + rand(-l, l), y: m + rand(-l, l), t: 0 }); }
  }
}
function pvpEnd() {
  if (R.state !== 'play') return;
  const order = R.players.filter(p => !p.gone).sort((a, b) => b.kills - a.kills || (a.deaths || 0) - (b.deaths || 0));
  const top = order[0], tie = !top || (order[1] && order[1].kills === top.kills && (order[1].deaths || 0) === (top.deaths || 0));
  const pay = {};
  for (const p of R.players) pay[p.id] = p.gone ? 0 : 10 + 5 * p.kills + (!tie && p === top ? 40 : 0);
  R.results = { pvp: true, rank: order.map(p => [p.id, p.kills, p.deaths || 0]), win: tie ? -1 : top.id, pay, coins: 0, bonus: 0, shown: 0, t: R.t };
  pvpPay(R.results);
  R.state = 'results'; R.stateT = 0; Music.paused = false;
  sfx.win(); Music.play('title');
}
// coins for the ducks on this device
function pvpPay(res) {
  const mine = R.online ? [R.localPid] : R.players.map(p => p.id);
  let n = 0; for (const id of mine) n += res.pay[id] || 0;
  if (n > 0) Save.addCoins(n);
}
// a friend's device: the match is over
const _resultsReached = GameScene.prototype.resultsReached;
GameScene.prototype.resultsReached = function (res) {
  if (res && res.pvp) { pvpPay(res); sfx.win(); Music.play('title'); return; }
  _resultsReached.call(this, res);
};
const _drawPauseLoot = GameScene.prototype.drawPauseLoot;
GameScene.prototype.drawPauseLoot = function (y) { if (!this.pvp) _drawPauseLoot.call(this, y); };

// ---------------------------------------------------------------- aiming
// what this device's player is doing with the aim controls: { ang (or null), fire, dist (mouse distance) }
function localAim(p, mv, solo) {
  let ang = null, fire = false, dist = 0;
  const pads = solo ? Input.pads : (Input.pads[p.id] ? [Input.pads[p.id]] : []);
  for (const q of pads) if (q.rx || q.ry) { ang = Math.atan2(q.ry, q.rx); fire = true; } // right stick
  const s = R.aimSticks[p.id];
  if (s) { const dx = s.x - s.bx, dy = s.y - s.by; if (Math.hypot(dx, dy) > 3) ang = Math.atan2(dy, dx); fire = true; } // touch: right side of the screen
  if (solo) { // arrow keys aim (WASD walks)
    let x = 0, y = 0;
    if (Input.anyHeld(['ArrowLeft'])) x--; if (Input.anyHeld(['ArrowRight'])) x++; if (Input.anyHeld(['ArrowUp'])) y--; if (Input.anyHeld(['ArrowDown'])) y++;
    if (x || y) { ang = Math.atan2(y, x); fire = true; }
  }
  if (Input.anyHeld(solo ? [...PVP_FIRE.p1, ...PVP_FIRE.p2] : PVP_FIRE[p.id ? 'p2' : 'p1'])) { fire = true; if (ang === null && (mv.x || mv.y)) ang = Math.atan2(mv.y, mv.x); }
  if ((solo || p.id === 0) && Input.device === 'mouse' && Input.mouse) { // the mouse: aim at it, hold the button to shoot
    const v = R.views.find(q => q.pid === p.id);
    if (v) {
      const dx = Input.mouse.x - (v.x + p.x - v.camX), dy = Input.mouse.y - (v.y + p.y - 5 - v.camY);
      if (dx || dy) { ang = Math.atan2(dy, dx); dist = Math.hypot(dx, dy); }
      if (Input.mouseDown) fire = true;
    }
  }
  if (ang === null && !fire && (mv.x || mv.y)) ang = Math.atan2(mv.y, mv.x); // not shooting: the aim follows your walk
  return { ang, fire, dist };
}
function pvpAimFire(p, mv, dt) {
  let a;
  if (netRemote(p.id)) { const r = Net.inputs[p.id]; a = { ang: Number.isFinite(r.aim) ? r.aim : null, fire: !!r.fire, dist: r.dist || 0 }; }
  else a = localAim(p, mv, R.online || R.np === 1);
  if (a.ang !== null) { p.aim = a.ang; p.ax = Math.cos(p.aim); p.ay = Math.sin(p.aim); }
  p.firing = a.fire;
  // face where you shoot, or else where you walk
  const fx = a.fire ? p.ax : (p.moving ? mv.x : 0), fy = a.fire ? p.ay : (p.moving ? mv.y : 0);
  if (fx || fy) {
    let nf = p.facing;
    if (Math.abs(fx) > Math.abs(fy) * 1.15) nf = fx < 0 ? 'left' : 'right';
    else if (Math.abs(fy) > Math.abs(fx) * 1.15) nf = fy < 0 ? 'up' : 'down';
    if (nf !== p.facing) { p.facing = nf; p.turnT = 0.14; }
  }
  if (R.state !== 'play') return;
  const range = WEAPONS[p.weapon].range * reachMul(p), d = a.dist ? clamp(a.dist, 24, range) : range * 0.75;
  fireWeapons(p, dt, a.fire ? { x: p.x + p.ax * d, y: p.y + p.ay * d, spot: true } : null);
}
// lightning needs something to hit: the closest other duck roughly where you aim
function pvpConeTarget(p, ang, range) {
  let best = null, bd = range * range;
  for (const e of R.proxies || []) {
    if (e.duck === p || e.spawnT > 0) continue;
    const dd = d2(p.x, p.y, e.x, e.y); if (dd > bd) continue;
    let da = Math.atan2(e.y - p.y, e.x - p.x) - ang; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < 0.45) { bd = dd; best = e; }
  }
  return best;
}
// touch: left side of your screen walks, right side aims and shoots; a mouse click just shoots
function pvpPointerDown(ev, v, pid) {
  if (ev.ptype === 'mouse') return true;
  if (ev.x > v.x + v.w * 0.5) { if (!R.aimSticks[pid]) R.aimSticks[pid] = { id: ev.id, bx: ev.x, by: ev.y, x: ev.x, y: ev.y }; }
  else if (!R.sticks[pid]) R.sticks[pid] = { id: ev.id, bx: ev.x, by: ev.y, x: ev.x, y: ev.y };
  return true;
}

// ---------------------------------------------------------------- drawing
function drawArena(cx, cy, vw, vh) {
  const a = WORLD_SIZE / 2 - PVP_HALF - 6, b = WORLD_SIZE / 2 + PVP_HALF + 6;
  ctx.fillStyle = 'rgba(15,10,26,0.45)'; // outside the fence is darker
  ctx.fillRect(cx, cy, vw, Math.max(0, a - cy)); ctx.fillRect(cx, b, vw, Math.max(0, cy + vh - b));
  ctx.fillRect(cx, a, Math.max(0, a - cx), b - a); ctx.fillRect(b, a, Math.max(0, cx + vw - b), b - a);
  // the fence: rails and posts
  ctx.fillStyle = '#5c3416'; ctx.fillRect(a, a - 2, b - a, 2); ctx.fillRect(a, b, b - a, 2); ctx.fillRect(a - 2, a, 2, b - a); ctx.fillRect(b, a, 2, b - a);
  ctx.fillStyle = '#c98b4a'; ctx.fillRect(a, a - 4, b - a, 1); ctx.fillRect(a, b - 2, b - a, 1);
  for (let x = a; x <= b; x += 16) { ctx.fillStyle = OUT; ctx.fillRect(x - 1, a - 7, 3, 7); ctx.fillRect(x - 1, b - 5, 3, 7); ctx.fillStyle = '#a0683a'; ctx.fillRect(x, a - 6, 1, 5); ctx.fillRect(x, b - 4, 1, 5); }
  for (let y = a; y <= b; y += 16) { ctx.fillStyle = OUT; ctx.fillRect(a - 3, y - 4, 3, 6); ctx.fillRect(b, y - 4, 3, 6); ctx.fillStyle = '#a0683a'; ctx.fillRect(a - 2, y - 3, 1, 4); ctx.fillRect(b + 1, y - 3, 1, 4); }
}
// a knocked-out duck: a little ghost egg and the respawn countdown
function drawPvpDown(p) {
  if (p.gone) return;
  const set = duckSet(p.lo.skin);
  drawSprX(set.egg, p.x, p.y + Math.round(Math.sin(p.anim * 3)), { ay: 1, alpha: 0.5 });
  text(String(Math.max(1, Math.ceil(p.reviveT))), p.x, p.y - 20, PCOL[p.id], 1, 1);
}
// where this device's duck is aiming
function drawAimMark(p) {
  if (p.down || !R.viewPids.includes(p.id) || R.state !== 'play') return;
  const ax = Math.cos(p.aim), ay = Math.sin(p.aim), y0 = p.y - 5;
  ctx.fillStyle = PCOL[p.id];
  for (let i = 0; i < 3; i++) { const d = 12 + i * 6; ctx.fillRect(Math.round(p.x + ax * d), Math.round(y0 + ay * d), 1, 1); }
  const x = Math.round(p.x + ax * 34), y = Math.round(y0 + ay * 34);
  ctx.globalAlpha = p.firing ? 1 : 0.6;
  ctx.fillRect(x - 3, y, 2, 1); ctx.fillRect(x + 2, y, 2, 1); ctx.fillRect(x, y - 3, 1, 2); ctx.fillRect(x, y + 2, 1, 2);
  ctx.globalAlpha = 1;
}
function drawPvpTopBar() {
  const cx = Math.floor(W / 2), left = Math.max(0, PVP_TIME - R.t);
  panel(cx - 20, 2, 40, 13, C.ui, OUT, C.uiL);
  text(fmtTime(left), cx, 6, left < 30 && (R.t * 4 | 0) % 2 ? C.red : C.white, 1, 1, null);
  // the score: one chip per duck, the leader's chip has a crown
  const ps = R.players.filter(p => !p.gone), cw = 26, x0 = Math.floor(cx - (ps.length * (cw + 2) - 2) / 2), lead = Math.max(...ps.map(p => p.kills));
  ps.forEach((p, i) => {
    const x = x0 + i * (cw + 2);
    panel(x, 17, cw, 11, C.uiD, PCOL[p.id], null, false);
    text(String(p.kills), x + cw / 2, 19, p.kills === lead && lead > 0 ? C.gold : C.white, 1, 1, null);
    if (p.kills === lead && lead > 0) drawSprX(PVP_CROWN, x + 4, 18, {});
  });
  text(fmt('FIRST TO {0}', R.goal), cx, 30, C.gray, 1, 1, null);
  // pause button
  const pb = { x: cx - 38, y: 2 }, f = R.ui.isFocus('pause');
  panel(pb.x, pb.y, 13, 13, f ? C.uiSel : C.ui, OUT, C.uiL);
  ctx.fillStyle = C.white; ctx.fillRect(pb.x + 4, pb.y + 4, 2, 5); ctx.fillRect(pb.x + 7, pb.y + 4, 2, 5);
  if (R.state === 'play') R.ui.add('pause', pb.x, pb.y, 13, 13, () => R.pause(), { noFocus: true, silent: true });
  // touch: the aim stick, or a hint where it is
  if (Input.touch && R.state === 'play') for (const v of R.views) {
    const s = R.aimSticks[v.pid];
    if (s) {
      pcirc(s.bx, s.by, STICK_R, 'rgba(232,52,59,0.25)'); pring(s.bx, s.by, STICK_R, 'rgba(255,140,140,0.6)');
      const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy), m = Math.min(dl, STICK_R);
      pcirc(dl ? s.bx + dx / dl * m : s.bx, dl ? s.by + dy / dl * m : s.by, 7, 'rgba(255,200,200,0.7)');
    } else if (R.hintT < 10) {
      const hx = v.x + v.w * 0.75, hy = v.y + v.h * 0.6;
      ctx.globalAlpha = 0.5; pring(hx, hy, STICK_R, '#ff8080'); ctx.globalAlpha = 1;
      text('DRAG HERE TO AIM', hx, hy + STICK_R + 5, '#ff8080', 1, 1);
      text('DRAG HERE TO MOVE', v.x + v.w * 0.25, hy + STICK_R + 5, C.white, 1, 1);
    }
  }
  if (!Input.touch && R.hintT < 8 && R.state === 'play') {
    const solo = R.online || R.np === 1;
    for (const v of R.views) text(solo ? 'WASD: MOVE   MOUSE / ARROWS: AIM + SHOOT   SPACE: DASH' : v.pid ? 'ARROWS: MOVE   . : SHOOT   ENTER: DASH' : 'WASD: MOVE   F: SHOOT   SPACE: DASH', v.x + v.w / 2, v.y + v.h - 24, C.white, 1, 1);
  }
}
GameScene.prototype.drawPvpResults = function () {
  const r = this.results, k = Math.min(1, this.stateT / 0.4);
  ctx.fillStyle = `rgba(15,10,26,${0.8 * k})`; ctx.fillRect(0, 0, W, H);
  const rows = r.rank.length, pw = Math.min(W - 16, 250), ph = Math.min(H - 8, 76 + rows * 18);
  const px = Math.floor(W / 2 - pw / 2), py = Math.floor(H / 2 - ph / 2 + (1 - Ease.outBack(k)) * 40);
  panel(px, py, pw, ph, C.uiD, OUT, C.uiL);
  const win = this.players[r.win], me = this.online ? this.localPid : -1;
  const title = r.win < 0 ? 'DRAW!' : me === r.win ? 'YOU WIN!' : fmt('{0} WINS!', pname(win));
  text(title, W / 2, py + 7, r.win < 0 ? C.white : PCOL[r.win] || C.gold, pw > 200 ? 3 : 2, 1, 'outline');
  let y = py + 38;
  text('KO', px + pw - 74, y - 9, C.gray, 1, 1, null); text("KO'D", px + pw - 48, y - 9, C.gray, 1, 1, null); text('COINS', px + pw - 18, y - 9, C.gray, 1, 1, null);
  r.rank.forEach(([id, ko, dd], i) => {
    const p = this.players[id]; if (!p) return;
    panel(px + 6, y, pw - 12, 16, id === me ? '#3d2f63' : C.ui, OUT, null, false);
    text(String(i + 1), px + 13, y + 5, i === 0 && r.win >= 0 ? C.gold : C.gray, 1, 1, null);
    const hop = i === 0 && r.win >= 0 ? Math.round(Math.abs(Math.sin(p.anim * 7)) * -3) : 0;
    drawDuck(px + 28, y + 14 + hop, { skin: p.lo.skin, hat: p.lo.hat, halo: p.lo.halo, facing: 'down', t: p.anim, blink: p.blinkT < 0 });
    text(pname(p), px + 40, y + 5, PCOL[id], 1, 0, null);
    text(String(ko), px + pw - 74, y + 5, C.white, 1, 1, null);
    text(String(dd), px + pw - 48, y + 5, C.white, 1, 1, null);
    text('+' + (r.pay[id] || 0), px + pw - 18, y + 5, C.gold, 1, 1, null);
    y += 18;
  });
  const ui = this.resUI; ui.begin();
  const btns = this.online ? this.onlineResultButtons() : [
    ['again', 'REMATCH', () => Trans.go(() => Scenes.set(new GameScene({ mode: 'pvp', np: this.np, world: this.world, goal: this.goal })))],
    ['menu', 'MENU', () => Trans.go(() => Scenes.set(new TitleScene(true)))]];
  const bw = 80, bh = 15, by = py + ph - bh - 6, tw = btns.length * bw + (btns.length - 1) * 5;
  btns.forEach(([id, label, on], i) => drawButton(ui, id, Math.floor(W / 2 - tw / 2) + i * (bw + 5), by, bw, bh, label, { on, def: i === 0 }));
};

// ---------------------------------------------------------------- arena cards (PvP setup and the lobby picker)
function drawArenaCards(ui, y, sel, onPick, t) {
  const cols = W >= 360 ? 5 : 4, gap = 4, cw = Math.min(84, Math.floor((W - 16 - gap * (cols - 1)) / cols)), ch = 30;
  const x0 = Math.floor(W / 2 - (cols * cw + (cols - 1) * gap) / 2);
  PVP_ARENAS.filter(w => WORLD_THEME[w]).forEach((w, i) => {
    const x = x0 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap), th = WORLD_THEME[w], on = w === sel, f = ui.isFocus('ar_' + w);
    panel(x, yy, cw, ch, th.ground[0], on ? C.gold : f ? C.white : OUT, null, false);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, yy + 1, cw - 2, ch - 2); ctx.clip();
    ctx.fillStyle = th.ground[1]; for (let k = 0; k < 6; k++) ctx.fillRect(x + 4 + ((k * 37) % (cw - 8)), yy + 4 + ((k * 13) % 12), 3, 2);
    const deco = Object.keys(th.deco || {}).filter(k => DECO_ART[k]).slice(0, 3);
    deco.forEach((k, j) => drawSpr(DECO_ART[k], x + 10 + j * Math.floor((cw - 20) / 2), yy + 10));
    const tall = Object.keys(th.tall || {}).find(k => DECO_ART[k]);
    if (tall) drawSprX(DECO_ART[tall], x + cw - 10, yy + 18, { ay: 1 });
    ctx.fillStyle = 'rgba(15,10,26,0.65)'; ctx.fillRect(x + 1, yy + ch - 10, cw - 2, 9);
    text(arenaName(w), x + cw / 2, yy + ch - 9, on ? C.gold : C.white, 1, 1, null);
    ctx.restore();
    if (on) { const b = Math.round(Math.sin(t * 6)); drawSprX(PVP_CROWN, x + cw - 6, yy + 4 + b, {}); }
    ui.add('ar_' + w, x, yy, cw, ch, () => { sfx.uiMove(); onPick(w); }, { def: on });
  });
  return y + Math.ceil(PVP_ARENAS.length / cols) * (ch + gap);
}
function drawGoalButtons(ui, y, goal, onPick) {
  text('FIRST TO', W / 2 - 74, y + 4, C.white, 1, 2);
  PVP_GOALS.forEach((g, i) => drawButton(ui, 'goal' + g, Math.floor(W / 2 - 68 + i * 46), y, 42, 14, fmt('{0} KOs', g), { on: () => onPick(g), col: g === goal ? '#8a1f5c' : C.ui, tcol: g === goal ? C.gold : undefined }));
}

// ---------------------------------------------------------------- PvP setup (from the title screen)
class PvpScene {
  constructor() { this.T = 0; this.ui = new UI(); this.arena = PVP_ARENAS.includes(Save.data.pvpArena) ? Save.data.pvpArena : 'pond'; this.goal = PVP_GOALS.includes(Save.data.pvpGoal) ? Save.data.pvpGoal : PVP_GOAL; Music.play('calm'); }
  save() { Save.data.pvpArena = this.arena; Save.data.pvpGoal = this.goal; Save.write(); }
  update(dt) {
    this.T += dt;
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); Trans.go(() => Scenes.pop()); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker(); this.ui.begin();
    text('DUCK VS DUCK', W / 2, 4, '#ff6fae', 2, 1, 'outline');
    text('PVP: AIM AND SHOOT YOURSELF. MOST KOs WINS!', W / 2, 20, C.white, 1, 1);
    // two ducks facing off
    const bob = i => Math.round(Math.sin(this.T * 6 + i * 2) * 1.5);
    [0, 1].forEach(i => { const lo = Save.data.loadout[i] || Save.data.loadout[0]; drawDuck(i ? W - 24 : 24, 22 + bob(i), { skin: lo.skin, hat: lo.hat, halo: lo.halo, weapon: lo.weapon, facing: i ? 'left' : 'right', aim: i ? Math.PI : 0, t: this.T, sc: 2 }); });
    text('ARENA', W / 2, 32, C.gold, 1, 1);
    let y = drawArenaCards(this.ui, 41, this.arena, w => { this.arena = w; this.save(); }, this.T) + 2;
    drawGoalButtons(this.ui, y, this.goal, g => { this.goal = g; this.save(); sfx.uiMove(); });
    y += 19;
    text(Input.touch ? 'LEFT SIDE: MOVE   RIGHT SIDE: AIM + SHOOT' : 'P1: WASD + F (SHOOT) + SPACE   P2: ARROWS + . (SHOOT) + ENTER', W / 2, y, C.gray, 1, 1, null);
    text('GAMEPADS: LEFT STICK MOVES, RIGHT STICK AIMS + SHOOTS', W / 2, y + 9, C.gray, 1, 1, null);
    const by = H - 18;
    drawButton(this.ui, 'local', Math.floor(W / 2 - 128), by, 98, 15, '2 DUCKS HERE', { def: true, col: '#8a1f5c', on: () => Trans.go(() => Scenes.set(new GameScene({ mode: 'pvp', np: 2, world: this.arena, goal: this.goal }))) });
    drawButton(this.ui, 'online', Math.floor(W / 2 - 26), by, 82, 15, 'ONLINE', { col: '#1f6b3a', icon: MENU_ICON.online, on: () => Trans.go(() => Scenes.set(new OnlineScene('HOST A LOBBY, THEN PICK PVP'))) });
    drawButton(this.ui, 'back', Math.floor(W / 2 + 60), by, 66, 15, 'BACK', { icon: ICON.back, on: () => Trans.go(() => Scenes.pop()) });
  }
}

// ---------------------------------------------------------------- the lobby's mode picker (the host's screen)
class ModePickScene {
  constructor(room) {
    this.T = 0; this.ui = new UI();
    this.tab = room.mode === 'pvp' ? 'pvp' : room.mode === 'endless' ? 'endless' : 'story';
    this.page = CHAPTERS.findIndex(c => room.level >= c.from && room.level <= c.to); if (this.page < 0) this.page = 0;
    this.arena = room.arena || 'pond'; this.goal = room.goal || PVP_GOAL;
  }
  pick(o) { Net.send(Object.assign({ t: 'set' }, o)); sfx.uiMove(); Trans.go(() => Scenes.pop()); }
  update(dt) {
    this.T += dt;
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); Trans.go(() => Scenes.pop()); return; }
    if (this.tab === 'story' && (acts.left || acts.right) && !this.ui.focus) this.turn(acts.left ? -1 : 1);
    this.ui.update(dt, acts);
    if (!Net.room) Scenes.pop();
  }
  turn(d) { this.page = (this.page + d + CHAPTERS.length) % CHAPTERS.length; sfx.uiMove(); }
  draw() {
    drawChecker(); this.ui.begin();
    const room = Net.room; if (!room) return;
    text('WHAT DO WE PLAY?', W / 2, 4, C.gold, 2, 1, 'outline');
    const tabs = [['story', 'STORY', '#4b3a92'], ['endless', 'ENDLESS', '#1f5c7a'], ['pvp', 'PVP', '#8a1f5c']], tw = 70;
    tabs.forEach(([id, label, col], i) => drawButton(this.ui, 'tab_' + id, Math.floor(W / 2 - (tabs.length * (tw + 4) - 4) / 2) + i * (tw + 4), 20, tw, 14, label,
      { col: this.tab === id ? col : C.ui, tcol: this.tab === id ? C.gold : C.gray, on: () => { this.tab = id; sfx.uiMove(); } }));
    if (this.tab === 'story') this.drawStory(room);
    else if (this.tab === 'endless') this.drawEndless(room);
    else this.drawPvp();
    drawButton(this.ui, 'back', 4, H - 17, 50, 14, 'BACK', { icon: ICON.back, on: () => Trans.go(() => Scenes.pop()) });
  }
  // one chapter at a time: a card per level with its boss
  drawStory(room) {
    const ch = CHAPTERS[this.page];
    drawButton(this.ui, 'prev', 6, 40, 16, 16, '<', { on: () => this.turn(-1) });
    drawButton(this.ui, 'next', W - 22, 40, 16, 16, '>', { on: () => this.turn(1) });
    text(ch.title, W / 2, 44, C.white, 1, 1, 'outline');
    text(fmt('CHAPTER {0} OF {1}', this.page + 1, CHAPTERS.length), W / 2, 53, C.gray, 1, 1, null);
    const n = ch.to - ch.from + 1, gap = 4, cols = (W - 16) / n >= 64 ? n : 3, rows = Math.ceil(n / cols); // narrow screens: two rows
    const cw = Math.min(86, Math.floor((W - 16 - gap * (cols - 1)) / cols)), chh = Math.min(96, Math.floor((H - 92) / rows) - gap), x0 = Math.floor(W / 2 - (cols * cw + (cols - 1) * gap) / 2);
    for (let i = 0; i < n; i++) {
      const lv = LEVELS[ch.from - 1 + i], x = x0 + (i % cols) * (cw + gap), y = 64 + Math.floor(i / cols) * (chh + gap), th = WORLD_THEME[lv.world], on = room.mode === 'story' && room.level === lv.n, f = this.ui.isFocus('lv' + lv.n);
      panel(x, y, cw, chh, th.ground[0], on ? C.gold : f ? C.white : OUT, null, false);
      ctx.fillStyle = 'rgba(15,10,26,0.55)'; ctx.fillRect(x + 1, y + 1, cw - 2, 12); ctx.fillRect(x + 1, y + chh - 25, cw - 2, 24);
      text(String(lv.n), x + cw / 2, y + 3, on ? C.gold : C.white, 1, 1, null);
      const spr0 = enemySprite(lv.boss, Math.floor(this.T * 3) % 2, null), sc = spr0.w > cw - 10 || spr0.h > chh - 46 ? 1 : 2;
      drawSprX(spr0, x + cw / 2, y + chh - 28 + (f ? Math.round(Math.sin(this.T * 8)) : 0), { sc, ay: 1 });
      const words = wrapText(lv.name, cw - 4).slice(0, 2);
      words.forEach((wd, j) => text(wd, x + cw / 2, y + chh - 23 + j * 8, on ? C.gold : C.white, 1, 1, null));
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y, cw - 2, chh); ctx.clip();
      text(BOSSES[lv.boss] ? BOSSES[lv.boss].name : '', x + cw / 2, y + chh - 8, '#ff9c9c', 1, 1, null);
      ctx.restore();
      this.ui.add('lv' + lv.n, x, y, cw, chh, () => this.pick({ mode: 'story', level: lv.n }), { def: on });
    }
  }
  drawEndless(room) {
    const cw = Math.min(220, W - 40), ch = 70, x = Math.floor(W / 2 - cw / 2), y = 48, on = room.mode === 'endless';
    panel(x, y, cw, ch, '#1f5c7a', on ? C.gold : OUT, C.uiL);
    text('ENDLESS', W / 2, y + 6, C.gold, 2, 1, 'outline');
    text(fmt('SURVIVE AS LONG AS YOU CAN. ALL {0} BOSSES TAKE TURNS!', BOSS_ORDER.length), W / 2, y + 24, C.white, 1, 1, null);
    BOSS_ORDER.slice(0, 6).forEach((b, i) => drawSprX(enemySprite(b, Math.floor(this.T * 3 + i) % 2, null), x + 24 + i * Math.floor((cw - 48) / 5), y + ch - 6, { ay: 1 }));
    this.ui.add('endless', x, y, cw, ch, () => this.pick({ mode: 'endless', level: 1 }), { def: true });
    drawButton(this.ui, 'endless_go', Math.floor(W / 2 - 45), y + ch + 8, 90, 15, 'PLAY ENDLESS', { col: '#1f5c7a', on: () => this.pick({ mode: 'endless', level: 1 }) });
  }
  drawPvp() {
    text('ARENA', W / 2, 40, C.gold, 1, 1);
    let y = drawArenaCards(this.ui, 49, this.arena, w => { this.arena = w; }, this.T) + 2;
    drawGoalButtons(this.ui, y, this.goal, g => { this.goal = g; sfx.uiMove(); });
    drawButton(this.ui, 'pvp_go', Math.floor(W / 2 - 50), y + 20, 100, 15, 'PLAY PVP', { def: true, col: '#8a1f5c', on: () => this.pick({ mode: 'pvp', level: 1, arena: this.arena, goal: this.goal }) });
  }
}
// what the lobby says it will play
function roomModeLabel(room) {
  if (room.mode === 'pvp') return fmt('PVP: {0}, FIRST TO {1}', arenaName(room.arena || 'pond'), room.goal || PVP_GOAL);
  if (room.mode === 'endless') return 'ENDLESS';
  const lv = LEVELS[room.level - 1];
  return lv ? fmt('STORY {0}: {1}', room.level, lv.name) : 'STORY';
}

addPhrases([
  ['DUCK VS DUCK', 'ENTE GEGEN ENTE', 'УТКА ПРОТИВ УТКИ'], ['PVP: AIM AND SHOOT YOURSELF. MOST KOs WINS!', 'PVP: SELBST ZIELEN UND SCHIESSEN. DIE MEISTEN KOs GEWINNEN!', 'PVP: ЦЕЛЬСЯ И СТРЕЛЯЙ САМ. БОЛЬШЕ ВСЕГО НОКАУТОВ ПОБЕЖДАЕТ!'],
  ['ARENA', 'ARENA', 'АРЕНА'], ['FIRST TO', 'ZUERST', 'ДО'], ['{0} KOs', '{0} KOs', '{0} НОКАУТОВ'], ['FIRST TO {0}', 'ZIEL: {0}', 'ДО {0}'], ['FIRST TO {0} KOs!', 'WER ZUERST {0} KOs HAT!', 'КТО ПЕРВЫЙ НАБЕРЁТ {0} НОКАУТОВ!'],
  ['AIM AND SHOOT YOURSELF!', 'ZIELE UND SCHIESSE SELBST!', 'ЦЕЛЬСЯ И СТРЕЛЯЙ САМ!'], ["{0} KO'D {1}!", '{0} HAT {1} K.O. GESCHLAGEN!', '{0} НОКАУТИРОВАЛ {1}!'], ['KO!', 'K.O.!', 'НОКАУТ!'],
  ['30 SECONDS LEFT!', 'NOCH 30 SEKUNDEN!', 'ОСТАЛОСЬ 30 СЕКУНД!'], ['YOU WIN!', 'DU GEWINNST!', 'ТЫ ПОБЕДИЛ!'], ['{0} WINS!', '{0} GEWINNT!', '{0} ПОБЕЖДАЕТ!'], ['DRAW!', 'UNENTSCHIEDEN!', 'НИЧЬЯ!'],
  ['KO', 'KO', 'НОК'], ["KO'D", 'K.O.', 'ВЫБИТ'], ['COINS', 'MÜNZEN', 'МОНЕТЫ'], ['REMATCH', 'REVANCHE', 'РЕВАНШ'], ['2 DUCKS HERE', '2 ENTEN HIER', '2 УТКИ ТУТ'],
  ['HOST A LOBBY, THEN PICK PVP', 'ERSTELLE EINE LOBBY UND WÄHLE PVP', 'СОЗДАЙ ЛОББИ И ВЫБЕРИ PVP'],
  ['LEFT SIDE: MOVE   RIGHT SIDE: AIM + SHOOT', 'LINKS: LAUFEN   RECHTS: ZIELEN + SCHIESSEN', 'СЛЕВА: ХОДИТЬ   СПРАВА: ЦЕЛИТЬСЯ + СТРЕЛЯТЬ'],
  ['P1: WASD + F (SHOOT) + SPACE   P2: ARROWS + . (SHOOT) + ENTER', 'S1: WASD + F (SCHUSS) + LEER   S2: PFEILE + . (SCHUSS) + ENTER', 'И1: WASD + F (ОГОНЬ) + ПРОБЕЛ   И2: СТРЕЛКИ + . (ОГОНЬ) + ENTER'],
  ['GAMEPADS: LEFT STICK MOVES, RIGHT STICK AIMS + SHOOTS', 'GAMEPADS: LINKER STICK LÄUFT, RECHTER ZIELT + SCHIESST', 'ГЕЙМПАД: ЛЕВЫЙ СТИК ХОДИТ, ПРАВЫЙ ЦЕЛИТСЯ + СТРЕЛЯЕТ'],
  ['DRAG HERE TO AIM', 'HIER ZIEHEN ZUM ZIELEN', 'ТЯНИ ТУТ, ЧТОБЫ ЦЕЛИТЬСЯ'], ['DRAG HERE TO MOVE', 'HIER ZIEHEN ZUM LAUFEN', 'ТЯНИ ТУТ, ЧТОБЫ ХОДИТЬ'],
  ['WASD: MOVE   MOUSE / ARROWS: AIM + SHOOT   SPACE: DASH', 'WASD: LAUFEN   MAUS / PFEILE: ZIELEN + SCHIESSEN   LEER: DASH', 'WASD: ХОДИТЬ   МЫШЬ / СТРЕЛКИ: ЦЕЛЬ + ОГОНЬ   ПРОБЕЛ: РЫВОК'],
  ['WASD: MOVE   F: SHOOT   SPACE: DASH', 'WASD: LAUFEN   F: SCHIESSEN   LEER: DASH', 'WASD: ХОДИТЬ   F: ОГОНЬ   ПРОБЕЛ: РЫВОК'], ['ARROWS: MOVE   . : SHOOT   ENTER: DASH', 'PFEILE: LAUFEN   . : SCHIESSEN   ENTER: DASH', 'СТРЕЛКИ: ХОДИТЬ   . : ОГОНЬ   ENTER: РЫВОК'],
  ['WHAT DO WE PLAY?', 'WAS SPIELEN WIR?', 'ВО ЧТО ИГРАЕМ?'], ['CHAPTER {0} OF {1}', 'KAPITEL {0} VON {1}', 'ГЛАВА {0} ИЗ {1}'], ['PLAY ENDLESS', 'ENDLOS SPIELEN', 'ИГРАТЬ БЕСКОНЕЧНО'], ['PLAY PVP', 'PVP SPIELEN', 'ИГРАТЬ PVP'],
  ['SURVIVE AS LONG AS YOU CAN. ALL {0} BOSSES TAKE TURNS!', 'ÜBERLEBE SO LANGE DU KANNST. ALLE {0} BOSSE KOMMEN DRAN!', 'ВЫЖИВАЙ КАК МОЖНО ДОЛЬШЕ. ВСЕ {0} БОССОВ ПО ОЧЕРЕДИ!'],
  ['PVP: {0}, FIRST TO {1}', 'PVP: {0}, ZIEL {1} KOs', 'PVP: {0}, ДО {1}'], ['MODE: {0}   CHANGE >', 'MODUS: {0}   ÄNDERN >', 'РЕЖИМ: {0}   ИЗМЕНИТЬ >'], ['PVP NEEDS AT LEAST 2 DUCKS', 'PVP BRAUCHT MINDESTENS 2 ENTEN', 'ДЛЯ PVP НУЖНО МИНИМУМ 2 УТКИ'], ['PVP', 'PVP', 'PVP'],
]);
