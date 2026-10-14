'use strict';
/* QUACK ATTACK! — boot + main loop. */

Save.load();
onResize.push(() => { for (const s of Scenes.stack) if (s.resize) s.resize(); });
resize();
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  const top = Scenes.top();
  if (document.hidden && top instanceof GameScene && top.state === 'play') top.pause();
});
window.addEventListener('blur', () => { const top = Scenes.top(); if (top instanceof GameScene && top.state === 'play') top.pause(); });

Scenes.set(new TitleScene(false));

let lastFrame = performance.now();
function frame(now) {
  const dt = clamp((now - lastFrame) / 1000, 0, 0.05);
  lastFrame = now;
  try {
    Input.poll();
    Trans.update(dt);
    const top = Scenes.top();
    if (Trans.phase === 'out') { Input.ptrEv.length = 0; Input.hit.clear(); }
    if (top) { top.update(dt); }
    ctx.imageSmoothingEnabled = false;
    const cur = Scenes.top();
    if (cur) cur.draw();
    Trans.draw();
  } catch (err) { console.error(err); }
  Input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// hook for automated tests
window.__quack = { Scenes, Save, Input, GameScene, MapScene, LockerScene, ChestScene, TitleScene, CutsceneScene, get R() { return R; }, updatePlayer, applyUpgrade, spawnBoss };
