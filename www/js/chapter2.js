'use strict';
/* QUACK ATTACK! — Chapter 2: THE STOLEN QUACK.
 * A week after the rescue, Dr. Honk comes back in his giant Mothership. He doesn't need Daisy this time:
 * his tractor beam sucks the Golden Quack right out of her. Daisy is left croaking, and the ducks chase the
 * Mothership across the beach, a spooky swamp, the clouds and the moon, up to the ship itself.
 * Everything here plugs into the tables from art.js, data.js, story.js and lang.js. */

// ================================================================ worlds
Object.assign(WORLD_THEME, {
  beach: { ground: ['#f2d79a', '#e0bf7a', '#fbe8b8'], style: 'sand', edge: 'water', e1: '#2f8fd8', e2: '#8fdcff', shore: '#fbe8b8', shoreD: '#e0bf7a',
    tint: { m: '#7fb8d8', M: '#3f6f8f', l: '#d6f0ff' }, deco: { shell: 4, starfish: 3, rock: 2 }, tall: { palm: 4, sandcastle: 1 }, sky: '#8fdcff' },
  swamp: { ground: ['#4a5a3a', '#3a4a2c', '#5f704a'], style: 'grass', edge: 'water', e1: '#1f2f24', e2: '#3a5a3a', shore: '#3a3a2a', shoreD: '#2a2a1c',
    tint: { m: '#8f8fa3', M: '#4a4a5f', l: '#c9e0b8' }, deco: { lily: 3, swampmush: 4, cattail: 3, fern: 2 }, tall: { deadtree: 4 }, sky: '#2a3a2f' },
  clouds: { ground: ['#f4f7ff', '#dfe6fa', '#ffffff'], style: 'cloud', edge: 'sky', e1: '#7fc4f2', e2: '#ffffff', shore: '#ffffff', shoreD: '#dfe6fa',
    tint: { m: '#ffb3d9', M: '#c0609e', l: '#fff0f8' }, deco: { cloudpuff: 4, star: 3 }, tall: { cloudpillar: 3, balloon: 2 }, sky: '#9fd8ff' },
  moon: { ground: ['#9a9aab', '#7a7a8f', '#b5b5c9'], style: 'moon', edge: 'void', e1: '#0c0a1a', e2: '#1d1a33', shore: '#5d5d70', shoreD: '#3d3d50',
    tint: { m: '#c3c2d4', M: '#6c6888', l: '#ffffff' }, deco: { moonrock: 4, crater: 3 }, tall: { flag: 1, antenna: 2, dome: 2 }, sky: '#0c0a1a' },
  ship: { ground: ['#2f4a5a', '#24394a', '#3f6070'], style: 'lab', edge: 'void', e1: '#0c0a1a', e2: '#1a1530', shore: '#5ec8ff', shoreD: '#2f7fe0',
    tint: { m: '#ffd23f', M: '#b07a00', l: '#fff3b0' }, deco: { panel: 3, cable: 3, boltpile: 2 }, tall: { console: 3, vat: 2 }, sky: '#0c0a1a' },
});
Object.assign(DECO_ART, {
  shell: spr(['.ww.', 'wpww', 'wwww'], { w: '#fff3dc', p: '#ff9ccb' }),
  starfish: spr(['..o..', 'ooooo', '.ooo.', 'o...o'], { o: '#ff8c1a' }),
  lily: spr(['.ggg.', 'gggpg', '.ggg.'], { g: '#3f8f3a', p: '#ff9ccb' }),
  swampmush: spr(['.ccc.', 'cCcCc', '..s..'], { c: '#7dfff5', C: '#d6fffb', s: '#c9a26b' }),
  cloudpuff: spr(['.ww.', 'wwww', '.ww.'], { w: '#ffffff' }, null),
  star: spr(['.y.', 'yYy', '.y.'], { y: '#ffd23f', Y: '#fff3b0' }, null),
  moonrock: spr(['.mm.', 'mMmm', 'mmmm'], { m: '#7a7a8f', M: '#b5b5c9' }),
  crater: spr(['.kkk.', 'k...k', '.kkk.'], { k: '#6a6a7f' }, null),
  panel: spr(['mmmm', 'mrgm', 'mmmm'], { m: '#3d4a5a', r: '#e8343b', g: '#51cf66' }, null),
  // tall
  palm: spr(['..gg..gg..', '.gggggggg.', 'gg.gggg.gg', 'g..gbbg..g', '....bb....', '....bb....', '...bb.....', '...bb.....', '....bb....', '...bbbb...'],
    { g: '#3f9f4a', b: '#a0642d' }),
  sandcastle: spr(['r......', 'k.y.y.y', 'kyyyyyy', 'yyyKyyy', 'yyyKyyy', 'yyyyyyy'], { y: '#e9cf8a', K: '#c9ab66', k: '#8b8aa0', r: '#e8343b' }),
  deadtree: spr(['b.....b.b', '.b...b.b.', '..b.bb...', '...bb....', '...bb..b.', '...bbbb..', '...bb....', '...bb....', '..bbbb...'], { b: '#4a3d27' }),
  cloudpillar: spr(['.wwww.', 'wwwwww', '.wWww.', '.wwWw.', '.wWww.', '.wwww.', 'wwwwww'], { w: '#ffffff', W: '#dfe8ff' }),
  balloon: spr(['.rrr.', 'rRrrr', 'rrrrr', '.rrr.', '..k..', '..k..', '..k..'], { r: '#ff6fae', R: '#ffd1e6', k: '#8b8aa0' }),
  flag: spr(['krrr', 'krr.', 'kr..', 'k...', 'k...', 'k...', 'kk..'], { k: '#c3c2d4', r: '#a07ad6' }),
  antenna: spr(['..r..', '..k..', '.kkk.', '..k..', '..k..', '.kkk.', 'kkkkk'], { k: '#9aa3b5', r: '#e8343b' }),
  dome: spr(['..cccc..', '.cCcccc.', 'cCcccccc', 'cccccccc', 'mmmmmmmm'], { c: '#7ecbff', C: '#e3f4ff', m: '#5d6577' }),
});

