import sys, numpy as np, librosa
path=sys.argv[1]; lo,hi=float(sys.argv[2]),float(sys.argv[3]); a,b=float(sys.argv[4]),float(sys.argv[5])
sr=22050; hop=64
y,_=librosa.load(path,sr=sr,mono=True)
# kick-ish band onset + full-band onset
Sk=librosa.feature.melspectrogram(y=y,sr=sr,hop_length=hop,n_fft=1024,fmax=200,n_mels=16)
ok=librosa.onset.onset_strength(S=librosa.power_to_db(Sk),sr=sr,hop_length=hop)
of=librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop)
fr=sr/hop
def score(env,period,phase):
    ts=np.arange(phase+np.ceil((a-phase)/period)*period,b,period)
    idx=np.round(ts*fr).astype(int); idx=idx[idx<len(env)]
    return env[idx].mean()
best=[]
for bpm in np.arange(lo,hi,0.01):
    p=60/bpm
    phs=np.arange(0,p,1/fr)
    sc=[score(of,p,ph)+score(ok,p,ph) for ph in phs]
    i=int(np.argmax(sc)); best.append((sc[i],bpm,phs[i]))
best.sort(reverse=True)
for s,bpm,ph in best[:6]: print(f"bpm={bpm:.2f} phase={ph:.4f} score={s:.3f}")
# downbeat: kick energy at each of 4 beat positions
s,bpm,ph=best[0]; p=60/bpm
ts=np.arange(ph+np.ceil((a-ph)/p)*p,b,p); idx=np.round(ts*fr).astype(int)
k=ok[idx]
print("kick onset by beat mod4 (relative to first grid beat at %.4f):"%ts[0],[round(float(k[i::4].mean()),3) for i in range(4)])
print("full onset mod4:",[round(float(of[idx][i::4].mean()),3) for i in range(4)])
