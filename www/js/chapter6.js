'use strict';
/* QUACK ATTACK! — Chapter 6: MECHA-QUACK.
 * In the old scrapyard, the pieces of every robot the ducks ever beat pull themselves together into MECHA-QUACK:
 * a giant robot duck who says it is "the better duck". The ducks chase it through the scrapyard, a robot circus,
 * a glowing mushroom forest and the inside of a computer, to its fortress. */

// ================================================================ worlds
Object.assign(WORLD_THEME, {
  junkyard: { ground: ['#6b5a4a', '#5a4a3c', '#7d6b5a'], style: 'rock', edge: 'canyon', e1: '#4a3a2c', e2: '#5a4a3c', shore: '#7d6b5a', shoreD: '#4a3a2c',
    tint: { m: '#c3c2d4', M: '#5a5872', l: '#ffffff' }, deco: { boltpile: 4, oil: 2, cog: 3 }, tall: { scrap: 4, crate: 2, barrel: 2 }, sky: '#8f7a5a' },
  circus: { ground: ['#e8343b', '#c92a30', '#ff5c63'], style: 'candy', edge: 'void', e1: '#1b1325', e2: '#2a1b45', shore: '#ffd23f', shoreD: '#b08a00',
    tint: { m: '#5ec8ff', M: '#2f7fe0', l: '#bde6ff' }, deco: { balloon: 3, popcornD: 3, flowerB: 1 }, tall: { tent: 3, balloontall: 2 }, sky: '#2a1b45' },
  shroom: { ground: ['#5a3f6b', '#4a3358', '#6b4f80'], style: 'grass', edge: 'water', e1: '#3b1f5c', e2: '#6b3f9f', shore: '#3b2a4a', shoreD: '#2a1f38',
    tint: { m: '#c9a6ff', M: '#6b3f9f', l: '#f0d8ff' }, deco: { mush: 5, glowdot: 3, fern: 2 }, tall: { bigmush: 4, glowmush: 2 }, sky: '#1b1325' },
  cyber: { ground: ['#0f2a1f', '#0a1f17', '#15382a'], style: 'neon', edge: 'void', e1: '#05060f', e2: '#0a1f17', shore: '#51cf66', shoreD: '#2f9e44',
    tint: { m: '#7dff9a', M: '#2f9e44', l: '#d6ffe0' }, deco: { bitD: 4, glowdot: 2 }, tall: { server: 4, console: 1 }, sky: '#05060f' },
  fortress: { ground: ['#3b3f4f', '#2f3240', '#4a4f63'], style: 'stone', edge: 'lava', e1: '#e8343b', e2: '#ff8c1a', shore: '#2f3240', shoreD: '#1f2230',
    tint: { m: '#ff8c1a', M: '#8f4a00', l: '#ffd1a6' }, deco: { boltpile: 2, hazard: 2, cog: 3 }, tall: { pillar: 3, scrap: 2, vat: 1 }, sky: '#1f1218' },
});
Object.assign(DECO_ART, {
  scrap: spr(['...m....', '..mMm.r.', '.mmMmmrr', 'mmMmmmmm', 'mMmmrmMm', 'mmmmmmmm'], { m: '#8b8aa0', M: '#c3c2d4', r: '#a8432f' }),
  balloon: spr(['.r.', 'rRr', '.r.', '.k.'], { r: '#e8343b', R: '#ff9a9a', k: '#fff8e7' }, null),
  balloontall: spr(['.b..y.', 'bBb.yY', '.b..y.', '.k..k.', '..kk..', '..k...'], { b: '#5ec8ff', B: '#bde6ff', y: '#ffd23f', Y: '#fff3b0', k: '#fff8e7' }),
  popcornD: spr(['wy', 'yw'], { w: '#fff8e7', y: '#ffd23f' }, null),
  tent: spr(['....y....', '...rwr...', '..rwrwr..', '.rwrwrwr.', 'rwrwrwrwr', 'w.r.k.r.w', 'r.w.k.w.r'], { r: '#e8343b', w: '#fff8e7', y: '#ffd23f', k: '#1b1325' }),
  bigmush: spr(['..pppp..', '.pwpppp.', 'pppppwpp', 'pwpppppp', '...ss...', '...ss...', '..ssss..'], { p: '#9d5cff', w: '#fff8e7', s: '#f0d8ff' }),
  glowmush: spr(['.ccc.', 'cCcCc', '..s..', '..s..'], { c: '#7dfff5', C: '#ffffff', s: '#c9a6ff' }),
  bitD: spr(['g.g', '.g.', 'g.g'], { g: '#51cf66' }, null),
  server: spr(['kkkkk', 'kgkrk', 'kkkkk', 'kgkgk', 'kkkkk', 'krkgk', 'kkkkk', 'k...k'], { k: '#1f2a24', g: '#51cf66', r: '#e8343b' }),
});
Object.assign(LANDMARKS, {
  junkyard(x, y) { drawSpr(DECO_ART.scrap, x - 6, y - 3); drawSpr(DECO_ART.scrap, x + 5, y - 1); },
  circus(x, y) { drawSpr(DECO_ART.tent, x, y - 4); drawSpr(DECO_ART.balloon, x + 10, y - 9); },
  shroom(x, y) { drawSpr(DECO_ART.bigmush, x - 3, y - 4); drawSpr(DECO_ART.glowmush, x + 8, y - 1); },
  cyber(x, y, T) { drawSpr(DECO_ART.server, x - 4, y - 4); drawSpr(DECO_ART.server, x + 4, y - 3); if (Math.floor(T * 3) % 2) drawSpr(DECO_ART.bitD, x + 11, y - 9); },
  fortress(x, y, T) {
    ctx.fillStyle = OUT; ctx.fillRect(x - 11, y - 14, 23, 16); ctx.fillStyle = '#4a4f63'; ctx.fillRect(x - 10, y - 13, 21, 14);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#4a4f63'; ctx.fillRect(x - 10 + i * 6, y - 17, 3, 4); }
    ctx.fillStyle = (Math.floor(T * 2) % 2) ? '#ff8c1a' : '#e8343b'; ctx.fillRect(x - 1, y - 8, 3, 3);
  },
});

