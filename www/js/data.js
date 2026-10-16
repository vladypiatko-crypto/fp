'use strict';
/* QUACK ATTACK! — game data: cosmetics, weapons, enemies, bosses, upgrades, levels, story. */

// ================================================================ cosmetics (unlocks are shared by both players)
const COSMETICS = {
  skin: [
    { id: 'classic', name: 'CLASSIC', rarity: 'common' },
    { id: 'snowy', name: 'SNOWY', rarity: 'common' },
    { id: 'mint', name: 'MINTY', rarity: 'common' },
    { id: 'toasty', name: 'TOASTY', rarity: 'common' },
    { id: 'mallard', name: 'MALLARD', rarity: 'rare' },
    { id: 'bubblegum', name: 'BUBBLEGUM', rarity: 'rare' },
    { id: 'midnight', name: 'MIDNIGHT', rarity: 'epic' },
    { id: 'ghost', name: 'GHOST', rarity: 'epic' },
    { id: 'lava', name: 'MAGMA', rarity: 'epic' },
    { id: 'golden', name: 'GOLDEN', rarity: 'legendary' },
  ],
  hat: [
    { id: 'none', name: 'NO HAT', rarity: 'common' },
    { id: 'wizard', name: 'WIZARD HAT', rarity: 'admin', desc: 'SPARKLY AND MAGICAL', gift: true }, // only given by the admin, never in chests
    { id: 'bandana_r', name: 'RED BANDANA', rarity: 'common' },
    { id: 'bandana_b', name: 'BLUE BANDANA', rarity: 'common' },
    { id: 'beanie', name: 'BEANIE', rarity: 'common' },
    { id: 'party', name: 'PARTY HAT', rarity: 'common' },
    { id: 'cap', name: 'COOL CAP', rarity: 'common' },
    { id: 'flower', name: 'FLOWER', rarity: 'rare' },
    { id: 'bow', name: 'PINK BOW', rarity: 'rare' },
    { id: 'tophat', name: 'TOP HAT', rarity: 'rare' },
    { id: 'cowboy', name: 'COWBOY HAT', rarity: 'rare' },
    { id: 'pirate', name: 'PIRATE HAT', rarity: 'rare' },
    { id: 'chef', name: 'CHEF HAT', rarity: 'rare' },
    { id: 'catears', name: 'CAT EARS', rarity: 'rare' },
    { id: 'headphones', name: 'HEADPHONES', rarity: 'epic' },
    { id: 'viking', name: 'VIKING HELM', rarity: 'epic' },
    { id: 'propeller', name: 'PROPELLER CAP', rarity: 'epic' },
    { id: 'crown', name: 'ROYAL CROWN', rarity: 'legendary' },
  ],
  halo: [
    { id: 'none', name: 'NO HALO', rarity: 'common' },
    { id: 'gold', name: 'GOLD HALO', rarity: 'rare' },
    { id: 'angel', name: 'ANGEL HALO', rarity: 'rare' },
    { id: 'hearts', name: 'LOVE ORBIT', rarity: 'rare' },
    { id: 'stars', name: 'STAR ORBIT', rarity: 'epic' },
    { id: 'fire', name: 'FIRE RING', rarity: 'epic' },
    { id: 'lightning', name: 'STORM HALO', rarity: 'epic' },
    { id: 'void', name: 'VOID HALO', rarity: 'legendary' },
    { id: 'rainbow', name: 'RAINBOW HALO', rarity: 'legendary' },
  ],
  trail: [
    { id: 'none', name: 'NO TRAIL', rarity: 'common' },
    { id: 'sparkle', name: 'SPARKLES', rarity: 'common' },
    { id: 'bubbles', name: 'BUBBLES', rarity: 'common' },
    { id: 'leaves', name: 'LEAVES', rarity: 'rare' },
    { id: 'hearts', name: 'HEARTS', rarity: 'rare' },
    { id: 'notes', name: 'MUSIC', rarity: 'rare' },
    { id: 'fire', name: 'FIRE', rarity: 'epic' },
    { id: 'ghost', name: 'AFTERIMAGE', rarity: 'epic' },
    { id: 'rainbow', name: 'RAINBOW', rarity: 'legendary' },
  ],
  weapon: [
    { id: 'blaster', name: 'BLASTER', rarity: 'common', desc: 'RELIABLE AUTO-AIM PEW PEW' },
    { id: 'shotgun', name: 'QUACKSHOT', rarity: 'rare', desc: 'SHORT RANGE PELLET BLAST' },
    { id: 'bubble', name: 'BUBBLE GUN', rarity: 'rare', desc: 'BUBBLES THAT POP IN AN AREA' },
    { id: 'rang', name: 'FEATHER-RANG', rarity: 'epic', desc: 'FLIES OUT AND COMES BACK' },
    { id: 'laser', name: 'BEAK BEAM', rarity: 'epic', desc: 'LASER THAT PIERCES EVERYTHING' },
    { id: 'minigun', name: 'QUACKINATOR', rarity: 'legendary', desc: 'BRRRRRRT' },
    { id: 'corn', name: 'CORN CANNON', rarity: 'rare', desc: 'CORN THAT POPS INTO POPCORN' },
    { id: 'frost', name: 'FROST BLASTER', rarity: 'rare', desc: 'FREEZES ROBOTS, SLOWS THEM DOWN' },
    { id: 'rocket', name: 'FIREWORK LAUNCHER', rarity: 'epic', desc: 'ROCKETS THAT GO BOOM' },
    { id: 'tesla', name: 'TESLA COIL', rarity: 'epic', desc: 'LIGHTNING JUMPS ROBOT TO ROBOT' },
    { id: 'flame', name: 'DRAGON BREATH', rarity: 'legendary', desc: 'SHORT RANGE FIRE STORM' },
    { id: 'eggnade', name: 'EGG LAUNCHER', rarity: 'rare', desc: 'LOBS EGGS THAT EXPLODE' },
    { id: 'sawblade', name: 'SAW LAUNCHER', rarity: 'epic', desc: 'SAWS BOUNCE ROBOT TO ROBOT' },
    { id: 'sniper', name: 'DUCK SNIPER', rarity: 'epic', desc: 'ONE HUGE SHOT THROUGH EVERYTHING' },
    { id: 'vortex', name: 'BLACK HOLE', rarity: 'legendary', desc: 'SUCKS ROBOTS IN, THEN POPS' },
    { id: 'goldgun', name: 'GOLDEN QUACKER', rarity: 'admin', desc: 'SHINY SHOTS THAT PIERCE', gift: true }, // only given by the admin
  ],
};
const CATS = ['skin', 'hat', 'halo', 'trail', 'weapon'];
const CAT_NAME = { skin: 'SKIN', hat: 'HAT', halo: 'HALO', trail: 'TRAIL', weapon: 'WEAPON' };
const itemOf = (cat, id) => COSMETICS[cat].find(i => i.id === id);
const DEFAULT_UNLOCKS = ['skin:classic', 'skin:snowy', 'hat:none', 'hat:bandana_r', 'hat:bandana_b', 'halo:none', 'trail:none', 'weapon:blaster'];
function defaultSave() {
  return {
    v: 2, coins: 150, name: 'QUACKER', settings: { shake: true, flash: true, music: true, lang: 'en' }, unlocked: DEFAULT_UNLOCKS.slice(),
    loadout: [
      { skin: 'classic', hat: 'bandana_r', halo: 'none', trail: 'none', weapon: 'blaster' },
      { skin: 'snowy', hat: 'bandana_b', halo: 'none', trail: 'none', weapon: 'blaster' },
    ],
    story: { reached: 1, cleared: {} }, best: { e1: 0, e2: 0 }, muted: false, introSeen: false, wizardSeen: false, onlineNewsSeen: true,
    newItems: [], // unlocked cosmetics nobody has clicked in the locker yet
  };
}
const CHESTS = {
  wood: { name: 'DUCK CHEST', price: 100, odds: { common: 55, rare: 32, epic: 11, legendary: 2 } },
  gold: { name: 'ROYAL CHEST', price: 300, odds: { rare: 50, epic: 36, legendary: 14 } },
};