// ================================================================ bosses
const ULTRA_ROWS = ENEMY_ART.honk.map(f => f.map(r => r.replace('eEEe', 'QqqQ')));
Object.assign(ENEMY_ART, {
  shark: [
    ['.........MM.......', '........MssM......', 'MM.....MsssM......', 'MsM..MMssssMMMM...', 'MssMMsssssssssMM..', '.MssssssssssseEsM.',
      '.MsssssssssssssssM', 'MssMSSSSSSSSStwtwM', 'MsM.MSSSSSSSSwtwtM', 'MM...MMSSSSSSSSMM.', '.......MM...MM....'],
    ['.........MM.......', '........MssM......', '.......MsssM......', '.....MMssssMMMM...', 'MM..MsssssssssMM..', 'MsMMssssssssseEsM.',
      'MssssssssssssssssM', '.MsMSSSSSSSSStwtwM', '..M.MSSSSSSSSwtwtM', '.....MMSSSSSSSSMM.', '.......MM...MM....'],
  ],
  ghost: [
    ['.....wwwwww.....', '...wwwwwwwwww...', '..wwwwwwwwwwww..', '.wwwKKwwwwKKwww.', '.wwKeeKwwKeeKww.', '.wwwKKwwwwKKwww.', '.wwwwwwoooowwww.',
      'wwwwwwwwoooowwww', 'wwgwwwwwwwwwwgww', 'wwwwwwwwwwwwwwww', 'wgwwwwwwwwwwwwgw', 'wwwwwwwwwwwwwwww', 'ww.www.www.www.w', '.w...w...w...w..'],
    ['.....wwwwww.....', '...wwwwwwwwww...', '..wwwwwwwwwwww..', '.wwwKKwwwwKKwww.', '.wwKeeKwwKeeKww.', '.wwwKKwwwwKKwww.', '.wwwwwwoooowwww.',
      'wwwwwwwwoooowwww', 'wwgwwwwwwwwwwgww', 'wwwwwwwwwwwwwwww', 'wgwwwwwwwwwwwwgw', 'wwwwwwwwwwwwwwww', 'w.www.www.www.ww', '..w...w...w...w.'],
  ],
  storm: [
    ['.....cccc.......', '...ccCCCcc.ccc..', '..cCCCCCcccCCcc.', '.ccCCccccccccccc', 'cccccccccccccccc', 'cccKKccccccKKccc', 'cccKeKccccKeKccc',
      'cccccccccccccccc', 'ccccMMMMMMMMcccc', '.cccccccccccccc.', '..cccccccccccc..', '...a....a....a..', '..a....a....a...', '...a....a....a..'],
    ['.....cccc.......', '...ccCCCcc.ccc..', '..cCCCCCcccCCcc.', '.ccCCccccccccccc', 'cccccccccccccccc', 'cccKKccccccKKccc', 'cccKeKccccKeKccc',
      'cccccccccccccccc', 'ccccMMMMMMMMcccc', '.cccccccccccccc.', '..cccccccccccc..', '....a....a....a.', '...a....a....a..', '....a....a....a.'],
  ],
  robodaisy: [
    ['.....a..a.....', '.....aaaa.....', '....mmmmmm....', '...mmmmmmmm...', '..mmeEmmeEmm..', '..mmmmmmmmmooo', '..mmmmmmmmmoo.', '...mmmmmmmm...',
      '..MmmmmmmmmmM.', '.MmmlmmmmmmmmM', '.MmmmmmmmmmmmM', '..MmmmmmmmmmM.', '...MMMMMMMMM..', '....oo...oo...'],
    ['.....a..a.....', '.....aaaa.....', '....mmmmmm....', '...mmmmmmmm...', '..mmeEmmeEmm..', '..mmmmmmmmmooo', '..mmmmmmmmmoo.', '...mmmmmmmm...',
      '..MmmmmmmmmmM.', '.MmmlmmmmmmmmM', '.MmmmmmmmmmmmM', '..MmmmmmmmmmM.', '...MMMMMMMMM..', '...oo.....oo..'],
  ],
  ultra: ULTRA_ROWS,
});
Object.assign(ENEMY_PAL, {
  shark: { M: '#2f4f6b', s: '#6f9fc4', S: '#d5e6f2', e: '#ff3b5c', E: '#fff3b0', t: '#ffffff', w: '#2f4f6b' },
  ghost: { w: '#eef0ff', g: '#b9bfe0', K: '#3d3a52', e: '#7ee0ff', o: '#ff9f1c' },
  storm: { c: '#5d6a8f', C: '#8f9cc4', K: '#2a2f45', e: '#ffd23f', M: '#2a2f45', a: '#ffd23f' },
  robodaisy: { m: '#d5dbe6', M: '#8b8aa0', l: '#ffffff', e: '#ff3b5c', E: '#fff3b0', o: '#ff9f1c', a: '#ff6fae' },
  ultra: { g: '#ffd23f', w: '#f4f4f4', G: '#ff3b5c', o: '#ff9f1c', m: '#4b2a7a', M: '#24123f', l: '#ffd23f', a: '#ffd23f', Q: '#ffd23f', q: '#fff3b0' },
});
Object.assign(PROJ_ART, {
  wisp: spr(['.c.', 'cCc', '.c.'], { c: '#7ee0ff', C: '#ffffff' }),
  zap: spr(['y.', 'yy', '.y'], { y: '#ffd23f' }),
  gnote: spr(['.gg', '..g', 'ggg', 'gg.'], { g: '#ffd23f' }),
});
BOSSES.yeti.bullet = 'snowball';
Object.assign(BOSSES, {
  shark: { name: 'SHARK-BOT', hp: 2600, spd: 32, dmg: 22, r: 15, sc: 2, attacks: ['charge', 'ring', 'summon', 'charge'], summon: ['bolt', 'boom'], col: '#6f9fc4' },
  ghost: { name: 'GHOST GOOSE', hp: 2100, spd: 30, dmg: 22, r: 15, sc: 2, attacks: ['jump', 'volley', 'summon', 'ring'], summon: ['goo', 'drone'], col: '#eef0ff', bullet: 'wisp' },
  storm: { name: 'THUNDER BALLOON', hp: 2300, spd: 22, dmg: 24, r: 16, sc: 2, attacks: ['missiles', 'ring', 'volley', 'summon'], summon: ['bolt', 'boom'], col: '#8f9cc4', bullet: 'zap' },
  robodaisy: { name: 'ROBO-DAISY', hp: 3000, spd: 30, dmg: 26, r: 14, sc: 2, attacks: ['charge', 'volley', 'summon', 'ring', 'jump'], summon: ['drone', 'saw'], col: '#ff9ccb' },
  ultra: { name: 'DR. HONK ULTRA', hp: 3800, spd: 28, dmg: 28, r: 17, sc: 2, attacks: ['ring', 'missiles', 'charge', 'summon', 'volley', 'jump'],
    summon: ['bolt', 'drone', 'saw', 'boom', 'tank'], col: '#ffd23f', bullet: 'gnote', final: true },
});
BOSS_ORDER.push('shark', 'ghost', 'storm', 'robodaisy', 'ultra');

