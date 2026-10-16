'use strict';
/* QUACK ATTACK! — the admin tab (only shown to the admin account; the database rules enforce it).
 * Search players by username, then flag (3 flags = ban), ban, unban, reset progress or send gifts (the gift tab). */

// ================================================================ search
class AdminScene {
  constructor() {
    this.T = 0; this.ui = new UI(); this.kb = new Keyboard({ value: '', max: USERNAME_MAX, space: false });
    this.typing = false; this.results = null; this.note = ''; this.busy = false; this.scroll = 0;
    this.search();
    Cloud.countUsers().then(c => { this.count = c; }).catch(() => {});
  }
  resumed() { this.search(); }
  async search() {
    this.busy = true; this.note = ''; this.typing = false;
    try { this.results = await Cloud.searchUsers(this.kb.value); this.scroll = 0; if (!this.results.length) this.note = 'NOBODY FOUND'; }
    catch (e) { this.note = e.message === 'timeout' ? 'NO INTERNET CONNECTION?' : 'ONLY THE ADMIN CAN DO THAT'; this.results = []; }
    this.busy = false;
  }
  update(dt) {
    this.T += dt;
    const acts = Input.menu();
    if (this.typing) {
      this.kb.typed(acts);
      if (Input.anyHit(['Enter', 'NumpadEnter'])) { this.search(); return; }
      if (Input.anyHit(['Escape']) || acts.back) { this.typing = false; return; }
    } else if (acts.back) { sfx.uiBack(); Trans.go(() => Scenes.pop()); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker(); this.ui.begin();
    text('ADMIN', W / 2, 5, C.pink, 2, 1, 'outline');
    if (this.count) text(fmt('PLAYERS: {0}  BANNED: {1}', this.count.all, this.count.banned), W - 6, 8, C.gray, 1, 2, null);
    const fw = Math.min(W - 120, 160), fx = Math.floor(W / 2 - fw / 2) - 22;
    drawField(fx, 22, fw, this.kb.value, 0, this.T, { active: this.typing, hint: 'TAP TO TYPE A USERNAME' });
    this.ui.add('field', fx, 22, fw, 16, () => { this.typing = true; });
    drawButton(this.ui, 'go', fx + fw + 4, 23, 52, 14, this.busy ? '...' : 'SEARCH', { on: () => this.search(), col: '#3d2f63', def: !this.typing });
    if (this.typing) {
      const by = this.kb.draw(this.ui, 44);
      drawButton(this.ui, 'done', Math.floor(W / 2 - 30), Math.min(H - 17, by + 3), 60, 13, 'SEARCH', { on: () => this.search(), col: '#3d2f63' });
      return;
    }
    // results
    const top = 44, rowH = 17, rows = Math.max(1, Math.floor((H - top - 22) / rowH));
    const list = this.results || [];
    if (this.scroll > Math.max(0, list.length - rows)) this.scroll = Math.max(0, list.length - rows);
    list.slice(this.scroll, this.scroll + rows).forEach((u, i) => {
      const y = top + i * rowH, id = 'u' + u.uid, f = this.ui.isFocus(id);
      panel(8, y, W - 16, rowH - 3, f ? C.uiSel : C.ui, f ? C.gold : OUT, C.uiL, false);
      text(keep(u.username), 14, y + 4, C.gold, 1, 0, null);
      text(keep(u.name || ''), 14 + textW(keep(u.username)) + 8, y + 4, C.white, 1, 0, null);
      if (u.banned) { panel(W - 62, y + 2, 48, 10, C.red, OUT, null, false); text('BANNED', W - 38, y + 4, C.white, 1, 1, null); }
      else if (u.flags) text(fmt('FLAGS {0}/{1}', u.flags, MAX_FLAGS), W - 14, y + 4, C.orange, 1, 2, null);
      this.ui.add(id, 8, y, W - 16, rowH - 3, () => Trans.go(() => Scenes.push(new AdminUserScene(u.uid))), { def: i === 0 });
    });
    if (list.length > rows) {
      drawButton(this.ui, 'up', W - 60, H - 17, 26, 13, '<', { on: () => { this.scroll = Math.max(0, this.scroll - rows); } });
      drawButton(this.ui, 'dn', W - 30, H - 17, 26, 13, '>', { on: () => { this.scroll = Math.min(list.length - rows, this.scroll + rows); } });
    }
    if (this.note) text(this.note, W / 2, top + 10, C.gray, 1, 1);
    if (!this.kb.value && list.length) text('NEWEST PLAYERS', W / 2, H - 13, C.grayD, 1, 1, null);
    drawButton(this.ui, 'back', 4, H - 17, 40, 13, 'BACK', { on: () => Trans.go(() => Scenes.pop()), icon: ICON.back });
  }
}

// ================================================================ one player
class AdminUserScene {
  constructor(uid) {
    this.uid = uid; this.T = 0; this.ui = new UI(); this.u = undefined; this.note = ''; this.noteT = 0; this.sure = 0;
    this.msg = '';
    this.off = Cloud.watchUser(uid, u => { this.u = u; });
  }
  close() { if (this.off) this.off(); Trans.go(() => Scenes.pop()); }
  say(msg) { this.note = msg; this.noteT = 2.5; }
  act(p, done) { p.then(() => { this.say(done); sfx.pickup(); }).catch(e => { this.say(e.message === 'timeout' ? 'NO INTERNET CONNECTION?' : 'ONLY THE ADMIN CAN DO THAT'); sfx.uiBack(); }); }
  update(dt) {
    this.T += dt; this.noteT = Math.max(0, this.noteT - dt); this.sure = Math.max(0, this.sure - dt);
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); this.close(); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker(); this.ui.begin();
    drawButton(this.ui, 'back', 4, 4, 40, 13, 'BACK', { on: () => this.close(), icon: ICON.back });
    const u = this.u;
    if (!u) { text(u === null ? 'NOBODY FOUND' : 'LOADING...', W / 2, H / 2, C.white, 1, 1); return; }
    const me = u.uid === Cloud.uid, sv = u.save || {};
    // who
    text(keep(u.username), W / 2, 5, C.gold, 2, 1, 'outline');
    text(keep(u.name || ''), W / 2, 22, C.white, 1, 1);
    const status = u.banned ? 'BANNED' : u.flags ? fmt('FLAGS {0}/{1}', u.flags, MAX_FLAGS) : 'ALL GOOD';
    text(status, W / 2, 31, u.banned ? C.red : u.flags ? C.orange : C.green, 1, 1);
    text(fmt('COINS {0}   UNLOCKED {1}   STORY LEVEL {2}', sv.coins || 0, (sv.unlocked || []).length, (sv.story && sv.story.reached) || 1), W / 2, 40, C.gray, 1, 1, null);
    // actions
    const bw = Math.min(96, Math.floor((W - 28) / 3)), x0 = Math.floor(W / 2 - (bw * 3 + 8) / 2), bh = 14;
    let y = 52;
    drawButton(this.ui, 'flag', x0, y, bw, bh, fmt('FLAG ({0}/{1})', u.flags || 0, MAX_FLAGS), { disabled: me || u.banned, col: '#5c3a16', def: true,
      on: () => this.act(Cloud.flag(u.uid, 1), (u.flags || 0) + 1 >= MAX_FLAGS ? 'FLAGGED 3 TIMES - BANNED!' : 'FLAGGED') });
    drawButton(this.ui, 'unflag', x0 + bw + 4, y, bw, bh, 'REMOVE FLAG', { disabled: !u.flags, on: () => this.act(Cloud.flag(u.uid, -1), 'FLAG REMOVED') });
    drawButton(this.ui, 'ban', x0 + (bw + 4) * 2, y, bw, bh, u.banned ? 'UNBAN' : 'BAN', { disabled: me, col: u.banned ? '#1f5c3a' : '#6b1f2a',
      on: () => this.act(Cloud.ban(u.uid, !u.banned), u.banned ? 'UNBANNED' : 'BANNED') });
    y += bh + 4;
    drawButton(this.ui, 'reset', x0, y, bw * 3 + 8, bh, this.sure ? 'SURE? TAP AGAIN TO RESET' : 'RESET PROGRESS', { col: this.sure ? '#6b1f2a' : C.ui,
      on: () => { if (!this.sure) { this.sure = 3; return; } this.sure = 0; this.act(Cloud.resetProgress(u.uid), 'PROGRESS RESET'); } });
    y += bh + 8;
    // gifts and messages: everything you can give on one screen
    drawButton(this.ui, 'gifts', x0, y, bw * 3 + 8, bh + 6, 'OPEN GIFT TAB', { col: '#4b2a7a', icon: ICON.chestIcon, on: () => Trans.go(() => Scenes.push(new GiftPickScene(this))) });
    y += bh + 12;
    if (this.noteT > 0) text(this.note, W / 2, Math.min(H - 10, y), C.gold, 1, 1, 'outline');
  }
}

