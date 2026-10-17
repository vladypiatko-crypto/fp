'use strict';
/* QUACK ATTACK! — the SHOP: more ways to spend coins (opened from the locker).
 *   TRAINING      permanent upgrades for your ducks (5 levels each, more expensive every level)
 *   DAILY DEALS   4 items you can buy straight away; new ones every day
 *   BOOSTERS      one-run boosts, used up at the start of your next game
 * The MEGA CHEST lives with the other chests (data.js). */

// ================================================================ training
const TRAIN_COST = [80, 200, 400, 700, 1100];
const TRAINING = [
  { k: 'hp', name: 'TOUGHER DUCK', d: '+10 MAX HP', icon: () => ICON.heart },
  { k: 'dmg', name: 'SHARPER BEAK', d: '+6% DAMAGE', icon: () => ICON.power },
  { k: 'spd', name: 'FASTER FEET', d: '+4% SPEED', icon: () => ICON.speed },
  { k: 'mag', name: 'BIGGER MAGNET', d: '+12% MAGNET', icon: () => SHOP_ART.magnet },
  { k: 'xp', name: 'QUICK LEARNER', d: '+5% XP', icon: () => ICON.wisdom },
  { k: 'coin', name: 'PIGGY BANK', d: '+10% COINS', icon: () => ICON.greed },
];
const TRAIN_MAX = TRAIN_COST.length;
// only known keys, whole numbers 0..5 (training also travels over the network for online games)
function cleanTrain(t) {
  const out = {};
  for (const tr of TRAINING) { const v = Math.floor(Number(t && t[tr.k]) || 0); if (v > 0) out[tr.k] = Math.min(TRAIN_MAX, v); }
  return out;
}

// ================================================================ boosters
const BOOSTERS = [
  { k: 'double', name: 'DOUBLE COINS', d: 'ALL COINS FROM ONE GAME X2', price: 150, icon: () => ICON.greed },
  { k: 'start', name: 'HEAD START', d: 'START WITH 2 FREE UPGRADE CARDS', price: 120, icon: () => ICON.rapid },
  { k: 'life', name: 'EXTRA LIFE', d: 'GET BACK UP ONCE WITH HALF HP', price: 200, icon: () => ICON.phoenix },
];

// ================================================================ what the admin put in the shop (meta/shop in the database, see cloud.js)
//   deals: the admin's own picks with prices (null = 4 random items every day), adminPrice: ADMIN SALE price, boost: booster prices
const SHOP_PICK_MAX = 8;
const PRICE_STEPS = [0, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 650, 800, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000, 7500,
  10000, 15000, 20000, 25000, 35000, 50000, 75000, 100000, 250000, 500000, 1000000];
function cleanShopCfg(d) {
  const price = (v, def) => { if (typeof v !== 'number') return def; v = Math.floor(v); return v >= 0 && v <= 1e7 ? v : def; };
  const out = { deals: null, adminPrice: price(d && d.adminPrice, 50000), boost: {} };
  for (const b of BOOSTERS) out.boost[b.k] = price(d && d.boost && d.boost[b.k], b.price);
  if (d && Array.isArray(d.deals) && d.deals.length) {
    out.deals = d.deals.filter(x => x && COSMETICS[x.cat] && itemOf(x.cat, x.id)).slice(0, SHOP_PICK_MAX).map(x => ({ cat: x.cat, id: x.id, price: price(x.price, 300) }));
    if (!out.deals.length) out.deals = null;
  }
  return out;
}
let SHOP_CFG = cleanShopCfg(null);
const boostPrice = b => SHOP_CFG.boost[b.k];
const adminItems = () => { const out = []; for (const cat of CATS) for (const it of COSMETICS[cat]) if (it.rarity === 'admin') out.push({ cat, id: it.id, price: SHOP_CFG.adminPrice }); return out; };
// the boosters this device has switched on and still owns, e.g. { double: 1, life: 1 }
function armedBoosters() {
  const d = Save.data, out = {};
  for (const b of BOOSTERS) if (d.armed[b.k] && (d.boosters[b.k] || 0) > 0) out[b.k] = 1;
  return out;
}
// only known boosters (they also travel over the network for online games)
function cleanBoost(o) {
  const out = {};
  for (const b of BOOSTERS) if (o && o[b.k]) out[b.k] = 1;
  return out;
}
// at the start of a game: use up this device's armed boosters. Online, every duck brings its own
// (sent when joining), the host gives the head start / extra life, everyone pays for their own
GameScene.prototype.useBoosters = function () {
  const d = Save.data, mem = this.net ? this.net.members : null;
  this.boost = mem ? cleanBoost(mem[this.localPid] && mem[this.localPid].bo) : armedBoosters();
  for (const k in this.boost) { if ((d.boosters[k] || 0) > 0) d.boosters[k]--; else delete this.boost[k]; }
  if (Object.keys(this.boost).length) Save.write();
  if (this.online && this.role !== 'host') return; // the host runs the game
  this.players.forEach((p, i) => {
    const bo = mem ? cleanBoost(mem[i] && mem[i].bo) : this.boost;
    if (bo.start) p.pending += 2;
    if (bo.life) p.up.phoenix = 1;
  });
};
// coins at the end of a game, with this device's training (and the double coins booster)
function payRun(res, client) {
  const base = res.coins + res.bonus, dbl = R && R.boost && R.boost.double, ev = eventOn('doublecoins');
  const total = Math.round(base * (1 + 0.1 * (cleanTrain(Save.data.train).coin || 0)) * (dbl ? 2 : 1) * (ev ? 2 : 1));
  Save.addCoins(total);
  recordRun(res); // quests and stats (quests.js)
  payEventCoins(res); // event coins while a holiday event runs (extras.js)
  if (R) { R.myPerk = total - base; R.myPerkLabel = dbl && ev ? 'BONUS (X4 COINS!)' : ev ? 'DOUBLE COINS EVENT!' : dbl ? 'SHOP BONUS (X2 COINS!)' : 'SHOP BONUS'; }
  return total - base;
}