// ================================================================ weapons
// cd = seconds between shots; dmg per projectile; n = projectiles per shot
const WEAPONS = {
  blaster: { cd: 0.44, dmg: 10, n: 1, spread: 0.17, speed: 250, life: 0.75, r: 1, kb: 60, range: 150, col: null },
  shotgun: { cd: 0.85, dmg: 7, n: 5, spread: 0.16, speed: 260, life: 0.32, r: 1, kb: 120, range: 95, col: '#ffd23f' },
  bubble: { cd: 0.8, dmg: 14, n: 1, spread: 0.3, speed: 120, life: 0.9, r: 4, kb: 40, range: 120, aoe: 20, col: '#bde6ff' },
  rang: { cd: 1.05, dmg: 12, n: 1, spread: 0.5, speed: 210, life: 1.0, r: 3, kb: 70, range: 120, col: '#fff3dc' },
  laser: { cd: 0.85, dmg: 16, n: 1, spread: 0.12, range: 150, kb: 30, col: '#c06bff' },
  minigun: { cd: 0.085, dmg: 3.6, n: 1, spread: 0.12, speed: 300, life: 0.55, r: 1, kb: 25, range: 140, col: '#fff36b', jitter: 0.12 },
  // pops into `pop` popcorn shards when it hits or runs out
  corn: { cd: 0.72, dmg: 15, n: 1, spread: 0.22, speed: 190, life: 0.6, r: 2, kb: 60, range: 135, col: '#ffd23f', pop: 6 },
  // robots it hits move at 45% speed for `slow` seconds
  frost: { cd: 0.46, dmg: 10, n: 1, spread: 0.15, speed: 230, life: 0.7, r: 2, kb: 15, range: 145, col: '#9fdcff', slow: 1.6 },
  // starts slow, speeds up, steers a little and explodes
  rocket: { cd: 1.25, dmg: 30, n: 1, spread: 0.35, speed: 60, life: 1.2, r: 2, kb: 0, range: 165, aoe: 26, col: '#ff6fae' },
  // instant lightning that jumps to `chain` more robots
  tesla: { cd: 0.68, dmg: 14, n: 1, chain: 3, range: 135, kb: 20, col: '#7dfff5' },
  flame: { cd: 0.07, dmg: 3.3, n: 1, spread: 0.3, speed: 160, life: 0.42, r: 3, kb: 8, range: 92, col: '#ff8c1a', jitter: 0.2 },
  // lobbed eggs that explode where they land
  eggnade: { cd: 0.95, dmg: 24, n: 1, spread: 0.45, range: 140, aoe: 22, kb: 0, col: '#fff8e7' },
  // a spinning saw that bounces on to the next robot after every hit
  sawblade: { cd: 0.8, dmg: 16, n: 1, spread: 0.3, speed: 210, life: 1.4, r: 3, kb: 50, range: 140, col: '#d5dbe6', bounces: 3 },
  // one huge instant shot that goes through everything in a long line
  sniper: { cd: 1.35, dmg: 78, n: 1, spread: 0.06, range: 230, kb: 140, col: '#fff3b0' },
  // a slow orb that pulls robots in, hurts them, then pops
  vortex: { cd: 1.6, dmg: 40, n: 1, spread: 0.5, speed: 70, life: 1.6, r: 5, kb: 0, range: 150, col: '#9d5cff', pull: 48 },
  goldgun: { cd: 0.3, dmg: 15, n: 1, spread: 0.14, speed: 320, life: 0.7, r: 1, kb: 80, range: 165, col: '#ffd23f' },
};

