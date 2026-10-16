'use strict';
/* QUACK ATTACK! — Chapter 3: THE ROBOT REBELLION.
 * A month after the party, Dr. Honk runs the bakery at Puddle Pond. But his old robots never got the memo:
 * they built themselves a new boss out of all the scrap the ducks left behind, KING CLANK. He kidnaps Honk
 * (and his bread), and wants to turn the whole world into one big factory. The ducks chase him across a
 * volcano, the desert, a candy factory and the crystal caves, up to Clank Castle.
 * Everything here plugs into the tables from art.js, data.js, story.js, chapter2.js and lang.js. */

// ================================================================ worlds
Object.assign(WORLD_THEME, {
  volcano: { ground: ['#3b3036', '#2a2228', '#55454c'], style: 'rock', edge: 'lava', e1: '#e8343b', e2: '#ff8c1a', shore: '#2a2228', shoreD: '#1b1418',
    tint: { m: '#c97b4a', M: '#6b2f1a', l: '#f2b48a' }, deco: { ember: 4, rock: 3, magmarock: 3 }, tall: { spire: 4, lavapot: 1 }, sky: '#3a1f2a' },
  desert: { ground: ['#e8b878', '#cf9a5a', '#f6d29a'], style: 'sand', edge: 'quicksand', e1: '#c98a4a', e2: '#e0a86a', shore: '#f6d29a', shoreD: '#cf9a5a',
    tint: { m: '#d9a066', M: '#8f5a2a', l: '#f6d29a' }, deco: { skull: 1, tumble: 2, rock: 3, cactusS: 3 }, tall: { cactus: 4, pyramid: 1 }, sky: '#ffd29a' },
  candy: { ground: ['#ffd1e6', '#ffb3d9', '#fff0f8'], style: 'candy', edge: 'water', e1: '#5c3416', e2: '#8f5a3a', shore: '#fff0f8', shoreD: '#ffb3d9',
    tint: { m: '#9fe8c8', M: '#3f9f7a', l: '#ffffff' }, deco: { sweet: 4, gumdrop: 3, sprinkle: 3 }, tall: { lollipop: 4, candycane: 3 }, sky: '#ffd1e6' },
  crystal: { ground: ['#2a3a5c', '#1f2c48', '#3f5580'], style: 'ice', edge: 'void', e1: '#0c0a1a', e2: '#1d2a45', shore: '#5ec8ff', shoreD: '#2f7fe0',
    tint: { m: '#9fe8ff', M: '#3f86b8', l: '#e3f4ff' }, deco: { shard: 4, crystal: 3, rock: 2 }, tall: { bigcrystal: 4, stalagmite: 2 }, sky: '#0c0a1a' },
  castle: { ground: ['#5d5868', '#4a4655', '#76717f'], style: 'stone', edge: 'lava', e1: '#e8343b', e2: '#ff8c1a', shore: '#3b3848', shoreD: '#2b2438',
    tint: { m: '#ffd23f', M: '#8f6a00', l: '#fff3b0' }, deco: { boltpile: 3, hazard: 2, cog: 3 }, tall: { pillar: 3, torch: 3, crate: 1 }, sky: '#1b1325' },
});
Object.assign(GROUND_STYLES, {
  // dark rock with glowing cracks
  rock(g, S, base, dark, light) {
    for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
    for (let i = 0; i < 5; i++) {
      let x = rint(0, S), y = rint(0, S);
      for (let k = 0; k < 9; k++) { g.fillStyle = k % 3 ? '#ff6b1a' : '#ffd23f'; g.fillRect(x, y, 1, 1); x += rint(-1, 1); y += 1; }
    }
  },
  // pink frosting with rainbow sprinkles
  candy(g, S, base, dark, light) {
    for (let i = 0; i < 12; i++) { const x = rint(0, S), y = rint(0, S), r = rint(5, 10); g.fillStyle = light; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = dark; g.fillRect(x - r + 2, y + r - 1, r * 2 - 4, 1); }
    for (let i = 0; i < 40; i++) { g.fillStyle = pick(RAINBOW); g.fillRect(rint(0, S - 2), rint(0, S - 1), Math.random() < 0.5 ? 2 : 1, Math.random() < 0.5 ? 1 : 2); }
  },
  // blue ice tiles with shiny streaks
  ice(g, S, base, dark, light) {
    for (let y = 0; y < S; y += 24) for (let x = 0; x < S; x += 24) { g.fillStyle = (x + y) % 48 ? base : dark; g.fillRect(x, y, 24, 24); g.fillStyle = light; g.fillRect(x, y, 24, 1); }
    for (let i = 0; i < 9; i++) { const x = rint(0, S - 8), y = rint(0, S - 8); g.fillStyle = 'rgba(227,244,255,0.5)'; for (let k = 0; k < 5; k++) g.fillRect(x + k, y + 5 - k, 1, 1); }
    for (let i = 0; i < 10; i++) { g.fillStyle = '#e3f4ff'; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
  },
  // castle bricks
  stone(g, S, base, dark, light) {
    for (let y = 0, row = 0; y < S; y += 8, row++) for (let x = (row % 2) * 8 - 8; x < S; x += 16) {
      g.fillStyle = Math.random() < 0.2 ? light : base; g.fillRect(x + 1, y + 1, 15, 7);
      g.fillStyle = dark; g.fillRect(x, y, 16, 1); g.fillRect(x, y, 1, 8);
    }
    for (let i = 0; i < 20; i++) { g.fillStyle = dark; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
  },
});
Object.assign(DECO_ART, {
  ember: spr(['.o.', 'oyo', '.o.'], { o: '#ff6b1a', y: '#ffd23f' }, null),
  magmarock: spr(['.kk.', 'kokk', 'kkok'], { k: '#2a2228', o: '#ff6b1a' }),
  skull: spr(['.www.', 'wkwkw', '.www.'], { w: '#fff3dc', k: '#3d3a52' }),
  tumble: spr(['.b.b.', 'b.b.b', '.b.b.'], { b: '#a0642d' }, null),
  cactusS: spr(['.g.', 'ggg', '.g.'], { g: '#3f9f4a' }),
  sweet: spr(['p.p', '.w.', 'p.p'], { p: '#ff6fae', w: '#ffffff' }, null),
  gumdrop: spr(['.g.', 'ggg', 'ggg'], { g: '#7ee04a' }),
  sprinkle: spr(['r.', '.b'], { r: '#e8343b', b: '#5ec8ff' }, null),
  shard: spr(['.c', 'cC', 'c.'], { c: '#5ec8ff', C: '#e3f4ff' }),
  cog: spr(['.m.m.', 'mmmmm', '.m.m.', 'mmmmm', '.m.m.'], { m: '#8b8aa0' }),
  // tall
  spire: spr(['...k...', '..kkk..', '..kok..', '.kkkkk.', '.kkokk.', 'kkkkkkk', 'kkokkkk'], { k: '#2a2228', o: '#ff6b1a' }),
  lavapot: spr(['.oyyo.', 'kooook', 'kkkkkk', '.kkkk.'], { k: '#2a2228', o: '#ff6b1a', y: '#ffd23f' }),
  cactus: spr(['..g...', '..g..g', 'g.g..g', 'g.gggg', 'gggg..', '..g...', '..g...', '..g...'], { g: '#3f9f4a' }),
  pyramid: spr(['....y....', '...yYy...', '..yYyyy..', '.yYyyyyy.', 'yYyyyyyyy'], { y: '#e0a86a', Y: '#f6d29a' }),
  lollipop: spr(['.ppp.', 'pwpwp', 'ppwpp', '.ppp.', '..w..', '..w..', '..w..', '..w..'], { p: '#ff6fae', w: '#ffffff' }),
  candycane: spr(['.rwr', 'w..w', 'r...', 'w...', 'r...', 'w...', 'r...'], { r: '#e8343b', w: '#ffffff' }),
  bigcrystal: spr(['..c...', '.cCc.c', '.cCccC', 'ccCccc', 'cCcccc', 'cccccc'], { c: '#5ec8ff', C: '#e3f4ff' }),
  stalagmite: spr(['..k..', '..k..', '.kkk.', '.kkk.', 'kkkkk'], { k: '#3f5580' }),
  pillar: spr(['mmmmm', '.mlm.', '.mlm.', '.mlm.', '.mlm.', '.mlm.', 'mmmmm'], { m: '#4a4655', l: '#76717f' }),
  torch: spr(['.o.', 'oyo', '.o.', '.k.', '.k.', '.k.', 'kkk'], { o: '#ff6b1a', y: '#ffd23f', k: '#3b3848' }),
});
Object.assign(LANDMARKS, {
  volcano(x, y, T, on) {
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(x - 16, y + 5); ctx.lineTo(x - 5, y - 14); ctx.lineTo(x + 5, y - 14); ctx.lineTo(x + 16, y + 5); ctx.fill();
    ctx.fillStyle = '#55454c'; ctx.beginPath(); ctx.moveTo(x - 14, y + 4); ctx.lineTo(x - 4, y - 12); ctx.lineTo(x + 4, y - 12); ctx.lineTo(x + 14, y + 4); ctx.fill();
    ctx.fillStyle = '#ff6b1a'; ctx.fillRect(x - 4, y - 12, 8, 2); ctx.fillRect(x - 1, y - 10, 2, 6);
    if (on) for (let i = 0; i < 3; i++) pcirc(x + Math.sin(T * 2 + i) * 2, y - 16 - ((T * 8 + i * 6) % 18), 2 + i * 0.5, 'rgba(120,100,110,0.6)');
  },
  desert(x, y) { drawSpr(DECO_ART.pyramid, x - 3, y - 3); drawSpr(DECO_ART.cactus, x + 11, y - 3); drawSpr(DECO_ART.skull, x - 12, y + 3); },
  candy(x, y, T) { drawSpr(DECO_ART.lollipop, x - 5, y - 5 + Math.round(Math.sin(T * 2))); drawSpr(DECO_ART.candycane, x + 8, y - 3); drawSpr(DECO_ART.gumdrop, x - 12, y + 3); },
  crystal(x, y) { drawSpr(DECO_ART.bigcrystal, x - 4, y - 3); drawSpr(DECO_ART.bigcrystal, x + 7, y - 1); drawSpr(DECO_ART.shard, x - 12, y + 3); },
  castle(x, y, T, on) {
    panel(x - 13, y - 10, 26, 16, '#4a4655', OUT, '#76717f', false);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#4a4655'; ctx.fillRect(x - 13 + i * 7, y - 13, 5, 3); }
    panel(x - 4, y - 22, 8, 12, '#5d5868', OUT, null, false);
    ctx.fillStyle = OUT; ctx.fillRect(x - 3, y - 2, 6, 8);
    ctx.fillStyle = on && (T * 2 | 0) % 2 ? '#ffd23f' : '#e8343b'; ctx.fillRect(x + 4, y - 28, 6, 4); ctx.fillStyle = '#8b8aa0'; ctx.fillRect(x + 3, y - 28, 1, 7);
  },
});

// ================================================================ new robots: a turret and a twitchy little spider
Object.assign(ENEMIES, {
  turret: { name: 'TURRET BOT', hp: 22, spd: 0, dmg: 8, r: 5, xp: 3, ai: 'turret', fx: 'metal', heavy: 0.05 },
  spiderling: { name: 'SPIDER BOT', hp: 8, spd: 58, dmg: 6, r: 3, xp: 1, ai: 'skitter', fx: 'metal' },
});
Object.assign(ENEMY_ART, {
  turret: [
    ['...a...', '..MMM..', '.MmmmM.', 'MmeEemM', 'MmmmmmM', '.MMMMM.', 'MM...MM'],
    ['...E...', '..MMM..', '.MmmmM.', 'MmeEemM', 'MmmmmmM', '.MMMMM.', 'MM...MM'],
  ],
  spiderling: [
    ['M.....M', '.MmmmM.', 'MmeEemM', '.MmmmM.', 'M.M.M.M'],
    ['.M...M.', 'MMmmmMM', '.meEem.', 'MMmmmMM', '.M.M.M.'],
  ],
});
ENDLESS_POOL_STEPS.push([170, 'turret', 2], [200, 'spiderling', 3]);

// ================================================================ bosses
const CLANK_ROWS = [
  '...a..a..a..a.....', '...aaaaaaaaaa.....', '..MMMMMMMMMMMM....', '..MmmmmmmmmmmM....', '..MmEEmmmmEEmM....', '..MmeemmmmeemM....',
  '..MmmmmMMmmmmM....', '..MmmwwwwwwmmM....', '.MMMMMMMMMMMMMM...', 'MmmMmlmmmmmmMmmM..', 'MmmMmmmrrmmmMmmM..', 'MmmMmmmrrmmmMmmM..', '.MM.MmmmmmmmM.MM..',
];
Object.assign(ENEMY_ART, {
  golem: [
    ['....RRRRRRRR....', '...RrrrrrrrrR...', '..RrrKKrrKKrrR..', '..RrrKeKrKeKrR..', '..RrrrrrrrrrrR..', '...RroooooorR...', '.RRRrrrrrrrrRRR.',
      'RrrRrLrrrrLrRrrR', 'RrrRrrLrrLrrRrrR', 'RrrRrrrLLrrrRrrR', '.RR.RrrrrrrrR.RR', '....RrrRRrrR....', '....RrR..RrR....', '...RRR....RRR...'],
    ['....RRRRRRRR....', '...RrrrrrrrrR...', '..RrrKKrrKKrrR..', '..RrrKeKrKeKrR..', '..RrrrrrrrrrrR..', '...RroooooorR...', '.RRRrrrrrrrrRRR.',
      'RrrRrLrrrrLrRrrR', 'RrrRrrLrrLrrRrrR', 'RrrRrrrLLrrrRrrR', '.RR.RrrrrrrrR.RR', '....RrrRRrrR....', '...RrR....RrR...', '..RRR......RRR..'],
  ],
  worm: [
    ['.......SSSS.......', '......SsSsSS......', '.....SSSSSSSS.....', '....mmmmmmmmmm....', '...mMMmmmmmmMMm...', '..mmmeEmmmmeEmmm..', '..mmmmmmmmmmmmmm..',
      '..mmtwtwtwtwtwmm..', '..mmmmmmmmmmmmmm..', '...mMmmMmmMmmMm...', '....mmmmmmmmmm....', '..dddddddddddddd..', '.dDddDddDddDddDdd.', 'dddddddddddddddddd'],
    ['.......SSSS.......', '......sSsSsS......', '.....SSSSSSSS.....', '....mmmmmmmmmm....', '...mMMmmmmmmMMm...', '..mmmeEmmmmeEmmm..', '..mmmmmmmmmmmmmm..',
      '..mmwtwtwtwtwtmm..', '..mmmmmmmmmmmmmm..', '...mMmmMmmMmmMm...', '....mmmmmmmmmm....', '..dddddddddddddd..', '.ddDddDddDddDddDd.', 'dddddddddddddddddd'],
  ],
  gummy: [
    ['......y.y.y.....', '......yyyyy.....', '....gggggggg....', '...gGggggggggg..', '..gGggggggggggg.', '.ggggKKggggKKgg.', '.ggggKeggggKegg.',
      'gggggggggggggggg', 'ggggggpppppggggg', 'gggggggggggggggg', 'gGgggggggggggggg', '.gggggggggggggg.', '..gggggggggggg..'],
    ['................', '......y.y.y.....', '......yyyyy.....', '...ggggggggggg..', '..gGgggggggggggg', '.ggggKKggggKKggg', '.ggggKeggggKeggg',
      'gggggggggggggggg', 'ggggggpppppggggg', 'gggggggggggggggg', 'gGgggggggggggggg', 'gggggggggggggggg', '.gggggggggggggg.'],
  ],
  spider: [
    ['..c....cccc....c..', '...c..cCCCCc..c...', '....ccCCCCCCcc....', 'cc..cCCeCCeCCc..cc', '..cccCCCCCCCCccc..', '....cCCCCCCCCc....',
      '..cc.cCCCCCCc.cc..', '.c...ccCCCCcc...c.', 'c.....cccccc.....c', '.....c......c.....'],
    ['.c.....cccc.....c.', '..c...cCCCCc...c..', '...cccCCCCCCccc...', '.c..cCCeCCeCCc..c.', 'c.cccCCCCCCCCccc.c', '....cCCCCCCCCc....',
      '...ccCCCCCCCCcc...', '..c..ccCCCCcc..c..', '.c....cccccc....c.', '......c....c......'],
  ],
  clank: [
    CLANK_ROWS.concat(['....MmmMMmmM......', '....MmM..MmM......', '...MMM....MMM.....']),
    CLANK_ROWS.concat(['....MmmMMmmM......', '...MmM....MmM.....', '..MMM......MMM....']),
  ],
});
Object.assign(ENEMY_PAL, {
  golem: { R: '#3b2a2a', r: '#6b4a3a', K: '#1b1325', e: '#ffd23f', o: '#ff8c1a', L: '#ff6b1a' },
  worm: { S: '#d5dbe6', s: '#8b8aa0', m: '#c98a4a', M: '#8f5a2a', e: '#ff3b5c', E: '#fff3b0', t: '#ffffff', w: '#3d3a52', d: '#e0bf7a', D: '#c9a26b' },
  gummy: { g: '#ff6fae', G: '#ffd1e6', y: '#ffd23f', K: '#3d3a52', e: '#ffffff', p: '#c0306e' },
  spider: { c: '#3f86b8', C: '#9fe8ff', e: '#ff3b5c' },
  clank: { a: '#ffd23f', M: '#3d3a52', m: '#8b8aa0', l: '#d5dbe6', E: '#ffd23f', e: '#e8343b', w: '#ffffff', r: '#e8343b' },
});
Object.assign(PROJ_ART, {
  ember: spr(['.o.', 'oyo', '.o.'], { o: '#ff6b1a', y: '#ffd23f' }),
  pebble: spr(['dd', 'dD'], { d: '#c98a4a', D: '#8f5a2a' }),
  gumdrop: spr(['.p.', 'ppp'], { p: '#ff6fae' }),
  crystalshot: spr(['.c.', 'cCc', '.c.'], { c: '#5ec8ff', C: '#ffffff' }),
  cogshot: spr(['m.m', '.y.', 'm.m'], { m: '#8b8aa0', y: '#ffd23f' }),
});
Object.assign(BOSSES, {
  golem: { name: 'LAVA GOLEM', hp: 3000, spd: 22, dmg: 24, r: 16, sc: 2, attacks: ['jump', 'missiles', 'ring', 'summon'], summon: ['bolt', 'boom', 'turret'], col: '#ff6b1a', bullet: 'ember', heavy: 0.02 },
  worm: { name: 'DUNE DRILLER', hp: 3000, spd: 30, dmg: 26, r: 15, sc: 2, attacks: ['burrow', 'volley', 'burrow', 'summon', 'ring'], summon: ['bolt', 'spiderling'], col: '#c98a4a', bullet: 'pebble' },
  gummy: { name: 'GUMMY KING', hp: 3400, spd: 26, dmg: 26, r: 15, sc: 2, attacks: ['jump', 'spiral', 'summon', 'charge'], summon: ['goo', 'minigoo', 'goo'], col: '#ff6fae', bullet: 'gumdrop', fx: 'goo' },
  spider: { name: 'CRYSTAL QUEEN', hp: 3500, spd: 34, dmg: 26, r: 15, sc: 2, attacks: ['spiral', 'charge', 'summon', 'volley'], summon: ['spiderling', 'spiderling', 'drone'], col: '#9fe8ff', bullet: 'crystalshot' },
  clank: { name: 'KING CLANK', hp: 4400, spd: 26, dmg: 30, r: 17, sc: 2, attacks: ['ring', 'spiral', 'missiles', 'charge', 'summon', 'volley', 'jump'],
    summon: ['bolt', 'tank', 'saw', 'turret', 'spiderling'], col: '#ffd23f', bullet: 'cogshot', final: true, rage: 'KING CLANK GOES BERSERK!', summonText: 'CLANK! ROBOTS, ATTACK!' },
});
BOSS_ORDER.push('golem', 'worm', 'gummy', 'spider', 'clank');

// ================================================================ rewards: chapter 3 cosmetics (story only) and the saw blade (also in chests)
Object.assign(SKIN_PAL, {
  gummy: { h: '#ff6fae', y: '#ff6fae', d: '#d94a8a', w: '#ffd1e6', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#ff9ccb' },
  clanky: { h: '#9aa3b5', y: '#9aa3b5', d: '#5d6577', w: '#d5dbe6', o: '#ffd23f', f: '#5d6577', K: OUT, c: '#5ec8ff' },
});
SKIN_FX.clanky = 'glow';
Object.assign(HAT_ART, {
  firehelm: hat({ rows: ['....oo....', '...oyyo...', '..rrrrrr..', '.rRrrrrRr.', 'rrrrrrrrrr'], x: 1, y: 1 }, { o: '#ff6b1a', y: '#ffd23f', r: '#e8343b', R: '#ff8c8c' }),
  crystalcrown: hat({ rows: ['c..c..c', 'cC.c.Cc', 'cCcCcCc', 'ccccccc'], x: 2, y: 1 }, { c: '#5ec8ff', C: '#e3f4ff' }, { fx: 'shine' }),
});
COSMETICS.skin.push({ id: 'gummy', name: 'GUMMY', rarity: 'epic', story: 13 }, { id: 'clanky', name: 'CLANKY', rarity: 'legendary', story: 15 });
COSMETICS.hat.push({ id: 'firehelm', name: 'FIRE HELMET', rarity: 'rare', story: 11 }, { id: 'crystalcrown', name: 'CRYSTAL CROWN', rarity: 'legendary', story: 14 });

// ================================================================ levels 11-15
LEVELS.push(
  { n: 11, name: 'LAVA FIELDS', world: 'volcano', time: 135, diff: 6.3, boss: 'golem', reward: 'firehelm', rewardCat: 'hat',
    pool: { bolt: 7, boom: 5, tank: 3, turret: 2, saw: 3 },
    intro: [['clank', 'MY LAVA GOLEM GUARDS THE VOLCANO! TURN BACK, LITTLE DUCKS!'], ['daisy', 'LA LA! WE ARE NOT SCARED OF A HOT ROCK!']],
    outro: [['honk', 'HONK! HELP! THEY ARE CARRYING ME INTO THE DESERT!']] },
  { n: 12, name: 'DUSTY DUNES', world: 'desert', time: 135, diff: 6.5, boss: 'worm', reward: 'sawblade',
    pool: { bolt: 6, spiderling: 5, boom: 3, drone: 3, turret: 2 },
    intro: [['clank', 'THE DUNE DRILLER LIVES UNDER THE SAND. YOU WILL NEVER SEE IT COMING!'], ['duck', 'WATCH THE SAND... IF IT MOVES, SHOOT IT! QUACK!']],
    outro: [['daisy', 'LOOK, BREAD CRUMBS! HONK LEFT US A TRAIL!']] },
  { n: 13, name: 'CANDY FACTORY', world: 'candy', time: 140, diff: 6.7, boss: 'gummy', reward: 'gummy', rewardCat: 'skin',
    pool: { goo: 6, bolt: 5, spiderling: 4, drone: 3, saw: 2 },
    intro: [['clank', 'I TURNED THE SWEET SHOP INTO A FACTORY! THE GUMMY KING IS MY BEST WORKER!'], ['duck', 'MMM, CANDY... NO! FOCUS! QUACK!']],
    outro: [['honk', 'HONK! I CAN HEAR YOU! THEY PUT ME IN THE CRYSTAL CAVES! HURRY!']] },
  { n: 14, name: 'CRYSTAL CAVES', world: 'crystal', time: 140, diff: 6.9, boss: 'spider', reward: 'crystalcrown', rewardCat: 'hat',
    pool: { spiderling: 7, bolt: 3, drone: 4, turret: 2, tank: 2, saw: 3 },
    intro: [['clank', 'MY CRYSTAL QUEEN SPINS WEBS OF LASERS. NOBODY ESCAPES!'], ['daisy', 'THEN WE WILL JUST CUT THROUGH THEM!']],
    outro: [['clank', 'ENOUGH! COME TO MY CASTLE AND FACE THE KING! CLANK!']] },
  { n: 15, name: 'CLANK CASTLE', world: 'castle', time: 150, diff: 7.2, boss: 'clank', reward: 'clanky', rewardCat: 'skin',
    pool: { bolt: 7, tank: 3, saw: 3, turret: 2, spiderling: 4, drone: 3, boom: 3 },
    intro: [['clank', 'I AM BUILT FROM EVERY ROBOT YOU EVER BEAT! I AM UNBEATABLE!'], ['honk', 'HONK! HIT HIM IN THE GEARS!'], ['duck', 'QUAAACK! FOR THE BAKERY!']],
    outro: [] },
);
CHAPTERS.push({ n: 3, from: 11, to: 15, title: 'CHAPTER 3 - SAVE DR. HONK!', sea: 'volcano', isle: ['#2a2228', '#55454c'], intro: 'intro3', ending: 'ending3' });
ENDING_PAY.ending3 = 1500;

// ================================================================ King Clank in dialog boxes
SPEAKERS.clank = { name: 'KING CLANK', col: '#ffd23f' };
VOICES.clank = 120;
PORTRAITS.clank = (x, y, t, bob) => drawSprX(enemySprite('clank', 0, null), x + 16, y + 38 - bob, { sc: 2, ay: 1 });

// ================================================================ cutscene props
function drawClank(x, y, t, walking = false, sc = 2, alpha = 1) {
  drawSprX(enemySprite('clank', walking ? Math.floor(t * 4) % 2 : 0, null), x, y - (walking ? Math.abs(Math.sin(t * 8)) * 2 : 0), { sc, ay: 1, alpha });
}
function drawBakery(x, gy, T) {
  // a little stall with a striped awning and bread on the counter
  panel(x - 22, gy + 8, 44, 18, '#a0642d', OUT, '#c98a4a', false);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff8e7' : '#e8343b'; ctx.fillRect(x - 24 + i * 8, gy - 6, 8, 6); }
  ctx.fillStyle = OUT; ctx.fillRect(x - 24, gy, 48, 1);
  ctx.fillStyle = '#5c3416'; ctx.fillRect(x - 22, gy, 2, 9); ctx.fillRect(x + 20, gy, 2, 9);
  for (let i = 0; i < 3; i++) drawSpr(ART.bread, x - 12 + i * 10, gy + 7);
  text('BAKERY', x, gy - 14, '#ffd23f', 1, 1, 'outline');
}
let castlePat = null;
function drawCastleScene(T) {
  ctx.fillStyle = '#1b1325'; ctx.fillRect(0, 0, W, H);
  const gy = Math.floor(H * 0.58);
  for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#2b2438' : '#251f33'; ctx.fillRect(i * W / 7, 0, W / 7 + 1, gy); }
  for (let i = 0; i < 4; i++) { const x = W * (0.12 + i * 0.25); drawSpr(DECO_ART.torch, x, gy * 0.55); pcirc(x, gy * 0.55 - 4, 6 + Math.sin(T * 9 + i), 'rgba(255,140,26,0.18)'); }
  if (!castlePat) castlePat = ctx.createPattern(groundTile('castle'), 'repeat');
  ctx.fillStyle = castlePat; ctx.fillRect(0, gy, W, H - gy);
  return gy;
}

// ---------------------------------------------------------------- chapter 3 intro: King Clank takes Dr. Honk
const INTRO3_BEATS = [
  { dur: 3, say: ['narr', 'A MONTH LATER, DR. HONK OPENED A BAKERY AT PUDDLE POND...'],
    enter() { Music.play('title'); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawBakery(W * 0.6, gy, T);
      drawHonk(W * 0.6 + 2, gy + 10, true, 1, T);
      const k = Ease.outCubic(Math.min(1, t / 2.6));
      drawHeroes(cs, lerp(-30, W * 0.3, k), gy + 38, T, k < 1, 'right');
    } },
  { dur: 2.8, say: ['honk', 'HONK! FRESH BREAD FOR EVERYONE! NO ROBOTS, JUST BUNS!'],
    enter() { sfx.honk(1.3); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawBakery(W * 0.6, gy, T);
      drawHonk(W * 0.6 + 2, gy + 10, true, 1, T * 2);
      for (let i = 0; i < 3; i++) { const k = (T * 0.8 + i / 3) % 1; drawSprX(ART.bread, lerp(W * 0.6, W * 0.33, k), gy + 10 - Math.sin(k * Math.PI) * 30, { rot: k * 9 }); }
      drawDaisy(W * 0.45, gy + 36, { t: T });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right');
    } },
  { dur: 2.4, say: ['narr', '...CLANK. CLANK. CLANK.'],
    enter(cs) { cs.shake = 2; sfx.clank(); },
    tick(cs, t, dt) { if (Math.floor(t / 0.7) !== Math.floor((t - dt) / 0.7)) { cs.shake = 3; sfx.clank(); sfx.boom(); } },
    draw(cs, t, T) {
      const gy = drawPondScene(T, Math.min(0.45, t * 0.3));
      drawBakery(W * 0.6, gy, T);
      drawHonk(W * 0.6 + 2, gy + 10, true, 1, 0);
      drawDaisy(W * 0.45, gy + 36, { t: T });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', t > 0.8 ? '?' : '');
    } },
  { dur: 3, say: ['clank', 'THE OLD BOSS WENT SOFT. NOW I, KING CLANK, RULE THE ROBOTS!'],
    enter() { Music.play('boss'); sfx.bossIntro(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.45);
      drawBakery(W * 0.6, gy, T);
      const k = Ease.outCubic(Math.min(1, t / 1.8));
      drawClank(lerp(W + 40, W * 0.82, k), gy + 44, T, k < 1);
      drawHonk(W * 0.6 + 2, gy + 10, true, 1, 0);
      drawDaisy(W * 0.45, gy + 36, { t: T, blink: true });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!', true);
    } },
  { dur: 2.6, say: ['honk', 'HONK?! HE IS BUILT FROM ALL MY OLD SCRAP!'],
    enter() { sfx.honk(0.9); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.45);
      drawBakery(W * 0.6, gy, T);
      drawClank(W * 0.82, gy + 44, T);
      drawHonk(W * 0.6 + 2, gy + 10 - Math.abs(Math.sin(T * 14)) * 2, false, 1, 0);
      drawDaisy(W * 0.45, gy + 36, { t: T });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!', true);
    } },
  { dur: 3.2, say: ['clank', 'NO MORE BREAD! THE WHOLE WORLD WILL BE ONE BIG FACTORY! AND YOU COME WITH ME, HONK!'],
    enter(cs) { cs.shake = 3; sfx.warn(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.45);
      drawBakery(W * 0.6, gy, T);
      const k = Ease.inOutSine(Math.min(1, t / 1.2)), out = Ease.inCubic(clamp((t - 1.6) / 1.4, 0, 1));
      const cx = W * 0.82 + out * W * 0.4;
      drawClank(cx, gy + 44, T, out > 0);
      drawClaw(lerp(cx - 14, W * 0.62, k * (1 - out) + out * 0), gy - 30, lerp(gy - 10, gy - 4, k), k < 0.9);
      const hx = out > 0 ? cx - 14 : lerp(W * 0.6 + 2, W * 0.62, k), hy = out > 0 ? gy - 2 : gy + 10 - k * 6;
      drawHonk(hx, hy, false, 1, T * 3);
      drawDaisy(W * 0.45, gy + 36, { t: T });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '!!', true);
    } },
  { dur: 2.6, say: ['daisy', 'THEY TOOK OUR BAKER! DUCKS, AFTER THEM!'],
    enter(cs) { Music.play('battle'); sfx.quack(1.4); cs.burst(W * 0.32, H * 0.75, ['#ffd23f', '#fff8e7'], 16, 70); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.2);
      drawBakery(W * 0.6, gy, T);
      drawDaisy(W * 0.45, gy + 36 - Math.abs(Math.sin(T * 6)) * 3, { t: T, frame: Math.floor(T * 6) % 2 });
      drawHeroes(cs, W * 0.3, gy + 38, T, false, 'right', '', false, true);
    } },
  { dur: 2.4,
    enter(cs) { sfx.title(); cs.shake = 4; },
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.5));
      drawZoomText('CHAPTER 3', W / 2, H * 0.38, lerp(9, 3, k), C.gold);
      if (t > 0.5) text('SAVE DR. HONK!', W / 2, H * 0.58, C.white, 1, 1);
      drawHeroes(cs, W / 2 - 6, H * 0.85, T, true, 'right', '', false, true);
    } },
];

