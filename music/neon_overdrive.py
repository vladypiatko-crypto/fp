#!/usr/bin/env python3
"""Neon Overdrive: a fast, aggressive instrumental riddim / dubstep track.

Every sound is synthesized from scratch with numpy: distorted kicks, claps,
hi-hat rolls, wobbling reese basses, supersaw stabs, plucked arps, risers and
impacts, sidechain-pumped and glued with reverb and a limiter.

    python3 neon_overdrive.py      # writes neon_overdrive.wav (+ .mp3 if ffmpeg exists)

Key: D minor, 150 BPM. Progression: Dm - Bb - F - C, one chord per bar.
The first drop hits at 6.4 s, the second at 17.6 s, and there are four drops in total.
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 44100
BPM = 150
BEAT = 60 / BPM
S16 = BEAT / 4
BAR = 4 * BEAT
N_BARS = 38
END = N_BARS * BAR + 4.0
LEN = int(END * SR)
rng = np.random.default_rng(2424)

SECTIONS = [
    (0, 2, 'intro'), (2, 4, 'build'), (4, 10, 'drop1'), (10, 11, 'fill'), (11, 17, 'drop2'),
    (17, 19, 'break'), (19, 20, 'build'), (20, 26, 'drop3'), (26, 28, 'break'), (28, 34, 'drop4'),
    (34, 38, 'outro'),
]
DROP_STYLE = {
    'drop1': dict(kick=[0, 3, 8, 11], clap=[4, 12], hats=16, bass=[0, 3, 6, 8, 11, 14], octave=False, arp=None),
    'drop2': dict(kick=[0, 2, 8, 10, 14], clap=[4, 12], hats=32, bass=list(range(0, 16, 2)), octave=True, arp=16),
    'drop3': dict(kick=[0, 4, 8, 12, 14, 15], clap=[4, 12], hats=16, bass=[0, 3, 4, 7, 8, 11, 12, 15],
                  octave=True, arp=None),
    'drop4': dict(kick=[0, 3, 6, 8, 11, 14], clap=[4, 12], hats=32, bass=list(range(0, 16, 2)), octave=True,
                  arp=8),
}
# (bass root midi, chord tones) for Dm, Bb, F, C
CHORDS = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [57, 60, 65]), (36, [60, 64, 67])]


def T(bar, s=0.0):
    return bar * BAR + s * S16


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


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
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 160 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 300) * 0.3
    s = np.tanh(2.5 * (body + click))
    return s / np.abs(s).max()


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
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1800, 8000) * np.exp(-t * 22)
    s = noise / np.abs(noise).max() + 0.7 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return s / np.abs(s).max()


def hat(decay=60, n_sec=0.22, bright=7000):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6
    s = hp(0.6 * metal + 0.8 * rng.standard_normal(n), bright) * np.exp(-t * decay)
    return s / np.abs(s).max()


def impact():
    n = int(3 * SR)
    t = np.arange(n) / SR
    f = 30 + 80 * np.exp(-t * 8)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    noise = lp(rng.standard_normal(n), 1500) * np.exp(-t * 6) * 0.4
    return np.tanh(1.5 * (boom + noise))


KICK, CLAP, SNARE = kick(), clap(), snare()
HATS = [hat() for _ in range(4)]
OHAT = hat(decay=12, n_sec=0.4, bright=6000)


# ---------------------------------------------------------------- tonal

def reese(midi, dur):
    """Detuned saw stack (5 voices x 20 harmonics); the wobble comes from the bus filter."""
    n = int(dur * SR) + 1
    t = np.arange(n) / SR
    f0 = mtof(midi)
    k = np.arange(1, 21)[:, None]
    sig = np.zeros(n)
    for d in (-0.018, -0.006, 0.0, 0.006, 0.018):
        ph = rng.uniform(0, 2 * np.pi, (20, 1))
        sig += (np.sin(2 * np.pi * k * f0 * (1 + d) * t[None, :] + ph) / k).sum(axis=0)
    sig /= np.abs(sig).max()
    env = np.minimum(1, t / 0.003) * np.clip((dur - t) / 0.02, 0, 1)
    return sig * env * 0.8


def sub(midi, dur):
    n = int(dur * SR) + 1
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.005) * np.clip((dur - t) / 0.03, 0, 1)
    return np.sin(2 * np.pi * mtof(midi) * t) * env * 0.9


def supersaw(notes, dur, voices=5, spread=14, cutoff=4000, attack=0.35, release=0.9, seed=0):
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
            s = ((amps[:, None] * np.sin(k[:, None] * 2 * np.pi * f * t[None, :] + ph[:, None])).sum(axis=0))
            a = (x * 0.85 + 1) * np.pi / 4
            out[0] += s * np.cos(a)
            out[1] += s * np.sin(a)
    env = np.minimum(1, t / attack) * np.where(t < dur, 1, np.clip(1 - (t - dur) / release, 0, 1))
    return out * env / np.sqrt(len(notes) * voices)


_pluck_cache = {}


def pluck(m, dur=0.3, bright=0.6):
    if m in _pluck_cache:
        return _pluck_cache[m]
    f = mtof(m)
    n = int(min(dur + 0.4, 2.0) * SR)
    t = np.arange(n) / SR
    nh = max(1, min(30, int(14000 / f)))
    s = np.zeros(n)
    for k in range(1, nh + 1):
        s += (1 / k) * np.exp(-t * (1.5 + 0.9 * k ** 1.25 / bright)) * np.sin(2 * np.pi * f * k * t + 0.3 * k)
    env = np.minimum(1, t / 0.002) * np.where(t < dur, 1, np.clip(1 - (t - dur) / 0.4, 0, 1))
    _pluck_cache[m] = s * env
    return _pluck_cache[m]


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sweep_filter(rng.standard_normal((2, n)), [0, dur], [400, 9000], 'lp')
    x = sweep_filter(x, [0, dur], [150, 2500], 'hp')
    f = 180 * 2 ** (t / dur * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(2 + 14 * t / dur) / SR))
    return (x * 0.5 + 0.25 * tone) * (t / dur) ** 2.2


def make_ir(rt60=1.4, n_sec=2.0, predelay=0.02):
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


# ---------------------------------------------------------------- arrangement

BUS = {k: np.zeros((2, LEN)) for k in ('drums', 'bass', 'pad', 'stab', 'arp', 'fx')}
kicks = []


def place(bus, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= LEN:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    if i < 0:
        sig, i = sig[:, -i:], 0
    n = min(sig.shape[1], LEN - i)
    BUS[bus][:, i:i + n] += sig[:, :n] * gain


def K(t, g=1.0, duck=0.7):
    place('drums', KICK, t, g)
    kicks.append((t, duck))


def H(t, g, pan=0.25):
    place('drums', HATS[rng.integers(4)], t + rng.normal(0, 0.002), g, pan=pan)


def roll(b, g=0.9):
    """Snare roll accelerating through the whole bar."""
    N = 24
    x = np.arange(N) / N
    pos = BAR * (1 - (1 - x) ** 2)
    for i in range(N):
        place('drums', pitch(SNARE, 1 + 0.5 * x[i]), T(b) + pos[i], g * (0.2 + 0.8 * x[i] ** 2),
              pan=0.1 * (-1) ** i)


stab_cache = {c: supersaw(CHORDS[c][1], 0.3, voices=5, spread=18, cutoff=5000, attack=0.002, release=0.1, seed=c)
              for c in range(4)}
pad_cache = {c: supersaw(CHORDS[c][1], BAR, voices=5, spread=20, cutoff=2600, attack=0.15, release=0.4, seed=20 + c)
             for c in range(4)}

bass_events = []
for b0, b1, name in SECTIONS:
    for b in range(b0, b1):
        c = b % 4
        root, chord = CHORDS[c][0], CHORDS[c][1]
        pad_g = 0.5 if name in ('intro', 'break', 'outro', 'build') else 0.2
        place('pad', pad_cache[c], T(b), pad_g)

        if name == 'intro':
            if b > b0:
                K(T(b), 0.8, 0.0)
            for s in range(0, 16, 2):
                H(T(b, s), 0.2 if s % 4 else 0.3)

        elif name == 'build':
            ramp = (b - b0 + 1) / (b1 - b0)
            for s in range(0, 16, 2):
                H(T(b, s), 0.15 + 0.35 * ramp)
            if b == b1 - 1:
                roll(b)
            if b == b0:
                place('fx', riser((b1 - b0) * BAR), T(b0), 0.7)

        elif name == 'fill':
            roll(b, 1.0)

        elif name == 'break':
            K(T(b), 0.8, 0.5)
            for s in range(0, 16, 2):
                H(T(b, s), 0.3)
            for s in range(0, 16, 2):
                place('arp', pluck(chord[[0, 1, 2, 1][(s // 2) % 4]] + 12), T(b, s), 0.3, pan=0.3 * (-1) ** s)
            bass_events.append((T(b), root, BAR * 0.97))
            if b == b1 - 1:
                place('fx', riser(BAR), T(b1) - BAR, 0.4)

        elif name == 'outro':
            fade = 1 - (b - b0) / (b1 - b0) * 0.6
            for s in (0, 8):
                K(T(b, s), 0.8 * fade, 0.5)
            bass_events.append((T(b), root, BAR * 0.97))

        else:
            style = DROP_STYLE[name]
            if b == b0:
                place('fx', impact(), T(b), 0.9)
            for s in style['kick']:
                K(T(b, s), 1.0)
            for s in style['clap']:
                place('drums', CLAP, T(b, s), 0.6)
            if style['hats'] == 16:
                for s in range(16):
                    H(T(b, s), 0.42 if s % 2 else 0.3)
                place('drums', OHAT, T(b, 14), 0.2, pan=-0.3)
            else:
                for s in np.arange(0, 16, 0.5):
                    H(T(b, s), 0.22 if s % 1 else 0.38)
            hits = style['bass']
            for i, s in enumerate(hits):
                nxt = hits[i + 1] if i + 1 < len(hits) else 16
                note = root + (12 if style['octave'] and i % 2 else 0)
                bass_events.append((T(b, s), note, (nxt - s) * S16 * 0.95))
            for s in (2, 6, 10, 14):
                place('stab', stab_cache[c], T(b, s), 0.5)
            if style['arp']:
                step = 16 // style['arp']
                for i, s in enumerate(range(0, 16, step)):
                    tone = chord[[0, 1, 2, 1, 0, 2, 1, 2][i % 8]] + 12
                    place('arp', pluck(tone), T(b, s), 0.3, pan=0.3 * (-1) ** i)

# Bass wobble: alternating 16ths in drops, dark sustained bass elsewhere
bt, bc = [], []
for b in range(N_BARS):
    name = next(n for b0, b1, n in SECTIONS if b0 <= b < b1)
    if name.startswith('drop'):
        for s in range(16):
            bt.append(T(b, s))
            bc.append(260 if s % 2 == 0 else 2200)
    else:
        bt.append(T(b))
        bc.append(700)
bt.append(END)
bc.append(700)

for t, root_note, dur in sorted(bass_events, key=lambda e: e[0]):
    place('bass', reese(root_note, dur), t, 0.8)
    place('bass', sub(root_note, dur), t, 0.9)

print('filtering...')
BUS['bass'] = sweep_filter(BUS['bass'], np.array(bt), np.array(bc))
BUS['pad'] = sweep_filter(BUS['pad'], np.array([0, END]), np.array([2600.0, 2600.0]))

# ---------------------------------------------------------------- mix

print('sidechain & reverb...')
sc = np.ones(LEN)
rn = int(0.18 * SR)
x = np.linspace(0, 1, rn)
att = np.minimum(1, np.arange(rn) / (0.004 * SR))
for kt, depth in kicks:
    i = int(kt * SR)
    j = min(LEN, i + rn)
    if depth <= 0:
        continue
    sc[i:j] = np.minimum(sc[i:j], (1 - depth * (1 - x) ** 2 * att)[:j - i])

ducked = (BUS['bass'] + BUS['pad'] * 0.7 + BUS['stab'] * 0.6 + BUS['arp'] * 0.6) * sc
rev = convolve(hp(BUS['stab'] * 0.25 + BUS['arp'] * 0.3 + BUS['pad'] * 0.2, 300), make_ir())
mix = BUS['drums'] + ducked + 0.3 * rev + BUS['fx']

print('mastering...')
mix = hp(mix, 30)
mix /= np.abs(mix).max()
mix = np.tanh(2.2 * mix) / np.tanh(2.2)
fade = np.ones(LEN)
fade[:int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR))
fo = int(3.0 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade
mix *= 10 ** (-0.4 / 20) / np.abs(mix).max()


def rms_db(sig, b0, b1):
    seg = sig[:, int(T(b0) * SR):int(T(b1) * SR)]
    return 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-12)


for name, (b0, b1) in {'intro': (0, 2), 'build1': (2, 4), 'drop1': (4, 10), 'drop2': (11, 17),
                       'break': (17, 19), 'drop3': (20, 26), 'drop4': (28, 34), 'outro': (34, 38)}.items():
    print(f'  {name:7s} {rms_db(mix, b0, b1):6.1f} dBFS RMS')

here = os.path.dirname(os.path.abspath(__file__))
wav_path = os.path.join(here, 'neon_overdrive.wav')
pcm = np.clip(mix.T + rng.triangular(-1, 0, 1, mix.T.shape) / 32768, -1, 1)
with wave.open(wav_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((pcm * 32767).astype('<i2').tobytes())
print('wrote', wav_path, f'({LEN / SR:.1f}s)')

if shutil.which('ffmpeg'):
    mp3_path = os.path.join(here, 'neon_overdrive.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-b:a', '320k',
                    '-metadata', 'title=Neon Overdrive', '-metadata', 'genre=Riddim', mp3_path], check=True)
    print('wrote', mp3_path)
