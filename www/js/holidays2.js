'use strict';
/* QUACK ATTACK! — even more events for the admin to switch on (admin tab -> EVENTS):
 *   LUNAR NEW YEAR   red lanterns, a lucky dragon boss and red-and-gold limited items
 *   ST. PATRICK'S    rainbows and shamrocks, a shamrock golem and green limited items
 *   bonus: ELITE HUNT (elite robots 5x as often) and LUCKY DROPS (twice the coins and hearts) */

// ================================================================ LUNAR NEW YEAR
PROJ_ART.lanternshot = spr(['.y.', 'rrr', 'rYr', '.y.'], { r: '#e8343b', y: '#ffd23f', Y: '#fff3b0' });
DECO_ART.lanternS = spr(['.y.', 'rrr', '.y.'], { r: '#e8343b', y: '#ffd23f' });
eventBoss('luckydragon', 'eel', 'DRAGON-BOT', { c: '#b0201f', C: '#e8343b', y: '#ffd23f', e: '#ffffff', E: OUT }, { hp: 3000, col: '#e8343b', bullet: 'lanternshot', summonText: 'GONG! GONG! HONK!' });
const LUNAR_LEVEL = { n: 'L', name: 'LANTERN FESTIVAL', world: 'pond', time: 120, diff: 5, boss: 'luckydragon', reward: 'dragonhat', rewardCat: 'hat', event: 'lunar',
  pool: { bolt: 8, boom: 3, goo: 3, drone: 2 },
  intro: [['daisy', 'HAPPY LUNAR NEW YEAR! LOOK AT ALL THE LANTERNS!'], ['honk', 'HONK! MY DRAGON-BOT WILL BLOW OUT EVERY SINGLE ONE!'], ['duck', 'NOT TONIGHT! QUACK!']], outro: [] };
