# 🦆 Quack Attack!

A pixel-art **survival shooter** for **1 or 2 players** on one device (split screen). You're a duck whose weapon **aims all by itself**. You just move, dodge and dash.

## Story

Princess **Daisy** of Puddle Pond has the legendary **Golden Quack**, a voice so pure it can power any machine. The evil goose scientist **Dr. Honk** swoops in with his airship, kidnaps her to power his **Mega Honk Mech**, and leaves his robot army behind to keep the ducks busy. Chase him across five worlds and bring Daisy home!

| Level | World | Boss | Reward |
| --- | --- | --- | --- |
| 1 | Puddle Pond | Clanky Crab | Quackshot |
| 2 | Whisper Woods | The Goo King | Bubble Gun |
| 3 | Frosty Peaks | Yeti-Bot 3000 | Feather-rang |
| 4 | Lava Factory | Saw Tank | Beak Beam |
| 5 | Honk Tower | Dr. Honk Mega Mech | Quackinator |

The story has an animated intro and ending. **Endless** mode is a pure survival run where bosses keep coming.

## Features

- **6 weapons**: Blaster, Quackshot, Bubble Gun, Feather-rang, Beak Beam laser, Quackinator minigun
- **Level-up cards** (13 upgrades): multi shot, piercing, egg orbit, bread bombs, chain lightning, mega quack shockwave, dash attack…
- **Robot army**: Bolt Bots, Boom Bots, Goo Blobs, Tank Bots, Zap Drones and Saw Bots, each with its own behaviour. Bosses telegraph charges, jumps, bullet rings and missile strikes.
- **Locker**: customise each duck's **skin, hat, halo, trail and weapon**. The duck turns around on a pedestal so you can admire every side.
- **Chests**: spend the coins you earn on Duck Chests or Royal Chests. **Unlocks are shared by both players.**
- Ducks turn in 4 directions, blink, squash & stretch and leave afterimages when dashing.
- 🧙 The legendary **Wizard Hat** is a gift, unlocked from the start.

## Downloads

Every push builds the apps (GitHub Actions → **Build game apps**) and publishes them on the **Releases** page:

| File | Runs on |
| --- | --- |
| `QuackAttack-Windows.exe` | Windows 10/11, portable, double-click to play (SmartScreen: *More info → Run anyway*) |
| `QuackAttack-Android.apk` | Android phones/tablets (allow "install unknown apps") |
| `QuackAttack.html` | Any web browser |

## Controls

| | Player 1 | Player 2 |
| --- | --- | --- |
| Touch | drag anywhere on **your half** = joystick, tap **DASH** (or tap with a 2nd finger) | same, on the other half |
| Keyboard | WASD + Space | Arrow keys + Enter |
| Gamepad | 1st controller: stick/D-pad + A | 2nd controller |

Menus work with touch, mouse, arrows + Enter/Esc, or a gamepad. Pause with ⏸ / Esc / Start; the pause menu has Locker, Sound and Fullscreen.

## Project layout

- `www/js/engine.js`: canvas scaling, pixel font, sprites, chiptune audio, input, UI widgets, save file
- `www/js/art.js`: all pixel art (ducks, hats, robots, bosses, worlds)
- `www/js/data.js`: cosmetics, weapons, enemies, bosses, levels, dialog
- `www/js/game.js`: gameplay
- `www/js/story.js`: dialog boxes and cutscenes
- `www/js/scenes.js`: title, map, locker, chests
- `main.js`: Electron wrapper (Windows) · `android/`: Capacitor project · `scripts/build-single-html.js`: one-file web build

Run locally by opening `www/index.html` in a browser, or with `npm install && npm start` for the desktop app.