// ================================================================ daily deals
const DEAL_PRICE = { common: 120, rare: 260, epic: 650, legendary: 1500 };
const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
function dailyDeals() {
  // the admin's own picks win over the random ones
  if (SHOP_CFG.deals) return { picked: true, items: SHOP_CFG.deals.map(x => x.cat + ':' + x.id), prices: Object.fromEntries(SHOP_CFG.deals.map(x => [x.cat + ':' + x.id, x.price])) };
  const d = Save.data, day = dayNumber();
  if (!d.deals || d.deals.day !== day || !d.deals.items) {
    // a fresh set of 4 things you don't have yet (the same all day)
    const pool = [];
    for (const cat of CATS) for (const it of COSMETICS[cat]) if (it.id !== 'none' && !it.gift && !it.story && !it.event && !it.eventReward && !Save.has(cat, it.id)) pool.push(cat + ':' + it.id);
    let seed = day * 9301 + 49297;
    const rnd = () => { seed = (seed * 233280 + 49297) % 2147483647; return seed / 2147483647; };
    const items = [];
    while (items.length < 4 && pool.length) items.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    d.deals = { day, items, bought: [] };
    Save.write();
  }
  return d.deals;
}

// ================================================================ art
const SHOP_ART = {
  magnet: spr(['r...r', 'r...r', 'r...r', 'rr.rr', '.rrr.'], { r: '#e8343b' }),
  stall: spr(['rwrwrwrwrw', 'rwrwrwrwrw', 'bbbbbbbbbb', 'b........b', 'b........b'], { r: '#e8343b', w: '#fff8e7', b: '#a0642d' }),
};
// the MEGA CHEST: purple with gold trim and gems (only EPIC and LEGENDARY inside)
ART.chest.mega = {
  lid: spr(['..gggggggggggg..', '.gPPPPPcPPPPPPg.', 'gPPcPPPPPPPPcPPg', 'gyyyyyyGGyyyyyyg'], { g: '#b07a00', P: '#7b3fd6', c: '#5ec8ff', y: '#ffd23f', G: '#fff3b0' }),
  base: spr(['gyyyyyyKKyyyyyyg', 'gPPPPPPKKPPPPPPg', 'gPrPPPPPPPPPPrPg', 'gPPPPPPPPPPPPPPg', 'gyyyyyyyyyyyyyyg', 'gggggggggggggggg'], { g: '#b07a00', P: '#7b3fd6', r: '#ff3b5c', y: '#ffd23f', K: '#3d3a52' }),
};

