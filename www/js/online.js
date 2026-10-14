'use strict';
/* QUACK ATTACK! — online play.
 * Lobbies run on the server (see server/). One player hosts: their device runs the real simulation.
 * Everyone else sends their inputs to the host and draws the host's snapshots ~12 times a second.
 * The host's own duck is the first player; friends join as P2..P4 and each gets their own screen. */

// Where the server lives when the game isn't served by it (the Windows / Android apps, or a file opened locally).
// After you deploy server/ somewhere, put its address here, e.g. 'wss://quack.example.com/ws'.
const DEFAULT_SERVER = '';

const NAMES = ['QUACKER', 'PUDDLE', 'WADDLE', 'FEATHER', 'MALLARD', 'SPLASH', 'NUGGET', 'BISCUIT', 'WIGGLE', 'SNORKEL'];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NET_TYPES = [...Object.keys(ENEMIES), ...Object.keys(BOSSES)];
const NET_STATES = ['walk', 'wind', 'charge', 'summon', 'ring', 'volley', 'missiles', 'jumpUp', 'jumpAir', 'move', 'dash', ''];
const NET_FACE = ['down', 'left', 'right', 'up'];
const SNACK = { k: 'snack', name: 'BREAD SNACK', max: 99, d: () => 'HEAL 40 HP' };
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const stIdx = s => { const i = NET_STATES.indexOf(s || ''); return i < 0 ? NET_STATES.length - 1 : i; };
const findUpgrade = k => (k === 'snack' ? SNACK : UPGRADES.find(u => u.k === k));
const bossDef = name => Object.assign({ xp: 0, fx: BOSSES[name].fx || 'metal', heavy: 0.05 }, BOSSES[name]);
const worldFromSeed = seed => Object.keys(WORLD_THEME)[seed % Object.keys(WORLD_THEME).length];

function serverUrl() {
  const q = new URLSearchParams(location.search).get('server');
  if (q) return q;
  // the Windows and Android apps (and a file opened from disk) use the configured address;
  // the Android app's "https://localhost" is the phone itself, not our server
  if (window.Capacitor || location.protocol === 'file:') return DEFAULT_SERVER;
  if (location.protocol === 'http:' || location.protocol === 'https:') return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  return DEFAULT_SERVER;
}

// ================================================================ connection
Object.assign(Net, {
  connect() {
    if (this.open && this.ws) return Promise.resolve();
    if (this.pending) return this.pending;
    const url = serverUrl();
    if (!url) return Promise.reject(new Error('NO SERVER SET UP YET'));
    this.pending = new Promise((res, rej) => {
      let ws;
      try { ws = new WebSocket(url); } catch (e) { this.pending = null; rej(new Error('BAD SERVER ADDRESS')); return; }
      this.ws = ws;
      let opened = false;
      ws.onopen = () => { opened = true; this.open = true; this.pending = null; res(); };
      ws.onerror = () => { if (!opened) { this.pending = null; this.ws = null; rej(new Error("CAN'T REACH THE SERVER")); } };
      ws.onclose = () => {
        if (ws !== this.ws) return; // closed on purpose
        this.ws = null; this.open = false; this.pending = null;
        if (!opened) rej(new Error("CAN'T REACH THE SERVER"));
        else this.onMsg({ t: 'closed', reason: 'CONNECTION LOST' });
      };
      ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (err) { return; } this.onMsg(m); };
    });
    return this.pending;
  },
  send(m) { if (this.open && this.ws) this.ws.send(JSON.stringify(m)); },
  relay(to, msg) { this.send({ t: 'relay', to, msg }); },
  close() {
    const ws = this.ws;
    this.ws = null; this.open = false; this.pending = null; this.room = null; this.role = null;
    if (ws) ws.close();
  },
  onMsg(m) {
    if (m.t === 'hello') { this.myId = m.id; return; }
    if (m.t === 'room') this.room = m.room;
    const top = Scenes.top();
    if (m.t === 'start') { startOnlineGame(m); return; } // whatever screen we're on, a started game wins
    if (top && top.onNet) top.onNet(m);
  },
});

