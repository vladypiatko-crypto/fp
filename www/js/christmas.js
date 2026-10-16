'use strict';
/* QUACK ATTACK! — the CHRISTMAS event. The admin switches it on and off (admin tab -> EVENTS), and everyone sees it
 * live: a snowy evening title screen with a big tree, snow falling in every level, robots in santa hats, the
 * SNOWY VILLAGE event level with ROBO SANTA, and the PRESENT CHEST full of LIMITED items. */

// ================================================================ the snowy village
Object.assign(DECO_ART, {
  present: spr(['.ww.', 'rrwr', 'wwww', 'rrwr', 'rrwr'], { r: '#e8343b', w: '#ffffff' }),
  presentB: spr(['.yy.', 'bbyb', 'yyyy', 'bbyb', 'bbyb'], { b: '#2f7fe0', y: '#ffd23f' }),
  presentG: spr(['.rr.', 'ggrg', 'rrrr', 'ggrg', 'ggrg'], { g: '#2f9e44', r: '#e8343b' }),
  candycaneD: spr(['.rw', 'w.r', 'r..', 'w..', 'r..'], { r: '#e8343b', w: '#ffffff' }),
  xmastree: spr(['....y....', '...yyy...', '....g....', '...ggg...', '..gRggg..', '...ggg...', '..gggBg..', '.gYggggg.', '..ggggg..', '.ggRgggYg', 'ggggggggg', '....b....', '....b....'],
    { y: '#ffd23f', g: '#2f7a3a', R: '#e8343b', B: '#5ec8ff', Y: '#fff36b', b: '#5c3416' }),
  snowman: spr(['..kkk..', '.kkkkk.', '..www..', '.wkwkw.', '.wwoww.', '..www..', '.rrrrr.', 'wwwkwww', 'wwwwwww', '.wwkww.', '..www..'],
    { k: '#3d3a52', w: '#ffffff', o: '#ff8c1a', r: '#e8343b' }),
  santaS: spr(['.rw', 'rrr', 'www'], { r: '#e8343b', w: '#ffffff' }),
});
Object.assign(WORLD_THEME, {
  xmas: { ground: ['#eef5ff', '#d4e3f7', '#ffffff'], style: 'snow', edge: 'water', e1: '#5aa8d8', e2: '#9fd3ff', shore: '#bcd7ee', shoreD: '#8fb3d4',
    tint: { m: '#e8343b', M: '#7a1f24', l: '#ffd23f' }, deco: { present: 2, presentB: 2, presentG: 2, candycaneD: 2, snowrock: 3 }, tall: { xmastree: 4, snowman: 2 }, sky: '#1f2a4a' },
});
WORLD_SONG.xmas = 'jingle';

// ================================================================ ROBO SANTA
Object.assign(ENEMY_ART, {
  robosanta: [
    ['..........ww....', '......rrrrww....', '.....rrrrrr.....', '...wwwwwwwwww...', '...mmmmmmmmmm...', '...meemmmmeem...', '...mmmmmmmmmm...', '..wwwwwwwwwwww..',
      '..wwwwkkkkwwww..', '.rrrwwwwwwwwrrr.', 'rrrrrwwwwwwrrrrr', 'kkkkkkkyykkkkkkk', 'rrrrrrrrrrrrrrrr', '..MMM......MMM..', '.MMMM......MMMM.'],
    ['..........ww....', '......rrrrww....', '.....rrrrrr.....', '...wwwwwwwwww...', '...mmmmmmmmmm...', '...mEEmmmmEEm...', '...mmmmmmmmmm...', '..wwwwwwwwwwww..',
      '..wwwwkkkkwwww..', '.rrrwwwwwwwwrrr.', 'rrrrrwwwwwwrrrrr', 'kkkkkkkyykkkkkkk', 'rrrrrrrrrrrrrrrr', '...MMM....MMM...', '..MMMM....MMMM..'],
  ],
});
ENEMY_PAL.robosanta = { w: '#ffffff', r: '#e8343b', m: '#8b8aa0', e: '#ff3b3b', E: '#fff36b', k: '#3d3a52', y: '#ffd23f', M: '#3d3a52' };
PROJ_ART.present = spr(['ryr', 'yyy', 'ryr'], { r: '#e8343b', y: '#ffd23f' });
BOSSES.robosanta = { name: 'ROBO SANTA', hp: 3000, spd: 27, dmg: 24, r: 15, sc: 2, attacks: ['ring', 'summon', 'breath', 'jump', 'spiral'], summon: ['bolt', 'boom', 'drone'],
  col: '#e8343b', bullet: 'present', summonText: 'HO HO HONK!' };