SKIN_PAL.luckyred = { h: '#e8343b', y: '#e8343b', d: '#b0201f', w: '#ffd23f', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#ff9a9a' };
HAT_ART.dragonhat = hat({ rows: ['.y......y.', '.yy....yy.', '..rrrrrr..', '.rKrrrrKr.', '.rrryyrrr.', 'yyyyyyyyyy'], x: 1, y: 1 }, { r: '#e8343b', y: '#ffd23f', K: OUT });
HAT_MOTION.dragonhat = { amp: 0.4, sp: 3 };
HAT_SPARK.dragonhat = ['#ffd23f', '#e8343b'];
HALO_FX.lanterns = orbitHalo(4, 0.8, (x, y, s) => { ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y - 2 * s, s, s); ctx.fillStyle = '#e8343b'; ctx.fillRect(x - s, y - s, s * 3, s * 2); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y + s, s, s); });
TRAIL_FX.envelopes = (T, x, y) => T.push({ x: x + rand(-3, 3), y: y - rand(2, 6), vx: rand(-6, 6), vy: rand(-12, -4), life: 0.8, max: 0.8, s: DECO_ART.lanternS });
TRAIL_ICON.envelopes = (x, y, t) => { for (let i = 0; i < 3; i++) drawSpr(DECO_ART.lanternS, x - 6 + i * 6, y + Math.round(Math.sin(t * 4 + i) * 2)); };
const LU = { rarity: 'limited', event: 'lunar' };
COSMETICS.skin.push(Object.assign({ id: 'luckyred', name: 'LUCKY RED' }, LU));
COSMETICS.hat.push(Object.assign({ id: 'dragonhat', name: 'DRAGON HAT', eventReward: true }, LU));
COSMETICS.halo.push(Object.assign({ id: 'lanterns', name: 'LANTERN RING' }, LU));
COSMETICS.trail.push(Object.assign({ id: 'envelopes', name: 'LANTERN TRAIL' }, LU));
CHESTS.lantern = { name: 'LANTERN CHEST', price: 200, odds: { limited: 100 }, event: 'lunar' };
ART.chest.lantern = eventChest({ b: '#8a1f1f', B: '#e8343b', g: '#ffd23f', y: '#fff3b0' });
SONGS.lunar = {
  bpm: 120, lead: 'triangle', drums: 'light',
  bass: [48, 0, 55, 0, 48, 0, 55, 0, 45, 0, 52, 0, 45, 0, 52, 0, 43, 0, 50, 0, 43, 0, 50, 0, 48, 0, 55, 0, 48, 0, 0, 0],
  mel: [72, 0, 74, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 0, 0, 74, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0,
    76, 0, 79, 0, 81, 0, 84, 0, 81, 0, 79, 0, 76, 0, 79, 0, 74, 0, 72, 0, 69, 0, 72, 0, 72, 0, 0, 0, 0, 0, 0, 0],
};
// a string of red lanterns across the top, and sky lanterns floating up
function drawLanternString(y0, T, n) {
  for (let x = 0; x < W; x += 3) { ctx.fillStyle = '#3d1f1f'; ctx.fillRect(x, Math.round(y0 + Math.sin(x / W * Math.PI * 3) * 3), 3, 1); }
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * W / n, y = Math.round(y0 + Math.sin(x / W * Math.PI * 3) * 3) + 2, sw = Math.round(Math.sin(T * 2 + i) * 1);
    ctx.fillStyle = OUT; ctx.fillRect(x - 4 + sw, y, 9, 9); ctx.fillStyle = '#e8343b'; ctx.fillRect(x - 3 + sw, y + 1, 7, 7);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 3 + sw, y + 1, 7, 1); ctx.fillRect(x - 3 + sw, y + 7, 7, 1); ctx.fillRect(x + sw, y + 8, 1, 3);
    pcirc(x + sw, y + 4, 6, 'rgba(255,200,80,0.1)');
  }
}
function drawLunarTitle(gy, T) {
  ctx.fillStyle = 'rgba(60,10,20,0.35)'; ctx.fillRect(0, 0, W, gy);
  drawFloaters(0, 0, W, gy, T, 7, (x, y, i) => { ctx.fillStyle = 'rgba(255,140,40,0.85)'; ctx.fillRect(x - 1, y, 3, 4); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y + 1, 1, 2); }, -6);
  drawLanternString(4, T, 9);
}
function drawLunarView(v, T) {
  ctx.fillStyle = 'rgba(60,10,20,0.12)'; ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawFloaters(v.x, v.y, v.w, v.h, T, 6, (x, y) => { ctx.fillStyle = 'rgba(255,140,40,0.75)'; ctx.fillRect(x - 1, y, 3, 4); }, -8);
  ctx.restore();
}
EVENTS.lunar = { name: 'LUNAR NEW YEAR', short: 'LUNAR', col: '#e8343b', kind: 'holiday', level: LUNAR_LEVEL, song: 'lunar', title: drawLunarTitle, view: drawLunarView, hat: DECO_ART.lanternS,
  icon: PROJ_ART.lanternshot, chest: 'lantern', bg: '#3b1414', btn: '#8a1f1f', tcol: '#ffd23f' };

// ================================================================ ST. PATRICK'S DAY
DECO_ART.cloverS = spr(['g.g', '.g.', 'g.g'], { g: '#2f9e44' });
DECO_ART.leaf3 = spr(['g.g', 'ggg', '.k.'], { g: '#51cf66', k: '#2f6b1a' }, null);
eventBoss('clovergolem', 'golem', 'SHAMROCK GOLEM', { R: '#1f5c2a', r: '#2f9e44', K: '#0f2a14', e: '#ffd23f', o: '#ffd23f', L: '#8fe39a' }, { hp: 2900, col: '#51cf66', summonText: 'TOP O\' THE HONK!' });
const PATRICK_LEVEL = { n: 'P', name: 'RAINBOW MEADOW', world: 'knight', time: 115, diff: 4.5, boss: 'clovergolem', reward: 'leprechaun', rewardCat: 'hat', event: 'patrick',
  pool: { bolt: 9, goo: 4, boom: 2, drone: 2 },
  intro: [['duck', 'A RAINBOW! THEY SAY THERE IS A POT OF GOLD AT THE END!'], ['honk', 'HONK! THERE IS! AND MY SHAMROCK GOLEM IS SITTING ON IT!'], ['daisy', 'THEN LET\'S GO GET LUCKY! QUACK!']], outro: [] };
