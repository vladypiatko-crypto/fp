'use strict';
/* QUACK ATTACK! — Chapter 4: LOST IN TIME.
 * Dr. Honk invents the TIME TOASTER for his bakery. It opens a hole in time, and out flies TICK-TOCK, a robot
 * clock who wants to rule all of time. He scatters the ducks through history: a dino jungle, a pirate cove,
 * a knight's keep and the wild west, until they reach his home, Neon City 3000.
 * Everything here plugs into the tables from art.js, data.js, story.js, chapter2.js, chapter3.js and lang.js. */

// ================================================================ worlds
Object.assign(WORLD_THEME, {
  jungle: { ground: ['#2f7a3a', '#245f2d', '#3f9f4a'], style: 'grass', edge: 'water', e1: '#2f6b4a', e2: '#4f9f6a', shore: '#5c4a2a', shoreD: '#3f321c',
    tint: { m: '#a0642d', M: '#5c3416', l: '#e0bf7a' }, deco: { fern: 5, flowerP: 2, bush: 3, bigleaf: 3, mush: 1 }, tall: { jungletree: 4, bigtree: 2 }, sky: '#3f8f5a' },
  pirate: { ground: ['#f2d79a', '#e0bf7a', '#fbe8b8'], style: 'sand', edge: 'water', e1: '#1f4f8f', e2: '#4f8fd8', shore: '#fbe8b8', shoreD: '#e0bf7a',
    tint: { m: '#c3c2d4', M: '#5d6577', l: '#ffffff' }, deco: { shell: 3, coinpile: 2, rock: 2, starfish: 2 }, tall: { palm: 3, barrel: 2, treasure: 1, crate: 1 }, sky: '#8fdcff' },
  knight: { ground: ['#74c862', '#5bb450', '#8fd876'], style: 'grass', edge: 'water', e1: '#2f6fb3', e2: '#4f95d8', shore: '#8b8aa0', shoreD: '#5d6577',
    tint: { m: '#c3c2d4', M: '#6c6888', l: '#ffffff' }, deco: { flowerW: 4, flowerB: 3, flowerP: 2, rock: 2 }, tall: { tree: 3, banner: 2, turret: 1 }, sky: '#8fd3ff' },
  west: { ground: ['#d98a5a', '#b86a3a', '#eaa878'], style: 'sand', edge: 'canyon', e1: '#8f4a2a', e2: '#a85a34', shore: '#eaa878', shoreD: '#b86a3a',
    tint: { m: '#c9a26b', M: '#7a4a24', l: '#f2e3c6' }, deco: { tumble: 3, rock: 3, cactusS: 3, skull: 1, wheel: 1 }, tall: { cactus: 4, barrel: 1 }, sky: '#ffb37a' },
  neon: { ground: ['#1b1330', '#140d24', '#2a1f4a'], style: 'neon', edge: 'void', e1: '#0c0a1a', e2: '#1a1530', shore: '#ff5ce1', shoreD: '#9d5cff',
    tint: { m: '#5ec8ff', M: '#2f5a9f', l: '#e3f4ff' }, deco: { neonbit: 4, panel: 2, cable: 2 }, tall: { neonsign: 3, holotree: 3 }, sky: '#0c0a1a' },
});
GROUND_STYLES.neon = (g, S, base, dark, light) => {
  for (let y = 0; y < S; y += 24) for (let x = 0; x < S; x += 24) { g.fillStyle = (x + y) % 48 ? base : dark; g.fillRect(x, y, 24, 24); }
  g.fillStyle = 'rgba(255,92,225,0.55)'; for (let i = 0; i < S; i += 24) g.fillRect(0, i, S, 1);
  g.fillStyle = 'rgba(94,200,255,0.55)'; for (let i = 0; i < S; i += 24) g.fillRect(i, 0, 1, S);
  for (let i = 0; i < 12; i++) { g.fillStyle = pick(['#ff5ce1', '#5ec8ff', '#ffffff']); g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
};
Object.assign(DECO_ART, {
  bigleaf: spr(['..gg.', '.gGgg', 'gggg.', '.g...'], { g: '#2f7a3a', G: '#5fbf5a' }),
  coinpile: spr(['.y.', 'yYy', 'yyy'], { y: '#ffd23f', Y: '#fff3b0' }),
  wheel: spr(['.bbb.', 'b.b.b', 'bbbbb', 'b.b.b', '.bbb.'], { b: '#7a4a24' }, null),
  neonbit: spr(['p.', '.c'], { p: '#ff5ce1', c: '#5ec8ff' }, null),
  // tall
  jungletree: spr(['.gggggg..', 'gGgggGgg.', 'ggggggggg', '.ggvgggg.', '...bv....', '...bb....', '...bbv...', '...bb....', '..bbbb...'],
    { g: '#2f7a3a', G: '#5fbf5a', b: '#5c3416', v: '#3f9f4a' }),
  treasure: spr(['.bbbbb.', 'byyyyyb', 'bbbybbb', 'bbbbbbb'], { b: '#7a4a24', y: '#ffd23f' }),
  banner: spr(['k.....', 'krrrr.', 'kryyr.', 'krrrr.', 'krr...', 'k.....', 'k.....', 'kk....'], { k: '#5d6577', r: '#2f6fb3', y: '#ffd23f' }),
  turret: spr(['m.m.m', 'mmmmm', 'mlmmm', 'mmmmm', 'mmklm', 'mmkmm', 'mmmmm'], { m: '#8b8aa0', l: '#c3c2d4', k: '#3d3a52' }),
  neonsign: spr(['ppppp', 'pcccp', 'pcccp', 'ppppp', '..k..', '..k..', '..k..', '.kkk.'], { p: '#ff5ce1', c: '#5ec8ff', k: '#3d3a52' }),
  holotree: spr(['..c..', '.ccc.', 'ccCcc', '.ccc.', 'ccCcc', '..k..', '..k..'], { c: '#5ec8ff', C: '#e3f4ff', k: '#3d3a52' }),
});
Object.assign(LANDMARKS, {
  jungle(x, y) { drawSpr(DECO_ART.jungletree, x - 5, y - 6); drawSpr(DECO_ART.bigleaf, x + 9, y + 2); drawSpr(DECO_ART.fern, x - 12, y + 3); },
  pirate(x, y, T) { // a little pirate ship on the waves
    const by = y + Math.round(Math.sin(T * 2) * 1);
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(x - 14, by - 2); ctx.lineTo(x + 14, by - 2); ctx.lineTo(x + 10, by + 5); ctx.lineTo(x - 10, by + 5); ctx.fill();
    ctx.fillStyle = '#7a4a24'; ctx.beginPath(); ctx.moveTo(x - 13, by - 1); ctx.lineTo(x + 13, by - 1); ctx.lineTo(x + 9, by + 4); ctx.lineTo(x - 9, by + 4); ctx.fill();
    ctx.fillStyle = '#5c3416'; ctx.fillRect(x - 1, by - 20, 2, 19);
    panel(x - 9, by - 18, 16, 11, '#fff8e7', OUT, null, false);
    ctx.fillStyle = OUT; ctx.fillRect(x + 1, by - 24, 7, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3, by - 23, 2, 2);
  },
  knight(x, y, T) { drawSpr(DECO_ART.turret, x - 4, y - 3); drawSpr(DECO_ART.banner, x + 9, y - 4); drawSpr(DECO_ART.flowerW, x - 12, y + 3); },
  west(x, y) {
    panel(x - 12, y - 10, 24, 15, '#a0642d', OUT, '#c98a4a', false);
    ctx.fillStyle = OUT; ctx.fillRect(x - 3, y - 2, 6, 7);
    panel(x - 10, y - 16, 20, 6, '#5c3416', OUT, null, false);
    drawSpr(DECO_ART.cactus, x + 15, y - 2);
  },
  neon(x, y, T) {
    for (let i = 0; i < 4; i++) {
      const h = 10 + (i * 7) % 13, bx = x - 13 + i * 7;
      panel(bx, y + 3 - h, 6, h, '#1b1330', OUT, null, false);
      ctx.fillStyle = (Math.floor(T * 3) + i) % 2 ? '#ff5ce1' : '#5ec8ff'; ctx.fillRect(bx + 2, y + 5 - h, 2, 1); ctx.fillRect(bx + 2, y + 9 - h, 2, 1);
    }
  },
});

// ================================================================ bosses
Object.assign(ENEMY_ART, {
  rex: [
    ['..........MMMMMM..', '.........MmmmmmmM.', '.........MmeEmmmmM', '.........MmmmmmmmM', '.........MmmwtwtwM', '....MMMMMMmmmmmmM.', '..MMmmmmmmmmMMM...',
      '.MmmmmmmmmmmmM....', 'MmmlmmmmmmmmmM.a..', 'Mm.MmmmmmmmmmaaM..', 'M..MmmmmmmmmM.....', '....MmM..MmM......', '....MmM..MmM......', '...MMM...MMM......'],
    ['..........MMMMMM..', '.........MmmmmmmM.', '.........MmeEmmmmM', '.........MmmmmmmmM', '.........MmmwtwtwM', '....MMMMMMmmmmmmM.', '..MMmmmmmmmmMMM...',
      '.MmmmmmmmmmmmM....', 'MmmlmmmmmmmmmM.a..', 'Mm.MmmmmmmmmmaaM..', 'M..MmmmmmmmmM.....', '...MmM....MmM.....', '...MmM...MmM......', '..MMM....MMM......'],
  ],
  captain: [
    ['......kkkkkk......', '.....kkkwkkkk.....', '....kkkkkkkkkk....', '..rr..rrrrrr..rr..', '.rRRr.rRrrRr.rRRr.', '.rrrrrrrrrrrrrrrr.',
      '..rreErrrrrreErr..', '..rrrrrrrrrrrrrr..', '...rrrwwwwwwrrr...', '....rrrrrrrrrr....', '...r.r.r..r.r.r...', '..r..r.r..r.r..r..'],
    ['......kkkkkk......', '.....kkkwkkkk.....', '....kkkkkkkkkk....', '.rr...rrrrrr...rr.', 'rRRr..rRrrRr..rRRr', '.rrrrrrrrrrrrrrrr.',
      '..rreErrrrrreErr..', '..rrrrrrrrrrrrrr..', '...rrrwwwwwwrrr...', '....rrrrrrrrrr....', '..r.r.r....r.r.r..', '...r..r....r..r...'],
  ],
  dragon: [
    ['...........MM.....', '..........MmmM....', '....MM...MmmeM....', '...MmmM..MmmmmooM.', '..MmmmmM.MmmmmmM..', '..MmwwmmMmmmmM....', '...MwwwwmmmmM.....',
      '....MwwmmmmmmM....', '.....MmmmmmmmmM...', '....MmmmllllmmmM..', '...MmmmlllllmmmMM.', '....MMmmmmmmmmMMmM', '.....MmM...MmM..MM', '....MMM...MMM.....'],
    ['...........MM.....', '..........MmmM....', '.........MmmeM....', '..MM.....MmmmmooM.', '.MmmM....MmmmmmM..', 'MmwwmM..MmmmmM....', '.MwwwwmmmmmmM.....',
      '..MwwmmmmmmmmM....', '.....MmmmmmmmmM...', '....MmmmllllmmmM..', '...MmmmlllllmmmMM.', '....MMmmmmmmmmMMmM', '....MmM....MmM..MM', '...MMM....MMM.....'],
  ],
  sheriff: [
    ['.....kkkkkk.....', '....kkkkkkkk....', '.kkkkkkkkkkkkkk.', '....MMMMMMMM....', '....MmeEmeEM....', '....MmmmmmmM....', '....MmwwwwmM....', '..MMMMMMMMMMMM..',
      '.MmmMmmyymmMmmM.', '.MmmMmyyyymMmmM.', '.MmmMmmyymmMmmM.', '..M.MmmmmmmM.M..', '....MmM..MmM....', '....MmM..MmM....', '...MMM....MMM...'],
    ['.....kkkkkk.....', '....kkkkkkkk....', '.kkkkkkkkkkkkkk.', '....MMMMMMMM....', '....MmeEmeEM....', '....MmmmmmmM....', '....MmwwwwmM....', '..MMMMMMMMMMMM..',
      '.MmmMmmyymmMmmM.', '.MmmMmyyyymMmmM.', '.MmmMmmyymmMmmM.', '..M.MmmmmmmM.M..', '...MmM....MmM...', '...MmM....MmM...', '..MMM......MMM..'],
  ],
  ticktock: [
    ['.....a....a.....', '....MMMMMMMM....', '..MMwwwwwwwwMM..', '..MwwwwkwwwwwM..', '.MwwwwwkwwwwwwM.', '.MwwwwwkwwwwwwM.', '.MwwwwwkkkkwwwM.', '.MwwwwwwwwwwwwM.',
      '..MwwwwwwwwwwM..', '..MMwwwwwwwwMM..', '....MMMMMMMM....', '...MmmMMMMmmM...', '..MmmmmmmmmmmM..', '...MmM....MmM...', '..MMM......MMM..'],
    ['.....a....a.....', '....MMMMMMMM....', '..MMwwwwwwwwMM..', '..MwwwwwwwwwwM..', '.MwwwwwwwwwwwwM.', '.MwwwwwwwwwwwwM.', '.MwwwwwkkkkkkwM.', '.MwwwwwkwwwwwwM.',
      '..MwwwwkwwwwwM..', '..MMwwwwwwwwMM..', '....MMMMMMMM....', '...MmmMMMMmmM...', '..MmmmmmmmmmmM..', '..MmM......MmM..', '.MMM........MMM.'],
  ],
});
Object.assign(ENEMY_PAL, {
  rex: { M: '#2f5a2a', m: '#5a9f4a', l: '#8fd06a', e: '#ff3b5c', E: '#fff3b0', w: '#ffffff', t: '#3d3a52', a: '#5a9f4a' },
  captain: { k: '#2a2a3a', w: '#ffffff', r: '#e8343b', R: '#ff8c8c', e: '#3d3a52', E: '#ffffff' },
  dragon: { M: '#4a1f6b', m: '#9d5cff', w: '#c9a6ff', l: '#ffd23f', e: '#ffd23f', o: '#ff8c1a' },
  sheriff: { k: '#7a4a24', M: '#3d3a52', m: '#c3c2d4', e: '#ff3b5c', E: '#fff3b0', w: '#ffffff', y: '#ffd23f' },
  ticktock: { a: '#ffd23f', M: '#3d3a52', w: '#fff3dc', k: '#e8343b', m: '#5ec8ff' },
});
Object.assign(PROJ_ART, {
  bone: spr(['w.w', '.w.', 'w.w'], { w: '#fff3dc' }),
  cannonball: spr(['.k.', 'kKk', '.k.'], { k: '#2a2a3a', K: '#5d6577' }),
  slug: spr(['yy', 'yY'], { y: '#ffd23f', Y: '#fff3b0' }),
  tick: spr(['.m.', 'mwm', '.m.'], { m: '#5ec8ff', w: '#ffffff' }),
});
Object.assign(BOSSES, {
  rex: { name: 'REX-BOT', hp: 3300, spd: 32, dmg: 26, r: 16, sc: 2, attacks: ['charge', 'jump', 'summon', 'volley'], summon: ['bolt', 'spiderling', 'saw'], col: '#5a9f4a', bullet: 'bone' },
  captain: { name: 'CAPTAIN CLAW', hp: 3400, spd: 28, dmg: 26, r: 15, sc: 2, attacks: ['missiles', 'ring', 'summon', 'volley', 'charge'], summon: ['bolt', 'boom', 'drone'], col: '#e8343b', bullet: 'cannonball',
    summonText: 'ARR! ALL HANDS ON DECK!' },
  dragon: { name: 'DRAGON-BOT', hp: 3600, spd: 28, dmg: 28, r: 16, sc: 2, attacks: ['breath', 'jump', 'spiral', 'summon', 'breath'], summon: ['drone', 'spiderling'], col: '#9d5cff', bullet: 'ember' },
  sheriff: { name: 'SHERIFF BOT', hp: 3600, spd: 34, dmg: 28, r: 15, sc: 2, attacks: ['volley', 'charge', 'ring', 'missiles', 'summon', 'volley'], summon: ['bolt', 'turret', 'saw'], col: '#ffd23f', bullet: 'slug',
    summonText: 'DEPUTIES! GET THEM!' },
  ticktock: { name: 'TICK-TOCK', hp: 4600, spd: 30, dmg: 30, r: 16, sc: 2, attacks: ['warp', 'spiral', 'ring', 'missiles', 'warp', 'summon', 'breath'],
    summon: ['bolt', 'drone', 'saw', 'spiderling', 'tank'], col: '#5ec8ff', bullet: 'tick', final: true, rage: 'TIME IS RUNNING OUT!', summonText: 'TICK TOCK! GET THEM!' },
});
BOSS_ORDER.push('rex', 'captain', 'dragon', 'sheriff', 'ticktock');

// ================================================================ rewards (story only, never in chests)
Object.assign(SKIN_PAL, {
  dino: { h: '#5a9f4a', y: '#5a9f4a', d: '#2f5a2a', w: '#8fd06a', o: '#ffd23f', f: '#2f5a2a', K: OUT, c: '#ff8c6b' },
  chrono: { h: '#3f86b8', y: '#3f86b8', d: '#24496b', w: '#ffd23f', o: '#ffd23f', f: '#5ec8ff', K: '#ffffff', c: '#ff5ce1' },
});
SKIN_FX.chrono = 'galaxy';
Object.assign(HAT_ART, {
  captain: hat({ rows: ['..kkkkkk..', '.kkkwwkkk.', 'kkkkkkkkkk', '.yyyyyyyy.'], x: 1, y: 1 }, { k: '#2a2a3a', w: '#ffffff', y: '#ffd23f' }),
  knight: hat({ rows: ['....rr....', '...rr.....', '.mmmmmmmm.', 'mmlmmmmmmm', 'mmkkkkkkmm', 'mmmmmmmmmm'], x: 1, y: 2 }, { m: '#8b8aa0', l: '#d5dbe6', k: '#3d3a52', r: '#e8343b' }),
  sheriff: hat({ rows: ['...bbbbb...', '..bbbybbb..', 'bbbbbbbbbbb'], x: 0, y: 1 }, { b: '#7a4a24', y: '#ffd23f' }),
});
Object.assign(HAT_MOTION, { captain: { amp: 0.3, sp: 3 }, knight: { amp: 0.15, sp: 2 }, sheriff: { amp: 0.3, sp: 2, bob: 0.3 } });
COSMETICS.skin.push({ id: 'dino', name: 'DINO', rarity: 'epic', story: 16 }, { id: 'chrono', name: 'TIME TRAVELER', rarity: 'legendary', story: 20 });
COSMETICS.hat.push({ id: 'captain', name: 'CAPTAIN HAT', rarity: 'rare', story: 17 }, { id: 'knight', name: 'KNIGHT HELM', rarity: 'epic', story: 18 },
  { id: 'sheriff', name: 'SHERIFF HAT', rarity: 'rare', story: 19 });

// ================================================================ levels 16-20
LEVELS.push(
  { n: 16, name: 'DINO JUNGLE', world: 'jungle', time: 140, diff: 6.9, boss: 'rex', reward: 'dino', rewardCat: 'skin',
    pool: { bolt: 7, spiderling: 4, saw: 3, goo: 3, tank: 2 },
    intro: [['duck', "WHERE ARE WE? WHY IS EVERYTHING SO BIG?!"], ['ticktock', 'TICK TOCK! WELCOME TO 65 MILLION YEARS AGO! SAY HELLO TO REX-BOT!']],
    outro: [['daisy', 'A GLOWING PORTAL! QUICK, JUMP IN!']] },
  { n: 17, name: 'PIRATE COVE', world: 'pirate', time: 140, diff: 7.1, boss: 'captain', reward: 'captain', rewardCat: 'hat',
    pool: { bolt: 7, boom: 4, drone: 3, saw: 3, goo: 2 },
    intro: [['ticktock', 'TICK TOCK! THE YEAR 1700. CAPTAIN CLAW WILL MAKE YOU WALK THE PLANK!'], ['duck', 'DUCKS CAN SWIM, YOU KNOW! QUACK!']],
    outro: [['honk', 'HONK! CAN YOU HEAR ME?! THE PORTALS LEAD TO HIS CITY! KEEP GOING!']] },
  { n: 18, name: "KNIGHT'S KEEP", world: 'knight', time: 145, diff: 7.2, boss: 'dragon', reward: 'knight', rewardCat: 'hat',
    pool: { bolt: 6, tank: 3, saw: 3, drone: 3, spiderling: 3 },
    intro: [['ticktock', 'TICK TOCK! THE MIDDLE AGES! EVERY CASTLE NEEDS A DRAGON!'], ['daisy', 'A ROBOT DRAGON? THAT IS NOT HOW HISTORY WENT!']],
    outro: [['daisy', 'ONE MORE PORTAL! I CAN SMELL... CACTUS?']] },
  { n: 19, name: 'WILD WEST', world: 'west', time: 145, diff: 7.1, boss: 'sheriff', reward: 'sheriff', rewardCat: 'hat',
    pool: { bolt: 9, turret: 1, boom: 3, saw: 3, drone: 2 },
    intro: [['ticktock', 'TICK TOCK! THIS TOWN AIN\'T BIG ENOUGH FOR THE SHERIFF BOT AND YOU!'], ['duck', 'HOWDY, ROBOT. DRAW! QUACK!']],
    outro: [['ticktock', 'ENOUGH! COME TO MY CITY, IF YOU DARE. THE FUTURE IS MINE!']] },
  { n: 20, name: 'NEON CITY 3000', world: 'neon', time: 150, diff: 7.4, boss: 'ticktock', reward: 'chrono', rewardCat: 'skin',
    pool: { bolt: 9, drone: 3, saw: 3, tank: 2, spiderling: 3, turret: 1 },
    intro: [['ticktock', 'TICK TOCK! THE YEAR 3000! HERE I CONTROL EVERY SECOND!'], ['daisy', 'THEN LET US SEE HOW YOU HANDLE THE NEXT FEW MINUTES!'], ['duck', 'QUAAACK! TIME TO GO HOME!']],
    outro: [] },
);
CHAPTERS.push({ n: 4, from: 16, to: 20, title: 'CHAPTER 4 - LOST IN TIME!', sea: 'pirate', isle: ['#8f6a3a', '#e0bf7a'], intro: 'intro4', ending: 'ending4' });
ENDING_PAY.ending4 = 2000;

// ================================================================ Tick-Tock in dialog boxes
SPEAKERS.ticktock = { name: 'TICK-TOCK', col: '#5ec8ff' };
VOICES.ticktock = 1300;
PORTRAITS.ticktock = (x, y, t, bob) => drawSprX(enemySprite('ticktock', Math.floor(t * 2) % 2, null), x + 15, y + 36 - bob, { sc: 2, ay: 1 });

// ================================================================ cutscene props
function drawTicktock(x, y, t, sc = 2, alpha = 1) {
  drawSprX(enemySprite('ticktock', Math.floor(t * 2) % 2, null), x, y - Math.sin(t * 3) * 3, { sc, ay: 1, alpha });
}
function drawToaster(x, y, T, glow = 0) {
  panel(x - 10, y - 10, 20, 11, '#c3c2d4', OUT, '#e3e7f0', false);
  ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 10, 4, 2); ctx.fillRect(x + 2, y - 10, 4, 2);
  pcirc(x, y - 4, 3, '#fff3dc'); pline(x, y - 4, x + Math.cos(T * 6) * 2, y - 4 + Math.sin(T * 6) * 2, '#e8343b');
  if (glow > 0) { ctx.globalAlpha = glow; pcirc(x, y - 6, 10 + Math.sin(T * 20) * 2, '#5ec8ff'); ctx.globalAlpha = 1; }
}
// a swirling hole in time
function drawPortal(x, y, r, T) {
  for (let i = 4; i >= 0; i--) {
    const rr = r * (0.3 + i * 0.17);
    pellipse(x, y, rr, rr * 0.75, i % 2 ? '#2f1a5c' : '#5ec8ff');
  }
  for (let i = 0; i < 8; i++) { const a = T * 4 + i / 8 * TAU, rr = r * (0.4 + ((T * 0.8 + i * 0.13) % 0.6)); ctx.fillStyle = i % 2 ? '#ff5ce1' : '#ffffff'; ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.75), 2, 2); }
}
let neonPat = null;
function drawNeonScene(T) {
  ctx.fillStyle = '#0c0a1a'; ctx.fillRect(0, 0, W, H);
  const gy = Math.floor(H * 0.58);
  for (let i = 0; i < 12; i++) { // skyline with blinking windows
    const bw = W / 12, h = 30 + (i * 37) % 50, x = i * bw;
    ctx.fillStyle = i % 2 ? '#1b1330' : '#24193f'; ctx.fillRect(x, gy - h, bw - 2, h);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = (Math.floor(T * 2) + i + k) % 3 ? '#ff5ce1' : '#5ec8ff'; ctx.fillRect(Math.round(x + 4 + (k % 2) * 6), Math.round(gy - h + 6 + Math.floor(k / 2) * 9), 2, 2); }
  }
  if (!neonPat) neonPat = ctx.createPattern(groundTile('neon'), 'repeat');
  ctx.fillStyle = neonPat; ctx.fillRect(0, gy, W, H - gy);
  return gy;
}
function drawJungleScene(T) {
  drawSky('#3f8f5a', '#bfe8a8', T, true);
  const gy = Math.floor(H * 0.6);
  if (!drawJungleScene.pat) drawJungleScene.pat = ctx.createPattern(groundTile('jungle'), 'repeat');
  ctx.fillStyle = drawJungleScene.pat; ctx.fillRect(0, gy, W, H - gy);
  drawSpr(DECO_ART.jungletree, W * 0.1, gy - 4); drawSpr(DECO_ART.jungletree, W * 0.9, gy); drawSpr(DECO_ART.bigleaf, W * 0.4, gy + 30);
  return gy;
}