// ---------------------------------------------------------------- chapter 3 ending: robots learn to bake
const ENDING3_BEATS = [
  { dur: 2.6, say: ['narr', 'KING CLANK CRASHES DOWN IN A HEAP OF BOLTS!'],
    enter(cs) { cs.shake = 6; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawCastleScene(T);
      drawSprX(enemySprite('clank', 0, null), W * 0.66, gy + 40, { sc: 2, ay: 1, white: (T * 6 | 0) % 2 === 0 && t < 1, rot: Math.min(0.5, t * 0.3) });
      if (Math.random() < 0.4) cs.burst(W * 0.66 + rand(-18, 18), gy + rand(-6, 24), ['#8b8aa0', '#ffd23f', '#3d3a52'], 1, 20, 1.2, -25);
      drawCage(W * 0.88, gy + 40);
      drawHonk(W * 0.88, gy + 36, true, 1, 0);
      drawHeroes(cs, W * 0.26, gy + 44, T, false, 'right');
    } },
  { dur: 2.8, say: ['narr', 'OUT POP DOZENS OF TINY BOLT BOTS...'],
    enter() { sfx.pop(); },
    draw(cs, t, T) {
      const gy = drawCastleScene(T);
      for (let i = 0; i < 9; i++) {
        const ap = t - i * 0.15; if (ap <= 0) continue;
        const x = W * 0.66 + Math.cos(i * 2.4) * (10 + ap * 14), y = gy + 34 + Math.sin(i * 1.7) * 8;
        drawSprX(enemySprite('bolt', Math.floor(T * 8 + i) % 2, null), x, y - Math.abs(Math.sin(T * 7 + i)) * 4, { ay: 1, flip: i % 2 === 0 });
      }
      drawCage(W * 0.88, gy + 40);
      drawHonk(W * 0.88, gy + 36, true, 1, 0);
      drawHeroes(cs, W * 0.26, gy + 44, T, false, 'right', '?');
    } },
  { dur: 3, say: ['clank', '...BEEP? WE JUST WANTED SOMEBODY TO TELL US WHAT TO DO.'],
    draw(cs, t, T) {
      const gy = drawCastleScene(T);
      for (let i = 0; i < 9; i++) drawSprX(enemySprite('bolt', 0, null), W * 0.56 + (i % 5) * 12, gy + 30 + Math.floor(i / 5) * 12, { ay: 1, flip: true });
      drawCage(W * 0.88, gy + 40);
      drawHonk(W * 0.88, gy + 36, true, 1, 0);
      drawHeroes(cs, W * 0.26, gy + 44, T, false, 'right');
    } },
  { dur: 3, say: ['honk', 'HONK! THEN COME HELP AT MY BAKERY! I NEED LOTS OF HANDS... OR CLAWS!'],
    enter(cs) { sfx.revive(); cs.burst(W * 0.88, H * 0.5, ['#ffd23f', '#fff8e7'], 14, 60); },
    draw(cs, t, T) {
      const gy = drawCastleScene(T);
      for (let i = 0; i < 9; i++) drawSprX(enemySprite('bolt', Math.floor(T * 8 + i) % 2, null), W * 0.56 + (i % 5) * 12, gy + 30 + Math.floor(i / 5) * 12 - Math.abs(Math.sin(T * 9 + i)) * 3, { ay: 1, flip: true });
      drawCage(W * 0.88, gy + 40, Math.min(60, t * 50));
      drawHonk(W * 0.86, gy + 42 - Math.abs(Math.sin(T * 8)) * 3, true, 2, T);
      drawHeroes(cs, W * 0.26, gy + 44, T, true, 'right');
    } },
  { dur: 3.4, say: ['narr', 'AND SO THE ROBOTS LEARNED TO BAKE BREAD. THE BEST BREAD IN DUCKLAND.'],
    enter() { sfx.win(); Music.play('title'); },
    draw(cs, t, T) {
      drawSky('#2a1b45', '#ff8c6b', T, false);
      const gy = Math.floor(H * 0.6);
      if (!pondPat) pondPat = ctx.createPattern(groundTile('pond'), 'repeat');
      ctx.fillStyle = pondPat; ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = 'rgba(42,27,69,0.35)'; ctx.fillRect(0, gy, W, H - gy);
      drawParty(gy, T);
      drawBakery(W * 0.72, gy, T);
      drawHonk(W * 0.72 + 2, gy + 10, true, 1, T);
      for (let i = 0; i < 4; i++) { // bolt bots carrying bread around
        const k = (T * 0.15 + i / 4) % 1, x = lerp(W * 0.1, W * 0.95, k);
        drawSprX(enemySprite('bolt', Math.floor(T * 8 + i) % 2, null), x, gy + 26 + (i % 2) * 5, { ay: 1 });
        drawSpr(ART.bread, x - 2, gy + 12 + (i % 2) * 5);
      }
      if (Math.random() < 0.06) { const x = rand(W * 0.1, W * 0.9), y = rand(H * 0.12, H * 0.35); cs.burst(x, y, pick([RAINBOW, ['#ffd23f', '#fff8e7']]), 24, 60, 1.1, 30); tone(rand(300, 600), 0.3, 'triangle', 0.05, 80); }
      drawHeroes(cs, W * 0.28, gy + 38, T, true, 'right');
      drawDaisy(W * 0.46, gy + 36 - Math.abs(Math.sin(T * 7)) * 4, { t: T, frame: Math.floor(T * 7) % 2 });
    } },
  { dur: 4,
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      if (Math.random() < 0.1) cs.burst(rand(0, W), rand(0, H * 0.5), RAINBOW, 20, 50, 1.2, 30);
      const k = Ease.outBack(Math.min(1, t / 0.6));
      drawZoomText('THE END', W / 2, H * 0.3, lerp(10, 4, k), C.gold);
      if (t > 0.6) text('THANKS FOR PLAYING QUACK ATTACK!', W / 2, H * 0.5, C.white, 1, 1);
      if (t > 1.0 && cs.paid) { const lw = textW('+1500 COINS REWARD!'); coinIcon(Math.floor(W / 2 - lw / 2 - 6), Math.floor(H * 0.6), T); text('+1500 COINS REWARD!', W / 2 + 4, H * 0.6 + 1, C.gold, 1, 1); }
      drawHeroes(cs, W / 2 - 40, H * 0.88, T, true, 'down');
      drawDaisy(W / 2 + 4, H * 0.88 - Math.abs(Math.sin(T * 7)) * 3, { t: T });
      drawHonk(W / 2 + 34, H * 0.88 + 2 - Math.abs(Math.sin(T * 7 + 1)) * 3, false, 2, T);
      drawSprX(enemySprite('bolt', Math.floor(T * 8) % 2, null), W / 2 + 56, H * 0.88 - Math.abs(Math.sin(T * 7 + 2)) * 3, { ay: 1 });
    } },
];
Object.assign(CUTSCENES, { intro3: INTRO3_BEATS, ending3: ENDING3_BEATS });

