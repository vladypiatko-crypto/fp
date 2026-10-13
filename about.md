# FP Counter

Automatically finds every **frame perfect** click in a run and marks it with a circle.

## How to use
1. Open a level, pause, tap **FP**, then **Record**. Beat the level (normal or practice mode).
2. Pause, tap **FP**, then **Analyze**. The level fast-forwards while the mod tests every click.
3. Circles show up at every frame perfect click, with its FPS value. The top-left corner counts them per tier.
4. **Watch** replays your recorded run so you can see the circles light up.

## What the numbers mean
Geometry Dash runs physics at 240 steps per second. For every click the mod rewinds to just before it, moves the click 1, 2, 3... steps earlier and later, and checks whether you still survive. The number of working steps is the click's **window**:

| Window | Label | |
|---|---|---|
| 1 step | **240** fps | red |
| 2 steps | **120** fps | orange |
| 3 steps | **80** fps | yellow |
| 4 steps | **60** fps | green |

A "60 fps frame perfect" means you had exactly 1/60 of a second to click.

- `rel` = the release of a hold (ship, wave, swing...), not the press
- `*` = a neighbouring click limited the test, the real window may be a bit wider
- grey `?` = the mod couldn't reproduce that part of the run

## Tips
- Turn off **Click Between Frames**, TPS bypass and physics bypass while recording.
- Analysis takes a while on long levels. Raise *Analysis speed* in the mod settings to go faster.