// ---------------------------------------------------------------- chapter 4 intro: the time toaster
const INTRO4_BEATS = [
  { dur: 3, say: ['narr', 'BACK AT THE BAKERY, DR. HONK HAS A NEW INVENTION...'],
    enter() { Music.play('title'); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawBakery(W * 0.6, gy, T); drawToaster(W * 0.6 + 12, gy + 8, T);
      drawHonk(W * 0.6 - 8, gy + 10, false, 1, T);
      const k = Ease.outCubic(Math.min(1, t / 2.6));
      drawHeroes(cs, lerp(-30, W * 0.3, k), gy + 38, T, k < 1, 'right');
      drawDaisy(lerp(-10, W * 0.44, k), gy + 36, { t: T });
    } },
  { dur: 3, say: ['honk', 'BEHOLD: THE TIME TOASTER! IT TOASTS BREAD... IN THE FUTURE! HONK!'],
    enter() { sfx.honk(1.3); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawBakery(W * 0.6, gy, T); drawToaster(W * 0.6 + 12, gy + 8, T, Math.min(0.5, t * 0.2));
      drawHonk(W * 0.6 - 8, gy + 10 - Math.abs(Math.sin(T * 8)) * 2, false, 1, T);
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right');
      drawDaisy(W * 0.44, gy + 36, { t: T });
    } },
  { dur: 2.2, say: ['narr', '...DING!'],
    enter(cs) { cs.shake = 4; sfx.warn(); sfx.warp(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, Math.min(0.5, t * 0.4));
      drawBakery(W * 0.6, gy, T); drawToaster(W * 0.6 + 12, gy + 8, T, 0.8);
      if (Math.random() < 0.5) cs.burst(W * 0.6 + 12, gy, ['#5ec8ff', '#ffffff', '#ff5ce1'], 3, 60, 0.6, 0);
      drawHonk(W * 0.6 - 8, gy + 10, false, 1, 0);
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!');
      drawDaisy(W * 0.44, gy + 36, { t: T });
    } },
  { dur: 3.2, say: ['ticktock', 'TICK TOCK! THANK YOU FOR OPENING THE DOOR, SILLY GOOSE. NOW ALL OF TIME IS MINE!'],
    enter() { Music.play('boss'); sfx.bossIntro(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.5);
      drawPortal(W * 0.78, gy - 20, 26 * Math.min(1, t * 1.5), T);
      drawBakery(W * 0.6, gy, T); drawToaster(W * 0.6 + 12, gy + 8, T, 0.5);
      if (t > 0.5) drawTicktock(W * 0.78, gy - 2 - Math.min(1, (t - 0.5) * 2) * 6, T, 2, Math.min(1, (t - 0.5) * 2));
      drawHonk(W * 0.6 - 8, gy + 10, false, 1, 0);
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!', true);
      drawDaisy(W * 0.44, gy + 36, { t: T, blink: true });
    } },
  { dur: 2.4, say: ['daisy', 'WHAT IS THAT? A FLYING CLOCK?!'],
    enter() { sfx.quack(1.4); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.5);
      drawPortal(W * 0.78, gy - 20, 26, T);
      drawBakery(W * 0.6, gy, T);
      drawTicktock(W * 0.78, gy - 8, T);
      drawHonk(W * 0.6 - 8, gy + 10 - Math.abs(Math.sin(T * 14)) * 2, false, 1, 0);
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '?', true);
      drawDaisy(W * 0.44, gy + 36, { t: T });
    } },
  { dur: 3.2, say: ['ticktock', 'I WILL SCATTER YOU THROUGH HISTORY! GOODBYE, DUCKS! TICK TOCK!'],
    enter(cs) { cs.shake = 4; sfx.warp(); },
    tick(cs, t, dt) { if (Math.random() < dt * 20) cs.burst(W * 0.3, H * 0.75, ['#5ec8ff', '#ff5ce1'], 1, 50, 0.5, 0); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.55);
      const k = Ease.inCubic(Math.min(1, t / 2.4));
      drawPortal(W * 0.3, gy + 20, 30, T);
      drawBakery(W * 0.6, gy, T);
      drawTicktock(W * 0.78, gy - 8, T);
      ctx.save(); ctx.translate(W * 0.3, gy + 20); ctx.rotate(k * 9); ctx.scale(1 - k, 1 - k); ctx.translate(-W * 0.3, -(gy + 20));
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!!', true);
      ctx.restore();
      drawDaisy(lerp(W * 0.44, W * 0.32, k), gy + 36 - k * 14, { t: T, sc: 2 * (1 - k * 0.9) });
      drawHonk(W * 0.6 - 8, gy + 10, false, 1, 0);
    } },
  { dur: 2.6, say: ['duck', 'OOF! ...WHERE ARE WE? IS THAT A DINOSAUR?!'],
    enter(cs) { Music.play('jungle'); sfx.quack(); cs.shake = 2; },
    draw(cs, t, T) {
      const gy = drawJungleScene(T);
      drawSprX(enemySprite('rex', 0, null), W * 0.82, gy + 44, { sc: 2, ay: 1, alpha: 0.85 });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '?', true);
      drawDaisy(W * 0.44, gy + 36, { t: T });
    } },
  { dur: 2.4,
    enter(cs) { sfx.title(); cs.shake = 4; },
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.5));
      drawZoomText('CHAPTER 4', W / 2, H * 0.38, lerp(9, 3, k), C.gold);
      if (t > 0.5) text('LOST IN TIME!', W / 2, H * 0.58, C.white, 1, 1);
      drawHeroes(cs, W / 2 - 6, H * 0.85, T, true, 'right', '', false, true);
    } },
];

