import sys,json,math
sys.path.insert(0,'/tmp/claude-0/-home-user-Claude-Sessions/3d2614e1-abc1-5b27-a4fa-97f592767fe6/scratchpad/rep')
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from matplotlib.patches import FancyBboxPatch, Patch
from geo import STATES,DISTS,OUTLINE,MCD,proj
C=dict(focal='#188CE5',focalD='#0E4778',focalL='#A9D2F5',nat='#A0A0AB',chr='#E0620D',sik='#0E9A80',bud='#7A55C8',jai='#B8860B',ink='#2E2E38',ink2='#4A4A55',rule='#E1E1E6',muted='#747480',soft='#F6F6FA',ey='#FFE600',land='#EEEEF3',num='#1A6FB5')
RAMP=['#EAF4FD','#C3E0F9','#8CC4F3','#4FA3EA','#1A6FB5','#0E4778']
plt.rcParams.update({'font.family':'Liberation Sans','font.size':9,'axes.edgecolor':C['rule'],'axes.labelcolor':C['ink2'],'xtick.color':C['muted'],'ytick.color':C['muted'],'text.color':C['ink']})
OUT='fig/'
def save(fig,name):
    fig.savefig(OUT+name,dpi=220,bbox_inches='tight',facecolor='white'); plt.close(fig)
def clean(ax):
    for s in ['top','right','left']: ax.spines[s].set_visible(False)
    ax.tick_params(length=0)
# ---------- map helpers
def polys(feats):
    out=[]
    for f in feats:
        rings=[]
        for p in f['polys']:
            rings.append([proj(*pt) for pt in p[0]])
        out.append(rings)
    return out
DP=polys(DISTS); SP=polys(STATES); OP=polys(OUTLINE)
def drawmap(ax,colors,edge='white',lw=0.15,states=True):
    verts=[];fc=[]
    for rings,c in zip(DP,colors):
        for r in rings: verts.append(r); fc.append(c)
    ax.add_collection(PolyCollection(verts,facecolors=fc,edgecolors=edge,linewidths=lw))
    if states:
        sv=[r for rings in SP for r in rings]
        ax.add_collection(PolyCollection(sv,facecolors='none',edgecolors='#8A8A96',linewidths=0.35))
    ov=[r for rings in OP for r in rings]
    ax.add_collection(PolyCollection(ov,facecolors='none',edgecolors=C['ink'],linewidths=0.5))
    ax.set_xlim(proj(68,0)[0],proj(97.5,0)[0]); ax.set_ylim(6.5,37.2); ax.set_aspect('equal'); ax.axis('off')
props=[f['props'] for f in DISTS]
def binc(v,bins,cols):
    for b,c in zip(bins,cols):
        if v<=b: return c
    return cols[-1]
def legend(ax,items,loc='lower left',title=None,ncol=1):
    h=[Patch(facecolor=c,edgecolor='none',label=l) for c,l in items]
    lg=ax.legend(handles=h,loc='lower left',bbox_to_anchor=(0.96,0.02),frameon=False,fontsize=7.5,title=title,title_fontsize=7.5,ncol=ncol,handlelength=1.2,handleheight=1.0,borderaxespad=0.2)
    lg._legend_box.align='left'
# 1 minority share map
fig,ax=plt.subplots(figsize=(6.4,5.4))
bins=[10,25,50,75,101]; cols=RAMP[1:]
drawmap(ax,[binc(p.get('minp') or 0,bins,cols) for p in props])
legend(ax,[(cols[0],'Below 10%'),(cols[1],'10% to 25%'),(cols[2],'25% to 50%'),(cols[3],'50% to 75%'),(cols[4],'75% and above')],title='Share of district population\nfrom the five minority communities')
save(fig,'map_minority_share.png')
# 2 MCD map
col={'A':C['focal'],'B1':C['chr'],'B2':C['bud']}
fig,ax=plt.subplots(figsize=(6.4,5.4))
drawmap(ax,[col.get(MCD.get(str(p['censuscode'])),C['land']) for p in props])
legend(ax,[(C['focal'],'Category A (53)'),(C['chr'],'Category B1 (20)'),(C['bud'],'Category B2 (17)')],title='The 90 Minority Concentration\nDistricts, 2008-09')
save(fig,'map_mcd.png')
# 3 block-file map
bf=json.load(open('blockfile_by_district.json'))
fig,ax=plt.subplots(figsize=(6.4,5.4))
bb=[0,10,50,150,400,10**9]; bc=[C['land'],RAMP[1],RAMP[2],RAMP[3],RAMP[4],RAMP[5]]
def bcol(code):
    v=bf['rows'].get(str(code),0)
    if v==0: return C['land']
    for b,c in zip(bb[1:],bc[1:]):
        if v<=b: return c
drawmap(ax,[bcol(p['censuscode']) for p in props])
legend(ax,[(RAMP[1],'1 to 10'),(RAMP[2],'11 to 50'),(RAMP[3],'51 to 150'),(RAMP[4],'151 to 400'),(RAMP[5],'More than 400'),(C['land'],'Not listed')],title='Entries in the district and\nblock list, by district')
save(fig,'map_blockfile.png')
# 4 community half-population small multiples
COM=[('mus','Muslims',C['focal']),('chr','Christians',C['chr']),('sik','Sikhs',C['sik']),('bud','Buddhists',C['bud']),('jai','Jains',C['jai'])]
half={}
fig,axs=plt.subplots(1,5,figsize=(10,2.9))
for ax,(k,lab,c) in zip(axs,COM):
    vals=[(p.get('n'+k) or 0) for p in props]; tot=sum(vals)
    order=sorted(range(len(vals)),key=lambda i:-vals[i]); acc=0; S=set()
    for i in order:
        if acc>=tot/2: break
        acc+=vals[i]; S.add(i)
    half[k]=len(S)
    drawmap(ax,[c if i in S else C['land'] for i in range(len(props))],lw=0.08)
    ax.set_title(f'{lab}\n{len(S)} districts',fontsize=9,color=C['ink'],fontweight='bold')
save(fig,'map_half_communities.png')
print('half',half)
# 5 state youth unemployment
fig,ax=plt.subplots(figsize=(6.4,5.4))
sb=[10,15,20,25,100]; sc=RAMP[1:]
verts=[];fc=[]
for f,rings in zip(STATES,SP):
    v=f['props'].get('yur')
    for r in rings: verts.append(r); fc.append(C['land'] if v is None else binc(v,sb,sc))
ax.add_collection(PolyCollection(verts,facecolors=fc,edgecolors='white',linewidths=0.4))
ax.set_xlim(proj(68,0)[0],proj(97.5,0)[0]); ax.set_ylim(6.5,37.2); ax.set_aspect('equal'); ax.axis('off')
legend(ax,[(sc[0],'10% or below'),(sc[1],'10% to 15%'),(sc[2],'15% to 20%'),(sc[3],'20% to 25%'),(sc[4],'Above 25%')],title='Youth (15-29) unemployment rate,\n2023-24, all communities')
save(fig,'map_youth_ur.png')
