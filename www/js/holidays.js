'use strict';
/* QUACK ATTACK! — more events the admin can switch on and off (admin tab -> EVENTS):
 *   holidays: EASTER, VALENTINE'S DAY, SUMMER and NEW YEAR, each with its own look, an event level, LIMITED items and a chest
 *   bonus events: DOUBLE COINS, DOUBLE XP, CHEST SALE (half price) and the ADMIN SALE (admin items in the shop) */

// ================================================================ helpers
// a chest in any colours, from the wooden chest's shape: b border, B body, g band, y shine, K lock
function eventChest(pal) {
  return {
    lid: spr(['..bbbbbbbbbbbb..', '.bBBBBBBBBBBBBb.', 'bBBBBBBBBBBBBBBb', 'bggggggyyggggggb'], pal),
    base: spr(['bggggggKKggggggb', 'bBBBBBBKKBBBBBBb', 'bBBBBBBBBBBBBBBb', 'bBBBBBBBBBBBBBBb', 'bggggggggggggggb', 'bbbbbbbbbbbbbbbb'], Object.assign({ K: '#3d3a52' }, pal)),
  };
}
// a boss from another world in new colours, with a new name
function eventBoss(id, from, name, pal, extra) {
  ENEMY_ART[id] = ENEMY_ART[from];
  ENEMY_PAL[id] = Object.assign({}, ENEMY_PAL[from], pal);
  BOSSES[id] = Object.assign({}, BOSSES[from], { name }, extra);
}
// little things floating up (or down) over an area: hearts, petals, confetti...
function drawFloaters(x0, y0, w, h, T, n, draw, speed = -12) {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i * 89) % w + Math.sin(T * 1.1 + i) * 5 + w) % w;
    let y = ((i * 61) % h + T * (Math.abs(speed) + (i % 5) * 3)) % h;
    if (speed < 0) y = h - y;
    draw(Math.round(x), Math.round(y0 + y), i);
  }
}
// an orbit of little shapes for halos (like the snowflakes)
function orbitHalo(n, speed, draw) {
  return ({ x, y, sc, t, layer, rx, ry }) => {
    for (let i = 0; i < n; i++) {
      const a = t * speed + i * TAU / n, front = Math.sin(a) > 0;
      if ((layer === 'front') !== front) continue;
      draw(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), sc, i, t);
    }
  };
}
const heartAt = (x, y, s, col) => { ctx.fillStyle = col; ctx.fillRect(x - s, y, s, s); ctx.fillRect(x + s, y, s, s); ctx.fillRect(x - s, y + s, s * 3, s); ctx.fillRect(x, y + 2 * s, s, s); };

// ================================================================ EASTER
PROJ_ART.carrot = spr(['oooog.', '.ooo.g'], { o: '#ff8c1a', g: '#51cf66' });
Object.assign(DECO_ART, {
  easteregg: spr(['.p.', 'pyp', 'ppp'], { p: '#c9a6ff', y: '#fff36b' }),
  bunnyS: spr(['w.w', 'w.w'], { w: '#ffffff' }),
});
eventBoss('eggking', 'gooking', 'EASTER EGG KING', { g: '#ffd1e6', G: '#fff8e7', M: '#c0609e', y: '#fff36b', R: '#5ec8ff' }, { col: '#ff9ad5', bullet: 'eggbomb', summonText: 'HAPPY EASTER! HONK!' });
const EASTER_LEVEL = { n: 'E', name: 'EGG HUNT MEADOW', world: 'pond', time: 110, diff: 4, boss: 'eggking', reward: 'bunnyears', rewardCat: 'hat', event: 'easter',
  pool: { bolt: 9, goo: 4, boom: 2, drone: 2 },
  intro: [['daisy', 'THE EASTER EGGS ARE GONE! SOMEBODY HID THEM ALL!'], ['honk', 'HONK! MY EGG KING HAS THEM! FINDERS KEEPERS!'], ['duck', 'THE EGG HUNT IS ON! QUACK!']], outro: [] };