// the host is always the first member; everyone's pid is their position in the list
function startOnlineGame(m) {
  const members = m.members;
  const pid = members.findIndex(x => x.id === Net.myId);
  if (pid < 0) return;
  Net.role = pid === 0 ? 'host' : 'client';
  Net.idToPid = {}; members.forEach((x, i) => { Net.idToPid[x.id] = i; });
  Net.inputs = [{}, {}, {}, {}]; Net.evt = []; Net.sndT = 0;
  const level = m.mode === 'story' ? LEVELS[m.level - 1] : null;
  const world = level ? level.world : worldFromSeed(m.seed);
  const net = { role: Net.role, pid, members: members.map(x => ({ id: x.id, name: x.name, lo: x.lo })), seed: m.seed };
  Trans.go(() => Scenes.set(new GameScene({ mode: m.mode, level, np: members.length, world, net })), true);
}

// ================================================================ UI helpers
function drawChecker(alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#1f1830'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 0 : 12; x < W; x += 24) { ctx.fillStyle = '#251d3a'; ctx.fillRect(x, y, 12, 12); }
  ctx.globalAlpha = 1;
}

// ================================================================ online menu: browse lobbies, create one, or join with a code
class OnlineScene {
  constructor(note = '') {
    this.T = 0; this.ui = new UI(); this.rooms = []; this.pub = true; this.note = note; this.status = 'CONNECTING...';
    this.joining = false; this.code = ''; this.refreshT = 0;
    Music.play('calm');
    this.connect();
  }
  connect() {
    Net.connect().then(() => { this.status = 'CONNECTED'; this.note = this.note || ''; Net.send({ t: 'list' }); })
      .catch(e => { this.status = 'OFFLINE'; this.note = e.message; });
  }
  onNet(m) {
    if (m.t === 'rooms') { this.rooms = m.rooms; return true; }
    if (m.t === 'joined') { Trans.go(() => Scenes.set(new RoomScene()), true); return true; }
    if (m.t === 'error') { this.note = m.msg; sfx.uiBack(); return true; }
    if (m.t === 'closed') { this.status = 'OFFLINE'; this.note = m.reason; return true; }
    return false;
  }
  leave() { Net.close(); Trans.go(() => Scenes.set(new TitleScene(true))); }
  cycleName() {
    const i = NAMES.indexOf(Save.data.name);
    Save.data.name = NAMES[(i + 1) % NAMES.length]; Save.write(); sfx.uiMove();
  }
  submitCode() {
    if (this.code.length < 4) { this.note = 'TYPE ALL 4 CODE LETTERS'; sfx.uiBack(); return; }
    this.joining = false;
    Net.send({ t: 'join', code: this.code, name: Save.data.name, lo: Save.data.loadout[0] });
    this.code = '';
  }
  update(dt) {
    this.T += dt;
    const acts = Input.menu();
    if (this.joining) {
      for (const ch of Input.typed) {
        if (ch === '<') this.code = this.code.slice(0, -1);
        else if (CODE_CHARS.includes(ch) && this.code.length < 4) this.code += ch;
      }
      if (acts.back) { this.joining = false; this.code = ''; sfx.uiBack(); return; }
      this.ui.update(dt, acts);
      return;
    }
    if (acts.back) { sfx.uiBack(); this.leave(); return; }
    this.ui.update(dt, acts);
    if (this.status === 'CONNECTED') { this.refreshT -= dt; if (this.refreshT <= 0) { this.refreshT = 4; Net.send({ t: 'list' }); } }
  }
  connectThen(fn) {
    Net.connect().then(() => { this.status = 'CONNECTED'; fn(); }).catch(e => { this.status = 'OFFLINE'; this.note = e.message; sfx.uiBack(); });
  }
  draw() {
    drawChecker();
    this.ui.begin();
    if (this.joining) { this.drawJoin(); return; }
    text('ONLINE', W / 2, 6, C.gold, 2, 1, 'outline');
    const sc = this.status === 'CONNECTED' ? C.green : this.status === 'OFFLINE' ? C.red : C.gray;
    text(this.status, W / 2, 22, sc, 1, 1);
    // name + public toggle + actions
    const nameW = Math.min(W - 20, 170);
    drawButton(this.ui, 'name', Math.floor(W / 2 - nameW / 2), 32, nameW, 14, 'YOUR NAME: ' + Save.data.name + '  >', { on: () => this.cycleName() });
    const bw = Math.min(90, Math.floor((W - 24) / 3) - 3), by = 50;
    const x0 = Math.floor(W / 2 - (bw * 3 + 6) / 2);
    drawButton(this.ui, 'create', x0, by, bw, 15, 'CREATE', { on: () => this.connectThen(() => Net.send({ t: 'create', pub: this.pub, name: Save.data.name, lo: Save.data.loadout[0] })), def: true, col: '#3d2f63' });
    drawButton(this.ui, 'pub', x0 + bw + 3, by, bw, 15, this.pub ? 'PUBLIC: YES' : 'PUBLIC: NO', { on: () => { this.pub = !this.pub; sfx.uiMove(); } });
    drawButton(this.ui, 'code', x0 + (bw + 3) * 2, by, bw, 15, 'JOIN CODE', { on: () => { this.joining = true; this.note = ''; } });
    // public lobbies
    const top = 72, listH = H - top - 26, rowH = 18, maxRows = Math.max(1, Math.floor((listH - 14) / rowH));
    panel(8, top, W - 16, listH, C.uiD, OUT, C.uiL);
    text('PUBLIC LOBBIES', 14, top + 4, C.gold, 1, 0);
    if (!this.rooms.length) text(this.status === 'CONNECTED' ? 'NONE RIGHT NOW - CREATE ONE!' : 'NO LOBBIES TO SHOW', W / 2, top + 22, C.gray, 1, 1);
    this.rooms.slice(0, maxRows).forEach((r, i) => {
      const y = top + 14 + i * rowH;
      text(r.name.slice(0, 16), 14, y + 4, C.white, 1, 0);
      text(r.count + '/' + r.max, W - 72, y + 4, C.white, 1, 0);
      drawButton(this.ui, 'j' + r.code, W - 52, y + 1, 42, 13, 'JOIN', { on: () => this.connectThen(() => Net.send({ t: 'join', code: r.code, name: Save.data.name, lo: Save.data.loadout[0] })) });
    });
    drawButton(this.ui, 'back', 4, H - 17, 40, 13, 'BACK', { on: () => this.leave(), icon: ICON.back });
    drawButton(this.ui, 'refresh', W - 58, H - 17, 54, 13, 'REFRESH', { on: () => Net.send({ t: 'list' }) });
    if (this.note) text(this.note, W / 2, H - 13, C.red, 1, 1, 'outline');
  }
  drawJoin() {
    text('JOIN A FRIEND', W / 2, 8, C.gold, 2, 1, 'outline');
    text('ASK THEM FOR THEIR 4 LETTER CODE', W / 2, 24, C.white, 1, 1);
    // the code, four slots
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(W / 2 - 4 * 15 + i * 15), y = 36;
      panel(x, y, 13, 15, C.ui, i === this.code.length ? C.gold : OUT, null, false);
      if (this.code[i]) text(this.code[i], x + 6, y + 4, C.white, 1, 1, null);
    }
    // keypad: 8 x 4 letters and digits
    const kw = 17, kh = 12, cols = 8, gx = Math.floor(W / 2 - (cols * (kw + 2)) / 2);
    [...CODE_CHARS].forEach((ch, i) => {
      const x = gx + (i % cols) * (kw + 2), y = 56 + Math.floor(i / cols) * (kh + 2);
      drawButton(this.ui, 'k' + ch, x, y, kw, kh, ch, { on: () => { if (this.code.length < 4) this.code += ch; sfx.uiMove(); }, silent: true });
    });
    const yb = 56 + 4 * (kh + 2) + 4;
    drawButton(this.ui, 'del', gx, yb, 40, 13, 'DEL', { on: () => { this.code = this.code.slice(0, -1); } });
    drawButton(this.ui, 'go', W / 2 - 20, yb, 40, 13, 'JOIN', { on: () => this.connectThen(() => this.submitCode()), def: true, col: '#3d2f63' });
    drawButton(this.ui, 'cancel', gx + cols * (kw + 2) - 40, yb, 40, 13, 'CANCEL', { on: () => { this.joining = false; this.code = ''; } });
    if (this.note) text(this.note, W / 2, yb + 18, C.red, 1, 1, 'outline');
  }
}