// ================================================================ bosses
Object.assign(ENEMY_ART, {
  magnet: [
    ['.WWWW......WWWW.', '.RRRR......RRRR.', '.RRRR......RRRR.', '.RRRR......RRRR.', '.RRRRR....RRRRR.', '..RRRRRRRRRRRR..', '..RReERRRReERR..', '...RRRRRRRRRR...',
      '....RRmmmmRR....', '.....RRRRRR.....', '....MM....MM....', '...MMM....MMM...'],
    ['.wwww......wwww.', '.RRRR......RRRR.', '.RRRR......RRRR.', '.RRRR......RRRR.', '.RRRRR....RRRRR.', '..RRRRRRRRRRRR..', '..RREeRRRREeRR..', '...RRRRRRRRRR...',
      '....RRmmmmRR....', '.....RRRRRR.....', '...MM......MM...', '..MMM......MMM..'],
  ],
  clown: [
    ['.......y........', '......ppp.......', '.....ppppp......', '....ppppppp.....', '..ooWWWWWWWWoo..', '.oooWKWWWWKWooo.', '.oooWWWrrWWWooo.', '..ooWrWWWWrWoo..',
      '....WWrrrrWW....', '...bbbbbbbbbb...', '..byybbbbbbyyb..', '...bbbbbbbbbb...', '....MM....MM....'],
    ['........y.......', '......ppp.......', '.....ppppp......', '....ppppppp.....', '..ooWWWWWWWWoo..', '.oooWKWWWWKWooo.', '.oooWWWrrWWWooo.', '..ooWrWWWWrWoo..',
      '....WWrrrrWW....', '...bbbbbbbbbb...', '..byybbbbbbyyb..', '...bbbbbbbbbb...', '...MM......MM...'],
  ],
  sporebot: [
    ['.....pppppp.....', '...ppwppppwpp...', '..pppppppppppp..', '.ppwppppppppwpp.', '.pppppppwppppppp', '..pppppppppppp..', '.....mmmmmm.....', '.....mEmmEm.....',
      '.....mmmmmm.....', '....mmMMMMmm....', '....M.M..M.M....'],
    ['.....pppppp.....', '...pppppwppp....', '..pwpppppppppp..', '.ppppppwppppppp.', '.ppwppppppppwppp', '..pppppppppppp..', '.....mmmmmm.....', '.....mEmmEm.....',
      '.....mmmmmm.....', '....mmMMMMmm....', '...M.M....M.M...'],
  ],
  virus: [
    ['...g...gg...g...', '..ggg.gggg.ggg..', '..GGGGGGGGGGGG..', 'g.GkkkkkkkkkkG.g', 'ggGkEEkkkkEEkGgg', '..GkEEkkkkEEkG..', '..GkkkkkkkkkkG..', 'g.GkkEEEEEEkkG.g',
      'ggGkkkkkkkkkkGgg', '..GGGGGGGGGGGG..', '..ggg.gggg.ggg..', '...g...gg...g...'],
    ['...g...gg...g...', '..ggg.gggg.ggg..', '..GGGGGGGGGGGG..', 'g.GkkkkkkkkkkG.g', 'ggGkkEEkkEEkkGgg', '..GkkEEkkEEkkG..', '..GkkkkkkkkkkG..', 'g.GkEkEkEkEkkG.g',
      'ggGkkkkkkkkkkGgg', '..GGGGGGGGGGGG..', '..ggg.gggg.ggg..', '...g...gg...g...'],
  ],
  mecha: [
    ['......mmmm......', '.....mmmmmm.....', '....mmrrrrmm....', '....mmrRrrmmOO..', '....mmmmmmmmOOO.', '.....mmmmmm.....', '...MMMMMMMMMM...', '..MMmmmmmmmmMM..',
      '.MMmmmyymmmmmMM.', '.MMmmmyymmmmmMM.', '..MMmmmmmmmmMM..', '...MMMMMMMMMM...', '....OO....OO....', '...OOO....OOO...'],
    ['......mmmm......', '.....mmmmmm.....', '....mmRrrRmm....', '....mmrrrrmmOO..', '....mmmmmmmmOOO.', '.....mmmmmm.....', '...MMMMMMMMMM...', '..MMmmmmmmmmMM..',
      '.MMmmmYYmmmmmMM.', '.MMmmmYYmmmmmMM.', '..MMmmmmmmmmMM..', '...MMMMMMMMMM...', '...OO......OO...', '..OOO......OOO..'],
  ],
});
Object.assign(ENEMY_PAL, {
  magnet: { R: '#e8343b', W: '#d5dbe6', w: '#ffffff', e: '#ffffff', E: OUT, m: '#3d3a52', M: '#3d3a52' },
  clown: { y: '#ffd23f', p: '#9d5cff', o: '#ff8c1a', W: '#fff8e7', K: OUT, r: '#e8343b', b: '#5ec8ff', M: '#3d3a52' },
  sporebot: { p: '#9d5cff', w: '#fff8e7', m: '#d5dbe6', M: '#8b8aa0', E: '#7dfff5' },
  virus: { g: '#51cf66', G: '#2f9e44', k: '#0a1f17', E: '#7dff9a' },
  mecha: { m: '#c3c2d4', M: '#5a5872', r: '#e8343b', R: '#ffffff', O: '#ff9f1c', y: '#ffd23f', Y: '#fff3b0' },
});
Object.assign(PROJ_ART, {
  nut: spr(['.m.', 'mkm', '.m.'], { m: '#c3c2d4', k: '#3d3a52' }),
  cball: spr(['.r.', 'rRr', '.r.'], { r: '#ff6fae', R: '#ffffff' }),
  spore: spr(['.p.', 'pPp', '.p.'], { p: '#c9a6ff', P: '#ffffff' }),
  bit: spr(['gg', 'gg'], { g: '#7dff9a' }),
  mbolt: spr(['.o.', 'oyo', 'oyo', '.o.'], { o: '#ff8c1a', y: '#fff3b0' }),
  scrapbit: spr(['mm.', 'mMm', '.mm'], { m: '#8b8aa0', M: '#d5dbe6' }),
});
Object.assign(BOSSES, {
  magnet: { name: 'MAGNA-BOT', hp: 3700, spd: 28, dmg: 28, r: 15, sc: 2, attacks: ['charge', 'ring', 'summon', 'volley', 'jump'], summon: ['bolt', 'tank', 'saw'], col: '#e8343b', bullet: 'nut' },
  clown: { name: 'CLOWN-BOT', hp: 3800, spd: 32, dmg: 28, r: 15, sc: 2, attacks: ['jump', 'spiral', 'summon', 'jump', 'ring'], summon: ['bolt', 'boom', 'goo'], col: '#ff6fae', bullet: 'cball', summonText: 'HONK HONK! SHOWTIME!' },
  sporebot: { name: 'SPORE-BOT', hp: 3900, spd: 26, dmg: 28, r: 15, sc: 2, attacks: ['breath', 'summon', 'ring', 'burrow', 'spiral'], summon: ['goo', 'minigoo', 'spiderling'], col: '#9d5cff', bullet: 'spore', fx: 'goo' },
  virus: { name: 'VIRUS.EXE', hp: 4100, spd: 34, dmg: 30, r: 15, sc: 2, attacks: ['warp', 'spiral', 'volley', 'warp', 'summon', 'ring'], summon: ['drone', 'bolt', 'spiderling'], col: '#51cf66', bullet: 'bit' },
  mecha: { name: 'MECHA-QUACK', hp: 5600, spd: 30, dmg: 32, r: 17, sc: 2, attacks: ['charge', 'missiles', 'spiral', 'warp', 'breath', 'ring', 'summon', 'jump'],
    summon: ['bolt', 'boom', 'tank', 'saw', 'drone'], col: '#c3c2d4', bullet: 'mbolt', final: true, rage: 'MECHA-QUACK IS OVERHEATING!', summonText: 'QUACK.EXE! ATTACK!' },
});
BOSS_ORDER.push('magnet', 'clown', 'sporebot', 'virus', 'mecha');

