'use strict';
/* QUACK ATTACK! — things to come back for:
 *   DAILY QUESTS    3 new quests every day (and a bonus for finishing all 3)
 *   ACHIEVEMENTS    big goals with coin rewards, claimed by hand
 *   STATS           everything you've done, ever
 *   DAILY REWARD    coins for opening the game every day; the streak grows for 7 days
 * and some juice in the game itself: the kill COMBO counter with an announcer, ELITE robots and phone vibration. */

// ================================================================ the numbers we keep
function qdata() {
  const d = Save.data;
  d.stats = d.stats || {}; d.ach = d.ach || {}; d.quests = d.quests || { day: -1 }; d.login = d.login || { day: -1, streak: 0 };
  return d;
}
const statOf = k => qdata().stats[k] || 0;
// add to a lifetime stat and to today's quests that count it
function questBump(k, n = 1, max) {
  const d = qdata();
  d.stats[k] = max ? Math.max(d.stats[k] || 0, n) : (d.stats[k] || 0) + n;
  for (const q of dailyQuests().list) if (q.k === k && !q.claimed) q.got = Math.min(q.goal, max ? Math.max(q.got, n) : q.got + n);
  Save.write();
}
// every coin spent counts (chests, shop, deals...)
{ const add = Save.addCoins; Save.addCoins = function (n) { if (n < 0 && Save.data) { const d = qdata(); d.stats.spent = (d.stats.spent || 0) - Math.round(n); } return add.call(this, n); }; }

// after every game, on every device (also online): what happened in it
function recordRun(res) {
  if (!R || !res) return;
  const me = R.players[R.localPid || 0], mine = R.online ? [me] : R.players;
  questBump('games');
  questBump('kills', R.online ? me.kills : res.kills);
  questBump('coins', res.coins);
  if (res.bosses) questBump('bosses', res.bosses);
  if (R.mode === 'story' && res.won) questBump(R.level.event ? 'eventWins' : 'wins');
  if (R.mode === 'endless') questBump('survive', Math.floor(res.t / 60), true);
  questBump('level', Math.max(...mine.map(p => p.level)), true);
  questBump('playTime', Math.round(res.t));
  if (R.online) questBump('online');
  if (R.bestCombo) questBump('combo', R.bestCombo, true);
}

// ================================================================ daily quests
const QUEST_KINDS = [
  { k: 'kills', text: 'SCRAP {0} ROBOTS', goals: [150, 300, 500], pay: [60, 100, 150] },
  { k: 'games', text: 'PLAY {0} GAMES', goals: [2, 3, 5], pay: [50, 80, 120] },
  { k: 'wins', text: 'WIN {0} STORY LEVELS', goals: [1, 2], pay: [80, 140] },
  { k: 'bosses', text: 'BEAT {0} BOSSES', goals: [1, 2, 3], pay: [70, 110, 160] },
  { k: 'survive', text: 'SURVIVE {0} MINUTES IN ENDLESS', goals: [3, 5, 8], pay: [70, 110, 170] },
  { k: 'coins', text: 'PICK UP {0} COINS IN GAMES', goals: [30, 60, 100], pay: [60, 100, 150] },
  { k: 'chests', text: 'OPEN {0} CHESTS', goals: [1, 2, 3], pay: [50, 90, 130] },
  { k: 'level', text: 'REACH LEVEL {0} IN ONE GAME', goals: [10, 15, 20], pay: [60, 100, 150] },
  { k: 'combo', text: 'GET A {0} KILL COMBO', goals: [20, 40, 70], pay: [60, 100, 160] },
  { k: 'online', text: 'PLAY {0} ONLINE GAME', goals: [1], pay: [100] },
];
const QUEST_BONUS = 150;
function dailyQuests() {
  const d = Save.data, day = dayNumber();
  d.quests = d.quests || { day: -1 };
  if (d.quests.day !== day) {
    // 3 different kinds, the same for everybody today
    let seed = day * 7919 + 13;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const kinds = QUEST_KINDS.slice(), list = [];
    while (list.length < 3) {
      const q = kinds.splice(Math.floor(rnd() * kinds.length), 1)[0], i = Math.floor(rnd() * q.goals.length);
      list.push({ k: q.k, goal: q.goals[i], pay: q.pay[i], got: 0, claimed: false });
    }
    d.quests = { day, list, bonus: false };
  }
  return d.quests;
}
const questText = q => fmt(QUEST_KINDS.find(x => x.k === q.k).text, q.goal);