// ================================================================ rewards: chapter 2 cosmetics (only from the story, never in chests)
Object.assign(SKIN_PAL, {
  swampy: { h: '#7a9a5a', y: '#7a9a5a', d: '#4f6a3a', w: '#b8d49a', o: '#c9a26b', f: '#c9a26b', K: OUT, c: '#9fbf7a' },
  stormy: { h: '#3f4f7f', y: '#3f4f7f', d: '#2a3456', w: '#ffd23f', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#5ec8ff' },
  cosmic: { h: '#4b2a7a', y: '#4b2a7a', d: '#2a1748', w: '#c9a6ff', o: '#ff6fae', f: '#ff6fae', K: '#ffd23f', c: '#ff6fae' },
});
SKIN_FX.cosmic = 'glow';
Object.assign(HAT_ART, {
  sunhat: hat({ rows: ['...yyyyyy...', '..yyyyyyyy..', '..rrrrrrrr..', 'yyyyyyyyyyyy'], x: 0, y: 1 }, { y: '#f2d27a', r: '#e8343b' }),
  spacehelm: hat({ rows: ['....r.....', '....k.....', '..wwwwww..', '.wwwwwwww.', 'wwbbbbbbww'], x: 1, y: 1 }, { w: '#f4f7ff', b: '#5ec8ff', k: '#9aa3b5', r: '#e8343b' }),
});
COSMETICS.skin.push({ id: 'swampy', name: 'SWAMPY', rarity: 'epic', story: 7 }, { id: 'stormy', name: 'STORMY', rarity: 'epic', story: 8 },
  { id: 'cosmic', name: 'COSMIC', rarity: 'legendary', story: 10 });
COSMETICS.hat.push({ id: 'sunhat', name: 'SUN HAT', rarity: 'rare', story: 6 }, { id: 'spacehelm', name: 'SPACE HELMET', rarity: 'epic', story: 9 });

// ================================================================ levels 6-10
// diff is how hard a level plays (enemy health, damage, spawns, XP); chapter 1 is simply 1-5
for (const l of LEVELS) if (l.diff === undefined) l.diff = l.n;
LEVELS.push(
  { n: 6, name: 'SUNNY BEACH', world: 'beach', time: 110, diff: 4, boss: 'shark', reward: 'sunhat', rewardCat: 'hat',
    pool: { bolt: 8, boom: 4, goo: 3, drone: 3, saw: 3 },
    intro: [['honk', 'WELCOME TO HONK BEACH! MY SHARK-BOT IS VERY HUNGRY. FOR DUCKS!'], ['daisy', "*CROAK* ...SHARKS DON'T EVEN EAT DUCKS! GET HIM!"]],
    outro: [['daisy', '*CROAK* HIS SHIP DROPPED SOMETHING IN THE SWAMP... IT GLOWS!']] },
  { n: 7, name: 'SPOOKY SWAMP', world: 'swamp', time: 115, diff: 4.5, boss: 'ghost', reward: 'swampy', rewardCat: 'skin',
    pool: { goo: 6, bolt: 5, drone: 4, saw: 3, tank: 2 },
    intro: [['honk', 'BOOO! HONK! MY GHOST GOOSE HAUNTS THIS SWAMP!'], ['duck', "GHOSTS AREN'T REAL... RIGHT? QUACK?"]],
    outro: [['daisy', '*CROAK* IT WAS A ROBOT WITH A BEDSHEET! THE SHIP IS UP IN THE CLOUDS!']] },
  { n: 8, name: 'CLOUD KINGDOM', world: 'clouds', time: 120, diff: 5, boss: 'storm', reward: 'stormy', rewardCat: 'skin',
    pool: { drone: 4, bolt: 6, boom: 4, saw: 3, tank: 2 },
    intro: [['honk', 'UP HERE THE WEATHER IS ALWAYS HONKY! THUNDER BALLOON, ZAP THEM!'], ['daisy', '*CROAK* POP THAT BALLOON!']],
    outro: [['honk', 'FINE! MEET ME ON THE MOON. IF YOU CAN FLY. HONK HONK!']] },
  { n: 9, name: 'MOON BASE', world: 'moon', time: 125, diff: 5.5, boss: 'robodaisy', reward: 'spacehelm', rewardCat: 'hat',
    pool: { bolt: 7, tank: 3, saw: 3, drone: 4, boom: 3 },
    intro: [['honk', 'MEET ROBO-DAISY! SHE HAS A GOLDEN QUACK TOO. AND LASERS!'], ['daisy', "*CROAK* SHE DOESN'T EVEN LOOK LIKE ME!"]],
    outro: [['daisy', '*CROAK* NO QUACK INSIDE HER! IT MUST BE ON HIS MOTHERSHIP!']] },
  { n: 10, name: 'HONK MOTHERSHIP', world: 'ship', time: 135, diff: 6.3, boss: 'ultra', reward: 'cosmic', rewardCat: 'skin',
    pool: { bolt: 5, boom: 4, goo: 3, tank: 4, saw: 4, drone: 5 },
    intro: [['honk', 'THE GOLDEN QUACK POWERS MY ULTRA SUIT! NOTHING CAN STOP ME NOW!'], ['duck', 'GIVE IT BACK, HONK! QUAAACK!']],
    outro: [] },
);
const CHAPTERS = [{ n: 1, from: 1, to: 5, title: 'STORY - SAVE PRINCESS DAISY!' }, { n: 2, from: 6, to: 10, title: 'CHAPTER 2 - GET THE GOLDEN QUACK BACK!' }];
const rewardOf = lv => ({ cat: lv.rewardCat || 'weapon', id: lv.reward });
const chapterOf = n => (n > 5 ? 2 : 1);

// ================================================================ cutscene props
function drawMothership(x, y, t, sc = 1) {
  x = Math.round(x); y = Math.round(y);
  const s = sc;
  // underside lights
  pellipse(x, y + 6 * s, 52 * s, 12 * s, OUT); pellipse(x, y + 6 * s, 51 * s, 11 * s, '#3b2a5c');
  for (let i = -4; i <= 4; i++) { ctx.fillStyle = (Math.floor(t * 6) + i) % 3 === 0 ? '#ffd23f' : '#7ee0ff'; ctx.fillRect(x + i * 11 * s - s, y + 10 * s, 3 * s, 2 * s); }
  // saucer rim
  pellipse(x, y, 60 * s, 10 * s, OUT); pellipse(x, y, 59 * s, 9 * s, '#7b4fd6'); pellipse(x - 6 * s, y - 3 * s, 46 * s, 4 * s, '#9d74f0');
  ctx.fillStyle = '#ffd23f'; for (let i = -5; i <= 5; i++) ctx.fillRect(x + i * 10 * s - s, y, 2 * s, 2 * s);
  // glass dome with Dr. Honk inside
  pellipse(x, y - 9 * s, 20 * s, 14 * s, OUT); pellipse(x, y - 9 * s, 19 * s, 13 * s, '#4f86b8');
  drawHonk(x + 2 * s, y - 1 * s, false, s, t);
  ctx.globalAlpha = 0.35; pellipse(x - 6 * s, y - 15 * s, 6 * s, 3 * s, '#ffffff'); ctx.globalAlpha = 1;
  if (s >= 1) text('HONK', x + 36 * s, y - 2 * s, '#ffd23f', s, 1, null);
}
function drawBeam(x, y0, y1, t, w = 30) {
  ctx.globalAlpha = 0.28 + Math.sin(t * 10) * 0.06; ctx.fillStyle = '#fff3b0';
  ctx.beginPath(); ctx.moveTo(x - 6, y0); ctx.lineTo(x + 6, y0); ctx.lineTo(x + w, y1); ctx.lineTo(x - w, y1); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}
function drawNote(x, y, col = '#ffd23f') { drawSprX(col === '#ffd23f' ? PROJ_ART.gnote : ART.note, x, y); }
function drawParty(gy, T) {
  // bunting across the top and a few balloons
  const cols = ['#e8343b', '#ffd23f', '#5ec8ff', '#51cf66', '#ff6fae'];
  pline(0, 22, W, 30, '#5c3416');
  for (let i = 0; i < W / 14; i++) {
    const x = i * 14, y = 22 + (x / W) * 8;
    ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 5, y + 8); ctx.closePath(); ctx.fill();
  }
  [[0.12, 0], [0.88, 1], [0.95, 2]].forEach(([fx, i]) => drawSprX(DECO_ART.balloon, W * fx, gy + 6 - Math.sin(T * 2 + i) * 3, { ay: 1 }));
}
function drawShipInterior(T) {
  ctx.fillStyle = '#0c0a1a'; ctx.fillRect(0, 0, W, H);
  const gy = Math.floor(H * 0.58);
  for (let i = 0; i < 6; i++) { // round windows with stars
    const x = W * (0.1 + i * 0.16), y = gy * 0.45;
    pcirc(x, y, 13, '#5d6577'); pcirc(x, y, 11, '#120c1f');
    ctx.fillStyle = '#fff8e7'; for (let k = 0; k < 3; k++) ctx.fillRect(Math.round(x - 7 + ((k * 37 + i * 13 + T * 6) % 14)), Math.round(y - 5 + k * 4), 1, 1);
  }
  if (!drawShipInterior.pat) drawShipInterior.pat = ctx.createPattern(groundTile('ship'), 'repeat');
  ctx.fillStyle = drawShipInterior.pat; ctx.fillRect(0, gy, W, H - gy);
  drawSpr(DECO_ART.console, W * 0.07, gy - 2); drawSpr(DECO_ART.vat, W * 0.94, gy + 2);
  return gy;
}
// golden notes flying from (x0,y0) to (x1,y1)
function noteStream(x0, y0, x1, y1, t, n = 6) {
  for (let i = 0; i < n; i++) {
    const k = ((t * 0.8 + i / n) % 1);
    drawNote(lerp(x0, x1, k) + Math.sin(k * 9 + i) * 6, lerp(y0, y1, k) - Math.sin(k * Math.PI) * 14);
  }
}

