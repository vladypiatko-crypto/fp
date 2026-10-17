import sys, numpy as np, librosa
path=sys.argv[1]
y,sr=librosa.load(path,sr=22050,mono=True)
tempo,beats=librosa.beat.beat_track(y=y,sr=sr)
bt=librosa.frames_to_time(beats,sr=sr)
print("tempo",tempo, "nbeats",len(bt), "first beats",np.round(bt[:8],3))
# median interbeat
ibi=np.diff(bt); print("median ibi",np.median(ibi), "bpm",60/np.median(ibi))
# key via chroma
ch=librosa.feature.chroma_cqt(y=y,sr=sr).mean(axis=1)
maj=np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]);mn=np.array([6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
names='C C# D D# E F F# G G# A A# B'.split()
sc=[(np.corrcoef(np.roll(maj,i),ch)[0,1],names[i]+' maj') for i in range(12)]+[(np.corrcoef(np.roll(mn,i),ch)[0,1],names[i]+' min') for i in range(12)]
print("key",sorted(sc)[-3:])
# energy per 2s window, plus low-band energy
S=np.abs(librosa.stft(y,n_fft=2048,hop_length=512))
f=librosa.fft_frequencies(sr=sr,n_fft=2048)
t=librosa.frames_to_time(np.arange(S.shape[1]),sr=sr,hop_length=512)
rms=librosa.feature.rms(S=S)[0]; low=S[f<150].sum(0); 
W=2.0
for s in np.arange(0,t[-1],W):
    m=(t>=s)&(t<s+W)
    r=rms[m].mean(); l=low[m].mean()
    print(f"{s:6.1f} {20*np.log10(r+1e-9):6.1f}dB low {20*np.log10(l+1e-9):6.1f} "+"#"*int(max(0,(20*np.log10(r+1e-9)+40))))
