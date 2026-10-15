'use strict';
/* QUACK ATTACK! — the admin tab (only shown to the admin account; the database rules enforce it).
 * Search players by username, then flag (3 flags = ban), ban, unban, reset progress or send gifts. */

// ================================================================ search
class AdminScene {
  constructor() {
    this.T = 0; this.ui = new UI(); this.kb = new Keyboard({ value: '', max: USERNAME_MAX, space: false });
    this.typing = false; this.results = null; this.note = ''; this.busy = false; this.scroll = 0;
    this.search();
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
    this.cat = 'hat'; this.item = 0;
    this.off = Cloud.watchUser(uid, u => { this.u = u; });
  }
  close() { if (this.off) this.off(); Trans.go(() => Scenes.pop()); }
  say(msg) { this.note = msg; this.noteT = 2.5; }
  act(p, done) { p.then(() => { this.say(done); sfx.pickup(); }).catch(e => { this.say(e.message === 'timeout' ? 'NO INTERNET CONNECTION?' : 'ONLY THE ADMIN CAN DO THAT'); sfx.uiBack(); }); }
  items() { return COSMETICS[this.cat].filter(it => it.id !== 'none'); }
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
    // gifts: coins
    text('GIVE COINS', x0, y + 4, C.gold, 1, 0);
    [100, 500, 1000].forEach((n, i) => drawButton(this.ui, 'c' + n, x0 + 50 + i * 44, y, 40, bh, '+' + n, { on: () => this.act(Cloud.give(u.uid, { coins: n }), 'SENT!') }));
    y += bh + 4;
    // gifts: any item (category < >, item < >)
    const list = this.items(); this.item = clamp(this.item, 0, list.length - 1);
    const it = list[this.item];
    text('GIVE ITEM', x0, y + 4, C.gold, 1, 0);
    drawButton(this.ui, 'cat', x0 + 50, y, 56, bh, CAT_NAME[this.cat] + '  >', { on: () => { this.cat = CATS[(CATS.indexOf(this.cat) + 1) % CATS.length]; this.item = 0; } });
    drawButton(this.ui, 'iprev', x0 + 110, y, 14, bh, '<', { on: () => { this.item = (this.item + list.length - 1) % list.length; } });
    panel(x0 + 127, y - 4, 22, 22, C.uiD, RARITY[it.rarity].col, null, false);
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + 128, y - 3, 20, 20); ctx.clip(); drawItemIcon(this.cat, it.id, x0 + 138, y + 7, this.T, Save.data.loadout[0]); ctx.restore();
    drawButton(this.ui, 'inext', x0 + 152, y, 14, bh, '>', { on: () => { this.item = (this.item + 1) % list.length; } });
    drawButton(this.ui, 'give', x0 + 170, y, Math.max(40, bw * 3 + 8 - 170), bh, 'GIVE', { col: '#3d2f63', on: () => this.act(Cloud.give(u.uid, { cat: this.cat, id: it.id }), 'SENT!') });
    text(it.name, x0 + 50, y + bh + 4, RARITY[it.rarity].col, 1, 0, null);
    y += bh + 16;
    drawButton(this.ui, 'wizard', x0, y, bw * 3 + 8, bh, 'GIVE THE WIZARD HAT', { col: '#4b2a7a', on: () => this.act(Cloud.give(u.uid, { cat: 'hat', id: 'wizard' }), 'SENT!') });
    if (this.noteT > 0) text(this.note, W / 2, Math.min(H - 10, y + bh + 6), C.gold, 1, 1, 'outline');
  }
}
