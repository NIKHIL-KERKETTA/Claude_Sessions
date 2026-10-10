import sys
sys.path.insert(0,'/tmp/claude-0/-home-user-Claude-Sessions/3d2614e1-abc1-5b27-a4fa-97f592767fe6/scratchpad/rep')
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
C=dict(focal='#188CE5',focalD='#0E4778',focalL='#A9D2F5',nat='#A0A0AB',chr='#E0620D',sik='#0E9A80',bud='#7A55C8',jai='#B8860B',ink='#2E2E38',ink2='#4A4A55',rule='#E1E1E6',muted='#747480',soft='#F6F6FA',ey='#FFE600',land='#EEEEF3',num='#1A6FB5')
plt.rcParams.update({'font.family':'Liberation Sans','font.size':9,'text.color':C['ink'],'axes.edgecolor':C['rule'],'xtick.color':C['muted'],'ytick.color':C['ink2']})
def save(fig,n): fig.savefig('fig/'+n,dpi=220,bbox_inches='tight',facecolor='white'); plt.close(fig)
def clean(ax,keep_bottom=True):
    for s in ['top','right','left']: ax.spines[s].set_visible(False)
    ax.spines['bottom'].set_visible(keep_bottom); ax.tick_params(length=0)
def box(ax,x,y,w,h,fc,ec='none',r=0.02):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle=f'round,pad=0,rounding_size={r}',fc=fc,ec=ec,lw=0.8))
# 1 PM VIKAS structure
OLD=[('USTTAD','Training in traditional arts and crafts',0),('Hamari Dharohar','Preserving traditional art forms',0),('Seekho aur Kamao','Skill training for modern-sector jobs',0),('Nai Roshni','Leadership training for minority women',1),('Nai Manzil','Education bridge for school dropouts',2)]
NEW=[('Skilling and training','Traditional (USTTAD, Hamari Dharohar) and\nnon-traditional (Seekho aur Kamao)'),('Women leadership and entrepreneurship','Leadership, enterprise and Biz Sakhi mentors'),('Education','Open schooling for Class 8, 10 and 12 (NIOS)'),('Infrastructure development','Dovetails with PMJVK')]
fig,ax=plt.subplots(figsize=(8,4.2)); ax.set_xlim(0,10); ax.set_ylim(0,5.6); ax.axis('off')
ax.text(0,5.4,'EARLIER SCHEMES OF THE MINISTRY',fontsize=8,color=C['muted'],fontweight='bold')
ax.text(5.6,5.4,'PM VIKAS COMPONENTS',fontsize=8,color=C['muted'],fontweight='bold')
oy=[4.5,3.6,2.7,1.8,0.9]; ny={0:3.6,1:1.8,2:0.9,3:0.0}
for (n,d,t),y in zip(OLD,oy):
    box(ax,0,y,3.6,0.72,C['soft'])
    ax.text(0.15,y+0.47,n,fontsize=9.5,fontweight='bold'); ax.text(0.15,y+0.18,d,fontsize=7.8,color=C['ink2'])
    ty=ny[t]+ (0.75 if t==0 else 0.36)
    if t==0: ty=ny[0]+0.2+ {4.5:1.3,3.6:0.85,2.7:0.4}[y]
    ty = {4.5:4.6,3.6:3.95,2.7:3.3,1.8:2.16,0.9:1.26}[y]
    ax.annotate('',xy=(5.55,ty),xytext=(3.62,y+0.36),arrowprops=dict(arrowstyle='-|>',color=C['focal'],lw=1.1,connectionstyle='arc3,rad=0',shrinkA=0,shrinkB=2))
pos={0:(2.7,2.52),1:(1.8,0.72),2:(0.9,0.72),3:(0.0,0.72)}
for i,(n,d) in enumerate(NEW):
    y,h=pos[i]
    box(ax,5.6,y,4.4,h,'#FFF6A8' if i<3 else C['land'])
    ax.add_patch(plt.Rectangle((5.6,y),0.08,h,color=C['ey'] if i<3 else C['nat']))
    if i==0:
        ax.text(5.8,y+h/2+0.18,n,fontsize=9.5,fontweight='bold'); ax.text(5.8,y+h/2-0.05,d,fontsize=7.8,color=C['ink2'],va='top')
    else:
        ax.text(5.8,y+0.47,n,fontsize=9.5,fontweight='bold'); ax.text(5.8,y+0.18,d,fontsize=7.8,color=C['ink2'])
