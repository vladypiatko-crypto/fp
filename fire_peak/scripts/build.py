"""Fire Peak mashup: Flamewall intro/build -> Creo 'Flow' drop.

usage: build.py <src_dir> <work_dir> <target_bpm> <out_basename>
"""
import os, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln, scipy.signal as ss

SRC, WORK, BPM, OUT = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
SR = 44100

# --- analysis results (seconds, original timelines) ---
FW_BPM, FW_DROP = 150.0, 28.642        # Flamewall: full drop downbeat
CR_BPM, CR_DROP = 128.0, 93.7845       # Creo: main drop downbeat (bar 50)
FW_BUILD_4BARS = FW_DROP - 4 * 4 * 60 / FW_BPM   # start of last 4 bars of build

def stretch(src, start, end, tempo, tag):
    """Pitch-preserving time stretch of src[start:end] by tempo factor (rubberband)."""
    out = os.path.join(WORK, f"{tag}_{tempo:.5f}.wav")
    if abs(tempo - 1) < 1e-9:
        af = "anull"
    else:
        af = (f"rubberband=tempo={tempo:.8f}:transients=crisp:detector=compound:"
              "pitchq=quality:channels=together:phase=laminar:window=standard")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start}", "-to", f"{end}",
                    "-i", src, "-af", af, "-c:a", "pcm_f32le", out], check=True)
    y, sr = sf.read(out, dtype="float64"); assert sr == SR
    return y

def flux_phase(y, period, a, b):
    """Grid phase (s, mod period) maximising spectral flux; same estimator used in analysis."""
    import librosa
    m = y[int(a * SR):int(b * SR)].mean(1); hop = 32
    S = np.abs(librosa.stft(m, n_fft=512, hop_length=hop, center=False))
    flux = np.maximum(0, np.diff(np.log1p(100 * S), axis=1)).sum(0)
    t = a + (np.arange(len(flux)) * hop + 256 + hop) / SR
    best = max(((np.interp(np.arange(ph + np.ceil((a + .05 - ph) / period) * period, b - .05, period), t, flux).mean(), ph)
                for ph in np.arange(0, period, 0.0005)))
    return best[1]

fw_t, cr_t = BPM / FW_BPM, BPM / CR_BPM          # tempo factors
fw_k, cr_k = 1 / fw_t, 1 / cr_t                  # time scale factors

# --- stretch segments (with margins so the stretcher has context at the edges) ---
FW_END_SRC = FW_DROP + 25.0   # extra drop audio used only to verify the grid
fw = stretch(f"{SRC}/flamewall.wav", 0.0, FW_END_SRC, fw_t, "fw")
CR_START_SRC = CR_DROP - 8 * 60 / CR_BPM         # 2 bars of pre-roll context
cr = stretch(f"{SRC}/creo.wav", CR_START_SRC, 206.3, cr_t, "cr")

# --- verify grids survived stretching (sub-ms check of beat phase) ---
P = 60 / BPM
fw_drop_new = FW_DROP * fw_k
cr_drop_new = (CR_DROP - CR_START_SRC) * cr_k
ph_fw = flux_phase(fw, P, fw_drop_new + 0.1, fw_drop_new + 22)
ph_cr = flux_phase(cr, P, cr_drop_new + 0.1, cr_drop_new + 28)
err_fw = ((ph_fw - fw_drop_new + P / 2) % P) - P / 2
err_cr = ((ph_cr - cr_drop_new + P / 2) % P) - P / 2
print(f"[grid] flamewall drop {fw_drop_new:.4f}s, measured phase error {err_fw*1000:+.1f} ms")
print(f"[grid] creo drop      {cr_drop_new:.4f}s, measured phase error {err_cr*1000:+.1f} ms")
# correct for any constant stretcher latency so both downbeats coincide exactly
fw_cut = fw_drop_new + err_fw
cr_cut = cr_drop_new + err_cr