// ---------------------------------------------------------------- chapter 4 ending: home again
const ENDING4_BEATS = [
  { dur: 2.6, say: ['narr', "TICK-TOCK'S GEARS SPIN OUT OF CONTROL!"],
    enter(cs) { cs.shake = 6; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawNeonScene(T);
      drawSprX(enemySprite('ticktock', Math.floor(T * 12) % 2, null), W * 0.66, gy + 40, { sc: 2, ay: 1, white: (T * 6 | 0) % 2 === 0 && t < 1, rot: Math.sin(T * 20) * 0.2 });
      if (Math.random() < 0.4) cs.burst(W * 0.66 + rand(-16, 16), gy + rand(-6, 24), ['#5ec8ff', '#ffd23f', '#3d3a52'], 1, 20, 1.2, -25);
      drawHeroes(cs, W * 0.26, gy + 44, T, false, 'right');
      drawDaisy(W * 0.4, gy + 42, { t: T, facing: 'right' });
    } },
  { dur: 3, say: ['ticktock', 'NO! MY TIME IS UP?! ...WAIT. WHAT TIME IS IT ANYWAY?'],
    draw(cs, t, T) {
      const gy = drawNeonScene(T);
      drawSprX(enemySprite('ticktock', 0, null), W * 0.66, gy + 40, { sc: 1.5, ay: 1, rot: 0.4 });
      drawHeroes(cs, W * 0.26, gy + 44, T, false, 'right', '?');
      drawDaisy(W * 0.4, gy + 42, { t: T, facing: 'right' });
    } },
  { dur: 3, say: ['narr', 'THE PORTAL OPENS ONE LAST TIME... BACK TO PUDDLE POND!'],
    enter() { sfx.warp(); sfx.revive(); },
    draw(cs, t, T) {
      const gy = drawNeonScene(T);
      drawPortal(W * 0.5, gy + 10, 32, T);
      const k = Ease.inCubic(Math.min(1, t / 2.6));
      drawSprX(enemySprite('ticktock', 0, null), W * 0.66, gy + 40, { sc: 1.5, ay: 1, rot: 0.4 });
      drawHeroes(cs, lerp(W * 0.26, W * 0.48, k), gy + 44 - k * 20, T, true, 'right');
      drawDaisy(lerp(W * 0.4, W * 0.52, k), gy + 42 - k * 20, { t: T, facing: 'right', sc: 2 * (1 - k * 0.6) });
    } },
  { dur: 3, say: ['honk', "HONK! YOU'RE BACK! I PROMISE... NO MORE TOASTERS."],
    enter(cs) { Music.play('title'); sfx.honk(1.2); cs.burst(W * 0.4, H * 0.6, ['#ffd23f', '#fff8e7'], 16, 60); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawBakery(W * 0.6, gy, T);
      drawHonk(W * 0.6 - 8, gy + 10 - Math.abs(Math.sin(T * 8)) * 3, false, 1, T);
      drawHeroes(cs, W * 0.3, gy + 38, T, true, 'right');
      drawDaisy(W * 0.44, gy + 36, { t: T });
    } },
  { dur: 3, say: ['daisy', 'AND THE LITTLE CLOCK CAME TOO! HE CAN BE OUR NEW KITCHEN TIMER!'],
    enter() { sfx.win(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawBakery(W * 0.6, gy, T);
      drawHonk(W * 0.6 - 8, gy + 10, false, 1, T);
      drawSprX(enemySprite('ticktock', Math.floor(T * 2) % 2, null), W * 0.6 + 14, gy + 8 - Math.abs(Math.sin(T * 6)) * 2, { sc: 0.75, ay: 1 });
      if (Math.floor(T * 2) % 2) text('DING!', W * 0.6 + 14, gy - 12, '#5ec8ff', 1, 1, 'outline');
      drawHeroes(cs, W * 0.3, gy + 38, T, true, 'right');
      drawDaisy(W * 0.44, gy + 36 - Math.abs(Math.sin(T * 7)) * 3, { t: T, frame: Math.floor(T * 7) % 2 });
    } },
  { dur: 4,
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      if (Math.random() < 0.1) cs.burst(rand(0, W), rand(0, H * 0.5), RAINBOW, 20, 50, 1.2, 30);
      const k = Ease.outBack(Math.min(1, t / 0.6));
      drawZoomText('THE END', W / 2, H * 0.3, lerp(10, 4, k), C.gold);
      if (t > 0.6) text('THANKS FOR PLAYING QUACK ATTACK!', W / 2, H * 0.5, C.white, 1, 1);
      if (t > 1.0 && cs.paid) { const lw = textW('+2000 COINS REWARD!'); coinIcon(Math.floor(W / 2 - lw / 2 - 6), Math.floor(H * 0.6), T); text('+2000 COINS REWARD!', W / 2 + 4, H * 0.6 + 1, C.gold, 1, 1); }
      drawHeroes(cs, W / 2 - 40, H * 0.88, T, true, 'down');
      drawDaisy(W / 2 + 4, H * 0.88 - Math.abs(Math.sin(T * 7)) * 3, { t: T });
      drawHonk(W / 2 + 34, H * 0.88 + 2 - Math.abs(Math.sin(T * 7 + 1)) * 3, false, 2, T);
      drawSprX(enemySprite('ticktock', Math.floor(T * 2) % 2, null), W / 2 + 58, H * 0.88 - Math.abs(Math.sin(T * 7 + 2)) * 3, { sc: 0.75, ay: 1 });
    } },
];
Object.assign(CUTSCENES, { intro4: INTRO4_BEATS, ending4: ENDING4_BEATS });