const XMAS_LEVEL = { n: 'X', name: 'SNOWY VILLAGE', world: 'xmas', time: 120, diff: 5, boss: 'robosanta', reward: 'elfhat', rewardCat: 'hat', event: 'christmas',
  pool: { bolt: 8, goo: 3, boom: 3, drone: 3, tank: 1 },
  intro: [['daisy', 'MERRY CHRISTMAS, DUCKS! ...WHY IS SANTA MADE OF METAL?'], ['honk', 'HONK HONK HONK! MY ROBO SANTA WILL TAKE EVERY PRESENT IN THE POND!'],
    ['duck', 'NOBODY STEALS CHRISTMAS! QUACK!']],
  outro: [] };

// ================================================================ LIMITED items (Christmas only)
Object.assign(SKIN_PAL, {
  gingerbread: { h: '#c07a3a', y: '#c07a3a', d: '#8a5228', w: '#ffffff', o: '#e8343b', f: '#8a5228', K: '#3d1f00', c: '#ff6fae' },
  elf: { h: '#51cf66', y: '#2f9e44', d: '#1f6b2f', w: '#e8343b', o: '#ff9f1c', f: '#e8343b', K: OUT, c: '#ffb3a7' },
});
Object.assign(HAT_ART, {
  xmastree: hat({ rows: ['....yy....', '....gg....', '...gggg...', '..ggrggg..', '..gggggy..', '.gggggggg.', '.ggyggggr.'], x: 1, y: 1 }, { g: '#2f7a3a', y: '#ffd23f', r: '#e8343b' }),
  elfhat: hat({ rows: ['........y.', '.......gg.', '......ggg.', '....gggg..', '..ggggggg.', 'rrrrrrrrrr'], x: 1, y: 1 }, { g: '#2f9e44', y: '#ffd23f', r: '#e8343b' }),
});
Object.assign(HAT_MOTION, { xmastree: { amp: 0.3, sp: 2 }, elfhat: { amp: 0.8, sp: 3 } });
Object.assign(HAT_SPARK, { xmastree: ['#ffd23f', '#e8343b', '#5ec8ff'], elfhat: ['#ffd23f'] });
HALO_FX.snowflakes = ({ x, y, sc, t, layer, rx, ry }) => { // five snowflakes slowly turning round
  for (let i = 0; i < 5; i++) {
    const a = t * 0.9 + i * TAU / 5, front = Math.sin(a) > 0;
    if ((layer === 'front') !== front) continue;
    const px = Math.round(x + Math.cos(a) * rx), py = Math.round(y + Math.sin(a) * ry);
    ctx.fillStyle = i % 2 ? '#ffffff' : '#bde6ff';
    ctx.fillRect(px - sc, py, sc * 3, sc); ctx.fillRect(px, py - sc, sc, sc * 3);
    if ((Math.floor(t * 4) + i) % 3 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px, py, sc, sc); }
  }
};
TRAIL_FX.tinsel = (T, x, y) => T.push({ x: x + rand(-3, 3), y: y - rand(1, 7), vx: rand(-4, 4), vy: rand(-8, -2), life: 0.7, max: 0.7, col: pick(['#e8343b', '#ffd23f', '#51cf66', '#ffffff']), tw: true });
TRAIL_ICON.tinsel = (x, y, t) => { for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#e8343b', '#ffd23f', '#51cf66'][(i + Math.floor(t * 6)) % 3]; ctx.fillRect(Math.round(x - 7 + i * 3), Math.round(y - 2 + Math.sin(i + t * 4) * 2), 2, 2); } };
Object.assign(GUN_ART, {
  candycane: spr(['.......rw.', '......w..r', 'rwrwrwrwr.', '..........'], { r: '#e8343b', w: '#ffffff' }),
  snowball: spr(['..ww....', 'bbbbbbbw', 'bbk.....', 'kk......'], { w: '#ffffff', b: '#5aa8d8', k: '#3d5a8a' }),
});
PROJ_ART.snowball = spr(['.ww.', 'wWww', 'wwww', '.ww.'], { w: '#ffffff', W: '#dfe6fa' });
// a sweet slash, and snowballs that slow robots down
WEAPONS.candycane = { cd: 0.5, dmg: 26, n: 1, range: 50, reach: 36, arc: 2.2, kb: 160, col: '#ff3b5c', melee: true };
WEAPONS.snowball = { cd: 0.34, dmg: 12, n: 1, spread: 0.14, speed: 200, life: 0.8, r: 3, kb: 50, range: 150, col: '#ffffff' };
SHOT_KIND.snowball = 'snowball';
SHOT_EXTRA.snowball = { art: 'snowball', spin: 0.3, slow: 1.1 };
SHOOT_SFX.candycane = p => { noise(0.12, 0.05, 3500, 0, null, 'highpass'); tone(1200 * p, 0.08, 'triangle', 0.03, 1600); };
SHOOT_SFX.snowball = p => { noise(0.08, 0.05, 900); tone(240 * p, 0.06, 'sine', 0.04, 160); };
const XM = { rarity: 'limited', event: 'christmas' };
COSMETICS.skin.push(Object.assign({ id: 'gingerbread', name: 'GINGERBREAD' }, XM), Object.assign({ id: 'elf', name: 'ELF' }, XM));
COSMETICS.hat.push(Object.assign({ id: 'elfhat', name: 'ELF HAT', eventReward: true }, XM), Object.assign({ id: 'xmastree', name: 'TREE HAT' }, XM));
COSMETICS.halo.push(Object.assign({ id: 'snowflakes', name: 'SNOWFLAKES' }, XM));
COSMETICS.trail.push(Object.assign({ id: 'tinsel', name: 'TINSEL' }, XM));
COSMETICS.weapon.push(Object.assign({ id: 'candycane', name: 'CANDY CANE', desc: 'A BIG STRIPY SWING' }, XM), Object.assign({ id: 'snowball', name: 'SNOWBALL BLASTER', desc: 'SNOWBALLS SLOW ROBOTS DOWN' }, XM));

// the PRESENT CHEST: only while the event runs, only LIMITED items
CHESTS.present = { name: 'PRESENT CHEST', price: 200, odds: { limited: 100 }, event: 'christmas' };
ART.chest.present = {
  lid: spr(['.....yy..yy.....', '......yyyy......', 'rrrrrrryyrrrrrrr', 'RRRRRRRyyRRRRRRR'], { y: '#ffd23f', r: '#ff5c63', R: '#e8343b' }),
  base: spr(['rrrrrrryyrrrrrrr', 'rrrrrrryyrrrrrrr', 'yyyyyyyyyyyyyyyy', 'rrrrrrryyrrrrrrr', 'rrrrrrryyrrrrrrr', 'RRRRRRRyyRRRRRRR'], { y: '#ffd23f', r: '#e8343b', R: '#a8242b' }),
};

// ================================================================ jingle music
SONGS.jingle = {
  bpm: 150, lead: 'square', drums: 'light',
  bass: [48, 0, 55, 0, 48, 0, 55, 0, 48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 48, 0, 55, 0, 43, 0, 50, 0, 43, 0, 47, 0],
  mel: [76, 0, 76, 0, 76, 0, 0, 0, 76, 0, 76, 0, 76, 0, 0, 0, 76, 0, 79, 0, 72, 0, 0, 74, 76, 0, 0, 0, 0, 0, 0, 0,
    77, 0, 77, 0, 77, 0, 0, 77, 77, 0, 76, 0, 76, 0, 76, 76, 76, 0, 74, 0, 74, 0, 76, 0, 74, 0, 0, 0, 79, 0, 0, 0],
};

// ================================================================ snowy looks
// snowflakes drifting down over an area of the screen
function drawSnow(x0, y0, w, h, T, n = 40) {
  for (let i = 0; i < n; i++) {
    const sp = 10 + (i * 7) % 14, x = x0 + ((i * 97) % w + Math.sin(T * 0.8 + i) * 6 + w) % w, y = y0 + ((i * 53) % h + T * sp) % h;
    ctx.fillStyle = i % 3 ? '#ffffff' : '#dfe6fa'; ctx.fillRect(Math.round(x), Math.round(y), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
  }
}
// the title screen at Christmas: evening sky, fairy lights, snow, a big tree with presents and a snowman
function drawXmasTitle(gy, T) {
  ctx.fillStyle = 'rgba(20,30,80,0.35)'; ctx.fillRect(0, 0, W, gy);
  ctx.fillStyle = 'rgba(235,245,255,0.55)'; ctx.fillRect(0, gy, W, H - gy); // snow on the meadow
  // fairy lights hanging across the top
  const cols = ['#e8343b', '#ffd23f', '#51cf66', '#5ec8ff'];
  for (let x = 0; x < W; x += 3) { const y = 3 + Math.sin(x / W * Math.PI * 4) * 3 + 3; ctx.fillStyle = '#2f4a2a'; ctx.fillRect(x, Math.round(y), 3, 1); }
  for (let i = 0, x = 6; x < W; x += 14, i++) {
    const y = Math.round(3 + Math.sin(x / W * Math.PI * 4) * 3 + 5), on = (Math.floor(T * 3) + i) % 3;
    ctx.fillStyle = on ? cols[i % 4] : '#3d3a52'; ctx.fillRect(x, y, 2, 3);
    if (on) pcirc(x + 1, y + 1, 3, 'rgba(255,255,200,0.12)');
  }
  drawSprX(DECO_ART.xmastree, W * 0.82, gy + 34, { sc: 3, ay: 1 });
  if (Math.floor(T * 2) % 2) pcirc(W * 0.82, gy + 34 - 36, 4, 'rgba(255,230,120,0.35)');
  drawSprX(DECO_ART.present, W * 0.75, gy + 36, { sc: 2, ay: 1 }); drawSprX(DECO_ART.presentB, W * 0.89, gy + 37, { sc: 2, ay: 1 }); drawSprX(DECO_ART.presentG, W * 0.84, gy + 40, { sc: 2, ay: 1 });
  drawSprX(DECO_ART.snowman, W * 0.38, gy + 26, { sc: 2, ay: 1 });
  drawSnow(0, 0, W, H, T, 60);
}
// levels at Christmas: gentle snowfall
function drawXmasView(v, T) {
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawSnow(v.x, v.y, v.w, v.h, T, 30);
  ctx.restore();
}

EVENTS.christmas = { name: 'CHRISTMAS', col: '#e8343b', kind: 'holiday', level: XMAS_LEVEL, song: 'jingle', title: drawXmasTitle, view: drawXmasView, hat: DECO_ART.santaS,
  icon: DECO_ART.xmastree, chest: 'present', boss: 'ROBO SANTA', bg: '#3b1418', btn: '#7a1f24', tcol: '#ffffff' };

// ================================================================ translations
addPhrases([
  ['CHRISTMAS', 'WEIHNACHTEN', 'РОЖДЕСТВО'], ['SNOWY VILLAGE', 'SCHNEEDORF', 'СНЕЖНАЯ ДЕРЕВНЯ'], ['ROBO SANTA', 'ROBO-WEIHNACHTSMANN', 'РОБО-САНТА'], ['HO HO HONK!', 'HO HO HONK!', 'ХО-ХО-ГА!'],
  ['PRESENT CHEST', 'GESCHENKTRUHE', 'СУНДУК-ПОДАРОК'], ['GINGERBREAD', 'LEBKUCHEN', 'ПРЯНИК'], ['ELF', 'ELF', 'ЭЛЬФ'], ['ELF HAT', 'ELFENMÜTZE', 'ШАПКА ЭЛЬФА'], ['TREE HAT', 'BAUM-HUT', 'ШАПКА-ЁЛКА'],
  ['SNOWFLAKES', 'SCHNEEFLOCKEN', 'СНЕЖИНКИ'], ['TINSEL', 'LAMETTA', 'МИШУРА'], ['CANDY CANE', 'ZUCKERSTANGE', 'ЛЕДЕНЦОВАЯ ТРОСТЬ'], ['A BIG STRIPY SWING', 'EIN GROSSER GESTREIFTER SCHLAG', 'БОЛЬШОЙ ПОЛОСАТЫЙ УДАР'],
  ['SNOWBALL BLASTER', 'SCHNEEBALL-BLASTER', 'СНЕЖКОМЁТ'], ['SNOWBALLS SLOW ROBOTS DOWN', 'SCHNEEBÄLLE BREMSEN ROBOTER', 'СНЕЖКИ ЗАМЕДЛЯЮТ РОБОТОВ'],
  ['MERRY CHRISTMAS, DUCKS! ...WHY IS SANTA MADE OF METAL?', 'FROHE WEIHNACHTEN, ENTEN! ...WARUM IST DER WEIHNACHTSMANN AUS METALL?', 'С РОЖДЕСТВОМ, УТКИ! ...ПОЧЕМУ САНТА ИЗ МЕТАЛЛА?'],
  ['HONK HONK HONK! MY ROBO SANTA WILL TAKE EVERY PRESENT IN THE POND!', 'HONK HONK HONK! MEIN ROBO-WEIHNACHTSMANN HOLT SICH JEDES GESCHENK IM TEICH!', 'ГА-ГА-ГА! МОЙ РОБО-САНТА ЗАБЕРЁТ ВСЕ ПОДАРКИ В ПРУДУ!'],
  ['NOBODY STEALS CHRISTMAS! QUACK!', 'NIEMAND KLAUT WEIHNACHTEN! QUAK!', 'НИКТО НЕ УКРАДЁТ РОЖДЕСТВО! КРЯ!'],
]);