// ================================================================ the gift tab: every item, coins and a message, pick as many as you like
const GIFT_TABS = ['admin', 'skin', 'hat', 'halo', 'trail', 'weapon', 'coins'];
const GIFT_TAB_NAME = { admin: 'ADMIN', skin: 'SKINS', hat: 'HATS', halo: 'HALOS', trail: 'TRAILS', weapon: 'WEAPONS', coins: 'COINS' };
const GIFT_COINS = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
class GiftPickScene {
  constructor(owner) {
    this.owner = owner; this.T = 0; this.ui = new UI(); this.tab = 'admin'; this.page = 0;
    this.sel = new Set(); this.coins = new Set(); this.msg = owner.msg || ''; this.note = ''; this.noteT = 0; this.busy = false;
  }
  get u() { return this.owner.u; }
  owns(cat, id) { const sv = (this.u && this.u.save) || {}; return (sv.unlocked || []).includes(cat + ':' + id); }
  // the cells of a tab: [cat, item] for items, amounts for coins
  cells(tab) {
    if (tab === 'coins') return GIFT_COINS;
    if (tab === 'admin') { const out = []; for (const c of CATS) for (const it of COSMETICS[c]) if (it.rarity === 'admin') out.push([c, it]); return out; }
    return COSMETICS[tab].filter(it => it.id !== 'none').map(it => [tab, it]);
  }
  coinTotal() { let n = 0; for (const c of this.coins) n += c; return n; }
  count() { return this.sel.size + (this.coins.size ? 1 : 0); }
  toggle(key) { if (this.sel.has(key)) { this.sel.delete(key); sfx.uiBack(); } else { this.sel.add(key); sfx.uiMove(); } }
  selectMissing() {
    let added = 0;
    for (const [c, it] of this.cells(this.tab)) if (!this.owns(c, it.id) && !this.sel.has(c + ':' + it.id)) { this.sel.add(c + ':' + it.id); added++; }
    if (added) sfx.pickup(); else { for (const [c, it] of this.cells(this.tab)) this.sel.delete(c + ':' + it.id); sfx.uiBack(); } // tap again: unselect the tab
  }
  say(m) { this.note = m; this.noteT = 2.5; }
  send() {
    if (this.busy || (!this.count() && !this.msg)) return;
    const gift = {};
    const items = [...this.sel].map(k => { const [cat, id] = k.split(':'); return { cat, id }; });
    if (items.length === 1) Object.assign(gift, items[0]); else if (items.length) gift.items = items;
    if (this.coins.size) gift.coins = this.coinTotal();
    if (this.msg) gift.msg = this.msg;
    this.busy = true;
    (this.toAll ? Cloud.giveAll(gift) : Cloud.give(this.owner.uid, gift)).then(n => {
      this.busy = false; this.sel.clear(); this.coins.clear(); this.msg = ''; this.owner.msg = '';
      this.say(this.toAll ? fmt('SENT TO {0} PLAYERS!', n) : 'SENT!'); sfx.chestOpen('epic');
    }).catch(e => { this.busy = false; this.say(e.message === 'timeout' ? 'NO INTERNET CONNECTION?' : 'ONLY THE ADMIN CAN DO THAT'); sfx.uiBack(); });
  }
  resumed() { if (this.owner.msg !== undefined) this.msg = this.owner.msg; }
  update(dt) {
    this.T += dt; this.noteT = Math.max(0, this.noteT - dt); this.tapT = Math.max(0, (this.tapT || 0) - dt);
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); this.owner.msg = this.msg; Trans.go(() => Scenes.pop()); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker(); this.ui.begin();
    const T = this.T, u = this.u;
    text(this.toAll ? 'GIFTS FOR EVERYONE' : fmt('GIFTS FOR {0}', keep(u ? u.username : '...')), W / 2, 4, this.toAll ? C.gold : C.pink, 1, 1, 'outline');
    drawButton(this.ui, 'toall', W - 76, 1, 70, 11, this.toAll ? 'TO: EVERYONE' : 'TO: ONE', { col: this.toAll ? '#6b4a16' : C.ui, on: () => { this.toAll = !this.toAll; sfx.uiMove(); } });
    // tabs
    const tw = Math.floor((W - 16 - (GIFT_TABS.length - 1) * 2) / GIFT_TABS.length), ty = 15;
    GIFT_TABS.forEach((t, i) => {
      const x = 8 + i * (tw + 2), on = this.tab === t;
      const n = t === 'coins' ? this.coins.size : [...this.sel].filter(k => (t === 'admin' ? this.cells('admin').some(([c, it]) => c + ':' + it.id === k) : k.startsWith(t + ':'))).length;
      drawButton(this.ui, 'tab' + t, x, ty, tw, 13, GIFT_TAB_NAME[t], { col: on ? (t === 'admin' ? '#6b2a6b' : '#4b3a72') : C.ui, on: () => { this.tab = t; this.page = 0; } });
      if (t === 'admin') { ctx.fillStyle = rarityCol('admin', T); ctx.fillRect(x + 2, ty + 11, tw - 4, 1); }
      if (n) { pcirc(x + tw - 2, ty + 1, 4, C.red); text(String(n), x + tw - 2, ty - 1, C.white, 1, 1, null); }
    });
    // the grid
    const gy = ty + 18, coinsTab = this.tab === 'coins', cells = this.cells(this.tab);
    // the biggest tiles that still fit everything on one page (easier to tap on a phone)
    let cw, ch, cols, rows;
    for (const sz of [32, 28, 25, 22]) {
      ch = sz; cw = coinsTab ? 52 : sz;
      cols = Math.max(1, Math.floor((W - 16 + 2) / (cw + 2))); rows = Math.max(1, Math.floor((H - 40 - gy) / (ch + 2)));
      if (cols * rows >= cells.length) break;
    }
    const per = cols * rows, pages = Math.max(1, Math.ceil(cells.length / per));
    this.page = clamp(this.page, 0, pages - 1);
    const gx = Math.floor(W / 2 - (Math.min(cells.length, cols) * (cw + 2) - 2) / 2);
    let focus = null;
    cells.slice(this.page * per, this.page * per + per).forEach((cell, i) => {
      const x = gx + (i % cols) * (cw + 2), y = gy + Math.floor(i / cols) * (ch + 2);
      if (coinsTab) {
        const n = cell, on = this.coins.has(n), id = 'coin' + n, f = this.ui.isFocus(id);
        panel(x, y, cw, ch, on ? '#5c4a16' : C.ui, f ? C.white : on ? C.gold : OUT, null, false);
        coinIcon(x + 4, y + 7, T + i * 0.2);
        text('+' + n, x + 14, y + 8, on ? C.gold : C.white, 1, 0, null);
        if (on) this.tick(x + cw - 7, y + 3);
        this.ui.add(id, x, y, cw, ch, () => { if (on) this.coins.delete(n); else this.coins.add(n); sfx.uiMove(); }, { silent: true, def: i === 0 });
        return;
      }
      const [cat, it] = cell, key = cat + ':' + it.id, on = this.sel.has(key), has = this.owns(cat, it.id), id = 'g' + key, f = this.ui.isFocus(id);
      const rc = rarityCol(it.rarity, T + i * 0.1);
      panel(x, y, cw, ch, on ? '#4b3a72' : has ? '#1c1528' : C.ui, f ? C.white : on ? C.gold : rc, null, false);
      if (it.rarity === 'admin') { ctx.globalAlpha = 0.16 + Math.sin(T * 4) * 0.06; ctx.fillStyle = rc; ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2); ctx.globalAlpha = 1; }
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, cw - 2, ch - 2); ctx.clip();
      if (has && !on) ctx.globalAlpha = 0.45;
      drawItemIcon(cat, it.id, x + cw / 2, y + ch / 2, T, Save.data.loadout[0]);
      ctx.globalAlpha = 1; ctx.restore();
      if (on) this.tick(x + cw - 7, y + 3);
      else if (has) { ctx.fillStyle = C.green; ctx.fillRect(x + 2, y + 2, 3, 3); }
      this.ui.add(id, x, y, cw, ch, () => { this.toggle(key); this.tapped = [cat, it]; this.tapT = 2.5; }, { silent: true, def: i === 0 });
      if (this.ui.focus === id && Input.showFocus()) focus = [cat, it];
    });
    // page arrows
    if (pages > 1) {
      drawButton(this.ui, 'pp', 8, H - 36, 14, 13, '<', { on: () => { this.page = (this.page + pages - 1) % pages; } });
      drawButton(this.ui, 'pn', 24, H - 36, 14, 13, '>', { on: () => { this.page = (this.page + 1) % pages; } });
    }
    // info line: the item under the cursor, or what's picked so far
    const ix = pages > 1 ? 42 : 8, iy = H - 33;
    if (!focus && this.tapT > 0 && !coinsTab) focus = this.tapped;
    if (this.noteT > 0) text(this.note, W / 2, iy, C.gold, 1, 1, 'outline');
    else if (focus) {
      const [cat, it] = focus, col = rarityCol(it.rarity, T);
      text(it.name, ix, iy, col, 1, 0, null);
      text(this.owns(cat, it.id) ? 'ALREADY HAS IT' : RARITY[it.rarity].name, ix + textW(it.name) + 6, iy, this.owns(cat, it.id) ? C.green : col, 1, 0, null);
    } else {
      const a = this.sel.size, c = this.coinTotal();
      const line = a && c ? fmt('{0} ITEMS + {1} COINS', a, c) : a ? fmt('{0} ITEMS', a) : c ? fmt('{0} COINS', c) : coinsTab ? 'TAP AMOUNTS TO ADD THEM UP' : 'TAP ITEMS TO PICK THEM';
      text(line, ix, iy, a || c ? C.gold : C.gray, 1, 0, null);
    }
    if (!coinsTab) drawButton(this.ui, 'all', W - 78, H - 36, 70, 13, 'ALL MISSING', { on: () => this.selectMissing() });
    // bottom bar: back, message, send
    const by = H - 17;
    drawButton(this.ui, 'back', 8, by, 44, 14, 'BACK', { on: () => { this.owner.msg = this.msg; Trans.go(() => Scenes.pop()); }, icon: ICON.back });
    const mw = Math.max(80, W - 8 - 56 - 4 - 92 - 8 - 46);
    drawButton(this.ui, 'msg', 56, by, mw, 14, fmt('MESSAGE: {0}', this.msg ? keep(this.msg.length > 18 ? this.msg.slice(0, 17) + '...' : this.msg) : '(NONE)'), { on: () => { this.owner.msg = this.msg; Scenes.push(new MessageScene(this.owner)); } });
    drawButton(this.ui, 'clear', 56 + mw + 4, by, 42, 14, 'CLEAR', { disabled: !this.count() && !this.msg, on: () => { this.sel.clear(); this.coins.clear(); this.msg = ''; this.owner.msg = ''; sfx.uiBack(); } });
    const n = this.count();
    drawButton(this.ui, 'send', W - 8 - 92, by, 92, 14, this.busy ? 'SENDING...' : n ? fmt('SEND ({0})', this.sel.size + (this.coins.size ? 1 : 0)) : this.msg ? 'SEND MESSAGE' : 'SEND', { disabled: !n && !this.msg, col: '#3d2f63', def: false, on: () => this.send() });
  }
  tick(x, y) { // a little check mark
    ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, 7, 6);
    ctx.fillStyle = C.gold; ctx.fillRect(x, y + 2, 1, 1); ctx.fillRect(x + 1, y + 3, 1, 1); ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 3, y + 1, 1, 1); ctx.fillRect(x + 4, y, 1, 1);
  }
}