// ================================================================ lobby room: who's in, mode, ready, start
class RoomScene {
  constructor() { this.T = 0; this.ui = new UI(); this.note = ''; Music.play('calm'); }
  onNet(m) {
    if (m.t === 'start') { startOnlineGame(m); return true; }
    if (m.t === 'closed') { Trans.go(() => Scenes.set(new OnlineScene(m.reason)), true); return true; }
    if (m.t === 'error') { this.note = m.msg; return true; }
    if (m.t === 'lobby' || m.t === 'room') return true;
    return false;
  }
  leave() { Net.send({ t: 'leave' }); Net.room = null; Trans.go(() => Scenes.set(new OnlineScene())); }
  modes() { const out = [{ mode: 'endless', level: 1 }]; for (let i = 1; i <= LEVELS.length; i++) out.push({ mode: 'story', level: i }); return out; }
  cycleMode(room) {
    const list = this.modes(), i = list.findIndex(x => x.mode === room.mode && x.level === room.level);
    const nx = list[(i + 1) % list.length];
    Net.send({ t: 'set', mode: nx.mode, level: nx.level });
  }
  update(dt) {
    this.T += dt;
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); this.leave(); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker();
    this.ui.begin();
    const room = Net.room;
    if (!room) { text('CONNECTING TO THE LOBBY...', W / 2, H / 2, C.white, 1, 1); return; }
    const me = room.members.find(m => m.id === Net.myId), isHost = !!(me && me.host);
    text('LOBBY ' + room.code, W / 2, 6, C.gold, 2, 1, 'outline');
    text(room.pub ? 'PUBLIC - SHOWN IN THE BROWSER' : 'PRIVATE - SHARE THE CODE', W / 2, 22, C.white, 1, 1);
    const top = 32, rowH = 30;
    for (let i = 0; i < 4; i++) {
      const mem = room.members[i], y = top + i * rowH;
      panel(8, y, W - 16, rowH - 4, mem ? C.ui : '#221a33', OUT, mem ? C.uiL : null, false);
      if (mem) {
        drawDuck(24, y + rowH - 8, { skin: mem.lo.skin, hat: mem.lo.hat, halo: mem.lo.halo, facing: 'right', t: this.T, sc: 1.6, blink: this.T % 3.2 > 3.05 });
        text(mem.name, 42, y + 5, PCOL[i], 1, 0);
        if (mem.id === Net.myId) text('YOU', 42 + textW(mem.name) + 6, y + 5, C.gray, 1, 0);
        if (mem.host) { panel(W - 46, y + 4, 34, 11, C.pink, OUT, null, false); text('HOST', W - 29, y + 7, OUT, 1, 1, null); }
        else text(mem.ready ? 'READY!' : 'NOT READY', W - 14, y + 5, mem.ready ? C.green : C.gray, 1, 2);
      } else text('OPEN SLOT', 42, y + 8, C.grayD, 1, 0);
    }
    const label = room.mode === 'endless' ? 'ENDLESS' : 'STORY ' + room.level + ': ' + LEVELS[room.level - 1].name;
    const my = top + 4 * rowH + 2;
    if (isHost) drawButton(this.ui, 'mode', 8, my, W - 16, 15, 'MODE: ' + label + '   >', { on: () => this.cycleMode(room) });
    else text('MODE: ' + label, W / 2, my + 4, C.white, 1, 1);
    text(isHost ? 'START WHEN EVERYONE IS HERE. ALL DEVICES NEED TO STAY OPEN.' : 'WAITING FOR THE HOST TO START...', W / 2, my + 22, C.gray, 1, 1);
    const by = H - 17;
    if (isHost) drawButton(this.ui, 'start', Math.floor(W / 2 - 84), by, 90, 14, 'START', { on: () => Net.send({ t: 'start' }), def: true, col: '#3d2f63' });
    else drawButton(this.ui, 'ready', Math.floor(W / 2 - 84), by, 90, 14, me && me.ready ? 'NOT READY' : 'READY!', { on: () => Net.send({ t: 'ready', ready: !(me && me.ready) }), col: me && me.ready ? '#2a2535' : '#3d2f63', def: true });
    drawButton(this.ui, 'leave', Math.floor(W / 2 + 10), by, 74, 14, 'LEAVE', { on: () => this.leave(), icon: ICON.back });
    if (this.note) text(this.note, W / 2, H - 26, C.red, 1, 1, 'outline');
  }
}

