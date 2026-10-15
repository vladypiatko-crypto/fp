'use strict';
/* QUACK ATTACK! — pixel art.
 * Every sprite is a list of strings; letters map to palette colours and the
 * engine adds a dark outline automatically. */

// ================================================================ ducks: 3 views x 2 walk frames x (open / blinking eyes)
// h head, y body, d shade, w wing, o beak, f feet, K eye, c cheek
const DUCK_ROWS = {
  side: [
    '....hhhh....',
    '...hhhhhh...',
    '...hhhhKhoo.',
    '...hhhhhhooo',
    '....hhchh...',
    '..yyyyyyyy..',
    '.yyyyyyyyyy.',
    'yyyywwwyyyy.',
    '.yyyyyyyyyd.',
    '..ddddddd...',
  ],
  down: [
    '....hhhh....',
    '...hhhhhh...',
    '..hhKhhKhh..',
    '..hchoohch..',
    '...hhoohh...',
    '..yyyyyyyy..',
    '.wyyyyyyyyw.',
    '.wyyyyyyyyw.',
    '.yyyyyyyyyy.',
    '..dddddddd..',
  ],
  up: [
    '....hhhh....',
    '...hhhhhh...',
    '..hhhhhhhh..',
    '..hhhhhhhh..',
    '...hhhhhh...',
    '..yyyyyyyy..',
    '.wyyyyyyyyw.',
    '.wyyyyyyyyw.',
    '.yyyyyyyyyy.',
    '..yyyddyyy..',
  ],
};
const DUCK_FEET = { side: ['....f..f....', '...f....f...'], down: ['...f....f...', '....f..f....'], up: ['...f....f...', '....f..f....'] };
// skin palettes (see COSMETICS.skin in data.js for names/rarity)
const SKIN_PAL = {
  classic: { h: '#ffd23f', y: '#ffd23f', d: '#e0a526', w: '#fff3b0', o: '#ff9f1c', f: '#ff9f1c', K: OUT, c: '#ffb3a7' },
  snowy: { h: '#f4f1ff', y: '#f4f1ff', d: '#bdb6d8', w: '#ffffff', o: '#ff9f1c', f: '#ff9f1c', K: OUT, c: '#ffc6d9' },
  mint: { h: '#8ff0c4', y: '#8ff0c4', d: '#4fc297', w: '#d6ffee', o: '#ff9f1c', f: '#ff9f1c', K: OUT, c: '#ffb3c7' },
  toasty: { h: '#e89a52', y: '#e89a52', d: '#b56a2c', w: '#ffd4a3', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#ff8f8f' },
  mallard: { h: '#2f9e44', y: '#b8a690', d: '#7f6f5c', w: '#3f6fd8', o: '#ffd23f', f: '#ff9f1c', K: OUT, c: '#2f9e44' },
  bubblegum: { h: '#ff9ccb', y: '#ff9ccb', d: '#e0609e', w: '#ffd6ea', o: '#ff6f3c', f: '#ff6f3c', K: OUT, c: '#ff5c8a' },
  midnight: { h: '#2c2a5e', y: '#2c2a5e', d: '#1a1840', w: '#5552a8', o: '#ffd23f', f: '#ffd23f', K: '#7dfff5', c: '#5552a8' },
  ghost: { h: '#d9ecff', y: '#d9ecff', d: '#a7c4e8', w: '#ffffff', o: '#a7c4e8', f: '#a7c4e8', K: '#3a4d7a', c: '#c0dcff' },
  golden: { h: '#ffcf33', y: '#ffcf33', d: '#d99a00', w: '#fff6bf', o: '#ff6f00', f: '#ff6f00', K: OUT, c: '#ffe680' },
  lava: { h: '#3d3a52', y: '#3d3a52', d: '#24212f', w: '#ff8c1a', o: '#ff3b1f', f: '#ff3b1f', K: '#ffd23f', c: '#e8343b' },
  daisy: { h: '#fff4f8', y: '#fff4f8', d: '#f0c2d6', w: '#ffffff', o: '#ff9f1c', f: '#ff9f1c', K: OUT, c: '#ff8fb8' },
};
const SKIN_FX = { ghost: 'ghost', golden: 'gold', lava: 'lava', midnight: 'glow' };
const duckCache = new Map();
function duckSet(skin) {
  let set = duckCache.get(skin);
  if (set) return set;
  const pal = SKIN_PAL[skin] || SKIN_PAL.classic;
  set = {};
  for (const view of ['side', 'down', 'up']) {
    const open = [0, 1].map(f => spr([...DUCK_ROWS[view], DUCK_FEET[view][f]], pal));
    const blink = [0, 1].map(f => spr([...DUCK_ROWS[view].map(r => r.replace(/K/g, 'h')), DUCK_FEET[view][f]], pal));
    set[view] = [open, blink];
  }
  set.egg = spr(['..eee..', '.eeeee.', 'eeKeKee', 'eeeeeee', 'eehhhee', '.eeeee.'], { e: pal.y, K: OUT, h: pal.d });
  duckCache.set(skin, set);
  return set;
}

// ================================================================ hats
// Each view: rows, x = duck column of the hat's first column, y = duck row of the hat's bottom row.
function hat(front, pal, extra = {}) {
  const mk = v => v && Object.assign({}, v, { spr: spr(v.rows, pal), frames: v.frames && v.frames.map(r => spr(r, pal)) });
  return { front: mk(front), side: mk(extra.side), up: mk(extra.up), fx: extra.fx };
}
const HAT_ART = {
  bandana_r: hat({ rows: ['rrrrrr'], x: 3, y: 1 }, { r: '#e8343b' },
    { side: { rows: ['..rrrrrrr', '.r.......', 'r........'], x: 0, y: 3 }, up: { rows: ['rrrrrr', '.r..r.', 'r....r'], x: 3, y: 3 } }),
  bandana_b: hat({ rows: ['rrrrrr'], x: 3, y: 1 }, { r: '#2f7fe0' },
    { side: { rows: ['..rrrrrrr', '.r.......', 'r........'], x: 0, y: 3 }, up: { rows: ['rrrrrr', '.r..r.', 'r....r'], x: 3, y: 3 } }),
  wizard: hat({ rows: ['..p.......', '..pp......', '...ppp....', '...pppp...', '...ppSpp..', '..pppppp..', '..ppppspp.', '.gggggggg.', 'bbbbbbbbbb'], x: 1, y: 1 },
    { p: '#7048e8', S: '#ffd23f', s: '#fff3b0', g: '#ffd23f', b: '#4c2bb0' }, { fx: 'wizard' }),
  tophat: hat({ rows: ['.klkkkk.', '.klkkkk.', '.kkkkkk.', '.rrrrrr.', 'kkkkkkkk'], x: 2, y: 1 }, { k: '#2b2438', l: '#4a4060', r: '#e8343b' }),
  crown: hat({ rows: ['y..yy..y', 'yy.yy.yy', 'yRyyyyBy', 'yyyyyyyy'], x: 2, y: 1 }, { y: '#ffd23f', R: '#e8343b', B: '#5ec8ff' }, { fx: 'shine' }),
  cowboy: hat({ rows: ['....cccc....', '...cccccc...', 'c..cDDDDc..c', 'cccccccccccc'], x: 0, y: 1 }, { c: '#a0642d', D: '#5c3416' }),
  party: hat({ rows: ['..ww..', '..pp..', '..yp..', '.ppyp.', '.yppp.', 'pppypp'], x: 3, y: 1 }, { p: '#ff6fae', y: '#ffd23f', w: '#fff8e7' }),
  beanie: hat({ rows: ['...ww...', '.bbbbbb.', 'bbBbbBbb', 'BBBBBBBB'], x: 2, y: 1 }, { b: '#3fa7ff', B: '#2f6fb3', w: '#fff8e7' }),
  cap: hat({ rows: ['.cccccc.', 'cccccccc'], x: 2, y: 1 }, { c: '#e8343b', w: '#fff8e7' },
    { side: { rows: ['...cwcccc.', 'cccccccccc'], x: 0, y: 1 } }),
  flower: hat({ rows: ['.p.', 'pyp', '.p.'], x: 7, y: 2 }, { p: '#ff6fae', y: '#ffd23f' }, { side: { rows: ['.p.', 'pyp', '.p.'], x: 4, y: 2 } }),
  pirate: hat({ rows: ['...kkkkkk...', '..kkkwwkkk..', '.kkkkwwkkkk.', 'kkkkkkkkkkkk'], x: 0, y: 1 }, { k: '#2b2438', w: '#fff8e7' }),
  chef: hat({ rows: ['.wwwwww.', 'wwwwwwww', 'wwwwwwww', '.wwwwww.', '.GGGGGG.'], x: 2, y: 1 }, { w: '#ffffff', G: '#d5dbe6' }, { fx: 'steam' }),
  viking: hat({ rows: ['h..........h', 'h..........h', 'hh..mmmm..hh', '.hhmmlmmmhh.', '..mmmmmmmm..', '..gggggggg..'], x: 0, y: 1 },
    { h: '#fff3dc', m: '#9aa3b5', l: '#d5dbe6', g: '#ffd23f' }),
  propeller: hat({ rows: ['bbbbrrrr', '...kk...', '.ryyyyb.', 'rryyyybb'], x: 2, y: 1,
    frames: [['bbbbrrrr', '...kk...', '.ryyyyb.', 'rryyyybb'], ['...br...', '...kk...', '.ryyyyb.', 'rryyyybb']] },
  { r: '#e8343b', b: '#2f7fe0', y: '#ffd23f', k: '#3d3a52' }, { fx: 'spin' }),
  catears: hat({ rows: ['c......c', 'cp....pc', 'ccc..ccc'], x: 2, y: 1 }, { c: '#3d3a52', p: '#ff6fae' }),
  bow: hat({ rows: ['pp.pp', 'ppPpp', 'pp.pp'], x: 6, y: 1 }, { p: '#ff6fae', P: '#ffb3d9' }, { side: { rows: ['pp.pp', 'ppPpp', 'pp.pp'], x: 2, y: 1 } }),
  headphones: hat({ rows: ['..kkkkkk..', '.k......k.', 'k........k', 'rr......rr', 'rr......rr'], x: 1, y: 3 }, { k: '#3d3a52', r: '#ff6fae' },
    { fx: 'notes', side: { rows: ['.kkkkk.', 'k.....k', '...rr..', '...rr..'], x: 2, y: 3 } }),
};

// ================================================================ weapons (pointing right; grip near the left)
const GUN_ART = {
  blaster: spr(['.mmmmmc', 'mmmmm..', 'mm.....'], { m: '#4a4763', c: '#5ec8ff' }),
  shotgun: spr(['..mmmmmmm', 'wwwwwm...', 'ww.......'], { w: '#a0642d', m: '#5a5872' }),
  laser: spr(['..ppppPW', 'pppppp..', 'pp......'], { p: '#9d5cff', P: '#c9a6ff', W: '#ffffff' }),
  bubble: spr(['..bb....', '.bBb....', 'kkkkkkcc', 'kk......'], { b: '#7ecbff', B: '#ffffff', k: '#ff6fae', c: '#ffd23f' }),
  rang: spr(['ww....', '.ww...', '..wwrr'], { w: '#fff3dc', r: '#e8343b' }),
  minigun: spr(['.mmmmmmmm', 'MMMMMMMMk', '.mmmmmmmm', 'kk.......'], { m: '#8b8aa0', M: '#5a5872', k: '#3d3a52' }),
};
const PROJ_ART = {
  rang: spr(['ww..', 'wwr.', '.www', '..ww'], { w: '#fff3dc', r: '#e8343b' }),
  seed: spr(['ee', 'ee'], { e: '#ff3b5c' }),
  missile: spr(['.rr.', 'rwwr', 'rwwr', '.ff.'], { r: '#e8343b', w: '#d5dbe6', f: '#ffd23f' }),
  snowball: spr(['.ww.', 'wwww', 'wwwb', '.wb.'], { w: '#ffffff', b: '#bde6ff' }),
};

// ================================================================ robots (Dr. Honk's army). m/M/l are re-tinted per world.
const BOT_BASE = { m: '#9aa3b5', M: '#5d6577', l: '#d5dbe6', e: '#ff3b5c', E: '#fff3b0', a: '#ffd23f', s: '#d5dbe6' };
const ENEMY_ART = {
  bolt: [
    ['...a...', '...M...', '.mmmmm.', 'mllmmmm', 'mmeEemm', 'mmmmmmm', '.MMMMM.', '.M...M.'],
    ['...a...', '...M...', '.mmmmm.', 'mllmmmm', 'mmeEemm', 'mmmmmmm', '.MMMMM.', '..M.M..'],
  ],
  boom: [
    ['....s....', '....f....', '..kkkkk..', '.kkkkkkk.', 'kklkkkkkk', 'kkeekeekk', 'kkkkkkkkk', '.kkkkkkk.', '..k...k..'],
    ['....S....', '....f....', '..kkkkk..', '.kkkkkkk.', 'kklkkkkkk', 'kkeekeekk', 'kkkkkkkkk', '.kkkkkkk.', '...k.k...'],
  ],
  goo: [
    ['...ggg...', '..gGggg..', '.ggggggg.', 'ggKgggKgg', 'ggggggggg', 'gggMMMggg', '.ggggggg.'],
    ['.........', '...ggg...', '.gGggggg.', 'ggKgggKgg', 'ggggggggg', 'gggMMMggg', 'ggggggggg'],
  ],
  minigoo: [['.ggg.', 'gKgKg', 'ggggg'], ['.....', 'gggg.', 'gKgKg', 'ggggg']],
  tank: [
    ['....MMMM....', '...MlllmM...', '..MmeEemmM..', '..MmmmmmmM..', '.aMMMMMMMMa.', 'mmmmmmmmmmmm', 'mllllllllllm', 'mmmmmmmmmmmm', 'TtTtTtTtTtTt', 'tTtTtTtTtTtT'],
    ['....MMMM....', '...MlllmM...', '..MmeEemmM..', '..MmmmmmmM..', '.aMMMMMMMMa.', 'mmmmmmmmmmmm', 'mllllllllllm', 'mmmmmmmmmmmm', 'tTtTtTtTtTtT', 'TtTtTtTtTtTt'],
  ],
  drone: [
    ['ppp.....ppp', '..M.....M..', '..mmmmmmm..', '.mllmmmmmm.', '.mmmeEemmm.', '..mmmmmmm..', '....aMa....'],
    ['.p.p...p.p.', '..M.....M..', '..mmmmmmm..', '.mllmmmmmm.', '.mmmeEemmm.', '..mmmmmmm..', '....aMa....'],
  ],
  saw: [
    ['....s....', '.s.sss.s.', '..sssss..', '.ssMMMss.', 'sssMeMsss', '.ssMMMss.', '..sssss..', '.s.sss.s.', '....s....'],
    ['.s.....s.', '..sssss..', '.sssssss.', 'sssMMMsss', '.ssMeMss.', 'sssMMMsss', '.sssssss.', '..sssss..', '.s.....s.'],
  ],
  crab: [
    ['rr............rr', 'rRr..........rRr', 'rrr...e..e...rrr', '.rr...M..M...rr.', '..r..rrrrrr..r..', '...rrrRRRRrrr...',
      '..rrRRrrrrRRrr..', '.rrrrrrrrrrrrrr.', '.rMMrrMMMMrrMMr.', '..rrrrrrrrrrrr..', '.r.r.r....r.r.r.', 'r.r.r......r.r.r'],
    ['rr............rr', 'rRr..........rRr', 'rrr...e..e...rrr', '.rr...M..M...rr.', '..r..rrrrrr..r..', '...rrrRRRRrrr...',
      '..rrRRrrrrRRrr..', '.rrrrrrrrrrrrrr.', '.rMMrrMMMMrrMMr.', '..rrrrrrrrrrrr..', 'r.r.r......r.r.r', '.r.r.r....r.r.r.'],
  ],
  gooking: [
    ['....y..yy..y....', '....yyyyyyyy....', '....yRyyyyRy....', '...gggggggggg...', '..ggGGgggggggg..', '.ggGggggggggggg.',
      '.ggggKKggKKgggg.', 'gggggKKggKKggggg', 'gggggggggggggggg', 'ggggMMMMMMMMgggg', 'gggggMMMMMMggggg', 'gggggggggggggggg', '.gggggggggggggg.', '..gggg.gg.gggg..'],
  ],
  yeti: [
    ['....wwwwww....', '...wwwwwwww...', '..wwbbbbbbww..', '..wwbBbbBbww..', '..wwbbbbbbww..', '...wwwwwwww...', '.wwwwwwwwwwww.',
      'wwwwmmmmmmwwww', 'ww.wmllllmw.ww', 'ww.wmmmmmmw.ww', 'mm.wwwwwwww.mm', 'mm.wwwwwwww.mm', '...www..www...', '...www..www...', '..mmmm..mmmm..'],
    ['....wwwwww....', '...wwwwwwww...', '..wwbbbbbbww..', '..wwbBbbBbww..', '..wwbbbbbbww..', '...wwwwwwww...', '.wwwwwwwwwwww.',
      'wwwwmmmmmmwwww', 'ww.wmllllmw.ww', 'ww.wmmmmmmw.ww', 'mm.wwwwwwww.mm', 'mm.wwwwwwww.mm', '...www..www...', '..mmmm..www...', '.......mmmm...'],
  ],
  sawtank: [
    ['......MMMM......', '....MMmmmmMM....', '...MmmmeEmmmM...', '..MmmmmmmmmmmM..', 'MMMMMMMMMMMMMMMM', 'mmmmmmmmmmmmmmmm',
      'mllllllllllllllm', 'mmaammaammaammmm', 'mmmmmmmmmmmmmmmm', 'TtTtTtTtTtTtTtTt', 'tTtTtTtTtTtTtTtT', '.TtTtTtTtTtTtTt.'],
    ['......MMMM......', '....MMmmmmMM....', '...MmmmeEmmmM...', '..MmmmmmmmmmmM..', 'MMMMMMMMMMMMMMMM', 'mmmmmmmmmmmmmmmm',
      'mllllllllllllllm', 'mmaammaammaammmm', 'mmmmmmmmmmmmmmmm', 'tTtTtTtTtTtTtTtT', 'TtTtTtTtTtTtTtTt', '.tTtTtTtTtTtTtT.'],
  ],
  honk: [
    ['.....gggggggg.....', '....ggwwwwwwgg....', '....gwwwwGGwwg....', '....gwwwwwwoooo...', '....ggwwwwwwgg....', '...MMMMMMMMMMMM...',
      '..MmmmmmmmmmmmmM..', 'MMmmlmmmmmmmmlmmMM', 'MmmmmmmeEEemmmmmmM', 'MmmMMmmmmmmmmMMmmM', 'Mm..MmmmmmmmmM..mM', 'aa..MmmmmmmmmM..aa',
      'aa..MMMMMMMMMM..aa', '....mmm....mmm....', '....mmm....mmm....', '...MMMM....MMMM...'],
    ['.....gggggggg.....', '....ggwwwwwwgg....', '....gwwwwGGwwg....', '....gwwwwwwoooo...', '....ggwwwwwwgg....', '...MMMMMMMMMMMM...',
      '..MmmmmmmmmmmmmM..', 'MMmmlmmmmmmmmlmmMM', 'MmmmmmmeEEemmmmmmM', 'MmmMMmmmmmmmmMMmmM', 'Mm..MmmmmmmmmM..mM', 'aa..MmmmmmmmmM..aa',
      'aa..MMMMMMMMMM..aa', '....mmm....mmm....', '...MMMM....mmm....', '...........MMMM...'],
  ],
};
const ENEMY_PAL = {
  bolt: {}, saw: {}, tank: { T: '#3d3a52', t: '#5a5872' }, drone: { p: '#d5dbe6' },
  boom: { k: '#3d3a52', l: '#6c6888', e: '#ff3b5c', s: '#ffd23f', S: '#ff8c1a', f: '#c9a26b' },
  goo: { g: '#7ee04a', G: '#c3ff9a', K: OUT, M: '#2f6b1a' }, minigoo: { g: '#7ee04a', K: OUT },
  crab: { r: '#e8343b', R: '#ff8a80', M: '#7a1f24', e: '#fff3b0' },
  gooking: { g: '#7ee04a', G: '#c3ff9a', K: OUT, M: '#2f6b1a', y: '#ffd23f', R: '#e8343b' },
  yeti: { w: '#f4f7ff', b: '#2f7fe0', B: '#bde6ff', m: '#9aa3b5', l: '#5ec8ff' },
  sawtank: { T: '#3d3a52', t: '#5a5872' },
  honk: { g: '#bde6ff', w: '#f4f4f4', G: '#ffd23f', o: '#ff9f1c', m: '#a07ad6', M: '#5b3f8f', l: '#d7c2ff', e: '#ff3b5c', E: '#fff3b0', a: '#ffd23f' },
};
const enemyCache = new Map();
function enemySprite(type, frame, tint) {
  const key = type + frame + (tint ? tint.m : '');
  let s = enemyCache.get(key);
  if (!s) {
    const frames = ENEMY_ART[type];
    const rows = frames[frame % frames.length];
    s = spr(rows, Object.assign({}, BOT_BASE, tint || {}, ENEMY_PAL[type] || {}));
    enemyCache.set(key, s);
  }
  return s;
}

// ================================================================ items, pickups, icons
const ART = {
  heart: spr(['.hh.hh.', 'hHhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'], { h: '#ff4d6d', H: '#ffc2d1' }),
  magnet: spr(['.rrrrr.', 'rr...rr', 'rr...rr', 'rr...rr', 'ww...ww'], { r: '#e8343b', w: '#dde3ea' }),
  sauce: spr(['..k..', '.ttt.', '..r..', '.rrr.', 'rrrrr', 'rwwwr', 'rwrwr', 'rrrrr', '.rrr.'], { k: '#ffd23f', t: '#2f9e44', r: '#e8343b', w: '#fff8e7' }),
  goldegg: spr(['..yy..', '.yYyy.', 'yYyyyy', 'yyyyyy', 'yyyyyy', '.yyyy.'], { y: '#ffd23f', Y: '#fff8e7' }),
  gem: [
    spr(['.b.', 'bBb', '.b.'], { b: '#3fa7ff', B: '#c9ecff' }),
    spr(['.g.', 'gGg', 'gGg', '.g.'], { g: '#51cf66', G: '#d3f9d8' }),
    spr(['..p..', '.pPp.', 'pPPPp', '.pPp.', '..p..'], { p: '#ff4dc4', P: '#ffd1f1' }),
  ],
  bread: spr(['.bbb.', 'bBbBb', 'bbbbb'], { b: '#d9902f', B: '#ffd39a' }),
  eggOrb: spr(['.ww.', 'wwww', 'wwwh', '.ww.'], { w: '#fff8e7', h: '#ffd23f' }),
  note: spr(['.kk', '..k', '..k', 'kkk', 'kk.'], { k: '#fff8e7' }, OUT),
  tinyHeart: spr(['h.h', 'hhh', '.h.'], { h: '#ff6fae' }),
  leaf: spr(['.g', 'gg', 'g.'], { g: '#7ac74f' }, null),
  lock: spr(['.kkk.', 'k...k', 'yyyyy', 'yykyy', 'yyyyy'], { k: '#c3c2d4', y: '#ffd23f' }),
  gear: spr(['.m.m.', 'mmmmm', '.m.m.', 'mmmmm', '.m.m.'], { m: '#9aa3b5' }, null),
  bolt: spr(['mm', 'm.'], { m: '#c3c2d4' }, null),
  // chests: lid + base so the lid can fly open
  chest: {
    wood: { lid: spr(['..bbbbbbbbbbbb..', '.bBBBBBBBBBBBBb.', 'bBBBBBBBBBBBBBBb', 'bggggggyyggggggb'], { b: '#5c3416', B: '#a0642d', g: '#ffd23f', y: '#fff3b0' }),
      base: spr(['bggggggKKggggggb', 'bBBBBBBKKBBBBBBb', 'bBBBBBBBBBBBBBBb', 'bBBBBBBBBBBBBBBb', 'bggggggggggggggb', 'bbbbbbbbbbbbbbbb'], { b: '#5c3416', B: '#a0642d', g: '#ffd23f', K: '#3d3a52' }) },
    gold: { lid: spr(['..bbbbbbbbbbbb..', '.bBBBBBBBBBBBBb.', 'bBBBBYBBBBYBBBBb', 'bggggggyyggggggb'], { b: '#b07a00', B: '#ffd23f', Y: '#fff3b0', g: '#e8343b', y: '#ff9aa2' }),
      base: spr(['bggggggKKggggggb', 'bBBBBBBKKBBBBBBb', 'bBYBBBBBBBBBBYBb', 'bBBBBBBBBBBBBBBb', 'bggggggggggggggb', 'bbbbbbbbbbbbbbbb'], { b: '#b07a00', B: '#ffd23f', Y: '#fff3b0', g: '#e8343b', K: '#3d3a52' }) },
  },
};
const ICON = {
  rapid: spr(['y..y..', '.y..y.', '..y..y', '.y..y.', 'y..y..'], { y: '#ffd23f' }),
  power: spr(['.rrr.', 'rRrrr', 'rrrrr', 'rrrrr', '.rrr.'], { r: '#ff8c1a', R: '#fff3b0' }),
  spread: spr(['....y.', '.y....', 'yy..yy', '.y....', '....y.'], { y: '#ffd23f' }),
  pierce: spr(['..b...', '..bb..', 'bbbbbb', '..bb..', '..b...'], { b: '#5ec8ff' }),
  egg: ART.eggOrb, bread: ART.bread,
  zap: spr(['...yy', '..yy.', '.yyyy', '..yy.', '.yy..', 'yy...'], { y: '#fff36b' }),
  quack: spr(['.yyy..o', 'yyKyoo.', '.yyy..o', '..yy...'], { y: '#ffd23f', o: '#ff9f1c', K: OUT }),
  speed: spr(['..www', '.wwww', 'www..', 'ww...', 'w....'], { w: '#c9ecff' }),
  heart: ART.heart, magnet: ART.magnet,
  regen: spr(['..g..', '..g..', 'ggggg', '..g..', '..g..'], { g: '#51cf66' }),
  dash: spr(['w..ww.', '.wwwww', 'w..ww.'], { w: '#ff6fae' }),
  snack: spr(['.bbb.', 'bBbBb', 'bbbbb'], { b: '#d9902f', B: '#ffd39a' }),
  tabSkin: spr(['.yyy.', 'yyKyo', 'yyyyy', '.yyy.'], { y: '#ffd23f', o: '#ff9f1c', K: OUT }),
  tabHat: spr(['.kkk.', '.kkk.', '.rrr.', 'kkkkk'], { k: '#5a5872', r: '#e8343b' }),
  tabHalo: spr(['.yyy.', 'y...y', '.yyy.'], { y: '#ffd23f' }),
  tabTrail: spr(['y...', '.w.p', '..w.', 'p..y'], { y: '#ffd23f', w: '#fff8e7', p: '#ff6fae' }, null),
  tabWeapon: spr(['.mmmmc', 'mmmm..', 'mm....'], { m: '#c3c2d4', c: '#5ec8ff' }),
  play: spr(['w...', 'ww..', 'www.', 'ww..', 'w...'], { w: '#fff8e7' }),
  back: spr(['..w', '.ww', 'www', '.ww', '..w'], { w: '#fff8e7' }),
  locker: spr(['mmmm', 'mllm', 'mmmm', 'mllm', 'mmmm'], { m: '#9aa3b5', l: '#5a5872' }),
  chestIcon: spr(['.bbbb.', 'bggggb', 'bBkkBb', 'bBBBBb'], { b: '#5c3416', B: '#a0642d', g: '#ffd23f', k: '#3d3a52' }),
};

// ================================================================ worlds: ground tiles + decorations
const WORLD_THEME = {
  pond: { ground: ['#5bb450', '#4a9a43', '#74c862'], style: 'grass', edge: 'water', e1: '#2f6fb3', e2: '#4f95d8', shore: '#e9cf8a', shoreD: '#c9ab66', tint: null,
    deco: { flowerP: 5, flowerW: 4, flowerB: 3, bush: 3, rock: 2, mush: 1, cattail: 2 }, tall: { tree: 1 }, sky: '#8fd3ff' },
  woods: { ground: ['#3f8a4a', '#2f6e3a', '#56a35e'], style: 'grass', edge: 'water', e1: '#1f4f6b', e2: '#2f6f8f', shore: '#6b5a3a', shoreD: '#4a3d27', tint: { m: '#8fa37a', M: '#566a4a', l: '#c4d6a8' },
    deco: { mush: 4, fern: 5, stump: 2, rock: 2, flowerW: 2 }, tall: { tree: 4, bigtree: 2 }, sky: '#5f8f7a' },
  peaks: { ground: ['#e8f1ff', '#c9dbf2', '#ffffff'], style: 'snow', edge: 'water', e1: '#5aa8d8', e2: '#9fd3ff', shore: '#bcd7ee', shoreD: '#8fb3d4', tint: { m: '#9fd3ff', M: '#4f86b8', l: '#e3f4ff' },
    deco: { snowrock: 4, crystal: 3, rock: 2 }, tall: { pine: 4 }, sky: '#bde6ff' },
  factory: { ground: ['#4a4658', '#3b3848', '#5d596e'], style: 'plate', edge: 'lava', e1: '#e8343b', e2: '#ff8c1a', shore: '#2b2438', shoreD: '#1b1325', tint: { m: '#c97b4a', M: '#7a3d22', l: '#f2b48a' },
    deco: { boltpile: 4, oil: 3, hazard: 2 }, tall: { crate: 3, barrel: 3 }, sky: '#3a1f2a' },
  tower: { ground: ['#3b2a5c', '#2f2149', '#4b3a72'], style: 'lab', edge: 'void', e1: '#120c1f', e2: '#2a1b45', shore: '#5b3f8f', shoreD: '#3b2a5c', tint: { m: '#a07ad6', M: '#5b3f8f', l: '#d7c2ff' },
    deco: { goo: 3, cable: 3, boltpile: 2 }, tall: { vat: 3, console: 2 }, sky: '#1d1233' },
};
const DECO_ART = {
  flowerP: spr(['.p.', 'pyp', '.p.'], { p: '#ff6fae', y: '#ffd23f' }, null),
  flowerW: spr(['.w.', 'wyw', '.w.'], { w: '#fff8e7', y: '#ffd23f' }, null),
  flowerB: spr(['.b.', 'byb', '.b.'], { b: '#7ab8ff', y: '#ffd23f' }),
  bush: spr(['.ggg.', 'ggGgg', 'gGggG'], { g: '#3f8f3a', G: '#6fd06a' }),
  rock: spr(['.rr.', 'rRrr', 'rrrr'], { r: '#8b8aa0', R: '#c3c2d4' }),
  mush: spr(['.RRR.', 'RwRwR', '..s..', '..s..'], { R: '#e8343b', w: '#fff8e7', s: '#f2e3c6' }),
  cattail: spr(['.b.b', '.b.b', 'gb.b', 'g.gg', 'g.g.'], { b: '#7a4a24', g: '#3f8f3a' }),
  fern: spr(['g.g.g', '.ggg.', 'g.g.g', '..g..'], { g: '#2f7a3a' }, null),
  stump: spr(['.bbbb.', 'bBBBBb', 'bbbbbb', 'b.bb.b'], { b: '#6b4423', B: '#c9a26b' }),
  snowrock: spr(['.ww.', 'wwww', 'rrrr', 'rRrr'], { w: '#ffffff', r: '#8fb3d4', R: '#c9dbf2' }),
  crystal: spr(['.c.', 'cCc', 'cCc', '.c.'], { c: '#5ec8ff', C: '#e3f4ff' }),
  boltpile: spr(['m.m', '.mm', 'mm.'], { m: '#8b8aa0' }, null),
  oil: spr(['.kkk.', 'kkKkk', '.kkk.'], { k: '#1b1325', K: '#3d3a52' }, null),
  hazard: spr(['ykykyk', 'kykyky'], { y: '#ffd23f', k: '#2b2438' }, null),
  goo: spr(['.ggg.', 'gGggg', '.ggg.'], { g: '#7ee04a', G: '#c3ff9a' }, null),
  cable: spr(['k...', '.k..', '..kk', '...k'], { k: '#5ec8ff' }, null),
  // tall (y-sorted with actors)
  tree: spr(['...gggg...', '.gggGggg..', 'ggGggggGgg', 'gggggGgggg', 'gGggggggGg', '.gggggggg.', '...gbbg...', '....bb....', '....bb....', '...bbbb...'],
    { g: '#3f8f3a', G: '#6fd06a', b: '#7a4a24' }),
  bigtree: spr(['....gggggg....', '..ggggGggggg..', '.gGgggggggGgg.', 'ggggggGggggggg', 'gGgggggggggGgg', 'ggggGgggggggg.', '.gggggggGggg..',
    '..ggggggggg...', '.....bbb......', '.....bbb......', '.....bbb......', '....bbbbb.....', '...bb...bb....'],
  { g: '#2f6e3a', G: '#56a35e', b: '#5c3416' }),
  pine: spr(['....w....', '...www...', '...gwg...', '..wgggw..', '..ggwgg..', '.wgggggw.', '.gggwggg.', 'wgggggggw', '....b....', '....b....'],
    { g: '#2f6e3a', w: '#ffffff', b: '#5c3416' }),
  crate: spr(['bbbbbbbb', 'bBbbbbBb', 'bbBbbBbb', 'bbbBBbbb', 'bbBbbBbb', 'bBbbbbBb', 'bbbbbbbb'], { b: '#a0642d', B: '#5c3416' }),
  barrel: spr(['.rrrr.', 'rrrrrr', 'kkkkkk', 'ryyyrr', 'rykyrr', 'kkkkkk', 'rrrrrr', '.rrrr.'], { r: '#e8343b', k: '#7a1f24', y: '#ffd23f' }),
  vat: spr(['.mmmmmm.', 'mggggggm', 'mgGggggm', 'mggggGgm', 'mggggggm', 'mgGggggm', 'mmmmmmmm', 'm.m..m.m'], { m: '#5b3f8f', g: '#7ee04a', G: '#c3ff9a' }),
  console: spr(['mmmmmmmm', 'mssssssm', 'msSsssSm', 'mssssssm', 'mmmmmmmm', 'mrygbmmm', 'mmmmmmmm'], { m: '#5b3f8f', s: '#2b2438', S: '#5ec8ff', r: '#e8343b', y: '#ffd23f', g: '#51cf66', b: '#5ec8ff' }),
};
const tileCache = new Map();
function groundTile(world) {
  if (tileCache.has(world)) return tileCache.get(world);
  const th = WORLD_THEME[world], [base, dark, light] = th.ground;
  const S = 96, c = mkCanvas(S, S), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  if (th.style === 'grass' || th.style === 'snow') {
    for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, Math.random() < 0.3 ? 2 : 1); }
    if (th.style === 'grass') for (let i = 0; i < 14; i++) { const x = rint(1, S - 4), y = rint(1, S - 3); g.fillStyle = dark; g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 3); }
    else for (let i = 0; i < 10; i++) { g.fillStyle = '#ffffff'; g.fillRect(rint(0, S - 3), rint(0, S - 2), rint(2, 4), 1); }
  } else if (th.style === 'plate') {
    for (let y = 0; y < S; y += 24) for (let x = 0; x < S; x += 32) {
      g.fillStyle = dark; g.fillRect(x, y, 32, 1); g.fillRect(x, y, 1, 24);
      g.fillStyle = light; g.fillRect(x + 1, y + 1, 31, 1);
      g.fillStyle = light; g.fillRect(x + 3, y + 3, 1, 1); g.fillRect(x + 28, y + 3, 1, 1); g.fillRect(x + 3, y + 20, 1, 1); g.fillRect(x + 28, y + 20, 1, 1);
    }
    for (let i = 0; i < 40; i++) { g.fillStyle = dark; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
  } else if (th.style === 'sand') {
    for (let i = 0; i < 300; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
    for (let i = 0; i < 6; i++) { const x = rint(2, S - 6), y = rint(2, S - 3); g.fillStyle = dark; g.fillRect(x, y, 4, 1); g.fillRect(x + 1, y + 1, 3, 1); } // ripples
    for (let i = 0; i < 4; i++) { g.fillStyle = Math.random() < 0.5 ? '#fff3dc' : '#ff9ccb'; g.fillRect(rint(0, S - 2), rint(0, S - 2), 2, 1); } // tiny shells
  } else if (th.style === 'cloud') {
    for (let i = 0; i < 18; i++) { const x = rint(0, S), y = rint(0, S), r = rint(4, 9); g.fillStyle = light; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = dark; g.fillRect(x - r + 2, y + r - 1, r * 2 - 4, 1); }
    for (let i = 0; i < 6; i++) { g.fillStyle = '#ffe0f0'; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
  } else if (th.style === 'moon') {
    for (let i = 0; i < 240; i++) { g.fillStyle = Math.random() < 0.5 ? dark : light; g.fillRect(rint(0, S - 1), rint(0, S - 1), 1, 1); }
    for (let i = 0; i < 7; i++) { // craters: dark bowl with a lit rim
      const x = rint(6, S - 6), y = rint(6, S - 6), r = rint(2, 5);
      g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = light; g.fillRect(x - r + 1, y + r, r * 2 - 1, 1);
    }
  } else if (th.style === 'lab') {
    for (let y = 0; y < S; y += 16) for (let x = 0; x < S; x += 16) {
      g.fillStyle = ((x + y) / 16) % 2 ? dark : base; g.fillRect(x, y, 16, 16);
      g.fillStyle = light; g.fillRect(x, y, 16, 1); g.fillRect(x, y, 1, 16);
    }
    g.fillStyle = 'rgba(94,200,255,0.35)'; g.fillRect(0, 47, S, 1); g.fillRect(47, 0, 1, S);
  }
  tileCache.set(world, c);
  return c;
}
const edgeCache = new Map();
function edgeTile(world) {
  if (edgeCache.has(world)) return edgeCache.get(world);
  const th = WORLD_THEME[world];
  const c = mkCanvas(32, 32), g = c.getContext('2d');
  g.fillStyle = th.e1; g.fillRect(0, 0, 32, 32);
  g.fillStyle = th.e2;
  if (th.edge === 'void') { for (let i = 0; i < 5; i++) { g.fillStyle = Math.random() < 0.5 ? '#fff8e7' : '#9d5cff'; g.fillRect(rint(0, 31), rint(0, 31), 1, 1); } }
  else if (th.edge === 'sky') { g.fillStyle = th.e2; g.fillRect(rint(0, 22), rint(4, 26), 8, 2); g.fillRect(rint(0, 24), rint(4, 26), 6, 2); }
  else for (let i = 0; i < 6; i++) g.fillRect(rint(0, 28), rint(0, 30), 4, 1);
  edgeCache.set(world, c);
  return c;
}

// ================================================================ drawing a fully customised duck
// x, y = feet. o: { skin, hat, halo, weapon, facing: 'left'|'right'|'up'|'down', frame, blink, aim (radians),
//                   sx, sy, sc, white, alpha, t }
function drawDuck(x, y, o) {
  const set = duckSet(o.skin || 'classic');
  const view = o.facing === 'up' ? 'up' : o.facing === 'down' ? 'down' : 'side';
  const flip = o.facing === 'left';
  const body = set[view][o.blink ? 1 : 0][o.frame || 0];
  const sc = o.sc || 1, sx = (o.sx || 1) * sc, sy = (o.sy || 1) * sc;
  const w = body.w * sx, h = body.h * sy;
  const left = x - w / 2, top = y - h;
  const t = o.t || 0;
  const fx = SKIN_FX[o.skin];
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * (o.alpha === undefined ? 1 : o.alpha) * (fx === 'ghost' ? 0.72 : 1);
  const headX = left + 7 * sx, headTop = top + 1 * sy;
  const hatInfo = o.hat && o.hat !== 'none' ? HAT_ART[o.hat] : null;
  const hv = hatInfo ? (view === 'side' ? hatInfo.side || hatInfo.front : view === 'up' ? hatInfo.up || hatInfo.front : hatInfo.front) : null;
  const hatAbove = hv ? Math.max(0, hv.rows.length - hv.y - 1) : 0;
  const haloY = headTop - (hatAbove + 3) * sy - 2 * sc + Math.sin(t * 3) * sc;
  if (o.halo && o.halo !== 'none') drawHalo(o.halo, headX, haloY, sc, t, 'back');
  if (o.weapon && view === 'up') drawGun(o.weapon, x - 4 * sx, y - 6 * sy, o.aim || 0, sc);
  if (fx === 'glow') pellipse(x, y - h / 2, w * 0.6, h * 0.55, 'rgba(125,255,245,0.12)');
  drawSprX(body, x, y, { flip, white: o.white, sx, sy, ax: 0.5, ay: 1 });
  if (hv) {
    const hs = hv.frames ? hv.frames[Math.floor(t * 12) % hv.frames.length] : hv.spr;
    let hx = hv.x;
    if (flip) hx = body.w - (hv.x + hs.w);
    const hy = hv.y + 1 - hv.rows.length;
    const mo = hatMotion(o.hat, t); // every hat sways and bobs, like the wizard hat always did
    const hxp = left + (hx + mo.dx) * sx, hyp = top + (hy + mo.dy) * sy;
    drawSprX(hs, hxp, hyp, { flip, white: o.white, sx, sy, ax: 0, ay: 0 });
    if (o.sparkle && !o.white && Math.random() < HAT_SPARKLE) o.sparkle(hxp + hs.w * sx * rand(0.15, 0.85), hyp + rand(0, 2) * sy, hatSpark(o.hat));
    hatExtras(hatInfo.fx, hxp, hyp, hs.w * sx, t, sc);
  }
  if (o.weapon && view !== 'up') {
    const hx2 = view === 'side' ? x + (flip ? -3 : 3) * sx : x + 4 * sx;
    drawGun(o.weapon, hx2, y - 5 * sy, o.aim === undefined ? (flip ? Math.PI : 0) : o.aim, sc);
  }
  if (o.halo && o.halo !== 'none') drawHalo(o.halo, headX, haloY, sc, t, 'front');
  if (fx === 'gold' && Math.random() < 0.08 && o.sparkle) o.sparkle(x + rand(-w / 2, w / 2), y - rand(0, h));
  if (fx === 'lava' && Math.random() < 0.1 && o.ember) o.ember(x + rand(-w / 3, w / 3), y - rand(2, h * 0.6));
  ctx.globalAlpha = a0;
}
// ---------------------------------------------------------------- hat animation
const HAT_SPARKLE = 0.05;                     // chance per frame that a hat throws a sparkle
const HAT_MOTION = {                          // amp / speed / bob of the sway, per hat
  wizard: { amp: 0.7, sp: 2.2 }, bandana_r: { amp: 0.8, sp: 6 }, bandana_b: { amp: 0.8, sp: 6 }, beanie: { amp: 0.3, sp: 4, bob: 0.6 },
  party: { amp: 0.9, sp: 5 }, cap: { amp: 0.2, sp: 2 }, tophat: { amp: 0.2, sp: 2.5 }, crown: { amp: 0.2, sp: 2 }, cowboy: { amp: 0.3, sp: 2, bob: 0.4 },
  flower: { amp: 0.5, sp: 2 }, bow: { amp: 0.6, sp: 7 }, pirate: { amp: 0.3, sp: 3, bob: 0.3 }, chef: { amp: 0.25, sp: 3 }, viking: { amp: 0.25, sp: 2.5 },
  propeller: { amp: 0, sp: 0 }, catears: { amp: 0.9, sp: 2.4 }, headphones: { amp: 0.4, sp: 3 },
};
const HAT_SPARK = {
  wizard: ['#ffd23f', '#c9a6ff', '#fff8e7'], crown: ['#ffd23f', '#fff8e7'], bandana_r: ['#ff6b6b'], bandana_b: ['#5ec8ff'],
  beanie: ['#bde6ff'], party: ['#ff6fae', '#ffd23f', '#5ec8ff'], tophat: ['#fff8e7'], cowboy: ['#c9a26b'], pirate: ['#fff8e7'],
  chef: ['#ffffff'], viking: ['#bde6ff'], propeller: ['#ffffff'], catears: ['#ff6fae'], bow: ['#ffb3d9'], headphones: ['#9d5cff'],
  cap: ['#fff8e7'], flower: ['#ff6fae', '#fff3b0'],
};
function hatMotion(id, t) {
  const m = HAT_MOTION[id] || { amp: 0.4, sp: 3 };
  return { dx: Math.sin(t * m.sp) * m.amp, dy: m.bob ? -Math.abs(Math.sin(t * m.sp * 0.5)) * m.bob : 0 };
}
function hatSpark(id) { const c = HAT_SPARK[id] || ['#fff8e7']; return pick(c); }
// signature bits: a twinkling crown gem, floating music notes, chef steam
function hatExtras(fx, x, y, w, t, sc) {
  if (!fx) return;
  if (fx === 'shine') { const gx = x + (Math.floor(t * 5) % 7 + 1) * (w / 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(gx), Math.round(y + 2 * sc), Math.max(1, Math.round(sc)), Math.max(1, Math.round(sc))); }
  else if (fx === 'notes') { const k = (t % 1.6) / 1.6; drawSprX(ART.note, x + w / 2 + Math.sin(t * 3) * 3 * sc, y - k * 12 * sc - 2, { alpha: 1 - k, sc: sc * 0.9 }); }
  else if (fx === 'steam') { const k = (t % 1.2) / 1.2; pcirc(x + w / 2 + Math.sin(t * 4) * 2 * sc, y - k * 10 * sc, (1 + k) * sc, `rgba(255,255,255,${(0.5 * (1 - k)).toFixed(2)})`); }
}
function drawGun(id, x, y, ang, sc = 1) {
  const s = GUN_ART[id] || GUN_ART.blaster;
  drawSprX(s, x, y, { rot: ang, flipY: Math.cos(ang) < 0, sc, ax: 0.15, ay: 0.5 });
}
const RAINBOW = ['#ff4d6d', '#ff8c1a', '#ffd23f', '#51cf66', '#5ec8ff', '#9d5cff'];
function drawHalo(id, x, y, sc, t, layer) {
  const rx = 5 * sc, ry = 1.6 * sc;
  const ringFront = (col, th = sc) => { // only the front half of the ring (lower arc) goes in front of the head
    const n = 28;
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, front = Math.sin(a) > 0;
      if ((layer === 'front') !== front) continue;
      ctx.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), th, th);
    }
  };
  if (id === 'gold') { ringFront(OUT, sc + 1); ringFront('#ffd23f'); }
  else if (id === 'angel') {
    if (layer === 'back') pellipse(x, y, rx + 2 * sc, ry + 2 * sc, 'rgba(200,240,255,0.25)');
    ringFront(OUT, sc + 1); ringFront('#e3f4ff');
  } else if (id === 'rainbow') {
    const n = 30;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, front = Math.sin(a) > 0;
      if ((layer === 'front') !== front) continue;
      ctx.fillStyle = RAINBOW[Math.floor(i / n * 6 + t * 8) % 6];
      ctx.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), sc + 1, sc + 1);
    }
  } else if (id === 'fire') {
    ringFront('#e8343b', sc + 1); ringFront('#ffd23f');
    if (layer === 'front') for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + t * 2, fh = (2 + Math.sin(t * 15 + i * 2) * 1.5) * sc;
      ctx.fillStyle = i % 2 ? '#ff8c1a' : '#ffd23f';
      ctx.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry - fh), sc, Math.round(fh));
    }
  } else if (id === 'stars' || id === 'hearts') {
    for (let i = 0; i < 3; i++) {
      const a = t * 2.4 + i * TAU / 3, front = Math.sin(a) > 0;
      if ((layer === 'front') !== front) continue;
      const px = x + Math.cos(a) * (rx + 2 * sc), py = y + 4 * sc + Math.sin(a) * (ry + 1.5 * sc);
      if (id === 'hearts') drawSpr(ART.tinyHeart, px, py, false, false, sc);
      else { ctx.fillStyle = OUT; ctx.fillRect(Math.round(px - sc), Math.round(py - sc), sc * 3, sc * 3); ctx.fillStyle = '#ffd23f'; ctx.fillRect(Math.round(px - sc), Math.round(py), sc * 3, sc); ctx.fillRect(Math.round(px), Math.round(py - sc), sc, sc * 3); }
    }
  } else if (id === 'lightning') {
    ringFront(OUT, sc + 1); ringFront('#5ec8ff');
    if (layer === 'front' && Math.random() < 0.5) {
      const a = rand(0, TAU), x0 = x + Math.cos(a) * rx, y0 = y + Math.sin(a) * ry;
      pline(x0, y0, x0 + rand(-4, 4) * sc, y0 - rand(2, 5) * sc, '#fff8e7');
    }
  } else if (id === 'void') {
    if (layer === 'back') pellipse(x, y, rx + sc, ry + sc, 'rgba(20,6,40,0.6)');
    ringFront('#9d5cff', sc + 1); ringFront('#1b1325');
  }
}
// small preview of a trail for the locker grid
function drawTrailIcon(id, x, y, t) {
  const cols = { sparkle: ['#fff8e7', '#ffd23f'], bubbles: ['#bde6ff'], fire: ['#ff8c1a', '#ffd23f', '#e8343b'], rainbow: RAINBOW, leaves: ['#7ac74f'], ghost: ['#bdb6d8'] }[id];
  if (id === 'hearts') { drawSpr(ART.tinyHeart, x - 3, y + 1); drawSpr(ART.tinyHeart, x + 3, y - 3); return; }
  if (id === 'notes') { drawSpr(ART.note, x - 2, y); drawSpr(ART.note, x + 4, y - 3); return; }
  if (id === 'bubbles') { pring(x - 3, y + 1, 2, '#bde6ff'); pring(x + 3, y - 2, 3, '#bde6ff'); return; }
  if (id === 'rainbow') { for (let i = 0; i < 6; i++) { ctx.fillStyle = RAINBOW[i]; ctx.fillRect(x - 7, y - 3 + i, 14, 1); } return; }
  if (id === 'ghost') { const s = duckSet('ghost').side[0][0]; drawSprX(s, x + 2, y + 3, { alpha: 0.35, ay: 0.7 }); drawSprX(s, x - 2, y + 3, { alpha: 0.6, ay: 0.7 }); return; }
  if (!cols) return;
  for (let i = 0; i < 6; i++) {
    const a = i * 1.7 + t * 2;
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(Math.round(x + Math.cos(a) * 5), Math.round(y + Math.sin(a * 1.3) * 4), 1 + (i % 2), 1 + (i % 2));
  }
}
