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
// The OWNER is the very first account ever made: it claims meta/admin in the database (see firebase/firestore.rules).
// The owner can make other players admins too (admins/{uid}); only the owner decides who is an admin.
const USERNAME_MIN = 3, USERNAME_MAX = 12;
const MAX_FLAGS = 3;

const CLOUD_Q = new URLSearchParams(location.search);
const CLOUD_EMU = CLOUD_Q.get('emu'); // tests: ?emu=1 uses the local Firebase emulators
const withTimeout = (p, ms) => Promise.race([p, new Promise((res, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const serverTime = () => firebase.firestore.FieldValue.serverTimestamp();

const Cloud = {
  enabled: false, auth: null, db: null, uid: null, me: null, live: false, dirty: false, adminUid: null, coAdmin: false,
  unsubs: [], popups: [], pushTimer: null,
  // only decides whether the admin tab is shown; the database rules decide what really works
  isOwner() { return !!(this.me && this.adminUid && this.adminUid === this.uid); },
  isAdmin() { return this.isOwner() || !!(this.me && this.coAdmin); },
  // find out who the owner is; if nobody is yet, this account is the first one and becomes it.
  // Then keep an eye on whether the owner has made us an admin (or taken it away again).
  async checkAdmin() {
    await this.checkOwner();
    if (this.isOwner() || this.adminWatch) return;
    this.adminWatch = this.db.doc('admins/' + this.uid).onSnapshot(s => { this.coAdmin = s.exists; }, () => { this.coAdmin = false; });
    this.unsubs.push(this.adminWatch);
  },
  async checkOwner() {
    const ref = this.db.doc('meta/admin');
    try {
      const s = await withTimeout(ref.get(), 12000);
      if (s.exists) { this.adminUid = s.data().uid; return; }
      await withTimeout(ref.set({ uid: this.uid }), 12000);
      this.adminUid = this.uid;
    } catch (e) { /* offline, or somebody else just claimed it */ try { const s = await ref.get(); if (s.exists) this.adminUid = s.data().uid; } catch (e2) { /* offline */ } }
  },

  init() {
    if (CLOUD_Q.get('accounts') === '0') return false; // tests: ?accounts=0 plays without accounts (never touches the real database)
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
      const keep = { name: Save.data.name, settings: Save.data.settings, muted: Save.data.muted, account: acc, giftsTaken: Save.data.giftsTaken, events: Save.data.events, shopCfg: Save.data.shopCfg };
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
    // events (Halloween...) the admin has switched on, live for everyone
    this.unsubs.push(this.db.doc('meta/event').onSnapshot(s => {
      const d = s.exists ? s.data() : {};
      for (const k of Object.keys(EVENTS)) EVENT_STATE[k] = !!d[k];
      Save.data.events = Object.assign({}, EVENT_STATE); Save.write(true);
    }, () => {}));
    // what the admin has put in the shop (special offers, admin sale price, booster prices)
    this.unsubs.push(this.db.doc('meta/shop').onSnapshot(s => {
      SHOP_CFG = cleanShopCfg(s.exists ? s.data() : null);
      Save.data.shopCfg = s.exists ? s.data() : null; Save.write(true);
    }, () => {}));
    this.pushTimer = setInterval(() => this.push(), 5000);
  },
  setEvent(id, on) { return withTimeout(this.db.doc('meta/event').set({ [id]: !!on }, { merge: true }), 12000); },
  setShop(cfg) { return withTimeout(this.db.doc('meta/shop').set(cfg), 12000); },
  // a gift from the admin: apply it to the save straight away, remember it so it can't count twice, delete it
  takeGift(doc) {
    const g = doc.data(), taken = Save.data.giftsTaken = Save.data.giftsTaken || [];
    if (!taken.includes(doc.id)) {
      taken.push(doc.id); if (taken.length > 60) taken.shift();
      if (g.coins > 0) Save.addCoins(Math.min(100000, g.coins));
      // one item (cat + id) or several (items: [{cat, id}, ...])
      const list = (Array.isArray(g.items) ? g.items.slice(0, 80) : [{ cat: g.cat, id: g.id }])
        .filter(x => x && COSMETICS[x.cat] && COSMETICS[x.cat].some(c => c.id === x.id)).map(x => ({ cat: x.cat, id: x.id }));
      for (const x of list) Save.unlock(x.cat, x.id);
      Save.write();
      const msg = typeof g.msg === 'string' ? g.msg.toUpperCase().slice(0, 60) : '', from = String(g.from || 'ADMIN').slice(0, 12);
      const one = list.length === 1 ? list[0] : null;
      if (g.coins > 0 || list.length || msg) this.popups.push({ coins: g.coins > 0 ? g.coins : 0, cat: one ? one.cat : null, id: one ? one.id : null, items: list.length > 1 ? list : null, msg, from });
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
  // the owner makes a player an admin, or takes it away
  setAdmin(uid, on) { const ref = this.db.doc('admins/' + uid); return withTimeout(on ? ref.set({ by: (this.me && this.me.username) || 'OWNER', at: serverTime() }) : ref.delete(), 12000); },
  watchAdminOf(uid, fn) { return this.db.doc('admins/' + uid).onSnapshot(s => fn(s.exists), () => fn(false)); },
  async adminUids() { const qs = await withTimeout(this.db.collection('admins').get(), 12000); return new Set(qs.docs.map(d => d.id)); },
  ban(uid, on) { return this.db.doc('users/' + uid).update(on ? { banned: true } : { banned: false, flags: 0 }); },
  resetProgress(uid) { return this.db.doc('users/' + uid).update({ resetAt: Date.now(), save: { coins: 150, unlocked: DEFAULT_UNLOCKS.slice() } }); },
  give(uid, gift) { return this.db.collection('users/' + uid + '/gifts').add(Object.assign({ from: (this.me && this.me.username) || 'ADMIN', at: serverTime() }, gift)); },
  // the same gift for every player (written in batches); returns how many got it
  async giveAll(gift) {
    const qs = await withTimeout(this.db.collection('users').get(), 15000);
    const g = Object.assign({ from: (this.me && this.me.username) || 'ADMIN' }, gift);
    let batch = this.db.batch(), n = 0, total = 0;
    for (const d of qs.docs) {
      if (d.id === this.uid) continue;
      batch.set(this.db.collection('users/' + d.id + '/gifts').doc(), Object.assign({ at: serverTime() }, g)); n++; total++;
      if (n >= 400) { await withTimeout(batch.commit(), 15000); batch = this.db.batch(); n = 0; }
    }
    if (n) await withTimeout(batch.commit(), 15000);
    return total;
  },
  async countUsers() {
    const qs = await withTimeout(this.db.collection('users').get(), 15000);
    let banned = 0; qs.forEach(d => { if (d.data().banned) banned++; });
    return { all: qs.size, banned };
  },
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
  constructor(g) {
    this.g = g; this.t = 0; this.ui = new UI(); this.parts = [];
    this.item = g.cat ? itemOf(g.cat, g.id) : null;
    if (g.notice) sfx.uiBack();
    else if (this.item || g.coins) { sfx.chestOpen(this.item ? this.item.rarity : 'rare'); sfx.quack(); }
    else { sfx.quack(1.3); tone(880, 0.12, 'triangle', 0.06, 0, atime(0.1)); }
  }
  update(dt) {
    this.t += dt;
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    if (!this.g.notice && (this.item || this.g.coins) && Math.random() < 0.4) this.parts.push({ x: W / 2 + rand(-50, 50), y: H / 2 + rand(-30, 20), vx: 0, vy: rand(-24, -6), life: 0.9, col: pick(this.item && this.item.rarity === 'admin' ? RAINBOW : ['#ffd23f', '#c9a6ff', '#fff8e7']) });
    this.ui.update(dt, this.t > 0.5 ? Input.menu() : null);
  }
  draw() {
    const prev = Scenes.stack[Scenes.stack.length - 2];
    if (prev) prev.draw();
    const g = this.g, it = this.item, k = Ease.outBack(Math.min(1, this.t / 0.4)), T = this.t;
    ctx.fillStyle = 'rgba(15,10,26,0.84)'; ctx.fillRect(0, 0, W, H);
    this.ui.begin();
    if (g.notice) {
      text(g.notice, W / 2, H / 2 - 10, C.white, 1, 1, 'outline');
    } else {
      const many = g.items && g.items.map(x => Object.assign({ it: itemOf(x.cat, x.id) }, x)).filter(x => x.it);
      const gift = it || g.coins || (many && many.length), admin = (it && it.rarity === 'admin') || (many && many.some(x => x.it.rarity === 'admin'));
      if (gift) { // turning light rays (rainbow for ADMIN items)
        ctx.save(); ctx.translate(W / 2, H * 0.47); ctx.rotate(T * 0.6);
        for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.fillStyle = admin ? RAINBOW[i % RAINBOW.length] : '#ffd23f'; ctx.globalAlpha = admin ? 0.1 : 0.12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -H); ctx.lineTo(10, -H); ctx.fill(); }
        ctx.restore(); ctx.globalAlpha = 1;
      }
      for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
      drawZoomText(gift ? 'ADMIN GIFT!' : 'A MESSAGE FROM THE ADMIN', W / 2, H * 0.1, lerp(6, 2, k), gift ? C.pink : C.gold);
      const msgH = g.msg ? 12 + 7 * Math.min(3, wrapText(keep(g.msg), Math.min(W - 60, 220)).length) : 0;
      const cy = Math.round(H * 0.47 - msgH * 0.35);
      let bubY = H * 0.42; // where the message bubble goes: under whatever was given
      if (it) {
        text('YOU GOT:', W / 2, H * 0.1 + 12, C.white, 1, 1, 'outline');
        const lo = Save.data.loadout[0], y = cy + 16 - Math.abs(Math.sin(T * 4)) * 4, sc = (g.msg ? 3 : 4) * k;
        if (g.cat === 'skin') drawDuck(W / 2, y, { skin: g.id, facing: 'down', sc, t: T });
        else if (g.cat === 'hat') drawDuck(W / 2, y, { skin: lo.skin, hat: g.id, facing: 'down', sc, t: T, sparkle: (x, yy) => this.parts.push({ x, y: yy, vx: rand(-8, 8), vy: rand(-20, -8), life: 0.8, col: pick(['#fff3b0', '#ffd23f', '#c9a6ff']) }) });
        else if (g.cat === 'halo') drawDuck(W / 2, y, { skin: lo.skin, halo: g.id, facing: 'down', sc, t: T });
        else if (g.cat === 'weapon') drawSprX(GUN_ART[g.id], W / 2, y - 16, { sc: 3 * k });
        else if (g.cat === 'trail') { ctx.save(); ctx.translate(W / 2, y - 14); ctx.scale(3 * k, 3 * k); drawTrailIcon(g.id, 0, 0, T); ctx.restore(); }
        const col = rarityCol(it.rarity, T);
        text(it.name, W / 2, cy + 24, col, 1, 1, 'outline');
        text(RARITY[it.rarity].name, W / 2, cy + 33, col, 1, 1, null);
        if (g.coins) text(fmt('AND {0} COINS!', g.coins), W / 2, cy + 42, C.gold, 1, 1, 'outline');
        bubY = cy + (g.coins ? 52 : 42);
      } else if (many && many.length) { // a whole bundle: a grid of everything, popping in one by one
        text(fmt('YOU GOT {0} ITEMS!', many.length), W / 2, H * 0.1 + 12, C.white, 1, 1, 'outline');
        const cs = 22, cols = Math.min(many.length, Math.max(4, Math.floor((W - 40) / (cs + 2)))), rows = Math.ceil(many.length / cols);
        const gx = Math.floor(W / 2 - (cols * (cs + 2) - 2) / 2), gy = Math.round(H * 0.1 + 24);
        const show = Math.min(many.length, rows * cols, Math.floor((H - gy - (g.msg ? 70 : 40)) / (cs + 2)) * cols);
        many.slice(0, show).forEach((x, i) => {
          const kk = Ease.outBack(clamp((T - 0.2 - i * 0.06) / 0.3, 0, 1)); if (kk <= 0) return;
          const cx = gx + (i % cols) * (cs + 2) + cs / 2, cy2 = gy + Math.floor(i / cols) * (cs + 2) + cs / 2, s2 = cs * kk;
          panel(Math.round(cx - s2 / 2), Math.round(cy2 - s2 / 2), Math.round(s2), Math.round(s2), C.ui, rarityCol(x.it.rarity, T + i * 0.1), null, false);
          if (kk > 0.6) drawItemIcon(x.cat, x.id, cx, cy2, T, Save.data.loadout[0]);
        });
        if (show < many.length) text(fmt('+{0} MORE', many.length - show), W / 2, gy + Math.ceil(show / cols) * (cs + 2) + 1, C.gray, 1, 1, null);
        let ly = gy + Math.ceil(show / cols) * (cs + 2) + (show < many.length ? 9 : 1);
        if (g.coins) { text(fmt('AND {0} COINS!', g.coins), W / 2, ly, C.gold, 1, 1, 'outline'); ly += 9; }
        bubY = ly + 6;
      } else if (g.coins) {
        const bob = Math.abs(Math.sin(T * 4)) * 4;
        ctx.save(); ctx.translate(W / 2, cy - 6 - bob); ctx.scale(3 * k, 3 * k); coinIcon(-4, -4, T); ctx.restore();
        text(fmt('YOU GOT {0} COINS!', g.coins), W / 2, cy + 18, C.gold, 1, 1, 'outline');
        bubY = cy + 32;
      }
      if (g.msg) { // speech bubble with the admin's note
        const bw = Math.min(W - 40, 240), lines = wrapText(keep(g.msg), bw - 16).slice(0, 3), bh = 14 + lines.length * 7;
        const bx = Math.floor(W / 2 - bw / 2), by = Math.min(H - 30 - bh, Math.round(bubY));
        panel(bx, by, bw, bh, '#fff8e7', OUT, null, false);
        ctx.fillStyle = '#fff8e7'; ctx.beginPath(); ctx.moveTo(W / 2 - 5, by); ctx.lineTo(W / 2, by - 6); ctx.lineTo(W / 2 + 5, by); ctx.fill();
        text(fmt('FROM {0}:', keep(g.from || 'ADMIN')), bx + 6, by + 4, '#c0609e', 1, 0, null);
        lines.forEach((ln, i) => text(ln, bx + 6, by + 12 + i * 7, OUT, 1, 0, null));
      }
    }
    drawButton(this.ui, 'ok', W / 2 - 26, H - 22, 52, 16, g.notice ? 'OK' : 'YAY!', { on: () => Scenes.pop(), col: '#3d2f63', def: true });
  }
}
// gifts wait until you're on a menu (never in the middle of a fight or a chest opening)
function showCloudPopups() {
  if (!Cloud.popups.length || Trans.busy()) return;
  const top = Scenes.top();
  if (top instanceof TitleScene || top instanceof MapScene || top instanceof LockerScene || top instanceof OnlineScene) Scenes.push(new GiftScene(Cloud.popups.shift()));
}