// ---------------------------------------------------------------- chapter 2 intro: the stolen quack
const INTRO2_BEATS = [
  { dur: 3, say: ['narr', 'ONE WEEK LATER, PUDDLE POND THROWS A BIG PARTY...'],
    enter() { Music.play('title'); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawParty(gy, T);
      drawDaisy(W * 0.56, gy + 34 - Math.abs(Math.sin(T * 6)) * 3, { t: T, frame: Math.floor(T * 6) % 2 });
      const k = Ease.outCubic(Math.min(1, t / 2.6));
      drawHeroes(cs, lerp(-30, W * 0.32, k), gy + 38, T, k < 1, 'right');
    } },
  { dur: 2.8, say: ['daisy', 'THANK YOU, HEROES! THIS GOLDEN QUACK IS FOR YOU!'],
    enter() { sfx.quack(1.6); },
    draw(cs, t, T) {
      const gy = drawPondScene(T);
      drawParty(gy, T);
      const dx = W * 0.56, dy = gy + 34;
      drawDaisy(dx, dy - Math.abs(Math.sin(T * 8)) * 3, { t: T, frame: 1 });
      for (let i = 0; i < 4; i++) { const k = (T * 0.6 + i / 4) % 1; drawNote(dx + Math.sin(k * 8 + i) * 14, dy - 40 - k * 50); }
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right');
    } },
  { dur: 2.2, say: ['narr', '...WHOOOMP.'],
    enter(cs) { cs.shake = 5; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, Math.min(0.5, t * 0.5));
      drawParty(gy, T);
      ctx.globalAlpha = Math.min(0.5, t * 0.4); pellipse(W * 0.56, gy + 30, 30 + t * 50, 8 + t * 10, '#000000'); ctx.globalAlpha = 1;
      drawDaisy(W * 0.56, gy + 34, { t: T });
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right', t > 0.8 ? '!' : '');
    } },
  { dur: 2.8, say: ['honk', "HONK HONK! SURPRISE! I DON'T NEED THE PRINCESS THIS TIME... ONLY HER VOICE!"],
    enter() { Music.play('boss'); sfx.honk(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.5);
      drawParty(gy, T);
      drawMothership(W * 0.56, lerp(-50, H * 0.2, Ease.outCubic(Math.min(1, t / 1.6))), T);
      drawDaisy(W * 0.56, gy + 34, { t: T });
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right', '!');
    } },
  { dur: 2.8, say: ['daisy', 'QUA... *CROAK*?! MY QUACK!'],
    enter(cs) { cs.shake = 2; sfx.warn(); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.5);
      const sy = H * 0.2;
      drawBeam(W * 0.56, sy + 14, gy + 40, T);
      noteStream(W * 0.56, gy + 10, W * 0.56, sy + 10, T, 7);
      drawMothership(W * 0.56, sy, T);
      drawDaisy(W * 0.56, gy + 34 - Math.abs(Math.sin(T * 14)) * 2, { t: T, blink: true });
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right', '!!', true);
    } },
  { dur: 2.8, say: ['honk', 'WITH THE GOLDEN QUACK, MY MOTHERSHIP WILL BE UNSTOPPABLE! TOODLES! HONK HONK!'],
    enter() { sfx.honk(0.9); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.4);
      const k = Ease.inCubic(Math.min(1, t / 2.4));
      drawMothership(W * 0.56 + k * W * 0.3, H * 0.2 - k * (H * 0.2 + 60), T, 1 - k * 0.5);
      for (let i = 0; i < 4; i++) {
        const x = W * (0.66 + i * 0.08), y = gy + 22 + (i % 2) * 14, ap = t - i * 0.3;
        if (ap > 0) drawSprX(enemySprite('bolt', Math.floor(T * 8) % 2, WORLD_THEME.beach.tint), x, y, { ay: 1, sy: Math.min(1, ap * 3) });
      }
      drawDaisy(W * 0.5, gy + 34, { t: T });
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right', '!!');
    } },
  { dur: 2.4, say: ['duck', "WE'LL GET YOUR QUACK BACK, DAISY! AFTER THAT SHIP!"],
    enter(cs) { Music.play('battle'); sfx.quack(); cs.burst(W * 0.32, H * 0.75, ['#ffd23f', '#fff8e7'], 16, 70); },
    draw(cs, t, T) {
      const gy = drawPondScene(T, 0.2);
      for (let i = 0; i < 4; i++) drawSprX(enemySprite('bolt', Math.floor(T * 8) % 2, WORLD_THEME.beach.tint), W * (0.66 + i * 0.08), gy + 22 + (i % 2) * 14, { ay: 1, flip: true });
      drawDaisy(W * 0.5, gy + 34 - Math.abs(Math.sin(T * 5)) * 2, { t: T });
      if ((T * 2 | 0) % 2) text('*CROAK*', W * 0.5, gy - 16, C.green, 1, 1, 'outline');
      drawHeroes(cs, W * 0.32, gy + 38, T, false, 'right', '', false, true);
    } },
  { dur: 2.4,
    enter(cs) { sfx.title(); cs.shake = 4; },
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      const k = Ease.outBack(Math.min(1, t / 0.5));
      drawZoomText('CHAPTER 2', W / 2, H * 0.38, lerp(9, 3, k), C.gold);
      if (t > 0.5) text('GET THE GOLDEN QUACK BACK!', W / 2, H * 0.58, C.white, 1, 1);
      drawHeroes(cs, W / 2 - 6, H * 0.85, T, true, 'right', '', false, true);
    } },
];

