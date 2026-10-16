'use strict';
/* QUACK ATTACK! — the HALLOWEEN event. The admin switches it on and off (admin tab -> EVENTS), and everyone sees it
 * live: a spooky title screen, night-time levels where robots wear pumpkins, the HAUNTED POND event level with the
 * PUMPKIN KING, and the PUMPKIN CHEST full of LIMITED items. When the event ends, the limited items can't be found
 * any more (whoever has them keeps them). */

// ================================================================ the haunted pond
Object.assign(WORLD_THEME, {
  haunted: { ground: ['#2f3a2a', '#232c1f', '#3f4f35'], style: 'grass', edge: 'water', e1: '#1b1325', e2: '#3b2a5c', shore: '#3b3848', shoreD: '#2b2438',
    tint: { m: '#ff8c1a', M: '#8f4a00', l: '#ffd23f' }, deco: { tomb: 3, pumpkinS: 3, fern: 2, mush: 1 }, tall: { deadtree: 3, bigpumpkin: 2 }, sky: '#1b1325' },
});
WORLD_SONG.haunted = 'spooky';
Object.assign(DECO_ART, {
  tomb: spr(['.mm.', 'mMmm', 'mmmm', 'mmmm'], { m: '#6c6888', M: '#9a96b5' }),
  pumpkinS: spr(['.g.', 'ooo', 'oyo'], { g: '#3f8f3a', o: '#ff8c1a', y: '#ffd23f' }),
  bigpumpkin: spr(['...gg...', '.oooooo.', 'oOoooooo', 'oyyooyyo', 'oooooooo', 'oyoyoyoo', '.oooooo.'], { g: '#3f8f3a', o: '#ff8c1a', O: '#ffb05a', y: '#ffd23f' }),
  bat: spr(['k...k', 'kkkkk', '.kek.'], { k: '#1b1325', e: '#ff3b3b' }, null),
});
Object.assign(ENEMY_ART, {
  pumpking: [
    ['.....y.y.y......', '.....yyyyy......', '......gg........', '...oooooooooo...', '..oOooooooooOo..', '.oooKKooooKKooo.', '.oooKyKooKyKooo.', '.ooooooKKoooooo.',
      '.oKoKoKoKoKoKoo.', '.ooKyKyKyKyKooo.', '..oooooooooooo..', '...oooooooooo...', '....MmM..MmM....', '....MmM..MmM....', '...MMM....MMM...'],
    ['.....y.y.y......', '.....yyyyy......', '......gg........', '...oooooooooo...', '..oOooooooooOo..', '.oooKKooooKKooo.', '.oooKYKooKYKooo.', '.ooooooKKoooooo.',
      '.oKoKoKoKoKoKoo.', '.ooKYKYKYKYKooo.', '..oooooooooooo..', '...oooooooooo...', '...MmM....MmM...', '...MmM....MmM...', '..MMM......MMM..'],
  ],
});
ENEMY_PAL.pumpking = { y: '#ffd23f', Y: '#fff3b0', g: '#3f8f3a', o: '#ff8c1a', O: '#ffb05a', K: '#3d1f00', M: '#3d3a52', m: '#8b8aa0' };
PROJ_ART.candyshot = spr(['.wo', 'wyo'], { w: '#ffffff', y: '#ffd23f', o: '#ff8c1a' });
PROJ_ART.candycorn = spr(['.wo', 'wyo'], { w: '#ffffff', y: '#ffd23f', o: '#ff8c1a' });
BOSSES.pumpking = { name: 'PUMPKIN KING', hp: 2900, spd: 28, dmg: 24, r: 15, sc: 2, attacks: ['spiral', 'summon', 'jump', 'warp', 'ring'], summon: ['bolt', 'goo', 'spiderling'],
  col: '#ff8c1a', bullet: 'candyshot', summonText: 'TRICK OR TREAT!' };

// the event level: not on the map, played from the title screen while Halloween is on
const HALLOWEEN_LEVEL = { n: 'H', name: 'HAUNTED POND', world: 'haunted', time: 120, diff: 5, boss: 'pumpking', reward: 'pumpkin', rewardCat: 'hat', event: 'halloween',
  pool: { bolt: 8, goo: 4, boom: 3, spiderling: 3, drone: 2 },
  intro: [['honk', 'HONK! HAPPY HALLOWEEN! ...WAIT, WHY ARE ALL THE ROBOTS WEARING PUMPKINS?'], ['daisy', 'THE PUMPKIN KING IS BACK! HE STEALS ALL THE CANDY EVERY YEAR!'],
    ['duck', 'NOT THIS YEAR! TRICK OR TREAT! QUACK!']],
  outro: [] };

