'use strict';
/* QUACK ATTACK! — languages and player names.
 * All game text is written in English. text() / textW() / wrapText() run every string through tr(), which
 * looks it up for the chosen language just before drawing, so a language switch changes every screen at once.
 *  - keep(s): never translate s (player names, lobby codes)
 *  - fmt('{0} IS DOWN!', name): text with parts filled in. It's still a plain string (safe to send online);
 *    each device translates it into its own language when it draws it. */

const LANGS = [['en', 'ENGLISH'], ['de', 'DEUTSCH'], ['ru', 'РУССКИЙ'], ['duck', 'QUACK']];
let LANG = 'en';
const RAW = '\u0001'; // prefix: already translated, draw as is
const KEEP_A = '\u0002', KEEP_B = '\u0003', FMT = '\u0006';
const keep = s => KEEP_A + s + KEEP_B;
const fmt = (key, ...args) => FMT + JSON.stringify([key, ...args.map(String)]);
const CTRL = /[\u0001-\u0007]/;
const CTRL_ALL = /[\u0001-\u0007]/g;
const trCache = new Map();

function setLang(l) {
  LANG = LANGS.some(x => x[0] === l) ? l : 'en';
  trCache.clear();
  if (typeof zoomCache !== 'undefined') zoomCache.clear();
}
function langName(l = LANG) { return (LANGS.find(x => x[0] === l) || LANGS[0])[1]; }

function tr(s) {
  s = String(s);
  if (s.charCodeAt(0) === 1) return s.slice(1);
  if (LANG === 'en' && !CTRL.test(s)) return s;
  let out = trCache.get(s);
  if (out === undefined) {
    out = trNow(s);
    if (trCache.size > 4000) trCache.clear();
    trCache.set(s, out);
  }
  return out;
}
function trNow(s) {
  if (s.charCodeAt(0) === 6) { // fmt(): translate the template, then each part
    let parts;
    try { parts = JSON.parse(s.slice(1)); } catch (e) { return s.replace(CTRL_ALL, ''); }
    const [key, ...args] = parts;
    return trPlain(key).replace(/\{(\d)\}/g, (m, i) => (args[i] === undefined ? '' : tr(args[i])));
  }
  if (s.charCodeAt(0) === 2 && s.charCodeAt(s.length - 1) === 3) return s.slice(1, -1);
  // kept spans inside a longer string stay as they are; everything else is translated
  if (s.includes(KEEP_A)) return s.split(/(\u0002[^\u0003]*\u0003)/).map(p => (p.charCodeAt(0) === 2 ? p.slice(1, -1) : trPlain(p))).join('');
  return trPlain(s);
}
function trPlain(s) {
  s = s.replace(CTRL_ALL, '');
  if (LANG === 'en' || !/[A-Z]/i.test(s)) return s;
  if (LANG === 'duck') return quackify(s);
  const d = DICT[LANG], hit = d && d[s];
  if (hit !== undefined) return hit;
  trMissing.add(s);
  return s;
}
const trMissing = new Set(); // for testing: English strings a language has no translation for

