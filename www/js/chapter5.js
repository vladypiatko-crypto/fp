'use strict';
/* QUACK ATTACK! — Chapter 5: SAVE THE POND!
 * One morning Puddle Pond is empty: the KRAKEN-BOT is pumping all the water in Duckland down to its undersea
 * factory. Dr. Honk builds snorkels and the ducks dive after it: a coral reef, a sunken ship, the kelp forest,
 * the dark abyss and finally the robot city of Atlantis.
 * Everything here plugs into the tables from art.js, data.js, story.js, the other chapters and lang.js. */

// ================================================================ worlds (all under water)
Object.assign(WORLD_THEME, {
  reef: { ground: ['#e9d9a8', '#d6c08a', '#f6ead0'], style: 'sand', edge: 'water', e1: '#1f6fa8', e2: '#4fa8e0', shore: '#f6ead0', shoreD: '#d6c08a', underwater: true,
    tint: { m: '#ff8c6b', M: '#a8432f', l: '#ffd1c4' }, deco: { coral: 4, shell: 2, starfish: 2, seaweed: 3 }, tall: { bigcoral: 4, seaweedtall: 2 }, sky: '#4fa8e0' },
  wreck: { ground: ['#6b4a2f', '#5c3f27', '#7d5a3a'], style: 'planks', edge: 'water', e1: '#123a5c', e2: '#235a85', shore: '#4a3220', shoreD: '#2f2014', underwater: true,
    tint: { m: '#8fa3b5', M: '#4a5a6b', l: '#d5e3ef' }, deco: { coinpile: 2, boltpile: 2, seaweed: 2 }, tall: { barrel: 3, crate: 2, treasure: 1, mast: 1 }, sky: '#123a5c' },
  kelp: { ground: ['#2f6b4a', '#245a3c', '#3f8a5a'], style: 'grass', edge: 'water', e1: '#164a5c', e2: '#2a6f85', shore: '#2a4a3a', shoreD: '#1c3628', underwater: true,
    tint: { m: '#9fe8c8', M: '#3f9f7a', l: '#e3fff4' }, deco: { seaweed: 5, shell: 1, rock: 2 }, tall: { seaweedtall: 5, bigcoral: 1 }, sky: '#164a5c' },
  abyss: { ground: ['#141a33', '#0e1226', '#1f2847'], style: 'abyss', edge: 'void', e1: '#05060f', e2: '#0e1226', shore: '#2a3a6b', shoreD: '#1a2547', underwater: true,
    tint: { m: '#5a6aa8', M: '#2a3466', l: '#9fb0e8' }, deco: { glowdot: 4, rock: 2 }, tall: { glowcoral: 4, stalagmite: 1 }, sky: '#05060f' },
  atlantis: { ground: ['#5d8a9a', '#4a7080', '#78a8b8'], style: 'stone', edge: 'water', e1: '#0f4a6b', e2: '#2a7aa8', shore: '#ffd23f', shoreD: '#b08a00', underwater: true,
    tint: { m: '#ffd23f', M: '#8f6a00', l: '#fff3b0' }, deco: { shell: 2, coral: 2, cog: 2 }, tall: { pillar: 3, bigcoral: 2 }, sky: '#0f4a6b' },
});
Object.assign(GROUND_STYLES, {
  planks(g, S, base, dark, light) { // a sunken ship's deck
    for (let y = 0; y < S; y += 8) {
      g.fillStyle = dark; g.fillRect(0, y, S, 1);
      for (let x = (y / 8 % 2) * 24; x < S; x += 48) { g.fillStyle = dark; g.fillRect(x, y, 1, 8); g.fillStyle = light; g.fillRect(x + 2, y + 2, 1, 1); }
    }
    for (let i = 0; i < 30; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(rint(0, S - 1), rint(0, S - 1), 2, 1); }
  },
  abyss(g, S, base, dark, light) { // dark sea floor with glowing specks
    for (let i = 0; i < 200; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
    for (let i = 0; i < 14; i++) { g.fillStyle = pick(['#7dfff5', '#5ec8ff', '#c9a6ff']); g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
  },
});
Object.assign(DECO_ART, {
  coral: spr(['p.p', 'ppp', '.p.'], { p: '#ff6f8f' }),
  seaweed: spr(['.g', 'g.', '.g', 'g.'], { g: '#3f9f6a' }, null),
  glowdot: spr(['c'], { c: '#7dfff5' }, null),
  bigcoral: spr(['p...p.p', 'pp.pp.p', '.ppp.pp', '..pppp.', '...pp..', '..pppp.'], { p: '#ff6f8f' }),
  seaweedtall: spr(['.g.', 'g..', '.g.', '..g', '.g.', 'g..', '.g.', '.gg'], { g: '#3f9f6a' }),
  glowcoral: spr(['c.c.c', 'cCcCc', '.ccc.', '..k..', '.kkk.'], { c: '#7dfff5', C: '#ffffff', k: '#2a3466' }),
  mast: spr(['..w..', 'wwwww', '..b..', '..b..', '..b..', '..b..', '.bbb.'], { w: '#d5dbe6', b: '#5c3416' }),
});
Object.assign(LANDMARKS, {
  reef(x, y) { drawSpr(DECO_ART.bigcoral, x - 5, y - 5); drawSpr(DECO_ART.seaweedtall, x + 9, y - 5); drawSpr(DECO_ART.starfish, x - 12, y + 3); },
  wreck(x, y) {
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(x - 14, y - 3); ctx.lineTo(x + 12, y - 8); ctx.lineTo(x + 10, y + 4); ctx.lineTo(x - 10, y + 5); ctx.fill();
    ctx.fillStyle = '#5c3f27'; ctx.beginPath(); ctx.moveTo(x - 13, y - 2); ctx.lineTo(x + 11, y - 7); ctx.lineTo(x + 9, y + 3); ctx.lineTo(x - 9, y + 4); ctx.fill();
    ctx.fillStyle = '#3f2a1a'; ctx.fillRect(x - 2, y - 20, 2, 15);
  },
  kelp(x, y) { drawSpr(DECO_ART.seaweedtall, x - 6, y - 5); drawSpr(DECO_ART.seaweedtall, x + 1, y - 7); drawSpr(DECO_ART.seaweedtall, x + 8, y - 4); },
  abyss(x, y, T) { pellipse(x, y + 2, 13, 5, '#05060f'); drawSpr(DECO_ART.glowcoral, x - 3, y - 3); if (Math.floor(T * 2) % 2) drawSpr(DECO_ART.glowdot, x + 8, y - 8); },
  atlantis(x, y, T) {
    pellipse(x, y - 4, 13, 10, 'rgba(126,203,255,0.35)'); pring(x, y - 4, 13, '#9fdcff', 1, 10);
    drawSpr(DECO_ART.pillar, x - 6, y - 3); drawSpr(DECO_ART.pillar, x + 6, y - 3);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 9, y - 11, 19, 2);
  },
});
// the blue water look over every under-water level: light rays, a blue tint and rising bubbles
function drawUnderwaterView(v, T) {
  ctx.fillStyle = 'rgba(30,110,190,0.16)'; ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  ctx.fillStyle = 'rgba(220,245,255,0.06)';
  for (let i = 0; i < 4; i++) {
    const x = v.x + ((i * 97 + T * 6) % (v.w + 60)) - 30;
    ctx.beginPath(); ctx.moveTo(x, v.y); ctx.lineTo(x + 16, v.y); ctx.lineTo(x + 46, v.y + v.h); ctx.lineTo(x + 24, v.y + v.h); ctx.fill();
  }
  for (let i = 0; i < 12; i++) {
    const k = (T * (0.12 + (i % 4) * 0.03) + i * 0.17) % 1, x = v.x + ((i * 53) % v.w) + Math.sin(T * 2 + i) * 4, y = v.y + v.h * (1 - k);
    pring(x, y, 1 + (i % 3), 'rgba(220,245,255,0.5)');
  }
  ctx.restore();
}

// ================================================================ bosses
Object.assign(ENEMY_ART, {
  puffer: [
    ['......s..s......', '...s.yyyyyy.s...', '..syyyyyyyyyys..', '.syyyKKyyyyyyys.', '.yyyKeKyyyyyyyy.', 'syyyyyyyyyyyyyyf', '.yyyyyywwwyyyyff',
      'syyyyyyyyyyyyyyf', '.yyyyyyyyyyyyyy.', '.syyyyyyyyyyyys.', '..s.yyyyyyyy.s..', '.....s..s.s.....'],
    ['......s..s......', '...s.yyyyyy.s...', '..syyyyyyyyyys..', '.syyyKKyyyyyyys.', '.yyyKeKyyyyyyyyf', 'syyyyyyyyyyyyyff', '.yyyyyywwwyyyyyf',
      'syyyyyyyyyyyyyff', '.yyyyyyyyyyyyyyf', '.syyyyyyyyyyyys.', '..s.yyyyyyyy.s..', '.....s..s.s.....'],
  ],
  anchor: [
    ['.....MMMM.....', '....MmmmmM....', '....MeEeEM....', '....MmmmmM....', '..MMMMMMMMMM..', '.....MmmM.....', '.....MmmM.....', '.....MmmM.....',
      '.....MmmM.....', 'M....MmmM....M', 'MM...MmmM...MM', '.MM..MmmM..MM.', '..MMMMmmMMMM..', '....MMMMMM....'],
    ['.....MMMM.....', '....MmmmmM....', '....MEeEeM....', '....MmmmmM....', '..MMMMMMMMMM..', '.....MmmM.....', '.....MmmM.....', '.....MmmM.....',
      '.....MmmM.....', 'M....MmmM....M', 'MM...MmmM...MM', '.MM..MmmM..MM.', '..MMMMmmMMMM..', '....MMMMMM....'],
  ],
  eel: [
    ['..............yy..', '.cccc......ccccyc.', 'cCCCCc....cCCCCeEc', 'cCCCCCc..cCCCCCCCc', '.cCCCCCccCCCCCCcc.', '..cCCCCCCCCCCcc...', '...ccCCCCCCcc.....', '.....cccccc.......'],
    ['..............yy..', '...........ccccyc.', '.cccc.....cCCCCeEc', 'cCCCCc...cCCCCCCCc', 'cCCCCCc.cCCCCCCcc.', '.cCCCCCcCCCCCcc...', '..ccCCCCCCCcc.....', '....cccccc........'],
  ],
  angler: [
    ['..........yy....', '.........y......', '........y.......', '...KKKKKKKK.....', '..KkkkkkkkkKK...', '.KkkkkkkeEkkkK..', 'KkkkkkkkkkkkkkK.', 'KkkwwwwwwwwkkkKf',
      'KkkwKwKwKwwkkkff', 'KkkkkkkkkkkkkkKf', '.KkkkkkkkkkkkK..', '..KKKKKKKKKKK...'],
    ['..........YY....', '.........y......', '........y.......', '...KKKKKKKK.....', '..KkkkkkkkkKK...', '.KkkkkkkeEkkkK..', 'KkkkkkkkkkkkkkKf', 'KkkwwwwwwwwkkkKf',
      'KkkwKwKwKwwkkkKf', 'KkkkkkkkkkkkkkK.', '.KkkkkkkkkkkkK..', '..KKKKKKKKKKK...'],
  ],
  kraken: [
    ['......pppppp......', '....pppppppppp....', '...pPpppppppPpp...', '..pppppppppppppp..', '..ppeEpppppeEppp..', '..pppppppppppppp..', '...pppmmmmmmppp...',
      '....pppppppppp....', '..pp.pp.pp.pp.pp..', '.pp..pp.pp.pp..pp.', 'pp..pp..pp..pp..pp', 'p...p...pp...p...p'],
    ['......pppppp......', '....pppppppppp....', '...pPpppppppPpp...', '..pppppppppppppp..', '..ppeEpppppeEppp..', '..pppppppppppppp..', '...pppmmmmmmppp...',
      '....pppppppppp....', '..pp.pp.pp.pp.pp..', '..pp.pp.pp.pp.pp..', '.pp.pp..pp..pp.pp.', 'pp..p....p...p..pp'],
  ],
});
Object.assign(ENEMY_PAL, {
  puffer: { y: '#ffd23f', s: '#ff8c1a', K: '#3d3a52', e: '#ffffff', w: '#e8343b', f: '#ff8c1a' },
  anchor: { M: '#3d3a52', m: '#8b8aa0', e: '#ff3b5c', E: '#fff3b0' },
  eel: { c: '#2f6b4a', C: '#5fbf8a', y: '#ffd23f', e: '#ffffff', E: '#3d3a52' },
  angler: { K: '#140b26', k: '#2f2a4a', y: '#7dfff5', Y: '#ffffff', e: '#7dfff5', E: '#ffffff', w: '#ffffff', f: '#2f2a4a' },
  kraken: { p: '#9d3f8f', P: '#d97ac9', e: '#ffd23f', E: '#3d3a52', m: '#5ec8ff' },
});
Object.assign(PROJ_ART, {
  spike: spr(['.o.', 'oyo', '.o.'], { o: '#ff8c1a', y: '#ffd23f' }),
  ink: spr(['.k.', 'kKk', '.k.'], { k: '#1b1325', K: '#4a2a6b' }),
  glow: spr(['.c.', 'cCc', '.c.'], { c: '#7dfff5', C: '#ffffff' }),
});
Object.assign(BOSSES, {
  puffer: { name: 'PUFFER-BOT', hp: 3300, spd: 30, dmg: 26, r: 15, sc: 2, attacks: ['ring', 'charge', 'summon', 'ring', 'volley'], summon: ['bolt', 'goo', 'drone'], col: '#ffd23f', bullet: 'spike' },
  anchor: { name: 'ANCHOR-BOT', hp: 3500, spd: 26, dmg: 28, r: 15, sc: 2, attacks: ['jump', 'charge', 'missiles', 'ring', 'jump'], summon: ['bolt', 'tank'], col: '#8b8aa0', bullet: 'pebble' },
  eel: { name: 'EEL-TRON', hp: 3400, spd: 36, dmg: 26, r: 14, sc: 2, attacks: ['spiral', 'charge', 'volley', 'summon', 'warp'], summon: ['spiderling', 'drone'], col: '#5fbf8a', bullet: 'zap' },
  angler: { name: 'ANGLER-BOT', hp: 3600, spd: 28, dmg: 28, r: 15, sc: 2, attacks: ['warp', 'breath', 'summon', 'spiral', 'warp'], summon: ['goo', 'spiderling', 'drone'], col: '#7dfff5', bullet: 'glow' },
  kraken: { name: 'KRAKEN-BOT', hp: 4800, spd: 26, dmg: 30, r: 17, sc: 2, attacks: ['ring', 'spiral', 'missiles', 'burrow', 'summon', 'breath', 'charge'],
    summon: ['bolt', 'goo', 'saw', 'drone', 'tank'], col: '#d97ac9', bullet: 'ink', final: true, rage: 'THE KRAKEN IS FURIOUS!', summonText: 'GLUB GLUB! ATTACK!' },
});
BOSS_ORDER.push('puffer', 'anchor', 'eel', 'angler', 'kraken');

// ================================================================ rewards (story only; the harpoon gun is also in chests)
Object.assign(SKIN_PAL, {
  mermaid: { h: '#4fbfa8', y: '#4fbfa8', d: '#2f8a7a', w: '#ff9ccb', o: '#ffd23f', f: '#ff9ccb', K: OUT, c: '#ff9ccb' },
  deepsea: { h: '#1f2847', y: '#1f2847', d: '#0e1226', w: '#7dfff5', o: '#7dfff5', f: '#5a6aa8', K: '#7dfff5', c: '#c9a6ff' },
});
SKIN_FX.deepsea = 'glow';
Object.assign(HAT_ART, {
  snorkel: hat({ rows: ['........y', '........y', 'kkkkkkk.y', 'kcccccckk'], x: 1, y: 3 }, { k: '#3d3a52', c: '#7ecbff', y: '#ffd23f' }),
});
HAT_MOTION.snorkel = { amp: 0.2, sp: 3 };
HALO_FX.glowfish = ({ x, y, sc, t, layer, rx, ry }) => { // little glowing fish swimming round
  for (let i = 0; i < 3; i++) {
    const a = t * 1.6 + i * TAU / 3, front = Math.sin(a) > 0;
    if ((layer === 'front') !== front) continue;
    const px = Math.round(x + Math.cos(a) * (rx + 2 * sc)), py = Math.round(y + 3 * sc + Math.sin(a) * (ry + 1.5 * sc)), dir = Math.cos(a + Math.PI / 2) > 0 ? 1 : -1;
    ctx.fillStyle = '#7dfff5'; ctx.fillRect(px - sc, py, sc * 3, sc * 2); ctx.fillRect(px - 2 * sc * dir, py - (Math.floor(t * 8) % 2 ? sc : 0), sc, sc * 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(px + sc * dir, py, Math.max(1, sc / 2), Math.max(1, sc / 2));
  }
};
COSMETICS.skin.push({ id: 'mermaid', name: 'MERMAID', rarity: 'epic', story: 23 }, { id: 'deepsea', name: 'DEEP SEA', rarity: 'legendary', story: 25 });
COSMETICS.hat.push({ id: 'snorkel', name: 'SNORKEL', rarity: 'rare', story: 21 });
COSMETICS.halo.push({ id: 'glowfish', name: 'GLOW FISH', rarity: 'epic', story: 24 });

// ================================================================ levels 21-25
LEVELS.push(
  { n: 21, name: 'CORAL REEF', world: 'reef', time: 140, diff: 7, boss: 'puffer', reward: 'snorkel', rewardCat: 'hat',
    pool: { bolt: 8, goo: 3, drone: 3, saw: 3, spiderling: 2 },
    intro: [['kraken', 'GLUB GLUB! WHO DARES TO SWIM IN MY SEA? PUFFER-BOT, POP THEM!'], ['duck', 'BLUB... I MEAN, QUACK! LET\'S GO!']],
    outro: [['daisy', 'THE WATER PIPES GO DEEPER... TO THAT OLD SHIPWRECK!']] },
  { n: 22, name: 'SUNKEN SHIP', world: 'wreck', time: 140, diff: 7.1, boss: 'anchor', reward: 'harpoon',
    pool: { bolt: 8, boom: 3, tank: 2, saw: 3, drone: 2 },
    intro: [['kraken', 'MY ANCHOR-BOT WILL DROP ON YOUR HEADS! GLUB!'], ['honk', 'HONK! (THROUGH THE SNORKEL RADIO) THERE IS A HARPOON GUN ON THAT SHIP!']],
    outro: [['honk', 'HONK! THE PUMPS ARE HIDDEN IN THE KELP FOREST! FOLLOW THE BUBBLES!']] },
  { n: 23, name: 'KELP FOREST', world: 'kelp', time: 145, diff: 7.2, boss: 'eel', reward: 'mermaid', rewardCat: 'skin',
    pool: { bolt: 7, spiderling: 3, goo: 3, drone: 3, saw: 3 },
    intro: [['kraken', 'EEL-TRON IS FULL OF ELECTRICITY! ZZZT, GLUB!'], ['daisy', 'DON\'T TOUCH THE WIGGLY ONE!']],
    outro: [['daisy', 'IT\'S GETTING DARK DOWN HERE... I SEE A LITTLE LIGHT!']] },
  { n: 24, name: 'THE ABYSS', world: 'abyss', time: 145, diff: 7.3, boss: 'angler', reward: 'glowfish', rewardCat: 'halo',
    pool: { bolt: 7, drone: 3, saw: 3, spiderling: 3, tank: 2 },
    intro: [['duck', 'A FRIENDLY LITTLE LIGHT! HELLO, LIGHT!'], ['kraken', 'GLUB HA HA! THAT IS ANGLER-BOT! IT LOVES DUCKS... FOR DINNER!']],
    outro: [['kraken', 'ENOUGH! COME DOWN TO ATLANTIS AND FACE THE KRAKEN-BOT! GLUB!']] },
  { n: 25, name: 'ATLANTIS', world: 'atlantis', time: 150, diff: 7.5, boss: 'kraken', reward: 'deepsea', rewardCat: 'skin',
    pool: { bolt: 8, goo: 3, drone: 3, saw: 3, tank: 2, spiderling: 2 },
    intro: [['kraken', 'ALL THE WATER IN DUCKLAND RUNS MY FACTORY! YOU CAN\'T STOP THE TIDE!'], ['daisy', 'WATCH US! GIVE US BACK OUR POND!'], ['duck', 'QUAAACK! DIVE IN!']],
    outro: [] },
);
CHAPTERS.push({ n: 5, from: 21, to: 25, title: 'CHAPTER 5 - SAVE THE POND!', sea: 'reef', isle: ['#d6c08a', '#f6ead0'], intro: 'intro5', ending: 'ending5' });
ENDING_PAY.ending5 = 2500;

// ================================================================ the Kraken in dialog boxes
SPEAKERS.kraken = { name: 'KRAKEN-BOT', col: '#d97ac9' };
VOICES.kraken = 90;
PORTRAITS.kraken = (x, y, t, bob) => drawSprX(enemySprite('kraken', Math.floor(t * 3) % 2, null), x + 15, y + 34 - bob, { sc: 2, ay: 1 });

// ================================================================ music
Object.assign(SONGS, {
  ocean: {
    bpm: 112, lead: 'triangle', drums: 'light',
    bass: [43, 0, 50, 0, 55, 0, 50, 0, 40, 0, 47, 0, 52, 0, 47, 0, 36, 0, 43, 0, 48, 0, 43, 0, 38, 0, 45, 0, 50, 0, 42, 0],
    mel: [74, 0, 0, 0, 79, 0, 0, 0, 78, 0, 76, 0, 74, 0, 0, 0, 71, 0, 0, 0, 76, 0, 0, 0, 74, 0, 72, 0, 71, 0, 0, 0,
      72, 0, 0, 0, 76, 0, 0, 0, 79, 0, 0, 0, 76, 0, 74, 0, 74, 0, 0, 0, 78, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0],
  },
  deep: {
    bpm: 100, lead: 'sawtooth', drums: 'light',
    bass: [33, 0, 0, 33, 40, 0, 0, 0, 31, 0, 0, 31, 38, 0, 0, 0, 29, 0, 0, 29, 36, 0, 0, 0, 28, 0, 0, 28, 35, 0, 32, 0],
    mel: [69, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 71, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0,
      65, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 0, 67, 0, 0, 0, 64, 0, 0, 0, 68, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0],
  },
});

// ================================================================ cutscene props
function drawDryPond(T, water) { // Puddle Pond with only some (or all) of its water
  const gy = drawPondScene(T);
  pellipse(W * 0.82, gy + 30, 46, 14, OUT); pellipse(W * 0.82, gy + 30, 45, 13, '#8f6a3a'); pellipse(W * 0.82 - 4, gy + 28, 32, 7, '#a07a4a');
  if (water > 0) { pellipse(W * 0.82, gy + 30, 45 * water, 13 * water, '#2f6fb3'); pellipse(W * 0.82 - 6 * water, gy + 27, 30 * water, 6 * water, '#4f95d8'); }
  return gy;
}
function drawTentacle(x, y, len, T, col = '#9d3f8f') {
  for (let i = 0; i < 10; i++) {
    const k = i / 9, wx = x + Math.sin(T * 3 + k * 4) * 8 * k, wy = y - k * len;
    pcirc(wx, wy, 6 - k * 4, col);
    if (i % 2 === 0) pcirc(wx + 2, wy, 1.5 - k, '#d97ac9');
  }
}
let reefPat = null;
function drawUnderSea(T) {
  ctx.fillStyle = '#1f6fa8'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(220,245,255,0.07)'; const x = (i * 90 + T * 8) % (W + 60) - 30; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + 60, H); ctx.lineTo(x + 30, H); ctx.fill(); }
  const gy = Math.floor(H * 0.6);
  if (!reefPat) reefPat = ctx.createPattern(groundTile('reef'), 'repeat');
  ctx.fillStyle = reefPat; ctx.fillRect(0, gy, W, H - gy);
  drawSpr(DECO_ART.bigcoral, W * 0.08, gy); drawSpr(DECO_ART.seaweedtall, W * 0.94, gy - 2); drawSpr(DECO_ART.bigcoral, W * 0.9, gy + 6);
  for (let i = 0; i < 10; i++) { const k = (T * 0.15 + i * 0.13) % 1; pring((i * 61) % W, H * (1 - k), 1 + (i % 3), 'rgba(220,245,255,0.5)'); }
  return gy;
}

// ---------------------------------------------------------------- chapter 5 intro: the pond runs dry
const INTRO5_BEATS = [
  { dur: 3, say: ['narr', 'PUDDLE POND, ONE SUNNY MORNING... WAIT. WHERE DID ALL THE WATER GO?!'],
    enter() { Music.play('title'); },
    draw(cs, t, T) {
      const gy = drawDryPond(T, Math.max(0, 0.4 - t * 0.15));
      const k = Ease.outCubic(Math.min(1, t / 2.6));
      drawHeroes(cs, lerp(-30, W * 0.3, k), gy + 38, T, k < 1, 'right', t > 2 ? '?' : '');
      drawDaisy(W * 0.5, gy + 36, { t: T });
    } },
  { dur: 2.8, say: ['daisy', 'OUR POND IS EMPTY! SOMETHING IS SUCKING IT AWAY!'],
    enter() { sfx.quack(1.3); },
    draw(cs, t, T) {
      const gy = drawDryPond(T, 0);
      drawTentacle(W * 0.82, gy + 34, 30 + Math.sin(T * 2) * 4, T);
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!', true);
      drawDaisy(W * 0.5, gy + 36 - Math.abs(Math.sin(T * 10)) * 2, { t: T });
    } },
  { dur: 3.2, say: ['kraken', 'GLUB GLUB! I AM THE KRAKEN-BOT! I NEED ALL THE WATER IN DUCKLAND FOR MY UNDERSEA FACTORY!'],
    enter(cs) { Music.play('boss'); sfx.bossIntro(); cs.shake = 3; },
    draw(cs, t, T) {
      const gy = drawDryPond(T, 0);
      ctx.fillStyle = 'rgba(20,10,40,0.35)'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) drawTentacle(W * (0.74 + i * 0.08), gy + 36, 40 + i * 8 + Math.sin(T * 2 + i) * 6, T + i);
      drawSprX(enemySprite('kraken', Math.floor(T * 3) % 2, null), W * 0.82, gy + 26 - Math.min(1, t) * 14, { sc: 1.5, ay: 1 });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!!', true);
      drawDaisy(W * 0.5, gy + 36, { t: T, blink: true });
    } },
  { dur: 2.6, say: ['narr', 'AND WITH A HUGE GLUB, IT DIVES DOWN A HOLE IN THE POND...'],
    enter(cs) { sfx.warp(); cs.shake = 3; },
    draw(cs, t, T) {
      const gy = drawDryPond(T, 0);
      const k = Ease.inCubic(Math.min(1, t / 1.6));
      drawSprX(enemySprite('kraken', 0, null), W * 0.82, gy + 26 + k * 20, { sc: 1.5 * (1 - k * 0.8), ay: 1, alpha: 1 - k });
      pellipse(W * 0.82, gy + 30, 10, 4, OUT);
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '?');
      drawDaisy(W * 0.5, gy + 36, { t: T });
    } },
  { dur: 3, say: ['honk', 'HONK! I MADE SNORKELS FOR EVERYONE! GO DOWN THAT HOLE AND BRING OUR POND BACK!'],
    enter() { Music.play('ocean'); sfx.honk(1.2); },
    draw(cs, t, T) {
      const gy = drawDryPond(T, 0);
      drawHonk(W * 0.66, gy + 40 - Math.abs(Math.sin(T * 6)) * 2, true, 2, T);
      for (let i = 0; i < 3; i++) drawSprX(HAT_ART.snorkel.front.spr, W * 0.6 - i * 12, gy + 20 - Math.abs(Math.sin(T * 5 + i)) * 4, { sc: 1 });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right');
      drawDaisy(W * 0.5, gy + 36, { t: T, hat: 'snorkel' });
    } },
  { dur: 2.6, say: ['duck', 'DUCKS LOVE WATER! DIVE, DIVE, DIVE! QUACK!'],
    enter(cs) { sfx.quack(); cs.burst(W * 0.3, H * 0.75, ['#5ec8ff', '#ffffff'], 18, 70); },
    draw(cs, t, T) {
      const gy = drawUnderSea(T);
      drawHeroes(cs, W * 0.3, gy + 30 - Math.sin(T * 2) * 4, T, true, 'right', '', false, true);
      drawDaisy(W * 0.46, gy + 28 - Math.sin(T * 2 + 1) * 4, { t: T, hat: 'snorkel' });
    } },
  { dur: 2.4,
    enter(cs) { sfx.title(); cs.shake = 4; },
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.5));
      drawZoomText('CHAPTER 5', W / 2, H * 0.38, lerp(9, 3, k), C.gold);
      if (t > 0.5) text('SAVE THE POND!', W / 2, H * 0.58, C.white, 1, 1);
      drawHeroes(cs, W / 2 - 6, H * 0.85, T, true, 'right', '', false, true);
    } },
];