// ================================================================ the game, online (host simulates, clients render)
GameScene.prototype.onNet = function (m) {
  if (m.t === 'relayed') {
    if (this.role === 'client' && m.msg.t === 'snap') this.applySnapshot(m.msg);
    else if (this.role === 'host' && m.msg.t === 'in') this.applyClientInput(m.from, m.msg);
    return true;
  }
  if (m.t === 'left') { if (this.role === 'host') this.dropPlayer(m.id); return true; }
  if (m.t === 'closed') { this.leaveOnline(m.reason || 'CONNECTION LOST'); return true; }
  if (m.t === 'lobby') { this.toLobby(); return true; }
  if (m.t === 'room') return true;
  return false;
};
GameScene.prototype.toLobby = function () { Net.role = null; Trans.go(() => Scenes.set(new RoomScene()), true); };
GameScene.prototype.leaveOnline = function (reason) { Net.close(); Trans.go(() => Scenes.set(new OnlineScene(reason)), true); };
GameScene.prototype.quitOnline = function () { Net.send({ t: 'leave' }); Net.close(); Trans.go(() => Scenes.set(new OnlineScene('LEFT THE GAME'))); };
GameScene.prototype.onlineResultButtons = function () {
  if (this.role === 'host') return [['lobby', 'BACK TO LOBBY', () => Net.send({ t: 'back' })]];
  return [['leave', 'LEAVE', () => this.quitOnline()]];
};
GameScene.prototype.dashFor = function (pid) { if (this.role === 'client') this.pendDash = true; else this.players[pid].dashReq = true; };
GameScene.prototype.dropPlayer = function (id) {
  const p = this.players[Net.idToPid[id]];
  if (!p || p.gone) return;
  p.gone = true; p.down = true; p.reviveT = 0; p.choice = null; p.pending = 0;
  banner(p.name + ' LEFT THE GAME', C.gray, 2.2);
  burst(p.x, p.y, ['#fff8e7', '#8b8aa0'], 14, 60, 0.6);
};
GameScene.prototype.netPump = function (dt) {
  if (this.role !== 'host') return;
  this.sndT -= dt;
  if (this.sndT > 0) return;
  this.sndT = 1 / 12;
  Net.relay('all', this.buildSnapshot());
};
// what the host tells everyone: positions, stats and the few visuals that can't be rebuilt locally
GameScene.prototype.buildSnapshot = function () {
  const ev = Net.evt.splice(0, Net.evt.length);
  return {
    t: 'snap', T: r2(this.t), st: this.state, n: r2(this.stateT),
    // players: [x, y, face, aim, hp, maxHp, bits, dashT, dashCd, reviveT, level, xp, xpNext, kills, pending, upgrades, choiceKeys, hurtFlash, squash, speed]
    p: this.players.map(p => [r1(p.x), r1(p.y), NET_FACE.indexOf(p.facing), r2(p.aim), Math.ceil(p.hp), p.maxHp,
      (p.down ? 1 : 0) | (p.gone ? 2 : 0) | (p.moving ? 4 : 0) | (p.iframes > 0 ? 8 : 0),
      r2(p.dashT), r2(p.dashCd), r2(p.reviveT), p.level, Math.floor(p.xp), p.xpNext, p.kills, p.pending, p.up,
      (p.choice || []).map(c => c.k), r2(p.hurtFlash), r2(p.squash), r2(p.spd)]),
    // enemies: [id, type, x, y, hp, maxHp, bits, z, state, flash, fuse, rot]
    e: this.enemies.filter(e => !e.dead).map(e => [e.id, NET_TYPES.indexOf(e.type), r1(e.x), r1(e.y), Math.ceil(e.hp), Math.ceil(e.maxHp),
      (e.flip ? 1 : 0) | (e.boss ? 2 : 0) | (e.spawnT > 0 ? 4 : 0) | (e.fuse >= 0 ? 8 : 0) | (e.phase === 2 ? 16 : 0),
      r1(e.z || 0), stIdx(e.bs || e.st), r2(e.flash || 0), r2(Math.max(0, e.fuse)), r2(e.rot || 0)]),
    // shots: [kind, x, y, vx, vy, life, max, r, col, ownerPid, weapon, rot, ang, back, sp]
    s: this.shots.map(b => [b.kind, r1(b.x), r1(b.y), r1(b.vx), r1(b.vy), r2(b.life), b.max, b.r, b.col, b.owner.id, b.owner.weapon, r2(b.rot), r2(b.ang || 0), b.back ? 1 : 0, r1(b.sp || 0)]),
    es: this.eshots.map(b => [r1(b.x), r1(b.y), r1(b.vx), r1(b.vy), r2(b.life), r2(b.wait || 0), b.s === PROJ_ART.snowball ? 'snow' : 'seed', b.r || 2]),
    dr: this.drops.map(g => [g.k, r1(g.x), r1(g.y), r1(g.z || 0), g.v, r1(g.bob)]),
    it: this.items.map(k => [k.k, r1(k.x), r1(k.y), r1(k.t)]),
    bm: this.bombs.map(b => [r1(b.x0), r1(b.y0), r1(b.x1), r1(b.y1), r2(b.t), b.dur, b.r]),
    mk: this.marks.filter(m => !m.done).map(m => [r1(m.x), r1(m.y), m.r, r2(m.t), m.dur]),
    fx: this.fx.map(f => Object.assign({}, f)),
    tx: this.texts.map(t => ({ x: r1(t.x), y: r1(t.y), str: t.str, col: t.col, life: r2(t.life), max: t.max, sc: t.sc, vy: r1(t.vy) })),
    ban: this.banners.map(b => ({ str: b.str, col: b.col, t: r2(b.t), dur: b.dur, sub: b.sub })),
    bi: this.bossIntro ? { t: r2(this.bossIntro.t), name: this.bossIntro.name } : null,
    res: this.results,
    ev,
  };
};
GameScene.prototype.applySnapshot = function (s) {
  this.t = s.T; this.stateT = s.n;
  const entering = s.st === 'results' && this.state !== 'results';
  this.state = s.st === 'results' || s.st === 'dying' || s.st === 'clear' ? s.st : 'play';
  if (s.st === 'results') this.results = s.res;
  if (entering) this.resultsReached(s.res);
  // players
  s.p.forEach((a, i) => {
    const p = this.players[i]; if (!p) return;
    const bits = a[6];
    p.down = !!(bits & 1); p.gone = !!(bits & 2); p.moving = !!(bits & 4); p.iframes = bits & 8 ? 0.3 : 0;
    p.hp = a[4]; p.maxHp = a[5]; p.dashT = a[7]; p.dashCd = a[8]; p.reviveT = a[9];
    p.level = a[10]; p.xp = a[11]; p.xpNext = a[12]; p.kills = a[13]; p.pending = a[14]; p.up = a[15];
    p.aim = a[3]; p.facing = NET_FACE[a[2]] || p.facing; p.spd = a[19];
    p.hurtFlash = a[17]; p.squash = a[18];
    const sig = a[16].join();
    if (sig !== p.choiceSig) {
      if (p.choice && !a[16].length) p.picked = { choice: p.choice, sel: p.sel, t: 0 }; // the host took our pick: play the pick animation
      p.choiceSig = sig; p.choice = a[16].length ? a[16].map(findUpgrade) : null; p.choiceT = 0; p.sel = 1; p.cardSnd = 0;
    }
    if (i === this.localPid) {
      // our own duck: keep moving locally, and only pull back to the host's position when we're far off
      const dx = a[0] - p.x, dy = a[1] - p.y;
      if (dx * dx + dy * dy > 24 * 24 || p.down) { p.x = a[0]; p.y = a[1]; } else { p.x += dx * 0.25; p.y += dy * 0.25; }
    } else {
      if (p.tx === undefined) { p.x = a[0]; p.y = a[1]; }
      p.tx = a[0]; p.ty = a[1];
    }
  });
  // enemies: keep the same objects (so they glide between snapshots)
  const prev = this.clientEnemies, next = new Map(), list = [];
  for (const a of s.e) {
    const id = a[0];
    let e = prev.get(id);
    if (!e) {
      const name = NET_TYPES[a[1]], d = ENEMIES[name] || bossDef(name);
      e = { id, type: name, d, boss: !!(a[6] & 2), x: a[2], y: a[3], r: d.r, anim: rand(0, 10), kx: 0, ky: 0, eggCd: 0, dead: false, flash: 0 };
    }
    e.tx = a[2]; e.ty = a[3];
    if (e.x === undefined) { e.x = a[2]; e.y = a[3]; }
    e.hp = a[4]; e.maxHp = a[5]; e.flip = !!(a[6] & 1); e.spawnT = a[6] & 4 ? 0.3 : 0;
    e.fuse = a[10] > 0 ? a[10] : -1; e.phase = a[6] & 16 ? 2 : 1;
    e.z = a[7]; e.bs = e.st = NET_STATES[a[8]] || ''; e.flash = Math.max(e.flash, a[9]); e.rot = a[11];
    next.set(id, e); list.push(e);
  }
  // enemies that disappeared were destroyed: give them a little death burst
  for (const [id, e] of prev) if (!next.has(id) && inAnyView(e.x, e.y, 20)) burst(e.x, e.y, e.d.fx === 'goo' ? ['#7ee04a', '#c3ff9a'] : ['#ffd23f', '#fff8e7', '#3d3a52'], 6, 60, 0.35);
  this.clientEnemies = next; this.enemies = list;
  this.boss = list.find(e => e.boss) || null;
  this.shots = s.s.map(a => ({ kind: a[0], x: a[1], y: a[2], vx: a[3], vy: a[4], life: a[5], max: a[6], r: a[7], col: a[8], owner: { id: a[9], weapon: a[10] }, rot: a[11], ang: a[12], back: !!a[13], sp: a[14] }));
  this.eshots = s.es.map(a => ({ x: a[0], y: a[1], vx: a[2], vy: a[3], life: a[4], wait: a[5], s: a[6] === 'snow' ? PROJ_ART.snowball : PROJ_ART.seed, r: a[7] }));
  this.drops = s.dr.map(a => ({ k: a[0], x: a[1], y: a[2], z: a[3], v: a[4], bob: a[5], tgt: null }));
  this.items = s.it.map(a => ({ k: a[0], x: a[1], y: a[2], t: a[3] }));
  this.bombs = s.bm.map(a => ({ x0: a[0], y0: a[1], x1: a[2], y1: a[3], t: a[4], dur: a[5], r: a[6] }));
  this.marks = s.mk.map(a => ({ x: a[0], y: a[1], r: a[2], t: a[3], dur: a[4] }));
  this.fx = s.fx;
  this.texts = s.tx;
  this.banners = s.ban;
  this.bossIntro = s.bi ? { t: s.bi.t, name: s.bi.name } : null;
  // one-off things the host did: sounds, impact frames, screen shake
  for (const ev of s.ev) {
    if (ev[0] === 'sfx') { const f = sfx[ev[1]]; if (f) f(...ev.slice(2)); }
    else if (ev[0] === 'imp') Impact.trigger(ev[1]);
    else if (ev[0] === 'shk') for (const v of this.views) v.shake = Math.max(v.shake, ev[1]);
  }
};
GameScene.prototype.resultsReached = function (res) {
  if (!res) return;
  Save.addCoins(res.coins + res.bonus);
  if (this.mode === 'endless') { const k = 'e' + this.np; if (res.t > (Save.data.best[k] || 0)) Save.data.best[k] = res.t; Save.write(); }
  if (res.won) { sfx.win(); Music.play('title'); } else { sfx.over(); Music.play('calm'); }
};
// host: apply what a friend asked for
GameScene.prototype.applyClientInput = function (from, msg) {
  const pid = Net.idToPid[from];
  if (pid === undefined || pid === 0) return;
  const r = Net.inputs[pid];
  r.mx = clamp(Number(msg.mx) || 0, -1, 1); r.my = clamp(Number(msg.my) || 0, -1, 1);
  if (msg.dash) r.dash = true;
  if (msg.ok) r.ok = true;
  const p = this.players[pid];
  if (p && !p.gone && Number.isInteger(msg.sel)) p.sel = clamp(msg.sel, 0, 2);
};
GameScene.prototype.localMove = function () {
  const mv = Input.move(0, 1);
  const s = this.sticks[this.localPid];
  if (s) { const dx = s.x - s.bx, dy = s.y - s.by, dl = Math.hypot(dx, dy); if (dl > 2) { const m = Math.min(1, dl / STICK_R); mv.x += dx / dl * m; mv.y += dy / dl * m; } }
  const l = Math.hypot(mv.x, mv.y);
  if (l > 1) { mv.x /= l; mv.y /= l; }
  return mv;
};
// friend's device: show our own screen, send our inputs to the host, keep everything moving in between snapshots
GameScene.prototype.clientUpdate = function (dt) {
  const acts = Input.menu();
  if (this.state === 'results') { this.updateResults(dt, acts); this.clientTick(dt); return; }
  if (this.state === 'paused') { this.updatePause(dt, acts); this.clientTick(dt); return; }
  if (acts.start) { this.pause(); return; }
  this.handlePointers();
  this.ui.update(dt, null);
  this.clientTick(dt);
  const mv = this.localMove();
  const me = this.players[this.localPid];
  if (me && !me.down && this.state === 'play' && !picking(me)) {
    const sp = me.spd || 70;
    me.x = clamp(me.x + mv.x * sp * dt, 8, WORLD_SIZE - 8); me.y = clamp(me.y + mv.y * sp * dt, 10, WORLD_SIZE - 6);
    me.moving = Math.hypot(mv.x, mv.y) > 0.1; me.mvx = mv.x; me.mvy = mv.y;
    if (me.moving) me.moved = true;
  }
  if (me && me.pending > 0 && me.choice) { // level-up cards: move the highlight here, the host applies the pick
    const menu = Input.menuFor(0, 1);
    if (menu.left) { me.sel = (me.sel + 2) % 3; sfx.uiMove(); }
    if (menu.right) { me.sel = (me.sel + 1) % 3; sfx.uiMove(); }
    if (menu.ok && me.choiceT > CARD_READY) this.pendOk = true;
  }
  this.pendDash = this.pendDash || Input.dash(0, 1);
  this.inAcc += dt;
  if (this.inAcc >= 1 / 30) {
    this.inAcc = 0;
    Net.relay('host', { t: 'in', mx: r2(mv.x), my: r2(mv.y), dash: this.pendDash, ok: this.pendOk, sel: me ? me.sel : 1 });
    this.pendDash = false; this.pendOk = false;
  }
};
// the cosmetic side of the simulation, so the friend's screen looks alive between snapshots
GameScene.prototype.clientTick = function (dt) {
  this.t += dt; this.hintT += dt;
  if (this.bossIntro) this.bossIntro.t += dt;
  this.tickCosmetics(dt);
  for (const p of this.players) {
    p.hurtFlash = Math.max(0, p.hurtFlash - dt); p.squash = Math.max(0, p.squash - dt); p.turnT = Math.max(0, p.turnT - dt);
    if (p.choice) p.choiceT += dt;
    if (p.id !== this.localPid && p.tx !== undefined) { p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); }
    if (p.mvx === undefined) { p.mvx = 0; p.mvy = 0; }
    tickPicked(p, dt); dustFor(p, dt); heartbeatFor(p, dt);
    updateTrail(p, dt);
  }
  for (const e of this.enemies) {
    e.anim += dt; e.flash = Math.max(0, e.flash - dt);
    if (e.tx !== undefined) { e.x += (e.tx - e.x) * Math.min(1, dt * 12); e.y += (e.ty - e.y) * Math.min(1, dt * 12); }
  }
  for (const b of this.shots) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.rot += dt * 18; }
  this.shots = this.shots.filter(b => b.life > 0);
  for (const b of this.eshots) { if (b.wait > 0) b.wait -= dt; else { b.x += b.vx * dt; b.y += b.vy * dt; } b.life -= dt; }
  this.eshots = this.eshots.filter(b => b.life > 0);
  for (const g of this.drops) g.bob += dt;
  for (const k of this.items) k.t += dt;
  for (const b of this.bombs) b.t += dt;
  for (const m of this.marks) m.t += dt;
  for (const f of this.fx) f.t += dt;
  this.fx = this.fx.filter(f => f.t < f.dur);
  for (const b of this.banners) b.t += dt;
  this.banners = this.banners.filter(b => b.t < b.dur);
  updateParticles(dt);
  this.updateCameras(dt);
};

// ================================================================ boot: the online menu is one of the title buttons (see scenes.js)