// ---------------------------------------------------------------- chapter 2 ending: the quack comes home
const ENDING2_BEATS = [
  { dur: 2.6, say: ['narr', "DR. HONK'S ULTRA SUIT FALLS TO PIECES!"],
    enter(cs) { cs.shake = 5; sfx.bigBoom(); },
    draw(cs, t, T) {
      const gy = drawShipInterior(T);
      drawSprX(enemySprite('ultra', 0, null), W * 0.64, gy + 30, { sc: 2, ay: 1, white: (T * 6 | 0) % 2 === 0 && t < 1 });
      if (Math.random() < 0.35) cs.burst(W * 0.64 + rand(-16, 16), gy + rand(-10, 20), ['#5a5872', '#ffd23f'], 1, 15, 1.2, -25);
      drawDaisy(W * 0.38, gy + 40, { t: T, facing: 'right' });
      drawHeroes(cs, W * 0.24, gy + 44, T, false, 'right');
    } },
  { dur: 2.6, say: ['narr', 'THE GOLDEN QUACK IS FREE!'],
    enter() { sfx.revive(); },
    draw(cs, t, T) {
      const gy = drawShipInterior(T);
      drawSprX(enemySprite('ultra', 0, null), W * 0.64, gy + 30, { sc: 2, ay: 1, alpha: 0.7 });
      noteStream(W * 0.64, gy, W * 0.38, gy + 10, T, 8);
      drawDaisy(W * 0.38, gy + 40, { t: T, facing: 'right' });
      drawHeroes(cs, W * 0.24, gy + 44, T, false, 'right', '!');
    } },
  { dur: 2.8, say: ['daisy', 'LA LA LAAA... QUAAACK! MY VOICE IS BACK!'],
    enter() { sfx.quack(1.7); },
    draw(cs, t, T) {
      const gy = drawShipInterior(T);
      drawSprX(enemySprite('ultra', 0, null), W * 0.64, gy + 30, { sc: 2, ay: 1, alpha: 0.6 });
      const dx = W * 0.38, dy = gy + 40;
      for (let i = 0; i < 6; i++) { const a = T * 2 + i / 6 * TAU; drawNote(dx + Math.cos(a) * 22, dy - 20 + Math.sin(a) * 10); }
      drawDaisy(dx, dy - Math.abs(Math.sin(T * 9)) * 4, { t: T, frame: Math.floor(T * 8) % 2 });
      drawHeroes(cs, W * 0.24, gy + 44, T, true, 'right');
    } },
  { dur: 2.8, say: ['honk', 'HONK... I JUST WANTED SOMEONE TO SING FOR ME...'],
    draw(cs, t, T) {
      const gy = drawShipInterior(T);
      drawSprX(enemySprite('ultra', 0, null), W * 0.72, gy + 30, { sc: 2, ay: 1, alpha: 0.5 });
      drawHonk(W * 0.6, gy + 42, true, 2, 0);
      if ((T * 2 | 0) % 2) { ctx.fillStyle = '#5ec8ff'; ctx.fillRect(Math.round(W * 0.6) - 9, gy + 6 + ((T * 20) % 8), 2, 3); }
      drawDaisy(W * 0.38, gy + 40, { t: T, facing: 'right' });
      drawHeroes(cs, W * 0.24, gy + 44, T, false, 'right', '?');
    } },
  { dur: 2.8, say: ['daisy', 'THEN COME TO OUR PARTY, SILLY GOOSE. EVERYONE IS INVITED!'],
    enter(cs) { cs.burst(W * 0.45, H * 0.5, ['#ff6fae', '#ffb3d9', '#ff4d6d'], 10, 30, 1, -20); },
    draw(cs, t, T) {
      const gy = drawShipInterior(T);
      drawHonk(W * 0.6, gy + 42 - Math.abs(Math.sin(T * 8)) * 3, true, 2, T);
      drawDaisy(W * 0.42, gy + 40 - Math.abs(Math.sin(T * 6)) * 2, { t: T, facing: 'right' });
      drawHeroes(cs, W * 0.24, gy + 44, T, false, 'right');
    } },
  { dur: 3.4, say: ['narr', 'AND SO, EVEN DR. HONK LEARNED TO QUACK ALONG.'],
    enter() { sfx.win(); Music.play('title'); },
    draw(cs, t, T) {
      drawSky('#2a1b45', '#ff8c6b', T, false);
      const gy = Math.floor(H * 0.6);
      if (!pondPat) pondPat = ctx.createPattern(groundTile('pond'), 'repeat');
      ctx.fillStyle = pondPat; ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = 'rgba(42,27,69,0.35)'; ctx.fillRect(0, gy, W, H - gy);
      drawParty(gy, T);
      if (Math.random() < 0.07) { const x = rand(W * 0.1, W * 0.9), y = rand(H * 0.12, H * 0.35); cs.burst(x, y, pick([RAINBOW, ['#ffd23f', '#fff8e7'], ['#ff6fae', '#5ec8ff']]), 26, 60, 1.1, 30); tone(rand(300, 600), 0.3, 'triangle', 0.05, 80); }
      drawHeroes(cs, W * 0.3, gy + 38, T, true, 'right');
      drawDaisy(W * 0.52, gy + 36 - Math.abs(Math.sin(T * 7)) * 4, { t: T, frame: Math.floor(T * 7) % 2 });
      drawHonk(W * 0.7, gy + 42 - Math.abs(Math.sin(T * 7 + 1)) * 4, (T * 2 | 0) % 2 === 0, 2, T);
      for (let i = 0; i < 3; i++) { const k = (T * 0.5 + i / 3) % 1; drawNote(W * 0.52 + Math.sin(k * 7 + i) * 18, gy - k * 40); }
    } },
  { dur: 4,
    draw(cs, t, T) {
      ctx.fillStyle = OUT; ctx.fillRect(0, 0, W, H);
      if (Math.random() < 0.1) cs.burst(rand(0, W), rand(0, H * 0.5), RAINBOW, 20, 50, 1.2, 30);
      const k = Ease.outBack(Math.min(1, t / 0.6));
      drawZoomText('THE END', W / 2, H * 0.3, lerp(10, 4, k), C.gold);
      if (t > 0.6) text('THANKS FOR PLAYING QUACK ATTACK!', W / 2, H * 0.5, C.white, 1, 1);
      if (t > 1.0 && cs.paid) { const lw = textW('+1000 COINS REWARD!'); coinIcon(Math.floor(W / 2 - lw / 2 - 6), Math.floor(H * 0.6), T); text('+1000 COINS REWARD!', W / 2 + 4, H * 0.6 + 1, C.gold, 1, 1); }
      drawHeroes(cs, W / 2 - 30, H * 0.88, T, true, 'down');
      drawDaisy(W / 2 + 14, H * 0.88 - Math.abs(Math.sin(T * 7)) * 3, { t: T });
      drawHonk(W / 2 + 46, H * 0.88 + 2 - Math.abs(Math.sin(T * 7 + 1)) * 3, false, 2, T);
    } },
];