// ================================================================ LIMITED items (Halloween only)
Object.assign(SKIN_PAL, {
  skeleton: { h: '#f4f4f4', y: '#d5dbe6', d: '#8b8aa0', w: '#ffffff', o: '#c3c2d4', f: '#c3c2d4', K: '#3d3a52', c: '#3d3a52' },
  vampire: { h: '#d5dbe6', y: '#2a1748', d: '#140b26', w: '#e8343b', o: '#ffd23f', f: '#3d3a52', K: '#e8343b', c: '#ff6fae' },
});
Object.assign(HAT_ART, {
  pumpkin: hat({ rows: ['....gg....', '..oooooo..', '.ooyooyoo.', 'oooooooooo', 'ooyyyyyyoo'], x: 1, y: 2 }, { o: '#ff8c1a', y: '#ffd23f', g: '#3f8f3a' }),
  witch: hat({ rows: ['......k...', '.....kk...', '....kkk...', '...kkkkk..', '..kpppppk.', 'kkkkkkkkkk'], x: 1, y: 1 }, { k: '#2a1748', p: '#9d5cff' }),
});
Object.assign(HAT_MOTION, { pumpkin: { amp: 0.2, sp: 2, bob: 0.3 }, witch: { amp: 0.7, sp: 2.5 } });
Object.assign(HAT_SPARK, { pumpkin: ['#ffd23f', '#ff8c1a'], witch: ['#9d5cff', '#c9a6ff'] });
HALO_FX.bats = ({ x, y, sc, t, layer, rx, ry }) => { // three little bats flapping round
  for (let i = 0; i < 3; i++) {
    const a = t * 2.2 + i * TAU / 3, front = Math.sin(a) > 0;
    if ((layer === 'front') !== front) continue;
    const px = Math.round(x + Math.cos(a) * (rx + 3 * sc)), py = Math.round(y + 3 * sc + Math.sin(a) * (ry + 2 * sc)), flap = Math.floor(t * 12 + i) % 2;
    ctx.fillStyle = '#1b1325';
    ctx.fillRect(px - sc, py, sc * 3, sc); ctx.fillRect(px - 2 * sc, py - (flap ? sc : 0), sc, sc); ctx.fillRect(px + 2 * sc, py - (flap ? sc : 0), sc, sc);
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(px, py, Math.max(1, sc / 2), Math.max(1, sc / 2));
  }
};
TRAIL_FX.candy = (T, x, y) => T.push({ x, y: y - 4, vx: rand(-10, 10), vy: rand(-22, -10), life: 0.7, max: 0.7, s: PROJ_ART.candycorn });
TRAIL_ICON.candy = (x, y) => { drawSpr(PROJ_ART.candycorn, x - 6, y - 2); drawSpr(PROJ_ART.candycorn, x + 2, y + 1); };
Object.assign(GUN_ART, {
  scythe: spr(['......sss.', '.....s...s', 'bbbbbbbbb.', '.........s'], { s: '#d5dbe6', b: '#5c3416' }),
  candycorn: spr(['..yyo...', 'pppppppw', 'ppk.....', 'kk......'], { p: '#9d5cff', y: '#ffd23f', o: '#ff8c1a', w: '#ffffff', k: '#3d3a52' }),
});
const HW = { rarity: 'limited', event: 'halloween' };
COSMETICS.skin.push(Object.assign({ id: 'skeleton', name: 'SKELETON' }, HW), Object.assign({ id: 'vampire', name: 'VAMPIRE' }, HW));
COSMETICS.hat.push(Object.assign({ id: 'pumpkin', name: 'PUMPKIN HEAD', eventReward: true }, HW), Object.assign({ id: 'witch', name: 'WITCH HAT' }, HW));
COSMETICS.halo.push(Object.assign({ id: 'bats', name: 'BAT ORBIT' }, HW));
COSMETICS.trail.push(Object.assign({ id: 'candy', name: 'CANDY CORN' }, HW));
COSMETICS.weapon.push(Object.assign({ id: 'scythe', name: 'REAPER SCYTHE', desc: 'SLASHES HEAL YOU A LITTLE' }, HW), Object.assign({ id: 'candycorn', name: 'CANDY CANNON', desc: 'FAST CANDY THAT GOES THROUGH' }, HW));

// the PUMPKIN CHEST: only while the event runs, only LIMITED items
CHESTS.pumpkin = { name: 'PUMPKIN CHEST', price: 200, odds: { limited: 100 }, event: 'halloween' };
ART.chest.pumpkin = {
  lid: spr(['......gg........', '..oooooooooooo..', '.oOOoooooooOOoo.', 'oooooooooooooooo'], { g: '#3f8f3a', o: '#ff8c1a', O: '#ffb05a' }),
  base: spr(['oooyyoooooyyoooo', 'ooyyyyoooyyyyooo', 'oooooooooooooooo', 'ooyoyoyoyoyoyooo', 'oooyyyyyyyyyoooo', 'oooooooooooooooo'], { o: '#ff8c1a', y: '#ffd23f' }),
};