// ================================================================ rewards (story only)
Object.assign(SKIN_PAL, {
  shroomy: { h: '#9d5cff', y: '#9d5cff', d: '#6b3f9f', w: '#fff8e7', o: '#ffd23f', f: '#f0d8ff', K: OUT, c: '#ff9ccb' },
  mechaduck: { h: '#c3c2d4', y: '#c3c2d4', d: '#5a5872', w: '#ffffff', o: '#ff9f1c', f: '#ff9f1c', K: '#e8343b', c: '#5ec8ff' },
});
Object.assign(HAT_ART, {
  clownhat: hat({ rows: ['....y.....', '...ppp....', '..ppppp...', '.ppppppp..', 'ooooooooo.'], x: 1, y: 1 }, { y: '#ffd23f', p: '#9d5cff', o: '#ff8c1a' }),
});
HAT_MOTION.clownhat = { amp: 0.7, sp: 4 };
HAT_SPARK.clownhat = ['#ffd23f', '#9d5cff', '#5ec8ff'];
HALO_FX.binary = ({ x, y, sc, t, layer, rx, ry }) => { // little green ones and zeros spinning round
  for (let i = 0; i < 6; i++) {
    const a = t * 1.2 + i * TAU / 6, front = Math.sin(a) > 0;
    if ((layer === 'front') !== front) continue;
    const px = Math.round(x + Math.cos(a) * rx), py = Math.round(y + Math.sin(a) * ry);
    ctx.fillStyle = (Math.floor(t * 4) + i) % 3 ? '#51cf66' : '#7dff9a';
    if ((i + Math.floor(t * 2)) % 2) ctx.fillRect(px, py - sc, sc, sc * 3); // a 1
    else { ctx.fillRect(px - sc, py - sc, sc * 3, sc); ctx.fillRect(px - sc, py + sc, sc * 3, sc); ctx.fillRect(px - sc, py, sc, sc); ctx.fillRect(px + sc, py, sc, sc); } // a 0
  }
};
GUN_ART.scrapgun = spr(['..m.m...', 'mmmmmmmM', 'mmk.....', 'kk......'], { m: '#8b8aa0', M: '#d5dbe6', k: '#5c3416' });
WEAPONS.scrapgun = { cd: 0.3, dmg: 9, n: 2, spread: 0.2, speed: 220, life: 0.7, r: 2, kb: 35, range: 150, col: '#c3c2d4' };
SHOT_KIND.scrapgun = 'scrap';
SHOT_EXTRA.scrap = { art: 'scrapbit', spin: 1, pierce: 1 };
SHOOT_SFX.scrapgun = p => { tone(320 * p, 0.06, 'square', 0.04, 180); noise(0.05, 0.04, 2500); };
COSMETICS.weapon.push({ id: 'scrapgun', name: 'SCRAP LAUNCHER', rarity: 'epic', story: 26, desc: 'TWO SPINNING SCRAPS AT ONCE' });
COSMETICS.hat.push({ id: 'clownhat', name: 'CLOWN HAT', rarity: 'epic', story: 27 });
COSMETICS.skin.push({ id: 'shroomy', name: 'SHROOMY', rarity: 'epic', story: 28 }, { id: 'mechaduck', name: 'MECHA DUCK', rarity: 'legendary', story: 30 });
COSMETICS.halo.push({ id: 'binary', name: 'BINARY HALO', rarity: 'legendary', story: 29 });