// ================================================================ translations for chapter 2
addPhrases([
  ['SUNNY BEACH', 'SONNENSTRAND', 'СОЛНЕЧНЫЙ ПЛЯЖ'], ['SPOOKY SWAMP', 'GRUSELSUMPF', 'ЖУТКОЕ БОЛОТО'], ['CLOUD KINGDOM', 'WOLKENREICH', 'ОБЛАЧНОЕ КОРОЛЕВСТВО'],
  ['MOON BASE', 'MONDBASIS', 'ЛУННАЯ БАЗА'], ['HONK MOTHERSHIP', 'HONK-MUTTERSCHIFF', 'КОРАБЛЬ-МАТКА ХОНКА'],
  ['SHARK-BOT', 'HAI-BOT', 'АКУЛОБОТ'], ['GHOST GOOSE', 'GEISTERGANS', 'ГУСЬ-ПРИЗРАК'], ['THUNDER BALLOON', 'DONNERBALLON', 'ГРОЗОВОЙ ШАР'],
  ['ROBO-DAISY', 'ROBO-DAISY', 'РОБО-ДЕЙЗИ'], ['DR. HONK ULTRA', 'DR. HONK ULTRA', 'ДР. ХОНК УЛЬТРА'],
  ['SWAMPY', 'SUMPFIG', 'БОЛОТНЫЙ'], ['STORMY', 'STÜRMISCH', 'ГРОЗОВОЙ'], ['COSMIC', 'KOSMISCH', 'КОСМОС'], ['SUN HAT', 'SONNENHUT', 'ПАНАМА'], ['SPACE HELMET', 'RAUMHELM', 'ШЛЕМ КОСМОНАВТА'],
  ['WELCOME TO HONK BEACH! MY SHARK-BOT IS VERY HUNGRY. FOR DUCKS!', 'WILLKOMMEN AM HONK-STRAND! MEIN HAI-BOT HAT GROSSEN HUNGER. AUF ENTEN!', 'ДОБРО ПОЖАЛОВАТЬ НА ПЛЯЖ ХОНКА! МОЙ АКУЛОБОТ ОЧЕНЬ ГОЛОДЕН. НА УТОК!'],
  ["*CROAK* ...SHARKS DON'T EVEN EAT DUCKS! GET HIM!", '*KRÄCHZ* ...HAIE ESSEN GAR KEINE ENTEN! SCHNAPPT IHN!', '*КВАК* ...АКУЛЫ ДАЖЕ НЕ ЕДЯТ УТОК! ВПЕРЕД!'],
  ['*CROAK* HIS SHIP DROPPED SOMETHING IN THE SWAMP... IT GLOWS!', '*KRÄCHZ* SEIN SCHIFF HAT WAS IM SUMPF VERLOREN... ES LEUCHTET!', '*КВАК* ЕГО КОРАБЛЬ ЧТО-ТО УРОНИЛ В БОЛОТО... ОНО СВЕТИТСЯ!'],
  ['BOOO! HONK! MY GHOST GOOSE HAUNTS THIS SWAMP!', 'BUUUH! HONK! MEINE GEISTERGANS SPUKT IN DIESEM SUMPF!', 'БУУУ! ГА! МОЙ ГУСЬ-ПРИЗРАК ПУГАЕТ ВСЕХ НА БОЛОТЕ!'],
  ["GHOSTS AREN'T REAL... RIGHT? QUACK?", 'GEISTER GIBT ES NICHT... ODER? QUAK?', 'ПРИЗРАКОВ ЖЕ НЕ БЫВАЕТ... ПРАВДА? КРЯ?'],
  ['*CROAK* IT WAS A ROBOT WITH A BEDSHEET! THE SHIP IS UP IN THE CLOUDS!', '*KRÄCHZ* DAS WAR EIN ROBOTER MIT BETTLAKEN! DAS SCHIFF IST IN DEN WOLKEN!', '*КВАК* ЭТО БЫЛ РОБОТ В ПРОСТЫНЕ! КОРАБЛЬ В ОБЛАКАХ!'],
  ['UP HERE THE WEATHER IS ALWAYS HONKY! THUNDER BALLOON, ZAP THEM!', 'HIER OBEN IST DAS WETTER IMMER HONKIG! DONNERBALLON, ZAPP SIE!', 'ЗДЕСЬ ВСЕГДА ГУСИНАЯ ПОГОДА! ГРОЗОВОЙ ШАР, ЖАХНИ ИХ!'],
  ['*CROAK* POP THAT BALLOON!', '*KRÄCHZ* LASST DEN BALLON PLATZEN!', '*КВАК* ЛОПНИТЕ ЭТОТ ШАР!'],
  ['FINE! MEET ME ON THE MOON. IF YOU CAN FLY. HONK HONK!', 'SCHÖN! WIR SEHEN UNS AUF DEM MOND. WENN IHR FLIEGEN KÖNNT. HONK HONK!', 'ЛАДНО! ЖДУ ВАС НА ЛУНЕ. ЕСЛИ УМЕЕТЕ ЛЕТАТЬ. ГА-ГА!'],
  ['MEET ROBO-DAISY! SHE HAS A GOLDEN QUACK TOO. AND LASERS!', 'DAS IST ROBO-DAISY! SIE HAT AUCH EINEN GOLDENEN QUAK. UND LASER!', 'ЗНАКОМЬТЕСЬ, РОБО-ДЕЙЗИ! У НЕЕ ТОЖЕ ЗОЛОТОЕ КРЯ. И ЛАЗЕРЫ!'],
  ["*CROAK* SHE DOESN'T EVEN LOOK LIKE ME!", '*KRÄCHZ* DIE SIEHT MIR GAR NICHT ÄHNLICH!', '*КВАК* ОНА ДАЖЕ НЕ ПОХОЖА НА МЕНЯ!'],
  ['*CROAK* NO QUACK INSIDE HER! IT MUST BE ON HIS MOTHERSHIP!', '*KRÄCHZ* KEIN QUAK IN IHR! ER MUSS AUF SEINEM MUTTERSCHIFF SEIN!', '*КВАК* В НЕЙ НЕТ КРЯ! ОНО НА ЕГО КОРАБЛЕ-МАТКЕ!'],
  ['THE GOLDEN QUACK POWERS MY ULTRA SUIT! NOTHING CAN STOP ME NOW!', 'DER GOLDENE QUAK TREIBT MEINEN ULTRA-ANZUG AN! NICHTS HÄLT MICH AUF!', 'ЗОЛОТОЕ КРЯ ПИТАЕТ МОЙ УЛЬТРА-КОСТЮМ! МЕНЯ НЕ ОСТАНОВИТЬ!'],
  ['GIVE IT BACK, HONK! QUAAACK!', 'GIB IHN ZURÜCK, HONK! QUAAAK!', 'ОТДАВАЙ, ХОНК! КРЯЯЯ!'],
  ['ONE WEEK LATER, PUDDLE POND THROWS A BIG PARTY...', 'EINE WOCHE SPÄTER FEIERT DER PFÜTZENTEICH EIN GROSSES FEST...', 'ЧЕРЕЗ НЕДЕЛЮ НА ЛУЖИЧНОМ ПРУДУ БОЛЬШОЙ ПРАЗДНИК...'],
  ['THANK YOU, HEROES! THIS GOLDEN QUACK IS FOR YOU!', 'DANKE, IHR HELDEN! DIESER GOLDENE QUAK IST FÜR EUCH!', 'СПАСИБО, ГЕРОИ! ЭТО ЗОЛОТОЕ КРЯ ДЛЯ ВАС!'],
  ['...WHOOOMP.', '...WUMMS.', '...БАБАХ.'],
  ["HONK HONK! SURPRISE! I DON'T NEED THE PRINCESS THIS TIME... ONLY HER VOICE!", 'HONK HONK! ÜBERRASCHUNG! DIESMAL BRAUCHE ICH NICHT DIE PRINZESSIN... NUR IHRE STIMME!', 'ГА-ГА! СЮРПРИЗ! В ЭТОТ РАЗ МНЕ НУЖНА НЕ ПРИНЦЕССА... А ТОЛЬКО ЕЕ ГОЛОС!'],
  ['QUA... *CROAK*?! MY QUACK!', 'QUA... *KRÄCHZ*?! MEIN QUAK!', 'КР... *КВАК*?! МОЕ КРЯ!'],
  ['WITH THE GOLDEN QUACK, MY MOTHERSHIP WILL BE UNSTOPPABLE! TOODLES! HONK HONK!', 'MIT DEM GOLDENEN QUAK IST MEIN MUTTERSCHIFF UNAUFHALTSAM! TSCHÜSSI! HONK HONK!', 'С ЗОЛОТЫМ КРЯ МОЙ КОРАБЛЬ НЕ ОСТАНОВИТЬ! ЧАО! ГА-ГА!'],
  ["WE'LL GET YOUR QUACK BACK, DAISY! AFTER THAT SHIP!", 'WIR HOLEN DEINEN QUAK ZURÜCK, DAISY! HINTER DEM SCHIFF HER!', 'МЫ ВЕРНЕМ ТВОЕ КРЯ, ДЕЙЗИ! ЗА ЭТИМ КОРАБЛЕМ!'],
  ['*CROAK*', '*KRÄCHZ*', '*КВАК*'], ['CHAPTER 2', 'KAPITEL 2', 'ГЛАВА 2'], ['GET THE GOLDEN QUACK BACK!', 'HOL DEN GOLDENEN QUAK ZURÜCK!', 'ВЕРНИ ЗОЛОТОЕ КРЯ!'],
  ["DR. HONK'S ULTRA SUIT FALLS TO PIECES!", 'DR. HONKS ULTRA-ANZUG FÄLLT AUSEINANDER!', 'УЛЬТРА-КОСТЮМ ДР. ХОНКА РАЗВАЛИВАЕТСЯ!'],
  ['THE GOLDEN QUACK IS FREE!', 'DER GOLDENE QUAK IST FREI!', 'ЗОЛОТОЕ КРЯ НА СВОБОДЕ!'],
  ['LA LA LAAA... QUAAACK! MY VOICE IS BACK!', 'LA LA LAAA... QUAAAK! MEINE STIMME IST ZURÜCK!', 'ЛЯ-ЛЯ-ЛЯЯЯ... КРЯЯЯ! МОЙ ГОЛОС ВЕРНУЛСЯ!'],
  ['HONK... I JUST WANTED SOMEONE TO SING FOR ME...', 'HONK... ICH WOLLTE DOCH NUR, DASS JEMAND FÜR MICH SINGT...', 'ГА... Я ПРОСТО ХОТЕЛ, ЧТОБЫ КТО-ТО ПЕЛ ДЛЯ МЕНЯ...'],
  ['THEN COME TO OUR PARTY, SILLY GOOSE. EVERYONE IS INVITED!', 'DANN KOMM ZU UNSEREM FEST, DU DUMME GANS. ALLE SIND EINGELADEN!', 'ТОГДА ПРИХОДИ НА НАШ ПРАЗДНИК, ГЛУПЫЙ ГУСЬ. ПРИГЛАШЕНЫ ВСЕ!'],
  ['AND SO, EVEN DR. HONK LEARNED TO QUACK ALONG.', 'UND SO LERNTE SOGAR DR. HONK MITZUQUAKEN.', 'И ТАК ДАЖЕ ДР. ХОНК НАУЧИЛСЯ КРЯКАТЬ ВМЕСТЕ СО ВСЕМИ.'],
  ['+1000 COINS REWARD!', '+1000 MÜNZEN BELOHNUNG!', 'НАГРАДА: +1000 МОНЕТ!'],
  ['CHAPTER 2 - GET THE GOLDEN QUACK BACK!', 'KAPITEL 2 - HOL DEN GOLDENEN QUAK ZURÜCK!', 'ГЛАВА 2 - ВЕРНИ ЗОЛОТОЕ КРЯ!'],
  ['CHAPTER 1 CLEAR!', 'KAPITEL 1 GESCHAFFT!', 'ГЛАВА 1 ПРОЙДЕНА!'], ['CHAPTER 2 IS UNLOCKED!', 'KAPITEL 2 IST FREI!', 'ГЛАВА 2 ОТКРЫТА!'],
  ['BEAT CHAPTER 1 FIRST', 'SCHAFFE ZUERST KAPITEL 1', 'СНАЧАЛА ПРОЙДИ ГЛАВУ 1'], ['CHAPTER {0}', 'KAPITEL {0}', 'ГЛАВА {0}'],
  ['BEAT STORY LEVEL {0} TO GET IT', 'SCHAFFE STORY-LEVEL {0}, UM ES ZU BEKOMMEN', 'ПРОЙДИ УРОВЕНЬ {0}, ЧТОБЫ ПОЛУЧИТЬ'],
  ['NEW ITEM: {0}!', 'NEUES ITEM: {0}!', 'НОВЫЙ ПРЕДМЕТ: {0}!'],
]);