// ================================================================ translations for chapter 3
addPhrases([
  ['LAVA FIELDS', 'LAVAFELDER', 'ЛАВОВЫЕ ПОЛЯ'], ['DUSTY DUNES', 'STAUBIGE DÜNEN', 'ПЫЛЬНЫЕ ДЮНЫ'], ['CANDY FACTORY', 'SÜSSIGKEITENFABRIK', 'КОНФЕТНАЯ ФАБРИКА'],
  ['CRYSTAL CAVES', 'KRISTALLHÖHLEN', 'ХРУСТАЛЬНЫЕ ПЕЩЕРЫ'], ['CLANK CASTLE', 'BURG KLANK', 'ЗАМОК КЛАНКА'],
  ['LAVA GOLEM', 'LAVAGOLEM', 'ЛАВОВЫЙ ГОЛЕМ'], ['DUNE DRILLER', 'DÜNENBOHRER', 'БУР ДЮН'], ['GUMMY KING', 'GUMMIKÖNIG', 'МАРМЕЛАДНЫЙ КОРОЛЬ'],
  ['CRYSTAL QUEEN', 'KRISTALLKÖNIGIN', 'ХРУСТАЛЬНАЯ КОРОЛЕВА'], ['KING CLANK', 'KÖNIG KLANK', 'КОРОЛЬ КЛАНК'],
  ['TURRET BOT', 'GESCHÜTZ-BOT', 'БОТ-ТУРЕЛЬ'], ['SPIDER BOT', 'SPINNEN-BOT', 'БОТ-ПАУК'],
  ['GUMMY', 'GUMMI', 'МАРМЕЛАД'], ['CLANKY', 'KLANKIG', 'ЖЕЛЕЗНЫЙ'], ['FIRE HELMET', 'FEUERHELM', 'ПОЖАРНЫЙ ШЛЕМ'], ['CRYSTAL CROWN', 'KRISTALLKRONE', 'ХРУСТАЛЬНАЯ КОРОНА'],
  ['KING CLANK GOES BERSERK!', 'KÖNIG KLANK DREHT DURCH!', 'КОРОЛЬ КЛАНК В ЯРОСТИ!'], ['CLANK! ROBOTS, ATTACK!', 'KLANK! ROBOTER, ANGRIFF!', 'КЛАНК! РОБОТЫ, В АТАКУ!'],
  ['MY LAVA GOLEM GUARDS THE VOLCANO! TURN BACK, LITTLE DUCKS!', 'MEIN LAVAGOLEM BEWACHT DEN VULKAN! KEHRT UM, KLEINE ENTEN!', 'МОЙ ЛАВОВЫЙ ГОЛЕМ ОХРАНЯЕТ ВУЛКАН! ПОВОРАЧИВАЙТЕ, УТЯТА!'],
  ['LA LA! WE ARE NOT SCARED OF A HOT ROCK!', 'LA LA! WIR HABEN KEINE ANGST VOR EINEM HEISSEN STEIN!', 'ЛЯ-ЛЯ! МЫ НЕ БОИМСЯ ГОРЯЧЕГО КАМНЯ!'],
  ['HONK! HELP! THEY ARE CARRYING ME INTO THE DESERT!', 'HONK! HILFE! SIE TRAGEN MICH IN DIE WÜSTE!', 'ГА! ПОМОГИТЕ! МЕНЯ НЕСУТ В ПУСТЫНЮ!'],
  ['THE DUNE DRILLER LIVES UNDER THE SAND. YOU WILL NEVER SEE IT COMING!', 'DER DÜNENBOHRER LEBT UNTER DEM SAND. IHR SEHT IHN NIE KOMMEN!', 'БУР ДЮН ЖИВЕТ ПОД ПЕСКОМ. ВЫ ЕГО НЕ УВИДИТЕ!'],
  ['WATCH THE SAND... IF IT MOVES, SHOOT IT! QUACK!', 'BEOBACHTET DEN SAND... WENN ER SICH BEWEGT, SCHIESST! QUAK!', 'СЛЕДИТЕ ЗА ПЕСКОМ... ЕСЛИ ДВИГАЕТСЯ - СТРЕЛЯЙТЕ! КРЯ!'],
  ['LOOK, BREAD CRUMBS! HONK LEFT US A TRAIL!', 'SCHAUT, BROTKRÜMEL! HONK HAT UNS EINE SPUR GELEGT!', 'СМОТРИТЕ, КРОШКИ! ХОНК ОСТАВИЛ НАМ СЛЕД!'],
  ['I TURNED THE SWEET SHOP INTO A FACTORY! THE GUMMY KING IS MY BEST WORKER!', 'ICH HABE DEN SÜSSWARENLADEN ZUR FABRIK GEMACHT! DER GUMMIKÖNIG IST MEIN BESTER ARBEITER!', 'Я ПРЕВРАТИЛ КОНФЕТНУЮ ЛАВКУ В ФАБРИКУ! МАРМЕЛАДНЫЙ КОРОЛЬ - МОЙ ЛУЧШИЙ РАБОЧИЙ!'],
  ['MMM, CANDY... NO! FOCUS! QUACK!', 'MMM, SÜSSES... NEIN! KONZENTRATION! QUAK!', 'М-М, КОНФЕТЫ... НЕТ! СОБРАЛИСЬ! КРЯ!'],
  ['HONK! I CAN HEAR YOU! THEY PUT ME IN THE CRYSTAL CAVES! HURRY!', 'HONK! ICH HÖRE EUCH! SIE HABEN MICH IN DIE KRISTALLHÖHLEN GESTECKT! BEEILT EUCH!', 'ГА! Я ВАС СЛЫШУ! МЕНЯ ДЕРЖАТ В ХРУСТАЛЬНЫХ ПЕЩЕРАХ! СКОРЕЕ!'],
  ['MY CRYSTAL QUEEN SPINS WEBS OF LASERS. NOBODY ESCAPES!', 'MEINE KRISTALLKÖNIGIN SPINNT NETZE AUS LASERN. NIEMAND ENTKOMMT!', 'МОЯ ХРУСТАЛЬНАЯ КОРОЛЕВА ПЛЕТЕТ СЕТИ ИЗ ЛАЗЕРОВ. НИКТО НЕ СБЕЖИТ!'],
  ['THEN WE WILL JUST CUT THROUGH THEM!', 'DANN SCHNEIDEN WIR UNS EINFACH DURCH!', 'ТОГДА МЫ ПРОСТО ИХ РАЗРЕЖЕМ!'],
  ['ENOUGH! COME TO MY CASTLE AND FACE THE KING! CLANK!', 'GENUG! KOMMT IN MEINE BURG UND STELLT EUCH DEM KÖNIG! KLANK!', 'ХВАТИТ! ПРИХОДИТЕ В МОЙ ЗАМОК И СРАЗИТЕСЬ С КОРОЛЕМ! КЛАНК!'],
  ['I AM BUILT FROM EVERY ROBOT YOU EVER BEAT! I AM UNBEATABLE!', 'ICH BIN AUS JEDEM ROBOTER GEBAUT, DEN IHR BESIEGT HABT! ICH BIN UNBESIEGBAR!', 'Я СОБРАН ИЗ ВСЕХ РОБОТОВ, КОТОРЫХ ВЫ ПОБЕДИЛИ! МЕНЯ НЕ ПОБЕДИТЬ!'],
  ['HONK! HIT HIM IN THE GEARS!', 'HONK! TREFFT IHN IN DIE ZAHNRÄDER!', 'ГА! БЕЙТЕ ПО ШЕСТЕРЕНКАМ!'], ['QUAAACK! FOR THE BAKERY!', 'QUAAAK! FÜR DIE BÄCKEREI!', 'КРЯЯЯ! ЗА ПЕКАРНЮ!'],
  ['A MONTH LATER, DR. HONK OPENED A BAKERY AT PUDDLE POND...', 'EINEN MONAT SPÄTER ERÖFFNETE DR. HONK EINE BÄCKEREI AM PFÜTZENTEICH...', 'ЧЕРЕЗ МЕСЯЦ ДР. ХОНК ОТКРЫЛ ПЕКАРНЮ НА ЛУЖИЧНОМ ПРУДУ...'],
  ['HONK! FRESH BREAD FOR EVERYONE! NO ROBOTS, JUST BUNS!', 'HONK! FRISCHES BROT FÜR ALLE! KEINE ROBOTER, NUR BRÖTCHEN!', 'ГА! СВЕЖИЙ ХЛЕБ ДЛЯ ВСЕХ! НИКАКИХ РОБОТОВ, ТОЛЬКО БУЛОЧКИ!'],
  ['...CLANK. CLANK. CLANK.', '...KLANK. KLANK. KLANK.', '...КЛАНК. КЛАНК. КЛАНК.'],
  ['THE OLD BOSS WENT SOFT. NOW I, KING CLANK, RULE THE ROBOTS!', 'DER ALTE BOSS IST WEICH GEWORDEN. JETZT HERRSCHE ICH, KÖNIG KLANK, ÜBER DIE ROBOTER!', 'СТАРЫЙ БОСС РАЗМЯК. ТЕПЕРЬ Я, КОРОЛЬ КЛАНК, ПРАВЛЮ РОБОТАМИ!'],
  ['HONK?! HE IS BUILT FROM ALL MY OLD SCRAP!', 'HONK?! DER IST AUS MEINEM GANZEN ALTEN SCHROTT GEBAUT!', 'ГА?! ОН СОБРАН ИЗ ВСЕГО МОЕГО СТАРОГО ХЛАМА!'],
  ['NO MORE BREAD! THE WHOLE WORLD WILL BE ONE BIG FACTORY! AND YOU COME WITH ME, HONK!', 'SCHLUSS MIT BROT! DIE GANZE WELT WIRD EINE GROSSE FABRIK! UND DU KOMMST MIT, HONK!', 'ХВАТИТ ХЛЕБА! ВЕСЬ МИР СТАНЕТ ОДНОЙ БОЛЬШОЙ ФАБРИКОЙ! А ТЫ ИДЕШЬ СО МНОЙ, ХОНК!'],
  ['THEY TOOK OUR BAKER! DUCKS, AFTER THEM!', 'SIE HABEN UNSEREN BÄCKER! ENTEN, HINTERHER!', 'ОНИ ЗАБРАЛИ НАШЕГО ПЕКАРЯ! УТКИ, ЗА НИМИ!'],
  ['CHAPTER 3', 'KAPITEL 3', 'ГЛАВА 3'], ['SAVE DR. HONK!', 'RETTE DR. HONK!', 'СПАСИ ДР. ХОНКА!'],
  ['CHAPTER 3 - SAVE DR. HONK!', 'KAPITEL 3 - RETTE DR. HONK!', 'ГЛАВА 3 - СПАСИ ДР. ХОНКА!'],
  ['KING CLANK CRASHES DOWN IN A HEAP OF BOLTS!', 'KÖNIG KLANK ZERFÄLLT IN EINEN HAUFEN SCHRAUBEN!', 'КОРОЛЬ КЛАНК РАССЫПАЕТСЯ НА КУЧУ БОЛТОВ!'],
  ['OUT POP DOZENS OF TINY BOLT BOTS...', 'HERAUS HÜPFEN DUTZENDE WINZIGE SCHRAUBEN-BOTS...', 'ИЗ НЕГО ВЫСКАКИВАЮТ ДЕСЯТКИ КРОШЕЧНЫХ БОТОВ...'],
  ['...BEEP? WE JUST WANTED SOMEBODY TO TELL US WHAT TO DO.', '...PIEP? WIR WOLLTEN NUR, DASS UNS JEMAND SAGT, WAS WIR TUN SOLLEN.', '...БИП? МЫ ПРОСТО ХОТЕЛИ, ЧТОБЫ НАМ КТО-ТО ГОВОРИЛ, ЧТО ДЕЛАТЬ.'],
  ['HONK! THEN COME HELP AT MY BAKERY! I NEED LOTS OF HANDS... OR CLAWS!', 'HONK! DANN HELFT IN MEINER BÄCKEREI! ICH BRAUCHE VIELE HÄNDE... ODER KRALLEN!', 'ГА! ТОГДА ПОМОГАЙТЕ В МОЕЙ ПЕКАРНЕ! МНЕ НУЖНО МНОГО РУК... ИЛИ КЛЕШНЕЙ!'],
  ['AND SO THE ROBOTS LEARNED TO BAKE BREAD. THE BEST BREAD IN DUCKLAND.', 'UND SO LERNTEN DIE ROBOTER, BROT ZU BACKEN. DAS BESTE BROT IN ENTENLAND.', 'И ТАК РОБОТЫ НАУЧИЛИСЬ ПЕЧЬ ХЛЕБ. ЛУЧШИЙ ХЛЕБ В УТИНОЙ СТРАНЕ.'],
  ['+1500 COINS REWARD!', '+1500 MÜNZEN BELOHNUNG!', 'НАГРАДА: +1500 МОНЕТ!'], ['BAKERY', 'BÄCKEREI', 'ПЕКАРНЯ'],
  ['BEAT CHAPTER {0} FIRST', 'SCHAFFE ZUERST KAPITEL {0}', 'СНАЧАЛА ПРОЙДИ ГЛАВУ {0}'], ['CHAPTER 2 CLEAR!', 'KAPITEL 2 GESCHAFFT!', 'ГЛАВА 2 ПРОЙДЕНА!'],
  ['CHAPTER 3 IS UNLOCKED!', 'KAPITEL 3 IST FREI!', 'ГЛАВА 3 ОТКРЫТА!'],
]);
