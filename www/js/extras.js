'use strict';
/* QUACK ATTACK! — more to play with:
 *   BOSS RUSH   every boss in the game, one after another. Between bosses you heal up and get 2 free upgrade cards.
 *               How far you get is your record.
 *   PETS        a new locker tab: little buddies that follow your duck around and help (shoot, heal, find coins...).
 *               They come from chests like everything else. */

// ================================================================ BOSS RUSH
const RUSH_ORDER = LEVELS.map(l => l.boss); // the story's 25 bosses, easiest first
// the next boss walks in a few seconds after the last one falls
function rushTick() {
  if (R.boss && !R.boss.dead) return;
  if (R.rushNext === undefined) R.rushNext = 3;
  if (R.t < R.rushNext) return;
  if (R.bossCount >= RUSH_ORDER.length) { if (R.state === 'play') R.finish(true); return; } // beat them all!
  R.rushNext = Infinity;
  banner(fmt('BOSS {0} OF {1}', R.bossCount + 1, RUSH_ORDER.length), C.red, 2);
  spawnBoss(RUSH_ORDER[R.bossCount]);
}
// a boss is down: heal everybody, wake the fallen, 2 free cards each, and a short breather
function rushBossDown() {
  for (const p of R.players) {
    if (p.gone) continue;
    if (p.down) { p.down = false; p.hp = p.maxHp * 0.5; }
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.35);
    p.pending += 2;
  }
  R.rushNext = R.t + 5;
}
const rushHpMul = () => 0.75 + R.bossCount * 0.08;
// the boss counter where the timer usually is
function drawRushHud() {
  const cx = Math.floor(W / 2), n = R.bossCount - (R.boss && !R.boss.dead ? 1 : 0);
  panel(cx - 46, 17, 92, 10, '#3b1418', OUT, null, false);
  text(fmt('BOSSES BEATEN: {0}/{1}', n, RUSH_ORDER.length), cx, 19, C.gold, 1, 1, null);
  if (R.rushNext < Infinity && R.t < R.rushNext && R.bossCount > 0 && R.bossCount < RUSH_ORDER.length)
    text(fmt('NEXT BOSS IN {0}', Math.ceil(R.rushNext - R.t)), cx, 31, C.white, 1, 1, 'outline');
}