// ================================================================ upgrades offered on level-up
const UPGRADES = [
  { k: 'rapid', name: 'RAPID FIRE', max: 5, d: () => 'MAIN WEAPON FIRES 16% FASTER' },
  { k: 'power', name: 'MORE POWER', max: 5, d: () => '+35% MAIN WEAPON DAMAGE' },
  { k: 'spread', name: 'MULTI SHOT', max: 4, d: () => '+1 PROJECTILE PER SHOT' },
  { k: 'pierce', name: 'PIERCING', max: 3, d: () => 'SHOTS PASS THROUGH +1 ROBOT' },
  { k: 'egg', name: 'EGG ORBIT', max: 5, d: l => (l ? '+1 EGG, MORE DAMAGE' : 'EGGS BLOCK BULLETS, PUSH ROBOTS') },
  { k: 'bread', name: 'BREAD BOMB', max: 5, d: l => (l ? 'BIGGER, FASTER BOOMS' : 'LOB EXPLODING BREAD') },
  { k: 'zap', name: 'ZAP', max: 5, d: l => (l ? 'MORE CHAINS + DAMAGE' : 'CHAIN LIGHTNING') },
  { k: 'quack', name: 'MEGA QUACK', max: 5, d: l => (l ? 'BIGGER SHOCKWAVE' : 'QUACK KNOCKS ROBOTS BACK') },
  { k: 'speed', name: 'SWIFT FEET', max: 5, d: () => '+10% MOVE SPEED' },
  { k: 'heart', name: 'BIG HEART', max: 5, d: () => '+20 MAX HP AND HEAL' },
  { k: 'magnet', name: 'MAGNET', max: 4, d: () => 'GRAB XP AND COINS FROM FARTHER' },
  { k: 'regen', name: 'REGEN', max: 5, d: () => 'HEAL 0.6 HP PER SEC' },
  { k: 'dash', name: 'DASH ATTACK', max: 5, d: l => (l ? 'MORE DASH DAMAGE' : 'DASH HURTS ROBOTS') },
  { k: 'feather', name: 'FEATHER DARTS', max: 5, d: l => (l ? 'MORE DARTS, MORE DAMAGE' : 'HOMING FEATHERS HUNT ROBOTS') },
  { k: 'puddle', name: 'SPLASH PUDDLE', max: 5, d: l => (l ? 'BIGGER PUDDLES, MORE DAMAGE' : 'DROP PUDDLES THAT HURT ROBOTS') },
  { k: 'shield', name: 'BUBBLE SHIELD', max: 5, d: l => (l ? 'SHIELD COMES BACK FASTER' : 'BLOCKS A HIT, THEN RECHARGES') },
];
// power-ups: you can carry 3 of them per run; after that only those 3 show up (plus gun and duck upgrades)
const SIDE_WEAPONS = ['egg', 'bread', 'zap', 'quack', 'feather', 'puddle', 'shield'];
const POWER_SLOTS = 3;
// a maxed power-up can (rarely) be OVERCHARGED: a red card that makes it much stronger
const OVER_CHANCE = 0.16;
const OVERCHARGE = {
  egg: ['GIANT EGGS', 'HUGE EGGS SPIN WAY FASTER'], bread: ['BREAD STORM', 'EVERY BOMB SPLITS INTO MORE'],
  zap: ['THUNDERSTORM', 'ZAPS JUMP TO EVERYTHING'], quack: ['SONIC QUACK', 'GIANT QUACK, TWICE AS OFTEN'],
  feather: ['FEATHER STORM', 'TWICE THE DARTS, THEY PIERCE'], puddle: ['LAVA LAKE', 'HUGE BURNING PUDDLES'],
  shield: ['MIRROR SHIELD', 'RECHARGES FAST, POPS BULLETS'],
};
const overCard = k => ({ k: 'over:' + k, over: k, name: OVERCHARGE[k][0], max: 1, d: () => OVERCHARGE[k][1] });