Object.assign(SKIN_PAL, {
  chick: { h: '#fff36b', y: '#fff36b', d: '#e0c020', w: '#fffbd0', o: '#ff9f1c', f: '#ff9f1c', K: OUT, c: '#ffb3c7' },
  pastel: { h: '#c9a6ff', y: '#c9a6ff', d: '#9d7ad6', w: '#ffd1e6', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#ff9ccb' },
});
HAT_ART.bunnyears = hat({ rows: ['.ww....ww.', '.wp....pw.', '.wp....pw.', '.ww....ww.'], x: 1, y: 1 }, { w: '#ffffff', p: '#ffb3d1' });
HAT_MOTION.bunnyears = { amp: 0.6, sp: 4 };
HAT_SPARK.bunnyears = ['#ffb3d1', '#ffffff'];
HALO_FX.eggring = orbitHalo(5, 1.0, (x, y, s, i) => { ctx.fillStyle = ['#ffb3d1', '#c9a6ff', '#9fdcff', '#fff36b', '#8ff0c4'][i]; ctx.fillRect(x - s, y - s, s * 2, s * 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - s, y, s * 2, s); });
GUN_ART.carrot = spr(['..g.....', 'ooooooog', 'ook.....', 'kk......'], { o: '#ff8c1a', g: '#51cf66', k: '#5c3416' });
WEAPONS.carrot = { cd: 0.4, dmg: 13, n: 1, spread: 0.12, speed: 220, life: 0.75, r: 2, kb: 40, range: 150, col: '#ff8c1a' };
SHOT_KIND.carrot = 'carrot';
SHOT_EXTRA.carrot = { art: 'carrot', pierce: 2 };
SHOOT_SFX.carrot = p => { tone(700 * p, 0.05, 'square', 0.03, 400); noise(0.04, 0.03, 3000); };
const EA = { rarity: 'limited', event: 'easter' };
COSMETICS.skin.push(Object.assign({ id: 'chick', name: 'CHICK' }, EA), Object.assign({ id: 'pastel', name: 'PASTEL' }, EA));
COSMETICS.hat.push(Object.assign({ id: 'bunnyears', name: 'BUNNY EARS', eventReward: true }, EA));
COSMETICS.halo.push(Object.assign({ id: 'eggring', name: 'EGG RING' }, EA));
COSMETICS.weapon.push(Object.assign({ id: 'carrot', name: 'CARROT LAUNCHER', desc: 'CARROTS GO THROUGH 3 ROBOTS' }, EA));
CHESTS.easteregg = { name: 'EASTER CHEST', price: 200, odds: { limited: 100 }, event: 'easter' };
ART.chest.easteregg = eventChest({ b: '#9d7ad6', B: '#ffd1e6', g: '#8ff0c4', y: '#fff36b' });
function drawEasterTitle(gy, T) {
  ctx.fillStyle = 'rgba(255,200,230,0.18)'; ctx.fillRect(0, 0, W, H);
  [[0.22, 22], [0.36, 40], [0.52, 30], [0.7, 44], [0.9, 26]].forEach(([fx, dy], i) => drawSprX(DECO_ART.easteregg, W * fx, gy + dy + Math.round(Math.sin(T * 3 + i) * 1), { sc: 2, ay: 1 }));
  drawFloaters(0, 0, W, H, T, 18, (x, y, i) => { ctx.fillStyle = i % 2 ? '#ffb3d1' : '#ffffff'; ctx.fillRect(x, y, 2, 1); }, 10);
}
function drawEasterView(v, T) {
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawFloaters(v.x, v.y, v.w, v.h, T, 14, (x, y, i) => { ctx.fillStyle = i % 2 ? '#ffb3d1' : '#fff8e7'; ctx.fillRect(x, y, 2, 1); }, 9);
  ctx.restore();
}
EVENTS.easter = { name: 'EASTER', col: '#ff9ad5', kind: 'holiday', level: EASTER_LEVEL, song: 'candy', title: drawEasterTitle, view: drawEasterView, hat: DECO_ART.bunnyS,
  icon: DECO_ART.easteregg, chest: 'easteregg', bg: '#3b2438', btn: '#8a3f6b', tcol: '#fff36b' };

// ================================================================ VALENTINE'S DAY
PROJ_ART.heartshot = spr(['rr.rr', 'rRrrr', '.rrr.', '..r..'], { r: '#ff4d8d', R: '#ffd1e6' });
DECO_ART.heartS = spr(['r.r', 'rrr', '.r.'], { r: '#ff4d8d' });
eventBoss('lovecrab', 'crab', 'LOVE CRAB', { r: '#ff4d8d', R: '#ffb3d1', M: '#8a1f4a', e: '#fff3b0' }, { hp: 2600, col: '#ff4d8d', bullet: 'heartshot', summonText: 'BE MY VALENTINE! HONK!' });
const VALENTINE_LEVEL = { n: 'V', name: 'SWEETHEART CANDY LAND', world: 'candy', time: 110, diff: 4, boss: 'lovecrab', reward: 'heartcrown', rewardCat: 'hat', event: 'valentine',
  pool: { bolt: 8, goo: 4, boom: 3, drone: 2 },
  intro: [['daisy', "HAPPY VALENTINE'S DAY! I MADE CARDS FOR EVERYBODY!"], ['honk', 'HONK! LOVE? HOW SILLY! MY LOVE CRAB WILL PINCH EVERY CARD!'], ['duck', 'NOT ON MY WATCH! QUACK!']], outro: [] };
SKIN_PAL.lovebird = { h: '#ff8fb8', y: '#ff8fb8', d: '#d9507f', w: '#ffd1e6', o: '#ffd23f', f: '#ff4d8d', K: OUT, c: '#ff4d6d' };
HAT_ART.heartcrown = hat({ rows: ['..y..y..y.', '.yyyyyyyy.', '.yryyyyry.', '.yyyyyyyy.'], x: 1, y: 2 }, { y: '#ffd23f', r: '#ff4d8d' });
HAT_MOTION.heartcrown = { amp: 0.2, sp: 2 };
HAT_SPARK.heartcrown = ['#ff4d8d', '#ffd23f', '#ffffff'];
TRAIL_FX.roses = (T, x, y) => T.push({ x: x + rand(-3, 3), y: y - rand(1, 6), vx: rand(-6, 6), vy: rand(-10, -3), life: 0.8, max: 0.8, col: pick(['#e8343b', '#ff4d8d', '#ffb3d1']) });
TRAIL_ICON.roses = (x, y, t) => { for (let i = 0; i < 4; i++) heartAt(Math.round(x - 7 + i * 4), Math.round(y - 2 + Math.sin(t * 3 + i) * 2), 1, i % 2 ? '#ff4d8d' : '#e8343b'); };
GUN_ART.cupidbow = spr(['..b.....', '.b.r....', 'b..rrrrp', '.b.r....', '..b.....'], { b: '#c0609e', r: '#ffd1e6', p: '#ff4d8d' });
WEAPONS.cupidbow = { cd: 0.42, dmg: 12, n: 1, spread: 0.3, speed: 150, life: 1.2, r: 2, kb: 30, range: 160, col: '#ff4d8d' };
SHOT_KIND.cupidbow = 'heart';
SHOT_EXTRA.heart = { art: 'heartshot', home: true };
SHOOT_SFX.cupidbow = p => { tone(1000 * p, 0.08, 'sine', 0.04, 1500); tone(1500 * p, 0.06, 'sine', 0.02, 0, atime(0.04)); };
const VA = { rarity: 'limited', event: 'valentine' };
COSMETICS.skin.push(Object.assign({ id: 'lovebird', name: 'LOVEBIRD' }, VA));
COSMETICS.hat.push(Object.assign({ id: 'heartcrown', name: 'HEART CROWN', eventReward: true }, VA));
COSMETICS.trail.push(Object.assign({ id: 'roses', name: 'ROSE PETALS' }, VA));
COSMETICS.weapon.push(Object.assign({ id: 'cupidbow', name: "CUPID'S BOW", desc: 'HEARTS FLY TO THE ROBOTS' }, VA));
CHESTS.heartbox = { name: 'LOVE CHEST', price: 200, odds: { limited: 100 }, event: 'valentine' };
ART.chest.heartbox = eventChest({ b: '#8a1f4a', B: '#ff4d8d', g: '#ffd1e6', y: '#ffffff' });
function drawValentineTitle(gy, T) {
  ctx.fillStyle = 'rgba(255,80,140,0.14)'; ctx.fillRect(0, 0, W, H);
  drawFloaters(0, 0, W, H, T, 16, (x, y, i) => heartAt(x, y, i % 3 ? 1 : 2, i % 2 ? '#ff4d8d' : '#ffb3d1'), -14);
}
function drawValentineView(v, T) {
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawFloaters(v.x, v.y, v.w, v.h, T, 8, (x, y, i) => heartAt(x, y, 1, i % 2 ? 'rgba(255,77,141,0.7)' : 'rgba(255,179,209,0.7)'), -12);
  ctx.restore();
}
EVENTS.valentine = { name: "VALENTINE'S DAY", col: '#ff4d8d', kind: 'holiday', level: VALENTINE_LEVEL, song: 'candy', title: drawValentineTitle, view: drawValentineView, hat: DECO_ART.heartS,
  icon: PROJ_ART.heartshot, chest: 'heartbox', bg: '#3b1428', btn: '#8a1f4a', tcol: '#ffd1e6' };

// ================================================================ SUMMER
PROJ_ART.droplet = spr(['.b.', 'bBb', '.b.'], { b: '#5ec8ff', B: '#ffffff' });
DECO_ART.strawS = spr(['.y.', 'yyy'], { y: '#e8c35a' });
eventBoss('surfshark', 'shark', 'SURF SHARK', { M: '#1f6b6b', s: '#3fc1ff', S: '#fff3b0', e: '#ff8c1a' }, { hp: 2700, col: '#3fc1ff', bullet: 'droplet', summonText: 'SURF IS UP! HONK!' });
const SUMMER_LEVEL = { n: 'S', name: 'SUMMER SPLASH BEACH', world: 'beach', time: 110, diff: 4, boss: 'surfshark', reward: 'strawhat', rewardCat: 'hat', event: 'summer',
  pool: { bolt: 9, boom: 3, drone: 2, saw: 2 },
  intro: [['daisy', 'SUMMER HOLIDAYS! SUN, SAND AND... ROBOTS IN SWIMMING TRUNKS?'], ['honk', 'HONK! MY SURF SHARK RULES THIS BEACH NOW!'], ['duck', "LET'S MAKE A SPLASH! QUACK!"]], outro: [] };
SKIN_PAL.surfer = { h: '#ffd23f', y: '#3fc1ff', d: '#1f8fbf', w: '#fff8e7', o: '#ff8c1a', f: '#ff8c1a', K: OUT, c: '#ffb3a7' };
HAT_ART.strawhat = hat({ rows: ['...yyyy...', '..yyyyyy..', '..rrrrrr..', 'yyyyyyyyyy'], x: 1, y: 1 }, { y: '#e8c35a', r: '#e8343b' });
HAT_MOTION.strawhat = { amp: 0.4, sp: 2 };
TRAIL_FX.splash = (T, x, y) => T.push({ x: x + rand(-3, 3), y: y - rand(0, 4), vx: rand(-14, 14), vy: rand(-26, -10), life: 0.5, max: 0.5, col: pick(['#5ec8ff', '#bde6ff', '#ffffff']), grav: 60 });
TRAIL_ICON.splash = (x, y, t) => { for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#5ec8ff' : '#bde6ff'; ctx.fillRect(Math.round(x - 6 + i * 3), Math.round(y + 2 - Math.abs(Math.sin(t * 5 + i)) * 4), 2, 2); } };
GUN_ART.watergun = spr(['.oo.....', 'bbbbbbbw', 'bbk.....', 'kk......'], { o: '#ff8c1a', b: '#3fc1ff', w: '#ffffff', k: '#ffd23f' });
WEAPONS.watergun = { cd: 0.12, dmg: 5.5, n: 1, spread: 0.1, speed: 230, life: 0.5, r: 2, kb: 25, range: 120, col: '#5ec8ff', jitter: 0.08 };
SHOT_KIND.watergun = 'water';
SHOT_EXTRA.water = { art: 'droplet', pierce: 1 };
SHOOT_SFX.watergun = p => { if (every('wg', 0.08)) noise(0.06, 0.03, 2500, 0, null, 'bandpass'); };
const SU = { rarity: 'limited', event: 'summer' };
COSMETICS.skin.push(Object.assign({ id: 'surfer', name: 'SURFER' }, SU));
COSMETICS.hat.push(Object.assign({ id: 'strawhat', name: 'STRAW HAT', eventReward: true }, SU));
COSMETICS.trail.push(Object.assign({ id: 'splash', name: 'SPLASH' }, SU));
COSMETICS.weapon.push(Object.assign({ id: 'watergun', name: 'SUPER SOAKER', desc: 'A FAST STREAM OF WATER' }, SU));
CHESTS.cooler = { name: 'BEACH CHEST', price: 200, odds: { limited: 100 }, event: 'summer' };
ART.chest.cooler = eventChest({ b: '#1f6b8f', B: '#3fc1ff', g: '#ffffff', y: '#fff3b0' });
function drawSummerTitle(gy, T) {
  ctx.fillStyle = 'rgba(255,200,80,0.12)'; ctx.fillRect(0, 0, W, gy);
  const sx = W * 0.85, sy = H * 0.16;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(T * 0.3); ctx.fillStyle = 'rgba(255,210,63,0.25)';
  for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.fillRect(-1, 16, 3, 9); }
  ctx.restore();
  pcirc(sx, sy, 13, '#ffd23f'); pcirc(sx - 3, sy - 3, 8, '#fff36b');
  drawFloaters(0, gy, W, H - gy, T, 10, (x, y, i) => { if ((Math.floor(T * 4) + i) % 3 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 2, 1); } }, 2);
}
function drawSummerView(v, T) { ctx.fillStyle = 'rgba(255,190,80,0.08)'; ctx.fillRect(v.x, v.y, v.w, v.h); }
EVENTS.summer = { name: 'SUMMER', col: '#3fc1ff', kind: 'holiday', level: SUMMER_LEVEL, song: 'beach', title: drawSummerTitle, view: drawSummerView, hat: DECO_ART.strawS,
  icon: PROJ_ART.droplet, chest: 'cooler', bg: '#142f3b', btn: '#1f6b8f', tcol: '#fff3b0' };