// ================================================================ PETS
// what each pet does: mag (bigger magnet), coin (finds a coin every n s), heal (n hp every k s),
// shoot (fires every n s: dmg, kind/col), tongue (lashes the nearest robot)
const PETS = {
  chick: { mag: 0.35 },
  piglet: { coin: 8 },
  frog: { tongue: 1.6, dmg: 10 },
  drone: { shoot: 0.9, dmg: 6, col: '#5ec8ff', fly: true },
  ninjacat: { shoot: 1.1, dmg: 11, kind: 'star' },
  fairy: { heal: 3, amt: 2, fly: true },
  dragon: { shoot: 2, dmg: 18, kind: 'fireball', fly: true },
  robopup: { shoot: 0.6, dmg: 7, col: '#7dfff5' },
  goldgoose: { shoot: 0.5, dmg: 12, col: '#ffd23f', coin: 6 },
};
const PET_ART = {
  chick: [spr(['..yy..', '.yyKo.', 'yyyyy.', '.yyy..', '.o.o..'], { y: '#ffd23f', K: OUT, o: '#ff9f1c' }), spr(['..yy..', '.yyKo.', 'yyyyy.', '.yyy..', '..o.o.'], { y: '#ffd23f', K: OUT, o: '#ff9f1c' })],
  piglet: [spr(['.pp....', 'ppppppn', 'pKpppnn', 'ppppppp', '.p.p.p.'], { p: '#ffb3c7', n: '#e8759a', K: OUT }), spr(['.pp....', 'ppppppn', 'pKpppnn', 'ppppppp', '..p.p.p'], { p: '#ffb3c7', n: '#e8759a', K: OUT })],
  frog: [spr(['.K.K..', 'gggggg', 'gGgggg', 'g.gg.g'], { g: '#51cf66', G: '#8fe39a', K: OUT }), spr(['.K.K..', 'gggggg', 'gGgggg', '.g..g.'], { g: '#51cf66', G: '#8fe39a', K: OUT })],
  drone: [spr(['.cccc.', 'mmmmmm', '.mKKm.', '..mm..'], { c: '#bde6ff', m: '#8b8aa0', K: '#5ec8ff' }), spr(['c....c', 'mmmmmm', '.mKKm.', '..mm..'], { c: '#bde6ff', m: '#8b8aa0', K: '#5ec8ff' })],
  ninjacat: [spr(['k..k.', 'kkkk.', 'krrk.', 'kkkkt', 'k.k.t'], { k: '#3d3a52', r: '#e8343b', t: '#3d3a52' }), spr(['k..k.', 'kkkk.', 'krrk.', 'kkkkt', '.k.kt'], { k: '#3d3a52', r: '#e8343b', t: '#3d3a52' })],
  fairy: [spr(['w...w', 'ww.ww', '.pfp.', '.fff.', '..f..'], { w: '#bde6ff', p: '#ff6fae', f: '#ffd1b3' }), spr(['.....', 'w...w', 'wpfpw', '.fff.', '..f..'], { w: '#bde6ff', p: '#ff6fae', f: '#ffd1b3' })],
  dragon: [spr(['..r.r.', '.rrrr.', 'rrKrrr', 'rrrrro', '.r..r.'], { r: '#e8343b', K: OUT, o: '#ff8c1a' }), spr(['r....r', '.rrrr.', 'rrKrrr', 'rrrrro', '.r..r.'], { r: '#e8343b', K: OUT, o: '#ff8c1a' })],
  robopup: [spr(['.m..m.', 'mmmmmm', 'mcmmcm', 'mmmmmm', '.m..m.'], { m: '#c3c2d4', c: '#7dfff5' }), spr(['.m..m.', 'mmmmmm', 'mcmmcm', 'mmmmmm', 'm....m'], { m: '#c3c2d4', c: '#7dfff5' })],
  goldgoose: [spr(['..yy..', '.yyKo.', 'yyyyy.', 'yYyyy.', '.o.o..'], { y: '#ffd23f', Y: '#fff3b0', K: OUT, o: '#b07a00' }), spr(['..yy..', '.yyKo.', 'yyyyy.', 'yYyyy.', '..o.o.'], { y: '#ffd23f', Y: '#fff3b0', K: OUT, o: '#b07a00' })],
};
PROJ_ART.fireball = spr(['.oo.', 'oyyo', 'oyyo', '.oo.'], { o: '#ff8c1a', y: '#ffd23f' });
SHOT_EXTRA.fireball = { art: 'fireball', boom: true, home: true, cols: ['#ff8c1a', '#ffd23f', '#e8343b'], spin: 1 };
COSMETICS.pet = [
  { id: 'none', name: 'NO PET', rarity: 'common' },
  { id: 'chick', name: 'BABY CHICK', rarity: 'common', desc: 'BIGGER MAGNET' },
  { id: 'piglet', name: 'PIGLET', rarity: 'rare', desc: 'SNIFFS OUT A COIN NOW AND THEN' },
  { id: 'frog', name: 'FROGGY', rarity: 'rare', desc: 'ZAPS ROBOTS WITH ITS TONGUE' },
  { id: 'drone', name: 'MINI DRONE', rarity: 'rare', desc: 'SHOOTS LITTLE LASERS' },
  { id: 'ninjacat', name: 'NINJA CAT', rarity: 'epic', desc: 'THROWS NINJA STARS' },
  { id: 'fairy', name: 'FAIRY', rarity: 'epic', desc: 'HEALS YOU A LITTLE' },
  { id: 'dragon', name: 'BABY DRAGON', rarity: 'legendary', desc: 'SPITS EXPLODING FIREBALLS' },
  { id: 'robopup', name: 'ROBO PUP', rarity: 'legendary', desc: 'FAST LASER BARKS' },
  { id: 'goldgoose', name: 'GOLDEN GOOSE', rarity: 'admin', gift: true, desc: 'GOLD SHOTS AND GOLD COINS' },
];
CATS.push('pet'); CAT_NAME.pet = 'PET'; DEFAULT_UNLOCKS.push('pet:none');
ICON.tabPet = spr(['.yy.', 'yyKo', 'yyy.', '.o.o'], { y: '#ffd23f', K: OUT, o: '#ff9f1c' });
// icons for the main menu buttons
const MENU_ICON = {
  endless: spr(['.oo.oo.', 'o..o..o', '.oo.oo.'], { o: '#7dd3ff' }),
  online: spr(['.ggg.', 'gbgbg', 'bgggb', 'gbgbg', '.ggg.'], { g: '#8fe39a', b: '#2f9e44' }),
  rush: spr(['.www.', 'wkwkw', 'wwwww', '.w.w.'], { w: '#fff8e7', k: OUT }),
  shop: spr(['.yy.', 'yYyy', 'yyyy', '.yy.'], { y: '#ffd23f', Y: '#fff3b0' }),
  quests: spr(['wwww', 'wkkw', 'wwww', 'wkkw', 'wwww'], { w: '#fff3dc', k: '#8b8aa0' }),
};
const petOf = p => (p && p.lo && PETS[p.lo.pet]) || null;
const petMag = p => { const d = petOf(p); return d && d.mag ? d.mag : 0; };