// ================================================================ enemies: Dr. Honk's robot army
const ENEMIES = {
  bolt: { name: 'BOLT BOT', hp: 10, spd: 46, dmg: 7, r: 4, xp: 1, ai: 'walk', fx: 'metal' },
  boom: { name: 'BOOM BOT', hp: 14, spd: 38, dmg: 16, r: 5, xp: 1, ai: 'bomber', fx: 'metal' },
  goo: { name: 'GOO BLOB', hp: 24, spd: 30, dmg: 8, r: 5, xp: 2, ai: 'walk', fx: 'goo', split: 'minigoo' },
  minigoo: { name: 'MINI GOO', hp: 4, spd: 62, dmg: 4, r: 3, xp: 0, ai: 'walk', fx: 'goo' },
  tank: { name: 'TANK BOT', hp: 66, spd: 21, dmg: 12, r: 7, xp: 4, ai: 'walk', fx: 'metal', heavy: 0.3 },
  drone: { name: 'ZAP DRONE', hp: 22, spd: 32, dmg: 8, r: 5, xp: 3, ai: 'shooter', fx: 'metal', fly: true },
  saw: { name: 'SAW BOT', hp: 28, spd: 30, dmg: 14, r: 5, xp: 3, ai: 'charger', fx: 'metal' },
};
const BOSSES = {
  crab: { name: 'CLANKY CRAB', hp: 1100, spd: 30, dmg: 18, r: 15, sc: 2, attacks: ['charge', 'summon', 'ring'], summon: ['bolt', 'boom'], col: '#e8343b' },
  gooking: { name: 'THE GOO KING', hp: 1500, spd: 22, dmg: 18, r: 15, sc: 2, attacks: ['jump', 'summon', 'ring'], summon: ['goo', 'minigoo'], col: '#7ee04a', fx: 'goo' },
  yeti: { name: 'YETI-BOT 3000', hp: 1900, spd: 26, dmg: 20, r: 14, sc: 2, attacks: ['volley', 'ring', 'charge'], summon: ['bolt', 'saw'], col: '#bde6ff' },
  sawtank: { name: 'SAW TANK', hp: 2400, spd: 20, dmg: 22, r: 16, sc: 2, attacks: ['missiles', 'charge', 'summon', 'volley'], summon: ['tank', 'boom'], col: '#c97b4a' },
  honk: { name: 'DR. HONK MEGA MECH', hp: 3400, spd: 24, dmg: 24, r: 17, sc: 2, attacks: ['ring', 'missiles', 'charge', 'summon', 'volley', 'jump'], summon: ['bolt', 'drone', 'saw', 'boom'], col: '#a07ad6', final: true },
};