SKIN_PAL.clover = { h: '#51cf66', y: '#51cf66', d: '#2f9e44', w: '#c3ff9a', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#ffb3a7' };
HAT_ART.leprechaun = hat({ rows: ['..gggggg..', '..gggggg..', '..kkykkk..', '..gggggg..', 'gggggggggg'], x: 1, y: 1 }, { g: '#2f9e44', k: '#1b1325', y: '#ffd23f' });
HAT_MOTION.leprechaun = { amp: 0.3, sp: 3 };
HAT_SPARK.leprechaun = ['#ffd23f', '#51cf66'];
TRAIL_FX.shamrocks = (T, x, y) => T.push({ x: x + rand(-3, 3), y: y - rand(1, 6), vx: rand(-8, 8), vy: rand(-12, -4), life: 0.8, max: 0.8, s: DECO_ART.leaf3, sway: rand(0, 6) });
TRAIL_ICON.shamrocks = (x, y, t) => { for (let i = 0; i < 3; i++) drawSpr(DECO_ART.leaf3, x - 6 + i * 6, y + Math.round(Math.sin(t * 3 + i) * 2)); };
GUN_ART.goldpot = spr(['.yyyy...', 'kkkkkkkY', 'kkk.....', 'k.k.....'], { k: '#1b1325', y: '#ffd23f', Y: '#fff3b0' });
WEAPONS.goldpot = { cd: 0.36, dmg: 12, n: 1, spread: 0.2, speed: 200, life: 0.8, r: 2, kb: 40, range: 150, col: '#ffd23f' };
SHOT_KIND.goldpot = 'goldcoin';
SHOT_EXTRA.goldcoin = { art: 'goldcoinshot', spin: 1.5, pierce: 1 };
PROJ_ART.goldcoinshot = spr(['.y.', 'yYy', '.y.'], { y: '#ffd23f', Y: '#fff3b0' });
SHOOT_SFX.goldpot = p => { tone(1500 * p, 0.05, 'square', 0.03, 2100); };
const PA = { rarity: 'limited', event: 'patrick' };
COSMETICS.skin.push(Object.assign({ id: 'clover', name: 'CLOVER' }, PA));
COSMETICS.hat.push(Object.assign({ id: 'leprechaun', name: 'LUCKY TOP HAT', eventReward: true }, PA));
COSMETICS.trail.push(Object.assign({ id: 'shamrocks', name: 'SHAMROCKS' }, PA));
COSMETICS.weapon.push(Object.assign({ id: 'goldpot', name: 'POT OF GOLD', desc: 'SHOOTS LUCKY GOLD COINS' }, PA));
CHESTS.potgold = { name: 'LUCKY CHEST', price: 200, odds: { limited: 100 }, event: 'patrick' };
ART.chest.potgold = eventChest({ b: '#1f5c2a', B: '#2f9e44', g: '#ffd23f', y: '#fff3b0' });
SONGS.jig = {
  bpm: 150, lead: 'square', drums: 'light',
  bass: [50, 0, 57, 0, 50, 0, 57, 0, 48, 0, 55, 0, 48, 0, 55, 0, 50, 0, 57, 0, 50, 0, 57, 0, 45, 0, 52, 0, 50, 0, 0, 0],
  mel: [74, 76, 78, 0, 79, 78, 76, 0, 74, 76, 78, 0, 81, 0, 78, 0, 72, 74, 76, 0, 79, 76, 72, 0, 74, 0, 72, 0, 69, 0, 0, 0,
    74, 76, 78, 0, 79, 78, 76, 0, 78, 79, 81, 0, 83, 0, 81, 0, 79, 78, 76, 0, 74, 76, 78, 0, 74, 0, 0, 0, 74, 0, 0, 0],
};
function drawPatrickTitle(gy, T) {
  // a rainbow over the meadow, ending in a pot of gold
  const cx = W * 0.8, cy = gy + 10, cols = ['#e8343b', '#ff8c1a', '#ffd23f', '#51cf66', '#5ec8ff', '#9d5cff'];
  ctx.save(); ctx.globalAlpha = 0.55;
  cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 60 - i * 3, Math.PI, Math.PI * 2); ctx.stroke(); });
  ctx.restore();
  const px = cx + 58, py = gy + 18;
  pellipse(px, py, 8, 5, OUT); pellipse(px, py, 7, 4, '#1b1325'); pellipse(px, py - 3, 6, 2, '#ffd23f');
  if (Math.floor(T * 3) % 2) { ctx.fillStyle = '#fff3b0'; ctx.fillRect(Math.round(px - 2), Math.round(py - 5), 1, 1); }
  drawFloaters(0, 0, W, H, T, 12, (x, y) => drawSpr(DECO_ART.leaf3, x, y), 9);
}
function drawPatrickView(v, T) {
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawFloaters(v.x, v.y, v.w, v.h, T, 9, (x, y) => drawSpr(DECO_ART.leaf3, x, y), 8);
  ctx.restore();
}
EVENTS.patrick = { name: "ST. PATRICK'S DAY", short: 'ST. PATRICK', col: '#51cf66', kind: 'holiday', level: PATRICK_LEVEL, song: 'jig', title: drawPatrickTitle, view: drawPatrickView,
  hat: DECO_ART.cloverS, icon: GUN_ART.goldpot, chest: 'potgold', bg: '#14301a', btn: '#1f5c2a', tcol: '#ffd23f' };

