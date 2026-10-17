'use strict';
/* QUACK ATTACK! — updates. When the game starts it asks GitHub which build is the newest (the CI publishes every
 * build as a release, see .github/workflows/build-apps.yml). If this copy is older, an UPDATE screen pops up:
 *   UPDATE  Android: downloads the new APK inside the game and opens the installer (UpdaterPlugin.java),
 *           which installs it over this version and then offers to open it. PC: downloads the new exe, closes the game,
 *           puts it in the old one's place and starts it (main.js). Browser: opens the download page.
 *   CLOSE   leaves the game (in a browser tab, where that's impossible, it just closes the popup). */

const UPDATE_REPO = 'vladypiatko-crypto/fp';
const Update = { latest: 0, apk: null, exe: null, page: 'https://github.com/' + UPDATE_REPO + '/releases/latest', shown: false, checkedAt: 0 };
const NATIVE_ANDROID = !!(window.Capacitor && window.Capacitor.nativePromise);
const DESKTOP = !!window.quackDesktop; // the Windows app (preload.js)
const updater = (method, opts = {}) => window.Capacitor.nativePromise('QuackUpdater', method, opts);

// the newest build number: first the little file every build publishes (build-apps.yml) - quick, and there's no
// limit on how often it can be asked; if that doesn't answer, GitHub's release list (60 questions an hour per address)
async function newestBuild() {
  try {
    const r = await withTimeout(fetch('https://raw.githubusercontent.com/' + UPDATE_REPO + '/update-info/latest.json?t=' + Date.now(), { cache: 'no-store' }), 6000);
    if (r.ok) { const n = parseInt((await r.json()).build, 10); if (n > 0) return n; }
  } catch (e) { /* try the other way */ }
  const r = await withTimeout(fetch('https://api.github.com/repos/' + UPDATE_REPO + '/releases/latest', { cache: 'no-store' }), 8000);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return parseInt(String((await r.json()).tag_name || '').replace('build-', ''), 10) || 0;
}
// 'newer' | 'newest' | 'failed' (offline...) | 'local' (a copy without a build number)
async function checkForUpdate() {
  const q = new URLSearchParams(location.search);
  if (q.get('update')) { Update.latest = +q.get('update'); return 'newer'; } // tests: ?update=99 pretends build 99 is out
  if (!GAME_BUILD) return 'local'; // a local copy, not a published build
  Update.checkedAt = Date.now();
  let n;
  try { n = await newestBuild(); } catch (e) { return 'failed'; }
  Update.newest = n;
  if (!(n > GAME_BUILD)) return 'newest';
  const dl = 'https://github.com/' + UPDATE_REPO + '/releases/download/build-' + n + '/';
  Update.apk = dl + 'QuackAttack-Android.apk'; Update.exe = dl + 'QuackAttack-Windows.exe';
  Update.page = 'https://github.com/' + UPDATE_REPO + '/releases/tag/build-' + n;
  if (n > Update.latest) Update.shown = false; // an even newer build than the one we told you about: ask again
  Update.latest = n;
  return 'newer';
}
// Settings -> CHECK FOR UPDATES: check right now and say what happened
function checkNow(done) {
  Update.shown = false;
  checkForUpdate().then(r => done(r === 'newer' ? fmt('BUILD {0} IS OUT!', Update.latest) : r === 'newest' ? fmt('YOU HAVE THE NEWEST BUILD ({0})', GAME_BUILD)
    : r === 'local' ? 'THIS COPY HAS NO BUILD NUMBER' : "COULDN'T CHECK - NO INTERNET?"));
}
// phones keep the game running in the background, so it's rarely really "started": check again whenever you come
// back to it (unless we just did), and every 2 minutes while it's open
AppState.onBack.push(() => { if (Date.now() - Update.checkedAt > 20000) checkForUpdate(); });
setInterval(() => { if (!AppState.away) checkForUpdate(); }, 2 * 60 * 1000);
// pops up on the next menu (never in the middle of a fight)
function showUpdatePopup() {
  if (!Update.latest || Update.shown || Trans.busy()) return;
  const top = Scenes.top();
  if (!top || top instanceof GameScene || top instanceof BootScene || top instanceof UpdateScene) return;
  Update.shown = true;
  Scenes.push(new UpdateScene());
}