// draw a pet (also used in the locker, on the title screen and in gift popups)
function drawPetAt(id, x, y, t, sc = 1, flip = false) {
  const a = PET_ART[id]; if (!a) return;
  const fly = PETS[id] && PETS[id].fly, s = a[Math.floor(t * (fly ? 10 : 6)) % 2];
  const hop = fly ? Math.sin(t * 4) * 2 * sc - 6 * sc : -Math.abs(Math.sin(t * 6)) * sc;
  shadow(x, y + 1, 3 * sc);
  drawSprX(s, x, y + hop, { ay: 1, sc, flip });
}
// follow the duck: trail behind it, on the side it isn't facing
function petFollow(p, dt) {
  if (!petOf(p)) return;
  const back = p.facing === 'left' ? 1 : p.facing === 'right' ? -1 : (p.petSide || 1);
  p.petSide = back;
  const tx = p.x + back * 13, ty = p.y + 3;
  if (p.petX === undefined || d2(p.petX, p.petY, tx, ty) > 200 * 200) { p.petX = tx; p.petY = ty; }
  const k = Math.min(1, dt * 6);
  p.petFlip = tx < p.petX - 0.5 ? true : tx > p.petX + 0.5 ? false : p.petFlip;
  p.petX += (tx - p.petX) * k; p.petY += (ty - p.petY) * k;
  p.petT = (p.petT || 0) + dt * (p.moving ? 1.6 : 1);
}
// what the pet does (only where the game really runs: offline, or the host)
function petAct(p, dt) {
  const d = petOf(p); if (!d || p.down || p.gone || p.petX === undefined) return;
  const lvMul = 1 + 0.05 * (p.level - 1);
  p.petCd = (p.petCd || 0) - dt; p.petCoin = (p.petCoin || 0) - dt;
  if (d.coin && p.petCoin <= 0) { p.petCoin = d.coin; dropAt(p.petX, p.petY, 'coin', 1); burst(p.petX, p.petY - 4, ['#ffd23f', '#fff3b0'], 5, 40, 0.3); }
  if (p.petCd > 0) return;
  if (d.heal) {
    p.petCd = d.heal;
    if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + d.amt); burst(p.x, p.y - 8, ['#51cf66', '#c3ff9a', '#ffffff'], 4, 30, 0.4); }
    return;
  }
  const tgt = nearestEnemy(p.petX, p.petY, d.tongue ? 60 : 140);
  if (!tgt) return;
  if (d.tongue) {
    p.petCd = d.tongue;
    R.fx.push({ k: 'zap', pts: [[p.petX, p.petY - 3], [tgt.x, tgt.y]], t: 0, dur: 0.12, col: '#ff6fae' });
    hurtEnemy(tgt, d.dmg * lvMul, 0, 0, 0, p);
    return;
  }
  p.petCd = d.shoot;
  const a = Math.atan2(tgt.y - p.petY, tgt.x - p.petX), sp = d.kind === 'fireball' ? 130 : 210, kind = d.kind || 'bullet';
  const shot = { kind, x: p.petX, y: p.petY - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9, max: 0.9, dmg: d.dmg * lvMul, pierce: kind === 'star' ? 1 : 0, hit: new Set(), owner: p, r: 2,
    col: d.col || '#fff8e7', kb: 30, rot: 0 };
  if (kind === 'fireball') { shot.aoe = 18; shot.tgt = tgt; shot.life = shot.max = 1.4; }
  R.shots.push(shot);
}
function drawPet(p) {
  if (!petOf(p) || p.petX === undefined || p.down || p.gone) return;
  drawPetAt(p.lo.pet, p.petX, p.petY, p.petT || 0, 1, !!p.petFlip);
}