// ================================================================ achievements
const ACHIEVEMENTS = [
  { id: 'first', name: 'FIRST SCRAP', d: 'SCRAP YOUR FIRST ROBOT', goal: 1, v: () => statOf('kills'), pay: 25 },
  { id: 'k1000', name: 'ROBOT RECYCLER', d: 'SCRAP 1000 ROBOTS', goal: 1000, v: () => statOf('kills'), pay: 200 },
  { id: 'k10000', name: 'SCRAP LORD', d: 'SCRAP 10000 ROBOTS', goal: 10000, v: () => statOf('kills'), pay: 1000 },
  { id: 'b10', name: 'BOSS BUSTER', d: 'BEAT 10 BOSSES', goal: 10, v: () => statOf('bosses'), pay: 200 },
  { id: 'b50', name: 'BOSS BREAKER', d: 'BEAT 50 BOSSES', goal: 50, v: () => statOf('bosses'), pay: 800 },
  { id: 'g50', name: 'REGULAR', d: 'PLAY 50 GAMES', goal: 50, v: () => statOf('games'), pay: 250 },
  ...[1, 2, 3, 4, 5].map(n => ({ id: 'ch' + n, name: fmt('CHAPTER {0} HERO', n), d: fmt('FINISH CHAPTER {0} OF THE STORY', n), goal: 1,
    v: () => { const c = CHAPTERS.find(x => x.n === n); return c && Save.data.story.reached > c.to ? 1 : 0; }, pay: 300 })),
  { id: 'surv10', name: 'SURVIVOR', d: 'SURVIVE 10 MINUTES IN ENDLESS', goal: 10, v: () => Math.floor(Math.max(Save.data.best.e1 || 0, Save.data.best.e2 || 0) / 60), pay: 300 },
  { id: 'surv20', name: 'IMMORTAL DUCK', d: 'SURVIVE 20 MINUTES IN ENDLESS', goal: 20, v: () => Math.floor(Math.max(Save.data.best.e1 || 0, Save.data.best.e2 || 0) / 60), pay: 800 },
  { id: 'lvl30', name: 'OVERPOWERED', d: 'REACH LEVEL 30 IN ONE GAME', goal: 30, v: () => statOf('level'), pay: 400 },
  { id: 'combo100', name: 'COMBO KING', d: 'GET A 100 KILL COMBO', goal: 100, v: () => statOf('combo'), pay: 300 },
  { id: 'items50', name: 'COLLECTOR', d: 'OWN 50 ITEMS', goal: 50, v: () => Save.data.unlocked.length, pay: 300 },
  { id: 'items100', name: 'HOARDER', d: 'OWN 100 ITEMS', goal: 100, v: () => Save.data.unlocked.length, pay: 800 },
  { id: 'chests25', name: 'TREASURE HUNTER', d: 'OPEN 25 CHESTS', goal: 25, v: () => statOf('chests'), pay: 250 },
  { id: 'spend', name: 'BIG SPENDER', d: 'SPEND 10000 COINS', goal: 10000, v: () => statOf('spent'), pay: 500 },
  { id: 'train', name: 'GYM DUCK', d: 'BUY 15 TRAINING LEVELS', goal: 15, v: () => Object.values(Save.data.train || {}).reduce((a, b) => a + b, 0), pay: 400 },
  { id: 'online5', name: 'SOCIAL DUCK', d: 'PLAY 5 ONLINE GAMES', goal: 5, v: () => statOf('online'), pay: 200 },
  { id: 'event1', name: 'PARTY DUCK', d: 'WIN AN EVENT LEVEL', goal: 1, v: () => statOf('eventWins'), pay: 300 },
  { id: 'daily', name: 'BUSY BEE', d: 'FINISH 20 DAILY QUESTS', goal: 20, v: () => statOf('quests'), pay: 400 },
  { id: 'streak', name: 'LOYAL DUCK', d: 'CLAIM THE DAY 7 DAILY REWARD', goal: 1, v: () => statOf('day7'), pay: 300 },
];
const achDone = a => a.v() >= a.goal;
// rewards waiting to be claimed (the red number on the QUESTS button)
function claimable() {
  const d = qdata(), q = dailyQuests();
  return q.list.filter(x => x.got >= x.goal && !x.claimed).length + (q.list.every(x => x.claimed) && !q.bonus ? 1 : 0)
    + ACHIEVEMENTS.filter(a => !d.ach[a.id] && achDone(a)).length;
}

// ================================================================ daily login reward
const DAILY_PAY = [50, 80, 120, 160, 220, 300, 500];
function loginState() {
  const L = qdata().login, day = dayNumber();
  if (L.day === day) return { ready: false, streak: L.streak };
  return { ready: true, streak: L.day === day - 1 ? L.streak % 7 + 1 : 1 };
}
function claimLogin() {
  const L = qdata().login, s = loginState();
  if (!s.ready) return 0;
  L.day = dayNumber(); L.streak = s.streak;
  const pay = DAILY_PAY[s.streak - 1];
  Save.addCoins(pay); if (s.streak === 7) questBump('day7');
  Save.write();
  return pay;
}
// pops up once a day on the title screen
function showDailyPopup() {
  if (Trans.busy()) return;
  const top = Scenes.top();
  if (!(top instanceof TitleScene) || top.modal || top.t < 2.4 || top.news || !loginState().ready || Update.latest) return;
  Scenes.push(new DailyScene());
}