// ================================================================ translations for chapter 4
addPhrases([
  ['DINO JUNGLE', 'DINO-DSCHUNGEL', 'ДИНО-ДЖУНГЛИ'], ['PIRATE COVE', 'PIRATENBUCHT', 'ПИРАТСКАЯ БУХТА'], ["KNIGHT'S KEEP", 'RITTERBURG', 'РЫЦАРСКИЙ ЗАМОК'], ['WILD WEST', 'WILDER WESTEN', 'ДИКИЙ ЗАПАД'],
  ['NEON CITY 3000', 'NEONSTADT 3000', 'НЕОН-СИТИ 3000'],
  ['REX-BOT', 'REX-BOT', 'РЕКС-БОТ'], ['CAPTAIN CLAW', 'KAPITÄN KRALLE', 'КАПИТАН КЛЕШНЯ'], ['DRAGON-BOT', 'DRACHEN-BOT', 'ДРАКОН-БОТ'], ['SHERIFF BOT', 'SHERIFF-BOT', 'ШЕРИФ-БОТ'], ['TICK-TOCK', 'TICK-TACK', 'ТИК-ТАК'],
  ['DINO', 'DINO', 'ДИНО'], ['TIME TRAVELER', 'ZEITREISENDER', 'ПУТЕШЕСТВЕННИК'], ['CAPTAIN HAT', 'KAPITÄNSHUT', 'КАПИТАНСКАЯ ШЛЯПА'], ['KNIGHT HELM', 'RITTERHELM', 'РЫЦАРСКИЙ ШЛЕМ'], ['SHERIFF HAT', 'SHERIFFHUT', 'ШЛЯПА ШЕРИФА'],
  ['TIME IS RUNNING OUT!', 'DIE ZEIT LÄUFT AB!', 'ВРЕМЯ НА ИСХОДЕ!'], ['TICK TOCK! GET THEM!', 'TICK TACK! SCHNAPPT SIE!', 'ТИК-ТАК! ВЗЯТЬ ИХ!'],
  ['ARR! ALL HANDS ON DECK!', 'ARR! ALLE MANN AN DECK!', 'АРР! СВИСТАТЬ ВСЕХ НАВЕРХ!'], ['DEPUTIES! GET THEM!', 'HILFSSHERIFFS! SCHNAPPT SIE!', 'ПОМОЩНИКИ! ВЗЯТЬ ИХ!'], ['FWOOOSH!', 'FUUUSCH!', 'ФШШШУХ!'],
  ["WHERE ARE WE? WHY IS EVERYTHING SO BIG?!", 'WO SIND WIR? WARUM IST ALLES SO RIESIG?!', 'ГДЕ МЫ? ПОЧЕМУ ВСЁ ТАКОЕ ОГРОМНОЕ?!'],
  ['TICK TOCK! WELCOME TO 65 MILLION YEARS AGO! SAY HELLO TO REX-BOT!', 'TICK TACK! WILLKOMMEN VOR 65 MILLIONEN JAHREN! SAGT HALLO ZU REX-BOT!', 'ТИК-ТАК! ДОБРО ПОЖАЛОВАТЬ НА 65 МИЛЛИОНОВ ЛЕТ НАЗАД! ПОЗНАКОМЬТЕСЬ С РЕКС-БОТОМ!'],
  ['A GLOWING PORTAL! QUICK, JUMP IN!', 'EIN LEUCHTENDES PORTAL! SCHNELL, SPRINGT REIN!', 'СВЕТЯЩИЙСЯ ПОРТАЛ! БЫСТРЕЕ, ПРЫГАЕМ!'],
  ['TICK TOCK! THE YEAR 1700. CAPTAIN CLAW WILL MAKE YOU WALK THE PLANK!', 'TICK TACK! DAS JAHR 1700. KAPITÄN KRALLE LÄSST EUCH ÜBER DIE PLANKE GEHEN!', 'ТИК-ТАК! 1700 ГОД. КАПИТАН КЛЕШНЯ ОТПРАВИТ ВАС ЗА БОРТ!'],
  ['DUCKS CAN SWIM, YOU KNOW! QUACK!', 'ENTEN KÖNNEN SCHWIMMEN, WEISST DU! QUAK!', 'УТКИ УМЕЮТ ПЛАВАТЬ, ЗНАЕШЬ ЛИ! КРЯ!'],
  ['HONK! CAN YOU HEAR ME?! THE PORTALS LEAD TO HIS CITY! KEEP GOING!', 'HONK! HÖRT IHR MICH?! DIE PORTALE FÜHREN ZU SEINER STADT! WEITER!', 'ГА! ВЫ МЕНЯ СЛЫШИТЕ?! ПОРТАЛЫ ВЕДУТ В ЕГО ГОРОД! ВПЕРЁД!'],
  ['TICK TOCK! THE MIDDLE AGES! EVERY CASTLE NEEDS A DRAGON!', 'TICK TACK! DAS MITTELALTER! JEDE BURG BRAUCHT EINEN DRACHEN!', 'ТИК-ТАК! СРЕДНЕВЕКОВЬЕ! КАЖДОМУ ЗАМКУ НУЖЕН ДРАКОН!'],
  ['A ROBOT DRAGON? THAT IS NOT HOW HISTORY WENT!', 'EIN ROBOTER-DRACHE? SO WAR DIE GESCHICHTE NICHT!', 'РОБОТ-ДРАКОН? В ИСТОРИИ ТАКОГО НЕ БЫЛО!'],
  ['ONE MORE PORTAL! I CAN SMELL... CACTUS?', 'NOCH EIN PORTAL! ICH RIECHE... KAKTUS?', 'ЕЩЁ ОДИН ПОРТАЛ! ПАХНЕТ... КАКТУСОМ?'],
  ["TICK TOCK! THIS TOWN AIN'T BIG ENOUGH FOR THE SHERIFF BOT AND YOU!", 'TICK TACK! DIESE STADT IST ZU KLEIN FÜR DEN SHERIFF-BOT UND EUCH!', 'ТИК-ТАК! ЭТОТ ГОРОДОК СЛИШКОМ МАЛ ДЛЯ ШЕРИФ-БОТА И ВАС!'],
  ['HOWDY, ROBOT. DRAW! QUACK!', 'HOWDY, ROBOTER. ZIEH! QUAK!', 'ПРИВЕТ, РОБОТ. ДОСТАВАЙ! КРЯ!'],
  ['ENOUGH! COME TO MY CITY, IF YOU DARE. THE FUTURE IS MINE!', 'GENUG! KOMMT IN MEINE STADT, WENN IHR EUCH TRAUT. DIE ZUKUNFT GEHÖRT MIR!', 'ХВАТИТ! ПРИХОДИТЕ В МОЙ ГОРОД, ЕСЛИ ОСМЕЛИТЕСЬ. БУДУЩЕЕ - МОЁ!'],
  ['TICK TOCK! THE YEAR 3000! HERE I CONTROL EVERY SECOND!', 'TICK TACK! DAS JAHR 3000! HIER BEHERRSCHE ICH JEDE SEKUNDE!', 'ТИК-ТАК! 3000 ГОД! ЗДЕСЬ Я УПРАВЛЯЮ КАЖДОЙ СЕКУНДОЙ!'],
  ['THEN LET US SEE HOW YOU HANDLE THE NEXT FEW MINUTES!', 'DANN SCHAUEN WIR MAL, WIE DU MIT DEN NÄCHSTEN MINUTEN KLARKOMMST!', 'ТОГДА ПОСМОТРИМ, КАК ТЫ СПРАВИШЬСЯ С БЛИЖАЙШИМИ МИНУТАМИ!'],
  ['QUAAACK! TIME TO GO HOME!', 'QUAAAK! ZEIT, NACH HAUSE ZU GEHEN!', 'КРЯЯЯ! ПОРА ДОМОЙ!'],
  ['BACK AT THE BAKERY, DR. HONK HAS A NEW INVENTION...', 'ZURÜCK IN DER BÄCKEREI HAT DR. HONK EINE NEUE ERFINDUNG...', 'В ПЕКАРНЕ У ДР. ХОНКА НОВОЕ ИЗОБРЕТЕНИЕ...'],
  ['BEHOLD: THE TIME TOASTER! IT TOASTS BREAD... IN THE FUTURE! HONK!', 'SEHT HER: DER ZEIT-TOASTER! ER TOASTET BROT... IN DER ZUKUNFT! HONK!', 'УЗРИТЕ: ТОСТЕР ВРЕМЕНИ! ОН ЖАРИТ ХЛЕБ... В БУДУЩЕМ! ГА!'],
  ['...DING!', '...DING!', '...ДЗЫНЬ!'],
  ['TICK TOCK! THANK YOU FOR OPENING THE DOOR, SILLY GOOSE. NOW ALL OF TIME IS MINE!', 'TICK TACK! DANKE, DASS DU DIE TÜR GEÖFFNET HAST, DUMME GANS. JETZT GEHÖRT MIR DIE GANZE ZEIT!', 'ТИК-ТАК! СПАСИБО, ЧТО ОТКРЫЛ ДВЕРЬ, ГЛУПЫЙ ГУСЬ. ТЕПЕРЬ ВСЁ ВРЕМЯ - МОЁ!'],
  ['WHAT IS THAT? A FLYING CLOCK?!', 'WAS IST DAS? EINE FLIEGENDE UHR?!', 'ЧТО ЭТО? ЛЕТАЮЩИЕ ЧАСЫ?!'],
  ['I WILL SCATTER YOU THROUGH HISTORY! GOODBYE, DUCKS! TICK TOCK!', 'ICH VERSTREUE EUCH DURCH DIE GESCHICHTE! TSCHÜSS, ENTEN! TICK TACK!', 'Я РАЗБРОСАЮ ВАС ПО ИСТОРИИ! ПРОЩАЙТЕ, УТКИ! ТИК-ТАК!'],
  ['OOF! ...WHERE ARE WE? IS THAT A DINOSAUR?!', 'UFF! ...WO SIND WIR? IST DAS EIN DINOSAURIER?!', 'УФ! ...ГДЕ МЫ? ЭТО ЧТО, ДИНОЗАВР?!'],
  ['CHAPTER 4', 'KAPITEL 4', 'ГЛАВА 4'], ['LOST IN TIME!', 'VERLOREN IN DER ZEIT!', 'ПОТЕРЯННЫЕ ВО ВРЕМЕНИ!'], ['CHAPTER 4 - LOST IN TIME!', 'KAPITEL 4 - VERLOREN IN DER ZEIT!', 'ГЛАВА 4 - ПОТЕРЯННЫЕ ВО ВРЕМЕНИ!'],
  ["TICK-TOCK'S GEARS SPIN OUT OF CONTROL!", 'TICK-TACKS ZAHNRÄDER DREHEN DURCH!', 'ШЕСТЕРЁНКИ ТИК-ТАКА ВЫШЛИ ИЗ-ПОД КОНТРОЛЯ!'],
  ['NO! MY TIME IS UP?! ...WAIT. WHAT TIME IS IT ANYWAY?', 'NEIN! MEINE ZEIT IST UM?! ...MOMENT. WIE SPÄT IST ES ÜBERHAUPT?', 'НЕТ! МОЁ ВРЕМЯ ВЫШЛО?! ...СТОП. А КОТОРЫЙ ЧАС?'],
  ['THE PORTAL OPENS ONE LAST TIME... BACK TO PUDDLE POND!', 'DAS PORTAL ÖFFNET SICH EIN LETZTES MAL... ZURÜCK ZUM PFÜTZENTEICH!', 'ПОРТАЛ ОТКРЫВАЕТСЯ В ПОСЛЕДНИЙ РАЗ... ОБРАТНО НА ЛУЖИЧНЫЙ ПРУД!'],
  ["HONK! YOU'RE BACK! I PROMISE... NO MORE TOASTERS.", 'HONK! IHR SEID ZURÜCK! ICH VERSPRECHE... KEINE TOASTER MEHR.', 'ГА! ВЫ ВЕРНУЛИСЬ! ОБЕЩАЮ... БОЛЬШЕ НИКАКИХ ТОСТЕРОВ.'],
  ['AND THE LITTLE CLOCK CAME TOO! HE CAN BE OUR NEW KITCHEN TIMER!', 'UND DIE KLEINE UHR IST AUCH MITGEKOMMEN! SIE WIRD UNSER NEUER KÜCHENWECKER!', 'И МАЛЕНЬКИЕ ЧАСЫ ТОЖЕ С НАМИ! ОНИ БУДУТ НАШИМ КУХОННЫМ ТАЙМЕРОМ!'],
  ['+2000 COINS REWARD!', '+2000 MÜNZEN BELOHNUNG!', 'НАГРАДА: +2000 МОНЕТ!'], ['DING!', 'DING!', 'ДЗЫНЬ!'],
  ['CHAPTER 3 CLEAR!', 'KAPITEL 3 GESCHAFFT!', 'ГЛАВА 3 ПРОЙДЕНА!'], ['CHAPTER 4 IS UNLOCKED!', 'KAPITEL 4 IST FREI!', 'ГЛАВА 4 ОТКРЫТА!'],
]);