// ================================================================ NEW YEAR
PROJ_ART.cracker = spr(['rrry.', 'rrr.y'], { r: '#e8343b', y: '#ffd23f' });
DECO_ART.partyS = spr(['.y.', 'pyp'], { y: '#ffd23f', p: '#ff5ce1' });
eventBoss('midnight', 'ticktock', 'MIDNIGHT CLOCK', { a: '#c9a6ff', M: '#1b1330', w: '#ffd23f', k: '#ff5ce1', m: '#51cf66' }, { hp: 3000, col: '#c9a6ff', summonText: '10! 9! 8! HONK!' });
const NEWYEAR_LEVEL = { n: 'N', name: 'COUNTDOWN CITY', world: 'neon', time: 120, diff: 5, boss: 'midnight', reward: 'partycone', rewardCat: 'hat', event: 'newyear',
  pool: { bolt: 8, boom: 4, drone: 3, saw: 2 },
  intro: [['daisy', 'IT IS ALMOST MIDNIGHT! TIME FOR FIREWORKS!'], ['honk', 'HONK! MY MIDNIGHT CLOCK WILL STOP THE NEW YEAR FROM COMING!'], ['duck', 'NOT IF WE STOP THE CLOCK FIRST! QUACK!']], outro: [] };
SKIN_PAL.disco = { h: '#d5dbe6', y: '#d5dbe6', d: '#8b8aa0', w: '#ffffff', o: '#ffd23f', f: '#ffd23f', K: OUT, c: '#ff9ccb' };
HAT_ART.partycone = hat({ rows: ['....w.....', '....p.....', '...pyp....', '...ypy....', '..pypyp...', '..ypypy...'], x: 1, y: 1 }, { w: '#ffffff', p: '#ff5ce1', y: '#ffd23f' });
HAT_MOTION.partycone = { amp: 0.6, sp: 3 };
HAT_SPARK.partycone = ['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66'];
TRAIL_FX.confetti = (T, x, y) => T.push({ x: x + rand(-4, 4), y: y - rand(2, 8), vx: rand(-10, 10), vy: rand(-16, -6), life: 0.8, max: 0.8, col: pick(['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66', '#ffffff']), grav: 30 });
TRAIL_ICON.confetti = (x, y, t) => { for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66'][(i + Math.floor(t * 5)) % 4]; ctx.fillRect(Math.round(x - 7 + i * 3), Math.round(y - 3 + (i * 5 + Math.floor(t * 6)) % 7), 2, 1); } };
HALO_FX.fireworks = orbitHalo(4, 1.4, (x, y, s, i, t) => { const k = (t * 2 + i * 0.25) % 1, r = Math.round(1 + k * 3) * s; ctx.fillStyle = ['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66'][i];
  ctx.fillRect(x - r, y, s, s); ctx.fillRect(x + r, y, s, s); ctx.fillRect(x, y - r, s, s); ctx.fillRect(x, y + r, s, s); ctx.fillRect(x, y, s, s); });
GUN_ART.firecracker = spr(['....y...', 'rrrrrry.', 'rrk.....', 'kk......'], { r: '#e8343b', y: '#ffd23f', k: '#3d3a52' });
WEAPONS.firecracker = { cd: 0.75, dmg: 20, n: 1, spread: 0.2, speed: 170, life: 0.9, r: 3, kb: 60, range: 150, aoe: 22, col: '#e8343b' };
SHOT_KIND.firecracker = 'cracker';
SHOT_EXTRA.cracker = { art: 'cracker', boom: true, cols: ['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66'] };
SHOOT_SFX.firecracker = p => { noise(0.1, 0.04, 4000, 0, null, 'highpass'); tone(500 * p, 0.08, 'square', 0.03, 900); };
const NY = { rarity: 'limited', event: 'newyear' };
COSMETICS.skin.push(Object.assign({ id: 'disco', name: 'DISCO' }, NY));
COSMETICS.hat.push(Object.assign({ id: 'partycone', name: 'PARTY HAT', eventReward: true }, NY));
COSMETICS.halo.push(Object.assign({ id: 'fireworks', name: 'FIREWORKS' }, NY));
COSMETICS.trail.push(Object.assign({ id: 'confetti', name: 'CONFETTI' }, NY));
COSMETICS.weapon.push(Object.assign({ id: 'firecracker', name: 'FIRECRACKER', desc: 'CRACKERS BANG ON THE FIRST ROBOT' }, NY));
CHESTS.partybox = { name: 'PARTY CHEST', price: 200, odds: { limited: 100 }, event: 'newyear' };
ART.chest.partybox = eventChest({ b: '#3d2f63', B: '#9d5cff', g: '#ffd23f', y: '#ff5ce1' });
// fireworks: each one shoots up, then bursts into a ring of sparks
function drawFireworks(x0, y0, w, h, T, n) {
  for (let i = 0; i < n; i++) {
    const per = 2.2 + i * 0.37, k = ((T + i * 0.71) % per) / per, x = x0 + ((i * 131) % w), top = y0 + h * (0.15 + (i * 0.13) % 0.35), col = ['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66'][i % 4];
    if (k < 0.35) { ctx.fillStyle = '#fff3b0'; ctx.fillRect(Math.round(x), Math.round(lerp(y0 + h, top, k / 0.35)), 1, 2); continue; }
    const b = (k - 0.35) / 0.65, r = b * 18;
    ctx.globalAlpha = 1 - b; ctx.fillStyle = col;
    for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(top + Math.sin(a) * r + b * b * 6), 2, 2); }
    ctx.globalAlpha = 1;
  }
}
function drawNewYearTitle(gy, T) {
  ctx.fillStyle = 'rgba(12,10,40,0.5)'; ctx.fillRect(0, 0, W, gy);
  drawFireworks(0, 0, W, gy, T, 6);
}
function drawNewYearView(v, T) {
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  drawFloaters(v.x, v.y, v.w, v.h, T, 14, (x, y, i) => { ctx.fillStyle = ['#ff5ce1', '#ffd23f', '#5ec8ff', '#51cf66'][i % 4]; ctx.fillRect(x, y, 2, 1); }, 14);
  ctx.restore();
}
EVENTS.newyear = { name: 'NEW YEAR', col: '#ffd23f', kind: 'holiday', level: NEWYEAR_LEVEL, song: 'neon', title: drawNewYearTitle, view: drawNewYearView, hat: DECO_ART.partyS,
  icon: GUN_ART.firecracker, chest: 'partybox', bg: '#2a2410', btn: '#6b4a16', tcol: '#ffd23f' };