// ---------------------------------------------------------------- chapter 5 ending: the water comes home
const ENDING5_BEATS = [
  { dur: 2.6, say: ['narr', "THE KRAKEN-BOT'S PUMPS BREAK WITH ONE ENORMOUS GLUB!"],
    enter(cs) { cs.shake = 6; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawUnderSea(T);
      drawSprX(enemySprite('kraken', Math.floor(T * 10) % 2, null), W * 0.66, gy + 34, { sc: 2, ay: 1, white: (T * 6 | 0) % 2 === 0 && t < 1 });
      if (Math.random() < 0.5) cs.burst(W * 0.66 + rand(-16, 16), gy + rand(-6, 24), ['#ffffff', '#9fdcff'], 2, 30, 1.2, -40);
      drawHeroes(cs, W * 0.24, gy + 36, T, false, 'right');
      drawDaisy(W * 0.38, gy + 34, { t: T, hat: 'snorkel', facing: 'right' });
    } },
  { dur: 3, say: ['kraken', 'GLUB... I ONLY WANTED A BIGGER BATHTUB...'],
    draw(cs, t, T) {
      const gy = drawUnderSea(T);
      drawSprX(enemySprite('kraken', 0, null), W * 0.66, gy + 34, { sc: 1.5, ay: 1 });
      if ((T * 2 | 0) % 2) { ctx.fillStyle = '#5ec8ff'; ctx.fillRect(Math.round(W * 0.66) - 6, gy + 8 + ((T * 20) % 8), 2, 3); }
      drawHeroes(cs, W * 0.24, gy + 36, T, false, 'right', '?');
      drawDaisy(W * 0.38, gy + 34, { t: T, hat: 'snorkel', facing: 'right' });
    } },
  { dur: 3, say: ['narr', 'ALL THE WATER RUSHES BACK UP TO PUDDLE POND!'],
    enter() { sfx.warp(); sfx.revive(); Music.play('title'); },
    draw(cs, t, T) {
      const gy = drawDryPond(T, Math.min(1, t / 2.4));
      if (t < 2.4) for (let i = 0; i < 6; i++) { const k = ((t * 1.5 + i / 6) % 1); pcirc(W * 0.82 + Math.sin(i * 2) * 20, gy + 30 - k * 60, 3, 'rgba(126,203,255,0.7)'); }
      drawHeroes(cs, W * 0.3, gy + 38, T, true, 'right');
      drawDaisy(W * 0.5, gy + 36, { t: T });
    } },
  { dur: 3.2, say: ['daisy', 'OUR POND IS BACK! AND LOOK... NOW IT EVEN HAS A FOUNTAIN!'],
    enter() { sfx.win(); },
    draw(cs, t, T) {
      const gy = drawDryPond(T, 1);
      drawSprX(enemySprite('kraken', Math.floor(T * 3) % 2, null), W * 0.82, gy + 30, { sc: 0.75, ay: 1 });
      for (let i = 0; i < 8; i++) { const k = ((T * 1.2 + i / 8) % 1), a = -Math.PI / 2 + (i - 3.5) * 0.15; pcirc(W * 0.82 + Math.cos(a) * k * 30, gy + 18 + Math.sin(a) * k * 34 + k * k * 30, 1.5, '#9fdcff'); }
      drawHonk(W * 0.64, gy + 40 - Math.abs(Math.sin(T * 7)) * 3, true, 2, T);
      drawHeroes(cs, W * 0.3, gy + 38, T, true, 'right');
      drawDaisy(W * 0.46, gy + 36 - Math.abs(Math.sin(T * 7)) * 3, { t: T, frame: Math.floor(T * 7) % 2 });
    } },
  { dur: 4,
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      if (Math.random() < 0.1) cs.burst(rand(0, W), rand(0, H * 0.5), RAINBOW, 20, 50, 1.2, 30);
      const k = Ease.outBack(Math.min(1, t / 0.6));
      drawZoomText('THE END', W / 2, H * 0.3, lerp(10, 4, k), C.gold);
      if (t > 0.6) text('THANKS FOR PLAYING QUACK ATTACK!', W / 2, H * 0.5, C.white, 1, 1);
      if (t > 1.0 && cs.paid) { const lw = textW('+2500 COINS REWARD!'); coinIcon(Math.floor(W / 2 - lw / 2 - 6), Math.floor(H * 0.6), T); text('+2500 COINS REWARD!', W / 2 + 4, H * 0.6 + 1, C.gold, 1, 1); }
      drawHeroes(cs, W / 2 - 40, H * 0.88, T, true, 'down');
      drawDaisy(W / 2 + 4, H * 0.88 - Math.abs(Math.sin(T * 7)) * 3, { t: T });
      drawHonk(W / 2 + 34, H * 0.88 + 2 - Math.abs(Math.sin(T * 7 + 1)) * 3, false, 2, T);
      drawSprX(enemySprite('kraken', Math.floor(T * 3) % 2, null), W / 2 + 60, H * 0.88 - Math.abs(Math.sin(T * 7 + 2)) * 3, { sc: 0.6, ay: 1 });
    } },
];
Object.assign(CUTSCENES, { intro5: INTRO5_BEATS, ending5: ENDING5_BEATS });