// ================================================================ the daily reward popup
class DailyScene {
  constructor() { this.t = 0; this.ui = new UI(); this.s = loginState(); this.got = 0; this.parts = []; sfx.chestOpen('rare'); }
  update(dt) {
    this.t += dt;
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 120 * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    this.ui.update(dt, this.t > 0.4 ? Input.menu() : null);
  }
  claim() {
    if (this.got) { Scenes.pop(); return; }
    this.got = claimLogin(); sfx.pickup(); sfx.quack();
    for (let i = 0; i < 40; i++) this.parts.push({ x: W / 2 + rand(-80, 80), y: H / 2, vx: rand(-70, 70), vy: rand(-110, -30), life: rand(0.6, 1.4), col: pick([C.gold, '#fff8e7', '#ff6fae', '#5ec8ff']) });
  }
  draw() {
    const prev = Scenes.stack[Scenes.stack.length - 2];
    if (prev) prev.draw();
    const T = this.t, k = Ease.outBack(Math.min(1, T / 0.4));
    ctx.fillStyle = 'rgba(15,10,26,0.8)'; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(W - 16, 300), ph = Math.min(H - 16, 132), px = Math.floor(W / 2 - pw / 2), py = Math.floor(H / 2 - ph / 2 + (1 - k) * 40);
    panel(px, py, pw, ph, C.uiD, C.gold, C.uiL);
    drawZoomText('DAILY REWARD', W / 2, py + 15, lerp(5, 2, k), C.gold);
    text(fmt('DAY {0} IN A ROW!', this.s.streak), W / 2, py + 30, C.white, 1, 1);
    // seven days: past ones ticked, today's glowing, day 7 the big one
    const cw = Math.min(36, Math.floor((pw - 20) / 7) - 3), x0 = Math.floor(W / 2 - (cw * 7 + 18) / 2), y = py + 42;
    for (let i = 0; i < 7; i++) {
      const x = x0 + i * (cw + 3), today = i + 1 === this.s.streak, past = i + 1 < this.s.streak || (today && this.got);
      const bob = today && !this.got ? Math.round(Math.sin(T * 6) * 1.5) : 0;
      panel(x, y + bob, cw, 44, today ? '#4b3a72' : past ? '#1f3a24' : C.ui, today ? C.gold : i === 6 ? '#ff8c1a' : OUT, null, false);
      text(fmt('DAY {0}', i + 1), x + cw / 2, y + 3 + bob, today ? C.gold : C.gray, 1, 1, null);
      if (i === 6) for (let c = 0; c < 3; c++) coinIcon(x + cw / 2 - 10 + c * 6, y + 14 + bob + (c % 2) * 3, T + c * 0.4); // a pile of coins
      else coinIcon(x + cw / 2 - 4, y + 16 + bob, T + i * 0.3);
      text(String(DAILY_PAY[i]), x + cw / 2, y + 33 + bob, C.gold, 1, 1, null);
      if (past) { ctx.fillStyle = C.green; ctx.fillRect(x + cw - 6, y + 2 + bob, 4, 4); }
    }
    for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    const ui = this.ui; ui.begin();
    if (this.got) text(fmt('+{0} COINS!', this.got), W / 2, py + ph - 34, C.gold, 1, 1, 'outline');
    else text('COME BACK TOMORROW FOR MORE!', W / 2, py + ph - 34, C.gray, 1, 1, null);
    drawButton(ui, 'claim', W / 2 - 40, py + ph - 22, 80, 16, this.got ? 'YAY!' : 'CLAIM', { col: '#1f5c3a', def: true, on: () => this.claim() });
  }
}

