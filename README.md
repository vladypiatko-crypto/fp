# 🦆 Quack Attack!

A pixel-art **survival shooter** for **1–4 players**: split screen on one device, or **online with friends** through lobbies. You're a duck whose weapon **aims all by itself**. You just move, dodge and dash.

## Story

**Chapter 1: Save Princess Daisy.** Princess **Daisy** of Puddle Pond has the legendary **Golden Quack**, a voice so pure it can power any machine. The evil goose scientist **Dr. Honk** swoops in with his airship, kidnaps her to power his **Mega Honk Mech**, and leaves his robot army behind to keep the ducks busy.

**Chapter 2: The Stolen Quack.** A week later, at Daisy's thank-you party, Dr. Honk is back in his giant **Mothership**. This time his tractor beam steals only her voice, leaving Daisy croaking. The ducks chase the ship from the beach to the moon to get the Golden Quack back.

| Level | World | Boss | Reward |
| --- | --- | --- | --- |
| 1 | Puddle Pond | Clanky Crab | Quackshot |
| 2 | Whisper Woods | The Goo King | Bubble Gun |
| 3 | Frosty Peaks | Yeti-Bot 3000 | Feather-rang |
| 4 | Lava Factory | Saw Tank | Beak Beam |
| 5 | Honk Tower | Dr. Honk Mega Mech | Quackinator |
| 6 | Sunny Beach | Shark-Bot | Sun Hat |
| 7 | Spooky Swamp | Ghost Goose | Swampy skin |
| 8 | Cloud Kingdom | Thunder Balloon | Stormy skin |
| 9 | Moon Base | Robo-Daisy | Space Helmet |
| 10 | Honk Mothership | Dr. Honk Ultra | Cosmic skin |

Each chapter has an animated intro and ending, and the map has a page per chapter. Chapter 2 rewards only come from the story, never from chests. **Endless** mode is a pure survival run where all ten bosses take turns.

## Features

- **Online with friends**: host a lobby and share its 4-letter code, or join a friend's. Up to 4 ducks, each on their own device. No server to set up: devices connect directly. Pick story or endless, ready up, and start.
- **6 weapons**: Blaster, Quackshot, Bubble Gun, Feather-rang, Beak Beam laser, Quackinator minigun
- **Level-up cards** (13 upgrades): multi shot, piercing, egg orbit, bread bombs, chain lightning, mega quack shockwave, dash attack…
- **Robot army**: Bolt Bots, Boom Bots, Goo Blobs, Tank Bots, Zap Drones and Saw Bots, each with its own behaviour. Bosses telegraph charges, jumps, bullet rings and missile strikes.
- **Impact frames**: big hits freeze the world for a moment, flash white and throw speed lines.
- **Honks and quacks**: Dr. Honk honks, the ducks quack. Both are synthesised in the browser, no sound files.
- **Locker**: customise each duck's **skin, hat, halo, trail and weapon**. Every hat sways, sparkles and has its own little extras (twinkling crown, floating notes, chef steam).
- **Chests**: spend the coins you earn on Duck Chests or Royal Chests. **Unlocks are shared by both players.** New items get a bouncing red NEW! on their locker tab and a red ! on the item until you tap it.
- **Settings** (gear icon): turn off screen shake, impact flashes or music, pick your **language** (English, Deutsch, Русский, or QUACK, where every word is QUACK) and set your **name**.
- **Your own name**: type any name up to 12 letters and numbers. Rude names (English, German and Russian, including l33t spellings) are refused, and the host filters friends' names too.
- Ducks turn in 4 directions, blink, squash & stretch and leave afterimages when dashing.

## Downloads

Every push builds the apps (GitHub Actions → **Build game apps**) and publishes them on the **Releases** page:

| File | Runs on |
| --- | --- |
| `QuackAttack-Windows.exe` | Windows 10/11, portable, double-click to play (SmartScreen: *More info → Run anyway*) |
| `QuackAttack-Android.apk` | Android phones/tablets (allow "install unknown apps") |
| `QuackAttack.html` | Any web browser |