class UpdateScene {
  constructor() { this.t = 0; this.ui = new UI(); this.st = 'ask'; this.p = 0; this.pollT = 0; sfx.chestOpen('epic'); }
  update(dt) {
    this.t += dt;
    if (this.st === 'down' && NATIVE_ANDROID && (this.pollT -= dt) <= 0) { // how far the download is
      this.pollT = 0.25;
      updater('progress').then(r => { if (r && r.p >= 0) this.p = r.p; }).catch(() => {});
    }
    this.ui.update(dt, this.t > 0.5 ? Input.menu() : null); // the back button does nothing: update or close
  }
  go() {
    if (DESKTOP && Update.exe) { // Windows: the app downloads the new exe, swaps it in and restarts into it
      this.st = 'down'; this.p = 0;
      window.quackDesktop.onProgress(p => { this.p = p; });
      window.quackDesktop.update(Update.exe).then(r => { this.st = r === 'restarting' ? 'restart' : 'ask'; this.p = 100; sfx.pickup(); }).catch(() => { this.st = 'fail'; sfx.uiBack(); });
      return;
    }
    if (!NATIVE_ANDROID || !Update.apk) { window.open(Update.page, '_blank'); return; }
    this.st = 'down'; this.p = 0;
    updater('update', { url: Update.apk }).then(() => { this.st = 'install'; this.p = 100; sfx.pickup(); }).catch(() => { this.st = 'fail'; sfx.uiBack(); });
  }
  close() {
    if (NATIVE_ANDROID) { updater('quit').catch(() => {}); return; }
    if (navigator.userAgent.includes('Electron')) { window.close(); return; }
    Scenes.pop(); // a browser tab can't close itself
  }
  draw() {
    const prev = Scenes.stack[Scenes.stack.length - 2];
    if (prev) prev.draw();
    const T = this.t, k = Ease.outBack(Math.min(1, T / 0.4));
    ctx.fillStyle = 'rgba(15,10,26,0.86)'; ctx.fillRect(0, 0, W, H);
    // light rays behind the panel
    ctx.save(); ctx.translate(W / 2, H * 0.4); ctx.rotate(T * 0.5); ctx.fillStyle = 'rgba(81,207,102,0.09)';
    for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -H); ctx.lineTo(12, -H); ctx.fill(); }
    ctx.restore();
    const pw = Math.min(W - 16, 250), ph = Math.min(H - 16, 140), px = Math.floor(W / 2 - pw / 2), py = Math.floor(H / 2 - ph / 2 + (1 - k) * 40);
    panel(px, py, pw, ph, C.uiD, C.green, C.uiL);
    const nw = textW('NEW!') + 8; panel(px + 8, py - 5, nw, 10, C.pink, OUT, null, false); text('NEW!', px + 8 + nw / 2, py - 3, OUT, 1, 1, null);
    drawZoomText('UPDATE AVAILABLE!', W / 2, py + 18, lerp(5, 2, k), C.green);
    text(fmt('BUILD {0} IS OUT! YOU HAVE BUILD {1}', Update.latest, GAME_BUILD), W / 2, py + 34, C.white, 1, 1);
    // a duck carrying a present box (the update)
    const dy = py + 66 - Math.abs(Math.sin(T * 5)) * 3;
    drawDuck(W / 2 - 10, dy, { skin: Save.data.loadout[0].skin, hat: Save.data.loadout[0].hat, facing: 'right', t: T, frame: Math.floor(T * 6) % 2, sc: 2 });
    panel(W / 2 + 4, dy - 14, 14, 12, C.green, OUT, '#8fe39a', false); ctx.fillStyle = C.gold; ctx.fillRect(W / 2 + 10, dy - 14, 2, 12); ctx.fillRect(W / 2 + 4, dy - 9, 14, 2);
    const ui = this.ui; ui.begin();
    const by = py + ph - 22, bw = Math.floor((pw - 30) / 2);
    if (this.st === 'ask' || this.st === 'fail') {
      text(this.st === 'fail' ? 'DOWNLOAD FAILED - CHECK YOUR INTERNET' : 'UPDATE TO GET ALL THE NEWEST STUFF', W / 2, py + 76, this.st === 'fail' ? C.red : C.gray, 1, 1);
      drawButton(ui, 'upd', px + 10, by, bw, 16, this.st === 'fail' ? 'TRY AGAIN' : 'UPDATE', { col: '#1f5c3a', def: true, on: () => this.go() });
      drawButton(ui, 'close', px + pw - 10 - bw, by, bw, 16, 'CLOSE', { col: '#6b1f2a', on: () => this.close() });
    } else if (this.st === 'down') {
      text(fmt('DOWNLOADING... {0}%', this.p), W / 2, py + 76, C.white, 1, 1);
      const bx = px + 16, bww = pw - 32;
      panel(bx, by + 2, bww, 10, '#2a2535', OUT, null, false);
      ctx.fillStyle = C.green; ctx.fillRect(bx + 1, by + 3, Math.round((bww - 2) * this.p / 100), 8);
    } else if (this.st === 'restart') {
      text('RESTARTING WITH THE NEW VERSION...', W / 2, py + 76, C.gold, 1, 1, 'outline');
    } else { // the installer is open
      text('TAP INSTALL, THEN OPEN', W / 2, py + 76, C.gold, 1, 1, 'outline');
      drawButton(ui, 'again', px + 10, by, bw, 16, 'INSTALL AGAIN', { col: '#1f5c3a', on: () => this.go() });
      drawButton(ui, 'close', px + pw - 10 - bw, by, bw, 16, 'CLOSE', { col: '#6b1f2a', on: () => this.close() });
    }
  }
}