// ================================================================ levels 26-30
LEVELS.push(
  { n: 26, name: 'THE SCRAPYARD', world: 'junkyard', time: 150, diff: 7.6, boss: 'magnet', reward: 'scrapgun',
    pool: { bolt: 8, tank: 3, saw: 3, boom: 3, drone: 2 },
    intro: [['mecha', 'I AM MECHA-QUACK. BUILT FROM EVERY ROBOT YOU EVER BROKE. MAGNA-BOT, PULL THEM APART!'], ['duck', 'A ROBOT DUCK?! THAT IS SO NOT COOL! QUACK!']],
    outro: [['honk', 'HONK! IT RAN OFF TO THE OLD CIRCUS! I SAW A BIG TENT OVER THERE!']] },
  { n: 27, name: 'ROBO CIRCUS', world: 'circus', time: 150, diff: 7.7, boss: 'clown', reward: 'clownhat', rewardCat: 'hat',
    pool: { bolt: 8, boom: 4, goo: 3, drone: 2, saw: 2 },
    intro: [['mecha', 'LADIES AND ROBOTS! TONIGHT: CLOWN-BOT JUGGLES DUCKS!'], ['daisy', 'I DO NOT LIKE THIS CIRCUS AT ALL!']],
    outro: [['daisy', 'IT FLEW INTO THAT GLOWING FOREST! THE MUSHROOMS ARE AS BIG AS HOUSES!']] },
  { n: 28, name: 'GLOWSHROOM FOREST', world: 'shroom', time: 150, diff: 7.8, boss: 'sporebot', reward: 'shroomy', rewardCat: 'skin',
    pool: { bolt: 7, goo: 4, spiderling: 3, drone: 2, saw: 2 },
    intro: [['mecha', 'SPORE-BOT WILL MAKE YOU SNEEZE UNTIL YOU GIVE UP. ACHOO.EXE.'], ['duck', "DON'T BREATHE THE PURPLE STUFF! QUACK!"]],
    outro: [['honk', 'HONK! IT UPLOADED ITSELF INTO A COMPUTER! I CAN BEAM YOU IN AFTER IT!']] },
  { n: 29, name: 'CYBER SPACE', world: 'cyber', time: 155, diff: 7.9, boss: 'virus', reward: 'binary', rewardCat: 'halo',
    pool: { bolt: 7, drone: 4, saw: 3, spiderling: 3, tank: 2 },
    intro: [['duck', 'WHOA... EVERYTHING IS MADE OF LITTLE GREEN NUMBERS!'], ['mecha', 'VIRUS.EXE, DELETE THESE DUCKS. DELETE. DELETE.']],
    outro: [['mecha', 'FINE. COME TO MY FORTRESS. ONLY ONE DUCK LEAVES. THE BETTER DUCK.']] },
  { n: 30, name: 'MECHA FORTRESS', world: 'fortress', time: 160, diff: 8, boss: 'mecha', reward: 'mechaduck', rewardCat: 'skin',
    pool: { bolt: 7, boom: 3, tank: 3, saw: 3, drone: 3 },
    intro: [['mecha', 'I AM FASTER. I AM STRONGER. I NEVER NEED A NAP. I AM THE BETTER DUCK.'], ['daisy', 'BUT YOU DON\'T HAVE FRIENDS!'], ['duck', 'AND FRIENDS ARE THE BEST POWER-UP! QUAAACK!']],
    outro: [] },
);
CHAPTERS.push({ n: 6, from: 26, to: 30, title: 'CHAPTER 6 - MECHA-QUACK', sea: 'junkyard', isle: ['#5a4a3c', '#7d6b5a'], intro: 'intro6', ending: 'ending6' });
ENDING_PAY.ending6 = 3000;

// ================================================================ Mecha-Quack in dialog boxes
SPEAKERS.mecha = { name: 'MECHA-QUACK', col: '#c3c2d4' };
VOICES.mecha = 70;
PORTRAITS.mecha = (x, y, t, bob) => drawSprX(enemySprite('mecha', Math.floor(t * 3) % 2, null), x + 15, y + 34 - bob, { sc: 2, ay: 1 });

// ================================================================ music
Object.assign(SONGS, {
  junk: {
    bpm: 124, lead: 'square', drums: 'full',
    bass: [36, 0, 36, 43, 0, 36, 41, 0, 36, 0, 36, 43, 0, 46, 43, 0, 34, 0, 34, 41, 0, 34, 39, 0, 31, 0, 31, 38, 0, 41, 43, 0],
    mel: [72, 0, 72, 75, 0, 72, 70, 0, 67, 0, 0, 0, 70, 0, 72, 0, 75, 0, 77, 0, 75, 0, 72, 0, 70, 0, 0, 0, 0, 0, 0, 0,
      72, 0, 72, 75, 0, 72, 70, 0, 67, 0, 70, 0, 72, 0, 75, 0, 79, 0, 0, 77, 75, 0, 72, 0, 74, 0, 0, 0, 0, 0, 0, 0],
  },
  cyber: {
    bpm: 140, lead: 'sawtooth', drums: 'full',
    bass: [45, 45, 0, 45, 52, 0, 45, 0, 43, 43, 0, 43, 50, 0, 43, 0, 41, 41, 0, 41, 48, 0, 41, 0, 40, 40, 0, 40, 47, 0, 44, 0],
    mel: [81, 0, 76, 0, 81, 0, 83, 0, 84, 0, 83, 0, 81, 0, 76, 0, 79, 0, 74, 0, 79, 0, 81, 0, 83, 0, 81, 0, 79, 0, 0, 0,
      77, 0, 72, 0, 77, 0, 79, 0, 81, 0, 79, 0, 77, 0, 72, 0, 76, 0, 80, 0, 83, 0, 88, 0, 86, 0, 84, 0, 83, 0, 0, 0],
  },
});