// ================================================================ story levels
const LEVELS = [
  { n: 1, name: 'PUDDLE POND', world: 'pond', time: 85, boss: 'crab', reward: 'shotgun',
    pool: { bolt: 10, boom: 3, goo: 2 },
    intro: [['honk', 'HONK HONK! MY ROBOTS WILL TURN YOUR LOVELY POND INTO A PARKING LOT!'], ['duck', 'NOT ON OUR WATCH! QUACK!']],
    outro: [['daisy', '*RADIO* ...HELLO? I SLIPPED HIM A BUG! HE IS TAKING ME THROUGH THE WHISPER WOODS!']] },
  { n: 2, name: 'WHISPER WOODS', world: 'woods', time: 95, boss: 'gooking', reward: 'bubble',
    pool: { bolt: 7, goo: 5, drone: 3, boom: 3 },
    intro: [['honk', 'CAREFUL, FEATHERBRAINS. MY GOO IS EXTRA STICKY TODAY. HONK!'], ['daisy', 'THE GOO KING IS JUST A BIG JELLY WITH A HAT. YOU GOT THIS!']],
    outro: [['daisy', 'WE ARE CLIMBING... IT IS SO COLD! THE FROSTY PEAKS!']] },
  { n: 3, name: 'FROSTY PEAKS', world: 'peaks', time: 105, boss: 'yeti', reward: 'rang',
    pool: { bolt: 7, saw: 4, drone: 3, tank: 2, boom: 2 },
    intro: [['honk', 'MY YETI-BOT 3000 LOVES DUCKS. ON ICE! HONK HONK!'], ['daisy', 'HE FORGOT HIS SCARF. HE IS SO GRUMPY NOW.']],
    outro: [['daisy', 'I SEE SMOKE... THE LAVA FACTORY! THIS IS WHERE HE BUILDS HIS ROBOTS!']] },
  { n: 4, name: 'LAVA FACTORY', world: 'factory', time: 115, boss: 'sawtank', reward: 'laser',
    pool: { bolt: 6, boom: 5, tank: 4, saw: 4, drone: 3 },
    intro: [['honk', 'WELCOME TO MY FACTORY! EVERY ROBOT HERE IS 100% DUCK-PROOF!'], ['daisy', 'THEY ARE NOT. GO GET THEM!']],
    outro: [['honk', 'ENOUGH! COME TO MY TOWER IF YOU DARE. I HAVE A LITTLE SURPRISE... HONK.']] },
  { n: 5, name: 'HONK TOWER', world: 'tower', time: 125, boss: 'honk', reward: 'minigun',
    pool: { bolt: 6, boom: 4, goo: 3, tank: 3, saw: 4, drone: 4 },
    intro: [['honk', 'BEHOLD! THE MEGA HONK MECH! POWERED BY THE PRINCESS AND HER GOLDEN QUACK!'], ['daisy', 'I AM NOT DOING A SINGLE QUACK FOR YOU!'], ['duck', 'HANG ON, DAISY! WE ARE COMING!']],
    outro: [] },
];
const ENDLESS_POOL_STEPS = [[0, 'bolt', 10], [25, 'boom', 4], [55, 'goo', 3], [85, 'drone', 2.5], [110, 'tank', 2.5], [140, 'saw', 2.5]];
const BOSS_ORDER = ['crab', 'gooking', 'yeti', 'sawtank', 'honk'];
const SPEAKERS = { honk: { name: 'DR. HONK', col: '#c06bff' }, daisy: { name: 'PRINCESS DAISY', col: '#ff9ccb' }, duck: { name: 'DUCKS', col: '#ffd23f' }, narr: { name: '', col: '#fff8e7' } };