save(fig,'fig_pmvikas_structure.png')
# 2 timeline
TL=[('2006','Sachar Committee;\n15 Point Programme'),('2007','Ranganath Misra\nCommission'),('2008-09','MsDP starts in\n90 districts'),('2013-14','Planning moves to\nblocks and towns'),('2014','Kundu Committee\nreview'),('2018','PMJVK: 1,300\nareas'),('2025','PM VIKAS')]
fig,ax=plt.subplots(figsize=(8.5,1.9)); ax.set_xlim(-0.5,len(TL)-0.5); ax.set_ylim(-1.6,1); ax.axis('off')
ax.plot([-0.4,len(TL)-0.6],[0,0],color=C['ink'],lw=1.2)
for i,(y,t) in enumerate(TL):
    hi = i in (2,5,6)
    ax.scatter([i],[0],s=110 if hi else 60,color=C['ey'] if hi else 'white',edgecolor=C['ink'],zorder=3,lw=1.2)
    ax.text(i,0.32,y,ha='center',fontsize=10,fontweight='bold')
    ax.text(i,-0.32,t,ha='center',va='top',fontsize=7.8,color=C['ink2'])
save(fig,'fig_timeline.png')
# 3 profile dumbbell
ROWS=[('Literacy, age 7+ (Census 2011)',73.0,[68.5,84.5,75.4,81.3,94.9]),('Literacy, age 7+ (PLFS 2023-24)',80.9,[79.5,88.9,83.4,None,None]),('Graduate level (Census 2011)',11.8,[6.7,16.2,12.8,10.7,43.4]),('Men in labour force, 15+ (2023-24)',78.8,[80.6,76.3,79.2,None,None]),('Women in labour force, 15+ (2023-24)',41.7,[30.2,50.4,33.0,None,None]),('Unemployment rate, 15+ (2023-24)',3.2,[3.2,4.7,5.8,None,None]),('Regular salaried, % of workers (2023-24)',21.7,[18.0,27.6,26.7,None,None])]
COLS=['All-India','Muslim','Christian','Sikh','Buddhist','Jain']
fig,ax=plt.subplots(figsize=(8,3.9)); ax.set_xlim(0,10); ax.set_ylim(0,len(ROWS)+1); ax.axis('off')
x0=3.6; cw=(10-x0)/6
for j,c in enumerate(COLS): ax.text(x0+cw*j+cw/2,len(ROWS)+0.45,c,ha='center',fontsize=8.5,fontweight='bold',color=C['muted'] if j==0 else C['ink'])
import matplotlib.colors as mc
def tint(hexc,a):
    r,g,b=mc.to_rgb(hexc); return (1-(1-r)*a,1-(1-g)*a,1-(1-b)*a)
for i,(lab,nat,vals) in enumerate(ROWS):
    y=len(ROWS)-1-i
    ax.plot([0,10],[y,y],color=C['rule'],lw=0.8)
    ax.text(0,y+0.5,lab,va='center',fontsize=8.2)
    ax.text(x0+cw/2,y+0.5,f'{nat:.1f}%',ha='center',va='center',fontsize=9,color=C['muted'],fontweight='bold')
    for j,v in enumerate(vals):
        cx=x0+cw*(j+1)
        if v is None:
            ax.text(cx+cw/2,y+0.5,'not published',ha='center',va='center',fontsize=7,color='#9A9AA5'); continue
        d=v-nat; a=min(1,0.25+abs(d)/12*0.75)
        col=C['focal'] if d>0 else (C['chr'] if d<0 else C['nat'])
        ax.add_patch(FancyBboxPatch((cx+0.06,y+0.1),cw-0.12,0.8,boxstyle='round,pad=0,rounding_size=0.06',fc=tint(col,a*0.85),ec='none'))
        ax.text(cx+cw/2,y+0.5,f'{v:.1f}%',ha='center',va='center',fontsize=9,fontweight='bold',color='white' if a>0.6 else C['ink'])
from matplotlib.patches import Patch
ax.legend(handles=[Patch(color=C['focal'],label='Above all-India'),Patch(color=C['chr'],label='Below all-India'),Patch(color=C['nat'],label='Equal to all-India')],loc='upper left',bbox_to_anchor=(0,0.0),ncol=3,frameon=False,fontsize=8)
save(fig,'fig_profile.png')
# 4 UDISE
LEV=[('Primary\n(Class 1-5)',17.7),('Upper primary\n(Class 6-8)',15.4),('Secondary\n(Class 9-10)',14.2),('Higher secondary\n(Class 11-12)',12.0),('Higher\neducation',5.0)]
fig,ax=plt.subplots(figsize=(7,3.2))
x=range(len(LEV)); v=[l[1] for l in LEV]
bars=ax.bar(x,v,width=0.56,color=[C['focal']]*3+[C['focalD']]*2,zorder=2)
ax.axhline(14.2,color=C['ink'],lw=1.2,ls=(0,(4,3)),zorder=3); ax.text(4.35,14.6,'Muslim share of population, 14.2%',ha='right',fontsize=8)
for i,val in enumerate(v): ax.text(i,val+0.4,f'{val}%',ha='center',fontsize=10,fontweight='bold')
ax.set_xticks(list(x)); ax.set_xticklabels([l[0] for l in LEV],fontsize=8); ax.set_yticks([]); ax.set_ylim(0,21); clean(ax)
save(fig,'fig_udise.png')
# 5 LFPR
fig,ax=plt.subplots(figsize=(7,3.0))
groups=['All-India','Muslim households','Christian households','Sikh households']
women=[41.7,30.2,50.4,33.0]; men=[78.8,80.6,76.3,79.2]
y=list(range(len(groups)))[::-1]
for yi,w,m in zip(y,women,men):
    ax.plot([w,m],[yi,yi],color=C['rule'],lw=3,zorder=1)
    ax.scatter([w],[yi],s=80,color=C['focal'],zorder=3,edgecolor='white'); ax.scatter([m],[yi],s=80,color=C['ink'],zorder=3,edgecolor='white')
    ax.text(w-2,yi,f'{w}%',ha='right',va='center',fontsize=8.5,color=C['focalD']); ax.text(m+2,yi,f'{m}%',ha='left',va='center',fontsize=8.5)
