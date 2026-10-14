# 🦆 Quack Attack!

A pixel-art **survival shooter** for **1 or 2 players** on one device. You're a duck in a bandana with a blaster that **aims all by itself** — you just move, dodge and dash, and try to survive endless waves of angry vegetables.

## Downloads

Every push builds the apps automatically (GitHub Actions → **Build game apps**) and publishes them on the repo's **Releases** page:

| File | Runs on |
| --- | --- |
| `QuackAttack-Windows.exe` | Windows 10/11 — portable, double-click to play (SmartScreen: *More info → Run anyway*) |
| `QuackAttack-Android.apk` | Android phones/tablets — allow "install unknown apps" when asked |
| `QuackAttack.html` | Any web browser |

## How to play

- **Move** — your blaster locks on to the nearest veggie and fires automatically.
- **Dash** (QUACK!) — a short burst of speed that makes you invincible for a moment.
- **Corn kernels** are XP. Level up to pick **1 of 3 upgrades**: rapid fire, spread shot, piercing, egg orbit, bread bombs, chain lightning, mega quack shockwave, dash attack, and more.
- **Pickups**: ❤ heart (heal), 🧲 magnet (vacuum all XP), 🌶 hot sauce (clears the screen), golden corn (instant level up, dropped by bosses).
- Every ~50 s a **swarm event** hits (Carrot Stampede, Tomato Tsunami, Pea Party), and the **Pumpkin King** boss shows up every 2½ minutes.
- **2 players**: split screen, one half each. If your partner goes down, stand next to their egg to **revive** them. Game over when everyone's down.

### Controls

| | Player 1 | Player 2 |
| --- | --- | --- |
| Touch (phone/tablet) | drag anywhere on **your half** = joystick, tap **DASH** (or tap with a 2nd finger) | same, on the other half |
| Mouse | click-and-drag on your half works like a joystick | |
| Keyboard | WASD + Space | Arrow keys + Enter |
| Gamepad | 1st controller: stick/D-pad + A | 2nd controller |

Pause: ⏸ button / Esc / Start. Mute: 🔊 button / M. Windows: F11 toggles fullscreen.

## Project layout

- `www/` — the game (plain HTML5 canvas + JavaScript, no dependencies; sound is generated with WebAudio).
- `main.js` — Electron wrapper for the Windows build.
- `android/` — Capacitor Android project (landscape, fullscreen).
- `scripts/build-single-html.js` — bundles the game into one HTML file.

Run locally: open `www/index.html` in a browser, or `npm install && npm start` for the desktop app.