// ================================================================ spooky music
SONGS.spooky = {
  bpm: 116, lead: 'triangle', drums: 'light',
  bass: [40, 0, 47, 0, 52, 0, 47, 0, 40, 0, 47, 0, 51, 0, 47, 0, 36, 0, 43, 0, 48, 0, 43, 0, 35, 0, 42, 0, 47, 0, 39, 0],
  mel: [76, 0, 0, 0, 75, 0, 76, 0, 79, 0, 0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 72, 0, 71, 0, 72, 0, 0, 0, 0, 0, 0, 0,
    72, 0, 0, 0, 71, 0, 72, 0, 76, 0, 0, 0, 72, 0, 0, 0, 71, 0, 0, 0, 75, 0, 78, 0, 83, 0, 0, 0, 0, 0, 0, 0],
};

// ================================================================ spooky looks
// bats fluttering across an area of the screen
function drawBats(x0, y0, w, h, T, n = 5) {
  for (let i = 0; i < n; i++) {
    const k = ((T * (0.05 + i * 0.013) + i * 0.27) % 1), x = x0 + k * (w + 40) - 20, y = y0 + h * (0.12 + ((i * 37) % 60) / 100) + Math.sin(T * 3 + i) * 6;
    const flap = Math.floor(T * 10 + i) % 2;
    ctx.fillStyle = '#1b1325'; ctx.fillRect(Math.round(x - 1), Math.round(y), 3, 2);
    ctx.fillRect(Math.round(x - 3), Math.round(y - (flap ? 2 : 0)), 2, 1); ctx.fillRect(Math.round(x + 2), Math.round(y - (flap ? 2 : 0)), 2, 1);
  }
}
// the title screen at Halloween: dusk sky, a big moon, bats and pumpkins on the meadow
function drawHalloweenTitle(gy, T) {
  ctx.fillStyle = 'rgba(40,12,60,0.45)'; ctx.fillRect(0, 0, W, gy);
  ctx.fillStyle = 'rgba(40,12,60,0.25)'; ctx.fillRect(0, gy, W, H - gy);
  pcirc(W * 0.78, H * 0.17, 15, '#fff3b0'); pcirc(W * 0.78 + 4, H * 0.17 - 3, 13, '#ffe680');
  drawBats(0, 0, W, gy * 0.6, T, 6);
  [[0.2, 30], [0.45, 46], [0.66, 24], [0.86, 40]].forEach(([fx, dy], i) => {
    drawSprX(DECO_ART.bigpumpkin, W * fx, gy + dy, { ay: 1 });
    if ((Math.floor(T * 3) + i) % 4) pcirc(W * fx, gy + dy - 4, 5, 'rgba(255,210,63,0.12)');
  });
  drawSpr(DECO_ART.tomb, W * 0.33, gy + 12); drawSpr(DECO_ART.tomb, W * 0.58, gy + 8);
}
// levels at Halloween: a little darker, with bats overhead
function drawHalloweenView(v, T) {
  ctx.fillStyle = 'rgba(30,8,50,0.22)'; ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawBats(v.x, v.y, v.w, v.h * 0.5, T, 4);
  ctx.restore();
}

// everything the rest of the game needs to know about this event (see EVENTS in data.js)
Object.assign(EVENTS.halloween, { level: HALLOWEEN_LEVEL, song: 'spooky', title: drawHalloweenTitle, view: drawHalloweenView, hat: DECO_ART.pumpkinS, icon: DECO_ART.bigpumpkin,
  chest: 'pumpkin', boss: 'PUMPKIN KING', bg: '#3b2410', btn: '#8f4a00', tcol: '#ffd23f' });

