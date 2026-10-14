# 🦆 Quack Attack!

A pixel-art **survival shooter** for **1–4 players**: split screen on one device, or **online with friends** through lobbies. You're a duck whose weapon **aims all by itself**. You just move, dodge and dash.

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

- **Online lobbies** *(under construction: the ONLINE button shows a "coming soon" sign until a server is deployed)*: create a public or private lobby, join a friend with their 4-letter code, or pick one from the public list. Up to 4 ducks, each on their own device. Pick story or endless, ready up, and start.
- **6 weapons**: Blaster, Quackshot, Bubble Gun, Feather-rang, Beak Beam laser, Quackinator minigun
- **Level-up cards** (13 upgrades): multi shot, piercing, egg orbit, bread bombs, chain lightning, mega quack shockwave, dash attack…
- **Robot army**: Bolt Bots, Boom Bots, Goo Blobs, Tank Bots, Zap Drones and Saw Bots, each with its own behaviour. Bosses telegraph charges, jumps, bullet rings and missile strikes.
- **Impact frames**: big hits freeze the world for a moment, flash white and throw speed lines.
- **Honks and quacks**: Dr. Honk honks, the ducks quack. Both are synthesised in the browser, no sound files.
- **Locker**: customise each duck's **skin, hat, halo, trail and weapon**. Every hat sways, sparkles and has its own little extras (twinkling crown, floating notes, chef steam).
- **Chests**: spend the coins you earn on Duck Chests or Royal Chests. **Unlocks are shared by both players.** New items get a bouncing red NEW! on their locker tab and a red ! on the item until you tap it.
- **Settings** (gear icon): turn off screen shake, impact flashes or music.
- Ducks turn in 4 directions, blink, squash & stretch and leave afterimages when dashing.

## Downloads

Every push builds the apps (GitHub Actions → **Build game apps**) and publishes them on the **Releases** page:

| File | Runs on |
| --- | --- |
| `QuackAttack-Windows.exe` | Windows 10/11, portable, double-click to play (SmartScreen: *More info → Run anyway*) |
| `QuackAttack-Android.apk` | Android phones/tablets (allow "install unknown apps") |
| `QuackAttack.html` | Any web browser |

Local play works in all three. **Online play needs a server** (see below); the Windows and Android apps and the single HTML file only find it if you set its address.

## Online play

### How it works

One player creates the lobby and **hosts** the match: their device runs the real game. Everyone else sends their moves and button presses to the host and draws the host's game about 12 times a second. So the **host's device has to stay open and connected** for the whole match, and everybody's latency is roughly their connection to the host.

The server in `server/` only runs lobbies and passes messages along. It never simulates the game.

### Run the server

Requires Node.js 18 or newer.

```bash
cd server
npm install
npm start          # http://localhost:8080  (set PORT to change it)
```

Open `http://localhost:8080` in two browser windows. Choose **ONLINE**, create a lobby in one and join it from the other.

Online play is switched off in the builds for now. Set `ONLINE_READY = true` in `www/js/online.js` to bring the lobbies back.

### Put it on the internet

The server is a single Node process that serves the game and the WebSocket on the same address. Any host that runs Node and allows WebSockets will do (Render, Fly.io, Railway, a VPS…). Start command: `npm start` in `server/`, port from the `PORT` environment variable.

Then tell the apps where it is, either:

- open the game as `https://your-server.example.com/` (the page already knows its own server), or
- set `DEFAULT_SERVER` in `www/js/online.js` to `wss://your-server.example.com/ws`, rebuild, and ship the Windows / Android / single-file builds, or
- add `?server=wss://your-server.example.com/ws` to the address of any copy of the game.

### Limits

- No accounts or friend lists: lobbies are either public (listed in the browser) or private (shared by code).
- Up to 4 ducks per lobby. Each device gets its own screen, with one duck on the host's device.
- If the host closes the game or loses connection, the lobby ends for everyone.
- The host's connection sets the feel of the game for everyone. A slow connection shows up as jerky enemies.
- Names are letters and numbers only, up to 12 characters.

## Controls

| | Player 1 | Player 2 |
| --- | --- | --- |
| Touch | drag anywhere on **your half** = joystick, tap **DASH** (or tap with a 2nd finger) | same, on the other half |
| Keyboard | WASD + Space | Arrow keys + Enter |
| Gamepad | 1st controller: stick/D-pad + A | 2nd controller |

Online, each device controls its own duck with the controls above (keyboard players use the first set). Menus work with touch, mouse, arrows + Enter/Esc, or a gamepad. Pause with ⏸ / Esc / Start.

## Project layout

- `www/js/engine.js`: canvas scaling, pixel font, sprites, chiptune and voice audio, input, UI widgets, impact frames, network state, save file
- `www/js/art.js`: all pixel art (ducks, hats and their animation, robots, bosses, worlds)
- `www/js/data.js`: cosmetics, weapons, enemies, bosses, levels, dialog
- `www/js/game.js`: gameplay (the host runs this; online friends run the same code path but only draw)
- `www/js/online.js`: servers, lobbies, room screen, snapshots and the online game
- `www/js/story.js`: dialog boxes and cutscenes
- `www/js/scenes.js`: title, map, locker, chests, settings
- `server/index.js`: lobby and relay server (also serves `www/`)
- `main.js`: Electron wrapper (Windows) · `android/`: Capacitor project · `scripts/build-single-html.js`: one-file web build

Run locally by opening `www/index.html` in a browser, or with `npm install && npm start` for the desktop app.
