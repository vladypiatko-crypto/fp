import sys, numpy as np, librosa, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
path,out,a,b,grid,gphase=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5]),float(sys.argv[6])
sr=22050
y,_=librosa.load(path,sr=sr,mono=True,offset=a,duration=b-a)
S=librosa.amplitude_to_db(np.abs(librosa.stft(y,n_fft=2048,hop_length=256)),ref=np.max)
fig,ax=plt.subplots(2,1,figsize=(22,9),gridspec_kw={'height_ratios':[3,1]},sharex=True)
ax[0].imshow(S,origin='lower',aspect='auto',extent=[a,b,0,sr/2],vmin=-70,vmax=0,cmap='magma')
ax[0].set_yscale('symlog',linthresh=200); ax[0].set_ylim(30,11000)
rms=librosa.feature.rms(y=y,hop_length=256)[0]; t=a+np.arange(len(rms))*256/sr
ax[1].plot(t,20*np.log10(rms+1e-6),lw=0.6)
if grid>0:
    k=np.ceil((a-gphase)/grid)
    for i,x in enumerate(np.arange(gphase+k*grid,b,grid)):
        for A in ax: A.axvline(x,color='cyan' if int(k+i)%4==0 else 'w',lw=1.0 if int(k+i)%4==0 else 0.4,alpha=0.7)
ax[1].set_xticks(np.arange(np.floor(a),b,2 if b-a<130 else 5))
ax[0].set_title(f"{path} {a}-{b}s, grid {grid}s")
plt.tight_layout(); plt.savefig(out,dpi=70)