// ================================================================ the QUESTS screen: daily quests, achievements, stats
class QuestScene {
  constructor() { this.T = 0; this.ui = new UI(); this.tab = 'daily'; this.page = 0; this.parts = []; this.note = ''; this.noteT = 0; }
  pay(n, why) {
    Save.addCoins(n); Save.write(); sfx.pickup(); sfx.chestOpen('rare');
    this.note = fmt('+{0} COINS: {1}', n, why); this.noteT = 2;
    for (let i = 0; i < 26; i++) this.parts.push({ x: W / 2 + rand(-60, 60), y: H / 2, vx: rand(-60, 60), vy: rand(-90, -30), life: rand(0.6, 1.2), col: pick([C.gold, '#fff8e7', '#ff6fae']) });
  }
  update(dt) {
    this.T += dt; this.noteT = Math.max(0, this.noteT - dt);
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 120 * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    const acts = Input.menu();
    if (acts.back) { sfx.uiBack(); Trans.go(() => Scenes.pop()); return; }
    this.ui.update(dt, acts);
  }
  draw() {
    const T = this.T;
    drawChecker(); this.ui.begin();
    text('QUESTS', W / 2, 4, C.gold, 2, 1, 'outline');
    drawCoins(4, 4, Save.data.coins, T);
    const d = qdata(), q = dailyQuests();
    const tabs = [['daily', 'DAILY', q.list.filter(x => x.got >= x.goal && !x.claimed).length + (q.list.every(x => x.claimed) && !q.bonus ? 1 : 0)],
      ['ach', 'ACHIEVEMENTS', ACHIEVEMENTS.filter(a => !d.ach[a.id] && achDone(a)).length], ['stats', 'STATS', 0]];
    const tw = Math.min(100, Math.floor((W - 20) / 3) - 4), tx0 = Math.floor(W / 2 - (tw * 3 + 8) / 2);
    tabs.forEach(([id, label, n], i) => {
      const x = tx0 + i * (tw + 4);
      drawButton(this.ui, 'tab' + id, x, 21, tw, 13, label, { col: this.tab === id ? '#4b3a72' : C.ui, def: this.tab === id, on: () => { this.tab = id; this.page = 0; sfx.uiMove(); } });
      if (n) { pcirc(x + tw - 2, 22, 4, C.red); text(String(n), x + tw - 2, 20, C.white, 1, 1, null); }
    });
    const top = 39;
    if (this.tab === 'daily') this.drawDaily(top, q);
    else if (this.tab === 'ach') this.drawAch(top, d);
    else this.drawStats(top);
    for (const p of this.parts) { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
    if (this.noteT > 0) text(this.note, W / 2, H - 28, C.gold, 1, 1, 'outline');
    drawButton(this.ui, 'back', 4, H - 17, 44, 14, 'BACK', { on: () => Trans.go(() => Scenes.pop()), icon: ICON.back });
  }
  bar(x, y, w, k, col) { ctx.fillStyle = '#2a2535'; ctx.fillRect(x, y, w, 4); ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), 4); }
  drawDaily(top, q) {
    const pw = Math.min(W - 16, 320), px = Math.floor(W / 2 - pw / 2), ch = 30;
    q.list.forEach((x, i) => {
      const y = top + i * (ch + 4), done = x.got >= x.goal;
      panel(px, y, pw, ch, x.claimed ? '#1c2a1f' : C.ui, done && !x.claimed ? C.gold : OUT, C.uiL, false);
      text(questText(x), px + 8, y + 5, x.claimed ? C.gray : C.white, 1, 0, null);
      this.bar(px + 8, y + 17, pw - 140, x.got / x.goal, done ? C.green : '#5ec8ff');
      text(fmt('{0}/{1}', Math.min(x.got, x.goal), x.goal), px + pw - 90, y + 15, C.gray, 1, 2, null);
      if (x.claimed) text('DONE!', px + pw - 46, y + 11, C.green, 1, 1, null);
      else drawButton(this.ui, 'q' + i, px + pw - 84, y + 8, 78, 14, done ? fmt('CLAIM {0}', x.pay) : fmt('+{0} C', x.pay), { disabled: !done, col: done ? '#1f5c3a' : C.ui, tcol: C.gold, def: done,
        on: () => { x.claimed = true; questBump('quests'); this.pay(x.pay, 'DAILY QUEST'); } });
    });
    const y = top + 3 * (ch + 4) + 2, all = q.list.every(x => x.claimed);
    panel(px, y, pw, 20, q.bonus ? '#1c2a1f' : '#3b2a10', all && !q.bonus ? C.gold : OUT, null, false);
    text('FINISH ALL 3 FOR A BONUS', px + 8, y + 7, q.bonus ? C.gray : C.gold, 1, 0, null);
    if (q.bonus) text('DONE!', px + pw - 46, y + 7, C.green, 1, 1, null);
    else drawButton(this.ui, 'qb', px + pw - 84, y + 3, 78, 14, all ? fmt('CLAIM {0}', QUEST_BONUS) : fmt('+{0} C', QUEST_BONUS), { disabled: !all, col: all ? '#1f5c3a' : C.ui, tcol: C.gold,
      on: () => { q.bonus = true; this.pay(QUEST_BONUS, 'ALL QUESTS DONE'); } });
    const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), left = Math.max(0, Math.floor((next - now) / 1000));
    text(fmt('NEW QUESTS IN {0}', [left / 3600, left / 60 % 60, left % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':')), W / 2, y + 25, C.gray, 1, 1, null);
  }
  drawAch(top, d) {
    const T = this.T, cols = W >= 300 ? 2 : 1, gap = 4, ch = 27, rows = Math.max(1, Math.floor((H - top - 22) / (ch + gap))), per = cols * rows;
    // claimable first, then unfinished, then claimed
    const order = ACHIEVEMENTS.slice().sort((a, b) => rank(a) - rank(b));
    function rank(a) { return d.ach[a.id] ? 2 : achDone(a) ? 0 : 1; }
    const pages = Math.ceil(order.length / per); this.page = clamp(this.page, 0, pages - 1);
    const cw = Math.min(200, Math.floor((W - 30 - gap * (cols - 1)) / cols)), x0 = Math.floor(W / 2 - (cw * cols + gap * (cols - 1)) / 2);
    order.slice(this.page * per, this.page * per + per).forEach((a, i) => {
      const x = x0 + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + gap), v = a.v(), done = v >= a.goal, got = d.ach[a.id];
      panel(x, y, cw, ch, got ? '#1c2a1f' : C.ui, done && !got ? C.gold : OUT, C.uiL, false);
      // a little medal
      pcirc(x + 10, y + 13, 6, got ? C.gold : done ? '#fff3b0' : '#40325f'); pcirc(x + 10, y + 13, 3, got ? '#fff3b0' : done ? C.gold : '#2a2535');
      if (done && !got && (Math.floor(T * 4) % 2)) pring(x + 10, y + 13, 8, C.gold);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 19, y, cw - 19 - 58, ch); ctx.clip();
      text(a.name, x + 20, y + 4, got ? C.gray : done ? C.gold : C.white, 1, 0, null);
      text(a.d, x + 20, y + 12, C.gray, 1, 0, null);
      ctx.restore();
      this.bar(x + 20, y + 20, cw - 20 - 60, v / a.goal, done ? C.green : '#5ec8ff');
      if (got) text('DONE!', x + cw - 28, y + 10, C.green, 1, 1, null);
      else drawButton(this.ui, 'a' + a.id, x + cw - 56, y + 6, 52, 14, done ? fmt('CLAIM {0}', a.pay) : fmt('+{0}', a.pay), { disabled: !done, col: done ? '#1f5c3a' : C.ui, tcol: C.gold, def: done && i === 0,
        on: () => { d.ach[a.id] = true; this.pay(a.pay, a.name); } });
    });
    text(fmt('{0}/{1} DONE', ACHIEVEMENTS.filter(a => d.ach[a.id]).length, ACHIEVEMENTS.length), W / 2, H - 13, C.gray, 1, 1, null);
    if (pages > 1) {
      drawButton(this.ui, 'pp', W - 64, H - 17, 26, 13, '<', { on: () => { this.page = (this.page + pages - 1) % pages; } });
      drawButton(this.ui, 'pn', W - 34, H - 17, 26, 13, '>', { on: () => { this.page = (this.page + 1) % pages; } });
    }
  }
  drawStats(top) {
    const b = Save.data.best, pt = statOf('playTime');
    const rows = [
      ['ROBOTS SCRAPPED', statOf('kills')], ['BOSSES BEATEN', statOf('bosses')], ['GAMES PLAYED', statOf('games')], ['STORY LEVELS WON', statOf('wins')],
      ['EVENT LEVELS WON', statOf('eventWins')], ['ONLINE GAMES', statOf('online')], ['BEST COMBO', statOf('combo')], ['HIGHEST LEVEL', statOf('level')],
      ['BEST ENDLESS 1P', fmtTime(b.e1 || 0)], ['BEST ENDLESS 2P', fmtTime(b.e2 || 0)], ['COINS PICKED UP', statOf('coins')], ['COINS SPENT', statOf('spent')],
      ['CHESTS OPENED', statOf('chests')], ['ITEMS OWNED', Save.data.unlocked.length], ['QUESTS DONE', statOf('quests')], ['TIME PLAYED', Math.floor(pt / 3600) + 'H ' + Math.floor(pt / 60) % 60 + 'M'],
    ];
    const cols = W >= 300 ? 2 : 1, cw = Math.min(170, Math.floor((W - 24) / cols) - 4), x0 = Math.floor(W / 2 - (cw * cols + 8 * (cols - 1)) / 2), rh = 11;
    rows.forEach(([label, v], i) => {
      const x = x0 + (i % cols) * (cw + 8), y = top + 2 + Math.floor(i / cols) * rh;
      ctx.fillStyle = i % 4 < 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0)'; ctx.fillRect(x, y - 2, cw, rh);
      text(label, x + 4, y, C.gray, 1, 0, null); text(String(v), x + cw - 4, y, C.white, 1, 2, null);
    });
  }
}

