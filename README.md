# FP Counter

A [Geode](https://geode-sdk.org) mod for Geometry Dash 2.2081 (Android, Windows, macOS, iOS) that records a run, finds every frame perfect click automatically, and marks it in the level with a circle showing its FPS tier (240 / 120 / 80 / 60 ...).

See [about.md](about.md) for how to use it in game.

## Install

1. Open the [**dev-build** release](../../releases/tag/dev-build) and download `vladypiatko.fp-counter.geode`.
   (Or open the latest run under **Actions → Build Geode Mod** and download the `FP-Counter` artifact zip.)
2. Put the `.geode` file in your Geode mods folder:
   - **Android:** `Android/media/com.geode.launcher/game/geode/mods/`
   - **Windows:** `<Geometry Dash folder>/geode/mods/`
   - **macOS:** `~/Library/Application Support/GeometryDash/geode/mods/`
3. Restart the game.

Needs Geode 5.10.0 or newer.

## How the analysis works

GD 2.2 steps physics at a fixed 240 ticks per second, and a macro is a list of `(tick, button, press/release)` events.

1. **Record:** the mod logs every `handleButton` call with the physics tick it happened on.
2. **Analyze:** the macro is replayed in practice mode. Before each input the mod places a practice checkpoint a few ticks earlier. It then replays from that checkpoint:
   - once unchanged (the baseline),
   - then with only that input moved 1, 2, 3... ticks earlier and later (a press moves together with its release, so the hold length stays the same).

   A shifted run "works" if the player survives for the *survival check* time (default 0.5 s) afterwards.
3. **Window:** the number of tick offsets that work. FPS = `240 / window`. Inputs with a window of `240 / lowest FPS` or less are frame perfects.

All runs start from the same checkpoint, so small checkpoint inaccuracies affect the baseline and the shifted runs the same way. With *Fast mode* on, a shifted run stops early once the player's state is exactly the same as the baseline's on the same tick.

## Building

GitHub Actions builds every platform on each push (`.github/workflows/build.yml`). Locally, with the Geode CLI and SDK installed:

```sh
geode build
```
