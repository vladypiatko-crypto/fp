import sys, numpy as np, soundfile as sf, librosa
path,P,a,b=sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4])
y,sr=sf.read(path,start=int(a*44100),stop=int(b*44100)); y=y.mean(1)
hop=32
S=np.abs(librosa.stft(y,n_fft=512,hop_length=hop,center=False))
L=np.log1p(100*S); flux=np.maximum(0,np.diff(L,axis=1)).sum(0)
# frame k flux reflects change between window k and k+1; window center offset = (n_fft/2 + hop)/sr
t=a+(np.arange(len(flux))*hop+256+hop)/sr
fr=sr/hop
best=None; res=[]
for ph in np.arange(0,P,0.0005):
    ts=np.arange(ph+np.ceil((a+0.05-ph)/P)*P,b-0.05,P)
    v=np.interp(ts,t,flux).mean(); res.append((v,ph))
res.sort(reverse=True)
print(path,"P=",P,"top phases:",[(round(p,4),round(v,2)) for v,p in res[:5]])