addPhrases([
  ['UPDATE AVAILABLE!', 'UPDATE VERFÜGBAR!', 'ЕСТЬ ОБНОВЛЕНИЕ!'], ['BUILD {0} IS OUT! YOU HAVE BUILD {1}', 'BUILD {0} IST DA! DU HAST BUILD {1}', 'ВЫШЛА ВЕРСИЯ {0}! У ТЕБЯ ВЕРСИЯ {1}'],
  ['UPDATE TO GET ALL THE NEWEST STUFF', 'AKTUALISIERE FÜR ALLE NEUEN SACHEN', 'ОБНОВИСЬ, ЧТОБЫ ПОЛУЧИТЬ ВСЁ НОВОЕ'], ['UPDATE', 'AKTUALISIEREN', 'ОБНОВИТЬ'], ['CLOSE', 'SCHLIESSEN', 'ЗАКРЫТЬ'],
  ['DOWNLOAD FAILED - CHECK YOUR INTERNET', 'DOWNLOAD FEHLGESCHLAGEN - PRÜFE DEIN INTERNET', 'ОШИБКА ЗАГРУЗКИ - ПРОВЕРЬ ИНТЕРНЕТ'], ['TRY AGAIN', 'NOCHMAL', 'ЕЩЁ РАЗ'],
  ['DOWNLOADING... {0}%', 'LÄDT HERUNTER... {0}%', 'ЗАГРУЗКА... {0}%'], ['TAP INSTALL, THEN OPEN', 'TIPPE AUF INSTALLIEREN, DANN ÖFFNEN', 'НАЖМИ УСТАНОВИТЬ, ПОТОМ ОТКРЫТЬ'],
  ['INSTALL AGAIN', 'NOCHMAL INSTALLIEREN', 'УСТАНОВИТЬ СНОВА'], ['CHECK FOR UPDATES', 'NACH UPDATES SUCHEN', 'ПРОВЕРИТЬ ОБНОВЛЕНИЯ'], ['CHECKING...', 'PRÜFE...', 'ПРОВЕРЯЮ...'],
  ['BUILD {0} IS OUT!', 'BUILD {0} IST DA!', 'ВЫШЛА ВЕРСИЯ {0}!'], ['YOU HAVE THE NEWEST BUILD ({0})', 'DU HAST DEN NEUESTEN BUILD ({0})', 'У ТЕБЯ САМАЯ НОВАЯ ВЕРСИЯ ({0})'],
  ['THIS COPY HAS NO BUILD NUMBER', 'DIESE KOPIE HAT KEINE BUILD-NUMMER', 'У ЭТОЙ КОПИИ НЕТ НОМЕРА ВЕРСИИ'], ["COULDN'T CHECK - NO INTERNET?", 'PRÜFEN FEHLGESCHLAGEN - KEIN INTERNET?', 'НЕ УДАЛОСЬ ПРОВЕРИТЬ - НЕТ ИНТЕРНЕТА?'], ['RESTARTING WITH THE NEW VERSION...', 'STARTE MIT DER NEUEN VERSION NEU...', 'ПЕРЕЗАПУСК С НОВОЙ ВЕРСИЕЙ...'],
]);
