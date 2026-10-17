# Fire Peak — Flamewall × Creo "Flow" mashup

Beginning (intro + stutter build + pre-drop bar) from **Flamewall** (かめりあ), drop onward from **Creo – Flow**.

## Analysis

| Track     | BPM    | Key               | Used section                                   |
|-----------|--------|-------------------|------------------------------------------------|
| Flamewall | 150.00 | G minor (Camelot 6A) | 0 → 28.642 s (drop downbeat), beats at 0.242 + 0.4k s |
| Creo–Flow | 128.00 | C minor (Camelot 5A) | 93.7845 s (main drop, bar 50) → end; beats at 0.0345 + 0.46875k s |

6A → 5A are adjacent on the Camelot wheel, so no pitch shifting is needed.
Beat phases come from a spectral-flux grid fit (`finephase.py`); Flamewall's
busy breakbeat kicks defeat ordinary beat tracking, so its downbeat was taken
from the bar-aligned stutter-build re-entries (23.84 / 27.04 / 28.64 s).

## Arrangement (140 BPM version)

| Time      | Section |
|-----------|---------|
| 0:00      | Flamewall intro |
| 0:13.8    | Flamewall gated/stutter build |
| 0:23.8    | + noise riser (4 bars) |
| 0:29.0    | Flamewall pre-drop bar |
| **0:30.7**| **Creo drop** + C-tuned sub impact |
| ~1:01     | Creo breakdown / riser |
| ~1:15     | Creo second drop |
| ~1:50     | Creo outro (fades by 2:13) |

Both halves are time-stretched with rubberband (pitch preserved) to meet at
140 BPM (Flamewall −6.7 %, Creo +9.4 %). Post-stretch downbeats verify within
±1.5 ms. Flamewall is 3.2 dB louder as mastered and is matched down to Creo.
The master goes through a lookahead limiter with a −1 dB ceiling (−10.2 LUFS integrated).
The `150` build keeps Flamewall native and speeds Creo up to 150 BPM.

## Rebuild

```sh
ffmpeg -i Flamewall.mp3 -map 0:a src/flamewall.wav
ffmpeg -i "Creo - Flow.mp3" -map 0:a src/creo.wav
python3 scripts/build.py src work 140 fire_peak
scripts/master.sh work/fire_peak_premaster.wav Fire_Peak_140bpm "Fire Peak"
```
Requires ffmpeg (with librubberband), numpy, scipy, soundfile, librosa, pyloudnorm.