// ================================================================ writing a message to a player
class MessageScene {
  constructor(owner) { this.owner = owner; this.T = 0; this.ui = new UI(); this.kb = new Keyboard({ value: owner.msg || '', max: 60, extra: ".,!?'#:-()" }); }
  save() { this.owner.msg = this.kb.value.replace(/ +/g, ' ').trim(); sfx.pickup(); Scenes.pop(); }
  update(dt) {
    this.T += dt;
    const acts = Input.menu();
    this.kb.typed(acts);
    if (Input.anyHit(['Enter', 'NumpadEnter'])) { this.save(); return; }
    if (Input.anyHit(['Escape']) || acts.back) { sfx.uiBack(); Scenes.pop(); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    drawChecker(); this.ui.begin();
    text('WRITE A MESSAGE', W / 2, 5, C.pink, 2, 1, 'outline');
    const fw = Math.min(W - 40, 250), fx = Math.floor(W / 2 - fw / 2) - 10;
    drawField(fx, 22, fw, this.kb.value, this.kb.max, this.T);
    const by = this.kb.draw(this.ui, 44);
    const sy = Math.min(H - 17, by + 3);
    drawButton(this.ui, 'clear', Math.floor(W / 2 - 112), sy, 70, 14, 'CLEAR', { on: () => { this.kb.value = ''; } });
    drawButton(this.ui, 'cancel', Math.floor(W / 2 - 35), sy, 70, 14, 'CANCEL', { on: () => Scenes.pop(), icon: ICON.back });
    drawButton(this.ui, 'save', Math.floor(W / 2 + 42), sy, 70, 14, 'SAVE', { on: () => this.save(), col: '#3d2f63', def: true });
  }
}
