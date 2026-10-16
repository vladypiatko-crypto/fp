'use strict';
/* QUACK ATTACK! — boot + main loop. */

Save.load();
Object.assign(EVENT_STATE, Save.data.events || {}); // the last event state we heard about (works offline too)
{ const ev = new URLSearchParams(location.search).get('event'); if (ev) for (const id of ev.split(',')) EVENT_STATE[id] = true; } // ?event=halloween,christmas for testing
SHOP_CFG = cleanShopCfg(Save.data.shopCfg); // what the admin last put in the shop (works offline too)
setLang(Save.data.settings.lang || 'en');
Save.data.name = cleanName(Save.data.name, 'QUACKER');
onResize.push(() => { for (const s of Scenes.stack) if (s.resize) s.resize(); });
resize();
window.addEventListener('resize', resize);
AppState.onAway.push(() => { const top = Scenes.top(); if (top instanceof GameScene && top.state === 'play') top.pause(); }); // leaving the app pauses the game
window.addEventListener('blur', () => { const top = Scenes.top(); if (top instanceof GameScene && top.state === 'play') top.pause(); });

// with accounts switched on, sign in first (first start: pick a name and username; banned: stop here)
Scenes.set(Cloud.enabled ? new BootScene() : new TitleScene(false));

let lastFrame = performance.now();
function frame(now) {
  const dt = clamp((now - lastFrame) / 1000, 0, 0.05);
  lastFrame = now;
  try {
    Input.poll();
    Impact.update(dt);
    Trans.update(dt);
    const top = Scenes.top();
    if (Trans.phase === 'out') { Input.ptrEv.length = 0; Input.hit.clear(); }
    if (top) { top.update(dt); }
    showCloudPopups();
    ctx.imageSmoothingEnabled = false;
    const cur = Scenes.top();
    if (cur) cur.draw();
    Impact.draw();
    Trans.draw();
  } catch (err) { console.error(err); }
  Input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// hook for automated tests
window.__quack = { Scenes, Save, Input, Net, GameScene, MapScene, LockerScene, ChestScene, TitleScene, CutsceneScene, OnlineScene, RoomScene, NameScene, setLang, tr, bossName: b => BOSSES[b].name, cosmetics: c => COSMETICS[c], Cloud, AccountScene, BannedScene, GiftScene, AdminScene, AdminUserScene, BootScene, MessageScene, trMissing, isBadName, get R() { return R; }, LEVELS, updatePlayer, applyUpgrade, spawnBoss, Impact, rollChoices, eggSpots, fireWeapons, hurtPlayer, impactAt, overCard, UPG: k => UPGRADES.find(u => u.k === k) };
