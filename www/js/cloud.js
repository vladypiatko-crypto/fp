'use strict';
/* QUACK ATTACK! — accounts, bans, flags and admin gifts, stored in Firebase (Google's free online database).
 * Every player gets an account on first start: a display name and a unique username.
 * The account is anonymous (no email or password): it lives in the app's storage on that device.
 * The rules in firebase/firestore.rules decide who may change what, on Google's side, so the admin powers
 * can't be faked by editing the app. Without FIREBASE_CONFIG the game runs exactly as before, fully offline. */

// Paste the firebaseConfig object from the Firebase console here (null = no accounts).
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAnfPdcls1Hoqj2kVsR6nQmQDwEX5cv0Bg',
  authDomain: 'quackattackreal.firebaseapp.com',
  projectId: 'quackattackreal',
  storageBucket: 'quackattackreal.firebasestorage.app',
  messagingSenderId: '604766249036',
  appId: '1:604766249036:web:ea7d894c8a1541dbb5d4e9',
};
// Accounts switch on only when this is true (set once Firebase Authentication and Firestore are set up).
const ACCOUNTS_ON = true;
// The admin is the very first account ever made: it claims meta/admin in the database (see firebase/firestore.rules).
const USERNAME_MIN = 3, USERNAME_MAX = 12;
const MAX_FLAGS = 3;