// ================================================================ bonus events: new rules for everyone while they run
Object.assign(EVENTS, {
  doublecoins: { name: 'DOUBLE COINS', col: '#ffd23f', kind: 'bonus', desc: 'EVERY GAME PAYS TWICE THE COINS' },
  doublexp: { name: 'DOUBLE XP', col: '#5ec8ff', kind: 'bonus', desc: 'LEVEL UP TWICE AS FAST' },
  chestsale: { name: 'CHEST SALE', col: '#e8343b', kind: 'bonus', desc: 'ALL CHESTS HALF PRICE' },
  adminsale: { name: 'ADMIN SALE', col: '#ff5ce1', kind: 'bonus', desc: 'ADMIN ITEMS FOR SALE IN THE SHOP', rainbow: true },
});

// ================================================================ translations
addPhrases([
  ['EASTER', 'OSTERN', 'ПАСХА'], ['EGG HUNT MEADOW', 'EIERSUCH-WIESE', 'ЛУГ ОХОТЫ ЗА ЯЙЦАМИ'], ['EASTER EGG KING', 'OSTEREI-KÖNIG', 'КОРОЛЬ ПАСХАЛЬНЫХ ЯИЦ'], ['HAPPY EASTER! HONK!', 'FROHE OSTERN! HONK!', 'С ПАСХОЙ! ГА!'],
  ['EASTER CHEST', 'OSTERTRUHE', 'ПАСХАЛЬНЫЙ СУНДУК'], ['CHICK', 'KÜKEN', 'ЦЫПЛЁНОК'], ['PASTEL', 'PASTELL', 'ПАСТЕЛЬ'], ['BUNNY EARS', 'HASENOHREN', 'ЗАЯЧЬИ УШКИ'], ['EGG RING', 'EIER-RING', 'КОЛЬЦО ЯИЦ'],
  ['CARROT LAUNCHER', 'KAROTTENWERFER', 'МОРКОВОМЁТ'], ['CARROTS GO THROUGH 3 ROBOTS', 'KAROTTEN DURCHBOHREN 3 ROBOTER', 'МОРКОВКИ ПРОБИВАЮТ 3 РОБОТОВ'],
  ['THE EASTER EGGS ARE GONE! SOMEBODY HID THEM ALL!', 'DIE OSTEREIER SIND WEG! JEMAND HAT SIE ALLE VERSTECKT!', 'ПАСХАЛЬНЫЕ ЯЙЦА ПРОПАЛИ! КТО-ТО ИХ СПРЯТАЛ!'],
  ['HONK! MY EGG KING HAS THEM! FINDERS KEEPERS!', 'HONK! MEIN EIERKÖNIG HAT SIE! WER FINDET, DARF BEHALTEN!', 'ГА! ОНИ У МОЕГО КОРОЛЯ ЯИЦ! ЧТО НАШЁЛ - ТО МОЁ!'],
  ['THE EGG HUNT IS ON! QUACK!', 'DIE EIERSUCHE BEGINNT! QUAK!', 'ОХОТА ЗА ЯЙЦАМИ НАЧАЛАСЬ! КРЯ!'],
  ["VALENTINE'S DAY", 'VALENTINSTAG', 'ДЕНЬ ВАЛЕНТИНА'], ['SWEETHEART CANDY LAND', 'SÜSSES HERZCHENLAND', 'СЛАДКАЯ СТРАНА ЛЮБВИ'], ['LOVE CRAB', 'LIEBESKRABBE', 'ЛЮБВЕОБИЛЬНЫЙ КРАБ'],
  ['BE MY VALENTINE! HONK!', 'SEI MEIN VALENTINSSCHATZ! HONK!', 'БУДЬ МОЕЙ ВАЛЕНТИНКОЙ! ГА!'], ['LOVE CHEST', 'LIEBESTRUHE', 'СУНДУК ЛЮБВИ'], ['LOVEBIRD', 'TURTELTAUBE', 'НЕРАЗЛУЧНИК'],
  ['HEART CROWN', 'HERZKRONE', 'КОРОНА СЕРДЕЦ'], ['ROSE PETALS', 'ROSENBLÄTTER', 'ЛЕПЕСТКИ РОЗ'], ["CUPID'S BOW", 'AMORS BOGEN', 'ЛУК КУПИДОНА'], ['HEARTS FLY TO THE ROBOTS', 'HERZEN FLIEGEN ZU DEN ROBOTERN', 'СЕРДЕЧКИ ЛЕТЯТ К РОБОТАМ'],
  ["HAPPY VALENTINE'S DAY! I MADE CARDS FOR EVERYBODY!", 'FROHEN VALENTINSTAG! ICH HABE KARTEN FÜR ALLE GEMACHT!', 'С ДНЁМ ВАЛЕНТИНА! Я СДЕЛАЛА ОТКРЫТКИ ДЛЯ ВСЕХ!'],
  ['HONK! LOVE? HOW SILLY! MY LOVE CRAB WILL PINCH EVERY CARD!', 'HONK! LIEBE? WIE ALBERN! MEINE LIEBESKRABBE KLAUT JEDE KARTE!', 'ГА! ЛЮБОВЬ? КАКАЯ ГЛУПОСТЬ! МОЙ КРАБ УТАЩИТ ВСЕ ОТКРЫТКИ!'],
  ['NOT ON MY WATCH! QUACK!', 'NICHT MIT MIR! QUAK!', 'НЕ ПРИ МНЕ! КРЯ!'],
  ['SUMMER', 'SOMMER', 'ЛЕТО'], ['SUMMER SPLASH BEACH', 'SOMMER-PLANSCH-STRAND', 'ЛЕТНИЙ ПЛЯЖ'], ['SURF SHARK', 'SURF-HAI', 'АКУЛА-СЁРФЕР'], ['SURF IS UP! HONK!', 'WELLEN SIND DA! HONK!', 'ВОЛНА ПОШЛА! ГА!'],
  ['BEACH CHEST', 'STRANDTRUHE', 'ПЛЯЖНЫЙ СУНДУК'], ['SURFER', 'SURFER', 'СЁРФЕР'], ['STRAW HAT', 'STROHHUT', 'СОЛОМЕННАЯ ШЛЯПА'], ['SPLASH', 'PLATSCH', 'БРЫЗГИ'], ['SUPER SOAKER', 'WASSERSPRITZE', 'СУПЕР-ВОДОМЁТ'],
  ['A FAST STREAM OF WATER', 'EIN SCHNELLER WASSERSTRAHL', 'БЫСТРАЯ СТРУЯ ВОДЫ'],
  ['SUMMER HOLIDAYS! SUN, SAND AND... ROBOTS IN SWIMMING TRUNKS?', 'SOMMERFERIEN! SONNE, SAND UND... ROBOTER IN BADEHOSEN?', 'ЛЕТНИЕ КАНИКУЛЫ! СОЛНЦЕ, ПЕСОК И... РОБОТЫ В ПЛАВКАХ?'],
  ['HONK! MY SURF SHARK RULES THIS BEACH NOW!', 'HONK! MEIN SURF-HAI REGIERT JETZT DIESEN STRAND!', 'ГА! ТЕПЕРЬ ЭТОТ ПЛЯЖ ПРИНАДЛЕЖИТ МОЕЙ АКУЛЕ!'], ["LET'S MAKE A SPLASH! QUACK!", 'LASST ES PLATSCHEN! QUAK!', 'УСТРОИМ ВСПЛЕСК! КРЯ!'],
  ['NEW YEAR', 'NEUJAHR', 'НОВЫЙ ГОД'], ['COUNTDOWN CITY', 'COUNTDOWN-STADT', 'ГОРОД ОТСЧЁТА'], ['MIDNIGHT CLOCK', 'MITTERNACHTSUHR', 'ПОЛУНОЧНЫЕ ЧАСЫ'], ['10! 9! 8! HONK!', '10! 9! 8! HONK!', '10! 9! 8! ГА!'],
  ['PARTY CHEST', 'PARTYTRUHE', 'ПРАЗДНИЧНЫЙ СУНДУК'], ['DISCO', 'DISCO', 'ДИСКО'], ['PARTY HAT', 'PARTYHUT', 'ПРАЗДНИЧНЫЙ КОЛПАК'], ['FIREWORKS', 'FEUERWERK', 'ФЕЙЕРВЕРК'], ['CONFETTI', 'KONFETTI', 'КОНФЕТТИ'],
  ['FIRECRACKER', 'KNALLER', 'ПЕТАРДА'], ['CRACKERS BANG ON THE FIRST ROBOT', 'KNALLER KNALLEN BEIM ERSTEN ROBOTER', 'ПЕТАРДЫ ВЗРЫВАЮТСЯ О ПЕРВОГО РОБОТА'],
  ['IT IS ALMOST MIDNIGHT! TIME FOR FIREWORKS!', 'ES IST FAST MITTERNACHT! ZEIT FÜR FEUERWERK!', 'ПОЧТИ ПОЛНОЧЬ! ВРЕМЯ ФЕЙЕРВЕРКОВ!'],
  ['HONK! MY MIDNIGHT CLOCK WILL STOP THE NEW YEAR FROM COMING!', 'HONK! MEINE MITTERNACHTSUHR HÄLT DAS NEUE JAHR AUF!', 'ГА! МОИ ЧАСЫ НЕ ДАДУТ НОВОМУ ГОДУ НАСТУПИТЬ!'],
  ['NOT IF WE STOP THE CLOCK FIRST! QUACK!', 'NICHT, WENN WIR DIE UHR ZUERST ANHALTEN! QUAK!', 'НЕ ЕСЛИ МЫ ОСТАНОВИМ ЧАСЫ ПЕРВЫМИ! КРЯ!'],
  ['DOUBLE COINS', 'DOPPELTE MÜNZEN', 'ДВОЙНЫЕ МОНЕТЫ'], ['EVERY GAME PAYS TWICE THE COINS', 'JEDES SPIEL GIBT DOPPELT SO VIELE MÜNZEN', 'КАЖДАЯ ИГРА ДАЁТ ВДВОЕ БОЛЬШЕ МОНЕТ'],
  ['DOUBLE XP', 'DOPPELTE XP', 'ДВОЙНОЙ ОПЫТ'], ['LEVEL UP TWICE AS FAST', 'DOPPELT SO SCHNELL AUFSTEIGEN', 'УРОВНИ ВДВОЕ БЫСТРЕЕ'], ['CHEST SALE', 'TRUHEN-RABATT', 'РАСПРОДАЖА СУНДУКОВ'],
  ['ALL CHESTS HALF PRICE', 'ALLE TRUHEN ZUM HALBEN PREIS', 'ВСЕ СУНДУКИ ЗА ПОЛЦЕНЫ'], ['ADMIN SALE', 'ADMIN-VERKAUF', 'АДМИН-РАСПРОДАЖА'], ['ADMIN ITEMS FOR SALE IN THE SHOP', 'ADMIN-SACHEN IM LADEN ZU KAUFEN', 'АДМИН-ПРЕДМЕТЫ В МАГАЗИНЕ'],
  ['CHEST SALE: HALF PRICE!', 'TRUHEN-RABATT: HALBER PREIS!', 'СУНДУКИ ЗА ПОЛЦЕНЫ!'], ['PAGE {0}/{1}', 'SEITE {0}/{1}', 'СТР. {0}/{1}'], ['{0} EVENT', '{0}-EVENT', 'ИВЕНТ: {0}'],
  ['{0} IN THE LOCKER!', '{0} IM SCHRANK!', '{0} В ШКАФЧИКЕ!'], ['BEAT {0} IN THE {1} EVENT', 'BESIEGE {0} IM {1}-EVENT', 'ПОБЕДИ {0} НА ИВЕНТЕ {1}'],
  ['LIMITED - ONLY DURING THE {0} EVENT', 'LIMITIERT - NUR BEIM {0}-EVENT', 'ЛИМИТ - ТОЛЬКО НА ИВЕНТЕ {0}'],
]);