// ================================================================ cutscene props
// a heap of broken robots; shake > 0 makes it rattle
function drawScrapHeap(x, y, T, shake = 0) {
  const sx = shake ? Math.round(Math.sin(T * 40) * shake) : 0;
  pellipse(x + sx, y, 46, 12, OUT); pellipse(x + sx, y - 1, 45, 11, '#5a4a3c');
  for (let i = 0; i < 9; i++) drawSprX(DECO_ART.scrap, x + sx - 36 + i * 9, y - 4 - (i % 3) * 4, { ay: 1 });
  drawSprX(enemySprite('crab', 0, null), x + sx - 18, y - 10, { ay: 1, sc: 0.75 });
  drawSprX(enemySprite('kraken', 0, null), x + sx + 16, y - 12, { ay: 1, sc: 0.6 });
}
function drawJunkyardScene(T) {
  drawSky('#c9a87a', '#f2d7a6', T);
  const gy = Math.floor(H * 0.6);
  if (!junkPat) junkPat = ctx.createPattern(groundTile('junkyard'), 'repeat');
  ctx.fillStyle = junkPat; ctx.fillRect(0, gy, W, H - gy);
  drawSpr(DECO_ART.scrap, W * 0.06, gy + 4); drawSpr(DECO_ART.crate, W * 0.94, gy + 6); drawSpr(DECO_ART.barrel, W * 0.9, gy + 14);
  return gy;
}
let junkPat = null;
const drawMecha = (x, y, T, sc = 2, o = {}) => drawSprX(enemySprite('mecha', Math.floor(T * 3) % 2, null), x, y, Object.assign({ sc, ay: 1 }, o));

// ---------------------------------------------------------------- chapter 6 intro: the scrap wakes up
const INTRO6_BEATS = [
  { dur: 3, say: ['narr', 'PUDDLE POND IS FULL OF WATER AND FRIENDS AGAIN. EVERYBODY IS HAPPY...'],
    enter() { Music.play('title'); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right');
      drawDaisy(W * 0.5, gy + 36, { t: T });
      drawHonk(W * 0.66, gy + 40, true, 2, T);
    } },
  { dur: 3, say: ['narr', '...BUT IN THE OLD SCRAPYARD, ALL THE BROKEN ROBOTS START TO RATTLE.'],
    enter(cs) { Music.play('junk'); cs.shake = 2; },
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      drawScrapHeap(W * 0.6, gy + 34, T, 1 + t);
      if (Math.random() < 0.3) cs.burst(W * 0.6 + rand(-30, 30), gy + 20, ['#c3c2d4', '#ffd23f'], 2, 50, 0.4);
    } },
  { dur: 3.4, say: ['mecha', 'I AM MECHA-QUACK. BUILT FROM EVERY ROBOT YOU EVER BEAT. I AM THE BETTER DUCK.'],
    enter(cs) { Music.play('boss'); sfx.bossIntro(); cs.shake = 5; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      ctx.fillStyle = 'rgba(20,10,30,0.3)'; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.8));
      drawMecha(W * 0.62, gy + 40, T, 2 * k);
      if ((T * 4 | 0) % 2) pcirc(W * 0.62 - 2, gy + 40 - 30 * k, 3, 'rgba(232,52,59,0.5)');
    } },
  { dur: 3, say: ['honk', 'HONK! THAT IS NOT MY ROBOT! IT BUILT ITSELF! AND IT LOOKS LIKE YOU!'],
    enter() { sfx.honk(1.2); },
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      drawMecha(W * 0.7, gy + 40, T, 1.6);
      drawHonk(W * 0.42, gy + 40 - Math.abs(Math.sin(T * 10)) * 3, false, 2, T);
      drawHeroes(cs, W * 0.26, gy + 38, T, false, 'right', '!!', true);
    } },
  { dur: 2.8, say: ['duck', 'THERE IS ONLY ONE REAL DUCK HERE! AFTER IT! QUACK!'],
    enter(cs) { sfx.quack(); cs.burst(W * 0.3, H * 0.7, ['#ffd23f', '#fff8e7'], 16, 60); },
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      drawMecha(W * 0.7 + t * 40, gy + 40 - t * 20, T, 1.6, { alpha: Math.max(0, 1 - t / 2.4) });
      drawHeroes(cs, W * 0.3 + t * 10, gy + 38, T, true, 'right', '', false, true);
      drawDaisy(W * 0.46 + t * 10, gy + 36, { t: T });
    } },
  { dur: 2.4,
    enter(cs) { sfx.title(); cs.shake = 4; },
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.5));
      drawZoomText('CHAPTER 6', W / 2, H * 0.38, lerp(9, 3, k), C.gold);
      if (t > 0.5) text('MECHA-QUACK', W / 2, H * 0.58, C.white, 1, 1);
      drawHeroes(cs, W / 2 - 6, H * 0.85, T, true, 'right', '', false, true);
    } },
];