// ================================================================ translations for chapter 5
addPhrases([
  ['CORAL REEF', 'KORALLENRIFF', 'КОРАЛЛОВЫЙ РИФ'], ['SUNKEN SHIP', 'GESUNKENES SCHIFF', 'ЗАТОНУВШИЙ КОРАБЛЬ'], ['KELP FOREST', 'TANGWALD', 'ЛЕС ВОДОРОСЛЕЙ'], ['THE ABYSS', 'DIE TIEFSEE', 'БЕЗДНА'], ['ATLANTIS', 'ATLANTIS', 'АТЛАНТИДА'],
  ['PUFFER-BOT', 'KUGELFISCH-BOT', 'ФУГУ-БОТ'], ['ANCHOR-BOT', 'ANKER-BOT', 'ЯКОРЬ-БОТ'], ['EEL-TRON', 'AAL-TRON', 'УГОРЬ-ТРОН'], ['ANGLER-BOT', 'ANGLER-BOT', 'УДИЛЬЩИК-БОТ'], ['KRAKEN-BOT', 'KRAKEN-BOT', 'КРАКЕН-БОТ'],
  ['MERMAID', 'MEERJUNGFRAU', 'РУСАЛКА'], ['DEEP SEA', 'TIEFSEE', 'ГЛУБИНА'], ['SNORKEL', 'SCHNORCHEL', 'ТРУБКА'], ['GLOW FISH', 'LEUCHTFISCHE', 'СВЕТЯЩИЕСЯ РЫБКИ'],
  ['THE KRAKEN IS FURIOUS!', 'DER KRAKE IST WÜTEND!', 'КРАКЕН В ЯРОСТИ!'], ['GLUB GLUB! ATTACK!', 'BLUBB BLUBB! ANGRIFF!', 'БУЛЬ-БУЛЬ! В АТАКУ!'],
  ['GLUB GLUB! WHO DARES TO SWIM IN MY SEA? PUFFER-BOT, POP THEM!', 'BLUBB BLUBB! WER WAGT ES, IN MEINEM MEER ZU SCHWIMMEN? KUGELFISCH-BOT, MACH SIE PLATT!', 'БУЛЬ-БУЛЬ! КТО ПОСМЕЛ ПЛАВАТЬ В МОЁМ МОРЕ? ФУГУ-БОТ, ЛОПНИ ИХ!'],
  ["BLUB... I MEAN, QUACK! LET'S GO!", "BLUBB... ICH MEINE, QUAK! LOS GEHT'S!", 'БУЛЬ... ТО ЕСТЬ, КРЯ! ВПЕРЁД!'],
  ['THE WATER PIPES GO DEEPER... TO THAT OLD SHIPWRECK!', 'DIE WASSERROHRE FÜHREN TIEFER... ZU DEM ALTEN SCHIFFSWRACK!', 'ТРУБЫ ИДУТ ГЛУБЖЕ... К СТАРОМУ ЗАТОНУВШЕМУ КОРАБЛЮ!'],
  ['MY ANCHOR-BOT WILL DROP ON YOUR HEADS! GLUB!', 'MEIN ANKER-BOT FÄLLT EUCH AUF DEN KOPF! BLUBB!', 'МОЙ ЯКОРЬ-БОТ УПАДЁТ ВАМ НА ГОЛОВЫ! БУЛЬ!'],
  ['HONK! (THROUGH THE SNORKEL RADIO) THERE IS A HARPOON GUN ON THAT SHIP!', 'HONK! (ÜBER DAS SCHNORCHELFUNKGERÄT) AUF DEM SCHIFF IST EINE HARPUNE!', 'ГА! (ПО РАДИО В ТРУБКЕ) НА ЭТОМ КОРАБЛЕ ЕСТЬ ГАРПУН!'],
  ['HONK! THE PUMPS ARE HIDDEN IN THE KELP FOREST! FOLLOW THE BUBBLES!', 'HONK! DIE PUMPEN SIND IM TANGWALD VERSTECKT! FOLGT DEN BLASEN!', 'ГА! НАСОСЫ СПРЯТАНЫ В ЛЕСУ ВОДОРОСЛЕЙ! ПЛЫВИТЕ ЗА ПУЗЫРЯМИ!'],
  ['EEL-TRON IS FULL OF ELECTRICITY! ZZZT, GLUB!', 'AAL-TRON STECKT VOLLER STROM! ZZZT, BLUBB!', 'УГОРЬ-ТРОН ПОЛОН ЭЛЕКТРИЧЕСТВА! ЖЖЖ, БУЛЬ!'],
  ["DON'T TOUCH THE WIGGLY ONE!", 'FASST DEN WACKELIGEN NICHT AN!', 'НЕ ТРОГАЙТЕ ЭТОГО ИЗВИВАЮЩЕГОСЯ!'],
  ["IT'S GETTING DARK DOWN HERE... I SEE A LITTLE LIGHT!", 'HIER UNTEN WIRD ES DUNKEL... ICH SEHE EIN KLEINES LICHT!', 'ЗДЕСЬ СТАНОВИТСЯ ТЕМНО... Я ВИЖУ ОГОНЁК!'],
  ['A FRIENDLY LITTLE LIGHT! HELLO, LIGHT!', 'EIN FREUNDLICHES KLEINES LICHT! HALLO, LICHT!', 'ДРУЖЕЛЮБНЫЙ ОГОНЁК! ПРИВЕТ, ОГОНЁК!'],
  ['GLUB HA HA! THAT IS ANGLER-BOT! IT LOVES DUCKS... FOR DINNER!', 'BLUBB HA HA! DAS IST ANGLER-BOT! ER LIEBT ENTEN... ZUM ABENDESSEN!', 'БУЛЬ-ХА-ХА! ЭТО УДИЛЬЩИК-БОТ! ОН ОБОЖАЕТ УТОК... НА УЖИН!'],
  ['ENOUGH! COME DOWN TO ATLANTIS AND FACE THE KRAKEN-BOT! GLUB!', 'GENUG! KOMMT NACH ATLANTIS UND STELLT EUCH DEM KRAKEN-BOT! BLUBB!', 'ХВАТИТ! СПУСКАЙТЕСЬ В АТЛАНТИДУ И СРАЗИТЕСЬ С КРАКЕН-БОТОМ! БУЛЬ!'],
  ["ALL THE WATER IN DUCKLAND RUNS MY FACTORY! YOU CAN'T STOP THE TIDE!", 'ALLES WASSER IN ENTENLAND TREIBT MEINE FABRIK AN! IHR KÖNNT DIE FLUT NICHT AUFHALTEN!', 'ВСЯ ВОДА УТИНОЙ СТРАНЫ КРУТИТ МОЮ ФАБРИКУ! ПРИЛИВ НЕ ОСТАНОВИТЬ!'],
  ['WATCH US! GIVE US BACK OUR POND!', 'PASS AUF! GIB UNS UNSEREN TEICH ZURÜCK!', 'СМОТРИ! ВЕРНИ НАШ ПРУД!'], ['QUAAACK! DIVE IN!', 'QUAAAK! RUNTER!', 'КРЯЯЯ! НЫРЯЕМ!'],
  ['PUDDLE POND, ONE SUNNY MORNING... WAIT. WHERE DID ALL THE WATER GO?!', 'PFÜTZENTEICH, AN EINEM SONNIGEN MORGEN... MOMENT. WO IST DAS GANZE WASSER?!', 'ЛУЖИЧНЫЙ ПРУД, СОЛНЕЧНОЕ УТРО... СТОП. КУДА ДЕЛАСЬ ВСЯ ВОДА?!'],
  ['OUR POND IS EMPTY! SOMETHING IS SUCKING IT AWAY!', 'UNSER TEICH IST LEER! IRGENDWAS SAUGT IHN WEG!', 'НАШ ПРУД ПУСТ! ЧТО-ТО ВЫСАСЫВАЕТ ВОДУ!'],
  ['GLUB GLUB! I AM THE KRAKEN-BOT! I NEED ALL THE WATER IN DUCKLAND FOR MY UNDERSEA FACTORY!', 'BLUBB BLUBB! ICH BIN DER KRAKEN-BOT! ICH BRAUCHE ALLES WASSER IN ENTENLAND FÜR MEINE UNTERWASSERFABRIK!', 'БУЛЬ-БУЛЬ! Я КРАКЕН-БОТ! МНЕ НУЖНА ВСЯ ВОДА УТИНОЙ СТРАНЫ ДЛЯ МОЕЙ ПОДВОДНОЙ ФАБРИКИ!'],
  ['AND WITH A HUGE GLUB, IT DIVES DOWN A HOLE IN THE POND...', 'UND MIT EINEM RIESIGEN BLUBB TAUCHT ER IN EIN LOCH IM TEICH...', 'И С ОГРОМНЫМ БУЛЬ ОН НЫРЯЕТ В ДЫРУ В ПРУДУ...'],
  ['HONK! I MADE SNORKELS FOR EVERYONE! GO DOWN THAT HOLE AND BRING OUR POND BACK!', 'HONK! ICH HABE FÜR ALLE SCHNORCHEL GEBAUT! RUNTER IN DAS LOCH UND HOLT UNSEREN TEICH ZURÜCK!', 'ГА! Я СДЕЛАЛ ВСЕМ ТРУБКИ! НЫРЯЙТЕ В ДЫРУ И ВЕРНИТЕ НАШ ПРУД!'],
  ['DUCKS LOVE WATER! DIVE, DIVE, DIVE! QUACK!', 'ENTEN LIEBEN WASSER! TAUCHEN, TAUCHEN, TAUCHEN! QUAK!', 'УТКИ ЛЮБЯТ ВОДУ! НЫРЯЕМ, НЫРЯЕМ! КРЯ!'],
  ['CHAPTER 5', 'KAPITEL 5', 'ГЛАВА 5'], ['SAVE THE POND!', 'RETTE DEN TEICH!', 'СПАСИ ПРУД!'], ['CHAPTER 5 - SAVE THE POND!', 'KAPITEL 5 - RETTE DEN TEICH!', 'ГЛАВА 5 - СПАСИ ПРУД!'],
  ["THE KRAKEN-BOT'S PUMPS BREAK WITH ONE ENORMOUS GLUB!", 'DIE PUMPEN DES KRAKEN-BOTS PLATZEN MIT EINEM RIESIGEN BLUBB!', 'НАСОСЫ КРАКЕН-БОТА ЛОМАЮТСЯ С ОГРОМНЫМ БУЛЬ!'],
  ['GLUB... I ONLY WANTED A BIGGER BATHTUB...', 'BLUBB... ICH WOLLTE DOCH NUR EINE GRÖSSERE BADEWANNE...', 'БУЛЬ... Я ПРОСТО ХОТЕЛ ВАННУ ПОБОЛЬШЕ...'],
  ['ALL THE WATER RUSHES BACK UP TO PUDDLE POND!', 'DAS GANZE WASSER RAUSCHT ZURÜCK IN DEN PFÜTZENTEICH!', 'ВСЯ ВОДА МЧИТСЯ ОБРАТНО В ЛУЖИЧНЫЙ ПРУД!'],
  ['OUR POND IS BACK! AND LOOK... NOW IT EVEN HAS A FOUNTAIN!', 'UNSER TEICH IST ZURÜCK! UND SCHAUT... JETZT HAT ER SOGAR EINEN SPRINGBRUNNEN!', 'НАШ ПРУД ВЕРНУЛСЯ! И СМОТРИТЕ... ТЕПЕРЬ У НЕГО ЕСТЬ ФОНТАН!'],
  ['+2500 COINS REWARD!', '+2500 MÜNZEN BELOHNUNG!', 'НАГРАДА: +2500 МОНЕТ!'], ['CHAPTER 4 CLEAR!', 'KAPITEL 4 GESCHAFFT!', 'ГЛАВА 4 ПРОЙДЕНА!'], ['CHAPTER 5 IS UNLOCKED!', 'KAPITEL 5 IST FREI!', 'ГЛАВА 5 ОТКРЫТА!'],
]);