// ================================================================ translations
addPhrases([
  ['HALLOWEEN', 'HALLOWEEN', 'ХЭЛЛОУИН'], ['HALLOWEEN EVENT', 'HALLOWEEN-EVENT', 'ХЭЛЛОУИН-ИВЕНТ'], ['HAUNTED POND', 'SPUKTEICH', 'ПРУД С ПРИВИДЕНИЯМИ'], ['PUMPKIN KING', 'KÜRBISKÖNIG', 'ТЫКВЕННЫЙ КОРОЛЬ'],
  ['LIMITED', 'LIMITIERT', 'ЛИМИТ'], ['PUMPKIN CHEST', 'KÜRBISTRUHE', 'ТЫКВЕННЫЙ СУНДУК'], ['TRICK OR TREAT!', 'SÜSSES ODER SAURES!', 'СЛАДОСТЬ ИЛИ ГАДОСТЬ!'],
  ['SKELETON', 'SKELETT', 'СКЕЛЕТ'], ['VAMPIRE', 'VAMPIR', 'ВАМПИР'], ['PUMPKIN HEAD', 'KÜRBISKOPF', 'ТЫКВЕННАЯ ГОЛОВА'], ['WITCH HAT', 'HEXENHUT', 'ШЛЯПА ВЕДЬМЫ'],
  ['BAT ORBIT', 'FLEDERMAUS-ORBIT', 'ЛЕТУЧИЕ МЫШИ'], ['CANDY CORN', 'ZUCKERMAIS', 'КОНФЕТКИ'], ['REAPER SCYTHE', 'SENSE DES TODES', 'КОСА ЖНЕЦА'], ['SLASHES HEAL YOU A LITTLE', 'SCHLÄGE HEILEN DICH EIN BISSCHEN', 'УДАРЫ НЕМНОГО ЛЕЧАТ'],
  ['CANDY CANNON', 'BONBON-KANONE', 'КОНФЕТНАЯ ПУШКА'], ['FAST CANDY THAT GOES THROUGH', 'SCHNELLE BONBONS, DIE DURCHFLIEGEN', 'БЫСТРЫЕ КОНФЕТЫ НАСКВОЗЬ'],
  ['HONK! HAPPY HALLOWEEN! ...WAIT, WHY ARE ALL THE ROBOTS WEARING PUMPKINS?', 'HONK! FROHES HALLOWEEN! ...MOMENT, WARUM TRAGEN ALLE ROBOTER KÜRBISSE?', 'ГА! С ХЭЛЛОУИНОМ! ...СТОП, ПОЧЕМУ ВСЕ РОБОТЫ В ТЫКВАХ?'],
  ['THE PUMPKIN KING IS BACK! HE STEALS ALL THE CANDY EVERY YEAR!', 'DER KÜRBISKÖNIG IST ZURÜCK! ER KLAUT JEDES JAHR ALLE SÜSSIGKEITEN!', 'ТЫКВЕННЫЙ КОРОЛЬ ВЕРНУЛСЯ! ОН КАЖДЫЙ ГОД КРАДЁТ ВСЕ КОНФЕТЫ!'],
  ['NOT THIS YEAR! TRICK OR TREAT! QUACK!', 'DIESES JAHR NICHT! SÜSSES ODER SAURES! QUAK!', 'НЕ В ЭТОМ ГОДУ! СЛАДОСТЬ ИЛИ ГАДОСТЬ! КРЯ!'],
  ['LIMITED - ONLY DURING THE HALLOWEEN EVENT', 'LIMITIERT - NUR BEIM HALLOWEEN-EVENT', 'ЛИМИТ - ТОЛЬКО НА ХЭЛЛОУИН'], ['BEAT THE PUMPKIN KING IN THE HALLOWEEN EVENT', 'BESIEGE DEN KÜRBISKÖNIG IM HALLOWEEN-EVENT', 'ПОБЕДИ ТЫКВЕННОГО КОРОЛЯ НА ХЭЛЛОУИН'],
  ['LIMITED ITEMS - ONLY WHILE THE EVENT IS ON!', 'LIMITIERTE SACHEN - NUR SOLANGE DAS EVENT LÄUFT!', 'ЛИМИТНЫЕ ПРЕДМЕТЫ - ТОЛЬКО ПОКА ИДЁТ ИВЕНТ!'],
  ['PUMPKIN CHEST IN THE LOCKER!', 'KÜRBISTRUHE IM SCHRANK!', 'ТЫКВЕННЫЙ СУНДУК В ШКАФЧИКЕ!'], ['EVENTS', 'EVENTS', 'ИВЕНТЫ'], ['RUNNING NOW', 'LÄUFT GERADE', 'ИДЁТ СЕЙЧАС'], ['OFF', 'AUS', 'ВЫКЛ'],
  ['START', 'START', 'СТАРТ'], ['STOP', 'STOPP', 'СТОП'], ['{0} IS ON FOR EVERYONE!', '{0} LÄUFT JETZT FÜR ALLE!', '{0} ВКЛЮЧЁН ДЛЯ ВСЕХ!'], ['{0} IS OVER', '{0} IST VORBEI', '{0} ЗАКОНЧЕН'],
  ['UPDATE THE DATABASE RULES FIRST', 'AKTUALISIERE ZUERST DIE DATENBANK-REGELN', 'СНАЧАЛА ОБНОВИ ПРАВИЛА БАЗЫ'],
  ['EVERY PLAYER SEES THE EVENT AS SOON AS YOU SWITCH IT ON', 'JEDER SPIELER SIEHT DAS EVENT, SOBALD DU ES EINSCHALTEST', 'ВСЕ ИГРОКИ УВИДЯТ ИВЕНТ, КАК ТОЛЬКО ТЫ ЕГО ВКЛЮЧИШЬ'],
]);