// ================================================================ EVENT COINS
// while a holiday event runs, every game also pays EVENT COINS; the event chests (pumpkin, present...) cost those
const EVENT_CHEST_COST = 30;
const TOKEN_ICON = spr(['.pp.', 'pPpp', 'pppp', '.pp.'], { p: '#c06bff', P: '#f0d8ff' });
const holidayOn = () => runningEvents().some(id => EVENTS[id].kind === 'holiday');
// after a game, on every device: scrapped robots, time, bosses, and a big bonus for winning an event level
function payEventCoins(res) {
  if (R) R.myEventCoins = 0;
  if (!R || !res || !holidayOn()) return 0;
  const me = R.players[R.localPid || 0], kills = R.online ? me.kills : res.kills;
  let n = 3 + Math.floor(kills / 30) + Math.floor(res.t / 30) + (res.bosses || 0) * 3;
  if (R.mode === 'story' && res.won && R.level.event) n += 20;
  if (eventOn('doublecoins')) n *= 2;
  Save.data.tokens = (Save.data.tokens || 0) + n; Save.write();
  R.myEventCoins = n;
  return n;
}
// the purple event coin counter (next to the normal coins)
function drawTokens(x, y, t) {
  const s = String(Save.data.tokens || 0), w = textW(s) + 16, bob = Math.round(Math.sin(t * 3)) ;
  panel(x, y, w, 13, '#2f1f48', OUT, '#4b3a72');
  drawSpr(TOKEN_ICON, x + 6, y + 6 + (bob > 0 ? 0 : 0));
  text(s, x + 12, y + 4, '#d9a6ff', 1, 0, null);
  return w;
}
// draw the coins, plus the event coins while an event is on (or while you still have some)
function drawWallet(x, y, t) {
  const w = drawCoins(x, y, Save.data.coins, t);
  if (holidayOn() || Save.data.tokens) drawTokens(x + w + 3, y, t);
}

ACHIEVEMENTS.push(
  { id: 'rush5', name: 'BOSS RUSHER', d: 'BEAT 5 BOSSES IN ONE BOSS RUSH', goal: 5, v: () => statOf('rush'), pay: 300 },
  { id: 'rush25', name: 'BOSS RUSH CHAMPION', d: 'BEAT ALL 25 BOSSES IN A BOSS RUSH', goal: 25, v: () => statOf('rush'), pay: 2000 },
  { id: 'pets3', name: 'PET LOVER', d: 'OWN 3 PETS', goal: 3, v: () => Save.data.unlocked.filter(k => k.startsWith('pet:') && k !== 'pet:none').length, pay: 250 },
);

