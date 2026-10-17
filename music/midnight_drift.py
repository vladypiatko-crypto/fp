#!/usr/bin/env python3
"""Midnight Drift: a calm, instrumental chill-trap / future-bass track.

Every sound is synthesized from scratch with numpy (no samples): 808-style
drums, a gliding sub 808, detuned supersaw pads, FM electric piano, plucks,
bells, risers, impacts, vinyl crackle, reverb, ping-pong delay and sidechain.

    python3 midnight_drift.py            # writes midnight_drift.wav (+ .mp3 if ffmpeg exists)

Key: F minor, 140 BPM (half-time feel). Progression: Fm9, Dbmaj9, Abmaj9, Eb6/9.
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 44100
BPM = 140
BEAT = 60 / BPM
BAR = 4 * BEAT
STEP = BEAT / 4
N_BARS = 72
TAIL = 7.0
LEN = int((N_BARS * BAR + TAIL) * SR)
rng = np.random.default_rng(1717)


def T(bar, step=0.0):
    return bar * BAR + step * STEP


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def nm(s):
    return NOTE[s[:-1]] + 12 * (int(s[-1]) + 1)


# ---------------------------------------------------------------- filters

def _spec_filter(x, gain_fn):
    n = x.shape[-1]
    m = n + 8192
    X = np.fft.rfft(x, m, axis=-1)
    f = np.fft.rfftfreq(m, 1 / SR)
    return np.fft.irfft(X * gain_fn(f), m, axis=-1)[..., :n]


def lp_gain(f, fc, order=2):
    return 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def hp_gain(f, fc, order=2):
    return 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-6)) ** (2 * order))


def lp(x, fc, order=2):
    return _spec_filter(x, lambda f: lp_gain(f, fc, order))


def hp(x, fc, order=2):
    return _spec_filter(x, lambda f: hp_gain(f, fc, order))


def bp(x, lo, hi, order=2):
    return _spec_filter(x, lambda f: hp_gain(f, lo, order) * lp_gain(f, hi, order))


def sweep_filter(x, times, cutoffs, kind='lp', order=2):
    """Time-varying filter (STFT overlap-add); cutoffs interpolate geometrically between breakpoints."""
    B, H = 2048, 1024
    w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(B) / B)
    X = np.atleast_2d(x)
    C, n = X.shape
    pad = np.zeros((C, n + 2 * B))
    pad[:, B:B + n] = X
    out = np.zeros_like(pad)
    f = np.fft.rfftfreq(B, 1 / SR)
    lt = np.log(cutoffs)
    for s in range(0, n + B + 1, H):
        if not pad[:, s:s + B].any():
            continue
        fc = np.exp(np.interp((s + B / 2 - B) / SR, times, lt))
        g = lp_gain(f, fc, order) if kind == 'lp' else hp_gain(f, fc, order)
        out[:, s:s + B] += np.fft.irfft(np.fft.rfft(pad[:, s:s + B] * w, axis=1) * g, B, axis=1)
    res = out[:, B:B + n]
    return res if x.ndim == 2 else res[0]


def pitch(sig, factor):
    return np.interp(np.arange(0, len(sig) - 1, factor), np.arange(len(sig)), sig)


# ---------------------------------------------------------------- drums

def kick():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 42 + 140 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    click = hp(rng.standard_normal(n), 2000) * np.exp(-t * 400) * 0.25
    return np.tanh(1.8 * (body + click))


def clap():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for o in (0.0, 0.011, 0.022):
        tt = t - o
        m = tt >= 0
        env[m] += np.exp(-tt[m] * 90)
    tt = t - 0.033
    m = tt >= 0
    env[m] += 1.1 * np.exp(-tt[m] * 14)
    s = bp(rng.standard_normal(n) * env, 900, 5000)
    s = s / np.abs(s).max() + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return s / np.abs(s).max()


def snare():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1500, 8000) * np.exp(-t * 30)
    s = noise / np.abs(noise).max() + 0.6 * np.sin(2 * np.pi * 200 * t) * np.exp(-t * 35)
    return s / np.abs(s).max()


def hat(decay=55, n_sec=0.25, bright=8000):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6
    s = hp(0.6 * metal + 0.8 * rng.standard_normal(n), bright) * np.exp(-t * decay)
    return s / np.abs(s).max()


def rim():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 1750 * t) * np.exp(-t * 120)
         + 0.7 * bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 160)
         + 0.5 * np.sin(2 * np.pi * 480 * t) * np.exp(-t * 90))
    return s / np.abs(s).max()


def shaker():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = bp(rng.standard_normal(n), 4000, 12000) * np.minimum(1, t / 0.012) * np.exp(-t * 40)
    return s / np.abs(s).max()


# ---------------------------------------------------------------- tonal instruments

def bass_line(events, t0, t1):
    """Continuous-phase 808 line. events: (time, midi, dur, glide) in absolute seconds."""
    n = int((t1 - t0) * SR) + 1
    freq = np.zeros(n)
    amp = np.zeros(n)
    for i, (t, m, d, gl) in enumerate(events):
        s = int((t - t0) * SR)
        e = min(n, int((t + d - t0) * SR))
        tt = np.arange(e - s) / SR
        f1 = mtof(m)
        if gl and i > 0:
            f0 = mtof(events[i - 1][1])
            fr = f1 * (f0 / f1) ** np.exp(-tt / 0.025)
            ar = (amp[s - 1] if s > 0 else 1.0) * np.exp(-tt * 0.7)
        else:
            fr = f1 * (1 + 0.35 * np.exp(-tt * 55))
            ar = np.minimum(1, tt / 0.003) * np.exp(-tt * 0.9)
        nxt_glide = i + 1 < len(events) and events[i + 1][3]
        if not nxt_glide:
            ar = ar * np.clip((d - tt) / 0.025, 0, 1)
        freq[s:e] = fr
        amp[s:e] = ar
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR) * amp
    return lp(np.tanh(3.0 * sig) / np.tanh(3.0), 1400)


_ss_cache = {}


def supersaw(notes, dur, voices=5, spread=14, cutoff=4000, attack=0.35, release=0.9, seed=0):
    key = (tuple(notes), round(dur, 4), voices, spread, cutoff, attack, release, seed)
    if key in _ss_cache:
        return _ss_cache[key]
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    r = np.random.default_rng(seed)
    for m in notes:
        f0 = mtof(m)
        for v in range(voices):
            x = (v - (voices - 1) / 2) / max(1, (voices - 1) / 2)
            f = f0 * 2 ** (x * spread / 1200)
            nh = max(1, int(min(cutoff * 2.5, 16000) / f))
            k = np.arange(1, nh + 1)
            amps = (1 / k) * lp_gain(k * f, cutoff, 2)
            ph = r.uniform(0, 2 * np.pi, nh)
            w = 2 * np.pi * f * t
            s = np.zeros(n)
            for kk, aa, pp in zip(k, amps, ph):
                s += aa * np.sin(kk * w + pp)
            a = (x * 0.85 + 1) * np.pi / 4
            out[0] += s * np.cos(a)
            out[1] += s * np.sin(a)
    env = np.minimum(1, t / attack) * np.where(t < dur, 1, np.clip(1 - (t - dur) / release, 0, 1))
    out *= env / np.sqrt(len(notes) * voices)
    _ss_cache[key] = out
    return out


def rhodes(m, dur, vel=1.0):
    f = mtof(m)
    rel = 0.5
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    idx = vel * (1.8 * np.exp(-t * 5) + 0.25)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    if f * 7 < 15000:
        s += 0.12 * vel * np.sin(2 * np.pi * f * 7 * t) * np.exp(-t * 25)
    env = (np.minimum(1, t / 0.003) * np.exp(-t * (0.6 + f / 1500))
           * np.where(t < dur, 1, np.clip(1 - (t - dur) / rel, 0, 1)))
    return s * env * vel


def pluck(m, dur, bright=1.0):
    f = mtof(m)
    n = int(min(dur + 0.4, 2.5) * SR)
    t = np.arange(n) / SR
    nh = max(1, min(40, int(14000 / f)))
    s = np.zeros(n)
    for k in range(1, nh + 1):
        s += (1 / k) * np.exp(-t * (1.5 + 0.9 * k ** 1.25 / bright)) * np.sin(2 * np.pi * f * k * t + 0.3 * k)
    env = np.minimum(1, t / 0.002) * np.where(t < dur, 1, np.clip(1 - (t - dur) / 0.4, 0, 1))
    return s * env


def bell(m, dur):
    f = mtof(m)
    n = int(min(dur + 1.5, 2.5) * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 4) * np.sin(2 * np.pi * 3.5 * f * t))
    return s * np.minimum(1, t / 0.002) * np.exp(-t * 2.2)


def lead(m, dur):
    return supersaw([m], dur, voices=3, spread=8, cutoff=3500, attack=0.012, release=0.15, seed=m)


# ---------------------------------------------------------------- fx

def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sweep_filter(rng.standard_normal((2, n)), [0, dur], [400, 9000], 'lp')
    x = sweep_filter(x, [0, dur], [150, 2500], 'hp')
    f = 180 * 2 ** (t / dur * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(2 + 14 * t / dur) / SR))
    return (x * 0.5 + 0.25 * tone) * (t / dur) ** 2.2


def rev_swell(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal((2, n)), 3000) * (t / dur) ** 3


def impact():
    n = int(3 * SR)
    t = np.arange(n) / SR
    f = 30 + 70 * np.exp(-t * 8)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    noise = lp(rng.standard_normal(n), 1500) * np.exp(-t * 6) * 0.4
    return np.tanh(1.5 * (boom + noise))


def downlifter(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sweep_filter(rng.standard_normal((2, n)), [0, dur], [9000, 250], 'lp')
    return x * np.exp(-t * 2.5 / dur) * np.minimum(1, t / 0.01)


def vinyl(n):
    imp = np.zeros(n)
    k = rng.poisson(6 * n / SR)
    imp[rng.integers(0, n, k)] = rng.exponential(1, k) * rng.choice([-1, 1], k)
    return bp(imp, 1500, 9000) + 0.04 * lp(rng.standard_normal(n), 5000)


def make_ir(rt60=2.6, n_sec=3.2, predelay=0.025):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n + int(predelay * SR)))
    for c in range(2):
        lo = lp(rng.standard_normal(n), 3000) * np.exp(-t * 6.9 / rt60)
        hi = hp(rng.standard_normal(n), 3000) * np.exp(-t * 6.9 / (rt60 * 0.4))
        ir[c, -n:] = lo + 0.6 * hi
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def convolve(x, ir):
    n = x.shape[1]
    N = 1 << (n + ir.shape[1]).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N, axis=1) * np.fft.rfft(ir, N, axis=1), N, axis=1)[:, :n]


def pingpong(x, dt, fb=0.45, taps=8):
    out = np.zeros_like(x)
    mono = x.mean(axis=0)
    d = int(dt * SR)
    for k in range(1, taps + 1):
        out[(k - 1) % 2, k * d:] += fb ** (k - 1) * mono[:-k * d]
    return lp(hp(out, 300), 5000)


# ---------------------------------------------------------------- arrangement

BUSES = ['drums', 'bass', 'pad', 'stab', 'lead', 'bell', 'keys', 'fx']
BUS = {k: np.zeros((2, LEN)) for k in BUSES}
kicks = []


def place(bus, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= LEN:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    n = min(sig.shape[1], LEN - i)
    BUS[bus][:, i:i + n] += sig[:, :n] * gain


CH = [
    dict(name='Fm9', pad=[53, 56, 60, 63, 67], root=29, low=41),
    dict(name='Dbmaj9', pad=[49, 53, 56, 60, 63], root=37, low=37),
    dict(name='Abmaj9', pad=[51, 56, 58, 60, 67], root=32, low=44),
    dict(name='Eb6/9', pad=[51, 55, 58, 60, 65], root=39, low=39),
]


def chord_at(bar):
    return CH[(bar // 2) % 4]


MEL = [
    (0, 'C5', 3), (3, 'Ab4', 3), (6, 'Bb4', 2), (8, 'C5', 2), (10, 'Eb5', 2), (12, 'C5', 4),
    (16, 'Bb4', 2), (18, 'Ab4', 2), (20, 'F4', 8),
    (32, 'Ab4', 3), (35, 'F4', 3), (38, 'Ab4', 2), (40, 'C5', 2), (42, 'Db5', 2), (44, 'C5', 2), (46, 'Ab4', 2),
    (48, 'F4', 4), (52, 'Eb4', 2), (54, 'F4', 6),
    (64, 'Eb5', 3), (67, 'C5', 3), (70, 'Eb5', 2), (72, 'G5', 2), (74, 'F5', 2), (76, 'Eb5', 2), (78, 'C5', 2),
    (80, 'Bb4', 2), (82, 'C5', 8),
    (96, 'G4', 3), (99, 'Bb4', 3), (102, 'C5', 2), (104, 'Eb5', 4), (108, 'F5', 2), (110, 'Eb5', 2),
    (112, 'C5', 8), (122, 'Ab4', 2), (124, 'Bb4', 2), (126, 'C5', 2),
]

MEL2 = [
    (0, 'Eb5', 6), (6, 'C5', 6), (12, 'Ab4', 4), (16, 'G4', 12),
    (32, 'F5', 6), (38, 'Eb5', 6), (44, 'C5', 4), (48, 'Ab4', 12),
    (64, 'G5', 6), (70, 'Eb5', 6), (76, 'C5', 4), (80, 'Bb4', 12),
    (96, 'Bb4', 6), (102, 'C5', 6), (108, 'Eb5', 4), (112, 'F5', 14),
]


def melody(mel, bar_from, bar_to, inst, bus='lead', transpose=0, gain=1.0, pan=0.0):
    for cyc in range(bar_from - bar_from % 8, bar_to, 8):
        for step, name, ln in mel:
            bar = cyc + step // 16
            if bar_from <= bar < bar_to:
                t = T(cyc, step) + rng.normal(0, 0.004)
                place(bus, inst(nm(name) + transpose, ln * STEP), max(0, t), gain * rng.uniform(0.88, 1.0), pan)


KICK, CLAP, SNARE, RIM, SHAKER = kick(), clap(), snare(), rim(), shaker()
HATS = [hat() for _ in range(4)]
OHAT = hat(decay=9, n_sec=0.7, bright=6000)


def K(t, g=1.0, depth=0.0):
    place('drums', KICK, t, g)
    if depth:
        kicks.append((t, depth))


def H(t, g, p=1.0):
    h = HATS[rng.integers(4)]
    place('drums', h if p == 1.0 else pitch(h, p), t + rng.normal(0, 0.002), g, pan=0.25)


def hats_unit(b0, last, intense, g=0.5):
    steps = [(s, 0.9 if s % 4 == 0 else 0.65) for s in range(0, 32, 1 if intense else 2)]
    if not last:
        steps = [x for x in steps if not 12 <= x[0] < 16 and not 28 <= x[0] < 32]
        steps += [(12 + i * 0.5, 0.4 + 0.06 * i) for i in range(8)]
        steps += [(28 + i * 2 / 3, 0.55 + 0.05 * i) for i in range(6)]
    else:
        steps = [x for x in steps if not 6 <= x[0] < 8 and not 24 <= x[0] < 32]
        steps += [(6 + i * 0.5, 0.5 + 0.1 * i) for i in range(4)]
        steps += [(24, 0.9), (25, 0.6), (26, 0.8), (26.5, 0.5), (27, 0.7), (27.5, 0.5)]
        steps += [(28 + i * 0.25, 0.35 + 0.04 * i) for i in range(16)]
    for s, v in steps:
        p = 1.0 + (0.04 * (s - 28) if last and s >= 28 else 0.0)
        H(T(b0, s), g * v, p)


def bass_unit(b0, last, events):
    r = chord_at(b0)['root']
    pat = [(0, r, 10, False), (10, r, 6, False), (16, r, 6, False), (22, r + 12, 5, True), (27, r, 5, True)]
    if last:
        pat = [(0, r, 10, False), (10, r, 6, False), (16, r, 8, False), (24, r + 12, 4, True),
               (28, r + 7, 2, True), (30, 41, 2, True)]
    events += [(T(b0, s), m, ln * STEP, gl) for s, m, ln, gl in pat]


STAB_PAT = [(0, 3), (3, 3), (6, 4), (10, 2), (12, 2), (14, 2), (16, 3), (19, 3), (22, 4), (26, 6)]
stab_wobble = [(0.0, 1500.0)]


def stab_unit(b0):
    ch = chord_at(b0)
    notes = [ch['pad'][0]] + [p + 12 for p in ch['pad']]
    sig = supersaw(notes, 2 * BAR, voices=7, spread=22, cutoff=6000, attack=0.005, release=0.1, seed=b0 % 8)
    n = sig.shape[1]
    g = np.zeros(n)
    for s, ln in STAB_PAT:
        i = int(s * STEP * SR)
        a, hold, r = int(0.004 * SR), int(ln * STEP * SR * 0.9), int(0.05 * SR)
        seg = np.concatenate([np.linspace(0, 1, a), np.ones(hold - a), np.linspace(1, 0, r)])
        j = min(n, i + len(seg))
        g[i:j] = np.maximum(g[i:j], seg[:j - i])
        stab_wobble.append((T(b0, s), 6500.0))
        stab_wobble.append((T(b0, s + ln * 0.9), 1500.0))
    place('stab', sig * g, T(b0))


def roll(b_start, b_end, g=0.8):
    """Snare roll accelerating 8ths -> 16ths -> 32nds, stopping one beat before b_end."""
    times = [T(b_start, s) for s in range(0, 16, 2)]
    times += [T(b_start + 1, s) for s in range(0, 8)]
    times += [T(b_start + 1, 8 + s * 0.5) for s in range(8)]
    for i, t in enumerate(times):
        x = i / (len(times) - 1)
        place('drums', pitch(SNARE, 1 + 0.6 * x), t, g * (0.25 + 0.75 * x ** 1.5), pan=0.1 * (-1) ** i)


def drop_hit(bar):
    place('fx', impact(), T(bar), 0.9)
    place('fx', rev_swell(BEAT), T(bar) - BEAT, 0.5)


# Pads everywhere, plus final chord
for b in range(0, N_BARS, 2):
    place('pad', supersaw(chord_at(b)['pad'], 2 * BAR, cutoff=3000, attack=0.5, release=1.2), T(b))
place('pad', supersaw(CH[0]['pad'], 5.0, cutoff=3000, attack=0.5, release=2.0), T(N_BARS))

# Rhodes comping in the calm sections
KEYS_BARS = list(range(0, 16)) + list(range(32, 44)) + list(range(64, 72))
for b in KEYS_BARS[::2]:
    ch = chord_at(b)
    for s, vel, ln in [(0, 1.0, 22), (22, 0.6, 10)]:
        for j, m in enumerate([ch['low']] + ch['pad']):
            place('keys', rhodes(m, ln * STEP, vel * (0.8 if j == 0 else 0.9)), T(b, s) + j * 0.012)
for j, m in enumerate([CH[0]['low']] + CH[0]['pad']):
    place('keys', rhodes(m, 5.0, 0.9), T(N_BARS) + j * 0.03)
place('bell', bell(nm('C6'), 3.0), T(N_BARS) + 0.2, 0.5)

# Melody
melody(MEL, 4, 8, lambda m, d: pluck(m, d, bright=0.5), gain=0.7)
melody(MEL, 8, 16, pluck, gain=0.8)
for d0 in (16, 48):
    melody(MEL, d0, d0 + 16, pluck, transpose=12, gain=0.55)
    melody(MEL, d0, d0 + 16, lead, gain=0.9)
melody(MEL2, 32, 40, pluck, gain=0.85)
melody(MEL, 40, 48, pluck, gain=0.8)
melody(MEL2, 64, 72, lambda m, d: pluck(m, d, bright=0.6), gain=0.7)

# Verse / light grooves: (bar range, kick gain, hats)
for b0, b1, kg in [(8, 12, 0.75), (12, 14, 0.8), (40, 44, 0.75), (64, 68, 0.6)]:
    for b in range(b0, b1, 2):
        for s in (0, 10, 16, 26):
            K(T(b, s), kg, 0.3)
        for s in (8, 24):
            place('drums', RIM, T(b, s), 0.45)
        for s in range(0, 32, 1 if b0 == 12 else 2):
            H(T(b, s), 0.22 if s % 4 == 0 else 0.15)
for b in range(36, 40):
    for s in range(0, 16, 2):
        H(T(b, s), 0.15 if s % 4 == 0 else 0.1)
    place('drums', RIM, T(b, 8), 0.3)
for b in (44, 45):
    for s in range(0, 16, 4):
        K(T(b, s), 0.75, 0.3)
    for s in range(0, 16):
        H(T(b, s), 0.2)

# Builds
place('fx', riser(4 * BAR - BEAT), T(12), 0.55)
place('fx', riser(4 * BAR - BEAT), T(44), 0.65)
roll(14, 16)
roll(46, 48)
place('fx', downlifter(2 * BAR), T(32), 0.5)

# Drops
bass_events = []
for d0, intense in ((16, False), (48, True)):
    drop_hit(d0)
    for b in range(d0, d0 + 16, 2):
        last = (b % 8) == 6
        for s in [0, 10, 16, 27] + ([30] if last else []):
            K(T(b, s), 1.0, 0.65)
        for s in (8, 24):
            place('drums', CLAP, T(b, s), 0.75)
        if last:
            place('drums', SNARE, T(b, 30), 0.25)
            place('drums', SNARE, T(b, 31), 0.35)
        hats_unit(b, last, intense, 0.45)
        if intense:
            for s in (6, 22):
                place('drums', OHAT, T(b, s), 0.18, pan=-0.3)
            for s in range(1, 32, 2):
                place('drums', SHAKER, T(b, s), 0.12, pan=-0.4)
            notes = sorted(p + 12 for p in chord_at(b)['pad'])
            for i, k in enumerate([0, 2, 4, 2, 3, 1, 4, 2, 0, 2, 4, 3, 4, 2, 1, 3]):
                place('bell', bell(notes[k], 2 * STEP), T(b, 2 * i), 0.22, pan=0.5 * (-1) ** i)
        bass_unit(b, last, bass_events)
        stab_unit(b)
# Verse / break subs: sustained roots
for b0, b1 in [(8, 14), (40, 44), (64, 68)]:
    for b in range(b0, b1, 2):
        bass_events.append((T(b), chord_at(b)['root'], 2 * BAR - 0.01, False))
bass_events.sort(key=lambda e: e[0])
place('bass', bass_line(bass_events, 0, LEN / SR - 0.01), 0.0)

# ---------------------------------------------------------------- mixing


def curve(points):
    t = np.arange(LEN) / SR
    return np.interp(t, [p[0] for p in points], [p[1] for p in points])


def rms_db(x, b0, b1):
    seg = x[:, int(T(b0) * SR):int(T(b1) * SR)]
    return 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-12)


print('filtering...')
END = LEN / SR
BUS['pad'] = sweep_filter(BUS['pad'], [0, T(8), T(12), T(15, 12), T(16), T(32), T(32, 4), T(40), T(47, 12),
                                       T(48), T(64), T(64, 4), T(72), END],
                          [400, 1800, 2200, 7000, 4500, 4500, 1400, 1600, 7000, 4500, 4500, 2500, 600, 400])
wob = sorted(stab_wobble) + [(END, 1500.0)]
BUS['stab'] = sweep_filter(BUS['stab'], [w[0] for w in wob], [w[1] for w in wob])
lead_lp = [(0, 2500), (T(8), 6000), (T(64), 6000), (T(72), 1200), (END, 1200)]
BUS['lead'] = sweep_filter(BUS['lead'], [p[0] for p in lead_lp], [p[1] for p in lead_lp])
lfo = 0.25 * np.sin(2 * np.pi * 4.5 / 2 * np.arange(LEN) / SR)
BUS['keys'] *= np.vstack([1 + lfo, 1 - lfo])

# Bus levels, set by measured loudness in reference sections (target RMS dBFS)
targets = {'drums': (16, 32, -15), 'bass': (16, 32, -15), 'pad': (32, 40, -22), 'stab': (16, 32, -21),
           'lead': (16, 32, -21), 'bell': (48, 64, -29), 'keys': (32, 40, -20), 'fx': (44, 48, -24)}
for k, (b0, b1, db) in targets.items():
    BUS[k] *= 10 ** ((db - rms_db(BUS[k], b0, b1)) / 20)

# Section dynamics for the calm parts
BUS['pad'] *= curve([(0, 1.0), (T(16), 1.0), (T(16, 1), 0.6), (T(32), 0.6), (T(32, 4), 1.0),
                     (T(48), 1.0), (T(48, 1), 0.6), (T(64), 0.6), (T(64, 4), 1.0), (END, 1.0)])
BUS['drums'] *= curve([(0, 1), (T(64), 1), (T(68), 0.5), (END, 0.5)])

# Pre-drop silences: one beat before each drop
gap = np.ones(LEN)
for d0 in (16, 48):
    i, j, f = int((T(d0) - BEAT) * SR), int(T(d0) * SR), int(0.01 * SR)
    gap[i:j] = 0
    gap[i - f:i] = np.linspace(1, 0, f)
for k in ('drums', 'bass', 'pad', 'stab', 'lead', 'bell', 'keys'):
    BUS[k] *= gap

# Sidechain pump from the kicks
sc = np.ones(LEN)
rn = int(0.24 * SR)
x = np.linspace(0, 1, rn)
att = np.minimum(1, np.arange(rn) / (0.004 * SR))
for kt, depth in kicks:
    i = int(kt * SR)
    j = min(LEN, i + rn)
    sc[i:j] = np.minimum(sc[i:j], (1 - depth * (1 - x) ** 2 * att)[:j - i])

print('reverb & delay...')
sends = {'drums': 0.10, 'pad': 0.45, 'stab': 0.2, 'lead': 0.3, 'bell': 0.4, 'keys': 0.35, 'fx': 0.3}
rev_in = sum(BUS[k] * v for k, v in sends.items())
rev = convolve(hp(rev_in, 250), make_ir())
dly_amt = curve([(0, 0.25), (T(32), 0.25), (T(32, 1), 0.6), (T(40), 0.6), (T(40, 1), 0.25), (END, 0.25)])
dly = pingpong(BUS['lead'] * dly_amt + 0.6 * BUS['bell'], 3 * STEP)

music = BUS['pad'] + BUS['stab'] + BUS['lead'] + BUS['bell'] + 0.85 * BUS['keys']
vin = vinyl(LEN) * curve([(0, 1), (T(8), 1), (T(16), 0.3), (T(32), 0.9), (T(40), 0.6), (T(48), 0.3),
                          (T(64), 0.9), (END, 1)])
mix = (BUS['drums'] + BUS['bass'] + music * sc + (0.3 * rev + 0.22 * dly) * (0.4 + 0.6 * sc)
       + BUS['fx'] + 0.012 * np.vstack([vin, np.roll(vin, 37)]))

print('mastering...')
mix = hp(mix, 25)
mix /= np.abs(mix).max()
mix = np.tanh(1.6 * mix) / np.tanh(1.6)
fade = np.ones(LEN)
fade[:int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
fo = int(3.0 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade
mix *= 10 ** (-0.8 / 20) / np.abs(mix).max()

for name, (b0, b1) in {'intro': (0, 8), 'verse': (8, 12), 'drop1': (16, 32), 'break': (32, 40),
                       'drop2': (48, 64), 'outro': (64, 72)}.items():
    print(f'  {name:6s} {rms_db(mix, b0, b1):6.1f} dBFS RMS')

here = os.path.dirname(os.path.abspath(__file__))
wav_path = os.path.join(here, 'midnight_drift.wav')
pcm = np.clip(mix.T + rng.triangular(-1, 0, 1, mix.T.shape) / 32768, -1, 1)
with wave.open(wav_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((pcm * 32767).astype('<i2').tobytes())
print('wrote', wav_path, f'({LEN / SR:.1f}s)')

if shutil.which('ffmpeg'):
    mp3_path = os.path.join(here, 'midnight_drift.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-b:a', '320k',
                    '-metadata', 'title=Midnight Drift', '-metadata', 'genre=Chill Trap', mp3_path], check=True)
    print('wrote', mp3_path)