// duck: every word is QUACK (numbers, symbols and single letters like the P in P1 stay)
function quackify(s) { return s.replace(/[A-ZÄÖÜА-ЯЁ][A-ZÄÖÜА-ЯЁ']*/gi, w => (w.length < 2 ? w : 'QUACK')); }

// ================================================================ translations: [English, Deutsch, Русский]
const PHRASES = [
  // rarities, tags
  ['COMMON', 'GEWÖHNLICH', 'ОБЫЧНЫЙ'], ['RARE', 'SELTEN', 'РЕДКИЙ'], ['EPIC', 'EPISCH', 'ЭПИЧЕСКИЙ'], ['LEGENDARY', 'LEGENDÄR', 'ЛЕГЕНДАРНЫЙ'],
  ['NEW!', 'NEU!', 'НОВОЕ!'], ['SOON', 'BALD', 'СКОРО'],
  // skins
  ['CLASSIC', 'KLASSISCH', 'КЛАССИКА'], ['SNOWY', 'SCHNEEWEISS', 'СНЕЖОК'], ['MINTY', 'MINZE', 'МЯТА'], ['TOASTY', 'TOAST', 'ТОСТИК'],
  ['MALLARD', 'STOCKENTE', 'КРЯКВА'], ['BUBBLEGUM', 'KAUGUMMI', 'ЖВАЧКА'], ['MIDNIGHT', 'MITTERNACHT', 'ПОЛНОЧЬ'], ['GHOST', 'GEIST', 'ПРИЗРАК'],
  ['MAGMA', 'MAGMA', 'МАГМА'], ['GOLDEN', 'GOLDIG', 'ЗОЛОТО'],
  // hats
  ['NO HAT', 'KEIN HUT', 'БЕЗ ШЛЯПЫ'], ['WIZARD HAT', 'ZAUBERHUT', 'ШЛЯПА МАГА'], ['SPARKLY AND MAGICAL', 'GLITZERND UND MAGISCH', 'БЛЕСТЯЩАЯ И ВОЛШЕБНАЯ'],
  ['RED BANDANA', 'ROTES TUCH', 'КРАСНАЯ БАНДАНА'], ['BLUE BANDANA', 'BLAUES TUCH', 'СИНЯЯ БАНДАНА'], ['BEANIE', 'MÜTZE', 'ШАПОЧКА'],
  ['PARTY HAT', 'PARTYHUT', 'КОЛПАК'], ['COOL CAP', 'COOLE KAPPE', 'КЕПКА'], ['FLOWER', 'BLUME', 'ЦВЕТОК'], ['PINK BOW', 'ROSA SCHLEIFE', 'РОЗОВЫЙ БАНТ'],
  ['TOP HAT', 'ZYLINDER', 'ЦИЛИНДР'], ['COWBOY HAT', 'COWBOYHUT', 'ШЛЯПА КОВБОЯ'], ['PIRATE HAT', 'PIRATENHUT', 'ШЛЯПА ПИРАТА'],
  ['CHEF HAT', 'KOCHMÜTZE', 'КОЛПАК ПОВАРА'], ['CAT EARS', 'KATZENOHREN', 'КОШАЧЬИ УШКИ'], ['HEADPHONES', 'KOPFHÖRER', 'НАУШНИКИ'],
  ['VIKING HELM', 'WIKINGERHELM', 'ШЛЕМ ВИКИНГА'], ['PROPELLER CAP', 'PROPELLERKAPPE', 'КЕПКА-ПРОПЕЛЛЕР'], ['ROYAL CROWN', 'KÖNIGSKRONE', 'КОРОНА'],
  // halos
  ['NO HALO', 'KEIN HALO', 'БЕЗ НИМБА'], ['GOLD HALO', 'GOLDHALO', 'ЗОЛОТОЙ НИМБ'], ['ANGEL HALO', 'ENGELSHALO', 'НИМБ АНГЕЛА'],
  ['LOVE ORBIT', 'LIEBESORBIT', 'ОРБИТА ЛЮБВИ'], ['STAR ORBIT', 'STERNENORBIT', 'ОРБИТА ЗВЕЗД'], ['FIRE RING', 'FEUERRING', 'КОЛЬЦО ОГНЯ'],
  ['STORM HALO', 'STURMHALO', 'НИМБ БУРИ'], ['VOID HALO', 'LEERE-HALO', 'НИМБ ПУСТОТЫ'], ['RAINBOW HALO', 'REGENBOGENHALO', 'РАДУЖНЫЙ НИМБ'],
  // trails
  ['NO TRAIL', 'KEINE SPUR', 'БЕЗ СЛЕДА'], ['SPARKLES', 'FUNKELN', 'ИСКРЫ'], ['BUBBLES', 'BLASEN', 'ПУЗЫРИ'], ['LEAVES', 'BLÄTTER', 'ЛИСТЬЯ'],
  ['HEARTS', 'HERZEN', 'СЕРДЕЧКИ'], ['MUSIC', 'MUSIK', 'МУЗЫКА'], ['FIRE', 'FEUER', 'ОГОНЬ'], ['AFTERIMAGE', 'NACHBILD', 'ШЛЕЙФ'], ['RAINBOW', 'REGENBOGEN', 'РАДУГА'],
  // weapons
  ['BLASTER', 'BLASTER', 'БЛАСТЕР'], ['RELIABLE AUTO-AIM PEW PEW', 'ZUVERLÄSSIGES AUTO-ZIELEN, PIU PIU', 'НАДЕЖНЫЙ АВТОПРИЦЕЛ, ПИУ-ПИУ'],
  ['QUACKSHOT', 'QUAKFLINTE', 'КРЯКОСТРЕЛ'], ['SHORT RANGE PELLET BLAST', 'SCHROT AUF KURZE DISTANZ', 'ДРОБЬ НА БЛИЗКОЙ ДИСТАНЦИИ'],
  ['BUBBLE GUN', 'BLASENKANONE', 'ПУЗЫРЕМЕТ'], ['BUBBLES THAT POP IN AN AREA', 'BLASEN, DIE IM UMKREIS PLATZEN', 'ПУЗЫРИ ЛОПАЮТСЯ ПО ПЛОЩАДИ'],
  ['FEATHER-RANG', 'FEDER-RANG', 'ПЕРОРАНГ'], ['FLIES OUT AND COMES BACK', 'FLIEGT WEG UND KOMMT ZURÜCK', 'УЛЕТАЕТ И ВОЗВРАЩАЕТСЯ'],
  ['BEAK BEAM', 'SCHNABELSTRAHL', 'ЛУЧ КЛЮВА'], ['LASER THAT PIERCES EVERYTHING', 'LASER, DER ALLES DURCHBOHRT', 'ЛАЗЕР, ПРОБИВАЮЩИЙ ВСЁ'],
  ['QUACKINATOR', 'QUAKINATOR', 'КРЯКИНАТОР'], ['BRRRRRRT', 'BRRRRRRT', 'ТР-Р-Р-Р-Р'],
  ['CORN CANNON', 'MAISKANONE', 'КУКУРУЗНАЯ ПУШКА'], ['CORN THAT POPS INTO POPCORN', 'MAIS, DER ZU POPCORN PLATZT', 'КУКУРУЗА ВЗРЫВАЕТСЯ ПОПКОРНОМ'],
  ['FROST BLASTER', 'FROSTBLASTER', 'ЛЕДЯНОЙ БЛАСТЕР'], ['FREEZES ROBOTS, SLOWS THEM DOWN', 'FRIERT ROBOTER EIN UND BREMST SIE', 'ЗАМОРАЖИВАЕТ И ЗАМЕДЛЯЕТ РОБОТОВ'],
  ['FIREWORK LAUNCHER', 'FEUERWERKSWERFER', 'САЛЮТОМЁТ'], ['ROCKETS THAT GO BOOM', 'RAKETEN, DIE BUMM MACHEN', 'РАКЕТЫ, КОТОРЫЕ ДЕЛАЮТ БУМ'],
  ['TESLA COIL', 'TESLASPULE', 'КАТУШКА ТЕСЛЫ'], ['LIGHTNING JUMPS ROBOT TO ROBOT', 'BLITZ SPRINGT VON ROBOTER ZU ROBOTER', 'МОЛНИЯ ПРЫГАЕТ ПО РОБОТАМ'],
  ['DRAGON BREATH', 'DRACHENATEM', 'ДЫХАНИЕ ДРАКОНА'], ['SHORT RANGE FIRE STORM', 'FEUERSTURM AUF KURZE DISTANZ', 'ОГНЕННЫЙ ШТОРМ ВБЛИЗИ'],
  ['EGG LAUNCHER', 'EIERWERFER', 'ЯЙЦЕМЁТ'], ['LOBS EGGS THAT EXPLODE', 'WIRFT EIER, DIE EXPLODIEREN', 'КИДАЕТ ВЗРЫВАЮЩИЕСЯ ЯЙЦА'],
  ['SAW LAUNCHER', 'SÄGENWERFER', 'ПИЛОМЁТ'], ['SAWS BOUNCE ROBOT TO ROBOT', 'SÄGEN SPRINGEN VON ROBOTER ZU ROBOTER', 'ПИЛЫ ПРЫГАЮТ ОТ РОБОТА К РОБОТУ'],
  ['DUCK SNIPER', 'ENTEN-SCHARFSCHÜTZE', 'УТИНАЯ СНАЙПЕРКА'], ['ONE HUGE SHOT THROUGH EVERYTHING', 'EIN RIESENSCHUSS DURCH ALLES', 'ОДИН МОЩНЫЙ ВЫСТРЕЛ НАСКВОЗЬ'],
  ['BLACK HOLE', 'SCHWARZES LOCH', 'ЧЁРНАЯ ДЫРА'], ['SUCKS ROBOTS IN, THEN POPS', 'SAUGT ROBOTER EIN UND PLATZT', 'ЗАСАСЫВАЕТ РОБОТОВ И ЛОПАЕТСЯ'],
  ['GOLDEN QUACKER', 'GOLDENER QUAKER', 'ЗОЛОТОЙ КРЯКЕР'], ['SHINY SHOTS THAT PIERCE', 'GLÄNZENDE SCHÜSSE, DIE DURCHBOHREN', 'БЛЕСТЯЩИЕ ПРОБИВАЮЩИЕ ВЫСТРЕЛЫ'],
  // locker categories
  ['SKIN', 'SKIN', 'СКИН'], ['HAT', 'HUT', 'ШЛЯПА'], ['HALO', 'HALO', 'НИМБ'], ['TRAIL', 'SPUR', 'СЛЕД'], ['WEAPON', 'WAFFE', 'ОРУЖИЕ'],
  ['SKINS', 'SKINS', 'СКИНЫ'], ['HATS', 'HÜTE', 'ШЛЯПЫ'], ['HALOS', 'HALOS', 'НИМБЫ'], ['TRAILS', 'SPUREN', 'СЛЕДЫ'], ['WEAPONS', 'WAFFEN', 'ОРУЖИЕ'],
  ['DUCK CHEST', 'ENTENTRUHE', 'УТИНЫЙ СУНДУК'], ['ROYAL CHEST', 'KÖNIGSTRUHE', 'КОРОЛЕВСКИЙ СУНДУК'],
  // upgrades
  ['RAPID FIRE', 'SCHNELLFEUER', 'БЫСТРЫЙ ОГОНЬ'], ['MAIN WEAPON FIRES 16% FASTER', 'HAUPTWAFFE FEUERT 16% SCHNELLER', 'ОСНОВНОЕ ОРУЖИЕ СТРЕЛЯЕТ НА 16% БЫСТРЕЕ'],
  ['MORE POWER', 'MEHR KRAFT', 'БОЛЬШЕ СИЛЫ'], ['+35% MAIN WEAPON DAMAGE', '+35% SCHADEN DER HAUPTWAFFE', '+35% УРОНА ОСНОВНОГО ОРУЖИЯ'],
  ['MULTI SHOT', 'MEHRFACHSCHUSS', 'МУЛЬТИВЫСТРЕЛ'], ['+1 PROJECTILE PER SHOT', '+1 PROJEKTIL PRO SCHUSS', '+1 СНАРЯД ЗА ВЫСТРЕЛ'],
  ['PIERCING', 'DURCHSCHLAG', 'ПРОБИВАНИЕ'], ['SHOTS PASS THROUGH +1 ROBOT', 'SCHÜSSE DURCHDRINGEN +1 ROBOTER', 'ВЫСТРЕЛЫ ПРОБИВАЮТ +1 РОБОТА'],
  ['EGG ORBIT', 'EIER-ORBIT', 'ЯИЧНАЯ ОРБИТА'], ['+1 EGG, MORE DAMAGE', '+1 EI, MEHR SCHADEN', '+1 ЯЙЦО, БОЛЬШЕ УРОНА'],
  ['SPINNING EGGS GUARD YOU', 'KREISENDE EIER BESCHÜTZEN DICH', 'КРУЖАЩИЕ ЯЙЦА ЗАЩИЩАЮТ ТЕБЯ'],
  ['BREAD BOMB', 'BROTBOMBE', 'ХЛЕБНАЯ БОМБА'], ['BIGGER, FASTER BOOMS', 'GRÖSSER UND SCHNELLER BUMM', 'БОЛЬШЕ И ЧАЩЕ БАБАХ'],
  ['LOB EXPLODING BREAD', 'WIRF EXPLODIERENDES BROT', 'КИДАЙ ВЗРЫВНОЙ ХЛЕБ'],
  ['ZAP', 'ZAP', 'РАЗРЯД'], ['MORE CHAINS + DAMAGE', 'MEHR KETTEN + SCHADEN', 'БОЛЬШЕ ЦЕПЕЙ + УРОН'], ['CHAIN LIGHTNING', 'KETTENBLITZ', 'ЦЕПНАЯ МОЛНИЯ'],
  ['MEGA QUACK', 'MEGA-QUAK', 'МЕГА-КРЯ'], ['BIGGER SHOCKWAVE', 'GRÖSSERE SCHOCKWELLE', 'УДАРНАЯ ВОЛНА БОЛЬШЕ'],
  ['QUACK KNOCKS ROBOTS BACK', 'QUAK STÖSST ROBOTER ZURÜCK', 'КРЯК ОТБРАСЫВАЕТ РОБОТОВ'],
  ['SWIFT FEET', 'FLINKE FÜSSE', 'БЫСТРЫЕ ЛАПКИ'], ['+10% MOVE SPEED', '+10% TEMPO', '+10% СКОРОСТИ'],
  ['BIG HEART', 'GROSSES HERZ', 'БОЛЬШОЕ СЕРДЦЕ'], ['+20 MAX HP AND HEAL', '+20 MAX HP UND HEILUNG', '+20 К МАКС. ОЗ И ЛЕЧЕНИЕ'],
  ['MAGNET', 'MAGNET', 'МАГНИТ'], ['GRAB XP AND COINS FROM FARTHER', 'ZIEHT XP UND MÜNZEN VON WEITER AN', 'ПРИТЯГИВАЕТ ОПЫТ И МОНЕТЫ ИЗДАЛЕКА'],
  ['REGEN', 'REGENERATION', 'РЕГЕНЕРАЦИЯ'], ['HEAL 0.6 HP PER SEC', 'HEILT 0.6 HP PRO SEK.', 'ЛЕЧИТ 0.6 ОЗ В СЕК.'],
  ['DASH ATTACK', 'SPRINTANGRIFF', 'АТАКА РЫВКОМ'], ['MORE DASH DAMAGE', 'MEHR SPRINTSCHADEN', 'БОЛЬШЕ УРОНА РЫВКОМ'], ['DASH HURTS ROBOTS', 'SPRINT VERLETZT ROBOTER', 'РЫВОК РАНИТ РОБОТОВ'],
  // robots and bosses
  ['BOLT BOT', 'BOLZEN-BOT', 'БОЛТОБОТ'], ['BOOM BOT', 'BUMM-BOT', 'БУМБОТ'], ['GOO BLOB', 'SCHLEIMI', 'СЛИЗЕНЬ'], ['MINI GOO', 'MINI-SCHLEIM', 'МИНИ-СЛИЗЬ'],
  ['TANK BOT', 'PANZER-BOT', 'ТАНКОБОТ'], ['ZAP DRONE', 'ZAP-DROHNE', 'ДРОН-РАЗРЯДНИК'], ['SAW BOT', 'SÄGE-BOT', 'ПИЛОБОТ'],
  ['CLANKY CRAB', 'KLAPPERKRABBE', 'ГРЕМУЧИЙ КРАБ'], ['THE GOO KING', 'DER SCHLEIMKÖNIG', 'КОРОЛЬ СЛИЗИ'], ['YETI-BOT 3000', 'YETI-BOT 3000', 'ЙЕТИ-БОТ 3000'],
  ['SAW TANK', 'SÄGEPANZER', 'ПИЛОТАНК'], ['DR. HONK MEGA MECH', 'DR. HONKS MEGA-MECH', 'МЕГА-МЕХ ДР. ХОНКА'],
  // worlds
  ['PUDDLE POND', 'PFÜTZENTEICH', 'ЛУЖИЧНЫЙ ПРУД'], ['WHISPER WOODS', 'FLÜSTERWALD', 'ШЕПЧУЩИЙ ЛЕС'], ['FROSTY PEAKS', 'FROSTGIPFEL', 'МОРОЗНЫЕ ПИКИ'],
  ['LAVA FACTORY', 'LAVAFABRIK', 'ЛАВОВАЯ ФАБРИКА'], ['HONK TOWER', 'HONK-TURM', 'БАШНЯ ХОНКА'],
  // story: levels
  ['HONK HONK! MY ROBOTS WILL TURN YOUR LOVELY POND INTO A PARKING LOT!', 'HONK HONK! MEINE ROBOTER MACHEN AUS EUREM HÜBSCHEN TEICH EINEN PARKPLATZ!', 'ГА-ГА! МОИ РОБОТЫ ПРЕВРАТЯТ ВАШ МИЛЫЙ ПРУД В ПАРКОВКУ!'],
  ['NOT ON OUR WATCH! QUACK!', 'NICHT MIT UNS! QUAK!', 'ТОЛЬКО НЕ ПРИ НАС! КРЯ!'],
  ['*RADIO* ...HELLO? I SLIPPED HIM A BUG! HE IS TAKING ME THROUGH THE WHISPER WOODS!', '*FUNK* ...HALLO? ICH HABE IHM EINE WANZE UNTERGEJUBELT! ER BRINGT MICH DURCH DEN FLÜSTERWALD!', '*РАЦИЯ* ...АЛЛО? Я ПОДСУНУЛА ЕМУ ЖУЧОК! ОН ВЕЗЕТ МЕНЯ ЧЕРЕЗ ШЕПЧУЩИЙ ЛЕС!'],
  ['CAREFUL, FEATHERBRAINS. MY GOO IS EXTRA STICKY TODAY. HONK!', 'VORSICHT, FEDERHIRNE. MEIN SCHLEIM IST HEUTE EXTRA KLEBRIG. HONK!', 'ОСТОРОЖНО, ПЕРНАТЫЕ МОЗГИ. МОЯ СЛИЗЬ СЕГОДНЯ ОСОБЕННО ЛИПКАЯ. ГА!'],
  ['THE GOO KING IS JUST A BIG JELLY WITH A HAT. YOU GOT THIS!', 'DER SCHLEIMKÖNIG IST NUR EIN GROSSER WACKELPUDDING MIT HUT. IHR SCHAFFT DAS!', 'КОРОЛЬ СЛИЗИ - ПРОСТО БОЛЬШОЕ ЖЕЛЕ В ШЛЯПЕ. ВЫ СПРАВИТЕСЬ!'],
  ['WE ARE CLIMBING... IT IS SO COLD! THE FROSTY PEAKS!', 'WIR KLETTERN... ES IST SO KALT! DIE FROSTGIPFEL!', 'МЫ ПОДНИМАЕМСЯ... ТАК ХОЛОДНО! МОРОЗНЫЕ ПИКИ!'],
  ['MY YETI-BOT 3000 LOVES DUCKS. ON ICE! HONK HONK!', 'MEIN YETI-BOT 3000 LIEBT ENTEN. AUF EIS! HONK HONK!', 'МОЙ ЙЕТИ-БОТ 3000 ОБОЖАЕТ УТОК. НА ЛЬДУ! ГА-ГА!'],
  ['HE FORGOT HIS SCARF. HE IS SO GRUMPY NOW.', 'ER HAT SEINEN SCHAL VERGESSEN. JETZT IST ER SO GRIMMIG.', 'ОН ЗАБЫЛ СВОЙ ШАРФ. ТЕПЕРЬ ОН ТАКОЙ СЕРДИТЫЙ.'],
  ['I SEE SMOKE... THE LAVA FACTORY! THIS IS WHERE HE BUILDS HIS ROBOTS!', 'ICH SEHE RAUCH... DIE LAVAFABRIK! HIER BAUT ER SEINE ROBOTER!', 'Я ВИЖУ ДЫМ... ЛАВОВАЯ ФАБРИКА! ЗДЕСЬ ОН СТРОИТ СВОИХ РОБОТОВ!'],
  ['WELCOME TO MY FACTORY! EVERY ROBOT HERE IS 100% DUCK-PROOF!', 'WILLKOMMEN IN MEINER FABRIK! JEDER ROBOTER HIER IST 100% ENTENSICHER!', 'ДОБРО ПОЖАЛОВАТЬ НА МОЮ ФАБРИКУ! КАЖДЫЙ РОБОТ ЗДЕСЬ НА 100% УТКОУСТОЙЧИВ!'],
  ['THEY ARE NOT. GO GET THEM!', 'SIND SIE NICHT. SCHNAPPT SIE EUCH!', 'ВОВСЕ НЕТ. ВПЕРЕД, ЗА НИМИ!'],
  ['ENOUGH! COME TO MY TOWER IF YOU DARE. I HAVE A LITTLE SURPRISE... HONK.', 'GENUG! KOMMT IN MEINEN TURM, WENN IHR EUCH TRAUT. ICH HABE EINE KLEINE ÜBERRASCHUNG... HONK.', 'ХВАТИТ! ПРИХОДИТЕ В МОЮ БАШНЮ, ЕСЛИ ОСМЕЛИТЕСЬ. У МЕНЯ ЕСТЬ МАЛЕНЬКИЙ СЮРПРИЗ... ГА.'],
  ['BEHOLD! THE MEGA HONK MECH! POWERED BY THE PRINCESS AND HER GOLDEN QUACK!', 'SEHT HER! DER MEGA-HONK-MECH! ANGETRIEBEN VON DER PRINZESSIN UND IHREM GOLDENEN QUAK!', 'УЗРИТЕ! МЕГА-ХОНК-МЕХ! ЕГО ПИТАЕТ ПРИНЦЕССА И ЕЕ ЗОЛОТОЕ КРЯ!'],
  ['I AM NOT DOING A SINGLE QUACK FOR YOU!', 'ICH MACHE KEINEN EINZIGEN QUAK FÜR DICH!', 'Я НЕ СКАЖУ ДЛЯ ТЕБЯ НИ ОДНОГО КРЯ!'],
  ['HANG ON, DAISY! WE ARE COMING!', 'HALT DURCH, DAISY! WIR KOMMEN!', 'ДЕРЖИСЬ, ДЕЙЗИ! МЫ ИДЕМ!'],
  // story: speakers and cutscenes
  ['DR. HONK', 'DR. HONK', 'ДР. ХОНК'], ['PRINCESS DAISY', 'PRINZESSIN DAISY', 'ПРИНЦЕССА ДЕЙЗИ'], ['DUCKS', 'ENTEN', 'УТКИ'], ['HONK', 'HONK', 'ХОНК'],
  ['SKIP >', 'ÜBERSPRINGEN >', 'ПРОПУСТИТЬ >'],
  ['PUDDLE POND. THE HAPPIEST POND IN ALL OF DUCKLAND...', 'PFÜTZENTEICH. DER FRÖHLICHSTE TEICH IN GANZ ENTENLAND...', 'ЛУЖИЧНЫЙ ПРУД. САМЫЙ СЧАСТЛИВЫЙ ПРУД ВО ВСЕЙ УТЛЯНДИИ...'],
  ['WHAT A PERFECT DAY FOR A PICNIC! WHO WANTS CAKE?', 'WAS FÜR EIN PERFEKTER TAG FÜR EIN PICKNICK! WER WILL KUCHEN?', 'ИДЕАЛЬНЫЙ ДЕНЬ ДЛЯ ПИКНИКА! КТО ХОЧЕТ ТОРТ?'],
  ['...HONK.', '...HONK.', '...ГА.'],
  ['HONK HONK! GREETINGS, FEATHERBRAINS! IT IS I, THE GENIUS DR. HONK!', 'HONK HONK! SEID GEGRÜSST, FEDERHIRNE! ICH BIN ES, DAS GENIE DR. HONK!', 'ГА-ГА! ПРИВЕТСТВУЮ, ПЕРНАТЫЕ МОЗГИ! ЭТО Я, ГЕНИАЛЬНЫЙ ДР. ХОНК!'],
  ['I NEED THE PRINCESS AND HER LEGENDARY GOLDEN QUACK TO POWER MY MEGA MECH!', 'ICH BRAUCHE DIE PRINZESSIN UND IHREN LEGENDÄREN GOLDENEN QUAK FÜR MEINEN MEGA-MECH!', 'МНЕ НУЖНА ПРИНЦЕССА И ЕЕ ЛЕГЕНДАРНОЕ ЗОЛОТОЕ КРЯ, ЧТОБЫ ЗАПУСТИТЬ МОЙ МЕГА-МЕХ!'],
  ['HEEEELP! QUAAAACK!', 'HIIILFE! QUAAAAK!', 'ПОМОГИТЕ! КРЯЯЯЯ!'],
  ['MY ROBOTS WILL TAKE GOOD CARE OF YOU. TOODLES! HONK HONK!', 'MEINE ROBOTER KÜMMERN SICH UM EUCH. TSCHÜSSI! HONK HONK!', 'МОИ РОБОТЫ ПОЗАБОТЯТСЯ О ВАС. ЧАО! ГА-ГА!'],
  ["NOBODY QUACKS WITH OUR PRINCESS! LET'S GO!", "NIEMAND LEGT SICH MIT UNSERER PRINZESSIN AN! LOS GEHT'S!", 'НИКТО НЕ ОБИДИТ НАШУ ПРИНЦЕССУ! ВПЕРЕД!'],
  ['CHAPTER 1', 'KAPITEL 1', 'ГЛАВА 1'], ['SAVE PRINCESS DAISY!', 'RETTE PRINZESSIN DAISY!', 'СПАСИ ПРИНЦЕССУ ДЕЙЗИ!'],
  ['THE MEGA HONK MECH IS NOTHING BUT SCRAP!', 'DER MEGA-HONK-MECH IST NUR NOCH SCHROTT!', 'ОТ МЕГА-ХОНК-МЕХА ОСТАЛСЯ ОДИН МЕТАЛЛОЛОМ!'],
  ["NOOO! MY BEAUTIFUL MECH! THIS ISN'T OVER, FEATHERBRAINS!", 'NEIN! MEIN WUNDERSCHÖNER MECH! DAS IST NOCH NICHT VORBEI, FEDERHIRNE!', 'НЕЕЕТ! МОЙ ПРЕКРАСНЫЙ МЕХ! ЭТО ЕЩЕ НЕ КОНЕЦ, ПЕРНАТЫЕ МОЗГИ!'],
  ['HOOOOOOONK...!', 'HOOOOOOONK...!', 'ГА-А-А-А-А...!'],
  ['YOU CAME FOR ME! QUACK QUACK HOORAY!', 'IHR SEID GEKOMMEN! QUAK QUAK HURRA!', 'ВЫ ПРИШЛИ ЗА МНОЙ! КРЯ-КРЯ, УРА!'],
  ['AND PUDDLE POND WAS PEACEFUL AGAIN... FOR NOW.', 'UND AM PFÜTZENTEICH HERRSCHTE WIEDER FRIEDEN... VORERST.', 'И НА ЛУЖИЧНОМ ПРУДУ СНОВА НАСТАЛ МИР... ПОКА ЧТО.'],
  ['THE END', 'ENDE', 'КОНЕЦ'], ['THANKS FOR PLAYING QUACK ATTACK!', 'DANKE FÜRS SPIELEN VON QUACK ATTACK!', 'СПАСИБО, ЧТО ИГРАЛИ В QUACK ATTACK!'],
  ['+500 COINS REWARD!', '+500 MÜNZEN BELOHNUNG!', 'НАГРАДА: +500 МОНЕТ!'],
  // in game
  ['LEVEL {0}: {1}', 'LEVEL {0}: {1}', 'УРОВЕНЬ {0}: {1}'], ['SURVIVE!', 'ÜBERLEBE!', 'ВЫЖИВИ!'],
  ['SURVIVE UNTIL THE BOSS ARRIVES', 'ÜBERLEBE, BIS DER BOSS KOMMT', 'ПРОДЕРЖИСЬ ДО ПРИХОДА БОССА'],
  ['RESUME', 'WEITER', 'ПРОДОЛЖИТЬ'], ['LOCKER', 'SPIND', 'ШКАФЧИК'], ['SOUND: OFF', 'TON: AUS', 'ЗВУК: ВЫКЛ'], ['SOUND: ON', 'TON: AN', 'ЗВУК: ВКЛ'],
  ['EXIT FULLSCREEN', 'VOLLBILD BEENDEN', 'ВЫЙТИ ИЗ ПОЛНОГО ЭКРАНА'], ['FULLSCREEN', 'VOLLBILD', 'ПОЛНЫЙ ЭКРАН'], ['LEAVE GAME', 'SPIEL VERLASSEN', 'ПОКИНУТЬ ИГРУ'],
  ['QUIT TO MAP', 'ZUR KARTE', 'НА КАРТУ'], ['QUIT TO MENU', 'ZUM MENÜ', 'В МЕНЮ'], ['PAUSED', 'PAUSE', 'ПАУЗА'],
  ['LEVEL CLEAR!', 'GESCHAFFT!', 'УРОВЕНЬ ПРОЙДЕН!'], ['VICTORY!', 'SIEG!', 'ПОБЕДА!'], ['GAME OVER', 'GAME OVER', 'ИГРА ОКОНЧЕНА'],
  ['THE ROBOTS GOT YOU... TRY AGAIN!', 'DIE ROBOTER HABEN DICH... NOCHMAL!', 'РОБОТЫ ТЕБЯ ПОЙМАЛИ... ЕЩЕ РАЗ!'],
  ['THE ROBOTS WON THIS TIME...', 'DIESMAL HABEN DIE ROBOTER GEWONNEN...', 'В ЭТОТ РАЗ ПОБЕДИЛИ РОБОТЫ...'],
  ['{0} IS SAFE AGAIN!', '{0}: WIEDER IN SICHERHEIT!', '{0}: СНОВА В БЕЗОПАСНОСТИ!'],
  ['TIME', 'ZEIT', 'ВРЕМЯ'], ['ROBOTS SCRAPPED', 'ROBOTER VERSCHROTTET', 'РОБОТОВ РАЗБИТО'], ['COINS PICKED UP', 'MÜNZEN GESAMMELT', 'МОНЕТ СОБРАНО'],
  ['BONUS', 'BONUS', 'БОНУС'], ['NEW BEST TIME!', 'NEUE BESTZEIT!', 'НОВЫЙ РЕКОРД!'], ['NEW WEAPON: {0}!', 'NEUE WAFFE: {0}!', 'НОВОЕ ОРУЖИЕ: {0}!'],
  ['NEXT', 'WEITER', 'ДАЛЕЕ'], ['ENDING', 'ENDE', 'ФИНАЛ'], ['RETRY', 'NOCHMAL', 'ЕЩЕ РАЗ'], ['MAP', 'KARTE', 'КАРТА'], ['MENU', 'MENÜ', 'МЕНЮ'],
  ['BOLT BOT STAMPEDE!', 'BOLZEN-BOT-ANSTURM!', 'НАШЕСТВИЕ БОЛТОБОТОВ!'], ['BOOM BOT BLITZ!', 'BUMM-BOT-BLITZ!', 'АТАКА БУМБОТОВ!'], ['GOO FLOOD!', 'SCHLEIMFLUT!', 'ПОТОП СЛИЗИ!'],
  ['{0} DESTROYED!', '{0} ZERSTÖRT!', '{0}: УНИЧТОЖЕН!'], ['{0} IS DOWN!', '{0} IST AM BODEN!', '{0} ВЫБИТ!'],
  ['STAND NEXT TO THEIR EGG TO REVIVE', 'STELL DICH ZUM EI, UM ZU HELFEN', 'ВСТАНЬ У ЯЙЦА, ЧТОБЫ ОЖИВИТЬ'], ['REVIVED!', 'WIEDER DA!', 'ОЖИЛ!'],
  ['QUACK!', 'QUAK!', 'КРЯ!'], ['QUAAACK!', 'QUAAAK!', 'КРЯЯЯ!'], ['LEVEL UP!', 'LEVEL UP!', 'НОВЫЙ УРОВЕНЬ!'], ['+30 HP', '+30 HP', '+30 ОЗ'],
  ['MAGNET!', 'MAGNET!', 'МАГНИТ!'], ['HOT SAUCE!!', 'SCHARFE SOSSE!!', 'ОСТРЫЙ СОУС!!'], ['GOLDEN EGG!', 'GOLDENES EI!', 'ЗОЛОТОЕ ЯЙЦО!'],
  ['HONK RAGE MODE!', 'HONK-WUTMODUS!', 'РЕЖИМ ЯРОСТИ!'], ['HE IS REALLY ANGRY NOW', 'JETZT IST ER RICHTIG SAUER', 'ТЕПЕРЬ ОН ПО-НАСТОЯЩЕМУ ЗОЛ'],
  ['MINIONS! HONK!', 'HELFERLEIN! HONK!', 'ПРИСПЕШНИКИ! ГА!'], ['BZZT! REINFORCEMENTS!', 'BZZT! VERSTÄRKUNG!', 'БЗЗТ! ПОДКРЕПЛЕНИЕ!'], ['MISSILES!', 'RAKETEN!', 'РАКЕТЫ!'],
  ['GUN', 'KANONE', 'ПУШКА'], ['DUCK', 'ENTE', 'УТКА'], ['SNACK', 'SNACK', 'ПЕРЕКУС'], ['BREAD SNACK', 'BROTSNACK', 'ХЛЕБУШЕК'], ['HEAL 40 HP', 'HEILT 40 HP', 'ЛЕЧИТ 40 ОЗ'],
  ['HELP!', 'HILFE!', 'ПОМОГИ!'], ['LV{0}', 'LV{0}', 'УР{0}'], ['{0} KO', '{0} KO', '{0} KO'], ['!! WARNING !!', '!! ACHTUNG !!', '!! ВНИМАНИЕ !!'],
  ['DASH', 'SPRINT', 'РЫВОК'], ['DRAG TO MOVE', 'ZIEHEN ZUM LAUFEN', 'ВЕДИ ПАЛЬЦЕМ'],
  ['MOVE: WASD / ARROWS / STICK   DASH: SPACE', 'LAUFEN: WASD / PFEILE / STICK   SPRINT: LEERTASTE', 'ХОДИТЬ: WASD / СТРЕЛКИ / СТИК   РЫВОК: ПРОБЕЛ'],
  ['MOVE: WASD  DASH: SPACE', 'LAUFEN: WASD  SPRINT: LEERTASTE', 'ХОДИТЬ: WASD  РЫВОК: ПРОБЕЛ'],
  ['MOVE: ARROWS  DASH: ENTER', 'LAUFEN: PFEILE  SPRINT: ENTER', 'ХОДИТЬ: СТРЕЛКИ  РЫВОК: ENTER'],
  ['YOUR WEAPON AIMS ITSELF!', 'DEINE WAFFE ZIELT VON SELBST!', 'ОРУЖИЕ ЦЕЛИТСЯ САМО!'], ['BOSS IN {0}', 'BOSS IN {0}', 'БОСС ЧЕРЕЗ {0}'],
  ['PICK AN UPGRADE', 'WÄHLE EIN UPGRADE', 'ВЫБЕРИ УЛУЧШЕНИЕ'], ['PICK ONE - YOU ARE SHIELDED', 'WÄHLE EINS - DU BIST GESCHÜTZT', 'ВЫБИРАЙ - ТЫ ПОД ЗАЩИТОЙ'],
  ['TAP A CARD', 'TIPPE EINE KARTE AN', 'НАЖМИ НА КАРТУ'], ['< > TO PICK, DASH TO CHOOSE', '< > WÄHLEN, SPRINT NEHMEN', '< > ВЫБОР, РЫВОК - ВЗЯТЬ'],
  ['< > TO PICK, ENTER TO CHOOSE', '< > WÄHLEN, ENTER NEHMEN', '< > ВЫБОР, ENTER - ВЗЯТЬ'],
  // title, menus
  ["DUCKS WITH AUTO-AIM BLASTERS VS. DR. HONK'S ROBOTS", 'ENTEN MIT AUTO-ZIEL-BLASTERN GEGEN DR. HONKS ROBOTER', 'УТКИ С АВТОБЛАСТЕРАМИ ПРОТИВ РОБОТОВ ДР. ХОНКА'],
  ['DUCKS VS. ROBOTS', 'ENTEN GEGEN ROBOTER', 'УТКИ ПРОТИВ РОБОТОВ'],
  ['STORY', 'STORY', 'СЮЖЕТ'], ['ENDLESS', 'ENDLOS', 'БЕСКОНЕЧНО'], ['ONLINE', 'ONLINE', 'ОНЛАЙН'],
  ['BEST ENDLESS  1P {0}  2P {1}', 'BESTZEIT ENDLOS  1P {0}  2P {1}', 'РЕКОРД  1P {0}  2P {1}'],
  ['UNDER', 'BAUSTELLE', 'ИДЕТ'], ['CONSTRUCTION', 'BETRETEN VERBOTEN', 'СТРОИТЕЛЬСТВО'], ['ONLINE PLAY', 'ONLINE-SPIEL', 'ОНЛАЙН-ИГРА'],
  ['COMING SOON!', 'BALD VERFÜGBAR!', 'СКОРО!'], ['OK', 'OK', 'ОК'],
  ['SETTINGS', 'EINSTELLUNGEN', 'НАСТРОЙКИ'], ['SCREEN SHAKE', 'WACKELN', 'ТРЯСКА ЭКРАНА'], ['IMPACT FLASH', 'TREFFERBLITZ', 'ВСПЫШКИ'],
  ['ON', 'AN', 'ВКЛ'], ['OFF', 'AUS', 'ВЫКЛ'], ['BACK', 'ZURÜCK', 'НАЗАД'], ['LANGUAGE', 'SPRACHE', 'ЯЗЫК'], ['NAME', 'NAME', 'ИМЯ'],
  ['STORY MODE', 'STORYMODUS', 'СЮЖЕТ'], ['ENDLESS MODE', 'ENDLOSMODUS', 'БЕСКОНЕЧНЫЙ РЕЖИМ'], ['HOW MANY DUCKS?', 'WIE VIELE ENTEN?', 'СКОЛЬКО УТОК?'],
  ['1 DUCK', '1 ENTE', '1 УТКА'], ['2 DUCKS', '2 ENTEN', '2 УТКИ'],
  ['2 DUCKS = SPLIT SCREEN CO-OP!', '2 ENTEN = KOOP MIT GETEILTEM BILD!', '2 УТКИ = КООП НА ОДНОМ ЭКРАНЕ!'],
  ['STORY - SAVE PRINCESS DAISY!', 'STORY - RETTE PRINZESSIN DAISY!', 'СЮЖЕТ - СПАСИ ПРИНЦЕССУ ДЕЙЗИ!'],
  ['BOSS: {0}', 'BOSS: {0}', 'БОСС: {0}'], ['REWARD:', 'BELOHNUNG:', 'НАГРАДА:'], ['CLEARED! @', 'GESCHAFFT! @', 'ПРОЙДЕН! @'],
  ['REWARD ALREADY UNLOCKED', 'BELOHNUNG SCHON FREIGESCHALTET', 'НАГРАДА УЖЕ ПОЛУЧЕНА'], ['PLAY', 'SPIELEN', 'ИГРАТЬ'],
  ['BEAT STORY LEVEL {0} OR OPEN CHESTS', 'SCHAFFE LEVEL {0} ODER ÖFFNE TRUHEN', 'ПРОЙДИ УРОВЕНЬ {0} ИЛИ ОТКРОЙ СУНДУКИ'],
  ['LOCKED - OPEN CHESTS TO FIND IT', 'GESPERRT - FINDE ES IN TRUHEN', 'ЗАКРЫТО - ИЩИ В СУНДУКАХ'],
  ['A SPECIAL GIFT - NOT IN CHESTS', 'EIN BESONDERES GESCHENK - NICHT IN TRUHEN', 'ОСОБЫЙ ПОДАРОК - НЕ ИЗ СУНДУКОВ'],
  ['EQUIPPED ON P{0}', 'AUSGERÜSTET AUF P{0}', 'НАДЕТО НА P{0}'], ['TAP TO EQUIP', 'TIPPEN ZUM AUSRÜSTEN', 'НАЖМИ, ЧТОБЫ НАДЕТЬ'],
  ['PRESS ENTER TO EQUIP', 'ENTER ZUM AUSRÜSTEN', 'ENTER - НАДЕТЬ'], ['CHESTS', 'TRUHEN', 'СУНДУКИ'],
  ['A GIFT FOR YOU!', 'EIN GESCHENK FÜR DICH!', 'ПОДАРОК ДЛЯ ТЕБЯ!'], ['LEGENDARY WIZARD HAT', 'LEGENDÄRER ZAUBERHUT', 'ЛЕГЕНДАРНАЯ ШЛЯПА МАГА'],
  ['JUST FOR YOU :3  (EQUIPPED ON P1)', 'NUR FÜR DICH :3  (AUF P1 AUSGERÜSTET)', 'ТОЛЬКО ДЛЯ ТЕБЯ :3  (НАДЕТО НА P1)'], ['YAY!', 'JUHU!', 'УРА!'],
  ['UNLOCKS ARE SHARED BY BOTH DUCKS!', 'FUNDE GELTEN FÜR BEIDE ENTEN!', 'НАХОДКИ ОБЩИЕ ДЛЯ ОБЕИХ УТОК!'],
  ['OPEN  {0}', 'ÖFFNEN  {0}', 'ОТКРЫТЬ  {0}'], ['NEED {0}', 'BRAUCHT {0}', 'НУЖНО {0}'], ['DUPLICATE!', 'DUPLIKAT!', 'ДУБЛИКАТ!'],
  ['YOU OBTAINED:', 'DU HAST BEKOMMEN:', 'ТЫ ПОЛУЧИЛ:'], ['+{0} COINS BACK', '+{0} MÜNZEN ZURÜCK', '+{0} МОНЕТ НАЗАД'],
  ['EQUIP P{0}', 'AUSRÜSTEN P{0}', 'НАДЕТЬ НА P{0}'], ['AGAIN', 'NOCHMAL', 'ЕЩЕ'],
  // name screen
  ['YOUR NAME', 'DEIN NAME', 'ТВОЕ ИМЯ'], ['SHOWN TO OTHER PLAYERS ONLINE', 'ANDERE SPIELER SEHEN IHN ONLINE', 'ЕГО ВИДЯТ ДРУГИЕ ИГРОКИ ОНЛАЙН'],
  ['SAVE', 'SPEICHERN', 'СОХРАНИТЬ'], ['SPACE', 'LEER', 'ПРОБЕЛ'], ['RANDOM', 'ZUFALL', 'СЛУЧАЙНО'], ['DEL', 'LÖSCHEN', 'СТЕРЕТЬ'],
  ["THAT NAME ISN'T ALLOWED", 'DIESER NAME IST NICHT ERLAUBT', 'ТАКОЕ ИМЯ НЕЛЬЗЯ'], ['NAME IS TOO SHORT', 'NAME IST ZU KURZ', 'ИМЯ СЛИШКОМ КОРОТКОЕ'],
  // power-ups and overcharge
  ['EGGS BLOCK BULLETS, PUSH ROBOTS', 'EIER BLOCKEN SCHÜSSE, SCHUBSEN ROBOTER', 'ЯЙЦА БЛОКИРУЮТ ПУЛИ И ОТТАЛКИВАЮТ'],
  ['FEATHER DARTS', 'FEDERPFEILE', 'ПЕРЬЯ-ДРОТИКИ'], ['MORE DARTS, MORE DAMAGE', 'MEHR PFEILE, MEHR SCHADEN', 'БОЛЬШЕ ДРОТИКОВ И УРОНА'],
  ['HOMING FEATHERS HUNT ROBOTS', 'ZIELSUCHENDE FEDERN JAGEN ROBOTER', 'САМОНАВОДЯЩИЕСЯ ПЕРЬЯ'],
  ['SPLASH PUDDLE', 'PLATSCHPFÜTZE', 'ЛУЖА-ПЛЮХ'], ['BIGGER PUDDLES, MORE DAMAGE', 'GRÖSSERE PFÜTZEN, MEHR SCHADEN', 'ЛУЖИ БОЛЬШЕ, УРОН СИЛЬНЕЕ'],
  ['DROP PUDDLES THAT HURT ROBOTS', 'PFÜTZEN, DIE ROBOTERN WEHTUN', 'ЛУЖИ, КОТОРЫЕ РАНЯТ РОБОТОВ'],
  ['BUBBLE SHIELD', 'BLASENSCHILD', 'ПУЗЫРЬ-ЩИТ'], ['SHIELD COMES BACK FASTER', 'SCHILD LÄDT SCHNELLER', 'ЩИТ ВОССТАНАВЛИВАЕТСЯ БЫСТРЕЕ'],
  ['BLOCKS A HIT, THEN RECHARGES', 'BLOCKT EINEN TREFFER, LÄDT DANN NEU', 'БЛОКИРУЕТ УДАР И ПЕРЕЗАРЯЖАЕТСЯ'],
  ['POWER-UP', 'POWER-UP', 'УСИЛЕНИЕ'], ['OVERCHARGE', 'ÜBERLADUNG', 'ПЕРЕГРУЗКА'], ['OVERCHARGE!', 'ÜBERLADUNG!', 'ПЕРЕГРУЗКА!'], ['MAX+', 'MAX+', 'МАКС+'],
  ['GIANT EGGS', 'RIESENEIER', 'ГИГАНТСКИЕ ЯЙЦА'], ['HUGE EGGS SPIN WAY FASTER', 'RIESIGE EIER DREHEN SICH VIEL SCHNELLER', 'ОГРОМНЫЕ ЯЙЦА КРУТЯТСЯ НАМНОГО БЫСТРЕЕ'],
  ['BREAD STORM', 'BROTSTURM', 'ХЛЕБНЫЙ ШТОРМ'], ['EVERY BOMB SPLITS INTO MORE', 'JEDE BOMBE TEILT SICH AUF', 'КАЖДАЯ БОМБА РАСПАДАЕТСЯ НА НЕСКОЛЬКО'],
  ['THUNDERSTORM', 'GEWITTER', 'ГРОЗА'], ['ZAPS JUMP TO EVERYTHING', 'BLITZE SPRINGEN ÜBERALL HIN', 'РАЗРЯДЫ БЬЮТ ПО ВСЕМ'],
  ['SONIC QUACK', 'SCHALL-QUAK', 'ЗВУКОВОЕ КРЯ'], ['GIANT QUACK, TWICE AS OFTEN', 'RIESEN-QUAK, DOPPELT SO OFT', 'ОГРОМНОЕ КРЯ ВДВОЕ ЧАЩЕ'],
  ['FEATHER STORM', 'FEDERSTURM', 'ПЕРЬЕВОЙ ШТОРМ'], ['TWICE THE DARTS, THEY PIERCE', 'DOPPELT SO VIELE, DURCHBOHRENDE PFEILE', 'ВДВОЕ БОЛЬШЕ ДРОТИКОВ, ПРОБИВАЮТ'],
  ['LAVA LAKE', 'LAVASEE', 'ЛАВОВОЕ ОЗЕРО'], ['HUGE BURNING PUDDLES', 'RIESIGE BRENNENDE PFÜTZEN', 'ОГРОМНЫЕ ГОРЯЩИЕ ЛУЖИ'],
  ['MIRROR SHIELD', 'SPIEGELSCHILD', 'ЗЕРКАЛЬНЫЙ ЩИТ'], ['RECHARGES FAST, POPS BULLETS', 'LÄDT SCHNELL, ZERSTÖRT SCHÜSSE', 'БЫСТРО ЗАРЯЖАЕТСЯ, ЛОПАЕТ ПУЛИ'],
  ['ONLINE IS OUT!', 'ONLINE IST DA!', 'ОНЛАЙН УЖЕ ЗДЕСЬ!'], ['HOST A GAME AND SHARE THE 4 LETTER CODE', 'ERSTELLE EIN SPIEL UND TEILE DEN CODE', 'СОЗДАЙ ИГРУ И ПОДЕЛИСЬ КОДОМ'],
  ['TRY IT!', 'AUSPROBIEREN!', 'ПОПРОБОВАТЬ!'], ['LATER', 'SPÄTER', 'ПОТОМ'],
  ['ONLY THE ADMIN CAN GIVE THIS', 'NUR DER ADMIN KANN DAS VERSCHENKEN', 'ЭТО МОЖЕТ ПОДАРИТЬ ТОЛЬКО АДМИН'],
  ['ADMIN GIFT!', 'ADMIN-GESCHENK!', 'ПОДАРОК АДМИНА!'], ['YOU GOT:', 'DU HAST BEKOMMEN:', 'ТЫ ПОЛУЧИЛ:'], ['YOU GOT {0} COINS!', 'DU HAST {0} MÜNZEN BEKOMMEN!', 'ТЫ ПОЛУЧИЛ {0} МОНЕТ!'],
  ['A MESSAGE FROM THE ADMIN', 'EINE NACHRICHT VOM ADMIN', 'СООБЩЕНИЕ ОТ АДМИНА'], ['FROM {0}:', 'VON {0}:', 'ОТ {0}:'],
  ['MESSAGE', 'NACHRICHT', 'СООБЩЕНИЕ'], ['MESSAGE: {0}  >', 'NACHRICHT: {0}  >', 'СООБЩЕНИЕ: {0}  >'], ['(NONE)', '(KEINE)', '(НЕТ)'],
  ['SEND MESSAGE', 'NACHRICHT SENDEN', 'ОТПРАВИТЬ СООБЩЕНИЕ'], ['GOES WITH YOUR NEXT GIFT, OR SEND IT ALONE', 'KOMMT MIT DEM NÄCHSTEN GESCHENK ODER ALLEIN', 'УЙДЕТ С ПОДАРКОМ ИЛИ ОТДЕЛЬНО'],
  ['SEND', 'SENDEN', 'ОТПРАВИТЬ'], ['OPEN GIFT TAB', 'GESCHENKE ÖFFNEN', 'ОТКРЫТЬ ПОДАРКИ'], ['GIFTS FOR {0}', 'GESCHENKE FÜR {0}', 'ПОДАРКИ ДЛЯ {0}'],
  ['COINS', 'MÜNZEN', 'МОНЕТЫ'], ['ALREADY HAS IT', 'HAT ES SCHON', 'УЖЕ ЕСТЬ'], ['{0} ITEMS', '{0} SACHEN', 'ПРЕДМЕТОВ: {0}'], ['{0} COINS', '{0} MÜNZEN', '{0} МОНЕТ'], ['{0} ITEMS + {1} COINS', '{0} SACHEN + {1} MÜNZEN', 'ПРЕДМЕТОВ: {0} + {1} МОНЕТ'],
  ['TAP AMOUNTS TO ADD THEM UP', 'TIPPE BETRÄGE ZUM ZUSAMMENZÄHLEN', 'НАЖИМАЙ СУММЫ, ОНИ СЛОЖАТСЯ'], ['TAP ITEMS TO PICK THEM', 'TIPPE SACHEN ZUM AUSWÄHLEN', 'НАЖИМАЙ НА ПРЕДМЕТЫ, ЧТОБЫ ВЫБРАТЬ'],
  ['ALL MISSING', 'ALLE FEHLENDEN', 'ВСЕ НЕДОСТАЮЩИЕ'], ['MESSAGE: {0}', 'NACHRICHT: {0}', 'СООБЩЕНИЕ: {0}'], ['SEND ({0})', 'SENDEN ({0})', 'ОТПРАВИТЬ ({0})'],
  ['SEND MESSAGE', 'NACHRICHT SENDEN', 'ОТПРАВИТЬ СООБЩЕНИЕ'], ['SENDING...', 'SENDE...', 'ОТПРАВКА...'], ['YOU GOT {0} ITEMS!', 'DU HAST {0} SACHEN BEKOMMEN!', 'ТЫ ПОЛУЧИЛ {0} ПРЕДМЕТОВ!'],
  ['+{0} MORE', '+{0} WEITERE', 'И ЕЩЁ {0}'], ['AND {0} COINS!', 'UND {0} MÜNZEN!', 'И {0} МОНЕТ!'], ['WRITE A MESSAGE', 'SCHREIB EINE NACHRICHT', 'НАПИШИ СООБЩЕНИЕ'], ['CLEAR', 'LEEREN', 'ОЧИСТИТЬ'],
  // accounts and admin
  ['CONNECTING', 'VERBINDE', 'ПОДКЛЮЧЕНИЕ'], ['CONNECT TO THE INTERNET', 'VERBINDE DICH MIT DEM INTERNET', 'ПОДКЛЮЧИСЬ К ИНТЕРНЕТУ'],
  ['YOU NEED IT ONCE TO MAKE YOUR ACCOUNT', 'EINMAL NÖTIG FÜR DEIN KONTO', 'НУЖНО ОДИН РАЗ, ЧТОБЫ СОЗДАТЬ АККАУНТ'], ['TRY AGAIN', 'NOCHMAL', 'ЕЩЕ РАЗ'],
  ['WELCOME, DUCK!', 'HALLO, ENTE!', 'ПРИВЕТ, УТКА!'], ['USERNAME', 'BENUTZERNAME', 'ЛОГИН'], ['SHOWN TO OTHER PLAYERS', 'SEHEN ANDERE SPIELER', 'ВИДЯТ ДРУГИЕ ИГРОКИ'],
  ['ONLY YOURS - CAN NOT BE CHANGED', 'NUR DEINER - NICHT ÄNDERBAR', 'ТОЛЬКО ТВОЙ - НЕ МЕНЯЕТСЯ'],
  ['USERNAME NEEDS {0} TO {1} LETTERS', 'BENUTZERNAME BRAUCHT {0} BIS {1} ZEICHEN', 'ЛОГИН: ОТ {0} ДО {1} СИМВОЛОВ'],
  ['THAT USERNAME IS TAKEN', 'DER BENUTZERNAME IST VERGEBEN', 'ЭТОТ ЛОГИН УЖЕ ЗАНЯТ'], ["COULDN'T CREATE THE ACCOUNT", 'KONTO KONNTE NICHT ERSTELLT WERDEN', 'НЕ УДАЛОСЬ СОЗДАТЬ АККАУНТ'],
  ['CREATING...', 'ERSTELLE...', 'СОЗДАЕМ...'], ['CREATE ACCOUNT', 'KONTO ERSTELLEN', 'СОЗДАТЬ АККАУНТ'],
  ['YOU ARE BANNED', 'DU BIST GESPERRT', 'ТЫ ЗАБАНЕН'], ['ONLY THE ADMIN CAN UNBAN YOU', 'NUR DER ADMIN KANN DICH ENTSPERREN', 'РАЗБАНИТЬ МОЖЕТ ТОЛЬКО АДМИН'],
  ['THE ADMIN RESET YOUR PROGRESS', 'DER ADMIN HAT DEINEN FORTSCHRITT ZURÜCKGESETZT', 'АДМИН СБРОСИЛ ТВОЙ ПРОГРЕСС'],
  ['A GIFT FROM THE ADMIN!', 'EIN GESCHENK VOM ADMIN!', 'ПОДАРОК ОТ АДМИНА!'],
  ['ADMIN', 'ADMIN', 'АДМИН'], ['TAP TO TYPE A USERNAME', 'TIPPEN FÜR BENUTZERNAMEN', 'НАЖМИ, ЧТОБЫ ВВЕСТИ ЛОГИН'], ['SEARCH', 'SUCHEN', 'ПОИСК'],
  ['NOBODY FOUND', 'NIEMAND GEFUNDEN', 'НИКОГО НЕ НАЙДЕНО'], ['ONLY THE ADMIN CAN DO THAT', 'DAS DARF NUR DER ADMIN', 'ЭТО МОЖЕТ ТОЛЬКО АДМИН'],
  ['NEWEST PLAYERS', 'NEUESTE SPIELER', 'НОВЫЕ ИГРОКИ'], ['BANNED', 'GESPERRT', 'ЗАБАНЕН'], ['FLAGS {0}/{1}', 'MELDUNGEN {0}/{1}', 'ЖАЛОБЫ {0}/{1}'],
  ['ALL GOOD', 'ALLES OK', 'ВСЕ ХОРОШО'], ['LOADING...', 'LÄDT...', 'ЗАГРУЗКА...'],
  ['COINS {0}   UNLOCKED {1}   STORY LEVEL {2}', 'MÜNZEN {0}   FREIGESCHALTET {1}   STORY-LEVEL {2}', 'МОНЕТЫ {0}   ПРЕДМЕТЫ {1}   УРОВЕНЬ {2}'],
  ['FLAG ({0}/{1})', 'MELDEN ({0}/{1})', 'ЖАЛОБА ({0}/{1})'], ['REMOVE FLAG', 'MELDUNG WEG', 'УБРАТЬ ЖАЛОБУ'], ['BAN', 'SPERREN', 'ЗАБАНИТЬ'], ['UNBAN', 'ENTSPERREN', 'РАЗБАНИТЬ'],
  ['FLAGGED', 'GEMELDET', 'ЖАЛОБА ДОБАВЛЕНА'], ['FLAGGED 3 TIMES - BANNED!', '3 MAL GEMELDET - GESPERRT!', '3 ЖАЛОБЫ - ЗАБАНЕН!'], ['FLAG REMOVED', 'MELDUNG ENTFERNT', 'ЖАЛОБА УБРАНА'],
  ['UNBANNED', 'ENTSPERRT', 'РАЗБАНЕН'], ['RESET PROGRESS', 'FORTSCHRITT ZURÜCKSETZEN', 'СБРОСИТЬ ПРОГРЕСС'], ['SURE? TAP AGAIN TO RESET', 'SICHER? NOCHMAL TIPPEN', 'ТОЧНО? НАЖМИ ЕЩЕ РАЗ'],
  ['PROGRESS RESET', 'ZURÜCKGESETZT', 'ПРОГРЕСС СБРОШЕН'], ['GIVE COINS', 'MÜNZEN GEBEN', 'ДАТЬ МОНЕТЫ'], ['GIVE ITEM', 'ITEM GEBEN', 'ДАТЬ ПРЕДМЕТ'], ['GIVE', 'GEBEN', 'ДАТЬ'],
  ['SENT!', 'GESENDET!', 'ОТПРАВЛЕНО!'], ['GIVE THE WIZARD HAT', 'ZAUBERHUT VERSCHENKEN', 'ПОДАРИТЬ ШЛЯПУ МАГА'],
  // online
  ["THIS DEVICE CAN'T PLAY ONLINE", 'DIESES GERÄT KANN NICHT ONLINE SPIELEN', 'ЭТО УСТРОЙСТВО НЕ МОЖЕТ ИГРАТЬ ОНЛАЙН'],
  ['NO INTERNET CONNECTION?', 'KEINE INTERNETVERBINDUNG?', 'НЕТ ИНТЕРНЕТА?'], ["CAN'T REACH THE MATCHMAKER", 'MATCHMAKER NICHT ERREICHBAR', 'СЕРВЕР ПОИСКА НЕДОСТУПЕН'],
  ['LOST THE MATCHMAKER', 'MATCHMAKER VERLOREN', 'ПОТЕРЯН СЕРВЕР ПОИСКА'], ["COULDN'T CONNECT TO YOUR FRIEND", 'KEINE VERBINDUNG ZUM FREUND', 'НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ К ДРУГУ'],
  ["COULDN'T CONNECT", 'VERBINDUNG FEHLGESCHLAGEN', 'НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ'], ['THAT GAME HAS ALREADY STARTED', 'DAS SPIEL LÄUFT SCHON', 'ИГРА УЖЕ НАЧАЛАСЬ'],
  ['THAT LOBBY IS FULL', 'DIE LOBBY IST VOLL', 'ЛОББИ ЗАПОЛНЕНО'], ['HOST LEFT', 'DER HOST IST WEG', 'ХОСТ ВЫШЕЛ'],
  ["COULDN'T START ONLINE", 'ONLINE STARTET NICHT', 'НЕ УДАЛОСЬ ЗАПУСТИТЬ ОНЛАЙН'], ["COULDN'T MAKE A LOBBY CODE", 'KEIN LOBBY-CODE MÖGLICH', 'НЕ УДАЛОСЬ СОЗДАТЬ КОД'],
  ["COULDN'T CONNECT - TRY AGAIN", 'KEINE VERBINDUNG - NOCHMAL', 'НЕ УДАЛОСЬ - ПОПРОБУЙ ЕЩЕ'], ['NO LOBBY WITH CODE {0}', 'KEINE LOBBY MIT CODE {0}', 'НЕТ ЛОББИ С КОДОМ {0}'],
  ['LOST THE HOST', 'HOST VERLOREN', 'СВЯЗЬ С ХОСТОМ ПОТЕРЯНА'], ['MAKING A LOBBY', 'LOBBY WIRD ERSTELLT', 'СОЗДАЕМ ЛОББИ'],
  ['TYPE ALL 4 CODE LETTERS', 'GIB ALLE 4 ZEICHEN EIN', 'ВВЕДИ ВСЕ 4 СИМВОЛА'], ['LOOKING FOR LOBBY {0}', 'SUCHE LOBBY {0}', 'ИЩЕМ ЛОББИ {0}'],
  ['CANCEL', 'ABBRECHEN', 'ОТМЕНА'], ['PLAY TOGETHER, EACH ON YOUR OWN PHONE OR PC', 'SPIELT ZUSAMMEN, JEDER AUF SEINEM HANDY ODER PC', 'ИГРАЙТЕ ВМЕСТЕ, КАЖДЫЙ СО СВОЕГО ТЕЛЕФОНА ИЛИ ПК'],
  ['YOUR NAME: {0}  >', 'DEIN NAME: {0}  >', 'ТВОЕ ИМЯ: {0}  >'], ['HOST A GAME', 'SPIEL ERSTELLEN', 'СОЗДАТЬ ИГРУ'],
  ['GET A CODE FOR YOUR FRIENDS', 'CODE FÜR DEINE FREUNDE', 'КОД ДЛЯ ДРУЗЕЙ'], ['JOIN A FRIEND', 'FREUND BEITRETEN', 'К ДРУГУ'],
  ['TYPE THEIR 4 LETTER CODE', 'GIB SEINEN CODE EIN', 'ВВЕДИ ЕГО КОД'],
  ['NO SERVER NEEDED - DEVICES CONNECT DIRECTLY OVER THE INTERNET', 'KEIN SERVER NÖTIG - GERÄTE VERBINDEN SICH DIREKT', 'СЕРВЕР НЕ НУЖЕН - УСТРОЙСТВА СОЕДИНЯЮТСЯ НАПРЯМУЮ'],
  ['ASK THEM FOR THEIR 4 LETTER CODE', 'FRAG NACH DEM 4-STELLIGEN CODE', 'СПРОСИ У ДРУГА КОД ИЗ 4 СИМВОЛОВ'], ['JOIN', 'LOS', 'ВОЙТИ'],
  ['CONNECTING TO THE LOBBY...', 'VERBINDE MIT DER LOBBY...', 'ПОДКЛЮЧЕНИЕ К ЛОББИ...'], ['LOBBY {0}', 'LOBBY {0}', 'ЛОББИ {0}'],
  ['TELL YOUR FRIENDS TO JOIN WITH CODE {0}', 'FREUNDE TRETEN MIT CODE {0} BEI', 'ДРУЗЬЯ ВХОДЯТ ПО КОДУ {0}'],
  ["IN {0}'S LOBBY", 'IN DER LOBBY VON {0}', 'В ЛОББИ ИГРОКА {0}'], ['YOU', 'DU', 'ТЫ'], ['HOST', 'HOST', 'ХОСТ'],
  ['READY!', 'BEREIT!', 'ГОТОВ!'], ['NOT READY', 'NICHT BEREIT', 'НЕ ГОТОВ'], ['OPEN SLOT', 'FREIER PLATZ', 'СВОБОДНО'],
  ['STORY {0}: {1}', 'STORY {0}: {1}', 'СЮЖЕТ {0}: {1}'], ['MODE: {0}   >', 'MODUS: {0}   >', 'РЕЖИМ: {0}   >'], ['MODE: {0}', 'MODUS: {0}', 'РЕЖИМ: {0}'],
  ['START WHEN EVERYONE IS HERE. ALL DEVICES NEED TO STAY OPEN.', 'STARTE, WENN ALLE DA SIND. ALLE GERÄTE MÜSSEN AN BLEIBEN.', 'НАЧИНАЙ, КОГДА ВСЕ В СБОРЕ. НЕ ЗАКРЫВАЙТЕ ИГРУ.'],
  ['WAITING FOR THE HOST TO START...', 'WARTE AUF DEN HOST...', 'ЖДЕМ, ПОКА ХОСТ НАЧНЕТ...'], ['START', 'START', 'СТАРТ'], ['LEAVE', 'VERLASSEN', 'ВЫЙТИ'],
  ['CONNECTION LOST', 'VERBINDUNG VERLOREN', 'СОЕДИНЕНИЕ ПОТЕРЯНО'], ['LEFT THE GAME', 'SPIEL VERLASSEN', 'ТЫ ВЫШЕЛ ИЗ ИГРЫ'], ['BACK TO LOBBY', 'ZUR LOBBY', 'В ЛОББИ'],
  ['{0} LEFT THE GAME', '{0} IST GEGANGEN', '{0} ВЫШЕЛ ИЗ ИГРЫ'],
];
const DICT = { de: {}, ru: {} };
function addPhrases(list) { for (const [en, de, ru] of list) { DICT.de[en] = de; DICT.ru[en] = ru; } trCache.clear(); }
addPhrases(PHRASES);

// ================================================================ player names
const NAME_MAX = 12;
const NAME_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// substrings that are never fine, in English, German and Russian (written in Latin letters)
const BAD_PARTS = [
  'FUCK', 'FCK', 'FVCK', 'SHIT', 'CUNT', 'NIGG', 'NIGA', 'NIGER', 'NIGR', 'FAGGOT', 'FAGOT', 'WHORE', 'SLUT', 'BITCH', 'PUSSY', 'PENIS',
  'VAGINA', 'PORN', 'SEX', 'BOOB', 'NAZI', 'HITLER', 'RAPIST', 'ARSEHOLE', 'ASSHOLE', 'DILDO', 'JIZZ', 'MOLEST', 'PEDOPHIL', 'PAEDO', 'RETARD',
  'TRANNY', 'KIKE', 'CHINK', 'WETBACK', 'TWAT', 'WANK', 'BASTARD', 'PISS', 'CLIT', 'ORGASM', 'NAKED', 'HORNY', 'KILLYOURSELF', 'SUICIDE', 'KKK',
  'SIEGHEIL', 'HEILHITLER', 'SCHEIS', 'FICK', 'FOTZE', 'VOTZE', 'HURE', 'NUTTE', 'WICHS', 'ARSCH', 'SCHLAMPE', 'MISSGEBURT', 'SPAST', 'NEGER',
  'KANAKE', 'SCHWUCHTEL', 'PIMMEL', 'MUSCHI', 'TITTEN', 'BUMSEN', 'BLYAT', 'BLYAD', 'BLJAT', 'SUKA', 'KHUY', 'XUY', 'PIZD',
  'YEBAT', 'YOBAN', 'EBLAN', 'MUDAK', 'PIDOR', 'PIDAR', 'PIDR', 'GANDON', 'ZALUPA', 'DOLBOEB', 'SHLUHA', 'SHLYUHA', 'GOVNO', 'CHMO',
];
// whole words that are fine inside longer ones (CLASS, GRAPE, PEACOCK, SCUMMY...)
const BAD_WORDS = ['ASS', 'ASSES', 'ARSE', 'ANAL', 'ANUS', 'CUM', 'TIT', 'TITS', 'COCK', 'COCKS', 'DICK', 'DICKS', 'FAG', 'FAGS', 'HOE', 'HOES', 'RAPE',
  'RAPED', 'KYS', 'SPIC', 'DYKE', 'PRICK', 'HUY', 'HUI', 'HUJ', 'SUKI', 'NEGRO', 'SEXY', 'PUTA', 'BLAT', 'FU', 'PEDO', 'NUDE', 'NUDES', 'EBAT', 'EBAN'];
const LEET = { 0: 'O', 1: 'I', 2: 'Z', 3: 'E', 4: 'A', 5: 'S', 6: 'G', 7: 'T', 8: 'B', 9: 'G', '@': 'A', '$': 'S', '!': 'I', '|': 'I', '+': 'T' };
const squash = s => s.replace(/(.)\1+/g, '$1'); // FUUUCK -> FUCK
const BAD_PARTS_SQ = BAD_PARTS.filter(b => squash(b) === b); // FUUUCK still matches FUCK; NIGG must not shrink to NIG (KNIGHT)
function isBadName(name) {
  const up = String(name || '').toUpperCase().replace(/[0-9@$!|+]/g, c => LEET[c] || c);
  const words = up.split(/[^A-Z]+/).filter(Boolean), flat = words.join(''), flatSq = squash(flat);
  if (BAD_PARTS.some(b => flat.includes(b)) || BAD_PARTS_SQ.some(b => flatSq.includes(b))) return true;
  return words.some(w => BAD_WORDS.includes(w) || BAD_WORDS.includes(squash(w))) || BAD_WORDS.includes(flat);
}
// letters, numbers and single spaces only; empty or rude names fall back
function cleanName(str, fallback = 'DUCK') {
  const s = String(str || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/ +/g, ' ').trim().slice(0, NAME_MAX).trim();
  return s.length >= 2 && !isBadName(s) ? s : fallback;
}