// ================================================================ in the game: kill combo, announcer, vibration
const COMBO_CALLS = [[10, 'NICE!', '#5ec8ff'], [25, 'QUACKTASTIC!', '#51cf66'], [50, 'UNSTOPPABLE!', '#ffd23f'], [100, 'QUACKPOCALYPSE!', '#ff8c1a'], [200, 'LEGENDARY DUCK!', '#ff5ce1']];
const vibrate = ms => { try { if (Save.data.settings.vibe !== false && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* not supported */ } };
GameScene.prototype.juice = function (dt) {
  const me = this.players[this.localPid || 0], mine = this.online ? [me] : this.players;
  // phone buzz: getting hurt, levelling up
  for (const p of mine) {
    if (p.hp < (p.lastHp === undefined ? p.hp : p.lastHp) - 0.5 && !p.down) vibrate(30);
    if (p.lastLv && p.level > p.lastLv) vibrate(15);
    p.lastHp = p.hp; p.lastLv = p.level;
  }
  if (this.state !== 'play') return;
  // combo: kills close together (works online too: everybody's kills are in the snapshots)
  const kills = this.players.reduce((n, p) => n + (p.kills || 0), 0);
  if (this.comboKills === undefined) this.comboKills = kills;
  if (kills > this.comboKills) { this.combo = (this.combo || 0) + kills - this.comboKills; this.comboT = 2.2; this.comboPop = 0.15; }
  this.comboKills = kills;
  this.comboPop = Math.max(0, (this.comboPop || 0) - dt);
  if (this.combo) {
    this.bestCombo = Math.max(this.bestCombo || 0, this.combo);
    const call = COMBO_CALLS.filter(c => this.combo >= c[0]).pop();
    if (call && call[0] > (this.comboCalled || 0)) { this.comboCalled = call[0]; this.announce = { str: call[1], col: call[2], t: 0 }; sfx.level(); if (call[0] >= 50) vibrate(40); }
    if ((this.comboT -= dt) <= 0) { this.combo = 0; this.comboCalled = 0; }
  }
  if (this.announce && (this.announce.t += dt) > 1.4) this.announce = null;
};
GameScene.prototype.drawJuice = function () {
  if (this.combo >= 5) {
    const x = W - 8, y = 34, sc = this.combo >= 50 ? 2 : 1, shake = this.comboPop > 0 ? 1 : 0;
    const col = this.combo >= 100 ? '#ff8c1a' : this.combo >= 50 ? C.gold : this.combo >= 25 ? C.green : C.white;
    text('x' + this.combo, x + (shake ? rand(-1, 1) : 0), y, col, sc, 2, 'outline');
    text('COMBO', x, y + 6 * sc + 2, C.gray, 1, 2, 'outline');
    ctx.fillStyle = col; ctx.fillRect(x - 30, y + 6 * sc + 10, Math.round(30 * clamp(this.comboT / 2.2, 0, 1)), 1);
  }
  if (this.announce) {
    const a = this.announce, k = Ease.outBack(Math.min(1, a.t / 0.25));
    ctx.globalAlpha = a.t > 1.1 ? Math.max(0, 1 - (a.t - 1.1) / 0.3) : 1;
    drawZoomText(a.str, W / 2, H * 0.24, lerp(5, 2, k), a.col);
    ctx.globalAlpha = 1;
  }
};

// ================================================================ ELITE robots: rare golden ones, tougher, with better loot
const ELITE_CHANCE = 0.02;
function makeElite(e) {
  e.elite = true; e.hp *= 4; e.maxHp = e.hp; e.r = Math.round(e.r * 1.4); e.dmg *= 1.3; e.spd *= 0.92;
}
function eliteLoot(e) {
  for (let i = 0; i < 4; i++) dropAt(e.x + rand(-6, 6), e.y + rand(-6, 6), 'coin', 1);
  if (e.d.xp) dropAt(e.x, e.y, 'xp', e.d.xp * 4 * xpMul());
  if (Math.random() < 0.35) R.items.push({ k: pick(['heart', 'magnet']), x: e.x, y: e.y, t: 0 });
  burst(e.x, e.y, ['#ffd23f', '#fff3b0', '#ffffff'], 18, 110, 0.5);
  floatText(e.x, e.y - 14, 'ELITE!', C.gold, 1);
}
// a gold glow and a tiny crown on elites
function drawEliteMark(e, top) {
  const T = R.t || 0;
  pring(e.x, e.y + 1, e.r + 2 + Math.sin(T * 6) * 1, 'rgba(255,210,63,0.7)');
  const y = Math.round(top - 4);
  ctx.fillStyle = OUT; ctx.fillRect(Math.round(e.x - 4), y - 1, 9, 5);
  ctx.fillStyle = C.gold; ctx.fillRect(Math.round(e.x - 3), y + 1, 7, 2); ctx.fillRect(Math.round(e.x - 3), y, 1, 1); ctx.fillRect(Math.round(e.x), y, 1, 1); ctx.fillRect(Math.round(e.x + 3), y, 1, 1);
}

addPhrases([
  ['QUESTS', 'QUESTS', 'ЗАДАНИЯ'], ['DAILY', 'TÄGLICH', 'НА ДЕНЬ'], ['ACHIEVEMENTS', 'ERFOLGE', 'ДОСТИЖЕНИЯ'], ['STATS', 'STATISTIK', 'СТАТИСТИКА'],
  ['SCRAP {0} ROBOTS', 'VERSCHROTTE {0} ROBOTER', 'УНИЧТОЖЬ {0} РОБОТОВ'], ['PLAY {0} GAMES', 'SPIELE {0} RUNDEN', 'СЫГРАЙ {0} ИГР'], ['WIN {0} STORY LEVELS', 'GEWINNE {0} STORY-LEVEL', 'ПРОЙДИ {0} УРОВНЕЙ ИСТОРИИ'],
  ['BEAT {0} BOSSES', 'BESIEGE {0} BOSSE', 'ПОБЕДИ {0} БОССОВ'], ['SURVIVE {0} MINUTES IN ENDLESS', 'ÜBERLEBE {0} MINUTEN IM ENDLOS-MODUS', 'ПРОДЕРЖИСЬ {0} МИН. В БЕСКОНЕЧНОМ'],
  ['PICK UP {0} COINS IN GAMES', 'SAMMLE {0} MÜNZEN IN SPIELEN', 'СОБЕРИ {0} МОНЕТ В ИГРАХ'], ['OPEN {0} CHESTS', 'ÖFFNE {0} TRUHEN', 'ОТКРОЙ {0} СУНДУКОВ'],
  ['REACH LEVEL {0} IN ONE GAME', 'ERREICHE STUFE {0} IN EINEM SPIEL', 'ДОСТИГНИ {0} УРОВНЯ ЗА ИГРУ'], ['GET A {0} KILL COMBO', 'SCHAFFE EINE {0}ER-KOMBO', 'СДЕЛАЙ КОМБО ИЗ {0}'],
  ['PLAY {0} ONLINE GAME', 'SPIELE {0} ONLINE-RUNDE', 'СЫГРАЙ {0} ОНЛАЙН-ИГРУ'], ['FINISH ALL 3 FOR A BONUS', 'SCHAFFE ALLE 3 FÜR EINEN BONUS', 'ВЫПОЛНИ ВСЕ 3 ДЛЯ БОНУСА'],
  ['DONE!', 'GESCHAFFT!', 'ГОТОВО!'], ['CLAIM {0}', 'HOLEN {0}', 'ЗАБРАТЬ {0}'], ['+{0} C', '+{0} M', '+{0} М'], ['{0}/{1}', '{0}/{1}', '{0}/{1}'], ['+{0}', '+{0}', '+{0}'],
  ['NEW QUESTS IN {0}', 'NEUE QUESTS IN {0}', 'НОВЫЕ ЗАДАНИЯ ЧЕРЕЗ {0}'], ['+{0} COINS: {1}', '+{0} MÜNZEN: {1}', '+{0} МОНЕТ: {1}'], ['DAILY QUEST', 'TAGES-QUEST', 'ЗАДАНИЕ ДНЯ'],
  ['ALL QUESTS DONE', 'ALLE QUESTS GESCHAFFT', 'ВСЕ ЗАДАНИЯ ВЫПОЛНЕНЫ'], ['{0}/{1} DONE', '{0}/{1} GESCHAFFT', '{0}/{1} ВЫПОЛНЕНО'],
  ['FIRST SCRAP', 'ERSTER SCHROTT', 'ПЕРВЫЙ МЕТАЛЛОЛОМ'], ['SCRAP YOUR FIRST ROBOT', 'VERSCHROTTE DEINEN ERSTEN ROBOTER', 'УНИЧТОЖЬ ПЕРВОГО РОБОТА'],
  ['ROBOT RECYCLER', 'ROBOTER-RECYCLER', 'ПЕРЕРАБОТЧИК РОБОТОВ'], ['SCRAP 1000 ROBOTS', 'VERSCHROTTE 1000 ROBOTER', 'УНИЧТОЖЬ 1000 РОБОТОВ'], ['SCRAP LORD', 'SCHROTTKÖNIG', 'ПОВЕЛИТЕЛЬ ЛОМА'],
  ['SCRAP 10000 ROBOTS', 'VERSCHROTTE 10000 ROBOTER', 'УНИЧТОЖЬ 10000 РОБОТОВ'], ['BOSS BUSTER', 'BOSS-BEZWINGER', 'ГРОЗА БОССОВ'], ['BEAT 10 BOSSES', 'BESIEGE 10 BOSSE', 'ПОБЕДИ 10 БОССОВ'],
  ['BOSS BREAKER', 'BOSS-BRECHER', 'ЛОМАТЕЛЬ БОССОВ'], ['BEAT 50 BOSSES', 'BESIEGE 50 BOSSE', 'ПОБЕДИ 50 БОССОВ'], ['REGULAR', 'STAMMGAST', 'ЗАВСЕГДАТАЙ'], ['PLAY 50 GAMES', 'SPIELE 50 RUNDEN', 'СЫГРАЙ 50 ИГР'],
  ['CHAPTER {0} HERO', 'HELD VON KAPITEL {0}', 'ГЕРОЙ ГЛАВЫ {0}'], ['FINISH CHAPTER {0} OF THE STORY', 'BEENDE KAPITEL {0} DER STORY', 'ЗАВЕРШИ ГЛАВУ {0} ИСТОРИИ'],
  ['SURVIVOR', 'ÜBERLEBENDER', 'ВЫЖИВШИЙ'], ['SURVIVE 10 MINUTES IN ENDLESS', 'ÜBERLEBE 10 MINUTEN IM ENDLOS-MODUS', 'ПРОДЕРЖИСЬ 10 МИН. В БЕСКОНЕЧНОМ'],
  ['IMMORTAL DUCK', 'UNSTERBLICHE ENTE', 'БЕССМЕРТНАЯ УТКА'], ['SURVIVE 20 MINUTES IN ENDLESS', 'ÜBERLEBE 20 MINUTEN IM ENDLOS-MODUS', 'ПРОДЕРЖИСЬ 20 МИН. В БЕСКОНЕЧНОМ'],
  ['OVERPOWERED', 'ÜBERMÄCHTIG', 'ИМБА'], ['REACH LEVEL 30 IN ONE GAME', 'ERREICHE STUFE 30 IN EINEM SPIEL', 'ДОСТИГНИ 30 УРОВНЯ ЗА ИГРУ'], ['COMBO KING', 'KOMBO-KÖNIG', 'КОРОЛЬ КОМБО'],
  ['GET A 100 KILL COMBO', 'SCHAFFE EINE 100ER-KOMBO', 'СДЕЛАЙ КОМБО ИЗ 100'], ['COLLECTOR', 'SAMMLER', 'КОЛЛЕКЦИОНЕР'], ['OWN 50 ITEMS', 'BESITZE 50 SACHEN', 'СОБЕРИ 50 ПРЕДМЕТОВ'],
  ['HOARDER', 'HAMSTERER', 'БАРАХОЛЬЩИК'], ['OWN 100 ITEMS', 'BESITZE 100 SACHEN', 'СОБЕРИ 100 ПРЕДМЕТОВ'], ['TREASURE HUNTER', 'SCHATZJÄGER', 'ОХОТНИК ЗА СОКРОВИЩАМИ'],
  ['OPEN 25 CHESTS', 'ÖFFNE 25 TRUHEN', 'ОТКРОЙ 25 СУНДУКОВ'], ['BIG SPENDER', 'GROSSVERDIENER', 'ТРАНЖИРА'], ['SPEND 10000 COINS', 'GIB 10000 MÜNZEN AUS', 'ПОТРАТЬ 10000 МОНЕТ'],
  ['GYM DUCK', 'FITNESS-ENTE', 'КАЧОК'], ['BUY 15 TRAINING LEVELS', 'KAUFE 15 TRAININGSSTUFEN', 'КУПИ 15 УРОВНЕЙ ТРЕНИРОВКИ'], ['SOCIAL DUCK', 'GESELLIGE ENTE', 'ОБЩИТЕЛЬНАЯ УТКА'],
  ['PLAY 5 ONLINE GAMES', 'SPIELE 5 ONLINE-RUNDEN', 'СЫГРАЙ 5 ОНЛАЙН-ИГР'], ['PARTY DUCK', 'PARTY-ENTE', 'ТУСОВЩИК'], ['WIN AN EVENT LEVEL', 'GEWINNE EIN EVENT-LEVEL', 'ПРОЙДИ УРОВЕНЬ ИВЕНТА'],
  ['BUSY BEE', 'FLEISSIGE BIENE', 'ТРУДЯГА'], ['FINISH 20 DAILY QUESTS', 'SCHAFFE 20 TAGES-QUESTS', 'ВЫПОЛНИ 20 ЗАДАНИЙ ДНЯ'], ['LOYAL DUCK', 'TREUE ENTE', 'ВЕРНАЯ УТКА'],
  ['CLAIM THE DAY 7 DAILY REWARD', 'HOL DIR DIE BELOHNUNG VON TAG 7', 'ЗАБЕРИ НАГРАДУ 7-ГО ДНЯ'],
  ['ROBOTS SCRAPPED', 'ROBOTER VERSCHROTTET', 'РОБОТОВ УНИЧТОЖЕНО'], ['BOSSES BEATEN', 'BOSSE BESIEGT', 'БОССОВ ПОБЕЖДЕНО'], ['GAMES PLAYED', 'RUNDEN GESPIELT', 'ИГР СЫГРАНО'],
  ['STORY LEVELS WON', 'STORY-LEVEL GEWONNEN', 'УРОВНЕЙ ИСТОРИИ ПРОЙДЕНО'], ['EVENT LEVELS WON', 'EVENT-LEVEL GEWONNEN', 'УРОВНЕЙ ИВЕНТОВ ПРОЙДЕНО'], ['ONLINE GAMES', 'ONLINE-RUNDEN', 'ОНЛАЙН-ИГР'],
  ['BEST COMBO', 'BESTE KOMBO', 'ЛУЧШЕЕ КОМБО'], ['HIGHEST LEVEL', 'HÖCHSTE STUFE', 'МАКС. УРОВЕНЬ'], ['BEST ENDLESS 1P', 'BESTZEIT ENDLOS 1P', 'РЕКОРД БЕСКОНЕЧНОГО 1P'],
  ['BEST ENDLESS 2P', 'BESTZEIT ENDLOS 2P', 'РЕКОРД БЕСКОНЕЧНОГО 2P'], ['COINS SPENT', 'MÜNZEN AUSGEGEBEN', 'МОНЕТ ПОТРАЧЕНО'], ['CHESTS OPENED', 'TRUHEN GEÖFFNET', 'СУНДУКОВ ОТКРЫТО'],
  ['ITEMS OWNED', 'SACHEN IM BESITZ', 'ПРЕДМЕТОВ ЕСТЬ'], ['QUESTS DONE', 'QUESTS GESCHAFFT', 'ЗАДАНИЙ ВЫПОЛНЕНО'], ['TIME PLAYED', 'SPIELZEIT', 'ВРЕМЯ В ИГРЕ'],
  ['DAILY REWARD', 'TAGESBELOHNUNG', 'НАГРАДА ДНЯ'], ['DAY {0} IN A ROW!', 'TAG {0} IN FOLGE!', 'ДЕНЬ {0} ПОДРЯД!'], ['DAY {0}', 'TAG {0}', 'ДЕНЬ {0}'], ['+{0} COINS!', '+{0} MÜNZEN!', '+{0} МОНЕТ!'],
  ['COME BACK TOMORROW FOR MORE!', 'KOMM MORGEN FÜR MEHR WIEDER!', 'ПРИХОДИ ЗАВТРА ЗА НОВОЙ!'], ['CLAIM', 'HOLEN', 'ЗАБРАТЬ'], ['YAY!', 'JUHU!', 'УРА!'],
  ['COMBO', 'KOMBO', 'КОМБО'], ['NICE!', 'NICE!', 'КЛАСС!'], ['QUACKTASTIC!', 'QUAKTASTISCH!', 'КРЯТАСТИЧНО!'], ['UNSTOPPABLE!', 'UNAUFHALTSAM!', 'НЕУДЕРЖИМ!'],
  ['QUACKPOCALYPSE!', 'QUAKPOKALYPSE!', 'КРЯПОКАЛИПСИС!'], ['LEGENDARY DUCK!', 'LEGENDÄRE ENTE!', 'ЛЕГЕНДАРНАЯ УТКА!'], ['ELITE!', 'ELITE!', 'ЭЛИТА!'], ['VALENTINE', 'VALENTIN', 'ВАЛЕНТИН'], ['VIBRATION', 'VIBRATION', 'ВИБРАЦИЯ'],
]);