// ================================================================ the shop scene
class ShopScene {
  constructor() { this.T = 0; this.ui = new UI(); this.tab = 'train'; this.note = ''; this.noteT = 0; this.parts = []; Music.play('shop'); }
  say(m, good) { this.note = m; this.noteT = 2; if (good) { sfx.pickup(); this.confetti(); } else { sfx.uiBack(); } }
  confetti() { for (let i = 0; i < 24; i++) this.parts.push({ x: W / 2 + rand(-60, 60), y: H / 2, vx: rand(-60, 60), vy: rand(-90, -30), life: rand(0.6, 1.2), col: pick([C.gold, '#fff8e7', '#ff6fae']) }); }
  pay(n) { if (Save.data.coins < n) { this.say('NOT ENOUGH COINS'); return false; } Save.addCoins(-n); Save.write(); return true; }
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
    ctx.fillStyle = '#1f1830'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 0 : 12; x < W; x += 24) { ctx.fillStyle = '#251d3a'; ctx.fillRect(x, y, 12, 12); }
    this.ui.begin();
    // awning across the top
    for (let i = 0; i < W / 12 + 1; i++) { ctx.fillStyle = i % 2 ? '#fff8e7' : '#e8343b'; ctx.fillRect(i * 12, 0, 12, 7); ctx.beginPath(); ctx.arc(i * 12 + 6, 7, 6, 0, Math.PI); ctx.fill(); }
    text('SHOP', W / 2, 16, C.gold, 2, 1, 'outline');
    drawCoins(4, 16, Save.data.coins, T);
    const tabs = [['train', 'TRAINING'], ['deals', SHOP_CFG.deals ? 'SPECIAL OFFERS' : 'DAILY DEALS'], ['boost', 'BOOSTERS']];
    if (eventOn('adminsale')) tabs.push(['admin', 'ADMIN SALE']); else if (this.tab === 'admin') this.tab = 'train';
    const nt = tabs.length, tw = Math.min(90, Math.floor((W - 20) / nt) - 4), tx0 = Math.floor(W / 2 - (tw * nt + 4 * (nt - 1)) / 2);
    tabs.forEach(([id, label], i) => {
      const x = tx0 + i * (tw + 4);
      drawButton(this.ui, 'tab' + id, x, 32, tw, 13, label, { col: this.tab === id ? (id === 'admin' ? '#6b2a6b' : '#4b3a72') : C.ui, def: this.tab === id, on: () => { this.tab = id; this.page = 0; sfx.uiMove(); } });
      if (id === 'admin') { ctx.fillStyle = rarityCol('admin', T); ctx.fillRect(x + 2, 43, tw - 4, 1); drawNewTag(x + tw - 8, 32, T); }
    });
    const top = 50;
    if (this.tab === 'train') this.drawTraining(top);
    else if (this.tab === 'deals') this.drawDeals(top);
    else if (this.tab === 'admin') this.drawAdminSale(top);
    else this.drawBoosters(top);
    for (const q of this.parts) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    if (this.noteT > 0) text(this.note, W / 2, H - 28, C.gold, 1, 1, 'outline');
    drawButton(this.ui, 'back', 4, H - 17, 44, 14, 'BACK', { on: () => Trans.go(() => Scenes.pop()), icon: ICON.back });
  }
  // permanent upgrades: two columns of cards with 5 pips each
  drawTraining(top) {
    const tr = Save.data.train, cols = W >= 300 ? 2 : 1, gap = 4;
    const cw = Math.min(170, Math.floor((W - 16 - gap * (cols - 1)) / cols)), ch = 30, x0 = Math.floor(W / 2 - (cw * cols + gap * (cols - 1)) / 2);
    TRAINING.forEach((t, i) => {
      const x = x0 + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + 3), lv = tr[t.k] || 0, maxed = lv >= TRAIN_MAX, cost = TRAIN_COST[lv];
      panel(x, y, cw, ch, C.ui, OUT, C.uiL, false);
      drawSpr(t.icon(), x + 9, y + ch / 2);
      text(t.name, x + 18, y + 4, C.white, 1, 0, null);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 18, y + 12, cw - 86, 8); ctx.clip(); // long translations stop before the button
      text(t.d, x + 18, y + 13, C.gray, 1, 0, null);
      ctx.restore();
      for (let k = 0; k < TRAIN_MAX; k++) { ctx.fillStyle = k < lv ? C.gold : '#40325f'; ctx.fillRect(x + 18 + k * 6, y + 22, 5, 3); }
      drawButton(this.ui, 'tr' + t.k, x + cw - 64, y + 13, 60, 12, maxed ? 'MAX' : fmt('{0} C', cost), { disabled: maxed, col: Save.data.coins >= (cost || 0) ? '#3d2f63' : '#2a2535', tcol: C.gold,
        def: i === 0, on: () => { if (this.pay(cost)) { tr[t.k] = lv + 1; Save.write(); this.say(fmt('{0} LEVEL {1}!', t.name, lv + 1), true); } } });
    });
    text('TRAINING STAYS FOREVER, ALSO ONLINE', W / 2, top + Math.ceil(TRAINING.length / cols) * (ch + 3) + 3, C.gray, 1, 1, null);
  }
  // items to buy straight away: 4 random ones every day, or the admin's own picks
  drawDeals(top) {
    const deals = dailyDeals();
    if (!deals.items.length) { text('YOU HAVE EVERYTHING! COME BACK TOMORROW', W / 2, top + 30, C.gold, 1, 1); return; }
    const list = deals.items.map(key => { const [cat, id] = key.split(':'), it = itemOf(cat, id); return { cat, id, price: deals.prices ? deals.prices[key] : DEAL_PRICE[it.rarity] || 300 }; });
    const bottom = this.drawItemGrid(list, top, 'deal');
    if (deals.picked) { text('HANDPICKED BY THE ADMIN', W / 2, bottom + 4, C.pink, 1, 1, null); return; }
    // time until tomorrow's deals
    const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), left = Math.max(0, Math.floor((next - now) / 1000));
    const hh = String(Math.floor(left / 3600)).padStart(2, '0'), mm = String(Math.floor(left / 60) % 60).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
    text(fmt('NEW DEALS IN {0}', hh + ':' + mm + ':' + ss), W / 2, bottom + 4, C.gray, 1, 1, null);
  }
  // the ADMIN SALE event: every admin item, for a ton of coins
  drawAdminSale(top) {
    const bottom = this.drawItemGrid(adminItems(), top, 'adm');
    text('ONLY WHILE THE ADMIN SALE IS ON!', W / 2, bottom + 4, rarityCol('admin', this.T), 1, 1, null);
  }
  // cards with an item, its name and a buy button; up to 2 rows, more go on pages. Returns where the cards end.
  drawItemGrid(list, top, pre) {
    const T = this.T, gap = 6, maxCols = W >= 300 ? 4 : 3, cols = Math.min(maxCols, list.length || 1), rows = list.length > cols ? 2 : 1;
    const per = cols * rows, pages = Math.max(1, Math.ceil(list.length / per)); this.page = clamp(this.page || 0, 0, pages - 1);
    const avail = H - top - 36, ch = rows === 1 ? Math.min(96, avail) : Math.floor((avail - gap) / 2), cw = Math.min(84, Math.floor((W - 40 - gap * (cols - 1)) / cols));
    const x0 = Math.floor(W / 2 - (cw * cols + gap * (cols - 1)) / 2), sc = ch >= 80 ? 2 : 1, iconY = rows === 1 ? 28 : 16;
    list.slice(this.page * per, this.page * per + per).forEach((e, i) => {
      const it = itemOf(e.cat, e.id); if (!it) return;
      const x = x0 + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + gap), has = Save.has(e.cat, e.id), rc = rarityCol(it.rarity, T + i * 0.2);
      panel(x, y, cw, ch, has ? '#1c1528' : C.ui, rc, C.uiL, false);
      if (it.rarity === 'admin') { ctx.globalAlpha = 0.14 + Math.sin(T * 4 + i) * 0.05; ctx.fillStyle = rc; ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2); ctx.globalAlpha = 1; }
      ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 3, cw - 4, ch - 36); ctx.clip();
      ctx.translate(x + cw / 2, y + iconY); ctx.scale(sc, sc); ctx.translate(-(x + cw / 2), -(y + iconY));
      drawItemIcon(e.cat, e.id, x + cw / 2, y + iconY, T, Save.data.loadout[0]);
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y, cw - 2, ch); ctx.clip();
      text(it.name, x + cw / 2, y + ch - 32, rc, 1, 1, null);
      text(RARITY[it.rarity].name, x + cw / 2, y + ch - 24, C.gray, 1, 1, null);
      ctx.restore();
      const can = Save.data.coins >= e.price;
      drawButton(this.ui, pre + i, x + 4, y + ch - 16, cw - 8, 13, has ? 'OWNED' : e.price ? fmt('{0} C', e.price) : 'FREE', { disabled: has, col: can ? '#3d2f63' : '#2a2535', tcol: C.gold, def: i === 0,
        on: () => { if (this.pay(e.price)) { Save.unlock(e.cat, e.id); Save.write(); this.say(fmt('NEW ITEM: {0}!', it.name), true); sfx.chestOpen(it.rarity === 'admin' ? 'legendary' : it.rarity); } } });
    });
    if (pages > 1) {
      drawButton(this.ui, pre + 'p', 4, top + ch * rows / 2 - 8, 14, 16, '<', { on: () => { this.page = (this.page + pages - 1) % pages; sfx.uiMove(); } });
      drawButton(this.ui, pre + 'n', W - 18, top + ch * rows / 2 - 8, 14, 16, '>', { on: () => { this.page = (this.page + 1) % pages; sfx.uiMove(); } });
    }
    return top + rows * ch + (rows - 1) * gap;
  }
  // one-run boosts: buy them, switch them on, they're used at the start of the next game
  drawBoosters(top) {
    const d = Save.data, pw = Math.min(W - 16, 300), px = Math.floor(W / 2 - pw / 2), ch = 26;
    BOOSTERS.forEach((b, i) => {
      const y = top + i * (ch + 4), have = d.boosters[b.k] || 0, on = !!d.armed[b.k];
      panel(px, y, pw, ch, on && have ? '#2f3a1f' : C.ui, on && have ? C.green : OUT, C.uiL, false);
      drawSpr(b.icon(), px + 10, y + ch / 2);
      text(b.name, px + 20, y + 4, C.white, 1, 0, null);
      text(b.d, px + 20, y + 14, C.gray, 1, 0, null);
      text(fmt('HAVE {0}', have), px + pw - 132, y + 4, have ? C.gold : C.gray, 1, 0, null);
      drawButton(this.ui, 'use' + b.k, px + pw - 132, y + 12, 44, 11, on ? 'USE: ON' : 'USE: OFF', { col: on ? '#1f5c3a' : C.ui, on: () => { d.armed[b.k] = !on; Save.write(); sfx.uiMove(); } });
      const price = boostPrice(b);
      drawButton(this.ui, 'buy' + b.k, px + pw - 84, y + 7, 78, 13, price ? fmt('BUY {0} C', price) : 'FREE', { col: d.coins >= price ? '#3d2f63' : '#2a2535', tcol: C.gold, def: i === 0,
        on: () => { if (this.pay(price)) { d.boosters[b.k] = have + 1; if (!have) d.armed[b.k] = true; Save.write(); this.say(fmt('{0} +1', b.name), true); } } });
    });
    text('SWITCHED-ON BOOSTERS ARE USED AT THE START OF YOUR NEXT GAME', W / 2, top + BOOSTERS.length * (ch + 4) + 2, C.gray, 1, 1, null);
  }
}