// ---------------------------------------------------------------- chapter 6 ending: a new friend
const ENDING6_BEATS = [
  { dur: 2.8, say: ['narr', 'MECHA-QUACK SPARKS... WOBBLES... AND SITS DOWN WITH A CLANK.'],
    enter(cs) { cs.shake = 6; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      drawMecha(W * 0.64, gy + 40, T, 2, { white: (T * 6 | 0) % 2 === 0 && t < 1 });
      if (Math.random() < 0.4) cs.burst(W * 0.64 + rand(-14, 14), gy + 10, ['#ffd23f', '#ff8c1a'], 2, 40, 0.5);
      drawHeroes(cs, W * 0.26, gy + 38, T, false, 'right');
    } },
  { dur: 3, say: ['mecha', 'ERROR. ERROR. WHY DO YOU ALWAYS WIN? I AM FASTER. I AM STRONGER.'],
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      drawMecha(W * 0.64, gy + 40, T, 1.6);
      drawHeroes(cs, W * 0.26, gy + 38, T, false, 'right', '?');
      drawDaisy(W * 0.42, gy + 36, { t: T, facing: 'right' });
    } },
  { dur: 3.2, say: ['daisy', 'BECAUSE WE ARE A TEAM! DO YOU WANT TO JOIN US?'],
    enter() { sfx.quack(1.3); },
    draw(cs, t, T) {
      const gy = drawJunkyardScene(T);
      drawMecha(W * 0.64, gy + 40, T, 1.6);
      drawHeroes(cs, W * 0.26, gy + 38, T, false, 'right');
      drawDaisy(W * 0.46, gy + 36 - Math.abs(Math.sin(T * 6)) * 2, { t: T, facing: 'right' });
    } },
  { dur: 3, say: ['mecha', 'JOIN... TEAM... QUACK? ...QUACK! QUACK.EXE IS HAPPY!'],
    enter(cs) { sfx.win(); Music.play('title'); cs.burst(W * 0.64, H * 0.5, RAINBOW, 30, 90); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawMecha(W * 0.7, gy + 40 - Math.abs(Math.sin(T * 7)) * 3, T, 1.4);
      drawHeroes(cs, W * 0.3, gy + 38, T, true, 'right');
      drawDaisy(W * 0.48, gy + 36 - Math.abs(Math.sin(T * 7)) * 3, { t: T, frame: Math.floor(T * 7) % 2 });
    } },
  { dur: 4,
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      if (Math.random() < 0.1) cs.burst(rand(0, W), rand(0, H * 0.5), RAINBOW, 20, 50, 1.2, 30);
      const k = Ease.outBack(Math.min(1, t / 0.6));
      drawZoomText('THE END', W / 2, H * 0.3, lerp(10, 4, k), C.gold);
      if (t > 0.6) text('THANKS FOR PLAYING QUACK ATTACK!', W / 2, H * 0.5, C.white, 1, 1);
      if (t > 1.0 && cs.paid) { const lw = textW('+3000 COINS REWARD!'); coinIcon(Math.floor(W / 2 - lw / 2 - 6), Math.floor(H * 0.6), T); text('+3000 COINS REWARD!', W / 2 + 4, H * 0.6 + 1, C.gold, 1, 1); }
      drawHeroes(cs, W / 2 - 40, H * 0.88, T, true, 'down');
      drawDaisy(W / 2 + 4, H * 0.88 - Math.abs(Math.sin(T * 7)) * 3, { t: T });
      drawHonk(W / 2 + 34, H * 0.88 + 2 - Math.abs(Math.sin(T * 7 + 1)) * 3, false, 2, T);
      drawMecha(W / 2 + 62, H * 0.88 - Math.abs(Math.sin(T * 7 + 2)) * 3, T, 0.8);
    } },
];
Object.assign(CUTSCENES, { intro6: INTRO6_BEATS, ending6: ENDING6_BEATS });