const CLOUD_Q = new URLSearchParams(location.search);
const CLOUD_EMU = CLOUD_Q.get('emu'); // tests: ?emu=1 uses the local Firebase emulators
const withTimeout = (p, ms) => Promise.race([p, new Promise((res, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const serverTime = () => firebase.firestore.FieldValue.serverTimestamp();

const Cloud = {
  enabled: false, auth: null, db: null, uid: null, me: null, live: false, dirty: false, adminUid: null,
  unsubs: [], popups: [], pushTimer: null,
  // only decides whether the admin tab is shown; the database rules decide what really works
  isAdmin() { return !!(this.me && this.adminUid && this.adminUid === this.uid); },
  // find out who the admin is; if nobody is yet, this account is the first one and becomes it
  async checkAdmin() {
    const ref = this.db.doc('meta/admin');
    try {
      const s = await withTimeout(ref.get(), 12000);
      if (s.exists) { this.adminUid = s.data().uid; return; }
      await withTimeout(ref.set({ uid: this.uid }), 12000);
      this.adminUid = this.uid;
    } catch (e) { /* offline, or somebody else just claimed it */ try { const s = await ref.get(); if (s.exists) this.adminUid = s.data().uid; } catch (e2) { /* offline */ } }
  },

  init() {
    const cfg = CLOUD_EMU ? null : ACCOUNTS_ON && FIREBASE_CONFIG;
    return this.start(cfg || (CLOUD_EMU ? { apiKey: 'demo-key', projectId: 'demo-quack', authDomain: 'demo-quack.firebaseapp.com' } : null));
  },
  start(cfg) {
    if (!cfg || typeof firebase === 'undefined') return false;
    try {
      firebase.initializeApp(cfg);
      this.auth = firebase.auth(); this.db = firebase.firestore();
      if (CLOUD_EMU) { this.auth.useEmulator('http://127.0.0.1:9099'); this.db.useEmulator('127.0.0.1', 8085); }
      this.enabled = true;
    } catch (e) { console.warn('firebase', e); }
    return this.enabled;
  },
  async signIn() {
    if (this.auth.currentUser) return this.auth.currentUser;
    const saved = await new Promise(res => { const off = this.auth.onAuthStateChanged(u => { off(); res(u); }); });
    return saved || (await this.auth.signInAnonymously()).user;
  },
  // 'ok' | 'need-account' | 'banned' | 'offline' (has an account, plays offline) | 'need-net' (no account yet, no internet)
  async boot() {
    const acc = Save.data.account;
    try { this.uid = (await withTimeout(this.signIn(), 12000)).uid; } catch (e) { return acc ? (acc.banned ? 'banned' : 'offline') : 'need-net'; }
    let snap;
    try { snap = await withTimeout(this.db.doc('users/' + this.uid).get(), 12000); } catch (e) {
      return acc && acc.uid === this.uid ? (acc.banned ? 'banned' : 'offline') : 'need-net';
    }
    if (!snap.exists) return 'need-account';
    this.gotMe(snap.data());
    this.listen();
    await this.checkAdmin();
    return this.me.banned ? 'banned' : 'ok';
  },
  // claim the username and create the account in one go (fails if somebody has that username)
  async register(name, username) {
    if (!this.uid) this.uid = (await withTimeout(this.signIn(), 12000)).uid;
    const lower = username.toLowerCase();
    const nameRef = this.db.doc('usernames/' + lower), userRef = this.db.doc('users/' + this.uid);
    const data = { name, username, usernameLower: lower, flags: 0, banned: false, resetAt: 0, save: this.compactSave(), created: serverTime(), updated: serverTime() };
    await withTimeout(this.db.runTransaction(async tx => {
      if ((await tx.get(nameRef)).exists) throw new Error('TAKEN');
      tx.set(nameRef, { uid: this.uid });
      tx.set(userRef, data);
    }), 15000);
    Save.data.account = { uid: this.uid, username, banned: false, resetSeen: 0 };
    Save.data.name = name; Save.write();
    this.gotMe(Object.assign({}, data, { resetAt: 0 }));
    this.listen();
    await this.checkAdmin();
  },
  gotMe(d) {
    this.me = d;
    const acc = Save.data.account = Object.assign({ resetSeen: 0 }, Save.data.account, { uid: this.uid, username: d.username, banned: !!d.banned });
    // the admin reset this player's progress: start over, keeping name, settings and account
    if (d.resetAt && d.resetAt > (acc.resetSeen || 0)) {
      const keep = { name: Save.data.name, settings: Save.data.settings, muted: Save.data.muted, account: acc, giftsTaken: Save.data.giftsTaken };
      Save.data = Object.assign(defaultSave(), keep);
      acc.resetSeen = d.resetAt;
      this.popups.push({ notice: 'THE ADMIN RESET YOUR PROGRESS' });
      if (!(Scenes.top() instanceof BannedScene)) Trans.go(() => Scenes.set(new TitleScene(true)), true);
      Save.write(); // the fresh save goes back up
    } else Save.write(true);
  },
  listen() {
    if (this.live) return;
    this.live = true;
    this.unsubs.push(this.db.doc('users/' + this.uid).onSnapshot(s => {
      if (!s.exists) return;
      const was = !!(this.me && this.me.banned);
      this.gotMe(s.data());
      if (this.me.banned && !was) { Net.close(); Trans.go(() => Scenes.set(new BannedScene()), true); }
      else if (!this.me.banned && was) Trans.go(() => Scenes.set(new TitleScene(true)), true);
    }, () => {}));
    this.unsubs.push(this.db.collection('users/' + this.uid + '/gifts').onSnapshot(qs => {
      // only gifts the database has confirmed (a gift written by this device itself would be refused there)
      qs.docChanges().forEach(ch => { if ((ch.type === 'added' || ch.type === 'modified') && !ch.doc.metadata.hasPendingWrites) this.takeGift(ch.doc); });
    }, () => {}));
    this.pushTimer = setInterval(() => this.push(), 5000);
  },
  // a gift from the admin: apply it to the save straight away, remember it so it can't count twice, delete it
  takeGift(doc) {
    const g = doc.data(), taken = Save.data.giftsTaken = Save.data.giftsTaken || [];
    if (!taken.includes(doc.id)) {
      taken.push(doc.id); if (taken.length > 60) taken.shift();
      if (g.coins > 0) Save.addCoins(Math.min(100000, g.coins));
      const it = g.cat && COSMETICS[g.cat] && COSMETICS[g.cat].find(x => x.id === g.id);
      if (it) Save.unlock(g.cat, g.id);
      Save.write();
      if (g.coins > 0 || it) this.popups.push({ coins: g.coins > 0 ? g.coins : 0, cat: it ? g.cat : null, id: it ? g.id : null });
    }
    doc.ref.delete().catch(() => {});
  },
  compactSave() {
    const d = Save.data;
    return { coins: d.coins, unlocked: d.unlocked, loadout: d.loadout, story: { reached: d.story.reached }, best: d.best };
  },
  // keep the database copy of the save up to date (the admin sees it, and resets work from it)
  push() {
    if (!this.dirty || !this.me || this.me.banned) return;
    this.dirty = false;
    this.db.doc('users/' + this.uid).update({ name: Save.data.name, save: this.compactSave(), updated: serverTime() }).catch(() => { this.dirty = true; });
  },

  // ---------------------------------------------------------------- admin (the database rules only let the admin do these)
  async searchUsers(q) {
    q = q.toLowerCase().replace(/[^a-z0-9]/g, '');
    const col = this.db.collection('users');
    const query = q ? col.where('usernameLower', '>=', q).where('usernameLower', '<=', q + '').orderBy('usernameLower').limit(20) : col.orderBy('created', 'desc').limit(20);
    const qs = await withTimeout(query.get(), 12000);
    return qs.docs.map(d => Object.assign({ uid: d.id }, d.data()));
  },
  watchUser(uid, fn) { return this.db.doc('users/' + uid).onSnapshot(s => fn(s.exists ? Object.assign({ uid }, s.data()) : null), () => fn(null)); },
  flag(uid, by = 1) {
    const ref = this.db.doc('users/' + uid);
    return this.db.runTransaction(async tx => {
      const d = (await tx.get(ref)).data() || {}, flags = Math.max(0, (d.flags || 0) + by);
      tx.update(ref, by > 0 && flags >= MAX_FLAGS ? { flags, banned: true } : { flags });
    });
  },
  ban(uid, on) { return this.db.doc('users/' + uid).update(on ? { banned: true } : { banned: false, flags: 0 }); },
  resetProgress(uid) { return this.db.doc('users/' + uid).update({ resetAt: Date.now(), save: { coins: 150, unlocked: DEFAULT_UNLOCKS.slice() } }); },
  give(uid, gift) { return this.db.collection('users/' + uid + '/gifts').add(Object.assign({ from: 'ADMIN', at: serverTime() }, gift)); },
};
Cloud.init();

// ================================================================ boot: sign in, then the right first screen
class BootScene {
  constructor() {
    this.T = 0; this.ui = new UI(); this.state = 'wait';
    Cloud.boot().then(r => this.route(r)).catch(() => this.route(Save.data.account ? 'offline' : 'need-net'));
  }
  route(r) {
    this.state = r;
    if (r === 'ok' || r === 'offline') Scenes.set(new TitleScene(false));
    else if (r === 'banned') Scenes.set(new BannedScene());
    else if (r === 'need-account') Scenes.set(new AccountScene());
  }
  retry() { this.state = 'wait'; Cloud.boot().then(r => this.route(r)).catch(() => this.route('need-net')); }
  update(dt) { this.T += dt; this.ui.update(dt, Input.menu()); }
  draw() {
    drawChecker(); this.ui.begin();
    for (let i = 0; i < 3; i++) drawDuck(W / 2 - 16 + i * 16, H / 2 + 6 - Math.abs(Math.sin(this.T * 6 + i)) * 4, { skin: Save.data.loadout[0].skin, facing: 'down', t: this.T, frame: Math.floor(this.T * 8 + i) % 2 });
    if (this.state === 'need-net') {
      text('CONNECT TO THE INTERNET', W / 2, H / 2 - 30, C.white, 1, 1, 'outline');
      text('YOU NEED IT ONCE TO MAKE YOUR ACCOUNT', W / 2, H / 2 - 20, C.gray, 1, 1);
      drawButton(this.ui, 'retry', Math.floor(W / 2 - 35), H / 2 + 20, 70, 15, 'TRY AGAIN', { on: () => this.retry(), def: true, col: '#3d2f63' });
    } else text('CONNECTING' + '.'.repeat(1 + Math.floor(this.T * 3) % 3), W / 2, H / 2 - 24, C.white, 1, 1, 'outline');
  }
}

// ================================================================ first start: pick a name and a unique username
class AccountScene {
  constructor() {
    this.T = 0; this.ui = new UI(); this.note = ''; this.busy = false; this.shake = 0;
    this.fields = { name: new Keyboard({ value: Save.data.name || '', max: NAME_MAX }), user: new Keyboard({ value: '', max: USERNAME_MAX, space: false }) };
    this.cur = 'user';
  }
  nope(msg) { this.note = msg; this.shake = 0.35; sfx.uiBack(); this.busy = false; }
  async create() {
    if (this.busy) return;
    const name = this.fields.name.value.replace(/ +/g, ' ').trim(), user = this.fields.user.value.trim();
    if (name.length < 2) { this.cur = 'name'; return this.nope('NAME IS TOO SHORT'); }
    if (isBadName(name)) { this.cur = 'name'; return this.nope("THAT NAME ISN'T ALLOWED"); }
    if (user.length < USERNAME_MIN) { this.cur = 'user'; return this.nope(fmt('USERNAME NEEDS {0} TO {1} LETTERS', USERNAME_MIN, USERNAME_MAX)); }
    if (isBadName(user)) { this.cur = 'user'; return this.nope("THAT NAME ISN'T ALLOWED"); }
    this.busy = true; this.note = '';
    try {
      await Cloud.register(name, user);
      sfx.pickup(); sfx.quack();
      Trans.go(() => Scenes.set(new TitleScene(false)));
    } catch (e) {
      if (e.message === 'TAKEN') { this.cur = 'user'; this.nope('THAT USERNAME IS TAKEN'); }
      else this.nope(e.message === 'timeout' ? 'NO INTERNET CONNECTION?' : "COULDN'T CREATE THE ACCOUNT");
    }
  }
  update(dt) {
    this.T += dt; this.shake = Math.max(0, this.shake - dt);
    const acts = Input.menu();
    if (this.busy) return;
    if (this.fields[this.cur].typed(acts)) this.note = '';
    if (Input.anyHit(['Tab'])) this.cur = this.cur === 'name' ? 'user' : 'name';
    if (Input.anyHit(['Enter', 'NumpadEnter'])) { this.create(); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker(); this.ui.begin();
    text('WELCOME, DUCK!', W / 2, 5, C.gold, 2, 1, 'outline');
    const fw = 6 * NAME_MAX + 16, sx = Math.round(Math.sin(this.shake * 60) * this.shake * 8);
    const fx = Math.floor(W / 2 - fw / 2), rw = Math.min(W - 12, 240), rx = Math.floor(W / 2 - rw / 2);
    [['name', 'NAME', 'SHOWN TO OTHER PLAYERS', 22], ['user', 'USERNAME', 'ONLY YOURS - CAN NOT BE CHANGED', 50]].forEach(([k, label, sub, y]) => {
      const on = this.cur === k;
      text(label, rx, y, on ? C.gold : C.gray, 1, 0); text(sub, rx + rw, y, C.grayD, 1, 2, null);
      drawField(fx + (on ? sx : 0), y + 7, fw, this.fields[k].value, this.fields[k].max, this.T, { active: on, error: on && !!this.note });
      this.ui.add('f' + k, fx, y + 7, fw, 16, () => { this.cur = k; this.note = ''; });
    });
    if (this.note) text(this.note, W / 2, 75, C.red, 1, 1, 'outline');
    const by = this.fields[this.cur].draw(this.ui, 85, () => { this.note = ''; });
    drawButton(this.ui, 'create', Math.floor(W / 2 - 50), Math.min(H - 17, by + 3), 100, 14, this.busy ? 'CREATING...' : 'CREATE ACCOUNT', { on: () => this.create(), col: '#3d2f63' });
  }
}

// ================================================================ banned: nothing to do but wait for the admin
class BannedScene {
  constructor() { this.T = 0; Music.play('calm'); }
  update(dt) { this.T += dt; }
  draw() {
    ctx.fillStyle = '#140d1f'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2 + 10;
    drawDuck(cx, cy + 14, { skin: Save.data.loadout[0].skin, facing: 'down', t: this.T, sc: 3, blink: this.T % 3 > 2.8 });
    ctx.fillStyle = '#5a5872'; for (let i = -3; i <= 3; i++) ctx.fillRect(Math.round(cx + i * 9), cy - 40, 3, 60);
    ctx.fillRect(Math.round(cx - 30), cy - 42, 63, 3); ctx.fillRect(Math.round(cx - 30), cy + 18, 63, 3);
    text('YOU ARE BANNED', W / 2, 18, C.red, 2, 1, 'outline');
    text('ONLY THE ADMIN CAN UNBAN YOU', W / 2, H - 22, C.gray, 1, 1);
  }
}

// ================================================================ a gift (or a message) from the admin
class GiftScene {
  constructor(g) { this.g = g; this.t = 0; this.ui = new UI(); this.parts = []; if (g.notice) sfx.uiBack(); else { sfx.chestOpen(g.cat ? itemOf(g.cat, g.id).rarity : 'rare'); sfx.quack(); } }
  update(dt) {
    this.t += dt;
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    if (!this.g.notice && Math.random() < 0.4) this.parts.push({ x: W / 2 + rand(-40, 40), y: H / 2 + rand(-30, 20), vx: 0, vy: rand(-24, -6), life: 0.9, col: pick(['#ffd23f', '#c9a6ff', '#fff8e7']) });
    this.ui.update(dt, this.t > 0.5 ? Input.menu() : null);
  }
  draw() {
    const prev = Scenes.stack[Scenes.stack.length - 2];
    if (prev) prev.draw();
    const g = this.g, k = Ease.outBack(Math.min(1, this.t / 0.4));
    ctx.fillStyle = 'rgba(15,10,26,0.82)'; ctx.fillRect(0, 0, W, H);
    this.ui.begin();
    if (g.notice) {
      text(g.notice, W / 2, H / 2 - 10, C.white, 1, 1, 'outline');
    } else {
      ctx.save(); ctx.translate(W / 2, H / 2 - 6); ctx.rotate(this.t * 0.6); ctx.fillStyle = 'rgba(255,210,63,0.12)';
      for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -H); ctx.lineTo(10, -H); ctx.fill(); }
      ctx.restore();
      for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
      drawZoomText('A GIFT FROM THE ADMIN!', W / 2, H * 0.14, lerp(6, 2, k), C.gold);
      const lo = Save.data.loadout[0], y = H / 2 + 18 - Math.abs(Math.sin(this.t * 4)) * 4, sc = 4 * k;
      const it = g.cat ? itemOf(g.cat, g.id) : null;
      if (g.cat === 'skin') drawDuck(W / 2, y, { skin: g.id, facing: 'down', sc, t: this.t });
      else if (g.cat === 'hat') drawDuck(W / 2, y, { skin: lo.skin, hat: g.id, facing: 'down', sc, t: this.t, sparkle: (x, yy) => this.parts.push({ x, y: yy, vx: rand(-8, 8), vy: rand(-20, -8), life: 0.8, col: pick(['#fff3b0', '#ffd23f', '#c9a6ff']) }) });
      else if (g.cat === 'halo') drawDuck(W / 2, y, { skin: lo.skin, halo: g.id, facing: 'down', sc, t: this.t });
      else if (g.cat === 'weapon') drawSprX(GUN_ART[g.id], W / 2, y - 16, { sc: 3 * k });
      else if (g.cat === 'trail') { ctx.save(); ctx.translate(W / 2, y - 14); ctx.scale(3 * k, 3 * k); drawTrailIcon(g.id, 0, 0, this.t); ctx.restore(); }
      let ty = H / 2 + 26;
      if (it) { text(it.name, W / 2, ty, RARITY[it.rarity].col, 1, 1, 'outline'); ty += 10; }
      if (g.coins) { coinIcon(Math.floor(W / 2 - textW('+' + g.coins, 2) / 2 - 10), ty + 1, this.t); text('+' + g.coins, W / 2 + 4, ty, C.gold, 2, 1, 'outline'); }
    }
    drawButton(this.ui, 'ok', W / 2 - 26, H - 24, 52, 16, g.notice ? 'OK' : 'YAY!', { on: () => Scenes.pop(), col: '#3d2f63', def: true });
  }
}
// gifts wait until you're on a menu (never in the middle of a fight or a chest opening)
function showCloudPopups() {
  if (!Cloud.popups.length || Trans.busy()) return;
  const top = Scenes.top();
  if (top instanceof TitleScene || top instanceof MapScene || top instanceof LockerScene || top instanceof OnlineScene) Scenes.push(new GiftScene(Cloud.popups.shift()));
}