// ================================================================ translations
addPhrases([
  ['SHOP', 'LADEN', 'МАГАЗИН'], ['TRAINING', 'TRAINING', 'ТРЕНИРОВКА'], ['DAILY DEALS', 'TAGESANGEBOTE', 'ТОВАРЫ ДНЯ'], ['BOOSTERS', 'BOOSTER', 'БУСТЕРЫ'],
  ['TOUGHER DUCK', 'ZÄHERE ENTE', 'КРЕПКАЯ УТКА'], ['+10 MAX HP', '+10 MAX HP', '+10 К МАКС. HP'], ['SHARPER BEAK', 'SCHÄRFERER SCHNABEL', 'ОСТРЫЙ КЛЮВ'], ['+6% DAMAGE', '+6% SCHADEN', '+6% УРОНА'],
  ['FASTER FEET', 'SCHNELLERE FÜSSE', 'БЫСТРЫЕ ЛАПКИ'], ['+4% SPEED', '+4% TEMPO', '+4% СКОРОСТИ'], ['BIGGER MAGNET', 'GRÖSSERER MAGNET', 'БОЛЬШОЙ МАГНИТ'], ['+12% MAGNET', '+12% MAGNET', '+12% МАГНИТ'],
  ['QUICK LEARNER', 'SCHNELL GELERNT', 'БЫСТРЫЙ УЧЕНИК'], ['+5% XP', '+5% XP', '+5% ОПЫТА'], ['PIGGY BANK', 'SPARSCHWEIN', 'КОПИЛКА'], ['+10% COINS', '+10% MÜNZEN', '+10% МОНЕТ'],
  ['{0} C', '{0} M', '{0} М'], ['MAX', 'MAX', 'МАКС'], ['{0} LEVEL {1}!', '{0} STUFE {1}!', '{0}: УРОВЕНЬ {1}!'], ['NOT ENOUGH COINS', 'NICHT GENUG MÜNZEN', 'НЕ ХВАТАЕТ МОНЕТ'],
  ['TRAINING STAYS FOREVER, ALSO ONLINE', 'TRAINING BLEIBT FÜR IMMER, AUCH ONLINE', 'ТРЕНИРОВКА НАВСЕГДА, И ОНЛАЙН ТОЖЕ'],
  ['YOU HAVE EVERYTHING! COME BACK TOMORROW', 'DU HAST ALLES! KOMM MORGEN WIEDER', 'У ТЕБЯ ВСЁ ЕСТЬ! ПРИХОДИ ЗАВТРА'], ['OWNED', 'GEHÖRT DIR', 'ЕСТЬ'], ['NEW DEALS IN {0}', 'NEUE ANGEBOTE IN {0}', 'НОВЫЕ ТОВАРЫ ЧЕРЕЗ {0}'],
  ['DOUBLE COINS', 'DOPPELTE MÜNZEN', 'ДВОЙНЫЕ МОНЕТЫ'], ['ALL COINS FROM ONE GAME X2', 'ALLE MÜNZEN EINES SPIELS X2', 'ВСЕ МОНЕТЫ ЗА ИГРУ X2'], ['HEAD START', 'BLITZSTART', 'БЫСТРЫЙ СТАРТ'],
  ['START WITH 2 FREE UPGRADE CARDS', 'STARTE MIT 2 GRATIS-KARTEN', 'НАЧНИ С 2 БЕСПЛАТНЫМИ КАРТАМИ'], ['EXTRA LIFE', 'EXTRALEBEN', 'ДОП. ЖИЗНЬ'], ['GET BACK UP ONCE WITH HALF HP', 'STEH EINMAL MIT HALBEN HP WIEDER AUF', 'ВСТАНЬ ОДИН РАЗ С ПОЛОВИНОЙ HP'],
  ['HAVE {0}', 'HAST {0}', 'ЕСТЬ {0}'], ['USE: ON', 'NUTZEN: AN', 'ИСП.: ВКЛ'], ['USE: OFF', 'NUTZEN: AUS', 'ИСП.: ВЫКЛ'], ['BUY {0} C', 'KAUFEN {0} M', 'КУПИТЬ {0} М'], ['{0} +1', '{0} +1', '{0} +1'],
  ['SWITCHED-ON BOOSTERS ARE USED AT THE START OF YOUR NEXT GAME', 'EINGESCHALTETE BOOSTER WERDEN BEIM NÄCHSTEN SPIEL VERBRAUCHT', 'ВКЛЮЧЁННЫЕ БУСТЕРЫ ТРАТЯТСЯ В НАЧАЛЕ СЛЕДУЮЩЕЙ ИГРЫ'],
  ['SHOP BONUS', 'LADEN-BONUS', 'БОНУС МАГАЗИНА'], ['BONUS (X4 COINS!)', 'BONUS (X4 MÜNZEN!)', 'БОНУС (X4 МОНЕТ!)'], ['DOUBLE COINS EVENT!', 'DOPPELTE-MÜNZEN-EVENT!', 'ИВЕНТ ДВОЙНЫХ МОНЕТ!'],
  ['SPECIAL OFFERS', 'SONDERANGEBOTE', 'СПЕЦПРЕДЛОЖЕНИЯ'], ['HANDPICKED BY THE ADMIN', 'VOM ADMIN AUSGESUCHT', 'ВЫБРАНО АДМИНОМ'], ['ONLY WHILE THE ADMIN SALE IS ON!', 'NUR SOLANGE DER ADMIN-VERKAUF LÄUFT!', 'ТОЛЬКО ПОКА ИДЁТ АДМИН-РАСПРОДАЖА!'],
  ['FREE', 'GRATIS', 'БЕСПЛАТНО'], ['SHOP BONUS (X2 COINS!)', 'LADEN-BONUS (X2 MÜNZEN!)', 'БОНУС МАГАЗИНА (X2 МОНЕТ!)'], ['MEGA CHEST', 'MEGA-TRUHE', 'МЕГА-СУНДУК'],
]);