addPhrases([
  ['BOSS RUSH', 'BOSS-ANSTURM', 'БОСС-РАШ'], ['BOSS {0} OF {1}', 'BOSS {0} VON {1}', 'БОСС {0} ИЗ {1}'], ['BOSSES BEATEN: {0}/{1}', 'BOSSE BESIEGT: {0}/{1}', 'БОССОВ ПОБЕЖДЕНО: {0}/{1}'],
  ['NEXT BOSS IN {0}', 'NÄCHSTER BOSS IN {0}', 'СЛЕДУЮЩИЙ БОСС ЧЕРЕЗ {0}'], ['EVERY BOSS, ONE AFTER ANOTHER!', 'JEDER BOSS, EINER NACH DEM ANDEREN!', 'ВСЕ БОССЫ ПОДРЯД!'],
  ['HEAL UP AND 2 FREE CARDS AFTER EACH BOSS', 'HEILUNG UND 2 GRATIS-KARTEN NACH JEDEM BOSS', 'ЛЕЧЕНИЕ И 2 КАРТЫ ПОСЛЕ КАЖДОГО БОССА'], ['BOSSES BEATEN', 'BOSSE BESIEGT', 'БОССОВ ПОБЕЖДЕНО'],
  ['NEW RECORD!', 'NEUER REKORD!', 'НОВЫЙ РЕКОРД!'], ['BEST BOSS RUSH {0}', 'BESTER BOSS-ANSTURM {0}', 'РЕКОРД БОСС-РАША {0}'],
  ['PET', 'HAUSTIER', 'ПИТОМЕЦ'], ['PETS', 'HAUSTIERE', 'ПИТОМЦЫ'], ['NO PET', 'KEIN HAUSTIER', 'БЕЗ ПИТОМЦА'], ['BABY CHICK', 'KÜKEN', 'ЦЫПЛЁНОК'], ['BIGGER MAGNET', 'GRÖSSERER MAGNET', 'БОЛЬШОЙ МАГНИТ'],
  ['PIGLET', 'FERKEL', 'ПОРОСЁНОК'], ['SNIFFS OUT A COIN NOW AND THEN', 'ERSCHNÜFFELT AB UND ZU EINE MÜNZE', 'ИНОГДА НАХОДИТ МОНЕТКУ'], ['FROGGY', 'FRÖSCHCHEN', 'ЛЯГУШОНОК'],
  ['ZAPS ROBOTS WITH ITS TONGUE', 'TRIFFT ROBOTER MIT DER ZUNGE', 'БЬЁТ РОБОТОВ ЯЗЫКОМ'], ['MINI DRONE', 'MINI-DROHNE', 'МИНИ-ДРОН'], ['SHOOTS LITTLE LASERS', 'SCHIESST KLEINE LASER', 'СТРЕЛЯЕТ ЛАЗЕРАМИ'],
  ['NINJA CAT', 'NINJA-KATZE', 'КОТ-НИНДЗЯ'], ['THROWS NINJA STARS', 'WIRFT NINJA-STERNE', 'КИДАЕТ СЮРИКЕНЫ'], ['FAIRY', 'FEE', 'ФЕЯ'], ['HEALS YOU A LITTLE', 'HEILT DICH EIN BISSCHEN', 'НЕМНОГО ЛЕЧИТ'],
  ['BABY DRAGON', 'BABY-DRACHE', 'ДРАКОНЧИК'], ['SPITS EXPLODING FIREBALLS', 'SPUCKT EXPLODIERENDE FEUERBÄLLE', 'ПЛЮЁТСЯ ВЗРЫВНЫМИ ФАЕРБОЛАМИ'], ['ROBO PUP', 'ROBO-WELPE', 'РОБО-ЩЕНОК'],
  ['FAST LASER BARKS', 'SCHNELLES LASER-BELLEN', 'БЫСТРЫЙ ЛАЗЕРНЫЙ ЛАЙ'], ['GOLDEN GOOSE', 'GOLDENE GANS', 'ЗОЛОТОЙ ГУСЬ'], ['GOLD SHOTS AND GOLD COINS', 'GOLDSCHÜSSE UND GOLDMÜNZEN', 'ЗОЛОТЫЕ ВЫСТРЕЛЫ И МОНЕТЫ'],
  ['BOSS RUSHER', 'BOSS-STÜRMER', 'БОСС-РАШЕР'], ['BEAT 5 BOSSES IN ONE BOSS RUSH', 'BESIEGE 5 BOSSE IN EINEM BOSS-ANSTURM', 'ПОБЕДИ 5 БОССОВ В ОДНОМ БОСС-РАШЕ'],
  ['BOSS RUSH CHAMPION', 'BOSS-ANSTURM-CHAMPION', 'ЧЕМПИОН БОСС-РАША'], ['BEAT ALL 25 BOSSES IN A BOSS RUSH', 'BESIEGE ALLE 25 BOSSE IM BOSS-ANSTURM', 'ПОБЕДИ ВСЕХ 25 БОССОВ В БОСС-РАШЕ'],
  ['EVENT COINS', 'EVENT-MÜNZEN', 'МОНЕТЫ ИВЕНТА'], ['ONLY WITH EVENT COINS', 'NUR MIT EVENT-MÜNZEN', 'ТОЛЬКО ЗА МОНЕТЫ ИВЕНТА'],
  ['PLAY WHILE THE EVENT IS ON TO EARN THEM', 'SPIELE WÄHREND DES EVENTS, UM SIE ZU VERDIENEN', 'ИГРАЙ ВО ВРЕМЯ ИВЕНТА, ЧТОБЫ ИХ ПОЛУЧИТЬ'],
  ['PET LOVER', 'TIERFREUND', 'ЛЮБИТЕЛЬ ПИТОМЦЕВ'], ['OWN 3 PETS', 'BESITZE 3 HAUSTIERE', 'СОБЕРИ 3 ПИТОМЦА'], ['SHOP', 'LADEN', 'МАГАЗИН'],
]);