# --- loudness match: Creo's drop sits at Flamewall-drop loudness ---
meter = pyln.Meter(SR)
fw_full, _ = sf.read(f"{SRC}/flamewall.wav", dtype="float64")
cr_full, _ = sf.read(f"{SRC}/creo.wav", dtype="float64")
L_fw = meter.integrated_loudness(fw_full[int(FW_DROP * SR):int((FW_DROP + 30) * SR)])
L_cr = meter.integrated_loudness(cr_full[int(CR_DROP * SR):int((CR_DROP + 30) * SR)])
L_fw_intro = meter.integrated_loudness(fw_full[int(1.3 * SR):int(FW_DROP * SR)])
print(f"[loud] FW intro {L_fw_intro:.1f} LUFS, FW drop {L_fw:.1f}, Creo drop {L_cr:.1f}")
# never boost into the limiter harder than needed: lower the louder side
g_cr_db = min(0.0, L_fw - L_cr); g_fw_db = min(0.0, L_cr - L_fw)
g_cr, g_fw = 10 ** (g_cr_db / 20), 10 ** (g_fw_db / 20)
print(f"[loud] gain FW {g_fw_db:+.1f} dB, Creo {g_cr_db:+.1f} dB")

# --- splice ---
i_fw = int(round(fw_cut * SR)); i_cr = int(round(cr_cut * SR))
pre = int(0.004 * SR)                    # keep 4 ms before Creo's downbeat for the transient
A = fw[:i_fw].copy() * g_fw
fo = int(0.012 * SR); A[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
B = cr[i_cr - pre:].copy() * g_cr
fi = int(0.002 * SR); B[:fi] *= np.linspace(0, 1, fi)[:, None]
drop_at = len(A)                          # output sample index of the drop downbeat
mix = np.zeros((len(A) + len(B) - pre, 2))
mix[:len(A)] += A
mix[len(A) - pre:] += B

# --- FX: noise riser over the last 4 bars of the build + impact on the drop ---
rng = np.random.default_rng(7)
r0 = int(FW_BUILD_4BARS * fw_k * SR); rn = drop_at - r0
noise = rng.standard_normal((rn, 2))
env = np.linspace(0, 1, rn) ** 2.2
# sweep a band-pass from 400 Hz up to 9 kHz in short blocks
riser = np.zeros_like(noise); blk = 2048
for s in range(0, rn, blk):
    fc = 400 * (9000 / 400) ** (s / rn)
    sos = ss.butter(2, [fc / 1.6, min(fc * 1.6, SR / 2 - 100)], btype="band", fs=SR, output="sos")
    seg = noise[max(0, s - 1024):s + blk]
    riser[s:s + blk] = ss.sosfilt(sos, seg, axis=0)[-len(noise[s:s + blk]):]
riser *= env[:, None]
riser *= 10 ** (-24 / 20) / (np.sqrt(np.mean(riser[-SR // 2:] ** 2)) + 1e-9)  # peak level ~-24 dB RMS
mix[r0:drop_at] += riser

n_imp = int(1.6 * SR); t = np.arange(n_imp) / SR
f_inst = 32.70 + (65.41 - 32.70) * np.exp(-t / 0.06)        # C2 -> C1 pitch drop (C minor)
boom = np.sin(2 * np.pi * np.cumsum(f_inst) / SR) * np.exp(-t / 0.45)
boom *= np.minimum(1, t / 0.003)
crash = ss.sosfilt(ss.butter(2, 5000, btype="high", fs=SR, output="sos"), rng.standard_normal(n_imp)) * np.exp(-t / 0.35)
imp = (0.30 * boom + 0.05 * crash)[:, None] * np.ones((1, 2))
end = min(len(mix), drop_at + n_imp); mix[drop_at:end] += imp[:end - drop_at]

# --- gentle fade on the very end (Creo already fades) ---
tail = int(0.5 * SR); mix[-tail:] *= np.linspace(1, 0, tail)[:, None]

raw = os.path.join(WORK, f"{OUT}_premaster.wav")
sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")
print(f"[mix] drop at {drop_at / SR:.3f}s, total {len(mix) / SR:.2f}s, pre-limit peak {20*np.log10(np.abs(mix).max()):+.2f} dBFS")
with open(os.path.join(WORK, f"{OUT}_markers.txt"), "w") as fh:
    fh.write(f"riser_start {r0/SR:.3f}\ndrop {drop_at/SR:.3f}\ntotal {len(mix)/SR:.3f}\n")