// ================================================================ bonus events
Object.assign(EVENTS, {
  elitehunt: { name: 'ELITE HUNT', col: '#ffd23f', kind: 'bonus', desc: 'ELITE ROBOTS 5X AS OFTEN' },
  luckydrops: { name: 'LUCKY DROPS', col: '#51cf66', kind: 'bonus', desc: 'TWICE THE COINS AND HEARTS' },
});
const eliteChance = () => ELITE_CHANCE * (eventOn('elitehunt') ? 5 : 1);
const luckMul = () => (eventOn('luckydrops') ? 2 : 1);

addPhrases([
  ['LUNAR NEW YEAR', 'MONDNEUJAHR', 'ЛУННЫЙ НОВЫЙ ГОД'], ['LUNAR', 'MONDJAHR', 'ЛУННЫЙ'], ['LANTERN FESTIVAL', 'LATERNENFEST', 'ПРАЗДНИК ФОНАРЕЙ'], ['DRAGON-BOT', 'DRACHEN-BOT', 'ДРАКОН-БОТ'],
  ['GONG! GONG! HONK!', 'GONG! GONG! HONK!', 'ГОНГ! ГОНГ! ГА!'], ['LUCKY RED', 'GLÜCKSROT', 'СЧАСТЛИВЫЙ КРАСНЫЙ'], ['DRAGON HAT', 'DRACHENHUT', 'ШАПКА ДРАКОНА'], ['LANTERN RING', 'LATERNENRING', 'КОЛЬЦО ФОНАРЕЙ'],
  ['LANTERN TRAIL', 'LATERNENSPUR', 'СЛЕД ФОНАРЕЙ'], ['LANTERN CHEST', 'LATERNENTRUHE', 'СУНДУК ФОНАРЕЙ'],
  ['HAPPY LUNAR NEW YEAR! LOOK AT ALL THE LANTERNS!', 'FROHES MONDNEUJAHR! SCHAUT EUCH DIE GANZEN LATERNEN AN!', 'С ЛУННЫМ НОВЫМ ГОДОМ! ПОСМОТРИТЕ НА ВСЕ ЭТИ ФОНАРИ!'],
  ['HONK! MY DRAGON-BOT WILL BLOW OUT EVERY SINGLE ONE!', 'HONK! MEIN DRACHEN-BOT PUSTET JEDE EINZELNE AUS!', 'ГА! МОЙ ДРАКОН-БОТ ЗАДУЕТ ВСЕ ДО ОДНОГО!'], ['NOT TONIGHT! QUACK!', 'NICHT HEUTE NACHT! QUAK!', 'НЕ СЕГОДНЯ! КРЯ!'],
  ["ST. PATRICK'S DAY", 'ST. PATRICK\'S DAY', 'ДЕНЬ СВЯТОГО ПАТРИКА'], ['ST. PATRICK', 'ST. PATRICK', 'СВ. ПАТРИК'], ['RAINBOW MEADOW', 'REGENBOGENWIESE', 'РАДУЖНЫЙ ЛУГ'], ['SHAMROCK GOLEM', 'KLEEBLATT-GOLEM', 'КЛЕВЕРНЫЙ ГОЛЕМ'],
  ["TOP O' THE HONK!", 'EIN GLÜCKS-HONK!', 'УДАЧНОГО ГА!'], ['CLOVER', 'KLEE', 'КЛЕВЕР'], ['LUCKY TOP HAT', 'GLÜCKSZYLINDER', 'СЧАСТЛИВЫЙ ЦИЛИНДР'], ['SHAMROCKS', 'KLEEBLÄTTER', 'ТРИЛИСТНИКИ'],
  ['POT OF GOLD', 'GOLDTOPF', 'ГОРШОК С ЗОЛОТОМ'], ['SHOOTS LUCKY GOLD COINS', 'SCHIESST GLÜCKS-GOLDMÜNZEN', 'СТРЕЛЯЕТ СЧАСТЛИВЫМИ МОНЕТАМИ'], ['LUCKY CHEST', 'GLÜCKSTRUHE', 'СЧАСТЛИВЫЙ СУНДУК'],
  ['A RAINBOW! THEY SAY THERE IS A POT OF GOLD AT THE END!', 'EIN REGENBOGEN! ANGEBLICH GIBT ES AM ENDE EINEN GOLDTOPF!', 'РАДУГА! ГОВОРЯТ, В КОНЦЕ ЕСТЬ ГОРШОК С ЗОЛОТОМ!'],
  ['HONK! THERE IS! AND MY SHAMROCK GOLEM IS SITTING ON IT!', 'HONK! GIBT ES! UND MEIN KLEEBLATT-GOLEM SITZT DRAUF!', 'ГА! ЕСТЬ! И НА НЁМ СИДИТ МОЙ КЛЕВЕРНЫЙ ГОЛЕМ!'],
  ["THEN LET'S GO GET LUCKY! QUACK!", 'DANN HOLEN WIR UNS DAS GLÜCK! QUAK!', 'ТОГДА ПОЙДЁМ ЗА УДАЧЕЙ! КРЯ!'],
  ['ELITE HUNT', 'ELITE-JAGD', 'ОХОТА НА ЭЛИТУ'], ['ELITE ROBOTS 5X AS OFTEN', 'ELITE-ROBOTER 5X SO OFT', 'ЭЛИТНЫЕ РОБОТЫ В 5 РАЗ ЧАЩЕ'], ['LUCKY DROPS', 'GLÜCKSBEUTE', 'СЧАСТЛИВАЯ ДОБЫЧА'],
  ['TWICE THE COINS AND HEARTS', 'DOPPELT SO VIELE MÜNZEN UND HERZEN', 'ВДВОЕ БОЛЬШЕ МОНЕТ И СЕРДЕЦ'],
]);