Online play works in all three too, and they can play together (an Android phone can join a Windows PC's lobby).

## Online play

Choose **ONLINE**, then **HOST A GAME** on one device. It shows a 4-letter code. Friends choose **JOIN A FRIEND** on their own phone or PC and type that code. Up to 4 ducks, each on their own device. The host picks story or endless and starts.

### How it works

There is no game server to run. The free public [PeerJS](https://peerjs.com) service introduces the devices to each other (the host registers its lobby code there), and from then on they talk directly over WebRTC. On networks that block direct connections, PeerJS's free relay carries the traffic instead.

The **host's device runs the real game**. Everyone else sends their moves and button presses to the host and draws the host's game about 12 times a second. So the host's device has to stay open and connected for the whole match, and everybody's lag is roughly their connection to the host.

### Limits

- Every device needs internet, also when you're all on the same Wi-Fi (the matchmaker lives online).
- No public lobby list: you join by code only.
- If the host closes the game, locks the phone or loses connection, the lobby ends for everyone. A friend whose device goes quiet for about 12 seconds is dropped.
- Online depends on the free PeerJS service being up. If it's down, local play still works.
- For testing you can point the game at your own PeerJS server with `?peer=host:port` in the address.
- Set `ONLINE_READY = false` in `www/js/online.js` to hide online play behind an "under construction" sign.

## Accounts and the admin tab

With Firebase switched on, every player picks a **name** and a **unique username** on first start (needs internet once). The admin account gets an **ADMIN** button on the title screen: search players by username, **flag** them (3 flags = automatic ban), **ban / unban**, **reset progress**, and **give coins or any item** (players get an animated "gift from the admin" popup). The wizard hat is only available as an admin gift.

Setup (once):

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com), add a **Web app**, turn on **Authentication → Anonymous** and create a **Firestore Database** in production mode.
2. Put the web app's `firebaseConfig` into `FIREBASE_CONFIG` in `www/js/cloud.js` and set `ACCOUNTS_ON = true`.
3. Paste the whole of `firebase/firestore.rules` into **Firestore Database → Rules** and press **Publish**. The rules are what stop anyone else from using admin powers, even with an edited app.
4. **The first account ever made becomes the admin**, for good. So the admin installs the build and creates their account before anyone else.

Good to know: accounts are anonymous and live in the app's storage. Uninstalling or clearing the app's data starts a new account (the old username stays taken), and a banned player could get a fresh account that way. Without `FIREBASE_CONFIG` the game skips accounts and runs fully offline.

Testing locally: `npx firebase-tools emulators:start --only auth,firestore` in `firebase/`, then open the game with `?emu=1` (the first account you make there is the admin).

## Controls

| | Player 1 | Player 2 |
| --- | --- | --- |
| Touch | drag anywhere on **your half** = joystick, tap **DASH** (or tap with a 2nd finger) | same, on the other half |
| Keyboard | WASD + Space | Arrow keys + Enter |
| Gamepad | 1st controller: stick/D-pad + A | 2nd controller |

Online, each device controls its own duck with the controls above (keyboard players use the first set). Menus work with touch, mouse, arrows + Enter/Esc, or a gamepad. Pause with ⏸ / Esc / Start.

## Project layout

- `www/js/cloud.js`: accounts, bans, flags, resets and admin gifts (Firebase) · `www/js/admin.js`: the admin tab · `firebase/firestore.rules`: who may change what
- `www/js/lang.js`: translations (all text is written in English and translated as it's drawn), the QUACK language and the name filter
- `www/js/engine.js`: canvas scaling, pixel font, sprites, chiptune and voice audio, input, UI widgets, impact frames, network state, save file
- `www/js/art.js`: all pixel art (ducks, hats and their animation, robots, bosses, worlds)
- `www/js/data.js`: cosmetics, weapons, enemies, bosses, levels, dialog
- `www/js/game.js`: gameplay (the host runs this; online friends run the same code path but only draw)
- `www/js/online.js`: peer-to-peer connections, the host's lobby, online menu and room screen, snapshots and the online game
- `www/js/vendor/peerjs.min.js`: [PeerJS](https://github.com/peers/peerjs) 1.5.5 (MIT)
- `www/js/story.js`: dialog boxes and cutscenes · `www/js/chapter2.js`: chapter 2 (worlds, bosses, levels, cutscenes, rewards)
- `www/js/scenes.js`: title, map, locker, chests, settings
- `main.js`: Electron wrapper (Windows) · `android/`: Capacitor project · `scripts/build-single-html.js`: one-file web build

Run locally by opening `www/index.html` in a browser, or with `npm install && npm start` for the desktop app.