ax.axvline(41.7,color=C['focal'],lw=1,ls=(0,(3,2)))
ax.set_yticks(y); ax.set_yticklabels(groups,fontsize=8.5); ax.set_xlim(15,95); ax.set_xticks([20,40,60,80]); ax.set_xticklabels(['20%','40%','60%','80%'],fontsize=7.5); clean(ax)
ax.scatter([],[],color=C['focal'],label='Women'); ax.scatter([],[],color=C['ink'],label='Men'); ax.legend(frameon=False,loc='lower right',fontsize=8,ncol=2,bbox_to_anchor=(1,1.0))
save(fig,'fig_lfpr.png')
# 6 access barriers from evaluations
items=[('Unaware of PMJVK facilities\n(DMEO 2021, 8 states)',59),('Said no PMJVK meetings were held\n(DMEO 2021, 8 states)',55),('NMDFC borrowers reporting difficulties\n(2016-17 cohort)',56),('Aware of the 15 Point Programme\n(CMRSD 2016, beneficiaries)',33.1)]
fig,ax=plt.subplots(figsize=(7,2.8)); y=list(range(len(items)))[::-1]
ax.barh(y,[100]*4,color=C['land'],height=0.5,zorder=1)
ax.barh(y,[i[1] for i in items],color=[C['focal'],C['focal'],C['focal'],C['focalD']],height=0.5,zorder=2)
for yi,(l,v) in zip(y,items): ax.text(v+1.5,yi,f'{v:g}%',va='center',fontsize=9,fontweight='bold')
ax.set_yticks(y); ax.set_yticklabels([i[0] for i in items],fontsize=8); ax.set_xticks([]); ax.set_xlim(0,100); clean(ax,False)
save(fig,'fig_access.png')
# 7 skills
fig,ax=plt.subplots(figsize=(7,1.9))
cats=[('Trained men',[80.5,8.2,11.3]),('Trained women',[50.0,8.1,41.9])]
cc=[C['focal'],C['focalL'],C['nat']]; labs=['Employed','Unemployed','Outside the labour force']
for i,(n,vals) in enumerate(cats):
    left=0
    for v,c,l in zip(vals,cc,labs):
        ax.barh(i,v,left=left,color=c,height=0.55,edgecolor='white',lw=2,label=l if i==0 else None)
        if v>6: ax.text(left+v/2,i,f'{v}%',ha='center',va='center',fontsize=8.5,color='white' if c!=C['focalL'] else C['ink'],fontweight='bold')
        left+=v
ax.set_yticks([0,1]); ax.set_yticklabels([c[0] for c in cats]); ax.invert_yaxis(); ax.set_xticks([]); clean(ax,False)
ax.legend(frameon=False,ncol=3,loc='lower left',bbox_to_anchor=(0,1.0),fontsize=8)
save(fig,'fig_skills.png')
# 8 convergence
fig,ax=plt.subplots(figsize=(7,1.6))
for i,(l,v) in enumerate([('Planning',84),('Monitoring and evaluation',16)]):
    ax.barh(i,100,color=C['land'],height=0.5); ax.barh(i,v,color=C['focal'] if i==0 else C['focalD'],height=0.5)
    ax.text(v+1.5,i,f'{v}%',va='center',fontweight='bold',fontsize=9.5)
ax.set_yticks([0,1]); ax.set_yticklabels(['Planning','Monitoring and evaluation']); ax.invert_yaxis(); ax.set_xticks([]); ax.set_xlim(0,100); clean(ax,False)
save(fig,'fig_convergence.png')
# 9 legacy outputs
fig,ax=plt.subplots(figsize=(7,2.0))
it=[('Seekho aur Kamao: trained by March 2022',460000),('Nai Manzil: enrolled',98697),('USTTAD: trained since May 2015',23130)]
y=[2,1,0]
ax.barh(y,[i[1] for i in it],color=[C['focal'],C['focalL'],C['focalL']],height=0.5)
for yi,(l,v) in zip(y,it): ax.text(v+6000,yi,f'{v:,}'.replace('460,000','4.60 lakh'),va='center',fontsize=9,fontweight='bold')
ax.set_yticks(y); ax.set_yticklabels([i[0] for i in it],fontsize=8.5); ax.set_xticks([]); ax.set_xlim(0,560000); clean(ax,False)
save(fig,'fig_legacy.png')
print('ok')