// ================================================================ translations for chapter 6
addPhrases([
  ['THE SCRAPYARD', 'DER SCHROTTPLATZ', 'СВАЛКА'], ['ROBO CIRCUS', 'ROBO-ZIRKUS', 'РОБО-ЦИРК'], ['GLOWSHROOM FOREST', 'LEUCHTPILZWALD', 'ЛЕС СВЕТЯЩИХСЯ ГРИБОВ'], ['CYBER SPACE', 'CYBERSPACE', 'КИБЕРПРОСТРАНСТВО'],
  ['MECHA FORTRESS', 'MECHA-FESTUNG', 'МЕХА-КРЕПОСТЬ'], ['MAGNA-BOT', 'MAGNA-BOT', 'МАГНА-БОТ'], ['CLOWN-BOT', 'CLOWN-BOT', 'КЛОУН-БОТ'], ['SPORE-BOT', 'SPOREN-BOT', 'СПОРО-БОТ'], ['VIRUS.EXE', 'VIRUS.EXE', 'ВИРУС.EXE'],
  ['MECHA-QUACK', 'MECHA-QUAK', 'МЕХА-КРЯ'], ['MECHA-QUACK IS OVERHEATING!', 'MECHA-QUAK ÜBERHITZT!', 'МЕХА-КРЯ ПЕРЕГРЕВАЕТСЯ!'], ['QUACK.EXE! ATTACK!', 'QUAK.EXE! ANGRIFF!', 'КРЯ.EXE! В АТАКУ!'],
  ['HONK HONK! SHOWTIME!', 'TRÖT TRÖT! SHOWTIME!', 'БИ-БИП! ШОУ НАЧИНАЕТСЯ!'],
  ['SCRAP LAUNCHER', 'SCHROTTWERFER', 'МЕТАТЕЛЬ ЛОМА'], ['TWO SPINNING SCRAPS AT ONCE', 'ZWEI WIRBELNDE SCHROTTTEILE AUF EINMAL', 'ДВА КРУТЯЩИХСЯ ОБЛОМКА СРАЗУ'], ['CLOWN HAT', 'CLOWNHUT', 'КЛОУНСКИЙ КОЛПАК'],
  ['SHROOMY', 'PILZIG', 'ГРИБОК'], ['MECHA DUCK', 'MECHA-ENTE', 'МЕХА-УТКА'], ['BINARY HALO', 'BINÄR-HEILIGENSCHEIN', 'ДВОИЧНЫЙ НИМБ'],
  ['I AM MECHA-QUACK. BUILT FROM EVERY ROBOT YOU EVER BROKE. MAGNA-BOT, PULL THEM APART!', 'ICH BIN MECHA-QUAK. GEBAUT AUS JEDEM ROBOTER, DEN IHR KAPUTT GEMACHT HABT. MAGNA-BOT, ZIEH SIE AUSEINANDER!', 'Я МЕХА-КРЯ. СОБРАН ИЗ ВСЕХ РОБОТОВ, КОТОРЫХ ВЫ СЛОМАЛИ. МАГНА-БОТ, РАЗБЕРИ ИХ!'],
  ['A ROBOT DUCK?! THAT IS SO NOT COOL! QUACK!', 'EINE ROBOTER-ENTE?! DAS IST ÜBERHAUPT NICHT COOL! QUAK!', 'РОБОТ-УТКА?! ЭТО СОВСЕМ НЕ КРУТО! КРЯ!'],
  ['HONK! IT RAN OFF TO THE OLD CIRCUS! I SAW A BIG TENT OVER THERE!', 'HONK! ES IST ZUM ALTEN ZIRKUS GERANNT! ICH HAB DA DRÜBEN EIN GROSSES ZELT GESEHEN!', 'ГА! ОН УБЕЖАЛ В СТАРЫЙ ЦИРК! Я ВИДЕЛ ТАМ БОЛЬШОЙ ШАТЁР!'],
  ['LADIES AND ROBOTS! TONIGHT: CLOWN-BOT JUGGLES DUCKS!', 'MEINE DAMEN UND ROBOTER! HEUTE ABEND: CLOWN-BOT JONGLIERT MIT ENTEN!', 'ДАМЫ И РОБОТЫ! СЕГОДНЯ: КЛОУН-БОТ ЖОНГЛИРУЕТ УТКАМИ!'],
  ['I DO NOT LIKE THIS CIRCUS AT ALL!', 'ICH MAG DIESEN ZIRKUS ÜBERHAUPT NICHT!', 'МНЕ СОВСЕМ НЕ НРАВИТСЯ ЭТОТ ЦИРК!'],
  ['IT FLEW INTO THAT GLOWING FOREST! THE MUSHROOMS ARE AS BIG AS HOUSES!', 'ES IST IN DEN LEUCHTENDEN WALD GEFLOGEN! DIE PILZE SIND SO GROSS WIE HÄUSER!', 'ОН УЛЕТЕЛ В СВЕТЯЩИЙСЯ ЛЕС! ГРИБЫ ТАМ РАЗМЕРОМ С ДОМ!'],
  ['SPORE-BOT WILL MAKE YOU SNEEZE UNTIL YOU GIVE UP. ACHOO.EXE.', 'SPOREN-BOT LÄSST EUCH NIESEN, BIS IHR AUFGEBT. HATSCHI.EXE.', 'СПОРО-БОТ ЗАСТАВИТ ВАС ЧИХАТЬ, ПОКА НЕ СДАДИТЕСЬ. АПЧХИ.EXE.'],
  ["DON'T BREATHE THE PURPLE STUFF! QUACK!", 'ATMET DAS LILA ZEUG NICHT EIN! QUAK!', 'НЕ ДЫШИТЕ ФИОЛЕТОВОЙ ШТУКОЙ! КРЯ!'],
  ['HONK! IT UPLOADED ITSELF INTO A COMPUTER! I CAN BEAM YOU IN AFTER IT!', 'HONK! ES HAT SICH IN EINEN COMPUTER GELADEN! ICH KANN EUCH HINTERHERBEAMEN!', 'ГА! ОН ЗАГРУЗИЛСЯ В КОМПЬЮТЕР! Я МОГУ ОТПРАВИТЬ ВАС ЗА НИМ!'],
  ['WHOA... EVERYTHING IS MADE OF LITTLE GREEN NUMBERS!', 'WOW... ALLES BESTEHT AUS KLEINEN GRÜNEN ZAHLEN!', 'ОГО... ВСЁ СДЕЛАНО ИЗ МАЛЕНЬКИХ ЗЕЛЁНЫХ ЦИФР!'],
  ['VIRUS.EXE, DELETE THESE DUCKS. DELETE. DELETE.', 'VIRUS.EXE, LÖSCH DIESE ENTEN. LÖSCHEN. LÖSCHEN.', 'ВИРУС.EXE, УДАЛИ ЭТИХ УТОК. УДАЛИТЬ. УДАЛИТЬ.'],
  ['FINE. COME TO MY FORTRESS. ONLY ONE DUCK LEAVES. THE BETTER DUCK.', 'GUT. KOMMT ZU MEINER FESTUNG. NUR EINE ENTE KOMMT RAUS. DIE BESSERE ENTE.', 'ЛАДНО. ПРИХОДИТЕ В МОЮ КРЕПОСТЬ. УЙДЁТ ТОЛЬКО ОДНА УТКА. ЛУЧШАЯ УТКА.'],
  ['I AM FASTER. I AM STRONGER. I NEVER NEED A NAP. I AM THE BETTER DUCK.', 'ICH BIN SCHNELLER. ICH BIN STÄRKER. ICH BRAUCHE NIE EIN NICKERCHEN. ICH BIN DIE BESSERE ENTE.', 'Я БЫСТРЕЕ. Я СИЛЬНЕЕ. МНЕ НЕ НУЖЕН СОН. Я ЛУЧШАЯ УТКА.'],
  ["BUT YOU DON'T HAVE FRIENDS!", 'ABER DU HAST KEINE FREUNDE!', 'НО У ТЕБЯ НЕТ ДРУЗЕЙ!'], ['AND FRIENDS ARE THE BEST POWER-UP! QUAAACK!', 'UND FREUNDE SIND DAS BESTE POWER-UP! QUAAAK!', 'А ДРУЗЬЯ - ЛУЧШЕЕ УСИЛЕНИЕ! КРЯЯЯ!'],
  ['PUDDLE POND IS FULL OF WATER AND FRIENDS AGAIN. EVERYBODY IS HAPPY...', 'DER PFÜTZENTEICH IST WIEDER VOLLER WASSER UND FREUNDE. ALLE SIND GLÜCKLICH...', 'ЛУЖИЧНЫЙ ПРУД СНОВА ПОЛОН ВОДЫ И ДРУЗЕЙ. ВСЕ СЧАСТЛИВЫ...'],
  ['...BUT IN THE OLD SCRAPYARD, ALL THE BROKEN ROBOTS START TO RATTLE.', '...ABER AUF DEM ALTEN SCHROTTPLATZ FANGEN ALLE KAPUTTEN ROBOTER AN ZU RASSELN.', '...НО НА СТАРОЙ СВАЛКЕ ВСЕ СЛОМАННЫЕ РОБОТЫ НАЧИНАЮТ ГРЕМЕТЬ.'],
  ['I AM MECHA-QUACK. BUILT FROM EVERY ROBOT YOU EVER BEAT. I AM THE BETTER DUCK.', 'ICH BIN MECHA-QUAK. GEBAUT AUS JEDEM ROBOTER, DEN IHR BESIEGT HABT. ICH BIN DIE BESSERE ENTE.', 'Я МЕХА-КРЯ. СОБРАН ИЗ ВСЕХ РОБОТОВ, КОТОРЫХ ВЫ ПОБЕДИЛИ. Я ЛУЧШАЯ УТКА.'],
  ['HONK! THAT IS NOT MY ROBOT! IT BUILT ITSELF! AND IT LOOKS LIKE YOU!', 'HONK! DAS IST NICHT MEIN ROBOTER! ER HAT SICH SELBST GEBAUT! UND ER SIEHT AUS WIE DU!', 'ГА! ЭТО НЕ МОЙ РОБОТ! ОН СОБРАЛ СЕБЯ САМ! И ОН ПОХОЖ НА ТЕБЯ!'],
  ['THERE IS ONLY ONE REAL DUCK HERE! AFTER IT! QUACK!', 'ES GIBT HIER NUR EINE ECHTE ENTE! HINTERHER! QUAK!', 'ЗДЕСЬ ТОЛЬКО ОДНА НАСТОЯЩАЯ УТКА! ЗА НИМ! КРЯ!'],
  ['CHAPTER 6', 'KAPITEL 6', 'ГЛАВА 6'], ['CHAPTER 6 - MECHA-QUACK', 'KAPITEL 6 - MECHA-QUAK', 'ГЛАВА 6 - МЕХА-КРЯ'],
  ['MECHA-QUACK SPARKS... WOBBLES... AND SITS DOWN WITH A CLANK.', 'MECHA-QUAK SPRÜHT FUNKEN... WACKELT... UND SETZT SICH MIT EINEM KLONK HIN.', 'МЕХА-КРЯ ИСКРИТ... ШАТАЕТСЯ... И С ЛЯЗГОМ САДИТСЯ.'],
  ['ERROR. ERROR. WHY DO YOU ALWAYS WIN? I AM FASTER. I AM STRONGER.', 'FEHLER. FEHLER. WARUM GEWINNT IHR IMMER? ICH BIN SCHNELLER. ICH BIN STÄRKER.', 'ОШИБКА. ОШИБКА. ПОЧЕМУ ВЫ ВСЕГДА ПОБЕЖДАЕТЕ? Я БЫСТРЕЕ. Я СИЛЬНЕЕ.'],
  ['BECAUSE WE ARE A TEAM! DO YOU WANT TO JOIN US?', 'WEIL WIR EIN TEAM SIND! WILLST DU MITMACHEN?', 'ПОТОМУ ЧТО МЫ КОМАНДА! ХОЧЕШЬ К НАМ?'],
  ['JOIN... TEAM... QUACK? ...QUACK! QUACK.EXE IS HAPPY!', 'MITMACHEN... TEAM... QUAK? ...QUAK! QUAK.EXE IST GLÜCKLICH!', 'В КОМАНДУ... КРЯ? ...КРЯ! КРЯ.EXE СЧАСТЛИВ!'],
  ['+3000 COINS REWARD!', '+3000 MÜNZEN BELOHNUNG!', 'НАГРАДА: +3000 МОНЕТ!'], ['CHAPTER 5 CLEAR!', 'KAPITEL 5 GESCHAFFT!', 'ГЛАВА 5 ПРОЙДЕНА!'], ['CHAPTER 6 IS UNLOCKED!', 'KAPITEL 6 IST FREI!', 'ГЛАВА 6 ОТКРЫТА!'],
]);
